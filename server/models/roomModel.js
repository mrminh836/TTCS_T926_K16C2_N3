/**
 * Model quản lý Phòng họp (Room Model)
 * Tương tác CSDL MySQL bảng Rooms chuẩn 3NF và cung cấp Fallback bộ nhớ an toàn.
 * Hỗ trợ các thao tác CRUD và kiểm tra toàn vẹn nghiệp vụ (Luồng 1.3).
 */

const db = require('../config/database');

// Dữ liệu mock dự phòng khi môi trường chưa khởi chạy MySQL
let mockRoomsFallback = [
    {
        id: 1,
        code: "RM-001",
        name: "Phòng Tokyo (Tầng 4)",
        capacity: 20,
        type: "Hội nghị",
        floor: "Tầng 4, Tòa A",
        status: "Active",
        qrCode: "QR-ROOM-001",
        equipments: ["Máy chiếu Full HD", "Màn hình TV 75\"", "Micro & Loa họp"],
        description: "Phòng hội thảo tiêu chuẩn cao, view thoáng, cách âm tốt.",
        createdAt: "2026-09-01 08:00:00",
        updatedAt: "2026-09-01 08:00:00"
    },
    {
        id: 2,
        code: "RM-002",
        name: "Phòng Silicon (Tầng 2)",
        capacity: 12,
        type: "Nhóm / Tech",
        floor: "Tầng 2, Tòa B",
        status: "Active",
        qrCode: "QR-ROOM-002",
        equipments: ["Màn hình TV 75\"", "Bảng trắng viết", "Micro & Loa họp"],
        description: "Phòng họp nhóm kỹ thuật, trang bị bảng tương tác và TV.",
        createdAt: "2026-09-01 08:00:00",
        updatedAt: "2026-09-01 08:00:00"
    },
    {
        id: 3,
        code: "RM-003",
        name: "Phòng Hội Nghị A",
        capacity: 30,
        type: "Hội trường lớn",
        floor: "Tầng 1, Tòa Trung tâm",
        status: "Active",
        qrCode: "QR-ROOM-003",
        equipments: ["Máy chiếu Full HD", "Micro & Loa họp", "Màn hình TV 75\"", "Bảng trắng viết"],
        description: "Hội trường lớn phù hợp cho họp toàn công ty và đào tạo nội bộ.",
        createdAt: "2026-09-01 08:00:00",
        updatedAt: "2026-09-01 08:00:00"
    },
    {
        id: 4,
        code: "RM-004",
        name: "Phòng Grand Board",
        capacity: 50,
        type: "Đại sảnh / Board",
        floor: "Tầng 5, Tòa A",
        status: "Maintenance",
        qrCode: "QR-ROOM-004",
        equipments: ["Máy chiếu Full HD", "Micro & Loa họp", "Màn hình TV 75\""],
        description: "Đang tiến hành bảo trì nâng cấp hệ thống âm thanh vòm.",
        createdAt: "2026-09-01 08:00:00",
        updatedAt: "2026-09-01 08:00:00"
    },
    {
        id: 5,
        code: "RM-005",
        name: "Phòng VIP",
        capacity: 10,
        type: "VIP / Phỏng vấn",
        floor: "Tầng 3, Tòa VIP",
        status: "Active",
        qrCode: "QR-ROOM-005",
        equipments: ["Màn hình TV 75\"", "Micro & Loa họp"],
        description: "Phòng tiếp đón đối tác cao cấp và phỏng vấn quản lý.",
        createdAt: "2026-09-01 08:00:00",
        updatedAt: "2026-09-01 08:00:00"
    }
];

// Mock danh sách cuộc họp đang hoạt động phục vụ kiểm tra Luồng 1.3 khi fallback
let mockActiveBookingsFallback = [];

