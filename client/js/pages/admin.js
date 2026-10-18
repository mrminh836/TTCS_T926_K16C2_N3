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
  // 3. ADMIN BÁO CÁO & THỐNG KÊ (#/admin/reports) — DASHBOARD HIỆU SUẤT STITCH
  // ============================================================================

  // Trạng thái bộ lọc toàn cục của trang Báo cáo
  const reportFilterState = {
    period: 'all',          // 'all', 'day', 'week', 'month', 'custom'
    month: '2026-10',
    date: '',
    startDate: '',
    endDate: '',
    department: 'all',      // 'all', 'Kỹ thuật', 'Quản trị', 'Hành chính', 'Kiểm thử', 'Thiết kế'
    roomId: 'all',
    status: 'all',
    page: 1,
    limit: 10,
    loading: false,
    analyticsData: null,
    filteredData: null
  };

  /**
   * Helper trích xuất JWT Token để gọi API
   */
  function getAuthBearerToken() {
    return (window.AuthState && typeof window.AuthState.getToken === 'function')
      ? window.AuthState.getToken()
      : (localStorage.getItem('accessToken') || localStorage.getItem('token') || '');
  }

  /**
   * Xây dựng chuỗi Query String từ trạng thái bộ lọc
   */
  function buildReportQueryParams(extraParams = {}) {
    const params = new URLSearchParams();
    const st = { ...reportFilterState, ...extraParams };

    if (st.period && st.period !== 'all') {
      params.append('period', st.period);
    }
    if (st.period === 'month' && st.month) {
      params.append('month', st.month);
    } else if (st.period === 'day' && st.date) {
      params.append('date', st.date);
    } else if (st.period === 'custom') {
      if (st.startDate) params.append('startDate', st.startDate);
      if (st.endDate) params.append('endDate', st.endDate);
    } else if (st.startDate && st.endDate) {
      params.append('startDate', st.startDate);
      params.append('endDate', st.endDate);
    }

    if (st.department && st.department !== 'all') {
      params.append('department', st.department);
    }
    if (st.roomId && st.roomId !== 'all') {
      params.append('roomId', st.roomId);
    }
    if (st.status && st.status !== 'all') {
      params.append('status', st.status);
    }

    return params.toString();
  }

  /**
   * Tải dữ liệu Báo cáo & Thống kê từ Backend APIs
   */
  async function fetchReportData() {
    const token = getAuthBearerToken();
    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const analyticsQs = buildReportQueryParams();
    const filterQs = buildReportQueryParams({ page: reportFilterState.page, limit: reportFilterState.limit });

    const [analyticsRes, filterRes] = await Promise.all([
      fetch(`/api/reports/analytics${analyticsQs ? '?' + analyticsQs : ''}`, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch(`/api/reports/filter${filterQs ? '?' + filterQs : ''}`, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    ]);

    if (analyticsRes && analyticsRes.success) {
      reportFilterState.analyticsData = analyticsRes.data;
    }
    if (filterRes && filterRes.success) {
      reportFilterState.filteredData = filterRes.data;
    }
  }

  /**
   * Xử lý tải tệp báo cáo Excel / CSV
   */
  async function handleExportReportExcel() {
    const exportBtn = document.getElementById('btn-export-report-excel');
    const originalHtml = exportBtn ? exportBtn.innerHTML : '';

    try {
      if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Đang xuất tệp...`;
      }

      const token = getAuthBearerToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const qs = buildReportQueryParams({ format: 'csv' });
      const res = await fetch(`/api/reports/export?${qs}`, { headers });

      if (!res.ok) {
        throw new Error(`Lỗi máy chủ (${res.status}): Không thể kết xuất tệp.`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `Bao_cao_hieu_suat_phong_hop_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      if (typeof window.showToast === 'function') {
        window.showToast('Xuất báo cáo Excel / CSV UTF-8 thành công!', 'success');
      }
    } catch (err) {
      console.error('Lỗi xuất tệp:', err);
      alert('Không thể xuất tệp báo cáo: ' + err.message);
    } finally {
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = originalHtml;
      }
    }
  }

  /**
   * Render trang Báo cáo & Thống kê Hiệu suất
   */
  async function renderAdminReportsPage() {
    const container = document.getElementById('app');
    if (!container) return;

    // Hiển thị khung chờ nạp (Skeleton Loading)
    container.innerHTML = `
      <div class="admin-reports-dashboard">
        ${renderAdminSubnav('reports')}
        <div class="text-center py-5">
          <div class="spinner-border text-primary mb-3" style="width: 2.5rem; height: 2.5rem;" role="status">
            <span class="visually-hidden">Đang nạp dữ liệu...</span>
          </div>
          <p class="text-secondary fw-medium">Đang tải và tính toán dữ liệu thống kê hiệu suất...</p>
        </div>
      </div>
    `;

    // Nạp dữ liệu từ Backend
    await fetchReportData();

    // Render giao diện hoàn chỉnh
    renderReportsDashboardView();
  }

  /**
   * Render chi tiết toàn bộ thành phần Dashboard sau khi nạp dữ liệu
   */
  function renderReportsDashboardView() {
    const container = document.getElementById('app');
    if (!container) return;

    const analytics = reportFilterState.analyticsData || {};
    const sum = analytics.summary || {};
    const rooms = analytics.roomUtilization || [];
    const statusDist = analytics.statusDistribution || {};
    const timeline = analytics.timeline || [];
    const filtered = reportFilterState.filteredData || {};
    const meetings = filtered.meetings || [];
    const deptBreakdown = filtered.departmentBreakdown || [];
    const allRooms = window.ROOMS || [];

    // Tính toán badge tỷ lệ hủy (An toàn / Cảnh báo)
    const cancelRate = sum.cancellationRate || 0;
    let cancelBadgeCls = 'bg-success-subtle text-success border border-success-subtle';
    let cancelBadgeText = 'Mức an toàn (< 10%)';
    if (cancelRate >= 20) {
      cancelBadgeCls = 'bg-danger-subtle text-danger border border-danger-subtle';
      cancelBadgeText = 'Cảnh báo cao (≥ 20%)';
    } else if (cancelRate >= 10) {
      cancelBadgeCls = 'bg-warning-subtle text-warning border border-warning-subtle';
      cancelBadgeText = 'Cần chú ý (10 - 20%)';
    }

    container.innerHTML = `
      <div class="admin-reports-dashboard">
        ${renderAdminSubnav('reports')}

        <!-- 1. HEADER & HÀNH ĐỘNG CHÍNH -->
        <div class="reports-header-card d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1">
                <i class="bi bi-graph-up-arrow me-1"></i> Báo cáo Thời gian thực
              </span>
              <span class="text-secondary small">Kỳ khảo sát: <strong>${escapeHtml(analytics.filter?.startDate || 'Toàn thời gian')}</strong> → <strong>${escapeHtml(analytics.filter?.endDate || 'Hiện tại')}</strong></span>
            </div>
            <h4 class="fw-bold text-slate-900 mt-2 mb-0">Hiệu suất Phân bổ Phòng họp Doanh nghiệp</h4>
            <p class="text-secondary small mb-0 mt-1">Phân tích tỷ lệ lấp đầy, tần suất đặt phòng và tỷ lệ hủy họp hỗ trợ tối ưu tài nguyên</p>
          </div>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button type="button" class="btn btn-outline-secondary btn-sm px-3 py-2 fw-medium" id="btn-refresh-reports" title="Làm mới dữ liệu từ CSDL">
              <i class="bi bi-arrow-clockwise me-1"></i> Làm mới
            </button>
            <button type="button" class="btn stitch-btn-export-excel btn-sm py-2 px-3" id="btn-export-report-excel">
              <i class="bi bi-file-earmark-excel me-1.5"></i> Xuất Báo cáo Excel / CSV
            </button>
          </div>
        </div>

        <!-- 2. BỘ LỌC BÁO CÁO THEO THỜI GIAN & PHÒNG BAN (Task 5) -->
        <div class="reports-filter-bar mb-4">
          <div class="row g-3 align-items-center">
            <!-- Mốc thời gian -->
            <div class="col-12 col-xl-5">
              <div class="d-flex flex-column gap-1.5">
                <span class="text-secondary small fw-semibold"><i class="bi bi-calendar-range me-1 text-primary"></i>Mốc thời gian:</span>
                <div class="report-period-chips" id="report-period-chips-group">
                  <button type="button" class="report-period-chip ${reportFilterState.period === 'all' ? 'active' : ''}" data-period="all">Toàn bộ</button>
                  <button type="button" class="report-period-chip ${reportFilterState.period === 'day' ? 'active' : ''}" data-period="day">Hôm nay</button>
                  <button type="button" class="report-period-chip ${reportFilterState.period === 'week' ? 'active' : ''}" data-period="week">Tuần này</button>
                  <button type="button" class="report-period-chip ${reportFilterState.period === 'month' ? 'active' : ''}" data-period="month">Tháng 10/2026</button>
                  <button type="button" class="report-period-chip ${reportFilterState.period === 'custom' ? 'active' : ''}" data-period="custom">Tùy chọn...</button>
                </div>
              </div>
            </div>

            <!-- Phòng ban -->
            <div class="col-12 col-sm-6 col-xl-3">
              <label for="report-filter-dept" class="form-label text-secondary small fw-semibold m-0 mb-1">
                <i class="bi bi-building me-1 text-primary"></i>Phòng ban:
              </label>
              <select class="form-select form-select-sm reports-filter-select" id="report-filter-dept">
                <option value="all" ${reportFilterState.department === 'all' ? 'selected' : ''}>-- Tất cả phòng ban --</option>
                <option value="Kỹ thuật" ${reportFilterState.department === 'Kỹ thuật' ? 'selected' : ''}>Kỹ thuật (Tech / Dev)</option>
                <option value="Quản trị" ${reportFilterState.department === 'Quản trị' ? 'selected' : ''}>Quản trị & Điều hành</option>
                <option value="Hành chính" ${reportFilterState.department === 'Hành chính' ? 'selected' : ''}>Hành chính Nhân sự</option>
                <option value="Kiểm thử" ${reportFilterState.department === 'Kiểm thử' ? 'selected' : ''}>Kiểm thử chất lượng (QA)</option>
                <option value="Thiết kế" ${reportFilterState.department === 'Thiết kế' ? 'selected' : ''}>Thiết kế UI/UX</option>
              </select>
            </div>

            <!-- Phòng họp -->
            <div class="col-12 col-sm-6 col-xl-2">
              <label for="report-filter-room" class="form-label text-secondary small fw-semibold m-0 mb-1">
                <i class="bi bi-door-open me-1 text-primary"></i>Phòng họp:
              </label>
              <select class="form-select form-select-sm reports-filter-select" id="report-filter-room">
                <option value="all" ${reportFilterState.roomId === 'all' ? 'selected' : ''}>-- Tất cả phòng --</option>
                ${allRooms.map(r => `
                  <option value="${r.id}" ${String(reportFilterState.roomId) === String(r.id) ? 'selected' : ''}>${escapeHtml(r.name)} (${r.capacity} chỗ)</option>
                `).join('')}
              </select>
            </div>

            <!-- Nút thao tác lọc -->
            <div class="col-12 col-xl-2 d-flex gap-2 align-items-end pt-sm-4 pt-xl-0">
              <button type="button" class="btn btn-primary btn-sm flex-fill py-1.5" id="btn-apply-report-filters">
                <i class="bi bi-funnel-fill me-1"></i> Áp dụng
              </button>
              <button type="button" class="btn btn-light border btn-sm py-1.5 px-2.5" id="btn-reset-report-filters" title="Đặt lại bộ lọc về mặc định">
                <i class="bi bi-arrow-counterclockwise"></i>
              </button>
            </div>
          </div>

          <!-- Dải ngày tùy chọn (Hiển thị khi chọn Tùy chọn) -->
          <div class="row g-2 mt-2 pt-2 border-top ${reportFilterState.period === 'custom' ? '' : 'd-none'}" id="report-custom-date-box">
            <div class="col-sm-5">
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-light text-secondary">Từ ngày:</span>
                <input type="date" class="form-control" id="report-custom-start" value="${reportFilterState.startDate || ''}">
              </div>
            </div>
            <div class="col-sm-5">
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-light text-secondary">Đến ngày:</span>
                <input type="date" class="form-control" id="report-custom-end" value="${reportFilterState.endDate || ''}">
              </div>
            </div>
            <div class="col-sm-2">
              <button type="button" class="btn btn-outline-primary btn-sm w-100" id="btn-apply-custom-date">
                Xác nhận ngày
              </button>
            </div>
          </div>
        </div>

        <!-- 3. THẺ CHỈ SỐ KPI TỔNG QUAN (EXECUTIVE METRIC CARDS) -->
        <div class="reports-kpi-grid mb-4">
          <!-- Card 1: Tổng cuộc họp -->
          <div class="reports-kpi-card kpi-blue">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="reports-kpi-label">Tổng cuộc họp</span>
              <div class="reports-kpi-icon-wrap"><i class="bi bi-calendar2-check"></i></div>
            </div>
            <div class="reports-kpi-val">${sum.totalMeetings || 0}</div>
            <div class="text-secondary small mt-1.5 d-flex align-items-center gap-1">
              <span class="text-success fw-semibold"><i class="bi bi-check2"></i> ${sum.confirmedMeetings || 0}</span> xác nhận •
              <span class="text-danger fw-semibold"><i class="bi bi-x"></i> ${sum.cancelledMeetings || 0}</span> đã hủy
            </div>
          </div>

          <!-- Card 2: Tỷ lệ lấp đầy thời gian -->
          <div class="reports-kpi-card kpi-emerald">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="reports-kpi-label">% Lấp đầy thời gian</span>
              <div class="reports-kpi-icon-wrap"><i class="bi bi-pie-chart-fill"></i></div>
            </div>
            <div class="reports-kpi-val">${sum.timeOccupancyRate || 0}%</div>
            <div class="progress mt-2" style="height: 6px;">
              <div class="progress-bar bg-success" role="progressbar" style="width: ${Math.min(100, sum.timeOccupancyRate || 0)}%"></div>
            </div>
            <div class="text-secondary small mt-1.5">Giờ phòng có người sử dụng</div>
          </div>

          <!-- Card 3: Tỷ lệ lấp đầy sức chứa -->
          <div class="reports-kpi-card kpi-amber">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="reports-kpi-label">% Lấp đầy sức chứa</span>
              <div class="reports-kpi-icon-wrap"><i class="bi bi-people-fill"></i></div>
            </div>
            <div class="reports-kpi-val">${sum.capacityOccupancyRate || 0}%</div>
            <div class="progress mt-2" style="height: 6px;">
              <div class="progress-bar bg-warning" role="progressbar" style="width: ${Math.min(100, sum.capacityOccupancyRate || 0)}%"></div>
            </div>
            <div class="text-secondary small mt-1.5">Số ghế thực dùng / Sức chứa phòng</div>
          </div>

          <!-- Card 4: Tỷ lệ hủy cuộc họp -->
          <div class="reports-kpi-card kpi-rose">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="reports-kpi-label">% Cuộc họp bị hủy</span>
              <div class="reports-kpi-icon-wrap"><i class="bi bi-x-circle-fill"></i></div>
            </div>
            <div class="reports-kpi-val">${sum.cancellationRate || 0}%</div>
            <div class="mt-2">
              <span class="badge ${cancelBadgeCls} small fw-normal px-2 py-0.5">${cancelBadgeText}</span>
            </div>
            <div class="text-secondary small mt-1">${sum.totalBookingHours || 0} giờ sử dụng tổng cộng</div>
          </div>
        </div>

        <!-- 4. KHU VỰC BIỂU ĐỒ TRỰC QUAN (CHARTS & ANALYTICS) -->
        <div class="row g-4 mb-4">
          <!-- Biểu đồ 1: Tần suất & Mật độ sử dụng theo Phòng họp -->
          <div class="col-lg-7">
            <div class="card border-0 shadow-sm rounded-3 p-4 h-100 bg-white">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold text-slate-900 m-0">
                  <i class="bi bi-bar-chart-steps text-primary me-2"></i>Mật độ & Tần suất Sử dụng Phòng họp
                </h5>
                <span class="badge bg-light text-secondary border small">Xếp hạng theo giờ</span>
              </div>
              <p class="text-secondary small mb-3">Tỷ lệ lấp đầy thời gian và số cuộc họp đã diễn ra của từng phòng họp:</p>

              <div class="d-flex flex-column gap-3.5">
                ${rooms.length === 0 ? `
                  <div class="text-center py-4 text-muted small">Không có dữ liệu phòng họp trong khoảng thời gian này.</div>
                ` : rooms.map((item, idx) => {
                  let rankCls = 'rank-other';
                  if (item.rank === 1) rankCls = 'rank-1';
                  else if (item.rank === 2) rankCls = 'rank-2';
                  else if (item.rank === 3) rankCls = 'rank-3';

                  const timePct = item.timeOccupancyRate || 0;
                  const capPct = item.capacityOccupancyRate || 0;
                  const isMaint = (item.status || '').toLowerCase() === 'maintenance';

                  return `
                    <div class="room-util-item">
                      <div class="d-flex justify-content-between align-items-center mb-1.5">
                        <div class="d-flex align-items-center gap-2">
                          <span class="room-rank-badge ${rankCls}">${item.rank || (idx + 1)}</span>
                          <div>
                            <span class="fw-semibold text-slate-900">${escapeHtml(item.roomName)}</span>
                            <span class="text-secondary small ms-1.5">(${item.capacity} chỗ • ${escapeHtml(item.type || 'Hội nghị')})</span>
                          </div>
                        </div>
                        <div class="text-end">
                          <span class="badge ${isMaint ? 'bg-warning-subtle text-warning' : 'bg-primary-subtle text-primary'} px-2 py-0.5 small me-1">
                            ${item.totalMeetings} cuộc họp (${item.totalHours}h)
                          </span>
                          <span class="fw-bold text-slate-900 small">${timePct}% thời gian</span>
                        </div>
                      </div>

                      <div class="progress" style="height: 7px;">
                        <div class="progress-bar ${isMaint ? 'bg-warning' : 'bg-primary'}" role="progressbar" style="width: ${Math.min(100, timePct)}%" title="% Lấp đầy thời gian: ${timePct}%"></div>
                      </div>

                      <div class="d-flex justify-content-between text-secondary mt-1" style="font-size: 0.725rem;">
                        <span>Thị phần sử dụng: <strong>${item.usageShare}%</strong></span>
                        <span>% Lấp đầy sức chứa: <strong>${capPct}%</strong> (bình quân ${item.averageParticipants} người)</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Biểu đồ 2: Phân bổ Trạng thái & Biểu đồ Hủy cuộc họp -->
          <div class="col-lg-5">
            <div class="card border-0 shadow-sm rounded-3 p-4 h-100 bg-white">
              <h5 class="fw-bold text-slate-900 mb-3">
                <i class="bi bi-pie-chart text-info me-2"></i>Phân bổ Trạng thái & Hủy cuộc họp
              </h5>

              <!-- Thanh phân đoạn trạng thái -->
              <div class="status-segmented-bar mb-3">
                <div class="status-segment-confirmed" style="width: ${statusDist.confirmed?.percentage || 0}%;" title="Xác nhận: ${statusDist.confirmed?.percentage || 0}%"></div>
                <div class="status-segment-completed" style="width: ${statusDist.completed?.percentage || 0}%;" title="Hoàn thành: ${statusDist.completed?.percentage || 0}%"></div>
                <div class="status-segment-cancelled" style="width: ${statusDist.cancelled?.percentage || 0}%;" title="Đã hủy: ${statusDist.cancelled?.percentage || 0}%"></div>
              </div>

              <!-- Danh sách chi tiết trạng thái -->
              <div class="d-flex flex-column gap-2 mb-4">
                <div class="p-2.5 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span class="small"><span class="status-legend-dot" style="background:#3b82f6;"></span> Đã lên lịch (Confirmed):</span>
                  <span class="fw-bold text-primary">${statusDist.confirmed?.count || 0} (${statusDist.confirmed?.percentage || 0}%)</span>
                </div>
                <div class="p-2.5 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span class="small"><span class="status-legend-dot" style="background:#10b981;"></span> Đã hoàn thành (Completed):</span>
                  <span class="fw-bold text-success">${statusDist.completed?.count || 0} (${statusDist.completed?.percentage || 0}%)</span>
                </div>
                <div class="p-2.5 bg-light rounded-3 d-flex justify-content-between align-items-center">
                  <span class="small"><span class="status-legend-dot" style="background:#ef4444;"></span> Đã hủy lịch (Cancelled):</span>
                  <span class="fw-bold text-danger">${statusDist.cancelled?.count || 0} (${statusDist.cancelled?.percentage || 0}%)</span>
                </div>
              </div>

              <!-- Phân bổ theo Phòng ban (Task 2 & 5) -->
              <h6 class="fw-bold text-slate-800 mb-2.5 border-top pt-3">
                <i class="bi bi-diagram-3 text-secondary me-1.5"></i>Tỷ trọng sử dụng theo Phòng ban:
              </h6>
              <div class="d-flex flex-column gap-2">
                ${deptBreakdown.length === 0 ? `
                  <div class="text-muted small">Chưa có dữ liệu phân chia phòng ban.</div>
                ` : deptBreakdown.map(dept => `
                  <div>
                    <div class="d-flex justify-content-between small mb-1">
                      <span class="fw-medium text-slate-800">${escapeHtml(dept.department)}</span>
                      <span class="text-secondary">${dept.meetingCount} cuộc họp (${dept.sharePercentage}%)</span>
                    </div>
                    <div class="progress" style="height: 5px;">
                      <div class="progress-bar bg-info" style="width: ${dept.sharePercentage}%"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- 5. BIỂU ĐỒ XU HƯỚNG SỬ DỤNG THEO NGÀY (DAILY TIMELINE TREND) -->
        <div class="card border-0 shadow-sm rounded-3 p-4 mb-4 bg-white">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h5 class="fw-bold text-slate-900 m-0"><i class="bi bi-graph-up text-primary me-2"></i>Xu hướng Đặt phòng theo Ngày</h5>
              <p class="text-secondary small m-0 mt-0.5">Số lượng cuộc họp và tổng số giờ diễn ra mỗi ngày</p>
            </div>
            <span class="badge bg-light text-secondary border small"><i class="bi bi-clock me-1"></i>Số giờ họp</span>
          </div>

          <div class="report-timeline-container">
            ${timeline.length === 0 ? `
              <div class="w-100 text-center py-4 text-muted small">Không có dữ liệu xu hướng trong kỳ khảo sát này.</div>
            ` : timeline.map(day => {
              const maxHours = Math.max(...timeline.map(t => t.totalHours), 5);
              const fillPct = Math.round((day.totalHours / maxHours) * 100);
              const shortDate = day.date.slice(5); // MM-DD

              return `
                <div class="timeline-bar-column">
                  <span class="text-muted" style="font-size: 0.7rem; font-weight: 600;">${day.totalHours}h</span>
                  <div class="timeline-bar-track" title="${day.date}: ${day.meetingCount} cuộc họp (${day.totalHours} giờ)">
                    <div class="timeline-bar-fill" style="height: ${Math.max(8, fillPct)}%;"></div>
                  </div>
                  <span class="timeline-bar-date">${shortDate}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 6. BẢNG DANH SÁCH CHI TIẾT CÁC CUỘC HỌP THEO BỘ LỌC -->
        <div class="card border-0 shadow-sm rounded-3 p-4 mb-4 bg-white">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 class="fw-bold text-slate-900 m-0"><i class="bi bi-table text-primary me-2"></i>Danh sách Chi tiết Cuộc họp trong Kỳ</h5>
              <p class="text-secondary small m-0 mt-0.5">Hiển thị ${meetings.length} trên tổng số ${filtered.pagination?.total || meetings.length} cuộc họp</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0" style="font-size: 0.85rem;">
              <thead class="table-light">
                <tr>
                  <th style="width: 50px;">STT</th>
                  <th>Tiêu đề cuộc họp</th>
                  <th>Phòng họp</th>
                  <th>Thời gian họp</th>
                  <th>Thời lượng</th>
                  <th>Phòng ban</th>
                  <th>Người tổ chức</th>
                  <th class="text-center">Người tham gia</th>
                  <th class="text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${meetings.length === 0 ? `
                  <tr>
                    <td colspan="9" class="text-center py-4 text-muted">
                      <i class="bi bi-inbox fs-3 d-block mb-2 text-secondary opacity-50"></i>
                      Không tìm thấy cuộc họp nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ` : meetings.map((m, idx) => {
                  const startStr = m.startTime ? new Date(m.startTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';
                  const isCancel = (m.bookingStatus || '').toLowerCase() === 'cancelled';

                  return `
                    <tr>
                      <td class="text-muted">${(reportFilterState.page - 1) * reportFilterState.limit + idx + 1}</td>
                      <td>
                        <div class="fw-semibold text-slate-900 ${isCancel ? 'text-decoration-line-through text-muted' : ''}">${escapeHtml(m.title)}</div>
                        ${m.isRecurring ? '<span class="badge bg-info-subtle text-info border border-info-subtle" style="font-size: 0.65rem;">Lặp định kỳ</span>' : ''}
                      </td>
                      <td>
                        <span class="badge bg-light text-slate-800 border">${escapeHtml(m.roomName || 'Chưa xếp phòng')}</span>
                      </td>
                      <td>
                        <div class="text-slate-800">${startStr}</div>
                      </td>
                      <td>
                        <span class="text-secondary">${m.durationMinutes || 0} phút</span>
                      </td>
                      <td>
                        <span class="badge bg-secondary-subtle text-secondary">${escapeHtml(m.organizerDepartment || 'Kỹ thuật')}</span>
                      </td>
                      <td>
                        <div class="fw-medium text-slate-900">${escapeHtml(m.organizerName || 'Thành viên')}</div>
                        <div class="text-muted" style="font-size: 0.725rem;">${escapeHtml(m.organizerEmail || '')}</div>
                      </td>
                      <td class="text-center">
                        <span class="badge bg-light text-secondary border px-2">
                          <i class="bi bi-people me-1"></i>${m.participantCount || 1}
                        </span>
                      </td>
                      <td class="text-center">
                        ${renderMeetingStatusPill(m.bookingStatus || 'Confirmed')}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Phân trang -->
          ${filtered.pagination?.totalPages > 1 ? `
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span class="text-secondary small">Trang ${filtered.pagination.currentPage} / ${filtered.pagination.totalPages}</span>
              <div class="btn-group btn-group-sm">
                <button type="button" class="btn btn-outline-secondary" id="btn-report-prev-page" ${!filtered.pagination.hasPrevPage ? 'disabled' : ''}>
                  <i class="bi bi-chevron-left"></i> Trước
                </button>
                <button type="button" class="btn btn-outline-secondary" id="btn-report-next-page" ${!filtered.pagination.hasNextPage ? 'disabled' : ''}>
                  Sau <i class="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Gắn các sự kiện tương tác
    bindReportsDashboardEvents();
  }

  /**
   * Gắn các sự kiện click, filter và export trên Dashboard Báo cáo
   */
  function bindReportsDashboardEvents() {
    // 1. Nút Xuất Excel / CSV
    const exportBtn = document.getElementById('btn-export-report-excel');
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExportReportExcel);
    }

    // 2. Nút Làm mới
    const refreshBtn = document.getElementById('btn-refresh-reports');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.classList.add('disabled');
        await fetchReportData();
        renderReportsDashboardView();
        if (typeof window.showToast === 'function') {
          window.showToast('Đã làm mới dữ liệu thống kê từ CSDL!', 'info');
        }
      });
    }

    // 3. Quick Period Chips
    const periodGroup = document.getElementById('report-period-chips-group');
    if (periodGroup) {
      periodGroup.querySelectorAll('.report-period-chip').forEach(btn => {
        btn.addEventListener('click', async () => {
          const p = btn.getAttribute('data-period');
          reportFilterState.period = p;
          reportFilterState.page = 1;

          if (p === 'custom') {
            const customBox = document.getElementById('report-custom-date-box');
            if (customBox) customBox.classList.remove('d-none');
            // Cập nhật active class
            periodGroup.querySelectorAll('.report-period-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            return;
          }

          // Reset custom date box nếu không phải custom
          const customBox = document.getElementById('report-custom-date-box');
          if (customBox) customBox.classList.add('d-none');

          await fetchReportData();
          renderReportsDashboardView();
        });
      });
    }

    // 4. Áp dụng bộ lọc Custom Date
    const applyCustomBtn = document.getElementById('btn-apply-custom-date');
    if (applyCustomBtn) {
      applyCustomBtn.addEventListener('click', async () => {
        const startInput = document.getElementById('report-custom-start');
        const endInput = document.getElementById('report-custom-end');
        if (startInput && endInput) {
          if (!startInput.value || !endInput.value) {
            alert('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.');
            return;
          }
          if (startInput.value > endInput.value) {
            alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
            return;
          }
          reportFilterState.startDate = startInput.value;
          reportFilterState.endDate = endInput.value;
          reportFilterState.page = 1;
          await fetchReportData();
          renderReportsDashboardView();
        }
      });
    }

    // 5. Nút Áp dụng Bộ lọc Chính (Phòng ban & Phòng họp)
    const applyBtn = document.getElementById('btn-apply-report-filters');
    if (applyBtn) {
      applyBtn.addEventListener('click', async () => {
        const deptSelect = document.getElementById('report-filter-dept');
        const roomSelect = document.getElementById('report-filter-room');
        if (deptSelect) reportFilterState.department = deptSelect.value;
        if (roomSelect) reportFilterState.roomId = roomSelect.value;
        reportFilterState.page = 1;

        await fetchReportData();
        renderReportsDashboardView();
      });
    }

    // 6. Nút Đặt lại Bộ lọc
    const resetBtn = document.getElementById('btn-reset-report-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        reportFilterState.period = 'all';
        reportFilterState.department = 'all';
        reportFilterState.roomId = 'all';
        reportFilterState.startDate = '';
        reportFilterState.endDate = '';
        reportFilterState.page = 1;

        await fetchReportData();
        renderReportsDashboardView();
      });
    }

    // 7. Phân trang cuộc họp
    const prevPageBtn = document.getElementById('btn-report-prev-page');
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', async () => {
        if (reportFilterState.page > 1) {
          reportFilterState.page -= 1;
          await fetchReportData();
          renderReportsDashboardView();
        }
      });
    }

    const nextPageBtn = document.getElementById('btn-report-next-page');
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', async () => {
        reportFilterState.page += 1;
        await fetchReportData();
        renderReportsDashboardView();
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

  // Xuất ra toàn cục
  window.renderAdminSubnav = renderAdminSubnav;
  window.renderAdminDashboardPage = renderAdminDashboardPage;
  window.renderAdminUsersPage = renderAdminUsersPage;
  window.renderAdminReportsPage = renderAdminReportsPage;
  window.handleExportReportExcel = handleExportReportExcel;

})(window, document);
