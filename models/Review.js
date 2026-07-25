// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'productTypeModel' // Liên kết linh hoạt tới đúng Collection (products, products_tablet, products_pc)
    },
    productType: {
        type: String,
        required: true,
        enum: ['phone', 'tablet', 'pc']
    },
    productTypeModel: {
        type: String,
        required: true,
        enum: ['Products', 'ProductsTablet', 'ProductsPc']
    },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema, 'reviews');