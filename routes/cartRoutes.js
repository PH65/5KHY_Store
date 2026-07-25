// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const CartItem = require('../models/CartItem');

router.get('/:cartId', async (req, res) => {
    try {
        const items = await CartItem.find({ cartId: req.params.cartId }).sort({ createdAt: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { cartId, productId, productType, name, img, price, variant, color, qty } = req.body;

        if (!cartId || !productId) {
            return res.status(400).json({ error: "Thiếu cartId hoặc productId" });
        }

        let item = await CartItem.findOne({
            cartId, productId,
            variant: variant || '',
            color: color || ''
        });

        if (item) {
            item.qty += qty || 1;
            await item.save();
        } else {
            item = await CartItem.create({
                cartId, productId,
                productType: productType || 'phone',
                name, img, price,
                variant: variant || '',
                color: color || '',
                qty: qty || 1
            });
        }

        res.status(201).json(item);
    } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/:itemId', async (req, res) => {
    try {
        const update = {};
        if (req.body.qty !== undefined) update.qty = req.body.qty;
        if (req.body.selected !== undefined) update.selected = req.body.selected;

        const item = await CartItem.findByIdAndUpdate(req.params.itemId, update, { new: true });
        if (!item) return res.status(404).json({ error: "Không tìm thấy sản phẩm trong giỏ hàng" });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Xoá toàn bộ giỏ hàng (đặt TRƯỚC route /:itemId để không bị nhầm "clear" là 1 ID)
router.delete('/clear/:cartId', async (req, res) => {
    try {
        await CartItem.deleteMany({ cartId: req.params.cartId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:itemId', async (req, res) => {
    try {
        await CartItem.findByIdAndDelete(req.params.itemId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
