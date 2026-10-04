/* =====================================================================
 * meeting-lifecycle.js — SPRINT 2 (FRONTEND) — Nguyễn Minh Lượng
 * ---------------------------------------------------------------------
 *  US 2.0  Chỉnh sửa cuộc họp   : prefill + validate + PUT /api/meetings/:id
 *  US 9.0  Hủy cuộc họp         : nút Hủy + popup xác nhận + cập nhật tức thì
 *  US 6.0  Danh sách đa năng    : 3 tab (Sắp tới / Đã diễn ra / Đã hủy),
 *                                 tìm kiếm, lọc phòng, phân trang, badge
 *
 *  CÁCH DÙNG: nạp file này SAU main.js trong index.html:
 *      <script src="main.js?v=1.6"></script>
 *      <script src="meeting-lifecycle.js?v=1.0"></script>
 *  File không sửa main.js: nó ghi đè một số hàm toàn cục (renderMeetingsPage,
 *  renderMeetingTable, updateDashboardStats, openEditModal, openDetailModal)
 *  và bổ sung MeetingAPI.update / .cancel / .list.
 * ===================================================================== */
(function () {
  "use strict";

  if (
    typeof meetings === "undefined" ||
    typeof MeetingAPI === "undefined" ||
    typeof routes === "undefined"
  ) {
    console.error("[meeting-lifecycle] Hãy nạp file này SAU main.js.");
    return;
  }

  // ===================================================================
  // 0. CẤU HÌNH
  // ===================================================================
  const CONFIG = {
    PAGE_SIZE: 8,              // số cuộc họp mỗi trang
    SYNC_LIST_FROM_API: true,  // true: khi backend bật, nạp danh sách từ GET /api/meetings
    API_TIMEOUT_MS: 3500,
    CANCEL_REASON_MAX: 500
  };

  const API_BASE =
    typeof MEETING_API_URL !== "undefined"
      ? MEETING_API_URL
      : "http://localhost:3000/api/meetings";

  // Trạng thái giao diện của trang danh sách
  const ui = { tab: "upcoming", page: 1, lastSearch: "", lastRoom: "" };

  // ===================================================================
  // 1. TIỆN ÍCH
  // ===================================================================
  const $ = (id) => document.getElementById(id);
  const esc = (v) => escapeHTML(v);
  const pad = (n) => String(n).padStart(2, "0");

  function findMeeting(id) {
    return meetings.find((m) => Number(m.id) === Number(id));
  }

  function toDate(m, field) {
    const t = m[field];
    if (!m.date || !t) return null;
    const d = new Date(`${m.date}T${t.length === 5 ? t + ":00" : t}`);
    return isNaN(d.getTime()) ? null : d;
  }

  // Trạng thái thực tế: "cancelled" giữ nguyên, còn lại tính theo giờ hiện tại.
  function effectiveStatus(m, now) {
    if (m.status === "cancelled") return "cancelled";
    const n = now || new Date();
    const s = toDate(m, "startTime");
    const e = toDate(m, "endTime");
    if (!s || !e) return m.status || "scheduled";
    if (n < s) return "scheduled";
    if (n < e) return "in-progress";
    return "completed";
  }

  function bucketOf(m) {
    const st = effectiveStatus(m);
    if (st === "cancelled") return "cancelled";
    if (st === "completed") return "past";
    return "upcoming"; // scheduled + in-progress
  }

  function syncStatuses() {
    const now = new Date();
    meetings.forEach((m) => {
      m.status = effectiveStatus(m, now);
    });
  }

  // Bỏ dấu tiếng Việt để tìm kiếm "hop" ra "họp"
  function fold(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  }

  function tagClassOf(tag) {
    if (tag === "Quan trọng") return "tag-danger";
    if (tag === "Sprint 24" || tag === "Dự án mới") return "tag-primary";
    if (tag === "Thiết kế" || tag === "Tuyển dụng") return "tag-sky";
    return "tag-neutral";
  }

  function statusPill(status) {
    if (status === "in-progress") {
      return `<span class="stitch-status-pill status-in-progress"><span class="status-indicator-dot dot-ping"></span><span>Đang diễn ra</span></span>`;
    }
    if (status === "scheduled") {
      return `<span class="stitch-status-pill status-scheduled"><span class="status-indicator-dot dot-blue"></span><span>Sắp diễn ra</span></span>`;
    }
    if (status === "completed") {
      return `<span class="stitch-status-pill status-completed"><i class="bi bi-check-circle-fill me-1"></i><span>Đã diễn ra</span></span>`;
    }
    return `<span class="stitch-status-pill status-cancelled"><i class="bi bi-x-circle-fill me-1"></i><span>Đã hủy</span></span>`;
  }

  // ===================================================================
  // 2. TOAST (thông báo thành công / lỗi)
  // ===================================================================
  function toastRoot() {
    let root = $("ml-toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "ml-toast-root";
      root.setAttribute("aria-live", "polite");
      document.body.appendChild(root);
    }
    return root;
  }

  function showToast(opts) {
    const { type = "success", title = "", message = "", actionLabel, onAction, duration = 5000 } = opts;
    const icons = {
      success: "bi-check-circle-fill",
      error: "bi-x-octagon-fill",
      warning: "bi-exclamation-triangle-fill",
      info: "bi-info-circle-fill"
    };

    const el = document.createElement("div");
    el.className = `ml-toast ml-toast-${type}`;
    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.innerHTML = `
      <i class="bi ${icons[type] || icons.info} ml-toast-icon"></i>
      <div class="ml-toast-body">
        <div class="ml-toast-title"></div>
        <div class="ml-toast-msg"></div>
      </div>
      <button type="button" class="ml-toast-close" aria-label="Đóng"><i class="bi bi-x-lg"></i></button>
    `;
    el.querySelector(".ml-toast-title").textContent = title;
    const msgEl = el.querySelector(".ml-toast-msg");
    if (message) msgEl.textContent = message;
    else msgEl.remove();

    if (actionLabel && typeof onAction === "function") {
      const a = document.createElement("button");
      a.type = "button";
      a.className = "ml-toast-action";
      a.textContent = actionLabel;
      a.addEventListener("click", () => {
        onAction();
        dismiss();
      });
      el.querySelector(".ml-toast-body").appendChild(a);
    }

    let timer = null;
    function dismiss() {
      clearTimeout(timer);
      el.classList.add("ml-toast-out");
      setTimeout(() => el.remove(), 220);
    }
    el.querySelector(".ml-toast-close").addEventListener("click", dismiss);
    toastRoot().appendChild(el);
    if (duration > 0) timer = setTimeout(dismiss, duration);
    return dismiss;
  }

  // ===================================================================
  // 3. LỚP API: bổ sung update / cancel / list cho MeetingAPI
  //    (mất kết nối -> tự động chuyển sang lưu cục bộ như create())
  // ===================================================================
  async function http(method, url, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CONFIG.API_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal
      });
      const json = await res.json().catch(() => ({}));
      MeetingAPI.isBackendConnected = true;
      MeetingAPI.updateStatusBadges();
      return { reached: true, ok: res.ok, status: res.status, json };
    } catch (err) {
      MeetingAPI.isBackendConnected = false;
      MeetingAPI.updateStatusBadges();
      return { reached: false, ok: false, status: 0, json: null, error: err };
    } finally {
      clearTimeout(timer);
    }
  }

  function apiFailure(r, fallbackMsg) {
    const j = r.json || {};
    return {
      success: false,
      status: r.status,
      message: j.message || fallbackMsg,
      errors: j.errors || [j.message || fallbackMsg],
      isConflict: r.status === 409,
      isNotFound: r.status === 404
    };
  }

  // PUT /api/meetings/:id
  MeetingAPI.update = async function (id, payload) {
    const r = await http("PUT", `${API_BASE}/${id}`, payload);
    if (!r.reached) {
      return { success: true, isFallback: true, message: "Đã lưu cục bộ (Backend chưa bật)." };
    }
    if (!r.ok) return apiFailure(r, "Máy chủ từ chối cập nhật cuộc họp.");
    return {
      success: true,
      isFallback: false,
      data: r.json.data || r.json,
      message: r.json.message || "Cập nhật cuộc họp thành công."
    };
  };

  // PATCH /api/meetings/:id   { status: "Cancelled", reason }
  MeetingAPI.cancel = async function (id, reason) {
    const r = await http("PATCH", `${API_BASE}/${id}`, {
      status: "Cancelled",
      reason: reason || null
    });
    if (!r.reached) {
      return { success: true, isFallback: true, message: "Đã hủy cục bộ (Backend chưa bật)." };
    }
    if (!r.ok) return apiFailure(r, "Máy chủ từ chối hủy cuộc họp.");
    return {
      success: true,
      isFallback: false,
      data: r.json.data || r.json,
      message: r.json.message || "Hủy cuộc họp thành công."
    };
  };

  // GET /api/meetings?page=&limit=&status=&date=...
  MeetingAPI.list = async function (params) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });
    const r = await http("GET", `${API_BASE}?${qs.toString()}`);
    if (!r.reached) return { success: false, offline: true };
    if (!r.ok) return apiFailure(r, "Không tải được danh sách cuộc họp.");
    return {
      success: true,
      data: Array.isArray(r.json.data) ? r.json.data : [],
      pagination: r.json.pagination || null
    };
  };

  // Chuyển 1 dòng từ API (camelCase của meetingModel.getAll) sang định dạng của client
  function normalizeApiMeeting(row, prev) {
    const s = new Date(row.startTime);
    const e = new Date(row.endTime);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    const date = `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`;
    const st = `${pad(s.getHours())}:${pad(s.getMinutes())}`;
    const en = `${pad(e.getHours())}:${pad(e.getMinutes())}`;
    const host = row.organizerName || (prev && prev.host) || "";
    const cancelled = String(row.bookingStatus || "").toLowerCase() === "cancelled";
    return {
      ...(prev || {}),
      id: Number(row.meetingId),
      title: row.title,
      tag: (prev && prev.tag) || "",
      date,
      startTime: st,
      endTime: en,
      time: `${st} - ${en}`,
      roomId: row.roomId,
      roomName: row.roomName,
      capacity: row.roomCapacity,
      location: row.roomName,
      organizerId: row.organizerId,
      host,
      participants: prev && prev.participants && prev.participants.length ? prev.participants : host ? [host] : [],
      notes: row.description || "",
      isRecurring: Boolean(row.isRecurring),
      status: cancelled ? "cancelled" : "scheduled",
      startTimeISO: `${date}T${st}:00`,
      endTimeISO: `${date}T${en}:00`
    };
  }

  async function syncFromServer() {
    if (!CONFIG.SYNC_LIST_FROM_API) return false;
    const rows = [];
    for (let page = 1; page <= 10; page++) {
      const r = await MeetingAPI.list({ page, limit: 100 });
      if (!r.success) return false;
      rows.push(...r.data);
      if (!r.pagination || !r.pagination.hasNextPage) break;
    }
    const prevById = new Map(meetings.map((m) => [Number(m.id), m]));
    const byId = new Map();
    rows.forEach((row) => {
      const n = normalizeApiMeeting(row, prevById.get(Number(row.meetingId)));
      if (!n) return;
      const old = byId.get(n.id);
      if (!old || (old.status === "cancelled" && n.status !== "cancelled")) byId.set(n.id, n);
    });
    meetings = Array.from(byId.values());
    persistMeetingsToStorage();
    return true;
  }

  // ===================================================================
  // 4. TRANG DANH SÁCH CUỘC HỌP (US 6.0)
  // ===================================================================
  function renderMeetingsPageV2() {
    syncStatuses();

    const roomOptions = ROOMS.map(
      (r) => `<option value="${r.id}">${esc(r.name)}</option>`
    ).join("");

    app.innerHTML = `
    <div id="meetings-section" class="meetings-view-wrapper">

      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div class="breadcrumb-nav mb-1">
            <span>Không gian cá nhân</span>
            <i class="bi bi-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-active">Lịch làm việc</span>
          </div>
          <h1 class="page-title m-0">Lịch họp của tôi / Đặt phòng họp</h1>
          <p class="page-subtitle m-0">Quản lý lịch họp cá nhân, đặt phòng họp và theo dõi các phiên họp tham gia.</p>
        </div>
        <div class="header-action-buttons d-flex align-items-center gap-2">
          <span id="meeting-page-api-badge" class="stitch-badge-api me-1 d-none d-sm-inline-flex" title="Trạng thái kết nối API Backend">
            <span class="api-dot-status"></span> <span id="meeting-page-api-text">API Live</span>
          </span>
          <button type="button" id="btn-export-excel" class="btn-stitch-export" title="Xuất danh sách ra file CSV">
            <i class="bi bi-file-earmark-arrow-down"></i><span>Xuất báo cáo / Excel</span>
          </button>
          <button type="button" id="btn-add-meeting" class="btn-stitch-create">
            <i class="bi bi-plus-circle-fill"></i><span>Tạo cuộc họp mới</span>
          </button>
        </div>
      </div>

      <div class="kpi-metrics-grid mb-4">
        <div class="kpi-card">
          <div class="kpi-card-body">
            <div class="kpi-card-content">
              <span class="kpi-label">Tổng cuộc họp của tôi</span>
              <div class="kpi-value" id="kpi-total">0</div>
            </div>
            <div class="kpi-icon-box kpi-blue"><i class="bi bi-calendar-week"></i></div>
          </div>
          <div class="kpi-delta-row">
            <span class="kpi-delta-text" id="kpi-total-sub"></span>
          </div>
          <div class="kpi-bottom-bar bar-blue"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-body">
            <div class="kpi-card-content">
              <span class="kpi-label">Sắp diễn ra hôm nay</span>
              <div class="kpi-value d-flex align-items-baseline gap-1">
                <span id="kpi-scheduled">0</span><span class="kpi-value-unit">cuộc họp</span>
              </div>
            </div>
            <div class="kpi-icon-box kpi-sky"><i class="bi bi-clock-history"></i></div>
          </div>
          <div class="kpi-delta-row">
            <span class="kpi-chip-neutral"><span class="pulse-dot-primary"></span> <span id="kpi-next-time">--:--</span></span>
            <span class="kpi-delta-text truncate" id="kpi-next-title">Chưa có cuộc họp sắp tới</span>
          </div>
          <div class="kpi-bottom-bar bar-sky"></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-body">
            <div class="kpi-card-content">
              <span class="kpi-label">Đang diễn ra</span>
              <div class="kpi-value d-flex align-items-baseline gap-1">
                <span id="kpi-inprogress">0</span><span class="kpi-value-unit">phòng live</span>
              </div>
            </div>
            <div class="kpi-icon-box kpi-amber"><i class="bi bi-broadcast"></i></div>
          </div>
          <div class="kpi-delta-row">
            <span class="kpi-chip-live"><span class="ping-dot-live"></span> Đang diễn ra</span>
            <span class="kpi-delta-text truncate">Phòng họp trực tiếp</span>
          </div>
          <div class="kpi-bottom-bar bar-amber"></div>
        </div>
      </div>

      <div class="room-quick-finder-widget mb-4" id="room-quick-finder-section">
        <div class="room-finder-header">
          <div>
            <div class="room-finder-title"><i class="bi bi-broadcast text-primary"></i> Tra cứu phòng trống theo thời gian thực</div>
            <div class="stitch-hint mt-0.5">Kiểm tra ngay tình trạng phòng họp trong toàn bộ tòa nhà theo khung giờ</div>
          </div>
          <div class="room-finder-controls">
            <div class="d-flex align-items-center gap-1">
              <label for="finder-date" class="visually-hidden">Ngày tra cứu</label>
              <input type="date" id="finder-date" class="form-control stitch-input stitch-input-sm" style="width: 140px; font-size: 0.78rem;" aria-label="Ngày tra cứu" />
            </div>
            <div class="d-flex align-items-center gap-1">
              <label for="finder-start" class="visually-hidden">Giờ bắt đầu</label>
              <input type="time" id="finder-start" class="form-control stitch-input stitch-input-sm" value="09:00" style="width: 95px; font-size: 0.78rem;" aria-label="Giờ bắt đầu" />
              <span class="text-muted small">➔</span>
              <label for="finder-end" class="visually-hidden">Giờ kết thúc</label>
              <input type="time" id="finder-end" class="form-control stitch-input stitch-input-sm" value="10:30" style="width: 95px; font-size: 0.78rem;" aria-label="Giờ kết thúc" />
            </div>
            <button type="button" class="btn btn-sm btn-primary px-3" id="btn-finder-book-room" style="font-size: 0.78rem; font-weight: 600;" onclick="openAddModalWithSelection()">
              <i class="bi bi-plus-lg me-1"></i> Đặt lịch ngay
            </button>
          </div>
        </div>
        <div id="finder-room-cards" class="realtime-room-grid"></div>
      </div>

      <div class="filter-panel-card mb-4">
        <div class="filter-top-row">
          <div class="search-input-wrapper">
            <label for="search-meeting" class="visually-hidden">Tìm kiếm cuộc họp</label>
            <i class="bi bi-search search-icon-left"></i>
            <input type="text" id="search-meeting" class="stitch-search-field"
                   placeholder="Tìm theo tiêu đề, phòng họp, người tổ chức..." aria-label="Tìm kiếm cuộc họp" autocomplete="off" />
          </div>

          <div class="status-tab-group" id="ml-tabs" role="tablist" aria-label="Phân loại cuộc họp">
            <button type="button" class="status-tab-item active" role="tab" data-ml-tab="upcoming" aria-selected="true">
              <i class="bi bi-calendar-event"></i> Sắp tới <span class="ml-count" data-ml-count="upcoming">0</span>
            </button>
            <button type="button" class="status-tab-item" role="tab" data-ml-tab="past" aria-selected="false">
              <i class="bi bi-check2-circle"></i> Đã diễn ra <span class="ml-count" data-ml-count="past">0</span>
            </button>
            <button type="button" class="status-tab-item" role="tab" data-ml-tab="cancelled" aria-selected="false">
              <i class="bi bi-x-circle"></i> Đã hủy <span class="ml-count" data-ml-count="cancelled">0</span>
            </button>
          </div>
        </div>

        <div class="filter-bottom-row">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <div class="filter-select-wrapper">
              <label for="filter-room" class="visually-hidden">Lọc theo phòng họp</label>
              <i class="bi bi-door-open filter-icon-left"></i>
              <select id="filter-room" class="stitch-select-compact" aria-label="Lọc theo phòng họp">
                <option value="">Tất cả phòng họp</option>
                ${roomOptions}
              </select>
            </div>
            <button type="button" id="btn-reset-filters" class="btn-reset-link">
              <i class="bi bi-arrow-counterclockwise"></i><span>Đặt lại bộ lọc</span>
            </button>
          </div>
          <div class="filter-stats-text">
            Hiển thị <span id="filtered-count" class="fw-bold text-dark">0</span> cuộc họp
          </div>
        </div>
      </div>

      <div class="table-card-container mb-4">
        <div class="table-responsive">
          <table id="meetings-table" class="stitch-data-table">
            <thead>
              <tr>
                <th class="th-title">TIÊU ĐỀ CUỘC HỌP</th>
                <th class="th-time">THỜI GIAN &amp; NGÀY</th>
                <th class="th-host">NGƯỜI TỔ CHỨC</th>
                <th class="th-room">PHÒNG HỌP &amp; SỨC CHỨA</th>
                <th class="th-status">TRẠNG THÁI</th>
                <th class="th-actions text-end">THAO TÁC</th>
              </tr>
            </thead>
            <tbody id="meetings-list"></tbody>
          </table>
        </div>

        <div id="empty-state" class="table-empty-state hidden">
          <div class="empty-icon-circle"><i class="bi bi-calendar-x"></i></div>
          <h5 class="empty-state-title">Không tìm thấy cuộc họp nào</h5>
          <p class="empty-state-text">Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.</p>
        </div>

        <div id="ml-pagination" class="table-pagination-footer"></div>
      </div>
    </div>`;

    // Reset trạng thái bộ lọc cũ còn sót từ main.js
    if (typeof currentStatusFilter !== "undefined") currentStatusFilter = "";
    if (typeof currentRoomFilter !== "undefined") currentRoomFilter = "";
    ui.lastSearch = "";
    ui.lastRoom = "";

    // Sự kiện gốc của main.js: nút Tạo, Xuất CSV, tìm kiếm, lọc phòng, reset,
    // các nút đóng modal, form submit (tạo mới), chọn tag, tính thời lượng...
    setupMeetingEvents();
    bindPageEvents();

    renderMeetingTableV2();
    updateDashboardStatsV2();
    if (typeof initFinderRoomWidget === "function") initFinderRoomWidget();
    MeetingAPI.checkHealth();

    // Nếu backend đang chạy: nạp danh sách thật từ MySQL
    syncFromServer().then((ok) => {
      if (ok && $("ml-tabs")) {
        renderMeetingTableV2();
        updateDashboardStatsV2();
      }
    });
  }

  function bindPageEvents() {
    // --- Tabs
    const tabs = $("ml-tabs");
    if (tabs) {
      tabs.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-ml-tab]");
        if (!btn) return;
        ui.tab = btn.dataset.mlTab;
        ui.page = 1;
        renderMeetingTableV2();
      });
    }

    // --- Phân trang
    const foot = $("ml-pagination");
    if (foot) {
      foot.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-ml-page]");
        if (!btn || btn.disabled) return;
        ui.page = Number(btn.dataset.mlPage);
        renderMeetingTableV2();
        const card = $("meetings-table");
        if (card && card.scrollIntoView) card.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    // --- Nút Xem / Sửa / Hủy trong bảng (dùng data-ml-action để không đụng handleMeetingAction của main.js)
    const list = $("meetings-list");
    if (list) {
      list.addEventListener("click", (e) => {
        const el = e.target.closest("[data-ml-action]");
        if (!el) return;
        const id = Number(el.dataset.id);
        if (!id) return;
        const action = el.dataset.mlAction;
        if (action === "detail") openDetailModal(id);
        else if (action === "edit") openEditModal(id);
        else if (action === "cancel") openCancelDialog(id);
      });
    }

    // --- Đặt lại bộ lọc: đưa về trang 1 (main.js đã xóa ô tìm kiếm + lọc phòng)
    const reset = $("btn-reset-filters");
    if (reset) {
      reset.addEventListener("click", () => {
        ui.page = 1;
      });
    }
  }

  function getFilteredMeetings() {
    const input = $("search-meeting");
    const kw = fold(input ? input.value.trim() : "");
    const room = typeof currentRoomFilter !== "undefined" ? currentRoomFilter : "";

    const list = meetings.filter((m) => {
      if (bucketOf(m) !== ui.tab) return false;
      if (room !== "" && Number(m.roomId) !== Number(room)) return false;
      if (!kw) return true;
      const hay = fold(
        [m.title, m.roomName, m.location, m.host, m.tag, m.notes, ...(m.participants || [])].join(" ")
      );
      return hay.includes(kw);
    });

    const startMs = (m) => (toDate(m, "startTime") || new Date(0)).getTime();
    list.sort((a, b) => (ui.tab === "upcoming" ? startMs(a) - startMs(b) : startMs(b) - startMs(a)));
    return list;
  }

  function pageNumbers(cur, total) {
    const set = new Set([1, total, cur - 1, cur, cur + 1]);
    const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
    const out = [];
    nums.forEach((n, i) => {
      if (i > 0 && n - nums[i - 1] > 1) out.push(0); // 0 = dấu "…"
      out.push(n);
    });
    return out;
  }

  function renderPagination(total, totalPages) {
    const foot = $("ml-pagination");
    if (!foot) return;
    if (total === 0) {
      foot.classList.add("hidden");
      return;
    }
    foot.classList.remove("hidden");

    const from = (ui.page - 1) * CONFIG.PAGE_SIZE + 1;
    const to = Math.min(ui.page * CONFIG.PAGE_SIZE, total);
    const nums = pageNumbers(ui.page, totalPages)
      .map((n) =>
        n === 0
          ? `<span class="ml-page-gap">…</span>`
          : `<button type="button" class="btn-page-num ${n === ui.page ? "active" : ""}" data-ml-page="${n}" ${
              n === ui.page ? 'aria-current="page"' : ""
            }>${n}</button>`
      )
      .join("");

    foot.innerHTML = `
      <div class="pagination-info">Hiển thị <strong>${from}</strong> - <strong>${to}</strong> trong tổng số <strong>${total}</strong> cuộc họp</div>
      <div class="pagination-controls">
        <button type="button" class="btn-page-nav" data-ml-page="${ui.page - 1}" ${ui.page <= 1 ? "disabled" : ""} aria-label="Trang trước"><i class="bi bi-chevron-left"></i></button>
        ${nums}
        <button type="button" class="btn-page-nav" data-ml-page="${ui.page + 1}" ${ui.page >= totalPages ? "disabled" : ""} aria-label="Trang sau"><i class="bi bi-chevron-right"></i></button>
      </div>`;
  }

  function rowHTML(m) {
    const st = effectiveStatus(m);
    const room = ROOMS.find((r) => r.id === Number(m.roomId));
    const roomName = m.roomName || (room && room.name) || m.location || "—";
    const capacity = m.capacity || (room && room.capacity) || "—";
    const hostName = m.host || (m.participants && m.participants[0]) || "Admin";
    const others = (m.participants || []).filter((p) => p !== hostName);
    const shown = others.slice(0, 2);
    const remaining = others.length - shown.length;
    const stack = others.length
      ? `<div class="mini-avatar-stack">
          ${shown.map((p) => `<span class="mini-avatar" title="${esc(p)}">${esc(getInitials(p))}</span>`).join("")}
          ${remaining > 0 ? `<span class="mini-avatar mini-avatar-more">+${remaining}</span>` : ""}
        </div>`
      : "";
    const duration = calcDurationString(m.startTime, m.endTime);
    const canChange = st === "scheduled" || st === "in-progress";
    const isCancelled = st === "cancelled";

    const sub = isCancelled && m.cancelReason
      ? `<p class="meeting-desc-sub ml-reason-chip"><i class="bi bi-chat-left-text me-1"></i>Lý do hủy: ${esc(m.cancelReason)}</p>`
      : `<p class="meeting-desc-sub">${esc(m.notes || "Chưa có ghi chú")}</p>`;

    const actions = `
      <button type="button" class="btn-stitch-icon" data-ml-action="detail" data-id="${m.id}" title="Xem chi tiết" aria-label="Xem chi tiết"><i class="bi bi-eye"></i></button>
      ${
        canChange
          ? `<button type="button" class="btn-stitch-icon" data-ml-action="edit" data-id="${m.id}" title="Chỉnh sửa" aria-label="Chỉnh sửa"><i class="bi bi-pencil"></i></button>
             <button type="button" class="ml-btn-cancel" data-ml-action="cancel" data-id="${m.id}" title="Hủy cuộc họp" aria-label="Hủy cuộc họp"><i class="bi bi-x-circle"></i><span>Hủy họp</span></button>`
          : ""
      }`;

    return `
      <td class="td-title">
        <div class="meeting-title-cell">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="meeting-title-link ${isCancelled ? "title-cancelled" : ""}" data-ml-action="detail" data-id="${m.id}" role="button" tabindex="0">${esc(m.title)}</span>
            ${m.tag ? `<span class="stitch-tag-chip ${tagClassOf(m.tag)}">${esc(m.tag)}</span>` : ""}
          </div>
          ${sub}
        </div>
      </td>
      <td class="td-time">
        <div class="meeting-datetime-cell">
          <div class="datetime-date-row ${isCancelled ? "text-decoration-line-through text-muted" : ""}">
            <i class="bi bi-calendar3 me-1 text-slate-400"></i><span>${esc(formatDate(m.date))}</span>
          </div>
          <div class="datetime-time-row">
            <span class="datetime-hours">${esc(m.time || `${m.startTime} - ${m.endTime}`)}</span>
            <span class="datetime-dur-chip">${esc(duration)}</span>
          </div>
        </div>
      </td>
      <td class="td-host">
        <div class="meeting-host-cell">
          <div class="host-avatar-circle" style="background: ${getHostColor(hostName)};">${esc(getInitials(hostName))}</div>
          <div class="host-info"><span class="host-name">${esc(hostName)}</span>${stack}</div>
        </div>
      </td>
      <td class="td-room">
        <div class="meeting-room-badge">
          <span class="room-name"><i class="bi bi-door-open text-primary me-1"></i>${esc(roomName)}</span>
          <span class="room-capacity-chip"><i class="bi bi-people-fill me-1"></i>${esc(capacity)} chỗ</span>
        </div>
      </td>
      <td class="td-status ml-status-cell">${statusPill(st)}</td>
      <td class="td-actions text-end"><div class="stitch-actions-wrapper">${actions}</div></td>`;
  }

  const EMPTY_TEXT = {
    upcoming: ["Chưa có cuộc họp sắp tới", "Hãy bấm “Tạo cuộc họp mới” để đặt lịch."],
    past: ["Chưa có cuộc họp nào đã diễn ra", "Các cuộc họp kết thúc sẽ được lưu lại tại đây."],
    cancelled: ["Chưa có cuộc họp nào bị hủy", "Các cuộc họp đã hủy sẽ hiển thị tại đây."]
  };

  function renderMeetingTableV2() {
    const list = $("meetings-list");
    const table = $("meetings-table");
    const empty = $("empty-state");
    if (!list || !table || !empty) return;

    syncStatuses();

    // Đổi từ khóa / phòng -> về trang 1
    const input = $("search-meeting");
    const search = input ? input.value.trim() : "";
    const room = typeof currentRoomFilter !== "undefined" ? currentRoomFilter : "";
    if (search !== ui.lastSearch || room !== ui.lastRoom) {
      ui.page = 1;
      ui.lastSearch = search;
      ui.lastRoom = room;
    }

    const items = getFilteredMeetings();
    const totalPages = Math.max(1, Math.ceil(items.length / CONFIG.PAGE_SIZE));
    if (ui.page > totalPages) ui.page = totalPages;
    if (ui.page < 1) ui.page = 1;
    const pageItems = items.slice((ui.page - 1) * CONFIG.PAGE_SIZE, ui.page * CONFIG.PAGE_SIZE);

    // Tab đang chọn + số đếm
    const counts = { upcoming: 0, past: 0, cancelled: 0 };
    meetings.forEach((m) => {
      counts[bucketOf(m)]++;
    });
    document.querySelectorAll("[data-ml-tab]").forEach((b) => {
      const active = b.dataset.mlTab === ui.tab;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("[data-ml-count]").forEach((c) => {
      c.textContent = counts[c.dataset.mlCount];
    });

    const fc = $("filtered-count");
    if (fc) fc.textContent = items.length;

    list.innerHTML = "";

    if (items.length === 0) {
      table.classList.add("hidden");
      empty.classList.remove("hidden");
      const [t, d] = EMPTY_TEXT[ui.tab];
      const titleEl = empty.querySelector(".empty-state-title");
      const textEl = empty.querySelector(".empty-state-text");
      if (search || room !== "") {
        if (titleEl) titleEl.textContent = "Không tìm thấy cuộc họp phù hợp";
        if (textEl) textEl.textContent = "Thử đổi từ khóa, bỏ lọc phòng hoặc chuyển sang tab khác.";
      } else {
        if (titleEl) titleEl.textContent = t;
        if (textEl) textEl.textContent = d;
      }
      renderPagination(0, 1);
      return;
    }

    table.classList.remove("hidden");
    empty.classList.add("hidden");

    pageItems.forEach((m) => {
      const tr = document.createElement("tr");
      tr.className = "stitch-table-row";
      tr.dataset.id = m.id;
      tr.innerHTML = rowHTML(m);
      list.appendChild(tr);
    });

    renderPagination(items.length, totalPages);
  }

  function updateDashboardStatsV2() {
    syncStatuses();
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const active = meetings.filter((m) => m.status !== "cancelled");
    const todayUpcoming = meetings.filter((m) => m.status === "scheduled" && m.date === today);
    const live = meetings.filter((m) => m.status === "in-progress");
    const next = meetings
      .filter((m) => m.status === "scheduled")
      .sort((a, b) => toDate(a, "startTime") - toDate(b, "startTime"))[0];

    const set = (id, v) => {
      const el = $(id);
      if (el) el.textContent = v;
    };
    set("kpi-total", meetings.length);
    set("kpi-total-sub", `${active.length} đang hiệu lực • ${meetings.length - active.length} đã hủy`);
    set("kpi-scheduled", todayUpcoming.length);
    set("kpi-inprogress", live.length);
    set("kpi-next-time", next ? next.startTime : "--:--");
    set("kpi-next-title", next ? `Gần nhất: ${next.title}` : "Chưa có cuộc họp sắp tới");

    // Cập nhật số đếm trên tab (nếu đang ở trang danh sách)
    if ($("ml-tabs")) {
      const counts = { upcoming: 0, past: 0, cancelled: 0 };
      meetings.forEach((m) => {
        counts[bucketOf(m)]++;
      });
      document.querySelectorAll("[data-ml-count]").forEach((c) => {
        c.textContent = counts[c.dataset.mlCount];
      });
    }
  }

  // Làm mới widget "Tra cứu phòng trống" để phòng vừa được giải phóng hiển thị khả dụng ngay
  function refreshRoomAvailability() {
    if (typeof renderFinderRoomCards === "function" && $("finder-room-cards")) {
      renderFinderRoomCards();
    }
  }

  // ===================================================================
  // 5. CHỈNH SỬA CUỘC HỌP (US 2.0)
  //    - Prefill: do openEditModal() của main.js đảm nhiệm (+ chặn cuộc họp
  //      đã hủy / đã diễn ra)
  //    - Lưu: chặn submit ở giai đoạn capture, gọi PUT /api/meetings/:id
  // ===================================================================
  const _openEditModal = window.openEditModal;
  window.openEditModal = function (id) {
    const m = findMeeting(id);
    if (!m) {
      showToast({ type: "error", title: "Không tìm thấy cuộc họp", message: "Cuộc họp có thể đã bị xóa." });
      return;
    }
    const st = effectiveStatus(m);
    if (st === "cancelled") {
      showToast({ type: "warning", title: "Không thể chỉnh sửa", message: "Cuộc họp này đã bị hủy." });
      return;
    }
    if (st === "completed") {
      showToast({ type: "warning", title: "Không thể chỉnh sửa", message: "Cuộc họp này đã diễn ra." });
      return;
    }
    _openEditModal(id);
  };

  function setSubmitLoading(loading, idleLabel) {
    const btn = $("btn-submit");
    const text = $("submit-text");
    const spin = $("submit-spinner");
    const icon = $("submit-icon");
    if (btn) btn.disabled = loading;
    if (spin) spin.classList.toggle("hidden", !loading);
    if (icon) icon.classList.toggle("hidden", loading);
    if (text) text.textContent = loading ? "Đang cập nhật..." : idleLabel;
  }

  function shakeModal() {
    const card = document.querySelector(".meeting-modal-card");
    if (!card) return;
    card.classList.remove("stitch-shake");
    void card.offsetWidth;
    card.classList.add("stitch-shake");
  }

  function showFormError(title, desc) {
    const g = $("global-error");
    const gt = $("global-error-title");
    const gd = $("global-error-desc");
    if (gt) gt.textContent = title;
    if (gd) gd.textContent = desc;
    if (g) g.classList.remove("hidden");
    shakeModal();
  }

  function handleEditSubmit(editId) {
    const m = findMeeting(editId);
    if (!m) {
      showFormError("Không tìm thấy cuộc họp", "Cuộc họp có thể đã bị xóa. Vui lòng tải lại trang.");
      return;
    }

    // Chọn trạng thái "Đã hủy" trong form sửa -> chuyển sang luồng hủy có xác nhận
    const statusSel = $("meeting-status");
    if (statusSel && statusSel.value === "cancelled" && m.status !== "cancelled") {
      closeMeetingModal();
      openCancelDialog(editId);
      return;
    }

    // 1) Validate phía client (tiêu đề, giờ kết thúc > giờ bắt đầu, 5 phút – 24 giờ, phòng, trùng lịch…)
    const v = validateMeetingForm(editId);
    if (!v.isValid) return;
    const d = v.data;

    // 2) Không cho dời lịch về quá khứ
    const startChanged = d.date !== m.date || d.startTime !== m.startTime;
    if (startChanged && new Date(d.startTimeISO).getTime() < Date.now() - 60000) {
      const msg = $("time-error-msg");
      const txt = $("time-error-text");
      if (txt) txt.textContent = "Không thể dời cuộc họp về thời điểm đã qua.";
      if (msg) msg.classList.remove("hidden");
      ["meeting-date", "meeting-start"].forEach((i) => $(i) && $(i).classList.add("has-error", "is-invalid"));
      showFormError("Thông tin cuộc họp chưa hợp lệ", "Vui lòng chọn thời gian bắt đầu trong tương lai.");
      return;
    }

    submitEdit(editId, m, d);
  }

  async function submitEdit(editId, m, d) {
    setSubmitLoading(true, "Cập nhật cuộc họp");

    const payload = {
      title: d.title,
      description: d.description || null,
      startTime: d.startTimeISO,
      endTime: d.endTimeISO,
      organizerId: d.organizerId,
      roomId: d.roomId,
      isRecurring: Boolean(d.isRecurring),
      participantIds: d.participantIds,
      equipmentIds: d.equipmentIds
    };

    let res;
    try {
      res = await MeetingAPI.update(editId, payload);
    } catch (err) {
      console.error("[meeting-lifecycle] update lỗi:", err);
      res = { success: false, message: "Có lỗi không mong muốn khi cập nhật. Vui lòng thử lại." };
    }

    if (!res.success) {
      setSubmitLoading(false, "Cập nhật cuộc họp");
      if (res.isConflict) {
        const alertBox = $("room-conflict-alert");
        const alertText = $("room-conflict-text");
        if (alertBox && alertText) {
          alertText.innerHTML = `<strong>Máy chủ thông báo:</strong> ${esc(res.message)}`;
          alertBox.classList.remove("hidden");
        }
        const sel = $("meeting-room");
        if (sel) sel.classList.add("has-error", "is-invalid");
        showFormError("Xung đột lịch đặt phòng (409 Conflict)", res.message);
      } else if (res.isNotFound) {
        showFormError("Không tìm thấy cuộc họp (404)", res.message);
      } else {
        showFormError("Máy chủ từ chối yêu cầu", res.message);
      }
      showToast({ type: "error", title: "Cập nhật thất bại", message: res.message });
      return;
    }

    // 3) Cập nhật dữ liệu cục bộ
    Object.assign(m, {
      title: d.title,
      tag: d.tag,
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      time: d.timeDisplay,
      roomId: d.roomObj.id,
      roomName: d.roomObj.name,
      capacity: d.roomObj.capacity,
      organizerId: d.organizerObj.id,
      host: d.organizerObj.name,
      location: d.roomObj.name,
      participants: d.participants.length ? d.participants : [d.organizerObj.name],
      participantIds: d.participantIds,
      notes: d.description,
      isRecurring: d.isRecurring,
      equipmentIds: d.equipmentIds,
      equipmentNames: d.equipmentNames,
      startTimeISO: d.startTimeISO,
      endTimeISO: d.endTimeISO
    });
    m.status = effectiveStatus(m);
    persistMeetingsToStorage();

    setSubmitLoading(false, "Cập nhật cuộc họp");
    closeMeetingModal();
    renderMeetingTableV2();
    updateDashboardStatsV2();
    refreshRoomAvailability();

    showToast({
      type: "success",
      title: "Đã cập nhật cuộc họp",
      message: res.isFallback
        ? `“${d.title}” đã được lưu cục bộ (Backend chưa bật).`
        : `“${d.title}” đã được đồng bộ vào CSDL.`
    });
  }

  // Chặn submit của #meeting-form khi đang SỬA (có meeting-id). Tạo mới vẫn do main.js xử lý.
  document.addEventListener(
    "submit",
    function (ev) {
      if (!ev.target || ev.target.id !== "meeting-form") return;
      const idEl = $("meeting-id");
      if (!idEl || !idEl.value) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      handleEditSubmit(Number(idEl.value));
    },
    true
  );

  // ===================================================================
  // 6. HỦY CUỘC HỌP + GIẢI PHÓNG PHÒNG (US 9.0)
  // ===================================================================
  const cancelCtx = { id: null, busy: false };

  function ensureCancelDialog() {
    let ov = $("ml-cancel-overlay");
    if (ov) return ov;

    ov = document.createElement("div");
    ov.id = "ml-cancel-overlay";
    ov.className = "modal-overlay hidden";
    ov.setAttribute("role", "alertdialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-labelledby", "ml-cancel-title");
    ov.innerHTML = `
      <div class="ml-confirm-card">
        <div class="ml-confirm-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
        <h3 id="ml-cancel-title" class="ml-confirm-title">Hủy cuộc họp này?</h3>
        <p class="ml-confirm-text">Bạn có chắc chắn muốn hủy cuộc họp này không? Phòng họp sẽ được giải phóng ngay để người khác có thể đặt.</p>

        <div class="ml-confirm-summary">
          <div class="ml-confirm-sum-title" id="ml-cancel-sum-title"></div>
          <div class="ml-confirm-sum-line"><i class="bi bi-calendar3"></i><span id="ml-cancel-sum-time"></span></div>
          <div class="ml-confirm-sum-line"><i class="bi bi-door-open"></i><span id="ml-cancel-sum-room"></span></div>
        </div>

        <label for="ml-cancel-reason" class="ml-confirm-label">
          Lý do hủy <span class="ml-optional">(không bắt buộc)</span>
        </label>
        <textarea id="ml-cancel-reason" class="ml-confirm-textarea" rows="3"
                  maxlength="${CONFIG.CANCEL_REASON_MAX}" placeholder="Ví dụ: Trùng lịch với cuộc họp khác, người tham gia vắng mặt..."></textarea>
        <div class="ml-confirm-counter" id="ml-cancel-counter">0/${CONFIG.CANCEL_REASON_MAX}</div>

        <div id="ml-cancel-error" class="ml-confirm-error hidden" role="alert">
          <i class="bi bi-exclamation-octagon-fill"></i><span id="ml-cancel-error-text"></span>
        </div>

        <div class="ml-confirm-actions">
          <button type="button" id="ml-cancel-keep" class="ml-btn-secondary">Giữ lại cuộc họp</button>
          <button type="button" id="ml-cancel-confirm" class="ml-btn-danger">
            <span class="ml-spinner hidden" id="ml-cancel-spinner"></span>
            <i class="bi bi-x-circle" id="ml-cancel-icon"></i>
            <span id="ml-cancel-confirm-text">Xác nhận hủy</span>
          </button>
        </div>
      </div>`;
    document.body.appendChild(ov);

    $("ml-cancel-keep").addEventListener("click", closeCancelDialog);
    $("ml-cancel-confirm").addEventListener("click", confirmCancel);
    ov.addEventListener("click", (e) => {
      if (e.target === ov) closeCancelDialog();
    });
    $("ml-cancel-reason").addEventListener("input", (e) => {
      $("ml-cancel-counter").textContent = `${e.target.value.length}/${CONFIG.CANCEL_REASON_MAX}`;
    });
    return ov;
  }

  function openCancelDialog(id) {
    const m = findMeeting(id);
    if (!m) {
      showToast({ type: "error", title: "Không tìm thấy cuộc họp", message: "Cuộc họp có thể đã bị xóa." });
      return;
    }
    const st = effectiveStatus(m);
    if (st === "cancelled") {
      showToast({ type: "info", title: "Cuộc họp đã được hủy trước đó" });
      return;
    }
    if (st === "completed") {
      showToast({ type: "warning", title: "Không thể hủy", message: "Cuộc họp này đã diễn ra." });
      return;
    }

    const ov = ensureCancelDialog();
    cancelCtx.id = Number(id);
    cancelCtx.busy = false;

    $("ml-cancel-sum-title").textContent = m.title;
    $("ml-cancel-sum-time").textContent = `${formatDate(m.date)} • ${m.time || `${m.startTime} - ${m.endTime}`}`;
    $("ml-cancel-sum-room").textContent = m.roomName || m.location || "—";
    $("ml-cancel-reason").value = "";
    $("ml-cancel-counter").textContent = `0/${CONFIG.CANCEL_REASON_MAX}`;
    $("ml-cancel-error").classList.add("hidden");
    setCancelBusy(false);

    ov.classList.remove("hidden");
    setTimeout(() => $("ml-cancel-reason").focus(), 80);
  }

  function closeCancelDialog() {
    if (cancelCtx.busy) return;
    const ov = $("ml-cancel-overlay");
    if (ov) ov.classList.add("hidden");
    cancelCtx.id = null;
  }

  function setCancelBusy(busy) {
    cancelCtx.busy = busy;
    const btn = $("ml-cancel-confirm");
    const keep = $("ml-cancel-keep");
    if (btn) btn.disabled = busy;
    if (keep) keep.disabled = busy;
    const sp = $("ml-cancel-spinner");
    const ic = $("ml-cancel-icon");
    const tx = $("ml-cancel-confirm-text");
    if (sp) sp.classList.toggle("hidden", !busy);
    if (ic) ic.classList.toggle("hidden", busy);
    if (tx) tx.textContent = busy ? "Đang hủy..." : "Xác nhận hủy";
  }

  async function confirmCancel() {
    if (cancelCtx.busy || !cancelCtx.id) return;
    const id = cancelCtx.id;
    const m = findMeeting(id);
    if (!m) return;

    const reason = $("ml-cancel-reason").value.trim();
    $("ml-cancel-error").classList.add("hidden");
    setCancelBusy(true);

    let res;
    try {
      res = await MeetingAPI.cancel(id, reason);
    } catch (err) {
      console.error("[meeting-lifecycle] cancel lỗi:", err);
      res = { success: false, message: "Có lỗi không mong muốn khi hủy cuộc họp. Vui lòng thử lại." };
    }

    if (!res.success) {
      setCancelBusy(false);
      $("ml-cancel-error-text").textContent = res.message;
      $("ml-cancel-error").classList.remove("hidden");
      return;
    }

    // --- Thành công: cập nhật dữ liệu + giao diện ngay lập tức
    const roomName = m.roomName || m.location || "";
    m.status = "cancelled";
    m.cancelReason = reason;
    m.cancelledAt = new Date().toISOString();
    persistMeetingsToStorage();

    cancelCtx.busy = false;
    closeCancelDialog();
    closeDetailModal();

    updateDashboardStatsV2();   // KPI + số đếm trên tab
    refreshRoomAvailability();  // phòng được giải phóng hiển thị "Sẵn sàng" ngay

    showToast({
      type: "success",
      title: "Đã hủy cuộc họp",
      message: `${roomName ? roomName + " đã" : "Phòng họp đã"} được giải phóng khung giờ ${m.time || `${m.startTime} - ${m.endTime}`} ngày ${formatDate(m.date)}.`,
      actionLabel: "Xem tab Đã hủy",
      onAction: () => {
        ui.tab = "cancelled";
        ui.page = 1;
        renderMeetingTableV2();
      },
      duration: 7000
    });

    // Hiệu ứng: đổi tag dòng sang "Đã hủy" rồi mờ dần, sau đó làm mới danh sách
    const tr = document.querySelector(`#meetings-list tr[data-id="${id}"]`);
    if (tr) {
      tr.classList.add("ml-row-cancelled");
      const cell = tr.querySelector(".ml-status-cell");
      if (cell) cell.innerHTML = statusPill("cancelled");
      const link = tr.querySelector(".meeting-title-link");
      if (link) link.classList.add("title-cancelled");
      tr.querySelectorAll('[data-ml-action="edit"], [data-ml-action="cancel"]').forEach((b) => b.remove());
      setTimeout(renderMeetingTableV2, 950);
    } else {
      renderMeetingTableV2();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCancelDialog();
  });

  // ===================================================================
  // 7. MODAL CHI TIẾT: thêm nút Sửa / Hủy + hiển thị lý do hủy
  // ===================================================================
  const _openDetailModal = window.openDetailModal;
  window.openDetailModal = function (id) {
    _openDetailModal(id);
    decorateDetail(Number(id));
  };

  function decorateDetail(id) {
    const m = findMeeting(id);
    const footer = document.querySelector("#detail-overlay .stitch-modal-footer");
    const content = $("detail-content");
    if (!m || !footer) return;

    footer.querySelectorAll(".ml-detail-actions").forEach((n) => n.remove());
    const st = effectiveStatus(m);

    // Trạng thái hiển thị theo thời gian thực
    if (content) {
      content.querySelectorAll(".stitch-status-pill").forEach((p) => {
        p.outerHTML = statusPill(st);
      });
      if (st === "cancelled") {
        content.insertAdjacentHTML(
          "beforeend",
          `<div class="ml-cancel-info">
             <div class="ml-cancel-info-title"><i class="bi bi-x-circle-fill me-1"></i>Cuộc họp đã bị hủy</div>
             <div class="ml-cancel-info-line">Lý do: <strong>${esc(m.cancelReason || "Không nêu lý do")}</strong></div>
             ${m.cancelledAt ? `<div class="ml-cancel-info-line">Thời điểm hủy: ${esc(new Date(m.cancelledAt).toLocaleString("vi-VN"))}</div>` : ""}
           </div>`
        );
      }
    }

    if (st === "scheduled" || st === "in-progress") {
      const wrap = document.createElement("div");
      wrap.className = "ml-detail-actions";
      wrap.innerHTML = `
        <button type="button" class="btn btn-outline-primary ml-detail-edit"><i class="bi bi-pencil me-1"></i>Chỉnh sửa</button>
        <button type="button" class="ml-btn-danger ml-detail-cancel"><i class="bi bi-x-circle"></i><span>Hủy cuộc họp</span></button>`;
      footer.insertBefore(wrap, footer.firstChild);
      wrap.querySelector(".ml-detail-edit").addEventListener("click", () => {
        closeDetailModal();
        openEditModal(id);
      });
      wrap.querySelector(".ml-detail-cancel").addEventListener("click", () => {
        closeDetailModal();
        openCancelDialog(id);
      });
    }
  }

  // ===================================================================
  // 8. GẮN VÀO HỆ THỐNG
  // ===================================================================
  window.renderMeetingsPage = renderMeetingsPageV2;
  window.renderMeetingTable = renderMeetingTableV2;
  window.updateDashboardStats = updateDashboardStatsV2;
  routes["/meetings"] = renderMeetingsPageV2;

  // Cho phép gọi từ nơi khác (ví dụ trang Home) nếu cần
  window.MeetingLifecycle = {
    showToast,
    openCancelDialog,
    openEditModal: (id) => window.openEditModal(id),
    effectiveStatus,
    syncFromServer,
    config: CONFIG
  };

  // Nếu script được nạp sau khi trang đã sẵn sàng -> render lại ngay
  if (document.readyState !== "loading") router();
})();
