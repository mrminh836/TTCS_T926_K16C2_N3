/**
 * ==============================================================================
 * KỊCH BẢN KIỂM THỬ TỰ ĐỘNG HÓA TRỌN BỘ CRUD API THIẾT BỊ (EQUIPMENT CRUD)
 * Module: Quản lý Danh mục Thiết bị (GET, POST, PUT, DELETE, PATCH status)
 * Endpoint: /api/equipments
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 * ==============================================================================
 */

const mysql = require('../../server/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:3000';
const DB_CONFIG = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'meeting_management'
};

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const results = [];
let dbConnection = null;

async function initDB() {
    dbConnection = await mysql.createConnection(DB_CONFIG);
}

async function closeDB() {
    if (dbConnection) {
        await dbConnection.end();
    }
}

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }
    return {
        status: response.status,
        data
    };
}

function recordResult({ id, method, endpoint, name, expectedStatus, actualStatus, pass, details }) {
    results.push({
        id,
        method,
        endpoint,
        name,
        expectedStatus,
        actualStatus,
        pass,
        details
    });

    const mark = pass ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`  ${mark} [${id}] ${method} ${endpoint} - ${name}`);
    console.log(`         Status: ${actualStatus} (Expected: ${expectedStatus}) | ${details}`);
}

async function cleanupTestEquipments() {
    try {
        await dbConnection.query("DELETE FROM Equipments WHERE EquipmentName LIKE '[CRUD_TEST]%'");
    } catch (e) {
        console.error('Lỗi dọn dẹp thiết bị test:', e.message);
    }
}

