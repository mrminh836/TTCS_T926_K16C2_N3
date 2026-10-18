// =====================================================
// PROFILE.JS — TRANG HỒ SƠ CÁ NHÂN
// Sprint 3: Route #/profile, đổi mật khẩu
// Nạp SAU main.js (cần escapeHTML, getInitials, getHostColor)
// =====================================================

(function () {
  'use strict';

  // =====================================================
  // 1. RENDER PROFILE PAGE
  // =====================================================

  function renderProfile() {
    var appEl = document.getElementById('app');
    if (!appEl) return;

    if (typeof AuthManager === 'undefined' || !AuthManager.isLoggedIn()) {
      openAuthModal('/profile');
      return;
    }

    var user = AuthManager.getCurrentUser();
    if (!user) return;

    var initials = typeof getInitials === 'function' ? getInitials(user.fullName) : user.fullName.charAt(0);
    var color = typeof getHostColor === 'function' ? getHostColor(user.fullName) : '#2563eb';
    var roleDisplay = {
      'Admin': 'Quản trị viên',
      'Manager': 'Quản lý',
      'Secretary': 'Thư ký',
      'Employee': 'Nhân viên'
    };
    var roleBadgeClass = {
      'Admin': 'profile-role-admin',
      'Manager': 'profile-role-organizer',
      'Secretary': 'profile-role-organizer',
      'Employee': 'profile-role-attendee'
    };

    var esc = typeof escapeHTML === 'function' ? escapeHTML : function (s) { return s || ''; };

    appEl.innerHTML =
      '<section class="page profile-page">' +

        // Breadcrumb
        '<div class="breadcrumb-nav mb-3">' +
          '<a href="#/" class="text-decoration-none text-muted">Trang chủ</a>' +
          '<i class="bi bi-chevron-right breadcrumb-separator"></i>' +
          '<span class="breadcrumb-active">Hồ sơ cá nhân</span>' +
        '</div>' +

        '<div class="profile-layout">' +

          // ── CỘT TRÁI: Thông tin ──
          '<div class="profile-card profile-info-card">' +
            '<div class="profile-card-header">' +
              '<h2 class="profile-card-title"><i class="bi bi-person-circle me-2"></i>Hồ sơ cá nhân</h2>' +
              '<span class="profile-badge ' + (roleBadgeClass[user.role] || 'profile-role-attendee') + '">' +
                esc(roleDisplay[user.role] || user.role) +
              '</span>' +
            '</div>' +

            '<div class="profile-avatar-section">' +
              '<div class="profile-avatar-lg" style="background: ' + color + ';">' +
                esc(initials) +
              '</div>' +
              '<div class="profile-avatar-info">' +
                '<div class="profile-display-name" id="profile-display-name">' + esc(user.fullName) + '</div>' +
                '<div class="profile-display-email"><i class="bi bi-envelope me-1"></i>' + esc(user.email) + '</div>' +
              '</div>' +
            '</div>' +

            '<form id="profile-info-form" class="profile-form" novalidate>' +
              '<div class="stitch-form-group">' +
                '<label for="profile-fullname" class="stitch-label">Họ và tên</label>' +
                '<input type="text" id="profile-fullname" class="form-control stitch-input" ' +
                  'value="' + esc(user.fullName) + '" aria-label="Họ và tên" maxlength="100" />' +
                '<p id="profile-fullname-error" class="auth-field-error hidden"></p>' +
              '</div>' +

              '<div class="stitch-form-group">' +
                '<label for="profile-email" class="stitch-label">' +
                  'Email <i class="bi bi-lock-fill text-muted ms-1" title="Không thể thay đổi"></i>' +
                '</label>' +
                '<input type="email" id="profile-email" class="form-control stitch-input" ' +
                  'value="' + esc(user.email) + '" aria-label="Email" readonly disabled ' +
                  'style="background: var(--slate-50); cursor: not-allowed;" />' +
              '</div>' +

              '<div class="stitch-form-group">' +
                '<label for="profile-department" class="stitch-label">Phòng ban</label>' +
                '<select id="profile-department" class="form-select stitch-input" aria-label="Phòng ban">' +
                  '<option value="Quản trị"' + (user.department === 'Quản trị' ? ' selected' : '') + '>Quản trị</option>' +
                  '<option value="Kỹ thuật"' + (user.department === 'Kỹ thuật' ? ' selected' : '') + '>Kỹ thuật</option>' +
                  '<option value="Thiết kế"' + (user.department === 'Thiết kế' ? ' selected' : '') + '>Thiết kế</option>' +
                  '<option value="Kiểm thử"' + (user.department === 'Kiểm thử' ? ' selected' : '') + '>Kiểm thử</option>' +
                  '<option value="Quản trị / Manager"' + (user.department === 'Quản trị / Manager' ? ' selected' : '') + '>Quản trị / Manager</option>' +
                  '<option value="Chưa phân bổ"' + (user.department === 'Chưa phân bổ' ? ' selected' : '') + '>Chưa phân bổ</option>' +
                '</select>' +
              '</div>' +

              '<div class="stitch-form-group">' +
                '<span class="stitch-label">Vai trò trong hệ thống</span>' +
                '<div class="profile-role-display">' +
                  '<span class="profile-badge ' + (roleBadgeClass[user.role] || '') + '">' +
                    '<i class="bi bi-shield-check me-1"></i>' + esc(roleDisplay[user.role] || user.role) +
                  '</span>' +
                  '<span class="text-muted small">Vai trò được phân bổ bởi quản trị viên hệ thống</span>' +
                '</div>' +
              '</div>' +

              '<div class="profile-form-actions">' +
                '<button type="button" id="profile-cancel-btn" class="btn btn-outline-secondary stitch-btn-cancel">Hủy thay đổi</button>' +
                '<button type="submit" id="profile-save-btn" class="btn btn-primary stitch-btn-submit">' +
                  '<i class="bi bi-check-lg me-1"></i>Lưu thay đổi' +
                '</button>' +
              '</div>' +
            '</form>' +
          '</div>' +

          // ── CỘT PHẢI: Đổi mật khẩu ──
          '<div class="profile-card profile-password-card">' +
            '<div class="profile-card-header">' +
              '<h2 class="profile-card-title"><i class="bi bi-key me-2"></i>Đổi mật khẩu</h2>' +
            '</div>' +

            '<form id="profile-password-form" class="profile-form" novalidate>' +
              '<div class="stitch-form-group">' +
                '<label for="profile-current-pw" class="stitch-label">Mật khẩu hiện tại <span class="text-danger">*</span></label>' +
                '<div class="auth-password-wrapper">' +
                  '<input type="password" id="profile-current-pw" class="form-control stitch-input" ' +
                    'aria-label="Mật khẩu hiện tại" required />' +
                  '<button type="button" class="auth-pw-toggle" data-auth-toggle-pw="profile-current-pw" aria-label="Hiện mật khẩu">' +
                    '<i class="bi bi-eye"></i>' +
                  '</button>' +
                '</div>' +
                '<p id="profile-current-pw-error" class="auth-field-error hidden"></p>' +
              '</div>' +

              '<div class="stitch-form-group">' +
                '<label for="profile-new-pw" class="stitch-label">Mật khẩu mới <span class="text-danger">*</span></label>' +
                '<div class="auth-password-wrapper">' +
                  '<input type="password" id="profile-new-pw" class="form-control stitch-input" ' +
                    'aria-label="Mật khẩu mới" required />' +
                  '<button type="button" class="auth-pw-toggle" data-auth-toggle-pw="profile-new-pw" aria-label="Hiện mật khẩu">' +
                    '<i class="bi bi-eye"></i>' +
                  '</button>' +
                '</div>' +
                '<div id="profile-new-pw-strength" class="auth-password-strength"></div>' +
                '<p id="profile-new-pw-error" class="auth-field-error hidden"></p>' +
              '</div>' +

              '<div class="stitch-form-group">' +
                '<label for="profile-confirm-pw" class="stitch-label">Nhập lại mật khẩu mới <span class="text-danger">*</span></label>' +
                '<div class="auth-password-wrapper">' +
                  '<input type="password" id="profile-confirm-pw" class="form-control stitch-input" ' +
                    'aria-label="Nhập lại mật khẩu mới" required />' +
                  '<button type="button" class="auth-pw-toggle" data-auth-toggle-pw="profile-confirm-pw" aria-label="Hiện mật khẩu">' +
                    '<i class="bi bi-eye"></i>' +
                  '</button>' +
                '</div>' +
                '<p id="profile-confirm-pw-error" class="auth-field-error hidden"></p>' +
              '</div>' +

              '<div class="profile-form-actions">' +
                '<button type="submit" id="profile-pw-submit" class="btn btn-primary stitch-btn-submit">' +
                  '<i class="bi bi-shield-lock me-1"></i>Đổi mật khẩu' +
                '</button>' +
              '</div>' +
            '</form>' +

            // ── Thông tin bảo mật ──
            '<div class="profile-security-info">' +
              '<div class="profile-security-item">' +
                '<i class="bi bi-info-circle text-primary"></i>' +
                '<span>Mật khẩu tối thiểu 6 ký tự, nên có chữ hoa, số và ký tự đặc biệt.</span>' +
              '</div>' +
              '<div class="profile-security-item">' +
                '<i class="bi bi-shield-check text-success"></i>' +
                '<span>Phiên đăng nhập có hiệu lực ' + (typeof AUTH_CONFIG !== 'undefined' ? AUTH_CONFIG.TOKEN_EXPIRY_HOURS : 8) + ' giờ.</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</section>';

    // ── Bind events ──
    setupProfileEvents(user);
  }

  // =====================================================
  // 2. EVENTS
  // =====================================================

  function setupProfileEvents(originalUser) {
    var infoForm = document.getElementById('profile-info-form');
    var pwForm = document.getElementById('profile-password-form');
    var cancelBtn = document.getElementById('profile-cancel-btn');
    var _hasChanges = false;

    // Track changes
    if (infoForm) {
      infoForm.addEventListener('input', function () { _hasChanges = true; });
    }

    // Cancel
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var nameInput = document.getElementById('profile-fullname');
        var deptInput = document.getElementById('profile-department');
        if (nameInput) nameInput.value = originalUser.fullName;
        if (deptInput) deptInput.value = originalUser.department || '';
        _hasChanges = false;
        showToast('Đã khôi phục thông tin ban đầu.', 'info');
      });
    }

    // Save profile
    if (infoForm) {
      infoForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleSaveProfile();
      });
    }

    // Change password
    if (pwForm) {
      pwForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleChangePassword();
      });
    }

    // Password strength
    var newPw = document.getElementById('profile-new-pw');
    if (newPw) {
      newPw.addEventListener('input', function () {
        updateProfilePwStrength();
      });
    }

    // Password toggle buttons (for profile page)
    document.querySelectorAll('#app [data-auth-toggle-pw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inputId = btn.getAttribute('data-auth-toggle-pw');
        var input = document.getElementById(inputId);
        if (!input) return;
        var isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        var icon = btn.querySelector('i');
        if (icon) icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
      });
    });

    // Cảnh báo thay đổi chưa lưu
    window.addEventListener('hashchange', function onHashChange() {
      if (_hasChanges) {
        var confirmLeave = confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?');
        if (!confirmLeave) {
          window.location.hash = '#/profile';
          return;
        }
      }
      _hasChanges = false;
      window.removeEventListener('hashchange', onHashChange);
    });
  }

  // ── Save profile info ──
  function handleSaveProfile() {
    var nameInput = document.getElementById('profile-fullname');
    var deptInput = document.getElementById('profile-department');
    var saveBtn = document.getElementById('profile-save-btn');

    if (!nameInput) return;

    var fullName = nameInput.value.trim();
    var department = deptInput ? deptInput.value : '';

    // Validation
    clearProfileErrors();

    if (!fullName) {
      showProfileFieldError('profile-fullname', 'profile-fullname-error', 'Họ và tên không được để trống.');
      return;
    }

    setProfileLoading(saveBtn, true);

    AuthAPI.updateProfile({ fullName: fullName, department: department })
      .then(function (user) {
        AuthManager.setCurrentUser(user);
        updateHeaderUI();
        showToast('Cập nhật hồ sơ thành công!', 'success');

        // Cập nhật hiển thị trên trang
        var displayName = document.getElementById('profile-display-name');
        if (displayName) displayName.textContent = user.fullName;

        // Cập nhật avatar
        var avatarEl = document.querySelector('.profile-avatar-lg');
        if (avatarEl) {
          var initials = typeof getInitials === 'function' ? getInitials(user.fullName) : user.fullName.charAt(0);
          avatarEl.textContent = initials;
        }
      })
      .catch(function (err) {
        showToast(err.message || 'Cập nhật thất bại.', 'danger');
      })
      .finally(function () {
        setProfileLoading(saveBtn, false);
      });
  }

  // ── Change password ──
  function handleChangePassword() {
    var currentPw = document.getElementById('profile-current-pw');
    var newPw = document.getElementById('profile-new-pw');
    var confirmPw = document.getElementById('profile-confirm-pw');
    var submitBtn = document.getElementById('profile-pw-submit');

    if (!currentPw || !newPw || !confirmPw) return;

    clearProfileErrors();
    var valid = true;

    if (!currentPw.value) {
      showProfileFieldError('profile-current-pw', 'profile-current-pw-error', 'Vui lòng nhập mật khẩu hiện tại.');
      valid = false;
    }

    if (!newPw.value) {
      showProfileFieldError('profile-new-pw', 'profile-new-pw-error', 'Vui lòng nhập mật khẩu mới.');
      valid = false;
    } else if (newPw.value.length < 6) {
      showProfileFieldError('profile-new-pw', 'profile-new-pw-error', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      valid = false;
    }

    if (newPw.value !== confirmPw.value) {
      showProfileFieldError('profile-confirm-pw', 'profile-confirm-pw-error', 'Mật khẩu nhập lại không khớp.');
      valid = false;
    }

    if (newPw.value === currentPw.value && newPw.value) {
      showProfileFieldError('profile-new-pw', 'profile-new-pw-error', 'Mật khẩu mới phải khác mật khẩu hiện tại.');
      valid = false;
    }

    if (!valid) return;

    setProfileLoading(submitBtn, true);

    AuthAPI.changePassword({
      currentPassword: currentPw.value,
      newPassword: newPw.value
    })
      .then(function (result) {
        showToast(result.message || 'Đổi mật khẩu thành công!', 'success');
        // Reset form
        currentPw.value = '';
        newPw.value = '';
        confirmPw.value = '';
        var strengthBar = document.getElementById('profile-new-pw-strength');
        if (strengthBar) strengthBar.innerHTML = '';
      })
      .catch(function (err) {
        if (err.status === 401) {
          showProfileFieldError('profile-current-pw', 'profile-current-pw-error', err.message || 'Mật khẩu hiện tại không đúng.');
        } else {
          showToast(err.message || 'Đổi mật khẩu thất bại.', 'danger');
        }
      })
      .finally(function () {
        setProfileLoading(submitBtn, false);
      });
  }

  // ── Helpers ──
  function clearProfileErrors() {
    document.querySelectorAll('#app .is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
    document.querySelectorAll('#app .auth-field-error').forEach(function (el) { el.classList.add('hidden'); });
  }

  function showProfileFieldError(inputId, errorId, message) {
    var input = document.getElementById(inputId);
    var errorEl = document.getElementById(errorId);
    if (input) { input.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); }
    if (errorEl) { errorEl.textContent = message; errorEl.classList.remove('hidden'); }
  }

  function setProfileLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn._origHTML = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang lưu...';
    } else {
      btn.disabled = false;
      if (btn._origHTML) btn.innerHTML = btn._origHTML;
    }
  }

  function updateProfilePwStrength() {
    var input = document.getElementById('profile-new-pw');
    var bar = document.getElementById('profile-new-pw-strength');
    if (!input || !bar) return;

    var pw = input.value;
    var score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    score = Math.min(score, 4);

    var labels = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
    var classes = ['', 'auth-strength-weak', 'auth-strength-fair', 'auth-strength-good', 'auth-strength-strong'];

    bar.className = 'auth-password-strength';
    bar.innerHTML = '';
    for (var i = 1; i <= 4; i++) {
      var seg = document.createElement('div');
      seg.className = 'auth-strength-segment' + (i <= score ? ' ' + (classes[score] || '') : '');
      bar.appendChild(seg);
    }
    if (score > 0) {
      var label = document.createElement('span');
      label.className = 'auth-strength-label ' + (classes[score] || '');
      label.textContent = labels[score] || '';
      bar.appendChild(label);
    }
  }

  // =====================================================
  // 3. EXPORT
  // =====================================================

  window.renderProfile = renderProfile;

})();
