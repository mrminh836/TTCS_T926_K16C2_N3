const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const authValidator = require('../validators/authValidator');
const authService = require('../services/authService');
const User = require('../models/userModel');

describe('BỘ KIỂM THỬ TÍNH NĂNG ĐỔI MẬT KHẨU (CHANGE PASSWORD)', () => {

    it('1. Validation: Báo lỗi nếu thiếu mật khẩu hiện tại', () => {
        const val = authValidator.validateChangePassword({
            currentPassword: '',
            newPassword: 'Password456',
            confirmPassword: 'Password456'
        });
        assert.equal(val.isValid, false);
        assert.ok(val.errors.some(e => e.includes('mật khẩu hiện tại')));
    });

    it('2. Validation: Báo lỗi nếu mật khẩu mới dưới 6 ký tự', () => {
        const val = authValidator.validateChangePassword({
            currentPassword: 'Password123',
            newPassword: '123',
            confirmPassword: '123'
        });
        assert.equal(val.isValid, false);
        assert.ok(val.errors.some(e => e.includes('tối thiểu 6 ký tự')));
    });

    it('3. Validation: Báo lỗi nếu mật khẩu mới trùng mật khẩu cũ', () => {
        const val = authValidator.validateChangePassword({
            currentPassword: 'Password123',
            newPassword: 'Password123',
            confirmPassword: 'Password123'
        });
        assert.equal(val.isValid, false);
        assert.ok(val.errors.some(e => e.includes('không được trùng')));
    });

    it('4. Validation: Báo lỗi nếu xác nhận mật khẩu không khớp', () => {
        const val = authValidator.validateChangePassword({
            currentPassword: 'Password123',
            newPassword: 'NewPassword123',
            confirmPassword: 'DifferentPassword123'
        });
        assert.equal(val.isValid, false);
        assert.ok(val.errors.some(e => e.includes('không khớp')));
    });

    it('5. Validation: Hợp lệ khi cung cấp đầy đủ thông tin đúng quy chuẩn', () => {
        const val = authValidator.validateChangePassword({
            currentPassword: 'Password123',
            newPassword: 'NewSecurePassword123',
            confirmPassword: 'NewSecurePassword123'
        });
        assert.equal(val.isValid, true);
        assert.equal(val.errors.length, 0);
        assert.equal(val.value.currentPassword, 'Password123');
        assert.equal(val.value.newPassword, 'NewSecurePassword123');
    });

    it('6. Nghiệp vụ: Báo lỗi 400 nếu mật khẩu hiện tại không đúng', async () => {
        await assert.rejects(
            async () => {
                await authService.changePassword(4, {
                    currentPassword: 'WrongPassword999',
                    newPassword: 'NewPassword123'
                });
            },
            (err) => {
                assert.equal(err.status, 400);
                assert.ok(err.message.includes('Mật khẩu hiện tại không chính xác'));
                return true;
            }
        );
    });

    it('7. Nghiệp vụ: Đổi mật khẩu thành công khi đúng mật khẩu cũ', async () => {
        const result = await authService.changePassword(4, {
            currentPassword: 'Password123',
            newPassword: 'NewPassword123'
        });
        assert.equal(result.success, true);
        assert.ok(result.message.includes('thành công'));

        // Kiểm tra sau khi đổi: dùng mật khẩu mới đổi lại mật khẩu cũ thành công
        const resetResult = await authService.changePassword(4, {
            currentPassword: 'NewPassword123',
            newPassword: 'Password123'
        });
        assert.equal(resetResult.success, true);
    });
});
