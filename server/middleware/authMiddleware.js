/**
 * Middleware xác thực và phân quyền JWT (Authentication & Authorization Middleware)
 * Bảo vệ các tài nguyên yêu cầu đăng nhập và phân quyền RBAC
 */

const jwtHelper = require('../utils/jwtHelper');

/**
 * Middleware kiểm tra JWT Token trong Header của request
 * Hỗ trợ header "Authorization: Bearer <token>" hoặc "x-access-token"
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.headers['x-access-token'];

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Yêu cầu token xác thực. Vui lòng cung cấp Authorization header.'
        });
    }

    // Tách token từ định dạng "Bearer <token>"
    let token = authHeader;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token xác thực không hợp lệ hoặc bị trống.'
        });
    }

    const verification = jwtHelper.verifyToken(token);
    if (!verification.valid) {
        return res.status(401).json({
            success: false,
            message: verification.error || 'Token xác thực không hợp lệ hoặc đã hết hạn.'
        });
    }

    // Gán thông tin người dùng đã giải mã vào req.user
    req.user = verification.payload;
    next();
}

/**
 * Middleware phân quyền dựa trên vai trò (Role-Based Access Control)
 * @param  {...string} allowedRoles - Danh sách các vai trò được cấp quyền
 */
function requireRole(...allowedRoles) {
    const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: 'Chưa xác thực danh tính người dùng.'
            });
        }

        const userRole = String(req.user.role).toLowerCase();
        if (!normalizedAllowed.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có thẩm quyền truy cập tài nguyên này.'
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole
};
