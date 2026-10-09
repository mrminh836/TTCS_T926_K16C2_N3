const Participant = require('../models/participantModel');
const { validateResponseStatus, validateParticipantIds } = require('../validators/participantValidator');

/**
 * Controller xử lý các nghiệp vụ liên quan đến Người tham gia (Meeting Participants)
 * và Trạng thái phản hồi (ResponseStatus)
 */

/**
 * GET /api/meetings/:id/participants
 * Lấy danh sách người tham gia và trạng thái phản hồi của một cuộc họp
 */
const getParticipants = async (req, res, next) => {
    try {
        const meetingId = Number(req.params.id);
        if (!Number.isInteger(meetingId) || meetingId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID cuộc họp không hợp lệ (phải là số nguyên dương).'
            });
        }

        const data = await Participant.getByMeetingId(meetingId);

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách người tham gia và trạng thái phản hồi thành công.',
            data
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

/**
 * PATCH /api/meetings/:id/participants/:userId/status
 * Cập nhật trạng thái phản hồi của người tham gia (Accepted / Declined / Tentative / Pending)
 */
const updateResponseStatus = async (req, res, next) => {
    try {
        const meetingId = Number(req.params.id);
        const userId = Number(req.params.userId);

        if (!Number.isInteger(meetingId) || meetingId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID cuộc họp không hợp lệ (phải là số nguyên dương).'
            });
        }

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ (phải là số nguyên dương).'
            });
        }

        const { responseStatus } = req.body;
        const validation = validateResponseStatus(responseStatus);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const data = await Participant.updateResponseStatus(meetingId, userId, validation.sanitizedStatus);

        return res.status(200).json({
            success: true,
            message: `Đã cập nhật trạng thái phản hồi thành "${validation.sanitizedStatus}".`,
            data
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

/**
 * POST /api/meetings/:id/participants
 * Mời thêm danh sách người tham gia vào cuộc họp
 */
const addParticipants = async (req, res, next) => {
    try {
        const meetingId = Number(req.params.id);
        if (!Number.isInteger(meetingId) || meetingId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID cuộc họp không hợp lệ (phải là số nguyên dương).'
            });
        }

        const { participantIds } = req.body;
        const validation = validateParticipantIds(participantIds);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const data = await Participant.addParticipants(meetingId, validation.cleanIds);

        return res.status(201).json({
            success: true,
            message: `Đã thêm thành công ${data.addedCount} người tham gia vào cuộc họp #${meetingId}.`,
            data
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

/**
 * DELETE /api/meetings/:id/participants/:userId
 * Xóa một người tham gia khỏi cuộc họp
 */
const removeParticipant = async (req, res, next) => {
    try {
        const meetingId = Number(req.params.id);
        const userId = Number(req.params.userId);

        if (!Number.isInteger(meetingId) || meetingId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID cuộc họp không hợp lệ.'
            });
        }

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID người dùng không hợp lệ.'
            });
        }

        await Participant.removeParticipant(meetingId, userId);

        return res.status(200).json({
            success: true,
            message: `Đã xóa người dùng ID ${userId} khỏi cuộc họp #${meetingId} thành công.`
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

module.exports = {
    getParticipants,
    updateResponseStatus,
    addParticipants,
    removeParticipant
};
