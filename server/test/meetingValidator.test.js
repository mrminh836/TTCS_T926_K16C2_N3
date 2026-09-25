const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    VALIDATION_CONFIG,
    isPositiveInteger,
    parseValidDate,
    validateMeetingInput,
    validateMeetingMiddleware
} = require('../validators/meetingValidator');

describe('Meeting Validator - Helper Functions', () => {
    describe('isPositiveInteger', () => {
        it('should return true for positive integers (number and valid numeric string)', () => {
            assert.equal(isPositiveInteger(1), true);
            assert.equal(isPositiveInteger(100), true);
            assert.equal(isPositiveInteger('5'), true);
            assert.equal(isPositiveInteger('999'), true);
        });

        it('should return false for 0, negative numbers, floats, non-numeric values, and booleans', () => {
            assert.equal(isPositiveInteger(0), false);
            assert.equal(isPositiveInteger(-1), false);
            assert.equal(isPositiveInteger(1.5), false);
            assert.equal(isPositiveInteger('1.5'), false);
            assert.equal(isPositiveInteger('abc'), false);
            assert.equal(isPositiveInteger(null), false);
            assert.equal(isPositiveInteger(undefined), false);
            assert.equal(isPositiveInteger(true), false);
            assert.equal(isPositiveInteger(false), false);
            assert.equal(isPositiveInteger([]), false);
            assert.equal(isPositiveInteger({}), false);
        });
    });

    describe('parseValidDate', () => {
        it('should parse valid ISO date strings and Date objects', () => {
            const isoStr = '2026-10-15T09:00:00.000Z';
            const res1 = parseValidDate(isoStr);
            assert.equal(res1.isValid, true);
            assert.ok(res1.date instanceof Date);
            assert.equal(res1.date.toISOString(), isoStr);

            const nowDate = new Date();
            const res2 = parseValidDate(nowDate);
            assert.equal(res2.isValid, true);
            assert.equal(res2.date.getTime(), nowDate.getTime());
        });

        it('should return isValid = false for invalid date strings or non-date types', () => {
            assert.equal(parseValidDate('invalid-date').isValid, false);
            assert.equal(parseValidDate('2026-99-99').isValid, false);
            assert.equal(parseValidDate(null).isValid, false);
            assert.equal(parseValidDate(undefined).isValid, false);
            assert.equal(parseValidDate(12345).isValid, false);
            assert.equal(parseValidDate('').isValid, false);
        });
    });
});

