/**
 * Middleware Xác thực JWT và Phân quyền theo Role (Authentication & RBAC Middleware)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (ICTU Meeting - TTCS_T926_K16C2_N3)
 *
 * Cung cấp:
 * 1. verifyJWT: Xác thực JWT Bearer Token, kiểm tra chữ ký & thời hạn, gán req.user an toàn
 * 2. requireRole: Kiểm tra vai trò người dùng (Admin, Manager, Employee, Secretary, USER...)
 * 3. requireMeetingOwnerOrAdmin: Kiểm tra quyền sở hữu cuộc họp (Organizer) hoặc quyền Quản trị
 * 4. requireSelfOrMeetingOwnerOrAdmin: Kiểm tra quyền cập nhật trạng thái phản hồi tham gia họp
 */

const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

/**
 * 1. Middleware Xác thực JWT Token (verifyJWT)
 * - Đọc token từ header "Authorization: Bearer <token>"
 * - Kiểm tra định dạng hợp lệ
 * - Xác minh chữ ký bằng jsonwebtoken.verify() và authConfig.jwtSecret (process.env.JWT_SECRET)
 * - Kiểm tra thời hạn token và điều kiện an toàn
 * - Gán req.user (chỉ thông tin an toàn: userId, username, email, role)
 * - Trả về 401 Unauthorized nếu token thiếu, sai định dạng, không hợp lệ hoặc hết hạn
 */
function verifyJWT(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.headers['x-access-token'];

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Yêu cầu token xác thực. Vui lòng cung cấp Authorization header.'
        });
    }

    let token = '';
    if (typeof authHeader === 'string') {
        const parts = authHeader.trim().split(/\s+/);
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
            token = parts[1];
        } else if (parts.length === 1 && !authHeader.toLowerCase().startsWith('bearer')) {
            // Hỗ trợ token trực tiếp (ví dụ qua x-access-token)
            token = parts[0];
        } else {
            return res.status(401).json({
                success: false,
                message: 'Định dạng token không hợp lệ. Vui lòng sử dụng Bearer <token>.'
            });
        }
    }

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
        return res.status(401).json({
            success: false,
            message: 'Token xác thực không hợp lệ hoặc bị trống.'
        });
    }

    try {
        // Xác minh chữ ký và thời hạn token bằng JWT_SECRET
        const decoded = jwt.verify(token, authConfig.jwtSecret);

        // Gán thông tin người dùng đã xác thực vào req.user (tuyệt đối không chứa password/hash)
        const userId = Number(decoded.userId !== undefined ? decoded.userId : decoded.id);
        req.user = {
            userId: !isNaN(userId) ? userId : decoded.userId,
            id: !isNaN(userId) ? userId : decoded.id,
            username: decoded.username || '',
            email: decoded.email || '',
            role: decoded.role || ''
        };

        next();
    } catch (error) {
        // Phân loại lỗi token một cách an toàn, không để lộ stack trace hay secret
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token xác thực đã hết hạn.'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token xác thực không hợp lệ hoặc chữ ký bị sai lệch.'
        });
    }
}

/**
 * 2. Middleware Phân quyền theo vai trò (requireRole)
 * @param  {...(string|string[])} allowedRoles - Danh sách các vai trò được cấp quyền (Admin, Manager, Employee...)
 * - Kiểm tra req.user đã được xác thực chưa
 * - Kiểm tra role của req.user có thuộc allowedRoles (không phân biệt hoa/thường)
 * - Trả về 401 nếu chưa xác thực
 * - Trả về 403 nếu đã xác thực nhưng không đủ quyền
 * - Ngăn chặn nâng quyền bằng request body/query/header
 */
function requireRole(...allowedRoles) {
    const flatRoles = allowedRoles.flat().filter(Boolean);
    const normalizedAllowed = flatRoles.map(r => String(r).trim().toLowerCase());

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: 'Chưa xác thực danh tính người dùng.'
            });
        }

        const userRole = String(req.user.role).trim().toLowerCase();
        if (!userRole || !normalizedAllowed.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này.'
            });
        }

        next();
    };
}

/**
 * 3. Middleware Kiểm tra quyền sở hữu cuộc họp hoặc quyền Quản trị (requireMeetingOwnerOrAdmin)
 * - Admin hoặc Manager có quyền quản lý mọi cuộc họp
 * - Nhân viên (Employee / USER) chỉ được chỉnh sửa hoặc quản lý thành viên cuộc họp do chính mình tổ chức (OrganizerID)
 */
async function requireMeetingOwnerOrAdmin(req, res, next) {
    if (!req.user || !req.user.role) {
        return res.status(401).json({
            success: false,
            message: 'Chưa xác thực danh tính người dùng.'
        });
    }

    const userRole = String(req.user.role).trim().toLowerCase();
    // Admin và Manager có toàn quyền quản trị
    if (userRole === 'admin' || userRole === 'manager') {
        return next();
    }

    const meetingId = parseInt(req.params.id, 10);
    if (isNaN(meetingId) || meetingId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID cuộc họp không hợp lệ.'
        });
    }

    try {
        const Meeting = require('../models/meetingModel');
        const meeting = await Meeting.getById(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: `Cuộc họp với ID ${meetingId} không tồn tại.`
            });
        }

        const organizerId = Number(meeting.OrganizerID || meeting.organizerId);
        const currentUserId = Number(req.user.userId || req.user.id);

        if (organizerId !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa cuộc họp của người khác.'
            });
        }

        req.meeting = meeting;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền hạn cuộc họp.'
        });
    }
}

/**
 * 4. Middleware Kiểm tra quyền cập nhật trạng thái phản hồi tham dự (requireSelfOrMeetingOwnerOrAdmin)
 * - Người tham dự được phép cập nhật trạng thái (Accepted/Declined...) của chính mình
 * - Admin hoặc Manager có quyền can thiệp cập nhật cho người khác
 */
async function requireSelfOrMeetingOwnerOrAdmin(req, res, next) {
    if (!req.user || !req.user.role) {
        return res.status(401).json({
            success: false,
            message: 'Chưa xác thực danh tính người dùng.'
        });
    }

    const currentUserId = Number(req.user.userId || req.user.id);
    const targetUserId = Number(req.params.userId);

    // Người tham gia cập nhật cho chính mình
    if (!isNaN(currentUserId) && !isNaN(targetUserId) && currentUserId === targetUserId) {
        return next();
    }

    const userRole = String(req.user.role).trim().toLowerCase();
    if (userRole === 'admin' || userRole === 'manager') {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể cập nhật trạng thái tham dự của chính mình.'
    });
}

module.exports = {
    verifyJWT,
    authenticateToken: verifyJWT, // Alias tương thích ngược cho các module hiện có
    requireRole,
    requireMeetingOwnerOrAdmin,
    requireSelfOrMeetingOwnerOrAdmin
};
