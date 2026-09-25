const Meeting = require('../models/meetingModel');

const createMeeting = async (req, res, next) => {
    try {
        const {
            title,
            description,
            startTime,
            endTime,
            organizerId,
            roomId,
            isRecurring,
            participantIds,
            equipmentIds
        } = req.body;

        // 1. Kiểm tra các trường bắt buộc
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Tiêu đề cuộc họp (title) là bắt buộc và không được để trống."
            });
        }

        if (!startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: "Thời gian bắt đầu (startTime) và kết thúc (endTime) là bắt buộc."
            });
        }

        if (!organizerId || !Number.isInteger(Number(organizerId)) || Number(organizerId) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Mã người tổ chức (organizerId) phải là số nguyên dương hợp lệ."
            });
        }

        if (!roomId || !Number.isInteger(Number(roomId)) || Number(roomId) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Mã phòng họp (roomId) phải là số nguyên dương hợp lệ."
            });
        }

        // 2. Kiểm tra tính hợp lệ của ngày giờ (Chống lỗi Invalid Date bypass)
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Định dạng ngày giờ không hợp lệ (hỗ trợ chuẩn ISO 8601 hoặc YYYY-MM-DD HH:mm:ss)."
            });
        }

        // 3. Chặn đặt lịch trong quá khứ
        if (start < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Thời gian bắt đầu không thể diễn ra trong quá khứ."
            });
        }

        // 4. Kiểm tra thứ tự thời gian
        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu."
            });
        }

        // 5. Kiểm tra danh sách người tham gia và thiết bị (nếu có)
        if (participantIds && !Array.isArray(participantIds)) {
            return res.status(400).json({
                success: false,
                message: "participantIds phải là một mảng danh sách ID người dùng."
            });
        }

        if (equipmentIds && !Array.isArray(equipmentIds)) {
            return res.status(400).json({
                success: false,
                message: "equipmentIds phải là một mảng danh sách ID thiết bị."
            });
        }

        // 6. Thực hiện tạo cuộc họp với transaction an toàn
        const result = await Meeting.create({
            title,
            description,
            startTime,
            endTime,
            organizerId: Number(organizerId),
            roomId: Number(roomId),
            isRecurring: Boolean(isRecurring),
            participantIds: participantIds || [],
            equipmentIds: equipmentIds || []
        });

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