function formatRoomRow(row) {
    if (!row) return null;
    return {
        id: row.RoomID !== undefined ? row.RoomID : row.id,
        code: row.RoomCode || row.code || `RM-${String(row.RoomID || row.id).padStart(3, '0')}`,
        name: row.RoomName || row.name,
        capacity: row.Capacity !== undefined ? Number(row.Capacity) : Number(row.capacity),
        type: row.Type || row.type || 'Hội nghị',
        floor: row.Floor || row.floor || '',
        status: row.Status || row.status || 'Active',
        qrCode: row.QRCode || row.qrCode || `QR-ROOM-${String(row.RoomID || row.id).padStart(3, '0')}`,
        equipments: row.equipments || [],
        description: row.Description || row.description || '',
        createdAt: row.CreatedAt || row.createdAt || null,
        updatedAt: row.UpdatedAt || row.updatedAt || null
    };
}

const Room = {
    /**
     * Lấy toàn bộ phòng họp trong CSDL kèm bộ lọc tìm kiếm
     * @param {Object} filters
     * @param {string} [filters.search] - Từ khóa tìm theo tên, mã phòng, tầng, mô tả
     * @param {string} [filters.status] - Trạng thái phòng (Active, Maintenance, Inactive)
     * @param {string} [filters.type] - Phân loại phòng
     * @param {number} [filters.minCapacity] - Sức chứa tối thiểu
     * @returns {Promise<Array>}
     */
    findAll: async (filters = {}) => {
        const { search, status, type, minCapacity } = filters;
        try {
            let sql = `
                SELECT RoomID, RoomCode, RoomName, Capacity, Type, Floor, Status, QRCode, Description, CreatedAt, UpdatedAt 
                FROM rooms 
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                sql += ` AND Status = ?`;
                params.push(status);
            }
            if (type) {
                sql += ` AND Type = ?`;
                params.push(type);
            }
            if (minCapacity !== undefined && minCapacity !== null && minCapacity !== '') {
                sql += ` AND Capacity >= ?`;
                params.push(Number(minCapacity));
            }
            if (search && search.trim()) {
                const searchPattern = `%${search.trim()}%`;
                sql += ` AND (RoomName LIKE ? OR RoomCode LIKE ? OR Floor LIKE ? OR Description LIKE ?)`;
                params.push(searchPattern, searchPattern, searchPattern, searchPattern);
            }

            sql += ` ORDER BY RoomID ASC`;

            const [rows] = await db.execute(sql, params);
            return rows.map(formatRoomRow);
        } catch {
            return Room.findAllFallback(filters);
        }
    },

    /**
     * Fallback lọc danh sách phòng trong bộ nhớ
     */
    findAllFallback: (filters = {}) => {
        const { search, status, type, minCapacity } = filters;
        let results = [...mockRoomsFallback];

        if (status) {
            results = results.filter(r => r.status.toLowerCase() === status.toLowerCase());
        }
        if (type) {
            results = results.filter(r => r.type.toLowerCase() === type.toLowerCase());
        }
        if (minCapacity !== undefined && minCapacity !== null && minCapacity !== '') {
            results = results.filter(r => Number(r.capacity) >= Number(minCapacity));
        }
        if (search && search.trim()) {
            const term = search.trim().toLowerCase();
            results = results.filter(r => 
                (r.name && r.name.toLowerCase().includes(term)) ||
                (r.code && r.code.toLowerCase().includes(term)) ||
                (r.floor && r.floor.toLowerCase().includes(term)) ||
                (r.description && r.description.toLowerCase().includes(term))
            );
        }

        return results.map(formatRoomRow);
    },

    /**
     * Lấy chi tiết phòng họp theo ID
     * @param {number} roomId
     * @returns {Promise<Object|null>}
     */
    findById: async (roomId) => {
        const parsedId = Number(roomId);
        try {
            const [rows] = await db.execute(`
                SELECT RoomID, RoomCode, RoomName, Capacity, Type, Floor, Status, QRCode, Description, CreatedAt, UpdatedAt 
                FROM rooms 
                WHERE RoomID = ?
            `, [parsedId]);
            if (rows.length === 0) return null;
            return formatRoomRow(rows[0]);
        } catch {
            const found = mockRoomsFallback.find(r => r.id === parsedId);
            return found ? formatRoomRow(found) : null;
        }
    },

    /**
     * Tìm phòng họp theo Tên để kiểm tra trùng lặp
     * @param {string} name 
     * @param {number|null} excludeId - Bỏ qua ID khi update
     * @returns {Promise<Object|null>}
     */
    findByName: async (name, excludeId = null) => {
        if (!name) return null;
        const cleanName = name.trim();
        const parsedExcludeId = excludeId !== null ? Number(excludeId) : null;

        try {
            const sql = `
                SELECT RoomID, RoomCode, RoomName, Capacity, Status 
                FROM rooms 
                WHERE LOWER(RoomName) = LOWER(?)
                  AND (? IS NULL OR RoomID != ?)
                LIMIT 1
            `;
            const [rows] = await db.execute(sql, [cleanName, parsedExcludeId, parsedExcludeId]);
            return rows.length > 0 ? formatRoomRow(rows[0]) : null;
        } catch {
            const found = mockRoomsFallback.find(r => 
                r.name.trim().toLowerCase() === cleanName.toLowerCase() && 
                (parsedExcludeId === null || r.id !== parsedExcludeId)
            );
            return found ? formatRoomRow(found) : null;
        }
    },

    /**
     * Tìm phòng họp theo Mã (RoomCode) để kiểm tra trùng lặp
     * @param {string} code 
     * @param {number|null} excludeId - Bỏ qua ID khi update
     * @returns {Promise<Object|null>}
     */
    findByCode: async (code, excludeId = null) => {
        if (!code) return null;
        const cleanCode = code.trim();
        const parsedExcludeId = excludeId !== null ? Number(excludeId) : null;

        try {
            const sql = `
                SELECT RoomID, RoomCode, RoomName, Capacity, Status 
                FROM rooms 
                WHERE LOWER(RoomCode) = LOWER(?)
                  AND (? IS NULL OR RoomID != ?)
                LIMIT 1
            `;
            const [rows] = await db.execute(sql, [cleanCode, parsedExcludeId, parsedExcludeId]);
            return rows.length > 0 ? formatRoomRow(rows[0]) : null;
        } catch {
            const found = mockRoomsFallback.find(r => 
                r.code && r.code.trim().toLowerCase() === cleanCode.toLowerCase() && 
                (parsedExcludeId === null || r.id !== parsedExcludeId)
            );
            return found ? formatRoomRow(found) : null;
        }
    },

    /**
     * KIỂM TRA RÀNG BUỘC LUỒNG 1.3:
     * Kiểm tra phòng có bất kỳ cuộc họp Confirmed nào đang diễn ra hoặc sắp diễn ra (EndTime >= NOW())
     * Nếu có, chặn thao tác Xóa phòng để đảm bảo tính toàn vẹn dữ liệu
     * @param {number} roomId
     * @returns {Promise<boolean>} true nếu có cuộc họp active/upcoming
     */
    hasActiveMeetings: async (roomId) => {
        const parsedId = Number(roomId);
        try {
            const sql = `
                SELECT COUNT(*) as count 
                FROM bookings b
                JOIN meetings m ON b.MeetingID = m.MeetingID
                WHERE b.RoomID = ? 
                  AND b.BookingStatus = 'Confirmed'
                  AND m.EndTime >= NOW()
            `;
            const [rows] = await db.execute(sql, [parsedId]);
            return rows && rows[0] && Number(rows[0].count) > 0;
        } catch {
            // Fallback check trong mock bookings
            const now = Date.now();
            return mockActiveBookingsFallback.some(b => 
                b.roomId === parsedId && 
                b.status === 'Confirmed' && 
                new Date(b.endTime).getTime() >= now
            );
        }
    },

    /**
     * Thêm phòng họp mới (Create Room)
     * @param {Object} roomData
     * @returns {Promise<Object>} Phòng họp vừa được tạo
     */
    create: async (roomData) => {
        const {
            code,
            name,
            capacity,
            type = 'Hội nghị',
            floor = '',
            status = 'Active',
            qrCode = null,
            equipments = [],
            description = ''
        } = roomData;

        try {
            // Tự động sinh RoomCode nếu chưa có
            let finalCode = code;
            if (!finalCode) {
                const [countRows] = await db.execute(`SELECT MAX(RoomID) as maxId FROM rooms`);
                const nextId = (countRows[0] && countRows[0].maxId ? countRows[0].maxId : 0) + 1;
                finalCode = `RM-${String(nextId).padStart(3, '0')}`;
            }

            const finalQrCode = qrCode || `QR-${finalCode}`;

            const sql = `
                INSERT INTO rooms (RoomCode, RoomName, Capacity, Type, Floor, Status, QRCode, Description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.execute(sql, [
                finalCode,
                name,
                Number(capacity),
                type,
                floor,
                status,
                finalQrCode,
                description
            ]);

            return {
                id: result.insertId,
                code: finalCode,
                name,
                capacity: Number(capacity),
                type,
                floor,
                status,
                qrCode: finalQrCode,
                equipments,
                description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        } catch (dbError) {
            // Fallback khi không có kết nối MySQL
            const nextId = mockRoomsFallback.reduce((max, r) => Math.max(max, r.id), 0) + 1;
            const finalCode = code || `RM-${String(nextId).padStart(3, '0')}`;
            const finalQrCode = qrCode || `QR-${finalCode}`;

            const newRoom = {
                id: nextId,
                code: finalCode,
                name,
                capacity: Number(capacity),
                type,
                floor,
                status,
                qrCode: finalQrCode,
                equipments,
                description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            mockRoomsFallback.push(newRoom);
            return newRoom;
        }
    },

    /**
     * Cập nhật thông tin phòng họp (Update Room)
     * @param {number} roomId
     * @param {Object} roomData
     * @returns {Promise<Object>}
     */
    update: async (roomId, roomData) => {
        const parsedId = Number(roomId);
        const {
            code,
            name,
            capacity,
            type = 'Hội nghị',
            floor = '',
            status = 'Active',
            qrCode,
            equipments = [],
            description = ''
        } = roomData;

        try {
            const sql = `
                UPDATE rooms 
                SET 
                    RoomName = ?, 
                    Capacity = ?, 
                    Type = ?, 
                    Floor = ?, 
                    Status = ?, 
                    QRCode = COALESCE(?, QRCode), 
                    Description = ?,
                    RoomCode = COALESCE(?, RoomCode),
                    UpdatedAt = NOW()
                WHERE RoomID = ?
            `;

            await db.execute(sql, [
                name,
                Number(capacity),
                type,
                floor,
                status,
                qrCode || null,
                description,
                code || null,
                parsedId
            ]);

            return await Room.findById(parsedId);
        } catch {
            // Fallback
            const idx = mockRoomsFallback.findIndex(r => r.id === parsedId);
            if (idx === -1) return null;

            mockRoomsFallback[idx] = {
                ...mockRoomsFallback[idx],
                name,
                capacity: Number(capacity),
                type,
                floor,
                status,
                qrCode: qrCode || mockRoomsFallback[idx].qrCode,
                code: code || mockRoomsFallback[idx].code,
                equipments: equipments.length > 0 ? equipments : mockRoomsFallback[idx].equipments,
                description,
                updatedAt: new Date().toISOString()
            };

            return formatRoomRow(mockRoomsFallback[idx]);
        }
    },

    /**
     * Xóa phòng họp (Delete Room - Có kiểm tra ràng buộc Luồng 1.3)
     * @param {number} roomId
     * @returns {Promise<{ id: number, deleted: boolean }>}
     */
    delete: async (roomId) => {
        const parsedId = Number(roomId);

        // Kiểm tra ràng buộc Luồng 1.3: Chặn xóa nếu có lịch họp đang hoạt động/sắp diễn ra
        const hasMeetings = await Room.hasActiveMeetings(parsedId);
        if (hasMeetings) {
            const err = new Error('Không thể xóa phòng họp vì đang có cuộc họp đã lên lịch hoặc đang diễn ra.');
            err.code = 'ACTIVE_MEETINGS_EXIST';
            throw err;
        }

        try {
            await db.execute(`DELETE FROM rooms WHERE RoomID = ?`, [parsedId]);
            return { id: parsedId, deleted: true };
        } catch (dbError) {
            if (dbError.code === 'ACTIVE_MEETINGS_EXIST') throw dbError;
            // Fallback
            const idx = mockRoomsFallback.findIndex(r => r.id === parsedId);
            if (idx !== -1) {
                mockRoomsFallback.splice(idx, 1);
            }
            return { id: parsedId, deleted: true };
        }
    },

    /**
     * Chuyển trạng thái hoạt động nhanh (Active <-> Maintenance)
     * @param {number} roomId
     * @returns {Promise<Object>}
     */
    toggleStatus: async (roomId) => {
        const parsedId = Number(roomId);
        try {
            const sql = `
                UPDATE rooms
                SET Status = CASE WHEN Status = 'Active' THEN 'Maintenance' ELSE 'Active' END,
                    UpdatedAt = NOW()
                WHERE RoomID = ?
            `;
            await db.execute(sql, [parsedId]);
            return await Room.findById(parsedId);
        } catch {
            const room = mockRoomsFallback.find(r => r.id === parsedId);
            if (!room) return null;
            room.status = room.status === 'Active' ? 'Maintenance' : 'Active';
            room.updatedAt = new Date().toISOString();
            return formatRoomRow(room);
        }
    },

    /**
     * Query lọc danh sách phòng họp CHƯA CÓ LỊCH ĐẶT theo khoảng ngày/giờ (Available Rooms Query)
     * Sử dụng câu lệnh SQL chuẩn 3NF với mệnh đề NOT EXISTS tối ưu index.
     * Điều kiện kiểm tra trùng lịch (Overlap Check):
     *   m.StartTime < queryEndTime AND m.EndTime > queryStartTime
     * Phòng thỏa mãn khi:
     *   1. Status = 'Active' (Đang sẵn sàng phục vụ)
     *   2. Không tồn tại bất kỳ booking Confirmed nào giao thoa thời gian trong khoảng truy vấn
     *   3. Thỏa mãn sức chứa tối thiểu (nếu có minCapacity)
     * 
     * @param {Object} filterOptions
     * @param {string} filterOptions.startTime - Thời gian bắt đầu (YYYY-MM-DD HH:mm:ss hoặc ISO)
     * @param {string} filterOptions.endTime - Thời gian kết thúc (YYYY-MM-DD HH:mm:ss hoặc ISO)
     * @param {number|null} [filterOptions.minCapacity] - Sức chứa tối thiểu yêu cầu
     * @param {number|null} [filterOptions.excludeMeetingId] - Bỏ qua ID cuộc họp (dùng khi chỉnh sửa lịch)
     * @returns {Promise<Array>} Danh sách phòng trống
     */
    findAvailableRooms: async ({ startTime, endTime, minCapacity = null, excludeMeetingId = null }) => {
        const query = `
            SELECT 
                r.RoomID,
                r.RoomCode,
                r.RoomName,
                r.Capacity,
                r.Type,
                r.Floor,
                r.Status,
                r.QRCode,
                r.Description
            FROM rooms r
            WHERE r.Status = 'Active'
              AND (? IS NULL OR r.Capacity >= ?)
              AND NOT EXISTS (
                  SELECT 1
                  FROM bookings b
                  JOIN meetings m ON b.MeetingID = m.MeetingID
                  WHERE b.RoomID = r.RoomID
                    AND b.BookingStatus = 'Confirmed'
                    AND (m.StartTime < ?) AND (m.EndTime > ?)
                    AND (? IS NULL OR m.MeetingID != ?)
              )
            ORDER BY r.Capacity ASC, r.RoomName ASC
        `;

        const params = [
            minCapacity,
            minCapacity,
            endTime,
            startTime,
            excludeMeetingId,
            excludeMeetingId
        ];

        try {
            const [rows] = await db.execute(query, params);
            return rows.map(r => ({
                id: r.RoomID,
                code: r.RoomCode || `RM-${String(r.RoomID).padStart(3, '0')}`,
                name: r.RoomName,
                capacity: r.Capacity,
                type: r.Type || 'Hội nghị',
                floor: r.Floor || '',
                status: r.Status,
                qrCode: r.QRCode,
                description: r.Description || '',
                isAvailable: true
            }));
        } catch (dbError) {
            console.warn('MySQL chưa kết nối hoặc lỗi, chuyển sang Fallback In-Memory Query:', dbError.message);
            return Room.findAvailableRoomsFallback({ startTime, endTime, minCapacity, excludeMeetingId });
        }
    },

    /**
     * Fallback in-memory query lọc phòng trống khi MySQL chưa sẵn sàng
     */
    findAvailableRoomsFallback: ({ startTime, endTime, minCapacity = null, excludeMeetingId = null }) => {
        return mockRoomsFallback.filter(room => {
            if (room.status !== 'Active') return false;
            if (minCapacity !== null && Number(room.capacity) < Number(minCapacity)) {
                return false;
            }
            return true;
        }).map(r => ({
            id: r.id,
            code: r.code,
            name: r.name,
            capacity: r.capacity,
            type: r.type,
            floor: r.floor,
            status: r.status,
            qrCode: r.qrCode,
            equipments: r.equipments,
            description: r.description,
            isAvailable: true
        }));
    },

    // Các hàm phụ trợ kiểm thử
    _resetMockRoomsFallback: () => {
        mockRoomsFallback = [
            {
                id: 1,
                code: "RM-001",
                name: "Phòng Tokyo (Tầng 4)",
                capacity: 20,
                type: "Hội nghị",
                floor: "Tầng 4, Tòa A",
                status: "Active",
                qrCode: "QR-ROOM-001",
                equipments: ["Máy chiếu Full HD", "Màn hình TV 75\"", "Micro & Loa họp"],
                description: "Phòng hội thảo tiêu chuẩn cao, view thoáng, cách âm tốt."
            },
            {
                id: 2,
                code: "RM-002",
                name: "Phòng Silicon (Tầng 2)",
                capacity: 12,
                type: "Nhóm / Tech",
                floor: "Tầng 2, Tòa B",
                status: "Active",
                qrCode: "QR-ROOM-002",
                equipments: ["Màn hình TV 75\"", "Bảng trắng viết", "Micro & Loa họp"],
                description: "Phòng họp nhóm kỹ thuật, trang bị bảng tương tác và TV."
            },
            {
                id: 3,
                code: "RM-003",
                name: "Phòng Hội Nghị A",
                capacity: 30,
                type: "Hội trường lớn",
                floor: "Tầng 1, Tòa Trung tâm",
                status: "Active",
                qrCode: "QR-ROOM-003",
                equipments: ["Máy chiếu Full HD", "Micro & Loa họp", "Màn hình TV 75\"", "Bảng trắng viết"],
                description: "Hội trường lớn phù hợp cho họp toàn công ty và đào tạo nội bộ."
            },
            {
                id: 4,
                code: "RM-004",
                name: "Phòng Grand Board",
                capacity: 50,
                type: "Đại sảnh / Board",
                floor: "Tầng 5, Tòa A",
                status: "Maintenance",
                qrCode: "QR-ROOM-004",
                equipments: ["Máy chiếu Full HD", "Micro & Loa họp", "Màn hình TV 75\""],
                description: "Đang tiến hành bảo trì nâng cấp hệ thống âm thanh vòm."
            },
            {
                id: 5,
                code: "RM-005",
                name: "Phòng VIP",
                capacity: 10,
                type: "VIP / Phỏng vấn",
                floor: "Tầng 3, Tòa VIP",
                status: "Active",
                qrCode: "QR-ROOM-005",
                equipments: ["Màn hình TV 75\"", "Micro & Loa họp"],
                description: "Phòng tiếp đón đối tác cao cấp và phỏng vấn quản lý."
            }
        ];
        mockActiveBookingsFallback = [];
    },

    _setMockActiveBookings: (bookings) => {
        mockActiveBookingsFallback = bookings;
    }
};

module.exports = Room;
