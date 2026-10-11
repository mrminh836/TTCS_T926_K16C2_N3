const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 1. Lấy danh sách nhân viên phục vụ mời họp và phân công
router.get('/users', userController.getUsers);

// 2. Lấy thông tin chi tiết một nhân viên
router.get('/users/:id', userController.getUserById);

module.exports = router;
