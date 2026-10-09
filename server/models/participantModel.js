const db = require('../config/database');

const Participant = {
    /**
     * Lấy danh sách người tham gia của một cuộc họp kèm trạng thái phản hồi
     * @param {number} meetingId - ID cuộc họp
     * @returns {Object} Thông tin cuộc họp, thống kê summary và danh sách người tham gia
     */
    getByMeetingId: async (meetingId) => {
        // 1. Kiểm tra sự tồn tại của cuộc họp
        const meetingQuery = `
            SELECT 
                m.MeetingID   AS meetingId,
                m.Title       AS title,
                m.StartTime   AS startTime,
                m.EndTime     AS endTime,
                m.OrganizerID AS organizerId,
                u.FullName    AS organizerName,
                u.Email       AS organizerEmail
            FROM Meetings m
            LEFT JOIN Users u ON m.OrganizerID = u.UserID
            WHERE m.MeetingID = ?
        `;
        const [meetings] = await db.execute(meetingQuery, [meetingId]);
        if (meetings.length === 0) {
            const error = new Error(`Cuộc họp với ID ${meetingId} không tồn tại.`);
            error.status = 404;
            throw error;
        }

        const meetingInfo = meetings[0];

        // 2. Lấy danh sách người tham gia và trạng thái phản hồi
        const participantQuery = `
            SELECT 
                mp.UserID         AS userId,
                u.FullName        AS fullName,
                u.Email           AS email,
                u.Role            AS role,
                mp.ResponseStatus AS responseStatus
            FROM Meeting_Participants mp
            JOIN Users u ON mp.UserID = u.UserID
            WHERE mp.MeetingID = ?
            ORDER BY 
                CASE mp.ResponseStatus
                    WHEN 'Accepted' THEN 1
                    WHEN 'Pending' THEN 2
                    WHEN 'Tentative' THEN 3
                    WHEN 'Declined' THEN 4
                    ELSE 5
                END,
                u.FullName ASC
        `;
        const [participantRows] = await db.execute(participantQuery, [meetingId]);

        // 3. Tính toán thống kê trạng thái phản hồi
        const summary = {
            total: participantRows.length,
            accepted: participantRows.filter(p => p.responseStatus === 'Accepted').length,
            declined: participantRows.filter(p => p.responseStatus === 'Declined').length,
            pending: participantRows.filter(p => p.responseStatus === 'Pending').length,
            tentative: participantRows.filter(p => p.responseStatus === 'Tentative').length
        };

        return {
            meetingId: meetingInfo.meetingId,
            title: meetingInfo.title,
            startTime: meetingInfo.startTime,
            endTime: meetingInfo.endTime,
            organizer: {
                userId: meetingInfo.organizerId,
                fullName: meetingInfo.organizerName,
                email: meetingInfo.organizerEmail
            },
            summary,
            participants: participantRows
        };
    },

    /**
     * Cập nhật trạng thái phản hồi của một người tham gia
     * @param {number} meetingId - ID cuộc họp
     * @param {number} userId - ID người tham gia
     * @param {string} responseStatus - Trạng thái mới: 'Accepted' | 'Declined' | 'Tentative' | 'Pending'
     * @returns {Object} Thông tin cập nhật
     */
    updateResponseStatus: async (meetingId, userId, responseStatus) => {
        // 1. Kiểm tra cuộc họp tồn tại
        const [meetings] = await db.execute('SELECT MeetingID, Title FROM Meetings WHERE MeetingID = ?', [meetingId]);
        if (meetings.length === 0) {
            const error = new Error(`Cuộc họp với ID ${meetingId} không tồn tại.`);
            error.status = 404;
            throw error;
        }

        // 2. Kiểm tra xem người dùng có trong danh sách người tham gia cuộc họp không
        const checkQuery = `
            SELECT 
                mp.MeetingID,
                mp.UserID,
                mp.ResponseStatus AS currentStatus,
                u.FullName,
                u.Email
            FROM Meeting_Participants mp
            JOIN Users u ON mp.UserID = u.UserID
            WHERE mp.MeetingID = ? AND mp.UserID = ?
        `;
        const [existing] = await db.execute(checkQuery, [meetingId, userId]);

        if (existing.length === 0) {
            const error = new Error(
                `Người dùng với ID ${userId} không nằm trong danh sách người tham gia cuộc họp #${meetingId}.`
            );
            error.status = 404;
            throw error;
        }

        const participant = existing[0];
        const oldStatus = participant.currentStatus;

        // 3. Thực hiện cập nhật ResponseStatus
        const updateQuery = `
            UPDATE Meeting_Participants 
            SET ResponseStatus = ?
            WHERE MeetingID = ? AND UserID = ?
        `;
        await db.execute(updateQuery, [responseStatus, meetingId, userId]);

        return {
            meetingId: Number(meetingId),
            userId: Number(userId),
            fullName: participant.FullName,
            email: participant.Email,
            previousStatus: oldStatus,
            responseStatus,
            updatedAt: new Date().toISOString()
        };
    },

    /**
     * Thêm danh sách người tham gia vào cuộc họp (Mời thêm người)
     * @param {number} meetingId - ID cuộc họp
     * @param {number[]} participantIds - Danh sách UserID
     * @returns {Object} Kết quả thêm
     */
    addParticipants: async (meetingId, participantIds) => {
        // 1. Kiểm tra cuộc họp tồn tại
        const [meetings] = await db.execute('SELECT MeetingID FROM Meetings WHERE MeetingID = ?', [meetingId]);
        if (meetings.length === 0) {
            const error = new Error(`Cuộc họp với ID ${meetingId} không tồn tại.`);
            error.status = 404;
            throw error;
        }

        // 2. Kiểm tra các UserID có tồn tại trong hệ thống không
        const placeholders = participantIds.map(() => '?').join(',');
        const [validUsers] = await db.query(
            `SELECT UserID, FullName, Email FROM Users WHERE UserID IN (${placeholders})`,
            participantIds
        );

        if (validUsers.length === 0) {
            const error = new Error('Không tìm thấy người dùng nào hợp lệ trong danh sách ID cung cấp.');
            error.status = 404;
            throw error;
        }

        // 3. Thêm vào Meeting_Participants với ResponseStatus = 'Pending'
        let addedCount = 0;
        for (const user of validUsers) {
            const [insertResult] = await db.query(
                'INSERT IGNORE INTO Meeting_Participants (MeetingID, UserID, ResponseStatus) VALUES (?, ?, ?)',
                [meetingId, user.UserID, 'Pending']
            );
            if (insertResult.affectedRows > 0) {
                addedCount++;
            }
        }

        return {
            meetingId: Number(meetingId),
            requestedCount: participantIds.length,
            validUsersFound: validUsers.length,
            addedCount,
            participants: validUsers.map(u => ({
                userId: u.UserID,
                fullName: u.FullName,
                email: u.Email,
                responseStatus: 'Pending'
            }))
        };
    },

    /**
     * Xóa một người tham gia khỏi cuộc họp
     * @param {number} meetingId 
     * @param {number} userId 
     */
    removeParticipant: async (meetingId, userId) => {
        // Kiểm tra tồn tại
        const [existing] = await db.execute(
            'SELECT MeetingID FROM Meeting_Participants WHERE MeetingID = ? AND UserID = ?',
            [meetingId, userId]
        );
        if (existing.length === 0) {
            const error = new Error(`Người dùng ID ${userId} không nằm trong danh sách cuộc họp ID ${meetingId}.`);
            error.status = 404;
            throw error;
        }

        await db.execute(
            'DELETE FROM Meeting_Participants WHERE MeetingID = ? AND UserID = ?',
            [meetingId, userId]
        );
        return true;
    },

    /**
     * Đồng bộ danh sách người tham gia trong một Database Transaction (dùng khi Sửa cuộc họp)
     * Giữ nguyên ResponseStatus của những người đã phản hồi, thêm người mới với 'Pending'
     * @param {number} meetingId 
     * @param {number[]} participantIds 
     * @param {Object} connection - MySQL Transaction Connection
     */
    syncParticipants: async (meetingId, participantIds, connection) => {
        if (!Array.isArray(participantIds)) return;

        const cleanIds = [...new Set(participantIds.map(Number).filter(id => Number.isInteger(id) && id > 0))];

        if (cleanIds.length === 0) {
            // Nếu gửi mảng rỗng -> xóa sạch người tham gia
            await connection.execute('DELETE FROM Meeting_Participants WHERE MeetingID = ?', [meetingId]);
            return;
        }

        // 1. Xóa những người không còn nằm trong danh sách mới
        const placeholders = cleanIds.map(() => '?').join(',');
        await connection.query(
            `DELETE FROM Meeting_Participants WHERE MeetingID = ? AND UserID NOT IN (${placeholders})`,
            [meetingId, ...cleanIds]
        );

        // 2. Thêm những người mới với trạng thái 'Pending' (nếu đã có thì INSERT IGNORE giữ nguyên ResponseStatus)
        for (const uId of cleanIds) {
            await connection.query(
                'INSERT IGNORE INTO Meeting_Participants (MeetingID, UserID, ResponseStatus) VALUES (?, ?, ?)',
                [meetingId, uId, 'Pending']
            );
        }
    }
};

module.exports = Participant;
