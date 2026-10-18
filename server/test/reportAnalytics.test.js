/**
 * ==============================================================================
 * BỘ KIỂM THỬ TOÀN DIỆN API THỐNG KÊ HIỆU SUẤT GET /api/reports/analytics
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 * ==============================================================================
 *
 * Kiểm thử các tiêu chuẩn nghiệp vụ:
 * 1. Validator: Kiểm tra định dạng ngày YYYY-MM-DD, khoảng ngày, roomId, workingHoursPerDay
 * 2. Controller: Phản hồi chuẩn RESTful 200 OK, bắt lỗi 400 Bad Request, bắt lỗi máy chủ
 * 3. Tính toán Thống kê:
 *    - Tần suất sử dụng phòng (Meeting counts, total hours, usage share %)
 *    - Tỷ lệ lấp đầy % (Time occupancy rate % & Capacity / Seat occupancy rate %)
 *    - Tỷ lệ cuộc họp bị hủy % (Cancellation rate % toàn hệ thống và theo phòng)
 * 4. Tích hợp Bảo mật JWT: Xác thực token hợp lệ, từ chối token hết hạn / thiếu token
 *
 * Chạy test: node --test server/test/reportAnalytics.test.js
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const db = require('../config/database');
const ReportModel = require('../models/reportModel');
const { getAnalytics } = require('../controllers/reportController');
const {
    validateAnalyticsQuery,
    validateAnalyticsMiddleware,
    isValidDateString,
    isPositiveInteger
} = require('../validators/reportValidator');

// Helper tạo Mock Request & Response
function createMockReqRes({ query = {}, headers = {}, user = null } = {}) {
    const req = {
        query,
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
    let nextError = null;
    const next = (err) => { nextError = err; };

    return { req, res, next, getNextError: () => nextError };
}

// Mock dữ liệu chuẩn cho Database Query
function setupMockDatabase(customOverrides = {}) {
    const originalQuery = db.query;

    db.query = async (sql, params) => {
        const lowerSql = (sql || '').toLowerCase();

        if (customOverrides.handler) {
            const customResult = customOverrides.handler(lowerSql, params);
            if (customResult !== undefined) return customResult;
        }

        // 1. Min/Max Date Bounds Query
        if (lowerSql.includes('min(date(starttime))') && lowerSql.includes('max(date(starttime))')) {
            return [[{ minDate: '2026-10-01', maxDate: '2026-10-31' }]];
        }

        // 2. Summary Query
        if (lowerSql.includes('count(distinct m.meetingid) as totalmeetings') && !lowerSql.includes('group by')) {
            const cancelled = customOverrides.cancelledMeetings !== undefined ? customOverrides.cancelledMeetings : 2;
            const confirmed = customOverrides.confirmedMeetings !== undefined ? customOverrides.confirmedMeetings : 8;
            const completed = 0;
            const total = confirmed + completed + cancelled;
            return [[{
                totalMeetings: total,
                cancelledMeetings: cancelled,
                confirmedMeetings: confirmed,
                completedMeetings: completed,
                totalDurationMinutes: customOverrides.totalDurationMinutes !== undefined ? customOverrides.totalDurationMinutes : 900 // 15 giờ
            }]];
        }

        // 3. Room List Query
        if (lowerSql.includes('select') && lowerSql.includes('from rooms r') && !lowerSql.includes('left join bookings')) {
            let rooms = [
                { roomId: 1, roomCode: 'A4.01', roomName: 'Boardroom Thăng Long', capacity: 20, type: 'Hội nghị', floor: 'Tầng 4', status: 'Active' },
                { roomId: 2, roomCode: 'B2.01', roomName: 'Phòng Agile Sprint', capacity: 16, type: 'Nhóm / Tech', floor: 'Tầng 2', status: 'Active' },
                { roomId: 3, roomCode: 'TH.01', roomName: 'Innovation Hall', capacity: 50, type: 'Hội trường', floor: 'Tầng 1', status: 'Maintenance' }
            ];
            if (params && params.length > 0 && lowerSql.includes('where r.roomid = ?')) {
                rooms = rooms.filter(r => r.roomId === Number(params[0]));
            }
            return [rooms];
        }

        // 4. Room Stats Query
        if (lowerSql.includes('group by r.roomid')) {
            let stats = [
                { roomId: 1, totalMeetings: 6, cancelledMeetings: 1, confirmedMeetings: 5, completedMeetings: 0, totalMinutes: 600 },
                { roomId: 2, totalMeetings: 4, cancelledMeetings: 1, confirmedMeetings: 3, completedMeetings: 0, totalMinutes: 300 },
                { roomId: 3, totalMeetings: 0, cancelledMeetings: 0, confirmedMeetings: 0, completedMeetings: 0, totalMinutes: 0 }
            ];
            if (params && params.length > 2 && lowerSql.includes('where r.roomid = ?')) {
                const targetRoomId = Number(params[2]);
                stats = stats.filter(s => s.roomId === targetRoomId);
            }
            return [stats];
        }

        // 5. Participant Occupancy Query
        if (lowerSql.includes('from meetings m') && lowerSql.includes('meeting_participants mp')) {
            return [[
                { MeetingID: 1, RoomID: 1, Capacity: 20, participantCount: 10 },
                { MeetingID: 2, RoomID: 1, Capacity: 20, participantCount: 12 },
                { MeetingID: 3, RoomID: 2, Capacity: 16, participantCount: 8 }
            ]];
        }

        // 6. Timeline Query
        if (lowerSql.includes('group by date(m.starttime)')) {
            return [[
                { meetingDate: '2026-10-10', meetingCount: 2, totalMinutes: 180, cancelledCount: 0 },
                { meetingDate: '2026-10-11', meetingCount: 3, totalMinutes: 270, cancelledCount: 1 },
                { meetingDate: '2026-10-12', meetingCount: 5, totalMinutes: 450, cancelledCount: 1 }
            ]];
        }

        return [[]];
    };

    return () => {
        db.query = originalQuery;
    };
}

describe('BỘ KIỂM THỬ API THỐNG KÊ HIỆU SUẤT (GET /api/reports/analytics)', () => {

    // ==========================================================================
    // PHẦN 1: KIỂM THỬ VALIDATOR (reportValidator.js)
    // ==========================================================================
    describe('1. Kiểm thử Validator tham số truy vấn', () => {

        it('TC-VAL-01: isValidDateString nhận diện đúng ngày hợp lệ và không hợp lệ', () => {
            assert.equal(isValidDateString('2026-10-15'), true, 'Ngày chuẩn 2026-10-15 phải hợp lệ');
            assert.equal(isValidDateString('2026-02-28'), true, 'Ngày 2026-02-28 phải hợp lệ');
            assert.equal(isValidDateString('2026-02-30'), false, 'Ngày 2026-02-30 không tồn tại (tháng 2)');
            assert.equal(isValidDateString('2026-13-01'), false, 'Tháng 13 không tồn tại');
            assert.equal(isValidDateString('15-10-2026'), false, 'Sai định dạng DD-MM-YYYY');
            assert.equal(isValidDateString('invalid-date'), false, 'Chuỗi ký tự bất kỳ');
            assert.equal(isValidDateString(''), false, 'Chuỗi rỗng');
            assert.equal(isValidDateString(null), false, 'Giá trị null');
        });

        it('TC-VAL-02: isPositiveInteger nhận diện đúng số nguyên dương', () => {
            assert.equal(isPositiveInteger(1), true);
            assert.equal(isPositiveInteger('5'), true);
            assert.equal(isPositiveInteger(0), false);
            assert.equal(isPositiveInteger(-3), false);
            assert.equal(isPositiveInteger(2.5), false);
            assert.equal(isPositiveInteger('abc'), false);
            assert.equal(isPositiveInteger(null), false);
            assert.equal(isPositiveInteger(true), false);
        });

        it('TC-VAL-03: validateAnalyticsQuery áp dụng giá trị mặc định khi query rỗng', () => {
            const result = validateAnalyticsQuery({});
            assert.equal(result.isValid, true);
            assert.equal(result.errors.length, 0);
            assert.equal(result.data.startDate, null);
            assert.equal(result.data.endDate, null);
            assert.equal(result.data.roomId, null);
            assert.equal(result.data.workingHoursPerDay, 10);
        });

        it('TC-VAL-04: validateAnalyticsQuery trả về lỗi khi startDate sai định dạng', () => {
            const result = validateAnalyticsQuery({ startDate: '10/12/2026' });
            assert.equal(result.isValid, false);
            assert.match(result.errors[0], /Tham số "startDate" không hợp lệ/);
        });

        it('TC-VAL-05: validateAnalyticsQuery trả về lỗi khi endDate sai định dạng', () => {
            const result = validateAnalyticsQuery({ endDate: '2026-02-31' });
            assert.equal(result.isValid, false);
            assert.match(result.errors[0], /Tham số "endDate" không hợp lệ/);
        });

        it('TC-VAL-06: validateAnalyticsQuery trả về lỗi khi startDate lớn hơn endDate', () => {
            const result = validateAnalyticsQuery({
                startDate: '2026-10-20',
                endDate: '2026-10-10'
            });
            assert.equal(result.isValid, false);
            assert.match(result.errors[0], /"startDate" không được lớn hơn "endDate"/);
        });

        it('TC-VAL-07: validateAnalyticsQuery trả về lỗi khi roomId không phải số nguyên dương', () => {
            const result = validateAnalyticsQuery({ roomId: 'abc' });
            assert.equal(result.isValid, false);
            assert.match(result.errors[0], /"roomId" phải là một số nguyên dương hợp lệ/);

            const resultZero = validateAnalyticsQuery({ roomId: '0' });
            assert.equal(resultZero.isValid, false);
        });

        it('TC-VAL-08: validateAnalyticsQuery trả về lỗi khi workingHoursPerDay ngoài khoảng 1-24', () => {
            const resultOver = validateAnalyticsQuery({ workingHoursPerDay: '25' });
            assert.equal(resultOver.isValid, false);
            assert.match(resultOver.errors[0], /"workingHoursPerDay" phải là số giờ hợp lệ từ 1 đến 24/);

            const resultZero = validateAnalyticsQuery({ workingHoursPerDay: '0' });
            assert.equal(resultZero.isValid, false);
        });

        it('TC-VAL-09: validateAnalyticsMiddleware chặn request không hợp lệ với HTTP 400', () => {
            const { req, res } = createMockReqRes({ query: { startDate: 'invalid' } });
            let nextCalled = false;

            validateAnalyticsMiddleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
        });

        it('TC-VAL-10: validateAnalyticsMiddleware cho phép request hợp lệ và gán req.validatedAnalyticsQuery', () => {
            const { req, res } = createMockReqRes({
                query: { startDate: '2026-10-01', endDate: '2026-10-31', roomId: '2' }
            });
            let nextCalled = false;

            validateAnalyticsMiddleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, true);
            assert.ok(req.validatedAnalyticsQuery);
            assert.equal(req.validatedAnalyticsQuery.startDate, '2026-10-01');
            assert.equal(req.validatedAnalyticsQuery.endDate, '2026-10-31');
            assert.equal(req.validatedAnalyticsQuery.roomId, 2);
        });
    });

    // ==========================================================================
    // PHẦN 2: KIỂM THỬ CONTROLLER (reportController.js)
    // ==========================================================================
    describe('2. Kiểm thử Controller getAnalytics', () => {

        it('TC-CTRL-01: getAnalytics trả về HTTP 400 khi dữ liệu query không hợp lệ', async () => {
            const { req, res, next } = createMockReqRes({ query: { startDate: 'bad' } });

            await getAnalytics(req, res, next);

            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
            assert.ok(res.jsonData.message);
        });

        it('TC-CTRL-02: getAnalytics trả về HTTP 200 và dữ liệu thống kê khi query hợp lệ', async () => {
            const restoreDb = setupMockDatabase();

            try {
                const { req, res, next } = createMockReqRes({
                    query: { startDate: '2026-10-01', endDate: '2026-10-31' }
                });

                await getAnalytics(req, res, next);

                assert.equal(res.statusCode, 200);
                assert.equal(res.jsonData.success, true);
                assert.match(res.jsonData.message, /Lấy dữ liệu thống kê hiệu suất thành công/);
                assert.ok(res.jsonData.data);
                assert.ok(res.jsonData.data.summary);
                assert.ok(Array.isArray(res.jsonData.data.roomUtilization));
            } finally {
                restoreDb();
            }
        });

        it('TC-CTRL-03: getAnalytics chuyển lỗi ngoại lệ cho next() khi model gặp sự cố', async () => {
            const { req, res, next, getNextError } = createMockReqRes({ query: {} });

            const originalMethod = ReportModel.getAnalytics;
            ReportModel.getAnalytics = async () => {
                throw new Error('Database connection failed');
            };

            try {
                await getAnalytics(req, res, next);
                assert.ok(getNextError(), 'next() phải được gọi với error');
                assert.equal(getNextError().message, 'Database connection failed');
            } finally {
                ReportModel.getAnalytics = originalMethod;
            }
        });
    });

    // ==========================================================================
    // PHẦN 3: KIỂM THỬ THUẬT TOÁN TÍNH TOÁN HIỆU SUẤT (Model & Logic)
    // ==========================================================================
    describe('3. Kiểm thử Thuật toán Tính toán Chỉ số Hiệu suất', () => {
        let restoreDb;

        beforeEach(() => {
            restoreDb = setupMockDatabase();
        });

        afterEach(() => {
            if (restoreDb) restoreDb();
        });

        it('TC-CALC-01: Tỷ lệ hủy cuộc họp = 0% khi không có cuộc họp nào bị hủy', async () => {
            restoreDb();
            restoreDb = setupMockDatabase({ cancelledMeetings: 0, confirmedMeetings: 10 });

            const result = await ReportModel.getAnalytics({
                startDate: '2026-10-01',
                endDate: '2026-10-31'
            });

            assert.equal(result.summary.cancelledMeetings, 0);
            assert.equal(result.summary.cancellationRate, 0);
        });

        it('TC-CALC-02: Tỷ lệ hủy cuộc họp tính chính xác theo công thức (cancelled / total) * 100', async () => {
            restoreDb();
            restoreDb = setupMockDatabase({ cancelledMeetings: 2, confirmedMeetings: 8 });

            const result = await ReportModel.getAnalytics({
                startDate: '2026-10-01',
                endDate: '2026-10-31'
            });

            assert.equal(result.summary.totalMeetings, 10);
            assert.equal(result.summary.cancelledMeetings, 2);
            assert.equal(result.summary.cancellationRate, 20.00); // 2/10 = 20%
        });

        it('TC-CALC-03: Tần suất sử dụng phòng (usageShare %) có tổng bằng 100% (hoặc xấp xỉ)', async () => {
            const result = await ReportModel.getAnalytics();
            const rooms = result.roomUtilization;

            assert.ok(Array.isArray(rooms));
            assert.equal(rooms.length, 3);

            // Kiểm tra từng phòng có đầy đủ các chỉ số nghiệp vụ
            for (const r of rooms) {
                assert.ok(r.roomId, 'Phòng phải có roomId');
                assert.ok(r.roomName, 'Phòng phải có roomName');
                assert.equal(typeof r.totalMeetings, 'number');
                assert.equal(typeof r.totalHours, 'number');
                assert.equal(typeof r.timeOccupancyRate, 'number');
                assert.equal(typeof r.capacityOccupancyRate, 'number');
                assert.equal(typeof r.usageShare, 'number');
                assert.ok(r.rank >= 1, 'Xếp hạng phòng phải từ 1 trở lên');
            }

            const totalShare = rooms.reduce((acc, r) => acc + r.usageShare, 0);
            assert.ok(Math.abs(totalShare - 100) < 1.0, `Tổng usageShare (${totalShare}%) phải xấp xỉ 100%`);
        });

        it('TC-CALC-04: Tỷ lệ lấp đầy thời gian (% timeOccupancyRate) không vượt quá 100%', async () => {
            const result = await ReportModel.getAnalytics();
            assert.ok(result.summary.timeOccupancyRate >= 0);
            assert.ok(result.summary.timeOccupancyRate <= 100);

            for (const r of result.roomUtilization) {
                assert.ok(r.timeOccupancyRate >= 0);
                assert.ok(r.timeOccupancyRate <= 100);
            }
        });

        it('TC-CALC-05: Tỷ lệ lấp đầy sức chứa (% capacityOccupancyRate) tính đúng theo số ghế', async () => {
            const result = await ReportModel.getAnalytics();
            assert.ok(result.summary.capacityOccupancyRate >= 0);
            assert.ok(result.summary.capacityOccupancyRate <= 100);

            for (const r of result.roomUtilization) {
                assert.ok(r.capacityOccupancyRate >= 0);
                assert.ok(r.capacityOccupancyRate <= 100);
            }
        });

        it('TC-CALC-06: Top phòng được sử dụng nhiều nhất (mostUtilized) xếp hạng 1', async () => {
            const result = await ReportModel.getAnalytics();
            assert.ok(result.topRooms.mostUtilized);
            assert.equal(result.topRooms.mostUtilized.roomId, 1);
            assert.equal(result.topRooms.mostUtilized.totalHours, 10);
        });

        it('TC-CALC-07: Phân bổ trạng thái (statusDistribution) phản ánh đúng confirmed, completed, cancelled', async () => {
            const result = await ReportModel.getAnalytics();
            const dist = result.statusDistribution;

            assert.ok(dist.confirmed);
            assert.ok(dist.completed);
            assert.ok(dist.cancelled);

            const sumPct = dist.confirmed.percentage + dist.completed.percentage + dist.cancelled.percentage;
            assert.ok(Math.abs(sumPct - 100) < 1.0, 'Tổng phần trăm phân bổ trạng thái phải xấp xỉ 100%');
        });

        it('TC-CALC-08: Lọc theo roomId trả về duy nhất phòng được yêu cầu', async () => {
            const targetRoomId = 1;
            const result = await ReportModel.getAnalytics({ roomId: targetRoomId });

            assert.equal(result.filter.roomId, targetRoomId);
            assert.equal(result.roomUtilization.length, 1);
            assert.equal(result.roomUtilization[0].roomId, targetRoomId);
        });
    });

    // ==========================================================================
    // PHẦN 4: KIỂM THỬ TÍCH HỢP BẢO MẬT JWT & ACCESS CONTROL
    // ==========================================================================
    describe('4. Kiểm thử Bảo mật & Xác thực JWT', () => {

        it('TC-SEC-01: Tạo JWT Token hợp lệ và giải mã thông tin an toàn', () => {
            const token = jwt.sign(
                { userId: 1, username: 'admin', email: 'admin@enterprise.vn', role: 'Admin' },
                authConfig.jwtSecret,
                { expiresIn: '1h' }
            );

            const decoded = jwt.verify(token, authConfig.jwtSecret);
            assert.equal(decoded.userId, 1);
            assert.equal(decoded.role, 'Admin');
        });

        it('TC-SEC-02: Token hết hạn bị từ chối xác thực', () => {
            const expiredToken = jwt.sign(
                { userId: 1, role: 'Admin' },
                authConfig.jwtSecret,
                { expiresIn: '-1s' }
            );

            assert.throws(() => {
                jwt.verify(expiredToken, authConfig.jwtSecret);
            }, /jwt expired/);
        });
    });
});
