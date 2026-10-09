/**
 * Validator module cho tính năng Người tham gia cuộc họp (Meeting Participants)
 * và Trạng thái phản hồi (ResponseStatus)
 */

const ALLOWED_RESPONSE_STATUSES = ['Pending', 'Accepted', 'Declined', 'Tentative'];

/**
 * Kiểm tra xem một giá trị có phải là số nguyên dương hay không
 */
function isPositiveInteger(value) {
    if (value === undefined || value === null || value === '') return false;
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
}

/**
 * Validate trạng thái phản hồi
 * @param {string} status 
 * @returns {{ isValid: boolean, error?: string, sanitizedStatus?: string }}
 */
function validateResponseStatus(status) {
    if (!status || typeof status !== 'string') {
        return {
            isValid: false,
            error: `Trạng thái phản hồi (responseStatus) là bắt buộc. Giá trị hợp lệ: ${ALLOWED_RESPONSE_STATUSES.join(', ')}.`
        };
    }

    const trimmed = status.trim();
    // Khớp không phân biệt hoa thường với các giá trị cho phép
    const matched = ALLOWED_RESPONSE_STATUSES.find(s => s.toLowerCase() === trimmed.toLowerCase());

    if (!matched) {
        return {
            isValid: false,
            error: `Trạng thái phản hồi "${trimmed}" không hợp lệ. Giá trị hợp lệ: ${ALLOWED_RESPONSE_STATUSES.join(', ')}.`
        };
    }

    return {
        isValid: true,
        sanitizedStatus: matched
    };
}

/**
 * Validate danh sách ID người tham gia (participantIds)
 * @param {any} participantIds 
 * @returns {{ isValid: boolean, error?: string, cleanIds?: number[] }}
 */
function validateParticipantIds(participantIds) {
    if (!Array.isArray(participantIds)) {
        return {
            isValid: false,
            error: 'Danh sách người tham gia (participantIds) phải là một mảng ID người dùng.'
        };
    }

    if (participantIds.length === 0) {
        return {
            isValid: false,
            error: 'Danh sách người tham gia không được để trống (phải có ít nhất 1 ID).'
        };
    }

    const cleanIds = [];
    for (let i = 0; i < participantIds.length; i++) {
        const id = participantIds[i];
        if (!isPositiveInteger(id)) {
            return {
                isValid: false,
                error: `ID người tham gia tại vị trí [${i}] (${id}) không hợp lệ (phải là số nguyên dương).`
            };
        }
        cleanIds.push(Number(id));
    }

    // Loại bỏ ID trùng lặp
    const uniqueIds = [...new Set(cleanIds)];

    return {
        isValid: true,
        cleanIds: uniqueIds
    };
}

module.exports = {
    ALLOWED_RESPONSE_STATUSES,
    isPositiveInteger,
    validateResponseStatus,
    validateParticipantIds
};
