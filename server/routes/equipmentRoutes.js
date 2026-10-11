const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { validateAvailableEquipmentsMiddleware } = require('../validators/equipmentValidator');

// 1. API Lọc thiết bị khả dụng theo khung giờ (phải đặt TRƯỚC /equipments/:id)
router.get('/equipments/available', validateAvailableEquipmentsMiddleware, equipmentController.getAvailableEquipments);

// 2. Lấy toàn bộ danh mục thiết bị
router.get('/equipments', equipmentController.getAllEquipments);

// 3. Lấy chi tiết thiết bị theo ID
router.get('/equipments/:id', equipmentController.getEquipmentById);

module.exports = router;
