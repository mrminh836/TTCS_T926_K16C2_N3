const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { validateRoomMiddleware } = require('../validators/roomValidator');

// API Routes cho Quản lý Phòng họp (Enterprise Room Management APIs)
router.get('/rooms', roomController.getAllRooms);
router.get('/rooms/:id', roomController.getRoomById);
router.post('/rooms', validateRoomMiddleware, roomController.createRoom);
router.put('/rooms/:id', validateRoomMiddleware, roomController.updateRoom);
router.delete('/rooms/:id', roomController.deleteRoom);
router.patch('/rooms/:id/status', roomController.toggleRoomStatus);

module.exports = router;
