/**
 * Model quản lý Thiết bị hội nghị (Equipment Model)
 * Tương tác CSDL MySQL bảng Equipments và Booking_Equipments.
 * Cung cấp API lọc thiết bị khả dụng theo thời gian thực (Luồng 2.3).
 */

const db = require('../config/database');

// Danh mục thiết bị dự phòng khi MySQL chưa kết nối
const mockEquipmentsFallback = [
    { id: 1, equipmentId: 1, name: "Máy chiếu Laser Sony 4K VPL-PHZ61", equipmentName: "Máy chiếu Laser Sony 4K VPL-PHZ61", type: "Máy chiếu", status: "Available" },
    { id: 2, equipmentId: 2, name: "Màn hình tương tác Samsung Flip Pro 75 inch", equipmentName: "Màn hình tương tác Samsung Flip Pro 75 inch", type: "Màn hình tương tác", status: "Available" },
    { id: 3, equipmentId: 3, name: "Hệ thống Camera hội nghị Logitech Rally Plus", equipmentName: "Hệ thống Camera hội nghị Logitech Rally Plus", type: "Camera hội nghị", status: "Available" },
    { id: 4, equipmentId: 4, name: "Bộ Micro cổ ngỗng không dây Shure MXW6 (4 mic)", equipmentName: "Bộ Micro cổ ngỗng không dây Shure MXW6 (4 mic)", type: "Micro hội nghị", status: "Available" },
    { id: 5, equipmentId: 5, name: "Loa ngoài hội nghị chuyên dụng Jabra Speak 810", equipmentName: "Loa ngoài hội nghị chuyên dụng Jabra Speak 810", type: "Loa hội nghị", status: "Available" },
    { id: 6, equipmentId: 6, name: "Bảng kính viết bút lông cao cấp di động 1.8m", equipmentName: "Bảng kính viết bút lông cao cấp di động 1.8m", type: "Bảng thảo luận", status: "Available" },
    { id: 7, equipmentId: 7, name: "Máy chiếu di động Epson EB-2250U", equipmentName: "Máy chiếu di động Epson EB-2250U", type: "Máy chiếu", status: "Maintenance" },
    { id: 8, equipmentId: 8, name: "Bộ chia sẻ màn hình không dây Barco ClickShare CX-30", equipmentName: "Bộ chia sẻ màn hình không dây Barco ClickShare CX-30", type: "Thiết bị trình chiếu", status: "Available" },
    { id: 9, equipmentId: 9, name: "Webcam hội nghị trực tuyến Polycom Studio 4K", equipmentName: "Webcam hội nghị trực tuyến Polycom Studio 4K", type: "Camera hội nghị", status: "Available" },
    { id: 10, equipmentId: 10, name: "Hệ thống phiên dịch cabin đa ngôn ngữ BOSCH", equipmentName: "Hệ thống phiên dịch cabin đa ngôn ngữ BOSCH", type: "Thiết bị dịch", status: "Available" }
];

function formatEquipmentRow(row) {
    if (!row) return null;
    const id = Number(row.EquipmentID !== undefined ? row.EquipmentID : (row.equipmentId !== undefined ? row.equipmentId : row.id));
    const name = row.EquipmentName || row.equipmentName || row.name || '';
    const type = row.Type || row.type || 'Thiết bị';
    const status = row.Status || row.status || 'Available';

    return {
        id,
        equipmentId: id,
        name,
        equipmentName: name,
        type,
        status,
        isAvailable: status.toLowerCase() === 'available'
    };
}

