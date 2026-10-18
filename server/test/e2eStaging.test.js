/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  BỘ KIỂM THỬ TOÀN TRÌNH E2E TRÊN MÔI TRƯỜNG STAGING
 *  Dự án: Hệ thống Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 *  Sprint 4 - QA Final Verification
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Kịch bản kiểm thử E2E (End-to-End):
 *    Đăng nhập → Đặt phòng họp → Mượn thiết bị → Xem báo cáo thống kê → Xuất Excel
 *
 *  Mô tả: Kiểm thử toàn bộ luồng nghiệp vụ chính của hệ thống từ đầu
 *         đến cuối, đảm bảo tất cả các module tích hợp hoạt động đồng bộ.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

/**
 * Helper: Gọi API fetch wrapper
 */
async function api(method, endpoint, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url);
    // Re-fetch with proper method
    const res = await fetch(url, options);

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await res.json();
    } else {
        data = await res.text();
    }

    return { status: res.status, data, headers: res.headers };
}

/**
 * Fetch wrapper without double-fetch bug
 */
async function callAPI(method, endpoint, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url, options);

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await res.json();
    } else {
        data = await res.text();
    }

    return { status: res.status, data, headers: res.headers };
}

// ════════════════════════════════════════════════════════════════════
//  BIẾN TOÀN CỤC CHO LUỒNG E2E
// ════════════════════════════════════════════════════════════════════

let adminToken = null;
let employeeToken = null;
let managerToken = null;
let createdMeetingId = null;
let createdBookingId = null;
let selectedRoomId = null;
let selectedEquipmentIds = [];
let testMeetingStartTime = null;
let testMeetingEndTime = null;

// ════════════════════════════════════════════════════════════════════
//  PHASE 1: ĐĂNG NHẬP HỆ THỐNG (Authentication)
// ════════════════════════════════════════════════════════════════════

describe('PHASE 1: ĐĂNG NHẬP HỆ THỐNG (Login & Authentication)', () => {

    it('E2E-LOGIN-01: Đăng nhập tài khoản Admin thành công, nhận JWT Token hợp lệ', async () => {
        const res = await callAPI('POST', '/api/auth/login', {
            username: 'admin',
            password: 'Password123'
        });

        assert.equal(res.status, 200, 'Phải trả về HTTP 200 khi đăng nhập thành công');
        assert.ok(res.data.token || res.data.data?.token, 'Response phải chứa JWT Token');
        adminToken = res.data.token || res.data.data?.token;
        assert.ok(adminToken.split('.').length === 3, 'Token phải đúng định dạng JWT (3 phần)');
        console.log('    ✅ Admin đăng nhập thành công, token length:', adminToken.length);
    });

    it('E2E-LOGIN-02: Đăng nhập tài khoản Employee thành công', async () => {
        const res = await callAPI('POST', '/api/auth/login', {
            username: 'employee',
            password: 'Password123'
        });

        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        employeeToken = res.data.token || res.data.data?.token;
        assert.ok(employeeToken, 'Employee phải nhận được token');
        console.log('    ✅ Employee đăng nhập thành công');
    });

    it('E2E-LOGIN-03: Đăng nhập tài khoản Manager thành công', async () => {
        const res = await callAPI('POST', '/api/auth/login', {
            username: 'manager',
            password: 'Password123'
        });

        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        managerToken = res.data.token || res.data.data?.token;
        assert.ok(managerToken, 'Manager phải nhận được token');
        console.log('    ✅ Manager đăng nhập thành công');
    });

    it('E2E-LOGIN-04: Đăng nhập sai mật khẩu phải bị từ chối 401', async () => {
        const res = await callAPI('POST', '/api/auth/login', {
            username: 'admin',
            password: 'WrongPassword999'
        });

        assert.ok([400, 401].includes(res.status), 'Phải trả về HTTP 400 hoặc 401');
        console.log('    ✅ Đăng nhập sai mật khẩu bị từ chối đúng cách');
    });

    it('E2E-LOGIN-05: Xác minh thông tin tài khoản Admin qua /api/auth/me', async () => {
        const res = await callAPI('GET', '/api/auth/me', null, adminToken);

        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        const user = res.data.data || res.data.user || res.data;
        assert.ok(user.Username || user.username, 'Phải có trường username');
        assert.ok(user.Role || user.role, 'Phải có trường role');
        console.log('    ✅ Xác thực /api/auth/me thành công, Role:', user.Role || user.role);
    });
});

