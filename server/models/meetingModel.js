const db = require('../config/database');

const Meeting = {
    /**
     * Lấy danh sách cuộc họp với bộ lọc và phân trang
     * @param {Object} filters - Các tham số lọc
     * @param {string} [filters.date] - Lọc theo ngày cụ thể (YYYY-MM-DD)
     * @param {string} [filters.startDate] - Lọc từ ngày (YYYY-MM-DD)
     * @param {string} [filters.endDate] - Lọc đến ngày (YYYY-MM-DD)
     * @param {string} [filters.status] - Lọc theo trạng thái booking (Confirmed, Cancelled, Completed)
     * @param {number} [filters.page=1] - Trang hiện tại
     * @param {number} [filters.limit=10] - Số bản ghi mỗi trang
     * @returns {Object} { meetings, pagination }
     */
    getAll: async (filters = {}) => {
        const {
            date,
            startDate,
            endDate,
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

        // ── Lọc theo ngày cụ thể (date=2026-10-01) ──
        if (date) {
            conditions.push('DATE(m.StartTime) = ?');
            params.push(date);
        }

        // ── Lọc theo khoảng ngày (startDate & endDate) ──
        if (startDate) {
            conditions.push('DATE(m.StartTime) >= ?');
            params.push(startDate);
        }
        if (endDate) {
            conditions.push('DATE(m.StartTime) <= ?');
            params.push(endDate);
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

        // ── Đếm tổng số bản ghi (cho phân trang) ──
        const countQuery = `SELECT COUNT(DISTINCT m.MeetingID) AS total ${baseQuery}`;
        const [countRows] = await db.execute(countQuery, params);
        const total = countRows[0].total;

        // ── Tính toán phân trang ──
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);

        // ── Truy vấn dữ liệu chính với đầy đủ thông tin ──
        const dataQuery = `
            SELECT 
                m.MeetingID     AS meetingId,
                m.Title         AS title,
                m.Description   AS description,
                m.StartTime     AS startTime,
                m.EndTime       AS endTime,
                m.IsRecurring   AS isRecurring,
                m.CreatedAt     AS createdAt,
                m.OrganizerID   AS organizerId,
                u.FullName      AS organizerName,
                u.Email         AS organizerEmail,
                b.BookingID     AS bookingId,
                b.BookingStatus AS bookingStatus,
                r.RoomID        AS roomId,
                r.RoomName      AS roomName,
                r.Capacity      AS roomCapacity
            ${baseQuery}
            ORDER BY m.StartTime DESC
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, String(limit), String(offset)];
        const [rows] = await db.execute(dataQuery, dataParams);

        return {
            meetings: rows,
            pagination: {
                currentPage: page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    },

    /**
     * Tra cứu xem phòng có bị trùng lịch hay không (dùng cho API kiểm tra phòng trống độc lập)
     */
    checkOverlap: async (roomId, startTime, endTime) => {
        const query = `
            SELECT m.MeetingID, m.Title, m.StartTime, m.EndTime
            FROM Meetings m
            JOIN Bookings b ON m.MeetingID = b.MeetingID
            WHERE b.RoomID = ? 
              AND b.BookingStatus = 'Confirmed'
              AND (m.StartTime < ?) AND (m.EndTime > ?)
        `;
        const [rows] = await db.execute(query, [roomId, endTime, startTime]);
        return rows.length > 0;
    },

    /**
     * Tạo cuộc họp và đặt phòng an toàn trong một Database Transaction duy nhất
     * Khóa dòng (FOR UPDATE) để ngăn chặn Race Condition (đặt trùng phòng cùng lúc)
     */
    create: async (meetingData) => {
        const {
            title,
            description,
            startTime,
            endTime,
            organizerId,
            roomId,
            isRecurring,
            participantIds = [],
            equipmentIds = []
        } = meetingData;

        const connection = await db.getConnection();

        try {
            // Đặt isolation level SERIALIZABLE để đảm bảo chống Race Condition
            await connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
            await connection.beginTransaction();

            // 1. Kiểm tra sự tồn tại của Người tổ chức (Organizer)
            const [organizers] = await connection.query(
                'SELECT UserID, FullName FROM Users WHERE UserID = ?',
                [organizerId]
            );
            if (organizers.length === 0) {
                const error = new Error(`Người tổ chức với ID ${organizerId} không tồn tại.`);
                error.status = 404;
                throw error;
            }

            // 2. Khóa dòng phòng họp (FOR UPDATE) để ngăn Race Condition và kiểm tra trạng thái phòng
            const [rooms] = await connection.query(
                'SELECT RoomID, RoomName, Capacity, Status FROM Rooms WHERE RoomID = ? FOR UPDATE',
                [roomId]
            );
            if (rooms.length === 0) {
                const error = new Error(`Phòng họp với ID ${roomId} không tồn tại.`);
                error.status = 404;
                throw error;
            }

            const room = rooms[0];
            if (room.Status !== 'Active') {
                const error = new Error(`Phòng họp "${room.RoomName}" hiện không khả dụng (Trạng thái: ${room.Status}).`);
                error.status = 400;
                throw error;
            }

            // 3. Kiểm tra xung đột lịch (Overlap Check) ngay trong Transaction đã khóa phòng
            const overlapQuery = `
                SELECT m.MeetingID, m.Title, m.StartTime, m.EndTime
                FROM Meetings m
                JOIN Bookings b ON m.MeetingID = b.MeetingID
                WHERE b.RoomID = ? 
                  AND b.BookingStatus = 'Confirmed'
                  AND (m.StartTime < ?) AND (m.EndTime > ?)
                FOR UPDATE
            `;
            const [overlapRows] = await connection.query(overlapQuery, [roomId, endTime, startTime]);
            if (overlapRows.length > 0) {
                const error = new Error(`Phòng họp "${room.RoomName}" đã có người đặt trong khung giờ này.`);
                error.status = 409;
                throw error;
            }

            // 4. Tạo bản ghi Cuộc họp (Meetings)
            const insertMeetingQuery = `
                INSERT INTO Meetings (Title, Description, StartTime, EndTime, OrganizerID, IsRecurring)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [meetingResult] = await connection.query(insertMeetingQuery, [
                title.trim(),
                description ? description.trim() : null,
                startTime,
                endTime,
                organizerId,
                Boolean(isRecurring)
            ]);
            const meetingId = meetingResult.insertId;

            // 5. Tạo bản ghi Đặt phòng (Bookings)
            const insertBookingQuery = `
                INSERT INTO Bookings (MeetingID, RoomID, BookingStatus)
                VALUES (?, ?, 'Confirmed')
            `;
            const [bookingResult] = await connection.query(insertBookingQuery, [meetingId, roomId]);
            const bookingId = bookingResult.insertId;

            // 6. Thêm danh sách Người tham gia (meeting_participants) nếu có
            if (Array.isArray(participantIds) && participantIds.length > 0) {
                for (const userId of participantIds) {
                    if (Number.isInteger(Number(userId))) {
                        await connection.query(
                            'INSERT IGNORE INTO Meeting_Participants (MeetingID, UserID, ResponseStatus) VALUES (?, ?, ?)',
                            [meetingId, userId, 'Pending']
                        );
                    }
                }
            }

            // 7. Thêm danh sách Thiết bị yêu cầu (booking_equipments) nếu có
            if (Array.isArray(equipmentIds) && equipmentIds.length > 0) {
                for (const eqId of equipmentIds) {
                    if (Number.isInteger(Number(eqId))) {
                        await connection.query(
                            'INSERT IGNORE INTO Booking_Equipments (BookingID, EquipmentID) VALUES (?, ?)',
                            [bookingId, eqId]
                        );
                    }
                }
            }

            await connection.commit();

            return {
                meetingId,
                bookingId,
                title: title.trim(),
                roomId,
                roomName: room.RoomName,
                startTime,
                endTime,
                organizerId,
                participantCount: participantIds.length,
                equipmentCount: equipmentIds.length
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = Meeting;