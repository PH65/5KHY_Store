// routes/productRoutes.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const Products = require('../models/Product');
const ProductsTablet = require('../models/ProductTablet');
const ProductsPc = require('../models/ProductPc');
const PcPart = require('../models/PcPart');
const Review = require('../models/Review');

const DESCRIPTIONS_DIR = path.join(__dirname, '..', 'data', 'descriptions');

// HÀM HELPER ĐỊNH DẠNG GIÁ TIỀN VÀNG (36590000 -> 36.590.000đ)
function formatVND(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return 'Liên hệ';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
}

// HÀM HELPER TỰ ĐỘNG THÊM CẢ GIÁ SỐ LẪN GIÁ ĐÃ FORMAT CHO CHUẨN FRONTEND
function processProductPrices(product) {
    let mainPrice = product.price;

    // Nếu sản phẩm không có price trực tiếp mà có trong mảng variants
    if ((!mainPrice || isNaN(mainPrice)) && product.variants && product.variants.length > 0) {
        mainPrice = product.variants[0].price;
    }

    return {
        ...product,
        price: mainPrice || 0,
        formattedPrice: formatVND(mainPrice) // Trường giá có dấu chấm và đ
    };
}

// ---------- 1. ĐIỆN THOẠI ----------

// Danh sách điện thoại
router.get('/products', async (req, res) => {
    try {
        const data = await Products.find({}).lean();

        const updatedData = data.map(product => {
            // Tự động tính rating từ mảng reviews
            const reviews = product.reviews || [];
            if (reviews.length > 0) {
                const sumStars = reviews.reduce((sum, r) => sum + r.stars, 0);
                product.rating = Number((sumStars / reviews.length).toFixed(1));
            } else {
                product.rating = product.rating || 0;
            }

            // Định dạng giá tiền
            return processProductPrices(product);
        });

        res.json(updatedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chi tiết 1 điện thoại theo ID
router.get('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        let product = await Products.findById(productId).lean();

        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm trong hệ thống MongoDB!" });
        }

        // Đọc file mô tả HTML
        const filePath = path.join(DESCRIPTIONS_DIR, `${productId}.html`);
        if (fs.existsSync(filePath)) {
            product.desc = fs.readFileSync(filePath, 'utf-8');
        } else {
            product.desc = product.desc || "Mô tả của sản phẩm này hiện đang được cập nhật.";
        }

        res.json(processProductPrices(product));
    } catch (error) {
        console.error("Lỗi Server:", error);
        res.status(500).json({ error: "Lỗi kết nối hệ thống server hoặc ID không đúng định dạng Mongoose!" });
    }
});

// ---------- 2. MÁY TÍNH BẢNG ----------

router.get('/tablets', async (req, res) => {
    try {
        const data = await ProductsTablet.find({}).lean();
        const formattedData = data.map(t => processProductPrices(t));
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/tablets/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        let tablet = await ProductsTablet.findById(productId).lean();
        if (!tablet) return res.status(404).json({ message: "Không tìm thấy máy tính bảng!" });

        const filePath = path.join(DESCRIPTIONS_DIR, `${productId}.html`);
        if (fs.existsSync(filePath)) {
            tablet.desc = fs.readFileSync(filePath, 'utf-8');
        } else {
            tablet.desc = tablet.desc || "Mô tả của sản phẩm này hiện đang được cập nhật.";
        }

        res.json(processProductPrices(tablet));
    } catch (error) {
        res.status(500).json({ error: "Lỗi kết nối hệ thống server hoặc ID không đúng định dạng Mongoose!" });
    }
});

// ---------- 3. PC ----------

router.get('/pcs', async (req, res) => {
    try {
        const data = await ProductsPc.find({}).lean();
        const formattedData = data.map(p => processProductPrices(p));
        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/pcs/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        let pc = await ProductsPc.findById(productId).lean();
        if (!pc) return res.status(404).json({ message: "Không tìm thấy PC!" });

        const filePath = path.join(DESCRIPTIONS_DIR, `${productId}.html`);
        if (fs.existsSync(filePath)) {
            pc.desc = fs.readFileSync(filePath, 'utf-8');
        } else {
            pc.desc = pc.desc || "Mô tả cấu hình PC hiện đang được cập nhật.";
        }

        res.json(processProductPrices(pc));
    } catch (error) {
        res.status(500).json({ error: "Lỗi kết nối hệ thống server hoặc ID không đúng định dạng Mongoose!" });
    }
});

// ---------- 4. LINH KIỆN PC ----------

router.get('/pc-parts', async (req, res) => {
    try {
        const parts = await PcPart.find({}).lean();
        const formattedParts = parts.map(p => processProductPrices(p));
        res.json(formattedParts);
    } catch (error) {
        console.error("Lỗi Query linh kiện PC:", error);
        res.status(500).json({ error: 'Lỗi lấy dữ liệu linh kiện PC từ hệ thống' });
    }
});

// ---------- 5. ĐÁNH GIÁ & BÌNH LUẬN (REVIEWS) ----------

// Post review mới
router.post('/products/review', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Bạn cần đăng nhập để thực hiện đánh giá!' });
        }

        const { productId, productType, stars, comment } = req.body;
        const User = require('../models/User');
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy thông tin người dùng!' });
        }

        const modelMap = {
            'phone': 'Products',
            'tablet': 'ProductsTablet',
            'pc': 'ProductsPc'
        };

        const newReview = new Review({
            productId,
            productType,
            productTypeModel: modelMap[productType] || 'Products',
            userName: user.fullname,
            userPhone: user.phone || 'N/A',
            stars: Number(stars),
            comment
        });

        await newReview.save();
        res.json({ message: 'Lưu đánh giá thành công!' });
    } catch (error) {
        console.error("Lỗi lưu review:", error);
        res.status(500).json({ error: 'Không thể lưu đánh giá!' });
    }
});

// Lấy danh sách review
router.get('/reviews/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).lean();

        let avgRating = 0;
        if (reviews.length > 0) {
            const sum = reviews.reduce((acc, r) => acc + r.stars, 0);
            avgRating = (sum / reviews.length).toFixed(1);
        }

        res.json({
            avgRating: Number(avgRating),
            totalReviews: reviews.length,
            reviews
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ---------- 6. TÌM KIẾM TỰ ĐỘNG (LIVE SEARCH) ----------

router.get('/search', async (req, res) => {
    try {
        const query = req.query.q ? req.query.q.trim() : '';
        if (!query) return res.json([]);

        const regex = new RegExp(query, 'i');

        const [phones, tablets, pcs] = await Promise.all([
            Products.find({ name: regex }).lean(),
            ProductsTablet.find({ name: regex }).lean(),
            ProductsPc.find({ name: regex }).lean()
        ]);

        const formattedPhones = phones.map(p => processProductPrices({ ...p, productType: 'phone' }));
        const formattedTablets = tablets.map(p => processProductPrices({ ...p, productType: 'tablet' }));
        const formattedPcs = pcs.map(p => processProductPrices({ ...p, productType: 'pc' }));

        res.json([...formattedPhones, ...formattedTablets, ...formattedPcs]);
    } catch (error) {
        console.error("Lỗi Live Search:", error);
        res.status(500).json({ error: 'Lỗi tìm kiếm!' });
    }
});

// XUẤT ROUTER VỀ CUỐI FILE CỰC CHUẨN
module.exports = router;