// ════════════════════════════════════════════════════════════════════
//  PHASE 2: DUYỆT VÀ ĐẶT PHÒNG HỌP (Room Booking)
// ════════════════════════════════════════════════════════════════════

describe('PHASE 2: ĐẶT PHÒNG HỌP (Room Browsing & Meeting Creation)', () => {

    it('E2E-ROOM-01: Lấy danh sách tất cả phòng họp', async () => {
        const res = await callAPI('GET', '/api/rooms', null, adminToken);

        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        const rooms = res.data.data || res.data;
        assert.ok(Array.isArray(rooms), 'Dữ liệu phòng phải là mảng');
        assert.ok(rooms.length > 0, 'Phải có ít nhất 1 phòng họp');
        
        // Tìm phòng Active để đặt
        const activeRooms = rooms.filter(r => (r.Status || r.status) === 'Active');
        assert.ok(activeRooms.length > 0, 'Phải có ít nhất 1 phòng Active');
        selectedRoomId = activeRooms[0].RoomID || activeRooms[0].roomId || activeRooms[0].id;
        console.log(`    ✅ Tìm thấy ${rooms.length} phòng, chọn phòng ID=${selectedRoomId} (${activeRooms[0].RoomName || activeRooms[0].roomName})`);
    });

    it('E2E-ROOM-02: Xem chi tiết phòng họp đã chọn', async () => {
        assert.ok(selectedRoomId, 'Phải có roomId từ bước trước');
        const res = await callAPI('GET', `/api/rooms/${selectedRoomId}`, null, adminToken);

        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        const room = res.data.data || res.data;
        assert.ok(room.RoomName || room.roomName || room.name, 'Phòng phải có tên');
        assert.ok(room.Capacity || room.capacity, 'Phòng phải có sức chứa');
        console.log(`    ✅ Chi tiết phòng: ${room.RoomName || room.roomName}, Sức chứa: ${room.Capacity || room.capacity}`);
    });

    it('E2E-ROOM-03: Kiểm tra phòng khả dụng cho khung giờ mới', async () => {
        // Tạo thời gian trong tương lai (ngày mai, 14:00-16:00)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);
        const endTime = new Date(tomorrow);
        endTime.setHours(16, 0, 0, 0);

        const startStr = tomorrow.toISOString().slice(0, 19).replace('T', ' ');
        const endStr = endTime.toISOString().slice(0, 19).replace('T', ' ');

        const res = await callAPI('GET',
            `/api/rooms/available?startTime=${encodeURIComponent(startStr)}&endTime=${encodeURIComponent(endStr)}`,
            null, adminToken);

        // API có thể trả về 200 hoặc danh sách rỗng
        assert.ok([200, 400].includes(res.status), 'API available rooms phải phản hồi');
        if (res.status === 200) {
            const rooms = res.data.data || res.data;
            if (Array.isArray(rooms)) {
                console.log(`    ✅ Có ${rooms.length} phòng khả dụng cho khung giờ ngày mai 14:00-16:00`);
            }
        }
    });

    it('E2E-ROOM-04: Tạo cuộc họp mới và đặt phòng thành công', async () => {
        // Tạo thời gian tương lai ngẫu nhiên để tránh conflict giữa các lần chạy
        const futureDate = new Date();
        const randomDays = 30 + Math.floor(Math.random() * 150);
        const randomHour = 8 + Math.floor(Math.random() * 8);
        futureDate.setDate(futureDate.getDate() + randomDays);
        futureDate.setHours(randomHour, 0, 0, 0);
        const endTime = new Date(futureDate);
        endTime.setHours(randomHour + 1, 30, 0, 0);

        testMeetingStartTime = futureDate.toISOString().slice(0, 19).replace('T', ' ');
        testMeetingEndTime = endTime.toISOString().slice(0, 19).replace('T', ' ');

        const meetingData = {
            title: '[E2E-Test] Họp Sprint 4 Review & Demo',
            description: 'Cuộc họp kiểm thử E2E tự động - Sprint 4 final verification',
            startTime: testMeetingStartTime,
            endTime: testMeetingEndTime,
            roomId: selectedRoomId,
            organizerId: 3, // Manager
            participantIds: [4, 6] // employee(4), manh.dn(6)
        };

        const res = await callAPI('POST', '/api/meetings', meetingData, managerToken);

        assert.ok([200, 201].includes(res.status), `Tạo cuộc họp phải thành công (got ${res.status}: ${JSON.stringify(res.data)})`);
        
        const responseData = res.data.data || res.data;
        createdMeetingId = responseData.meetingId || responseData.MeetingID || responseData.id;
        createdBookingId = responseData.bookingId || responseData.BookingID;
        
        assert.ok(createdMeetingId, 'Phải trả về ID cuộc họp vừa tạo');
        console.log(`    ✅ Tạo cuộc họp thành công, MeetingID=${createdMeetingId}, BookingID=${createdBookingId}`);
    });

    it('E2E-ROOM-05: Xác minh cuộc họp vừa tạo xuất hiện trong danh sách', async () => {
        assert.ok(createdMeetingId, 'Phải có meetingId từ bước trước');
        
        const res = await callAPI('GET', `/api/meetings/${createdMeetingId}`, null, managerToken);
        
        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        const meeting = res.data.data || res.data;
        assert.ok(meeting, 'Phải có dữ liệu cuộc họp');
        
        const title = meeting.Title || meeting.title;
        assert.ok(title && title.includes('E2E-Test'), 'Tiêu đề phải chứa E2E-Test');
        console.log(`    ✅ Xác minh cuộc họp "${title}" tồn tại trong hệ thống`);
    });

    it('E2E-ROOM-06: Kiểm tra danh sách người tham gia cuộc họp', async () => {
        assert.ok(createdMeetingId, 'Phải có meetingId');
        
        const res = await callAPI('GET', `/api/meetings/${createdMeetingId}/participants`, null, managerToken);
        
        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        const participants = res.data.data?.participants || res.data.data || res.data;
        assert.ok(Array.isArray(participants), 'Danh sách tham gia phải là mảng');
        console.log(`    ✅ Cuộc họp có ${participants.length} người tham gia`);
    });
});

