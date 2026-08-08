// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');

// Tạo đơn hàng từ các sản phẩm đã chọn trong giỏ hàng
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

// Lấy thông tin đơn hàng theo orderCode + Format giờ Việt Nam
router.get('/:orderCode', async (req, res) => {
    try {
        const order = await Order.findOne({ orderCode: req.params.orderCode }).lean();
        if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

        // 🛠️ SỬA CHỖ NÀY: Định dạng thời gian sang chuẩn Giờ Việt Nam (GMT+7)
        const formattedCreatedAt = order.createdAt 
            ? new Date(order.createdAt).toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour12: false
              })
            : '';

        res.json({
            ...order,
            createdAtFormatted: formattedCreatedAt // Trả thêm trường giờ VN này về cho Frontend hiển thị
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Xác nhận đã thanh toán -> cập nhật trạng thái + dọn các sản phẩm tương ứng khỏi giỏ hàng
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