describe('Meeting Validator - validateMeetingInput (Validation dữ liệu đầu vào cuộc họp)', () => {
    // Cố định thời điểm tham chiếu: 2026-10-01 08:00:00 UTC
    const refTime = new Date('2026-10-01T08:00:00.000Z');

    const createValidMeetingData = (overrides = {}) => ({
        title: 'Họp kế hoạch quý 4/2026',
        description: 'Thảo luận mục tiêu kinh doanh và phân công nhiệm vụ',
        startTime: '2026-10-01T09:00:00.000Z',
        endTime: '2026-10-01T10:00:00.000Z',
        organizerId: 1,
        roomId: 2,
        isRecurring: false,
        participantIds: [2, 3, 4],
        equipmentIds: [1, 5],
        ...overrides
    });

    it('should pass validation with complete and valid data', () => {
        const input = createValidMeetingData();
        const result = validateMeetingInput(input, { referenceTime: refTime });

        assert.equal(result.isValid, true);
        assert.equal(result.errors.length, 0);
        assert.equal(result.data.title, 'Họp kế hoạch quý 4/2026');
        assert.equal(result.data.organizerId, 1);
        assert.equal(result.data.roomId, 2);
        assert.deepEqual(result.data.participantIds, [2, 3, 4]);
        assert.deepEqual(result.data.equipmentIds, [1, 5]);
    });

    it('should reject non-object or null input', () => {
        assert.equal(validateMeetingInput(null).isValid, false);
        assert.equal(validateMeetingInput(undefined).isValid, false);
        assert.equal(validateMeetingInput('string').isValid, false);
        assert.equal(validateMeetingInput([]).isValid, false);
    });

    // -------------------------------------------------------------
    // 1. Kiểm tra Tiêu đề (Title)
    // -------------------------------------------------------------
    describe('Title Validation', () => {
        it('should fail when title is missing, null, or undefined', () => {
            const inputNoTitle = createValidMeetingData({ title: undefined });
            const result = validateMeetingInput(inputNoTitle, { referenceTime: refTime });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('Tiêu đề cuộc họp (title) là bắt buộc')));
        });

        it('should fail when title is empty or contains only whitespace', () => {
            const inputEmpty = createValidMeetingData({ title: '   ' });
            const result = validateMeetingInput(inputEmpty, { referenceTime: refTime });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('không được để trống')));
        });

        it('should fail when title exceeds max length (200 characters)', () => {
            const longTitle = 'A'.repeat(201);
            const inputLong = createValidMeetingData({ title: longTitle });
            const result = validateMeetingInput(inputLong, { referenceTime: refTime });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('không được vượt quá 200 ký tự')));
        });

        it('should trim whitespace around title', () => {
            const inputWithSpaces = createValidMeetingData({ title: '  Họp Ban Giám Đốc  ' });
            const result = validateMeetingInput(inputWithSpaces, { referenceTime: refTime });
            assert.equal(result.isValid, true);
            assert.equal(result.data.title, 'Họp Ban Giám Đốc');
        });
    });

    // -------------------------------------------------------------
    // 2. Kiểm tra Thời gian hợp lệ (Date-Time Validation - Trọng tâm)
    // -------------------------------------------------------------
    describe('Date-Time Validation (Thời gian hợp lệ)', () => {
        it('should fail when startTime or endTime is missing', () => {
            const noStart = createValidMeetingData({ startTime: null });
            const resStart = validateMeetingInput(noStart, { referenceTime: refTime });
            assert.equal(resStart.isValid, false);
            assert.ok(resStart.errors.some(e => e.includes('bắt buộc')));

            const noEnd = createValidMeetingData({ endTime: undefined });
            const resEnd = validateMeetingInput(noEnd, { referenceTime: refTime });
            assert.equal(resEnd.isValid, false);
            assert.ok(resEnd.errors.some(e => e.includes('bắt buộc')));
        });

        it('should fail when startTime or endTime is an invalid date string', () => {
            const invalidStart = createValidMeetingData({ startTime: 'not-a-valid-date' });
            const resStart = validateMeetingInput(invalidStart, { referenceTime: refTime });
            assert.equal(resStart.isValid, false);
            assert.ok(resStart.errors.some(e => e.includes('Định dạng ngày giờ không hợp lệ')));

            const invalidEnd = createValidMeetingData({ endTime: '2026-02-31T25:00:00Z' });
            const resEnd = validateMeetingInput(invalidEnd, { referenceTime: refTime });
            assert.equal(resEnd.isValid, false);
            assert.ok(resEnd.errors.some(e => e.includes('Định dạng ngày giờ không hợp lệ')));
        });

        it('should fail when startTime is in the past', () => {
            // refTime is 2026-10-01T08:00:00.000Z. Start time is 1 hour before refTime.
            const pastInput = createValidMeetingData({
                startTime: '2026-10-01T07:00:00.000Z',
                endTime: '2026-10-01T08:30:00.000Z'
            });
            const result = validateMeetingInput(pastInput, { referenceTime: refTime });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('Thời gian bắt đầu không thể diễn ra trong quá khứ')));
        });

        it('should fail when endTime is equal to startTime (0 duration)', () => {
            const sameTime = '2026-10-01T09:00:00.000Z';
            const equalInput = createValidMeetingData({
                startTime: sameTime,
                endTime: sameTime
            });
            const result = validateMeetingInput(equalInput, { referenceTime: refTime });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu')));
        });

        it('should fail when endTime is before startTime (negative duration)', () => {
            const reverseInput = createValidMeetingData({
                startTime: '2026-10-01T10:00:00.000Z',
                endTime: '2026-10-01T09:00:00.000Z'
            });
            const result = validateMeetingInput(reverseInput, { referenceTime: refTime });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu')));
        });

        it('should fail when meeting duration is shorter than minimum allowed (e.g. < 5 minutes)', () => {
            // 2 minutes duration
            const shortInput = createValidMeetingData({
                startTime: '2026-10-01T09:00:00.000Z',
                endTime: '2026-10-01T09:02:00.000Z'
            });
            const result = validateMeetingInput(shortInput, { referenceTime: refTime });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('Thời lượng cuộc họp tối thiểu phải từ 5 phút trở lên')));
        });

        it('should fail when meeting duration exceeds maximum allowed (e.g. > 24 hours)', () => {
            // 25 hours duration
            const longInput = createValidMeetingData({
                startTime: '2026-10-01T09:00:00.000Z',
                endTime: '2026-10-02T10:01:00.000Z'
            });
            const result = validateMeetingInput(longInput, { referenceTime: refTime });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('không được vượt quá 24 giờ')));
        });

        it('should pass with boundary minimum duration (exactly 5 minutes)', () => {
            const exactMinInput = createValidMeetingData({
                startTime: '2026-10-01T09:00:00.000Z',
                endTime: '2026-10-01T09:05:00.000Z'
            });
            const result = validateMeetingInput(exactMinInput, { referenceTime: refTime });
            assert.equal(result.isValid, true);
        });

        it('should pass with boundary maximum duration (exactly 24 hours)', () => {
            const exactMaxInput = createValidMeetingData({
                startTime: '2026-10-01T09:00:00.000Z',
                endTime: '2026-10-02T09:00:00.000Z'
            });
            const result = validateMeetingInput(exactMaxInput, { referenceTime: refTime });
            assert.equal(result.isValid, true);
        });
    });

    // -------------------------------------------------------------
    // 3. Kiểm tra OrganizerID & RoomID
    // -------------------------------------------------------------
    describe('Organizer & Room Validation', () => {
        it('should fail when organizerId is missing, zero, negative, or invalid string', () => {
            const cases = [null, undefined, 0, -1, 'abc', 1.5, true];
            for (const val of cases) {
                const input = createValidMeetingData({ organizerId: val });
                const result = validateMeetingInput(input, { referenceTime: refTime });
                assert.equal(result.isValid, false);
                assert.ok(result.errors.some(e => e.includes('organizerId')));
            }
        });

        it('should fail when roomId is missing, zero, negative, or invalid string', () => {
            const cases = [null, undefined, 0, -2, 'xyz', 2.3, false];
            for (const val of cases) {
                const input = createValidMeetingData({ roomId: val });
                const result = validateMeetingInput(input, { referenceTime: refTime });
                assert.equal(result.isValid, false);
                assert.ok(result.errors.some(e => e.includes('roomId')));
            }
        });

        it('should parse valid string numbers for organizerId and roomId', () => {
            const input = createValidMeetingData({
                organizerId: '10',
                roomId: '20'
            });
            const result = validateMeetingInput(input, { referenceTime: refTime });
            assert.equal(result.isValid, true);
            assert.equal(result.data.organizerId, 10);
            assert.equal(result.data.roomId, 20);
        });
    });

    // -------------------------------------------------------------
    // 4. Kiểm tra Participants & Equipments
    // -------------------------------------------------------------
    describe('ParticipantIds & EquipmentIds Validation', () => {
        it('should fail when participantIds is not an array', () => {
            const input = createValidMeetingData({ participantIds: '1,2,3' });
            const result = validateMeetingInput(input, { referenceTime: refTime });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('participantIds phải là một mảng')));
        });

        it('should fail when participantIds contains invalid values (negative or non-integers)', () => {
            const input = createValidMeetingData({ participantIds: [1, -5, 3] });
            const result = validateMeetingInput(input, { referenceTime: refTime });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('ID người tham gia')));
        });

        it('should deduplicate participantIds and equipmentIds', () => {
            const input = createValidMeetingData({
                participantIds: [2, 3, 2, 4, 3],
                equipmentIds: [1, 2, 1, 2]
            });
            const result = validateMeetingInput(input, { referenceTime: refTime });
            assert.equal(result.isValid, true);
            assert.deepEqual(result.data.participantIds, [2, 3, 4]);
            assert.deepEqual(result.data.equipmentIds, [1, 2]);
        });

        it('should allow empty or omitted participantIds and equipmentIds', () => {
            const input = createValidMeetingData({
                participantIds: [],
                equipmentIds: []
            });
            const result = validateMeetingInput(input, { referenceTime: refTime });
            assert.equal(result.isValid, true);
            assert.deepEqual(result.data.participantIds, []);
            assert.deepEqual(result.data.equipmentIds, []);
        });
    });
});

