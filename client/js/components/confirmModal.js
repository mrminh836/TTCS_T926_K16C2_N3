/**
 * ==============================================================================
 * COMPONENT: MODAL XÁC NHẬN CHUẨN STITCH ENTERPRISE (CONFIRM MODAL)
 * Dự án: Meeting Management System – ICTU (Enterprise Sync)
 * Cung cấp: window.showConfirmDialog(options) trả về Promise<boolean>
 * Đồng thời hỗ trợ callback onConfirm và desc cho tương thích ngược
 * ==============================================================================
 */

(function (window, document) {
  'use strict';

  function ensureConfirmModalDOM() {
    let overlay = document.getElementById('confirm-modal-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'confirm-modal-overlay';
    overlay.className = 'modal-overlay hidden';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'confirm-modal-title');

    overlay.innerHTML = `
      <div class="confirm-dialog-card">
        <div class="confirm-dialog-header">
          <div class="confirm-dialog-icon danger" id="confirm-modal-icon">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div>
            <h4 id="confirm-modal-title" class="confirm-dialog-title">Xác nhận thao tác</h4>
            <p id="confirm-modal-desc" class="confirm-dialog-desc">
              Bạn có chắc chắn muốn thực hiện hành động này không?
            </p>
          </div>
        </div>
        <div class="confirm-dialog-actions">
          <button type="button" class="btn btn-secondary" id="btn-confirm-cancel">
            Hủy bỏ
          </button>
          <button type="button" class="btn btn-danger" id="btn-confirm-submit">
            Xác nhận
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * Hiển thị hộp thoại xác nhận chuyên nghiệp chuẩn SaaS Enterprise
   * @param {Object} options
   * @param {string} options.title - Tiêu đề hộp thoại
   * @param {string} [options.message] - Nội dung thông điệp
   * @param {string} [options.desc] - Nội dung thông điệp (tương thích ngược)
   * @param {string} [options.confirmText='Xác nhận'] - Nhãn nút xác nhận
   * @param {string} [options.cancelText='Hủy bỏ'] - Nhãn nút hủy
   * @param {string} [options.type='danger'] - danger | warning | info | primary
   * @param {boolean} [options.isDanger] - Tương thích ngược với main.js
   * @param {Function} [options.onConfirm] - Callback khi xác nhận (tương thích ngược)
   * @param {string} [options.icon] - Icon class
   * @returns {Promise<boolean>}
   */
  function showConfirmDialog(options = {}) {
    const overlay = ensureConfirmModalDOM();

    const title = options.title || 'Xác nhận thao tác';
    const desc = options.message || options.desc || 'Bạn có chắc chắn muốn thực hiện hành động này không?';
    const cancelText = options.cancelText || 'Hủy bỏ';
    const confirmText = options.confirmText || 'Xác nhận';
    const isDanger = options.isDanger !== undefined ? options.isDanger : (options.type !== 'primary');
    const onConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : null;

    const titleEl = overlay.querySelector('#confirm-modal-title') || document.getElementById('confirm-modal-title');
    const descEl = overlay.querySelector('#confirm-modal-desc') || document.getElementById('confirm-modal-desc');
    const btnCancel = overlay.querySelector('#btn-confirm-cancel') || document.getElementById('btn-confirm-cancel');
    const btnSubmit = overlay.querySelector('#btn-confirm-submit') || document.getElementById('btn-confirm-submit');
    const iconWrapper = overlay.querySelector('#confirm-modal-icon') || document.getElementById('confirm-modal-icon');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (btnCancel) btnCancel.textContent = cancelText;
    if (btnSubmit) {
      btnSubmit.textContent = confirmText;
      btnSubmit.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';
    }
    if (iconWrapper) {
      iconWrapper.className = isDanger ? 'confirm-dialog-icon danger' : 'confirm-dialog-icon warning';
    }

    return new Promise((resolve) => {
      let resolved = false;

      const cleanup = () => {
        overlay.classList.add('hidden');
        btnCancel?.removeEventListener('click', onCancelClick);
        btnSubmit?.removeEventListener('click', onSubmitClick);
        overlay.removeEventListener('click', onOverlayClick);
        document.removeEventListener('keydown', onEsc);
      };

      const finish = (result) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        if (result && onConfirm) {
          try {
            onConfirm();
          } catch (err) {
            console.error('[showConfirmDialog onConfirm error]:', err);
          }
        }
        resolve(Boolean(result));
      };

      const onCancelClick = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        finish(false);
      };

      const onSubmitClick = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        finish(true);
      };

      const onOverlayClick = (e) => {
        if (e.target === overlay) finish(false);
      };

      const onEsc = (e) => {
        if (e.key === 'Escape') finish(false);
      };

      btnCancel?.addEventListener('click', onCancelClick);
      btnSubmit?.addEventListener('click', onSubmitClick);
      overlay.addEventListener('click', onOverlayClick);
      document.addEventListener('keydown', onEsc);

      overlay.classList.remove('hidden');
      if (btnSubmit) btnSubmit.focus();
    });
  }

  // Xuất ra window toàn cục
  window.showConfirmDialog = showConfirmDialog;

})(window, document);
