/**
 * Tuyến đường xác thực người dùng (Auth Routes)
 * Khai báo các API:
 * - POST /api/auth/register : Đăng ký tài khoản
 * - POST /api/auth/login    : Đăng nhập nhận JWT Token
 * - GET  /api/auth/me       : Lấy thông tin tài khoản hiện tại từ JWT
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyJWT, authenticateToken } = require('../middleware/authMiddleware');

// 1. Đăng ký tài khoản người dùng (Public)
router.post('/register', authController.register);

// 2. Đăng nhập nhận JWT Token (Public)
router.post('/login', authController.login);

// 3. Lấy thông tin tài khoản đang đăng nhập (Yêu cầu Bearer Token)
router.get('/me', verifyJWT, authController.getProfile);

module.exports = router;
