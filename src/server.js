require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const db = require('./db');

// Import routes
const usersRouter = require('./routes/users');
const meetingsRouter = require('./routes/meetings');
const equipmentsRouter = require('./routes/equipments');
const bookingsRouter = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 3000;

// ────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Meeting Room Booking API',
    version: '1.0.0',
    endpoints: {
      users: 'GET /api/users?search=&departmentId=&limit=',
      meetings: {
        participants: 'GET /api/meetings/:meetingId/participants',
        addParticipants: 'POST /api/meetings/:meetingId/participants',
        updateStatus: 'PATCH /api/meetings/:meetingId/participants/:userId/status'
      },
      equipments: {
        list: 'GET /api/equipments?search=&status=&page=&limit=',
        available: 'GET /api/equipments/available?date=&startTime=&endTime=',
        detail: 'GET /api/equipments/:id',
        create: 'POST /api/equipments',
        update: 'PUT /api/equipments/:id',
        updateStatus: 'PATCH /api/equipments/:id/status',
        delete: 'DELETE /api/equipments/:id'
      },
      bookings: {
        list: 'GET /api/bookings?roomId=&date=&status=&page=&limit=',
        detail: 'GET /api/bookings/:id',
        create: 'POST /api/bookings',
        cancel: 'PATCH /api/bookings/:id/cancel'
      }
    }
  });
});

app.use('/api/users', usersRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/equipments', equipmentsRouter);
app.use('/api/bookings', bookingsRouter);

// ────────────────────────────────────────────────────────────
// 404 Handler
// ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} không tồn tại`
  });
});

// ────────────────────────────────────────────────────────────
// Global Error Handler
// ────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Global Error]', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// ────────────────────────────────────────────────────────────
// Start Server
// ────────────────────────────────────────────────────────────
async function startServer() {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('✅ Kết nối MySQL thành công');

    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
      console.log(`📋 API docs tại http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('❌ Không thể kết nối MySQL:', error.message);
    console.error('   Hãy kiểm tra file .env và đảm bảo MySQL đang chạy');
    process.exit(1);
  }
}

startServer();
