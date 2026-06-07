const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homego_db');
    console.log(`✅ MongoDB kết nối thành công: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
    console.error('👉 Hãy chắc chắn MongoDB đang chạy hoặc URI trong .env đúng.');
    process.exit(1);
  }
};

module.exports = connectDB;
