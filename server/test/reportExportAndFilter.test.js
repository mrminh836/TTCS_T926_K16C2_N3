/**
 * ==============================================================================
 * BỘ KIỂM THỬ TOÀN DIỆN: LỌC BÁO CÁO & KẾT XUẤT EXCEL / CSV UTF-8
 * APIs: GET /api/reports/filter & GET /api/reports/export
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 * ==============================================================================
 *
 * Kiểm thử các tiêu chuẩn nghiệp vụ:
 * 1. Validator: Bộ lọc khoảng thời gian, phòng ban, phòng họp, phân trang (page, limit), định dạng xuất tệp
 * 2. Controller filterReports: Phản hồi RESTful 200, phân trang chính xác, tóm tắt KPI và phân bổ phòng ban
 * 3. Controller exportReport: Kết xuất tệp đính kèm chuẩn RFC 4180 với UTF-8 BOM (\uFEFF - 0xEFBBBF)
 * 4. Tính toàn vẹn dữ liệu: Bảo toàn dấu tiếng Việt, xử lý escape ký tự đặc biệt (dấu phẩy, dấu nháy kép, xuống dòng)
 * 5. Cấu trúc nội dung tệp: Đầy đủ 3 phần (Thông tin chung, Chỉ số tổng quan KPIs, Thống kê phòng, Danh sách cuộc họp)
 *
 * Chạy test: node --test server/test/reportExportAndFilter.test.js
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../config/database');
const ReportModel = require('../models/reportModel');
const { filterReports, exportReport } = require('../controllers/reportController');
const {
    validateFilterReportsQuery,
    validateFilterReportsMiddleware,
    validateExportReportQuery,
    validateExportReportMiddleware
} = require('../validators/reportValidator');

// Helper Mock Request & Response
function createMockReqRes({ query = {}, headers = {}, user = null } = {}) {
    const req = {
        query,
        headers,
        user: user || { userId: 1, username: 'admin', fullName: 'Nguyễn Văn Quản Trị', role: 'Admin', department: 'Quản trị' }
    };
    const res = {
        statusCode: 200,
        headers: {},
        sentData: null,
        jsonData: null,
        setHeader(key, val) {
            this.headers[key.toLowerCase()] = val;
            return this;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        },
        send(data) {
            this.sentData = data;
            return this;
        }
    };
    let nextError = null;
    const next = (err) => { nextError = err; };

    return { req, res, next, getNextError: () => nextError };
}

// Mock Database cho Filter & Export
function setupMockDatabase() {
    const originalQuery = db.query;

    db.query = async (sql, params) => {
        const normSql = (sql || '').toLowerCase().replace(/\s+/g, ' ');

        // 1. Min/Max Date Bounds
        if (normSql.includes('min(date(starttime))')) {
            return [[{ minDate: '2026-10-01', maxDate: '2026-10-31' }]];
        }

        // 2. Count tổng số bản ghi phân trang
        if (normSql.includes('as total from meetings') && !normSql.includes('group by')) {
            return [[{ total: 3 }]];
        }

        // 3. Danh sách cuộc họp chi tiết (LIMIT ? OFFSET ?)
        if (normSql.includes('as meetingid') && normSql.includes('limit ? offset ?')) {
            return [[
                {
                    meetingId: 101,
                    title: 'Họp Chiến Lược Q4, Phát Triển Sản Phẩm',
                    description: 'Đánh giá chỉ số OKRs và kế hoạch kiến trúc "Cloud-Native"',
                    startTime: '2026-10-15T09:00:00.000Z',
                    endTime: '2026-10-15T11:00:00.000Z',
                    durationMinutes: 120,
                    durationHours: 2.0,
                    isRecurring: 0,
                    createdAt: '2026-10-10T08:00:00.000Z',
                    organizerId: 1,
                    organizerName: 'Nguyễn Văn Quản Trị',
                    organizerEmail: 'admin@enterprise.vn',
                    organizerDepartment: 'Quản trị',
                    organizerRole: 'Admin',
                    bookingId: 201,
                    bookingStatus: 'Confirmed',
                    roomId: 1,
                    roomName: 'Boardroom Thăng Long',
                    roomCode: 'A4.01',
                    roomCapacity: 20,
                    roomType: 'Hội nghị',
                    roomFloor: 'Tầng 4',
                    participantCount: 12,
                    participantNames: 'Nguyễn Văn Quản Trị, Trần Thị Techlead, Lê Văn Tester'
                },
                {
                    meetingId: 102,
                    title: 'Họp Daily Sprint & Rà soát Bug',
                    description: 'Báo cáo tiến độ backlog',
                    startTime: '2026-10-16T14:00:00.000Z',
                    endTime: '2026-10-16T15:00:00.000Z',
                    durationMinutes: 60,
                    durationHours: 1.0,
                    isRecurring: 1,
                    createdAt: '2026-10-11T08:00:00.000Z',
                    organizerId: 2,
                    organizerName: 'Trần Thị Techlead',
                    organizerEmail: 'techlead@enterprise.vn',
                    organizerDepartment: 'Kỹ thuật',
                    organizerRole: 'Manager',
                    bookingId: 202,
                    bookingStatus: 'Completed',
                    roomId: 2,
                    roomName: 'Phòng Agile Sprint',
                    roomCode: 'B2.01',
                    roomCapacity: 16,
                    roomType: 'Nhóm / Tech',
                    roomFloor: 'Tầng 2',
                    participantCount: 8,
                    participantNames: 'Trần Thị Techlead, Nguyễn Văn Dev'
                },
                {
                    meetingId: 103,
                    title: 'Đào tạo Bảo mật Ứng dụng',
                    description: 'Cuộc họp bị hoãn do diễn giả bận công tác',
                    startTime: '2026-10-17T10:00:00.000Z',
                    endTime: '2026-10-17T11:30:00.000Z',
                    durationMinutes: 90,
                    durationHours: 1.5,
                    isRecurring: 0,
                    createdAt: '2026-10-12T08:00:00.000Z',
                    organizerId: 3,
                    organizerName: 'Lê Văn Tester',
                    organizerEmail: 'tester@enterprise.vn',
                    organizerDepartment: 'Kiểm thử',
                    organizerRole: 'Employee',
                    bookingId: 203,
                    bookingStatus: 'Cancelled',
                    roomId: 1,
                    roomName: 'Boardroom Thăng Long',
                    roomCode: 'A4.01',
                    roomCapacity: 20,
                    roomType: 'Hội nghị',
                    roomFloor: 'Tầng 4',
                    participantCount: 15,
                    participantNames: 'Lê Văn Tester, Phạm Thị QA'
                }
            ]];
        }

        // 4. Tóm tắt KPI lọc (Summary)
        if (normSql.includes('count(distinct b.roomid) as roomsusedcount')) {
            return [[{
                totalMeetings: 3,
                cancelledMeetings: 1,
                confirmedMeetings: 1,
                completedMeetings: 1,
                totalDurationMinutes: 180, // 3 giờ
                roomsUsedCount: 2
            }]];
        }

        // 5. Phân bổ theo phòng ban
        if (normSql.includes('as department') && normSql.includes('as meetingcount')) {
            return [[
                { department: 'Quản trị', meetingCount: 1, totalMinutes: 120 },
                { department: 'Kỹ thuật', meetingCount: 1, totalMinutes: 60 },
                { department: 'Kiểm thử', meetingCount: 1, totalMinutes: 90 }
            ]];
        }

        // 6. Danh mục phòng họp
        if (normSql.includes('from rooms r') && !normSql.includes('left join bookings')) {
            return [[
                { roomId: 1, roomCode: 'A4.01', roomName: 'Boardroom Thăng Long', capacity: 20, type: 'Hội nghị', floor: 'Tầng 4', status: 'Active' },
                { roomId: 2, roomCode: 'B2.01', roomName: 'Phòng Agile Sprint', capacity: 16, type: 'Nhóm / Tech', floor: 'Tầng 2', status: 'Active' }
            ]];
        }

        // 7. Thống kê theo phòng
        if (normSql.includes('group by r.roomid')) {
            return [[
                { roomId: 1, totalMeetings: 2, cancelledMeetings: 1, confirmedMeetings: 1, completedMeetings: 0, totalMinutes: 120 },
                { roomId: 2, totalMeetings: 1, cancelledMeetings: 0, confirmedMeetings: 0, completedMeetings: 1, totalMinutes: 60 }
            ]];
        }

        // 8. Tỷ lệ lấp đầy sức chứa
        if (normSql.includes('meeting_participants mp')) {
            return [[
                { MeetingID: 101, RoomID: 1, Capacity: 20, participantCount: 12 },
                { MeetingID: 102, RoomID: 2, Capacity: 16, participantCount: 8 }
            ]];
        }

        // 9. Timeline Query
        if (normSql.includes('group by date(m.starttime)')) {
            return [[
                { meetingDate: '2026-10-15', meetingCount: 1, totalMinutes: 120, cancelledCount: 0 },
                { meetingDate: '2026-10-16', meetingCount: 1, totalMinutes: 60, cancelledCount: 0 },
                { meetingDate: '2026-10-17', meetingCount: 1, totalMinutes: 90, cancelledCount: 1 }
            ]];
        }

        return [[]];
    };

    return () => {
        db.query = originalQuery;
    };
}

describe('BỘ KIỂM THỬ API BÁO CÁO & XUẤT FILE (GET /api/reports/filter & GET /api/reports/export)', () => {
    let restoreDb;

    beforeEach(() => {
        restoreDb = setupMockDatabase();
    });

    afterEach(() => {
        if (restoreDb) restoreDb();
    });

    // ── SUITE 1: KIỂM THỬ VALIDATOR BỘ LỌC & EXPORT ──
    describe('1. Kiểm thử Validator Bộ lọc và Xuất dữ liệu', () => {
        it('TC-VAL-FLT-01: validateFilterReportsQuery thiết lập giá trị mặc định khi query rỗng', () => {
            const res = validateFilterReportsQuery({});
            assert.equal(res.isValid, true);
            assert.equal(res.data.page, 1);
            assert.equal(res.data.limit, 10);
            assert.equal(res.data.department, null);
        });

        it('TC-VAL-FLT-02: validateFilterReportsQuery chấp nhận các phòng ban hợp lệ và khoảng ngày', () => {
            const res = validateFilterReportsQuery({
                startDate: '2026-10-01',
                endDate: '2026-10-31',
                department: 'Kỹ thuật',
                page: '2',
                limit: '25'
            });
            assert.equal(res.isValid, true);
            assert.equal(res.data.startDate, '2026-10-01');
            assert.equal(res.data.endDate, '2026-10-31');
            assert.equal(res.data.department, 'Kỹ thuật');
            assert.equal(res.data.page, 2);
            assert.equal(res.data.limit, 25);
        });

        it('TC-VAL-FLT-03: validateFilterReportsQuery trả về lỗi khi startDate > endDate', () => {
            const res = validateFilterReportsQuery({
                startDate: '2026-10-31',
                endDate: '2026-10-01'
            });
            assert.equal(res.isValid, false);
            assert.ok(res.errors[0].includes('không được lớn hơn'));
        });

        it('TC-VAL-FLT-04: validateFilterReportsQuery chuẩn hóa và giới hạn phân trang (clamp page >= 1, limit 1-100)', () => {
            const resHigh = validateFilterReportsQuery({ limit: 150 });
            assert.equal(resHigh.isValid, true);
            assert.equal(resHigh.data.limit, 100);

            const resLow = validateFilterReportsQuery({ page: -5, limit: -10 });
            assert.equal(resLow.isValid, true);
            assert.equal(resLow.data.page, 1);
            assert.equal(resLow.data.limit, 1);
        });

        it('TC-VAL-FLT-05: validateFilterReportsMiddleware chặn request lỗi với HTTP 400', () => {
            const { req, res, next } = createMockReqRes({ query: { startDate: 'invalid-date' } });
            validateFilterReportsMiddleware(req, res, next);
            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
        });

        it('TC-VAL-EXP-01: validateExportReportQuery mặc định định dạng file là csv', () => {
            const res = validateExportReportQuery({});
            assert.equal(res.isValid, true);
            assert.equal(res.data.format, 'csv');
        });

        it('TC-VAL-EXP-02: validateExportReportQuery từ chối format không được hỗ trợ', () => {
            const res = validateExportReportQuery({ format: 'pdf_unsupported' });
            assert.equal(res.isValid, false);
            assert.ok(res.errors[0].includes('Định dạng xuất không hợp lệ'));
        });
    });

    // ── SUITE 2: KIỂM THỬ CONTROLLER FILTER REPORTS ──
    describe('2. Kiểm thử Controller Lọc Báo cáo (GET /api/reports/filter)', () => {
        it('TC-CTRL-FLT-01: filterReports trả về 200 OK với đầy đủ phân trang, danh sách cuộc họp và KPI summary', async () => {
            const { req, res, next } = createMockReqRes({
                query: { department: 'Quản trị', page: 1, limit: 10 }
            });

            await filterReports(req, res, next);

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.ok(res.jsonData.data.pagination);
            assert.equal(res.jsonData.data.pagination.total, 3);
            assert.equal(res.jsonData.data.pagination.totalPages, 1);
            assert.equal(res.jsonData.data.meetings.length, 3);
            assert.equal(res.jsonData.data.summary.totalMeetings, 3);
            assert.equal(res.jsonData.data.summary.cancellationRate, 33.33); // 1 / 3 * 100%
            assert.equal(res.jsonData.data.departmentBreakdown.length, 3);
        });

        it('TC-CTRL-FLT-02: filterReports bắt lỗi 400 khi tham số không hợp lệ', async () => {
            const { req, res, next } = createMockReqRes({
                query: { startDate: '31-02-2026' } // Sai định dạng
            });

            await filterReports(req, res, next);
            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
        });
    });

    // ── SUITE 3: KIỂM THỬ KẾT XUẤT FILE EXCEL / CSV UTF-8 (GET /api/reports/export) ──
    describe('3. Kiểm thử Kết xuất Báo cáo Excel / CSV UTF-8 (GET /api/reports/export)', () => {
        it('TC-EXPORT-01: exportReport gửi đúng Headers text/csv, charset=utf-8 và Content-Disposition đính kèm', async () => {
            const { req, res, next } = createMockReqRes({
                query: { format: 'csv', department: 'Kỹ thuật' }
            });

            await exportReport(req, res, next);

            assert.equal(res.statusCode, 200);
            assert.equal(res.headers['content-type'], 'text/csv; charset=utf-8');
            assert.ok(res.headers['content-disposition'].includes('attachment; filename='));
            assert.ok(res.headers['content-disposition'].includes('.csv'));
            assert.ok(typeof res.sentData === 'string');
        });

        it('TC-EXPORT-02: Tệp xuất ra bắt buộc có tiền tố UTF-8 Byte Order Mark (\\uFEFF - 0xEFBBBF) để Excel không lỗi font tiếng Việt', async () => {
            const { req, res, next } = createMockReqRes({ query: {} });

            await exportReport(req, res, next);

            const content = res.sentData;
            assert.ok(content.length > 0);

            // Kiểm tra ký tự đầu tiên là ký tự BOM \uFEFF
            assert.equal(content.charCodeAt(0), 0xFEFF, 'Ký tự đầu tiên phải là UTF-8 BOM (\\uFEFF)');

            // Kiểm tra biểu diễn Buffer UTF-8 của 3 bytes đầu tiên là EF BB BF
            const buf = Buffer.from(content, 'utf8');
            assert.equal(buf[0], 0xEF);
            assert.equal(buf[1], 0xBB);
            assert.equal(buf[2], 0xBF);
        });

        it('TC-EXPORT-03: Tệp xuất chứa đầy đủ 3 phần cấu trúc nghiệp vụ chuẩn theo đặc tả', async () => {
            const { req, res, next } = createMockReqRes({
                query: { department: 'Quản trị' }
            });

            await exportReport(req, res, next);
            const content = res.sentData;

            // 1. Metadata
            assert.ok(content.includes('BÁO CÁO THỐNG KÊ HIỆU SUẤT VÀ TÌNH HÌNH SỬ DỤNG PHÒNG HỌP'));
            assert.ok(content.includes('Hệ thống Quản lý Cuộc họp Doanh nghiệp'));
            assert.ok(content.includes('Kỳ khảo sát:'));
            assert.ok(content.includes('Phòng ban:'));
            assert.ok(content.includes('Người xuất:'));

            // 2. Executive Summary
            assert.ok(content.includes('CHỈ SỐ HIỆU SUẤT TỔNG QUAN'));
            assert.ok(content.includes('Tổng số cuộc họp'));
            assert.ok(content.includes('Cuộc họp đã xác nhận (Confirmed)'));
            assert.ok(content.includes('Cuộc họp đã hủy (Cancelled)'));
            assert.ok(content.includes('Tỷ lệ cuộc họp bị hủy'));
            assert.ok(content.includes('Tỷ lệ lấp đầy theo thời gian'));
            assert.ok(content.includes('Tỷ lệ lấp đầy theo sức chứa'));

            // 3. Room Utilization
            assert.ok(content.includes('THỐNG KÊ TẦN SUẤT SỬ DỤNG & HIỆU SUẤT TỪNG PHÒNG HỌP'));
            assert.ok(content.includes('Boardroom Thăng Long'));
            assert.ok(content.includes('Phòng Agile Sprint'));

            // 4. Detailed Meetings
            assert.ok(content.includes('DANH SÁCH CHI TIẾT CÁC CUỘC HỌP TRONG KỲ'));
            assert.ok(content.includes('Họp Chiến Lược Q4, Phát Triển Sản Phẩm'));
            assert.ok(content.includes('Họp Daily Sprint & Rà soát Bug'));
        });

        it('TC-EXPORT-04: Xử lý chuẩn RFC 4180 cho chuỗi chứa dấu phẩy, nháy kép và dấu tiếng Việt', () => {
            const mockAnalytics = {
                summary: { totalMeetings: 1, confirmedMeetings: 1, cancellationRate: 0 },
                roomUtilization: [
                    { rank: 1, roomCode: 'R1', roomName: 'Phòng Họp "VIP", Tầng 1', capacity: 10, totalMeetings: 1 }
                ]
            };
            const mockFiltered = {
                meetings: [
                    {
                        meetingId: 999,
                        title: 'Họp "Đặc Biệt", Có Dấu Phẩy & Xuống\nDòng',
                        roomName: 'Phòng "VIP", Tầng 1',
                        organizerName: 'Nguyễn Văn "Test"',
                        organizerDepartment: 'Kỹ thuật'
                    }
                ]
            };
            const meta = { department: 'Kỹ thuật', exportedBy: 'Admin' };

            const csv = ReportModel.generateCSVReport(mockAnalytics, mockFiltered, meta);

            // Kiểm tra UTF-8 BOM
            assert.equal(csv.charCodeAt(0), 0xFEFF);

            // Dấu nháy kép phải được escape thành 2 dấu nháy kép ("") và bọc trong cặp ngoặc kép
            assert.ok(csv.includes('"Phòng Họp ""VIP"", Tầng 1"'));
            assert.ok(csv.includes('"Họp ""Đặc Biệt"", Có Dấu Phẩy & Xuống\nDòng"'));
            assert.ok(csv.includes('"Nguyễn Văn ""Test"""'));

            // Dấu tiếng Việt vẫn nguyên vẹn
            assert.ok(csv.includes('Kỹ thuật'));
        });

        it('TC-EXPORT-05: exportReport trả về 400 khi khoảng ngày truyền vào không hợp lệ', async () => {
            const { req, res, next } = createMockReqRes({
                query: { startDate: '2026-10-31', endDate: '2026-10-01' }
            });

            await exportReport(req, res, next);
            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
        });
    });
});
