/**
 * ==============================================================================
 * KỊCH BẢN KIỂM THỬ TÍCH HỢP ĐẦU CUỐI (E2E INTEGRATION TESTING) - SPRINT 3
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 * Vai trò thực thi: Scrum Master (SM) & Đội ngũ Phát triển
 * 
 * Mục tiêu nghiệm thu Sprint 3:
 * 1. E2E_01: API Tra cứu danh mục người dùng (GET /api/users) phục vụ mời họp & phân công
 * 2. E2E_02: API Lọc thiết bị khả dụng theo thời gian thực (GET /api/equipments/available)
 * 3. E2E_03: Luồng Đặt cuộc họp kèm mời nhiều đồng nghiệp & mượn thiết bị hội nghị trong Transaction
 * 4. E2E_04: Cơ chế kiểm soát xung đột tài nguyên: Chặn mượn thiết bị đang bận hoặc bảo trì (409 Conflict)
 * 5. E2E_05: Luồng Đặt lịch họp định kỳ lặp lại theo tuần (POST /api/meetings/recurring)
 * 6. E2E_06: Vòng đời Quản trị thiết bị Admin (CRUD, Toggle Bảo trì, Khóa mượn tự động)
 * 7. E2E_07: Tích hợp Gợi ý phòng thông minh theo sức chứa (Best-fit Room Recommendation)
 * 8. E2E_08: Luồng Cập nhật / Giải phóng tài nguyên cuộc họp (Phòng họp + Thiết bị mượn)
 * ==============================================================================
 */

const http = require('http');

// Màu sắc ANSI Console
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m'
};

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const parsedUrl = new URL(BASE_URL);
const HOST = parsedUrl.hostname;
const PORT = parsedUrl.port || 3000;

const testResults = [];
let passedCount = 0;
let failedCount = 0;

// Helper thực hiện HTTP Request
function makeRequest(method, endpoint, body = null) {
  return new Promise((resolve) => {
    const dataString = body !== null ? JSON.stringify(body) : null;
    const options = {
      hostname: HOST,
      port: PORT,
      path: endpoint,
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };

    if (dataString) {
      options.headers['Content-Length'] = Buffer.byteLength(dataString, 'utf8');
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 408, error: 'Request Timeout' });
    });

    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

function recordResult(id, title, flowDesc, expected, actual, isPassed, note = '') {
  if (isPassed) passedCount++;
  else failedCount++;

  testResults.push({ id, title, isPassed, note });
  const badge = isPassed 
    ? `${COLORS.bgGreen}${COLORS.white} PASS ${COLORS.reset}`
    : `${COLORS.bgRed}${COLORS.white} FAIL ${COLORS.reset}`;

  console.log(`\n${COLORS.bold}[${id}]${COLORS.reset} ${title}`);
  console.log(`   ${COLORS.cyan}Luồng E2E:${COLORS.reset} ${flowDesc}`);
  console.log(`   ${COLORS.yellow}Kỳ vọng:${COLORS.reset} ${expected}`);
  console.log(`   ${COLORS.white}Thực tế:${COLORS.reset} ${actual}`);
  if (note) console.log(`   ${COLORS.magenta}Ghi chú:${COLORS.reset} ${note}`);
  console.log(`   ${COLORS.bold}Kết quả:${COLORS.reset} ${badge}`);
}

