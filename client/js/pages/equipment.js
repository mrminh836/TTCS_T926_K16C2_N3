/**
 * ==============================================================================
 * PAGE: DANH MỤC THIẾT BỊ DOANH NGHIỆP CHO NGƯỜI DÙNG (USER EQUIPMENT EXPLORER)
 * Route: #/equipment & #/equipments
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  let eqSearchTerm = '';
  let eqTypeFilter = 'all';

  function renderEquipmentUserPage() {
    const container = document.getElementById('app');
    if (!container) return;

    const allEquipments = window.EQUIPMENTS || [];
    const allRooms = window.ROOMS || [];
    const isAdmin = window.AuthState && window.AuthState.isAdmin();

    // Lọc thiết bị: Chỉ giữ lại các thiết bị còn sử dụng được, ẩn các thiết bị bảo trì hoặc hỏng hóc
    const usableEquipments = allEquipments.filter(e => {
      const status = (e.status || '').toLowerCase();
      return status !== 'maintenance' && status !== 'broken' && status !== 'inactive';
    });

    const filteredEquipments = usableEquipments.filter(e => {
      const matchSearch = !eqSearchTerm || 
        (e.name && e.name.toLowerCase().includes(eqSearchTerm.toLowerCase())) ||
        (e.type && e.type.toLowerCase().includes(eqSearchTerm.toLowerCase()));

      const matchType = eqTypeFilter === 'all' || e.type === eqTypeFilter;
      return matchSearch && matchType;
    });

    // Lấy danh sách các loại thiết bị độc nhất từ các thiết bị khả dụng
    const availableTypes = Array.from(new Set(usableEquipments.map(e => e.type).filter(Boolean)));

    container.innerHTML = `
      <div class="user-equipment-page">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h2 class="fw-bold fs-3 text-slate-900 m-0">Danh mục Trang thiết bị</h2>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                ${usableEquipments.length} thiết bị sẵn sàng sử dụng
              </span>
            </div>
            <p class="text-secondary small m-0">Hạ tầng công nghệ và trang thiết bị hỗ trợ hội nghị trực tuyến & làm việc nhóm</p>
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
                  id="input-user-eq-search"
                  class="form-control border-start-0"
                  placeholder="Tìm thiết bị theo tên, tính năng, phân loại..."
                  value="${escapeHtml(eqSearchTerm)}"
                  aria-label="Tìm kiếm thiết bị"
                />
              </div>
            </div>

            <div class="col-md-5">
              <div class="d-flex gap-2 justify-content-md-end">
                <select id="select-user-eq-type" class="form-select form-select-sm" aria-label="Lọc theo loại thiết bị">
                  <option value="all" ${eqTypeFilter === 'all' ? 'selected' : ''}>Tất cả phân loại</option>
                  ${availableTypes.map(t => `
                    <option value="${escapeHtml(t)}" ${eqTypeFilter === t ? 'selected' : ''}>${escapeHtml(t)}</option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Equipment Cards Grid -->
        <div class="row g-4">
          ${filteredEquipments.length === 0 ? `
            <div class="col-12">
              <div class="stitch-card p-5 text-center">
                <i class="bi bi-cpu text-muted fs-1 mb-2"></i>
                <h5 class="fw-bold text-slate-800">Không tìm thấy thiết bị phù hợp</h5>
                <p class="text-secondary small">Vui lòng kiểm tra lại từ khóa hoặc chuyển sang loại thiết bị khác.</p>
              </div>
            </div>
          ` : filteredEquipments.map(eq => {
            const statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle-fill me-1"></i>Có sẵn</span>';

            // Tìm xem thiết bị đang nằm ở phòng nào
            const equippedRooms = allRooms.filter(r => (r.equipmentNames || []).includes(eq.name));

            let eqIcon = 'bi-cpu';
            if (eq.type?.includes('Máy chiếu')) eqIcon = 'bi-projector';
            else if (eq.type?.includes('Màn hình') || eq.type?.includes('TV')) eqIcon = 'bi-tv';
            else if (eq.type?.includes('Camera')) eqIcon = 'bi-camera-video';
            else if (eq.type?.includes('Micro')) eqIcon = 'bi-mic';
            else if (eq.type?.includes('âm thanh') || eq.type?.includes('Loa')) eqIcon = 'bi-speaker';
            else if (eq.type?.includes('Bảng')) eqIcon = 'bi-easel';

            return `
              <div class="col-md-6 col-lg-4">
                <div class="stitch-card h-100 d-flex flex-column eq-user-card">
                  <div class="card-body p-4 d-flex flex-column flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                      <div class="d-flex align-items-center gap-3">
                        <div class="eq-icon-container bg-primary-subtle text-primary p-3 rounded-3 fs-4">
                          <i class="bi ${eqIcon}"></i>
                        </div>
                        <div>
                          <span class="badge bg-light text-secondary border small mb-1">${escapeHtml(eq.type || 'Thiết bị')}</span>
                          <h5 class="fw-bold text-slate-900 m-0">${escapeHtml(eq.name)}</h5>
                        </div>
                      </div>
                      ${statusBadge}
                    </div>

                    <div class="text-secondary small mb-3 flex-grow-1">
                      <div class="fw-semibold text-slate-700 mb-1">Trang bị tại các phòng:</div>
                      ${equippedRooms.length > 0 ? `
                        <div class="d-flex flex-wrap gap-1">
                          ${equippedRooms.map(rm => `
                            <span class="badge bg-slate-100 text-primary border small">
                              <i class="bi bi-door-closed me-1"></i>${escapeHtml(rm.name)}
                            </span>
                          `).join('')}
                        </div>
                      ` : `
                        <span class="text-muted small">Thiết bị lưu kho / Có thể điều phối linh hoạt</span>
                      `}
                    </div>

                    <div class="pt-3 border-top mt-auto d-flex justify-content-between align-items-center">
                      <span class="text-muted small">Mã: <code>EQ-00${eq.id}</code></span>
                      <button
                        type="button"
                        class="btn btn-outline-primary btn-sm btn-quick-book-eq"
                        onclick="if (typeof openAddModalWithEquipment === 'function') openAddModalWithEquipment(${eq.id}); else if (typeof openAddModal === 'function') openAddModal([${eq.id}]);"
                        title="Đặt phòng kèm thiết bị này">
                        <i class="bi bi-calendar-plus me-1"></i> Đặt lịch dùng
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

    // Search events
    const searchInput = document.getElementById('input-user-eq-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        eqSearchTerm = e.target.value;
        renderEquipmentUserPage();
        const inputNow = document.getElementById('input-user-eq-search');
        if (inputNow) {
          inputNow.focus();
          inputNow.setSelectionRange(eqSearchTerm.length, eqSearchTerm.length);
        }
      });
    }

    const typeSelect = document.getElementById('select-user-eq-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        eqTypeFilter = e.target.value;
        renderEquipmentUserPage();
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

  window.renderEquipmentUserPage = renderEquipmentUserPage;

})(window, document);
