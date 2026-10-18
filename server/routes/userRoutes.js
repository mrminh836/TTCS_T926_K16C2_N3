const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyJWT } = require('../middleware/authMiddleware');

// 1. Quản lý thông tin tài khoản cá nhân & đổi mật khẩu (Profile)
router.get('/users/profile', verifyJWT, userController.getProfile);
router.put('/users/profile', verifyJWT, userController.updateProfile);
router.get('/user/profile', verifyJWT, userController.getProfile);
router.put('/user/profile', verifyJWT, userController.updateProfile);

// 2. Lấy danh sách nhân viên phục vụ mời họp và phân công (Authenticated)
router.get('/users', verifyJWT, userController.getUsers);

// 3. Lấy thông tin chi tiết một nhân viên (Authenticated)
router.get('/users/:id', verifyJWT, userController.getUserById);

module.exports = router;