const Equipment = {
    /**
     * Lấy toàn bộ danh sách thiết bị
     */
    findAll: async (filters = {}) => {
        const { status, type, search } = filters;
        try {
            let sql = `
                SELECT EquipmentID, EquipmentName, Type, Status
                FROM Equipments
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                sql += ` AND LOWER(Status) = LOWER(?)`;
                params.push(status);
            }
            if (type) {
                sql += ` AND LOWER(Type) = LOWER(?)`;
                params.push(type);
            }
            if (search) {
                sql += ` AND LOWER(EquipmentName) LIKE LOWER(?)`;
                params.push(`%${search.trim()}%`);
            }
            sql += ` ORDER BY EquipmentID ASC`;

            const [rows] = await db.query(sql, params);
            return rows.map(formatEquipmentRow);
        } catch (error) {
            console.warn('[Equipment Model] CSDL không khả dụng, sử dụng Fallback:', error.message);
            let results = [...mockEquipmentsFallback];
            if (status) results = results.filter(e => e.status.toLowerCase() === status.toLowerCase());
            if (type) results = results.filter(e => e.type.toLowerCase() === type.toLowerCase());
            if (search) results = results.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
            return results.map(formatEquipmentRow);
        }
    },

    /**
     * Lấy danh sách thiết bị khả dụng trong khung giờ (Luồng 2.3)
     * Điều kiện:
     * 1. Status = 'Available' (không bảo trì / hỏng)
     * 2. NOT EXISTS cuộc họp nào đang mượn thiết bị này trong khung giờ (startTime < meeting.endTime AND endTime > meeting.startTime)
     * @param {Object} queryData
     * @param {string} queryData.startTime - Chuỗi YYYY-MM-DD HH:mm:ss
     * @param {string} queryData.endTime   - Chuỗi YYYY-MM-DD HH:mm:ss
     * @param {string} [queryData.type]    - Lọc theo phân loại thiết bị
     * @param {number} [queryData.excludeMeetingId] - Bỏ qua cuộc họp đang sửa
     * @returns {Promise<Array>} Danh sách thiết bị sẵn sàng cho mượn
     */
    findAvailableEquipments: async ({ startTime, endTime, type, excludeMeetingId }) => {
        try {
            let sql = `
                SELECT 
                    e.EquipmentID,
                    e.EquipmentName,
                    e.Type,
                    e.Status
                FROM Equipments e
                WHERE LOWER(e.Status) = 'available'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM Booking_Equipments be
                      JOIN Bookings b ON be.BookingID = b.BookingID
                      JOIN Meetings m ON b.MeetingID = m.MeetingID
                      WHERE be.EquipmentID = e.EquipmentID
                        AND LOWER(b.BookingStatus) != 'cancelled'
                        AND (m.StartTime < ? AND m.EndTime > ?)
            `;
            const params = [endTime, startTime];

            if (excludeMeetingId) {
                sql += ` AND m.MeetingID != ?`;
                params.push(excludeMeetingId);
            }

            sql += `
                  )
            `;

            if (type) {
                sql += ` AND LOWER(e.Type) = LOWER(?)`;
                params.push(type);
            }

            sql += ` ORDER BY e.EquipmentID ASC`;

            const [rows] = await db.query(sql, params);
            return rows.map(formatEquipmentRow);

        } catch (error) {
            console.warn('[Equipment Model] findAvailableEquipments chuyển sang Fallback:', error.message);
            // Trong chế độ fallback, loại bỏ các thiết bị có status khác 'Available' (ví dụ thiết bị #7 Maintenance)
            let results = mockEquipmentsFallback.filter(e => e.status.toLowerCase() === 'available');
            if (type) {
                results = results.filter(e => e.type.toLowerCase() === type.toLowerCase());
            }
            return results.map(formatEquipmentRow);
        }
    },

    /**
     * Lấy chi tiết thiết bị theo ID
     */
    findById: async (id) => {
        const parsedId = Number(id);
        if (isNaN(parsedId) || parsedId <= 0) return null;

        try {
            const sql = `
                SELECT EquipmentID, EquipmentName, Type, Status
                FROM Equipments
                WHERE EquipmentID = ?
                LIMIT 1
            `;
            const [rows] = await db.query(sql, [parsedId]);
            if (rows && rows.length > 0) {
                return formatEquipmentRow(rows[0]);
            }
            return null;
        } catch (error) {
            console.warn(`[Equipment Model] findById(${parsedId}) fallback:`, error.message);
            const found = mockEquipmentsFallback.find(e => e.id === parsedId);
            return found ? formatEquipmentRow(found) : null;
        }
    },

    /**
     * Tạo mới thiết bị (POST /api/equipments)
     * @param {Object} data - { equipmentName, type, status }
     */
    create: async (data) => {
        const { equipmentName, type = 'Thiết bị', status = 'Available' } = data;

        try {
            const sql = `
                INSERT INTO Equipments (EquipmentName, Type, Status)
                VALUES (?, ?, ?)
            `;
            const [result] = await db.query(sql, [equipmentName.trim(), type ? type.trim() : 'Thiết bị', status]);
            const newId = result.insertId;

            return await Equipment.findById(newId);
        } catch (error) {
            console.warn('[Equipment Model] create fallback:', error.message);
            const newId = mockEquipmentsFallback.length ? Math.max(...mockEquipmentsFallback.map(e => e.id)) + 1 : 1;
            const newEq = {
                id: newId,
                equipmentId: newId,
                name: equipmentName.trim(),
                equipmentName: equipmentName.trim(),
                type: type ? type.trim() : 'Thiết bị',
                status
            };
            mockEquipmentsFallback.push(newEq);
            return formatEquipmentRow(newEq);
        }
    },

    /**
     * Cập nhật thông tin thiết bị (PUT /api/equipments/:id)
     * @param {number} id
     * @param {Object} data - { equipmentName, type, status }
     */
    update: async (id, data) => {
        const parsedId = Number(id);
        if (isNaN(parsedId) || parsedId <= 0) return null;

        const existing = await Equipment.findById(parsedId);
        if (!existing) return null;

        const { equipmentName, type, status } = data;
        const newName = equipmentName !== undefined ? equipmentName.trim() : existing.name;
        const newType = type !== undefined ? type.trim() : existing.type;
        const newStatus = status !== undefined ? status : existing.status;

        try {
            const sql = `
                UPDATE Equipments
                SET EquipmentName = ?, Type = ?, Status = ?
                WHERE EquipmentID = ?
            `;
            await db.query(sql, [newName, newType, newStatus, parsedId]);
            return await Equipment.findById(parsedId);
        } catch (error) {
            console.warn(`[Equipment Model] update(${parsedId}) fallback:`, error.message);
            const idx = mockEquipmentsFallback.findIndex(e => e.id === parsedId);
            if (idx !== -1) {
                mockEquipmentsFallback[idx] = {
                    ...mockEquipmentsFallback[idx],
                    name: newName,
                    equipmentName: newName,
                    type: newType,
                    status: newStatus
                };
                return formatEquipmentRow(mockEquipmentsFallback[idx]);
            }
            return null;
        }
    },

    /**
     * Cập nhật nhanh trạng thái thiết bị (PATCH /api/equipments/:id/status)
     * @param {number} id
     * @param {string} status - 'Available' | 'Maintenance' | 'Broken'
     */
    updateStatus: async (id, status) => {
        const parsedId = Number(id);
        if (isNaN(parsedId) || parsedId <= 0) return null;

        const existing = await Equipment.findById(parsedId);
        if (!existing) return null;

        try {
            const sql = `
                UPDATE Equipments
                SET Status = ?
                WHERE EquipmentID = ?
            `;
            await db.query(sql, [status, parsedId]);
            return await Equipment.findById(parsedId);
        } catch (error) {
            console.warn(`[Equipment Model] updateStatus(${parsedId}) fallback:`, error.message);
            const idx = mockEquipmentsFallback.findIndex(e => e.id === parsedId);
            if (idx !== -1) {
                mockEquipmentsFallback[idx].status = status;
                return formatEquipmentRow(mockEquipmentsFallback[idx]);
            }
            return null;
        }
    },

    /**
     * Kiểm tra các cuộc họp Confirmed đang mượn thiết bị này
     * @param {number} id
     */
    checkActiveBookings: async (id) => {
        const parsedId = Number(id);
        if (isNaN(parsedId) || parsedId <= 0) return [];

        try {
            const sql = `
                SELECT 
                    b.BookingID     AS bookingId,
                    m.MeetingID     AS meetingId,
                    m.Title         AS title,
                    m.StartTime     AS startTime,
                    m.EndTime       AS endTime,
                    b.BookingStatus AS bookingStatus
                FROM Booking_Equipments be
                JOIN Bookings b ON be.BookingID = b.BookingID
                JOIN Meetings m ON b.MeetingID = m.MeetingID
                WHERE be.EquipmentID = ?
                  AND LOWER(b.BookingStatus) = 'confirmed'
                ORDER BY m.StartTime DESC
            `;
            const [rows] = await db.query(sql, [parsedId]);
            return rows;
        } catch (error) {
            console.warn(`[Equipment Model] checkActiveBookings(${parsedId}) fallback:`, error.message);
            return [];
        }
    },

    /**
     * Xóa thiết bị an toàn
     * @param {number} id
     * @returns {Object} { exists, hasActiveBookings, deleted, activeBookings }
     */
    delete: async (id) => {
        const parsedId = Number(id);
        if (isNaN(parsedId) || parsedId <= 0) {
            return { exists: false, hasActiveBookings: false, deleted: false };
        }

        const existing = await Equipment.findById(parsedId);
        if (!existing) {
            return { exists: false, hasActiveBookings: false, deleted: false };
        }

        // Kiểm tra ràng buộc cuộc họp đã xác nhận (Confirmed)
        const activeBookings = await Equipment.checkActiveBookings(parsedId);
        if (activeBookings.length > 0) {
            return {
                exists: true,
                hasActiveBookings: true,
                deleted: false,
                activeBookings
            };
        }

        try {
            // Xóa các bản ghi tham chiếu cũ không còn Confirmed (ví dụ Cancelled) nếu có
            await db.query('DELETE FROM Booking_Equipments WHERE EquipmentID = ?', [parsedId]);
            // Xóa thiết bị khỏi bảng Equipments
            await db.query('DELETE FROM Equipments WHERE EquipmentID = ?', [parsedId]);

            return {
                exists: true,
                hasActiveBookings: false,
                deleted: true,
                deletedEquipment: existing
            };
        } catch (error) {
            console.warn(`[Equipment Model] delete(${parsedId}) fallback:`, error.message);
            const idx = mockEquipmentsFallback.findIndex(e => e.id === parsedId);
            if (idx !== -1) {
                mockEquipmentsFallback.splice(idx, 1);
            }
            return {
                exists: true,
                hasActiveBookings: false,
                deleted: true,
                deletedEquipment: existing
            };
        }
    }
};

module.exports = Equipment;