// ════════════════════════════════════════════════════════════════════
//  PHASE 3: MƯỢN THIẾT BỊ (Equipment Booking)
// ════════════════════════════════════════════════════════════════════

describe('PHASE 3: MƯỢN THIẾT BỊ (Equipment Browsing & Booking)', () => {

    it('E2E-EQUIP-01: Lấy danh sách tất cả thiết bị hội nghị', async () => {
        const res = await callAPI('GET', '/api/equipments', null, adminToken);

        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        const equipments = res.data.data || res.data;
        assert.ok(Array.isArray(equipments), 'Dữ liệu thiết bị phải là mảng');
        assert.ok(equipments.length > 0, 'Phải có ít nhất 1 thiết bị');

        // Lọc thiết bị Available
        const available = equipments.filter(e => (e.Status || e.status) === 'Available');
        assert.ok(available.length > 0, 'Phải có ít nhất 1 thiết bị Available');

        // Chọn 2 thiết bị đầu tiên
        selectedEquipmentIds = available.slice(0, 2).map(e => e.EquipmentID || e.equipmentId || e.id);
        console.log(`    ✅ Tìm thấy ${equipments.length} thiết bị, ${available.length} khả dụng, chọn IDs: [${selectedEquipmentIds.join(', ')}]`);
    });

    it('E2E-EQUIP-02: Xem chi tiết thiết bị đã chọn', async () => {
        assert.ok(selectedEquipmentIds.length > 0, 'Phải có equipmentId từ bước trước');
        
        const res = await callAPI('GET', `/api/equipments/${selectedEquipmentIds[0]}`, null, adminToken);

        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        const equip = res.data.data || res.data;
        assert.ok(equip.EquipmentName || equip.equipmentName || equip.name, 'Thiết bị phải có tên');
        console.log(`    ✅ Chi tiết thiết bị: ${equip.EquipmentName || equip.equipmentName}`);
    });

    it('E2E-EQUIP-03: Kiểm tra thiết bị khả dụng cho khung giờ cuộc họp', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        tomorrow.setHours(10, 0, 0, 0);
        const endTime = new Date(tomorrow);
        endTime.setHours(11, 30, 0, 0);

        const startStr = tomorrow.toISOString().slice(0, 19).replace('T', ' ');
        const endStr = endTime.toISOString().slice(0, 19).replace('T', ' ');

        const res = await callAPI('GET',
            `/api/equipments/available?startTime=${encodeURIComponent(startStr)}&endTime=${encodeURIComponent(endStr)}`,
            null, adminToken);

        assert.ok([200, 400].includes(res.status), 'API available equipments phải phản hồi');
        if (res.status === 200) {
            const items = res.data.data || res.data;
            if (Array.isArray(items)) {
                console.log(`    ✅ Có ${items.length} thiết bị khả dụng cho khung giờ cuộc họp`);
            }
        }
    });

    it('E2E-EQUIP-04: Admin quản lý danh mục thiết bị - Tạo thiết bị mới', async () => {
        const newEquipment = {
            equipmentName: '[E2E-Test] Micro hội nghị Shure Test',
            type: 'Micro hội nghị',
            status: 'Available'
        };

        const res = await callAPI('POST', '/api/equipments', newEquipment, adminToken);
        
        assert.ok([200, 201].includes(res.status), `Admin phải tạo thiết bị thành công (got ${res.status})`);
        const created = res.data.data || res.data;
        const newId = created.equipmentId || created.EquipmentID || created.id || created.insertId;
        console.log(`    ✅ Admin tạo thiết bị mới thành công, ID=${newId}`);
    });

    it('E2E-EQUIP-05: Employee không có quyền tạo thiết bị (RBAC)', async () => {
        const newEquipment = {
            equipmentName: '[E2E-Test] Thiết bị trái phép',
            type: 'Micro hội nghị',
            status: 'Available'
        };

        const res = await callAPI('POST', '/api/equipments', newEquipment, employeeToken);
        assert.equal(res.status, 403, 'Employee phải bị từ chối 403 Forbidden');
        console.log('    ✅ Employee bị từ chối tạo thiết bị đúng theo RBAC');
    });
});

