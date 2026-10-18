const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateReportFilterMiddleware } = require('../validators/reportValidator');

// GET /api/reports/filter — Lọc báo cáo theo khoảng thời gian (ngày/tháng) và phòng ban
router.get('/reports/filter', validateReportFilterMiddleware, reportController.filterReports);

module.exports = router;
