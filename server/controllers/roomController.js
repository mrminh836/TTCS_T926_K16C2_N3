/**
 * Controller xử lý các yêu cầu liên quan đến Phòng họp (Room Controller)
 * Hỗ trợ các thao tác CRUD và kiểm tra toàn vẹn ràng buộc CSDL (Luồng 1.3)
 */

const { validateRoomInput, validateAvailableRoomsQuery } = require('../validators/roomValidator');
const Room = require('../models/roomModel');

// 1. Lấy tất cả phòng họp (Hỗ trợ lọc theo search, status, type, minCapacity)
const getAllRooms = async (req, res, next) => {
    try {
        const filters = {
            search: req.query.search,
            status: req.query.status,
            type: req.query.type,
            floor: req.query.floor,
            minCapacity: req.query.minCapacity || req.query.capacity
        };

        const rooms = await Room.findAll(filters);

        return res.status(200).json({
            success: true,
            total: rooms.length,
            filters,
            data: rooms
        });
    } catch (error) {
        next(error);
    }
};

// 2. Lấy chi tiết phòng họp theo ID
const getRoomById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID phòng họp không hợp lệ (phải là số nguyên dương).'
            });
        }

        const room = await Room.findById(id);
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

// 3. Thêm phòng họp mới (POST /api/rooms)
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

        // Kiểm tra trùng lặp Tên phòng
        const duplicateName = await Room.findByName(roomData.name);
        if (duplicateName) {
            return res.status(409).json({
                success: false,
                message: `Tên phòng họp "${roomData.name}" đã tồn tại trên hệ thống.`
            });
        }

        // Kiểm tra trùng lặp Mã phòng (nếu người dùng có nhập code)
        if (roomData.code) {
            const duplicateCode = await Room.findByCode(roomData.code);
            if (duplicateCode) {
                return res.status(409).json({
                    success: false,
                    message: `Mã phòng họp "${roomData.code}" đã được sử dụng.`
                });
            }
        }

        const newRoom = await Room.create(roomData);

        return res.status(201).json({
            success: true,
            message: "Thêm phòng họp mới thành công.",
            data: newRoom
        });
    } catch (error) {
        next(error);
    }
};

// 4. Cập nhật thông tin phòng họp (PUT /api/rooms/:id)
const updateRoom = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID phòng họp không hợp lệ (phải là số nguyên dương).'
            });
        }

        const existingRoom = await Room.findById(id);
        if (!existingRoom) {
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
        const duplicateName = await Room.findByName(roomData.name, id);
        if (duplicateName) {
            return res.status(409).json({
                success: false,
                message: `Tên phòng họp "${roomData.name}" đã được sử dụng bởi phòng khác.`
            });
        }

        // Kiểm tra trùng mã với phòng khác (nếu có nhập code)
        if (roomData.code) {
            const duplicateCode = await Room.findByCode(roomData.code, id);
            if (duplicateCode) {
                return res.status(409).json({
                    success: false,
                    message: `Mã phòng họp "${roomData.code}" đã được sử dụng bởi phòng khác.`
                });
            }
        }

        const updatedRoom = await Room.update(id, roomData);

        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin phòng họp thành công.",
            data: updatedRoom
        });
    } catch (error) {
        next(error);
    }
};

// 5. Xóa phòng họp (DELETE /api/rooms/:id) - Tuân thủ ràng buộc Luồng 1.3
const deleteRoom = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID phòng họp không hợp lệ (phải là số nguyên dương).'
            });
        }

        const existingRoom = await Room.findById(id);
        if (!existingRoom) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy phòng họp với ID: ${id}`
            });
        }

        // Kiểm tra ràng buộc Luồng 1.3: Chặn xóa phòng nếu có cuộc họp Confirmed đang hoặc sắp diễn ra
        const hasActiveMeetings = await Room.hasActiveMeetings(id);
        if (hasActiveMeetings) {
            return res.status(409).json({
                success: false,
                code: 'CANNOT_DELETE_ACTIVE_MEETINGS',
                message: `Không thể xóa phòng họp "${existingRoom.name}" vì đang có cuộc họp đã lên lịch hoặc đang diễn ra. Vui lòng chuyển trạng thái phòng sang "Bảo trì" (Maintenance) thay vì xóa.`
            });
        }

        await Room.delete(id);

        return res.status(200).json({
            success: true,
            message: `Xóa phòng họp "${existingRoom.name}" thành công.`,
            data: existingRoom
        });
    } catch (error) {
        if (error.code === 'ACTIVE_MEETINGS_EXIST') {
            return res.status(409).json({
                success: false,
                code: 'CANNOT_DELETE_ACTIVE_MEETINGS',
                message: error.message
            });
        }
        next(error);
    }
};

// 6. Chuyển trạng thái nhanh (PATCH /api/rooms/:id/status - Hoạt động <-> Bảo trì)
const toggleRoomStatus = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID phòng họp không hợp lệ (phải là số nguyên dương).'
            });
        }

        const existingRoom = await Room.findById(id);
        if (!existingRoom) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy phòng họp với ID: ${id}`
            });
        }

        const updatedRoom = await Room.toggleStatus(id);

        return res.status(200).json({
            success: true,
            message: `Đã chuyển trạng thái phòng sang: ${updatedRoom.status}`,
            data: updatedRoom
        });
    } catch (error) {
        next(error);
    }
};

// 7. Lọc danh sách phòng chưa có lịch đặt theo khoảng ngày/giờ (Available Rooms Query)
const getAvailableRooms = async (req, res, next) => {
    try {
        const queryData = req.validatedAvailableQuery || validateAvailableRoomsQuery(req.query).data;

        if (!queryData) {
            const validation = validateAvailableRoomsQuery(req.query);
            return res.status(400).json({
                success: false,
                message: validation.errors[0],
                errors: validation.errors
            });
        }

        const availableRooms = await Room.findAvailableRooms(queryData);

        return res.status(200).json({
            success: true,
            total: availableRooms.length,
            query: {
                startTime: queryData.startTime,
                endTime: queryData.endTime,
                minCapacity: queryData.minCapacity,
                excludeMeetingId: queryData.excludeMeetingId
            },
            data: availableRooms
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllRooms,
    getRoomById,
    getAvailableRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    toggleRoomStatus
};
