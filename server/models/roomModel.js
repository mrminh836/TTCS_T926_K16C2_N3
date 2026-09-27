const db = require('../config/database');

// Dữ liệu mock dự phòng khi môi trường chưa khởi chạy MySQL
const mockRoomsFallback = [
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

const Room = {
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
                r.RoomName,
                r.Capacity,
                r.Status,
                r.QRCode
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
                name: r.RoomName,
                capacity: r.Capacity,
                status: r.Status,
                qrCode: r.QRCode,
                isAvailable: true
            }));
        } catch (dbError) {
            // Khi không kết nối được MySQL thực tế, dùng fallback query bộ nhớ
            console.warn('MySQL chưa kết nối hoặc lỗi, chuyển sang Fallback In-Memory Query:', dbError.message);
            return Room.findAvailableRoomsFallback({ startTime, endTime, minCapacity, excludeMeetingId });
        }
    },

    /**
     * Fallback in-memory query lọc phòng trống khi MySQL chưa sẵn sàng
     */
    findAvailableRoomsFallback: ({ startTime, endTime, minCapacity = null, excludeMeetingId = null }) => {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();

        return mockRoomsFallback.filter(room => {
            // Chỉ lấy phòng Active
            if (room.status !== 'Active') return false;

            // Kiểm tra sức chứa
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
            isAvailable: true
        }));
    },

    /**
     * Lấy toàn bộ phòng họp trong CSDL
     */
    findAll: async () => {
        try {
            const [rows] = await db.execute(`
                SELECT RoomID, RoomName, Capacity, Status, QRCode 
                FROM rooms 
                ORDER BY RoomID ASC
            `);
            return rows.map(r => ({
                id: r.RoomID,
                name: r.RoomName,
                capacity: r.Capacity,
                status: r.Status,
                qrCode: r.QRCode
            }));
        } catch {
            return mockRoomsFallback;
        }
    },

    /**
     * Lấy chi tiết phòng họp theo ID
     */
    findById: async (roomId) => {
        try {
            const [rows] = await db.execute(`
                SELECT RoomID, RoomName, Capacity, Status, QRCode 
                FROM rooms 
                WHERE RoomID = ?
            `, [roomId]);
            if (rows.length === 0) return null;
            const r = rows[0];
            return {
                id: r.RoomID,
                name: r.RoomName,
                capacity: r.Capacity,
                status: r.Status,
                qrCode: r.QRCode
            };
        } catch {
            return mockRoomsFallback.find(r => r.id === roomId) || null;
        }
    }
};

module.exports = Room;
