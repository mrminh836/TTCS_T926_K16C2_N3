/**
 * Validator kiểm tra tham số đầu vào cho API thống kê báo cáo
 * Kiểm tra tính hợp lệ của startDate, endDate, roomId truyền qua query string.
 */

/**
 * Validate query params cho endpoint GET /api/reports/analytics
 * @param {Object} query - req.query
 * @returns {{ isValid: boolean, errors: string[], filters: Object|null }}
 */
function validateReportQuery(query = {}) {
    const errors = [];
    const { startDate, endDate, roomId } = query;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    // 1. Kiểm tra startDate
    if (startDate !== undefined && startDate !== '') {
        if (!dateRegex.test(startDate)) {
            errors.push('Tham số "startDate" phải có định dạng YYYY-MM-DD.');
        } else if (isNaN(new Date(startDate).getTime())) {
            errors.push('Tham số "startDate" không phải là ngày hợp lệ.');
        }
    }

    // 2. Kiểm tra endDate
    if (endDate !== undefined && endDate !== '') {
        if (!dateRegex.test(endDate)) {
            errors.push('Tham số "endDate" phải có định dạng YYYY-MM-DD.');
        } else if (isNaN(new Date(endDate).getTime())) {
            errors.push('Tham số "endDate" không phải là ngày hợp lệ.');
        }
    }

    // 3. Kiểm tra logic: startDate phải <= endDate
    if (startDate && endDate && errors.length === 0) {
        if (new Date(startDate) > new Date(endDate)) {
            errors.push('"startDate" không được lớn hơn "endDate".');
        }
    }

    // 4. Kiểm tra roomId
    if (roomId !== undefined && roomId !== '') {
        const parsedRoomId = Number(roomId);
        if (!Number.isInteger(parsedRoomId) || parsedRoomId <= 0) {
            errors.push('Tham số "roomId" phải là số nguyên dương.');
        }
    }

    if (errors.length > 0) {
        return { isValid: false, errors, filters: null };
    }

    // Chuẩn hóa filters
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (roomId) filters.roomId = Number(roomId);

    return { isValid: true, errors: [], filters };
}

/**
 * Express Middleware xác thực query params cho report
 */
function validateReportMiddleware(req, res, next) {
    const result = validateReportQuery(req.query);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }
    req.reportFilters = result.filters;
    next();
}

module.exports = {
    validateReportQuery,
    validateReportMiddleware
};
