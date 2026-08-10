// routes/pageRoutes.js
const express = require('express');
const router = express.Router();

// Hỗ trợ truy cập cả đường dẫn dạng /chitiet và /chitiet.html
router.get(['/', '/index', '/index.html'], (req, res) => res.render('trangchu', { active: 'trangchu' }));
router.get(['/dienthoai', '/dienthoai.html'], (req, res) => res.render('dienthoai', { active: 'dienthoai' }));
router.get(['/maytinhbang', '/maytinhbang.html'], (req, res) => res.render('maytinhbang', { active: 'maytinhbang' }));
router.get(['/pc', '/pc.html'], (req, res) => res.render('pc', { active: 'pc' }));
router.get(['/chitiet', '/chitiet.html'], (req, res) => res.render('chitiet', { active: 'dienthoai' }));
router.get(['/xaydungcauhinh', '/xaydungcauhinh.html'], (req, res) => res.render('xaydungcauhinh', { active: 'xaydungcauhinh' }));
router.get(['/baogia-in', '/baogia-in.html'], (req, res) => res.render('baogia-in'));
router.get(['/giohang', '/giohang.html'], (req, res) => res.render('giohang', { active: '' }));
router.get(['/dathang', '/dathang.html'], (req, res) => res.render('dathang', { active: '' }));
router.get(['/thanhtoan', '/thanhtoan.html'], (req, res) => res.render('thanhtoan', { active: '' }));
router.get(['/dangnhap', '/dangnhap.html'], (req, res) => res.render('dangnhap', { active: '' }));
router.get(['/dangky', '/dangky.html'], (req, res) => res.render('dangky', { active: '' }));
router.get('/mock-pay', (req, res) => { res.render('mock-pay'); });

// Thêm route cho trang tìm kiếm
router.get(['/timkiem', '/timkiem.html'], (req, res) => {
    // Lấy từ khóa từ thanh URL (biến 'q' từ form tìm kiếm)
    const keyword = req.query.q || ''; 
    res.render('timkiem', { active: '', keyword: keyword });
});

// Chuyển luôn route xác nhận từ file server.js sang đây cho chuẩn cấu trúc
router.get(['/xacnhan', '/xacnhan.html'], (req, res) => res.render('xacnhan', { active: '' }));
// Route hiển thị trang giả lập thanh toán trên điện thoại
router.get('/mock-pay', (req, res) => {
    res.render('mock-pay');
});

module.exports = router;