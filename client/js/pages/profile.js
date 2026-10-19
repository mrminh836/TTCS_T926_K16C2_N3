/**
 * ==============================================================================
 * PAGE: HỒ SƠ CÁ NHÂN & LỊCH HỌP CỦA TÔI (USER PROFILE & MY MEETINGS)
 * Route: #/profile
 * Thiết kế chuẩn Stitch Enterprise UI/UX - Đồng bộ CSDL Thời gian thực
 * Hỗ trợ: Cập nhật thông tin tài khoản (Họ tên, Email, Phòng ban) & Đổi mật khẩu
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  let currentProfileData = null;

  /**
   * Helper lấy Access Token hiện tại
   */
  function getAccessToken() {
    return localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
  }

  /**
   * Đồng bộ thông tin người dùng lên toàn bộ App Shell (Header, Sidebar, Dropdown)
   */
  function updateGlobalUserDisplay(user) {
    if (!user) return;
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {}

    if (window.AuthState && typeof window.AuthState.setUser === 'function') {
      window.AuthState.setUser(user);
    }

    const displayName = user.fullName || user.name || user.username || 'Thành viên';
    const initials = typeof window.getInitials === 'function' ? window.getInitials(displayName) : 'U';

    const nameEls = document.querySelectorAll('#sidebar-user-name, #header-user-name, #dropdown-full-name');
    nameEls.forEach(el => { el.textContent = displayName; });

    const emailEls = document.querySelectorAll('#dropdown-email');
    emailEls.forEach(el => { el.textContent = user.email || ''; });

    const avatarEls = document.querySelectorAll('#sidebar-user-avatar, #header-user-avatar');
    avatarEls.forEach(el => { el.textContent = initials; });
  }

  /**
   * Khởi tạo & render trang Hồ sơ cá nhân với cơ chế Đồng bộ dữ liệu 2 tầng:
   * 1. Render tức thì từ bộ nhớ/cache để tránh giật lag
   * 2. Tự động đồng bộ ngầm từ API Backend (/api/users/profile và /api/meetings)
   */
  async function renderProfilePage() {
    const container = document.getElementById('app');
    if (!container) return;

    let user = window.AuthState ? window.AuthState.getUser() : null;
    if (!user) {
      if (typeof window.showToast === 'function') {
        window.showToast('Vui lòng đăng nhập để xem hồ sơ cá nhân.', 'warning');
      }
      if (window.AuthModal && typeof window.AuthModal.open === 'function') {
        window.AuthModal.open('login');
      } else {
        window.location.href = 'login.html';
      }
      return;
    }

    // 1. Render ban đầu với dữ liệu hiện có trong session
    doRender(user, Array.isArray(window.meetings) ? window.meetings : [], user.stats || {});

    // 2. Đồng bộ trực tiếp dữ liệu mới nhất từ RESTful API Backend
    try {
      const token = getAccessToken();
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [profileRes, meetingsRes] = await Promise.allSettled([
        fetch('/api/users/profile', { headers }).then(r => r.ok ? r.json() : null),
        window.MeetingAPI && typeof window.MeetingAPI.getAll === 'function' ? window.MeetingAPI.getAll() : null
      ]);

      let hasUpdate = false;
      let stats = user.stats || {};

      // Cập nhật thông tin profile từ server
      if (profileRes.status === 'fulfilled' && profileRes.value && profileRes.value.success) {
        const pData = profileRes.value.data;
        user = { ...user, ...pData };
        stats = pData.stats || {};
        currentProfileData = user;
        updateGlobalUserDisplay(user);
        hasUpdate = true;
      }

      // Cập nhật danh sách cuộc họp từ server
      let freshMeetings = Array.isArray(window.meetings) ? window.meetings : [];
      if (meetingsRes.status === 'fulfilled' && meetingsRes.value) {
        const data = meetingsRes.value.data || meetingsRes.value;
        if (Array.isArray(data)) {
          freshMeetings = data;
          window.meetings = data;
          hasUpdate = true;
        }
      }

      // Re-render mượt mà khi có dữ liệu mới từ CSDL
      if (hasUpdate) {
        doRender(user, freshMeetings, stats);
      }
    } catch (err) {
      console.warn('[Profile] Lỗi đồng bộ dữ liệu thời gian thực:', err);
    }
  }

  /**
   * Render giao diện chi tiết trang Hồ sơ cá nhân
   */
  function doRender(user, allMeetings, stats = {}) {
    const container = document.getElementById('app');
    if (!container) return;

    currentProfileData = user;
    const displayName = user.fullName || user.name || user.username || 'Thành viên';
    const initials = typeof window.getInitials === 'function' ? window.getInitials(displayName) : 'U';
    const avatarColor = typeof window.getHostColor === 'function' ? window.getHostColor(displayName) : '#2563eb';
    const userId = Number(user.userId || user.id || 0);

    // Lọc danh sách cuộc họp do chính người dùng này chủ trì hoặc tạo
    const myHostedMeetings = (allMeetings || []).filter(m => {
      const mOrgId = Number(m.organizerId || 0);
      if (userId && mOrgId && mOrgId === userId) return true;
      if (m.host && displayName && m.host.toLowerCase() === displayName.toLowerCase()) return true;
      if (m.host && user.username && m.host.toLowerCase() === user.username.toLowerCase()) return true;
      return false;
    });

    // Lọc danh sách cuộc họp người dùng này được mời tham gia
    const myInvitedMeetings = (allMeetings || []).filter(m => {
      const mOrgId = Number(m.organizerId || 0);
      if (userId && mOrgId && mOrgId === userId) return false;
      const pIds = Array.isArray(m.participantIds) ? m.participantIds.map(Number) : [];
      if (userId && pIds.includes(userId)) return true;
      const pNames = Array.isArray(m.participants) ? m.participants.map(s => String(s).toLowerCase()) : [];
      if (displayName && pNames.includes(displayName.toLowerCase())) return true;
      return false;
    });

    const isUserAdmin = Boolean(user.role && String(user.role).toLowerCase() === 'admin');

    let roleBadge = '<span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-6">Thành viên (USER)</span>';
    if (user.role && String(user.role).toLowerCase() === 'admin') {
      roleBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle fs-6"><i class="bi bi-shield-check me-1"></i>Quản trị viên (Admin)</span>';
    } else if (user.role && (String(user.role).toLowerCase() === 'manager' || String(user.role).toLowerCase() === 'secretary')) {
      roleBadge = '<span class="badge bg-warning-subtle text-warning border border-warning-subtle fs-6"><i class="bi bi-star-fill me-1"></i>Trưởng phòng (Organizer)</span>';
    } else if (user.role && String(user.role).toLowerCase() === 'employee') {
      roleBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle fs-6">Nhân viên</span>';
    }

    const hostedCount = stats.hostedCount !== undefined ? stats.hostedCount : myHostedMeetings.length;
    const invitedCount = stats.participantCount !== undefined ? stats.participantCount : myInvitedMeetings.length;
    const upcomingCount = stats.upcomingCount !== undefined ? stats.upcomingCount : 0;

    container.innerHTML = `
      <div class="user-profile-page">
        <!-- Tiêu đề trang -->
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 class="fw-bold fs-3 text-slate-900 m-0">Hồ sơ cá nhân</h2>
            <p class="text-secondary small m-0 mt-0.5">Quản lý thông tin tài khoản cá nhân, phòng ban và nhật ký lịch họp</p>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-primary btn-sm px-3 py-2 fw-medium" id="btn-top-edit-profile">
              <i class="bi bi-pencil-square me-1"></i> Chỉnh sửa thông tin
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm px-3 py-2 fw-medium" id="btn-top-change-pwd">
              <i class="bi bi-shield-lock me-1"></i> Đổi mật khẩu
            </button>
          </div>
        </div>

        <div class="row g-4">
          <!-- Cột bên trái: Thẻ hồ sơ User & Thao tác tài khoản -->
          <div class="col-lg-4">
            <div class="stitch-card p-4 text-center">
              <div class="profile-avatar-circle mx-auto mb-3" style="background-color: ${avatarColor}; width: 84px; height: 84px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                ${escapeHtml(initials)}
              </div>
              <h4 class="fw-bold text-slate-900 mb-1" id="profile-display-name">${escapeHtml(displayName)}</h4>
              <p class="text-muted small mb-2">@${escapeHtml(user.username || 'user')}</p>
              <div class="mb-3">${roleBadge}</div>

              <div class="text-start border-top pt-3">
                <div class="mb-2.5 d-flex justify-content-between align-items-center">
                  <span class="text-secondary small"><i class="bi bi-envelope me-1.5 text-primary"></i>Email:</span>
                  <span class="fw-medium small text-dark" id="profile-display-email">${escapeHtml(user.email || 'Chưa cập nhật')}</span>
                </div>
                <div class="mb-2.5 d-flex justify-content-between align-items-center">
                  <span class="text-secondary small"><i class="bi bi-building me-1.5 text-primary"></i>Phòng ban:</span>
                  <span class="badge bg-light text-slate-800 border" id="profile-display-dept">${escapeHtml(user.department || 'Kỹ thuật')}</span>
                </div>
                <div class="mb-2.5 d-flex justify-content-between align-items-center">
                  <span class="text-secondary small"><i class="bi bi-upc-scan me-1.5 text-primary"></i>Mã định danh:</span>
                  <span class="fw-medium small text-dark font-monospace">#ID-${userId || 1}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-secondary small"><i class="bi bi-calendar-check me-1.5 text-primary"></i>Ngày gia nhập:</span>
                  <span class="fw-medium small text-dark">${user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '10/2026'}</span>
                </div>
              </div>

              <!-- Nút Thao tác Tài khoản -->
              <div class="d-flex flex-column gap-2 mt-4 pt-2 border-top">
                <button type="button" class="btn btn-primary btn-sm w-100 fw-semibold py-2" id="btn-card-edit-profile">
                  <i class="bi bi-pencil-square me-1.5"></i> Chỉnh sửa thông tin
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm w-100 fw-medium py-2" id="btn-card-change-pwd">
                  <i class="bi bi-shield-lock me-1.5"></i> Đổi mật khẩu tài khoản
                </button>
                <button type="button" class="btn btn-outline-danger btn-sm w-100 fw-medium py-2" id="btn-profile-logout">
                  <i class="bi bi-box-arrow-right me-1.5"></i> Đăng xuất
                </button>
              </div>
            </div>

            <!-- Thống kê hoạt động cuộc họp -->
            <div class="stitch-card p-4 mt-4">
              <h6 class="fw-bold text-slate-800 mb-3"><i class="bi bi-bar-chart-fill text-primary me-2"></i>Thống kê lịch họp của tôi</h6>
              <div class="d-flex justify-content-between align-items-center mb-2.5 p-3 bg-light rounded-3">
                <span class="text-secondary small fw-medium"><i class="bi bi-person-workspace text-primary me-1.5"></i>Cuộc họp tôi chủ trì:</span>
                <span class="fw-bold fs-5 text-primary">${hostedCount}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2.5 p-3 bg-light rounded-3">
                <span class="text-secondary small fw-medium"><i class="bi bi-envelope-open text-success me-1.5"></i>Cuộc họp được mời:</span>
                <span class="fw-bold fs-5 text-success">${invitedCount}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2.5 p-3 bg-light rounded-3">
                <span class="text-secondary small fw-medium"><i class="bi bi-clock-history text-warning me-1.5"></i>Cuộc họp sắp tới:</span>
                <span class="fw-bold fs-5 text-warning">${upcomingCount}</span>
              </div>
              ${isUserAdmin ? `
                <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                  <span class="text-secondary small fw-medium"><i class="bi bi-buildings text-dark me-1.5"></i>Toàn bộ doanh nghiệp:</span>
                  <span class="fw-bold fs-5 text-dark">${(allMeetings || []).length}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Cột bên phải: Danh sách cuộc họp của tôi -->
          <div class="col-lg-8">
            <div class="stitch-card p-4">
              <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h4 class="fw-bold text-slate-900 m-0">Lịch họp của tôi</h4>
                  <p class="text-secondary small m-0">Chỉ hiển thị các cuộc họp bạn tổ chức hoặc được mời tham gia</p>
                </div>
              </div>

              <!-- Tabs chuyển đổi giữa Cuộc họp chủ trì và Cuộc họp được mời -->
              <div class="profile-tabs-wrapper mb-3">
                <ul class="nav nav-pills profile-tabs-pill p-1 m-0" id="profile-meeting-tabs" role="tablist">
                  <li class="nav-item" role="presentation">
                    <button class="nav-link profile-tab-btn active" id="tab-hosted-btn" data-bs-toggle="pill" data-bs-target="#tab-hosted-content" type="button" role="tab">
                      <i class="bi bi-person-workspace me-1.5"></i> Tôi chủ trì (${myHostedMeetings.length})
                    </button>
                  </li>
                  <li class="nav-item" role="presentation">
                    <button class="nav-link profile-tab-btn" id="tab-invited-btn" data-bs-toggle="pill" data-bs-target="#tab-invited-content" type="button" role="tab">
                      <i class="bi bi-envelope-open me-1.5"></i> Được mời tham gia (${myInvitedMeetings.length})
                    </button>
                  </li>
                </ul>
              </div>

              <div class="tab-content" id="profile-meeting-tab-content">
                <!-- Tab 1: Tôi chủ trì -->
                <div class="tab-pane fade show active" id="tab-hosted-content" role="tabpanel">
                  ${myHostedMeetings.length === 0 ? `
                    <div class="text-center py-5">
                      <i class="bi bi-calendar-check text-muted fs-1 mb-2 d-block"></i>
                      <h6 class="fw-bold text-slate-700">Bạn chưa chủ trì cuộc họp nào</h6>
                      <p class="text-secondary small mb-0">Các cuộc họp do bạn đứng ra tổ chức sẽ xuất hiện tại đây.</p>
                    </div>
                  ` : renderMeetingListTable(myHostedMeetings, true)}
                </div>

                <!-- Tab 2: Được mời tham gia -->
                <div class="tab-pane fade" id="tab-invited-content" role="tabpanel">
                  ${myInvitedMeetings.length === 0 ? `
                    <div class="text-center py-5">
                      <i class="bi bi-envelope text-muted fs-1 mb-2 d-block"></i>
                      <h6 class="fw-bold text-slate-700">Chưa có lời mời họp nào</h6>
                      <p class="text-secondary small mb-0">Khi đồng nghiệp mời bạn tham gia cuộc họp, lịch họp sẽ tự động hiển thị tại đây.</p>
                    </div>
                  ` : renderMeetingListTable(myInvitedMeetings, false)}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;

    // Render bảng danh sách cuộc họp
    function renderMeetingListTable(items, isOrganizer) {
      return `
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="min-width: 180px;">Tiêu đề cuộc họp</th>
                <th>Phòng họp</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th class="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(m => {
                const roomName = m.roomName || m.room || 'Chưa xếp phòng';
                const dateStr = m.date || (m.startTime ? m.startTime.slice(0, 10) : 'Hôm nay');
                const timeStr = `${m.startTime ? (m.startTime.includes('T') ? m.startTime.split('T')[1].slice(0, 5) : m.startTime.slice(11, 16)) : '08:00'} - ${m.endTime ? (m.endTime.includes('T') ? m.endTime.split('T')[1].slice(0, 5) : m.endTime.slice(11, 16)) : '09:00'}`;

                let statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle">Đã lên lịch</span>';
                if (m.status === 'Cancelled' || m.status === 'cancelled' || m.bookingStatus === 'Cancelled') {
                  statusBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Đã hủy</span>';
                } else if (m.status === 'Completed' || m.status === 'completed' || m.bookingStatus === 'Completed') {
                  statusBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Hoàn thành</span>';
                }

                return `
                  <tr>
                    <td>
                      <div class="fw-bold text-slate-900">${escapeHtml(m.title || 'Cuộc họp')}</div>
                      <div class="text-muted small">${escapeHtml(m.description || 'Không có mô tả')}</div>
                    </td>
                    <td>
                      <span class="badge bg-light text-slate-800 border">${escapeHtml(roomName)}</span>
                    </td>
                    <td>
                      <div class="text-slate-800 small font-monospace">${dateStr}</div>
                      <div class="text-secondary small">${timeStr}</div>
                    </td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                      <button type="button" class="btn btn-light btn-sm border px-2.5 py-1" onclick="if(window.viewMeetingDetail) window.viewMeetingDetail(${m.id || m.meetingId || 0})">
                        <i class="bi bi-eye me-1"></i> Chi tiết
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Gắn sự kiện các nút
    bindProfilePageEvents(user, allMeetings);
  }

  /**
   * Gắn toàn bộ sự kiện trên trang Profile
   */
  function bindProfilePageEvents(user, allMeetings) {
    // 1. Nút Đăng xuất
    document.getElementById('btn-profile-logout')?.addEventListener('click', (e) => {
      if (typeof window.handleUserLogout === 'function') {
        window.handleUserLogout(e);
      } else if (typeof window.showConfirmDialog === 'function') {
        window.showConfirmDialog({
          title: 'Đăng xuất tài khoản',
          message: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?',
          type: 'danger',
          confirmText: 'Đăng xuất',
          cancelText: 'Ở lại'
        }).then(confirmed => {
          if (confirmed && window.AuthState) {
            window.AuthState.logout('login.html');
          }
        });
      } else if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
        if (window.AuthState) window.AuthState.logout('login.html');
      }
    });

    // 2. Mở Modal Chỉnh sửa thông tin
    const openEditHandler = () => openEditProfileModal(user, allMeetings);
    document.getElementById('btn-top-edit-profile')?.addEventListener('click', openEditHandler);
    document.getElementById('btn-card-edit-profile')?.addEventListener('click', openEditHandler);

    // 3. Mở Modal Đổi mật khẩu
    const openPwdHandler = () => openChangePasswordModal();
    document.getElementById('btn-top-change-pwd')?.addEventListener('click', openPwdHandler);
    document.getElementById('btn-card-change-pwd')?.addEventListener('click', openPwdHandler);
  }

  /**
   * Tạo & hiển thị Modal Chỉnh sửa thông tin cá nhân chuẩn Stitch
   */
  function openEditProfileModal(user, allMeetings) {
    let modalOverlay = document.getElementById('edit-profile-modal-overlay');

    if (!modalOverlay) {
      modalOverlay = document.createElement('div');
      modalOverlay.id = 'edit-profile-modal-overlay';
      modalOverlay.className = 'stitch-modal-overlay';
      modalOverlay.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 1rem;';

      modalOverlay.innerHTML = `
        <div class="stitch-modal-card bg-white rounded-4 shadow-lg border border-slate-200" style="width: 100%; max-width: 500px; overflow: hidden;">
          <div class="p-4 border-bottom d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-3 bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                <i class="bi bi-person-gear fs-5"></i>
              </div>
              <div>
                <h5 class="fw-bold text-slate-900 m-0">Chỉnh sửa hồ sơ</h5>
                <p class="text-secondary small m-0">Cập nhật thông tin tài khoản cá nhân</p>
              </div>
            </div>
            <button type="button" class="btn-close" id="btn-close-edit-profile" aria-label="Đóng"></button>
          </div>

          <form id="form-edit-profile" class="p-4">
            <div id="edit-profile-alert" class="alert d-none mb-3 py-2 px-3 small" role="alert"></div>

            <div class="mb-3">
              <label for="edit-profile-fullname" class="form-label small fw-semibold text-slate-700 mb-1">
                Họ và tên <span class="text-danger">*</span>
              </label>
              <input type="text" class="form-control stitch-input" id="edit-profile-fullname" required minlength="2" maxlength="100" placeholder="Nhập họ và tên...">
            </div>

            <div class="mb-3">
              <label for="edit-profile-email" class="form-label small fw-semibold text-slate-700 mb-1">
                Địa chỉ Email <span class="text-danger">*</span>
              </label>
              <input type="email" class="form-control stitch-input" id="edit-profile-email" required maxlength="100" placeholder="user@enterprise.vn">
            </div>

            <div class="mb-3">
              <label for="edit-profile-dept" class="form-label small fw-semibold text-slate-700 mb-1">
                Phòng ban làm việc <span class="text-danger">*</span>
              </label>
              <select class="form-select stitch-input" id="edit-profile-dept" required>
                <option value="Quản trị">Quản trị &amp; Điều hành</option>
                <option value="Kỹ thuật">Kỹ thuật (Tech / Dev)</option>
                <option value="Hành chính">Hành chính Nhân sự</option>
                <option value="Kiểm thử">Kiểm thử chất lượng (QA)</option>
                <option value="Thiết kế">Thiết kế UI/UX</option>
                <option value="Kinh doanh">Kinh doanh &amp; Tiếp thị</option>
                <option value="Khác">Phòng ban khác</option>
              </select>
            </div>

            <div class="row g-2 mb-4">
              <div class="col-6">
                <label class="form-label small text-secondary mb-1">Tên đăng nhập:</label>
                <input type="text" class="form-control form-control-sm bg-light text-muted" id="edit-profile-username" disabled>
              </div>
              <div class="col-6">
                <label class="form-label small text-secondary mb-1">Vai trò hệ thống:</label>
                <input type="text" class="form-control form-control-sm bg-light text-muted" id="edit-profile-role" disabled>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 pt-2 border-top">
              <button type="button" class="btn btn-light border btn-sm px-3" id="btn-cancel-edit-profile">Hủy</button>
              <button type="submit" class="btn btn-primary btn-sm px-4 fw-semibold" id="btn-submit-edit-profile">
                <span class="spinner-border spinner-border-sm me-1 d-none" id="edit-profile-spinner"></span>
                <span>Lưu thông tin</span>
              </button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modalOverlay);

      // Đóng modal
      const closeModal = () => { modalOverlay.style.display = 'none'; };
      document.getElementById('btn-close-edit-profile')?.addEventListener('click', closeModal);
      document.getElementById('btn-cancel-edit-profile')?.addEventListener('click', closeModal);
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });

      // Xử lý gửi Form cập nhật hồ sơ
      const form = document.getElementById('form-edit-profile');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alertBox = document.getElementById('edit-profile-alert');
        const spinner = document.getElementById('edit-profile-spinner');
        const submitBtn = document.getElementById('btn-submit-edit-profile');

        const fullName = document.getElementById('edit-profile-fullname')?.value.trim();
        const email = document.getElementById('edit-profile-email')?.value.trim();
        const department = document.getElementById('edit-profile-dept')?.value;

        if (!fullName || fullName.length < 2) {
          showModalAlert(alertBox, 'Họ và tên phải có ít nhất 2 ký tự.', 'danger');
          return;
        }
        if (!email) {
          showModalAlert(alertBox, 'Vui lòng nhập địa chỉ email hợp lệ.', 'danger');
          return;
        }

        submitBtn.disabled = true;
        spinner?.classList.remove('d-none');
        alertBox?.classList.add('d-none');

        try {
          const token = getAccessToken();
          const res = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fullName, email, department })
          });

          const resData = await res.json();

          if (res.ok && resData.success) {
            showModalAlert(alertBox, resData.message || 'Cập nhật thông tin thành công!', 'success');

            const updatedUser = resData.data;
            updateGlobalUserDisplay(updatedUser);
            currentProfileData = updatedUser;

            if (typeof window.showToast === 'function') {
              window.showToast('Cập nhật thông tin hồ sơ thành công!', 'success');
            }

            // Cập nhật lại view
            setTimeout(() => {
              modalOverlay.style.display = 'none';
              doRender(updatedUser, allMeetings, updatedUser.stats || {});
            }, 800);

          } else {
            showModalAlert(alertBox, resData.message || 'Không thể cập nhật hồ sơ.', 'danger');
          }
        } catch (err) {
          showModalAlert(alertBox, err.message || 'Lỗi kết nối máy chủ.', 'danger');
        } finally {
          submitBtn.disabled = false;
          spinner?.classList.add('d-none');
        }
      });
    }

    // Điền dữ liệu hiện tại vào form
    const cur = currentProfileData || user;
    const nameInput = document.getElementById('edit-profile-fullname');
    const emailInput = document.getElementById('edit-profile-email');
    const deptSelect = document.getElementById('edit-profile-dept');
    const usernameInput = document.getElementById('edit-profile-username');
    const roleInput = document.getElementById('edit-profile-role');
    const alertBox = document.getElementById('edit-profile-alert');

    if (nameInput) nameInput.value = cur.fullName || cur.name || '';
    if (emailInput) emailInput.value = cur.email || '';
    if (deptSelect && cur.department) deptSelect.value = cur.department;
    if (usernameInput) usernameInput.value = `@${cur.username || 'user'}`;
    if (roleInput) roleInput.value = cur.role || 'USER';
    if (alertBox) alertBox.className = 'alert d-none mb-3 py-2 px-3 small';

    modalOverlay.style.display = 'flex';
    setTimeout(() => { nameInput?.focus(); }, 100);
  }

  /**
   * Tạo & hiển thị Modal Đổi mật khẩu chuẩn Stitch Enterprise
   */
  function openChangePasswordModal() {
    let modalOverlay = document.getElementById('change-pwd-modal-overlay');

    if (!modalOverlay) {
      modalOverlay = document.createElement('div');
      modalOverlay.id = 'change-pwd-modal-overlay';
      modalOverlay.className = 'stitch-modal-overlay';
      modalOverlay.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 1rem;';

      modalOverlay.innerHTML = `
        <div class="stitch-modal-card bg-white rounded-4 shadow-lg border border-slate-200" style="width: 100%; max-width: 460px; overflow: hidden;">
          <div class="p-4 border-bottom d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-3 bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                <i class="bi bi-shield-lock fs-5"></i>
              </div>
              <div>
                <h5 class="fw-bold text-slate-900 m-0">Đổi mật khẩu</h5>
                <p class="text-secondary small m-0">Cập nhật mật khẩu bảo vệ tài khoản</p>
              </div>
            </div>
            <button type="button" class="btn-close" id="btn-close-change-pwd" aria-label="Đóng"></button>
          </div>

          <form id="form-change-password" class="p-4">
            <div id="change-pwd-alert" class="alert d-none mb-3 py-2 px-3 small" role="alert"></div>

            <div class="mb-3">
              <label for="change-pwd-current" class="form-label small fw-semibold text-slate-700 mb-1">
                Mật khẩu hiện tại <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <input type="password" class="form-control stitch-input" id="change-pwd-current" required autocomplete="current-password" placeholder="Nhập mật khẩu hiện tại...">
                <button class="btn btn-outline-secondary btn-toggle-pwd" type="button" data-target="change-pwd-current" aria-label="Hiện/Ẩn mật khẩu" title="Hiện/Ẩn">
                  <i class="bi bi-eye"></i>
                </button>
              </div>
            </div>

            <div class="mb-3">
              <label for="change-pwd-new" class="form-label small fw-semibold text-slate-700 mb-1">
                Mật khẩu mới <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <input type="password" class="form-control stitch-input" id="change-pwd-new" required minlength="6" autocomplete="new-password" placeholder="Tối thiểu 6 ký tự...">
                <button class="btn btn-outline-secondary btn-toggle-pwd" type="button" data-target="change-pwd-new" aria-label="Hiện/Ẩn mật khẩu" title="Hiện/Ẩn">
                  <i class="bi bi-eye"></i>
                </button>
              </div>
              <div class="form-text small text-muted">Mật khẩu mới phải khác mật khẩu cũ và có ít nhất 6 ký tự.</div>
            </div>

            <div class="mb-4">
              <label for="change-pwd-confirm" class="form-label small fw-semibold text-slate-700 mb-1">
                Xác nhận lại mật khẩu mới <span class="text-danger">*</span>
              </label>
              <div class="input-group">
                <input type="password" class="form-control stitch-input" id="change-pwd-confirm" required minlength="6" autocomplete="new-password" placeholder="Nhập lại mật khẩu mới...">
                <button class="btn btn-outline-secondary btn-toggle-pwd" type="button" data-target="change-pwd-confirm" aria-label="Hiện/Ẩn mật khẩu" title="Hiện/Ẩn">
                  <i class="bi bi-eye"></i>
                </button>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 pt-2 border-top">
              <button type="button" class="btn btn-light border btn-sm px-3" id="btn-cancel-change-pwd">Hủy</button>
              <button type="submit" class="btn btn-primary btn-sm px-4 fw-semibold" id="btn-submit-change-pwd">
                <span class="spinner-border spinner-border-sm me-1 d-none" id="change-pwd-spinner"></span>
                <span>Cập nhật mật khẩu</span>
              </button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modalOverlay);

      // Đóng modal khi click nền hoặc nút hủy/close
      const closeModal = () => {
        modalOverlay.style.display = 'none';
      };

      document.getElementById('btn-close-change-pwd')?.addEventListener('click', closeModal);
      document.getElementById('btn-cancel-change-pwd')?.addEventListener('click', closeModal);
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });

      // Toggle ẩn/hiện mật khẩu
      modalOverlay.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const input = document.getElementById(targetId);
          if (!input) return;
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          btn.innerHTML = isPassword ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
        });
      });

      // Tự động xóa lỗi khi người dùng gõ
      ['change-pwd-current', 'change-pwd-new', 'change-pwd-confirm'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          input.addEventListener('input', () => {
            input.classList.remove('is-invalid');
            const alertBox = document.getElementById('change-pwd-alert');
            if (alertBox) alertBox.classList.add('d-none');
          });
        }
      });

      // Xử lý gửi Form đổi mật khẩu gọi PUT /api/users/profile
      const form = document.getElementById('form-change-password');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alertBox = document.getElementById('change-pwd-alert');
        const spinner = document.getElementById('change-pwd-spinner');
        const submitBtn = document.getElementById('btn-submit-change-pwd');

        const currentInput = document.getElementById('change-pwd-current');
        const newInput = document.getElementById('change-pwd-new');
        const confirmInput = document.getElementById('change-pwd-confirm');

        const currentPassword = currentInput?.value || '';
        const newPassword = newInput?.value || '';
        const confirmPassword = confirmInput?.value || '';

        // Xóa class is-invalid cũ
        currentInput?.classList.remove('is-invalid');
        newInput?.classList.remove('is-invalid');
        confirmInput?.classList.remove('is-invalid');

        // Validation phía Client
        if (!currentPassword) {
          currentInput?.classList.add('is-invalid');
          currentInput?.focus();
          showModalAlert(alertBox, 'Vui lòng nhập mật khẩu hiện tại.', 'danger');
          return;
        }
        if (!newPassword || newPassword.length < 6) {
          newInput?.classList.add('is-invalid');
          newInput?.focus();
          showModalAlert(alertBox, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 'danger');
          return;
        }
        if (currentPassword === newPassword) {
          newInput?.classList.add('is-invalid');
          newInput?.focus();
          showModalAlert(alertBox, 'Mật khẩu mới không được trùng với mật khẩu hiện tại.', 'danger');
          return;
        }
        if (newPassword !== confirmPassword) {
          confirmInput?.classList.add('is-invalid');
          confirmInput?.focus();
          showModalAlert(alertBox, 'Xác nhận lại mật khẩu mới không khớp.', 'danger');
          return;
        }

        // Bật trạng thái Loading
        submitBtn.disabled = true;
        spinner?.classList.remove('d-none');
        alertBox?.classList.add('d-none');

        try {
          const token = getAccessToken();
          const res = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              currentPassword,
              newPassword,
              confirmPassword
            })
          });

          const resData = await res.json();

          if (res.ok && resData.success) {
            showModalAlert(alertBox, resData.message || 'Đổi mật khẩu thành công!', 'success');
            form.reset();

            if (typeof window.showToast === 'function') {
              window.showToast('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.', 'success');
            }

            // Tự động đóng modal sau 1.2 giây
            setTimeout(() => {
              modalOverlay.style.display = 'none';
            }, 1200);
          } else {
            const msg = (resData && resData.message) || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.';
            showModalAlert(alertBox, msg, 'danger');
          }
        } catch (err) {
          showModalAlert(alertBox, err.message || 'Lỗi mạng hoặc máy chủ không phản hồi.', 'danger');
        } finally {
          submitBtn.disabled = false;
          spinner?.classList.add('d-none');
        }
      });
    }

    // Reset form và hiển thị modal
    const form = document.getElementById('form-change-password');
    if (form) form.reset();
    const alertBox = document.getElementById('change-pwd-alert');
    if (alertBox) alertBox.className = 'alert d-none mb-3 py-2 px-3 small';

    modalOverlay.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
      btn.innerHTML = '<i class="bi bi-eye"></i>';
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) input.type = 'password';
    });

    modalOverlay.style.display = 'flex';
    setTimeout(() => {
      document.getElementById('change-pwd-current')?.focus();
    }, 100);
  }

  function showModalAlert(alertBox, msg, type = 'danger') {
    if (!alertBox) return;
    alertBox.className = `alert alert-${type} mb-3 py-2 px-3 small`;
    alertBox.textContent = msg;
    alertBox.classList.remove('d-none');
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

  window.renderProfilePage = renderProfilePage;

})(window, document);
