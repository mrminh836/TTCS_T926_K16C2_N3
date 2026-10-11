/**
 * Model quản lý Người dùng / Nhân viên (User Model)
 * Tương tác CSDL MySQL bảng Users chuẩn Enterprise và cung cấp Fallback an toàn.
 * Phục vụ nghiệp vụ: chọn người tổ chức cuộc họp (Organizer), người tham gia (Participants) và phân công nhiệm vụ.
 */

const db = require('../config/database');

// Danh sách người dùng dự phòng (Fallback khi môi trường chưa kết nối MySQL)
const mockUsersFallback = [
    { userId: 1, fullName: "Nguyễn Văn Quản Trị", email: "admin@enterprise.vn", role: "Admin", department: "Quản trị", createdAt: "2026-09-01 08:00:00" },
    { userId: 2, fullName: "Trần Thị Thư Ký", email: "secretary@enterprise.vn", role: "Secretary", department: "Hành chính", createdAt: "2026-09-01 08:00:00" },
    { userId: 3, fullName: "Lê Văn Trưởng Phòng", email: "manager@enterprise.vn", role: "Manager", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 4, fullName: "Phạm Hoàng Nhân Viên", email: "employee@enterprise.vn", role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 5, fullName: "Đỗ Quang Minh", email: "minh.dq@enterprise.vn", role: "Manager", department: "Quản trị", createdAt: "2026-09-01 08:00:00" },
    { userId: 6, fullName: "Đoàn Ngọc Mạnh", email: "manh.dn@enterprise.vn", role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 7, fullName: "Đào Đức Mạnh", email: "manh.dd@enterprise.vn", role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 8, fullName: "Hoàng Minh Khánh", email: "khanh.hm@enterprise.vn", role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 9, fullName: "Nguyễn Minh Lượng", email: "luong.nm@enterprise.vn", role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 10, fullName: "Hoàng Văn Khuyến", email: "khuyen.hv@enterprise.vn", role: "Employee", department: "Kiểm thử", createdAt: "2026-09-01 08:00:00" },
    { userId: 11, fullName: "Triệu Quốc Khánh", email: "khanh.tq@enterprise.vn", role: "Employee", department: "Kiểm thử", createdAt: "2026-09-01 08:00:00" },
    { userId: 12, fullName: "Vũ Thị Thanh Ngân", email: "ngan.vt@enterprise.vn", role: "Employee", department: "Thiết kế", createdAt: "2026-09-01 08:00:00" },
    { userId: 13, fullName: "Ngô Đức Khải", email: "khai.nd@enterprise.vn", role: "Employee", department: "Kiểm thử", createdAt: "2026-09-01 08:00:00" },
    { userId: 14, fullName: "Hà Sỹ Nguyên", email: "nguyen.hs@enterprise.vn", role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" }
];

/**
 * Format một bản ghi người dùng thành dạng chuẩn API
 * Đảm bảo tuyệt đối KHÔNG bao gồm PasswordHash
 */
function formatUserRow(row) {
    if (!row) return null;
    const userId = Number(row.UserID !== undefined ? row.UserID : (row.userId !== undefined ? row.userId : row.id));
    const fullName = row.FullName || row.fullName || row.name || '';
    const email = row.Email || row.email || '';
    const role = row.Role || row.role || 'Employee';
    const department = row.Department || row.department || (role === 'Admin' || role === 'Manager' ? 'Quản lý' : 'Kỹ thuật');
    const createdAt = row.CreatedAt || row.createdAt || null;

    return {
        userId,
        id: userId, // tương thích với component dùng field id
        fullName,
        name: fullName, // tương thích với component dùng field name
        email,
        role,
        department,
        createdAt
    };
}

const User = {
    /**
     * Lấy toàn bộ danh sách nhân viên phục vụ mời họp / phân công
     * Hỗ trợ bộ lọc tìm kiếm theo từ khóa và vai trò
     * @param {Object} filters
     * @param {string} [filters.search] - Từ khóa tìm theo họ tên hoặc email
     * @param {string} [filters.role] - Vai trò nhân viên (Admin, Manager, Employee, Secretary...)
     * @returns {Promise<Array>} Danh sách nhân viên an toàn (không có PasswordHash)
     */
    findAll: async (filters = {}) => {
        const { search, role } = filters;

        try {
            let sql = `
                SELECT UserID, FullName, Email, Role, CreatedAt
                FROM Users
                WHERE 1=1
            `;
            const params = [];

            if (role && role.trim()) {
                sql += ` AND LOWER(Role) = LOWER(?)`;
                params.push(role.trim());
            }

            if (search && search.trim()) {
                sql += ` AND (LOWER(FullName) LIKE LOWER(?) OR LOWER(Email) LIKE LOWER(?))`;
                const term = `%${search.trim()}%`;
                params.push(term, term);
            }

            sql += ` ORDER BY UserID ASC`;

            const [rows] = await db.query(sql, params);
            return rows.map(formatUserRow);

        } catch (error) {
            // Khi MySQL offline hoặc đang chạy môi trường test không có DB
            console.warn('[User Model] CSDL không khả dụng hoặc lỗi truy vấn, chuyển sang Mock Fallback:', error.message);

            let results = [...mockUsersFallback];

            if (role && role.trim()) {
                results = results.filter(u => u.role.toLowerCase() === role.trim().toLowerCase());
            }

            if (search && search.trim()) {
                const term = search.trim().toLowerCase();
                results = results.filter(u =>
                    u.fullName.toLowerCase().includes(term) ||
                    u.email.toLowerCase().includes(term)
                );
            }

            return results.map(formatUserRow);
        }
    },

    /**
     * Lấy chi tiết thông tin nhân viên theo UserID
     * @param {number|string} userId
     * @returns {Promise<Object|null>}
     */
    findById: async (userId) => {
        const id = Number(userId);
        if (isNaN(id) || id <= 0) return null;

        try {
            const sql = `
                SELECT UserID, FullName, Email, Role, CreatedAt
                FROM Users
                WHERE UserID = ?
                LIMIT 1
            `;
            const [rows] = await db.query(sql, [id]);
            if (rows && rows.length > 0) {
                return formatUserRow(rows[0]);
            }
            return null;
        } catch (error) {
            console.warn(`[User Model] findById(${id}) chuyển sang Fallback:`, error.message);
            const found = mockUsersFallback.find(u => u.userId === id);
            return found ? formatUserRow(found) : null;
        }
    }
};

module.exports = User;
