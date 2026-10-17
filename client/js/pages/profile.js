/**
 * ==============================================================================
 * PAGE: HỒ SƠ CÁ NHÂN & LỊCH HỌP CỦA TÔI (USER PROFILE & MY MEETINGS)
 * Route: #/profile
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  function renderProfilePage() {
    const container = document.getElementById('app');
    if (!container) return;

    const user = window.AuthState ? window.AuthState.getUser() : null;
    if (!user) {
      if (window.showToast) {
        window.showToast('Vui lòng đăng nhập để xem hồ sơ cá nhân.', 'warning');
      }
      if (window.AuthModal) {
        window.AuthModal.open('login');
      }
      return;
    }

    const allMeetings = window.meetings || [];
    const displayName = user.fullName || user.name || user.username || 'Thành viên';
    const initials = typeof window.getInitials === 'function' ? window.getInitials(displayName) : 'U';
    const avatarColor = typeof window.getHostColor === 'function' ? window.getHostColor(displayName) : '#2563eb';

    // Lọc danh sách cuộc họp của người dùng này
    const myHostedMeetings = allMeetings.filter(m => 
      (m.host && m.host.toLowerCase() === displayName.toLowerCase()) ||
      (m.host && m.host.toLowerCase() === (user.username || '').toLowerCase()) ||
      (m.organizerId && Number(m.organizerId) === Number(user.userId || user.id))
    );

    let roleBadge = '<span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-6">Thành viên (USER)</span>';
    if (user.role && user.role.toLowerCase() === 'admin') {
      roleBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle fs-6"><i class="bi bi-shield-check me-1"></i>Quản trị viên (Admin)</span>';
    } else if (user.role && user.role.toLowerCase() === 'employee') {
      roleBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle fs-6">Nhân viên</span>';
    }

    container.innerHTML = `
      <div class="user-profile-page">
        <!-- Breadcrumb & Title -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="fw-bold fs-3 text-slate-900 m-0">Hồ sơ cá nhân</h2>
            <p class="text-secondary small m-0">Thông tin tài khoản và nhật ký lịch họp doanh nghiệp</p>
          </div>
          <button type="button" class="btn btn-outline-danger btn-sm" id="btn-profile-logout">
            <i class="bi bi-box-arrow-right me-1"></i> Đăng xuất
          </button>
        </div>

        <div class="row g-4">
          <!-- Cột bên trái: Thẻ hồ sơ User -->
          <div class="col-lg-4">
            <div class="stitch-card p-4 text-center">
              <div class="profile-avatar-circle mx-auto mb-3" style="background-color: ${avatarColor}; width: 84px; height: 84px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                ${initials}
              </div>
              <h4 class="fw-bold text-slate-900 mb-1">${escapeHtml(displayName)}</h4>
              <p class="text-muted small mb-2">@${escapeHtml(user.username || 'user')}</p>
              <div class="mb-4">${roleBadge}</div>

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
                  <span class="fw-medium small text-dark font-monospace">#ID-${user.userId || user.id || 1}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-secondary small">Ngày gia nhập:</span>
                  <span class="fw-medium small text-dark">${user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '10/2026'}</span>
                </div>
              </div>
            </div>

            <!-- Thống kê nhỏ -->
            <div class="stitch-card p-4 mt-4">
              <h6 class="fw-bold text-slate-800 mb-3"><i class="bi bi-bar-chart-fill text-primary me-2"></i>Thống kê hoạt động</h6>
              <div class="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded-3">
                <span class="text-secondary small">Cuộc họp do tôi chủ trì:</span>
                <span class="fw-bold fs-5 text-primary">${myHostedMeetings.length}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                <span class="text-secondary small">Tổng cuộc họp hệ thống:</span>
                <span class="fw-bold fs-5 text-dark">${allMeetings.length}</span>
              </div>
            </div>
          </div>

          <!-- Cột bên phải: Danh sách cuộc họp của tôi -->
          <div class="col-lg-8">
            <div class="stitch-card p-4">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 class="fw-bold text-slate-900 m-0">Lịch họp của tôi</h4>
                  <p class="text-secondary small m-0">Danh sách các cuộc họp bạn đang chủ trì hoặc tạo trên hệ thống</p>
                </div>
                <button type="button" class="btn btn-primary stitch-btn-submit btn-sm" onclick="if (typeof openAddModal === 'function') openAddModal()">
                  <i class="bi bi-plus-lg me-1"></i> Tạo cuộc họp mới
                </button>
              </div>

              ${myHostedMeetings.length === 0 ? `
                <div class="text-center py-5">
                  <i class="bi bi-calendar-x text-muted fs-1 mb-2"></i>
                  <h6 class="fw-bold text-slate-700">Bạn chưa chủ trì cuộc họp nào</h6>
                  <p class="text-secondary small mb-3">Hãy tạo lịch họp mới để đồng nghiệp và đối tác cùng tham gia.</p>
                  <button type="button" class="btn btn-outline-primary btn-sm" onclick="if (typeof openAddModal === 'function') openAddModal()">
                    <i class="bi bi-calendar-plus me-1"></i> Tạo lịch họp ngay
                  </button>
                </div>
              ` : `
                <div class="table-responsive">
                  <table class="table table-hover align-middle">
                    <thead class="table-light">
                      <tr>
                        <th class="small fw-semibold">Tiêu đề cuộc họp</th>
                        <th class="small fw-semibold">Thời gian</th>
                        <th class="small fw-semibold">Phòng họp</th>
                        <th class="small fw-semibold">Trạng thái</th>
                        <th class="small fw-semibold text-end">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${myHostedMeetings.map(m => {
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
                              <button type="button" class="btn btn-outline-secondary btn-sm py-1 px-2" onclick="if (typeof openEditModal === 'function') openEditModal(${m.id})" title="Chỉnh sửa">
                                <i class="bi bi-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-profile-logout')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
        window.AuthState.logout('login.html');
      }
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

  window.renderProfilePage = renderProfilePage;

})(window, document);
