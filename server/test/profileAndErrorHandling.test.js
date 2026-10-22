/**
 * ==============================================================================
 * BỘ KIỂM THỬ TỰ ĐỘNG: USER PROFILE & STANDARDIZED ERROR HANDLING
 * APIs: GET /api/users/profile, PUT /api/users/profile
 * Middleware: server/middleware/errorHandler.js
 * ==============================================================================
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const User = require('../models/userModel');
const userController = require('../controllers/userController');
const { AppError, errorHandler, notFoundHandler } = require('../middleware/errorHandler');
const { validateUpdateProfile } = require('../validators/profileValidator');

function createMockReqRes({ user = null, body = {}, params = {}, query = {}, url = '/api/users/profile', method = 'GET' } = {}) {
    const req = {
        user,
        body,
        params,
        query,
        originalUrl: url,
        method
    };
    const res = {
        statusCode: 200,
        jsonData: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        }
    };
    return { req, res };
}

describe('1. KIỂM THỬ API USER PROFILE (GET /api/users/profile & PUT /api/users/profile)', () => {
    let testUserId = null;
    const testUsername = `test_prof_${Date.now()}`;
    const initialEmail = `profile_${Date.now()}@enterprise.vn`;
    const initialPassword = 'Password123!';

    before(async () => {
        // Tạo một user kiểm thử trong database
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(initialPassword, salt);
        const [result] = await db.execute(
            `INSERT INTO Users (Username, PasswordHash, FullName, Email, Department, Role)
             VALUES (?, ?, ?, ?, ?, 'USER')`,
            [testUsername, hash, 'Kiểm thử Profile Ban đầu', initialEmail, 'Công nghệ thông tin']
        );
        testUserId = result.insertId;
    });

    after(async () => {
        if (testUserId) {
            await db.execute('DELETE FROM Users WHERE UserID = ?', [testUserId]);
        }
    });

    it('TC-PROF-01: User.getUserMeetingStats() tính toán số liệu thống kê họp chính xác', async () => {
        const stats = await User.getUserMeetingStats(testUserId);
        assert.ok(typeof stats === 'object', 'Stats phải là object');
        assert.ok(typeof stats.hostedCount === 'number', 'hostedCount là number');
        assert.ok(typeof stats.participantCount === 'number', 'participantCount là number');
        assert.ok(typeof stats.upcomingCount === 'number', 'upcomingCount là number');
    });

    it('TC-PROF-02: Controller getProfile trả về đầy đủ thông tin cá nhân và số liệu họp, KHÔNG lộ PasswordHash', async () => {
        const { req, res } = createMockReqRes({
            user: { userId: testUserId, username: testUsername }
        });

        await userController.getProfile(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.jsonData.success, true);
        assert.ok(res.jsonData.data, 'data không được null');
        assert.equal(res.jsonData.data.userId, testUserId);
        assert.equal(res.jsonData.data.username, testUsername);
        assert.equal(res.jsonData.data.email, initialEmail);
        assert.equal(res.jsonData.data.department, 'Công nghệ thông tin');
        assert.ok(res.jsonData.data.stats, 'phải có stats');
        assert.equal(res.jsonData.data.passwordHash, undefined, 'Tuyệt đối không được lộ passwordHash');
        assert.equal(res.jsonData.data.PasswordHash, undefined, 'Tuyệt đối không được lộ PasswordHash');
    });

    it('TC-PROF-03: Controller updateProfile cập nhật thành công fullName, email, department', async () => {
        const updatedName = 'Kỹ sư Cập Nhật Mới';
        const updatedEmail = `new_email_${Date.now()}@enterprise.vn`;
        const updatedDept = 'Phát triển Sản phẩm';

        const { req, res } = createMockReqRes({
            user: { userId: testUserId },
            body: {
                fullName: updatedName,
                email: updatedEmail,
                department: updatedDept
            }
        });

        await userController.updateProfile(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.jsonData.success, true);
        assert.equal(res.jsonData.data.fullName, updatedName);
        assert.equal(res.jsonData.data.email, updatedEmail);
        assert.equal(res.jsonData.data.department, updatedDept);

        // Kiểm tra trực tiếp trong DB
        const userInDb = await User.findById(testUserId);
        assert.equal(userInDb.fullName, updatedName);
        assert.equal(userInDb.email, updatedEmail);
        assert.equal(userInDb.department, updatedDept);
    });

    it('TC-PROF-04: Cập nhật mật khẩu thất bại nếu currentPassword không đúng', async () => {
        const { req, res } = createMockReqRes({
            user: { userId: testUserId },
            body: {
                currentPassword: 'WrongPassword999',
                newPassword: 'NewValidPassword123!',
                confirmPassword: 'NewValidPassword123!'
            }
        });

        await userController.updateProfile(req, res);

        assert.equal(res.statusCode, 400);
        assert.equal(res.jsonData.success, false);
        assert.match(res.jsonData.message, /hiện tại không chính xác/i);
    });

    it('TC-PROF-05: Cập nhật mật khẩu thành công và xác thực được mật khẩu mới', async () => {
        const newPassword = 'BrandNewPassword888!';

        const { req, res } = createMockReqRes({
            user: { userId: testUserId },
            body: {
                currentPassword: initialPassword,
                newPassword: newPassword,
                confirmPassword: newPassword
            }
        });

        await userController.updateProfile(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.jsonData.success, true);
        assert.match(res.jsonData.message, /đổi mật khẩu thành công/i);

        // Kiểm tra mật khẩu mới trong DB có thể login được không
        const authUser = await User.findByUsernameOrEmail(testUsername, { includePassword: true });
        assert.ok(authUser && authUser.PasswordHash, 'Phải lấy được PasswordHash mới');
        const match = await bcrypt.compare(newPassword, authUser.PasswordHash);
        assert.equal(match, true, 'Mật khẩu mới phải khớp với bcrypt hash trong DB');
    });

    it('TC-PROF-06: Profile Validator từ chối email sai định dạng hoặc mật khẩu mới quá ngắn', () => {
        const res1 = validateUpdateProfile({ email: 'invalid-email-string' });
        assert.equal(res1.isValid, false);
        assert.ok(res1.errors.some(e => e.toLowerCase().includes('email')));

        const res2 = validateUpdateProfile({ currentPassword: 'old', newPassword: '123', confirmPassword: '123' });
        assert.equal(res2.isValid, false);
        assert.ok(res2.errors.some(e => e.includes('6 ký tự')));
    });
});

describe('2. KIỂM THỬ CHUẨN HÓA ERROR HANDLING MIDDLEWARE TẬP TRUNG', () => {
    it('TC-ERR-01: notFoundHandler trả về chuẩn 404 { success: false, message, errors, code: 404, timestamp }', () => {
        const { req, res } = createMockReqRes({ url: '/api/invalid/unknown-route', method: 'GET' });

        notFoundHandler(req, res);

        assert.equal(res.statusCode, 404);
        assert.equal(res.jsonData.success, false);
        assert.equal(res.jsonData.code, 404);
        assert.ok(res.jsonData.timestamp, 'timestamp phải tồn tại');
        assert.match(res.jsonData.message, /tuyến đường không tồn tại/i);
    });

    it('TC-ERR-02: AppError custom statusCode được errorHandler chuyển đổi chính xác', () => {
        const { req, res } = createMockReqRes({ url: '/api/test' });
        const customError = new AppError('Truy cập bị từ chối do thiếu quyền Admin', 403, [
            { field: 'role', message: 'Yêu cầu quyền ADMIN' }
        ]);

        errorHandler(customError, req, res, () => {});

        assert.equal(res.statusCode, 403);
        assert.equal(res.jsonData.success, false);
        assert.equal(res.jsonData.message, 'Truy cập bị từ chối do thiếu quyền Admin');
        assert.equal(res.jsonData.errors.length, 1);
        assert.equal(res.jsonData.errors[0].field, 'role');
    });

    it('TC-ERR-03: MySQL ER_DUP_ENTRY được errorHandler bắt và trả về mã 409 Conflict', () => {
        const { req, res } = createMockReqRes({ url: '/api/users' });
        const mysqlDupError = new Error('Duplicate entry test@enterprise.vn for key users.email');
        mysqlDupError.code = 'ER_DUP_ENTRY';

        errorHandler(mysqlDupError, req, res, () => {});

        assert.equal(res.statusCode, 409);
        assert.equal(res.jsonData.success, false);
        assert.equal(res.jsonData.code, 409);
        assert.match(res.jsonData.message, /đã được đăng ký|đã tồn tại/i);
    });

    it('TC-ERR-04: JSON SyntaxError được errorHandler bắt và trả về mã 400 Bad Request', () => {
        const { req, res } = createMockReqRes({ url: '/api/meetings' });
        const syntaxErr = new SyntaxError('Unexpected token } in JSON at position 12');
        syntaxErr.status = 400;

        errorHandler(syntaxErr, req, res, () => {});

        assert.equal(res.statusCode, 400);
        assert.equal(res.jsonData.success, false);
        assert.equal(res.jsonData.code, 400);
        assert.match(res.jsonData.message, /định dạng dữ liệu json/i);
    });
});
