/**
 * Unit Tests cho recurringValidator.js
 * Sử dụng Node.js built-in test runner (node --test)
 * Chạy: node --test test/recurringValidator.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { validateRecurringInput, generateOccurrences, RECURRING_CONFIG } = require('../validators/recurringValidator');

// Helper: tạo dữ liệu recurring hợp lệ mặc định
function validInput(overrides = {}) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dayOfWeek = futureDate.getDay();
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
    futureDate.setDate(futureDate.getDate() + daysUntilMonday);
    const seriesStartDate = futureDate.toISOString().split('T')[0];

    return {
        title: 'Họp Sprint Review hàng tuần',
        description: 'Review tiến độ sprint mỗi tuần',
        organizerId: 1,
        roomId: 1,
        recurrenceType: 'weekly',
        intervalValue: 1,
        totalOccurrences: 4,
        dayOfWeek: 1,
        meetingStartTime: '09:00',
        meetingEndTime: '10:30',
        seriesStartDate,
        participantIds: [2, 3],
        equipmentIds: [1],
        ...overrides
    };
}

// ═══════════════════════════════════════════════════════════
// NHÓM 1: Happy path
// ═══════════════════════════════════════════════════════════
describe('validateRecurringInput - Happy path', () => {

    it('TC-REC-001: Weekly hợp lệ → isValid = true, sinh đúng 4 buổi', () => {
        const result = validateRecurringInput(validInput());
        assert.equal(result.isValid, true);
        assert.deepEqual(result.errors, []);
        assert.equal(result.data.occurrences.length, 4);
        assert.equal(result.data.recurrenceType, 'weekly');
    });

    it('TC-REC-002: Monthly hợp lệ → isValid = true', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const seriesStartDate = futureDate.toISOString().split('T')[0];

        const result = validateRecurringInput(validInput({
            recurrenceType: 'monthly',
            dayOfWeek: undefined,
            dayOfMonth: 15,
            totalOccurrences: 6,
            seriesStartDate
        }));
        assert.equal(result.isValid, true);
        assert.equal(result.data.occurrences.length, 6);
    });

    it('TC-REC-003: Custom (mỗi 2 tuần) hợp lệ → isValid = true', () => {
        const result = validateRecurringInput(validInput({
            recurrenceType: 'custom',
            intervalValue: 2,
            totalOccurrences: 10
        }));
        assert.equal(result.isValid, true);
        assert.equal(result.data.occurrences.length, 10);
    });
});

// ═══════════════════════════════════════════════════════════
// NHÓM 2: Validation trường cơ bản
// ═══════════════════════════════════════════════════════════
describe('validateRecurringInput - Basic fields', () => {

    it('TC-REC-010: Thiếu title → lỗi', () => {
        const result = validateRecurringInput(validInput({ title: '' }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('Tiêu đề')));
    });

    it('TC-REC-011: Title > 200 ký tự → lỗi', () => {
        const result = validateRecurringInput(validInput({ title: 'A'.repeat(201) }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('200')));
    });

    it('TC-REC-012: Thiếu organizerId → lỗi', () => {
        const result = validateRecurringInput(validInput({ organizerId: null }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('organizerId')));
    });

    it('TC-REC-013: roomId không phải số → lỗi', () => {
        const result = validateRecurringInput(validInput({ roomId: 'abc' }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('roomId')));
    });
});

// ═══════════════════════════════════════════════════════════
// NHÓM 3: Recurring fields
// ═══════════════════════════════════════════════════════════
describe('validateRecurringInput - Recurring fields', () => {

    it('TC-REC-020: recurrenceType không hợp lệ → lỗi', () => {
        const result = validateRecurringInput(validInput({ recurrenceType: 'yearly' }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('recurrenceType')));
    });

    it('TC-REC-021: intervalValue = 0 → lỗi', () => {
        const result = validateRecurringInput(validInput({ intervalValue: 0 }));
        assert.equal(result.isValid, false);
    });

    it('TC-REC-022: intervalValue > 12 → lỗi', () => {
        const result = validateRecurringInput(validInput({ intervalValue: 13 }));
        assert.equal(result.isValid, false);
    });

    it('TC-REC-023: totalOccurrences < 2 → lỗi', () => {
        const result = validateRecurringInput(validInput({ totalOccurrences: 1 }));
        assert.equal(result.isValid, false);
    });

    it('TC-REC-024: totalOccurrences > 52 → lỗi', () => {
        const result = validateRecurringInput(validInput({ totalOccurrences: 53 }));
        assert.equal(result.isValid, false);
    });

    it('TC-REC-025: weekly thiếu dayOfWeek → lỗi', () => {
        const result = validateRecurringInput(validInput({ dayOfWeek: undefined }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('dayOfWeek')));
    });

    it('TC-REC-026: monthly thiếu dayOfMonth → lỗi', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const result = validateRecurringInput(validInput({
            recurrenceType: 'monthly',
            dayOfWeek: undefined,
            dayOfMonth: undefined,
            seriesStartDate: futureDate.toISOString().split('T')[0]
        }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('dayOfMonth')));
    });
});

// ═══════════════════════════════════════════════════════════
// NHÓM 4: Thời gian
// ═══════════════════════════════════════════════════════════
describe('validateRecurringInput - Time validation', () => {

    it('TC-REC-030: meetingStartTime sai format → lỗi', () => {
        const result = validateRecurringInput(validInput({ meetingStartTime: '25:00' }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('HH:mm')));
    });

    it('TC-REC-031: endTime trước startTime → lỗi', () => {
        const result = validateRecurringInput(validInput({
            meetingStartTime: '14:00',
            meetingEndTime: '13:00'
        }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('sau')));
    });

    it('TC-REC-032: Thời lượng < 5 phút → lỗi', () => {
        const result = validateRecurringInput(validInput({
            meetingStartTime: '09:00',
            meetingEndTime: '09:03'
        }));
        assert.equal(result.isValid, false);
    });

    it('TC-REC-040: seriesStartDate sai format → lỗi', () => {
        const result = validateRecurringInput(validInput({ seriesStartDate: '2026/01/01' }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('YYYY-MM-DD')));
    });

    it('TC-REC-041: seriesStartDate trong quá khứ → lỗi', () => {
        const result = validateRecurringInput(validInput({ seriesStartDate: '2020-01-01' }));
        assert.equal(result.isValid, false);
        assert.ok(result.errors.some(e => e.includes('quá khứ')));
    });
});

// ═══════════════════════════════════════════════════════════
// NHÓM 5: Edge cases
// ═══════════════════════════════════════════════════════════
describe('validateRecurringInput - Edge cases', () => {

    it('TC-REC-050: Input null → lỗi', () => {
        const result = validateRecurringInput(null);
        assert.equal(result.isValid, false);
    });

    it('TC-REC-051: Input là mảng → lỗi', () => {
        const result = validateRecurringInput([1, 2, 3]);
        assert.equal(result.isValid, false);
    });

    it('TC-REC-052: participantIds không phải mảng → lỗi', () => {
        const result = validateRecurringInput(validInput({ participantIds: 'abc' }));
        assert.equal(result.isValid, false);
    });
});

// ═══════════════════════════════════════════════════════════
// generateOccurrences
// ═══════════════════════════════════════════════════════════
describe('generateOccurrences', () => {

    it('TC-GEN-001: Weekly interval=1, 4 buổi → cách nhau 7 ngày', () => {
        const start = new Date('2027-01-05');
        const occs = generateOccurrences({
            recurrenceType: 'weekly',
            intervalValue: 1,
            startDate: start,
            meetingStartTime: '09:00',
            meetingEndTime: '10:00',
            totalOccurrences: 4,
            dayOfWeek: 1,
            dayOfMonth: null
        });
        assert.equal(occs.length, 4);
        for (let i = 1; i < occs.length; i++) {
            const diffDays = (occs[i].startTime - occs[i - 1].startTime) / (1000 * 60 * 60 * 24);
            assert.equal(diffDays, 7);
        }
    });

    it('TC-GEN-002: Weekly interval=2 → cách nhau 14 ngày', () => {
        const start = new Date('2027-01-05');
        const occs = generateOccurrences({
            recurrenceType: 'weekly',
            intervalValue: 2,
            startDate: start,
            meetingStartTime: '14:00',
            meetingEndTime: '15:30',
            totalOccurrences: 3,
            dayOfWeek: 1,
            dayOfMonth: null
        });
        assert.equal(occs.length, 3);
        for (let i = 1; i < occs.length; i++) {
            const diffDays = (occs[i].startTime - occs[i - 1].startTime) / (1000 * 60 * 60 * 24);
            assert.equal(diffDays, 14);
        }
    });

    it('TC-GEN-003: Monthly interval=1, 3 buổi → 3 tháng liên tiếp', () => {
        const start = new Date('2027-01-15');
        const occs = generateOccurrences({
            recurrenceType: 'monthly',
            intervalValue: 1,
            startDate: start,
            meetingStartTime: '10:00',
            meetingEndTime: '11:00',
            totalOccurrences: 3,
            dayOfWeek: null,
            dayOfMonth: 15
        });
        assert.equal(occs.length, 3);
        assert.equal(occs[0].startTime.getMonth(), 0); // Jan
        assert.equal(occs[1].startTime.getMonth(), 1); // Feb
        assert.equal(occs[2].startTime.getMonth(), 2); // Mar
    });

    it('TC-GEN-004: Monthly ngày 31, tháng 2 → lùi về ngày 28', () => {
        const start = new Date('2027-01-31');
        const occs = generateOccurrences({
            recurrenceType: 'monthly',
            intervalValue: 1,
            startDate: start,
            meetingStartTime: '09:00',
            meetingEndTime: '10:00',
            totalOccurrences: 2,
            dayOfWeek: null,
            dayOfMonth: 31
        });
        assert.equal(occs.length, 2);
        assert.ok(occs[1].startTime.getDate() <= 28);
    });

    it('TC-GEN-005: occurrenceIndex 1-based', () => {
        const start = new Date('2027-03-01');
        const occs = generateOccurrences({
            recurrenceType: 'weekly',
            intervalValue: 1,
            startDate: start,
            meetingStartTime: '08:00',
            meetingEndTime: '09:00',
            totalOccurrences: 5,
            dayOfWeek: 1,
            dayOfMonth: null
        });
        assert.deepEqual(occs.map(o => o.occurrenceIndex), [1, 2, 3, 4, 5]);
    });
});
