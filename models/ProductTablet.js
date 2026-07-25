const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    img: { type: String, default: "" },
    stock: { type: Number, default: 0 }
}, { _id: false });

const variantSchema = new mongoose.Schema({
    storage: { type: String, required: true },
    price: { type: Number, required: true },
    colors: [colorSchema]
}, { _id: false });

const tabletSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: String,
    img: String,
    rating: { type: Number, default: 0 },
    gallery: [String],
    variants: [variantSchema]
}, { timestamps: true });

module.exports = mongoose.model('ProductsTablet', tabletSchema, 'products_tablet');