/**
 * Routes Báo cáo & Thống kê Hiệu suất (Report & Analytics Routes)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const {
    validateAnalyticsMiddleware,
    validateFilterReportsMiddleware,
    validateExportReportMiddleware
} = require('../validators/reportValidator');
const { verifyJWT } = require('../middleware/authMiddleware');

/**
 * 1. GET /api/reports/analytics
 * Thống kê hiệu suất: tần suất sử dụng phòng, tỷ lệ lấp đầy %, tỷ lệ cuộc họp bị hủy
 */
router.get('/reports/analytics', verifyJWT, validateAnalyticsMiddleware, reportController.getAnalytics);

/**
 * 2. GET /api/reports/filter
 * Lọc báo cáo theo khoảng thời gian tùy chọn (ngày/tháng) và phòng ban
 */
router.get('/reports/filter', verifyJWT, validateFilterReportsMiddleware, reportController.filterReports);

/**
 * 3. GET /api/reports/export
 * Kết xuất dữ liệu thống kê báo cáo ra định dạng file Excel / CSV UTF-8
 */
router.get('/reports/export', verifyJWT, validateExportReportMiddleware, reportController.exportReport);

module.exports = router;
