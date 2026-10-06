const db = require('../config/database');

const RecurringMeeting = {
    /**
     * Tạo chuỗi lịch họp lặp (recurring) trong một Database Transaction duy nhất.
     * 
     * Chiến lược: "ALL-OR-NOTHING"
     *   - Sinh toàn bộ danh sách buổi từ validator
     *   - Kiểm tra overlap cho TOÀN BỘ chuỗi trong cùng transaction (FOR UPDATE)
     *   - Nếu BẤT KỲ buổi nào xung đột → ROLLBACK toàn bộ, trả về chi tiết xung đột
     *   - Nếu tất cả đều trống → INSERT toàn bộ + COMMIT
     *
     * @param {Object} recurringData - Dữ liệu đã validate từ middleware
     * @returns {Object} Kết quả tạo chuỗi recurring
     */
    createRecurringSeries: async (recurringData) => {
        const {
            title,
            description,
            organizerId,
            roomId,
            recurrenceType,
            intervalValue,
            totalOccurrences,
            dayOfWeek,
            dayOfMonth,
            meetingStartTime,
            meetingEndTime,
            seriesStartDate,
            participantIds = [],
            equipmentIds = [],
            occurrences
        } = recurringData;

        const connection = await db.getConnection();

        try {
            // ── Đặt isolation level SERIALIZABLE để chống Race Condition ──
            await connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
            await connection.beginTransaction();

            // ═══════════════════════════════════════════════════════════
            // BƯỚC 1: Kiểm tra sự tồn tại của Organizer
            // ═══════════════════════════════════════════════════════════
            const [organizers] = await connection.query(
                'SELECT UserID, FullName FROM Users WHERE UserID = ?',
                [organizerId]
            );
            if (organizers.length === 0) {
                const error = new Error(`Người tổ chức với ID ${organizerId} không tồn tại.`);
                error.status = 404;
                throw error;
            }

            // ═══════════════════════════════════════════════════════════
            // BƯỚC 2: Khóa dòng phòng họp (FOR UPDATE) + kiểm tra trạng thái
            // ═══════════════════════════════════════════════════════════
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
                const error = new Error(
                    `Phòng họp "${room.RoomName}" hiện không khả dụng (Trạng thái: ${room.Status}).`
                );
                error.status = 400;
                throw error;
            }

            // ═══════════════════════════════════════════════════════════
            // BƯỚC 3: Kiểm tra overlap cho TOÀN BỘ chuỗi (ALL-OR-NOTHING)
            // ═══════════════════════════════════════════════════════════
            const conflicts = [];
            const overlapQuery = `
                SELECT m.MeetingID, m.Title, m.StartTime, m.EndTime
                FROM Meetings m
                JOIN Bookings b ON m.MeetingID = b.MeetingID
                WHERE b.RoomID = ? 
                  AND b.BookingStatus = 'Confirmed'
                  AND (m.StartTime < ?) AND (m.EndTime > ?)
                FOR UPDATE
            `;

            for (const occ of occurrences) {
                const startISO = formatDatetimeForMySQL(occ.startTime);
                const endISO = formatDatetimeForMySQL(occ.endTime);

                const [overlapRows] = await connection.query(overlapQuery, [roomId, endISO, startISO]);

                if (overlapRows.length > 0) {
                    conflicts.push({
                        occurrenceIndex: occ.occurrenceIndex,
                        requestedStartTime: startISO,
                        requestedEndTime: endISO,
                        conflictsWith: overlapRows.map(row => ({
                            meetingId: row.MeetingID,
                            title: row.Title,
                            startTime: row.StartTime,
                            endTime: row.EndTime
                        }))
                    });
                }
            }

            // Nếu có BẤT KỲ xung đột → REJECT toàn bộ chuỗi
            if (conflicts.length > 0) {
                await connection.rollback();
                const error = new Error(
                    `Chuỗi lịch họp bị xung đột tại ${conflicts.length}/${occurrences.length} buổi. ` +
                    `Phòng "${room.RoomName}" không khả dụng cho toàn bộ chuỗi.`
                );
                error.status = 409;
                error.conflicts = conflicts;
                throw error;
            }

            // ═══════════════════════════════════════════════════════════
            // BƯỚC 4: Tạo Recurring Pattern
            // ═══════════════════════════════════════════════════════════
            const lastOcc = occurrences[occurrences.length - 1];
            const seriesEndDate = formatDateForMySQL(lastOcc.endTime);

            const insertPatternQuery = `
                INSERT INTO Recurring_Patterns 
                    (RecurrenceType, IntervalValue, DayOfWeek, DayOfMonth, 
                     TotalOccurrences, SeriesStartDate, SeriesEndDate)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const [patternResult] = await connection.query(insertPatternQuery, [
                recurrenceType,
                intervalValue,
                dayOfWeek,
                dayOfMonth,
                totalOccurrences,
                seriesStartDate,
                seriesEndDate
            ]);
            const patternId = patternResult.insertId;

            // ═══════════════════════════════════════════════════════════
            // BƯỚC 5: Tạo từng buổi họp (Meeting + Booking + Participants + Equipments)
            // ═══════════════════════════════════════════════════════════
            const createdMeetings = [];

            const insertMeetingQuery = `
                INSERT INTO Meetings 
                    (Title, Description, StartTime, EndTime, OrganizerID, IsRecurring, RecurringPatternID, OccurrenceIndex)
                VALUES (?, ?, ?, ?, ?, TRUE, ?, ?)
            `;
            const insertBookingQuery = `
                INSERT INTO Bookings (MeetingID, RoomID, BookingStatus)
                VALUES (?, ?, 'Confirmed')
            `;

            for (const occ of occurrences) {
                const startISO = formatDatetimeForMySQL(occ.startTime);
                const endISO = formatDatetimeForMySQL(occ.endTime);

                // Tạo title có suffix số thứ tự: "Họp tuần #3/12"
                const occTitle = `${title.trim()} #${occ.occurrenceIndex}/${totalOccurrences}`;

                // INSERT Meeting
                const [meetingResult] = await connection.query(insertMeetingQuery, [
                    occTitle,
                    description ? description.trim() : null,
                    startISO,
                    endISO,
                    organizerId,
                    patternId,
                    occ.occurrenceIndex
                ]);
                const meetingId = meetingResult.insertId;

                // INSERT Booking
                const [bookingResult] = await connection.query(insertBookingQuery, [meetingId, roomId]);
                const bookingId = bookingResult.insertId;

                // INSERT Participants (nếu có)
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

                // INSERT Equipments (nếu có)
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

                createdMeetings.push({
                    meetingId,
                    bookingId,
                    title: occTitle,
                    occurrenceIndex: occ.occurrenceIndex,
                    startTime: startISO,
                    endTime: endISO
                });
            }

            // ═══════════════════════════════════════════════════════════
            // BƯỚC 6: COMMIT toàn bộ transaction
            // ═══════════════════════════════════════════════════════════
            await connection.commit();

            return {
                patternId,
                recurrenceType,
                intervalValue,
                totalOccurrences,
                roomId,
                roomName: room.RoomName,
                organizerId,
                organizerName: organizers[0].FullName,
                seriesStartDate,
                seriesEndDate,
                meetings: createdMeetings,
                participantCount: participantIds.length,
                equipmentCount: equipmentIds.length
            };

        } catch (error) {
            // Rollback chỉ khi chưa rollback (cho trường hợp conflict đã rollback ở trên)
            try {
                await connection.rollback();
            } catch (_) {
                // Connection đã rollback rồi, bỏ qua
            }
            throw error;
        } finally {
            connection.release();
        }
    }
};

// ── Helper: format Date object thành chuỗi MySQL datetime ──
function formatDatetimeForMySQL(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDateForMySQL(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

module.exports = RecurringMeeting;
