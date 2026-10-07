const express = require('express');
const db = require('../db');

const router = express.Router();

// ────────────────────────────────────────────────────────────
// 1. GET /api/equipments - Lấy danh sách & Tìm kiếm (có phân trang)
//
// BUG FIX so với code gốc:
//   - Khi dùng search + status cùng lúc, query bị sai logic
//     do .orWhere không nằm trong group → đã fix bằng function()
//   - Thêm order by, đảm bảo clone query đúng cách
// ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    let query = db('Equipments');

    // FIX: Gộp điều kiện search vào andWhere để không ảnh hưởng status filter
    if (search) {
      query = query.where(function () {
        this.where('name', 'like', `%${search}%`)
            .orWhere('code', 'like', `%${search}%`);
      });
    }

    if (status) {
      query = query.andWhere('status', status);
    }

    // Clone trước khi thêm limit/offset để đếm chính xác
    const countQuery = query.clone();
    const data = await query.clone()
      .select('*')
      .orderBy('id', 'asc')
      .limit(limitNum)
      .offset(offset);

    const [{ total }] = await countQuery.count('id as total');

    return res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('[GET /api/equipments] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// 2. GET /api/equipments/available
//    Lọc thiết bị khả dụng theo khoảng thời gian
//
// BUG FIX so với code gốc:
//   - LEFT JOIN logic bị sai: điều kiện thời gian phải nằm trong
//     Bookings join, không phải Booking_Equipments join
//   - Tách rõ ràng leftJoin Booking_Equipments vs leftJoin Bookings
//   - SUM bị đếm sai khi thiết bị không có booking nào
// ────────────────────────────────────────────────────────────
router.get('/available', async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số date, startTime hoặc endTime'
      });
    }

    // Xây dựng datetime đầy đủ
    const startDateTime = `${date} ${startTime}${startTime.length === 5 ? ':00' : ''}`;
    const endDateTime = `${date} ${endTime}${endTime.length === 5 ? ':00' : ''}`;

    // FIX: Sử dụng subquery để tính số lượng đã đặt cho mỗi thiết bị
    // trong khoảng thời gian bị trùng, thay vì LEFT JOIN phức tạp bị sai logic
    const bookedSubquery = `
      COALESCE(
        (SELECT SUM(be2.quantity)
         FROM Booking_Equipments be2
         INNER JOIN Bookings b2 ON be2.booking_id = b2.id
         WHERE be2.equipment_id = e.id
           AND b2.status != 'CANCELLED'
           AND b2.start_time < ?
           AND b2.end_time > ?
        ), 0
      )`;

    const availableEquipments = await db('Equipments as e')
      .select(
        'e.id',
        'e.name',
        'e.code',
        'e.total_quantity as totalQuantity',
        'e.status',
        db.raw(`${bookedSubquery} as bookedQty`, [endDateTime, startDateTime]),
        db.raw(`e.total_quantity - ${bookedSubquery} as availableQuantity`, [endDateTime, startDateTime])
      )
      .where('e.status', 'ACTIVE')
      .whereRaw(`e.total_quantity - ${bookedSubquery} > 0`, [endDateTime, startDateTime])
      .orderBy('e.name', 'asc');

    return res.json({ success: true, data: availableEquipments });
  } catch (error) {
    console.error('[GET /api/equipments/available] Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// 3. GET /api/equipments/:id - Xem chi tiết thiết bị
// ────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const equipment = await db('Equipments').where('id', req.params.id).first();
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }
    return res.json({ success: true, data: equipment });
  } catch (err) {
    console.error('[GET /api/equipments/:id] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// 4. POST /api/equipments - Thêm mới thiết bị
// ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, code, totalQuantity, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Tên và mã thiết bị là bắt buộc'
      });
    }

    // Kiểm tra mã thiết bị trùng
    const existing = await db('Equipments').where('code', code).first();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Mã thiết bị '${code}' đã tồn tại`
      });
    }

    const [id] = await db('Equipments').insert({
      name,
      code,
      total_quantity: totalQuantity || 1,
      description: description || null,
      status: 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo thiết bị thành công',
      data: { id }
    });
  } catch (err) {
    console.error('[POST /api/equipments] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// 5. PUT /api/equipments/:id - Cập nhật toàn bộ thông tin
// ────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, code, totalQuantity, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Tên và mã thiết bị là bắt buộc khi cập nhật (PUT)'
      });
    }

    // Kiểm tra mã thiết bị trùng với thiết bị khác
    const duplicate = await db('Equipments')
      .where('code', code)
      .whereNot('id', req.params.id)
      .first();

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Mã thiết bị '${code}' đã được sử dụng bởi thiết bị khác`
      });
    }

    const updated = await db('Equipments').where('id', req.params.id).update({
      name,
      code,
      total_quantity: totalQuantity,
      description,
      updated_at: db.fn.now()
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }

    return res.json({ success: true, message: 'Cập nhật thiết bị thành công' });
  } catch (err) {
    console.error('[PUT /api/equipments/:id] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// 6. PATCH /api/equipments/:id/status
//    Cập nhật trạng thái (ACTIVE, MAINTENANCE, INACTIVE)
// ────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'MAINTENANCE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chấp nhận: ACTIVE, MAINTENANCE, INACTIVE'
      });
    }

    const updated = await db('Equipments').where('id', req.params.id).update({
      status,
      updated_at: db.fn.now()
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }

    return res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    console.error('[PATCH /api/equipments/:id/status] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// 7. DELETE /api/equipments/:id - Xóa thiết bị
// ────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    // Kiểm tra thiết bị có đang được mượn không
    const activeBookings = await db('Booking_Equipments as be')
      .join('Bookings as b', 'be.booking_id', '=', 'b.id')
      .where('be.equipment_id', req.params.id)
      .where('b.status', 'CONFIRMED')
      .where('b.end_time', '>', db.fn.now())
      .first();

    if (activeBookings) {
      return res.status(409).json({
        success: false,
        message: 'Không thể xóa thiết bị đang được sử dụng trong đặt phòng đang hoạt động'
      });
    }

    const deleted = await db('Equipments').where('id', req.params.id).del();
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }

    return res.json({ success: true, message: 'Xóa thiết bị thành công' });
  } catch (err) {
    console.error('[DELETE /api/equipments/:id] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
