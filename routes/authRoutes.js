// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

const SALT_ROUNDS = 10;

// 1. API ĐĂNG KÝ (ĐÃ BỎ LƯU SESSION)
router.post('/register', async (req, res) => {
    try {
        const { fullname, email, phone, password } = req.body;

        if (!fullname || !email || !phone || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        // Kiểm tra xem SĐT hoặc Email đã tồn tại chưa
        const existing = await User.findOne({ $or: [{ phone }, { email }] });
        if (existing) {
            return res.status(409).json({ error: 'Số điện thoại hoặc Email này đã được đăng ký.' });
        }

        // Mã hóa mật khẩu
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Tạo tài khoản mới (mặc định role là user)
        const user = await User.create({ 
            fullname, 
            email, 
            phone, 
            passwordHash,
            role: 'user' 
        });

        // ⚠️ BỎ DÒNG req.session.userId Ở ĐÂY 
        // Để sau khi đăng ký xong khách KHÔNG bị tự động đăng nhập!

        res.status(201).json({ 
            success: true, 
            message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.' 
        });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau.' });
    }
});

// 2. API ĐĂNG NHẬP (LƯU SESSION & TRẢ VỀ ROLE ADMIN / USER)
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập số điện thoại và mật khẩu.' });
        }

        // Tìm user theo SĐT hoặc Email
        const user = await User.findOne({ 
            $or: [{ phone: phone }, { email: phone }] 
        });

        if (!user) {
            return res.status(401).json({ error: 'Số điện thoại hoặc mật khẩu không đúng.' });
        }

        // So sánh mật khẩu băm bcrypt
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Số điện thoại hoặc mật khẩu không đúng.' });
        }

        // CHỈ LƯU SESSION TẠI ĐÂY KHI ĐĂNG NHẬP THÀNH CÔNG!
        req.session.userId = user._id;
        req.session.user = {
            id: user._id,
            fullname: user.fullname,
            phone: user.phone,
            email: user.email,
            role: user.role || 'user'
        };

        res.json({ 
            success: true,
            id: user._id, 
            fullname: user.fullname, 
            phone: user.phone,
            role: user.role || 'user' // Trả về role để frontend phân hướng
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau.' });
    }
});

// 3. API ĐĂNG XUẤT
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// 4. API LẤY THÔNG TIN USER HIỆN TẠI (DÙNG ĐỂ RENDER HEADER)
router.get('/me', async (req, res) => {
    if (!req.session.userId) return res.json({ user: null });
    try {
        const user = await User.findById(req.session.userId).select('fullname phone email role');
        res.json({ user });
    } catch (error) {
        res.json({ user: null });
    }
});

module.exports = router;