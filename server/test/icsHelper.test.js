/**
 * Unit Tests — icsHelper.js (Tiện ích sinh tệp iCalendar)
 * 
 * Chạy: node --test server/test/icsHelper.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
    generateICSContent,
    generateICSFilename,
    formatDateToICS,
    escapeICSText,
    foldLine,
    generateUID
} = require('../utils/icsHelper');


// ═══════════════════════════════════════════════════════
// 1. formatDateToICS — Chuyển đổi ngày sang UTC iCalendar
// ═══════════════════════════════════════════════════════

describe('formatDateToICS()', () => {

    it('should format a Date object to ICS UTC format (YYYYMMDDTHHMMSSZ)', () => {
        // 2026-10-12 01:30:00 UTC
        const date = new Date(Date.UTC(2026, 9, 12, 1, 30, 0));
        assert.equal(formatDateToICS(date), '20261012T013000Z');
    });

    it('should format a date string correctly', () => {
        const result = formatDateToICS('2026-10-12T08:30:00Z');
        assert.equal(result, '20261012T083000Z');
    });

    it('should handle midnight correctly', () => {
        const date = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
        assert.equal(formatDateToICS(date), '20260101T000000Z');
    });

    it('should handle end of day correctly', () => {
        const date = new Date(Date.UTC(2026, 11, 31, 23, 59, 59));
        assert.equal(formatDateToICS(date), '20261231T235959Z');
    });
});


// ═══════════════════════════════════════════════════════
// 2. escapeICSText — Escape ký tự đặc biệt RFC 5545
// ═══════════════════════════════════════════════════════

describe('escapeICSText()', () => {

    it('should escape backslashes', () => {
        assert.equal(escapeICSText('test\\value'), 'test\\\\value');
    });

    it('should escape semicolons', () => {
        assert.equal(escapeICSText('key;value'), 'key\\;value');
    });

    it('should escape commas', () => {
        assert.equal(escapeICSText('a,b,c'), 'a\\,b\\,c');
    });

    it('should escape newlines to literal \\n', () => {
        assert.equal(escapeICSText('line1\nline2'), 'line1\\nline2');
    });

    it('should escape CRLF newlines to literal \\n', () => {
        assert.equal(escapeICSText('line1\r\nline2'), 'line1\\nline2');
    });

    it('should handle empty string', () => {
        assert.equal(escapeICSText(''), '');
    });

    it('should handle null/undefined gracefully', () => {
        assert.equal(escapeICSText(null), '');
        assert.equal(escapeICSText(undefined), '');
    });

    it('should handle Vietnamese text without issues', () => {
        const text = 'Họp Giao Ban Đầu Tuần';
        const result = escapeICSText(text);
        assert.equal(result, 'Họp Giao Ban Đầu Tuần');
    });
});


// ═══════════════════════════════════════════════════════
// 3. foldLine — Gấp dòng theo RFC 5545 (max 75 octets)
// ═══════════════════════════════════════════════════════

describe('foldLine()', () => {

    it('should not fold short lines (≤ 75 chars)', () => {
        const short = 'SUMMARY:Short meeting';
        assert.equal(foldLine(short), short);
    });

    it('should fold lines longer than 75 characters', () => {
        const longLine = 'DESCRIPTION:' + 'A'.repeat(100);
        const result = foldLine(longLine);
        assert.ok(result.includes('\r\n'), 'Folded line should contain CRLF');
    });

    it('should produce continuation lines starting with a space', () => {
        const longLine = 'SUMMARY:' + 'B'.repeat(100);
        const result = foldLine(longLine);
        const lines = result.split('\r\n');
        // Các dòng tiếp theo (trừ dòng đầu) phải bắt đầu bằng khoảng trắng
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].length > 0) {
                assert.ok(lines[i].startsWith(' '), `Continuation line ${i} should start with space`);
            }
        }
    });
});


// ═══════════════════════════════════════════════════════
// 4. generateUID — Tạo UID duy nhất
// ═══════════════════════════════════════════════════════

describe('generateUID()', () => {

    it('should contain meeting ID in UID', () => {
        const uid = generateUID(42);
        assert.ok(uid.includes('42'), 'UID should contain meeting ID');
    });

    it('should contain domain in UID', () => {
        const uid = generateUID(1, 'example.com');
        assert.ok(uid.endsWith('@example.com'), 'UID should end with domain');
    });

    it('should generate stable/deterministic UIDs for same meeting ID', () => {
        const uid1 = generateUID(1);
        const uid2 = generateUID(1);
        assert.equal(uid1, uid2, 'UIDs for same meeting should be identical (stable)');
    });

    it('should generate different UIDs for different meeting IDs', () => {
        const uid1 = generateUID(1);
        const uid2 = generateUID(2);
        assert.notEqual(uid1, uid2, 'UIDs for different meetings should differ');
    });
});


// ═══════════════════════════════════════════════════════
// 5. generateICSFilename — Tạo tên file an toàn
// ═══════════════════════════════════════════════════════

describe('generateICSFilename()', () => {

    it('should create a safe filename from Vietnamese title', () => {
        const filename = generateICSFilename('Họp Giao Ban Đầu Tuần', 1);
        assert.ok(filename.startsWith('meeting_1_'), 'Should start with meeting_{id}_');
        assert.ok(filename.endsWith('.ics'), 'Should end with .ics');
        // Không chứa ký tự đặc biệt
        assert.ok(!filename.includes(' '), 'Should not contain spaces');
    });

    it('should remove special characters', () => {
        const filename = generateICSFilename('Sprint 3 Review & Demo', 2);
        assert.ok(!filename.includes('&'), 'Should not contain &');
        assert.ok(filename.includes('meeting_2_'));
    });

    it('should handle empty/null title', () => {
        const filename = generateICSFilename(null, 5);
        assert.equal(filename, 'meeting_5_meeting.ics');
    });

    it('should truncate long titles to 50 characters', () => {
        const longTitle = 'A'.repeat(100);
        const filename = generateICSFilename(longTitle, 3);
        // meeting_3_ = 10 chars + 50 chars max + .ics = 4 chars
        assert.ok(filename.length <= 65, 'Filename should be truncated');
    });
});


// ═══════════════════════════════════════════════════════
// 6. generateICSContent — Sinh nội dung .ics hoàn chỉnh
// ═══════════════════════════════════════════════════════

describe('generateICSContent()', () => {

    const baseMeeting = {
        meetingId: 1,
        title: 'Họp Giao Ban Đầu Tuần Ban Điều Hành',
        description: 'Đánh giá KPI toàn diện tuần trước',
        startTime: '2026-10-12T08:30:00Z',
        endTime: '2026-10-12T10:00:00Z',
        organizerName: 'Nguyễn Văn Quản Trị',
        organizerEmail: 'admin@enterprise.vn',
        roomName: 'Boardroom Thăng Long',
        participants: [
            { fullName: 'Trần Thị Thư Ký', email: 'secretary@enterprise.vn', responseStatus: 'Accepted' },
            { fullName: 'Lê Văn Trưởng Phòng', email: 'manager@enterprise.vn', responseStatus: 'Pending' }
        ],
        equipments: [
            { equipmentName: 'Máy chiếu Laser Sony 4K' },
            { equipmentName: 'Bộ Micro cổ ngỗng Shure' }
        ]
    };

    it('should start with BEGIN:VCALENDAR and end with END:VCALENDAR', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.startsWith('BEGIN:VCALENDAR'), 'Should start with BEGIN:VCALENDAR');
        assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'), 'Should end with END:VCALENDAR');
    });

    it('should contain VERSION:2.0', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('VERSION:2.0'), 'Should contain VERSION:2.0');
    });

    it('should contain PRODID', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('PRODID:'), 'Should contain PRODID');
    });

    it('should contain METHOD:REQUEST', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('METHOD:REQUEST'), 'Should contain METHOD:REQUEST for meeting invitation');
    });

    it('should contain VTIMEZONE for Asia/Ho_Chi_Minh', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('TZID:Asia/Ho_Chi_Minh'), 'Should define Vietnam timezone');
        assert.ok(ics.includes('TZOFFSETTO:+0700'), 'Should have +07:00 offset');
    });

    it('should contain BEGIN:VEVENT and END:VEVENT', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('BEGIN:VEVENT'), 'Should contain VEVENT');
        assert.ok(ics.includes('END:VEVENT'), 'Should contain END:VEVENT');
    });

    it('should contain UID', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('UID:'), 'Should contain UID');
    });

    it('should contain DTSTART and DTEND in UTC format', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('DTSTART:20261012T083000Z'), 'Should contain correct DTSTART');
        assert.ok(ics.includes('DTEND:20261012T100000Z'), 'Should contain correct DTEND');
    });

    it('should contain SUMMARY with meeting title', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('SUMMARY:'), 'Should contain SUMMARY');
    });

    it('should contain DESCRIPTION when provided', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('DESCRIPTION:'), 'Should contain DESCRIPTION');
    });

    it('should contain LOCATION with room name', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('LOCATION:Boardroom'), 'Should contain LOCATION');
    });

    it('should contain ORGANIZER with quoted CN and email', () => {
        const ics = generateICSContent(baseMeeting);
        const unfolded = ics.replace(/\r\n /g, '');
        assert.ok(unfolded.includes('ORGANIZER'), 'Should contain ORGANIZER');
        assert.ok(unfolded.includes('mailto:admin@enterprise.vn'), 'Should contain organizer email');
        // CN should be double-quoted for RFC 5545 compliance
        assert.ok(unfolded.includes('CN="'), 'ORGANIZER CN should be double-quoted');
    });

    it('should contain ATTENDEE entries for each participant', () => {
        const ics = generateICSContent(baseMeeting);
        // Unfold RFC 5545 folded lines (CRLF + space → join) trước khi kiểm tra
        const unfolded = ics.replace(/\r\n /g, '');
        assert.ok(unfolded.includes('mailto:secretary@enterprise.vn'), 'Should contain first attendee');
        assert.ok(unfolded.includes('mailto:manager@enterprise.vn'), 'Should contain second attendee');
    });

    it('should map response statuses to correct PARTSTAT values', () => {
        const ics = generateICSContent(baseMeeting);
        const unfolded = ics.replace(/\r\n /g, '');
        assert.ok(unfolded.includes('PARTSTAT=ACCEPTED'), 'Should map Accepted to ACCEPTED');
        assert.ok(unfolded.includes('PARTSTAT=NEEDS-ACTION'), 'Should map Pending to NEEDS-ACTION');
        // CN should be double-quoted
        assert.ok(unfolded.includes('CN="'), 'ATTENDEE CN should be double-quoted');
    });

    it('should contain VALARM reminder (15 minutes before)', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('BEGIN:VALARM'), 'Should contain VALARM');
        assert.ok(ics.includes('TRIGGER:-PT15M'), 'Should trigger 15 minutes before');
        assert.ok(ics.includes('ACTION:DISPLAY'), 'Should have DISPLAY action');
    });

    it('should contain equipment info in description', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('Thiết bị sử dụng'), 'Should include equipment section in description');
    });

    it('should use CRLF line endings (RFC 5545 compliance)', () => {
        const ics = generateICSContent(baseMeeting);
        // Kiểm tra có \r\n (CRLF)
        assert.ok(ics.includes('\r\n'), 'Should use CRLF line endings');
    });

    it('should contain STATUS:CONFIRMED', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('STATUS:CONFIRMED'), 'Should mark event as CONFIRMED');
    });

    it('should contain TRANSP:OPAQUE (busy time)', () => {
        const ics = generateICSContent(baseMeeting);
        assert.ok(ics.includes('TRANSP:OPAQUE'), 'Should mark time as busy');
    });

    it('should work with minimal data (no participants, no equipments, no description)', () => {
        const minimal = {
            meetingId: 99,
            title: 'Quick Standup',
            startTime: '2026-10-15T03:00:00Z',
            endTime: '2026-10-15T03:15:00Z'
        };
        const ics = generateICSContent(minimal);
        assert.ok(ics.includes('BEGIN:VCALENDAR'), 'Should generate valid ICS');
        assert.ok(ics.includes('SUMMARY:Quick Standup'), 'Should contain title');
        assert.ok(!ics.includes('ATTENDEE'), 'Should not have ATTENDEE without participants');
        assert.ok(!ics.includes('LOCATION:'), 'Should not have LOCATION without room');
    });
});
