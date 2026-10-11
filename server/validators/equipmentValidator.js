/**
 * Module kiểm tra và xác thực dữ liệu đầu vào cho API Equipment
 * Xác thực query params cho API GET /api/equipments/available
 */

function isPositiveInteger(value) {
    if (value === null || value === undefined || typeof value === 'boolean') {
        return false;
    }
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
}

/**
 * Phân tích chuỗi ngày/giờ linh hoạt (hỗ trợ cả date + HH:mm và ISO string)
 */
function parseDateTimeString(dateStr, timeStr) {
    if (!dateStr) return null;

    if (timeStr) {
        const timeMatch = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (timeMatch) {
            const hours = timeMatch[1].padStart(2, '0');
            const minutes = timeMatch[2];
            const seconds = timeMatch[3] || '00';
            const iso = `${String(dateStr).trim()}T${hours}:${minutes}:${seconds}`;
            const parsed = new Date(iso);
            return isNaN(parsed.getTime()) ? null : parsed;
        }
    }

    const singleParsed = new Date(dateStr);
    return isNaN(singleParsed.getTime()) ? null : singleParsed;
}

/**
 * Format Date object sang chuỗi MySQL DATETIME: YYYY-MM-DD HH:mm:ss
 */
function formatToMySQLDateTime(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Xác thực các query parameter của API lọc thiết bị khả dụng
 * @param {Object} query - req.query
 */
function validateAvailableEquipmentsQuery(query) {
    const errors = [];

    if (!query || typeof query !== 'object') {
        return {
            isValid: false,
            errors: ['Dữ liệu truy vấn không hợp lệ.'],
            data: null
        };
    }

    const {
        date,
        startTime,
        endTime,
        start,
        end,
        type,
        excludeMeetingId
    } = query;

    const rawStart = startTime || start;
    const rawEnd = endTime || end;

    if (!rawStart || !rawEnd) {
        errors.push('Vui lòng cung cấp đầy đủ thời gian bắt đầu (startTime) và thời gian kết thúc (endTime).');
        return { isValid: false, errors, data: null };
    }

    // Parse StartTime và EndTime
    const startDate = parseDateTimeString(date, rawStart) || parseDateTimeString(rawStart);
    const endDate = parseDateTimeString(date, rawEnd) || parseDateTimeString(rawEnd);

    if (!startDate || isNaN(startDate.getTime())) {
        errors.push('Thời gian bắt đầu (startTime) không đúng định dạng ngày giờ hợp lệ.');
    }

    if (!endDate || isNaN(endDate.getTime())) {
        errors.push('Thời gian kết thúc (endTime) không đúng định dạng ngày giờ hợp lệ.');
    }

    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        if (startDate.getTime() >= endDate.getTime()) {
            errors.push('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.');
        } else {
            const durationMinutes = (endDate.getTime() - startDate.getTime()) / (60 * 1000);
            if (durationMinutes < 5) {
                errors.push('Khoảng thời gian kiểm tra thiết bị khả dụng tối thiểu phải từ 5 phút trở lên.');
            }
        }
    }

    // Kiểm tra excludeMeetingId nếu có
    let parsedExcludeId = null;
    if (excludeMeetingId !== undefined && excludeMeetingId !== null && excludeMeetingId !== '') {
        if (!isPositiveInteger(excludeMeetingId)) {
            errors.push('ID cuộc họp cần loại trừ (excludeMeetingId) phải là số nguyên dương.');
        } else {
            parsedExcludeId = Number(excludeMeetingId);
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
            startTime: formatToMySQLDateTime(startDate),
            endTime: formatToMySQLDateTime(endDate),
            startDate,
            endDate,
            type: type ? String(type).trim() : null,
            excludeMeetingId: parsedExcludeId
        }
    };
}

/**
 * Express Middleware xác thực query params lọc thiết bị khả dụng
 */
function validateAvailableEquipmentsMiddleware(req, res, next) {
    const result = validateAvailableEquipmentsQuery(req.query);

    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Tham số truy vấn kiểm tra thiết bị khả dụng không hợp lệ.',
            errors: result.errors
        });
    }

    req.validatedEquipmentQuery = result.data;
    next();
}

module.exports = {
    validateAvailableEquipmentsQuery,
    validateAvailableEquipmentsMiddleware,
    parseDateTimeString,
    formatToMySQLDateTime,
    isPositiveInteger
};
