/**
 * Module kiểm tra và xác thực dữ liệu đầu vào phòng họp (Room Input Validation)
 * Hỗ trợ các quy chuẩn CSDL bảng Rooms (RoomName, Capacity, Status, QRCode, Floor, Type, Equipments)
 */

const ROOM_VALIDATION_CONFIG = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    CAPACITY_MIN: 1,
    CAPACITY_MAX: 500,
    VALID_STATUSES: ['Active', 'Maintenance', 'Inactive'],
    VALID_TYPES: ['Hội nghị', 'Nhóm / Tech', 'Hội trường lớn', 'Đại sảnh / Board', 'VIP / Phỏng vấn']
};

function isPositiveInteger(value) {
    if (value === null || value === undefined || typeof value === 'boolean') {
        return false;
    }
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
}

function validateRoomInput(input) {
    const errors = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return {
            isValid: false,
            errors: ['Dữ liệu phòng họp không hợp lệ (phải là một JSON Object).'],
            data: null
        };
    }

    const {
        roomCode,
        code,
        roomName,
        name,
        capacity,
        floor,
        type,
        status,
        qrCode,
        equipments,
        description
    } = input;

    // 0. Kiểm tra Mã phòng họp (RoomCode) nếu người dùng cung cấp
    const finalCode = (roomCode || code || '').trim();
    if (finalCode) {
        if (finalCode.length < 2 || finalCode.length > 50) {
            errors.push('Mã phòng họp phải có độ dài từ 2 đến 50 ký tự.');
        } else if (!/^[A-Za-z0-9_-]+$/.test(finalCode)) {
            errors.push('Mã phòng họp chỉ được chứa chữ cái, số, dấu gạch nối (-) hoặc dấu gạch dưới (_).');
        }
    }

    // 1. Kiểm tra Tên phòng họp (RoomName)
    const finalName = (roomName || name || '').trim();
    if (!finalName) {
        errors.push('Tên phòng họp là bắt buộc và không được để trống.');
    } else if (finalName.length < ROOM_VALIDATION_CONFIG.NAME_MIN_LENGTH) {
        errors.push(`Tên phòng họp phải có ít nhất ${ROOM_VALIDATION_CONFIG.NAME_MIN_LENGTH} ký tự.`);
    } else if (finalName.length > ROOM_VALIDATION_CONFIG.NAME_MAX_LENGTH) {
        errors.push(`Tên phòng họp không được vượt quá ${ROOM_VALIDATION_CONFIG.NAME_MAX_LENGTH} ký tự.`);
    } else if (/[<>]/.test(finalName)) {
        errors.push('Tên phòng họp không được chứa ký tự đặc biệt nguy hiểm (<, >).');
    }

    // 2. Kiểm tra Sức chứa (Capacity)
    if (capacity === undefined || capacity === null || capacity === '') {
        errors.push('Sức chứa phòng họp là bắt buộc.');
    } else if (!isPositiveInteger(capacity)) {
        errors.push('Sức chứa phòng họp phải là số nguyên dương.');
    } else {
        const capNum = Number(capacity);
        if (capNum < ROOM_VALIDATION_CONFIG.CAPACITY_MIN || capNum > ROOM_VALIDATION_CONFIG.CAPACITY_MAX) {
            errors.push(`Sức chứa phòng họp phải nằm trong khoảng từ ${ROOM_VALIDATION_CONFIG.CAPACITY_MIN} đến ${ROOM_VALIDATION_CONFIG.CAPACITY_MAX} chỗ ngồi.`);
        }
    }

    // 3. Kiểm tra Trạng thái (Status)
    const finalStatus = status || 'Active';
    if (!ROOM_VALIDATION_CONFIG.VALID_STATUSES.includes(finalStatus)) {
        errors.push(`Trạng thái không hợp lệ. Chỉ chấp nhận: ${ROOM_VALIDATION_CONFIG.VALID_STATUSES.join(', ')}.`);
    }

    // 4. Kiểm tra Loại phòng (Type)
    const finalType = type || 'Hội nghị';
    if (!ROOM_VALIDATION_CONFIG.VALID_TYPES.includes(finalType)) {
        errors.push(`Loại phòng không hợp lệ. Chỉ chấp nhận: ${ROOM_VALIDATION_CONFIG.VALID_TYPES.join(', ')}.`);
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
            code: finalCode || null,
            name: finalName,
            capacity: Number(capacity),
            floor: (floor || '').trim(),
            type: finalType,
            status: finalStatus,
            qrCode: qrCode || null,
            equipments: Array.isArray(equipments) ? equipments : [],
            description: (description || '').trim()
        }
    };
}

