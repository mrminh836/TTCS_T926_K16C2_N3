/**
 * Report Controller – Xử lý logic nghiệp vụ cho API thống kê hiệu suất
 * 
 * Endpoint: GET /api/reports/analytics
 * Query params:
 *   - startDate  : Lọc từ ngày (YYYY-MM-DD)
 *   - endDate    : Lọc đến ngày (YYYY-MM-DD)
 *   - roomId     : Lọc theo phòng cụ thể (số nguyên dương)
 */

const Report = require('../models/reportModel');

/**
 * GET /api/reports/analytics
 * Trả về thống kê tổng hợp: tần suất sử dụng phòng, tỷ lệ lấp đầy, tỷ lệ hủy
 */
const getAnalytics = async (req, res, next) => {
    try {
        // Lấy filters đã được validate bởi middleware
        const filters = req.reportFilters || {};

        const analytics = await Report.getAnalytics(filters);

        // Tổng hợp summary nhanh
        const totalRooms = analytics.roomUsage.length;
        const totalBookings = analytics.roomUsage.reduce(
            (sum, room) => sum + Number(room.totalBookings), 0
        );
        const activeRooms = analytics.roomUsage.filter(
            room => Number(room.totalBookings) > 0
        ).length;
        const unusedRooms = totalRooms - activeRooms;

        return res.status(200).json({
            success: true,
            message: 'Lấy thống kê hiệu suất phòng họp thành công.',
            data: {
                summary: {
                    totalRooms,
                    totalBookings,
                    activeRooms,
                    unusedRooms,
                    overallCancellationRate: analytics.cancellationRate.overall.cancellationRate || 0,
                    filterApplied: {
                        startDate: filters.startDate || null,
                        endDate: filters.endDate || null,
                        roomId: filters.roomId || null
                    }
                },
                roomUsageFrequency: analytics.roomUsage,
                occupancyRate: analytics.occupancyRate,
                cancellationRate: analytics.cancellationRate
            }
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

module.exports = { getAnalytics };
