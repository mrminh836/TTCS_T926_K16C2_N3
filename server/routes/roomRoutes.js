const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { 
    validateRoomMiddleware, 
    validateRoomIdMiddleware, 
    validateAvailableRoomsMiddleware 
} = require('../validators/roomValidator');
const { verifyJWT, requireRole } = require('../middleware/authMiddleware');

// API Routes cho Quản lý Phòng họp (Enterprise Room Management APIs)

// 1. Tra cứu danh mục và tình trạng phòng họp (Yêu cầu xác thực đăng nhập)
router.get('/rooms', verifyJWT, roomController.getAllRooms);
router.get('/rooms/available', verifyJWT, validateAvailableRoomsMiddleware, roomController.getAvailableRooms);
router.get('/rooms/:id', verifyJWT, validateRoomIdMiddleware, roomController.getRoomById);

// 2. Quản trị phòng họp (Chỉ Quản trị viên - Admin)
router.post('/rooms', verifyJWT, requireRole('Admin'), validateRoomMiddleware, roomController.createRoom);
router.put('/rooms/:id', verifyJWT, requireRole('Admin'), validateRoomIdMiddleware, validateRoomMiddleware, roomController.updateRoom);
router.delete('/rooms/:id', verifyJWT, requireRole('Admin'), validateRoomIdMiddleware, roomController.deleteRoom);
router.patch('/rooms/:id/status', verifyJWT, requireRole('Admin'), validateRoomIdMiddleware, roomController.toggleRoomStatus);

module.exports = router;
