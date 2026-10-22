/**
 * Tiện ích mã hóa và xác minh JWT Token (JWT Helper)
 * Sử dụng thư viện jsonwebtoken chuẩn Enterprise
 */

const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

const jwtHelper = {
    /**
     * Tạo mới JWT Token có chữ ký hợp lệ
     * @param {Object} payload - Dữ liệu định danh người dùng (userId, username, email, role)
     * @param {Object} [customOptions] - Ghi đè tùy chọn ký (ví dụ: expiresIn)
     * @returns {string} Chuỗi JWT token
     */
    generateToken: (payload, customOptions = {}) => {
        const options = {
            expiresIn: authConfig.jwtExpiresIn,
            ...customOptions
        };
        return jwt.sign(payload, authConfig.jwtSecret, options);
    },

    /**
     * Xác minh tính hợp lệ và chữ ký của JWT Token
     * @param {string} token - Chuỗi JWT token cần kiểm tra
     * @returns {{ valid: boolean, payload?: Object, expired?: boolean, error?: string }}
     */
    verifyToken: (token) => {
        try {
            const decoded = jwt.verify(token, authConfig.jwtSecret);
            return {
                valid: true,
                payload: decoded
            };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return {
                    valid: false,
                    expired: true,
                    error: 'Token xác thực đã hết hạn.'
                };
            }
            return {
                valid: false,
                expired: false,
                error: 'Token xác thực không hợp lệ hoặc chữ ký bị sai lệch.'
            };
        }
    },

    /**
     * Giải mã Token mà không kiểm tra chữ ký (dùng cho debug/logging an toàn)
     * @param {string} token
     * @returns {Object|null}
     */
    decodeToken: (token) => {
        try {
            return jwt.decode(token);
        } catch {
            return null;
        }
    }
};

module.exports = jwtHelper;
