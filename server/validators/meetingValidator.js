/**
 * Module kiểm tra và xác thực dữ liệu đầu vào cuộc họp (Meeting Input Validation)
 * Hỗ trợ kiểm tra chi tiết tính hợp lệ của thời gian họp, phòng, người tổ chức và các thiết bị liên quan.
 */

// Cấu hình giới hạn nghiệp vụ (Business Rules Config)
const VALIDATION_CONFIG = {
    TITLE_MIN_LENGTH: 1,
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 2000,
    MIN_DURATION_MINUTES: 5,        // Cuộc họp tối thiểu 5 phút
    MAX_DURATION_HOURS: 24,          // Cuộc họp tối đa 24 giờ cho 1 lần đặt
    TIME_PAST_TOLERANCE_MS: 60 * 1000 // Dung sai 1 phút chống lệch đồng hồ mạng
};

/**
 * Kiểm tra xem một giá trị có phải là số nguyên dương hợp lệ (> 0) hay không
 * @param {any} value
 * @returns {boolean}
 */
function isPositiveInteger(value) {
    if (value === null || value === undefined || typeof value === 'boolean') {
        return false;
    }
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
}

/**
 * Kiểm tra xem một giá trị có phải là chuỗi ngày giờ hợp lệ hay không
 * @param {any} dateStr
 * @returns {{ isValid: boolean, date: Date | null }}
 */
function parseValidDate(dateStr) {
    if (!dateStr || (typeof dateStr !== 'string' && !(dateStr instanceof Date))) {
        return { isValid: false, date: null };
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return { isValid: false, date: null };
    }
    return { isValid: true, date };
}

/**
 * Hàm kiểm tra toàn diện dữ liệu cuộc họp
 * @param {Object} input - Dữ liệu cuộc họp đầu vào
 * @param {Object} [options] - Tuỳ chọn thêm (ví dụ referenceTime để mock thời gian khi test)
 * @returns {{ isValid: boolean, errors: string[], data: Object | null }}
 */
