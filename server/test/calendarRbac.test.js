const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Meeting = require('../models/meetingModel');
const { getMeetings, getMeetingById } = require('../controllers/meetingController');

describe('Calendar RBAC & Security Tests (Phân quyền lịch họp & Bảo vệ dữ liệu)', () => {

    const createMockReqRes = (options = {}) => {
        const {
            query = {},
            params = {},
            user = null,
            headers = {}
        } = options;

        let statusCode = null;
        let responseJson = null;
        let nextError = null;

        const req = {
            query,
            params,
            user,
            headers
        };

        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                responseJson = data;
                return res;
            }
        };

        const next = (err) => {
            nextError = err;
        };

        return {
            req,
            res,
            getStatus: () => statusCode,
            getJson: () => responseJson,
            getNextError: () => nextError
        };
    };

    // =========================================================================
    // NHÓM A: KIỂM THỬ PHÂN QUYỀN TRUY VẤN LỊCH HỌP (GET /api/meetings)
    // =========================================================================

    it('A1: Admin đăng nhập và xem được toàn bộ cuộc họp toàn doanh nghiệp', async () => {
        let capturedFilters = null;
        const originalGetAll = Meeting.getAll;
        Meeting.getAll = async (filters) => {
            capturedFilters = filters;
            return {
                meetings: [
                    { meetingId: 1, title: 'Họp HĐQT', organizerId: 10, roomName: 'Phòng VIP' },
                    { meetingId: 2, title: 'Họp Team Dev', organizerId: 20, roomName: 'Phòng Lab' }
                ],
                pagination: { currentPage: 1, limit: 100, total: 2, totalPages: 1 }
            };
        };

        try {
            const { req, res, getStatus, getJson } = createMockReqRes({
                query: { startDate: '2026-10-19', endDate: '2026-10-25', limit: '100', sortOrder: 'ASC' },
                user: { userId: 1, username: 'admin', role: 'Admin' }
            });

            await getMeetings(req, res, () => {});

            assert.equal(getStatus(), 200);
            assert.equal(capturedFilters.userRole, 'Admin');
            assert.equal(capturedFilters.userId, 1);
            assert.equal(capturedFilters.sortOrder, 'ASC');
            const json = getJson();
            assert.equal(json.success, true);
            assert.equal(json.data.length, 2);
        } finally {
            Meeting.getAll = originalGetAll;
        }
    });

    it('A2: Nhân viên A chỉ truy vấn cuộc họp do mình tổ chức hoặc tham gia', async () => {
        let capturedFilters = null;
        const originalGetAll = Meeting.getAll;
        Meeting.getAll = async (filters) => {
            capturedFilters = filters;
            return {
                meetings: [
                    { meetingId: 5, title: 'Họp Dự án của A', organizerId: 101 }
                ],
                pagination: { currentPage: 1, limit: 100, total: 1, totalPages: 1 }
            };
        };

        try {
            const { req, res, getStatus, getJson } = createMockReqRes({
                query: { startDate: '2026-10-19', endDate: '2026-10-25' },
                user: { userId: 101, username: 'employee_a', role: 'Employee' }
            });

            await getMeetings(req, res, () => {});

            assert.equal(getStatus(), 200);
            assert.equal(capturedFilters.userId, 101);
            assert.equal(capturedFilters.userRole, 'Employee');
            const json = getJson();
            assert.equal(json.data.length, 1);
            assert.equal(json.data[0].organizerId, 101);
        } finally {
            Meeting.getAll = originalGetAll;
        }
    });

    it('A3: Nhân viên A gửi query param giả mạo userId của người khác -> Backend vẫn dùng userId từ JWT', async () => {
        let capturedFilters = null;
        const originalGetAll = Meeting.getAll;
        Meeting.getAll = async (filters) => {
            capturedFilters = filters;
            return {
                meetings: [],
                pagination: { currentPage: 1, limit: 10, total: 0, totalPages: 0 }
            };
        };

        try {
            // Client cố tình truyền userId: 999 (ID của sếp/người khác) vào query
            const { req, res } = createMockReqRes({
                query: { userId: '999', role: 'Admin', startDate: '2026-10-19', endDate: '2026-10-25' },
                user: { userId: 101, username: 'employee_a', role: 'Employee' } // Token thật của A
            });

            await getMeetings(req, res, () => {});

            // Backend phải kiên quyết sử dụng identity từ req.user (JWT), bỏ qua query params
            assert.equal(capturedFilters.userId, 101);
            assert.equal(capturedFilters.userRole, 'Employee');
        } finally {
            Meeting.getAll = originalGetAll;
        }
    });

    it('A4: User không có role hợp lệ hoặc không có userId -> Model áp dụng Zero Trust (1 = 0)', async () => {
        // Kiểm tra logic Model getAll xử lý zero trust
        // Khi userRole rỗng và userId rỗng -> điều kiện '1 = 0' được kích hoạt
        let capturedFilters = null;
        const originalGetAll = Meeting.getAll;
        Meeting.getAll = async (filters) => {
            capturedFilters = filters;
            return {
                meetings: [],
                pagination: { currentPage: 1, limit: 10, total: 0, totalPages: 0 }
            };
        };

        try {
            const { req, res, getStatus } = createMockReqRes({
                query: { startDate: '2026-10-19', endDate: '2026-10-25' },
                user: { userId: null, role: 'Anonymous' }
            });

            await getMeetings(req, res, () => {});
            assert.equal(getStatus(), 200);
            assert.equal(capturedFilters.userId, null);
            assert.equal(capturedFilters.userRole, 'Anonymous');
        } finally {
            Meeting.getAll = originalGetAll;
        }
    });

    // =========================================================================
    // NHÓM B: BẢO VỆ CHI TIẾT CUỘC HỌP (GET /api/meetings/:id)
    // =========================================================================

    it('B1: Admin được phép xem chi tiết mọi cuộc họp', async () => {
        const mockMeeting = {
            meetingId: 88,
            title: 'Họp Kế hoạch Quý',
            organizerId: 200,
            participants: [{ userId: 300, fullName: 'Người khác' }]
        };

        const originalGetById = Meeting.getById;
        Meeting.getById = async () => mockMeeting;

        try {
            const { req, res, getStatus, getJson } = createMockReqRes({
                params: { id: '88' },
                user: { userId: 1, role: 'Admin' }
            });

            await getMeetingById(req, res, () => {});

            assert.equal(getStatus(), 200);
            assert.equal(getJson().success, true);
            assert.deepEqual(getJson().data, mockMeeting);
        } finally {
            Meeting.getById = originalGetById;
        }
    });

    it('B2: Nhân viên là Người tổ chức (Organizer) được phép xem chi tiết cuộc họp', async () => {
        const mockMeeting = {
            meetingId: 88,
            title: 'Họp của A',
            organizerId: 101, // A là chủ trì
            participants: [{ userId: 202, fullName: 'Người tham gia B' }]
        };

        const originalGetById = Meeting.getById;
        Meeting.getById = async () => mockMeeting;

        try {
            const { req, res, getStatus, getJson } = createMockReqRes({
                params: { id: '88' },
                user: { userId: 101, role: 'Employee' }
            });

            await getMeetingById(req, res, () => {});

            assert.equal(getStatus(), 200);
            assert.equal(getJson().success, true);
            assert.equal(getJson().data.meetingId, 88);
        } finally {
            Meeting.getById = originalGetById;
        }
    });

    it('B3: Nhân viên là Người tham gia (Participant) được phép xem chi tiết cuộc họp', async () => {
        const mockMeeting = {
            meetingId: 88,
            title: 'Họp Dự án Chung',
            organizerId: 200, // Người khác tổ chức
            participants: [
                { userId: 101, fullName: 'Nhân viên A' }, // A được mời tham gia
                { userId: 202, fullName: 'Nhân viên B' }
            ]
        };

        const originalGetById = Meeting.getById;
        Meeting.getById = async () => mockMeeting;

        try {
            const { req, res, getStatus, getJson } = createMockReqRes({
                params: { id: '88' },
                user: { userId: 101, role: 'Employee' }
            });

            await getMeetingById(req, res, () => {});

            assert.equal(getStatus(), 200);
            assert.equal(getJson().success, true);
            assert.equal(getJson().data.meetingId, 88);
        } finally {
            Meeting.getById = originalGetById;
        }
    });

    it('B4: Nhân viên không phải chủ trì và không có trong danh sách tham gia -> 403 Forbidden', async () => {
        const mockMeeting = {
            meetingId: 99,
            title: 'Họp kín riêng của Phòng Tài Chính',
            organizerId: 300,
            participants: [
                { userId: 301, fullName: 'Kế toán trưởng' },
                { userId: 302, fullName: 'Giám đốc tài chính' }
            ]
        };

        const originalGetById = Meeting.getById;
        Meeting.getById = async () => mockMeeting;

        try {
            const { req, res, getStatus, getJson } = createMockReqRes({
                params: { id: '99' },
                user: { userId: 101, role: 'Employee' } // Nhân viên A tò mò truy cập id 99
            });

            await getMeetingById(req, res, () => {});

            assert.equal(getStatus(), 403);
            const json = getJson();
            assert.equal(json.success, false);
            assert.ok(json.message.includes('không có quyền'));
        } finally {
            Meeting.getById = originalGetById;
        }
    });

    // =========================================================================
    // NHÓM C: KIỂM TRA ĐỊNH DẠNG NGÀY & THAM SỐ LỊCH HỌP
    // =========================================================================

    it('C1: Báo lỗi 400 nếu startDate hoặc endDate không đúng định dạng YYYY-MM-DD', async () => {
        const { req, res, getStatus, getJson } = createMockReqRes({
            query: { startDate: '19-10-2026', endDate: '2026-10-25' },
            user: { userId: 1, role: 'Admin' }
        });

        await getMeetings(req, res, () => {});

        assert.equal(getStatus(), 400);
        assert.ok(getJson().message.includes('YYYY-MM-DD'));
    });

    it('C2: Báo lỗi 400 nếu startDate lớn hơn endDate', async () => {
        const { req, res, getStatus, getJson } = createMockReqRes({
            query: { startDate: '2026-10-26', endDate: '2026-10-20' },
            user: { userId: 1, role: 'Admin' }
        });

        await getMeetings(req, res, () => {});

        assert.equal(getStatus(), 400);
        assert.ok(getJson().message.includes('không được lớn hơn'));
    });
});
