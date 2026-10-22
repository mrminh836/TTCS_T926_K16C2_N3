/**
 * Module kiểm tra và xác thực tham số đầu vào cho API Thống kê & Báo cáo hiệu suất
 * (Report & Analytics Query Validation)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-\d{2}$/;
const YEAR_REGEX = /^\d{4}$/;

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
 * Kiểm tra định dạng tháng YYYY-MM (Ví dụ: 2026-10)
 */
function isValidMonthString(monthString) {
    if (!monthString || typeof monthString !== 'string' || !MONTH_REGEX.test(monthString.trim())) {
        return false;
    }
    const [year, month] = monthString.trim().split('-').map(Number);
    return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
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
        sanitized.workingHoursPerDay = 10;
    }

    return {
        isValid: errors.length === 0,
        errors,
        data: errors.length === 0 ? sanitized : null
    };
}

/**
 * Xác thực tham số truy vấn cho API lọc báo cáo /api/reports/filter
 * @param {Object} query 
 * @returns {Object}
 */
function validateFilterReportsQuery(query = {}) {
    const errors = [];
    const sanitized = {};

    const {
        period,
        date,
        month,
        year,
        startDate,
        endDate,
        department,
        roomId,
        status,
        page,
        limit
    } = query;

    // 1. Khoảng chu kỳ (period: day | week | month | quarter | year | custom | all)
    const validPeriods = ['day', 'week', 'month', 'quarter', 'year', 'custom', 'all'];
    const p = (period || 'all').toLowerCase().trim();
    if (period && !validPeriods.includes(p)) {
        errors.push(`Tham số "period" không hợp lệ. Chấp nhận: ${validPeriods.join(', ')}.`);
    } else {
        sanitized.period = p;
    }

    // 2. Xác thực ngày tháng tùy theo period
    let computedStartDate = null;
    let computedEndDate = null;

    if (p === 'day' || (date && !startDate && !endDate)) {
        const targetDate = String(date || startDate || '').trim();
        if (targetDate) {
            if (!isValidDateString(targetDate)) {
                errors.push('Tham số "date" không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD.');
            } else {
                computedStartDate = targetDate;
                computedEndDate = targetDate;
            }
        }
    } else if (p === 'month' || (month && !startDate && !endDate)) {
        const targetMonth = String(month || '').trim();
        if (targetMonth) {
            if (!isValidMonthString(targetMonth)) {
                errors.push('Tham số "month" không hợp lệ. Vui lòng dùng định dạng YYYY-MM (ví dụ: 2026-10).');
            } else {
                const [y, m] = targetMonth.split('-').map(Number);
                const lastDay = new Date(y, m, 0).getDate();
                computedStartDate = `${targetMonth}-01`;
                computedEndDate = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;
            }
        }
    } else if (p === 'year' || (year && !startDate && !endDate)) {
        const targetYear = String(year || '').trim();
        if (targetYear && !YEAR_REGEX.test(targetYear)) {
            errors.push('Tham số "year" không hợp lệ. Vui lòng dùng định dạng YYYY (ví dụ: 2026).');
        } else if (targetYear) {
            computedStartDate = `${targetYear}-01-01`;
            computedEndDate = `${targetYear}-12-31`;
        }
    }

    // Nếu truyền trực tiếp startDate và endDate
    if (startDate !== undefined && startDate !== null && String(startDate).trim() !== '') {
        const str = String(startDate).trim();
        if (!isValidDateString(str)) {
            errors.push('Tham số "startDate" không hợp lệ (YYYY-MM-DD).');
        } else {
            computedStartDate = str;
        }
    }

    if (endDate !== undefined && endDate !== null && String(endDate).trim() !== '') {
        const str = String(endDate).trim();
        if (!isValidDateString(str)) {
            errors.push('Tham số "endDate" không hợp lệ (YYYY-MM-DD).');
        } else {
            computedEndDate = str;
        }
    }

    if (computedStartDate && computedEndDate && new Date(computedStartDate) > new Date(computedEndDate)) {
        errors.push('Khoảng thời gian không hợp lệ: "startDate" không được lớn hơn "endDate".');
    }

    sanitized.startDate = computedStartDate;
    sanitized.endDate = computedEndDate;

    // 3. Phòng ban (department)
    if (department !== undefined && department !== null && String(department).trim() !== '') {
        const dept = String(department).trim();
        sanitized.department = dept.toLowerCase() === 'all' ? null : dept;
    } else {
        sanitized.department = null;
    }

    // 4. Phòng họp (roomId)
    if (roomId !== undefined && roomId !== null && String(roomId).trim() !== '') {
        if (!isPositiveInteger(roomId)) {
            errors.push('Tham số "roomId" phải là số nguyên dương hợp lệ.');
        } else {
            sanitized.roomId = Number(roomId);
        }
    } else {
        sanitized.roomId = null;
    }

    // 5. Trạng thái (status)
    const validStatuses = ['confirmed', 'cancelled', 'canceled', 'completed', 'all'];
    if (status !== undefined && status !== null && String(status).trim() !== '') {
        const st = String(status).trim().toLowerCase();
        if (!validStatuses.includes(st)) {
            errors.push(`Trạng thái không hợp lệ. Chấp nhận: ${validStatuses.join(', ')}.`);
        } else {
            sanitized.status = st === 'all' ? null : (st === 'canceled' ? 'Cancelled' : capitalizeFirst(st));
        }
    } else {
        sanitized.status = null;
    }

    // 6. Phân trang
    let parsedPage = parseInt(page, 10) || 1;
    let parsedLimit = parseInt(limit, 10) || 10;
    if (parsedPage < 1) parsedPage = 1;
    if (parsedLimit < 1) parsedLimit = 1;
    if (parsedLimit > 100) parsedLimit = 100;
    sanitized.page = parsedPage;
    sanitized.limit = parsedLimit;

    return {
        isValid: errors.length === 0,
        errors,
        data: errors.length === 0 ? sanitized : null
    };
}

/**
 * Xác thực tham số xuất tệp báo cáo /api/reports/export
 */
function validateExportReportQuery(query = {}) {
    const filterValidation = validateFilterReportsQuery(query);
    if (!filterValidation.isValid) {
        return filterValidation;
    }

    const format = String(query.format || 'csv').trim().toLowerCase();
    const validFormats = ['csv', 'excel', 'xlsx'];
    if (!validFormats.includes(format)) {
        return {
            isValid: false,
            errors: [`Định dạng xuất không hợp lệ (${format}). Chấp nhận: ${validFormats.join(', ')}.`],
            data: null
        };
    }

    return {
        isValid: true,
        errors: [],
        data: {
            ...filterValidation.data,
            format: format === 'xlsx' ? 'excel' : format
        }
    };
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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

/**
 * Express Middleware xác thực cho route Filter
 */
function validateFilterReportsMiddleware(req, res, next) {
    const result = validateFilterReportsQuery(req.query);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }

    req.validatedFilterQuery = result.data;
    next();
}

/**
 * Express Middleware xác thực cho route Export
 */
function validateExportReportMiddleware(req, res, next) {
    const result = validateExportReportQuery(req.query);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }

    req.validatedExportQuery = result.data;
    next();
}

module.exports = {
    validateAnalyticsQuery,
    validateAnalyticsMiddleware,
    validateFilterReportsQuery,
    validateFilterReportsMiddleware,
    validateExportReportQuery,
    validateExportReportMiddleware,
    isValidDateString,
    isValidMonthString,
    isPositiveInteger
};
