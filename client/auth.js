// =====================================================
// AUTH.JS — XÁC THỰC JWT & FETCH WRAPPER
// Sprint 3: Đăng nhập / Đăng ký / Token / Toast
// Nạp TRƯỚC main.js để bọc window.fetch
// =====================================================

(function () {
  'use strict';

  // =====================================================
  // 1. CẤU HÌNH (CONFIG)
  // =====================================================

  const AUTH_CONFIG = {
    // ── Cờ bật/tắt Mock (đổi thành false khi backend sẵn sàng) ──
    USE_MOCK: true,

    // ── API Base ──
    API_BASE: 'http://localhost:3000',

    // ── Endpoint giả định (chưa có trên backend) ──
    API_ROUTES: {
      LOGIN:           '/api/auth/login',
      REGISTER:        '/api/auth/register',
      ME:              '/api/auth/me',
      UPDATE_PROFILE:  '/api/auth/me',
      CHANGE_PASSWORD: '/api/auth/change-password'
    },

    // ── localStorage keys (tiền tố es_) ──
    STORAGE_KEYS: {
      TOKEN:        'es_access_token',
      CURRENT_USER: 'es_current_user'
    },

    // ── JWT ──
    TOKEN_EXPIRY_HOURS: 8,

    // ── Toast ──
    TOAST_DURATION: 4000
  };

  // =====================================================
  // 2. MOCK DATA (3 tài khoản mẫu)
  // =====================================================

  const MOCK_ACCOUNTS = [
    {
      userId: 1,
      fullName: 'Nguyễn Văn An',
      email: 'admin@enterprise.vn',
      password: 'Admin@123',
      role: 'Admin',
      department: 'Quản trị'
    },
    {
      userId: 2,
      fullName: 'Trần Thu Hà',
      email: 'manager@enterprise.vn',
      password: 'Manager@123',
      role: 'Manager',
      department: 'Quản trị / Manager'
    },
    {
      userId: 7,
      fullName: 'Hoàng Minh Khánh',
      email: 'employee@enterprise.vn',
      password: 'Employee@123',
      role: 'Employee',
      department: 'Kỹ thuật'
    }
  ];

  // =====================================================
  // 3. TIỆN ÍCH JWT
  // =====================================================

  function base64UrlEncode(str) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function createMockJWT(payload) {
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = base64UrlEncode(JSON.stringify(payload));
    const signature = base64UrlEncode('es-mock-signature-' + Date.now());
    return header + '.' + body + '.' + signature;
  }

  function decodeJWTPayload(token) {
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return null;
      var payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // Pad nếu cần
      while (payload.length % 4) payload += '=';
      return JSON.parse(decodeURIComponent(escape(atob(payload))));
    } catch (e) {
      return null;
    }
  }

  function isTokenExpired(token) {
    var payload = decodeJWTPayload(token);
    if (!payload || !payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }

  // =====================================================
  // 4. TOKEN & USER STORAGE
  // =====================================================

  var AuthManager = {
    getToken: function () {
      try {
        return localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
      } catch (e) { return null; }
    },

    setToken: function (token) {
      try {
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN, token);
      } catch (e) { /* quota exceeded */ }
    },

    removeToken: function () {
      try {
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
      } catch (e) { /* ignore */ }
    },

    getCurrentUser: function () {
      try {
        var raw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },

    setCurrentUser: function (user) {
      try {
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } catch (e) { /* ignore */ }
    },

    removeCurrentUser: function () {
      try {
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER);
      } catch (e) { /* ignore */ }
    },

    isLoggedIn: function () {
      var token = this.getToken();
      if (!token) return false;
      if (isTokenExpired(token)) {
        this.removeToken();
        this.removeCurrentUser();
        return false;
      }
      return true;
    },

    // ── Xử lý 401 ──
    _handling401: false,
    handleUnauthorized: function () {
      if (this._handling401) return;
      this._handling401 = true;
      this.removeToken();
      this.removeCurrentUser();
      updateHeaderUI();
      if (typeof window.__esApplyRoleUI === 'function') window.__esApplyRoleUI();
      showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'warning');
      setTimeout(function () {
        openAuthModal();
        AuthManager._handling401 = false;
      }, 300);
    },

    // ── Xử lý 403 ──
    handleForbidden: function () {
      showToast('Bạn không có quyền thực hiện thao tác này.', 'danger');
    }
  };

  // =====================================================
  // 5. BỌC WINDOW.FETCH (Monkey-patch — ÍT XÂM LẤN)
  // =====================================================
  // Chỉ thêm Authorization header cho URL bắt đầu bằng API_BASE.
  // Giữ nguyên mọi tham số gốc (signal, headers, body…).

  var _originalFetch = window.fetch;

  window.fetch = function (input, init) {
    var url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      url = String(input);
    }

    var isApiCall = url.indexOf(AUTH_CONFIG.API_BASE) === 0;

    // Bỏ qua endpoint login/register khi xử lý 401 tự động
    var isAuthEndpoint = url.indexOf(AUTH_CONFIG.API_ROUTES.LOGIN) !== -1 ||
                         url.indexOf(AUTH_CONFIG.API_ROUTES.REGISTER) !== -1;

    if (isApiCall) {
      var token = AuthManager.getToken();
      if (token) {
        init = init ? Object.assign({}, init) : {};
        var existingHeaders = init.headers;

        if (existingHeaders instanceof Headers) {
          if (!existingHeaders.has('Authorization')) {
            existingHeaders.set('Authorization', 'Bearer ' + token);
          }
          init.headers = existingHeaders;
        } else if (existingHeaders && typeof existingHeaders === 'object') {
          if (!existingHeaders['Authorization']) {
            init.headers = Object.assign({}, existingHeaders, {
              'Authorization': 'Bearer ' + token
            });
          }
        } else {
          init.headers = { 'Authorization': 'Bearer ' + token };
        }
      }
    }

    return _originalFetch.call(window, input, init).then(function (response) {
      if (isApiCall && !isAuthEndpoint) {
        if (response.status === 401) {
          AuthManager.handleUnauthorized();
        } else if (response.status === 403) {
          AuthManager.handleForbidden();
        }
      }
      return response;
    });
  };

  // =====================================================
  // 6. MOCK AUTH SERVICE
  // =====================================================

  var MockAuthService = {
    login: function (email, password) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          var account = MOCK_ACCOUNTS.find(function (a) {
            return a.email.toLowerCase() === email.toLowerCase() && a.password === password;
          });
          if (!account) {
            reject({ status: 401, message: 'Email hoặc mật khẩu không chính xác.' });
            return;
          }
          var now = Math.floor(Date.now() / 1000);
          var payload = {
            userId: account.userId,
            role: account.role,
            iat: now,
            exp: now + AUTH_CONFIG.TOKEN_EXPIRY_HOURS * 3600
          };
          var token = createMockJWT(payload);
          var user = {
            userId: account.userId,
            fullName: account.fullName,
            email: account.email,
            role: account.role,
            department: account.department
          };
          resolve({ token: token, user: user });
        }, 600);
      });
    },

    register: function (data) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          var exists = MOCK_ACCOUNTS.find(function (a) {
            return a.email.toLowerCase() === data.email.toLowerCase();
          });
          if (exists) {
            reject({ status: 409, message: 'Email này đã được đăng ký trong hệ thống.' });
            return;
          }
          var newId = 100 + Math.floor(Math.random() * 900);
          var now = Math.floor(Date.now() / 1000);
          var payload = {
            userId: newId,
            role: 'Employee',
            iat: now,
            exp: now + AUTH_CONFIG.TOKEN_EXPIRY_HOURS * 3600
          };
          var token = createMockJWT(payload);
          var user = {
            userId: newId,
            fullName: data.fullName,
            email: data.email,
            role: 'Employee',
            department: data.department || 'Chưa phân bổ'
          };
          resolve({ token: token, user: user });
        }, 800);
      });
    },

    getMe: function () {
      var user = AuthManager.getCurrentUser();
      return Promise.resolve(user);
    },

    updateProfile: function (data) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          var user = AuthManager.getCurrentUser();
          if (user) {
            user.fullName = data.fullName || user.fullName;
            user.department = data.department || user.department;
            AuthManager.setCurrentUser(user);
          }
          resolve(user);
        }, 500);
      });
    },

    changePassword: function (data) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          var user = AuthManager.getCurrentUser();
          if (!user) { reject({ message: 'Không tìm thấy người dùng.' }); return; }
          var account = MOCK_ACCOUNTS.find(function (a) { return a.userId === user.userId; });
          if (account && account.password !== data.currentPassword) {
            reject({ status: 401, message: 'Mật khẩu hiện tại không đúng.' });
            return;
          }
          if (account) account.password = data.newPassword;
          resolve({ message: 'Đổi mật khẩu thành công.' });
        }, 500);
      });
    }
  };

  // =====================================================
  // 7. AUTH API (switch mock / real)
  // =====================================================

  var AuthAPI = {
    login: function (email, password) {
      if (AUTH_CONFIG.USE_MOCK) return MockAuthService.login(email, password);

      return _originalFetch(AUTH_CONFIG.API_BASE + AUTH_CONFIG.API_ROUTES.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      }).then(function (res) {
        if (!res.ok) return res.json().then(function (err) { return Promise.reject(err); });
        return res.json();
      });
    },

    register: function (data) {
      if (AUTH_CONFIG.USE_MOCK) return MockAuthService.register(data);

      return _originalFetch(AUTH_CONFIG.API_BASE + AUTH_CONFIG.API_ROUTES.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) return res.json().then(function (err) { return Promise.reject(err); });
        return res.json();
      });
    },

    getMe: function () {
      if (AUTH_CONFIG.USE_MOCK) return MockAuthService.getMe();

      return fetch(AUTH_CONFIG.API_BASE + AUTH_CONFIG.API_ROUTES.ME)
        .then(function (res) {
          if (!res.ok) return Promise.reject({ message: 'Unauthorized' });
          return res.json();
        });
    },

    updateProfile: function (data) {
      if (AUTH_CONFIG.USE_MOCK) return MockAuthService.updateProfile(data);

      return fetch(AUTH_CONFIG.API_BASE + AUTH_CONFIG.API_ROUTES.UPDATE_PROFILE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) return res.json().then(function (err) { return Promise.reject(err); });
        return res.json();
      });
    },

    changePassword: function (data) {
      if (AUTH_CONFIG.USE_MOCK) return MockAuthService.changePassword(data);

      return fetch(AUTH_CONFIG.API_BASE + AUTH_CONFIG.API_ROUTES.CHANGE_PASSWORD, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) return res.json().then(function (err) { return Promise.reject(err); });
        return res.json();
      });
    }
  };

  // =====================================================
  // 8. TOAST SYSTEM
  // =====================================================

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || AUTH_CONFIG.TOAST_DURATION;

    var container = document.getElementById('auth-toast-container');
    if (!container) return;

    var iconMap = {
      success: 'bi-check-circle-fill',
      danger:  'bi-exclamation-triangle-fill',
      warning: 'bi-exclamation-circle-fill',
      info:    'bi-info-circle-fill'
    };

    var toast = document.createElement('div');
    toast.className = 'auth-toast auth-toast-' + type;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML =
      '<i class="bi ' + (iconMap[type] || iconMap.info) + ' auth-toast-icon"></i>' +
      '<span class="auth-toast-message">' + _escapeHTMLSafe(message) + '</span>' +
      '<button type="button" class="auth-toast-close" aria-label="Đóng thông báo">' +
        '<i class="bi bi-x-lg"></i>' +
      '</button>';

    var closeBtn = toast.querySelector('.auth-toast-close');
    closeBtn.addEventListener('click', function () { removeToast(toast); });

    container.appendChild(toast);
    // Force reflow for animation
    toast.offsetHeight;
    toast.classList.add('auth-toast-show');

    setTimeout(function () { removeToast(toast); }, duration);
  }

  function removeToast(toast) {
    if (!toast || toast._removing) return;
    toast._removing = true;
    toast.classList.remove('auth-toast-show');
    toast.classList.add('auth-toast-hide');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  // Safe HTML escape (dùng trước khi main.js load escapeHTML)
  function _escapeHTMLSafe(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // =====================================================
  // 9. HEADER UI UPDATE
  // =====================================================

  function getInitialsFromName(name) {
    if (!name) return 'U';
    var parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  var ROLE_DISPLAY_MAP = {
    'Admin':     'Quản trị viên (Admin)',
    'Manager':   'Quản lý (Manager)',
    'Secretary': 'Thư ký (Secretary)',
    'Employee':  'Nhân viên (Employee)'
  };

  function updateHeaderUI() {
    var user = AuthManager.getCurrentUser();
    var isLoggedIn = AuthManager.isLoggedIn();

    var badge = document.querySelector('.user-profile-badge');
    var loginBtn = document.getElementById('auth-login-trigger');
    var dropdown = document.getElementById('auth-user-dropdown');
    var avatarEl = document.querySelector('.user-avatar-sm');
    var nameEl = document.querySelector('.user-name');
    var roleEl = document.querySelector('.user-role');
    var headerRight = document.querySelector('.header-right');

    if (headerRight) {
      headerRight.classList.remove('d-none');
      headerRight.classList.add('d-md-flex');
    }

    if (isLoggedIn && user) {
      // Hiện badge, ẩn nút đăng nhập
      if (badge) badge.classList.remove('hidden');
      if (loginBtn) loginBtn.classList.add('hidden');

      // Cập nhật thông tin
      if (avatarEl) avatarEl.textContent = getInitialsFromName(user.fullName);
      if (nameEl) nameEl.textContent = user.fullName;
      if (roleEl) roleEl.textContent = ROLE_DISPLAY_MAP[user.role] || user.role;

      // Gắn data-role lên body
      document.body.setAttribute('data-role', user.role);
    } else {
      // Ẩn badge, hiện nút đăng nhập
      if (badge) badge.classList.add('hidden');
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (dropdown) dropdown.classList.add('hidden');

      // Xóa data-role
      document.body.removeAttribute('data-role');
    }
  }

  // =====================================================
  // 10. AUTH MODAL LOGIC
  // =====================================================

  var _savedRouteBeforeAuth = null;

  function openAuthModal(returnToRoute) {
    var overlay = document.getElementById('auth-overlay');
    if (!overlay) return;

    if (returnToRoute) _savedRouteBeforeAuth = returnToRoute;

    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Reset form
    switchAuthTab('login');

    // Focus trap setup
    setTimeout(function () {
      var firstInput = overlay.querySelector('#auth-login-email');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  function closeAuthModal() {
    var overlay = document.getElementById('auth-overlay');
    if (!overlay) return;

    overlay.classList.add('hidden');
    document.body.style.overflow = '';

    // Quay lại route trước đó
    if (_savedRouteBeforeAuth && AuthManager.isLoggedIn()) {
      window.location.hash = '#' + _savedRouteBeforeAuth;
      _savedRouteBeforeAuth = null;
    }
  }

  function switchAuthTab(tab) {
    var loginTab = document.getElementById('auth-tab-login');
    var registerTab = document.getElementById('auth-tab-register');
    var loginForm = document.getElementById('auth-login-form');
    var registerForm = document.getElementById('auth-register-form');

    if (!loginTab || !registerTab || !loginForm || !registerForm) return;

    if (tab === 'login') {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      loginTab.setAttribute('aria-selected', 'true');
      registerTab.setAttribute('aria-selected', 'false');
    } else {
      loginTab.classList.remove('active');
      registerTab.classList.add('active');
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      loginTab.setAttribute('aria-selected', 'false');
      registerTab.setAttribute('aria-selected', 'true');
    }

    // Reset errors
    clearAuthErrors();
  }

  function clearAuthErrors() {
    document.querySelectorAll('#auth-overlay .is-invalid').forEach(function (el) {
      el.classList.remove('is-invalid');
    });
    document.querySelectorAll('#auth-overlay .auth-field-error').forEach(function (el) {
      el.classList.add('hidden');
    });
    var serverErr = document.getElementById('auth-server-error');
    if (serverErr) serverErr.classList.add('hidden');
  }

  function showFieldError(inputId, errorId, message) {
    var input = document.getElementById(inputId);
    var errorEl = document.getElementById(errorId);
    if (input) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      if (errorId) input.setAttribute('aria-describedby', errorId);
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  function showServerError(message) {
    var el = document.getElementById('auth-server-error');
    var msgEl = document.getElementById('auth-server-error-msg');
    if (el) el.classList.remove('hidden');
    if (msgEl) msgEl.textContent = message;
  }

  // ── Đăng nhập ──
  function handleLogin(e) {
    if (e) e.preventDefault();
    clearAuthErrors();

    var emailInput = document.getElementById('auth-login-email');
    var pwInput = document.getElementById('auth-login-password');
    var submitBtn = document.getElementById('auth-login-submit');

    if (!emailInput || !pwInput) return;

    var email = emailInput.value.trim();
    var password = pwInput.value;
    var valid = true;

    if (!email) {
      showFieldError('auth-login-email', 'auth-login-email-error', 'Vui lòng nhập email.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError('auth-login-email', 'auth-login-email-error', 'Định dạng email không hợp lệ.');
      valid = false;
    }

    if (!password) {
      showFieldError('auth-login-password', 'auth-login-password-error', 'Vui lòng nhập mật khẩu.');
      valid = false;
    }

    if (!valid) return;

    // Loading
    setAuthLoading(submitBtn, true);

    AuthAPI.login(email, password)
      .then(function (result) {
        AuthManager.setToken(result.token);
        AuthManager.setCurrentUser(result.user);
        updateHeaderUI();
        closeAuthModal();
        showToast('Đăng nhập thành công! Chào mừng ' + _escapeHTMLSafe(result.user.fullName), 'success');

        // Cập nhật organizer mặc định
        setDefaultOrganizer(result.user);

        // Re-run router để áp dụng RBAC
        if (typeof router === 'function') router();
      })
      .catch(function (err) {
        showServerError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      })
      .finally(function () {
        setAuthLoading(submitBtn, false);
      });
  }

  // ── Đăng ký ──
  function handleRegister(e) {
    if (e) e.preventDefault();
    clearAuthErrors();

    var nameInput = document.getElementById('auth-register-name');
    var emailInput = document.getElementById('auth-register-email');
    var deptInput = document.getElementById('auth-register-department');
    var pwInput = document.getElementById('auth-register-password');
    var pw2Input = document.getElementById('auth-register-password2');
    var submitBtn = document.getElementById('auth-register-submit');

    if (!nameInput || !emailInput || !pwInput || !pw2Input) return;

    var fullName = nameInput.value.trim();
    var email = emailInput.value.trim();
    var department = deptInput ? deptInput.value : '';
    var password = pwInput.value;
    var password2 = pw2Input.value;
    var valid = true;

    if (!fullName) {
      showFieldError('auth-register-name', 'auth-register-name-error', 'Vui lòng nhập họ và tên.');
      valid = false;
    }

    if (!email) {
      showFieldError('auth-register-email', 'auth-register-email-error', 'Vui lòng nhập email.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError('auth-register-email', 'auth-register-email-error', 'Định dạng email không hợp lệ.');
      valid = false;
    }

    if (!password) {
      showFieldError('auth-register-password', 'auth-register-password-error', 'Vui lòng nhập mật khẩu.');
      valid = false;
    } else if (password.length < 6) {
      showFieldError('auth-register-password', 'auth-register-password-error', 'Mật khẩu phải có ít nhất 6 ký tự.');
      valid = false;
    }

    if (password !== password2) {
      showFieldError('auth-register-password2', 'auth-register-password2-error', 'Mật khẩu nhập lại không khớp.');
      valid = false;
    }

    if (!valid) return;

    setAuthLoading(submitBtn, true);

    AuthAPI.register({ fullName: fullName, email: email, password: password, department: department })
      .then(function (result) {
        AuthManager.setToken(result.token);
        AuthManager.setCurrentUser(result.user);
        updateHeaderUI();
        closeAuthModal();
        showToast('Đăng ký thành công! Chào mừng ' + _escapeHTMLSafe(result.user.fullName), 'success');
        setDefaultOrganizer(result.user);
        if (typeof router === 'function') router();
      })
      .catch(function (err) {
        showServerError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      })
      .finally(function () {
        setAuthLoading(submitBtn, false);
      });
  }

  function setAuthLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.setAttribute('data-original-text', btn.innerHTML);
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang xử lý...';
    } else {
      btn.disabled = false;
      var orig = btn.getAttribute('data-original-text');
      if (orig) btn.innerHTML = orig;
    }
  }

  // ── Password strength indicator ──
  function calcPasswordStrength(pw) {
    if (!pw) return 0;
    var score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 4);
  }

  function updatePasswordStrength(inputId, barId) {
    var input = document.getElementById(inputId);
    var bar = document.getElementById(barId);
    if (!input || !bar) return;

    var strength = calcPasswordStrength(input.value);
    var labels = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
    var classes = ['', 'auth-strength-weak', 'auth-strength-fair', 'auth-strength-good', 'auth-strength-strong'];

    bar.className = 'auth-password-strength';
    bar.innerHTML = '';
    for (var i = 1; i <= 4; i++) {
      var seg = document.createElement('div');
      seg.className = 'auth-strength-segment' + (i <= strength ? ' ' + (classes[strength] || '') : '');
      bar.appendChild(seg);
    }
    if (strength > 0) {
      var label = document.createElement('span');
      label.className = 'auth-strength-label ' + (classes[strength] || '');
      label.textContent = labels[strength] || '';
      bar.appendChild(label);
    }
  }

  // ── Toggle password visibility ──
  function togglePasswordVisibility(inputId, btnEl) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    var icon = btnEl.querySelector('i');
    if (icon) {
      icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
    }
    btnEl.setAttribute('aria-label', isPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
  }

  // ── Set default organizer sau đăng nhập ──
  function setDefaultOrganizer(user) {
    if (!user) return;

    var orgIdInput = document.getElementById('meeting-organizer-id');
    if (orgIdInput) {
      orgIdInput.value = String(user.userId);
      orgIdInput.defaultValue = String(user.userId);
    }

    var orgSelect = document.getElementById('meeting-organizer');
    if (orgSelect) {
      // Chỉ set nếu user có trong danh sách options
      var optionExists = Array.from(orgSelect.options).some(function (opt) {
        return opt.value === String(user.userId);
      });
      if (optionExists) {
        orgSelect.value = String(user.userId);
      }
    }
  }

  // ── Đăng xuất ──
  function handleLogout() {
    AuthManager.removeToken();
    AuthManager.removeCurrentUser();
    updateHeaderUI();
    showToast('Đã đăng xuất. Hẹn gặp lại!', 'info');

    // Đóng dropdown
    var dropdown = document.getElementById('auth-user-dropdown');
    if (dropdown) dropdown.classList.add('hidden');

    // Reset organizer về 1
    var orgIdInput = document.getElementById('meeting-organizer-id');
    if (orgIdInput) { orgIdInput.value = '1'; orgIdInput.defaultValue = '1'; }

    // Xóa data-role
    document.body.removeAttribute('data-role');

    // Redirect home
    window.location.hash = '#/';
    if (typeof router === 'function') router();
  }

  // =====================================================
  // 11. ĐỒNG BỘ NHIỀU TAB (Storage Event)
  // =====================================================

  window.addEventListener('storage', function (e) {
    if (e.key === AUTH_CONFIG.STORAGE_KEYS.TOKEN) {
      if (!e.newValue) {
        // Token bị xóa ở tab khác → đăng xuất tab này
        updateHeaderUI();
        document.body.removeAttribute('data-role');
        if (typeof router === 'function') router();
        showToast('Bạn đã đăng xuất từ một tab khác.', 'warning');
      } else if (e.newValue && !e.oldValue) {
        // Đăng nhập ở tab khác
        updateHeaderUI();
        if (typeof router === 'function') router();
      }
    }
  });

  // =====================================================
  // 12. FOCUS TRAP CHO MODAL
  // =====================================================

  function setupAuthModalFocusTrap() {
    var overlay = document.getElementById('auth-overlay');
    if (!overlay) return;

    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAuthModal();
        return;
      }

      if (e.key !== 'Tab') return;

      var focusable = overlay.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Click outside modal → đóng
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeAuthModal();
      }
    });
  }

  // =====================================================
  // 13. USER DROPDOWN
  // =====================================================

  function setupUserDropdown() {
    var badge = document.querySelector('.user-profile-badge');
    var dropdown = document.getElementById('auth-user-dropdown');
    if (!badge || !dropdown) return;

    badge.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!AuthManager.isLoggedIn()) return;
      dropdown.classList.toggle('hidden');
    });

    badge.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && AuthManager.isLoggedIn()) {
        e.preventDefault();
        dropdown.classList.toggle('hidden');
      }
    });

    // Click outside → close dropdown
    document.addEventListener('click', function (e) {
      if (!dropdown.classList.contains('hidden') && !badge.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });

    // Profile link
    var profileLink = document.getElementById('auth-menu-profile');
    if (profileLink) {
      profileLink.addEventListener('click', function (e) {
        e.preventDefault();
        dropdown.classList.add('hidden');
        window.location.hash = '#/profile';
      });
    }

    // Logout
    var logoutLink = document.getElementById('auth-menu-logout');
    if (logoutLink) {
      logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        handleLogout();
      });
    }
  }

  // =====================================================
  // 14. INIT KHI DOM READY
  // =====================================================

  function initAuth() {
    // Setup header
    updateHeaderUI();

    // Login button trigger
    var loginBtn = document.getElementById('auth-login-trigger');
    if (loginBtn) {
      loginBtn.addEventListener('click', function () {
        openAuthModal();
      });
    }

    // Setup modal
    setupAuthModalFocusTrap();

    // Tab switching
    var tabLogin = document.getElementById('auth-tab-login');
    var tabRegister = document.getElementById('auth-tab-register');
    if (tabLogin) tabLogin.addEventListener('click', function () { switchAuthTab('login'); });
    if (tabRegister) tabRegister.addEventListener('click', function () { switchAuthTab('register'); });

    // Login form submit
    var loginForm = document.getElementById('auth-login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Register form submit
    var registerForm = document.getElementById('auth-register-form');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // Password visibility toggles
    document.querySelectorAll('[data-auth-toggle-pw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        togglePasswordVisibility(btn.getAttribute('data-auth-toggle-pw'), btn);
      });
    });

    // Password strength
    var regPw = document.getElementById('auth-register-password');
    if (regPw) {
      regPw.addEventListener('input', function () {
        updatePasswordStrength('auth-register-password', 'auth-register-strength');
      });
    }

    // Close modal button
    var closeBtn = document.getElementById('auth-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeAuthModal();
      });
    }

    // User dropdown
    setupUserDropdown();
  }

  // Chạy initAuth khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

  // =====================================================
  // 15. EXPORT RA WINDOW (cho các module khác dùng)
  // =====================================================

  window.AuthManager = AuthManager;
  window.AuthAPI = AuthAPI;
  window.AUTH_CONFIG = AUTH_CONFIG;
  window.showToast = showToast;
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.updateHeaderUI = updateHeaderUI;
  window.setDefaultOrganizer = setDefaultOrganizer;
  window.handleLogout = handleLogout;
  window.decodeJWTPayload = decodeJWTPayload;

})();
