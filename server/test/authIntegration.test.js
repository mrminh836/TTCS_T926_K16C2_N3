/**
 * ==============================================================================
 * BỘ KIỂM THỬ TÍCH HỢP ENDPOINT VỚI MIDDLEWARE XÁC THỰC & PHÂN QUYỀN RBAC
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (ICTU Meeting)
 * ==============================================================================
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwtHelper = require('../utils/jwtHelper');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Helper gọi fetch an toàn
async function apiCall(endpoint, { method = 'GET', body = null, token = null } = {}) {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    return {
        status: res.status,
        headers: res.headers,
        data
    };
}

describe('KIỂM THỬ TÍCH HỢP HỆ THỐNG ENDPOINT VỚI VERIFYJWT & REQUIREROLE', () => {

    const adminToken = jwtHelper.generateToken({
        userId: 1,
        username: 'admin',
        email: 'admin@enterprise.vn',
        role: 'Admin'
    });

    const employeeToken = jwtHelper.generateToken({
        userId: 4,
        username: 'employee',
        email: 'employee@enterprise.vn',
        role: 'Employee'
    });

    // ==========================================================================
    // 1. PUBLIC ENDPOINTS (Không yêu cầu JWT)
    // ==========================================================================
    describe('1. API Public (Công khai)', () => {
        it('TC-PUB-01: GET /api/health hoạt động bình thường không cần token', async () => {
            const res = await apiCall('/api/health');
            assert.ok([200, 503].includes(res.status), 'Health endpoint phải phản hồi');
        });

        it('TC-PUB-02: POST /api/auth/login hoạt động bình thường không cần token', async () => {
            const res = await apiCall('/api/auth/login', {
                method: 'POST',
                body: { identifier: 'admin', password: 'Password123' }
            });
            assert.equal(res.status, 200);
            assert.equal(res.data.success, true);
            assert.ok(res.data.token, 'Phải cấp phát JWT token');
        });
    });

    // ==========================================================================
    // 2. CHẶN TRUY CẬP KHI THIẾU HOẶC SAI TOKEN (HTTP 401 UNAUTHORIZED)
    // ==========================================================================
    describe('2. Chặn truy cập khi thiếu hoặc sai JWT (401)', () => {
        it('TC-SEC-01: GET /api/users không có token -> 401 Unauthorized', async () => {
            const res = await apiCall('/api/users');
            assert.equal(res.status, 401);
            assert.equal(res.data.success, false);
            assert.match(res.data.message, /Vui lòng cung cấp Authorization header/);
        });

        it('TC-SEC-02: GET /api/rooms không có token -> 401 Unauthorized', async () => {
            const res = await apiCall('/api/rooms');
            assert.equal(res.status, 401);
            assert.equal(res.data.success, false);
        });

        it('TC-SEC-03: GET /api/equipments không có token -> 401 Unauthorized', async () => {
            const res = await apiCall('/api/equipments');
            assert.equal(res.status, 401);
            assert.equal(res.data.success, false);
        });

        it('TC-SEC-04: POST /api/meetings không có token -> 401 Unauthorized', async () => {
            const res = await apiCall('/api/meetings', {
                method: 'POST',
                body: { title: 'Test Meeting' }
            });
            assert.equal(res.status, 401);
            assert.equal(res.data.success, false);
        });

        it('TC-SEC-05: Gọi API với token giả mạo -> 401 Unauthorized', async () => {
            const res = await apiCall('/api/users', {
                token: 'fake_forged_untrusted_token_123'
            });
            assert.equal(res.status, 401);
            assert.equal(res.data.success, false);
        });
    });

    // ==========================================================================
    // 3. CHẶN PHÂN QUYỀN KHI KHÔNG ĐỦ THẨM QUYỀN (HTTP 403 FORBIDDEN)
    // ==========================================================================
    describe('3. Chặn hành động Quản trị khi không đủ quyền (403)', () => {
        it('TC-RBAC-01: Employee cố tạo phòng họp mới (POST /api/rooms) -> 403 Forbidden', async () => {
            const res = await apiCall('/api/rooms', {
                method: 'POST',
                token: employeeToken,
                body: { roomName: 'Phòng Bí Mật', capacity: 10, type: 'Hội nghị' }
            });
            assert.equal(res.status, 403);
            assert.equal(res.data.success, false);
            assert.match(res.data.message, /Bạn không có quyền/);
        });

        it('TC-RBAC-02: Employee cố cập nhật trạng thái phòng (PATCH /api/rooms/1/status) -> 403 Forbidden', async () => {
            const res = await apiCall('/api/rooms/1/status', {
                method: 'PATCH',
                token: employeeToken
            });
            assert.equal(res.status, 403);
            assert.equal(res.data.success, false);
        });

        it('TC-RBAC-03: Employee cố xóa phòng họp (DELETE /api/rooms/1) -> 403 Forbidden', async () => {
            const res = await apiCall('/api/rooms/1', {
                method: 'DELETE',
                token: employeeToken
            });
            assert.equal(res.status, 403);
            assert.equal(res.data.success, false);
        });

        it('TC-RBAC-04: Employee cố tạo thiết bị mới (POST /api/equipments) -> 403 Forbidden', async () => {
            const res = await apiCall('/api/equipments', {
                method: 'POST',
                token: employeeToken,
                body: { equipmentName: 'Microphone VIP', type: 'Micro', status: 'Available' }
            });
            assert.equal(res.status, 403);
            assert.equal(res.data.success, false);
        });

        it('TC-RBAC-05: Employee cố xóa thiết bị (DELETE /api/equipments/1) -> 403 Forbidden', async () => {
            const res = await apiCall('/api/equipments/1', {
                method: 'DELETE',
                token: employeeToken
            });
            assert.equal(res.status, 403);
            assert.equal(res.data.success, false);
        });
    });

    // ==========================================================================
    // 4. CHO PHÉP TRUY CẬP KHI ĐỦ THẨM QUYỀN (HTTP 200 / 201)
    // ==========================================================================
    describe('4. Cho phép truy cập khi đúng quyền', () => {
        it('TC-PERM-01: Employee truy cập danh sách nhân sự (GET /api/users) -> 200 OK', async () => {
            const res = await apiCall('/api/users', { token: employeeToken });
            assert.equal(res.status, 200);
            assert.equal(res.data.success, true);
            assert.ok(Array.isArray(res.data.data));
        });

        it('TC-PERM-02: Employee tra cứu danh mục thiết bị (GET /api/equipments) -> 200 OK', async () => {
            const res = await apiCall('/api/equipments', { token: employeeToken });
            assert.equal(res.status, 200);
            assert.equal(res.data.success, true);
        });

        it('TC-PERM-03: Admin truy cập danh mục phòng họp (GET /api/rooms) -> 200 OK', async () => {
            const res = await apiCall('/api/rooms', { token: adminToken });
            assert.equal(res.status, 200);
            assert.equal(res.data.success, true);
        });

        it('TC-PERM-04: Admin tạo mới thiết bị (POST /api/equipments) -> 201 Created', async () => {
            const res = await apiCall('/api/equipments', {
                method: 'POST',
                token: adminToken,
                body: {
                    equipmentName: `Tai nghe Test Admin ${Date.now()}`,
                    type: 'Khác',
                    status: 'Available'
                }
            });
            assert.equal(res.status, 201);
            assert.equal(res.data.success, true);

            // Thu dọn thiết bị vừa tạo
            if (res.data.data && res.data.data.equipmentId) {
                await apiCall(`/api/equipments/${res.data.data.equipmentId}`, {
                    method: 'DELETE',
                    token: adminToken
                });
            }
        });
    });
});
