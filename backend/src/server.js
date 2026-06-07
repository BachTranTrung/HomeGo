require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const connectDB = require('./config/db');
const routes    = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 5000;

// Kết nối MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({
  status: 'OK',
  message: 'HomeGo API đang chạy!',
  database: 'MongoDB',
  time: new Date().toISOString(),
}));

// 404
app.use((req, res) => res.status(404).json({ message: `Endpoint ${req.method} ${req.path} không tồn tại` }));

// Error handler
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 HomeGo Backend đang chạy: http://localhost:${PORT}`);
  console.log(`📖 Health check:             http://localhost:${PORT}/health`);
});
