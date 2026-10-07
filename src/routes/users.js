const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * GET /api/users
 * Lấy danh sách nhân viên, hỗ trợ tìm kiếm theo tên/email và lọc theo phòng ban.
 *
 * Query params:
 *   - search: string (tìm theo full_name hoặc email)
 *   - departmentId: number (lọc theo phòng ban)
 *   - limit: number (giới hạn kết quả, mặc định 50)
 *
 * BUG FIX so với code gốc:
 *   - Thêm `db` import thay vì sử dụng biến global
 *   - Dùng parseInt cho departmentId để tránh lỗi SQL injection
 *   - Đảm bảo limit là số nguyên hợp lệ
 */
router.get('/', async (req, res) => {
  try {
    const { search, departmentId, limit = 50 } = req.query;

    let query = db('Users')
      .select(
        'id',
        'full_name as fullName',
        'email',
        'avatar_url as avatar',
        'department_id as departmentId'
      )
      .where('status', 'ACTIVE');

    if (search) {
      // FIX: Sử dụng function(builder) thay vì arrow function
      // để tránh lỗi `this` context trong một số phiên bản Knex
      query = query.andWhere(function () {
        this.where('full_name', 'like', `%${search}%`)
            .orWhere('email', 'like', `%${search}%`);
      });
    }

    if (departmentId) {
      query = query.andWhere('department_id', parseInt(departmentId));
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const users = await query.limit(parsedLimit);

    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('[GET /api/users] Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
