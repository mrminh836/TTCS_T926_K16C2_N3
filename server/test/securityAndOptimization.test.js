/**
 * ==============================================================================
 * BỘ KIỂM THỬ BẢO MẬT & TỐI ƯU CSDL (SECURITY & DATABASE OPTIMIZATION QA SUITE)
 * 1. SQL Injection Prevention (Tham số hóa câu lệnh SQL)
 * 2. XSS & Payload Sanitization
 * 3. Token Expiration, Tampering & Missing Authorization Headers
 * 4. Database Index Verification (Chỉ mục CSDL nâng cao hiệu năng)
 * ==============================================================================
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const User = require('../models/userModel');
const { verifyJWT } = require('../middleware/authMiddleware');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

function createMockReqRes({ headers = {}, user = null } = {}) {
    const req = {
        headers,
        user
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

describe('1. KIỂM THỬ BẢO MẬT: CHỐNG TẤN CÔNG SQL INJECTION', () => {

    it('SEC-SQLI-01: Tấn công Bypass xác thực bằng SQL Injection (\' OR 1=1 --) trong username thất bại an toàn', async () => {
        const sqliPayload = "' OR 1=1 --";
        const user = await User.findByUsernameOrEmail(sqliPayload);
        // Do câu truy vấn sử dụng Prepared Statements (?) nên SQL Injection không thể thực thi
        assert.equal(user, null, 'Hệ thống phải trả về null, không bị bypass đăng nhập');
    });

    it('SEC-SQLI-02: Tấn công Union-based SQL Injection (\' UNION SELECT 1,2,3,4,5,6,7,8 --) thất bại an toàn', async () => {
        const sqliPayload = "' UNION SELECT 1, 'hacker', 'hash', 'Hacker', 'hack@mail.com', 'IT', 'ADMIN', NOW() --";
        const user = await User.findByUsername(sqliPayload);
        assert.equal(user, null, 'Không được phép thực thi injection query');
    });

    it('SEC-SQLI-03: Tấn công SQL Injection trong từ khóa tìm kiếm (search keyword) không làm rò rỉ dữ liệu', async () => {
        const sqliSearch = "xyz' OR '1'='1";
        const results = await User.findAll({ search: sqliSearch });
        assert.ok(Array.isArray(results), 'Kết quả phải là một mảng');
        // Không được trả về toàn bộ người dùng do câu query dùng parameterized LIKE ?
        assert.equal(results.length, 0, 'Không tìm thấy người dùng nào khớp với chuỗi injection');
    });

    it('SEC-SQLI-04: Tấn công Stacked Queries (DROP TABLE) bị vô hiệu hóa hoàn toàn', async () => {
        const maliciousPayload = "1; DROP TABLE Users; --";
        const user = await User.findById(maliciousPayload);
        assert.equal(user, null, 'Không tìm thấy user với id chứa câu lệnh độc hại');

        // Bảng Users vẫn nguyên vẹn
        const [rows] = await db.execute('SELECT COUNT(*) as cnt FROM Users');
        assert.ok(rows[0].cnt > 0, 'Bảng Users không bị xóa hay ảnh hưởng');
    });
});

describe('2. KIỂM THỬ BẢO MẬT: CHỐNG TẤN CÔNG XSS (CROSS-SITE SCRIPTING)', () => {

    it('SEC-XSS-01: Lưu trữ và trả về payload XSS (<script>alert(1)</script>) dưới dạng text thuần, không kích hoạt script', async () => {
        const xssPayload = '<script>alert("XSS_EXPLOIT")</script>';
        const [result] = await db.execute(
            `INSERT INTO Users (Username, PasswordHash, FullName, Email, Department, Role)
             VALUES (?, 'dummyhash', ?, ?, ?, 'USER')`,
            [`xss_user_${Date.now()}`, xssPayload, `xss_${Date.now()}@test.com`, '<img src=x onerror=alert(1)>']
        );
        const insertedId = result.insertId;

        try {
            const fetchedUser = await User.findById(insertedId);
            assert.equal(fetchedUser.fullName, xssPayload);
            assert.ok(!fetchedUser.fullName.includes('&lt;script&gt;'), 'Database lưu trữ chuỗi gốc mà không thực thi mã');
        } finally {
            await db.execute('DELETE FROM Users WHERE UserID = ?', [insertedId]);
        }
    });
});

describe('3. KIỂM THỬ BẢO MẬT: XÁC THỰC TOKEN JWT & AUTHORIZATION HEADER', () => {

    it('SEC-AUTH-01: Gọi API được bảo vệ mà không có Authorization Header bị từ chối 401', () => {
        const { req, res } = createMockReqRes({ headers: {} });
        let nextCalled = false;

        verifyJWT(req, res, () => { nextCalled = true; });

        assert.equal(nextCalled, false, 'Middleware không được gọi next()');
        assert.equal(res.statusCode, 401, 'Phải trả về HTTP 401 Unauthorized');
        assert.equal(res.jsonData.success, false);
        assert.match(res.jsonData.message, /yêu cầu token xác thực/i);
    });

    it('SEC-AUTH-02: Gọi API với Authorization Header sai định dạng (không có prefix Bearer) bị từ chối 401', () => {
        const { req, res } = createMockReqRes({ headers: { authorization: 'Basic dXNlcjpwYXNz' } });
        let nextCalled = false;

        verifyJWT(req, res, () => { nextCalled = true; });

        assert.equal(nextCalled, false);
        assert.equal(res.statusCode, 401);
        assert.equal(res.jsonData.success, false);
    });

    it('SEC-AUTH-03: Gọi API với Token đã hết hạn (Expired Token) bị từ chối 401 và thông báo rõ ràng', () => {
        // Tạo một token đã hết hạn cách đây 1 giờ
        const expiredToken = jwt.sign(
            { userId: 1, role: 'USER' },
            JWT_SECRET,
            { expiresIn: '-1h' }
        );

        const { req, res } = createMockReqRes({ headers: { authorization: `Bearer ${expiredToken}` } });
        let nextCalled = false;

        verifyJWT(req, res, () => { nextCalled = true; });

        assert.equal(nextCalled, false);
        assert.equal(res.statusCode, 401);
        assert.equal(res.jsonData.success, false);
        assert.match(res.jsonData.message, /hết hạn/i);
    });

    it('SEC-AUTH-04: Gọi API với Token bị can thiệp chữ ký (Tampered Signature) bị từ chối 401', () => {
        const forgedToken = jwt.sign(
            { userId: 1, role: 'ADMIN' },
            'wrong_secret_key_attack'
        );

        const { req, res } = createMockReqRes({ headers: { authorization: `Bearer ${forgedToken}` } });
        let nextCalled = false;

        verifyJWT(req, res, () => { nextCalled = true; });

        assert.equal(nextCalled, false);
        assert.equal(res.statusCode, 401);
        assert.equal(res.jsonData.success, false);
        assert.match(res.jsonData.message, /không hợp lệ/i);
    });
});

describe('4. KIỂM THỬ HIỆU NĂNG & TỐI ƯU DATABASE INDEX TRÊN MYSQL', () => {

    it('PERF-IDX-01: Kiểm tra các chỉ mục (Indexes) trên bảng Users tồn tại đầy đủ', async () => {
        const [indexes] = await db.execute(
            `SELECT DISTINCT INDEX_NAME FROM information_schema.statistics
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users'`
        );
        const indexNames = indexes.map(i => i.INDEX_NAME);

        assert.ok(indexNames.includes('idx_users_role'), 'Chỉ mục idx_users_role phải tồn tại');
        assert.ok(indexNames.includes('idx_users_department'), 'Chỉ mục idx_users_department phải tồn tại');
        assert.ok(indexNames.includes('idx_users_fullname'), 'Chỉ mục idx_users_fullname phải tồn tại');
    });

    it('PERF-IDX-02: Kiểm tra các chỉ mục trên bảng Meetings & Bookings phục vụ lọc nhanh theo thời gian', async () => {
        const [mIndexes] = await db.execute(
            `SELECT DISTINCT INDEX_NAME FROM information_schema.statistics
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Meetings'`
        );
        const mIndexNames = mIndexes.map(i => i.INDEX_NAME);

        assert.ok(mIndexNames.includes('idx_meetings_start_time'), 'Chỉ mục idx_meetings_start_time phải tồn tại');
        assert.ok(mIndexNames.includes('idx_meetings_end_time'), 'Chỉ mục idx_meetings_end_time phải tồn tại');
        assert.ok(mIndexNames.includes('idx_meetings_timerange'), 'Chỉ mục idx_meetings_timerange phải tồn tại');

        const [bIndexes] = await db.execute(
            `SELECT DISTINCT INDEX_NAME FROM information_schema.statistics
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Bookings'`
        );
        const bIndexNames = bIndexes.map(i => i.INDEX_NAME);
        assert.ok(bIndexNames.includes('idx_bookings_meetingid'), 'Chỉ mục idx_bookings_meetingid phải tồn tại');
    });

    it('PERF-IDX-03: Kiểm tra chỉ mục trên bảng Meeting_Participants & Equipments phục vụ đếm và tra cứu tức thì', async () => {
        const [pIndexes] = await db.execute(
            `SELECT DISTINCT INDEX_NAME FROM information_schema.statistics
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Meeting_Participants'`
        );
        const pIndexNames = pIndexes.map(i => i.INDEX_NAME);
        assert.ok(pIndexNames.includes('idx_participants_userid'), 'Chỉ mục idx_participants_userid phải tồn tại');

        const [eIndexes] = await db.execute(
            `SELECT DISTINCT INDEX_NAME FROM information_schema.statistics
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Equipments'`
        );
        const eIndexNames = eIndexes.map(i => i.INDEX_NAME);
        assert.ok(eIndexNames.includes('idx_equipments_status'), 'Chỉ mục idx_equipments_status phải tồn tại');
    });
});
