const db = require('../config/database');

const Meeting = {
    /**
     * Tra cứu xem phòng có bị trùng lịch hay không (dùng cho API kiểm tra phòng trống độc lập)
     */
    checkOverlap: async (roomId, startTime, endTime) => {
        const query = `
            SELECT m.MeetingID, m.Title, m.StartTime, m.EndTime
            FROM meetings m
            JOIN bookings b ON m.MeetingID = b.MeetingID
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
            await connection.beginTransaction();

            // 1. Kiểm tra sự tồn tại của Người tổ chức (Organizer)
            const [organizers] = await connection.execute(
                'SELECT UserID, FullName FROM users WHERE UserID = ?',
                [organizerId]
            );
            if (organizers.length === 0) {
                const error = new Error(`Người tổ chức với ID ${organizerId} không tồn tại.`);
                error.status = 404;
                throw error;
            }

            // 2. Khóa dòng phòng họp (FOR UPDATE) để ngăn Race Condition và kiểm tra trạng thái phòng
            const [rooms] = await connection.execute(
                'SELECT RoomID, RoomName, Capacity, Status FROM rooms WHERE RoomID = ? FOR UPDATE',
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
                FROM meetings m
                JOIN bookings b ON m.MeetingID = b.MeetingID
                WHERE b.RoomID = ? 
                  AND b.BookingStatus = 'Confirmed'
                  AND (m.StartTime < ?) AND (m.EndTime > ?)
            `;
            const [overlapRows] = await connection.execute(overlapQuery, [roomId, endTime, startTime]);
            if (overlapRows.length > 0) {
                const error = new Error(`Phòng họp "${room.RoomName}" đã có người đặt trong khung giờ này.`);
                error.status = 409;
                throw error;
            }

            // 4. Tạo bản ghi Cuộc họp (Meetings)
            const insertMeetingQuery = `
                INSERT INTO meetings (Title, Description, StartTime, EndTime, OrganizerID, IsRecurring)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [meetingResult] = await connection.execute(insertMeetingQuery, [
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
                INSERT INTO bookings (MeetingID, RoomID, BookingStatus)
                VALUES (?, ?, 'Confirmed')
            `;
            const [bookingResult] = await connection.execute(insertBookingQuery, [meetingId, roomId]);
            const bookingId = bookingResult.insertId;

            // 6. Thêm danh sách Người tham gia (meeting_participants) nếu có
            if (Array.isArray(participantIds) && participantIds.length > 0) {
                for (const userId of participantIds) {
                    if (Number.isInteger(Number(userId))) {
                        await connection.execute(
                            'INSERT IGNORE INTO meeting_participants (MeetingID, UserID, ResponseStatus) VALUES (?, ?, ?)',
                            [meetingId, userId, 'Pending']
                        );
                    }
                }
            }

            // 7. Thêm danh sách Thiết bị yêu cầu (booking_equipments) nếu có
            if (Array.isArray(equipmentIds) && equipmentIds.length > 0) {
                for (const eqId of equipmentIds) {
                    if (Number.isInteger(Number(eqId))) {
                        await connection.execute(
                            'INSERT IGNORE INTO booking_equipments (BookingID, EquipmentID) VALUES (?, ?)',
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