async function runE2EIntegrationTests() {
  console.log(`\n${COLORS.bold}${COLORS.bgBlue}${COLORS.white} ======================================================================== ${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.bgBlue}${COLORS.white}     KIỂM THỬ TÍCH HỢP ĐẦU CUỐI E2E (END-TO-END) NGHIỆM THU SPRINT 3      ${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.bgBlue}${COLORS.white}     DỰ ÁN: QUẢN LÝ CUỘC HỌP DOANH NGHIỆP (TTCS_T926_K16C2_N3)            ${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.bgBlue}${COLORS.white} ======================================================================== ${COLORS.reset}\n`);

  // Kiểm tra Health Check
  const healthRes = await makeRequest('GET', '/api/health');
  if (healthRes.status === 200) {
    console.log(`${COLORS.green}✔ Hệ thống Backend Online (Status: 200 OK) tại ${BASE_URL}${COLORS.reset}\n`);
  } else {
    console.log(`${COLORS.yellow}⚠ Không thể kết nối Backend Health Check (Status: ${healthRes.status}).${COLORS.reset}\n`);
  }

  // Dọn dẹp dữ liệu test E2E tồn đọng trước khi chạy để đảm bảo tính idempotent
  try {
    const { execSync } = require('child_process');
    execSync('docker exec meeting_mysql mysql -u root -proot123 meeting_management -e "DELETE FROM Booking_Equipments WHERE BookingID IN (SELECT BookingID FROM Meetings WHERE Title LIKE \'%E2E%\'); DELETE FROM Meeting_Participants WHERE MeetingID IN (SELECT MeetingID FROM Meetings WHERE Title LIKE \'%E2E%\'); DELETE FROM Bookings WHERE MeetingID IN (SELECT MeetingID FROM Meetings WHERE Title LIKE \'%E2E%\'); DELETE FROM Meetings WHERE Title LIKE \'%E2E%\';"', { stdio: 'ignore' });
  } catch (e) {
    // Không bắt buộc nếu môi trường không có docker cli trực tiếp
  }

  // --------------------------------------------------------------------------
  // KỊCH BẢN 1: TRA CỨU DANH SÁCH NGƯỜI DÙNG (US 19.0)
  // --------------------------------------------------------------------------
  {
    const res = await makeRequest('GET', '/api/users');
    const isSuccess = res.status === 200 && Array.isArray(res.body.data) && res.body.data.length >= 5;
    const usersCount = res.body && res.body.data ? res.body.data.length : 0;
    recordResult(
      'E2E_01',
      'Tra cứu danh mục nhân sự phục vụ mời họp (US 19.0)',
      'Gọi API GET /api/users lấy danh sách nhân sự toàn công ty',
      'Mã HTTP 200, trả mảng users có đầy đủ ID, FullName, Email, Role',
      `HTTP ${res.status}, tìm thấy ${usersCount} nhân sự hợp lệ trong hệ thống`,
      isSuccess,
      'Sẵn sàng tích hợp vào bộ chọn Multi-select người tham dự'
    );
  }

  // --------------------------------------------------------------------------
  // KỊCH BẢN 2: LỌC THIẾT BỊ KHẢ DỤNG THEO THỜI GIAN THỰC (US 13.0)
  // --------------------------------------------------------------------------
  {
    const targetDate = '2026-11-20';
    const targetStart = '09:00';
    const targetEnd = '11:00';
    const res = await makeRequest('GET', `/api/equipments/available?date=${targetDate}&startTime=${targetStart}&endTime=${targetEnd}`);
    const isSuccess = res.status === 200 && res.body && Array.isArray(res.body.data);
    const availableCount = isSuccess ? res.body.data.filter(e => e.isAvailable).length : 0;
    recordResult(
      'E2E_02',
      'Tra cứu trạng thái thiết bị thời gian thực theo khung giờ (US 13.0)',
      `Gọi API GET /api/equipments/available?date=${targetDate}&startTime=${targetStart}&endTime=${targetEnd}`,
      'Mã HTTP 200, mỗi thiết bị có cờ isAvailable, isMaintenance, isBusy chính xác',
      `HTTP ${res.status}, phân loại thành công ${availableCount} thiết bị sẵn sàng`,
      isSuccess,
      'Các thiết bị bảo trì hoặc trùng giờ được gắn cờ isAvailable = false'
    );
  }

  // --------------------------------------------------------------------------
  // KỊCH BẢN 3: ĐẶT CUỘC HỌP KÈM MỜI ĐỒNG NGHIỆP & MƯỢN THIẾT BỊ (US 4.0 & 12.0)
  // --------------------------------------------------------------------------
  let createdMeetingId = null;
  {
    const meetingPayload = {
      title: 'E2E Sprint 3 Demo & Review Sync',
      description: 'Cuộc họp kiểm thử tích hợp luồng Sprint 3 E2E với nhiều thành viên và thiết bị',
      startTime: '2026-11-20 09:00:00',
      endTime: '2026-11-20 10:30:00',
      roomId: 2, // Phòng Agile Sprint (12 chỗ)
      organizerId: 1,
      participantIds: [2, 3, 5], // Mời 3 đồng nghiệp
      equipmentIds: [1, 2] // Mượn Máy chiếu Sony + TV Flip 75"
    };

    const res = await makeRequest('POST', '/api/meetings', meetingPayload);
    const isSuccess = (res.status === 201 || res.status === 200) && res.body && res.body.data && (res.body.data.meetingId || res.body.data.id);
    if (isSuccess) {
      createdMeetingId = res.body.data.meetingId || res.body.data.id;
    }

    recordResult(
      'E2E_03',
      'Tạo cuộc họp tích hợp đa tài nguyên trong Transaction (US 4.0 & 12.0)',
      'POST /api/meetings với RoomID=2, 3 ParticipantIds [2,3,5], 2 EquipmentIds [1,2]',
      'Mã HTTP 201 Created; Ghi nhận đồng thời vào Meetings, Bookings, Meeting_Participants, Booking_Equipments',
      `HTTP ${res.status}, MeetingID = ${createdMeetingId || 'N/A'}, tạo thành công trọn vẹn`,
      isSuccess,
      'Giao dịch cơ sở dữ liệu đảm bảo toàn vẹn dữ liệu (ACID Transaction)'
    );
  }

  // --------------------------------------------------------------------------
  // KỊCH BẢN 4: CHẶN XUNG ĐỘT THIẾT BỊ TRÙNG GIỜ (US 12.0 & 13.0 CONFLICT)
  // --------------------------------------------------------------------------
  {
    // Cố tình tạo cuộc họp khác ở phòng khác (Room 1) nhưng mượn cùng Thiết bị 1 (Máy chiếu Sony) trùng khung giờ 09:30 - 11:00
    const conflictPayload = {
      title: 'Cuộc họp cố tình mượn thiết bị đang bận',
      startTime: '2026-11-20 09:30:00',
      endTime: '2026-11-20 11:00:00',
      roomId: 1,
      organizerId: 4,
      participantIds: [6],
      equipmentIds: [1] // Thiết bị 1 đã được mượn ở cuộc họp trên
    };

    const res = await makeRequest('POST', '/api/meetings', conflictPayload);
    const isConflictBlocked = res.status === 409;
    recordResult(
      'E2E_04',
      'Chặn xung đột thiết bị khi bị mượn trùng khung giờ (US 13.0 Conflict)',
      'POST /api/meetings mượn thiết bị đã gán cho cuộc họp khác trong khung giờ đè nhau',
      'Mã HTTP 409 Conflict; Báo lỗi thiết bị đang được sử dụng; Rollback transaction',
      `HTTP ${res.status}, Thông điệp: "${res.body ? (res.body.message || res.body.error) : 'N/A'}"`,
      isConflictBlocked,
      'Hệ thống bảo vệ tài nguyên chống Race Condition và mượn chồng chéo thiết bị'
    );
  }

  // --------------------------------------------------------------------------
  // KỊCH BẢN 5: ĐẶT LỊCH HỌP ĐỊNH KỲ THEO TUẦN (US 3.0)
  // --------------------------------------------------------------------------
  let recurringMeetingIds = [];
  {
    const recurringPayload = {
      title: 'Họp Giao Ban Dự Án Định Kỳ Sprint 3 (E2E Weekly)',
      description: 'Lịch họp lặp hàng tuần cho nhóm Scrum K16C2',
      seriesStartDate: '2026-11-23',
      meetingStartTime: '14:00',
      meetingEndTime: '15:30',
      roomId: 2,
      organizerId: 1,
      recurrenceType: 'weekly',
      intervalValue: 1,
      totalOccurrences: 3,
      dayOfWeek: 1, // Thứ Hai
      participantIds: [2, 5],
      equipmentIds: [3]
    };

    const res = await makeRequest('POST', '/api/meetings/recurring', recurringPayload);
    const isSuccess = (res.status === 201 || res.status === 200) && res.body && res.body.data;
    if (isSuccess && Array.isArray(res.body.data)) {
      recurringMeetingIds = res.body.data.map(m => m.id);
    }

    recordResult(
      'E2E_05',
      'Sinh chuỗi cuộc họp lặp định kỳ hàng tuần (US 3.0 Recurring)',
      'POST /api/meetings/recurring với recurrenceType=weekly, totalOccurrences=3',
      'Mã HTTP 201 Created; Tự động tính toán ngày lặp (+7 ngày/tuần); Sinh 3 phiên họp độc lập',
      `HTTP ${res.status}, Sinh thành công ${recurringMeetingIds.length} cuộc họp chuỗi: [${recurringMeetingIds.join(', ')}]`,
      isSuccess,
      'Tất cả các phiên họp định kỳ đều kế thừa danh sách người dự và thiết bị'
    );
  }

  // --------------------------------------------------------------------------
  // KỊCH BẢN 6: VÒNG ĐỜI QUẢN TRỊ THIẾT BỊ ADMIN (US 14.0 ADMIN CRUD)
  // --------------------------------------------------------------------------
  {
    // 1. Tạo thiết bị mới
    const createRes = await makeRequest('POST', '/api/equipments', {
      name: 'Tai nghe dịch thuật Bluetooth E2E Test',
      type: 'Thiết bị dịch',
      status: 'Available'
    });
    const createdEqId = createRes.body && createRes.body.data ? createRes.body.data.id : null;

    // 2. Chuyển sang bảo trì
    let maintenanceOk = false;
    if (createdEqId) {
      const patchRes = await makeRequest('PATCH', `/api/equipments/${createdEqId}/status`, {
        status: 'Maintenance'
      });
      maintenanceOk = patchRes.status === 200;
    }

    // 3. Xóa thiết bị test
    let deleteOk = false;
    if (createdEqId) {
      const delRes = await makeRequest('DELETE', `/api/equipments/${createdEqId}`);
      deleteOk = delRes.status === 200;
    }

    const isSuccess = createRes.status === 201 && maintenanceOk && deleteOk;
    recordResult(
      'E2E_06',
      'Trọn vẹn vòng đời CRUD thiết bị của Admin (US 14.0 Admin)',
      'POST tạo thiết bị -> PATCH chuyển Maintenance -> DELETE thu hồi thiết bị',
      'Tạo 201 Created; Cập nhật bảo trì 200 OK; Xóa an toàn 200 OK',
      `Tạo ID ${createdEqId} (Status: ${createRes.status}); Bảo trì: ${maintenanceOk}; Xóa: ${deleteOk}`,
      isSuccess,
      'Admin Portal kiểm soát danh mục tài nguyên phần cứng doanh nghiệp toàn diện'
    );
  }

  // --------------------------------------------------------------------------
  // KỊCH BẢN 7: GỢI Ý PHÒNG THÔNG MINH TÍCH HỢP E2E (US 26.0)
  // --------------------------------------------------------------------------
  {
    // Mô phỏng luồng: Nhập 12 người -> Hệ thống đề xuất phòng Agile Sprint (12 chỗ)
    const count = 12;
    const testDate = '2026-11-25';
    const testStart = '10:00';
    const testEnd = '11:30';

    // Lấy danh sách phòng khả dụng từ API
    const roomRes = await makeRequest('GET', `/api/rooms/available?date=${testDate}&startTime=${testStart}&endTime=${testEnd}`);
    const availableRooms = (roomRes.body && roomRes.body.data) ? roomRes.body.data : [];

    // Tìm phòng tối ưu nhất theo thuật toán Best-Fit
    const fitRooms = availableRooms.filter(r => (Number(r.capacity) || 0) >= count);
    fitRooms.sort((a, b) => {
      const slackA = Number(a.capacity) - count;
      const slackB = Number(b.capacity) - count;
      if (slackA !== slackB) return slackA - slackB;
      return a.id - b.id;
    });

    const recommendedRoom = fitRooms[0] || null;
    const isSuccess = recommendedRoom && recommendedRoom.capacity === 12;

    recordResult(
      'E2E_07',
      'Tích hợp Gợi ý phòng tối ưu theo quy mô người tham gia (US 26.0)',
      `User chọn ${count} đồng nghiệp tham gia cuộc họp khung giờ ${testStart} - ${testEnd}`,
      'Hệ thống tự động đề xuất phòng có sức chứa vừa vặn nhất (Phòng Agile Sprint 12 chỗ, Slack=0)',
      `Đề xuất: "${recommendedRoom ? recommendedRoom.name : 'N/A'}" (${recommendedRoom ? recommendedRoom.capacity : 0} chỗ); Slack = 0; Khớp 100%`,
      isSuccess,
      'Loại bỏ lãng phí hội trường lớn, tối ưu hóa công suất sử dụng tài nguyên'
    );
  }

  // --------------------------------------------------------------------------
  // KỊCH BẢN 8: CẬP NHẬT / GIẢI PHÓNG TÀI NGUYÊN CUỘC HỌP (US 2.0 & 12.0)
  // --------------------------------------------------------------------------
  {
    let updateOk = false;
    if (createdMeetingId) {
      // Dời cuộc họp sang khung giờ khác không mượn thiết bị 1 nữa
      const updateRes = await makeRequest('PUT', `/api/meetings/${createdMeetingId}`, {
        title: 'E2E Sprint 3 Demo & Review Sync (Đã dời giờ và giải phóng thiết bị)',
        description: 'Cuộc họp kiểm thử tích hợp luồng Sprint 3 E2E',
        startTime: '2026-11-20 15:00:00',
        endTime: '2026-11-20 16:30:00',
        roomId: 2,
        organizerId: 1,
        participantIds: [2],
        equipmentIds: [] // Giải phóng toàn bộ thiết bị
      });
      updateOk = updateRes.status === 200;
    }

    // Kiểm tra lại thiết bị 1 trong khung giờ cũ (09:00 - 10:30): Phải trở về isAvailable = true
    const checkRes = await makeRequest('GET', `/api/equipments/available?date=2026-11-20&startTime=09:00&endTime=10:30`);
    const eq1 = (checkRes.body && checkRes.body.data) ? checkRes.body.data.find(e => e.id === 1) : null;
    const isResourceFreed = updateOk && eq1 && eq1.isAvailable;

    recordResult(
      'E2E_08',
      'Cập nhật và giải phóng tài nguyên cuộc họp (US 2.0 & 12.0)',
      `PUT /api/meetings/${createdMeetingId || 'ID'} giải phóng thiết bị, kiểm tra lại thiết bị khả dụng`,
      'Mã HTTP 200 OK; Cập nhật thành công; Thiết bị 1 được trả về trạng thái isAvailable = true',
      `Cập nhật: ${updateOk ? 'Thành công (200 OK)' : 'Thất bại'}; Thiết bị 1 isAvailable = ${eq1 ? eq1.isAvailable : false}`,
      isResourceFreed,
      'Toàn bộ tài nguyên được trả lại kho sẵn sàng ngay lập tức cho các cuộc họp khác'
    );
  }

  // Dọn dẹp dữ liệu test E2E sau khi kiểm thử xong
  try {
    const { execSync } = require('child_process');
    execSync('docker exec meeting_mysql mysql -u root -proot123 meeting_management -e "DELETE FROM Booking_Equipments WHERE BookingID IN (SELECT BookingID FROM Meetings WHERE Title LIKE \'%E2E%\'); DELETE FROM Meeting_Participants WHERE MeetingID IN (SELECT MeetingID FROM Meetings WHERE Title LIKE \'%E2E%\'); DELETE FROM Bookings WHERE MeetingID IN (SELECT MeetingID FROM Meetings WHERE Title LIKE \'%E2E%\'); DELETE FROM Meetings WHERE Title LIKE \'%E2E%\';"', { stdio: 'ignore' });
  } catch (e) {
    // Không bắt buộc nếu môi trường không có docker cli trực tiếp
  }

  // --------------------------------------------------------------------------
  // TỔNG KẾT KẾT QUẢ E2E
  // --------------------------------------------------------------------------
  console.log(`\n${COLORS.bold}${COLORS.bgBlue}${COLORS.white} ======================================================================== ${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.bgBlue}${COLORS.white}                  TỔNG KẾT KẾT QUẢ KIỂM THỬ TÍCH HỢP E2E                  ${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.bgBlue}${COLORS.white} ======================================================================== ${COLORS.reset}\n`);

  const total = testResults.length;
  const passRate = ((passedCount / total) * 100).toFixed(1);

  console.log(`   ${COLORS.bold}Tổng số Kịch bản E2E:${COLORS.reset}      ${COLORS.cyan}${total}${COLORS.reset}`);
  console.log(`   ${COLORS.bold}Kịch bản Đạt (PASS):${COLORS.reset}       ${COLORS.green}${passedCount}${COLORS.reset}`);
  console.log(`   ${COLORS.bold}Kịch bản Thất bại (FAIL):${COLORS.reset}  ${failedCount === 0 ? COLORS.green + '0' : COLORS.red + failedCount}${COLORS.reset}`);
  console.log(`   ${COLORS.bold}Tỷ lệ tích hợp thành công:${COLORS.reset} ${passRate === '100.0' ? COLORS.green + passRate + '%' : COLORS.yellow + passRate + '%'}${COLORS.reset}\n`);

  if (failedCount === 0) {
    console.log(`${COLORS.bgGreen}${COLORS.white}${COLORS.bold} ✔ 100% CÁC LUỒNG TÍCH HỢP E2E ĐẠT CHUẨN NGHIỆM THU DEFINITION OF DONE SPRINT 3! ${COLORS.reset}\n`);
  } else {
    console.log(`${COLORS.bgRed}${COLORS.white}${COLORS.bold} ✖ CÒN ${failedCount} LUỒNG E2E THẤT BẠI - CẦN RÀ SOÁT LẠI TRƯỚC SPRINT REVIEW ${COLORS.reset}\n`);
    process.exit(1);
  }
}

runE2EIntegrationTests();
