/**
 * Controller Xử lý Thống kê & Báo cáo Hiệu suất (Report & Analytics Controller)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 */

const ReportModel = require('../models/reportModel');
const { validateAnalyticsQuery } = require('../validators/reportValidator');

/**
 * GET /api/reports/analytics
 * Thống kê hiệu suất sử dụng phòng họp, tỷ lệ lấp đầy %, tỷ lệ cuộc họp bị hủy
 * 
 * Query params (tùy chọn):
 *   - startDate          : Lọc từ ngày (YYYY-MM-DD)
 *   - endDate            : Lọc đến ngày (YYYY-MM-DD)
 *   - roomId             : ID phòng họp cần thống kê riêng (Số nguyên)
 *   - workingHoursPerDay : Số giờ làm việc chuẩn mỗi ngày (Mặc định: 10, từ 1 đến 24)
 */
const getAnalytics = async (req, res, next) => {
    try {
        // 1. Lấy dữ liệu đã xác thực từ middleware hoặc validate trực tiếp
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

        // 2. Truy vấn dữ liệu thống kê từ ReportModel
        const analyticsData = await ReportModel.getAnalytics(filters);

        // 3. Phản hồi chuẩn RESTful
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

module.exports = {
    getAnalytics
};
