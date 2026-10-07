const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * Hàm thêm danh sách người tham gia vào cuộc họp (Batch Insert)
 *
 * BUG FIX so với code gốc:
 *   - Knex MySQL không hỗ trợ .onConflict().ignore() trực tiếp
 *     → Sử dụng raw query INSERT IGNORE thay thế
 *   - Cho phép truyền transaction (trx) tùy chọn
 *
 * @param {number} meetingId - ID cuộc họp
 * @param {number[]} userIds - Mảng ID người dùng
 * @param {object} tx - Knex transaction (tùy chọn, mặc định là db)
 */
async function addMeetingParticipants(meetingId, userIds, tx = db) {
  if (!userIds || userIds.length === 0) return;

  // FIX: MySQL không hỗ trợ onConflict natively trong Knex
  // Sử dụng raw INSERT IGNORE với parameterized bindings để chống SQL injection
  const placeholders = userIds.map(() => '(?, ?, ?)').join(', ');
  const bindings = [];
  for (const userId of userIds) {
    bindings.push(parseInt(meetingId), parseInt(userId), 'PENDING');
  }

  await tx.raw(
    `INSERT IGNORE INTO Meeting_Participants (meeting_id, user_id, status) VALUES ${placeholders}`,
    bindings
  );
}

// ────────────────────────────────────────────────────────────
// 1. GET /api/meetings/:meetingId/participants
//    Truy vấn trạng thái phản hồi của người tham gia
// ────────────────────────────────────────────────────────────
router.get('/:meetingId/participants', async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Kiểm tra cuộc họp tồn tại
    const meeting = await db('Meetings').where('id', meetingId).first();
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc họp' });
    }

    const participants = await db('Meeting_Participants')
      .join('Users', 'Meeting_Participants.user_id', '=', 'Users.id')
      .select(
        'Users.id as userId',
        'Users.full_name as fullName',
        'Users.email as email',
        'Meeting_Participants.status as responseStatus',
        'Meeting_Participants.updated_at as respondedAt'
      )
      .where('Meeting_Participants.meeting_id', meetingId);

    return res.json({
      success: true,
      data: {
        meetingId: parseInt(meetingId),
        meetingTitle: meeting.title,
        participants,
        summary: {
          total: participants.length,
          accepted: participants.filter(p => p.responseStatus === 'ACCEPTED').length,
          declined: participants.filter(p => p.responseStatus === 'DECLINED').length,
          pending: participants.filter(p => p.responseStatus === 'PENDING').length,
          tentative: participants.filter(p => p.responseStatus === 'TENTATIVE').length
        }
      }
    });
  } catch (error) {
    console.error('[GET /meetings/:id/participants] Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// 2. POST /api/meetings/:meetingId/participants
//    Thêm danh sách người tham gia vào cuộc họp
// ────────────────────────────────────────────────────────────
router.post('/:meetingId/participants', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userIds } = req.body; // Mảng [1, 2, 3]

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách userIds (mảng số nguyên)'
      });
    }

    // Kiểm tra cuộc họp tồn tại
    const meeting = await db('Meetings').where('id', meetingId).first();
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc họp' });
    }

    await addMeetingParticipants(parseInt(meetingId), userIds);

    return res.status(201).json({
      success: true,
      message: `Đã thêm ${userIds.length} người tham gia vào cuộc họp`
    });
  } catch (error) {
    console.error('[POST /meetings/:id/participants] Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// 3. PATCH /api/meetings/:meetingId/participants/:userId/status
//    Cập nhật trạng thái phản hồi (ACCEPTED, DECLINED, TENTATIVE)
// ────────────────────────────────────────────────────────────
router.patch('/:meetingId/participants/:userId/status', async (req, res) => {
  try {
    const { meetingId, userId } = req.params;
    const { status } = req.body;

    if (!['ACCEPTED', 'DECLINED', 'TENTATIVE', 'PENDING'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chấp nhận: ACCEPTED, DECLINED, TENTATIVE, PENDING'
      });
    }

    const updated = await db('Meeting_Participants')
      .where({ meeting_id: meetingId, user_id: userId })
      .update({ status, updated_at: db.fn.now() });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người tham gia trong cuộc họp này'
      });
    }

    return res.json({ success: true, message: 'Cập nhật trạng thái phản hồi thành công' });
  } catch (error) {
    console.error('[PATCH /meetings/:id/participants/:uid/status] Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// 4. DELETE /api/meetings/:meetingId/participants/:userId
//    Xóa người tham gia khỏi cuộc họp
// ────────────────────────────────────────────────────────────
router.delete('/:meetingId/participants/:userId', async (req, res) => {
  try {
    const { meetingId, userId } = req.params;

    const deleted = await db('Meeting_Participants')
      .where({ meeting_id: meetingId, user_id: userId })
      .del();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người tham gia trong cuộc họp này'
      });
    }

    return res.json({ success: true, message: 'Đã xóa người tham gia khỏi cuộc họp' });
  } catch (error) {
    console.error('[DELETE /meetings/:id/participants/:uid] Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Export router mặc định, kèm hàm addMeetingParticipants để dùng ở module khác
router.addMeetingParticipants = addMeetingParticipants;
module.exports = router;