function validateMeetingInput(input, options = {}) {
    const errors = [];
    const now = options.referenceTime instanceof Date ? options.referenceTime : new Date();
    const toleranceMs = typeof options.toleranceMs === 'number' ? options.toleranceMs : VALIDATION_CONFIG.TIME_PAST_TOLERANCE_MS;
    const minDurationMinutes = typeof options.minDurationMinutes === 'number' ? options.minDurationMinutes : VALIDATION_CONFIG.MIN_DURATION_MINUTES;
    const maxDurationHours = typeof options.maxDurationHours === 'number' ? options.maxDurationHours : VALIDATION_CONFIG.MAX_DURATION_HOURS;

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return {
            isValid: false,
            errors: ['Dữ liệu cuộc họp không hợp lệ (phải là một JSON Object).'],
            data: null
        };
    }

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
    } = input;

    // 1. Kiểm tra Tiêu đề (Title)
    if (!title || typeof title !== 'string' || !title.trim()) {
        errors.push('Tiêu đề cuộc họp (title) là bắt buộc và không được để trống.');
    } else {
        const trimmedTitle = title.trim();
        if (trimmedTitle.length < VALIDATION_CONFIG.TITLE_MIN_LENGTH) {
            errors.push(`Tiêu đề cuộc họp phải có ít nhất ${VALIDATION_CONFIG.TITLE_MIN_LENGTH} ký tự.`);
        } else if (trimmedTitle.length > VALIDATION_CONFIG.TITLE_MAX_LENGTH) {
            errors.push(`Tiêu đề cuộc họp không được vượt quá ${VALIDATION_CONFIG.TITLE_MAX_LENGTH} ký tự.`);
        }
    }

    // 2. Kiểm tra Mô tả (Description) - Không bắt buộc
    if (description !== undefined && description !== null && typeof description !== 'string') {
        errors.push('Mô tả cuộc họp (description) phải là chuỗi ký tự.');
    } else if (typeof description === 'string' && description.length > VALIDATION_CONFIG.DESCRIPTION_MAX_LENGTH) {
        errors.push(`Mô tả cuộc họp không được vượt quá ${VALIDATION_CONFIG.DESCRIPTION_MAX_LENGTH} ký tự.`);
    }

    // 3. Kiểm tra Người tổ chức (organizerId)
    if (!organizerId && organizerId !== 0) {
        errors.push('Mã người tổ chức (organizerId) là bắt buộc.');
    } else if (!isPositiveInteger(organizerId)) {
        errors.push('Mã người tổ chức (organizerId) phải là số nguyên dương hợp lệ.');
    }

    // 4. Kiểm tra Phòng họp (roomId)
    if (!roomId && roomId !== 0) {
        errors.push('Mã phòng họp (roomId) là bắt buộc.');
    } else if (!isPositiveInteger(roomId)) {
        errors.push('Mã phòng họp (roomId) phải là số nguyên dương hợp lệ.');
    }

    // 5. Kiểm tra Thời gian bắt đầu và kết thúc (startTime & endTime)
    let parsedStartDate = null;
    let parsedEndDate = null;

    if (!startTime || !endTime) {
        errors.push('Thời gian bắt đầu (startTime) và kết thúc (endTime) là bắt buộc.');
    } else {
        const startParsed = parseValidDate(startTime);
        const endParsed = parseValidDate(endTime);

        if (!startParsed.isValid || !endParsed.isValid) {
            errors.push('Định dạng ngày giờ không hợp lệ (hỗ trợ chuẩn ISO 8601 hoặc YYYY-MM-DD HH:mm:ss).');
        } else {
            parsedStartDate = startParsed.date;
            parsedEndDate = endParsed.date;

            const startMs = parsedStartDate.getTime();
            const endMs = parsedEndDate.getTime();
            const nowMs = now.getTime();

            // Chặn đặt lịch trong quá khứ
            if (startMs < nowMs - toleranceMs) {
                errors.push('Thời gian bắt đầu không thể diễn ra trong quá khứ.');
            }

            // Thứ tự thời gian: endTime phải lớn hơn startTime
            if (endMs <= startMs) {
                errors.push('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.');
            } else {
                const durationMinutes = (endMs - startMs) / (1000 * 60);

                // Thời lượng tối thiểu
                if (durationMinutes < minDurationMinutes) {
                    errors.push(`Thời lượng cuộc họp tối thiểu phải từ ${minDurationMinutes} phút trở lên.`);
                }

                // Thời lượng tối đa
                const maxDurationMinutes = maxDurationHours * 60;
                if (durationMinutes > maxDurationMinutes) {
                    errors.push(`Thời lượng cuộc họp không được vượt quá ${maxDurationHours} giờ trong một lần đặt.`);
                }
            }
        }
    }

    // 6. Kiểm tra Danh sách người tham gia (participantIds)
    let cleanParticipantIds = [];
    if (participantIds !== undefined && participantIds !== null) {
        if (!Array.isArray(participantIds)) {
            errors.push('participantIds phải là một mảng danh sách ID người dùng.');
        } else {
            for (let i = 0; i < participantIds.length; i++) {
                const id = participantIds[i];
                if (!isPositiveInteger(id)) {
                    errors.push(`ID người tham gia tại vị trí [${i}] không hợp lệ (phải là số nguyên dương).`);
                    break;
                }
            }
            if (errors.length === 0 || !errors.some(e => e.includes('participantIds'))) {
                cleanParticipantIds = [...new Set(participantIds.map(id => Number(id)))];
            }
        }
    }

    // 7. Kiểm tra Danh sách thiết bị (equipmentIds)
    let cleanEquipmentIds = [];
    if (equipmentIds !== undefined && equipmentIds !== null) {
        if (!Array.isArray(equipmentIds)) {
            errors.push('equipmentIds phải là một mảng danh sách ID thiết bị.');
        } else {
            for (let i = 0; i < equipmentIds.length; i++) {
                const id = equipmentIds[i];
                if (!isPositiveInteger(id)) {
                    errors.push(`ID thiết bị tại vị trí [${i}] không hợp lệ (phải là số nguyên dương).`);
                    break;
                }
            }
            if (errors.length === 0 || !errors.some(e => e.includes('equipmentIds'))) {
                cleanEquipmentIds = [...new Set(equipmentIds.map(id => Number(id)))];
            }
        }
    }

    if (errors.length > 0) {
        return {
            isValid: false,
            errors,
            data: null
        };
    }

    return {
        isValid: true,
        errors: [],
        data: {
            title: title.trim(),
            description: typeof description === 'string' ? description.trim() : null,
            startTime: typeof startTime === 'string' ? startTime : parsedStartDate.toISOString(),
            endTime: typeof endTime === 'string' ? endTime : parsedEndDate.toISOString(),
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            organizerId: Number(organizerId),
            roomId: Number(roomId),
            isRecurring: Boolean(isRecurring),
            participantIds: cleanParticipantIds,
            equipmentIds: cleanEquipmentIds
        }
    };
}

/**
 * Express Middleware xác thực dữ liệu cuộc họp
 */
function validateMeetingMiddleware(req, res, next) {
    const result = validateMeetingInput(req.body);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }
    req.validatedMeetingData = result.data;
    next();
}

module.exports = {
    VALIDATION_CONFIG,
    isPositiveInteger,
    parseValidDate,
    validateMeetingInput,
    validateMeetingMiddleware
};
