/**
 * Unit Tests — meetingReminderToast.test.js
 * 
 * Kiểm thử logic nghiệp vụ của Component Toast nhắc nhở cuộc họp & Tiện ích đồng bộ iCalendar
 * Chạy test: node --test server/test/meetingReminderToast.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Hàm tính toán khoảng cách phút giữa giờ bắt đầu cuộc họp và thời điểm hiện tại
function calculateDiffMinutes(meetingDateStr, meetingStartTimeStr, referenceDate = new Date()) {
    const [year, month, day] = meetingDateStr.split('-').map(Number);
    const [hours, minutes] = meetingStartTimeStr.split(':').map(Number);
    const meetingStart = new Date(year, month - 1, day, hours, minutes, 0);

    const diffMs = meetingStart.getTime() - referenceDate.getTime();
    return Math.round(diffMs / 60000);
}

// Hàm kiểm tra xem cuộc họp có nằm trong khung giờ nhắc nhở không
function isMeetingInReminderWindow(diffMinutes) {
    // Sắp diễn ra trong 15 phút (0 <= diffMinutes <= 15) HOẶC vừa bắt đầu dưới 30 phút (-30 <= diffMinutes < 0)
    const isUpcoming = diffMinutes >= 0 && diffMinutes <= 15;
    const isJustStarted = diffMinutes < 0 && diffMinutes >= -30;
    return isUpcoming || isJustStarted;
}

// Chuyển đổi ngày giờ sang UTC YYYYMMDDTHHMMSSZ cho Google Calendar URL
function formatToUtcCalendarDate(dateStr, timeStr) {
    const [year, month, day] = (dateStr || '').split('-').map(Number);
    const [hours, minutes] = (timeStr || '09:00').split(':').map(Number);
    const d = new Date(Date.UTC(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0));
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

// Tạo URL Google Calendar
function buildGoogleCalendarUrl(meeting) {
    const title = meeting.title || 'Cuộc họp doanh nghiệp';
    const dateStr = meeting.date || '2026-10-20';
    const startTime = meeting.startTime || '09:00';
    const endTime = meeting.endTime || '10:00';
    const location = meeting.roomName || 'Phòng họp ICTU';
    const description = meeting.notes || meeting.description || '';

    const startUtc = formatToUtcCalendarDate(dateStr, startTime);
    const endUtc = formatToUtcCalendarDate(dateStr, endTime);
    const datesParam = `${startUtc}/${endUtc}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${datesParam}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
}

// Tạo URL Microsoft Outlook
function buildOutlookUrl(meeting) {
    const title = meeting.title || 'Cuộc họp doanh nghiệp';
    const dateStr = meeting.date || '2026-10-20';
    const startTime = meeting.startTime || '09:00';
    const endTime = meeting.endTime || '10:00';
    const location = meeting.roomName || 'Phòng họp ICTU';
    const description = meeting.notes || meeting.description || '';

    const startISO = `${dateStr}T${startTime}:00`;
    const endISO = `${dateStr}T${endTime}:00`;

    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(title)}&startdt=${encodeURIComponent(startISO)}&enddt=${encodeURIComponent(endISO)}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
}

describe('MeetingReminderToast — Logic Kiểm tra Khung giờ & Đồng bộ Lịch', () => {

    it('TC-REMIND-001: Phát hiện đúng cuộc họp sắp diễn ra trong vòng 15 phút', () => {
        const now = new Date(2026, 9, 20, 9, 45, 0); // 09:45
        const diff = calculateDiffMinutes('2026-10-20', '10:00', now); // Họp lúc 10:00 -> cách 15 phút
        
        assert.equal(diff, 15);
        assert.equal(isMeetingInReminderWindow(diff), true);
    });

    it('TC-REMIND-002: Bỏ qua cuộc họp còn quá xa (> 15 phút)', () => {
        const now = new Date(2026, 9, 20, 9, 0, 0); // 09:00
        const diff = calculateDiffMinutes('2026-10-20', '10:00', now); // Cách 60 phút
        
        assert.equal(diff, 60);
        assert.equal(isMeetingInReminderWindow(diff), false);
    });

    it('TC-REMIND-003: Phát hiện cuộc họp vừa mới bắt đầu dưới 30 phút (đang diễn ra)', () => {
        const now = new Date(2026, 9, 20, 10, 10, 0); // 10:10
        const diff = calculateDiffMinutes('2026-10-20', '10:00', now); // Bắt đầu 10 phút trước
        
        assert.equal(diff, -10);
        assert.equal(isMeetingInReminderWindow(diff), true);
    });

    it('TC-REMIND-004: Bỏ qua cuộc họp đã kết thúc hoặc bắt đầu quá lâu (> 30 phút trước)', () => {
        const now = new Date(2026, 9, 20, 11, 0, 0); // 11:00
        const diff = calculateDiffMinutes('2026-10-20', '10:00', now); // Bắt đầu 60 phút trước
        
        assert.equal(diff, -60);
        assert.equal(isMeetingInReminderWindow(diff), false);
    });

    it('TC-REMIND-005: Tạo đúng URL Google Calendar thêm sự kiện 1-click', () => {
        const meeting = {
            title: 'Họp Kế Hoạch Tuần',
            date: '2026-10-20',
            startTime: '09:00',
            endTime: '10:30',
            roomName: 'Phòng Tokyo (Tầng 4)',
            notes: 'Thảo luận báo cáo Sprint'
        };

        const url = buildGoogleCalendarUrl(meeting);
        assert.ok(url.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
        assert.ok(url.includes('text=H%E1%BB%8Dp%20K%E1%BA%BF%20Ho%E1%BA%A1ch%20Tu%E1%BA%A7n'));
        assert.ok(url.includes('location=Ph%C3%B2ng%20Tokyo%20(T%E1%BA%A7ng%204)'));
    });

    it('TC-REMIND-006: Tạo đúng URL Microsoft Outlook 365 thêm sự kiện 1-click', () => {
        const meeting = {
            title: 'Họp Review Kiến Trúc',
            date: '2026-10-20',
            startTime: '14:00',
            endTime: '15:30',
            roomName: 'Phòng VIP',
            notes: 'Đánh giá bảo mật'
        };

        const url = buildOutlookUrl(meeting);
        assert.ok(url.startsWith('https://outlook.live.com/calendar/0/deeplink/compose'));
        assert.ok(url.includes('startdt=2026-10-20T14%3A00%3A00'));
        assert.ok(url.includes('enddt=2026-10-20T15%3A30%3A00'));
        assert.ok(url.includes('subject=H%E1%BB%8Dp%20Review%20Ki%E1%BA%BFn%20Tr%C3%BAc'));
    });
});
