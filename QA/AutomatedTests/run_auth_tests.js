/**
 * ==============================================================================
 * KỊCH BẢN KIỂM THỬ TỰ ĐỘNG HÓA AUTHENTICATION (AUTOMATED QA TEST SUITE)
 * Module: Xác thực người dùng (Đăng ký, Đăng nhập, JWT Token, BCrypt Hashing, RBAC)
 * APIs: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:3000';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

const results = [];

async function callApi(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    let data;
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

function recordResult(tcId, name, passed, detail) {
    results.push({ tcId, name, passed, detail });
    const tag = passed ? `${colors.green}[PASS]${colors.reset}` : `${colors.red}[FAIL]${colors.reset}`;
    console.log(`  ${tag} ${colors.bright}${tcId}${colors.reset}: ${name}`);
    if (!passed || process.env.VERBOSE) {
        console.log(`         ${colors.dim}Chi tiết: ${detail}${colors.reset}`);
    }
}

async function runAllTests() {
    console.log(`${colors.cyan}${colors.bright}==============================================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}       BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG HÓA AUTHENTICATION & JWT (SPRINT 3)           ${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}==============================================================================${colors.reset}`);
    console.log(`Endpoint mục tiêu: ${colors.yellow}${API_BASE}${colors.reset}\n`);

    const timestamp = Date.now();
    const testUsername = `qa_user_${timestamp}`;
    const testEmail = `qa_${timestamp}@enterprise.vn`;
    const testPassword = 'Password123';
    let savedToken = null;

    try {
        // --- NHÓM 1: KIỂM THỬ API ĐĂNG KÝ (POST /api/auth/register) ---
        console.log(`${colors.magenta}${colors.bright}▶ NHÓM 1: KIỂM THỬ API ĐĂNG KÝ (POST /api/auth/register)${colors.reset}`);

        // TC_AUTH_01: Đăng ký thành công
        const reg1 = await callApi('/api/auth/register', 'POST', {
            username: testUsername,
            email: testEmail,
            password: testPassword
        });
        const isReg1Ok = reg1.status === 201 &&
                         reg1.data?.success === true &&
                         reg1.data?.data?.username === testUsername &&
                         reg1.data?.data?.role === 'USER' &&
                         reg1.data?.data?.password === undefined &&
                         reg1.data?.data?.PasswordHash === undefined;
        recordResult('TC_AUTH_01', 'Đăng ký tài khoản hợp lệ thành công (HTTP 201, Role USER, bảo mật mật khẩu)', isReg1Ok,
            `HTTP ${reg1.status}, data: ${JSON.stringify(reg1.data?.data)}`);

        // TC_AUTH_02: Trùng username
        const reg2 = await callApi('/api/auth/register', 'POST', {
            username: testUsername,
            email: `another_${timestamp}@enterprise.vn`,
            password: testPassword
        });
        const isReg2Ok = reg2.status === 409 && reg2.data?.success === false;
        recordResult('TC_AUTH_02', 'Báo lỗi trùng username đã tồn tại (HTTP 409 Conflict)', isReg2Ok,
            `HTTP ${reg2.status}, message: ${reg2.data?.message}`);

        // TC_AUTH_03: Trùng email
        const reg3 = await callApi('/api/auth/register', 'POST', {
            username: `another_${timestamp}`,
            email: testEmail,
            password: testPassword
        });
        const isReg3Ok = reg3.status === 409 && reg3.data?.success === false;
        recordResult('TC_AUTH_03', 'Báo lỗi trùng email đã tồn tại (HTTP 409 Conflict)', isReg3Ok,
            `HTTP ${reg3.status}, message: ${reg3.data?.message}`);

        // TC_AUTH_04: Thiếu thông tin bắt buộc
        const reg4 = await callApi('/api/auth/register', 'POST', {
            username: testUsername
        });
        const isReg4Ok = reg4.status === 400 && reg4.data?.success === false;
        recordResult('TC_AUTH_04', 'Chặn request thiếu email hoặc mật khẩu (HTTP 400 Bad Request)', isReg4Ok,
            `HTTP ${reg4.status}, errors: ${JSON.stringify(reg4.data?.errors)}`);

        // TC_AUTH_05: Email sai định dạng
        const reg5 = await callApi('/api/auth/register', 'POST', {
            username: `invalid_mail_${timestamp}`,
            email: 'not-an-email',
            password: testPassword
        });
        const isReg5Ok = reg5.status === 400 && reg5.data?.success === false;
        recordResult('TC_AUTH_05', 'Chặn request định dạng email không hợp lệ (HTTP 400)', isReg5Ok,
            `HTTP ${reg5.status}, errors: ${JSON.stringify(reg5.data?.errors)}`);

        // TC_AUTH_06: Mật khẩu ngắn < 6 ký tự
        const reg6 = await callApi('/api/auth/register', 'POST', {
            username: `short_pass_${timestamp}`,
            email: `short_${timestamp}@enterprise.vn`,
            password: '123'
        });
        const isReg6Ok = reg6.status === 400 && reg6.data?.success === false;
        recordResult('TC_AUTH_06', 'Chặn mật khẩu quá ngắn dưới 6 ký tự (HTTP 400)', isReg6Ok,
            `HTTP ${reg6.status}, errors: ${JSON.stringify(reg6.data?.errors)}`);

        // TC_AUTH_07: Tự cấp quyền ADMIN
        const bypassUser = `bypass_${timestamp}`;
        const reg7 = await callApi('/api/auth/register', 'POST', {
            username: bypassUser,
            email: `${bypassUser}@enterprise.vn`,
            password: testPassword,
            role: 'ADMIN'
        });
        const isReg7Ok = reg7.status === 201 && reg7.data?.data?.role === 'USER';
        recordResult('TC_AUTH_07', 'Chặn người dùng tự gán role ADMIN (Gán role an toàn mặc định USER)', isReg7Ok,
            `HTTP ${reg7.status}, role nhận được: ${reg7.data?.data?.role}`);

        console.log('');

        // --- NHÓM 2: KIỂM THỬ API ĐĂNG NHẬP (POST /api/auth/login) ---
        console.log(`${colors.magenta}${colors.bright}▶ NHÓM 2: KIỂM THỬ API ĐĂNG NHẬP (POST /api/auth/login)${colors.reset}`);

        // TC_AUTH_08: Đăng nhập thành công với Username
        const log1 = await callApi('/api/auth/login', 'POST', {
            username: testUsername,
            password: testPassword
        });
        savedToken = log1.data?.token;
        const isLog1Ok = log1.status === 200 &&
                         log1.data?.success === true &&
                         typeof log1.data?.token === 'string' &&
                         log1.data?.tokenType === 'Bearer' &&
                         log1.data?.user?.username === testUsername &&
                         log1.data?.user?.role === 'USER' &&
                         log1.data?.user?.password === undefined;
        recordResult('TC_AUTH_08', 'Đăng nhập thành công bằng Username (HTTP 200, JWT Token, User info an toàn)', isLog1Ok,
            `HTTP ${log1.status}, tokenPrefix: ${savedToken?.slice(0, 20)}...`);

        // TC_AUTH_09: Đăng nhập thành công với Email
        const log2 = await callApi('/api/auth/login', 'POST', {
            username: testEmail,
            password: testPassword
        });
        const isLog2Ok = log2.status === 200 &&
                         log2.data?.success === true &&
                         typeof log2.data?.token === 'string' &&
                         log2.data?.user?.email === testEmail;
        recordResult('TC_AUTH_09', 'Đăng nhập thành công bằng Email thay cho Username (HTTP 200)', isLog2Ok,
            `HTTP ${log2.status}, email: ${log2.data?.user?.email}`);

        // TC_AUTH_10: Đăng nhập sai mật khẩu
        const log3 = await callApi('/api/auth/login', 'POST', {
            username: testUsername,
            password: 'WrongPassword999'
        });
        const isLog3Ok = log3.status === 401 && log3.data?.success === false;
        recordResult('TC_AUTH_10', 'Báo lỗi đăng nhập sai mật khẩu (HTTP 401 Unauthorized)', isLog3Ok,
            `HTTP ${log3.status}, message: ${log3.data?.message}`);

        // TC_AUTH_11: Đăng nhập tài khoản không tồn tại
        const log4 = await callApi('/api/auth/login', 'POST', {
            username: `ghost_${timestamp}`,
            password: testPassword
        });
        const isLog4Ok = log4.status === 401 &&
                         log4.data?.success === false &&
                         log4.data?.message === log3.data?.message; // Không tiết lộ tài khoản có tồn tại hay không
        recordResult('TC_AUTH_11', 'Đăng nhập user không tồn tại trả về lỗi chung chống brute-force (HTTP 401)', isLog4Ok,
            `HTTP ${log4.status}, message: ${log4.data?.message}`);

        // TC_AUTH_12: Đăng nhập thiếu dữ liệu
        const log5 = await callApi('/api/auth/login', 'POST', {});
        const isLog5Ok = log5.status === 400 && log5.data?.success === false;
        recordResult('TC_AUTH_12', 'Chặn đăng nhập khi thiếu thông tin đăng nhập (HTTP 400)', isLog5Ok,
            `HTTP ${log5.status}, errors: ${JSON.stringify(log5.data?.errors)}`);

        // TC_AUTH_13: Đăng nhập tài khoản quản trị (Admin Seed User)
        const logAdmin = await callApi('/api/auth/login', 'POST', {
            username: 'admin',
            password: 'Password123'
        });
        const isLogAdminOk = logAdmin.status === 200 && logAdmin.data?.user?.role === 'Admin';
        recordResult('TC_AUTH_13', 'Đăng nhập tài khoản Admin mẫu hệ thống thành công (Role Admin)', isLogAdminOk,
            `HTTP ${logAdmin.status}, user: ${logAdmin.data?.user?.fullName} (${logAdmin.data?.user?.role})`);

        console.log('');

        // --- NHÓM 3: KIỂM THỬ XÁC THỰC TOKEN & RBAC (GET /api/auth/me) ---
        console.log(`${colors.magenta}${colors.bright}▶ NHÓM 3: KIỂM THỬ XÁC THỰC TOKEN & RBAC (GET /api/auth/me)${colors.reset}`);

        // TC_AUTH_14: Tra cứu thông tin người dùng với Token hợp lệ
        const me1 = await callApi('/api/auth/me', 'GET', null, savedToken);
        const isMe1Ok = me1.status === 200 &&
                        me1.data?.success === true &&
                        me1.data?.user?.username === testUsername;
        recordResult('TC_AUTH_14', 'Xác thực Bearer JWT Token hợp lệ thành công qua GET /api/auth/me (HTTP 200)', isMe1Ok,
            `HTTP ${me1.status}, user: ${JSON.stringify(me1.data?.user)}`);

        // TC_AUTH_15: Từ chối khi không có Token
        const me2 = await callApi('/api/auth/me', 'GET');
        const isMe2Ok = me2.status === 401 && me2.data?.success === false;
        recordResult('TC_AUTH_15', 'Chặn truy cập khi thiếu Authorization header (HTTP 401)', isMe2Ok,
            `HTTP ${me2.status}, message: ${me2.data?.message}`);

        // TC_AUTH_16: Từ chối khi Token sai chữ ký
        const me3 = await callApi('/api/auth/me', 'GET', null, 'fake.invalid.token');
        const isMe3Ok = me3.status === 401 && me3.data?.success === false;
        recordResult('TC_AUTH_16', 'Chặn truy cập khi Token sai chữ ký hoặc bị can thiệp (HTTP 401)', isMe3Ok,
            `HTTP ${me3.status}, message: ${me3.data?.message}`);

    } catch (err) {
        console.error(`${colors.red}Lỗi trong quá trình chạy kiểm thử: ${err.message}${colors.reset}`);
    }

    // --- TỔNG HỢP KẾT QUẢ ---
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;

    console.log(`\n${colors.cyan}${colors.bright}==============================================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}                      BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ                          ${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}==============================================================================${colors.reset}`);
    console.log(`  Tổng số Test Cases thực thi: ${colors.bright}${total}${colors.reset}`);
    console.log(`  Số Test Cases ĐẠT (PASS)    : ${colors.green}${colors.bright}${passed}${colors.reset}`);
    console.log(`  Số Test Cases HỎNG (FAIL)   : ${failed > 0 ? colors.red : colors.green}${colors.bright}${failed}${colors.reset}`);
    console.log(`  Tỷ lệ thành công            : ${passed === total ? colors.green : colors.yellow}${colors.bright}${((passed / total) * 100).toFixed(1)}%${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}==============================================================================${colors.reset}`);

    if (failed > 0) {
        process.exit(1);
    }
}

runAllTests();
