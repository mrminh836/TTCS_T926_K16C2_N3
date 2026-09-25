const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Meeting = require('../models/meetingModel');
const { createMeeting } = require('../controllers/meetingController');

describe('Meeting Controller - createMeeting (Kiểm thử Unit Test Controller)', () => {
    // Helper tạo mock request & response
    const createMockReqRes = (body = {}, validatedMeetingData = null) => {
        let statusCode = null;
        let responseJson = null;
        let nextError = null;

        const req = {
            body,
            validatedMeetingData
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

    it('should return 201 Created and return meeting data when creation succeeds', async () => {
        const mockMeetingData = {
            meetingId: 101,
            bookingId: 202,
            title: 'Họp Sprint Review',
            roomId: 1,
            roomName: 'Phòng VIP',
            startTime: '2099-01-01T09:00:00.000Z',
            endTime: '2099-01-01T10:00:00.000Z',
            organizerId: 1,
            participantCount: 2,
            equipmentCount: 1
        };

        // Mock Meeting.create thành công
        const originalCreate = Meeting.create;
        Meeting.create = async () => mockMeetingData;

        try {
            const { req, res, getStatus, getJson } = createMockReqRes({
                title: 'Họp Sprint Review',
                startTime: '2099-01-01T09:00:00.000Z',
                endTime: '2099-01-01T10:00:00.000Z',
                organizerId: 1,
                roomId: 1
            });

            await createMeeting(req, res, () => {});

            assert.equal(getStatus(), 201);
            const json = getJson();
            assert.equal(json.success, true);
            assert.equal(json.message, 'Tạo cuộc họp và đặt phòng thành công.');
            assert.deepEqual(json.data, mockMeetingData);
        } finally {
            Meeting.create = originalCreate;
        }
    });

    it('should return 400 Bad Request when validation fails directly in controller', async () => {
        const { req, res, getStatus, getJson } = createMockReqRes({
            title: '', // Tên rỗng
            startTime: '2099-01-01T09:00:00.000Z',
            endTime: '2099-01-01T10:00:00.000Z',
            organizerId: 1,
            roomId: 1
        });

        await createMeeting(req, res, () => {});

        assert.equal(getStatus(), 400);
        const json = getJson();
        assert.equal(json.success, false);
        assert.ok(json.message.includes('Tiêu đề cuộc họp (title) là bắt buộc'));
    });

    it('should return 404 Not Found when organizer or room does not exist', async () => {
        const originalCreate = Meeting.create;
        Meeting.create = async () => {
            const err = new Error('Người tổ chức với ID 999 không tồn tại.');
            err.status = 404;
            throw err;
        };

        try {
            const { req, res, getStatus, getJson } = createMockReqRes({
                title: 'Họp Dự Án',
                startTime: '2099-01-01T09:00:00.000Z',
                endTime: '2099-01-01T10:00:00.000Z',
                organizerId: 999,
                roomId: 1
            });

            await createMeeting(req, res, () => {});

            assert.equal(getStatus(), 404);
            const json = getJson();
            assert.equal(json.success, false);
            assert.equal(json.message, 'Người tổ chức với ID 999 không tồn tại.');
        } finally {
            Meeting.create = originalCreate;
        }
    });

    it('should return 409 Conflict when room is already booked in requested timeframe', async () => {
        const originalCreate = Meeting.create;
        Meeting.create = async () => {
            const err = new Error('Phòng họp "Phòng VIP" đã có người đặt trong khung giờ này.');
            err.status = 409;
            throw err;
        };

        try {
            const { req, res, getStatus, getJson } = createMockReqRes({
                title: 'Họp Khẩn Cấp',
                startTime: '2099-01-01T09:00:00.000Z',
                endTime: '2099-01-01T10:00:00.000Z',
                organizerId: 1,
                roomId: 1
            });

            await createMeeting(req, res, () => {});

            assert.equal(getStatus(), 409);
            const json = getJson();
            assert.equal(json.success, false);
            assert.equal(json.message, 'Phòng họp "Phòng VIP" đã có người đặt trong khung giờ này.');
        } finally {
            Meeting.create = originalCreate;
        }
    });

    it('should pass unexpected errors to next middleware', async () => {
        const originalCreate = Meeting.create;
        const dbError = new Error('Database connection lost');
        Meeting.create = async () => {
            throw dbError;
        };

        try {
            const { req, res, getNextError } = createMockReqRes({
                title: 'Họp Ban Giám Đốc',
                startTime: '2099-01-01T09:00:00.000Z',
                endTime: '2099-01-01T10:00:00.000Z',
                organizerId: 1,
                roomId: 1
            });

            await createMeeting(req, res, (err) => {
                assert.equal(err, dbError);
            });
        } finally {
            Meeting.create = originalCreate;
        }
    });
});
