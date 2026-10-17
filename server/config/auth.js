/**
 * Cấu hình bảo mật và xác thực (Authentication Configuration)
 * Quản lý biến môi trường JWT, thuật toán mã hóa mật khẩu và phân quyền RBAC
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const authConfig = {
    // JWT Secret Key - Tuyệt đối không để lộ trong source code khi triển khai production
    jwtSecret: process.env.JWT_SECRET || 'ictu_meeting_management_jwt_secret_key_2026_enterprise',

    // Thời hạn token mặc định (24 giờ)
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

    // Số vòng băm mật khẩu BCrypt
    bcryptSaltRounds: 10,

    // Vai trò mặc định khi đăng ký mới
    defaultRole: 'USER',

    // Danh sách vai trò không được phép tự chỉ định khi đăng ký
    restrictedRoles: ['ADMIN', 'MANAGER', 'SECRETARY']
};

module.exports = authConfig;
