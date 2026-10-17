/**
 * ==============================================================================
 * ROUTER JAVASCRIPT THUẦN (HASH-BASED SPA ROUTER)
 * Dự án: Meeting Management System – ICTU (Enterprise Sync)
 * Hỗ trợ: Dynamic routes (:id), Route guards (Auth/Admin), Active Nav, Loading
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  // Định nghĩa bảng Route (Route Table)
  const routeDefinitions = [];
  let currentUnmountCallback = null;
  let isNavigating = false;

  const AppRouter = {
    /**
     * Đăng ký một route vào hệ thống
     * @param {string} pattern - Mẫu URL (ví dụ: '/', '/meetings', '/meetings/:id')
     * @param {Function} handler - Hàm xử lý render view
     * @param {Object} options - { requireAuth: boolean, requireAdmin: boolean, title: string }
     */
    add(pattern, handler, options = {}) {
      // Chuyển đổi pattern thành Regex để hỗ trợ params như :id
      const paramNames = [];
      const regexPattern = pattern
        .replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
          paramNames.push(paramName);
          return '([^\\/]+)';
        })
        .replace(/\//g, '\\/');

      const regex = new RegExp(`^${regexPattern}$`);

      routeDefinitions.push({
        pattern,
        regex,
        paramNames,
        handler,
        options: {
          requireAuth: Boolean(options.requireAuth),
          requireAdmin: Boolean(options.requireAdmin),
          title: options.title || 'Quản lý Cuộc họp - ICTU'
        }
      });
    },

    /**
     * Lấy hash hiện tại và chuẩn hóa
     */
    getCurrentPath() {
      const hash = window.location.hash || '#/';
      let path = hash.startsWith('#') ? hash.slice(1) : hash;
      if (!path) path = '/';
      // Cắt bỏ query string nếu có
      if (path.includes('?')) {
        path = path.split('?')[0];
      }
      return path;
    },

    /**
     * Điều hướng tới một route
     */
    navigate(path) {
      window.location.hash = path.startsWith('/') ? `#${path}` : `#/${path}`;
    },

    /**
     * Tìm kiếm route phù hợp với path hiện tại
     */
    matchRoute(path) {
      for (const route of routeDefinitions) {
        const match = path.match(route.regex);
        if (match) {
          const params = {};
          route.paramNames.forEach((name, index) => {
            params[name] = decodeURIComponent(match[index + 1]);
          });
          return { route, params };
        }
      }
      return null;
    },

    /**
     * Thực thi chuyển route
     */
    async handleRouteChange() {
      if (isNavigating) return;
      isNavigating = true;

      const path = this.getCurrentPath();
      const matched = this.matchRoute(path);

      // Cập nhật trạng thái active trên navbar
      this.updateActiveNavigation(path);

      const appContainer = document.getElementById('app');
      if (!appContainer) {
        isNavigating = false;
        return;
      }

      // 1. Dọn dẹp tài nguyên trang cũ nếu có
      if (typeof currentUnmountCallback === 'function') {
        try {
          currentUnmountCallback();
        } catch (e) {
          console.warn('[Router] Lỗi khi dọn dẹp trang cũ:', e);
        }
        currentUnmountCallback = null;
      }

      // 2. Không tìm thấy route -> Render 404
      if (!matched) {
        this.renderNotFound(path);
        isNavigating = false;
        return;
      }

      const { route, params } = matched;

      // 3. Kiểm tra Route Guards (Xác thực & Phân quyền theo chuẩn QLNS_QLTKPM)
      if (route.options.requireAuth && window.AuthState && !window.AuthState.isAuthenticated()) {
        window.location.href = 'login.html';
        isNavigating = false;
        return;
      }

      if (route.options.requireAdmin && window.AuthState) {
        if (!window.AuthState.isAuthenticated()) {
          window.location.href = 'login.html';
          isNavigating = false;
          return;
        }

        if (!window.AuthState.isAdmin()) {
          if (window.showToast) {
            window.showToast('Bạn không có quyền Quản trị (Admin) để truy cập trang này.', 'error');
          }
          this.navigate('/meetings');
          isNavigating = false;
          return;
        }
      }

      // 4. Cập nhật tiêu đề trang
      document.title = `${route.options.title} • Enterprise Sync`;

      // 5. Hiển thị loading nhẹ
      this.showPageLoading();

      try {
        // Thực thi handler của trang
        const cleanup = await route.handler(params);
        if (typeof cleanup === 'function') {
          currentUnmountCallback = cleanup;
        }
      } catch (err) {
        console.error(`[Router] Lỗi khi tải route ${path}:`, err);
        appContainer.innerHTML = `
          <div class="stitch-card p-5 text-center">
            <div class="mb-3 text-danger"><i class="bi bi-exclamation-triangle-fill fs-1"></i></div>
            <h4 class="fw-bold text-slate-800">Đã xảy ra sự cố khi tải trang</h4>
            <p class="text-secondary small mb-4">${err.message || 'Không thể hiển thị nội dung vào lúc này.'}</p>
            <button class="btn btn-primary stitch-btn-primary" onclick="window.location.reload()">
              <i class="bi bi-arrow-clockwise me-1"></i> Tải lại trang
            </button>
          </div>
        `;
      } finally {
        this.hidePageLoading();
        isNavigating = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    /**
     * Cập nhật CSS class active trên các liên kết điều hướng
     */
    updateActiveNavigation(path) {
      const navLinks = document.querySelectorAll('.nav-link-custom, .nav-item, .admin-subnav-link');
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        const linkPath = href.startsWith('#') ? href.slice(1) : href;

        // So khớp path
        let isActive = false;
        if (linkPath === '/' || linkPath === '/home') {
          isActive = (path === '/' || path === '/home');
        } else if (linkPath.startsWith('/admin')) {
          isActive = path.startsWith('/admin');
        } else {
          isActive = path.startsWith(linkPath);
        }

        if (isActive) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      // Đóng sidebar trên mobile nếu đang mở
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('show');
    },

    /**
     * Render trang lỗi 404
     */
    renderNotFound(path) {
      const appContainer = document.getElementById('app');
      document.title = '404 - Không tìm thấy trang • Enterprise Sync';
      appContainer.innerHTML = `
        <div class="container-xl py-5">
          <div class="stitch-card text-center py-5 px-4" style="max-width: 640px; margin: 0 auto;">
            <div class="mb-3">
              <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 fs-6 fw-semibold">
                Lỗi 404
              </span>
            </div>
            <h2 class="fw-bold text-slate-900 mb-2">Trang không tồn tại</h2>
            <p class="text-secondary mb-4">
              Đường dẫn <code>#${path}</code> không tồn tại trên hệ thống hoặc đã được di chuyển.
            </p>
            <div class="d-flex justify-content-center gap-2">
              <a href="#/" class="btn btn-primary stitch-btn-submit">
                <i class="bi bi-house-door me-1"></i> Về trang chủ
              </a>
              <a href="#/meetings" class="btn btn-outline-secondary stitch-btn-cancel">
                <i class="bi bi-calendar3 me-1"></i> Xem cuộc họp
              </a>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Hiển thị spinner loading khi chuyển trang
     */
    showPageLoading() {
      let loader = document.getElementById('app-router-loader');
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'app-router-loader';
        loader.className = 'app-router-loader';
        loader.innerHTML = `
          <div class="router-loader-bar"></div>
        `;
        document.body.appendChild(loader);
      }
      loader.classList.add('active');
    },

    hidePageLoading() {
      const loader = document.getElementById('app-router-loader');
      if (loader) {
        loader.classList.remove('active');
      }
    },

    /**
     * Khởi động Router và gắn listener
     */
    init() {
      window.addEventListener('hashchange', () => this.handleRouteChange());
      document.addEventListener('DOMContentLoaded', () => this.handleRouteChange());

      // Nếu trang đã tải xong (ví dụ nạp sau DOMContentLoaded)
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => this.handleRouteChange(), 50);
      }
    }
  };

  // Xuất router toàn cục
  window.AppRouter = AppRouter;

})(window, document);
