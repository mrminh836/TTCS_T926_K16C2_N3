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
        const equipment = await Equipment.findById(id);

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

module.exports = {
    getAvailableEquipments,
    getAllEquipments,
    getEquipmentById
};
