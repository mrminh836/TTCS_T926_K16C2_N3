/**
 * ==============================================================================
 * VALIDATOR CẬP NHẬT HỒ SƠ & ĐỔI MẬT KHẨU (PROFILE VALIDATOR)
 * API: PUT /api/users/profile
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 * ==============================================================================
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Xóa bỏ các thẻ HTML để phòng chống tấn công Stored XSS
 */
function sanitizeInput(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Xác thực dữ liệu cập nhật thông tin hồ sơ và đổi mật khẩu
 * @param {Object} data - req.body
 * @returns {{ isValid: boolean, errors: string[], sanitized: Object }}
 */
function validateUpdateProfile(data = {}) {
    const errors = [];
    const sanitized = {};

    const {
        fullName,
        email,
        department,
        currentPassword,
        newPassword,
        confirmPassword
    } = data;

    // 1. Xác thực Họ và tên (FullName)
    if (fullName !== undefined) {
        const cleanedName = sanitizeInput(fullName);
        if (!cleanedName || cleanedName.length < 2) {
            errors.push('Họ và tên không được để trống và phải có ít nhất 2 ký tự.');
        } else if (cleanedName.length > 100) {
            errors.push('Họ và tên không được vượt quá 100 ký tự.');
        } else {
            sanitized.fullName = cleanedName;
        }
    }

    // 2. Xác thực Email
    if (email !== undefined) {
        const cleanedEmail = String(email).trim().toLowerCase();
        if (!cleanedEmail) {
            errors.push('Địa chỉ email không được để trống.');
        } else if (!EMAIL_REGEX.test(cleanedEmail)) {
            errors.push('Địa chỉ email không đúng định dạng chuẩn (ví dụ: user@enterprise.vn).');
        } else if (cleanedEmail.length > 100) {
            errors.push('Địa chỉ email không được vượt quá 100 ký tự.');
        } else {
            sanitized.email = cleanedEmail;
        }
    }

    // 3. Xác thực Phòng ban (Department)
    if (department !== undefined) {
        const cleanedDept = sanitizeInput(department);
        if (cleanedDept.length > 100) {
            errors.push('Tên phòng ban không được vượt quá 100 ký tự.');
        } else {
            sanitized.department = cleanedDept || 'Kỹ thuật';
        }
    }

    // 4. Xác thực Đổi mật khẩu (nếu có yêu cầu đổi mật khẩu)
    const isChangingPassword = Boolean(newPassword || currentPassword);

    if (isChangingPassword) {
        if (!currentPassword || typeof currentPassword !== 'string' || !currentPassword.trim()) {
            errors.push('Vui lòng nhập mật khẩu hiện tại để xác thực đổi mật khẩu.');
        }

        if (!newPassword || typeof newPassword !== 'string') {
            errors.push('Vui lòng nhập mật khẩu mới.');
        } else if (newPassword.length < 6) {
            errors.push('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.');
        } else if (newPassword.length > 100) {
            errors.push('Mật khẩu mới không được vượt quá 100 ký tự.');
        }

        if (currentPassword && newPassword && currentPassword === newPassword) {
            errors.push('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
        }

        if (confirmPassword !== undefined && confirmPassword !== newPassword) {
            errors.push('Xác nhận mật khẩu mới không khớp với mật khẩu mới.');
        }

        if (errors.length === 0) {
            sanitized.currentPassword = currentPassword;
            sanitized.newPassword = newPassword;
        }
    }

    // Kiểm tra xem có trường nào được cung cấp để cập nhật hay không
    const fieldsToUpdate = Object.keys(sanitized);
    if (fieldsToUpdate.length === 0 && errors.length === 0) {
        errors.push('Vui lòng cung cấp ít nhất một thông tin cần cập nhật (họ tên, email, phòng ban hoặc mật khẩu).');
    }

    return {
        isValid: errors.length === 0,
        errors,
        sanitized: errors.length === 0 ? sanitized : null
    };
}

module.exports = {
    sanitizeInput,
    validateUpdateProfile
};
