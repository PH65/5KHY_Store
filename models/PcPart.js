const mongoose = require('mongoose');

const pcPartSchema = new mongoose.Schema({
    key: { type: String, required: true },     // cpu, mainboard, ram, vga, psu...
    brand: { type: String, required: true },   // ASUS, MSI, Intel, AMD...
    name: { type: String, required: true },    // Tên linh kiện
    price: { type: Number, required: true },   // Giá bán (Number)
    img: { type: String, default: "" },        // Link ảnh
    specs: { type: Map, of: String }           // Cấu hình kỹ thuật động
}, {
    collection: 'pc_parts', // Đặt chính xác Collection pc_parts riêng biệt
    timestamps: true
});

const PcPart = mongoose.model('PcPart', pcPartSchema);
module.exports = PcPart;