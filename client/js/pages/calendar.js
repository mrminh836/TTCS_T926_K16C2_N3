/**
 * ==============================================================================
 * PAGE: LỊCH HỌP TRỰC QUAN THEO TUẦN (WEEKLY CALENDAR VIEW - RBAC ROLE-BASED)
 * Route: #/calendar
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (ICTU Meeting - TTCS_T926_K16C2_N3)
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  let currentWeekOffset = 0; // 0 = tuần hiện tại, -1 = tuần trước, +1 = tuần sau
  let activeAbortController = null;
  let cachedCalendarMeetings = [];

  /**
   * Escape ký tự đặc biệt để ngăn ngừa triệt để lỗ hổng Cross-Site Scripting (XSS)
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Lấy ngày Thứ Hai của tuần dựa theo độ lệch offset
   */
  function getMondayOfCurrentWeek(offset = 0) {
    const today = new Date();
    const day = today.getDay(); // 0: Chủ Nhật, 1: Thứ 2, ...
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.getFullYear(), today.getMonth(), diff + (offset * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function formatShortDate(dateObj) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
  }

  function formatISODate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatHHMM(dateOrStr) {
    if (!dateOrStr) return '';
    if (/^\d{2}:\d{2}$/.test(String(dateOrStr).trim())) return String(dateOrStr).trim();
    const d = new Date(dateOrStr);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return '';
  }

  function extractLocalDateStr(dateOrStr) {
    if (!dateOrStr) return '';
    if (typeof dateOrStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrStr.trim())) {
      return dateOrStr.trim();
    }
    const d = new Date(dateOrStr);
    if (!isNaN(d.getTime())) {
      return formatISODate(d);
    }
    return '';
  }

  function getCurrentAuthUser() {
    if (window.AuthState && typeof window.AuthState.getUser === 'function') {
      return window.AuthState.getUser();
    }
    try {
      const raw = localStorage.getItem('currentUser') || localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isUserAdmin() {
    if (window.AuthState && typeof window.AuthState.isAdmin === 'function') {
      return window.AuthState.isAdmin();
    }
    const user = getCurrentAuthUser();
    return Boolean(user && user.role && String(user.role).trim().toLowerCase() === 'admin');
  }

  function isAuthenticated() {
    if (window.AuthState && typeof window.AuthState.isAuthenticated === 'function') {
      return window.AuthState.isAuthenticated();
    }
    return Boolean(localStorage.getItem('accessToken'));
  }

  /**
   * Render trang lịch họp theo tuần kèm phân quyền theo vai trò (Role-Based Weekly Calendar)
   */
  async function renderCalendarPage() {
    const container = document.getElementById('app');
    if (!container) return;

    // 1. Kiểm tra xác thực
    if (!isAuthenticated()) {
      container.innerHTML = `
        <div class="calendar-page-wrapper py-5">
          <div class="alert alert-warning d-flex align-items-center gap-3 max-w-xl mx-auto shadow-sm" role="alert">
            <i class="bi bi-shield-exclamation fs-3 text-warning"></i>
            <div>
              <h5 class="alert-heading fw-bold mb-1">Yêu cầu đăng nhập</h5>
              <p class="mb-2">Bạn cần đăng nhập để xem lịch họp và các thông tin liên quan.</p>
              <button class="btn btn-primary btn-sm" onclick="if(window.AuthModal) window.AuthModal.open('login'); else window.location.href='login.html';">
                <i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập ngay
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const isAdmin = isUserAdmin();
    const currentUser = getCurrentAuthUser();

    // 2. Tính toán các ngày trong tuần (Thứ 2 -> Chủ Nhật)
    const monday = getMondayOfCurrentWeek(currentWeekOffset);
    const weekDays = [];
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const todayStr = formatISODate(new Date());

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const isoStr = formatISODate(d);
      weekDays.push({
        dayName: dayNames[i],
        dateObj: d,
        dateStr: isoStr,
        displayDate: formatShortDate(d),
        isToday: isoStr === todayStr
      });
    }

    const sunday = weekDays[6].dateObj;
    const startDate = weekDays[0].dateStr;
    const endDate = weekDays[6].dateStr;
    const weekRangeStr = `${formatShortDate(monday)} - ${formatShortDate(sunday)}/${sunday.getFullYear()}`;

    // Cấu hình tiêu đề theo vai trò người dùng (Admin vs Nhân viên)
    const pageTitle = isAdmin ? 'Lịch họp toàn doanh nghiệp' : 'Lịch họp của tôi';
    const pageSubtitle = isAdmin
      ? 'Tổng quan lịch phân bổ phòng họp và thời gian biểu toàn cơ quan'
      : 'Danh sách các cuộc họp do bạn tổ chức hoặc được mời tham gia';

    // 3. Render khung giao diện Calendar với trạng thái Loading
    container.innerHTML = `
      <div class="calendar-page-wrapper">
        <!-- Top Control Bar -->
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <h2 class="fw-bold fs-3 text-slate-900 m-0">${escapeHtml(pageTitle)}</h2>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">Tuần ${weekRangeStr}</span>
            </div>
            <p class="text-secondary small m-0">${escapeHtml(pageSubtitle)}</p>
          </div>

          <div class="d-flex align-items-center gap-2">
            <!-- Điều hướng tuần -->
            <div class="btn-group shadow-sm" role="group" aria-label="Điều hướng tuần">
              <button type="button" class="btn btn-outline-secondary btn-sm" id="btn-prev-week" title="Tuần trước">
                <i class="bi bi-chevron-left"></i>
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm fw-medium px-3" id="btn-current-week">
                Tuần này
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" id="btn-next-week" title="Tuần sau">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Calendar Week Grid Placeholder (Đang tải) -->
        <div id="calendar-grid-container" class="calendar-week-grid">
          ${weekDays.map(day => `
            <div class="calendar-day-column ${day.isToday ? 'today' : ''}">
              <div class="calendar-day-header ${day.isToday ? 'today' : ''}">
                <span class="day-name">${day.dayName}${day.isToday ? ' <span class="badge bg-primary text-white ms-1" style="font-size: 0.65rem; padding: 2px 6px; border-radius: 999px;">Hôm nay</span>' : ''}</span>
                <span class="day-date ${day.isToday ? 'badge bg-primary text-white shadow-sm' : ''}">${day.displayDate}</span>
              </div>
              <div class="calendar-events-container d-flex flex-column justify-content-center align-items-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                <span style="font-size: 0.75rem;">Đang tải...</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Gắn sự kiện điều hướng tuần
    bindWeekNavigationEvents();

    // 4. Hủy request trước nếu người dùng bấm chuyển tuần nhanh
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();

    // 5. Gọi API lấy danh sách cuộc họp có phân quyền tại Backend
    try {
      const apiUrl = `/api/meetings?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&limit=100&sortOrder=ASC`;
      const response = await fetch(apiUrl, { signal: activeAbortController.signal });

      if (!response.ok) {
        if (response.status === 401) {
          if (window.AuthState && typeof window.AuthState.clearSession === 'function') {
            window.AuthState.clearSession('expired');
          }
          if (window.showToast) window.showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'warning');
          return;
        }
        throw new Error(`Lỗi máy chủ: ${response.status} ${response.statusText}`);
      }

      const resJson = await response.json();
      const serverMeetings = resJson.data || resJson.meetings || [];

      // 6. Chuẩn hóa dữ liệu cuộc họp trả về từ API
      cachedCalendarMeetings = (Array.isArray(serverMeetings) ? serverMeetings : []).map(m => {
        const meetingDate = extractLocalDateStr(m.startTime || m.date);
        const startHHMM = formatHHMM(m.startTime);
        const endHHMM = formatHHMM(m.endTime);
        const hostName = m.organizerName || m.host || 'Thành viên';
        const roomName = m.roomName || 'Phòng họp';
        const isRecurring = Boolean(m.isRecurring);
        const bookingStatus = (m.bookingStatus || m.status || 'confirmed').toLowerCase();

        return {
          id: m.meetingId || m.id,
          meetingId: m.meetingId || m.id,
          title: m.title || 'Cuộc họp',
          tag: isRecurring ? 'Định kỳ' : 'Thường kỳ',
          date: meetingDate,
          startTime: startHHMM,
          endTime: endHHMM,
          time: (startHHMM && endHHMM) ? `${startHHMM} - ${endHHMM}` : (m.time || '09:00 - 10:00'),
          roomId: m.roomId,
          roomName: roomName,
          capacity: m.roomCapacity || 20,
          organizerId: m.organizerId,
          host: hostName,
          status: bookingStatus,
          notes: m.description || '',
          isRecurring: isRecurring
        };
      });

      // Đồng bộ vào window.meetings để modal chi tiết và các hàm toàn cục khác sử dụng an toàn
      window.meetings = cachedCalendarMeetings;

      // 7. Render nội dung các ngày vào lưới lịch
      renderGridContent(weekDays, cachedCalendarMeetings);

    } catch (err) {
      if (err.name === 'AbortError') return; // Request bị hủy do chuyển tuần, không báo lỗi

      const gridContainer = document.getElementById('calendar-grid-container');
      if (gridContainer) {
        gridContainer.innerHTML = `
          <div class="col-12 py-5 text-center w-100" style="grid-column: 1 / -1;">
            <div class="alert alert-danger d-inline-block text-start p-4 shadow-sm" style="max-width: 500px;">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="bi bi-exclamation-triangle-fill fs-4 text-danger"></i>
                <h6 class="fw-bold mb-0">Không thể tải dữ liệu lịch họp</h6>
              </div>
              <p class="small text-secondary mb-3">${escapeHtml(err.message || 'Đã xảy ra lỗi kết nối với máy chủ.')}</p>
              <button type="button" class="btn btn-outline-danger btn-sm" id="btn-retry-calendar">
                <i class="bi bi-arrow-clockwise me-1"></i> Thử lại
              </button>
            </div>
          </div>
        `;
        document.getElementById('btn-retry-calendar')?.addEventListener('click', () => {
          renderCalendarPage();
        });
      }
    }
  }

  /**
   * Render các cột ngày trong tuần kèm danh sách cuộc họp đã được sắp xếp
   */
  function renderGridContent(weekDays, meetingsList) {
    const gridContainer = document.getElementById('calendar-grid-container');
    if (!gridContainer) return;

    gridContainer.innerHTML = weekDays.map(day => {
      // Lọc các cuộc họp thuộc ngày đang xét
      const dayMeetings = meetingsList
        .filter(m => m.date === day.dateStr)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

      return `
        <div class="calendar-day-column ${day.isToday ? 'today' : ''}">
          <div class="calendar-day-header ${day.isToday ? 'today' : ''}">
            <span class="day-name">${day.dayName}${day.isToday ? ' <span class="badge bg-primary text-white ms-1" style="font-size: 0.65rem; padding: 2px 6px; border-radius: 999px;">Hôm nay</span>' : ''}</span>
            <span class="day-date ${day.isToday ? 'badge bg-primary text-white shadow-sm' : ''}">${day.displayDate}</span>
          </div>

          <div class="calendar-events-container">
            ${dayMeetings.length === 0 ? `
              <div class="calendar-empty-slot">
                <span class="text-muted small">Không có lịch</span>
              </div>
            ` : dayMeetings.map(m => {
              const hostName = m.host || 'Thành viên';
              const initials = typeof window.getInitials === 'function' ? window.getInitials(hostName) : 'U';
              const hostColor = typeof window.getHostColor === 'function' ? window.getHostColor(hostName) : '#2563eb';
              const timeStr = m.time || '09:00 - 10:00';
              const statusClass = (m.status === 'confirmed' || m.status === 'completed' || m.status === 'cancelled') 
                ? m.status 
                : 'scheduled';

              return `
                <div class="calendar-event-card cursor-pointer" data-id="${escapeHtml(m.id)}" title="Bấm để xem chi tiết cuộc họp">
                  <div class="d-flex justify-content-between align-items-start mb-1 gap-1">
                    <span class="event-time text-truncate"><i class="bi bi-clock me-1"></i>${escapeHtml(timeStr)}</span>
                    ${m.tag ? `<span class="badge badge-light-blue flex-shrink-0">${escapeHtml(m.tag)}</span>` : ''}
                  </div>
                  <div class="event-title text-truncate fw-semibold" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</div>
                  <div class="event-room text-truncate small text-secondary mt-1"><i class="bi bi-door-closed me-1"></i>${escapeHtml(m.roomName)}</div>
                  <div class="event-footer mt-2 d-flex align-items-center justify-content-between">
                    <div class="event-host-group d-flex align-items-center gap-1 overflow-hidden" title="Người tổ chức: ${escapeHtml(hostName)}">
                      <span class="user-avatar-tiny flex-shrink-0" style="background-color: ${hostColor}">${escapeHtml(initials)}</span>
                      <span class="event-host text-truncate small text-secondary">${escapeHtml(hostName)}</span>
                    </div>
                    <span class="badge-status-dot flex-shrink-0 ms-1 status-${statusClass}" title="Trạng thái: ${escapeHtml(m.status)}"></span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Nút đặt nhanh vào ngày này -->
          <button type="button" class="btn btn-light btn-sm w-100 mt-2 btn-add-day-slot" data-date="${escapeHtml(day.dateStr)}" title="Đặt phòng vào ngày này">
            <i class="bi bi-plus"></i> Đặt lịch
          </button>
        </div>
      `;
    }).join('');

    // Gắn sự kiện click mở modal chi tiết cho từng thẻ cuộc họp
    gridContainer.querySelectorAll('.calendar-event-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = Number(e.currentTarget.getAttribute('data-id'));
        if (id && typeof window.openDetailModal === 'function') {
          window.openDetailModal(id);
        }
      });
    });

    // Gắn sự kiện nút đặt lịch nhanh vào ngày cụ thể
    gridContainer.querySelectorAll('.btn-add-day-slot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const date = e.currentTarget.getAttribute('data-date');
        if (typeof window.openAddModalWithSelection === 'function') {
          window.openAddModalWithSelection(null, date);
        } else if (typeof window.openAddModal === 'function') {
          window.openAddModal();
        }
      });
    });
  }

  /**
   * Gắn sự kiện điều hướng tuần
   */
  function bindWeekNavigationEvents() {
    document.getElementById('btn-prev-week')?.addEventListener('click', () => {
      currentWeekOffset--;
      renderCalendarPage();
    });

    document.getElementById('btn-next-week')?.addEventListener('click', () => {
      currentWeekOffset++;
      renderCalendarPage();
    });

    document.getElementById('btn-current-week')?.addEventListener('click', () => {
      currentWeekOffset = 0;
      renderCalendarPage();
    });
  }

  // Xuất ra toàn cục theo đúng quy ước của hệ thống
  window.renderCalendarPage = renderCalendarPage;

})(window, document);
