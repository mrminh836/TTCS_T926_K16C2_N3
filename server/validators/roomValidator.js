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

module.exports = {
    ROOM_VALIDATION_CONFIG,
    validateRoomInput,
    validateRoomMiddleware
};
