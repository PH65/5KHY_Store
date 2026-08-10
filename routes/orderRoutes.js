// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');

// ==========================================
// 1. TẠO ĐƠN HÀNG (Đoạn này đã bị xóa nhầm và được khôi phục)
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { cartId, shipping, paymentMethod } = req.body;
        if (!cartId) return res.status(400).json({ error: 'Thiếu cartId.' });

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
            shipping,
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
// 2. API WEBHOOK GIẢ LẬP (Đã thêm)
// ==========================================
router.post('/webhook', async (req, res) => {
    try {
        // Ngân hàng sẽ gửi data qua req.body (Payload)
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
// 4. XÁC NHẬN THANH TOÁN (Trực tiếp)
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