describe('Meeting Validator - Express Middleware (validateMeetingMiddleware)', () => {
    it('should call next() and attach validatedMeetingData to req when input is valid', () => {
        let nextCalled = false;
        const req = {
            body: {
                title: 'Họp Review Thiết Kế',
                startTime: '2099-01-01T09:00:00.000Z',
                endTime: '2099-01-01T10:00:00.000Z',
                organizerId: 1,
                roomId: 1
            }
        };
        const res = {};
        const next = () => { nextCalled = true; };

        validateMeetingMiddleware(req, res, next);

        assert.equal(nextCalled, true);
        assert.ok(req.validatedMeetingData);
        assert.equal(req.validatedMeetingData.title, 'Họp Review Thiết Kế');
    });

    it('should return 400 Bad Request with error message when input is invalid', () => {
        let statusSet = null;
        let responseJson = null;

        const req = {
            body: {
                title: '', // Invalid empty title
                startTime: '2099-01-01T09:00:00.000Z',
                endTime: '2099-01-01T10:00:00.000Z',
                organizerId: 1,
                roomId: 1
            }
        };
        const res = {
            status: (code) => {
                statusSet = code;
                return {
                    json: (data) => {
                        responseJson = data;
                    }
                };
            }
        };
        const next = () => {};

        validateMeetingMiddleware(req, res, next);

        assert.equal(statusSet, 400);
        assert.equal(responseJson.success, false);
        assert.ok(responseJson.message.includes('Tiêu đề cuộc họp (title) là bắt buộc'));
    });
});
