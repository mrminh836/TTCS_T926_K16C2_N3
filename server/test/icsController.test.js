/**
 * Unit Tests — icsController.js (Controller xuất tệp iCalendar .ics)
 * 
 * Kiểm thử:
 * 1. Thành công (200 OK) với đầy đủ Response Headers và nội dung .ics chuẩn
 * 2. Lỗi validation ID (400 Bad Request) khi ID không phải số nguyên dương
 * 3. Không tìm thấy cuộc họp (404 Not Found)
 * 4. Xử lý ngoại lệ máy chủ (next error)
 * 
 * Chạy test: node --test server/test/icsController.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Meeting = require('../models/meetingModel');
const { exportMeetingICS } = require('../controllers/icsController');

describe('icsController.exportMeetingICS()', () => {

    // Helper tạo Mock req, res, next
    const createMockReqRes = (params = {}) => {
        let statusCode = null;
        let responseJson = null;
        let responseBody = null;
        const headers = {};
        let nextError = null;

        const req = {
            params,
            headers: {}
        };

        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                responseJson = data;
                return res;
            },
            send: (body) => {
                responseBody = body;
                return res;
            },
            setHeader: (key, value) => {
                headers[key.toLowerCase()] = value;
                return res;
            }
        };

        const next = (err) => {
            nextError = err;
        };

        return {
            req,
            res,
            next,
            getStatus: () => statusCode,
            getJson: () => responseJson,
            getBody: () => responseBody,
            getHeaders: () => headers,
            getHeader: (key) => headers[key.toLowerCase()],
            getNextError: () => nextError
        };
    };

    // ── TEST 1: Xuất file .ics thành công ──
    it('should return 200 OK with text/calendar Content-Type and valid .ics content', async () => {
        const mockMeeting = {
            meetingId: 1,
            title: 'Họp Kế Hoạch Sprint 3',
            description: 'Thảo luận tiến độ và phân công công việc',
            startTime: '2026-10-20T08:30:00Z',
            endTime: '2026-10-20T10:00:00Z',
            organizerName: 'Nguyễn Văn Quản Trị',
            organizerEmail: 'admin@enterprise.vn',
            roomName: 'Phòng Hội Thảo A',
            participants: [
                { fullName: 'Trần Nhân Viên', email: 'nhanvien@enterprise.vn', responseStatus: 'Accepted' }
            ],
            equipments: [
                { equipmentName: 'Máy chiếu Panasonic 4K' }
            ]
        };

        // Mock Meeting.getById
        const originalGetById = Meeting.getById;
        Meeting.getById = async (id) => {
            if (id === 1) return mockMeeting;
            return null;
        };

        try {
            const mock = createMockReqRes({ id: '1' });
            await exportMeetingICS(mock.req, mock.res, mock.next);

            assert.equal(mock.getStatus(), 200);
            assert.equal(mock.getNextError(), null);

            // Kiểm tra Content-Type
            const contentType = mock.getHeader('content-type');
            assert.ok(contentType, 'Phải có header Content-Type');
            assert.ok(contentType.includes('text/calendar'), 'Content-Type phải là text/calendar');
            assert.ok(contentType.includes('method=REQUEST'), 'Content-Type phải có method=REQUEST');

            // Kiểm tra Content-Disposition
            const contentDisposition = mock.getHeader('content-disposition');
            assert.ok(contentDisposition, 'Phải có header Content-Disposition');
            assert.ok(contentDisposition.includes('attachment'), 'Content-Disposition phải là attachment');
            assert.ok(contentDisposition.includes('meeting_1_hop_ke_hoach_sprint_3.ics'), 'Tên file .ics an toàn');

            // Kiểm tra Cache-Control
            assert.equal(mock.getHeader('cache-control'), 'no-cache, no-store, must-revalidate');

            // Kiểm tra nội dung Body tệp .ics
            const body = mock.getBody();
            assert.ok(body.startsWith('BEGIN:VCALENDAR'), 'Bắt đầu bằng BEGIN:VCALENDAR');
            assert.ok(body.includes('VERSION:2.0'), 'Chứa VERSION:2.0');
            assert.ok(body.includes('SUMMARY:Họp Kế Hoạch Sprint 3'), 'Chứa SUMMARY');
            assert.ok(body.includes('LOCATION:Phòng Hội Thảo A'), 'Chứa LOCATION');
            assert.ok(body.includes('ORGANIZER;CN="Nguyễn Văn Quản Trị":mailto:admin@enterprise.vn'), 'Chứa ORGANIZER');
            // RFC 5545 Unfolding: ghép các dòng fold (CRLF + space) lại để kiểm tra nội dung thuộc tính dài
            const unfoldedBody = body.replace(/\r\n /g, '');
            assert.ok(unfoldedBody.includes('ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="Trần Nhân Viên":mailto:nhanvien@enterprise.vn'), 'Chứa ATTENDEE');
            assert.ok(body.includes('Máy chiếu Panasonic 4K'), 'Chứa thông tin thiết bị trong description');
            assert.ok(body.endsWith('END:VCALENDAR'), 'Kết thúc bằng END:VCALENDAR');

        } finally {
            Meeting.getById = originalGetById;
        }
    });

    // ── TEST 2: ID không hợp lệ (không phải số) ──
    it('should return 400 Bad Request when meeting ID is not a number', async () => {
        const mock = createMockReqRes({ id: 'abc' });
        await exportMeetingICS(mock.req, mock.res, mock.next);

        assert.equal(mock.getStatus(), 400);
        const json = mock.getJson();
        assert.equal(json.success, false);
        assert.ok(json.message.includes('ID cuộc họp không hợp lệ'));
    });

    // ── TEST 3: ID là số âm hoặc 0 ──
    it('should return 400 Bad Request when meeting ID is zero or negative', async () => {
        const mock = createMockReqRes({ id: '-5' });
        await exportMeetingICS(mock.req, mock.res, mock.next);

        assert.equal(mock.getStatus(), 400);
        assert.equal(mock.getJson().success, false);

        const mockZero = createMockReqRes({ id: '0' });
        await exportMeetingICS(mockZero.req, mockZero.res, mockZero.next);
        assert.equal(mockZero.getStatus(), 400);
    });

    // ── TEST 4: Cuộc họp không tồn tại (404) ──
    it('should return 404 Not Found when meeting does not exist', async () => {
        const originalGetById = Meeting.getById;
        Meeting.getById = async () => null;

        try {
            const mock = createMockReqRes({ id: '99999' });
            await exportMeetingICS(mock.req, mock.res, mock.next);

            assert.equal(mock.getStatus(), 404);
            const json = mock.getJson();
            assert.equal(json.success, false);
            assert.ok(json.message.includes('không tồn tại'));
        } finally {
            Meeting.getById = originalGetById;
        }
    });

    // ── TEST 5: Bắt lỗi ngoại lệ và chuyển sang next() ──
    it('should call next(error) when database throws an exception', async () => {
        const originalGetById = Meeting.getById;
        const dbError = new Error('Database connection failed');
        Meeting.getById = async () => {
            throw dbError;
        };

        try {
            const mock = createMockReqRes({ id: '1' });
            await exportMeetingICS(mock.req, mock.res, mock.next);

            assert.equal(mock.getNextError(), dbError);
        } finally {
            Meeting.getById = originalGetById;
        }
    });
});
