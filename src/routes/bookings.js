const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * Tạo đơn đặt phòng kèm thiết bị mượn (Transaction)
 *
 * BUG FIX so với code gốc:
 *   - Thêm validation đầu vào (title, roomId, startTime, endTime bắt buộc)
 *   - Kiểm tra xung đột thời gian phòng (room conflict) trước khi đặt
 *   - Kiểm tra thiết bị khả dụng đủ số lượng trước khi mượn
 *   - Xử lý lỗi transaction rõ ràng hơn
 *
 * @param {object} bookingData - { title, roomId, startTime, endTime, userId }
 * @param {Array} equipmentItems - [{ equipmentId: 1, quantity: 2 }, ...]
 * @returns {number} bookingId
 */
async function createBookingWithEquipments(bookingData, equipmentItems) {
  return await db.transaction(async (trx) => {
    // 1. Kiểm tra xung đột phòng (overlapping bookings)
    const conflict = await trx('Bookings')
      .where('room_id', bookingData.roomId)
      .where('status', '!=', 'CANCELLED')
      .where('start_time', '<', bookingData.endTime)
      .where('end_time', '>', bookingData.startTime)
      .first();

    if (conflict) {
      throw new Error(
        `Phòng đã được đặt trong khoảng thời gian này (Booking #${conflict.id}: ${conflict.title})`
      );
    }

    // 2. Tạo đơn đặt lịch (Booking)
    const [bookingId] = await trx('Bookings').insert({
      title: bookingData.title,
      room_id: bookingData.roomId,
      start_time: bookingData.startTime,
      end_time: bookingData.endTime,
      created_by: bookingData.userId,
      status: 'CONFIRMED'
    });

    // 3. Xử lý thiết bị mượn
    if (equipmentItems && equipmentItems.length > 0) {
      // Kiểm tra từng thiết bị có đủ số lượng khả dụng không
      for (const item of equipmentItems) {
        const equipment = await trx('Equipments')
          .where('id', item.equipmentId)
          .where('status', 'ACTIVE')
          .first();

        if (!equipment) {
          throw new Error(`Thiết bị ID ${item.equipmentId} không tồn tại hoặc không khả dụng`);
        }

        // Tính số lượng đã được đặt trong cùng khoảng thời gian
        const result = await trx('Booking_Equipments as be')
          .join('Bookings as b', 'be.booking_id', '=', 'b.id')
          .where('be.equipment_id', item.equipmentId)
          .where('b.status', '!=', 'CANCELLED')
          .where('b.start_time', '<', bookingData.endTime)
          .where('b.end_time', '>', bookingData.startTime)
          .sum({ bookedQty: 'be.quantity' })
          .first();
        const bookedQty = (result && result.bookedQty) || 0;

        const available = equipment.total_quantity - (bookedQty || 0);
        if (item.quantity > available) {
          throw new Error(
            `Thiết bị "${equipment.name}" chỉ còn ${available}/${equipment.total_quantity} khả dụng, yêu cầu ${item.quantity}`
          );
        }
      }

      // Insert thiết bị mượn
      const equipmentRecords = equipmentItems.map(item => ({
        booking_id: bookingId,
        equipment_id: item.equipmentId,
        quantity: item.quantity
      }));

      await trx('Booking_Equipments').insert(equipmentRecords);
    }

    return bookingId;
  });
}

// ────────────────────────────────────────────────────────────
// 1. GET /api/bookings - Danh sách đặt phòng
// ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { roomId, date, status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    let query = db('Bookings as b')
      .leftJoin('Rooms as r', 'b.room_id', '=', 'r.id')
      .leftJoin('Users as u', 'b.created_by', '=', 'u.id')
      .select(
        'b.id',
        'b.title',
        'r.name as roomName',
        'b.start_time as startTime',
        'b.end_time as endTime',
        'u.full_name as createdByName',
        'b.status',
        'b.created_at as createdAt'
      );

    if (roomId) query = query.where('b.room_id', parseInt(roomId));
    if (status) query = query.where('b.status', status);
    if (date) {
      query = query.whereRaw('DATE(b.start_time) = ?', [date]);
    }

    const countQuery = query.clone();
    const data = await query.clone()
      .orderBy('b.start_time', 'desc')
      .limit(limitNum)
      .offset(offset);

    const [{ total }] = await countQuery.count('b.id as total');

    return res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    console.error('[GET /api/bookings] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// 2. GET /api/bookings/:id - Chi tiết đặt phòng (kèm thiết bị)
// ────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const booking = await db('Bookings as b')
      .leftJoin('Rooms as r', 'b.room_id', '=', 'r.id')
      .leftJoin('Users as u', 'b.created_by', '=', 'u.id')
      .select(
        'b.*',
        'r.name as roomName',
        'r.location as roomLocation',
        'u.full_name as createdByName'
      )
      .where('b.id', req.params.id)
      .first();

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt phòng' });
    }

    // Lấy danh sách thiết bị mượn
    const equipments = await db('Booking_Equipments as be')
      .join('Equipments as e', 'be.equipment_id', '=', 'e.id')
      .select('e.id', 'e.name', 'e.code', 'be.quantity')
      .where('be.booking_id', req.params.id);

    return res.json({
      success: true,
      data: { ...booking, equipments }
    });
  } catch (err) {
    console.error('[GET /api/bookings/:id] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// 3. POST /api/bookings - Tạo đặt phòng mới (kèm thiết bị)
// ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, roomId, startTime, endTime, userId, equipments } = req.body;

    // Validation
    if (!title || !roomId || !startTime || !endTime || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: title, roomId, startTime, endTime, userId'
      });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian bắt đầu phải trước thời gian kết thúc'
      });
    }

    const bookingId = await createBookingWithEquipments(
      { title, roomId, startTime, endTime, userId },
      equipments || []
    );

    return res.status(201).json({
      success: true,
      message: 'Đặt phòng thành công',
      data: { bookingId }
    });
  } catch (err) {
    console.error('[POST /api/bookings] Error:', err.message);
    // Phân biệt lỗi business logic vs lỗi server
    if (err.message.includes('Phòng đã được đặt') || err.message.includes('Thiết bị')) {
      return res.status(409).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// 4. PATCH /api/bookings/:id/cancel - Hủy đặt phòng
// ────────────────────────────────────────────────────────────
router.patch('/:id/cancel', async (req, res) => {
  try {
    const updated = await db('Bookings')
      .where('id', req.params.id)
      .where('status', '!=', 'CANCELLED')
      .update({ status: 'CANCELLED', updated_at: db.fn.now() });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt phòng hoặc đã bị hủy trước đó'
      });
    }

    return res.json({ success: true, message: 'Đã hủy đặt phòng thành công' });
  } catch (err) {
    console.error('[PATCH /api/bookings/:id/cancel] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
