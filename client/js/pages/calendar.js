/**
 * ==============================================================================
 * PAGE: LỊCH HỌP TRỰC QUAN THEO TUẦN (CALENDAR VIEW)
 * Route: #/calendar
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  let currentWeekOffset = 0; // 0 = tuần hiện tại, -1 = tuần trước, +1 = tuần sau

  function getMondayOfCurrentWeek(offset = 0) {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh để Thứ 2 là ngày bắt đầu
    const monday = new Date(today.setDate(diff + (offset * 7)));
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

  function renderCalendarPage() {
    const container = document.getElementById('app');
    if (!container) return;

    const monday = getMondayOfCurrentWeek(currentWeekOffset);
    const weekDays = [];
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push({
        dayName: dayNames[i],
        dateObj: d,
        dateStr: formatISODate(d),
        displayDate: formatShortDate(d),
        isToday: formatISODate(d) === formatISODate(new Date())
      });
    }

    const sunday = weekDays[6].dateObj;
    const weekRangeStr = `${formatShortDate(monday)} - ${formatShortDate(sunday)}/${sunday.getFullYear()}`;

    // Lọc danh sách cuộc họp trong tuần
    const allMeetings = window.meetings || [];

    container.innerHTML = `
      <div class="calendar-page-wrapper">
        <!-- Top Control Bar -->
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h2 class="fw-bold fs-3 text-slate-900 m-0">Lịch họp Doanh nghiệp</h2>
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">Tuần ${weekRangeStr}</span>
            </div>
            <p class="text-secondary small m-0">Tổng quan lịch phân bổ phòng họp và thời gian biểu các phòng ban</p>
          </div>

          <div class="d-flex align-items-center gap-2">
            <!-- Điều hướng tuần -->
            <div class="btn-group" role="group" aria-label="Điều hướng tuần">
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

        <!-- Calendar Week Grid -->
        <div class="calendar-week-grid">
          ${weekDays.map(day => {
            const dayMeetings = allMeetings.filter(m => m.date === day.dateStr);

            return `
              <div class="calendar-day-column ${day.isToday ? 'today' : ''}">
                <div class="calendar-day-header ${day.isToday ? 'today' : ''}">
                  <span class="day-name">${day.dayName}</span>
                  <span class="day-date ${day.isToday ? 'badge bg-primary text-white' : ''}">${day.displayDate}</span>
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
                    const timeStr = m.time || (m.startTime ? `${m.startTime} - ${m.endTime}` : '09:00 - 10:00');

                    return `
                      <div class="calendar-event-card cursor-pointer" data-id="${m.id}" onclick="if (typeof openDetailModal === 'function') openDetailModal(${m.id})">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                          <span class="event-time"><i class="bi bi-clock me-1"></i>${timeStr}</span>
                          ${m.tag ? `<span class="badge badge-light-blue">${m.tag}</span>` : ''}
                        </div>
                        <div class="event-title text-truncate" title="${m.title || ''}">${m.title || 'Cuộc họp'}</div>
                        <div class="event-room text-truncate"><i class="bi bi-door-closed me-1"></i>${m.roomName || 'Phòng họp'}</div>
                        <div class="event-footer mt-2 d-flex align-items-center justify-content-between">
                          <div class="event-host-group d-flex align-items-center gap-1">
                            <span class="user-avatar-tiny flex-shrink-0" style="background-color: ${hostColor}">${initials}</span>
                            <span class="event-host text-truncate small text-secondary" title="${hostName}">${hostName}</span>
                          </div>
                          <span class="badge-status-dot flex-shrink-0 ms-1 status-${m.status || 'scheduled'}"></span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>

                <!-- Nút đặt nhanh vào ngày này -->
                <button type="button" class="btn btn-light btn-sm w-100 mt-2 btn-add-day-slot" data-date="${day.dateStr}" title="Đặt phòng vào ngày này">
                  <i class="bi bi-plus"></i> Đặt lịch
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Gắn sự kiện điều hướng tuần
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

    // Nút đặt lịch nhanh vào ngày cụ thể
    document.querySelectorAll('.btn-add-day-slot').forEach(btn => {
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

  // Xuất ra toàn cục
  window.renderCalendarPage = renderCalendarPage;

})(window, document);
