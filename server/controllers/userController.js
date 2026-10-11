/**
 * Controller xử lý các yêu cầu liên quan đến Người dùng / Nhân viên (User Controller)
 * Cung cấp API GET /api/users phục vụ:
 * - Chọn người tổ chức cuộc họp (Organizer)
 * - Chọn danh sách đồng nghiệp tham gia (Participants)
 * - Phân công nhiệm vụ và trách nhiệm
 */

const User = require('../models/userModel');

/**
 * GET /api/users
 * Lấy danh sách nhân viên trong hệ thống
 * Query params hỗ trợ:
 *   - search: Tìm kiếm theo tên hoặc email
 *   - q / keyword: Alias cho search
 *   - role: Lọc theo vai trò (Admin, Manager, Employee, Secretary...)
 */
const getUsers = async (req, res, next) => {
    try {
        const search = req.query.search || req.query.q || req.query.keyword || '';
        const role = req.query.role || '';

        const users = await User.findAll({ search, role });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách nhân viên thành công.',
            total: users.length,
            data: users
        });
    } catch (error) {
        console.error('[User Controller] Lỗi khi lấy danh sách nhân viên:', error);
        next(error);
    }
};

/**
 * GET /api/users/:id
 * Lấy thông tin chi tiết một nhân viên theo ID
 */
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy nhân viên với ID: ${id}`
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin nhân viên thành công.',
            data: user
        });
    } catch (error) {
        console.error(`[User Controller] Lỗi khi lấy nhân viên ${req.params.id}:`, error);
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById
};
