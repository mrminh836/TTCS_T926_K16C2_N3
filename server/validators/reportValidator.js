/**
 * Module kiểm tra và xác thực tham số đầu vào cho API Thống kê & Báo cáo hiệu suất
 * (Report & Analytics Query Validation)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Kiểm tra xem chuỗi có phải định dạng ngày hợp lệ YYYY-MM-DD không
 * @param {string} dateString 
 * @returns {boolean}
 */
function isValidDateString(dateString) {
    if (!dateString || typeof dateString !== 'string' || !DATE_REGEX.test(dateString.trim())) {
        return false;
    }

    const [year, month, day] = dateString.trim().split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

/**
 * Kiểm tra số nguyên dương
 * @param {*} value 
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
 * Xác thực các tham số truy vấn cho API thống kê hiệu suất /api/reports/analytics
 * @param {Object} query - req.query
 * @returns {Object} { isValid: boolean, errors: string[], data: Object }
 */
function validateAnalyticsQuery(query = {}) {
    const errors = [];
    const sanitized = {};

    const { startDate, endDate, roomId, workingHoursPerDay } = query;

    // 1. Xác thực startDate nếu có truyền
    if (startDate !== undefined && startDate !== null && String(startDate).trim() !== '') {
        const trimmedStartDate = String(startDate).trim();
        if (!isValidDateString(trimmedStartDate)) {
            errors.push('Tham số "startDate" không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD (ví dụ: 2026-10-01).');
        } else {
            sanitized.startDate = trimmedStartDate;
        }
    } else {
        sanitized.startDate = null;
    }

    // 2. Xác thực endDate nếu có truyền
    if (endDate !== undefined && endDate !== null && String(endDate).trim() !== '') {
        const trimmedEndDate = String(endDate).trim();
        if (!isValidDateString(trimmedEndDate)) {
            errors.push('Tham số "endDate" không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD (ví dụ: 2026-10-31).');
        } else {
            sanitized.endDate = trimmedEndDate;
        }
    } else {
        sanitized.endDate = null;
    }

    // 3. Kiểm tra logic ngày: startDate không được lớn hơn endDate
    if (sanitized.startDate && sanitized.endDate) {
        if (new Date(sanitized.startDate) > new Date(sanitized.endDate)) {
            errors.push('Khoảng thời gian không hợp lệ: "startDate" không được lớn hơn "endDate".');
        }
    }

    // 4. Xác thực roomId nếu có truyền
    if (roomId !== undefined && roomId !== null && String(roomId).trim() !== '') {
        if (!isPositiveInteger(roomId)) {
            errors.push('Tham số "roomId" phải là một số nguyên dương hợp lệ.');
        } else {
            sanitized.roomId = Number(roomId);
        }
    } else {
        sanitized.roomId = null;
    }

    // 5. Xác thực số giờ làm việc chuẩn mỗi ngày (workingHoursPerDay)
    if (workingHoursPerDay !== undefined && workingHoursPerDay !== null && String(workingHoursPerDay).trim() !== '') {
        const hours = Number(workingHoursPerDay);
        if (isNaN(hours) || hours <= 0 || hours > 24) {
            errors.push('Tham số "workingHoursPerDay" phải là số giờ hợp lệ từ 1 đến 24 (mặc định: 10).');
        } else {
            sanitized.workingHoursPerDay = hours;
        }
    } else {
        sanitized.workingHoursPerDay = 10; // Giờ làm việc doanh nghiệp mặc định (8h00 - 18h00)
    }

    return {
        isValid: errors.length === 0,
        errors,
        data: errors.length === 0 ? sanitized : null
    };
}

/**
 * Express Middleware xác thực tham số query cho route Analytics
 */
function validateAnalyticsMiddleware(req, res, next) {
    const result = validateAnalyticsQuery(req.query);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }

    req.validatedAnalyticsQuery = result.data;
    next();
}

module.exports = {
    validateAnalyticsQuery,
    validateAnalyticsMiddleware,
    isValidDateString,
    isPositiveInteger
};
