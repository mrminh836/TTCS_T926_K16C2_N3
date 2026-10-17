/**
 * Service xử lý nghiệp vụ Xác thực & Đăng nhập (Auth Service)
 * Đảm bảo mã hóa mật khẩu an toàn bằng BCrypt và cấp phát JWT Token chuẩn Enterprise
 */

const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const jwtHelper = require('../utils/jwtHelper');
const authConfig = require('../config/auth');

const authService = {
    /**
     * Đăng ký tài khoản người dùng mới
     * @param {Object} registerData
     * @param {string} registerData.username - Tên người dùng định danh
     * @param {string} registerData.email - Địa chỉ email
     * @param {string} registerData.password - Mật khẩu dạng plain text
     * @param {string} [registerData.fullName] - Họ tên người dùng
     * @returns {Promise<Object>} Safe user record
     */
    register: async (registerData) => {
        const { username, email, password, fullName } = registerData;

        // 1. Kiểm tra username đã tồn tại chưa
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            const error = new Error('Tên người dùng đã được sử dụng. Vui lòng chọn tên khác.');
            error.status = 409;
            throw error;
        }

        // 2. Kiểm tra email đã tồn tại chưa
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            const error = new Error('Địa chỉ email đã được đăng ký trên hệ thống.');
            error.status = 409;
            throw error;
        }

        // 3. Mã hóa mật khẩu bằng BCrypt (Salt rounds = 10)
        // Tuyệt đối không lưu mật khẩu dạng văn bản thuần
        const passwordHash = await bcrypt.hash(password, authConfig.bcryptSaltRounds);

        // 4. Tạo tài khoản trong cơ sở dữ liệu với role mặc định 'USER'
        // Tuyệt đối không cho phép client tự cấp quyền ADMIN
        const newUser = await User.create({
            username,
            fullName: fullName || username,
            email,
            passwordHash,
            role: authConfig.defaultRole
        });

        // 5. Trả về thông tin tài khoản an toàn (không có PasswordHash)
        return {
            success: true,
            message: 'Đăng ký tài khoản người dùng thành công.',
            user: newUser
        };
    },

    /**
     * Đăng nhập tài khoản và cấp phát JWT Token
     * @param {Object} loginData
     * @param {string} loginData.identifier - Username hoặc Email
     * @param {string} loginData.password - Mật khẩu dạng plain text
     * @returns {Promise<Object>} JWT token và safe user info
     */
    login: async (loginData) => {
        const { identifier, password } = loginData;

        // 1. Tìm kiếm tài khoản theo username hoặc email
        const user = await User.findByUsernameOrEmail(identifier, { includePassword: true });

        // Thông báo lỗi chung để ngăn dò quét tài khoản (Security best practice)
        const invalidCredentialsError = new Error('Tên đăng nhập hoặc mật khẩu không chính xác.');
        invalidCredentialsError.status = 401;

        if (!user || !user.PasswordHash) {
            throw invalidCredentialsError;
        }

        // 2. Đối soát mật khẩu bằng BCrypt
        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
        if (!isPasswordValid) {
            throw invalidCredentialsError;
        }

        // 3. Tạo Payload và ký JWT Token
        const tokenPayload = {
            userId: user.userId,
            username: user.username,
            email: user.email,
            role: user.role
        };

        const token = jwtHelper.generateToken(tokenPayload);

        // 4. Bóc tách thông tin người dùng an toàn (không chứa PasswordHash)
        const safeUser = {
            userId: user.userId,
            id: user.userId,
            username: user.username,
            fullName: user.fullName,
            name: user.fullName,
            email: user.email,
            role: user.role,
            department: user.department,
            createdAt: user.createdAt
        };

        return {
            success: true,
            message: 'Đăng nhập thành công.',
            token,
            tokenType: 'Bearer',
            expiresIn: authConfig.jwtExpiresIn,
            user: safeUser
        };
    }
};

module.exports = authService;
