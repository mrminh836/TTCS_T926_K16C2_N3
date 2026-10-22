/**
 * ==============================================================================
 * PAGE: PHÒNG HỌP (USER ROOMS EXPLORER)
 * Route: #/rooms
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  /**
   * Kiểm tra một phòng có đang bận cuộc họp ngay tại thời điểm hiện tại không
   */
  function isRoomBusyNow(room, allMeetings) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return allMeetings.some(m => {
      if (m.status === 'cancelled') return false;
      if (m.date !== todayStr) return false;
      const matchRoom = (m.roomId === room.id) || (m.roomName === room.name);
      if (!matchRoom) return false;

      // Nếu trạng thái cuộc họp là 'in-progress' thì đang bận
      if (m.status === 'in-progress') return true;

      const mStart = m.startTime || (m.time ? m.time.split('-')[0].trim() : '');
      const mEnd = m.endTime || (m.time ? m.time.split('-')[1]?.trim() : '');
      if (!mStart || !mEnd) return false;

      const [sH, sM] = mStart.split(':').map(Number);
      const [eH, eM] = mEnd.split(':').map(Number);
      const startMin = (sH || 0) * 60 + (sM || 0);
      const endMin = (eH || 0) * 60 + (eM || 0);

      return (nowMinutes >= startMin && nowMinutes < endMin);
    });
  }

  function renderRoomsUserPage() {
    const container = document.getElementById('app');
    if (!container) return;

    const allRooms = window.ROOMS || [];
    const allMeetings = window.meetings || [];

    // Lọc chỉ những phòng khả dụng: Active, không bảo trì, không ngừng hoạt động và không bận ở thời điểm hiện tại
    const availableRooms = allRooms.filter(room => {
      const isMaintenance = room.status && room.status.toLowerCase() === 'maintenance';
      const isInactive = room.status && room.status.toLowerCase() === 'inactive';
      if (isMaintenance || isInactive) return false;

      // Ẩn phòng đang bận cuộc họp ở thời điểm hiện tại
      if (isRoomBusyNow(room, allMeetings)) return false;

      return true;
    });

    container.innerHTML = `
      <div class="user-rooms-page">
        <!-- Header -->
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h1 class="page-title m-0 fw-bold fs-3 text-slate-900">Phòng họp</h1>
            <p class="page-subtitle m-0 text-secondary small">Xem danh sách phòng họp còn trống và đặt phòng</p>
          </div>
        </div>

        <!-- Danh sách phòng họp còn trống -->
        <div class="stitch-card p-4">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
            <div>
              <h5 class="fw-bold text-slate-900 m-0 d-flex align-items-center gap-2">
                <span>Danh sách phòng họp còn trống</span>
                <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill" style="font-size: 11px;">
                  <i class="bi bi-shield-check me-1"></i>Sẵn sàng đặt
                </span>
              </h5>
              <p class="text-secondary small m-0 mt-1">Chỉ hiển thị các phòng khả dụng (đã tự động ẩn phòng đang bận, phòng bảo trì và ngừng hoạt động)</p>
            </div>
            <span class="text-secondary small">Còn trống: <strong>${availableRooms.length}</strong> / ${allRooms.length} phòng</span>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="small fw-semibold">Tên phòng họp</th>
                  <th class="small fw-semibold">Vị trí</th>
                  <th class="small fw-semibold">Sức chứa</th>
                  <th class="small fw-semibold">Trạng thái</th>
                  <th class="small fw-semibold text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                ${availableRooms.length === 0 ? `
                  <tr>
                    <td colspan="5" class="text-center py-5 text-muted">
                      <i class="bi bi-door-closed text-secondary fs-1 d-block mb-2"></i>
                      <div class="fw-semibold text-slate-800">Hiện tại không có phòng họp nào còn trống</div>
                      <div class="small text-secondary mt-1">Tất cả các phòng đều đang có cuộc họp diễn ra, đang bảo trì hoặc tạm ngừng hoạt động.</div>
                    </td>
                  </tr>
                ` : availableRooms.map(r => `
                  <tr>
                    <td>
                      <div class="fw-bold text-slate-900">${escapeHtml(r.name)}</div>
                      <span class="text-muted small">Mã: <code>${r.code || `RM-00${r.id}`}</code></span>
                    </td>
                    <td>
                      <div class="small text-slate-800"><i class="bi bi-geo-alt me-1 text-primary"></i>${escapeHtml(r.floor || 'Tầng 1')}</div>
                      <div class="text-muted small">${escapeHtml(r.type || 'Hội nghị')}</div>
                    </td>
                    <td>
                      <span class="fw-medium text-slate-800">${r.capacity}</span> chỗ ngồi
                    </td>
                    <td>
                      <span class="badge bg-success-subtle text-success border border-success-subtle">
                        <i class="bi bi-check-circle-fill me-1"></i>Sẵn sàng đặt
                      </span>
                    </td>
                    <td class="text-end">
                      <div class="d-inline-flex gap-2">
                        <button
                          type="button"
                          class="btn btn-outline-secondary btn-sm py-1 px-2"
                          onclick="if (typeof openRoomQRModal === 'function') openRoomQRModal(${r.id})"
                          title="Xem mã QR dán cửa và thông số phòng">
                          <i class="bi bi-qr-code me-1"></i>Mã QR
                        </button>

                        <button
                          type="button"
                          class="btn btn-primary stitch-btn-primary btn-sm py-1 px-3 fw-medium"
                          onclick="if (typeof openAddModalWithSelection === 'function') openAddModalWithSelection(${r.id}); else if (typeof openAddModal === 'function') openAddModal();"
                          title="Đặt lịch phòng này">
                          <i class="bi bi-calendar-plus me-1"></i>Đặt phòng
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.renderRoomsUserPage = renderRoomsUserPage;

})(window, document);
