const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const meetingRoutes = require('./routes/meetingRoutes');
const roomRoutes = require('./routes/roomRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', meetingRoutes);
app.use('/api', roomRoutes);
app.use('/api', healthRoutes);

// Xử lý Route 404 (Không tìm thấy endpoint)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Tuyến đường không tồn tại: ${req.method} ${req.originalUrl}`
    });
});

// Middleware xử lý lỗi toàn cục (Global Error Handler)
app.use((err, req, res, next) => {
    console.error('Lỗi máy chủ:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi server nội bộ.'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});