function validateRoomMiddleware(req, res, next) {
    const result = validateRoomInput(req.body);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }
    req.validatedRoomData = result.data;
    next();
}

/**
 * Định dạng đối tượng Date thành chuỗi chuẩn MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
 */
function formatToMySQLDateTime(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mi = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/**
 * Kiểm tra và chuẩn hóa chuỗi ngày giờ
 */
function parseDateTimeString(dateStr, timeStr) {
    if (!dateStr && !timeStr) return null;

    if (dateStr && timeStr) {
        // Trường hợp truyền riêng date và time: date=2026-10-01, time=09:00
        const cleanDate = dateStr.trim();
        const cleanTime = timeStr.trim();
        const fullStr = cleanTime.length === 5 ? `${cleanDate}T${cleanTime}:00` : `${cleanDate}T${cleanTime}`;
        const d = new Date(fullStr);
        if (!isNaN(d.getTime())) return d;
        // Thử format khoảng trắng
        const spaceStr = cleanTime.length === 5 ? `${cleanDate} ${cleanTime}:00` : `${cleanDate} ${cleanTime}`;
        const d2 = new Date(spaceStr);
        if (!isNaN(d2.getTime())) return d2;
    }

    if (dateStr && !timeStr) {
        const d = new Date(dateStr.trim());
        if (!isNaN(d.getTime())) return d;
    }

    return null;
}

/**
 * Xác thực dữ liệu query tìm kiếm phòng trống theo khoảng thời gian
 * Hỗ trợ các định dạng:
 * 1. startTime & endTime (ISO / YYYY-MM-DD HH:mm:ss)
 * 2. date & startTime & endTime (date=2026-10-01&startTime=09:00&endTime=10:30)
 * 3. Tuỳ chọn minCapacity / capacity, excludeMeetingId
 */
function validateAvailableRoomsQuery(query) {
    const errors = [];

    if (!query || typeof query !== 'object') {
        return {
            isValid: false,
            errors: ['Tham số truy vấn tìm phòng trống không hợp lệ.'],
            data: null
        };
    }

    const {
        date,
        startTime,
        endTime,
        start,
        end,
        minCapacity,
        capacity,
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
                errors.push('Khoảng thời gian kiểm tra phòng trống tối thiểu phải từ 5 phút trở lên.');
            }
        }
    }

    // Kiểm tra sức chứa tối thiểu (nếu có)
    let parsedMinCapacity = null;
    const rawCap = minCapacity || capacity;
    if (rawCap !== undefined && rawCap !== null && rawCap !== '') {
        if (!isPositiveInteger(rawCap)) {
            errors.push('Sức chứa tối thiểu (minCapacity/capacity) phải là số nguyên dương.');
        } else {
            parsedMinCapacity = Number(rawCap);
        }
    }

    // Kiểm tra excludeMeetingId (nếu có)
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
            minCapacity: parsedMinCapacity,
            excludeMeetingId: parsedExcludeId
        }
    };
}

/**
 * Express Middleware xác thực query params tìm phòng trống
 */
function validateAvailableRoomsMiddleware(req, res, next) {
    const result = validateAvailableRoomsQuery(req.query);
    if (!result.isValid) {
        return res.status(400).json({
            success: false,
            message: result.errors[0],
            errors: result.errors
        });
    }
    req.validatedAvailableQuery = result.data;
    next();
}

/**
 * Express Middleware kiểm tra tính hợp lệ của ID phòng họp trên URL param (:id)
 */
function validateRoomIdMiddleware(req, res, next) {
    const idParam = req.params.id;
    if (idParam === undefined || idParam === null || String(idParam).trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'ID phòng họp không hợp lệ (phải là số nguyên dương).'
        });
    }

    const trimmed = String(idParam).trim();
    if (!/^\d+$/.test(trimmed)) {
        return res.status(400).json({
            success: false,
            message: 'ID phòng họp không hợp lệ (phải là số nguyên dương).'
        });
    }

    const num = Number(trimmed);
    if (!Number.isInteger(num) || num <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID phòng họp không hợp lệ (phải là số nguyên dương).'
        });
    }

    req.roomId = num;
    next();
}

module.exports = {
    ROOM_VALIDATION_CONFIG,
    isPositiveInteger,
    validateRoomInput,
    validateRoomMiddleware,
    validateRoomIdMiddleware,
    validateAvailableRoomsQuery,
    validateAvailableRoomsMiddleware,
    formatToMySQLDateTime
};


