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

module.exports = { createMeeting };