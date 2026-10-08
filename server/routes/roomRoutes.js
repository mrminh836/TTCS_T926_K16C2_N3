const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { 
    validateRoomMiddleware, 
    validateRoomIdMiddleware, 
    validateAvailableRoomsMiddleware 
} = require('../validators/roomValidator');

// API Routes cho Quản lý Phòng họp (Enterprise Room Management APIs)
router.get('/rooms', roomController.getAllRooms);
router.get('/rooms/available', validateAvailableRoomsMiddleware, roomController.getAvailableRooms);
router.get('/rooms/:id', validateRoomIdMiddleware, roomController.getRoomById);
router.post('/rooms', validateRoomMiddleware, roomController.createRoom);
router.put('/rooms/:id', validateRoomIdMiddleware, validateRoomMiddleware, roomController.updateRoom);
router.delete('/rooms/:id', validateRoomIdMiddleware, roomController.deleteRoom);
router.patch('/rooms/:id/status', validateRoomIdMiddleware, roomController.toggleRoomStatus);

module.exports = router;
