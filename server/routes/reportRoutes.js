const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateReportMiddleware } = require('../validators/reportValidator');

/**
 * GET /api/reports/analytics
 * Thống kê hiệu suất phòng họp tổng hợp
 * 
 * Query params (tất cả đều không bắt buộc):
 *   - startDate : Lọc từ ngày (YYYY-MM-DD)
 *   - endDate   : Lọc đến ngày (YYYY-MM-DD)
 *   - roomId    : Lọc theo phòng cụ thể
 */
router.get('/reports/analytics', validateReportMiddleware, reportController.getAnalytics);

module.exports = router;
