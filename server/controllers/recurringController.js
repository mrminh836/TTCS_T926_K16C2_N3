const RecurringMeeting = require('../models/recurringModel');

/**
 * POST /api/meetings/recurring
 * 
 * Tạo chuỗi lịch họp lặp (tuần/tháng/custom interval).
 * Chiến lược ALL-OR-NOTHING: validate & kiểm tra overlap toàn bộ chuỗi,
 * nếu BẤT KỲ buổi nào xung đột → reject toàn bộ, trả về chi tiết.
 * 
 * Request Body:
 *   - title             : string (bắt buộc) - Tiêu đề chung cho chuỗi
 *   - description        : string (tuỳ chọn) - Mô tả chuỗi họp
 *   - organizerId        : number (bắt buộc) - ID người tổ chức
 *   - roomId             : number (bắt buộc) - ID phòng họp
 *   - recurrenceType     : 'weekly' | 'monthly' | 'custom' (bắt buộc)
 *   - intervalValue      : number (bắt buộc) - Khoảng cách lặp (1 = mỗi tuần/tháng, 2 = mỗi 2 tuần/tháng...)
 *   - totalOccurrences   : number (bắt buộc, 2-52) - Tổng số buổi
 *   - dayOfWeek          : number (0-6, bắt buộc cho weekly/custom) - 0=CN, 1=T2...6=T7
 *   - dayOfMonth         : number (1-31, bắt buộc cho monthly)
 *   - meetingStartTime   : string HH:mm (bắt buộc) - Giờ bắt đầu mỗi buổi
 *   - meetingEndTime     : string HH:mm (bắt buộc) - Giờ kết thúc mỗi buổi
 *   - seriesStartDate    : string YYYY-MM-DD (bắt buộc) - Ngày bắt đầu chuỗi
 *   - participantIds     : number[] (tuỳ chọn)
 *   - equipmentIds       : number[] (tuỳ chọn)
 * 
 * Response 201: Tạo thành công toàn bộ chuỗi
 * Response 400: Dữ liệu đầu vào không hợp lệ
 * Response 404: Organizer hoặc Room không tồn tại
 * Response 409: Xung đột lịch (kèm chi tiết các buổi bị conflict)
 */
const createRecurringMeetings = async (req, res, next) => {
    try {
        const recurringData = req.validatedRecurringData;

        if (!recurringData) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu recurring chưa được validate. Vui lòng kiểm tra middleware.'
            });
        }

        // Thực hiện tạo chuỗi recurring trong transaction
        const result = await RecurringMeeting.createRecurringSeries(recurringData);

        return res.status(201).json({
            success: true,
            message: `Tạo thành công chuỗi ${result.totalOccurrences} buổi họp lặp "${recurringData.title}" ` +
                     `tại phòng "${result.roomName}".`,
            data: {
                pattern: {
                    patternId: result.patternId,
                    recurrenceType: result.recurrenceType,
                    intervalValue: result.intervalValue,
                    totalOccurrences: result.totalOccurrences,
                    seriesStartDate: result.seriesStartDate,
                    seriesEndDate: result.seriesEndDate
                },
                room: {
                    roomId: result.roomId,
                    roomName: result.roomName
                },
                organizer: {
                    organizerId: result.organizerId,
                    organizerName: result.organizerName
                },
                meetings: result.meetings,
                summary: {
                    totalMeetingsCreated: result.meetings.length,
                    participantCount: result.participantCount,
                    equipmentCount: result.equipmentCount
                }
            }
        });

    } catch (error) {
        // Xử lý lỗi 409 Conflict - trả kèm chi tiết xung đột
        if (error.status === 409 && error.conflicts) {
            return res.status(409).json({
                success: false,
                message: error.message,
                conflicts: error.conflicts
            });
        }

        // Xử lý các lỗi nghiệp vụ (400, 404, ...)
        if (error.status) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        // Lỗi không mong muốn → chuyển cho Global Error Handler
        next(error);
    }
};

module.exports = { createRecurringMeetings };