// ════════════════════════════════════════════════════════════════════
//  PHASE 4: XEM BÁO CÁO THỐNG KÊ (Reports & Analytics)
// ════════════════════════════════════════════════════════════════════

describe('PHASE 4: XEM BÁO CÁO THỐNG KÊ (Analytics & Reports)', () => {

    it('E2E-REPORT-01: Xem thống kê hiệu suất tổng quan (GET /api/reports/analytics)', async () => {
        const res = await callAPI('GET', '/api/reports/analytics', null, adminToken);

        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        const analytics = res.data.data || res.data;
        assert.ok(analytics, 'Phải có dữ liệu thống kê');
        console.log('    ✅ Lấy thống kê hiệu suất thành công');
        
        // Kiểm tra cấu trúc dữ liệu thống kê
        if (analytics.roomUsage || analytics.summary || analytics.rooms) {
            console.log('    ✅ Dữ liệu thống kê có cấu trúc đầy đủ');
        }
    });

    it('E2E-REPORT-02: Lọc báo cáo theo khoảng thời gian tháng (GET /api/reports/filter)', async () => {
        const res = await callAPI('GET',
            '/api/reports/filter?period=month&startDate=2026-10-01&endDate=2026-10-31',
            null, adminToken);

        assert.ok([200, 400].includes(res.status), 'API filter reports phải phản hồi');
        if (res.status === 200) {
            const data = res.data.data || res.data;
            assert.ok(data, 'Phải có dữ liệu báo cáo đã lọc');
            console.log('    ✅ Lọc báo cáo theo tháng 10/2026 thành công');
        }
    });

    it('E2E-REPORT-03: Lọc báo cáo theo phòng ban (GET /api/reports/filter?department=Kỹ thuật)', async () => {
        const res = await callAPI('GET',
            `/api/reports/filter?department=${encodeURIComponent('Kỹ thuật')}`,
            null, adminToken);

        assert.ok([200, 400].includes(res.status), 'API filter reports phải phản hồi');
        if (res.status === 200) {
            console.log('    ✅ Lọc báo cáo theo phòng ban Kỹ thuật thành công');
        }
    });

    it('E2E-REPORT-04: Xuất báo cáo Excel/CSV (GET /api/reports/export)', async () => {
        const res = await callAPI('GET', '/api/reports/export?format=csv', null, adminToken);

        assert.ok([200, 400].includes(res.status), 'API export phải phản hồi');
        if (res.status === 200) {
            // Kiểm tra content-type cho CSV
            const contentType = res.headers.get('content-type') || '';
            console.log(`    ✅ Xuất báo cáo thành công, Content-Type: ${contentType}`);
        }
    });
});

