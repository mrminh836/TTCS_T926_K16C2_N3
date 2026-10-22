/**
 * ==============================================================================
 * ERROR HANDLING MIDDLEWARE TẬP TRUNG (CENTRALIZED ERROR HANDLER)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 * ==============================================================================
 *
 * Chuẩn hóa phản hồi API cho toàn bộ hệ thống:
 * 1. Cấu trúc chuẩn RESTful đồng bộ:
 *    {
 *       "success": false,
 *       "message": "Thông điệp lỗi thân thiện cho người dùng",
 *       "errors": ["Chi tiết lỗi 1", "Chi tiết lỗi 2"],
 *       "data": null,
 *       "code": "MÃ_LỖI",
 *       "timestamp": "ISO Date"
 *    }
 * 2. Phân loại và xử lý đặc thù:
 *    - Lỗi vi phạm ràng buộc CSDL MySQL (ER_DUP_ENTRY, ER_NO_REFERENCED_ROW...)
 *    - Lỗi cú pháp JSON Body (SyntaxError)
 *    - Lỗi xác thực JWT (JsonWebTokenError, TokenExpiredError)
 *    - Lỗi nghiệp vụ tùy biến (AppError)
 *    - Lỗi Route không tồn tại (404 Not Found)
 */

class AppError extends Error {
    /**
     * Khởi tạo lỗi nghiệp vụ tùy biến
     * @param {string} message - Thông điệp lỗi
     * @param {number} [statusCode=500] - Mã HTTP Status
     * @param {Array<string>|string} [errors=[]] - Chi tiết các lỗi
     * @param {string} [code='APP_ERROR'] - Mã định danh lỗi hệ thống
     */
    constructor(message, statusCode = 500, errors = [], code = 'APP_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode; // tương thích ngược
        this.errors = Array.isArray(errors) ? errors : (errors ? [String(errors)] : []);
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Xử lý Route 404 Not Found
 */
function notFoundHandler(req, res) {
    return res.status(404).json({
        success: false,
        message: `Tuyến đường không tồn tại: ${req.method} ${req.originalUrl}`,
        errors: [`Endpoint ${req.method} ${req.originalUrl} không được hỗ trợ bởi hệ thống.`],
        data: null,
        code: 404,
        timestamp: new Date().toISOString()
    });
}

/**
 * Middleware bắt lỗi toàn cục
 */
function errorHandler(err, req, res, next) {
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Đã xảy ra sự cố nội bộ trên máy chủ.';
    let errors = Array.isArray(err.errors) ? err.errors : [];
    let code = err.code || statusCode;

    // 1. Xử lý lỗi CSDL MySQL: Trùng lặp khóa UNIQUE (Duplicate Entry - ER_DUP_ENTRY / 1062)
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        statusCode = 409;
        code = 409;
        const rawMsg = err.sqlMessage || err.message || '';

        if (rawMsg.toLowerCase().includes('username') || rawMsg.toLowerCase().includes('key \'users.username\'')) {
            message = 'Tên đăng nhập đã được sử dụng bởi người dùng khác.';
            errors = ['Vui lòng chọn một tên đăng nhập khác.'];
        } else if (rawMsg.toLowerCase().includes('email') || rawMsg.toLowerCase().includes('key \'users.email\'')) {
            message = 'Địa chỉ email đã được đăng ký trong hệ thống.';
            errors = ['Vui lòng nhập một địa chỉ email chưa từng đăng ký.'];
        } else if (rawMsg.toLowerCase().includes('roomcode') || rawMsg.toLowerCase().includes('roomname')) {
            message = 'Mã phòng hoặc tên phòng họp đã tồn tại.';
            errors = ['Vui lòng kiểm tra lại mã phòng hoặc tên phòng họp.'];
        } else {
            message = 'Dữ liệu đã tồn tại trong hệ thống (vi phạm khóa duy nhất).';
            errors = [rawMsg];
        }
    }

    // 2. Xử lý lỗi Khóa ngoại MySQL (Foreign Key Constraint - ER_NO_REFERENCED_ROW_2 / ER_ROW_IS_REFERENCED_2)
    else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
        statusCode = 400;
        code = 400;
        message = 'Dữ liệu tham chiếu không tồn tại trong hệ thống.';
        errors = [err.sqlMessage || 'Bản ghi liên kết (phòng họp, người tổ chức, hoặc thiết bị) không hợp lệ.'];
    } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
        statusCode = 409;
        code = 409;
        message = 'Không thể xóa bản ghi vì đang có dữ liệu liên kết khác trong hệ thống.';
        errors = [err.sqlMessage || 'Vui lòng hủy hoặc xóa các liên kết trước khi thực hiện xóa bản ghi này.'];
    }

    // 3. Xử lý lỗi cú pháp JSON Body gửi lên từ client
    else if (err instanceof SyntaxError || (err.status === 400 && 'body' in err)) {
        statusCode = 400;
        code = 400;
        message = 'Định dạng dữ liệu JSON gửi lên không hợp lệ.';
        errors = ['Vui lòng kiểm tra cú pháp JSON trong Request Body.'];
    }

    // 4. Xử lý lỗi xác thực JWT
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 401;
        message = 'Token xác thực không hợp lệ hoặc đã bị chỉnh sửa.';
        errors = ['Vui lòng đăng nhập lại để nhận token mới.'];
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 401;
        message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        errors = ['Token đã quá thời hạn sử dụng.'];
    }

    // Ghi log chi tiết lỗi nếu là lỗi 500
    if (statusCode >= 500) {
        console.error(`[Error Handler 500] ${req.method} ${req.originalUrl}:`, err);
    }

    // Chuẩn hóa phản hồi JSON đồng bộ cho toàn bộ hệ thống
    return res.status(statusCode).json({
        success: false,
        message,
        errors: errors.length > 0 ? errors : [message],
        data: null,
        code,
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    AppError,
    notFoundHandler,
    errorHandler
};
