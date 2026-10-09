/**
 * Unit & Integration Tests cho Meeting Participants & Response Status
 * Sử dụng Node.js built-in test runner (node --test)
 * Chạy: node --test test/meetingParticipants.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
    validateResponseStatus,
    validateParticipantIds,
    ALLOWED_RESPONSE_STATUSES
} = require('../validators/participantValidator');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000/api';

describe('1. Unit Tests: participantValidator', () => {

    describe('validateResponseStatus', () => {
        it('TC-VAL-001: Trạng thái hợp lệ (Accepted, Declined, Tentative, Pending)', () => {
            ALLOWED_RESPONSE_STATUSES.forEach(status => {
                const res = validateResponseStatus(status);
                assert.equal(res.isValid, true);
                assert.equal(res.sanitizedStatus, status);
            });
        });

        it('TC-VAL-002: Khớp không phân biệt hoa thường (accepted -> Accepted, declined -> Declined)', () => {
            const resLower = validateResponseStatus('accepted');
            assert.equal(resLower.isValid, true);
            assert.equal(resLower.sanitizedStatus, 'Accepted');

            const resUpper = validateResponseStatus('DECLINED');
            assert.equal(resUpper.isValid, true);
            assert.equal(resUpper.sanitizedStatus, 'Declined');
        });

        it('TC-VAL-003: Trạng thái không hợp lệ -> trả về lỗi', () => {
            const resInvalid = validateResponseStatus('Approved');
            assert.equal(resInvalid.isValid, false);
            assert.ok(resInvalid.error.includes('không hợp lệ'));

            const resEmpty = validateResponseStatus('');
            assert.equal(resEmpty.isValid, false);

            const resNull = validateResponseStatus(null);
            assert.equal(resNull.isValid, false);
        });
    });

    describe('validateParticipantIds', () => {
        it('TC-VAL-010: Mảng ID nguyên dương hợp lệ', () => {
            const res = validateParticipantIds([1, 2, 3]);
            assert.equal(res.isValid, true);
            assert.deepEqual(res.cleanIds, [1, 2, 3]);
        });

        it('TC-VAL-011: Tự động loại bỏ ID trùng lặp', () => {
            const res = validateParticipantIds([2, 3, 2, 5, 3]);
            assert.equal(res.isValid, true);
            assert.deepEqual(res.cleanIds, [2, 3, 5]);
        });

        it('TC-VAL-012: Không phải mảng -> lỗi', () => {
            const res = validateParticipantIds("1, 2, 3");
            assert.equal(res.isValid, false);
            assert.ok(res.error.includes('phải là một mảng'));
        });

        it('TC-VAL-013: Mảng rỗng -> lỗi', () => {
            const res = validateParticipantIds([]);
            assert.equal(res.isValid, false);
            assert.ok(res.error.includes('không được để trống'));
        });

        it('TC-VAL-014: Có phần tử không phải số nguyên dương -> lỗi', () => {
            const resZero = validateParticipantIds([1, 0, 3]);
            assert.equal(resZero.isValid, false);

            const resNeg = validateParticipantIds([1, -5, 3]);
            assert.equal(resNeg.isValid, false);

            const resStr = validateParticipantIds([1, "abc", 3]);
            assert.equal(resStr.isValid, false);
        });
    });
});

describe('2. Integration Tests: API /api/meetings/:id/participants', () => {

    it('TC-API-001: GET /api/meetings/1/participants - Lấy danh sách và summary thành công (200 OK)', async () => {
        const response = await fetch(`${BASE_URL}/meetings/1/participants`);
        assert.equal(response.status, 200);

        const body = await response.json();
        assert.equal(body.success, true);
        assert.ok(body.data);
        assert.equal(body.data.meetingId, 1);
        assert.ok(body.data.summary);
        assert.equal(typeof body.data.summary.total, 'number');
        assert.ok(Array.isArray(body.data.participants));

        if (body.data.participants.length > 0) {
            const p = body.data.participants[0];
            assert.ok(p.userId);
            assert.ok(p.fullName);
            assert.ok(p.email);
            assert.ok(ALLOWED_RESPONSE_STATUSES.includes(p.responseStatus));
        }
    });

    it('TC-API-002: GET /api/meetings/999999/participants - Meeting không tồn tại -> 404 Not Found', async () => {
        const response = await fetch(`${BASE_URL}/meetings/999999/participants`);
        assert.equal(response.status, 404);

        const body = await response.json();
        assert.equal(body.success, false);
        assert.ok(body.message.includes('không tồn tại'));
    });

    it('TC-API-003: PATCH /api/meetings/1/participants/2/status - Cập nhật trạng thái thành Accepted (200 OK)', async () => {
        const response = await fetch(`${BASE_URL}/meetings/1/participants/2/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responseStatus: 'Accepted' })
        });
        assert.equal(response.status, 200);

        const body = await response.json();
        assert.equal(body.success, true);
        assert.equal(body.data.responseStatus, 'Accepted');

        // Kiểm tra lại bằng GET
        const checkRes = await fetch(`${BASE_URL}/meetings/1/participants`);
        const checkBody = await checkRes.json();
        const p = checkBody.data.participants.find(item => item.userId === 2);
        assert.ok(p);
        assert.equal(p.responseStatus, 'Accepted');
    });

    it('TC-API-004: PATCH /api/meetings/1/participants/2/status - Cập nhật trạng thái thành Declined (200 OK)', async () => {
        const response = await fetch(`${BASE_URL}/meetings/1/participants/2/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responseStatus: 'Declined' })
        });
        assert.equal(response.status, 200);

        const body = await response.json();
        assert.equal(body.success, true);
        assert.equal(body.data.responseStatus, 'Declined');
    });

    it('TC-API-005: PATCH /api/meetings/1/participants/2/status - Trạng thái không hợp lệ -> 400 Bad Request', async () => {
        const response = await fetch(`${BASE_URL}/meetings/1/participants/2/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responseStatus: 'InvalidStatus' })
        });
        assert.equal(response.status, 400);

        const body = await response.json();
        assert.equal(body.success, false);
        assert.ok(body.message.includes('không hợp lệ'));
    });

    it('TC-API-006: PATCH /api/meetings/1/participants/999999/status - User không nằm trong meeting -> 404 Not Found', async () => {
        const response = await fetch(`${BASE_URL}/meetings/1/participants/999999/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responseStatus: 'Accepted' })
        });
        assert.equal(response.status, 404);

        const body = await response.json();
        assert.equal(body.success, false);
        assert.ok(body.message.includes('không nằm trong danh sách'));
    });

    it('TC-API-007: POST /api/meetings/1/participants - Thêm người tham gia mới (201 Created)', async () => {
        const response = await fetch(`${BASE_URL}/meetings/1/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantIds: [4] })
        });
        assert.equal(response.status, 201);

        const body = await response.json();
        assert.equal(body.success, true);
        assert.ok(body.data);

        // Kiểm tra người mới có trạng thái Pending
        const checkRes = await fetch(`${BASE_URL}/meetings/1/participants`);
        const checkBody = await checkRes.json();
        const p = checkBody.data.participants.find(item => item.userId === 4);
        assert.ok(p);
        assert.equal(p.responseStatus, 'Pending');
    });

    it('TC-API-008: PUT /api/meetings/1 - Chỉnh sửa cuộc họp kèm participantIds đồng bộ bảng Meeting_Participants', async () => {
        // Cập nhật cuộc họp 1 với danh sách người tham gia mới: [1, 2, 5]
        const updateRes = await fetch(`${BASE_URL}/meetings/1`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Họp giao ban đầu tuần (Đã cập nhật)',
                startTime: '2026-10-12 08:30:00',
                endTime: '2026-10-12 10:00:00',
                organizerId: 1,
                roomId: 1,
                isRecurring: false,
                participantIds: [1, 2, 5]
            })
        });
        assert.equal(updateRes.status, 200);

        // Kiểm tra danh sách người tham gia sau khi cập nhật
        const checkRes = await fetch(`${BASE_URL}/meetings/1/participants`);
        const checkBody = await checkRes.json();
        const userIds = checkBody.data.participants.map(p => p.userId);

        assert.ok(userIds.includes(1));
        assert.ok(userIds.includes(2));
        assert.ok(userIds.includes(5));
        // User 4 không còn trong danh sách -> đã bị loại bỏ
        assert.equal(userIds.includes(4), false);
    });

    it('TC-API-009: GET /api/meetings/1 - Lấy chi tiết cuộc họp kèm danh sách người tham gia và trạng thái phản hồi', async () => {
        const res = await fetch(`${BASE_URL}/meetings/1`);
        assert.equal(res.status, 200);

        const body = await res.json();
        assert.equal(body.success, true);
        assert.ok(body.data.participants);
        assert.ok(Array.isArray(body.data.participants));
        assert.ok(body.data.participants.length > 0);
        assert.ok(body.data.participants[0].responseStatus);
    });
});
