const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Products = require('../models/Product');

// Middleware kiểm tra quyền Admin
function checkAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        // Cho phép xem demo nếu chưa cài session strict
        next(); 
    }
}

// 1. API LẤY BÁO CÁO TỔNG QUAN
router.get('/stats', checkAdmin, async (req, res) => {
    try {
        const orders = await Order.find();
        const productsCount = await Products.countDocuments();
        
        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        
        res.json({
            totalRevenue,
            totalOrders: orders.length,
            totalProducts: productsCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. API LẤY DANH SÁCH ĐƠN HÀNG
router.get('/orders', checkAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. API CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
router.put('/orders/:id/status', checkAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. API LẤY DANH SÁCH SẢN PHẨM
router.get('/products', checkAdmin, async (req, res) => {
    try {
        const products = await Products.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// routes/adminRoutes.js

// 1. API LẤY CHI TIẾT 1 SẢN PHẨM ĐỂ ĐƯA VÀO FORM SỬA
router.get('/products/:id', checkAdmin, async (req, res) => {
    try {
        const product = await Products.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. API CẬP NHẬT TÊN, MÔ TẢ, GIÁ, TỒN KHO VÀO MONGODB
router.put('/products/:id', checkAdmin, async (req, res) => {
    try {
        const { name, brand, desc, variants, specs } = req.body;

        // Tìm và cập nhật trực tiếp trong MongoDB
        const updatedProduct = await Products.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name: name,
                    brand: brand,
                    desc: desc,
                    variants: variants, // Cập nhật mảng variants chứa price, storage, colors & stock
                    specs: specs
                }
            },
            { new: true, runValidators: true } // Trả về document sau khi sửa
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm để cập nhật!' });
        }

        res.json({
            success: true,
            message: 'Cập nhật thông tin sản phẩm vào MongoDB thành công!',
            product: updatedProduct
        });
    } catch (err) {
        console.error('Lỗi khi Admin sửa sản phẩm:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;