const Report = require('../models/reportModel');

/**
 * GET /api/reports/filter
 * Lọc báo cáo cuộc họp theo khoảng thời gian tùy chọn (ngày/tháng) và phòng ban
 *
 * Query params:
 *   - filterType : Loại lọc thời gian ('day' | 'month' | 'custom')
 *   - date       : Ngày cụ thể (YYYY-MM-DD) — khi filterType = 'day'
 *   - month      : Tháng (YYYY-MM) — khi filterType = 'month'
 *   - startDate  : Từ ngày (YYYY-MM-DD) — khi filterType = 'custom' hoặc lọc tự do
 *   - endDate    : Đến ngày (YYYY-MM-DD) — khi filterType = 'custom' hoặc lọc tự do
 *   - roomId     : Lọc theo phòng họp cụ thể (số nguyên)
 *   - floor      : Lọc theo tầng / khu vực (chuỗi, VD: "Tầng 2")
 *   - status     : Lọc theo trạng thái booking (Confirmed | Cancelled | Completed)
 *   - page       : Trang hiện tại (mặc định: 1)
 *   - limit      : Số bản ghi mỗi trang (mặc định: 10, tối đa: 100)
 *
 * Ví dụ sử dụng:
 *   GET /api/reports/filter?filterType=day&date=2026-10-12
 *   GET /api/reports/filter?filterType=month&month=2026-10
 *   GET /api/reports/filter?filterType=custom&startDate=2026-10-01&endDate=2026-10-31
 *   GET /api/reports/filter?filterType=month&month=2026-10&roomId=1
 *   GET /api/reports/filter?floor=Tầng 2&startDate=2026-10-01&endDate=2026-10-31
 */
const filterReports = async (req, res, next) => {
    try {
        // Dữ liệu đã được validate và chuẩn hóa bởi middleware
        const filterData = req.validatedReportFilter;

        // ── Gọi Model để lấy dữ liệu ──
        const result = await Report.filter(filterData);

        // ── Xây dựng thông tin mô tả bộ lọc đang áp dụng ──
        const appliedFilters = buildAppliedFiltersDescription(filterData);

        return res.status(200).json({
            success: true,
            message: 'Lọc báo cáo thành công.',
            appliedFilters,
            summary: result.summary,
            roomStats: result.roomStats,
            data: result.meetings,
            pagination: result.pagination
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
 * Tạo mô tả các bộ lọc đang áp dụng để trả về cho client hiển thị
 * @param {Object} filterData - Dữ liệu filter đã validate
 * @returns {Object} Thông tin các bộ lọc đang áp dụng
 */
function buildAppliedFiltersDescription(filterData) {
    const description = {};

    if (filterData.filterType) {
        description.filterType = filterData.filterType;
    }

    if (filterData.filterType === 'day' && filterData.date) {
        description.timeRange = `Ngày ${filterData.date}`;
    } else if (filterData.filterType === 'month' && filterData.month) {
        description.timeRange = `Tháng ${filterData.month}`;
    } else if (filterData.startDate && filterData.endDate) {
        description.timeRange = `Từ ${filterData.startDate} đến ${filterData.endDate}`;
    } else if (filterData.startDate) {
        description.timeRange = `Từ ngày ${filterData.startDate}`;
    } else if (filterData.endDate) {
        description.timeRange = `Đến ngày ${filterData.endDate}`;
    } else {
        description.timeRange = 'Toàn bộ thời gian';
    }

    if (filterData.roomId) {
        description.roomId = filterData.roomId;
    }

    if (filterData.floor) {
        description.floor = filterData.floor;
    }

    if (filterData.status) {
        description.status = filterData.status;
    }

    return description;
}

module.exports = { filterReports };
