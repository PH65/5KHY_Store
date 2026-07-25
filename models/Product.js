const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    author: String,
    stars: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const colorSchema = new mongoose.Schema({
    name: { type: String, required: true },  // Ví dụ: "Tím", "Đen", "Trắng"
    img: { type: String, default: "" },       // Đường dẫn ảnh theo màu
    stock: { type: Number, default: 0 }       // Số lượng tồn kho của MÀU này
}, { _id: false });

const variantSchema = new mongoose.Schema({
    storage: { type: String, required: true }, // Ví dụ: "256GB", "512GB"
    price: { type: Number, required: true },   // Giá dạng số để dễ tính toán
    colors: [colorSchema]                       // Danh sách các màu thuộc bản 256GB/512GB
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: String,
    img: String,
    rating: { type: Number, default: 0 },
    gallery: [String],
    variants: [variantSchema],
    reviews: [reviewSchema]
}, { timestamps: true });

module.exports = mongoose.model('Products', productSchema, 'products');