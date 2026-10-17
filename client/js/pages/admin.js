/**
 * ==============================================================================
 * MODULE CỔNG QUẢN TRỊ VIÊN (ADMIN SUITE CONTROLLER & VIEWS)
 * Routes:
 * - #/admin: Dashboard tổng quan
 * - #/admin/rooms: Quản lý phòng họp
 * - #/admin/equipment / #/admin/equipments: Quản lý thiết bị
 * - #/admin/users: Quản lý người dùng
 * - #/admin/reports: Báo cáo & Thống kê
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  /**
   * Render thanh Subnav chuẩn Stitch cho các trang quản trị
   */
  function renderAdminSubnav(activeTab = 'dashboard') {
    return `
      <div class="admin-navigation-header mb-4">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-danger text-white px-2 py-1 small fw-bold">ADMIN PORTAL</span>
              <h2 class="fw-bold fs-3 text-slate-900 m-0">Trung tâm Điều hành Quản trị</h2>
            </div>
            <p class="text-secondary small m-0">Quản trị toàn diện hạ tầng phòng họp, thiết bị kỹ thuật, tài khoản và báo cáo</p>
          </div>

          <div class="d-flex align-items-center gap-2">
            <a href="#/meetings" class="btn btn-outline-secondary btn-sm py-2 px-3">
              <i class="bi bi-box-arrow-up-right me-1"></i> Xem góc nhìn Thành viên
            </a>
          </div>
        </div>

        <div class="auth-tabs-nav admin-subnav" role="tablist">
          <a href="#/admin" class="auth-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}">
            <i class="bi bi-speedometer2 me-1"></i> Tổng quan (Dashboard)
          </a>
          <a href="#/admin/rooms" class="auth-tab-btn ${activeTab === 'rooms' ? 'active' : ''}">
            <i class="bi bi-door-open me-1"></i> Quản lý Phòng họp
          </a>
          <a href="#/admin/equipment" class="auth-tab-btn ${activeTab === 'equipment' ? 'active' : ''}">
            <i class="bi bi-cpu me-1"></i> Quản lý Thiết bị
          </a>
          <a href="#/admin/users" class="auth-tab-btn ${activeTab === 'users' ? 'active' : ''}">
            <i class="bi bi-people me-1"></i> Quản lý Người dùng
          </a>
          <a href="#/admin/reports" class="auth-tab-btn ${activeTab === 'reports' ? 'active' : ''}">
            <i class="bi bi-pie-chart me-1"></i> Báo cáo & Thống kê
          </a>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // 1. ADMIN DASHBOARD TỔNG QUAN (#/admin)
  // ============================================================================
  function renderAdminDashboardPage() {
    const container = document.getElementById('app');
    if (!container) return;

    const allRooms = window.ROOMS || [];
    const allEquipments = window.EQUIPMENTS || [];
    const allMeetings = window.meetings || [];
    const allUsers = window.USERS || [];

    const activeRooms = allRooms.filter(r => !r.status || r.status.toLowerCase() === 'active').length;
    const availEquipments = allEquipments.filter(e => !e.status || e.status.toLowerCase() === 'available').length;
    const scheduledMeetings = allMeetings.filter(m => m.status === 'scheduled').length;

    container.innerHTML = `
      <div class="admin-dashboard-page">
        ${renderAdminSubnav('dashboard')}

        <!-- 4 KPI Cards -->
        <div class="row g-3 mb-4">
          <!-- KPI 1: Phòng họp -->
          <div class="col-sm-6 col-xl-3">
            <div class="stitch-card p-3 border-start border-4 border-primary">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="text-secondary small fw-semibold">Tổng số phòng</span>
                <span class="badge bg-primary-subtle text-primary"><i class="bi bi-door-open"></i></span>
              </div>
              <div class="fw-bold fs-2 text-slate-900">${allRooms.length}</div>
              <div class="text-success small"><i class="bi bi-check-circle me-1"></i>${activeRooms} phòng đang hoạt động</div>
            </div>
          </div>

          <!-- KPI 2: Thiết bị -->
          <div class="col-sm-6 col-xl-3">
            <div class="stitch-card p-3 border-start border-4 border-info">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="text-secondary small fw-semibold">Trang thiết bị</span>
                <span class="badge bg-info-subtle text-info"><i class="bi bi-cpu"></i></span>
              </div>
              <div class="fw-bold fs-2 text-slate-900">${allEquipments.length}</div>
              <div class="text-info small"><i class="bi bi-check2-all me-1"></i>${availEquipments} thiết bị sẵn sàng</div>
            </div>
          </div>

          <!-- KPI 3: Lịch họp -->
          <div class="col-sm-6 col-xl-3">
            <div class="stitch-card p-3 border-start border-4 border-warning">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="text-secondary small fw-semibold">Lịch họp đã đặt</span>
                <span class="badge bg-warning-subtle text-warning"><i class="bi bi-calendar3"></i></span>
              </div>
              <div class="fw-bold fs-2 text-slate-900">${allMeetings.length}</div>
              <div class="text-warning small"><i class="bi bi-clock-history me-1"></i>${scheduledMeetings} cuộc họp sắp tới</div>
            </div>
          </div>

          <!-- KPI 4: Nhân sự -->
          <div class="col-sm-6 col-xl-3">
            <div class="stitch-card p-3 border-start border-4 border-success">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="text-secondary small fw-semibold">Nhân sự hệ thống</span>
                <span class="badge bg-success-subtle text-success"><i class="bi bi-people"></i></span>
              </div>
              <div class="fw-bold fs-2 text-slate-900">${allUsers.length || '12+'}</div>
              <div class="text-secondary small"><i class="bi bi-building me-1"></i>Đồng bộ toàn cơ sở</div>
            </div>
          </div>
        </div>

        <!-- Quick Access Modules -->
        <h4 class="fw-bold text-slate-900 mb-3">Lối tắt quản lý trực tiếp</h4>
        <div class="row g-3 mb-4">
          <div class="col-md-4">
            <div class="stitch-card p-4 h-100 hover-shadow transition">
              <div class="d-flex align-items-center gap-3 mb-2">
                <div class="p-3 bg-primary-subtle text-primary rounded-3 fs-4"><i class="bi bi-door-open-fill"></i></div>
                <div>
                  <h5 class="fw-bold m-0">Quản lý Phòng họp</h5>
                  <span class="text-muted small">Cấu hình phòng & mã QR</span>
                </div>
              </div>
              <p class="text-secondary small mb-3">Thêm mới phòng, điều chỉnh sức chứa, thiết bị và quét mã QR dán cửa.</p>
              <a href="#/admin/rooms" class="btn btn-outline-primary btn-sm w-100">Truy cập quản lý phòng &rarr;</a>
            </div>
          </div>

          <div class="col-md-4">
            <div class="stitch-card p-4 h-100 hover-shadow transition">
              <div class="d-flex align-items-center gap-3 mb-2">
                <div class="p-3 bg-info-subtle text-info rounded-3 fs-4"><i class="bi bi-tools"></i></div>
                <div>
                  <h5 class="fw-bold m-0">Quản lý Thiết bị</h5>
                  <span class="text-muted small">Kiểm soát tình trạng kỹ thuật</span>
                </div>
              </div>
              <p class="text-secondary small mb-3">Thêm máy chiếu, camera, micro; cập nhật trạng thái Bảo trì / Sẵn sàng.</p>
              <a href="#/admin/equipment" class="btn btn-outline-info btn-sm w-100">Truy cập quản lý thiết bị &rarr;</a>
            </div>
          </div>

          <div class="col-md-4">
            <div class="stitch-card p-4 h-100 hover-shadow transition">
              <div class="d-flex align-items-center gap-3 mb-2">
                <div class="p-3 bg-success-subtle text-success rounded-3 fs-4"><i class="bi bi-file-earmark-bar-graph-fill"></i></div>
                <div>
                  <h5 class="fw-bold m-0">Báo cáo & Thống kê</h5>
                  <span class="text-muted small">Xuất dữ liệu & Phân tích</span>
                </div>
              </div>
              <p class="text-secondary small mb-3">Thống kê mật độ sử dụng phòng, tỷ lệ hủy họp và xuất file báo cáo CSV.</p>
              <a href="#/admin/reports" class="btn btn-outline-success btn-sm w-100">Xem thống kê & Báo cáo &rarr;</a>
            </div>
          </div>
        </div>

        <!-- Recent Meetings Table Preview -->
        <div class="stitch-card p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold text-slate-900 m-0">Lịch họp toàn hệ thống gần đây</h5>
            <a href="#/meetings" class="text-primary small fw-semibold text-decoration-none">Xem toàn bộ danh sách &rarr;</a>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="small">Tiêu đề cuộc họp</th>
                  <th class="small">Người chủ trì</th>
                  <th class="small">Phòng họp</th>
                  <th class="small">Ngày & Giờ</th>
                  <th class="small">Trạng thái</th>
                  <th class="small text-end">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                ${allMeetings.slice(0, 5).map(m => `
                  <tr>
                    <td>
                      <div class="fw-bold text-slate-900">${escapeHtml(m.title)}</div>
                    </td>
                    <td>${escapeHtml(m.host || 'Thành viên')}</td>
                    <td><i class="bi bi-door-closed me-1 text-primary"></i>${escapeHtml(m.roomName || 'Phòng')}</td>
                    <td>${m.date} (${m.time || (m.startTime + ' - ' + m.endTime)})</td>
                    <td><span class="badge bg-primary-subtle text-primary">${m.status || 'Scheduled'}</span></td>
                    <td class="text-end">
                      <button type="button" class="btn btn-outline-primary btn-sm py-1 px-2" onclick="if (typeof openDetailModal === 'function') openDetailModal(${m.id})">
                        <i class="bi bi-eye"></i>
                      </button>
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

  // ============================================================================
  // 2. ADMIN QUẢN LÝ NGƯỜI DÙNG (#/admin/users)
  // ============================================================================
  async function renderAdminUsersPage() {
    const container = document.getElementById('app');
    if (!container) return;

    container.innerHTML = `
      <div class="admin-users-page">
        ${renderAdminSubnav('users')}
        <div class="stitch-card p-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 class="fw-bold text-slate-900 m-0">Danh sách Tài khoản & Phân quyền Người dùng</h4>
              <p class="text-secondary small m-0">Đồng bộ từ CSDL MySQL và hệ thống tài khoản nhân viên</p>
            </div>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
              <i class="bi bi-shield-check me-1"></i> Quyền Quản trị viên
            </span>
          </div>

          <div id="admin-users-table-container">
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="small text-secondary mt-2">Đang tải danh sách người dùng...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const res = await (window.apiFetch || fetch)('/api/users');
      const data = await res.json().catch(() => ({}));
      const usersList = data.data || data || [];

      const tableContainer = document.getElementById('admin-users-table-container');
      if (!tableContainer) return;

      if (!Array.isArray(usersList) || usersList.length === 0) {
        tableContainer.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="bi bi-people fs-2 mb-2"></i>
            <div>Chưa có dữ liệu người dùng.</div>
          </div>
        `;
        return;
      }

      tableContainer.innerHTML = `
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="small">#ID</th>
                <th class="small">Thành viên</th>
                <th class="small">Tên đăng nhập</th>
                <th class="small">Email liên hệ</th>
                <th class="small">Phòng ban</th>
                <th class="small">Vai trò (Role)</th>
                <th class="small">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${usersList.map(u => {
                const name = u.fullName || u.name || u.username || 'Thành viên';
                const initials = typeof window.getInitials === 'function' ? window.getInitials(name) : 'U';
                const color = typeof window.getHostColor === 'function' ? window.getHostColor(name) : '#2563eb';
                const role = u.role || 'USER';
                const isAdmin = role.toLowerCase() === 'admin';

                return `
                  <tr>
                    <td><code>#${u.id || u.userId}</code></td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <span class="user-avatar-sm" style="background-color: ${color}">${initials}</span>
                        <span class="fw-bold text-slate-800">${escapeHtml(name)}</span>
                      </div>
                    </td>
                    <td><code>${escapeHtml(u.username || '--')}</code></td>
                    <td class="text-secondary small">${escapeHtml(u.email || '--')}</td>
                    <td><span class="badge bg-light text-secondary border">${escapeHtml(u.department || 'Chung')}</span></td>
                    <td>
                      <span class="badge ${isAdmin ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'}">
                        ${isAdmin ? '<i class="bi bi-shield-lock-fill me-1"></i>Admin' : 'USER'}
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-success-subtle text-success border border-success-subtle">
                        <i class="bi bi-check-circle-fill me-1"></i>Hoạt động
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      const tableContainer = document.getElementById('admin-users-table-container');
      if (tableContainer) {
        tableContainer.innerHTML = `
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>Không thể nạp danh sách tài khoản: ${err.message}
          </div>
        `;
      }
    }
  }

  // ============================================================================
  // 3. ADMIN BÁO CÁO & THỐNG KÊ (#/admin/reports)
  // ============================================================================
  function renderAdminReportsPage() {
    const container = document.getElementById('app');
    if (!container) return;

    const allRooms = window.ROOMS || [];
    const allMeetings = window.meetings || [];

    // Tính toán số cuộc họp theo từng phòng
    const roomMeetingStats = allRooms.map(r => {
      const count = allMeetings.filter(m => m.roomId === r.id || m.roomName === r.name).length;
      return { room: r, count };
    }).sort((a, b) => b.count - a.count);

    container.innerHTML = `
      <div class="admin-reports-page">
        ${renderAdminSubnav('reports')}

        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 class="fw-bold text-slate-900 m-0">Báo cáo Mật độ & Hiệu suất Sử dụng</h4>
            <p class="text-secondary small m-0">Dữ liệu phân tích điều phối phòng họp toàn công ty</p>
          </div>

          <button type="button" class="btn btn-success stitch-btn-export btn-sm py-2 px-3" onclick="if (typeof exportToCSV === 'function') exportToCSV()">
            <i class="bi bi-file-earmark-excel me-1"></i> Xuất Báo cáo CSV Toàn diện
          </button>
        </div>

        <div class="row g-4 mb-4">
          <!-- Bảng tỷ lệ phòng họp -->
          <div class="col-lg-7">
            <div class="stitch-card p-4 h-100">
              <h5 class="fw-bold text-slate-900 mb-3"><i class="bi bi-bar-chart-line text-primary me-2"></i>Mật độ sử dụng theo Phòng họp</h5>
              <div class="d-flex flex-column gap-3">
                ${roomMeetingStats.map(item => {
                  const percentage = allMeetings.length > 0 ? Math.round((item.count / allMeetings.length) * 100) : 0;
                  return `
                    <div>
                      <div class="d-flex justify-content-between small mb-1">
                        <span class="fw-semibold text-slate-800">${escapeHtml(item.room.name)} (${item.room.capacity} chỗ)</span>
                        <span class="text-muted"><strong>${item.count}</strong> cuộc họp (${percentage}%)</span>
                      </div>
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Tóm tắt phân loại cuộc họp -->
          <div class="col-lg-5">
            <div class="stitch-card p-4 h-100">
              <h5 class="fw-bold text-slate-900 mb-3"><i class="bi bi-pie-chart text-info me-2"></i>Phân bổ Trạng thái</h5>
              <div class="d-flex flex-column gap-3">
                <div class="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span><i class="bi bi-calendar-check text-primary me-2"></i>Đã lên lịch (Scheduled):</span>
                  <span class="fw-bold fs-5 text-primary">${allMeetings.filter(m => m.status === 'scheduled').length}</span>
                </div>
                <div class="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span><i class="bi bi-clock-history text-warning me-2"></i>Đang diễn ra (In-progress):</span>
                  <span class="fw-bold fs-5 text-warning">${allMeetings.filter(m => m.status === 'in-progress').length}</span>
                </div>
                <div class="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span><i class="bi bi-check-circle text-success me-2"></i>Đã hoàn thành (Completed):</span>
                  <span class="fw-bold fs-5 text-success">${allMeetings.filter(m => m.status === 'completed').length}</span>
                </div>
                <div class="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span><i class="bi bi-x-circle text-danger me-2"></i>Đã hủy (Cancelled):</span>
                  <span class="fw-bold fs-5 text-danger">${allMeetings.filter(m => m.status === 'cancelled').length}</span>
                </div>
              </div>
            </div>
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

  // Xuất ra toàn cục
  window.renderAdminSubnav = renderAdminSubnav;
  window.renderAdminDashboardPage = renderAdminDashboardPage;
  window.renderAdminUsersPage = renderAdminUsersPage;
  window.renderAdminReportsPage = renderAdminReportsPage;

})(window, document);
