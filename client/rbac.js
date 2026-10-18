/**
 * ==============================================================================
 * MODULE PHÂN QUYỀN GIAO DIỆN THEO ROLE (RBAC) & BẢO VỆ PHÒNG GIỚI HẠN (VIP)
 * Dự án: Meeting Management System – ICTU (Enterprise Sync)
 * Áp dụng Ma trận 3 vai trò: Admin, Organizer (Manager/Secretary), Attendee (Employee)
 * Tuân thủ chuẩn US 20.0 & US 21.0 và tài liệu QA_TEST_CASES_RBAC_VIP_ROOM.md
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  // ============================================================================
  // 1. ÁNH XẠ VAI TRÒ (ROLE MAPPING)
  // ============================================================================
  // Database Roles -> UI Roles
  const ROLE_MAP = {
    'Admin':     'Admin',
    'admin':     'Admin',
    'ADMIN':     'Admin',
    'Manager':   'Organizer',
    'manager':   'Organizer',
    'MANAGER':   'Organizer',
    'Secretary': 'Organizer',
    'secretary': 'Organizer',
    'SECRETARY': 'Organizer',
    'Employee':  'Attendee',
    'employee':  'Attendee',
    'EMPLOYEE':  'Attendee',
    'User':      'Attendee',
    'user':      'Attendee',
    'USER':      'Attendee'
  };

  // ============================================================================
  // 2. PHÒNG GIỚI HẠN (RESTRICTED / VIP ROOMS - US 21.0)
  // ============================================================================
  const RESTRICTED_ROOM_TYPES = ['VIP / Phỏng vấn', 'Đại sảnh / Board'];
  const RESTRICTED_ROOM_IDS = [5, 8]; // RM-005 (Focus & Phỏng Vấn Hạ Long), RM-008 (Executive Suite Tràng An)

  function isRestrictedRoom(room) {
    if (!room) return false;
    const id = Number(room.id || room.RoomID);
    const type = String(room.type || room.RoomType || '');
    if (RESTRICTED_ROOM_IDS.includes(id)) return true;
    return RESTRICTED_ROOM_TYPES.some(t => type.toLowerCase().includes(t.toLowerCase()));
  }

  // ============================================================================
  // 3. MA TRẬN PHÂN QUYỀN CHI TIẾT (PERMISSION MATRIX)
  // ============================================================================
  const PERMISSIONS = {
    Admin: {
      view_home:           true,
      view_meetings:       true,
      create_meeting:      true,
      edit_own_meeting:    true,
      edit_any_meeting:    true,
      cancel_own_meeting:  true,
      cancel_any_meeting:  true,
      recurring_meeting:   true,
      select_equipment:    true,
      view_admin:          true,
      crud_rooms:          true,
      crud_equipments:     true,
      print_qr:            true,
      book_restricted_room: true,
      view_profile:        true,
      export_csv:          true
    },
    Organizer: {
      view_home:           true,
      view_meetings:       true,
      create_meeting:      true,
      edit_own_meeting:    true,
      edit_any_meeting:    false,
      cancel_own_meeting:  true,
      cancel_any_meeting:  false,
      recurring_meeting:   true,
      select_equipment:    true,
      view_admin:          true,  // Chế độ chỉ đọc (Read-only view)
      crud_rooms:          false,
      crud_equipments:     false,
      print_qr:            true,
      book_restricted_room: true, // Manager / Secretary được phép đặt phòng VIP theo chính sách công ty
      view_profile:        true,
      export_csv:          true
    },
    Attendee: {
      view_home:           true,
      view_meetings:       true,
      create_meeting:      false, // Nhân viên thường chỉ tham dự và xem lịch
      edit_own_meeting:    false,
      edit_any_meeting:    false,
      cancel_own_meeting:  false,
      cancel_any_meeting:  false,
      recurring_meeting:   false,
      select_equipment:    false,
      view_admin:          false, // Chặn hoàn toàn khỏi trang quản trị
      crud_rooms:          false,
      crud_equipments:     false,
      print_qr:            false,
      book_restricted_room: false, // Bị chặn đặt phòng VIP
      view_profile:        true,
      export_csv:          true
    }
  };

  // ============================================================================
  // 4. CÁC HÀM TRUY VẤN QUYỀN
  // ============================================================================
  function getCurrentUser() {
    if (window.AuthState && typeof window.AuthState.getUser === 'function') {
      const u = window.AuthState.getUser();
      if (u) return u;
    }
    try {
      const raw = localStorage.getItem('currentUser') || localStorage.getItem('user');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function getUIRole() {
    const user = getCurrentUser();
    if (!user) return null;
    const rawRole = user.role || user.Role || 'Employee';
    return ROLE_MAP[rawRole] || 'Attendee';
  }

  function can(action) {
    if (action === 'book_meeting') action = 'create_meeting';
    const uiRole = getUIRole();
    if (!uiRole) return false;
    const perms = PERMISSIONS[uiRole];
    if (!perms) return false;
    return perms[action] === true;
  }

  function canEditMeeting(meeting) {
    if (can('edit_any_meeting')) return true;
    if (!can('edit_own_meeting')) return false;
    const user = getCurrentUser();
    if (!user || !meeting) return false;

    const userId = Number(user.userId || user.id);
    const orgId = Number(meeting.organizerId || meeting.OrganizerID);
    if (userId && orgId && userId === orgId) return true;

    const userName = String(user.fullName || user.name || '').toLowerCase().trim();
    const username = String(user.username || '').toLowerCase().trim();
    const hostName = String(meeting.host || meeting.OrganizerName || '').toLowerCase().trim();
    if (userName && hostName && userName === hostName) return true;
    if (username && hostName && username === hostName) return true;

    return false;
  }

  function canCancelMeeting(meeting) {
    if (can('cancel_any_meeting')) return true;
    if (!can('cancel_own_meeting')) return false;
    const user = getCurrentUser();
    if (!user || !meeting) return false;

    const userId = Number(user.userId || user.id);
    const orgId = Number(meeting.organizerId || meeting.OrganizerID);
    if (userId && orgId && userId === orgId) return true;

    const userName = String(user.fullName || user.name || '').toLowerCase().trim();
    const username = String(user.username || '').toLowerCase().trim();
    const hostName = String(meeting.host || meeting.OrganizerName || '').toLowerCase().trim();
    if (userName && hostName && userName === hostName) return true;
    if (username && hostName && username === hostName) return true;

    return false;
  }

  // ============================================================================
  // 5. HELPER VÔ HIỆU HÓA & MỞ KHÓA ELEMENT
  // ============================================================================
  function disableElement(el, reason) {
    if (!el) return;
    el.setAttribute('disabled', 'true');
    el.setAttribute('aria-disabled', 'true');
    el.setAttribute('data-rbac-disabled', 'true');
    if (reason) {
      el.setAttribute('title', reason);
      el.setAttribute('data-rbac-reason', reason);
    }
    if (!el._rbacOriginalOnclick && el.onclick) {
      el._rbacOriginalOnclick = el.onclick;
    }
    el.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (reason && typeof window.showToast === 'function') {
        window.showToast(reason, 'warning');
      }
    };
  }

  function enableElement(el) {
    if (!el || !el.hasAttribute('data-rbac-disabled')) return;
    el.removeAttribute('disabled');
    el.removeAttribute('aria-disabled');
    el.removeAttribute('data-rbac-disabled');
    el.removeAttribute('data-rbac-reason');
    if (el._rbacOriginalOnclick) {
      el.onclick = el._rbacOriginalOnclick;
      delete el._rbacOriginalOnclick;
    } else {
      el.onclick = null;
    }
  }

  // ============================================================================
  // 6. ÁP DỤNG PHÂN QUYỀN GIAO DIỆN (APPLY ROLE UI)
  // ============================================================================
  function applyRoleUI() {
    const user = getCurrentUser();
    const uiRole = getUIRole();

    // 1. Cập nhật Badge vai trò trên Header và Sidebar
    applyUserBadgeRBAC(user, uiRole);

    // 2. Ẩn/Hiện Menu điều hướng Quản trị trên Sidebar
    applyNavLinksRBAC(uiRole);

    // 3. Phân quyền trên trang Danh sách cuộc họp (#/meetings & #/home)
    applyMeetingsPageRBAC(uiRole);

    // 4. Phân quyền trên trang Quản trị (#/admin, #/rooms, #/admin/equipments...)
    applyAdminPageRBAC(uiRole);

    // 5. Cảnh báo và huy hiệu phòng giới hạn (VIP Rooms)
    applyRestrictedRoomsRBAC(uiRole);

    // 6. Cảnh báo và khóa trong Modal đặt lịch cuộc họp
    applyMeetingModalRBAC(uiRole);
  }

  /**
   * Cập nhật hiển thị vai trò trên Header và Sidebar
   */
  function applyUserBadgeRBAC(user, uiRole) {
    const roleEl = document.getElementById('header-user-role');
    const sidebarRoleEl = document.getElementById('sidebar-user-role');

    if (!user || !uiRole) {
      if (roleEl) roleEl.textContent = 'Khách (GUEST)';
      if (sidebarRoleEl) {
        sidebarRoleEl.textContent = 'GUEST';
        sidebarRoleEl.className = 'sidebar-role-badge badge-user';
      }
      return;
    }

    let roleText = 'Thành viên (USER)';
    let badgeClass = 'badge-user';
    let sidebarText = 'USER';

    if (uiRole === 'Admin') {
      roleText = 'Quản trị viên (Admin)';
      badgeClass = 'badge-admin';
      sidebarText = 'ADMIN';
    } else if (uiRole === 'Organizer') {
      const r = (user.role || '').toLowerCase();
      roleText = r.includes('manager') ? 'Trưởng phòng (Organizer)' : 'Thư ký (Organizer)';
      badgeClass = 'badge-organizer';
      sidebarText = 'ORGANIZER';
    } else {
      roleText = 'Nhân viên (Attendee)';
      badgeClass = 'badge-user';
      sidebarText = 'EMPLOYEE';
    }

    if (roleEl) {
      roleEl.textContent = roleText;
      roleEl.className = `user-role ${badgeClass}`;
    }

    if (sidebarRoleEl) {
      sidebarRoleEl.textContent = sidebarText;
      sidebarRoleEl.className = `sidebar-role-badge ${badgeClass}`;
    }
  }

  /**
   * Ẩn/hiện các liên kết Quản trị trên Sidebar theo vai trò
   */
  function applyNavLinksRBAC(uiRole) {
    const adminLinks = document.querySelectorAll(
      '.nav-link-custom[href="#/admin"], .nav-link-custom[href="#/rooms"], .nav-link-custom[href="#/admin/equipments"], .nav-link-custom[href="#/admin/equipment"], .admin-portal-link'
    );

    adminLinks.forEach(link => {
      if (uiRole === 'Attendee') {
        link.classList.add('rbac-hidden');
      } else {
        link.classList.remove('rbac-hidden');
      }
    });
  }

  /**
   * Phân quyền trên trang Danh sách cuộc họp (nút tạo, sửa, xóa)
   */
  function applyMeetingsPageRBAC(uiRole) {
    // Nút tạo cuộc họp ở đầu trang
    const addButtons = document.querySelectorAll(
      '#btn-add-meeting, .btn-add-meeting, #btn-home-create-meeting, #btn-finder-book-room, .btn-quick-book-eq'
    );
    addButtons.forEach(btn => {
      if (!can('create_meeting')) {
        disableElement(btn, 'Bạn cần quyền Quản trị viên (Admin) hoặc Trưởng phòng (Organizer) để tạo cuộc họp');
      } else {
        enableElement(btn);
      }
    });

    // Bảng danh sách cuộc họp
    const allMeetings = Array.isArray(window.meetings) ? window.meetings : [];
    document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
      const id = Number(btn.getAttribute('data-id'));
      const meeting = allMeetings.find(m => m.id === id);
      if (meeting && !canEditMeeting(meeting)) {
        disableElement(btn, 'Bạn chỉ có thể chỉnh sửa cuộc họp do chính mình tổ chức');
      } else if (!can('create_meeting')) {
        disableElement(btn, 'Bạn không có quyền chỉnh sửa cuộc họp này');
      } else {
        enableElement(btn);
      }
    });

    document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
      const id = Number(btn.getAttribute('data-id'));
      const meeting = allMeetings.find(m => m.id === id);
      if (meeting && !canCancelMeeting(meeting)) {
        disableElement(btn, 'Bạn chỉ có thể hủy cuộc họp do chính mình tổ chức');
      } else if (!can('create_meeting')) {
        disableElement(btn, 'Bạn không có quyền hủy cuộc họp này');
      } else {
        enableElement(btn);
      }
    });
  }

  /**
   * Phân quyền trên trang Quản trị (Chế độ chỉ đọc cho Organizer)
   */
  function applyAdminPageRBAC(uiRole) {
    if (uiRole === 'Attendee') return; // Đã được Route Guard bảo vệ

    const adminContainer = document.querySelector('.admin-dashboard-page, .admin-users-page, .admin-rooms-page, .admin-equipments-page');
    if (!adminContainer) return;

    if (uiRole === 'Organizer') {
      // 1. Chèn banner chỉ đọc (Read-only banner) nếu chưa có
      if (!document.getElementById('rbac-readonly-banner')) {
        const subnav = document.querySelector('.admin-subnav-container, .admin-subnav, .page-header');
        if (subnav) {
          const banner = document.createElement('div');
          banner.id = 'rbac-readonly-banner';
          banner.className = 'rbac-readonly-banner alert-warning-soft';
          banner.innerHTML = `
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-eye-fill fs-5 text-primary"></i>
              <div>
                <strong>Chế độ xem chỉ đọc (Read-only View):</strong>
                Tài khoản của bạn có quyền <strong>Organizer</strong> xem tổng quan tài nguyên. Chỉ <strong>Quản trị viên (Admin)</strong> mới có quyền thêm mới, sửa đổi hoặc xóa phòng họp &amp; thiết bị.
              </div>
            </div>
          `;
          subnav.parentNode.insertBefore(banner, subnav.nextSibling);
        }
      }

      // 2. Vô hiệu hóa các nút thêm, sửa, xóa
      const adminAddBtns = document.querySelectorAll('#btn-add-room, #btn-add-equipment, .btn-admin-add, #btn-batch-delete-rooms, #btn-batch-delete-equipments');
      adminAddBtns.forEach(btn => {
        disableElement(btn, 'Chỉ Quản trị viên (Admin) mới có quyền thực hiện thao tác này');
      });

      // Vô hiệu hóa nút sửa, xóa, toggle trạng thái trong bảng phòng và thiết bị
      document.querySelectorAll('.admin-table button, .room-actions-cell button, .equipment-actions-cell button').forEach(btn => {
        const title = btn.getAttribute('title') || btn.getAttribute('aria-label') || '';
        if (title.includes('Sửa') || title.includes('Xóa') || title.includes('Bảo trì') || title.includes('Đổi')) {
          disableElement(btn, 'Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa tài nguyên hệ thống');
        }
      });
    } else {
      // Admin: gỡ bỏ banner read-only nếu có
      const banner = document.getElementById('rbac-readonly-banner');
      if (banner) banner.remove();
    }
  }

  /**
   * Cảnh báo và huy hiệu phòng giới hạn (VIP Rooms) trên các thẻ phòng
   */
  function applyRestrictedRoomsRBAC(uiRole) {
    const allRooms = Array.isArray(window.ROOMS) ? window.ROOMS : [];

    // 1. Thẻ phòng trong lưới Realtime Room Cards
    document.querySelectorAll('.realtime-room-card[data-room-id]').forEach(card => {
      const roomId = Number(card.getAttribute('data-room-id'));
      const room = allRooms.find(r => r.id === roomId);
      if (room && isRestrictedRoom(room)) {
        if (!card.querySelector('.rbac-restricted-badge')) {
          const badge = document.createElement('span');
          badge.className = 'rbac-restricted-badge';
          badge.innerHTML = '<i class="bi bi-star-fill text-warning me-1"></i>VIP / Giới hạn';
          badge.title = `Phòng ${room.type || 'VIP'} — Chỉ Quản trị viên và Trưởng phòng được đặt`;
          card.appendChild(badge);
        }

        // Nếu là Attendee -> khóa thẻ phòng
        if (!can('book_restricted_room')) {
          card.classList.add('rbac-room-locked');
          card.setAttribute('title', `Phòng ${room.name} là phòng VIP giới hạn. Bạn không có quyền đặt phòng này.`);
        } else {
          card.classList.remove('rbac-room-locked');
        }
      }
    });

    // 2. Thẻ phòng trên trang Tổng quan (#finder-room-cards)
    document.querySelectorAll('#finder-room-cards .realtime-room-card').forEach(card => {
      const nameEl = card.querySelector('.room-card-name');
      if (!nameEl) return;
      const roomName = nameEl.textContent.trim();
      const room = allRooms.find(r => r.name === roomName);
      if (room && isRestrictedRoom(room) && !card.querySelector('.rbac-restricted-badge')) {
        const badge = document.createElement('span');
        badge.className = 'rbac-restricted-badge';
        badge.innerHTML = '<i class="bi bi-star-fill text-warning me-1"></i>VIP / Giới hạn';
        card.appendChild(badge);
      }
    });

    // 3. Dropdown phòng họp trong modal (#meeting-room)
    const roomSelect = document.getElementById('meeting-room');
    if (roomSelect) {
      Array.from(roomSelect.options).forEach(opt => {
        const roomId = Number(opt.value);
        if (!roomId) return;
        const room = allRooms.find(r => r.id === roomId);
        if (room && isRestrictedRoom(room)) {
          if (!can('book_restricted_room')) {
            opt.disabled = true;
            if (!opt.text.includes('[Khóa')) {
              opt.text = `🔒 [Khóa - Chỉ Quản trị viên / Trưởng phòng] ${room.name} (${room.capacity} chỗ)`;
            }
          } else {
            opt.disabled = false;
            if (!opt.text.includes('[VIP')) {
              opt.text = `⭐ [VIP / Giới hạn] ${room.name} (${room.capacity} chỗ)`;
            }
          }
        }
      });
    }
  }

  /**
   * Cảnh báo động trong Modal đặt phòng khi chọn phòng giới hạn (VIP)
   */
  function applyMeetingModalRBAC(uiRole) {
    const roomSelect = document.getElementById('meeting-room');
    if (!roomSelect) return;

    const allRooms = Array.isArray(window.ROOMS) ? window.ROOMS : [];
    const selectedRoomId = Number(roomSelect.value);
    const room = allRooms.find(r => r.id === selectedRoomId);

    let alertBox = document.getElementById('rbac-restricted-room-alert');
    if (!alertBox) {
      alertBox = document.createElement('div');
      alertBox.id = 'rbac-restricted-room-alert';
      alertBox.className = 'rbac-restricted-alert hidden mt-2';
      alertBox.setAttribute('role', 'alert');

      const roomGroup = document.getElementById('group-room');
      const conflictAlert = document.getElementById('room-conflict-alert');
      if (conflictAlert && conflictAlert.parentNode) {
        conflictAlert.parentNode.insertBefore(alertBox, conflictAlert.nextSibling);
      } else if (roomGroup) {
        roomGroup.appendChild(alertBox);
      }
    }

    const submitBtn = document.getElementById('btn-submit-meeting') || document.querySelector('.btn-meeting-submit');

    if (room && isRestrictedRoom(room)) {
      if (!can('book_restricted_room')) {
        alertBox.className = 'rbac-restricted-alert rbac-restricted-alert-danger mt-2';
        alertBox.innerHTML = `
          <i class="bi bi-shield-lock-fill text-danger fs-5 flex-shrink-0"></i>
          <div>
            <strong>Chặn đặt phòng giới hạn:</strong>
            Phòng <strong>${escapeHTMLSafe(room.name)}</strong> (${escapeHTMLSafe(room.type || 'VIP')}) là phòng giới hạn theo chính sách công ty.
            Tài khoản của bạn cần vai trò <strong>Trưởng phòng (Organizer)</strong> hoặc <strong>Quản trị viên (Admin)</strong> để đặt phòng này.
          </div>
        `;
        alertBox.classList.remove('hidden');
        if (submitBtn) {
          disableElement(submitBtn, 'Bạn không có quyền đặt phòng giới hạn (VIP)');
        }
      } else {
        alertBox.className = 'rbac-restricted-alert rbac-restricted-alert-warning mt-2';
        alertBox.innerHTML = `
          <i class="bi bi-star-fill text-warning fs-5 flex-shrink-0"></i>
          <div>
            <strong>Phòng ưu tiên đặc biệt:</strong>
            Phòng <strong>${escapeHTMLSafe(room.name)}</strong> (${escapeHTMLSafe(room.type || 'VIP')}) dành riêng cho các sự kiện điều hành và tiếp đối tác.
          </div>
        `;
        alertBox.classList.remove('hidden');
        if (submitBtn && submitBtn.getAttribute('data-rbac-reason') === 'Bạn không có quyền đặt phòng giới hạn (VIP)') {
          enableElement(submitBtn);
        }
      }
    } else {
      alertBox.classList.add('hidden');
      if (submitBtn && submitBtn.getAttribute('data-rbac-reason') === 'Bạn không có quyền đặt phòng giới hạn (VIP)') {
        enableElement(submitBtn);
      }
    }
  }

  function escapeHTMLSafe(str) {
    if (typeof window.escapeHTML === 'function') return window.escapeHTML(str);
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ============================================================================
  // 7. GẮN SỰ KIỆN TỰ ĐỘNG
  // ============================================================================
  // Lắng nghe khi người dùng đổi phòng trong modal
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'meeting-room') {
      const uiRole = getUIRole();
      applyMeetingModalRBAC(uiRole);
    }
  });

  // Tự động chạy RBAC khi DOM sẵn sàng
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(applyRoleUI, 100);
  });

  // ============================================================================
  // 8. XUẤT RA WINDOW SCOPE
  // ============================================================================
  window.ROLE_MAP = ROLE_MAP;
  window.RESTRICTED_ROOM_TYPES = RESTRICTED_ROOM_TYPES;
  window.RESTRICTED_ROOM_IDS = RESTRICTED_ROOM_IDS;
  window.getUIRole = getUIRole;
  window.can = can;
  window.canEditMeeting = canEditMeeting;
  window.canCancelMeeting = canCancelMeeting;
  window.isRestrictedRoom = isRestrictedRoom;
  window.applyRoleUI = applyRoleUI;
  window.disableElement = disableElement;
  window.enableElement = enableElement;

})(window, document);
