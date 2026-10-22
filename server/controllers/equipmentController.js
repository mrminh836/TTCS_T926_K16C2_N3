/**
 * Controller xử lý các yêu cầu liên quan đến Thiết bị (Equipment Controller)
 * Cung cấp API GET /api/equipments/available theo Luồng 2.3
 */

const Equipment = require('../models/equipmentModel');

/**
 * GET /api/equipments/available
 * Lấy danh sách thiết bị khả dụng trong khung thời gian yêu cầu
 */
const getAvailableEquipments = async (req, res, next) => {
    try {
        const queryData = req.validatedEquipmentQuery;

        if (!queryData) {
            return res.status(400).json({
                success: false,
                message: 'Tham số truy vấn chưa được xác thực. Vui lòng kiểm tra middleware.'
            });
        }

        const availableEquipments = await Equipment.findAvailableEquipments(queryData);

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách thiết bị khả dụng thành công.',
            timeframe: {
                startTime: queryData.startTime,
                endTime: queryData.endTime,
                excludeMeetingId: queryData.excludeMeetingId || null
            },
            totalAvailable: availableEquipments.length,
            data: availableEquipments
        });
    } catch (error) {
        console.error('[Equipment Controller] Lỗi khi lọc thiết bị khả dụng:', error);
        next(error);
    }
};

/**
 * GET /api/equipments
 * Lấy toàn bộ danh sách thiết bị trong hệ thống
 */
const getAllEquipments = async (req, res, next) => {
    try {
        const { status, type, search } = req.query;
        const equipments = await Equipment.findAll({ status, type, search });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh mục thiết bị thành công.',
            total: equipments.length,
            data: equipments
        });
    } catch (error) {
        console.error('[Equipment Controller] Lỗi khi lấy danh mục thiết bị:', error);
        next(error);
    }
};

/**
 * GET /api/equipments/:id
 * Lấy thông tin chi tiết một thiết bị theo ID
 */
const getEquipmentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = Number(id);
        if (isNaN(parsedId) || parsedId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID thiết bị không hợp lệ (phải là số nguyên dương).'
            });
        }

        const equipment = await Equipment.findById(parsedId);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thiết bị với ID: ${id}`
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lấy chi tiết thiết bị thành công.',
            data: equipment
        });
    } catch (error) {
        console.error(`[Equipment Controller] Lỗi khi lấy chi tiết thiết bị ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * POST /api/equipments
 * Tạo mới thiết bị trong danh mục
 */
const createEquipment = async (req, res, next) => {
    try {
        const bodyData = req.validatedEquipmentBody || req.body;
        const newEquipment = await Equipment.create(bodyData);

        return res.status(201).json({
            success: true,
            message: 'Tạo mới thiết bị thành công.',
            data: newEquipment
        });
    } catch (error) {
        console.error('[Equipment Controller] Lỗi khi tạo mới thiết bị:', error);
        next(error);
    }
};

/**
 * PUT /api/equipments/:id
 * Cập nhật toàn diện thông tin thiết bị
 */
const updateEquipment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = Number(id);
        if (isNaN(parsedId) || parsedId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID thiết bị không hợp lệ (phải là số nguyên dương).'
            });
        }

        const bodyData = req.validatedEquipmentBody || req.body;
        const updatedEquipment = await Equipment.update(parsedId, bodyData);

        if (!updatedEquipment) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thiết bị với ID: ${id} để cập nhật.`
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thiết bị thành công.',
            data: updatedEquipment
        });
    } catch (error) {
        console.error(`[Equipment Controller] Lỗi khi cập nhật thiết bị ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * PATCH /api/equipments/:id/status
 * Cập nhật nhanh trạng thái vận hành thiết bị (Available, Maintenance, Broken)
 */
const updateEquipmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = Number(id);
        if (isNaN(parsedId) || parsedId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID thiết bị không hợp lệ (phải là số nguyên dương).'
            });
        }

        const status = req.validatedPatchStatusBody ? req.validatedPatchStatusBody.status : req.body.status;
        const updatedEquipment = await Equipment.updateStatus(parsedId, status);

        if (!updatedEquipment) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thiết bị với ID: ${id} để cập nhật trạng thái.`
            });
        }

        return res.status(200).json({
            success: true,
            message: `Cập nhật trạng thái thiết bị thành '${updatedEquipment.status}' thành công.`,
            data: updatedEquipment
        });
    } catch (error) {
        console.error(`[Equipment Controller] Lỗi khi cập nhật trạng thái thiết bị ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * DELETE /api/equipments/:id
 * Xóa thiết bị (có kiểm tra ràng buộc toàn vẹn lịch họp)
 */
const deleteEquipment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = Number(id);
        if (isNaN(parsedId) || parsedId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID thiết bị không hợp lệ (phải là số nguyên dương).'
            });
        }

        const result = await Equipment.delete(parsedId);

        if (!result.exists) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy thiết bị với ID: ${id} để xóa.`
            });
        }

        if (result.hasActiveBookings) {
            return res.status(409).json({
                success: false,
                message: `Không thể xóa thiết bị vì đang được gán cho ${result.activeBookings.length} cuộc họp đã xác nhận (Confirmed). Vui lòng chuyển trạng thái thiết bị sang 'Bảo trì' hoặc hủy liên kết lịch họp trước khi xóa.`,
                activeBookings: result.activeBookings
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xóa thiết bị khỏi hệ thống thành công.',
            data: result.deletedEquipment
        });
    } catch (error) {
        console.error(`[Equipment Controller] Lỗi khi xóa thiết bị ${req.params.id}:`, error);
        next(error);
    }
};

module.exports = {
    getAvailableEquipments,
    getAllEquipments,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    updateEquipmentStatus,
    deleteEquipment
};
