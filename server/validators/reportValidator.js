/**
 * Module xác thực dữ liệu đầu vào cho API lọc báo cáo (Report Filter Validation)
 * Hỗ trợ kiểm tra tính hợp lệ của các tham số filterType, date, month, startDate, endDate, roomId, floor, status
 */

// Các loại lọc thời gian hợp lệ
const VALID_FILTER_TYPES = ['day', 'month', 'custom'];

// Các trạng thái booking hợp lệ
const VALID_STATUSES = ['Confirmed', 'Cancelled', 'Completed'];

/**
 * Xác thực và chuẩn hóa query params cho GET /api/reports/filter
 * @param {Object} query - req.query
 * @returns {{ isValid: boolean, errors: string[], data: Object | null }}
 */
function validateReportFilterInput(query = {}) {
    const errors = [];

    const {
        filterType,
        date,
        month,
        startDate,
        endDate,
        roomId,
        floor,
        status,
        page,
        limit
    } = query;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const monthRegex = /^\d{4}-\d{2}$/;

    // ── 1. Validate filterType ──
    if (filterType && !VALID_FILTER_TYPES.includes(filterType)) {
        errors.push(`Tham số "filterType" không hợp lệ. Chấp nhận: ${VALID_FILTER_TYPES.join(', ')}.`);
    }

    // ── 2. Validate theo từng loại filterType ──
    if (filterType === 'day') {
        if (!date) {
            errors.push('Khi filterType = "day", tham số "date" (YYYY-MM-DD) là bắt buộc.');
        } else if (!dateRegex.test(date)) {
            errors.push('Tham số "date" phải có định dạng YYYY-MM-DD.');
        } else if (isNaN(new Date(date).getTime())) {
            errors.push('Tham số "date" không phải là ngày hợp lệ.');
        }
    }

    if (filterType === 'month') {
        if (!month) {
            errors.push('Khi filterType = "month", tham số "month" (YYYY-MM) là bắt buộc.');
        } else if (!monthRegex.test(month)) {
            errors.push('Tham số "month" phải có định dạng YYYY-MM.');
        } else {
            // Kiểm tra tháng có hợp lệ không (01-12)
            const monthNum = parseInt(month.split('-')[1], 10);
            if (monthNum < 1 || monthNum > 12) {
                errors.push('Tham số "month" chứa tháng không hợp lệ (phải từ 01 đến 12).');
            }
        }
    }

    if (filterType === 'custom') {
        if (!startDate || !endDate) {
            errors.push('Khi filterType = "custom", cả "startDate" và "endDate" (YYYY-MM-DD) đều bắt buộc.');
        }
    }

    // ── 3. Validate startDate / endDate khi được truyền (kể cả không có filterType) ──
    if (startDate) {
        if (!dateRegex.test(startDate)) {
            errors.push('Tham số "startDate" phải có định dạng YYYY-MM-DD.');
        } else if (isNaN(new Date(startDate).getTime())) {
            errors.push('Tham số "startDate" không phải là ngày hợp lệ.');
        }
    }

    if (endDate) {
        if (!dateRegex.test(endDate)) {
            errors.push('Tham số "endDate" phải có định dạng YYYY-MM-DD.');
        } else if (isNaN(new Date(endDate).getTime())) {
            errors.push('Tham số "endDate" không phải là ngày hợp lệ.');
        }
    }

    // Kiểm tra startDate <= endDate
    if (startDate && endDate && dateRegex.test(startDate) && dateRegex.test(endDate)) {
        if (new Date(startDate) > new Date(endDate)) {
            errors.push('"startDate" không được lớn hơn "endDate".');
        }
    }

    // ── 4. Validate roomId ──
    if (roomId !== undefined && roomId !== '') {
        const parsedRoomId = parseInt(roomId, 10);
        if (isNaN(parsedRoomId) || parsedRoomId <= 0) {
            errors.push('Tham số "roomId" phải là số nguyên dương.');
        }
    }

    // ── 5. Validate floor (tầng / khu vực) ──
    if (floor !== undefined && floor !== '') {
        if (typeof floor !== 'string' || floor.trim().length === 0) {
            errors.push('Tham số "floor" phải là chuỗi ký tự không rỗng.');
        } else if (floor.length > 100) {
            errors.push('Tham số "floor" không được vượt quá 100 ký tự.');
        }
    }

    // ── 6. Validate status ──
    if (status && !VALID_STATUSES.includes(status)) {
        errors.push(`Trạng thái không hợp lệ. Chấp nhận: ${VALID_STATUSES.join(', ')}.`);
    }

    // ── 7. Validate & chuẩn hóa phân trang ──
    let parsedPage = parseInt(page, 10) || 1;
    let parsedLimit = parseInt(limit, 10) || 10;

    if (parsedPage < 1) parsedPage = 1;
    if (parsedLimit < 1) parsedLimit = 1;
    if (parsedLimit > 100) parsedLimit = 100;

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
            filterType: filterType || null,
            date: date || null,
            month: month || null,
            startDate: startDate || null,
            endDate: endDate || null,
            roomId: roomId ? parseInt(roomId, 10) : null,
            floor: floor ? floor.trim() : null,
            status: status || null,
            page: parsedPage,
            limit: parsedLimit
        }
    };
}

/**
 * Express Middleware xác thực tham số lọc báo cáo
 */
function validateReportFilterMiddleware(req, res, next) {
    const result = validateReportFilterInput(req.query);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }
    req.validatedReportFilter = result.data;
    next();
}

module.exports = {
    VALID_FILTER_TYPES,
    VALID_STATUSES,
    validateReportFilterInput,
    validateReportFilterMiddleware
};
