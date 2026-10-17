/**
 * Cấu hình bảo mật và xác thực (Authentication Configuration)
 * Quản lý biến môi trường JWT, thuật toán mã hóa mật khẩu và phân quyền RBAC
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
    throw new Error('FATAL SECURITY ERROR: Biến môi trường JWT_SECRET chưa được thiết lập hoặc quá ngắn trong môi trường production!');
}

const authConfig = {
    // JWT Secret Key - Nạp từ biến môi trường, tuyệt đối không hardcode trong production
    jwtSecret: jwtSecret || 'dev_only_insecure_jwt_secret_ictu_meeting_mgmt_key',

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
