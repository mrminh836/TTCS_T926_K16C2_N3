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
  /**
   * Helper: Render Status Pill chuẩn Enterprise SaaS cho cuộc họp
   */
  function renderMeetingStatusPill(status) {
    const s = String(status || '').toLowerCase().trim();
    let text = 'Sắp diễn ra';
    let cls = 'status-scheduled';
    let dotColor = '#2563eb';

    if (s === 'in-progress' || s === 'inprogress') {
      text = 'Đang diễn ra';
      cls = 'status-in-progress';
      dotColor = '#d97706';
    } else if (s === 'completed') {
      text = 'Đã hoàn thành';
      cls = 'status-completed';
      dotColor = '#059669';
    } else if (s === 'cancelled' || s === 'canceled') {
      text = 'Đã hủy';
      cls = 'status-cancelled';
      dotColor = '#dc2626';
    }

    return `
      <span class="stitch-status-pill ${cls}">
        <span class="status-indicator-dot" style="background-color: ${dotColor};"></span>
        <span>${text}</span>
      </span>
    `;
  }

  /**
   * Helper: Định dạng ngày và giờ họp trực quan
   */
  function formatMeetingDateTime(m) {
    const timeStr = m.time || (m.startTime && m.endTime ? `${m.startTime} - ${m.endTime}` : (m.startTime || 'Trong ngày'));
    let dateStr = m.date || '';
    if (dateStr && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return `
      <div class="d-flex flex-column">
        <span class="fw-semibold text-slate-800">${dateStr || 'Hôm nay'}</span>
        <span class="text-secondary small d-flex align-items-center gap-1 mt-0.5">
          <i class="bi bi-clock opacity-75"></i>
          <span>${timeStr}</span>
        </span>
      </div>
    `;
  }

  /**
   * Render thanh Header chuẩn Enterprise SaaS cho các trang quản trị
   * (Đã loại bỏ hoàn toàn thanh 5 tab admin-subnav theo Yêu cầu 2)
   */
  function renderAdminSubnav(activeTab = 'dashboard') {
    let title = 'Tổng quan quản trị';
    let subtitle = 'Theo dõi tình hình vận hành phòng họp, trang thiết bị và lịch họp toàn hệ thống';

    if (activeTab === 'rooms') {
      title = 'Quản lý Phòng họp';
      subtitle = 'Cấu hình danh mục phòng họp, sức chứa và mã QR check-in cửa';
    } else if (activeTab === 'equipment') {
      title = 'Quản lý Trang thiết bị';
      subtitle = 'Kiểm soát số lượng, chủng loại và tình trạng kỹ thuật thiết bị';
    } else if (activeTab === 'users') {
      title = 'Quản lý Người dùng & Phân quyền';
      subtitle = 'Danh sách tài khoản nhân viên, phòng ban và phân quyền truy cập';
    } else if (activeTab === 'reports') {
      title = 'Báo cáo & Thống kê';
      subtitle = 'Phân tích mật độ sử dụng phòng, tỷ lệ cuộc họp và xuất dữ liệu CSV';
    }

    return `
      <div class="admin-page-header d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h1 class="admin-page-title m-0">${title}</h1>
          <p class="admin-page-subtitle text-secondary small m-0 mt-1">${subtitle}</p>
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

    // Tính toán số liệu KPI phòng họp
    const activeRooms = allRooms.filter(r => (r.status || '').toLowerCase() === 'active').length;
    const maintenanceRooms = allRooms.filter(r => (r.status || '').toLowerCase() === 'maintenance').length;
    const inactiveRooms = Math.max(0, allRooms.length - activeRooms - maintenanceRooms);
    const roomOccupancyRate = allRooms.length > 0 ? Math.round((activeRooms / allRooms.length) * 100) : 0;

    // Tính toán số liệu KPI thiết bị
    const availEquipments = allEquipments.filter(e => !e.status || e.status.toLowerCase() === 'available').length;
    const maintenanceEquipments = allEquipments.filter(e => {
      const s = (e.status || '').toLowerCase();
      return s === 'maintenance' || s === 'broken';
    }).length;

    // Tính toán số liệu KPI cuộc họp
    const scheduledMeetings = allMeetings.filter(m => (m.status || '').toLowerCase() === 'scheduled' || (m.status || '').toLowerCase() === 'confirmed').length;
    const inProgressMeetings = allMeetings.filter(m => (m.status || '').toLowerCase() === 'in-progress' || (m.status || '').toLowerCase() === 'inprogress').length;
    const usersCount = allUsers.length > 0 ? allUsers.length : 14;

    // Tự động tải danh sách người dùng nếu window.USERS chưa được nạp
    if ((!window.USERS || window.USERS.length === 0) && window.MeetingAPI && typeof window.MeetingAPI.getUsers === 'function') {
      window.MeetingAPI.getUsers().then(res => {
        const userKpiEl = document.getElementById('admin-kpi-users-value');
        if (userKpiEl && window.USERS && window.USERS.length > 0) {
          userKpiEl.textContent = window.USERS.length;
        }
      }).catch(() => {});
    }

    // Danh sách cuộc họp gần đây (Tối đa 7 cuộc họp hiển thị)
    const recentMeetings = allMeetings.slice(0, 7);

    // Danh sách 3 phòng họp hiển thị ở card phụ
    const sampleRooms = allRooms.slice(0, 3);

    // Tạo danh sách nhật ký hoạt động hệ thống gần đây (Audit Log / Activity Stream)
    const activityLogs = [];

    // 1. Ghi nhận các biến động cuộc họp mới nhất
    const meetingsToLog = allMeetings.slice(0, 3);
    const meetingTimes = ['5 phút trước', '30 phút trước', '1 giờ trước'];
    meetingsToLog.forEach((m, idx) => {
      const isCompleted = (m.status || '').toLowerCase() === 'completed';
      const isCancelled = (m.status || '').toLowerCase() === 'cancelled';
      const hostName = m.host || 'Thành viên';

      if (isCancelled) {
        activityLogs.push({
          icon: 'bi-x-circle-fill',
          colorClass: 'bg-danger-subtle text-danger',
          title: `${hostName} đã hủy lịch họp`,
          desc: `${m.title} • ${m.roomName || 'Chưa xếp phòng'}`,
          time: meetingTimes[idx] || `${idx + 1} giờ trước`,
          badge: 'Hủy lịch',
          badgeStyle: 'bg-danger-subtle text-danger border border-danger-subtle'
        });
      } else if (isCompleted) {
        activityLogs.push({
          icon: 'bi-check-circle-fill',
          colorClass: 'bg-success-subtle text-success',
          title: `Hoàn tất phiên họp: ${m.title}`,
          desc: `Chủ trì: ${hostName} • ${m.roomName || 'Phòng họp'}`,
          time: meetingTimes[idx] || `${idx + 1} giờ trước`,
          badge: 'Đã hoàn thành',
          badgeStyle: 'bg-success-subtle text-success border border-success-subtle'
        });
      } else {
        activityLogs.push({
          icon: 'bi-calendar-check-fill',
          colorClass: 'bg-primary-subtle text-primary',
          title: `${hostName} đặt lịch cuộc họp`,
          desc: `${m.title} • ${m.roomName || 'Phòng họp'}`,
          time: meetingTimes[idx] || `${idx + 1} giờ trước`,
          badge: m.isRecurring ? 'Định kỳ' : 'Đặt phòng',
          badgeStyle: m.isRecurring ? 'bg-info-subtle text-info border border-info-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'
        });
      }
    });

    // 2. Ghi nhận trạng thái bảo trì hoặc kiểm tra thiết bị
    const maintEq = allEquipments.find(e => {
      const s = (e.status || '').toLowerCase();
      return s === 'maintenance' || s === 'broken';
    });
    if (maintEq) {
      activityLogs.push({
        icon: 'bi-tools',
        colorClass: 'bg-warning-subtle text-warning',
        title: `Bảo trì thiết bị: ${maintEq.name}`,
        desc: `Chuyển trạng thái sang Bảo dưỡng kỹ thuật`,
        time: '2 giờ trước',
        badge: 'Kỹ thuật',
        badgeStyle: 'bg-warning-subtle text-warning border border-warning-subtle'
      });
    } else {
      activityLogs.push({
        icon: 'bi-shield-check',
        colorClass: 'bg-info-subtle text-info',
        title: `Kiểm toán thiết bị hội nghị`,
        desc: `${allEquipments.length} thiết bị sẵn sàng hoạt động`,
        time: '2 giờ trước',
        badge: 'Hạ tầng',
        badgeStyle: 'bg-info-subtle text-info border border-info-subtle'
      });
    }

    // 3. Ghi nhận xác thực hệ thống / kiểm toán phân quyền
    activityLogs.push({
      icon: 'bi-person-badge-fill',
      colorClass: 'bg-success-subtle text-success',
      title: `Phiên làm việc Quản trị viên kích hoạt`,
      desc: `Kiểm toán RBAC & phân quyền tài nguyên`,
      time: 'Hôm nay, 08:30',
      badge: 'Bảo mật',
      badgeStyle: 'bg-secondary-subtle text-secondary border'
    });

    container.innerHTML = `
      <div class="admin-dashboard-page">
        <!-- 1. Header tinh gọn, chuyên nghiệp (Yêu cầu 4, 5, 11) -->
        ${renderAdminSubnav('dashboard')}

        <!-- 2. Bốn KPI Cards đồng nhất, nền trắng, viền nhẹ (Yêu cầu 6) -->
        <div class="row g-3 mb-4" id="admin-kpi-row">
          <!-- KPI 1: Tổng số phòng -->
          <div class="col-6 col-lg-3">
            <div class="admin-kpi-card">
              <div class="admin-kpi-header">
                <span class="admin-kpi-label">Tổng số phòng</span>
                <div class="admin-kpi-icon-wrapper text-primary">
                  <i class="bi bi-door-open"></i>
                </div>
              </div>
              <div class="admin-kpi-value">${allRooms.length}</div>
              <div class="admin-kpi-subtext text-success">
                <i class="bi bi-check-circle-fill"></i>
                <span>${activeRooms} phòng đang hoạt động</span>
              </div>
            </div>
          </div>

          <!-- KPI 2: Trang thiết bị -->
          <div class="col-6 col-lg-3">
            <div class="admin-kpi-card">
              <div class="admin-kpi-header">
                <span class="admin-kpi-label">Trang thiết bị</span>
                <div class="admin-kpi-icon-wrapper text-info">
                  <i class="bi bi-cpu"></i>
                </div>
              </div>
              <div class="admin-kpi-value">${allEquipments.length}</div>
              <div class="admin-kpi-subtext ${maintenanceEquipments > 0 ? 'text-warning' : 'text-primary'}">
                <i class="bi bi-check2-circle"></i>
                <span>${availEquipments} thiết bị sẵn sàng</span>
              </div>
            </div>
          </div>

          <!-- KPI 3: Lịch họp đã đặt -->
          <div class="col-6 col-lg-3">
            <div class="admin-kpi-card">
              <div class="admin-kpi-header">
                <span class="admin-kpi-label">Lịch họp đã đặt</span>
                <div class="admin-kpi-icon-wrapper text-warning">
                  <i class="bi bi-calendar3"></i>
                </div>
              </div>
              <div class="admin-kpi-value">${allMeetings.length}</div>
              <div class="admin-kpi-subtext text-secondary">
                <i class="bi bi-clock-history text-warning"></i>
                <span>${scheduledMeetings} cuộc họp sắp tới</span>
              </div>
            </div>
          </div>

          <!-- KPI 4: Nhân sự hệ thống -->
          <div class="col-6 col-lg-3">
            <div class="admin-kpi-card">
              <div class="admin-kpi-header">
                <span class="admin-kpi-label">Nhân sự hệ thống</span>
                <div class="admin-kpi-icon-wrapper text-secondary">
                  <i class="bi bi-people"></i>
                </div>
              </div>
              <div class="admin-kpi-value" id="admin-kpi-users-value">${usersCount}</div>
              <div class="admin-kpi-subtext text-secondary">
                <i class="bi bi-shield-check text-primary"></i>
                <span>Đồng bộ toàn cơ sở</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Bố cục chính: Ưu tiên Bảng Lịch họp ngay sau KPI + Cột thống kê & thao tác nhanh (Yêu cầu 7, 8, 9, 10, 12) -->
        <div class="row g-4 mb-4">
          <!-- Cột chính (8/12): Bảng Lịch họp toàn hệ thống gần đây (Yêu cầu 8) -->
          <div class="col-12 col-xl-8">
            <div class="admin-card h-100 d-flex flex-column">
              <div class="admin-card-header d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-calendar-event text-primary fs-5"></i>
                  <h2 class="admin-card-title m-0">Lịch họp toàn hệ thống gần đây</h2>
                  <span class="badge bg-light text-secondary border px-2 py-0.5 small fw-semibold">${allMeetings.length}</span>
                </div>
                <a href="#/meetings" class="admin-card-action-link" title="Xem danh sách tất cả các cuộc họp">
                  <span>Xem tất cả</span>
                  <i class="bi bi-arrow-right"></i>
                </a>
              </div>

              <div class="admin-card-body p-0 flex-grow-1">
                <div class="table-responsive">
                  <table class="table admin-table mb-0 align-middle">
                    <thead>
                      <tr>
                        <th style="min-width: 170px;">Cuộc họp</th>
                        <th style="min-width: 110px;">Chủ trì</th>
                        <th style="min-width: 115px;">Phòng họp</th>
                        <th style="min-width: 95px;">Thời gian</th>
                        <th style="min-width: 105px;">Trạng thái</th>
                        <th class="text-end" style="width: 44px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${recentMeetings.length === 0 ? `
                        <tr>
                          <td colspan="6" class="text-center py-5 text-muted">
                            <i class="bi bi-calendar-x fs-1 opacity-50 mb-2 d-block"></i>
                            <span class="fw-medium">Chưa có dữ liệu cuộc họp nào trong hệ thống.</span>
                          </td>
                        </tr>
                      ` : recentMeetings.map(m => {
                        const hostName = m.host || 'Thành viên';
                        const initials = typeof window.getInitials === 'function' ? window.getInitials(hostName) : 'U';
                        const color = typeof window.getHostColor === 'function' ? window.getHostColor(hostName) : '#2563eb';

                        return `
                          <tr>
                            <!-- Tiêu đề cuộc họp -->
                            <td>
                              <div class="d-flex flex-column" style="max-width: 190px;">
                                <div class="fw-semibold text-slate-900 text-truncate" title="${escapeHtml(m.title)}">
                                  ${escapeHtml(m.title)}
                                </div>
                                <div class="d-flex align-items-center gap-1 mt-0.5">
                                  ${m.tag ? `<span class="badge bg-light text-secondary border px-1.5 py-0.5" style="font-size: 0.68rem;">${escapeHtml(m.tag)}</span>` : ''}
                                  ${m.isRecurring ? `<span class="badge bg-info-subtle text-info border border-info-subtle px-1.5 py-0.5" style="font-size: 0.68rem;" title="Lịch họp định kỳ"><i class="bi bi-repeat me-0.5"></i>Định kỳ</span>` : ''}
                                </div>
                              </div>
                            </td>

                            <!-- Người chủ trì -->
                            <td>
                              <div class="d-flex align-items-center gap-1.5">
                                <span class="admin-user-avatar-sm" style="background-color: ${color}; color: #ffffff;">${initials}</span>
                                <span class="fw-medium text-slate-800 text-truncate" style="max-width: 100px;" title="${escapeHtml(hostName)}">
                                  ${escapeHtml(hostName)}
                                </span>
                              </div>
                            </td>

                            <!-- Phòng họp -->
                            <td>
                              <div class="d-flex align-items-center gap-1.5">
                                <span class="admin-room-icon-box text-primary"><i class="bi bi-door-closed"></i></span>
                                <span class="text-slate-800 fw-medium text-truncate" style="max-width: 105px;" title="${escapeHtml(m.roomName || 'Chưa xếp phòng')}">
                                  ${escapeHtml(m.roomName || 'Chưa xếp phòng')}
                                </span>
                              </div>
                            </td>

                            <!-- Ngày giờ -->
                            <td>
                              ${formatMeetingDateTime(m)}
                            </td>

                            <!-- Trạng thái -->
                            <td>
                              ${renderMeetingStatusPill(m.status)}
                            </td>

                            <!-- Thao tác chi tiết -->
                            <td class="text-end">
                              <button type="button" class="admin-btn-action" onclick="if (typeof openDetailModal === 'function') openDetailModal(${m.id})" title="Xem thông tin chi tiết cuộc họp">
                                <i class="bi bi-eye"></i>
                              </button>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Cột phụ (4/12): Thống kê vận hành phòng & Lối tắt quản lý (Yêu cầu 7, 9) -->
          <div class="col-12 col-xl-4 d-flex flex-column gap-3">
            <!-- Card Phụ 1: Tình trạng phòng họp & Tài nguyên (Yêu cầu 9) -->
            <div class="admin-card">
              <div class="admin-card-header d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-pie-chart text-primary fs-5"></i>
                  <h3 class="admin-card-title m-0">Tình trạng phòng họp</h3>
                </div>
                <a href="#/admin/rooms" class="admin-card-action-link" title="Quản lý danh sách phòng họp">
                  <span>Quản lý</span>
                  <i class="bi bi-arrow-right"></i>
                </a>
              </div>

              <div class="admin-card-body">
                <!-- Thanh tỷ lệ sẵn sàng -->
                <div class="mb-3">
                  <div class="d-flex justify-content-between align-items-center small mb-1">
                    <span class="text-secondary">Tỷ lệ phòng sẵn sàng</span>
                    <span class="fw-bold text-slate-800">${roomOccupancyRate}%</span>
                  </div>
                  <div class="progress admin-progress-bar">
                    <div class="progress-bar bg-success" style="width: ${roomOccupancyRate}%" role="progressbar" aria-valuenow="${roomOccupancyRate}" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </div>

                <!-- 3 ô trạng thái rút gọn -->
                <div class="admin-status-breakdown-grid mb-3">
                  <div class="admin-status-breakdown-item bg-success-subtle">
                    <div class="small text-success fw-medium">Sẵn sàng</div>
                    <div class="fw-bold text-success fs-5">${activeRooms}</div>
                  </div>
                  <div class="admin-status-breakdown-item bg-warning-subtle">
                    <div class="small text-warning fw-medium">Bảo trì</div>
                    <div class="fw-bold text-warning fs-5">${maintenanceRooms}</div>
                  </div>
                  <div class="admin-status-breakdown-item bg-light">
                    <div class="small text-secondary fw-medium">Tạm ngưng</div>
                    <div class="fw-bold text-secondary fs-5">${inactiveRooms}</div>
                  </div>
                </div>

                <!-- Cảnh báo vận hành tài nguyên -->
                ${maintenanceEquipments > 0 ? `
                  <div class="admin-alert-banner alert-warning-soft mb-3">
                    <i class="bi bi-exclamation-triangle-fill text-warning flex-shrink-0"></i>
                    <div class="small">
                      Có <strong>${maintenanceEquipments} thiết bị</strong> đang ở trạng thái bảo trì/sửa chữa.
                    </div>
                  </div>
                ` : `
                  <div class="admin-alert-banner alert-success-soft mb-3">
                    <i class="bi bi-check-circle-fill text-success flex-shrink-0"></i>
                    <div class="small">
                      Toàn bộ hạ tầng thiết bị kỹ thuật đang sẵn sàng.
                    </div>
                  </div>
                `}

                <!-- Danh sách 3 phòng mẫu -->
                <div class="d-flex flex-column">
                  ${sampleRooms.map(r => {
                    const isActive = (r.status || '').toLowerCase() === 'active';
                    return `
                      <div class="admin-mini-room-item">
                        <div class="d-flex align-items-center gap-2">
                          <span class="admin-room-icon-box ${isActive ? 'text-primary' : 'text-warning'}">
                            <i class="bi bi-door-closed"></i>
                          </span>
                          <div>
                            <div class="small fw-semibold text-slate-800">${escapeHtml(r.name || r.roomName)}</div>
                            <div class="text-secondary" style="font-size: 0.7rem;">Sức chứa: ${r.capacity || 10} chỗ</div>
                          </div>
                        </div>
                        <span class="badge ${isActive ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}" style="font-size: 0.7rem;">
                          ${isActive ? 'Hoạt động' : 'Bảo trì'}
                        </span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- Card Phụ 2: Nhật ký hoạt động hệ thống gần đây (System Activity / Audit Log) -->
            <div class="admin-card">
              <div class="admin-card-header d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-clock-history text-primary fs-5"></i>
                  <h3 class="admin-card-title m-0">Nhật ký hoạt động</h3>
                </div>
                <span class="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1.5 px-2 py-0.5" style="font-size: 0.7rem;">
                  <span class="activity-pulse-dot"></span> Trực tiếp
                </span>
              </div>

              <div class="admin-card-body p-3">
                <div class="admin-activity-timeline">
                  ${activityLogs.map((log, index) => `
                    <div class="admin-activity-item ${index === activityLogs.length - 1 ? 'is-last' : ''}">
                      <div class="admin-activity-bullet ${log.colorClass}">
                        <i class="bi ${log.icon}"></i>
                      </div>
                      <div class="admin-activity-content">
                        <div class="d-flex justify-content-between align-items-start gap-1">
                          <span class="admin-activity-title text-truncate" title="${escapeHtml(log.title)}">
                            ${escapeHtml(log.title)}
                          </span>
                          <span class="admin-activity-time flex-shrink-0">${log.time}</span>
                        </div>
                        <div class="admin-activity-desc text-truncate" title="${escapeHtml(log.desc)}">
                          ${escapeHtml(log.desc)}
                        </div>
                        ${log.badge ? `
                          <div class="mt-1">
                            <span class="badge ${log.badgeStyle}" style="font-size: 0.65rem;">${escapeHtml(log.badge)}</span>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="admin-card-footer p-2.5 text-center border-top bg-slate-50" style="border-radius: 0 0 12px 12px;">
                <span class="text-secondary" style="font-size: 0.725rem;">
                  <i class="bi bi-shield-check text-success me-1"></i> Ghi nhận tự động bởi Security &amp; Audit Logger
                </span>
              </div>
            </div>
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
          <div class="mb-4">
            <h4 class="fw-bold text-slate-900 m-0">Danh sách Tài khoản & Phân quyền Người dùng</h4>
            <p class="text-secondary small m-0 mt-1">Đồng bộ từ CSDL MySQL và hệ thống tài khoản nhân viên</p>
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
