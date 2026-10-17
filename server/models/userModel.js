/**
 * Model quản lý Người dùng / Nhân viên (User Model)
 * Tương tác CSDL MySQL bảng Users chuẩn Enterprise và cung cấp Fallback an toàn.
 * Phục vụ nghiệp vụ: Xác thực đăng ký/đăng nhập (Auth), chọn người tổ chức cuộc họp (Organizer),
 * người tham gia (Participants) và phân công nhiệm vụ.
 */

const db = require('../config/database');

// Hash chuẩn BCrypt cho mật khẩu mặc định "Password123" phục vụ môi trường Fallback/Test
const DEFAULT_FALLBACK_PASSWORD_HASH = '$2b$10$9Vx3g97.Yj135dHeRacwN.x3hOC72c8fYKATQCrzxsXwL2pSyg0lS';

// Danh sách người dùng dự phòng (Fallback khi môi trường chưa kết nối MySQL)
const mockUsersFallback = [
    { userId: 1, username: "admin", fullName: "Nguyễn Văn Quản Trị", email: "admin@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Admin", department: "Quản trị", createdAt: "2026-09-01 08:00:00" },
    { userId: 2, username: "secretary", fullName: "Trần Thị Thư Ký", email: "secretary@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Secretary", department: "Hành chính", createdAt: "2026-09-01 08:00:00" },
    { userId: 3, username: "manager", fullName: "Lê Văn Trưởng Phòng", email: "manager@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Manager", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 4, username: "employee", fullName: "Phạm Hoàng Nhân Viên", email: "employee@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 5, username: "minh.dq", fullName: "Đỗ Quang Minh", email: "minh.dq@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Manager", department: "Quản trị", createdAt: "2026-09-01 08:00:00" },
    { userId: 6, username: "manh.dn", fullName: "Đoàn Ngọc Mạnh", email: "manh.dn@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 7, username: "manh.dd", fullName: "Đào Đức Mạnh", email: "manh.dd@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 8, username: "khanh.hm", fullName: "Hoàng Minh Khánh", email: "khanh.hm@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 9, username: "luong.nm", fullName: "Nguyễn Minh Lượng", email: "luong.nm@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" },
    { userId: 10, username: "khuyen.hv", fullName: "Hoàng Văn Khuyến", email: "khuyen.hv@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Employee", department: "Kiểm thử", createdAt: "2026-09-01 08:00:00" },
    { userId: 11, username: "khanh.tq", fullName: "Triệu Quốc Khánh", email: "khanh.tq@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Employee", department: "Kiểm thử", createdAt: "2026-09-01 08:00:00" },
    { userId: 12, username: "ngan.vt", fullName: "Vũ Thị Thanh Ngân", email: "ngan.vt@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Employee", department: "Thiết kế", createdAt: "2026-09-01 08:00:00" },
    { userId: 13, username: "khai.nd", fullName: "Ngô Đức Khải", email: "khai.nd@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Employee", department: "Kiểm thử", createdAt: "2026-09-01 08:00:00" },
    { userId: 14, username: "nguyen.hs", fullName: "Hà Sỹ Nguyên", email: "nguyen.hs@enterprise.vn", passwordHash: DEFAULT_FALLBACK_PASSWORD_HASH, role: "Employee", department: "Kỹ thuật", createdAt: "2026-09-01 08:00:00" }
];

/**
 * Format một bản ghi người dùng thành dạng chuẩn an toàn cho Client/API
 * Tuyệt đối KHÔNG trả về PasswordHash hay Password
 */
function formatUserRow(row) {
    if (!row) return null;
    const userId = Number(row.UserID !== undefined ? row.UserID : (row.userId !== undefined ? row.userId : row.id));
    const username = row.Username || row.username || (row.Email ? row.Email.split('@')[0] : (row.email ? row.email.split('@')[0] : '')) || '';
    const fullName = row.FullName || row.fullName || row.name || username;
    const email = row.Email || row.email || '';
    const role = row.Role || row.role || 'USER';
    const department = row.Department || row.department || (role === 'Admin' || role === 'Manager' ? 'Quản lý' : 'Kỹ thuật');
    const createdAt = row.CreatedAt || row.createdAt || null;

    return {
        userId,
        id: userId, // tương thích với component dùng field id
        username,
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
     * @param {string} [filters.role] - Vai trò nhân viên (Admin, Manager, Employee, Secretary, USER...)
     * @returns {Promise<Array>} Danh sách nhân viên an toàn (không có PasswordHash)
     */
    findAll: async (filters = {}) => {
        const { search, role } = filters;

        try {
            let sql = `
                SELECT UserID, Username, FullName, Email, Role, CreatedAt
                FROM Users
                WHERE 1=1
            `;
            const params = [];

            if (role && role.trim()) {
                sql += ` AND LOWER(Role) = LOWER(?)`;
                params.push(role.trim());
            }

            if (search && search.trim()) {
                sql += ` AND (LOWER(FullName) LIKE LOWER(?) OR LOWER(Email) LIKE LOWER(?) OR LOWER(Username) LIKE LOWER(?))`;
                const term = `%${search.trim()}%`;
                params.push(term, term, term);
            }

            sql += ` ORDER BY UserID ASC`;

            const [rows] = await db.query(sql, params);
            return rows.map(formatUserRow);

        } catch (error) {
            console.warn('[User Model] CSDL không khả dụng hoặc lỗi truy vấn, chuyển sang Mock Fallback:', error.message);

            let results = [...mockUsersFallback];

            if (role && role.trim()) {
                results = results.filter(u => u.role.toLowerCase() === role.trim().toLowerCase());
            }

            if (search && search.trim()) {
                const term = search.trim().toLowerCase();
                results = results.filter(u =>
                    (u.fullName && u.fullName.toLowerCase().includes(term)) ||
                    (u.email && u.email.toLowerCase().includes(term)) ||
                    (u.username && u.username.toLowerCase().includes(term))
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
                SELECT UserID, Username, FullName, Email, Role, CreatedAt
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
    },

    /**
     * Tìm người dùng theo Username chính xác (không phân biệt hoa thường)
     * @param {string} username
     * @returns {Promise<Object|null>}
     */
    findByUsername: async (username) => {
        if (!username || typeof username !== 'string') return null;
        const normalized = username.trim().toLowerCase();

        try {
            const sql = `
                SELECT UserID, Username, FullName, Email, Role, CreatedAt
                FROM Users
                WHERE LOWER(Username) = ?
                LIMIT 1
            `;
            const [rows] = await db.query(sql, [normalized]);
            if (rows && rows.length > 0) {
                return formatUserRow(rows[0]);
            }
            return null;
        } catch (error) {
            console.warn(`[User Model] findByUsername(${normalized}) chuyển sang Fallback:`, error.message);
            const found = mockUsersFallback.find(u => (u.username && u.username.toLowerCase() === normalized));
            return found ? formatUserRow(found) : null;
        }
    },

    /**
     * Tìm người dùng theo Email chính xác (không phân biệt hoa thường)
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    findByEmail: async (email) => {
        if (!email || typeof email !== 'string') return null;
        const normalized = email.trim().toLowerCase();

        try {
            const sql = `
                SELECT UserID, Username, FullName, Email, Role, CreatedAt
                FROM Users
                WHERE LOWER(Email) = ?
                LIMIT 1
            `;
            const [rows] = await db.query(sql, [normalized]);
            if (rows && rows.length > 0) {
                return formatUserRow(rows[0]);
            }
            return null;
        } catch (error) {
            console.warn(`[User Model] findByEmail(${normalized}) chuyển sang Fallback:`, error.message);
            const found = mockUsersFallback.find(u => (u.email && u.email.toLowerCase() === normalized));
            return found ? formatUserRow(found) : null;
        }
    },

    /**
     * Tìm người dùng theo Username hoặc Email (phục vụ đăng nhập)
     * @param {string} identifier - Username hoặc Email
     * @param {Object} [options]
     * @param {boolean} [options.includePassword=false] - Trả về PasswordHash để đối soát BCrypt
     * @returns {Promise<Object|null>}
     */
    findByUsernameOrEmail: async (identifier, options = { includePassword: false }) => {
        if (!identifier || typeof identifier !== 'string') return null;
        const term = identifier.trim().toLowerCase();

        try {
            const sql = `
                SELECT UserID, Username, FullName, Email, PasswordHash, Role, CreatedAt
                FROM Users
                WHERE LOWER(Username) = ? OR LOWER(Email) = ?
                LIMIT 1
            `;
            const [rows] = await db.query(sql, [term, term]);
            if (rows && rows.length > 0) {
                const row = rows[0];
                const safeUser = formatUserRow(row);
                if (options.includePassword) {
                    return {
                        ...safeUser,
                        PasswordHash: row.PasswordHash
                    };
                }
                return safeUser;
            }
            return null;
        } catch (error) {
            console.warn(`[User Model] findByUsernameOrEmail(${term}) chuyển sang Fallback:`, error.message);
            const found = mockUsersFallback.find(u =>
                (u.username && u.username.toLowerCase() === term) ||
                (u.email && u.email.toLowerCase() === term)
            );
            if (!found) return null;

            const safeUser = formatUserRow(found);
            if (options.includePassword) {
                return {
                    ...safeUser,
                    PasswordHash: found.passwordHash || found.PasswordHash || DEFAULT_FALLBACK_PASSWORD_HASH
                };
            }
            return safeUser;
        }
    },

    /**
     * Tạo tài khoản người dùng mới (đăng ký)
     * @param {Object} userData
     * @param {string} userData.username
     * @param {string} userData.fullName
     * @param {string} userData.email
     * @param {string} userData.passwordHash - Đã được băm bằng BCrypt
     * @param {string} [userData.role='USER']
     * @returns {Promise<Object>} Safe user object
     */
    create: async (userData) => {
        const { username, fullName, email, passwordHash, role = 'USER' } = userData;

        try {
            const sql = `
                INSERT INTO Users (Username, FullName, Email, PasswordHash, Role)
                VALUES (?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(sql, [
                username.toLowerCase().trim(),
                fullName ? fullName.trim() : username.trim(),
                email.toLowerCase().trim(),
                passwordHash,
                role
            ]);

            const insertedId = result.insertId;
            return await User.findById(insertedId);

        } catch (error) {
            console.warn('[User Model] create() chuyển sang Fallback:', error.message);

            const newId = mockUsersFallback.length > 0
                ? Math.max(...mockUsersFallback.map(u => u.userId || 0)) + 1
                : 1;

            const newRecord = {
                userId: newId,
                username: username.toLowerCase().trim(),
                fullName: fullName ? fullName.trim() : username.trim(),
                email: email.toLowerCase().trim(),
                passwordHash,
                role: role || 'USER',
                department: 'Thành viên',
                createdAt: new Date().toISOString()
            };

            mockUsersFallback.push(newRecord);
            return formatUserRow(newRecord);
        }
    }
};

module.exports = User;
