// config/db.js
const mongoose = require('mongoose');

async function connectDB() {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/E-commerce_technology_website';
    try {
        await mongoose.connect(mongoURI);
        console.log('Đã kết nối thành công tới MongoDB:', mongoose.connection.name);
    } catch (err) {
        console.error('❌ Lỗi kết nối MongoDB:', err.message);
        process.exit(1);
    }
}

module.exports = connectDB;
