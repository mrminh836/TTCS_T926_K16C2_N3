/**
 * Module xác thực dữ liệu đầu vào cho API Recurring Meetings
 * Validate toàn diện: tần suất lặp, khoảng cách, số buổi, thời gian chuỗi
 */

const { isPositiveInteger, parseValidDate, VALIDATION_CONFIG } = require('./meetingValidator');

// ── Cấu hình giới hạn nghiệp vụ cho Recurring ──
const RECURRING_CONFIG = {
    MAX_OCCURRENCES: 52,              // Tối đa 52 buổi (1 năm theo tuần)
    MIN_OCCURRENCES: 2,               // Tối thiểu 2 buổi mới gọi là "lặp"
    MAX_INTERVAL: 12,                 // Khoảng cách tối đa giữa các lần lặp
    ALLOWED_RECURRENCE_TYPES: ['weekly', 'monthly', 'custom'],
    MAX_SERIES_MONTHS: 18             // Chuỗi không kéo dài quá 18 tháng
};

/**
 * Sinh danh sách ngày (Date) cho chuỗi recurring dựa trên quy tắc lặp
 * @param {Object} params
 * @param {string} params.recurrenceType - 'weekly' | 'monthly' | 'custom'
 * @param {number} params.intervalValue  - Khoảng cách (ví dụ: 2 = mỗi 2 tuần)
 * @param {Date}   params.startDate      - Ngày bắt đầu chuỗi
 * @param {string} params.meetingStartTime - Giờ bắt đầu mỗi buổi (HH:mm)
 * @param {string} params.meetingEndTime   - Giờ kết thúc mỗi buổi (HH:mm)
 * @param {number} params.totalOccurrences - Tổng số buổi
 * @param {number} [params.dayOfWeek]      - Ngày trong tuần (0-6) cho weekly/custom
 * @param {number} [params.dayOfMonth]     - Ngày trong tháng (1-31) cho monthly
 * @returns {Array<{startTime: Date, endTime: Date, occurrenceIndex: number}>}
 */
function generateOccurrences(params) {
    const {
        recurrenceType,
        intervalValue,
        startDate,
        meetingStartTime,
        meetingEndTime,
        totalOccurrences,
        dayOfWeek,
        dayOfMonth
    } = params;

    const occurrences = [];
    const [startHour, startMinute] = meetingStartTime.split(':').map(Number);
    const [endHour, endMinute] = meetingEndTime.split(':').map(Number);

    // Tính thời lượng cuộc họp (ms) để áp dụng cho mỗi buổi
    const durationMs = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) * 60 * 1000;

    for (let i = 0; i < totalOccurrences; i++) {
        let occDate = new Date(startDate);

        if (recurrenceType === 'weekly' || recurrenceType === 'custom') {
            // Cộng thêm (i * intervalValue) tuần
            occDate.setDate(occDate.getDate() + (i * intervalValue * 7));
        } else if (recurrenceType === 'monthly') {
            const targetYear = startDate.getFullYear();
            const targetMonth = startDate.getMonth() + (i * intervalValue);
            const targetDay = dayOfMonth || startDate.getDate();
            const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            occDate = new Date(targetYear, targetMonth, Math.min(targetDay, lastDayOfMonth));
        }

        // Gán giờ bắt đầu/kết thúc cho mỗi buổi
        const occStart = new Date(occDate);
        occStart.setHours(startHour, startMinute, 0, 0);

        const occEnd = new Date(occStart.getTime() + durationMs);

        occurrences.push({
            startTime: occStart,
            endTime: occEnd,
            occurrenceIndex: i + 1
        });
    }

    return occurrences;
}

/**
 * Validate toàn diện dữ liệu recurring meeting
 * @param {Object} input - Dữ liệu từ request body
 * @returns {{ isValid: boolean, errors: string[], data: Object | null }}
 */
