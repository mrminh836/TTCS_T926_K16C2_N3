// =====================================================
// RBAC.JS — PHÂN QUYỀN GIAO DIỆN THEO ROLE
// Sprint 3: Route guard, ẩn/khóa, badge phòng giới hạn
// Nạp SAU main.js (cần escapeHTML, routes, router)
// =====================================================

(function () {
  'use strict';

  // =====================================================
  // 1. ÁNH XẠ ROLE (DB → UI) — DỄ SỬA
  // =====================================================
  // GIẢ ĐỊNH: sẽ xác nhận lại với nhóm backend.
  // Key = role trong DB (Users.Role), Value = role giao diện.

  var ROLE_MAP = {
    'Admin':     'Admin',
    'Manager':   'Organizer',
    'Secretary': 'Organizer',
    'Employee':  'Attendee'
  };

  // =====================================================
  // 2. PHÒNG GIỚI HẠN (FE-only, DB không có field)
  // =====================================================

  var RESTRICTED_ROOM_TYPES = ['VIP / Phỏng vấn', 'Đại sảnh / Board'];

  // =====================================================
  // 3. MA TRẬN QUYỀN MẶC ĐỊNH
  // =====================================================
  // Mỗi action trả về true/false.
  // Tập trung 1 nơi duy nhất để dễ bảo trì.

  var PERMISSIONS = {
    Admin: {
      'view_home':           true,
      'view_meetings':       true,
      'create_meeting':      true,
      'edit_own_meeting':    true,
      'edit_any_meeting':    true,
      'cancel_own_meeting':  true,
      'cancel_any_meeting':  true,
      'recurring_meeting':   true,
      'select_equipment':    true,
      'view_admin':          true,
      'crud_rooms':          true,
      'crud_equipments':     true,
      'print_qr':            true,
      'book_restricted_room': true,
      'view_profile':        true,
      'export_csv':          true
    },
    Organizer: {
      'view_home':           true,
      'view_meetings':       true,
      'create_meeting':      true,
      'edit_own_meeting':    true,
      'edit_any_meeting':    false,
      'cancel_own_meeting':  true,
      'cancel_any_meeting':  false,
      'recurring_meeting':   true,
      'select_equipment':    true,
      'view_admin':          true,  // chế độ chỉ xem
      'crud_rooms':          false,
      'crud_equipments':     false,
      'print_qr':            true,
      'book_restricted_room': true,
      'view_profile':        true,
      'export_csv':          true
    },
    Attendee: {
      'view_home':           true,
      'view_meetings':       true,
      'create_meeting':      false,
      'edit_own_meeting':    false,
      'edit_any_meeting':    false,
      'cancel_own_meeting':  false,
      'cancel_any_meeting':  false,
      'recurring_meeting':   false,
      'select_equipment':    false,
      'view_admin':          false,
      'crud_rooms':          false,
      'crud_equipments':     false,
      'print_qr':            false,
      'book_restricted_room': false,
      'view_profile':        true,
      'export_csv':          true
    }
  };

  // =====================================================
  // 4. HÀM KIỂM TRA QUYỀN: can(action)
  // =====================================================

  function getUIRole() {
    if (typeof AuthManager === 'undefined') return null;
    var user = AuthManager.getCurrentUser();
    if (!user) return null;
    return ROLE_MAP[user.role] || 'Attendee';
  }

  function can(action) {
    var uiRole = getUIRole();
    if (!uiRole) return false; // Chưa đăng nhập → không có quyền
    var perms = PERMISSIONS[uiRole];
    if (!perms) return false;
    return perms[action] === true;
  }

  function canEditMeeting(meeting) {
    if (can('edit_any_meeting')) return true;
    if (!can('edit_own_meeting')) return false;
    var user = AuthManager.getCurrentUser();
    if (!user) return false;
    return meeting && (meeting.organizerId === user.userId || meeting.host === user.fullName);
  }

  function canCancelMeeting(meeting) {
    if (can('cancel_any_meeting')) return true;
    if (!can('cancel_own_meeting')) return false;
    var user = AuthManager.getCurrentUser();
    if (!user) return false;
    return meeting && (meeting.organizerId === user.userId || meeting.host === user.fullName);
  }

  function isRestrictedRoom(room) {
    if (!room || !room.type) return false;
    return RESTRICTED_ROOM_TYPES.indexOf(room.type) !== -1;
  }

  // =====================================================
  // 5. ROUTE GUARD
  // =====================================================

  function rbacRouteGuard(route) {
    // Luôn cho phép route profile nếu đã đăng nhập
    // (profile cũng yêu cầu đăng nhập)

    // Nếu chưa đăng nhập → mở modal (trừ home)
    if (!AuthManager.isLoggedIn()) {
      // Cho phép xem Home khi chưa đăng nhập
      if (route === '/' || route === '/home') {
        return true;
      }
      // Các route khác → yêu cầu đăng nhập
      openAuthModal(route);
      // Render home tạm thời
      var appEl = document.getElementById('app');
      if (appEl && route !== '/' && route !== '/home') {
        renderLoginRequired();
      }
      return false;
    }

    // Kiểm tra quyền theo route
    if (route.indexOf('/admin') === 0 || route === '/rooms' || route === '/equipments') {
      if (!can('view_admin')) {
        renderAccessDenied();
        return false;
      }
    }

    return true;
  }

  function renderAccessDenied() {
    var appEl = document.getElementById('app');
    if (!appEl) return;
    appEl.innerHTML =
      '<section class="page rbac-access-denied">' +
        '<div class="rbac-denied-icon">' +
          '<i class="bi bi-shield-x"></i>' +
        '</div>' +
        '<h2 class="rbac-denied-title">Không có quyền truy cập</h2>' +
        '<p class="rbac-denied-desc">' +
          'Tài khoản của bạn không có quyền truy cập trang này.<br>' +
          'Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.' +
        '</p>' +
        '<a href="#/" class="btn btn-primary stitch-btn-submit">' +
          '<i class="bi bi-house me-1"></i> Về Trang chủ' +
        '</a>' +
      '</section>';
  }

  function renderLoginRequired() {
    var appEl = document.getElementById('app');
    if (!appEl) return;
    appEl.innerHTML =
      '<section class="page rbac-access-denied">' +
        '<div class="rbac-denied-icon" style="background: var(--primary-50); color: var(--primary-600);">' +
          '<i class="bi bi-box-arrow-in-right"></i>' +
        '</div>' +
        '<h2 class="rbac-denied-title">Yêu cầu đăng nhập</h2>' +
        '<p class="rbac-denied-desc">' +
          'Bạn cần đăng nhập để truy cập trang này.' +
        '</p>' +
        '<button type="button" class="btn btn-primary stitch-btn-submit" onclick="openAuthModal()">' +
          '<i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập' +
        '</button>' +
      '</section>';
  }

  // =====================================================
  // 6. ÁP DỤNG PHÂN QUYỀN SAU MỖI LẦN RENDER
  // =====================================================

  function applyRoleUI() {
    if (typeof AuthManager === 'undefined' || !AuthManager.isLoggedIn()) return;

    var uiRole = getUIRole();
    if (!uiRole) return;

    // ── Ẩn/Hiện nav Admin ──
    var adminNav = document.querySelector('.nav-link-custom[href="#/admin"]');
    if (adminNav) {
      if (uiRole === 'Attendee') {
        adminNav.classList.add('rbac-hidden');
      } else {
        adminNav.classList.remove('rbac-hidden');
      }
    }

    // ── Áp dụng cho trang meetings ──
    applyMeetingPageRBAC(uiRole);

    // ── Áp dụng cho trang admin ──
    applyAdminPageRBAC(uiRole);

    // ── Badge phòng giới hạn ──
    applyRestrictedRoomBadges();

    // ── Áp dụng cho modal tạo/sửa cuộc họp ──
    applyMeetingModalRBAC(uiRole);
  }

  // ── Meeting page: nút tạo, sửa, xóa cuộc họp ──
  function applyMeetingPageRBAC(uiRole) {
    // Nút tạo cuộc họp
    var btnAdd = document.getElementById('btn-add-meeting');
    if (btnAdd) {
      if (!can('create_meeting')) {
        disableElement(btnAdd, 'Bạn cần quyền Organizer hoặc Admin để tạo cuộc họp');
      } else {
        enableElement(btnAdd);
      }
    }

    // Nút "Đặt phòng ngay" trên finder
    var btnFinderBook = document.getElementById('btn-finder-book-room');
    if (btnFinderBook) {
      if (!can('create_meeting')) {
        disableElement(btnFinderBook, 'Bạn cần quyền Organizer hoặc Admin để đặt phòng');
      } else {
        enableElement(btnFinderBook);
      }
    }

    // Nút sửa/xóa trên bảng meeting
    var meetingActions = document.querySelectorAll('.stitch-actions-wrapper');
    meetingActions.forEach(function (wrapper) {
      var editBtn = wrapper.querySelector('[data-action="edit"]');
      var deleteBtn = wrapper.querySelector('[data-action="delete"]');
      var meetingId = editBtn ? Number(editBtn.getAttribute('data-id')) : null;

      // Tìm meeting object
      var meeting = null;
      if (meetingId && typeof meetings !== 'undefined') {
        meeting = meetings.find(function (m) { return m.id === meetingId; });
      }

      if (editBtn) {
        if (meeting && !canEditMeeting(meeting)) {
          disableElement(editBtn, 'Bạn chỉ có thể sửa cuộc họp do mình tổ chức');
        } else if (!can('create_meeting')) {
          disableElement(editBtn, 'Bạn không có quyền sửa cuộc họp');
        } else {
          enableElement(editBtn);
        }
      }

      if (deleteBtn) {
        if (meeting && !canCancelMeeting(meeting)) {
          disableElement(deleteBtn, 'Bạn chỉ có thể hủy cuộc họp do mình tổ chức');
        } else if (!can('create_meeting')) {
          disableElement(deleteBtn, 'Bạn không có quyền hủy cuộc họp');
        } else {
          enableElement(deleteBtn);
        }
      }
    });
  }

  // ── Admin page: nút CRUD phòng/thiết bị ──
  function applyAdminPageRBAC(uiRole) {
    if (uiRole === 'Attendee') return; // Đã chặn ở route guard

    if (uiRole === 'Organizer') {
      // Nút thêm phòng
      var btnAddRoom = document.getElementById('btn-add-room');
      if (btnAddRoom) disableElement(btnAddRoom, 'Chỉ Admin mới có quyền thêm phòng họp');

      // Nút thêm thiết bị
      var btnAddEq = document.getElementById('btn-add-equipment');
      if (btnAddEq) disableElement(btnAddEq, 'Chỉ Admin mới có quyền thêm thiết bị');

      // Nút xóa hàng loạt phòng
      var btnBatchRoom = document.getElementById('btn-batch-delete-rooms');
      if (btnBatchRoom) disableElement(btnBatchRoom, 'Chỉ Admin mới có quyền xóa phòng');

      // Nút xóa hàng loạt thiết bị
      var btnBatchEq = document.getElementById('btn-batch-delete-equipments');
      if (btnBatchEq) disableElement(btnBatchEq, 'Chỉ Admin mới có quyền xóa thiết bị');

      // Các nút sửa/xóa/đổi trạng thái trong bảng phòng
      document.querySelectorAll('.room-actions-cell .btn-stitch-icon').forEach(function (btn) {
        var label = btn.getAttribute('aria-label') || '';
        if (label.indexOf('Chỉnh sửa') !== -1 || label.indexOf('Xóa') !== -1 || label.indexOf('Đổi trạng thái') !== -1) {
          disableElement(btn, 'Chỉ Admin mới có quyền thực hiện thao tác này');
        }
      });

      // Các nút sửa/xóa thiết bị
      document.querySelectorAll('.equipment-actions-cell .btn-stitch-icon').forEach(function (btn) {
        var label = btn.getAttribute('aria-label') || '';
        if (label.indexOf('Chỉnh sửa') !== -1 || label.indexOf('Xóa') !== -1) {
          disableElement(btn, 'Chỉ Admin mới có quyền thực hiện thao tác này');
        }
      });

      // Thêm banner read-only
      addReadOnlyBanner();
    }
  }

  function addReadOnlyBanner() {
    // Kiểm tra đã có banner chưa
    if (document.getElementById('rbac-readonly-banner')) return;
    var pageTitle = document.querySelector('.admin-portal-header');
    if (!pageTitle) return;

    var banner = document.createElement('div');
    banner.id = 'rbac-readonly-banner';
    banner.className = 'rbac-readonly-banner';
    banner.innerHTML =
      '<i class="bi bi-eye-fill"></i>' +
      '<span>Bạn đang xem ở chế độ <strong>chỉ đọc</strong>. Liên hệ Admin để thêm/sửa/xóa dữ liệu.</span>';
    pageTitle.insertAdjacentElement('afterend', banner);
  }

  // ── Badge "Giới hạn" trên thẻ phòng ──
  function applyRestrictedRoomBadges() {
    if (typeof ROOMS === 'undefined') return;

    // Thẻ phòng trong modal tạo/sửa cuộc họp
    document.querySelectorAll('.realtime-room-card[data-room-id]').forEach(function (card) {
      var roomId = Number(card.getAttribute('data-room-id'));
      var room = ROOMS.find(function (r) { return r.id === roomId; });
      if (room && isRestrictedRoom(room)) {
        if (!card.querySelector('.rbac-restricted-badge')) {
          var badge = document.createElement('span');
          badge.className = 'rbac-restricted-badge';
          badge.innerHTML = '<i class="bi bi-lock-fill"></i> Giới hạn';
          badge.title = 'Phòng ' + room.type + ' — chỉ Admin và Organizer được đặt';
          card.appendChild(badge);
        }

        // Nếu Attendee → khóa click
        if (!can('book_restricted_room')) {
          card.classList.add('rbac-room-locked');
          card.setAttribute('title', 'Bạn không có quyền đặt phòng ' + (room.type || 'giới hạn'));
          card.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            showToast('Phòng ' + (room.type || 'này') + ' chỉ dành cho Admin hoặc Organizer.', 'warning');
          };
        }
      }
    });

    // Thẻ phòng trên trang Home (finder-room-cards)
    document.querySelectorAll('#finder-room-cards .realtime-room-card').forEach(function (card) {
      // Parse room name from card
      var nameEl = card.querySelector('.room-card-name');
      if (!nameEl) return;
      var roomName = nameEl.textContent.trim();
      var room = ROOMS.find(function (r) { return r.name === roomName; });
      if (room && isRestrictedRoom(room) && !card.querySelector('.rbac-restricted-badge')) {
        var badge = document.createElement('span');
        badge.className = 'rbac-restricted-badge';
        badge.innerHTML = '<i class="bi bi-lock-fill"></i> Giới hạn';
        badge.title = 'Phòng ' + room.type + ' — chỉ Admin và Organizer được đặt';
        card.appendChild(badge);
      }
    });
  }

  // ── Modal tạo/sửa cuộc họp: cảnh báo phòng giới hạn ──
  function applyMeetingModalRBAC(uiRole) {
    var roomSelect = document.getElementById('meeting-room');
    if (!roomSelect || typeof ROOMS === 'undefined') return;

    var selectedRoomId = Number(roomSelect.value);
    if (!selectedRoomId) return;

    var room = ROOMS.find(function (r) { return r.id === selectedRoomId; });
    var alertBox = document.getElementById('rbac-restricted-room-alert');

    if (room && isRestrictedRoom(room)) {
      if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'rbac-restricted-room-alert';
        alertBox.className = 'rbac-restricted-alert';
        alertBox.setAttribute('role', 'alert');
        var roomErrorEl = document.getElementById('room-error');
        if (roomErrorEl) {
          roomErrorEl.parentNode.insertBefore(alertBox, roomErrorEl);
        }
      }

      if (!can('book_restricted_room')) {
        alertBox.className = 'rbac-restricted-alert rbac-restricted-alert-danger';
        alertBox.innerHTML =
          '<i class="bi bi-lock-fill"></i>' +
          '<span>Phòng <strong>' + _safeEscape(room.name) + '</strong> (' + _safeEscape(room.type) + ') ' +
          'là phòng giới hạn. Bạn cần quyền <strong>Organizer</strong> hoặc <strong>Admin</strong> để đặt phòng này.</span>';

        // Khóa nút submit
        var submitBtn = document.getElementById('btn-submit-meeting');
        if (submitBtn) {
          disableElement(submitBtn, 'Bạn không có quyền đặt phòng giới hạn');
        }
      } else {
        alertBox.className = 'rbac-restricted-alert rbac-restricted-alert-warning';
        alertBox.innerHTML =
          '<i class="bi bi-exclamation-triangle-fill"></i>' +
          '<span>Phòng <strong>' + _safeEscape(room.name) + '</strong> (' + _safeEscape(room.type) + ') ' +
          'là phòng giới hạn. Chỉ Admin và Organizer được đặt.</span>';
      }
      alertBox.classList.remove('hidden');
    } else {
      if (alertBox) alertBox.classList.add('hidden');
      // Bỏ khóa nút submit nếu đã khóa do phòng giới hạn
      var submitBtn2 = document.getElementById('btn-submit-meeting');
      if (submitBtn2 && submitBtn2.getAttribute('data-rbac-reason') === 'Bạn không có quyền đặt phòng giới hạn') {
        enableElement(submitBtn2);
      }
    }
  }

  // =====================================================
  // 7. HELPER: Disable / Enable phần tử
  // =====================================================

  function disableElement(el, reason) {
    if (!el) return;
    el.setAttribute('disabled', 'true');
    el.setAttribute('aria-disabled', 'true');
    el.setAttribute('data-rbac-disabled', 'true');
    if (reason) {
      el.setAttribute('title', reason);
      el.setAttribute('data-rbac-reason', reason);
    }
    // Chặn onclick gốc
    if (!el._rbacOriginalOnclick && el.onclick) {
      el._rbacOriginalOnclick = el.onclick;
    }
    el.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (reason) showToast(reason, 'warning');
    };
  }

  function enableElement(el) {
    if (!el || !el.hasAttribute('data-rbac-disabled')) return;
    el.removeAttribute('disabled');
    el.removeAttribute('aria-disabled');
    el.removeAttribute('data-rbac-disabled');
    el.removeAttribute('data-rbac-reason');
    el.removeAttribute('title');
    if (el._rbacOriginalOnclick) {
      el.onclick = el._rbacOriginalOnclick;
      delete el._rbacOriginalOnclick;
    } else {
      el.onclick = null;
    }
  }

  function _safeEscape(str) {
    if (typeof escapeHTML === 'function') return escapeHTML(str);
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // =====================================================
  // 8. THIẾT LẬP ROUTE GUARD VÀ HOOK
  // =====================================================

  // Export qua window cho main.js sử dụng
  window.__esRouteGuard = rbacRouteGuard;
  window.__esApplyRoleUI = applyRoleUI;

  // ── Lắng nghe khi phòng được chọn trong modal ──
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'meeting-room') {
      var uiRole = getUIRole();
      if (uiRole) applyMeetingModalRBAC(uiRole);
    }
  });

  // ── Hook sau mỗi lần openAddModal: set organizer mặc định ──
  // Sử dụng MutationObserver để phát hiện khi modal-overlay hiện
  var modalOverlayEl = document.getElementById('modal-overlay');
  if (modalOverlayEl) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          var isVisible = !modalOverlayEl.classList.contains('hidden');
          if (isVisible && AuthManager.isLoggedIn()) {
            var user = AuthManager.getCurrentUser();
            if (user) setDefaultOrganizer(user);
            var uiRole = getUIRole();
            if (uiRole) {
              setTimeout(function () { applyMeetingModalRBAC(uiRole); }, 50);
            }
          }
        }
      });
    });
    observer.observe(modalOverlayEl, { attributes: true, attributeFilter: ['class'] });
  }

  // =====================================================
  // 9. EXPORT RA WINDOW
  // =====================================================

  window.ROLE_MAP = ROLE_MAP;
  window.RESTRICTED_ROOM_TYPES = RESTRICTED_ROOM_TYPES;
  window.can = can;
  window.canEditMeeting = canEditMeeting;
  window.canCancelMeeting = canCancelMeeting;
  window.isRestrictedRoom = isRestrictedRoom;
  window.applyRoleUI = applyRoleUI;
  window.getUIRole = getUIRole;

})();