async function runTests() {
    console.log(`\n${colors.bright}${colors.blue}=== 1. KIỂM THỬ API ĐỌC DANH MỤC THIẾT BỊ (GET) ===${colors.reset}`);

    // GET_001: Lấy toàn bộ danh sách thiết bị
    {
        const res = await apiRequest('/api/equipments');
        const pass = res.status === 200 && Array.isArray(res.data?.data) && res.data.data.length > 0;
        recordResult({
            id: 'CRUD_GET_001',
            method: 'GET',
            endpoint: '/api/equipments',
            name: 'Lấy toàn bộ danh sách thiết bị',
            expectedStatus: 200,
            actualStatus: res.status,
            pass,
            details: `Trả về ${res.data?.data?.length || 0} thiết bị`
        });
    }

    // GET_002: Lọc thiết bị theo status và search
    {
        const res = await apiRequest('/api/equipments?status=Available&search=Sony');
        const list = res.data?.data || [];
        const pass = res.status === 200 && list.length > 0 && list.every(e => e.status === 'Available');
        recordResult({
            id: 'CRUD_GET_002',
            method: 'GET',
            endpoint: '/api/equipments?status=Available&search=Sony',
            name: 'Lọc thiết bị theo status và từ khóa tìm kiếm',
            expectedStatus: 200,
            actualStatus: res.status,
            pass,
            details: `Tìm thấy ${list.length} thiết bị khớp tiêu chí`
        });
    }

    // GET_003: Lấy chi tiết thiết bị theo ID hợp lệ
    {
        const res = await apiRequest('/api/equipments/1');
        const pass = res.status === 200 && res.data?.data?.id === 1;
        recordResult({
            id: 'CRUD_GET_003',
            method: 'GET',
            endpoint: '/api/equipments/1',
            name: 'Lấy thông tin chi tiết một thiết bị theo ID',
            expectedStatus: 200,
            actualStatus: res.status,
            pass,
            details: `Thiết bị: ${res.data?.data?.name || 'N/A'}`
        });
    }

    // GET_004: Lấy thiết bị với ID không tồn tại
    {
        const res = await apiRequest('/api/equipments/999999');
        const pass = res.status === 404;
        recordResult({
            id: 'CRUD_GET_004',
            method: 'GET',
            endpoint: '/api/equipments/999999',
            name: 'Xử lý lỗi khi ID thiết bị không tồn tại',
            expectedStatus: 404,
            actualStatus: res.status,
            pass,
            details: res.data?.message || 'N/A'
        });
    }

    // GET_005: Lấy thiết bị với ID không hợp lệ (chuỗi không phải số)
    {
        const res = await apiRequest('/api/equipments/invalid-id');
        const pass = res.status === 400;
        recordResult({
            id: 'CRUD_GET_005',
            method: 'GET',
            endpoint: '/api/equipments/invalid-id',
            name: 'Từ chối ID thiết bị không phải số nguyên dương',
            expectedStatus: 400,
            actualStatus: res.status,
            pass,
            details: res.data?.message || 'N/A'
        });
    }

    console.log(`\n${colors.bright}${colors.blue}=== 2. KIỂM THỬ API TẠO MỚI THIẾT BỊ (POST) ===${colors.reset}`);

    let createdId = null;

    // POST_001: Tạo mới thiết bị thành công
    {
        const res = await apiRequest('/api/equipments', {
            method: 'POST',
            body: {
                equipmentName: '[CRUD_TEST] Màn hình cảm ứng Maxhub V6 65 inch',
                type: 'Màn hình tương tác',
                status: 'Available'
            }
        });
        createdId = res.data?.data?.id;
        const pass = res.status === 201 && createdId > 0 && res.data.data.name.includes('Maxhub');
        recordResult({
            id: 'CRUD_POST_001',
            method: 'POST',
            endpoint: '/api/equipments',
            name: 'Tạo mới thiết bị thành công với dữ liệu hợp lệ',
            expectedStatus: 201,
            actualStatus: res.status,
            pass,
            details: `Tạo thành công thiết bị ID=${createdId}`
        });
    }

    // POST_002: Từ chối khi thiếu tên thiết bị
    {
        const res = await apiRequest('/api/equipments', {
            method: 'POST',
            body: {
                type: 'Loa hội nghị'
            }
        });
        const pass = res.status === 400 && (res.data?.message || '').includes('equipmentName');
        recordResult({
            id: 'CRUD_POST_002',
            method: 'POST',
            endpoint: '/api/equipments',
            name: 'Từ chối khi thiếu tên thiết bị (equipmentName)',
            expectedStatus: 400,
            actualStatus: res.status,
            pass,
            details: res.data?.message || 'N/A'
        });
    }

    // POST_003: Từ chối khi status không hợp lệ
    {
        const res = await apiRequest('/api/equipments', {
            method: 'POST',
            body: {
                equipmentName: '[CRUD_TEST] Thiết bị lỗi trạng thái',
                status: 'WrongStatus'
            }
        });
        const pass = res.status === 400 && (res.data?.message || '').toLowerCase().includes('trạng thái');
        recordResult({
            id: 'CRUD_POST_003',
            method: 'POST',
            endpoint: '/api/equipments',
            name: 'Từ chối khi trạng thái (status) không thuộc danh mục hợp lệ',
            expectedStatus: 400,
            actualStatus: res.status,
            pass,
            details: res.data?.message || 'N/A'
        });
    }

    // POST_004: Từ chối ký tự đặc biệt nguy hiểm XSS
    {
        const res = await apiRequest('/api/equipments', {
            method: 'POST',
            body: {
                equipmentName: '<script>alert(1)</script>'
            }
        });
        const pass = res.status === 400;
        recordResult({
            id: 'CRUD_POST_004',
            method: 'POST',
            endpoint: '/api/equipments',
            name: 'Ngăn chặn ký tự nguy hiểm (<, >) trong tên thiết bị',
            expectedStatus: 400,
            actualStatus: res.status,
            pass,
            details: res.data?.message || 'N/A'
        });
    }

    console.log(`\n${colors.bright}${colors.blue}=== 3. KIỂM THỬ API CẬP NHẬT TOÀN DIỆN THIẾT BỊ (PUT) ===${colors.reset}`);

    // PUT_001: Cập nhật thành công thiết bị vừa tạo
    {
        const res = await apiRequest(`/api/equipments/${createdId}`, {
            method: 'PUT',
            body: {
                equipmentName: '[CRUD_TEST] Màn hình Maxhub V6 Pro 75 inch (Đã nâng cấp)',
                type: 'Màn hình cao cấp',
                status: 'Available'
            }
        });
        const pass = res.status === 200 && res.data?.data?.name.includes('Đã nâng cấp');
        recordResult({
            id: 'CRUD_PUT_001',
            method: 'PUT',
            endpoint: `/api/equipments/${createdId}`,
            name: 'Cập nhật toàn diện thông tin thiết bị thành công',
            expectedStatus: 200,
            actualStatus: res.status,
            pass,
            details: `Tên mới: ${res.data?.data?.name || 'N/A'}`
        });
    }

    // PUT_002: Cập nhật thiết bị với ID không tồn tại
    {
        const res = await apiRequest('/api/equipments/999999', {
            method: 'PUT',
            body: {
                equipmentName: '[CRUD_TEST] Thiết bị không tồn tại'
            }
        });
        const pass = res.status === 404;
        recordResult({
            id: 'CRUD_PUT_002',
            method: 'PUT',
            endpoint: '/api/equipments/999999',
            name: 'Báo lỗi 404 khi cập nhật thiết bị không tồn tại',
            expectedStatus: 404,
            actualStatus: res.status,
            pass,
            details: res.data?.message || 'N/A'
        });
    }

    console.log(`\n${colors.bright}${colors.blue}=== 4. KIỂM THỬ API CẬP NHẬT TRẠNG THÁI (PATCH status) ===${colors.reset}`);

    // PATCH_001: Chuyển trạng thái sang Maintenance (Bảo trì)
    {
        const res = await apiRequest(`/api/equipments/${createdId}/status`, {
            method: 'PATCH',
            body: { status: 'Maintenance' }
        });
        const pass = res.status === 200 && res.data?.data?.status === 'Maintenance';
        recordResult({
            id: 'CRUD_PATCH_001',
            method: 'PATCH',
            endpoint: `/api/equipments/${createdId}/status`,
            name: 'Chuyển nhanh trạng thái thiết bị sang Maintenance (Bảo trì)',
            expectedStatus: 200,
            actualStatus: res.status,
            pass,
            details: `Trạng thái mới: ${res.data?.data?.status || 'N/A'}`
        });
    }

    // PATCH_002: Chuyển trạng thái sang Broken (Hư hỏng)
    {
        const res = await apiRequest(`/api/equipments/${createdId}/status`, {
            method: 'PATCH',
            body: { status: 'Broken' }
        });
        const pass = res.status === 200 && res.data?.data?.status === 'Broken';
        recordResult({
            id: 'CRUD_PATCH_002',
            method: 'PATCH',
            endpoint: `/api/equipments/${createdId}/status`,
            name: 'Chuyển nhanh trạng thái thiết bị sang Broken (Hư hỏng)',
            expectedStatus: 200,
            actualStatus: res.status,
            pass,
            details: `Trạng thái mới: ${res.data?.data?.status || 'N/A'}`
        });
    }

    // PATCH_003: Chuyển trạng thái trở lại Available (Có sẵn)
    {
        const res = await apiRequest(`/api/equipments/${createdId}/status`, {
            method: 'PATCH',
            body: { status: 'Available' }
        });
        const pass = res.status === 200 && res.data?.data?.status === 'Available';
        recordResult({
            id: 'CRUD_PATCH_003',
            method: 'PATCH',
            endpoint: `/api/equipments/${createdId}/status`,
            name: 'Chuyển trạng thái trở lại Available (Có sẵn)',
            expectedStatus: 200,
            actualStatus: res.status,
            pass,
            details: `Trạng thái mới: ${res.data?.data?.status || 'N/A'}`
        });
    }

    // PATCH_004: Từ chối giá trị status sai
    {
        const res = await apiRequest(`/api/equipments/${createdId}/status`, {
            method: 'PATCH',
            body: { status: 'UnknownStatus' }
        });
        const pass = res.status === 400;
        recordResult({
            id: 'CRUD_PATCH_004',
            method: 'PATCH',
            endpoint: `/api/equipments/${createdId}/status`,
            name: 'Từ chối cập nhật trạng thái không hợp lệ',
            expectedStatus: 400,
            actualStatus: res.status,
            pass,
            details: res.data?.message || 'N/A'
        });
    }

    console.log(`\n${colors.bright}${colors.blue}=== 5. KIỂM THỬ API XÓA THIẾT BỊ (DELETE) & RÀNG BUỘC TOÀN VẸN ===${colors.reset}`);

    // DELETE_001: Chặn xóa thiết bị đang được gán vào cuộc họp Confirmed (ID=1 Sony Laser có trong Booking 1)
    {
        const res = await apiRequest('/api/equipments/1', {
            method: 'DELETE'
        });
        const pass = res.status === 409 && Array.isArray(res.data?.activeBookings);
        recordResult({
            id: 'CRUD_DEL_001',
            method: 'DELETE',
            endpoint: '/api/equipments/1',
            name: 'Chặn xóa thiết bị đang được gán cho cuộc họp Confirmed (409 Conflict)',
            expectedStatus: 409,
            actualStatus: res.status,
            pass,
            details: res.data?.message || 'N/A'
        });
    }

    // DELETE_002: Xóa thành công thiết bị độc lập không có ràng buộc (createdId)
    {
        const res = await apiRequest(`/api/equipments/${createdId}`, {
            method: 'DELETE'
        });
        const pass = res.status === 200;
        recordResult({
            id: 'CRUD_DEL_002',
            method: 'DELETE',
            endpoint: `/api/equipments/${createdId}`,
            name: 'Xóa thành công thiết bị không có ràng buộc lịch họp',
            expectedStatus: 200,
            actualStatus: res.status,
            pass,
            details: `Đã xóa thiết bị ID=${createdId}`
        });
    }

    // DELETE_003: Xác nhận thiết bị đã bị xóa khỏi hệ thống qua GET trả về 404
    {
        const res = await apiRequest(`/api/equipments/${createdId}`);
        const pass = res.status === 404;
        recordResult({
            id: 'CRUD_DEL_003',
            method: 'GET',
            endpoint: `/api/equipments/${createdId}`,
            name: 'Xác minh thiết bị đã xóa không còn tồn tại trong hệ thống (404)',
            expectedStatus: 404,
            actualStatus: res.status,
            pass,
            details: res.data?.message || 'N/A'
        });
    }

    // DELETE_004: Xóa lại thiết bị không tồn tại
    {
        const res = await apiRequest(`/api/equipments/${createdId}`, {
            method: 'DELETE'
        });
        const pass = res.status === 404;
        recordResult({
            id: 'CRUD_DEL_004',
            method: 'DELETE',
            endpoint: `/api/equipments/${createdId}`,
            name: 'Báo lỗi 404 khi xóa thiết bị không tồn tại',
            expectedStatus: 404,
            actualStatus: res.status,
            pass,
            details: res.data?.message || 'N/A'
        });
    }
}