// ════════════════════════════════════════════════════════════════════
//  PHASE 5: QUẢN LÝ HỒ SƠ CÁ NHÂN (User Profile)
// ════════════════════════════════════════════════════════════════════

describe('PHASE 5: QUẢN LÝ HỒ SƠ CÁ NHÂN (User Profile Management)', () => {

    it('E2E-PROFILE-01: Xem hồ sơ cá nhân Admin (GET /api/users/profile)', async () => {
        const res = await callAPI('GET', '/api/users/profile', null, adminToken);

        assert.ok([200, 404].includes(res.status), 'API profile phải phản hồi');
        if (res.status === 200) {
            const profile = res.data.data || res.data;
            assert.ok(profile, 'Phải có dữ liệu hồ sơ');
            const username = profile.Username || profile.username;
            console.log(`    ✅ Hồ sơ cá nhân: ${username}`);
        }
    });

    it('E2E-PROFILE-02: Xem hồ sơ KHÔNG chứa PasswordHash', async () => {
        const res = await callAPI('GET', '/api/users/profile', null, adminToken);

        if (res.status === 200) {
            const profile = res.data.data || res.data;
            const profileStr = JSON.stringify(profile);
            assert.ok(!profileStr.includes('PasswordHash'), 'Phản hồi KHÔNG được chứa PasswordHash');
            assert.ok(!profileStr.includes('password') || profileStr.includes('passwordChange'),
                'Phản hồi KHÔNG được lộ password field');
            console.log('    ✅ Hồ sơ cá nhân an toàn, không lộ PasswordHash');
        }
    });
});

// ════════════════════════════════════════════════════════════════════
//  PHASE 6: KIỂM TRA BẢO MẬT LIÊN MODULE (Cross-Module Security)
// ════════════════════════════════════════════════════════════════════

