/**
 * Controller xử lý các yêu cầu liên quan đến Phòng họp (Room Controller)
 * Hỗ trợ các thao tác CRUD và kiểm tra ràng buộc toàn vẹn dữ liệu
 */

const { validateRoomInput } = require('../validators/roomValidator');

// Mock data ban đầu khi chưa kết nối Database server trực tiếp
let mockRooms = [
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
        description: "Phòng hội thảo tiêu chuẩn cao, view thoáng, cách âm tốt, chuyên tổ chức họp ban giám đốc và đối tác."
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
        description: "Thiết kế mở theo phong cách Silicon Valley, trang bị màn hình tương tác và bảng viết brainstorming."
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
        description: "Hội trường lớn phù hợp cho họp toàn công ty, hội thảo khách hàng, đào tạo nhân sự định kỳ."
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
        description: "Đang nâng cấp hệ thống âm thanh vòm và điều hòa trung tâm."
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
        description: "Phòng tiếp đón đối tác cao cấp, phỏng vấn nhân sự cấp quản lý."
    }
];

// 1. Lấy tất cả phòng họp
const getAllRooms = async (req, res, next) => {
    try {
        return res.status(200).json({
            success: true,
            total: mockRooms.length,
            data: mockRooms
        });
    } catch (error) {
        next(error);
    }
};

// 2. Lấy chi tiết phòng họp theo ID
const getRoomById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const room = mockRooms.find(r => r.id === id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy phòng họp với ID: ${id}`
            });
        }

        return res.status(200).json({
            success: true,
            data: room
        });
    } catch (error) {
        next(error);
    }
};

// 3. Thêm phòng họp mới
const createRoom = async (req, res, next) => {
    try {
        const validation = req.validatedRoomData 
            ? { isValid: true, data: req.validatedRoomData } 
            : validateRoomInput(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0],
                errors: validation.errors
            });
        }

        const roomData = validation.data;

        // Kiểm tra trùng lặp tên phòng
        const duplicate = mockRooms.find(r => r.name.toLowerCase() === roomData.name.toLowerCase());
        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: `Tên phòng họp "${roomData.name}" đã tồn tại trên hệ thống.`
            });
        }

        const nextId = mockRooms.reduce((max, r) => Math.max(max, r.id), 0) + 1;
        const newRoom = {
            id: nextId,
            code: `RM-00${nextId}`,
            name: roomData.name,
            capacity: roomData.capacity,
            type: roomData.type,
            floor: roomData.floor,
            status: roomData.status,
            qrCode: roomData.qrCode || `QR-ROOM-00${nextId}`,
            equipments: roomData.equipments,
            description: roomData.description
        };

        mockRooms.push(newRoom);

        return res.status(201).json({
            success: true,
            message: "Thêm phòng họp mới thành công.",
            data: newRoom
        });
    } catch (error) {
        next(error);
    }
};

// 4. Cập nhật thông tin phòng họp
const updateRoom = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const room = mockRooms.find(r => r.id === id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy phòng họp với ID: ${id}`
            });
        }

        const validation = req.validatedRoomData 
            ? { isValid: true, data: req.validatedRoomData } 
            : validateRoomInput(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0],
                errors: validation.errors
            });
        }

        const roomData = validation.data;

        // Kiểm tra trùng tên với phòng khác
        const duplicate = mockRooms.find(r => r.name.toLowerCase() === roomData.name.toLowerCase() && r.id !== id);
        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: `Tên phòng họp "${roomData.name}" đã được sử dụng bởi phòng khác.`
            });
        }

        room.name = roomData.name;
        room.capacity = roomData.capacity;
        room.type = roomData.type;
        room.floor = roomData.floor;
        room.status = roomData.status;
        room.equipments = roomData.equipments;
        room.description = roomData.description;

        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin phòng họp thành công.",
            data: room
        });
    } catch (error) {
        next(error);
    }
};

// 5. Xóa phòng họp (Safe Delete)
const deleteRoom = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const index = mockRooms.findIndex(r => r.id === id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy phòng họp với ID: ${id}`
            });
        }

        const deleted = mockRooms.splice(index, 1)[0];

        return res.status(200).json({
            success: true,
            message: `Xóa phòng họp "${deleted.name}" thành công.`,
            data: deleted
        });
    } catch (error) {
        next(error);
    }
};

// 6. Chuyển trạng thái nhanh (Hoạt động <-> Bảo trì)
const toggleRoomStatus = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const room = mockRooms.find(r => r.id === id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy phòng họp với ID: ${id}`
            });
        }

        room.status = room.status === 'Active' ? 'Maintenance' : 'Active';

        return res.status(200).json({
            success: true,
            message: `Đã chuyển trạng thái phòng sang: ${room.status}`,
            data: room
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    toggleRoomStatus
};
