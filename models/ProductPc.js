// models/ProductPc.js
const mongoose = require('mongoose');

const pcSchema = new mongoose.Schema({
    key: String,
    brand: String,
    name: String,
    price: Number,
    img: String,
    rating: Number,
    socket: String,                     // Chuẩn socket (AM5, LGA1851...)
    ram_type: String,                   // Chuẩn RAM (DDR4, DDR5...)
    form_factor: String,                // Kích thước Mainboard (ATX, mATX...)
    supported_form_factors: [String],   // Các chuẩn main Vỏ Case hỗ trợ
    recommended_psu: Number,            // Công suất nguồn đề nghị cho VGA
    wattage: Number,                    // Công suất nguồn PSU
    supported_sockets: [String],        // Socket tản nhiệt hỗ trợ
    specs: Object
}, { timestamps: true });

// Model 'ProductsPc' -> gắn với collection 'products_pc' (PC dựng sẵn, bán nguyên bộ)
module.exports = mongoose.model('ProductsPc', pcSchema, 'products_pc');
