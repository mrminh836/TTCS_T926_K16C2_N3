/**
 * ==============================================================================
 * PAGE: DANH SÁCH & CHI TIẾT CUỘC HỌP (MEETINGS PAGE WRAPPER)
 * Routes:
 * - #/meetings: Danh sách cuộc họp
 * - #/meetings/create: Mở modal tạo cuộc họp mới
 * - #/meetings/:id: Mở modal chi tiết cuộc họp theo ID
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  /**
   * Route handler cho #/meetings
   */
  function handleMeetingsRoute() {
    if (typeof window.renderMeetingsPage === 'function') {
      window.renderMeetingsPage();
    }
  }

  /**
   * Route handler cho #/meetings/create
   */
  function handleMeetingCreateRoute() {
    // Render trang danh sách cuộc họp trước
    if (typeof window.renderMeetingsPage === 'function') {
      window.renderMeetingsPage();
    }
    // Mở modal tạo mới
    setTimeout(() => {
      if (typeof window.openAddModal === 'function') {
        window.openAddModal();
      }
    }, 100);
  }

  /**
   * Route handler cho #/meetings/:id (Xem chi tiết cuộc họp theo tham số URL)
   */
  function handleMeetingDetailRoute(params) {
    const meetingId = Number(params?.id);
    // Render trang danh sách cuộc họp làm nền
    if (typeof window.renderMeetingsPage === 'function') {
      window.renderMeetingsPage();
    }

    // Mở modal chi tiết cuộc họp
    setTimeout(() => {
      if (typeof window.openDetailModal === 'function' && !isNaN(meetingId)) {
        window.openDetailModal(meetingId);
      }
    }, 150);
  }

  window.handleMeetingsRoute = handleMeetingsRoute;
  window.handleMeetingCreateRoute = handleMeetingCreateRoute;
  window.handleMeetingDetailRoute = handleMeetingDetailRoute;

})(window, document);
