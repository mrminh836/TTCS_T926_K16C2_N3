const Meeting = require('../models/meetingModel');
const { validateMeetingInput } = require('../validators/meetingValidator');

const createMeeting = async (req, res, next) => {
    try {
        // 1. Kiểm tra và xác thực dữ liệu đầu vào (nếu chưa được middleware validate)
        const validation = req.validatedMeetingData 
            ? { isValid: true, data: req.validatedMeetingData } 
            : validateMeetingInput(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0],
                errors: validation.errors
            });
        }

        const meetingData = validation.data;

        // 2. Thực hiện tạo cuộc họp với transaction an toàn
        const result = await Meeting.create(meetingData);

        return res.status(201).json({
            success: true,
            message: "Tạo cuộc họp và đặt phòng thành công.",
            data: result
        });

    } catch (error) {
        // Xử lý các lỗi nghiệp vụ đã định nghĩa mã status (400, 404, 409, ...)
        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        // Chuyển các lỗi không mong muốn cho middleware xử lý lỗi toàn cục
        next(error);
    }
};

/**
 * GET /api/meetings
 * Lấy danh sách cuộc họp với bộ lọc và phân trang
 * 
 * Query params:
 *   - date       : Lọc theo ngày cụ thể (YYYY-MM-DD)
 *   - startDate  : Lọc từ ngày (YYYY-MM-DD)
 *   - endDate    : Lọc đến ngày (YYYY-MM-DD)
 *   - status     : Lọc theo trạng thái (Confirmed | Cancelled | Completed)
 *   - page       : Trang hiện tại (mặc định: 1)
 *   - limit      : Số bản ghi mỗi trang (mặc định: 10, tối đa: 100)
 */
const getMeetings = async (req, res, next) => {
    try {
        const { date, startDate, endDate, status, page, limit } = req.query;

        // ── Validate định dạng ngày (YYYY-MM-DD) ──
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (date && !dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Tham số "date" phải có định dạng YYYY-MM-DD.'
            });
        }

        if (startDate && !dateRegex.test(startDate)) {
            return res.status(400).json({
                success: false,
                message: 'Tham số "startDate" phải có định dạng YYYY-MM-DD.'
            });
        }

        if (endDate && !dateRegex.test(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Tham số "endDate" phải có định dạng YYYY-MM-DD.'
            });
        }

        // ── Validate tính hợp lệ của ngày ──
        if (date && isNaN(new Date(date).getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Tham số "date" không phải là ngày hợp lệ.'
            });
        }

        if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
                return res.status(400).json({
                    success: false,
                    message: '"startDate" không được lớn hơn "endDate".'
                });
            }
        }

        // ── Validate trạng thái ──
        const validStatuses = ['Confirmed', 'Cancelled', 'Completed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Trạng thái không hợp lệ. Chấp nhận: ${validStatuses.join(', ')}.`
            });
        }

        // ── Validate & chuẩn hóa phân trang ──
        let parsedPage = parseInt(page, 10) || 1;
        let parsedLimit = parseInt(limit, 10) || 10;

        if (parsedPage < 1) parsedPage = 1;
        if (parsedLimit < 1) parsedLimit = 1;
        if (parsedLimit > 100) parsedLimit = 100;

        // ── Gọi Model để lấy dữ liệu ──
        const result = await Meeting.getAll({
            date,
            startDate,
            endDate,
            status,
            page: parsedPage,
            limit: parsedLimit
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách cuộc họp thành công.',
            data: result.meetings,
            pagination: result.pagination
        });

    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }
        next(error);
    }
};

module.exports = { createMeeting, getMeetings };