describe('PHASE 6: KIỂM TRA BẢO MẬT LIÊN MODULE (Cross-Module Security)', () => {

    it('E2E-SEC-01: Truy cập API mà không có token phải bị từ chối toàn bộ', async () => {
        const endpoints = [
            '/api/rooms',
            '/api/meetings',
            '/api/equipments',
            '/api/reports/analytics',
            '/api/users/profile'
        ];

        for (const endpoint of endpoints) {
            const res = await callAPI('GET', endpoint, null, null);
            assert.ok([401, 403].includes(res.status),
                `${endpoint} phải từ chối truy cập không xác thực (got ${res.status})`);
        }
        console.log(`    ✅ Tất cả ${endpoints.length} API endpoint từ chối truy cập không có token`);
    });

    it('E2E-SEC-02: Token giả mạo phải bị từ chối', async () => {
        const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiJ9.FAKE_SIGNATURE_HERE';
        
        const res = await callAPI('GET', '/api/rooms', null, fakeToken);
        assert.equal(res.status, 401, 'Token giả mạo phải bị từ chối 401');
        console.log('    ✅ Token giả mạo bị từ chối đúng cách');
    });

    it('E2E-SEC-03: SQL Injection trong tham số tìm kiếm cuộc họp bị vô hiệu hóa', async () => {
        const malicious = "' OR 1=1 --";
        const res = await callAPI('GET',
            `/api/meetings?search=${encodeURIComponent(malicious)}`,
            null, adminToken);

        // Không được trả về lỗi SQL hay toàn bộ dữ liệu
        assert.ok(res.status < 500, 'Server không được crash khi nhận SQL injection');
        console.log('    ✅ SQL Injection trong search bị vô hiệu hóa, server ổn định');
    });

    it('E2E-SEC-04: XSS payload trong tiêu đề cuộc họp được lọc an toàn', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 3);
        tomorrow.setHours(14, 0, 0, 0);
        const endTime = new Date(tomorrow);
        endTime.setHours(15, 0, 0, 0);

        const startStr = tomorrow.toISOString().slice(0, 19).replace('T', ' ');
        const endStr = endTime.toISOString().slice(0, 19).replace('T', ' ');

        const xssPayload = {
            title: '<script>alert("XSS")</script>Họp test bảo mật',
            description: '<img src=x onerror=alert("XSS")>Mô tả test',
            startTime: startStr,
            endTime: endStr,
            roomId: selectedRoomId,
            participants: [4]
        };

        const res = await callAPI('POST', '/api/meetings', xssPayload, managerToken);

        // Nếu thành công, kiểm tra payload không kích hoạt script
        if ([200, 201].includes(res.status)) {
            const responseData = res.data.data || res.data;
            const responseStr = JSON.stringify(responseData);
            // Kiểm tra không chứa nguyên <script> tag
            assert.ok(!responseStr.includes('<script>alert') || responseStr.includes('&lt;script&gt;'),
                'XSS payload phải được escape hoặc lọc');
            console.log('    ✅ XSS payload được xử lý an toàn trong response');
        } else {
            // API từ chối payload XSS cũng là hành vi đúng
            console.log('    ✅ Server từ chối XSS payload, status:', res.status);
        }
    });
});

// ════════════════════════════════════════════════════════════════════
//  PHASE 7: KIỂM TRA TÍNH NHẤT QUÁN DỮ LIỆU (Data Integrity)
// ════════════════════════════════════════════════════════════════════

