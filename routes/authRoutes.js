// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

const SALT_ROUNDS = 10;

// Các biểu thức Regex kiểm tra định dạng
const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_NUMBER_REGEX = /\d/;

// 1. API ĐĂNG KÝ
router.post('/register', async (req, res) => {
    try {
        let { fullname, email, phone, password } = req.body;

        // Cắt bỏ khoảng trắng thừa
        fullname = fullname ? fullname.trim() : '';
        email = email ? email.trim() : '';
        phone = phone ? phone.trim() : '';

        // Kiểm tra bắt buộc nhập
        if (!fullname || !email || !phone || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin.' });
        }

        // Kiểm tra Họ và Tên: Không được chứa chữ số
        if (HAS_NUMBER_REGEX.test(fullname)) {
            return res.status(400).json({ error: 'Họ và tên không được chứa chữ số.' });
        }

        // Kiểm tra định dạng Email
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'Địa chỉ email không hợp lệ.' });
        }

        // Kiểm tra định dạng Số điện thoại: 10 số, bắt đầu bằng số 0
        if (!PHONE_REGEX.test(phone)) {
            return res.status(400).json({ error: 'Số điện thoại không hợp lệ!' });
        }

        // Kiểm tra độ dài mật khẩu
        if (password.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        // Kiểm tra xem SĐT hoặc Email đã tồn tại chưa
        // 1. Kiểm tra Số điện thoại đã tồn tại chưa
        const existingPhone = await User.findOne({ phone: phone });
        if (existingPhone) {
            return res.status(409).json({ error: 'Số điện thoại này đã được đăng ký.' });
        }

        // 2. Kiểm tra Email đã tồn tại chưa
        const existingEmail = await User.findOne({ email: email });
        if (existingEmail) {
            return res.status(409).json({ error: 'Email này đã được đăng ký.' });
        }

        // Mã hóa mật khẩu
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Tạo tài khoản mới
        await User.create({ 
            fullname, 
            email, 
            phone, 
            passwordHash,
            role: 'user' 
        });

        res.status(201).json({ 
            success: true, 
            message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.' 
        });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau.' });
    }
});

// 2. API ĐĂNG NHẬP
router.post('/login', async (req, res) => {
    try {
        let { phone, password } = req.body;

        phone = phone ? phone.trim() : '';

        if (!phone || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu.' });
        }

        // Kiểm tra định dạng: Bắt buộc phải là Email hoặc SĐT 10 số
        const isPhone = PHONE_REGEX.test(phone);
        const isEmail = EMAIL_REGEX.test(phone);

        if (!isPhone && !isEmail) {
            return res.status(400).json({ error: 'Tên đăng nhập phải là Email hoặc Số điện thoại.' });
        }

        // Tìm user theo SĐT hoặc Email
        const user = await User.findOne({ 
            $or: [{ phone: phone }, { email: phone }] 
        });

        if (!user) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
        }

        // So sánh mật khẩu băm bcrypt
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
        }

        // Lưu session khi đăng nhập thành công
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
            role: user.role || 'user'
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

// 4. API LẤY THÔNG TIN USER HIỆN TẠI
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