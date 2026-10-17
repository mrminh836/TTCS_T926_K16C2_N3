/**
 * Bộ kiểm thử tự động cho Module Xác thực & Phân quyền (Authentication & Authorization)
 * API POST /api/auth/register & POST /api/auth/login
 * Tuân thủ quy chuẩn Enterprise và mục 6 trong tài liệu yêu cầu.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const authValidator = require('../validators/authValidator');
const authService = require('../services/authService');
const authController = require('../controllers/authController');
const jwtHelper = require('../utils/jwtHelper');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const db = require('../config/database');

function createMockReqRes({ params = {}, query = {}, body = {}, headers = {} } = {}) {
    const req = {
        params,
        query,
        body,
        headers
    };
    const res = {
        statusCode: null,
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

describe('BỘ KIỂM THỬ XÁC THỰC NGƯỜI DÙNG (AUTHENTICATION & JWT APIS)', () => {

    const testTimestamp = Date.now();
    const testUsername = `user_${testTimestamp}`;
    const testEmail = `user_${testTimestamp}@example.com`;
    const testPassword = 'Password123';

    after(async () => {
        try {
            // Dọn dẹp dữ liệu kiểm thử nếu kết nối CSDL khả dụng
            await db.query('DELETE FROM Users WHERE Username LIKE ? OR Email LIKE ?', [
                `user_${testTimestamp}%`,
                `%${testTimestamp}@example.com`
            ]);
            await db.end();
        } catch {
            // Môi trường test không có MySQL hoặc pool đã đóng
        }
    });

    // =========================================================================
    // 1. KIỂM THỬ VALIDATOR (DỮ LIỆU ĐẦU VÀO)
    // =========================================================================
    describe('1. Kiểm thử Validator (authValidator)', () => {

        it('TC-VAL-001: Hợp lệ với dữ liệu đăng ký chuẩn (username, email, password)', () => {
            const result = authValidator.validateRegister({
                username: 'validuser',
                email: 'valid@enterprise.vn',
                password: 'Password123'
            });
            assert.equal(result.isValid, true);
            assert.equal(result.errors.length, 0);
            assert.equal(result.value.role, 'USER');
            assert.equal(result.value.fullName, 'validuser');
        });

        it('TC-VAL-002: Báo lỗi khi thiếu các trường bắt buộc (username, email, password)', () => {
            const result = authValidator.validateRegister({});
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('username')));
            assert.ok(result.errors.some(e => e.includes('Email')));
            assert.ok(result.errors.some(e => e.includes('Mật khẩu')));
        });

        it('TC-VAL-003: Báo lỗi khi định dạng email sai', () => {
            const result = authValidator.validateRegister({
                username: 'user01',
                email: 'invalid-email-format',
                password: 'Password123'
            });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('email không đúng định dạng')));
        });

        it('TC-VAL-004: Báo lỗi khi mật khẩu ngắn hơn 6 ký tự', () => {
            const result = authValidator.validateRegister({
                username: 'user02',
                email: 'user02@enterprise.vn',
                password: '123'
            });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('tối thiểu 6 ký tự')));
        });

        it('TC-VAL-005: Báo lỗi khi username chứa ký tự đặc biệt không cho phép', () => {
            const result = authValidator.validateRegister({
                username: 'user@bad#name',
                email: 'user03@enterprise.vn',
                password: 'Password123'
            });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('Tên người dùng chỉ được chứa')));
        });

        it('TC-VAL-006: Tuyệt đối gán role mặc định là USER kể cả khi client gửi role ADMIN', () => {
            const result = authValidator.validateRegister({
                username: 'hacker_role',
                email: 'hacker@test.com',
                password: 'Password123',
                role: 'ADMIN'
            });
            assert.equal(result.isValid, true);
            assert.equal(result.value.role, 'USER', 'Role phải được chuẩn hóa thành USER');
        });

        it('TC-VAL-007: Validator đăng nhập kiểm tra đủ identifier và password', () => {
            const invalidResult = authValidator.validateLogin({});
            assert.equal(invalidResult.isValid, false);
            assert.ok(invalidResult.errors.length >= 2);

            const validResult = authValidator.validateLogin({
                username: 'myuser',
                password: 'mypassword'
            });
            assert.equal(validResult.isValid, true);
        });
    });

    // =========================================================================
    // 2. KIỂM THỬ JWT HELPER (TẠO, KÝ VÀ XÁC MINH TOKEN)
    // =========================================================================
    describe('2. Kiểm thử JWT Token Helper (jwtHelper)', () => {

        it('TC-JWT-001: Ký và xác minh Token hợp lệ', () => {
            const payload = { userId: 99, username: 'testuser', email: 'test@ent.vn', role: 'USER' };
            const token = jwtHelper.generateToken(payload);
            assert.ok(typeof token === 'string' && token.split('.').length === 3, 'JWT phải có 3 phần tách bởi dấu chấm');

            const verified = jwtHelper.verifyToken(token);
            assert.equal(verified.valid, true);
            assert.equal(verified.payload.userId, 99);
            assert.equal(verified.payload.username, 'testuser');
            assert.equal(verified.payload.role, 'USER');
        });

        it('TC-JWT-002: Báo lỗi khi Token sai chữ ký hoặc bị can thiệp', () => {
            const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5fQ.fake_signature_abc123';
            const verified = jwtHelper.verifyToken(tamperedToken);
            assert.equal(verified.valid, false);
            assert.equal(verified.expired, false);
            assert.ok(verified.error.includes('không hợp lệ'));
        });

        it('TC-JWT-003: Báo lỗi khi Token đã hết hạn', () => {
            const expiredToken = jwtHelper.generateToken({ userId: 1 }, { expiresIn: '0s' });
            const verified = jwtHelper.verifyToken(expiredToken);
            assert.equal(verified.valid, false);
            assert.equal(verified.expired, true);
            assert.ok(verified.error.includes('hết hạn'));
        });
    });

    // =========================================================================
    // 3. KIỂM THỬ API ĐĂNG KÝ (POST /api/auth/register)
    // =========================================================================
    describe('3. Kiểm thử API Đăng Ký (POST /api/auth/register)', () => {

        it('TC-REG-001: Đăng ký tài khoản hợp lệ thành công -> HTTP 201', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    username: testUsername,
                    email: testEmail,
                    password: testPassword
                }
            });

            await authController.register(req, res, () => {});

            assert.equal(res.statusCode, 201, 'Mã trạng thái phải là 201 Created');
            assert.equal(res.jsonData.success, true);
            assert.ok(res.jsonData.data, 'Phải trả về thông tin tài khoản');
            assert.equal(res.jsonData.data.username, testUsername);
            assert.equal(res.jsonData.data.email, testEmail);
            assert.equal(res.jsonData.data.role, 'USER');

            // Bảo mật: Tuyệt đối không trả về mật khẩu hay PasswordHash
            assert.equal(res.jsonData.data.password, undefined);
            assert.equal(res.jsonData.data.PasswordHash, undefined);
            assert.equal(res.jsonData.data.passwordHash, undefined);
        });

        it('TC-REG-002: Mật khẩu trong cơ sở dữ liệu phải được mã hóa bằng BCrypt', async () => {
            const userInDb = await User.findByUsernameOrEmail(testUsername, { includePassword: true });
            assert.ok(userInDb, 'Tài khoản phải tồn tại trong CSDL');
            assert.ok(userInDb.PasswordHash, 'Trường PasswordHash phải tồn tại trong CSDL');
            assert.notEqual(userInDb.PasswordHash, testPassword, 'Tuyệt đối không lưu mật khẩu thuần');
            assert.ok(userInDb.PasswordHash.startsWith('$2'), 'Mật khẩu phải có tiền tố BCrypt ($2a$ hoặc $2b$)');

            // Xác thực hàm đối soát BCrypt khớp với mật khẩu gốc
            const isMatch = await bcrypt.compare(testPassword, userInDb.PasswordHash);
            assert.equal(isMatch, true, 'BCrypt phải giải mã và xác nhận trùng khớp với mật khẩu');
        });

        it('TC-REG-003: Đăng ký với username đã tồn tại -> HTTP 409 Conflict', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    username: testUsername, // Trùng username vừa tạo
                    email: `unique_${Date.now()}@example.com`,
                    password: 'Password123'
                }
            });

            await authController.register(req, res, () => {});

            assert.equal(res.statusCode, 409, 'Mã trạng thái phải là 409 Conflict');
            assert.equal(res.jsonData.success, false);
            assert.ok(res.jsonData.message.includes('Tên người dùng đã được sử dụng'));
        });

        it('TC-REG-004: Đăng ký với email đã tồn tại -> HTTP 409 Conflict', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    username: `newuser_${Date.now()}`,
                    email: testEmail, // Trùng email vừa tạo
                    password: 'Password123'
                }
            });

            await authController.register(req, res, () => {});

            assert.equal(res.statusCode, 409, 'Mã trạng thái phải là 409 Conflict');
            assert.equal(res.jsonData.success, false);
            assert.ok(res.jsonData.message.includes('email đã được đăng ký'));
        });

        it('TC-REG-005: Đăng ký thiếu dữ liệu -> HTTP 400 Bad Request', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    username: 'test_empty'
                }
            });

            await authController.register(req, res, () => {});

            assert.equal(res.statusCode, 400, 'Mã trạng thái phải là 400 Bad Request');
            assert.equal(res.jsonData.success, false);
            assert.ok(Array.isArray(res.jsonData.errors));
        });

        it('TC-REG-006: Người dùng tự chỉ định role ADMIN bị chặn -> Role mặc định là USER', async () => {
            const bypassUsername = `bypass_${Date.now()}`;
            const { req, res } = createMockReqRes({
                body: {
                    username: bypassUsername,
                    email: `${bypassUsername}@example.com`,
                    password: 'Password123',
                    role: 'ADMIN' // Cố ý gửi role ADMIN
                }
            });

            await authController.register(req, res, () => {});

            assert.equal(res.statusCode, 201);
            assert.equal(res.jsonData.data.role, 'USER', 'Role phải là USER không thể là ADMIN');
        });
    });

    // =========================================================================
    // 4. KIỂM THỬ API ĐĂNG NHẬP (POST /api/auth/login)
    // =========================================================================
    describe('4. Kiểm thử API Đăng Nhập (POST /api/auth/login)', () => {

        it('TC-LOG-001: Đăng nhập thành công với Username và Mật khẩu đúng -> HTTP 200 + JWT Token', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    username: testUsername,
                    password: testPassword
                }
            });

            await authController.login(req, res, () => {});

            assert.equal(res.statusCode, 200, 'Mã trạng thái phải là 200 OK');
            assert.equal(res.jsonData.success, true);
            assert.ok(res.jsonData.token, 'Phải phát hành token');
            assert.equal(res.jsonData.tokenType, 'Bearer');
            assert.equal(res.jsonData.expiresIn, '24h');

            // Kiểm tra thông tin người dùng an toàn
            assert.equal(res.jsonData.user.username, testUsername);
            assert.equal(res.jsonData.user.email, testEmail);
            assert.equal(res.jsonData.user.role, 'USER');
            assert.equal(res.jsonData.user.password, undefined);
            assert.equal(res.jsonData.user.PasswordHash, undefined);

            // Kiểm tra giải mã token
            const decoded = jwtHelper.verifyToken(res.jsonData.token);
            assert.equal(decoded.valid, true);
            assert.equal(decoded.payload.username, testUsername);
            assert.equal(decoded.payload.role, 'USER');
        });

        it('TC-LOG-002: Đăng nhập thành công khi dùng Email thay cho Username -> HTTP 200', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    username: testEmail, // Dùng email trong trường username
                    password: testPassword
                }
            });

            await authController.login(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.ok(res.jsonData.token);
            assert.equal(res.jsonData.user.email, testEmail);
        });

        it('TC-LOG-003: Đăng nhập sai mật khẩu -> HTTP 401 Unauthorized', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    username: testUsername,
                    password: 'WrongPassword999'
                }
            });

            await authController.login(req, res, () => {});

            assert.equal(res.statusCode, 401, 'Mã trạng thái phải là 401');
            assert.equal(res.jsonData.success, false);
            assert.equal(res.jsonData.message, 'Tên đăng nhập hoặc mật khẩu không chính xác.');
        });

        it('TC-LOG-004: Đăng nhập với tài khoản không tồn tại -> HTTP 401 (Không tiết lộ tài khoản tồn tại)', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    username: 'ghost_non_existent_user_99999',
                    password: 'Password123'
                }
            });

            await authController.login(req, res, () => {});

            assert.equal(res.statusCode, 401);
            assert.equal(res.jsonData.success, false);
            // Thông điệp bảo mật phải giống hệt như khi sai mật khẩu
            assert.equal(res.jsonData.message, 'Tên đăng nhập hoặc mật khẩu không chính xác.');
        });

        it('TC-LOG-005: Đăng nhập thiếu thông tin -> HTTP 400 Bad Request', async () => {
            const { req, res } = createMockReqRes({
                body: {}
            });

            await authController.login(req, res, () => {});

            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
        });
    });

    // =========================================================================
    // 5. KIỂM THỬ MIDDLEWARE XÁC THỰC VÀ PHÂN QUYỀN (authMiddleware)
    // =========================================================================
    describe('5. Kiểm thử Middleware Xác thực (authenticateToken & requireRole)', () => {

        it('TC-MID-001: Cho phép tiếp tục (next) khi có Bearer Token hợp lệ', () => {
            const token = jwtHelper.generateToken({ userId: 15, username: 'testuser', role: 'USER' });
            const { req, res } = createMockReqRes({
                headers: {
                    authorization: `Bearer ${token}`
                }
            });

            let nextCalled = false;
            authenticateToken(req, res, () => {
                nextCalled = true;
            });

            assert.equal(nextCalled, true, 'Next() phải được gọi');
            assert.ok(req.user, 'req.user phải được đính kèm');
            assert.equal(req.user.username, 'testuser');
        });

        it('TC-MID-002: Chặn lại với HTTP 401 khi không có Authorization header', () => {
            const { req, res } = createMockReqRes({ headers: {} });

            authenticateToken(req, res, () => {
                assert.fail('Không được gọi next() khi thiếu token');
            });

            assert.equal(res.statusCode, 401);
            assert.equal(res.jsonData.success, false);
        });

        it('TC-MID-003: Chặn lại với HTTP 401 khi token sai chữ ký', () => {
            const { req, res } = createMockReqRes({
                headers: { authorization: 'Bearer invalid_signature_token' }
            });

            authenticateToken(req, res, () => {
                assert.fail('Không được gọi next()');
            });

            assert.equal(res.statusCode, 401);
        });

        it('TC-MID-004: requireRole cho phép khi đúng vai trò', () => {
            const req = { user: { role: 'Admin' } };
            const res = {};
            let nextCalled = false;

            const adminMiddleware = requireRole('Admin', 'Manager');
            adminMiddleware(req, res, () => {
                nextCalled = true;
            });

            assert.equal(nextCalled, true);
        });

        it('TC-MID-005: requireRole từ chối với HTTP 403 khi sai vai trò', () => {
            const req = { user: { role: 'USER' } };
            const { res } = createMockReqRes();

            const adminMiddleware = requireRole('Admin');
            adminMiddleware(req, res, () => {
                assert.fail('Không được phép gọi next');
            });

            assert.equal(res.statusCode, 403);
            assert.equal(res.jsonData.success, false);
        });
    });
});
