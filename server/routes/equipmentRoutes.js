const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const {
    validateAvailableEquipmentsMiddleware,
    validateCreateEquipmentMiddleware,
    validateUpdateEquipmentMiddleware,
    validatePatchStatusMiddleware
} = require('../validators/equipmentValidator');

// 1. API Lọc thiết bị khả dụng theo khung giờ (phải đặt TRƯỚC /equipments/:id)
router.get('/equipments/available', validateAvailableEquipmentsMiddleware, equipmentController.getAvailableEquipments);

// 2. Lấy toàn bộ danh mục thiết bị
router.get('/equipments', equipmentController.getAllEquipments);

// 3. Lấy chi tiết thiết bị theo ID
router.get('/equipments/:id', equipmentController.getEquipmentById);

// 4. Tạo mới thiết bị trong danh mục
router.post('/equipments', validateCreateEquipmentMiddleware, equipmentController.createEquipment);

// 5. Cập nhật toàn diện thông tin thiết bị
router.put('/equipments/:id', validateUpdateEquipmentMiddleware, equipmentController.updateEquipment);

// 6. Cập nhật nhanh trạng thái thiết bị (Available, Maintenance, Broken)
router.patch('/equipments/:id/status', validatePatchStatusMiddleware, equipmentController.updateEquipmentStatus);

// 7. Xóa thiết bị khỏi hệ thống (có kiểm tra ràng buộc toàn vẹn)
router.delete('/equipments/:id', equipmentController.deleteEquipment);

module.exports = router;
