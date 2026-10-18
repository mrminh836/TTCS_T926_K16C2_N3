/**
 * Report Model – Tầng truy vấn thống kê hiệu suất phòng họp
 * 
 * Cung cấp 3 hàm truy vấn chính:
 *   1. getRoomUsageFrequency  – Tần suất sử dụng từng phòng (số lượt đặt)
 *   2. getOccupancyRate        – Tỷ lệ lấp đầy trung bình (%) theo số người tham gia / sức chứa
 *   3. getCancellationRate     – Tỷ lệ cuộc họp bị hủy (%) trên tổng số booking
 * 
 * Tất cả đều hỗ trợ lọc theo khoảng ngày (startDate, endDate) và phòng cụ thể (roomId).
 */

const db = require('../config/database');

const Report = {
    /**
     * 1. Tần suất sử dụng phòng
     * Đếm số lượt booking (Confirmed) cho mỗi phòng trong khoảng thời gian.
     * Phòng không có booking nào vẫn xuất hiện với totalBookings = 0.
     *
     * @param {Object} filters
     * @param {string} [filters.startDate] - Ngày bắt đầu (YYYY-MM-DD)
     * @param {string} [filters.endDate]   - Ngày kết thúc (YYYY-MM-DD)
     * @param {number} [filters.roomId]    - Lọc theo phòng cụ thể
     * @returns {Promise<Array>} Danh sách phòng kèm tần suất sử dụng
     */
    getRoomUsageFrequency: async (filters = {}) => {
        const { startDate, endDate, roomId } = filters;

        let sql = `
            SELECT 
                r.RoomID        AS roomId,
                r.RoomCode      AS roomCode,
                r.RoomName      AS roomName,
                r.Capacity      AS capacity,
                r.Status        AS status,
                COUNT(b.BookingID) AS totalBookings
            FROM Rooms r
            LEFT JOIN Bookings b ON r.RoomID = b.RoomID
                AND b.BookingStatus = 'Confirmed'
        `;

        const joins = [];
        const conditions = [];
        const params = [];

        // Cần JOIN Meetings khi lọc theo ngày
        if (startDate || endDate) {
            joins.push('LEFT JOIN Meetings m ON b.MeetingID = m.MeetingID');
        }

        if (startDate) {
            conditions.push('DATE(m.StartTime) >= ?');
            params.push(startDate);
        }
        if (endDate) {
            conditions.push('DATE(m.StartTime) <= ?');
            params.push(endDate);
        }
        if (roomId) {
            conditions.push('r.RoomID = ?');
            params.push(Number(roomId));
        }

        // Ghép JOIN bổ sung
        if (joins.length > 0) {
            sql += '\n' + joins.join('\n');
        }

        // Ghép WHERE
        if (conditions.length > 0) {
            sql += '\nWHERE ' + conditions.join(' AND ');
        }

        sql += `
            GROUP BY r.RoomID, r.RoomCode, r.RoomName, r.Capacity, r.Status
            ORDER BY totalBookings DESC, r.RoomName ASC
        `;

        const [rows] = await db.execute(sql, params);
        return rows;
    },

    /**
     * 2. Tỷ lệ lấp đầy trung bình (%)
     * Tính: AVG(số người tham gia / sức chứa phòng) × 100
     * Chỉ tính các booking Confirmed có ít nhất 1 người tham gia.
     *
     * @param {Object} filters
     * @returns {Promise<Array>} Danh sách phòng kèm tỷ lệ lấp đầy
     */
    getOccupancyRate: async (filters = {}) => {
        const { startDate, endDate, roomId } = filters;

        let sql = `
            SELECT 
                r.RoomID        AS roomId,
                r.RoomCode      AS roomCode,
                r.RoomName      AS roomName,
                r.Capacity      AS capacity,
                COUNT(DISTINCT b.BookingID) AS totalMeetings,
                COALESCE(
                    ROUND(
                        AVG(
                            sub.participantCount / r.Capacity * 100
                        ), 2
                    ), 0
                ) AS avgOccupancyRate,
                MAX(COALESCE(sub.participantCount, 0)) AS maxParticipants,
                MIN(CASE WHEN sub.participantCount > 0 THEN sub.participantCount ELSE NULL END) AS minParticipants
            FROM Rooms r
            LEFT JOIN Bookings b ON r.RoomID = b.RoomID
                AND b.BookingStatus = 'Confirmed'
            LEFT JOIN Meetings m ON b.MeetingID = m.MeetingID
            LEFT JOIN (
                SELECT mp.MeetingID, COUNT(mp.UserID) AS participantCount
                FROM Meeting_Participants mp
                GROUP BY mp.MeetingID
            ) sub ON m.MeetingID = sub.MeetingID
        `;

        const conditions = [];
        const params = [];

        if (startDate) {
            conditions.push('DATE(m.StartTime) >= ?');
            params.push(startDate);
        }
        if (endDate) {
            conditions.push('DATE(m.StartTime) <= ?');
            params.push(endDate);
        }
        if (roomId) {
            conditions.push('r.RoomID = ?');
            params.push(Number(roomId));
        }

        if (conditions.length > 0) {
            sql += '\nWHERE ' + conditions.join(' AND ');
        }

        sql += `
            GROUP BY r.RoomID, r.RoomCode, r.RoomName, r.Capacity
            ORDER BY avgOccupancyRate DESC, r.RoomName ASC
        `;

        const [rows] = await db.execute(sql, params);
        return rows;
    },

    /**
     * 3. Tỷ lệ hủy cuộc họp
     * Tính: (số booking bị Cancelled / tổng số booking) × 100
     * Bao gồm cả booking Confirmed và Cancelled để phản ánh toàn bộ hoạt động.
     *
     * @param {Object} filters
     * @returns {Promise<Object>} Thống kê tổng quan tỷ lệ hủy
     */
    getCancellationRate: async (filters = {}) => {
        const { startDate, endDate, roomId } = filters;

        // --- Thống kê tổng quan ---
        let overallSql = `
            SELECT
                COUNT(b.BookingID) AS totalBookings,
                SUM(CASE WHEN b.BookingStatus = 'Cancelled' THEN 1 ELSE 0 END) AS cancelledBookings,
                SUM(CASE WHEN b.BookingStatus = 'Confirmed' THEN 1 ELSE 0 END) AS confirmedBookings,
                COALESCE(
                    ROUND(
                        SUM(CASE WHEN b.BookingStatus = 'Cancelled' THEN 1 ELSE 0 END)
                        / NULLIF(COUNT(b.BookingID), 0) * 100
                    , 2)
                , 0) AS cancellationRate
            FROM Bookings b
            JOIN Meetings m ON b.MeetingID = m.MeetingID
        `;

        const overallConditions = [];
        const overallParams = [];

        if (startDate) {
            overallConditions.push('DATE(m.StartTime) >= ?');
            overallParams.push(startDate);
        }
        if (endDate) {
            overallConditions.push('DATE(m.StartTime) <= ?');
            overallParams.push(endDate);
        }
        if (roomId) {
            overallConditions.push('b.RoomID = ?');
            overallParams.push(Number(roomId));
        }

        if (overallConditions.length > 0) {
            overallSql += '\nWHERE ' + overallConditions.join(' AND ');
        }

        const [overallRows] = await db.execute(overallSql, overallParams);

        // --- Thống kê chi tiết theo từng phòng ---
        let perRoomSql = `
            SELECT
                r.RoomID        AS roomId,
                r.RoomCode      AS roomCode,
                r.RoomName      AS roomName,
                COUNT(b.BookingID) AS totalBookings,
                SUM(CASE WHEN b.BookingStatus = 'Cancelled' THEN 1 ELSE 0 END) AS cancelledBookings,
                SUM(CASE WHEN b.BookingStatus = 'Confirmed' THEN 1 ELSE 0 END) AS confirmedBookings,
                COALESCE(
                    ROUND(
                        SUM(CASE WHEN b.BookingStatus = 'Cancelled' THEN 1 ELSE 0 END)
                        / NULLIF(COUNT(b.BookingID), 0) * 100
                    , 2)
                , 0) AS cancellationRate
            FROM Rooms r
            LEFT JOIN Bookings b ON r.RoomID = b.RoomID
            LEFT JOIN Meetings m ON b.MeetingID = m.MeetingID
        `;

        const perRoomConditions = [];
        const perRoomParams = [];

        if (startDate) {
            perRoomConditions.push('DATE(m.StartTime) >= ?');
            perRoomParams.push(startDate);
        }
        if (endDate) {
            perRoomConditions.push('DATE(m.StartTime) <= ?');
            perRoomParams.push(endDate);
        }
        if (roomId) {
            perRoomConditions.push('r.RoomID = ?');
            perRoomParams.push(Number(roomId));
        }

        if (perRoomConditions.length > 0) {
            perRoomSql += '\nWHERE ' + perRoomConditions.join(' AND ');
        }

        perRoomSql += `
            GROUP BY r.RoomID, r.RoomCode, r.RoomName
            ORDER BY cancellationRate DESC, r.RoomName ASC
        `;

        const [perRoomRows] = await db.execute(perRoomSql, perRoomParams);

        return {
            overall: overallRows[0] || {
                totalBookings: 0,
                cancelledBookings: 0,
                confirmedBookings: 0,
                cancellationRate: 0
            },
            byRoom: perRoomRows
        };
    },

    /**
     * 4. Tổng hợp toàn bộ thống kê (gọi cả 3 metric một lần)
     * Được sử dụng bởi endpoint GET /api/reports/analytics
     *
     * @param {Object} filters
     * @returns {Promise<Object>} Kết quả tổng hợp 3 metric
     */
    getAnalytics: async (filters = {}) => {
        // Chạy song song 3 truy vấn để tối ưu thời gian phản hồi
        const [roomUsage, occupancyRate, cancellationRate] = await Promise.all([
            Report.getRoomUsageFrequency(filters),
            Report.getOccupancyRate(filters),
            Report.getCancellationRate(filters)
        ]);

        return {
            roomUsage,
            occupancyRate,
            cancellationRate
        };
    }
};

module.exports = Report;
