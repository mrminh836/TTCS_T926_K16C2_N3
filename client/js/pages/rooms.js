/**
 * ==============================================================================
 * PAGE: DANH SÁCH PHÒNG HỌP CHO NGƯỜI DÙNG (USER ROOMS EXPLORER)
 * Route: #/rooms
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  let searchTerm = '';
  let capacityFilter = 'all';

  function renderRoomsUserPage() {
    const container = document.getElementById('app');
    if (!container) return;

    const allRooms = window.ROOMS || [];
    const allEquipments = window.EQUIPMENTS || [];
    const isAdmin = window.AuthState && window.AuthState.isAdmin();

    // Lọc danh sách phòng
    let filteredRooms = allRooms.filter(r => {
      const matchSearch = !searchTerm || 
        (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.floor && r.floor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.type && r.type.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchCap = true;
      if (capacityFilter === 'small') matchCap = r.capacity <= 10;
      else if (capacityFilter === 'medium') matchCap = r.capacity > 10 && r.capacity <= 25;
      else if (capacityFilter === 'large') matchCap = r.capacity > 25;

      return matchSearch && matchCap;
    });

    container.innerHTML = `
      <div class="user-rooms-page">
        <!-- Header & Admin shortcut -->
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h2 class="fw-bold fs-3 text-slate-900 m-0">Tra cứu Phòng họp</h2>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                ${allRooms.length} phòng khả dụng
              </span>
            </div>
            <p class="text-secondary small m-0">Khám phá không gian làm việc, thông số kỹ thuật và trang thiết bị hỗ trợ</p>
          </div>

          <div class="d-flex align-items-center gap-2">
            ${isAdmin ? `
              <a href="#/admin/rooms" class="btn btn-outline-danger btn-sm py-2 px-3">
                <i class="bi bi-shield-lock me-1"></i> Chuyển sang Quản trị phòng (Admin)
              </a>
            ` : ''}
            <button type="button" class="btn btn-primary stitch-btn-submit btn-sm py-2 px-3" onclick="if (typeof openAddModal === 'function') openAddModal()">
              <i class="bi bi-calendar-plus me-1"></i> Đặt cuộc họp ngay
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="stitch-card p-3 mb-4">
          <div class="row g-2 align-items-center">
            <div class="col-md-7">
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                <input
                  type="text"
                  id="input-user-room-search"
                  class="form-control border-start-0"
                  placeholder="Tìm phòng theo tên, vị trí tầng, loại phòng..."
                  value="${escapeHtml(searchTerm)}"
                  aria-label="Tìm kiếm phòng họp"
                />
              </div>
            </div>

            <div class="col-md-5">
              <div class="d-flex gap-2 justify-content-md-end">
                <select id="select-user-capacity-filter" class="form-select form-select-sm" aria-label="Lọc sức chứa">
                  <option value="all" ${capacityFilter === 'all' ? 'selected' : ''}>Tất cả sức chứa</option>
                  <option value="small" ${capacityFilter === 'small' ? 'selected' : ''}>Nhóm nhỏ (&le; 10 chỗ)</option>
                  <option value="medium" ${capacityFilter === 'medium' ? 'selected' : ''}>Trung bình (11 - 25 chỗ)</option>
                  <option value="large" ${capacityFilter === 'large' ? 'selected' : ''}>Hội trường lớn (&gt; 25 chỗ)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Room Cards Grid -->
        <div class="row g-4">
          ${filteredRooms.length === 0 ? `
            <div class="col-12">
              <div class="stitch-card p-5 text-center">
                <i class="bi bi-door-closed text-muted fs-1 mb-2"></i>
                <h5 class="fw-bold text-slate-800">Không tìm thấy phòng họp phù hợp</h5>
                <p class="text-secondary small">Vui lòng thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc sức chứa.</p>
              </div>
            </div>
          ` : filteredRooms.map(r => {
            const isMaintenance = r.status && r.status.toLowerCase() === 'maintenance';
            const isInactive = r.status && r.status.toLowerCase() === 'inactive';
            const equipmentsList = r.equipmentNames || [];

            let statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle-fill me-1"></i>Sẵn sàng</span>';
            if (isMaintenance) {
              statusBadge = '<span class="badge bg-warning-subtle text-warning border border-warning-subtle"><i class="bi bi-tools me-1"></i>Bảo trì</span>';
            } else if (isInactive) {
              statusBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Tạm ngừng</span>';
            }

            return `
              <div class="col-md-6 col-lg-4">
                <div class="stitch-card h-100 d-flex flex-column room-user-card ${isMaintenance ? 'border-warning' : ''}">
                  <div class="card-body p-4 d-flex flex-column flex-grow-1">
                    <!-- Header -->
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span class="badge bg-slate-100 text-slate-700 font-monospace mb-1">${r.code || `RM-00${r.id}`}</span>
                        <h4 class="fw-bold text-slate-900 m-0">${escapeHtml(r.name)}</h4>
                      </div>
                      ${statusBadge}
                    </div>

                    <!-- Location & Capacity -->
                    <div class="d-flex align-items-center gap-3 text-secondary small mb-3">
                      <span><i class="bi bi-geo-alt me-1 text-primary"></i>${escapeHtml(r.floor || 'Tầng 1')}</span>
                      <span><i class="bi bi-people me-1 text-primary"></i><strong>${r.capacity}</strong> chỗ ngồi</span>
                      <span><i class="bi bi-tag me-1 text-primary"></i>${escapeHtml(r.type || 'Hội nghị')}</span>
                    </div>

                    <!-- Equipments Tag List -->
                    <div class="mb-3 flex-grow-1">
                      <div class="text-muted small fw-semibold mb-1">Trang thiết bị sẵn có:</div>
                      <div class="d-flex flex-wrap gap-1">
                        ${equipmentsList.length > 0 ? equipmentsList.map(eq => `
                          <span class="badge bg-light text-secondary border small">${escapeHtml(eq)}</span>
                        `).join('') : '<span class="text-muted small font-italic">Không có thiết bị đặc biệt</span>'}
                      </div>
                    </div>

                    <!-- Actions Footer -->
                    <div class="d-flex align-items-center gap-2 pt-3 border-top mt-auto">
                      <button
                        type="button"
                        class="btn btn-outline-secondary btn-sm flex-fill"
                        onclick="if (typeof openRoomQRModal === 'function') openRoomQRModal(${r.id})"
                        title="Xem mã QR dán cửa và thông số phòng">
                        <i class="bi bi-qr-code me-1"></i> Mã QR
                      </button>

                      <button
                        type="button"
                        class="btn btn-primary stitch-btn-submit btn-sm flex-fill"
                        ${isMaintenance || isInactive ? 'disabled title="Phòng đang bảo trì"' : ''}
                        onclick="if (typeof openAddModalWithSelection === 'function') openAddModalWithSelection(${r.id}); else if (typeof openAddModal === 'function') openAddModal();"
                        title="Đặt lịch cuộc họp tại phòng này">
                        <i class="bi bi-calendar-plus me-1"></i> Đặt lịch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Gắn sự kiện tìm kiếm và lọc
    const searchInput = document.getElementById('input-user-room-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        renderRoomsUserPage();
        const inputNow = document.getElementById('input-user-room-search');
        if (inputNow) {
          inputNow.focus();
          inputNow.setSelectionRange(searchTerm.length, searchTerm.length);
        }
      });
    }

    const capSelect = document.getElementById('select-user-capacity-filter');
    if (capSelect) {
      capSelect.addEventListener('change', (e) => {
        capacityFilter = e.target.value;
        renderRoomsUserPage();
      });
    }
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