function validateRecurringInput(input) {
    const errors = [];
    const now = new Date();
    const toleranceMs = VALIDATION_CONFIG.TIME_PAST_TOLERANCE_MS;

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return {
            isValid: false,
            errors: ['Dữ liệu recurring không hợp lệ (phải là một JSON Object).'],
            data: null
        };
    }

    const {
        title,
        description,
        organizerId,
        roomId,
        recurrenceType,
        intervalValue,
        totalOccurrences,
        dayOfWeek,
        dayOfMonth,
        meetingStartTime,   // HH:mm (giờ bắt đầu mỗi buổi)
        meetingEndTime,     // HH:mm (giờ kết thúc mỗi buổi)
        seriesStartDate,    // YYYY-MM-DD (ngày bắt đầu chuỗi)
        participantIds,
        equipmentIds
    } = input;

    // ═══════════════════════════════════════════════════════════
    // 1. Kiểm tra các trường cơ bản của cuộc họp (title, organizerId, roomId)
    // ═══════════════════════════════════════════════════════════

    // Title
    if (!title || typeof title !== 'string' || !title.trim()) {
        errors.push('Tiêu đề cuộc họp (title) là bắt buộc và không được để trống.');
    } else {
        const trimmedTitle = title.trim();
        if (trimmedTitle.length < VALIDATION_CONFIG.TITLE_MIN_LENGTH) {
            errors.push(`Tiêu đề cuộc họp phải có ít nhất ${VALIDATION_CONFIG.TITLE_MIN_LENGTH} ký tự.`);
        } else if (trimmedTitle.length > VALIDATION_CONFIG.TITLE_MAX_LENGTH) {
            errors.push(`Tiêu đề cuộc họp không được vượt quá ${VALIDATION_CONFIG.TITLE_MAX_LENGTH} ký tự.`);
        } else if (/[<>]/.test(trimmedTitle)) {
            errors.push('Tiêu đề cuộc họp không được chứa ký tự đặc biệt nguy hiểm (<, >).');
        }
    }

    // Description
    if (description !== undefined && description !== null && typeof description !== 'string') {
        errors.push('Mô tả cuộc họp (description) phải là chuỗi ký tự.');
    } else if (typeof description === 'string' && description.length > VALIDATION_CONFIG.DESCRIPTION_MAX_LENGTH) {
        errors.push(`Mô tả cuộc họp không được vượt quá ${VALIDATION_CONFIG.DESCRIPTION_MAX_LENGTH} ký tự.`);
    }

    // organizerId
    if (!organizerId && organizerId !== 0) {
        errors.push('Mã người tổ chức (organizerId) là bắt buộc.');
    } else if (!isPositiveInteger(organizerId)) {
        errors.push('Mã người tổ chức (organizerId) phải là số nguyên dương hợp lệ.');
    }

    // roomId
    if (!roomId && roomId !== 0) {
        errors.push('Mã phòng họp (roomId) là bắt buộc.');
    } else if (!isPositiveInteger(roomId)) {
        errors.push('Mã phòng họp (roomId) phải là số nguyên dương hợp lệ.');
    }

    // ═══════════════════════════════════════════════════════════
    // 2. Kiểm tra các trường Recurring
    // ═══════════════════════════════════════════════════════════

    // recurrenceType
    if (!recurrenceType || !RECURRING_CONFIG.ALLOWED_RECURRENCE_TYPES.includes(recurrenceType)) {
        errors.push(
            `Loại lặp (recurrenceType) là bắt buộc. Giá trị hợp lệ: ${RECURRING_CONFIG.ALLOWED_RECURRENCE_TYPES.join(', ')}.`
        );
    }

    // intervalValue
    const parsedInterval = Number(intervalValue);
    if (!intervalValue && intervalValue !== 0) {
        errors.push('Khoảng cách lặp (intervalValue) là bắt buộc.');
    } else if (!Number.isInteger(parsedInterval) || parsedInterval < 1) {
        errors.push('Khoảng cách lặp (intervalValue) phải là số nguyên dương (≥ 1).');
    } else if (parsedInterval > RECURRING_CONFIG.MAX_INTERVAL) {
        errors.push(`Khoảng cách lặp không được vượt quá ${RECURRING_CONFIG.MAX_INTERVAL}.`);
    }

    // totalOccurrences
    const parsedOccurrences = Number(totalOccurrences);
    if (!totalOccurrences && totalOccurrences !== 0) {
        errors.push('Tổng số buổi (totalOccurrences) là bắt buộc.');
    } else if (!Number.isInteger(parsedOccurrences)) {
        errors.push('Tổng số buổi (totalOccurrences) phải là số nguyên.');
    } else if (parsedOccurrences < RECURRING_CONFIG.MIN_OCCURRENCES) {
        errors.push(`Chuỗi lặp phải có ít nhất ${RECURRING_CONFIG.MIN_OCCURRENCES} buổi.`);
    } else if (parsedOccurrences > RECURRING_CONFIG.MAX_OCCURRENCES) {
        errors.push(`Chuỗi lặp không được vượt quá ${RECURRING_CONFIG.MAX_OCCURRENCES} buổi.`);
    }

    // dayOfWeek (bắt buộc cho weekly/custom, bỏ qua cho monthly)
    if (recurrenceType === 'weekly' || recurrenceType === 'custom') {
        if (dayOfWeek === undefined || dayOfWeek === null) {
            errors.push('Ngày trong tuần (dayOfWeek) là bắt buộc cho lặp theo tuần. Giá trị: 0 (CN) đến 6 (T7).');
        } else {
            const parsedDOW = Number(dayOfWeek);
            if (!Number.isInteger(parsedDOW) || parsedDOW < 0 || parsedDOW > 6) {
                errors.push('Ngày trong tuần (dayOfWeek) phải là số nguyên từ 0 (Chủ nhật) đến 6 (Thứ 7).');
            }
        }
    }

    // dayOfMonth (bắt buộc cho monthly, bỏ qua cho weekly)
    if (recurrenceType === 'monthly') {
        if (dayOfMonth === undefined || dayOfMonth === null) {
            errors.push('Ngày trong tháng (dayOfMonth) là bắt buộc cho lặp theo tháng. Giá trị: 1-31.');
        } else {
            const parsedDOM = Number(dayOfMonth);
            if (!Number.isInteger(parsedDOM) || parsedDOM < 1 || parsedDOM > 31) {
                errors.push('Ngày trong tháng (dayOfMonth) phải là số nguyên từ 1 đến 31.');
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 3. Kiểm tra thời gian mỗi buổi họp (HH:mm)
    // ═══════════════════════════════════════════════════════════

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!meetingStartTime || typeof meetingStartTime !== 'string') {
        errors.push('Giờ bắt đầu mỗi buổi (meetingStartTime) là bắt buộc, định dạng HH:mm.');
    } else if (!timeRegex.test(meetingStartTime)) {
        errors.push('Giờ bắt đầu (meetingStartTime) phải có định dạng HH:mm (00:00 - 23:59).');
    }

    if (!meetingEndTime || typeof meetingEndTime !== 'string') {
        errors.push('Giờ kết thúc mỗi buổi (meetingEndTime) là bắt buộc, định dạng HH:mm.');
    } else if (!timeRegex.test(meetingEndTime)) {
        errors.push('Giờ kết thúc (meetingEndTime) phải có định dạng HH:mm (00:00 - 23:59).');
    }

    // Validate thời lượng mỗi buổi
    if (meetingStartTime && meetingEndTime && timeRegex.test(meetingStartTime) && timeRegex.test(meetingEndTime)) {
        const [sh, sm] = meetingStartTime.split(':').map(Number);
        const [eh, em] = meetingEndTime.split(':').map(Number);
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;

        if (endMinutes <= startMinutes) {
            errors.push('Giờ kết thúc phải sau giờ bắt đầu trong cùng một ngày.');
        } else {
            const durationMinutes = endMinutes - startMinutes;
            if (durationMinutes < VALIDATION_CONFIG.MIN_DURATION_MINUTES) {
                errors.push(`Thời lượng mỗi buổi họp tối thiểu phải từ ${VALIDATION_CONFIG.MIN_DURATION_MINUTES} phút.`);
            }
            const maxDurationMinutes = VALIDATION_CONFIG.MAX_DURATION_HOURS * 60;
            if (durationMinutes > maxDurationMinutes) {
                errors.push(`Thời lượng mỗi buổi họp không được vượt quá ${VALIDATION_CONFIG.MAX_DURATION_HOURS} giờ.`);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 4. Kiểm tra ngày bắt đầu chuỗi (seriesStartDate)
    // ═══════════════════════════════════════════════════════════

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let parsedSeriesStartDate = null;

    if (!seriesStartDate || typeof seriesStartDate !== 'string') {
        errors.push('Ngày bắt đầu chuỗi (seriesStartDate) là bắt buộc, định dạng YYYY-MM-DD.');
    } else if (!dateRegex.test(seriesStartDate)) {
        errors.push('Ngày bắt đầu chuỗi (seriesStartDate) phải có định dạng YYYY-MM-DD.');
    } else {
        const parsed = parseValidDate(seriesStartDate);
        if (!parsed.isValid) {
            errors.push('Ngày bắt đầu chuỗi (seriesStartDate) không phải là ngày hợp lệ.');
        } else {
            parsedSeriesStartDate = parsed.date;
            // Ngày bắt đầu chuỗi không được ở quá khứ
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const seriesDate = new Date(parsedSeriesStartDate);
            seriesDate.setHours(0, 0, 0, 0);
            if (seriesDate < today) {
                errors.push('Ngày bắt đầu chuỗi (seriesStartDate) không thể nằm trong quá khứ.');
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 5. Kiểm tra participantIds & equipmentIds
    // ═══════════════════════════════════════════════════════════

    let cleanParticipantIds = [];
    if (participantIds !== undefined && participantIds !== null) {
        if (!Array.isArray(participantIds)) {
            errors.push('participantIds phải là một mảng danh sách ID người dùng.');
        } else {
            for (let i = 0; i < participantIds.length; i++) {
                if (!isPositiveInteger(participantIds[i])) {
                    errors.push(`ID người tham gia tại vị trí [${i}] không hợp lệ (phải là số nguyên dương).`);
                    break;
                }
            }
            if (!errors.some(e => e.includes('participantIds') || e.includes('người tham gia'))) {
                cleanParticipantIds = [...new Set(participantIds.map(id => Number(id)))];
            }
        }
    }

    let cleanEquipmentIds = [];
    if (equipmentIds !== undefined && equipmentIds !== null) {
        if (!Array.isArray(equipmentIds)) {
            errors.push('equipmentIds phải là một mảng danh sách ID thiết bị.');
        } else {
            for (let i = 0; i < equipmentIds.length; i++) {
                if (!isPositiveInteger(equipmentIds[i])) {
                    errors.push(`ID thiết bị tại vị trí [${i}] không hợp lệ (phải là số nguyên dương).`);
                    break;
                }
            }
            if (!errors.some(e => e.includes('equipmentIds') || e.includes('thiết bị'))) {
                cleanEquipmentIds = [...new Set(equipmentIds.map(id => Number(id)))];
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 6. Sinh preview danh sách buổi họp và validate khoảng cách chuỗi
    // ═══════════════════════════════════════════════════════════

    let occurrences = [];

    if (errors.length === 0) {
        // Tính ngày bắt đầu thực tế (cần điều chỉnh cho weekly: tìm ngày dayOfWeek gần nhất)
        let adjustedStartDate = new Date(parsedSeriesStartDate);

        if (recurrenceType === 'weekly' || recurrenceType === 'custom') {
            const currentDow = adjustedStartDate.getDay();
            const targetDow = Number(dayOfWeek);
            let diff = targetDow - currentDow;
            if (diff < 0) diff += 7;
            adjustedStartDate.setDate(adjustedStartDate.getDate() + diff);
        } else if (recurrenceType === 'monthly') {
            const targetDay = Number(dayOfMonth);
            const lastDay = new Date(adjustedStartDate.getFullYear(), adjustedStartDate.getMonth() + 1, 0).getDate();
            adjustedStartDate.setDate(Math.min(targetDay, lastDay));
            // Nếu ngày đã qua trong tháng hiện tại → chuyển sang tháng tiếp theo
            const originalSeriesDate = new Date(seriesStartDate + 'T00:00:00');
            if (adjustedStartDate < originalSeriesDate) {
                adjustedStartDate.setMonth(adjustedStartDate.getMonth() + 1);
                const newLastDay = new Date(adjustedStartDate.getFullYear(), adjustedStartDate.getMonth() + 1, 0).getDate();
                adjustedStartDate.setDate(Math.min(targetDay, newLastDay));
            }
        }

        occurrences = generateOccurrences({
            recurrenceType,
            intervalValue: parsedInterval,
            startDate: adjustedStartDate,
            meetingStartTime,
            meetingEndTime,
            totalOccurrences: parsedOccurrences,
            dayOfWeek: dayOfWeek !== undefined ? Number(dayOfWeek) : null,
            dayOfMonth: dayOfMonth !== undefined ? Number(dayOfMonth) : null
        });

        // Validate: buổi đầu tiên không được ở quá khứ
        if (occurrences.length > 0) {
            const firstOccStart = occurrences[0].startTime;
            if (firstOccStart.getTime() < now.getTime() - toleranceMs) {
                errors.push('Buổi họp đầu tiên trong chuỗi không thể diễn ra trong quá khứ.');
            }
        }

        // Validate: chuỗi không kéo dài quá MAX_SERIES_MONTHS
        if (occurrences.length >= 2) {
            const lastOcc = occurrences[occurrences.length - 1];
            const maxEndDate = new Date(adjustedStartDate);
            maxEndDate.setMonth(maxEndDate.getMonth() + RECURRING_CONFIG.MAX_SERIES_MONTHS);

            if (lastOcc.endTime > maxEndDate) {
                errors.push(
                    `Chuỗi lặp không được kéo dài quá ${RECURRING_CONFIG.MAX_SERIES_MONTHS} tháng kể từ ngày bắt đầu.`
                );
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 7. Trả về kết quả
    // ═══════════════════════════════════════════════════════════

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
            organizerId: Number(organizerId),
            roomId: Number(roomId),
            recurrenceType,
            intervalValue: parsedInterval,
            totalOccurrences: parsedOccurrences,
            dayOfWeek: dayOfWeek !== undefined && dayOfWeek !== null ? Number(dayOfWeek) : null,
            dayOfMonth: dayOfMonth !== undefined && dayOfMonth !== null ? Number(dayOfMonth) : null,
            meetingStartTime,
            meetingEndTime,
            seriesStartDate,
            participantIds: cleanParticipantIds,
            equipmentIds: cleanEquipmentIds,
            occurrences  // Danh sách buổi đã sinh sẵn
        }
    };
}

/**
 * Express Middleware xác thực dữ liệu recurring meeting
 */
function validateRecurringMiddleware(req, res, next) {
    const result = validateRecurringInput(req.body);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }
    req.validatedRecurringData = result.data;
    next();
}

module.exports = {
    RECURRING_CONFIG,
    generateOccurrences,
    validateRecurringInput,
    validateRecurringMiddleware
};
