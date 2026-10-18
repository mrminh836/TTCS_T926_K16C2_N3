/**
 * ==============================================================================
 * PAGE: HỒ SƠ CÁ NHÂN & LỊCH HỌP CỦA TÔI (USER PROFILE & MY MEETINGS)
 * Route: #/profile
 * Thiết kế chuẩn Stitch Enterprise UI/UX - Đồng bộ CSDL Thời gian thực
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  /**
   * Khởi tạo & render trang Hồ sơ cá nhân với cơ chế Đồng bộ dữ liệu 2 tầng:
   * 1. Render tức thì từ bộ nhớ/cache để tránh giật lag
   * 2. Tự động đồng bộ ngầm từ API Backend (/api/auth/me và /api/meetings)
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
    doRender(user, Array.isArray(window.meetings) ? window.meetings : []);

    // 2. Đồng bộ trực tiếp dữ liệu mới nhất từ RESTful API
    try {
      const [meRes, meetingsRes] = await Promise.allSettled([
        window.AuthAPI && typeof window.AuthAPI.getMe === 'function' ? window.AuthAPI.getMe() : null,
        window.MeetingAPI && typeof window.MeetingAPI.getAll === 'function' ? window.MeetingAPI.getAll() : null
      ]);

      let hasUpdate = false;

      // Cập nhật thông tin người dùng từ server
      if (meRes.status === 'fulfilled' && meRes.value && meRes.value.user) {
        user = meRes.value.user;
        try {
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {}
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

      // Re-render mượt mà khi có dữ liệu mới
      if (hasUpdate) {
        doRender(user, freshMeetings);
      }
    } catch (err) {
      console.warn('[Profile] Lỗi đồng bộ dữ liệu thời gian thực:', err);
    }
  }

  /**
   * Render giao diện chi tiết trang Hồ sơ cá nhân
   */
  function doRender(user, allMeetings) {
    const container = document.getElementById('app');
    if (!container) return;

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
      if (userId && mOrgId && mOrgId === userId) return false; // Không tính cuộc họp mình chủ trì
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

    container.innerHTML = `
      <div class="user-profile-page">
        <!-- Breadcrumb & Tiêu đề trang -->
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 class="fw-bold fs-3 text-slate-900 m-0">Hồ sơ cá nhân</h2>
            <p class="text-secondary small m-0">Thông tin tài khoản và nhật ký lịch họp doanh nghiệp</p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-outline-primary btn-sm" id="btn-top-change-pwd">
              <i class="bi bi-key me-1"></i> Đổi mật khẩu
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm" id="btn-profile-logout">
              <i class="bi bi-box-arrow-right me-1"></i> Đăng xuất
            </button>
          </div>
        </div>

        <div class="row g-4">
          <!-- Cột bên trái: Thẻ hồ sơ User & Nút đổi mật khẩu -->
          <div class="col-lg-4">
            <div class="stitch-card p-4 text-center">
              <div class="profile-avatar-circle mx-auto mb-3" style="background-color: ${avatarColor}; width: 84px; height: 84px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                ${escapeHtml(initials)}
              </div>
              <h4 class="fw-bold text-slate-900 mb-1">${escapeHtml(displayName)}</h4>
              <p class="text-muted small mb-2">@${escapeHtml(user.username || 'user')}</p>
              <div class="mb-3">${roleBadge}</div>

              <div class="text-start border-top pt-3">
                <div class="mb-2 d-flex justify-content-between">
                  <span class="text-secondary small">Email:</span>
                  <span class="fw-medium small text-dark">${escapeHtml(user.email || 'Chưa cập nhật')}</span>
                </div>
                <div class="mb-2 d-flex justify-content-between">
                  <span class="text-secondary small">Phòng ban:</span>
                  <span class="fw-medium small text-dark">${escapeHtml(user.department || 'Kỹ thuật')}</span>
                </div>
                <div class="mb-2 d-flex justify-content-between">
                  <span class="text-secondary small">Mã định danh:</span>
                  <span class="fw-medium small text-dark font-monospace">#ID-${userId || 1}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-secondary small">Ngày gia nhập:</span>
                  <span class="fw-medium small text-dark">${user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '10/2026'}</span>
                </div>
              </div>

              <!-- Nút đổi mật khẩu trong Thẻ thông tin cá nhân -->
              <button type="button" class="btn btn-outline-primary btn-sm w-100 mt-4 fw-medium py-2" id="btn-card-change-pwd">
                <i class="bi bi-shield-lock me-1"></i> Đổi mật khẩu tài khoản
              </button>
            </div>

            <!-- Thống kê hoạt động -->
            <div class="stitch-card p-4 mt-4">
              <h6 class="fw-bold text-slate-800 mb-3"><i class="bi bi-bar-chart-fill text-primary me-2"></i>Thống kê lịch họp</h6>
              <div class="d-flex justify-content-between align-items-center mb-2 p-3 bg-light rounded-3">
                <span class="text-secondary small">Cuộc họp tôi chủ trì:</span>
                <span class="fw-bold fs-5 text-primary">${myHostedMeetings.length}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2 p-3 bg-light rounded-3">
                <span class="text-secondary small">Cuộc họp được mời:</span>
                <span class="fw-bold fs-5 text-success">${myInvitedMeetings.length}</span>
              </div>
              ${isUserAdmin ? `
                <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                  <span class="text-secondary small">Toàn bộ doanh nghiệp:</span>
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
              <ul class="nav nav-pills mb-3 border-bottom pb-2" id="profile-meeting-tabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active btn-sm" id="tab-hosted-btn" data-bs-toggle="pill" data-bs-target="#tab-hosted-content" type="button" role="tab">
                    <i class="bi bi-person-workspace me-1"></i> Tôi chủ trì (${myHostedMeetings.length})
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link btn-sm" id="tab-invited-btn" data-bs-toggle="pill" data-bs-target="#tab-invited-content" type="button" role="tab">
                    <i class="bi bi-envelope-open me-1"></i> Được mời tham gia (${myInvitedMeetings.length})
                  </button>
                </li>
              </ul>

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

    // Hàm render bảng cuộc họp tái sử dụng trong trang profile
    function renderMeetingListTable(items, isOrganizer) {
      return `
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th class="small fw-semibold">Tiêu đề cuộc họp</th>
                <th class="small fw-semibold">${isOrganizer ? 'Thời gian' : 'Chủ trì / Thời gian'}</th>
                <th class="small fw-semibold">Phòng họp</th>
                <th class="small fw-semibold">Trạng thái</th>
                <th class="small fw-semibold text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(m => {
                const timeStr = m.time || (m.startTime ? `${m.startTime} - ${m.endTime}` : '--');
                let statusPill = '<span class="badge bg-primary-subtle text-primary border border-primary-subtle">Đã lên lịch</span>';
                if (m.status === 'in-progress') statusPill = '<span class="badge bg-warning-subtle text-warning border border-warning-subtle">Đang diễn ra</span>';
                else if (m.status === 'completed') statusPill = '<span class="badge bg-success-subtle text-success border border-success-subtle">Đã kết thúc</span>';
                else if (m.status === 'cancelled') statusPill = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Đã hủy</span>';

                return `
                  <tr>
                    <td>
                      <div class="fw-bold text-slate-900">${escapeHtml(m.title)}</div>
                      ${m.tag ? `<span class="badge bg-light text-secondary border small">${escapeHtml(m.tag)}</span>` : ''}
                    </td>
                    <td>
                      ${!isOrganizer ? `<div class="small fw-semibold text-primary"><i class="bi bi-person me-1"></i>${escapeHtml(m.host || m.organizerName || 'Người tổ chức')}</div>` : ''}
                      <div class="small fw-medium">${m.date || '--'}</div>
                      <div class="text-muted small">${timeStr}</div>
                    </td>
                    <td>
                      <div class="small fw-medium"><i class="bi bi-door-closed me-1 text-primary"></i>${escapeHtml(m.roomName || 'Phòng họp')}</div>
                    </td>
                    <td>${statusPill}</td>
                    <td class="text-end">
                      <button type="button" class="btn btn-outline-primary btn-sm py-1 px-2" onclick="if (typeof openDetailModal === 'function') openDetailModal(${m.id})" title="Xem chi tiết">
                        <i class="bi bi-eye"></i>
                      </button>
                      ${isOrganizer ? `
                        <button type="button" class="btn btn-outline-secondary btn-sm py-1 px-2" onclick="if (typeof openEditModal === 'function') openEditModal(${m.id})" title="Chỉnh sửa">
                          <i class="bi bi-pencil"></i>
                        </button>
                      ` : ''}
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
    document.getElementById('btn-profile-logout')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
        window.AuthState.logout('login.html');
      }
    });

    const openPwdHandler = () => openChangePasswordModal();
    document.getElementById('btn-top-change-pwd')?.addEventListener('click', openPwdHandler);
    document.getElementById('btn-card-change-pwd')?.addEventListener('click', openPwdHandler);
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

      // Xử lý gửi Form đổi mật khẩu
      const form = document.getElementById('form-change-password');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alertBox = document.getElementById('change-pwd-alert');
        const spinner = document.getElementById('change-pwd-spinner');
        const submitBtn = document.getElementById('btn-submit-change-pwd');

        const currentPassword = document.getElementById('change-pwd-current')?.value || '';
        const newPassword = document.getElementById('change-pwd-new')?.value || '';
        const confirmPassword = document.getElementById('change-pwd-confirm')?.value || '';

        // Validation phía Client
        if (!currentPassword) {
          showModalAlert(alertBox, 'Vui lòng nhập mật khẩu hiện tại.', 'danger');
          return;
        }
        if (!newPassword || newPassword.length < 6) {
          showModalAlert(alertBox, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 'danger');
          return;
        }
        if (currentPassword === newPassword) {
          showModalAlert(alertBox, 'Mật khẩu mới không được trùng với mật khẩu hiện tại.', 'danger');
          return;
        }
        if (newPassword !== confirmPassword) {
          showModalAlert(alertBox, 'Xác nhận lại mật khẩu mới không khớp.', 'danger');
          return;
        }

        // Bật trạng thái Loading
        submitBtn.disabled = true;
        spinner?.classList.remove('d-none');
        alertBox?.classList.add('d-none');

        try {
          if (!window.AuthAPI || typeof window.AuthAPI.changePassword !== 'function') {
            throw new Error('Tính năng đổi mật khẩu chưa khả dụng trên Client.');
          }

          const res = await window.AuthAPI.changePassword({
            currentPassword,
            newPassword,
            confirmPassword
          });

          if (res.ok && res.data && res.data.success) {
            showModalAlert(alertBox, res.data.message || 'Đổi mật khẩu thành công!', 'success');
            form.reset();

            if (typeof window.showToast === 'function') {
              window.showToast('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.', 'success');
            }

            // Tự động đóng modal sau 1.5 giây
            setTimeout(() => {
              modalOverlay.style.display = 'none';
            }, 1500);
          } else {
            const msg = (res.data && res.data.message) || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
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
