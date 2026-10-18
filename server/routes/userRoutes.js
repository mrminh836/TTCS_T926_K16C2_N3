const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyJWT } = require('../middleware/authMiddleware');

// 1. Lấy danh sách nhân viên phục vụ mời họp và phân công (Authenticated)
router.get('/users', verifyJWT, userController.getUsers);

// 2. Lấy thông tin chi tiết một nhân viên (Authenticated)
router.get('/users/:id', verifyJWT, userController.getUserById);

module.exports = router;
