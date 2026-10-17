/**
 * Controller tiếp nhận và điều phối các yêu cầu Xác thực (Auth Controller)
 * Cung cấp 2 Endpoint cốt lõi:
 * - POST /api/auth/register : Đăng ký tài khoản người dùng
 * - POST /api/auth/login    : Đăng nhập và nhận JWT Token
 * - GET  /api/auth/me       : Lấy thông tin tài khoản đang đăng nhập qua Token
 */

const authService = require('../services/authService');
const authValidator = require('../validators/authValidator');

const authController = {
    /**
     * POST /api/auth/register
     * Đăng ký tài khoản người dùng mới
     */
    register: async (req, res, next) => {
        try {
            // 1. Kiểm tra tính hợp lệ của dữ liệu đầu vào
            const validation = authValidator.validateRegister(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu đăng ký không hợp lệ.',
                    errors: validation.errors
                });
            }

            // 2. Thực thi nghiệp vụ đăng ký tài khoản
            const result = await authService.register(validation.value);

            // 3. Trả về HTTP 201 Created kèm dữ liệu an toàn
            return res.status(201).json({
                success: true,
                message: result.message,
                data: result.user
            });

        } catch (error) {
            // Xử lý các lỗi nghiệp vụ đã định nghĩa (409 Conflict...)
            if (error.status) {
                return res.status(error.status).json({
                    success: false,
                    message: error.message
                });
            }

            console.error('[Auth Controller] Lỗi đăng ký tài khoản:', error);
            next(error);
        }
    },

    /**
     * POST /api/auth/login
     * Đăng nhập và nhận JWT Token
     */
    login: async (req, res, next) => {
        try {
            // 1. Kiểm tra tính hợp lệ của dữ liệu đầu vào
            const validation = authValidator.validateLogin(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu đăng nhập không hợp lệ.',
                    errors: validation.errors
                });
            }

            // 2. Thực thi nghiệp vụ xác thực tài khoản
            const result = await authService.login(validation.value);

            // 3. Trả về HTTP 200 OK kèm JWT Token và thông tin người dùng
            return res.status(200).json({
                success: true,
                message: result.message,
                token: result.token,
                tokenType: result.tokenType,
                expiresIn: result.expiresIn,
                user: result.user
            });

        } catch (error) {
            // Xử lý lỗi xác thực không thành công (401 Unauthorized...)
            if (error.status) {
                return res.status(error.status).json({
                    success: false,
                    message: error.message
                });
            }

            console.error('[Auth Controller] Lỗi đăng nhập:', error);
            next(error);
        }
    },

    /**
     * GET /api/auth/me
     * Lấy thông tin tài khoản hiện tại từ JWT Token đã xác thực
     */
    getProfile: async (req, res) => {
        return res.status(200).json({
            success: true,
            message: 'Xác thực tài khoản thành công.',
            user: req.user
        });
    }
};

module.exports = authController;
