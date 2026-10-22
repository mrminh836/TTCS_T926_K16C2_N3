/**
 * Bộ kiểm thử tự động cho API GET /api/users (Danh sách nhân viên phục vụ mời họp & phân công)
 * Kiểm thử Model, Controller và Định dạng dữ liệu an toàn.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/userModel');
const userController = require('../controllers/userController');

function createMockReqRes({ params = {}, query = {}, body = {} } = {}) {
    const req = {
        params,
        query,
        body
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

describe('API GET /api/users - Danh sách nhân viên mời họp & phân công', () => {

    // =====================================================
    // 1. UNIT TEST USER MODEL
    // =====================================================
    describe('1. Model User: findAll & findById', () => {

        it('TC-USER-001: User.findAll() phải trả về mảng danh sách người dùng', async () => {
            const users = await User.findAll();
            assert.ok(Array.isArray(users), 'Kết quả phải là một mảng');
            assert.ok(users.length > 0, 'Danh sách người dùng không được rỗng');
        });

        it('TC-USER-002: Tuyệt đối không được trả về trường PasswordHash vì lý do bảo mật', async () => {
            const users = await User.findAll();
            for (const user of users) {
                assert.equal(user.PasswordHash, undefined, 'Không được có PasswordHash');
                assert.equal(user.passwordHash, undefined, 'Không được có passwordHash');
                assert.equal(user.password, undefined, 'Không được có password');
            }
        });

        it('TC-USER-003: Mỗi bản ghi phải có đủ các trường userId, fullName, email, role', async () => {
            const users = await User.findAll();
            const firstUser = users[0];
            assert.ok(typeof firstUser.userId === 'number', 'userId phải là kiểu number');
            assert.ok(typeof firstUser.fullName === 'string' && firstUser.fullName.length > 0, 'fullName phải là chuỗi không rỗng');
            assert.ok(typeof firstUser.email === 'string' && firstUser.email.includes('@'), 'email phải có định dạng hợp lệ');
            assert.ok(typeof firstUser.role === 'string', 'role phải là chuỗi');
        });

        it('TC-USER-004: Tìm kiếm người dùng theo từ khóa (search/keyword)', async () => {
            const searchKeyword = 'Minh';
            const users = await User.findAll({ search: searchKeyword });
            assert.ok(users.length > 0, `Phải tìm thấy người dùng có chứa "${searchKeyword}"`);
            for (const u of users) {
                const matchName = u.fullName.toLowerCase().includes(searchKeyword.toLowerCase());
                const matchEmail = u.email.toLowerCase().includes(searchKeyword.toLowerCase());
                assert.ok(matchName || matchEmail, 'Người dùng phải khớp với từ khóa tìm kiếm');
            }
        });

        it('TC-USER-005: Lọc người dùng theo vai trò (role = Admin)', async () => {
            const users = await User.findAll({ role: 'Admin' });
            assert.ok(users.length > 0, 'Phải có ít nhất 1 Admin');
            for (const u of users) {
                assert.equal(u.role.toLowerCase(), 'admin');
            }
        });

        it('TC-USER-006: User.findById() với ID hợp lệ', async () => {
            const user = await User.findById(1);
            assert.ok(user !== null, 'Phải tìm thấy user với ID = 1');
            assert.equal(user.userId, 1);
            assert.equal(user.PasswordHash, undefined);
        });

        it('TC-USER-007: User.findById() với ID không tồn tại phải trả về null', async () => {
            const user = await User.findById(999999);
            assert.equal(user, null);
        });

        it('TC-USER-008: User.findById() với ID không hợp lệ (số âm, chuỗi chữ)', async () => {
            const userInvalid1 = await User.findById(-5);
            assert.equal(userInvalid1, null);
            const userInvalid2 = await User.findById('abc');
            assert.equal(userInvalid2, null);
        });
    });

    // =====================================================
    // 2. UNIT TEST USER CONTROLLER
    // =====================================================
    describe('2. Controller: userController.getUsers & getUserById', () => {

        it('TC-USER-010: userController.getUsers trả về status 200 kèm success=true và data', async () => {
            const { req, res } = createMockReqRes();
            await userController.getUsers(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.ok(Array.isArray(res.jsonData.data));
            assert.equal(res.jsonData.total, res.jsonData.data.length);
        });

        it('TC-USER-011: userController.getUsers hỗ trợ lọc theo role', async () => {
            const { req, res } = createMockReqRes({ query: { role: 'Employee' } });
            await userController.getUsers(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            for (const user of res.jsonData.data) {
                assert.equal(user.role.toLowerCase(), 'employee');
            }
        });

        it('TC-USER-012: userController.getUserById trả về 200 cho user tồn tại', async () => {
            const { req, res } = createMockReqRes({ params: { id: '1' } });
            await userController.getUserById(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.equal(res.jsonData.data.userId, 1);
        });

        it('TC-USER-013: userController.getUserById trả về 404 cho user không tồn tại', async () => {
            const { req, res } = createMockReqRes({ params: { id: '999999' } });
            await userController.getUserById(req, res, () => {});

            assert.equal(res.statusCode, 404);
            assert.equal(res.jsonData.success, false);
            assert.match(res.jsonData.message, /Không tìm thấy nhân viên/);
        });
    });
});
