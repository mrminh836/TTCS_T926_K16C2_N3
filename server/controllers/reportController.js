/**
 * Controller Xử lý Thống kê & Báo cáo Hiệu suất (Report & Analytics Controller)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 */

const ReportModel = require('../models/reportModel');
const {
    validateAnalyticsQuery,
    validateFilterReportsQuery,
    validateExportReportQuery
} = require('../validators/reportValidator');

/**
 * 1. GET /api/reports/analytics
 * Thống kê hiệu suất sử dụng phòng họp, tỷ lệ lấp đầy %, tỷ lệ cuộc họp bị hủy
 */
const getAnalytics = async (req, res, next) => {
    try {
        const validation = req.validatedAnalyticsQuery 
            ? { isValid: true, data: req.validatedAnalyticsQuery }
            : validateAnalyticsQuery(req.query);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0],
                errors: validation.errors
            });
        }

        const filters = validation.data;
        const analyticsData = await ReportModel.getAnalytics(filters);

        return res.status(200).json({
            success: true,
            message: "Lấy dữ liệu thống kê hiệu suất thành công.",
            data: analyticsData
        });

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * 2. GET /api/reports/filter
 * Lọc báo cáo theo khoảng thời gian tùy chọn (ngày/tháng) và phòng ban
 * 
 * Query params:
 *   - period     : day | week | month | quarter | year | custom | all
 *   - date       : YYYY-MM-DD
 *   - month      : YYYY-MM (ví dụ 2026-10)
 *   - year       : YYYY
 *   - startDate  : YYYY-MM-DD
 *   - endDate    : YYYY-MM-DD
 *   - department : Tên phòng ban (Kỹ thuật | Quản trị | Hành chính | Kiểm thử | Thiết kế)
 *   - roomId     : ID phòng họp
 *   - status     : Confirmed | Cancelled | Completed | all
 *   - page       : Số trang (mặc định 1)
 *   - limit      : Số bản ghi (mặc định 10)
 */
const filterReports = async (req, res, next) => {
    try {
        const validation = req.validatedFilterQuery
            ? { isValid: true, data: req.validatedFilterQuery }
            : validateFilterReportsQuery(req.query);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0],
                errors: validation.errors
            });
        }

        const filters = validation.data;
        const filteredData = await ReportModel.filterReports(filters);

        return res.status(200).json({
            success: true,
            message: "Lọc dữ liệu báo cáo cuộc họp thành công.",
            data: filteredData
        });

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

/**
 * 3. GET /api/reports/export
 * Kết xuất dữ liệu thống kê báo cáo ra định dạng file Excel / CSV UTF-8
 * 
 * Query params:
 *   - format     : csv | excel (mặc định: csv UTF-8 có BOM)
 *   - period, date, month, startDate, endDate, department, roomId, status
 */
const exportReport = async (req, res, next) => {
    try {
        const validation = req.validatedExportQuery
            ? { isValid: true, data: req.validatedExportQuery }
            : validateExportReportQuery(req.query);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0],
                errors: validation.errors
            });
        }

        const filters = validation.data;

        // Lấy dữ liệu phân tích KPIs và danh sách chi tiết (không giới hạn phân trang)
        const [analyticsData, filteredData] = await Promise.all([
            ReportModel.getAnalytics(filters),
            ReportModel.filterReports({ ...filters, page: 1, limit: 2000 })
        ]);

        const currentUser = req.user || {};
        const meta = {
            startDate: analyticsData?.filter?.startDate || filters.startDate,
            endDate: analyticsData?.filter?.endDate || filters.endDate,
            department: filters.department || 'Tất cả phòng ban',
            roomId: filters.roomId,
            exportedAt: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
            exportedBy: currentUser.fullName || currentUser.name || currentUser.username || 'Quản trị viên'
        };

        const csvContent = ReportModel.generateCSVReport(analyticsData, filteredData, meta);

        // Tạo tên tệp chuẩn hóa
        const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `Bao_cao_hieu_suat_phong_hop_${nowStr}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        return res.status(200).send(csvContent);

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

module.exports = {
    getAnalytics,
    filterReports,
    exportReport
};
