// server.js - Điểm khởi động chính của ứng dụng
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const User = require('./models/User');

const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const pageRoutes = require('./routes/pageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/E-commerce_technology_website';
const adminRoutes = require('./routes/adminRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/admin', adminRoutes);


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Phục vụ file tĩnh: CSS, JS, ảnh sản phẩm
app.use(express.static(path.join(__dirname, 'public')));

// Phiên đăng nhập - lưu trong chính MongoDB (không mất khi restart server)
app.use(session({
    secret: process.env.SESSION_SECRET || 'doi-chuoi-bi-mat-nay-truoc-khi-deploy',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI, collectionName: 'sessions' }),
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        httpOnly: true
    }
}));

// Nạp sẵn thông tin người dùng đang đăng nhập (nếu có) cho MỌI view dùng chung header
app.use(async (req, res, next) => {
    res.locals.currentUser = null;
    if (req.session.userId) {
        try {
            res.locals.currentUser = await User.findById(req.session.userId).select('fullname phone');
        } catch (err) {
            res.locals.currentUser = null;
        }
    }
    next();
});

app.get('/admin', (req, res) => {
    res.render('admin');
});

connectDB().then(() => {

    app.use('/', pageRoutes);

    app.use('/api', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/orders', orderRoutes);

    // 404 - không khớp route nào ở trên
    app.use((req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: `Không tìm thấy API endpoint: ${req.method} ${req.originalUrl}` });
        }
        res.status(404).send(`<h1>404 - Không tìm thấy trang</h1><p>Đường dẫn: <code>${req.originalUrl}</code></p><p><a href="/index.html">Quay về trang chủ</a></p>`);
    });

    // Xử lý lỗi hệ thống chung
    app.use((err, req, res, next) => {
        console.error('Lỗi hệ thống:', err);
        if (req.path.startsWith('/api/')) {
            return res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau.' });
        }
        res.status(500).send('<h1>500 - Lỗi hệ thống</h1><p>Vui lòng thử lại sau.</p>');
    });

    app.listen(PORT, () => {
        console.log(`Server đang chạy tại: http://localhost:${PORT}`);
    });
});
