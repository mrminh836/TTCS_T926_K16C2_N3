/**
 * ==============================================================================
 * PAGE: PHÒNG HỌP & KIỂM TRA PHÒNG TRỐNG (ROOMS & AVAILABILITY EXPLORER)
 * Route: #/rooms
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  // Trạng thái của widget kiểm tra phòng trống
  let isCheckingAvailability = false;
  let hasSearched = false;
  let searchDate = new Date().toISOString().slice(0, 10);
  let searchStart = '09:00';
  let searchEnd = '10:30';

  function renderRoomsUserPage() {
    const container = document.getElementById('app');
    if (!container) return;

    const allRooms = window.ROOMS || [];
    const allMeetings = window.meetings || [];
    const isAdmin = window.AuthState && window.AuthState.isAdmin();

    // Nếu đã tìm kiếm phòng trống: tính toán trạng thái từng phòng
    let availabilityResults = [];
    if (hasSearched) {
      availabilityResults = allRooms.map(room => {
        const isMaintenance = room.status && room.status.toLowerCase() === 'maintenance';
        const isInactive = room.status && room.status.toLowerCase() === 'inactive';

        if (isMaintenance) {
          return { room, status: 'maintenance', label: 'Bảo trì', desc: 'Phòng đang bảo trì thiết bị' };
        }
        if (isInactive) {
          return { room, status: 'inactive', label: 'Tạm ngừng', desc: 'Phòng tạm thời ngừng sử dụng' };
        }

        // Kiểm tra xem có cuộc họp nào trùng khung giờ tại phòng này không
        const conflictingMeeting = allMeetings.find(m => {
          if (m.status === 'cancelled') return false;
          if (m.date !== searchDate) return false;
          const matchRoom = (m.roomId === room.id) || (m.roomName === room.name);
          if (!matchRoom) return false;

          const mStart = m.startTime || (m.time ? m.time.split('-')[0].trim() : '00:00');
          const mEnd = m.endTime || (m.time ? m.time.split('-')[1]?.trim() : '23:59');

          // Điều kiện giao thoa thời gian: StartA < EndB && EndA > StartB
          return (mStart < searchEnd && mEnd > searchStart);
        });

        if (conflictingMeeting) {
          return {
            room,
            status: 'booked',
            label: 'Đã đặt',
            desc: `Đã có lịch: "${conflictingMeeting.title}" (${conflictingMeeting.time || `${conflictingMeeting.startTime} - ${conflictingMeeting.endTime}`})`
          };
        }

        return {
          room,
          status: 'available',
          label: 'Còn trống',
          desc: `Phòng khả dụng khung giờ ${searchStart} - ${searchEnd}`
        };
      });
    }

    container.innerHTML = `
      <div class="user-rooms-page">
        <!-- Header -->
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
          <div>
            <h1 class="page-title m-0 fw-bold fs-3 text-slate-900">Phòng họp</h1>
            <p class="page-subtitle m-0 text-secondary small">Xem danh sách phòng, kiểm tra phòng trống và đặt phòng</p>
          </div>

          <div class="d-flex align-items-center gap-2">
            ${isAdmin ? `
              <a href="#/admin/rooms" class="btn btn-outline-danger btn-sm py-2 px-3" title="Chuyển sang màn hình quản lý phòng">
                <i class="bi bi-shield-lock me-1"></i> Quản trị phòng
              </a>
            ` : ''}

            <button type="button" class="btn btn-outline-primary btn-sm py-2 px-3 fw-medium" id="btn-toggle-availability">
              <i class="bi bi-search me-1"></i> ${isCheckingAvailability ? 'Đóng kiểm tra phòng trống' : 'Kiểm tra phòng trống'}
            </button>

            <button type="button" class="btn btn-primary stitch-btn-primary btn-sm py-2 px-3 fw-semibold shadow-sm" onclick="if (typeof openAddModal === 'function') openAddModal()">
              <i class="bi bi-plus-lg me-1"></i> Đặt cuộc họp
            </button>
          </div>
        </div>

        <!-- Khung Kiểm tra phòng trống (Chỉ hiển thị khi người dùng mở) -->
        ${isCheckingAvailability ? `
          <div class="stitch-card p-4 mb-4 border-primary shadow-sm bg-light-subtle">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold text-slate-900 m-0"><i class="bi bi-clock-history text-primary me-2"></i>Chọn khung giờ cần kiểm tra phòng trống</h5>
            </div>

            <div class="row g-3 align-items-end">
              <div class="col-md-3">
                <label for="check-avail-date" class="form-label small fw-semibold text-slate-700 mb-1">Ngày họp</label>
                <input type="date" id="check-avail-date" class="form-control form-control-sm" value="${searchDate}" />
              </div>

              <div class="col-md-3">
                <label for="check-avail-start" class="form-label small fw-semibold text-slate-700 mb-1">Giờ bắt đầu</label>
                <input type="time" id="check-avail-start" class="form-control form-control-sm" value="${searchStart}" />
              </div>

              <div class="col-md-3">
                <label for="check-avail-end" class="form-label small fw-semibold text-slate-700 mb-1">Giờ kết thúc</label>
                <input type="time" id="check-avail-end" class="form-control form-control-sm" value="${searchEnd}" />
              </div>

              <div class="col-md-3">
                <button type="button" class="btn btn-primary stitch-btn-primary btn-sm w-100 py-2 fw-semibold" id="btn-execute-check-avail">
                  <i class="bi bi-search me-1"></i> Tìm phòng trống
                </button>
              </div>
            </div>

            ${hasSearched ? `
              <!-- Kết quả kiểm tra phòng trống -->
              <div class="mt-4 pt-3 border-top">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <span class="fw-bold text-slate-900">
                    Kết quả kiểm tra ngày <strong>${searchDate}</strong> (${searchStart} - ${searchEnd}):
                  </span>
                  <span class="badge bg-success-subtle text-success border border-success-subtle">
                    ${availabilityResults.filter(r => r.status === 'available').length} phòng còn trống
                  </span>
                </div>

                <div class="row g-3">
                  ${availabilityResults.map(res => {
                    const r = res.room;
                    const isAvail = res.status === 'available';

                    return `
                      <div class="col-md-6 col-lg-4">
                        <div class="stitch-card p-3 h-100 d-flex flex-column ${isAvail ? 'border-success' : 'border-slate-200'}">
                          <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold text-slate-900 m-0">${escapeHtml(r.name)}</h6>
                            <span class="badge ${isAvail ? 'bg-success text-white' : (res.status === 'booked' ? 'bg-danger text-white' : 'bg-warning text-dark')}">
                              ${res.label}
                            </span>
                          </div>

                          <div class="text-secondary small mb-2">
                            <span><i class="bi bi-geo-alt me-1 text-primary"></i>${escapeHtml(r.floor || 'Tầng 1')}</span> • 
                            <span><i class="bi bi-people me-1 text-primary"></i>${r.capacity} chỗ</span>
                          </div>

                          <div class="small ${isAvail ? 'text-success fw-medium' : 'text-danger'} mb-3 flex-grow-1">
                            ${res.desc}
                          </div>

                          <div class="mt-auto">
                            ${isAvail ? `
                              <button
                                type="button"
                                class="btn btn-success btn-sm w-100 fw-semibold"
                                onclick="if (typeof openAddModalWithSelection === 'function') openAddModalWithSelection(${r.id}, '${searchDate}', '${searchStart}', '${searchEnd}'); else if (typeof openAddModal === 'function') openAddModal();">
                                <i class="bi bi-check-lg me-1"></i> Đặt phòng này ngay
                              </button>
                            ` : `
                              <button type="button" class="btn btn-light btn-sm w-100 text-muted" disabled>
                                Không khả dụng
                              </button>
                            `}
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Danh sách tất cả các phòng họp (Gọn gàng, dễ hiểu) -->
        <div class="stitch-card p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold text-slate-900 m-0">Danh sách các phòng họp</h5>
            <span class="text-secondary small">Tổng số: <strong>${allRooms.length}</strong> phòng</span>
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
                ${allRooms.length === 0 ? `
                  <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                      Chưa có phòng họp nào trong hệ thống.
                    </td>
                  </tr>
                ` : allRooms.map(r => {
                  const isMaintenance = r.status && r.status.toLowerCase() === 'maintenance';
                  let statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle-fill me-1"></i>Sẵn sàng</span>';
                  if (isMaintenance) {
                    statusBadge = '<span class="badge bg-warning-subtle text-warning border border-warning-subtle"><i class="bi bi-tools me-1"></i>Bảo trì</span>';
                  }

                  return `
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
                      <td>${statusBadge}</td>
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
                            ${isMaintenance ? 'disabled' : ''}
                            onclick="if (typeof openAddModalWithSelection === 'function') openAddModalWithSelection(${r.id}); else if (typeof openAddModal === 'function') openAddModal();"
                            title="Đặt lịch phòng này">
                            <i class="bi bi-calendar-plus me-1"></i>Đặt phòng
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    // Gắn sự kiện bật/tắt widget kiểm tra phòng trống
    document.getElementById('btn-toggle-availability')?.addEventListener('click', () => {
      isCheckingAvailability = !isCheckingAvailability;
      renderRoomsUserPage();
    });

    // Gắn sự kiện thực hiện tìm kiếm phòng trống
    document.getElementById('btn-execute-check-avail')?.addEventListener('click', () => {
      const dateEl = document.getElementById('check-avail-date');
      const startEl = document.getElementById('check-avail-start');
      const endEl = document.getElementById('check-avail-end');

      if (dateEl) searchDate = dateEl.value;
      if (startEl) searchStart = startEl.value;
      if (endEl) searchEnd = endEl.value;

      hasSearched = true;
      renderRoomsUserPage();
    });
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
