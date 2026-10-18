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

const bcrypt = require('bcryptjs');
const { validateUpdateProfile } = require('../validators/profileValidator');

/**
 * GET /api/users/profile
 * Lấy thông tin tài khoản cá nhân của người dùng đang đăng nhập
 */
const getProfile = async (req, res, next) => {
    try {
        const userId = Number(req.user?.userId || req.user?.id);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được danh tính người dùng từ token.'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin tài khoản người dùng.'
            });
        }

        const stats = await User.getUserMeetingStats(userId);

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin tài khoản cá nhân thành công.',
            data: {
                ...user,
                stats
            }
        });
    } catch (error) {
        console.error('[User Controller] Lỗi khi lấy profile:', error);
        next(error);
    }
};

/**
 * PUT /api/users/profile
 * Cập nhật thông tin tài khoản cá nhân & đổi mật khẩu
 */
const updateProfile = async (req, res, next) => {
    try {
        const userId = Number(req.user?.userId || req.user?.id);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được danh tính người dùng từ token.'
            });
        }

        const currentUser = await User.findById(userId, { includePassword: true });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin tài khoản người dùng.'
            });
        }

        const validation = validateUpdateProfile(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0],
                errors: validation.errors
            });
        }

        const { fullName, email, department, currentPassword, newPassword } = validation.sanitized;

        // 1. Nếu thay đổi email, kiểm tra trùng lặp email với tài khoản khác
        if (email && email.toLowerCase() !== (currentUser.email || '').toLowerCase()) {
            const existingEmailUser = await User.findByEmail(email);
            if (existingEmailUser && Number(existingEmailUser.userId) !== userId) {
                return res.status(409).json({
                    success: false,
                    message: 'Địa chỉ email này đã được sử dụng bởi một tài khoản khác.',
                    errors: ['Email đã tồn tại trong hệ thống.']
                });
            }
        }

        // 2. Nếu có yêu cầu đổi mật khẩu
        let passwordChanged = false;
        if (newPassword && currentPassword) {
            // Đối chiếu mật khẩu hiện tại với hash trong CSDL
            const isMatch = await bcrypt.compare(currentPassword, currentUser.PasswordHash || '');
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu hiện tại không chính xác.',
                    errors: ['Mật khẩu hiện tại nhập vào không khớp với mật khẩu đang lưu trữ.']
                });
            }

            // Băm mật khẩu mới bằng BCrypt
            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            await User.updatePassword(userId, newPasswordHash);
            passwordChanged = true;
        }

        // 3. Cập nhật thông tin cá nhân (FullName, Email, Department)
        const updateFields = {};
        if (fullName !== undefined) updateFields.fullName = fullName;
        if (email !== undefined) updateFields.email = email;
        if (department !== undefined) updateFields.department = department;

        const updatedUser = await User.updateProfile(userId, updateFields);
        const stats = await User.getUserMeetingStats(userId);

        const responseMessage = passwordChanged
            ? 'Cập nhật thông tin tài khoản và đổi mật khẩu thành công.'
            : 'Cập nhật thông tin tài khoản thành công.';

        return res.status(200).json({
            success: true,
            message: responseMessage,
            data: {
                ...updatedUser,
                stats
            }
        });

    } catch (error) {
        console.error('[User Controller] Lỗi khi cập nhật profile:', error);
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    getProfile,
    updateProfile
};
