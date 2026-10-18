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
            limit = 10,
            userId,
            userRole,
            sortOrder = 'DESC'
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

        // ── Phân quyền dữ liệu theo vai trò (Backend RBAC Enforcement) ──
        // Admin: Xem toàn bộ lịch doanh nghiệp.
        // Nhân viên / Người dùng khác: Chỉ xem cuộc họp mình tổ chức HOẶC được mời tham gia (Meeting_Participants)
        const isAdmin = userRole && String(userRole).trim().toLowerCase() === 'admin';
        if (!isAdmin) {
            if (userId) {
                conditions.push('(m.OrganizerID = ? OR EXISTS (SELECT 1 FROM Meeting_Participants mp WHERE mp.MeetingID = m.MeetingID AND mp.UserID = ?))');
                params.push(userId, userId);
            } else {
                // Không có danh tính người dùng hợp lệ => Không trả về dữ liệu (Zero Trust)
                conditions.push('1 = 0');
            }
        }

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

        // ── Hướng sắp xếp (mặc định DESC cho danh sách, ASC cho lịch tuần) ──
        const orderDirection = String(sortOrder).trim().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

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
                r.Capacity      AS roomCapacity,
                (SELECT GROUP_CONCAT(mp.UserID) FROM Meeting_Participants mp WHERE mp.MeetingID = m.MeetingID) AS participantIds,
                (SELECT GROUP_CONCAT(pu.FullName) FROM Meeting_Participants mp JOIN Users pu ON mp.UserID = pu.UserID WHERE mp.MeetingID = m.MeetingID) AS participantNames
            ${baseQuery}
            ORDER BY m.StartTime ${orderDirection}
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, String(limit), String(offset)];
        const [rows] = await db.execute(dataQuery, dataParams);

        // Chuẩn hóa danh sách người tham gia dạng mảng Number
        const normalizedRows = (rows || []).map(row => {
            const parsedParticipantIds = row.participantIds
                ? String(row.participantIds).split(',').map(Number).filter(id => !isNaN(id) && id > 0)
                : (row.organizerId ? [Number(row.organizerId)] : []);
            const parsedParticipantNames = row.participantNames
                ? String(row.participantNames).split(',').map(s => s.trim()).filter(Boolean)
                : (row.organizerName ? [row.organizerName] : []);

            return {
                ...row,
                participantIds: parsedParticipantIds,
                participantNames: parsedParticipantNames
            };
        });

        return {
            meetings: normalizedRows,
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

            // 3.1. Kiểm tra và xác thực danh sách Thiết bị mượn kèm (Equipment Validation & Concurrency Lock)
            const cleanEquipmentIds = Array.isArray(equipmentIds)
                ? [...new Set(equipmentIds.map(Number).filter(id => Number.isInteger(id) && id > 0))]
                : [];

            if (cleanEquipmentIds.length > 0) {
                // a. Khóa dòng (FOR UPDATE) và kiểm tra sự tồn tại của thiết bị
                const [eqRows] = await connection.query(
                    'SELECT EquipmentID, EquipmentName, Status FROM Equipments WHERE EquipmentID IN (?) FOR UPDATE',
                    [cleanEquipmentIds]
                );

                if (eqRows.length !== cleanEquipmentIds.length) {
                    const foundIds = new Set(eqRows.map(r => r.EquipmentID));
                    const missingIds = cleanEquipmentIds.filter(id => !foundIds.has(id));
                    const error = new Error(`Thiết bị với ID [${missingIds.join(', ')}] không tồn tại trong hệ thống.`);
                    error.status = 404;
                    throw error;
                }

                // b. Quy tắc 1: Chặn mượn thiết bị đang bảo trì hoặc hư hỏng (Status != 'Available')
                const unavailableEq = eqRows.find(r => (r.Status || '').toLowerCase() !== 'available');
                if (unavailableEq) {
                    const statusText = (unavailableEq.Status || '').toLowerCase() === 'maintenance'
                        ? 'bảo trì'
                        : ((unavailableEq.Status || '').toLowerCase() === 'broken' ? 'hư hỏng' : unavailableEq.Status);
                    const error = new Error(`Thiết bị "${unavailableEq.EquipmentName}" hiện đang ở trạng thái ${statusText}, không thể mượn.`);
                    error.status = 400;
                    throw error;
                }

                // c. Quy tắc 2: Chặn mượn thiết bị trùng khung giờ (Equipment Overlap Concurrency)
                const eqOverlapQuery = `
                    SELECT 
                        e.EquipmentID, 
                        e.EquipmentName, 
                        m.MeetingID, 
                        m.Title, 
                        m.StartTime, 
                        m.EndTime, 
                        r.RoomName
                    FROM Booking_Equipments be
                    JOIN Equipments e ON be.EquipmentID = e.EquipmentID
                    JOIN Bookings b ON be.BookingID = b.BookingID
                    JOIN Meetings m ON b.MeetingID = m.MeetingID
                    JOIN Rooms r ON b.RoomID = r.RoomID
                    WHERE be.EquipmentID IN (?)
                      AND b.BookingStatus = 'Confirmed'
                      AND (m.StartTime < ?) AND (m.EndTime > ?)
                    FOR UPDATE
                `;
                const [conflicts] = await connection.query(eqOverlapQuery, [cleanEquipmentIds, endTime, startTime]);
                if (conflicts.length > 0) {
                    const conflict = conflicts[0];
                    const error = new Error(`Thiết bị "${conflict.EquipmentName}" đã được đặt cho cuộc họp "${conflict.Title}" tại "${conflict.RoomName}" trong khung giờ này.`);
                    error.status = 409;
                    throw error;
                }
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

            // 7. Thêm danh sách Thiết bị yêu cầu (Booking_Equipments) nếu có
            if (cleanEquipmentIds.length > 0) {
                for (const eqId of cleanEquipmentIds) {
                    await connection.query(
                        'INSERT INTO Booking_Equipments (BookingID, EquipmentID, Quantity) VALUES (?, ?, 1)',
                        [bookingId, eqId]
                    );
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
            if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
                const conflictError = new Error('Tài nguyên thiết bị hoặc phòng họp đang có giao dịch song song. Đã kích hoạt cơ chế chống Race Condition.');
                conflictError.status = 409;
                throw conflictError;
            }
            throw error;
        } finally {
            connection.release();
        }
    },

    // Kiểm tra trùng giờ khi cập nhật (loại trừ cuộc họp đang sửa)
    checkOverlapUpdate: async (roomId, startTime, endTime, currentMeetingId) => {
        const query = `
            SELECT m.MeetingID 
            FROM Meetings m
            JOIN Bookings b ON m.MeetingID = b.MeetingID
            WHERE b.RoomID = ? 
            AND b.BookingStatus = 'Confirmed'
            AND m.MeetingID != ? 
            AND (m.StartTime < ?) AND (m.EndTime > ?)
        `;
        // Thứ tự truyền: roomId, currentMeetingId, endTime mới, startTime mới
        const [rows] = await db.execute(query, [roomId, currentMeetingId, endTime, startTime]);
        return rows.length > 0;
    },

    /**
     * Lấy chi tiết một cuộc họp theo ID kèm phòng, người tổ chức, thiết bị và người tham gia (với trạng thái phản hồi)
     */
    getById: async (meetingId) => {
        const query = `
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
            FROM Meetings m
            LEFT JOIN Users u ON m.OrganizerID = u.UserID
            LEFT JOIN Bookings b ON m.MeetingID = b.MeetingID
            LEFT JOIN Rooms r ON b.RoomID = r.RoomID
            WHERE m.MeetingID = ?
        `;
        const [rows] = await db.execute(query, [meetingId]);
        if (rows.length === 0) return null;

        const meeting = rows[0];

        // Lấy danh sách người tham gia kèm trạng thái phản hồi
        const [participants] = await db.execute(`
            SELECT 
                mp.UserID         AS userId,
                u.FullName        AS fullName,
                u.Email           AS email,
                u.Role            AS role,
                mp.ResponseStatus AS responseStatus
            FROM Meeting_Participants mp
            JOIN Users u ON mp.UserID = u.UserID
            WHERE mp.MeetingID = ?
            ORDER BY u.FullName ASC
        `, [meetingId]);

        // Lấy danh sách thiết bị đã đặt
        let equipments = [];
        if (meeting.bookingId) {
            const [eqRows] = await db.execute(`
                SELECT 
                    e.EquipmentID   AS equipmentId,
                    e.EquipmentName AS equipmentName,
                    e.Type          AS type,
                    e.Status        AS status
                FROM Booking_Equipments be
                JOIN Equipments e ON be.EquipmentID = e.EquipmentID
                WHERE be.BookingID = ?
            `, [meeting.bookingId]);
            equipments = eqRows;
        }

        return {
            ...meeting,
            participants,
            equipments
        };
    },

    // Thực thi cập nhật
    update: async (meetingId, meetingData) => {
        const { title, description, startTime, endTime, organizerId, isRecurring, roomId, participantIds, equipmentIds } = meetingData;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // KIỂM TRA SỰ TỒN TẠI TRƯỚC KHI CẬP NHẬT
            const [existing] = await connection.execute('SELECT MeetingID FROM Meetings WHERE MeetingID = ?', [meetingId]);
            if (existing.length === 0) {
                const error = new Error(`Cuộc họp với ID ${meetingId} không tồn tại.`);
                error.status = 404; // Gắn cờ lỗi 404 để Controller nhận biết
                throw error;
            }

            // 1. Cập nhật bảng Meetings (Thống nhất dùng execute)
            const updateMeetingQuery = `
                UPDATE Meetings 
                SET Title = ?, Description = ?, StartTime = ?, EndTime = ?, OrganizerID = ?, IsRecurring = ?
                WHERE MeetingID = ?
            `;
            await connection.execute(updateMeetingQuery, [
                title, description || null, startTime, endTime, organizerId, isRecurring || false, meetingId
            ]);

            // 2. Cập nhật bảng Bookings (Thống nhất dùng execute)
            const updateBookingQuery = `
                UPDATE Bookings 
                SET RoomID = ?
                WHERE MeetingID = ?
            `;
            await connection.execute(updateBookingQuery, [roomId, meetingId]);

            // Lấy BookingID phục vụ cập nhật thiết bị
            const [bookingRows] = await connection.execute('SELECT BookingID FROM Bookings WHERE MeetingID = ?', [meetingId]);
            const bookingId = bookingRows.length > 0 ? bookingRows[0].BookingID : null;

            // 3. Cập nhật bảng Meeting_Participants nếu có truyền participantIds
            if (participantIds !== undefined && Array.isArray(participantIds)) {
                const cleanIds = [...new Set(participantIds.map(Number).filter(id => Number.isInteger(id) && id > 0))];
                if (cleanIds.length === 0) {
                    await connection.execute('DELETE FROM Meeting_Participants WHERE MeetingID = ?', [meetingId]);
                } else {
                    // Xóa những người không còn trong danh sách mới
                    const placeholders = cleanIds.map(() => '?').join(',');
                    await connection.query(
                        `DELETE FROM Meeting_Participants WHERE MeetingID = ? AND UserID NOT IN (${placeholders})`,
                        [meetingId, ...cleanIds]
                    );
                    // Thêm người mới với trạng thái 'Pending' (giữ nguyên nếu đã có bằng INSERT IGNORE)
                    for (const uId of cleanIds) {
                        await connection.query(
                            'INSERT IGNORE INTO Meeting_Participants (MeetingID, UserID, ResponseStatus) VALUES (?, ?, ?)',
                            [meetingId, uId, 'Pending']
                        );
                    }
                }
            }

            // 4. Cập nhật và kiểm tra bảng Booking_Equipments nếu có truyền equipmentIds
            if (equipmentIds !== undefined && Array.isArray(equipmentIds) && bookingId) {
                const cleanEqIds = [...new Set(equipmentIds.map(Number).filter(id => Number.isInteger(id) && id > 0))];
                if (cleanEqIds.length === 0) {
                    await connection.execute('DELETE FROM Booking_Equipments WHERE BookingID = ?', [bookingId]);
                } else {
                    // a. Khóa dòng và kiểm tra sự tồn tại của thiết bị
                    const [eqRows] = await connection.query(
                        'SELECT EquipmentID, EquipmentName, Status FROM Equipments WHERE EquipmentID IN (?) FOR UPDATE',
                        [cleanEqIds]
                    );

                    if (eqRows.length !== cleanEqIds.length) {
                        const foundIds = new Set(eqRows.map(r => r.EquipmentID));
                        const missingIds = cleanEqIds.filter(id => !foundIds.has(id));
                        const error = new Error(`Thiết bị với ID [${missingIds.join(', ')}] không tồn tại trong hệ thống.`);
                        error.status = 404;
                        throw error;
                    }

                    // b. Quy tắc 1: Chặn thiết bị đang bảo trì hoặc hư hỏng (Status != 'Available')
                    const unavailableEq = eqRows.find(r => (r.Status || '').toLowerCase() !== 'available');
                    if (unavailableEq) {
                        const statusText = (unavailableEq.Status || '').toLowerCase() === 'maintenance'
                            ? 'bảo trì'
                            : ((unavailableEq.Status || '').toLowerCase() === 'broken' ? 'hư hỏng' : unavailableEq.Status);
                        const error = new Error(`Thiết bị "${unavailableEq.EquipmentName}" hiện đang ở trạng thái ${statusText}, không thể mượn.`);
                        error.status = 400;
                        throw error;
                    }

                    // c. Quy tắc 2: Chặn trùng lịch với cuộc họp khác (loại trừ chính meetingId)
                    const eqOverlapQuery = `
                        SELECT 
                            e.EquipmentID, 
                            e.EquipmentName, 
                            m.MeetingID, 
                            m.Title, 
                            r.RoomName
                        FROM Booking_Equipments be
                        JOIN Equipments e ON be.EquipmentID = e.EquipmentID
                        JOIN Bookings b ON be.BookingID = b.BookingID
                        JOIN Meetings m ON b.MeetingID = m.MeetingID
                        JOIN Rooms r ON b.RoomID = r.RoomID
                        WHERE be.EquipmentID IN (?)
                          AND b.BookingStatus = 'Confirmed'
                          AND m.MeetingID != ?
                          AND (m.StartTime < ?) AND (m.EndTime > ?)
                        FOR UPDATE
                    `;
                    const [conflicts] = await connection.query(eqOverlapQuery, [cleanEqIds, meetingId, endTime, startTime]);
                    if (conflicts.length > 0) {
                        const conflict = conflicts[0];
                        const error = new Error(`Thiết bị "${conflict.EquipmentName}" đã được đặt cho cuộc họp "${conflict.Title}" tại "${conflict.RoomName}" trong khung giờ này.`);
                        error.status = 409;
                        throw error;
                    }

                    // Đồng bộ lại thiết bị
                    await connection.execute('DELETE FROM Booking_Equipments WHERE BookingID = ?', [bookingId]);
                    for (const eqId of cleanEqIds) {
                        await connection.query(
                            'INSERT INTO Booking_Equipments (BookingID, EquipmentID, Quantity) VALUES (?, ?, 1)',
                            [bookingId, eqId]
                        );
                    }
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
                const conflictError = new Error('Tài nguyên thiết bị hoặc phòng họp đang có giao dịch song song. Đã kích hoạt cơ chế chống Race Condition.');
                conflictError.status = 409;
                throw conflictError;
            }
            throw error; // Ném lỗi ra để Controller bắt lấy
        } finally {
            connection.release();
        }
    }
};

module.exports = Meeting;