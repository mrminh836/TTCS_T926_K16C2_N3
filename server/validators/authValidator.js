/**
 * Validator xác thực dữ liệu đầu vào cho Auth APIs (Register & Login)
 * Đảm bảo kiểm tra chặt chẽ dữ liệu đầu vào trước khi chuyển vào Service
 */

const authConfig = require('../config/auth');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

/**
 * Xác thực dữ liệu đăng ký tài khoản mới (POST /api/auth/register)
 * @param {Object} data - req.body
 * @returns {{ isValid: boolean, errors: string[], value?: Object }}
 */
function validateRegister(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
        return {
            isValid: false,
            errors: ['Dữ liệu đăng ký không hợp lệ.'],
            value: null
        };
    }

    const rawUsername = data.username !== undefined ? String(data.username).trim() : '';
    const rawEmail = data.email !== undefined ? String(data.email).trim() : '';
    const rawPassword = data.password !== undefined ? String(data.password) : '';
    const rawFullName = data.fullName !== undefined ? String(data.fullName).trim() : (data.name ? String(data.name).trim() : '');

    // 1. Kiểm tra username
    if (!rawUsername) {
        errors.push('Tên người dùng (username) là trường bắt buộc.');
    } else if (rawUsername.length < 3 || rawUsername.length > 30) {
        errors.push('Tên người dùng phải có độ dài từ 3 đến 30 ký tự.');
    } else if (!USERNAME_REGEX.test(rawUsername)) {
        errors.push('Tên người dùng chỉ được chứa chữ cái, chữ số, dấu chấm (.), gạch dưới (_) và gạch ngang (-).');
    }

    // 2. Kiểm tra email
    if (!rawEmail) {
        errors.push('Email là trường bắt buộc.');
    } else if (!EMAIL_REGEX.test(rawEmail) || rawEmail.length > 100) {
        errors.push('Địa chỉ email không đúng định dạng hợp lệ.');
    }

    // 3. Kiểm tra mật khẩu (độ dài tối thiểu 6 ký tự)
    if (!rawPassword) {
        errors.push('Mật khẩu là trường bắt buộc.');
    } else if (rawPassword.length < 6) {
        errors.push('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
    } else if (rawPassword.length > 100) {
        errors.push('Mật khẩu không được vượt quá 100 ký tự.');
    }

    // 4. Quyền hạn (Role): Tuyệt đối không cho phép client tự chỉ định role ADMIN/MANAGER
    // Luôn luôn thiết lập role mặc định là 'USER'
    const role = authConfig.defaultRole;

    // 5. Họ tên hiển thị (nếu không cung cấp, lấy username làm mặc định)
    const fullName = rawFullName || rawUsername;

    return {
        isValid: errors.length === 0,
        errors,
        value: errors.length === 0 ? {
            username: rawUsername.toLowerCase(),
            email: rawEmail.toLowerCase(),
            password: rawPassword,
            fullName,
            role
        } : null
    };
}

/**
 * Xác thực dữ liệu đăng nhập (POST /api/auth/login)
 * @param {Object} data - req.body
 * @returns {{ isValid: boolean, errors: string[], value?: Object }}
 */
function validateLogin(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
        return {
            isValid: false,
            errors: ['Dữ liệu đăng nhập không hợp lệ.'],
            value: null
        };
    }

    const rawIdentifier = data.username !== undefined ? String(data.username).trim() : (data.email !== undefined ? String(data.email).trim() : (data.identifier !== undefined ? String(data.identifier).trim() : ''));
    const rawPassword = data.password !== undefined ? String(data.password) : '';

    if (!rawIdentifier) {
        errors.push('Vui lòng nhập tên đăng nhập hoặc địa chỉ email.');
    }

    if (!rawPassword) {
        errors.push('Vui lòng nhập mật khẩu.');
    }

    return {
        isValid: errors.length === 0,
        errors,
        value: errors.length === 0 ? {
            identifier: rawIdentifier,
            password: rawPassword
        } : null
    };
}

/**
 * Xác thực dữ liệu đổi mật khẩu (POST /api/auth/change-password)
 * @param {Object} data - req.body
 * @returns {{ isValid: boolean, errors: string[], value?: Object }}
 */
function validateChangePassword(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
        return {
            isValid: false,
            errors: ['Dữ liệu đổi mật khẩu không hợp lệ.'],
            value: null
        };
    }

    const currentPassword = data.currentPassword !== undefined ? String(data.currentPassword) : '';
    const newPassword = data.newPassword !== undefined ? String(data.newPassword) : '';
    const confirmPassword = data.confirmPassword !== undefined ? String(data.confirmPassword) : '';

    if (!currentPassword) {
        errors.push('Vui lòng nhập mật khẩu hiện tại.');
    }

    if (!newPassword) {
        errors.push('Vui lòng nhập mật khẩu mới.');
    } else if (newPassword.length < 6) {
        errors.push('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.');
    } else if (newPassword.length > 100) {
        errors.push('Mật khẩu mới không được vượt quá 100 ký tự.');
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
        errors.push('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
    }

    if (!confirmPassword) {
        errors.push('Vui lòng xác nhận lại mật khẩu mới.');
    } else if (newPassword !== confirmPassword) {
        errors.push('Xác nhận mật khẩu mới không khớp.');
    }

    return {
        isValid: errors.length === 0,
        errors,
        value: errors.length === 0 ? {
            currentPassword,
            newPassword
        } : null
    };
}

module.exports = {
    validateRegister,
    validateLogin,
    validateChangePassword
};
