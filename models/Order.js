// models/Order.js (Giữ nguyên cấu trúc hiện tại của bạn)
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: String,
    productType: { type: String, enum: ['phone', 'tablet', 'pc', 'pc-part'], default: 'phone' },
    name: String,
    img: String,
    price: Number,
    variant: String,
    color: String,
    qty: Number
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderCode: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cartId: { type: String, default: '' },
    items: [orderItemSchema],
    shipping: {
        fullname: String,
        email: String,
        phone: String,
        address: String,
        ward: String,
        city: String,
        note: String
    },
    paymentMethod: { type: String, enum: ['transfer', 'cod'], default: 'transfer' },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    orderDate: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema, 'orders');