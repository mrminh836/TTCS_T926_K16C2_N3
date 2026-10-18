const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const meetingRoutes = require('./routes/meetingRoutes');
const roomRoutes = require('./routes/roomRoutes');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const clientPath = path.resolve(__dirname, '../client');
app.use(express.static(clientPath));
app.use('/client', express.static(clientPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', meetingRoutes);
app.use('/api', roomRoutes);
app.use('/api', healthRoutes);
app.use('/api', userRoutes);
app.use('/api', equipmentRoutes);
app.use('/api', reportRoutes);

// Hỗ trợ trực tiếp các đường dẫn song song với /api/...
app.use('/auth', authRoutes);
app.use('/', roomRoutes);
app.use('/', userRoutes);
app.use('/', equipmentRoutes);
app.use('/', reportRoutes);

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Xử lý Route 404 (Không tìm thấy endpoint)
app.use(notFoundHandler);

// Middleware xử lý lỗi toàn cục (Global Error Handler)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});