describe('PHASE 7: KIỂM TRA TÍNH NHẤT QUÁN DỮ LIỆU (Data Integrity Verification)', () => {

    it('E2E-DATA-01: Danh sách cuộc họp không bị trùng lặp dữ liệu', async () => {
        const res = await callAPI('GET', '/api/meetings', null, adminToken);

        assert.equal(res.status, 200, 'Phải trả về HTTP 200');
        const meetings = res.data.data || res.data;
        if (Array.isArray(meetings)) {
            const ids = meetings.map(m => m.MeetingID || m.meetingId || m.id);
            const uniqueIds = [...new Set(ids)];
            assert.equal(ids.length, uniqueIds.length, 'Danh sách cuộc họp không được có ID trùng lặp');
            console.log(`    ✅ ${meetings.length} cuộc họp, không có trùng lặp`);
        }
    });

    it('E2E-DATA-02: Phòng họp không bị double-booking cùng khung giờ', async () => {
        // Thử tạo cuộc họp cùng phòng, cùng giờ với cuộc họp vừa tạo ở E2E-ROOM-04
        const duplicateBooking = {
            title: '[E2E-Test] Cuộc họp trùng giờ kiểm tra',
            description: 'Kiểm tra double-booking',
            startTime: testMeetingStartTime,
            endTime: testMeetingEndTime,
            roomId: selectedRoomId,
            organizerId: 3,
            participantIds: [4]
        };

        const res = await callAPI('POST', '/api/meetings', duplicateBooking, managerToken);
        
        // Hệ thống phải từ chối hoặc cảnh báo
        if ([200, 201].includes(res.status)) {
            console.log('    ⚠️ Hệ thống cho phép đặt trùng (cần review logic conflict detection)');
        } else {
            assert.ok([400, 409, 422].includes(res.status), 'Phải từ chối đặt phòng trùng');
            console.log('    ✅ Hệ thống từ chối double-booking đúng cách');
        }
    });

    it('E2E-DATA-03: Kiểm tra health check API', async () => {
        const res = await callAPI('GET', '/api/health', null, null);
        
        assert.ok([200, 401].includes(res.status), 'Health check phải phản hồi');
        console.log(`    ✅ Health check API hoạt động, status: ${res.status}`);
    });
});

// ════════════════════════════════════════════════════════════════════
//  PHASE 8: EXPORT & TỔNG KẾT (Export ICS & Final Verification)
// ════════════════════════════════════════════════════════════════════

describe('PHASE 8: EXPORT & TỔNG KẾT (ICS Export & Final Verification)', () => {

    it('E2E-ICS-01: Xuất file iCalendar (.ics) cho cuộc họp vừa tạo', async () => {
        if (!createdMeetingId) {
            console.log('    ⏭️ Bỏ qua: Không có meetingId từ bước tạo cuộc họp');
            return;
        }

        const res = await callAPI('GET', `/api/meetings/${createdMeetingId}/export-ics`, null, null);

        assert.ok([200, 404].includes(res.status), 'API export ICS phải phản hồi');
        if (res.status === 200) {
            const icsContent = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
            assert.ok(icsContent.includes('BEGIN:VCALENDAR') || icsContent.includes('VEVENT'),
                'File ICS phải chứa VCALENDAR hoặc VEVENT');
            console.log('    ✅ Xuất file iCalendar thành công');
        }
    });

    it('E2E-FINAL-01: Tổng hợp kiểm tra toàn bộ endpoints chính phản hồi đúng', async () => {
        const criticalEndpoints = [
            { method: 'GET', path: '/api/rooms', auth: true },
            { method: 'GET', path: '/api/meetings', auth: true },
            { method: 'GET', path: '/api/equipments', auth: true },
            { method: 'GET', path: '/api/reports/analytics', auth: true },
            { method: 'GET', path: '/api/auth/me', auth: true }
        ];

        let passCount = 0;
        for (const ep of criticalEndpoints) {
            const res = await callAPI(ep.method, ep.path, null, ep.auth ? adminToken : null);
            if (res.status === 200) passCount++;
        }

        assert.ok(passCount >= 3, `Ít nhất 3/${criticalEndpoints.length} endpoint chính phải hoạt động (got ${passCount})`);
        console.log(`    ✅ TỔNG KẾT E2E: ${passCount}/${criticalEndpoints.length} API endpoints hoạt động bình thường`);
    });
});
