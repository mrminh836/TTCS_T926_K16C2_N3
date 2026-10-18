/**
 * Routes Báo cáo & Thống kê Hiệu suất (Report & Analytics Routes)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateAnalyticsMiddleware } = require('../validators/reportValidator');
const { verifyJWT } = require('../middleware/authMiddleware');

/**
 * GET /api/reports/analytics
 * Thống kê hiệu suất: tần suất sử dụng phòng, tỷ lệ lấp đầy %, tỷ lệ cuộc họp bị hủy
 * Yêu cầu: Xác thực đăng nhập Bearer Token (verifyJWT)
 */
router.get('/reports/analytics', verifyJWT, validateAnalyticsMiddleware, reportController.getAnalytics);

module.exports = router;
