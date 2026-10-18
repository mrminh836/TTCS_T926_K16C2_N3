/**
 * meetingReminderToast.js
 * 
 * Component Toast hiển thị thông báo nhắc nhở trước giờ họp & Tiện ích đồng bộ iCalendar (.ics)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3 • ICTU Meeting)
 * 
 * Tính năng chính:
 * 1. Component Toast nhắc nhở cuộc họp chuyên biệt (tiêu đề, thời gian, phòng họp, nút Xem chi tiết & Xuất .ics).
 * 2. Background Reminder Engine: Tự động quét các cuộc họp trong ngày, nhắc nhở trước 15 phút.
 * 3. Hỗ trợ âm thanh thông báo nhẹ nhàng (Web Audio API).
 * 4. Tiện ích xuất tệp .ics và đồng bộ 1-click vào Google Calendar & Microsoft Outlook 365.
 */

(function (window, document) {
  'use strict';

  // Khởi tạo Audio Context nhẹ nhàng cho thông báo (nếu trình duyệt hỗ trợ)
  function playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Nốt 1 (880Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.25);

      // Nốt 2 (1174Hz - D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (_) {
      // Bỏ qua nếu người dùng chưa tương tác hoặc trình duyệt chặn âm thanh
    }
  }

  // Đảm bảo Container Toast tồn tại trên DOM
  function getOrCreateToastContainer() {
    let container = document.getElementById('stitch-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'stitch-toast-container';
      container.className = 'stitch-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  // Tiện ích escape HTML an toàn chống XSS
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Định dạng ngày sang chuẩn YYYYMMDDTHHMMSSZ cho Google Calendar
  function formatToUtcCalendarDate(dateStr, timeStr) {
    try {
      const [year, month, day] = (dateStr || '').split('-').map(Number);
      const [hours, minutes] = (timeStr || '09:00').split(':').map(Number);
      const d = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    } catch (_) {
      return '';
    }
  }

  /**
   * Component chính: MeetingReminderToast
   */
  const MeetingReminderToast = {
    // Tập lưu ID cuộc họp đã gửi thông báo trong phiên để tránh lặp
    notifiedMeetingIds: new Set(),
    timerId: null,

    /**
     * Hiển thị Toast thông báo nhắc nhở cuộc họp chuyên nghiệp
     * @param {Object} meeting - Dữ liệu cuộc họp
     * @param {Object} [options] - Tuỳ chọn hiển thị (diffMinutes, duration, sound)
     */
    show(meeting, options = {}) {
      if (!meeting) return;

      const container = getOrCreateToastContainer();
      const diffMinutes = options.diffMinutes !== undefined ? options.diffMinutes : 15;
      const duration = options.duration || 12000; // Mặc định hiển thị 12 giây
      const playSound = options.sound !== false;

      // Phát âm thanh nhắc nhở
      if (playSound) {
        playNotificationChime();
      }

      // Xây dựng nhãn thời gian tương đối
      let timeBadgeText = `Còn ${diffMinutes} phút`;
      let timeBadgeClass = 'text-warning bg-amber-50';
      if (diffMinutes <= 0) {
        timeBadgeText = 'Đang diễn ra';
        timeBadgeClass = 'text-danger bg-red-50';
      } else if (diffMinutes <= 5) {
        timeBadgeText = `Chỉ còn ${diffMinutes} phút!`;
        timeBadgeClass = 'text-danger bg-red-50';
      }

      const meetingId = meeting.id || meeting.meetingId;
      const title = meeting.title || 'Cuộc họp doanh nghiệp';
      const timeStr = meeting.time || `${meeting.startTime || '09:00'} - ${meeting.endTime || '10:00'}`;
      const roomStr = meeting.roomName || 'Phòng họp';
      const hostStr = meeting.host || meeting.organizerName || 'Người tổ chức';

      const toast = document.createElement('div');
      toast.className = 'stitch-toast stitch-toast-reminder';
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');

      toast.innerHTML = `
        <div class="reminder-toast-header">
          <div class="reminder-toast-badge-wrap">
            <div class="reminder-bell-icon" title="Thông báo nhắc nhở">
              <i class="bi bi-bell-fill"></i>
            </div>
            <span class="reminder-category-badge">Nhắc nhở họp</span>
            <span class="reminder-countdown-pill ${timeBadgeClass}">
              <i class="bi bi-clock-history"></i>
              <span>${timeBadgeText}</span>
            </span>
          </div>
          <button type="button" class="toast-close-btn reminder-close-btn" aria-label="Đóng thông báo" title="Đóng">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="reminder-toast-body">
          <h5 class="reminder-meeting-title" title="${escapeHtml(title)}">
            ${escapeHtml(title)}
          </h5>
          <div class="reminder-meta-row">
            <div class="reminder-meta-item" title="Thời gian">
              <i class="bi bi-calendar3"></i>
              <span>${escapeHtml(timeStr)}</span>
            </div>
            <div class="reminder-meta-item" title="Phòng họp">
              <i class="bi bi-door-open-fill"></i>
              <span>${escapeHtml(roomStr)}</span>
            </div>
            <div class="reminder-meta-item" title="Chủ trì">
              <i class="bi bi-person-fill"></i>
              <span>${escapeHtml(hostStr)}</span>
            </div>
          </div>
        </div>

        <div class="reminder-toast-actions">
          <button type="button" class="reminder-btn-detail" id="reminder-btn-view-${meetingId}">
            <i class="bi bi-box-arrow-in-right"></i>
            <span>Xem chi tiết</span>
          </button>
          <a href="/api/meetings/${meetingId}/export-ics" class="reminder-btn-export" id="reminder-btn-ics-${meetingId}" download title="Tải file .ics để đồng bộ Google Calendar & Outlook">
            <i class="bi bi-calendar2-plus"></i>
            <span>Xuất .ics</span>
          </a>
          <button type="button" class="reminder-btn-dismiss" title="Bỏ qua lời nhắc">
            <span>Bỏ qua</span>
          </button>
        </div>

        <div class="reminder-progress-bar" style="animation-duration: ${duration}ms;"></div>
      `;

      // Xử lý đóng toast
      let dismissTimeout = null;
      const dismiss = () => {
        if (dismissTimeout) clearTimeout(dismissTimeout);
        toast.classList.add('fade-out');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 250);
      };

      // Đóng khi bấm nút Close hoặc Bỏ qua
      toast.querySelector('.reminder-close-btn')?.addEventListener('click', dismiss);
      toast.querySelector('.reminder-btn-dismiss')?.addEventListener('click', dismiss);

      // Xem chi tiết
      toast.querySelector(`#reminder-btn-view-${meetingId}`)?.addEventListener('click', () => {
        dismiss();
        if (typeof window.openDetailModal === 'function') {
          window.openDetailModal(meetingId);
        } else {
          window.location.hash = `#/meetings?id=${meetingId}`;
        }
      });

      // Bấm nút Tải .ics
      toast.querySelector(`#reminder-btn-ics-${meetingId}`)?.addEventListener('click', () => {
        if (typeof window.showToast === 'function') {
          setTimeout(() => {
            window.showToast(`Đã tải tệp iCalendar cho cuộc họp "${title}".`, 'success');
          }, 400);
        }
      });

      // Tạm dừng tự đóng khi rê chuột vào Toast
      const progressBar = toast.querySelector('.reminder-progress-bar');
      toast.addEventListener('mouseenter', () => {
        if (dismissTimeout) clearTimeout(dismissTimeout);
        if (progressBar) progressBar.style.animationPlayState = 'paused';
      });

      toast.addEventListener('mouseleave', () => {
        if (progressBar) progressBar.style.animationPlayState = 'running';
        dismissTimeout = setTimeout(dismiss, 3000); // 3 giây sau khi chuột rời đi
      });

      // Đưa vào DOM
      container.appendChild(toast);

      // Tự động tắt sau duration
      if (duration > 0) {
        dismissTimeout = setTimeout(dismiss, duration);
      }

      return toast;
    },

    /**
     * Tải tệp iCalendar (.ics) từ Backend API
     * @param {number} meetingId - ID cuộc họp
     * @param {string} [title] - Tiêu đề cuộc họp
     */
    downloadICS(meetingId, title = '') {
      if (!meetingId) return;
      const url = `/api/meetings/${meetingId}/export-ics`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting_${meetingId}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (typeof window.showToast === 'function') {
        const titleText = title ? ` "${title}"` : '';
        window.showToast(`Đã xuất tệp iCalendar (.ics) cho cuộc họp${titleText} thành công!`, 'success');
      }
    },

    /**
     * Mở tab mới thêm trực tiếp sự kiện vào Google Calendar
     * @param {Object} meeting - Dữ liệu cuộc họp
     */
    addToGoogleCalendar(meeting) {
      if (!meeting) return;
      const title = meeting.title || 'Cuộc họp doanh nghiệp';
      const dateStr = meeting.date || new Date().toISOString().slice(0, 10);
      const startTime = meeting.startTime || '09:00';
      const endTime = meeting.endTime || '10:00';
      const location = meeting.roomName || 'Phòng họp ICTU';
      const description = meeting.notes || meeting.description || 'Cuộc họp được lên lịch từ hệ thống ICTU Meeting.';

      const startUtc = formatToUtcCalendarDate(dateStr, startTime);
      const endUtc = formatToUtcCalendarDate(dateStr, endTime);
      const datesParam = startUtc && endUtc ? `${startUtc}/${endUtc}` : '';

      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${datesParam}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      window.open(googleUrl, '_blank', 'noopener,noreferrer');

      if (typeof window.showToast === 'function') {
        window.showToast('Đang chuyển hướng sang Google Calendar để lưu sự kiện...', 'info');
      }
    },

    /**
     * Mở tab mới thêm trực tiếp sự kiện vào Microsoft Outlook 365
     * @param {Object} meeting - Dữ liệu cuộc họp
     */
    addToOutlook(meeting) {
      if (!meeting) return;
      const title = meeting.title || 'Cuộc họp doanh nghiệp';
      const dateStr = meeting.date || new Date().toISOString().slice(0, 10);
      const startTime = meeting.startTime || '09:00';
      const endTime = meeting.endTime || '10:00';
      const location = meeting.roomName || 'Phòng họp ICTU';
      const description = meeting.notes || meeting.description || 'Cuộc họp được lên lịch từ hệ thống ICTU Meeting.';

      const startISO = `${dateStr}T${startTime}:00`;
      const endISO = `${dateStr}T${endTime}:00`;

      const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(title)}&startdt=${encodeURIComponent(startISO)}&enddt=${encodeURIComponent(endISO)}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      window.open(outlookUrl, '_blank', 'noopener,noreferrer');

      if (typeof window.showToast === 'function') {
        window.showToast('Đang chuyển hướng sang Microsoft Outlook 365 để lưu sự kiện...', 'info');
      }
    },

    /**
     * Quét và kiểm tra các cuộc họp sắp diễn ra hôm nay để gửi thông báo nhắc nhở
     * @param {boolean} [isManualCheck=false] - True nếu do người dùng chủ động bấm chuông thông báo
     */
    checkUpcomingMeetings(isManualCheck = false) {
      const meetingsList = Array.isArray(window.meetings) ? window.meetings : [];
      if (meetingsList.length === 0) {
        if (isManualCheck && typeof window.showToast === 'function') {
          window.showToast('Bạn hiện không có cuộc họp nào trong lịch hôm nay.', 'info');
        }
        return;
      }

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      let notifiedAny = false;

      // Lọc các cuộc họp hôm nay chưa bị hủy
      const todayMeetings = meetingsList.filter(m => {
        const isToday = m.date === todayStr;
        const isNotCancelled = (m.status || '').toLowerCase() !== 'cancelled';
        return isToday && isNotCancelled;
      });

      for (const meeting of todayMeetings) {
        const meetingId = meeting.id || meeting.meetingId;
        const [h, m] = (meeting.startTime || '09:00').split(':').map(Number);
        const meetingStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);

        // Chênh lệch số phút tính từ hiện tại tới giờ họp
        const diffMs = meetingStart.getTime() - now.getTime();
        const diffMinutes = Math.round(diffMs / 60000);

        // Điều kiện nhắc nhở: Sắp diễn ra trong vòng 15 phút (hoặc vừa bắt đầu dưới 30 phút)
        const isUpcoming = diffMinutes >= 0 && diffMinutes <= 15;
        const isJustStarted = diffMinutes < 0 && diffMinutes >= -30;

        const sessionKey = `reminder_shown_${meetingId}_${todayStr}`;
        const alreadyNotified = this.notifiedMeetingIds.has(meetingId) || sessionStorage.getItem(sessionKey);

        if ((isUpcoming || isJustStarted) && !alreadyNotified) {
          this.notifiedMeetingIds.add(meetingId);
          sessionStorage.setItem(sessionKey, 'true');
          this.show(meeting, { diffMinutes });
          notifiedAny = true;
        }
      }

      if (isManualCheck && !notifiedAny && typeof window.showToast === 'function') {
        if (todayMeetings.length > 0) {
          const next = todayMeetings[0];
          window.showToast(`Lịch họp gần nhất hôm nay: "${next.title}" lúc ${next.time || next.startTime}. Chưa đến khung giờ nhắc nhở (trước 15 phút).`, 'info');
        } else {
          window.showToast('Bạn không có cuộc họp nào trong ngày hôm nay.', 'info');
        }
      }
    },

    /**
     * Bắt đầu tiến trình kiểm tra ngầm định kỳ
     * @param {number} intervalSeconds - Chu kỳ kiểm tra (giây)
     */
    startAutoReminderTicker(intervalSeconds = 30) {
      if (this.timerId) clearInterval(this.timerId);
      
      // Kiểm tra lần đầu sau 2 giây khi dữ liệu đã tải xong
      setTimeout(() => this.checkUpcomingMeetings(false), 2000);

      // Thiết lập kiểm tra định kỳ mỗi 30 giây
      this.timerId = setInterval(() => {
        this.checkUpcomingMeetings(false);
      }, intervalSeconds * 1000);
    },

    /**
     * Hàm demo / kiểm thử trực tiếp Toast nhắc nhở để người dùng trải nghiệm ngay
     */
    showTestReminder() {
      const demoMeeting = {
        id: 1,
        title: 'Họp Đánh Giá Tiến Độ Dự Án & Đồng Bộ Kế Hoạch Tuần',
        date: new Date().toISOString().slice(0, 10),
        startTime: '10:00',
        endTime: '11:30',
        time: '10:00 - 11:30',
        roomName: 'Phòng Hội Thảo Tokyo (Tầng 4)',
        host: 'Nguyễn Văn Quản Trị'
      };

      this.show(demoMeeting, {
        diffMinutes: 10,
        duration: 15000,
        sound: true
      });
    }
  };

  // Khởi tạo và gắn vào window
  window.MeetingReminderToast = MeetingReminderToast;

  // Lắng nghe sự kiện DOMContentLoaded để tự động kích hoạt
  document.addEventListener('DOMContentLoaded', () => {
    MeetingReminderToast.startAutoReminderTicker(30);
  });

})(window, document);
