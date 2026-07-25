// models/CartItem.js
const mongoose = require('mongoose');

// Mỗi trình duyệt (khách chưa đăng nhập) được cấp 1 cartId lưu trong localStorage.
// Khi đăng nhập, cartId vẫn giữ nguyên nên giỏ hàng ẩn danh trước đó không bị mất.
const cartItemSchema = new mongoose.Schema({
    cartId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    productType: { type: String, enum: ['phone', 'tablet', 'pc', 'pc-part'], default: 'phone' },
    name: String,
    img: String,
    price: Number,
    variant: { type: String, default: '' },
    color: { type: String, default: '' },
    qty: { type: Number, default: 1, min: 1 },
    selected: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CartItem', cartItemSchema, 'cart_items');