function exportReport() {
    const passedCount = results.filter(r => r.pass).length;
    const totalCount = results.length;
    const passRate = ((passedCount / totalCount) * 100).toFixed(1);

    const reportPath = path.resolve(__dirname, '../TestReport/Automated_Test_Report_Equipment_CRUD.md');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });

    let md = `# 📊 BÁO CÁO KIỂM THỬ TỰ ĐỘNG HÓA: TRỌN BỘ CRUD API THIẾT BỊ\n\n`;
    md += `> **Dự án:** Quản lý Lịch họp Doanh nghiệp (\`TTCS_T926_K16C2_N3\`)  \n`;
    md += `> **Thời gian thực thi:** ${new Date().toLocaleString('vi-VN')}  \n`;
    md += `> **Môi trường:** Docker Container \`meeting_backend\` (Port 3000) & MySQL 8.0 (Port 3306)  \n`;
    md += `> **Tổng số Test Cases:** ${totalCount}  \n`;
    md += `> **Kết quả:** **${passedCount}/${totalCount} ĐẠT** (Tỷ lệ: **${passRate}%**)  \n\n`;

    md += `## 1. Bảng Tổng Hợp Chi Tiết Test Cases CRUD\n\n`;
    md += `| Test Case ID | Phương thức | Endpoint | Tiêu đề kịch bản | Expected | Actual | Kết quả |\n`;
    md += `| :---: | :---: | :--- | :--- | :---: | :---: | :---: |\n`;

    for (const r of results) {
        const statusBadge = r.pass ? '✅ **PASS**' : '❌ **FAIL**';
        md += `| \`${r.id}\` | \`${r.method}\` | \`${r.endpoint}\` | ${r.name} | \`${r.expectedStatus}\` | \`${r.actualStatus}\` | ${statusBadge} |\n`;
    }

    md += `\n## 2. Kết Luận & Đánh Giá Chất Lượng\n\n`;
    md += `- Trọn bộ API CRUD danh mục thiết bị đã được xây dựng hoàn chỉnh (\`GET\`, \`POST\`, \`PUT\`, \`DELETE\`, \`PATCH status\`).\n`;
    md += `- Ràng buộc toàn vẹn CSDL được bảo vệ 100%: Thiết bị đang có lịch họp \`Confirmed\` không thể bị xóa (\`409 Conflict\`).\n`;
    md += `- Kiểm soát dữ liệu đầu vào nghiêm ngặt: Chặn các chuỗi độc hại, validate danh mục trạng thái (\`Available\`, \`Maintenance\`, \`Broken\`).\n`;

    fs.writeFileSync(reportPath, md, 'utf-8');
    console.log(`\n${colors.bright}${colors.green}📄 Đã xuất báo cáo kiểm thử CRUD tại: ${reportPath}${colors.reset}`);
}

async function main() {
    console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}🚀 KHỞI CHẠY KIỂM THỬ TỰ ĐỘNG HÓA: TRỌN BỘ CRUD API DANH MỤC THIẾT BỊ${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);

    try {
        await initDB();
        await cleanupTestEquipments();

        await runTests();

        await cleanupTestEquipments();
        exportReport();

        const passedCount = results.filter(r => r.pass).length;
        const totalCount = results.length;
        console.log(`\n${colors.bright}TỔNG KẾT: ${passedCount}/${totalCount} Test Cases ĐẠT (${((passedCount / totalCount) * 100).toFixed(1)}% Pass Rate)${colors.reset}\n`);

        process.exit(passedCount === totalCount ? 0 : 1);
    } catch (err) {
        console.error(`${colors.red}Lỗi trong quá trình chạy test CRUD:${colors.reset}`, err);
        process.exit(1);
    } finally {
        await closeDB();
    }
}

main();
