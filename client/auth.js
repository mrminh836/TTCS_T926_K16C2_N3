/**
 * ==============================================================================
 * MODULE XÁC THỰC NGƯỜI DÙNG & TÍCH HỢP JWT AUTHENTICATION (CLIENT AUTH)
 * Dự án: Meeting Management System – ICTU (Enterprise Sync)
 * Thiết kế chuẩn Stitch Enterprise UI/UX
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  // --- CẤU HÌNH & KHÓA LƯU TRỮ ---
  const STORAGE_TOKEN_KEY = 'accessToken';
  const STORAGE_USER_KEY = 'currentUser';

  const API_BASE = (window.location.origin && window.location.origin.includes(':3000'))
    ? window.location.origin
    : 'http://localhost:3000';

  // ============================================================================
  // 1. QUẢN LÝ TRẠNG THÁI XÁC THỰC (AUTH STATE)
  // ============================================================================
  const listeners = [];

  const AuthState = {
    getToken() {
      try {
        return localStorage.getItem(STORAGE_TOKEN_KEY) || null;
      } catch {
        return null;
      }
    },

    getUser() {
      try {
        const raw = localStorage.getItem(STORAGE_USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    isAuthenticated() {
      return Boolean(this.getToken());
    },

    isAdmin() {
      const user = this.getUser();
      return Boolean(user && user.role && user.role.toLowerCase() === 'admin');
    },

    setSession(token, user) {
      try {
        if (token) localStorage.setItem(STORAGE_TOKEN_KEY, token);
        if (user) {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (err) {
        console.warn('[AuthState] Không thể ghi vào localStorage:', err);
      }
      // Dọn sạch mảng meetings cũ trong bộ nhớ để tránh lưu vết dữ liệu của tài khoản trước
      try {
        if (typeof window !== 'undefined') {
          window.meetings = [];
          if (typeof meetings !== 'undefined') meetings = [];
          const uid = user ? Number(user.userId || user.id || 1) : 1;
          if (typeof window.syncMeetingOrganizerOptions === 'function') {
            window.syncMeetingOrganizerOptions(uid);
          }
          if (typeof window.initParticipantSelector === 'function') {
            window.initParticipantSelector([uid], uid);
          }
          // Tự động đồng bộ lại lịch họp tương ứng với tài khoản vừa đăng nhập
          if (typeof window.MeetingAPI !== 'undefined' && typeof window.MeetingAPI.getAll === 'function') {
            window.MeetingAPI.getAll().then(() => {
              if (window.location.hash.startsWith('#/calendar') && typeof window.renderCalendarPage === 'function') {
                window.renderCalendarPage();
              } else if (window.location.hash.startsWith('#/meetings') && typeof window.renderMeetingsPage === 'function') {
                window.renderMeetingsPage();
              }
            });
          }
        }
      } catch (e) {}

      this.notify('login', user);
      updateHeaderAuthUI();
    },

    clearSession(reason = 'manual') {
      try {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        localStorage.removeItem('user');
      } catch (err) {
        console.warn('[AuthState] Lỗi khi xóa localStorage:', err);
      }
      // Dọn sạch mảng meetings cũ trong bộ nhớ khi đăng xuất
      try {
        if (typeof window !== 'undefined') {
          window.meetings = [];
          if (typeof meetings !== 'undefined') meetings = [];
          if (typeof window.syncMeetingOrganizerOptions === 'function') {
            window.syncMeetingOrganizerOptions(1);
          }
          if (typeof window.initParticipantSelector === 'function') {
            window.initParticipantSelector([1], 1);
          }
          if (window.location.hash.startsWith('#/calendar') && typeof window.renderCalendarPage === 'function') {
            window.renderCalendarPage();
          } else if (window.location.hash.startsWith('#/meetings') && typeof window.renderMeetingsPage === 'function') {
            window.renderMeetingsPage();
          }
        }
      } catch (e) {}

      this.notify('logout', { reason });
      updateHeaderAuthUI();
    },

    on(event, callback) {
      if (typeof callback === 'function') {
        listeners.push({ event, callback });
      }
    },

    notify(event, data) {
      listeners.forEach(item => {
        if (item.event === event || item.event === '*') {
          try {
            item.callback(data);
          } catch (e) {
            console.error('[AuthState Listener Error]:', e);
          }
        }
      });
    },

    /**
     * Route Guard: Yêu cầu bắt buộc phải đăng nhập
     */
    requireAuth(redirectTo = 'login.html') {
      if (!this.isAuthenticated()) {
        window.location.replace(redirectTo);
        return false;
      }
      return true;
    },

    /**
     * Route Guard: Yêu cầu quyền Quản trị viên (Admin)
     */
    requireAdmin(userRedirect = 'user.html', unauthRedirect = 'login.html') {
      if (!this.isAuthenticated()) {
        window.location.replace(unauthRedirect);
        return false;
      }
      if (!this.isAdmin()) {
        alert('Tài khoản của bạn không có quyền Quản trị (Admin). Đang chuyển hướng về cổng Người dùng.');
        window.location.replace(userRedirect);
        return false;
      }
      return true;
    },

    /**
     * Dùng cho trang login.html: Nếu đã đăng nhập, tự động chuyển sang trang tương ứng
     */
    redirectIfAuthenticated() {
      if (this.isAuthenticated()) {
        this.redirectAfterLogin();
        return true;
      }
      return false;
    },

    /**
     * Điều hướng người dùng sau khi đăng nhập thành công dựa vào quyền (Role)
     */
    redirectAfterLogin() {
      if (this.isAdmin()) {
        window.location.href = 'index.html#/admin';
      } else {
        window.location.href = 'index.html#/';
      }
    },

    /**
     * Đăng xuất người dùng và chuyển hướng
     */
    logout(redirectTo = 'login.html') {
      this.clearSession('manual');
      window.location.href = redirectTo;
    },

    async init() {
      updateHeaderAuthUI();

      // Nếu có token đã lưu, gọi API /api/auth/me để kiểm tra tính hợp lệ của phiên
      const token = this.getToken();
      if (!token) return;

      try {
        const meRes = await AuthAPI.getMe();
        if (meRes.ok && meRes.user) {
          // Cập nhật thông tin mới nhất từ máy chủ
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(meRes.user));
          updateHeaderAuthUI();
        } else if (meRes.status === 401) {
          // Token đã hết hạn trên server
          console.info('[AuthState] Token đã hết hạn hoặc không hợp lệ, đăng xuất an toàn.');
          this.clearSession('expired');
        }
      } catch {
        // Lỗi mạng hoặc backend offline: giữ session offline tạm thời
      }
    }
  };

  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;

  /**
   * Wrapper gọi API tự động đính kèm Authorization: Bearer <token>
   * Tự động điều hướng và làm mới giao diện khi nhận HTTP 401 Unauthorized
   */
  async function apiFetch(endpoint, options = {}) {
    const opts = { ...options };
    const headers = { ...(opts.headers || {}) };

    // Tự động thêm header Content-Type nếu gửi JSON body dạng string
    if (opts.body && typeof opts.body === 'string' && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Tự động đính kèm JWT Bearer Token nếu có
    const token = AuthState.getToken();
    if (token && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    opts.headers = headers;

    // Chuẩn hóa URL đầy đủ
    let url = endpoint;
    if (typeof url === 'string' && url.startsWith('/')) {
      url = `${API_BASE}${url}`;
    }

    try {
      const response = await (nativeFetch || window.fetch)(url, opts);

      // Xử lý chặn mã 401 Unauthorized (tránh lặp vô hạn đối với API đăng nhập / đăng ký)
      const urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : '');
      const isLoginOrRegisterEndpoint = urlStr.includes('/api/auth/login') || urlStr.includes('/api/auth/register');
      if (response.status === 401 && !isLoginOrRegisterEndpoint) {
        console.warn('[apiFetch] Nhận mã 401 Unauthorized từ endpoint bảo vệ:', urlStr);
        if (AuthState.isAuthenticated()) {
          AuthState.clearSession('expired');
          showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'warning');
          AuthModal.open('login');
        }
      }

      return response;
    } catch (networkError) {
      throw networkError;
    }
  }

  // Intercept window.fetch toàn cục
  if (nativeFetch) {
    window.nativeFetch = nativeFetch;
    window.fetch = apiFetch;
  }

  // ============================================================================
  // 3. API SERVICE GỌI BACKEND (AUTH API)
  // ============================================================================
  const AuthAPI = {
    async register({ username, email, password, fullName }) {
      try {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username, email, password, fullName })
        });
        const data = await res.json().catch(() => ({}));
        return {
          ok: res.ok,
          status: res.status,
          data
        };
      } catch (err) {
        return {
          ok: false,
          status: 0,
          data: { success: false, message: 'Không thể kết nối máy chủ backend. Vui lòng kiểm tra mạng.' }
        };
      }
    },

    async login({ username, password }) {
      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });
        const data = await res.json().catch(() => ({}));
        return {
          ok: res.ok,
          status: res.status,
          data
        };
      } catch (err) {
        return {
          ok: false,
          status: 0,
          data: { success: false, message: 'Không thể kết nối máy chủ backend. Vui lòng kiểm tra mạng.' }
        };
      }
    },

    async getMe() {
      try {
        const res = await apiFetch('/api/auth/me', { method: 'GET' });
        const data = await res.json().catch(() => ({}));
        return {
          ok: res.ok,
          status: res.status,
          user: data.user || null
        };
      } catch {
        return { ok: false, status: 0, user: null };
      }
    },

    async changePassword({ currentPassword, newPassword, confirmPassword }) {
      try {
        const res = await apiFetch('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
        });
        const data = await res.json().catch(() => ({}));
        return {
          ok: res.ok,
          status: res.status,
          data
        };
      } catch (err) {
        return {
          ok: false,
          status: 0,
          data: { success: false, message: 'Không thể kết nối máy chủ backend. Vui lòng kiểm tra mạng.' }
        };
      }
    }
  };

  // ============================================================================
  // 4. TOAST NOTIFICATION TIỆN ÍCH (ENTERPRISE TOAST)
  // ============================================================================
  function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('stitch-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'stitch-toast-container';
      container.className = 'stitch-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `stitch-toast stitch-toast-${type}`;

    let iconClass = 'bi-info-circle-fill text-primary';
    if (type === 'success') iconClass = 'bi-check-circle-fill text-success';
    if (type === 'error') iconClass = 'bi-x-circle-fill text-danger';
    if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill text-warning';

    toast.innerHTML = `
      <div class="toast-content d-flex align-items-center gap-2">
        <i class="bi ${iconClass} fs-5"></i>
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button type="button" class="toast-close-btn" aria-label="Đóng thông báo">
        <i class="bi bi-x"></i>
      </button>
    `;

    const closeBtn = toast.querySelector('.toast-close-btn');
    const dismiss = () => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    };

    closeBtn.addEventListener('click', dismiss);
    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
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

  // ============================================================================
  // 5. ĐIỀU KHIỂN GIAO DIỆN HEADER (HEADER AUTH UI)
  // ============================================================================
  function updateHeaderAuthUI() {
    const unloggedSec = document.getElementById('auth-unlogged-section');
    const loggedSec = document.getElementById('auth-logged-section');
    const avatarEl = document.getElementById('header-user-avatar');
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const sidebarAvatarEl = document.getElementById('sidebar-user-avatar');
    const sidebarNameEl = document.getElementById('sidebar-user-name');
    const sidebarRoleEl = document.getElementById('sidebar-user-role');
    const dropdownNameEl = document.getElementById('dropdown-full-name');
    const dropdownEmailEl = document.getElementById('dropdown-email');
    const adminSectionTitle = document.getElementById('nav-section-admin-title');
    const adminNavLink = document.getElementById('nav-admin-link');
    const adminNavGroup = document.getElementById('admin-nav-group');

    const isAuthed = AuthState.isAuthenticated();
    const user = AuthState.getUser();
    const isAdmin = AuthState.isAdmin();

    if (isAuthed && user) {
      if (unloggedSec) unloggedSec.classList.add('d-none');
      if (loggedSec) {
        loggedSec.classList.remove('d-none');
        loggedSec.classList.add('d-flex');
      }

      const displayName = user.fullName || user.name || user.username || 'Người dùng';
      const initials = getInitials(displayName);
      const hostColor = getHostColor(displayName);

      if (nameEl) nameEl.textContent = displayName;
      if (sidebarNameEl) sidebarNameEl.textContent = displayName;
      if (dropdownNameEl) dropdownNameEl.textContent = displayName;
      if (dropdownEmailEl) dropdownEmailEl.textContent = user.email || `${user.username || 'user'}@company.com`;

      let roleText = 'Thành viên (USER)';
      let roleClass = 'badge-user';
      if (user.role) {
        const r = user.role.toLowerCase();
        if (r === 'admin') {
          roleText = 'Quản trị viên (Admin)';
          roleClass = 'badge-admin';
        } else if (r === 'manager') {
          roleText = 'Trưởng phòng (Manager)';
        } else if (r === 'secretary') {
          roleText = 'Thư ký (Secretary)';
        } else if (r === 'employee') {
          roleText = 'Nhân viên (Employee)';
        }
      }

      if (roleEl) {
        roleEl.textContent = roleText;
        roleEl.className = `user-role ${roleClass}`;
      }
      if (sidebarRoleEl) {
        sidebarRoleEl.textContent = user.role ? user.role.toUpperCase() : 'USER';
        sidebarRoleEl.className = `sidebar-role-badge ${isAdmin ? 'badge-admin' : 'badge-user'}`;
      }

      if (avatarEl) {
        avatarEl.textContent = initials;
        avatarEl.style.backgroundColor = hostColor;
      }
      if (sidebarAvatarEl) {
        sidebarAvatarEl.textContent = initials;
      }

      if (adminSectionTitle) adminSectionTitle.style.display = isAdmin ? 'block' : 'none';
      if (adminNavGroup) adminNavGroup.style.display = isAdmin ? 'block' : 'none';
      if (adminNavLink) adminNavLink.style.display = isAdmin ? 'flex' : 'none';
    } else {
      if (unloggedSec) unloggedSec.classList.remove('d-none');
      if (loggedSec) {
        loggedSec.classList.add('d-none');
        loggedSec.classList.remove('d-flex');
      }
      if (sidebarNameEl) sidebarNameEl.textContent = 'Khách (Chưa đăng nhập)';
      if (sidebarAvatarEl) sidebarAvatarEl.textContent = 'G';
      if (sidebarRoleEl) {
        sidebarRoleEl.textContent = 'GUEST';
        sidebarRoleEl.className = 'sidebar-role-badge badge-user';
      }
      if (adminSectionTitle) adminSectionTitle.style.display = 'none';
      if (adminNavGroup) adminNavGroup.style.display = 'none';
      if (adminNavLink) adminNavLink.style.display = 'none';
    }
  }

  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getHostColor(name) {
    const palette = ['#2563eb', '#0284c7', '#059669', '#7c3aed', '#d97706', '#475569'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

  // ============================================================================
  // 6. MODAL ĐĂNG NHẬP / ĐĂNG KÝ (AUTH MODAL CONTROLLER)
  // ============================================================================
  const AuthModal = {
    overlay: null,
    isLoading: false,
    currentTab: 'login',

    init() {
      this.overlay = document.getElementById('auth-modal-overlay');
      this.bindEvents();
    },

    bindEvents() {
      // Nút mở modal trên header
      const openBtn = document.getElementById('btn-open-auth-modal');
      if (openBtn) {
        openBtn.addEventListener('click', () => this.open('login'));
      }

      // Nút đóng modal
      const closeBtn = document.getElementById('btn-close-auth-modal');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Nút đăng xuất trên header hoặc dropdown
      const logoutBtn = document.getElementById('btn-header-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?')) {
            AuthState.logout('login.html');
          }
        });
      }

      // Chuyển đổi tab
      const tabLogin = document.getElementById('tab-auth-login');
      const tabRegister = document.getElementById('tab-auth-register');
      const linkToReg = document.getElementById('link-switch-to-register');
      const linkToLog = document.getElementById('link-switch-to-login');

      if (tabLogin) tabLogin.addEventListener('click', () => this.switchTab('login'));
      if (tabRegister) tabRegister.addEventListener('click', () => this.switchTab('register'));
      if (linkToReg) linkToReg.addEventListener('click', () => this.switchTab('register'));
      if (linkToLog) linkToLog.addEventListener('click', () => this.switchTab('login'));

      // Đóng khi click ngoài overlay (chỉ khi có overlay và không đang gửi request)
      if (this.overlay) {
        this.overlay.addEventListener('click', (e) => {
          if (e.target === this.overlay && !this.isLoading) {
            this.close();
          }
        });
      }

      // Submit Form Đăng nhập
      const formLogin = document.getElementById('form-auth-login');
      if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleLoginSubmit();
        });
      }

      // Submit Form Đăng ký
      const formRegister = document.getElementById('form-auth-register');
      if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleRegisterSubmit();
        });
      }

      // Nút hiện/ẩn mật khẩu
      this.setupPasswordToggle('btn-toggle-login-pwd', 'login-password');
      this.setupPasswordToggle('btn-toggle-reg-pwd', 'register-password');
      this.setupPasswordToggle('btn-toggle-confirm-pwd', 'register-confirm-password');

      // Đo độ mạnh mật khẩu realtime
      const regPwdInput = document.getElementById('register-password');
      if (regPwdInput) {
        regPwdInput.addEventListener('input', () => this.updatePasswordStrength(regPwdInput.value));
      }

      // Chọn tài khoản trải nghiệm nhanh (Demo chips)
      document.querySelectorAll('.btn-demo-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          const btn = e.currentTarget;
          const user = btn.getAttribute('data-user');
          const pwd = btn.getAttribute('data-pwd');
          const idInput = document.getElementById('login-identifier');
          const pwdInput = document.getElementById('login-password');

          if (idInput && pwdInput) {
            idInput.value = user;
            pwdInput.value = pwd;
            this.clearFieldErrors();
            this.hideAlert();
            pwdInput.focus();
          }
        });
      });
    },

    setupPasswordToggle(btnId, inputId) {
      const btn = document.getElementById(btnId);
      const input = document.getElementById(inputId);
      if (!btn || !input) return;

      btn.addEventListener('click', () => {
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = isPassword ? 'bi bi-eye-slash text-primary' : 'bi bi-eye';
        }
      });
    },

    open(tab = 'login', prefill = {}) {
      if (!this.overlay) return;
      this.overlay.classList.remove('hidden');
      this.clearFieldErrors();
      this.hideAlert();

      this.switchTab(tab);

      if (prefill.username) {
        const idInput = document.getElementById('login-identifier');
        if (idInput) idInput.value = prefill.username;
      }
    },

    close() {
      if (!this.overlay || this.isLoading) return;
      this.overlay.classList.add('hidden');
      this.clearFieldErrors();
      this.hideAlert();
    },

    switchTab(tab) {
      this.currentTab = tab;
      const tabLogin = document.getElementById('tab-auth-login');
      const tabRegister = document.getElementById('tab-auth-register');
      const paneLogin = document.getElementById('auth-login-pane');
      const paneRegister = document.getElementById('auth-register-pane');
      const modalTitle = document.getElementById('auth-modal-title');
      const modalSubtitle = document.getElementById('auth-modal-subtitle');
      const modalIcon = document.getElementById('auth-header-icon');

      this.clearFieldErrors();
      this.hideAlert();

      if (tab === 'login') {
        if (tabLogin) {
          tabLogin.classList.add('active');
          tabLogin.setAttribute('aria-selected', 'true');
        }
        if (tabRegister) {
          tabRegister.classList.remove('active');
          tabRegister.setAttribute('aria-selected', 'false');
        }
        if (paneLogin) paneLogin.classList.remove('hidden');
        if (paneRegister) paneRegister.classList.add('hidden');

        if (modalTitle) modalTitle.textContent = 'Đăng nhập tài khoản';
        if (modalSubtitle) modalSubtitle.textContent = 'Truy cập hệ thống Quản lý Cuộc họp Doanh nghiệp';
        if (modalIcon) modalIcon.innerHTML = '<i class="bi bi-shield-lock-fill"></i>';

        const firstInput = document.getElementById('login-identifier');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);

      } else {
        if (tabLogin) {
          tabLogin.classList.remove('active');
          tabLogin.setAttribute('aria-selected', 'false');
        }
        if (tabRegister) {
          tabRegister.classList.add('active');
          tabRegister.setAttribute('aria-selected', 'true');
        }
        if (paneLogin) paneLogin.classList.add('hidden');
        if (paneRegister) paneRegister.classList.remove('hidden');

        if (modalTitle) modalTitle.textContent = 'Đăng ký tài khoản mới';
        if (modalSubtitle) modalSubtitle.textContent = 'Tạo tài khoản thành viên để đặt phòng và tham gia cuộc họp';
        if (modalIcon) modalIcon.innerHTML = '<i class="bi bi-person-plus-fill"></i>';

        const firstInput = document.getElementById('register-username');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
      }
    },

    // --- XỬ LÝ SUBMIT ĐĂNG NHẬP ---
    async handleLoginSubmit() {
      if (this.isLoading) return;
      this.clearFieldErrors();
      this.hideAlert();

      const identifierInput = document.getElementById('login-identifier');
      const passwordInput = document.getElementById('login-password');

      const identifier = identifierInput ? identifierInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      let hasError = false;
      if (!identifier) {
        this.showFieldError('login-identifier', 'Vui lòng nhập tên đăng nhập hoặc email.');
        hasError = true;
      }

      if (!password) {
        this.showFieldError('login-password', 'Vui lòng nhập mật khẩu.');
        hasError = true;
      }

      if (hasError) return;

      this.setLoading(true, 'btn-submit-login', 'Đang xác thực...');

      try {
        const res = await AuthAPI.login({ username: identifier, password });

        if (res.ok && res.data && res.data.token) {
          // Lưu token & user vào state
          AuthState.setSession(res.data.token, res.data.user);

          this.showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');
          showToast(`Chào mừng ${res.data.user?.fullName || res.data.user?.username}! Đăng nhập thành công.`, 'success');

          setTimeout(() => {
            this.setLoading(false, 'btn-submit-login', 'Đăng nhập');
            this.close();

            // Nếu đang ở trang login.html -> điều hướng theo role hoặc redirect hash
            if (window.location.pathname.endsWith('login.html')) {
              const redirectHash = sessionStorage.getItem('auth_redirect_hash');
              if (redirectHash) {
                sessionStorage.removeItem('auth_redirect_hash');
                window.location.href = `index.html${redirectHash}`;
              } else {
                AuthState.redirectAfterLogin();
              }
            } else if (typeof window.initializeEnterpriseData === 'function') {
              window.initializeEnterpriseData();
            }
          }, 500);

        } else {
          this.setLoading(false, 'btn-submit-login', 'Đăng nhập');
          const errMsg = res.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
          this.showAlert(errMsg, 'danger');
          if (passwordInput) {
            passwordInput.focus();
            passwordInput.classList.add('is-invalid');
          }
        }
      } catch (err) {
        this.setLoading(false, 'btn-submit-login', 'Đăng nhập');
        this.showAlert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.', 'danger');
      }
    },

    // --- XỬ LÝ SUBMIT ĐĂNG KÝ ---
    async handleRegisterSubmit() {
      if (this.isLoading) return;
      this.clearFieldErrors();
      this.hideAlert();

      const usernameInput = document.getElementById('register-username');
      const emailInput = document.getElementById('register-email');
      const fullNameInput = document.getElementById('register-fullname');
      const passwordInput = document.getElementById('register-password');
      const confirmPwdInput = document.getElementById('register-confirm-password');

      const username = usernameInput ? usernameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const fullName = fullNameInput ? fullNameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const confirmPassword = confirmPwdInput ? confirmPwdInput.value : '';

      let hasError = false;

      // 1. Kiểm tra Username
      const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
      if (!username) {
        this.showFieldError('register-username', 'Tên người dùng là trường bắt buộc.');
        hasError = true;
      } else if (!usernameRegex.test(username)) {
        this.showFieldError('register-username', 'Username từ 3-30 ký tự, chỉ gồm chữ cái, số, _, . và -');
        hasError = true;
      }

      // 2. Kiểm tra Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        this.showFieldError('register-email', 'Email là trường bắt buộc.');
        hasError = true;
      } else if (!emailRegex.test(email)) {
        this.showFieldError('register-email', 'Địa chỉ email không đúng định dạng hợp lệ.');
        hasError = true;
      }

      // 3. Kiểm tra Mật khẩu
      if (!password) {
        this.showFieldError('register-password', 'Mật khẩu là trường bắt buộc.');
        hasError = true;
      } else if (password.length < 6) {
        this.showFieldError('register-password', 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
        hasError = true;
      }

      // 4. Kiểm tra Xác nhận mật khẩu
      if (!confirmPassword) {
        this.showFieldError('register-confirm-password', 'Vui lòng xác nhận lại mật khẩu.');
        hasError = true;
      } else if (password !== confirmPassword) {
        this.showFieldError('register-confirm-password', 'Mật khẩu xác nhận không trùng khớp.');
        hasError = true;
      }

      if (hasError) return;

      this.setLoading(true, 'btn-submit-register', 'Đang tạo tài khoản...');

      try {
        const res = await AuthAPI.register({ username, email, password, fullName });

        this.setLoading(false, 'btn-submit-register', 'Đăng ký tài khoản');

        if (res.ok && res.data && res.data.success) {
          showToast('Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success');

          // Tự động chuyển sang tab Đăng nhập và điền sẵn username
          this.switchTab('login');
          const idInput = document.getElementById('login-identifier');
          const pwdInput = document.getElementById('login-password');
          if (idInput) idInput.value = username;
          if (pwdInput) {
            pwdInput.value = '';
            pwdInput.focus();
          }
          this.showAlert('Đăng ký thành công! Hãy nhập mật khẩu để đăng nhập.', 'success');

        } else {
          const errMsg = res.data?.message || (res.data?.errors && res.data.errors[0]) || 'Đăng ký không thành công.';
          this.showAlert(errMsg, 'danger');
        }
      } catch (err) {
        this.setLoading(false, 'btn-submit-register', 'Đăng ký tài khoản');
        this.showAlert('Lỗi kết nối máy chủ. Vui lòng thử lại sau.', 'danger');
      }
    },

    // --- TIỆN ÍCH HIỂN THỊ LỖI & LOADING ---
    showFieldError(inputId, message) {
      const input = document.getElementById(inputId);
      const errorDiv = document.getElementById(`${inputId}-error`);

      if (input) input.classList.add('is-invalid');
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
      }
    },

    clearFieldErrors() {
      document.querySelectorAll('.stitch-field-error').forEach(div => {
        div.textContent = '';
        div.classList.add('hidden');
      });
      document.querySelectorAll('.stitch-input').forEach(input => {
        input.classList.remove('is-invalid');
      });
    },

    showAlert(message, type = 'danger') {
      const box = document.getElementById('auth-alert-box');
      const text = document.getElementById('auth-alert-text');
      const icon = document.getElementById('auth-alert-icon');
      if (!box || !text) return;

      box.className = `auth-alert auth-alert-${type}`;
      text.textContent = message;

      if (icon) {
        icon.className = type === 'success'
          ? 'bi bi-check-circle-fill me-2 text-success'
          : 'bi bi-exclamation-circle-fill me-2 text-danger';
      }

      box.classList.remove('hidden');
    },

    hideAlert() {
      const box = document.getElementById('auth-alert-box');
      if (box) box.classList.add('hidden');
    },

    setLoading(loading, buttonId, text) {
      this.isLoading = loading;
      const btn = document.getElementById(buttonId);
      if (!btn) return;

      const spinner = btn.querySelector('.btn-spinner');
      const label = btn.querySelector('.btn-text');

      btn.disabled = loading;

      if (spinner) {
        if (loading) spinner.classList.remove('d-none');
        else spinner.classList.add('d-none');
      }

      if (label && text) {
        label.textContent = text;
      }

      // Vô hiệu hóa input trong khi đang gửi
      const activeForm = this.currentTab === 'login'
        ? document.getElementById('form-auth-login')
        : document.getElementById('form-auth-register');

      if (activeForm) {
        activeForm.querySelectorAll('input').forEach(inp => {
          inp.disabled = loading;
        });
      }
    },

    updatePasswordStrength(pwd) {
      const container = document.getElementById('pwd-strength-container');
      const bar = document.getElementById('pwd-strength-indicator');
      if (!container || !bar) return;

      if (!pwd) {
        container.classList.add('hidden');
        return;
      }

      container.classList.remove('hidden');

      let score = 0;
      if (pwd.length >= 6) score += 25;
      if (pwd.length >= 10) score += 25;
      if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
      if (/[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) score += 25;

      bar.style.width = `${score}%`;

      if (score <= 25) {
        bar.className = 'pwd-strength-indicator bg-danger';
      } else if (score <= 50) {
        bar.className = 'pwd-strength-indicator bg-warning';
      } else if (score <= 75) {
        bar.className = 'pwd-strength-indicator bg-info';
      } else {
        bar.className = 'pwd-strength-indicator bg-success';
      }
    }
  };

  // ============================================================================
  // 7. PHÍM ESC CHO AUTH MODAL
  // ============================================================================
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('auth-modal-overlay');
      if (overlay && !overlay.classList.contains('hidden') && !AuthModal.isLoading) {
        AuthModal.close();
      }
    }
  });

  // ============================================================================
  // 8. KHỞI TẠO TỰ ĐỘNG & XUẤT TOÀN CỤC
  // ============================================================================
  document.addEventListener('DOMContentLoaded', function () {
    AuthModal.init();
    AuthState.init();
  });

  // Xuất ra phạm vi toàn cục để main.js và các module khác sử dụng
  window.AuthState = AuthState;
  window.apiFetch = apiFetch;
  window.AuthAPI = AuthAPI;
  window.AuthModal = AuthModal;
  window.showToast = showToast;

})(window, document);
