const db = require('../config/database');

const Report = {
    /**
     * Lọc báo cáo cuộc họp theo khoảng thời gian tùy chọn (ngày/tháng) và phòng họp/tầng
     *
     * @param {Object} filters - Các tham số lọc
     * @param {string} [filters.filterType]  - Loại lọc thời gian: 'day' | 'month' | 'custom'
     * @param {string} [filters.date]        - Ngày cụ thể (YYYY-MM-DD) khi filterType = 'day'
     * @param {string} [filters.month]       - Tháng (YYYY-MM) khi filterType = 'month'
     * @param {string} [filters.startDate]   - Ngày bắt đầu (YYYY-MM-DD) khi filterType = 'custom'
     * @param {string} [filters.endDate]     - Ngày kết thúc (YYYY-MM-DD) khi filterType = 'custom'
     * @param {number} [filters.roomId]      - Lọc theo phòng họp cụ thể
     * @param {string} [filters.floor]       - Lọc theo tầng (phòng ban/khu vực)
     * @param {string} [filters.status]      - Lọc theo trạng thái booking
     * @param {number} [filters.page=1]      - Trang hiện tại
     * @param {number} [filters.limit=10]    - Số bản ghi mỗi trang
     * @returns {Object} { meetings, summary, pagination }
     */
    filter: async (filters = {}) => {
        const {
            filterType,
            date,
            month,
            startDate,
            endDate,
            roomId,
            floor,
            status,
            page = 1,
            limit = 10
        } = filters;

        // ── Xây dựng câu truy vấn cơ bản với JOIN đầy đủ ──
        let baseQuery = `
            FROM Meetings m
            LEFT JOIN Users u ON m.OrganizerID = u.UserID
            LEFT JOIN Bookings b ON m.MeetingID = b.MeetingID
            LEFT JOIN Rooms r ON b.RoomID = r.RoomID
        `;

        const conditions = [];
        const params = [];

        // ── Lọc theo loại thời gian ──
        if (filterType === 'day' && date) {
            // Lọc theo ngày cụ thể
            conditions.push('DATE(m.StartTime) = ?');
            params.push(date);
        } else if (filterType === 'month' && month) {
            // Lọc theo tháng (YYYY-MM)
            conditions.push('DATE_FORMAT(m.StartTime, "%Y-%m") = ?');
            params.push(month);
        } else if (filterType === 'custom' && startDate && endDate) {
            // Lọc theo khoảng thời gian tùy chọn
            conditions.push('DATE(m.StartTime) >= ?');
            params.push(startDate);
            conditions.push('DATE(m.StartTime) <= ?');
            params.push(endDate);
        } else if (startDate || endDate) {
            // Hỗ trợ truyền startDate/endDate mà không cần filterType
            if (startDate) {
                conditions.push('DATE(m.StartTime) >= ?');
                params.push(startDate);
            }
            if (endDate) {
                conditions.push('DATE(m.StartTime) <= ?');
                params.push(endDate);
            }
        }

        // ── Lọc theo phòng họp cụ thể ──
        if (roomId) {
            conditions.push('r.RoomID = ?');
            params.push(roomId);
        }

        // ── Lọc theo tầng / khu vực (phòng ban) ──
        if (floor) {
            conditions.push('r.Floor LIKE ?');
            params.push(`%${floor}%`);
        }

        // ── Lọc theo trạng thái booking ──
        if (status) {
            conditions.push('b.BookingStatus = ?');
            params.push(status);
        }

        // ── Ghép điều kiện WHERE ──
        if (conditions.length > 0) {
            baseQuery += ' WHERE ' + conditions.join(' AND ');
        }

        // ── 1. Đếm tổng số bản ghi (cho phân trang) ──
        const countQuery = `SELECT COUNT(DISTINCT m.MeetingID) AS total ${baseQuery}`;
        const [countRows] = await db.execute(countQuery, params);
        const total = countRows[0].total;

        // ── 2. Truy vấn thống kê tổng hợp (Summary Statistics) ──
        const summaryQuery = `
            SELECT
                COUNT(DISTINCT m.MeetingID)                         AS totalMeetings,
                COUNT(DISTINCT r.RoomID)                            AS totalRoomsUsed,
                COUNT(DISTINCT m.OrganizerID)                       AS totalOrganizers,
                COALESCE(SUM(TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime)), 0) AS totalDurationMinutes,
                COALESCE(ROUND(AVG(TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime)), 0), 0) AS avgDurationMinutes
            ${baseQuery}
        `;
        const [summaryRows] = await db.execute(summaryQuery, params);
        const summary = summaryRows[0];

        // ── 3. Thống kê số cuộc họp theo phòng ──
        const roomStatsQuery = `
            SELECT
                r.RoomID        AS roomId,
                r.RoomName      AS roomName,
                r.Floor         AS floor,
                COUNT(DISTINCT m.MeetingID) AS meetingCount
            ${baseQuery}
            AND r.RoomID IS NOT NULL
            GROUP BY r.RoomID, r.RoomName, r.Floor
            ORDER BY meetingCount DESC
        `;
        // Cần xử lý trường hợp không có WHERE trước AND
        let roomStatsQueryFinal;
        if (conditions.length > 0) {
            roomStatsQueryFinal = roomStatsQuery;
        } else {
            roomStatsQueryFinal = roomStatsQuery.replace('AND r.RoomID IS NOT NULL', 'WHERE r.RoomID IS NOT NULL');
        }
        const [roomStats] = await db.execute(roomStatsQueryFinal, params);

        // ── 4. Tính toán phân trang ──
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);

        // ── 5. Truy vấn dữ liệu chi tiết các cuộc họp ──
        const dataQuery = `
            SELECT
                m.MeetingID     AS meetingId,
                m.Title         AS title,
                m.Description   AS description,
                m.StartTime     AS startTime,
                m.EndTime       AS endTime,
                m.IsRecurring   AS isRecurring,
                m.CreatedAt     AS createdAt,
                TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime) AS durationMinutes,
                m.OrganizerID   AS organizerId,
                u.FullName      AS organizerName,
                u.Email         AS organizerEmail,
                b.BookingID     AS bookingId,
                b.BookingStatus AS bookingStatus,
                r.RoomID        AS roomId,
                r.RoomName      AS roomName,
                r.RoomCode      AS roomCode,
                r.Floor         AS floor,
                r.Capacity      AS roomCapacity
            ${baseQuery}
            ORDER BY m.StartTime DESC
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, String(limit), String(offset)];
        const [rows] = await db.execute(dataQuery, dataParams);

        return {
            meetings: rows,
            summary: {
                totalMeetings: summary.totalMeetings,
                totalRoomsUsed: summary.totalRoomsUsed,
                totalOrganizers: summary.totalOrganizers,
                totalDurationMinutes: summary.totalDurationMinutes,
                avgDurationMinutes: summary.avgDurationMinutes,
                totalDurationFormatted: formatDuration(summary.totalDurationMinutes)
            },
            roomStats,
            pagination: {
                currentPage: page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }
};

/**
 * Chuyển đổi phút sang định dạng đọc được (VD: "2 giờ 30 phút")
 * @param {number} minutes
 * @returns {string}
 */
function formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '0 phút';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours} giờ`);
    if (mins > 0) parts.push(`${mins} phút`);
    return parts.join(' ');
}

module.exports = Report;
