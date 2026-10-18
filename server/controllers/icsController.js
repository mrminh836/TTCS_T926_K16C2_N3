/**
 * icsController.js
 * 
 * Controller xuất tệp iCalendar (.ics) chuẩn RFC 5545 cho cuộc họp
 * Endpoint: GET /api/meetings/:id/export-ics
 * 
 * Tương thích đồng bộ:
 *   ✅ Google Calendar (import trực tiếp / URL subscription)
 *   ✅ Microsoft Outlook (Desktop & Web)
 *   ✅ Apple Calendar (macOS & iOS)
 */

const Meeting = require('../models/meetingModel');
const { generateICSContent, generateICSFilename } = require('../utils/icsHelper');

/**
 * GET /api/meetings/:id/export-ics
 * 
 * Sinh và trả về tệp .ics cho cuộc họp với ID tương ứng.
 * Response headers được thiết lập để trình duyệt tự động tải xuống
 * và các ứng dụng lịch có thể nhận diện định dạng iCalendar.
 * 
 * @param {Object} req - Express request (req.params.id = MeetingID)
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
const exportMeetingICS = async (req, res, next) => {
    try {
        // ── 1. Validate ID đầu vào ──
        const meetingId = parseInt(req.params.id, 10);
        if (isNaN(meetingId) || meetingId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID cuộc họp không hợp lệ (phải là số nguyên dương)."
            });
        }

        // ── 2. Truy vấn dữ liệu cuộc họp đầy đủ (kèm phòng, người tham gia, thiết bị) ──
        const meeting = await Meeting.getById(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: `Cuộc họp với ID ${meetingId} không tồn tại.`
            });
        }

        // ── 3. Sinh nội dung iCalendar ──
        const icsContent = generateICSContent(meeting);
        const filename = generateICSFilename(meeting.title, meetingId);

        // ── 4. Thiết lập Response Headers chuẩn cho file .ics ──
        // Content-Type: text/calendar theo RFC 5545 Section 8.1
        // Content-Disposition: attachment để trình duyệt tải xuống
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8; method=REQUEST');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(icsContent, 'utf-8'));

        // Headers bổ sung hỗ trợ CORS và caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.status(200).send(icsContent);

    } catch (error) {
        // Chuyển lỗi cho middleware xử lý lỗi toàn cục
        next(error);
    }
};

module.exports = { exportMeetingICS };
