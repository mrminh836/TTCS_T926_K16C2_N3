/**
 * ==============================================================================
 * BỘ KIỂM THỬ TOÀN DIỆN MIDDLEWARE XÁC THỰC JWT VÀ PHÂN QUYỀN THEO ROLE (RBAC)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (ICTU Meeting)
 * ==============================================================================
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const jwtHelper = require('../utils/jwtHelper');
const {
    verifyJWT,
    requireRole,
    requireMeetingOwnerOrAdmin,
    requireSelfOrMeetingOwnerOrAdmin
} = require('../middleware/authMiddleware');

// Helper mock req và res
function createMockReqRes({ headers = {}, user = null, params = {}, body = {}, query = {} } = {}) {
    const req = {
        headers,
        user,
        params,
        body,
        query
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

describe('BỘ KIỂM THỬ MIDDLEWARE XÁC THỰC JWT & PHÂN QUYỀN ROLE (RBAC)', () => {

    // ==========================================================================
    // 1. KIỂM THỬ MIDDLEWARE verifyJWT
    // ==========================================================================
    describe('1. Kiểm thử verifyJWT', () => {

        it('TC-JWT-01: Trả về HTTP 401 khi không có Authorization header', () => {
            const { req, res } = createMockReqRes({ headers: {} });
            let nextCalled = false;

            verifyJWT(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false, 'Không được gọi next() khi thiếu header');
            assert.equal(res.statusCode, 401);
            assert.equal(res.jsonData.success, false);
            assert.match(res.jsonData.message, /Vui lòng cung cấp Authorization header/);
        });

        it('TC-JWT-02: Trả về HTTP 401 khi header sai định dạng (không có tiền tố Bearer hoặc token rỗng)', () => {
            // Case 1: Thiếu Bearer (ví dụ: Basic abc)
            const mock1 = createMockReqRes({ headers: { authorization: 'Basic dXNlcjpwYXNz' } });
            let nextCalled1 = false;
            verifyJWT(mock1.req, mock1.res, () => { nextCalled1 = true; });
            assert.equal(nextCalled1, false);
            assert.equal(mock1.res.statusCode, 401);

            // Case 2: Chỉ có chữ Bearer mà không có token
            const mock2 = createMockReqRes({ headers: { authorization: 'Bearer   ' } });
            let nextCalled2 = false;
            verifyJWT(mock2.req, mock2.res, () => { nextCalled2 = true; });
            assert.equal(nextCalled2, false);
            assert.equal(mock2.res.statusCode, 401);
        });

        it('TC-JWT-03: Trả về HTTP 401 khi token không hợp lệ (chuỗi rác hoặc can thiệp signature)', () => {
            const { req, res } = createMockReqRes({
                headers: { authorization: 'Bearer this_is_a_corrupted_token_string_abc' }
            });
            let nextCalled = false;

            verifyJWT(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 401);
            assert.equal(res.jsonData.success, false);
            assert.match(res.jsonData.message, /Token xác thực không hợp lệ/);
        });

        it('TC-JWT-04: Trả về HTTP 401 khi token đã hết hạn', () => {
            // Tạo token hết hạn ngay lập tức
            const expiredToken = jwtHelper.generateToken(
                { userId: 4, username: 'employee', role: 'Employee' },
                { expiresIn: '-1s' }
            );

            const { req, res } = createMockReqRes({
                headers: { authorization: `Bearer ${expiredToken}` }
            });
            let nextCalled = false;

            verifyJWT(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 401);
            assert.equal(res.jsonData.success, false);
            assert.equal(res.jsonData.message, 'Token xác thực đã hết hạn.');
        });

        it('TC-JWT-05: Trả về HTTP 401 khi token được ký bằng secret khác (giả mạo)', () => {
            const forgedToken = jwt.sign(
                { userId: 1, username: 'admin', role: 'Admin' },
                'wrong_hacker_secret_key_123456789'
            );

            const { req, res } = createMockReqRes({
                headers: { authorization: `Bearer ${forgedToken}` }
            });
            let nextCalled = false;

            verifyJWT(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 401);
            assert.equal(res.jsonData.success, false);
        });

        it('TC-JWT-06: Token hợp lệ -> gọi next(), gắn req.user chính xác (không chứa password/hash)', () => {
            const validToken = jwtHelper.generateToken({
                userId: 2,
                username: 'secretary',
                email: 'secretary@enterprise.vn',
                role: 'Secretary'
            });

            const { req, res } = createMockReqRes({
                headers: { authorization: `Bearer ${validToken}` }
            });
            let nextCalled = false;

            verifyJWT(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, true, 'verifyJWT phải gọi next() khi token hợp lệ');
            assert.ok(req.user, 'req.user phải được gán');
            assert.equal(req.user.userId, 2);
            assert.equal(req.user.username, 'secretary');
            assert.equal(req.user.email, 'secretary@enterprise.vn');
            assert.equal(req.user.role, 'Secretary');
            assert.equal(req.user.password, undefined, 'Không được để lộ password trong req.user');
            assert.equal(req.user.passwordHash, undefined, 'Không được để lộ passwordHash trong req.user');
            assert.equal(req.user.PasswordHash, undefined, 'Không được để lộ PasswordHash trong req.user');
        });

        it('TC-JWT-07: Không để lộ secret hay stack trace trong response', () => {
            const { req, res } = createMockReqRes({
                headers: { authorization: 'Bearer invalid.payload.signature' }
            });

            verifyJWT(req, res, () => {});

            assert.equal(res.statusCode, 401);
            const responseStr = JSON.stringify(res.jsonData);
            assert.equal(responseStr.includes(authConfig.jwtSecret), false, 'Không để lộ secret');
            assert.equal(res.jsonData.stack, undefined, 'Không để lộ stack trace');
        });
    });

    // ==========================================================================
    // 2. KIỂM THỬ MIDDLEWARE requireRole
    // ==========================================================================
    describe('2. Kiểm thử requireRole', () => {

        it('TC-ROLE-01: Cho phép tiếp tục khi User có Role được cấp phép', () => {
            const { req, res } = createMockReqRes({
                user: { userId: 1, role: 'Admin' }
            });
            let nextCalled = false;

            const middleware = requireRole('Admin');
            middleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, true);
        });

        it('TC-ROLE-02: Trả về HTTP 403 Forbidden khi User không đủ thẩm quyền', () => {
            const { req, res } = createMockReqRes({
                user: { userId: 4, role: 'Employee' }
            });
            let nextCalled = false;

            const middleware = requireRole('Admin');
            middleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 403);
            assert.equal(res.jsonData.success, false);
            assert.match(res.jsonData.message, /Bạn không có quyền thực hiện hành động này/);
        });

        it('TC-ROLE-03: Trả về HTTP 401 Unauthorized khi thiếu thông tin người dùng xác thực (req.user null)', () => {
            const { req, res } = createMockReqRes({ user: null });
            let nextCalled = false;

            const middleware = requireRole('Admin');
            middleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 401);
            assert.equal(res.jsonData.success, false);
            assert.match(res.jsonData.message, /Chưa xác thực danh tính người dùng/);
        });

        it('TC-ROLE-04: Trả về HTTP 401/403 khi role người dùng bị rỗng hoặc không xác định', () => {
            const { req, res } = createMockReqRes({ user: { userId: 99, role: '' } });
            let nextCalled = false;

            const middleware = requireRole('Admin');
            middleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.ok([401, 403].includes(res.statusCode));
        });

        it('TC-ROLE-05: Hỗ trợ nhiều Role trong cùng middleware (arguments)', () => {
            const { req, res } = createMockReqRes({
                user: { userId: 3, role: 'Manager' }
            });
            let nextCalled = false;

            const middleware = requireRole('Admin', 'Manager');
            middleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, true);
        });

        it('TC-ROLE-06: Hỗ trợ truyền mảng Role (array)', () => {
            const { req, res } = createMockReqRes({
                user: { userId: 2, role: 'Secretary' }
            });
            let nextCalled = false;

            const middleware = requireRole(['Admin', 'Manager', 'Secretary']);
            middleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, true);
        });

        it('TC-ROLE-07: Không thể tự nâng quyền bằng body hoặc header khi token là Employee', () => {
            const { req, res } = createMockReqRes({
                user: { userId: 4, role: 'Employee' }, // Gán từ verifyJWT
                body: { role: 'Admin' },               // Client cố tình gửi role: 'Admin'
                headers: { 'x-user-role': 'Admin' },   // Client cố tình giả mạo header
                query: { role: 'Admin' }               // Client cố tình gửi query param
            });
            let nextCalled = false;

            const middleware = requireRole('Admin');
            middleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false, 'Không được phép nâng quyền từ body/header/query');
            assert.equal(res.statusCode, 403);
        });

        it('TC-ROLE-08: So khớp vai trò không phân biệt chữ hoa chữ thường', () => {
            const { req, res } = createMockReqRes({
                user: { userId: 1, role: 'admin' }
            });
            let nextCalled = false;

            const middleware = requireRole('ADMIN');
            middleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, true);
        });
    });

    // ==========================================================================
    // 3. KIỂM THỬ QUYỀN SỞ HỮU CUỘC HỌP & PHẢN HỒI THAM DỰ
    // ==========================================================================
    describe('3. Kiểm thử requireMeetingOwnerOrAdmin & requireSelfOrMeetingOwnerOrAdmin', () => {

        it('TC-OWNER-01: Admin hoặc Manager được phép chỉnh sửa cuộc họp bất kỳ', async () => {
            const { req, res } = createMockReqRes({
                user: { userId: 1, role: 'Admin' },
                params: { id: '10' }
            });
            let nextCalled = false;

            await requireMeetingOwnerOrAdmin(req, res, () => { nextCalled = true; });
            assert.equal(nextCalled, true);
        });

        it('TC-PART-01: Người tham gia tự cập nhật trạng thái của chính mình -> OK', async () => {
            const { req, res } = createMockReqRes({
                user: { userId: 4, role: 'Employee' },
                params: { id: '10', userId: '4' }
            });
            let nextCalled = false;

            await requireSelfOrMeetingOwnerOrAdmin(req, res, () => { nextCalled = true; });
            assert.equal(nextCalled, true);
        });

        it('TC-PART-02: Người tham gia cố tình cập nhật trạng thái của người khác -> 403', async () => {
            const { req, res } = createMockReqRes({
                user: { userId: 4, role: 'Employee' },
                params: { id: '10', userId: '6' } // Cố tình sửa trạng thái của user 6
            });
            let nextCalled = false;

            await requireSelfOrMeetingOwnerOrAdmin(req, res, () => { nextCalled = true; });
            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 403);
            assert.match(res.jsonData.message, /chỉ có thể cập nhật trạng thái tham dự của chính mình/);
        });
    });
});
