// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');

const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_NUMBER_REGEX = /\d/;

// ==========================================
// 1. TẠO ĐƠN HÀNG (CÓ VALIDATE DỮ LIỆU GIAO HÀNG)
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { cartId, shipping, paymentMethod } = req.body;
        if (!cartId) return res.status(400).json({ error: 'Thiếu cartId.' });

        if (!shipping) {
            return res.status(400).json({ error: 'Vui lòng cung cấp thông tin giao hàng.' });
        }

        const fullname = shipping.fullname ? shipping.fullname.trim() : '';
        const phone = shipping.phone ? shipping.phone.trim() : '';
        const email = shipping.email ? shipping.email.trim() : '';
        const address = shipping.address ? shipping.address.trim() : '';
        const city = shipping.city || '';
        const ward = shipping.ward || '';

        // 1. Validate bắt buộc
        if (!fullname || !phone || !address || !city || !ward) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ các trường thông tin giao hàng bắt buộc.' });
        }

        // 2. Validate Họ tên không chứa số
        if (HAS_NUMBER_REGEX.test(fullname)) {
            return res.status(400).json({ error: 'Họ và tên người nhận không được chứa chữ số.' });
        }

        // 3. Validate Số điện thoại 10 số, đầu 0
        if (!PHONE_REGEX.test(phone)) {
            return res.status(400).json({ error: 'Số điện thoại không hợp lệ!' });
        }

        // 4. Validate Email nếu có nhập
        if (email && !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'Địa chỉ email không đúng định dạng.' });
        }

        const selectedItems = await CartItem.find({ cartId, selected: true });
        if (selectedItems.length === 0) {
            return res.status(400).json({ error: 'Không có sản phẩm nào được chọn để đặt hàng.' });
        }

        const items = selectedItems.map(i => ({
            productId: i.productId,
            productType: i.productType,
            name: i.name,
            img: i.img,
            price: i.price,
            variant: i.variant,
            color: i.color,
            qty: i.qty
        }));

        const totalAmount = items.reduce((sum, i) => sum + i.price * i.qty, 0);
        
        const orderCode = 'DH' + Date.now().toString().slice(-10);
        const nowVN = new Date().toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false
        });

        // Tạo đơn hàng
        const order = await Order.create({
            orderCode,
            userId: (req.session && req.session.userId) ? req.session.userId : null,
            cartId,
            items,
            shipping: {
                fullname,
                email,
                phone,
                address,
                city,
                ward,
                note: shipping.note ? shipping.note.trim() : ''
            },
            paymentMethod: paymentMethod || 'transfer',
            totalAmount,
            status: 'pending',
            orderDate: nowVN
        });

        await CartItem.deleteMany({
            cartId: cartId,
            selected: true
        });

        res.status(201).json(order);
    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. API WEBHOOK GIẢ LẬP
// ==========================================
router.post('/webhook', async (req, res) => {
    try {
        const { orderCode, transactionStatus, amount, bankCode } = req.body;

        console.log('--- NHẬN WEBHOOK TỪ NGÂN HÀNG ---');
        console.log('Mã đơn:', orderCode, '| Trạng thái giao dịch:', transactionStatus);

        if (transactionStatus === '00') {
            const order = await Order.findOneAndUpdate(
                { orderCode: orderCode },
                { 
                    status: 'paid',
                    paymentMethod: bankCode || 'Chuyển khoản mã QR'
                },
                { returnDocument: 'after' }
            );

            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng trong hệ thống' });
            }

            if (order.cartId) {
                await Promise.all(order.items.map(i =>
                    CartItem.deleteOne({
                        cartId: order.cartId,
                        productId: i.productId,
                        variant: i.variant || '',
                        color: i.color || ''
                    })
                ));
            }

            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            return res.status(200).json({ RspCode: '01', Message: 'Transaction Failed' });
        }

    } catch (error) {
        console.error('Lỗi khi xử lý Webhook:', error);
        res.status(500).json({ RspCode: '99', Message: 'Unknown error' });
    }
});

// ==========================================
// 3. LẤY THÔNG TIN ĐƠN HÀNG
// ==========================================
router.get('/:orderCode', async (req, res) => {
    try {
        const order = await Order.findOne({ orderCode: req.params.orderCode }).lean();
        if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

        const formattedCreatedAt = order.createdAt 
            ? new Date(order.createdAt).toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour12: false
              })
            : '';

        res.json({
            ...order,
            createdAtFormatted: formattedCreatedAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 4. XÁC NHẬN THANH TOÁN
// ==========================================
router.put('/:orderCode/confirm', async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { orderCode: req.params.orderCode },
            { status: 'paid' },
            { returnDocument: 'after' }
        );
        if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

        if (order.cartId) {
            await Promise.all(order.items.map(i =>
                CartItem.deleteOne({
                    cartId: order.cartId,
                    productId: i.productId,
                    variant: i.variant || '',
                    color: i.color || ''
                })
            ));
        }

        res.json(order);
    } catch (error) {
        console.error('Lỗi khi xác nhận thanh toán:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;