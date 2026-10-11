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

const VALID_EQUIPMENT_STATUSES = ['Available', 'Maintenance', 'Broken'];

function normalizeStatus(status) {
    if (!status || typeof status !== 'string') return null;
    const lower = status.trim().toLowerCase();
    if (lower === 'available') return 'Available';
    if (lower === 'maintenance') return 'Maintenance';
    if (lower === 'broken') return 'Broken';
    return null;
}

/**
 * Xác thực dữ liệu tạo mới thiết bị (POST /api/equipments)
 */
function validateCreateEquipment(body) {
    const errors = [];
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { isValid: false, errors: ['Dữ liệu thiết bị phải là một đối tượng JSON.'], data: null };
    }

    const name = body.equipmentName || body.name;
    const type = body.type;
    const status = body.status;

    if (!name || typeof name !== 'string' || !name.trim()) {
        errors.push('Tên thiết bị (equipmentName) là bắt buộc và không được để trống.');
    } else {
        const trimmed = name.trim();
        if (trimmed.length < 2) {
            errors.push('Tên thiết bị phải có ít nhất 2 ký tự.');
        } else if (trimmed.length > 100) {
            errors.push('Tên thiết bị không được vượt quá 100 ký tự.');
        } else if (/[<>]/.test(trimmed)) {
            errors.push('Tên thiết bị không được chứa ký tự đặc biệt nguy hiểm (<, >).');
        }
    }

    if (type !== undefined && type !== null) {
        if (typeof type !== 'string') {
            errors.push('Loại thiết bị (type) phải là chuỗi ký tự.');
        } else if (type.trim().length > 50) {
            errors.push('Loại thiết bị không được vượt quá 50 ký tự.');
        }
    }

    let finalStatus = 'Available';
    if (status !== undefined && status !== null && status !== '') {
        const normalized = normalizeStatus(status);
        if (!normalized) {
            errors.push(`Trạng thái thiết bị không hợp lệ. Chỉ chấp nhận một trong các giá trị: ${VALID_EQUIPMENT_STATUSES.join(', ')}.`);
        } else {
            finalStatus = normalized;
        }
    }

    if (errors.length > 0) {
        return { isValid: false, errors, data: null };
    }

    return {
        isValid: true,
        errors: [],
        data: {
            equipmentName: name.trim(),
            type: (type && typeof type === 'string' && type.trim()) ? type.trim() : 'Thiết bị',
            status: finalStatus
        }
    };
}

/**
 * Xác thực dữ liệu cập nhật toàn diện thiết bị (PUT /api/equipments/:id)
 */
function validateUpdateEquipment(body) {
    return validateCreateEquipment(body);
}

/**
 * Xác thực dữ liệu cập nhật trạng thái thiết bị (PATCH /api/equipments/:id/status)
 */
function validatePatchStatus(body) {
    const errors = [];
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { isValid: false, errors: ['Dữ liệu cập nhật trạng thái phải là một đối tượng JSON.'], data: null };
    }

    const status = body.status;
    if (!status || typeof status !== 'string' || !status.trim()) {
        errors.push('Trạng thái thiết bị (status) là bắt buộc.');
        return { isValid: false, errors, data: null };
    }

    const normalized = normalizeStatus(status);
    if (!normalized) {
        errors.push(`Trạng thái thiết bị không hợp lệ. Chỉ chấp nhận một trong các giá trị: ${VALID_EQUIPMENT_STATUSES.join(', ')}.`);
        return { isValid: false, errors, data: null };
    }

    return {
        isValid: true,
        errors: [],
        data: {
            status: normalized
        }
    };
}

/**
 * Middleware xác thực tạo mới thiết bị
 */
function validateCreateEquipmentMiddleware(req, res, next) {
    const result = validateCreateEquipment(req.body);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }
    req.validatedEquipmentBody = result.data;
    next();
}

/**
 * Middleware xác thực cập nhật thiết bị
 */
function validateUpdateEquipmentMiddleware(req, res, next) {
    const result = validateUpdateEquipment(req.body);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }
    req.validatedEquipmentBody = result.data;
    next();
}

/**
 * Middleware xác thực cập nhật trạng thái thiết bị
 */
function validatePatchStatusMiddleware(req, res, next) {
    const result = validatePatchStatus(req.body);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }
    req.validatedPatchStatusBody = result.data;
    next();
}

module.exports = {
    validateAvailableEquipmentsQuery,
    validateAvailableEquipmentsMiddleware,
    validateCreateEquipment,
    validateCreateEquipmentMiddleware,
    validateUpdateEquipment,
    validateUpdateEquipmentMiddleware,
    validatePatchStatus,
    validatePatchStatusMiddleware,
    normalizeStatus,
    VALID_EQUIPMENT_STATUSES,
    parseDateTimeString,
    formatToMySQLDateTime,
    isPositiveInteger
};
