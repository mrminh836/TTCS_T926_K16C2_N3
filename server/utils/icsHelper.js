/**
 * icsHelper.js
 * 
 * Tiện ích sinh tệp iCalendar (.ics) chuẩn RFC 5545
 * Tương thích đồng bộ: Google Calendar, Microsoft Outlook, Apple Calendar
 * 
 * @see https://datatracker.ietf.org/doc/html/rfc5545
 */

/**
 * Chuyển đổi đối tượng Date sang định dạng UTC iCalendar (YYYYMMDDTHHMMSSZ)
 * @param {Date|string} date - Ngày cần chuyển đổi
 * @returns {string} Chuỗi ngày theo chuẩn iCalendar UTC
 */
function formatDateToICS(date) {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape các ký tự đặc biệt trong chuỗi iCalendar theo RFC 5545 (Section 3.3.11)
 * @param {string} text - Chuỗi cần escape
 * @returns {string} Chuỗi đã được escape
 */
function escapeICSText(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')     // Backslash phải được escape trước
        .replace(/;/g, '\\;')       // Semicolon
        .replace(/,/g, '\\,')       // Comma
        .replace(/\r?\n/g, '\\n');  // Newline → literal \n
}

/**
 * Fold (gấp dòng) theo RFC 5545 Section 3.1:
 * Mỗi dòng nội dung không quá 75 octets. Dòng dài được gấp bằng CRLF + khoảng trắng.
 * @param {string} line - Dòng cần fold
 * @returns {string} Dòng đã được fold
 */
function foldLine(line) {
    const MAX_LINE_LENGTH = 75;
    if (line.length <= MAX_LINE_LENGTH) return line;

    let result = '';
    let currentLine = '';

    for (let i = 0; i < line.length; i++) {
        currentLine += line[i];
        // Dòng đầu tiên tối đa 75, các dòng tiếp theo tối đa 74 (vì có khoảng trắng đầu dòng)
        const limit = result === '' ? MAX_LINE_LENGTH : MAX_LINE_LENGTH - 1;
        if (currentLine.length >= limit) {
            result += (result === '' ? '' : ' ') + currentLine + '\r\n';
            currentLine = '';
        }
    }

    if (currentLine.length > 0) {
        result += (result === '' ? '' : ' ') + currentLine;
    }

    return result;
}

/**
 * Tạo UID duy nhất cho sự kiện iCalendar
 * Tuân thủ RFC 5545 Section 3.8.4.7: giá trị phải là globally unique
 * @param {number} meetingId - ID cuộc họp
 * @param {string} domain - Domain email của tổ chức
 * @returns {string} UID duy nhất
 */
function generateUID(meetingId, domain = 'meeting-management.enterprise.vn') {
    const timestamp = Date.now();
    return `meeting-${meetingId}-${timestamp}@${domain}`;
}

/**
 * Sinh nội dung tệp iCalendar (.ics) chuẩn RFC 5545 từ dữ liệu cuộc họp
 * 
 * @param {Object} meeting - Dữ liệu cuộc họp đầy đủ từ Meeting.getById()
 * @param {number} meeting.meetingId - ID cuộc họp
 * @param {string} meeting.title - Tiêu đề cuộc họp
 * @param {string} [meeting.description] - Mô tả cuộc họp
 * @param {Date|string} meeting.startTime - Thời gian bắt đầu
 * @param {Date|string} meeting.endTime - Thời gian kết thúc
 * @param {string} [meeting.organizerName] - Tên người tổ chức
 * @param {string} [meeting.organizerEmail] - Email người tổ chức
 * @param {string} [meeting.roomName] - Tên phòng họp
 * @param {Array} [meeting.participants] - Danh sách người tham gia
 * @param {Array} [meeting.equipments] - Danh sách thiết bị
 * @returns {string} Nội dung tệp .ics hoàn chỉnh
 */
function generateICSContent(meeting) {
    const {
        meetingId,
        title,
        description,
        startTime,
        endTime,
        organizerName,
        organizerEmail,
        roomName,
        participants = [],
        equipments = []
    } = meeting;

    const now = new Date();
    const uid = generateUID(meetingId);

    // ── Xây dựng phần mô tả mở rộng (bao gồm thiết bị) ──
    let fullDescription = description || '';

    if (equipments.length > 0) {
        const eqList = equipments
            .map(eq => `• ${eq.equipmentName || eq.EquipmentName}`)
            .join('\\n');
        fullDescription += (fullDescription ? '\\n\\n' : '') +
            `--- Thiết bị sử dụng ---\\n${eqList}`;
    }

    // ── Xây dựng nội dung VEVENT ──
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Meeting Management System//Enterprise VN//VI',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'X-WR-CALNAME:Lịch Họp Doanh Nghiệp',
        'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',

        // ── Khai báo múi giờ Việt Nam (VTIMEZONE) cho tương thích tối đa ──
        'BEGIN:VTIMEZONE',
        'TZID:Asia/Ho_Chi_Minh',
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:+0700',
        'TZOFFSETTO:+0700',
        'TZNAME:ICT',
        'END:STANDARD',
        'END:VTIMEZONE',

        // ── Sự kiện (VEVENT) ──
        'BEGIN:VEVENT',
        foldLine(`UID:${uid}`),
        foldLine(`DTSTAMP:${formatDateToICS(now)}`),
        foldLine(`DTSTART:${formatDateToICS(startTime)}`),
        foldLine(`DTEND:${formatDateToICS(endTime)}`),
        foldLine(`SUMMARY:${escapeICSText(title)}`),
    ];

    // Mô tả (nếu có)
    if (fullDescription) {
        lines.push(foldLine(`DESCRIPTION:${escapeICSText(fullDescription)}`));
    }

    // Địa điểm (phòng họp)
    if (roomName) {
        lines.push(foldLine(`LOCATION:${escapeICSText(roomName)}`));
    }

    // Người tổ chức (ORGANIZER) - Tuân thủ RFC 5545 Section 3.8.4.3
    if (organizerEmail) {
        const cnParam = organizerName ? `;CN=${escapeICSText(organizerName)}` : '';
        lines.push(foldLine(`ORGANIZER${cnParam}:mailto:${organizerEmail}`));
    }

    // Danh sách người tham gia (ATTENDEE) - Tuân thủ RFC 5545 Section 3.8.4.1
    if (participants.length > 0) {
        for (const p of participants) {
            const email = p.email || p.Email;
            const name = p.fullName || p.FullName;
            const status = p.responseStatus || p.ResponseStatus || 'Pending';

            // Ánh xạ trạng thái phản hồi sang PARTSTAT chuẩn iCalendar
            const partStatMap = {
                'Accepted':  'ACCEPTED',
                'Declined':  'DECLINED',
                'Pending':   'NEEDS-ACTION',
                'Tentative': 'TENTATIVE'
            };
            const partStat = partStatMap[status] || 'NEEDS-ACTION';

            if (email) {
                const attendeeLine = `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=${partStat};CN=${escapeICSText(name || email)}:mailto:${email}`;
                lines.push(foldLine(attendeeLine));
            }
        }
    }

    // Trạng thái sự kiện & thuộc tính bổ sung
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:OPAQUE');    // Đánh dấu thời gian "bận" trong lịch
    lines.push(`SEQUENCE:0`);
    lines.push(`CREATED:${formatDateToICS(now)}`);
    lines.push(`LAST-MODIFIED:${formatDateToICS(now)}`);

    // ── Alarm nhắc nhở trước 15 phút (tương thích Google Calendar & Outlook) ──
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT15M');
    lines.push('ACTION:DISPLAY');
    lines.push(foldLine(`DESCRIPTION:Nhắc nhở: ${escapeICSText(title)} sắp bắt đầu trong 15 phút`));
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
    lines.push('END:VCALENDAR');

    // RFC 5545 yêu cầu CRLF (\r\n) làm line ending
    return lines.join('\r\n');
}

/**
 * Tạo tên tệp .ics an toàn từ tiêu đề cuộc họp
 * @param {string} title - Tiêu đề cuộc họp
 * @param {number} meetingId - ID cuộc họp
 * @returns {string} Tên tệp an toàn
 */
function generateICSFilename(title, meetingId) {
    // Loại bỏ ký tự đặc biệt, chuyển khoảng trắng thành gạch dưới
    const safeTitle = (title || 'meeting')
        .normalize('NFD')                       // Tách dấu tiếng Việt
        .replace(/[\u0300-\u036f]/g, '')        // Xóa dấu
        .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Xử lý đ/Đ riêng
        .replace(/[^a-zA-Z0-9\s-]/g, '')        // Chỉ giữ alphanumeric
        .replace(/\s+/g, '_')                   // Khoảng trắng → underscore
        .substring(0, 50)                       // Giới hạn độ dài
        .toLowerCase();

    return `meeting_${meetingId}_${safeTitle}.ics`;
}

module.exports = {
    generateICSContent,
    generateICSFilename,
    formatDateToICS,
    escapeICSText,
    foldLine,
    generateUID
};
