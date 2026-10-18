/**
 * ==============================================================================
 * COMPONENT: MODAL XÁC NHẬN CHUẨN STITCH ENTERPRISE (CONFIRM MODAL)
 * Dự án: Meeting Management System – ICTU (Enterprise Sync)
 * Cung cấp: window.showConfirmDialog(options) trả về Promise<boolean>
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  let activeResolve = null;

  /**
   * Tạo hoặc lấy container modal xác nhận trong DOM
   */
  function ensureConfirmModalDOM() {
    let overlay = document.getElementById('app-confirm-modal-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'app-confirm-modal-overlay';
    overlay.className = 'confirm-modal-overlay hidden';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'confirm-modal-title');
    overlay.setAttribute('aria-describedby', 'confirm-modal-message');

    overlay.innerHTML = `
      <div class="confirm-modal-backdrop" id="confirm-modal-backdrop"></div>
      <div class="confirm-modal-card">
        <div class="confirm-modal-body">
          <div class="confirm-modal-icon-wrapper" id="confirm-modal-icon-wrapper">
            <i class="bi bi-exclamation-triangle-fill" id="confirm-modal-icon"></i>
          </div>
          <div class="confirm-modal-text">
            <h3 class="confirm-modal-title" id="confirm-modal-title">Xác nhận thao tác</h3>
            <p class="confirm-modal-message" id="confirm-modal-message">Bạn có chắc chắn muốn thực hiện hành động này?</p>
          </div>
        </div>
        <div class="confirm-modal-actions">
          <button type="button" class="btn btn-outline-secondary confirm-modal-btn-cancel" id="confirm-modal-btn-cancel">
            Hủy bỏ
          </button>
          <button type="button" class="btn btn-danger confirm-modal-btn-confirm" id="confirm-modal-btn-confirm">
            Xác nhận
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Gắn sự kiện đóng / hủy
    const backdrop = overlay.querySelector('#confirm-modal-backdrop');
    const cancelBtn = overlay.querySelector('#confirm-modal-btn-cancel');
    const confirmBtn = overlay.querySelector('#confirm-modal-btn-confirm');

    const handleCancel = () => closeConfirmModal(false);
    const handleConfirm = () => closeConfirmModal(true);

    if (backdrop) backdrop.addEventListener('click', handleCancel);
    if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
    if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);

    // Lắng nghe phím ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
        closeConfirmModal(false);
      }
    });

    return overlay;
  }

  /**
   * Đóng modal và resolve Promise
   */
  function closeConfirmModal(result) {
    const overlay = document.getElementById('app-confirm-modal-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('active');
    }
    if (typeof activeResolve === 'function') {
      const resolve = activeResolve;
      activeResolve = null;
      resolve(Boolean(result));
    }
  }

  /**
   * Hiển thị hộp thoại xác nhận đẹp mắt chuẩn SaaS
   * @param {Object} options
   * @param {string} options.title - Tiêu đề hộp thoại
   * @param {string} options.message - Nội dung thông điệp
   * @param {string} [options.confirmText='Xác nhận'] - Nhãn nút xác nhận
   * @param {string} [options.cancelText='Hủy bỏ'] - Nhãn nút hủy
   * @param {string} [options.type='danger'] - danger | warning | info | primary
   * @param {string} [options.icon] - Bootstrap icon class (tùy chọn)
   * @returns {Promise<boolean>}
   */
  function showConfirmDialog(options = {}) {
    const {
      title = 'Xác nhận thao tác',
      message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
      confirmText = 'Xác nhận',
      cancelText = 'Hủy bỏ',
      type = 'danger',
      icon = null
    } = options;

    const overlay = ensureConfirmModalDOM();

    const titleEl = overlay.querySelector('#confirm-modal-title');
    const messageEl = overlay.querySelector('#confirm-modal-message');
    const cancelBtn = overlay.querySelector('#confirm-modal-btn-cancel');
    const confirmBtn = overlay.querySelector('#confirm-modal-btn-confirm');
    const iconWrapper = overlay.querySelector('#confirm-modal-icon-wrapper');
    const iconEl = overlay.querySelector('#confirm-modal-icon');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (cancelBtn) cancelBtn.textContent = cancelText;
    if (confirmBtn) {
      confirmBtn.textContent = confirmText;
      // Đặt class nút theo type
      confirmBtn.className = 'btn confirm-modal-btn-confirm';
      if (type === 'danger') {
        confirmBtn.classList.add('btn-danger', 'confirm-btn-danger');
      } else if (type === 'warning') {
        confirmBtn.classList.add('btn-warning', 'confirm-btn-warning');
      } else if (type === 'primary') {
        confirmBtn.classList.add('btn-primary', 'stitch-btn-primary');
      } else {
        confirmBtn.classList.add('btn-secondary');
      }
    }

    // Đặt class icon wrapper
    if (iconWrapper && iconEl) {
      iconWrapper.className = `confirm-modal-icon-wrapper type-${type}`;
      let iconClass = icon;
      if (!iconClass) {
        if (type === 'danger') iconClass = 'bi-exclamation-triangle-fill';
        else if (type === 'warning') iconClass = 'bi-exclamation-circle-fill';
        else if (type === 'info') iconClass = 'bi-info-circle-fill';
        else iconClass = 'bi-question-circle-fill';
      }
      iconEl.className = `bi ${iconClass}`;
    }

    overlay.classList.remove('hidden');
    // Kích hoạt animation
    requestAnimationFrame(() => {
      overlay.classList.add('active');
      if (confirmBtn) confirmBtn.focus();
    });

    return new Promise((resolve) => {
      activeResolve = resolve;
    });
  }

  // Xuất ra window toàn cục
  window.showConfirmDialog = showConfirmDialog;

})(window, document);
