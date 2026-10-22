const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const {
    validateAvailableEquipmentsMiddleware,
    validateCreateEquipmentMiddleware,
    validateUpdateEquipmentMiddleware,
    validatePatchStatusMiddleware
} = require('../validators/equipmentValidator');
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');

// 1. API Lọc thiết bị khả dụng theo khung giờ (phải đặt TRƯỚC /equipments/:id) - Authenticated
router.get('/equipments/available', verifyJWT, validateAvailableEquipmentsMiddleware, equipmentController.getAvailableEquipments);

// 2. Lấy toàn bộ danh mục thiết bị - Authenticated
router.get('/equipments', verifyJWT, equipmentController.getAllEquipments);

// 3. Lấy chi tiết thiết bị theo ID - Authenticated
router.get('/equipments/:id', verifyJWT, equipmentController.getEquipmentById);

// 4. Quản trị thiết bị: Tạo mới thiết bị trong danh mục (Chỉ Quản trị viên - Admin)
router.post('/equipments', verifyJWT, requireRole('Admin'), validateCreateEquipmentMiddleware, equipmentController.createEquipment);

// 5. Quản trị thiết bị: Cập nhật toàn diện thông tin thiết bị (Chỉ Quản trị viên - Admin)
router.put('/equipments/:id', verifyJWT, requireRole('Admin'), validateUpdateEquipmentMiddleware, equipmentController.updateEquipment);

// 6. Quản trị thiết bị: Cập nhật nhanh trạng thái thiết bị (Chỉ Quản trị viên - Admin)
router.patch('/equipments/:id/status', verifyJWT, requireRole('Admin'), validatePatchStatusMiddleware, equipmentController.updateEquipmentStatus);

// 7. Quản trị thiết bị: Xóa thiết bị khỏi hệ thống (Chỉ Quản trị viên - Admin)
router.delete('/equipments/:id', verifyJWT, requireRole('Admin'), equipmentController.deleteEquipment);

module.exports = router;
