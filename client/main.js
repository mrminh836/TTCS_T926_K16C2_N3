// =====================================================
// PRODUCT BACKLOG - MEETING MANAGEMENT
// JavaScript thuần
// Bootstrap 5 + Bootstrap Icons
// Router Base + CRUD + Search + Filter
// =====================================================


// =====================================================
// 1. DỮ LIỆU CHUẨN DATABASE (ROOMS, MEETINGS, USERS)
// =====================================================

const ROOMS = [
  { id: 1, name: "Phòng Tokyo (Tầng 4)", capacity: 20 },
  { id: 2, name: "Phòng Silicon (Tầng 2)", capacity: 12 },
  { id: 3, name: "Phòng Hội Nghị A", capacity: 30 },
  { id: 4, name: "Phòng Grand Board", capacity: 50 },
  { id: 5, name: "Phòng VIP", capacity: 10 }
];

const USERS = [
  { id: 1, name: "Nguyễn Văn An", email: "an.nguyen@company.com", role: "Employee" },
  { id: 2, name: "Trần Thu Hà", email: "ha.tran@company.com", role: "Manager" },
  { id: 3, name: "Lê Minh Tuấn", email: "tuan.le@company.com", role: "Employee" },
  { id: 4, name: "Hoàng Bảo Ngọc", email: "ngoc.hoang@company.com", role: "HR Lead" },
  { id: 5, name: "Phạm Quốc Dũng", email: "dung.pham@company.com", role: "Tech Lead" },
  { id: 6, name: "Vũ Tuấn Kiệt", email: "kiet.vu@company.com", role: "Director" }
];

const EQUIPMENTS = [
  { id: 1, name: "Máy chiếu Full HD", type: "Visual", status: "Available" },
  { id: 2, name: "Màn hình TV 75\"", type: "Display", status: "Available" },
  { id: 3, name: "Micro & Loa họp", type: "Audio", status: "Available" },
  { id: 4, name: "Bảng trắng viết", type: "Stationery", status: "Available" }
];

let meetings = [
  {
    id: 1,
    title: "Họp Sprint Review nhóm K16C2",
    tag: "Sprint 24",
    date: "2026-09-26",
    startTime: "09:00",
    endTime: "10:30",
    time: "09:00 - 10:30",
    roomId: 3,
    roomName: "Phòng Hội Nghị A",
    capacity: 30,
    organizerId: 1,
    host: "Nguyễn Văn An",
    participants: [
      "Nguyễn Văn An",
      "Trần Thu Hà",
      "Lê Minh Tuấn",
      "Phạm Quốc Dũng"
    ],
    status: "in-progress",
    notes: "Đánh giá kết quả Sprint và thống nhất công việc cho Sprint tiếp theo."
  },

  {
    id: 2,
    title: "Họp Ban điều hành Quý 4/2026",
    tag: "Quan trọng",
    date: "2026-09-26",
    startTime: "14:00",
    endTime: "16:00",
    time: "14:00 - 16:00",
    roomId: 1,
    roomName: "Phòng Tokyo (Tầng 4)",
    capacity: 20,
    organizerId: 2,
    host: "Trần Thu Hà",
    participants: [
      "Trần Thu Hà",
      "Nguyễn Minh Lượng",
      "Đặng Hùng",
      "Vũ Tuấn Kiệt"
    ],
    status: "scheduled",
    notes: "Báo cáo chỉ số tăng trưởng doanh thu và phê duyệt ngân sách R&D."
  },

  {
    id: 3,
    title: "Sync Design System & UI/UX Audit",
    tag: "Thiết kế",
    date: "2026-09-27",
    startTime: "10:00",
    endTime: "11:00",
    time: "10:00 - 11:00",
    roomId: 2,
    roomName: "Phòng Silicon (Tầng 2)",
    capacity: 12,
    organizerId: 3,
    host: "Lê Minh Tuấn",
    participants: [
      "Lê Minh Tuấn",
      "Vũ Ngọc",
      "Trần Văn A"
    ],
    status: "scheduled",
    notes: "Rà soát tính nhất quán của bộ component Form và Dashboard."
  },

  {
    id: 4,
    title: "Phỏng vấn ứng viên Senior Frontend Lead",
    tag: "Tuyển dụng",
    date: "2026-09-27",
    startTime: "15:00",
    endTime: "15:45",
    time: "15:00 - 15:45",
    roomId: 5,
    roomName: "Phòng VIP",
    capacity: 10,
    organizerId: 4,
    host: "Hoàng Bảo Ngọc",
    participants: [
      "Hoàng Bảo Ngọc",
      "Nguyễn Minh Lượng",
      "Anh Tuấn"
    ],
    status: "scheduled",
    notes: "Đánh giá chuyên môn kỹ thuật và kinh nghiệm React/Tailwind."
  },

  {
    id: 5,
    title: "Daily Standup Đội phát triển Core Platform",
    tag: "Hằng ngày",
    date: "2026-09-25",
    startTime: "08:45",
    endTime: "09:15",
    time: "08:45 - 09:15",
    roomId: 2,
    roomName: "Phòng Silicon (Tầng 2)",
    capacity: 12,
    organizerId: 5,
    host: "Phạm Quốc Dũng",
    participants: [
      "Phạm Quốc Dũng",
      "Trần Hùng",
      "Lê Văn B"
    ],
    status: "completed",
    notes: "Cập nhật tiến độ API Gateway và giải quyết blocker."
  },

  {
    id: 6,
    title: "Kick-off Dự án Chuyển đổi số Khách hàng",
    tag: "Dự án mới",
    date: "2026-09-24",
    startTime: "14:00",
    endTime: "15:30",
    time: "14:00 - 15:30",
    roomId: 4,
    roomName: "Phòng Grand Board",
    capacity: 50,
    organizerId: 6,
    host: "Vũ Tuấn Kiệt",
    participants: [
      "Vũ Tuấn Kiệt",
      "Nguyễn Dung",
      "Trần Văn A"
    ],
    status: "cancelled",
    notes: "Thống nhất phạm vi triển khai và kế hoạch bàn giao milestone 1."
  }
];

let currentStatusFilter = "";
let currentRoomFilter = "";

function getInitials(name) {
  if (!name) return "MP";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getHostColor(name) {
  const colors = ["#2563eb", "#0284c7", "#059669", "#7c3aed", "#d97706", "#475569"];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function calcDurationString(start, end) {
  if (!start || !end) return "60m";
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  const diff = (eH * 60 + eM) - (sH * 60 + sM);
  if (diff <= 0) return "--";
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h 00m`;
  return `${mins}m`;
}

function exportToCSV() {
  const headers = [
    "Mã cuộc họp (MeetingID)",
    "Tiêu đề (Title)",
    "Nhãn phân loại (Tag)",
    "Ngày họp",
    "Thời gian (StartTime - EndTime)",
    "Phòng họp (RoomName)",
    "Sức chứa (Capacity)",
    "Mã phòng (RoomID)",
    "Người tổ chức (Host)",
    "Mã người tổ chức (OrganizerID)",
    "Người tham gia (Participants)",
    "Trạng thái đặt phòng (BookingStatus)",
    "Lặp lại định kỳ (IsRecurring)",
    "Thiết bị yêu cầu (Equipments)",
    "Mô tả / Ghi chú (Description)"
  ];
  const rows = meetings.map(m => [
    m.id,
    `"${(m.title || '').replace(/"/g, '""')}"`,
    `"${(m.tag || '').replace(/"/g, '""')}"`,
    m.date,
    `"${m.time || (m.startTime + ' - ' + m.endTime)}"`,
    `"${(m.roomName || m.location || '').replace(/"/g, '""')}"`,
    m.capacity || 20,
    m.roomId || 1,
    `"${(m.host || '').replace(/"/g, '""')}"`,
    m.organizerId || 1,
    `"${(m.participants || []).join('; ').replace(/"/g, '""')}"`,
    `"${getStatusText(m.status)}"`,
    m.isRecurring ? '"Có"' : '"Không"',
    `"${(m.equipmentNames || (m.equipmentIds ? m.equipmentIds.map(id => EQUIPMENTS.find(e => e.id === id)?.name).filter(Boolean) : [])).join(', ')}"`,
    `"${(m.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `danh_sach_cuoc_hop_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// =====================================================
// TÍNH TOÁN THỜI LƯỢNG CUỘC HỌP (STITCH FORM SPEC)
// =====================================================

function calcDuration() {
  const startInput = document.getElementById("meeting-start");
  const endInput = document.getElementById("meeting-end");
  const durationBadge = document.getElementById("duration-badge");
  const durationText = document.getElementById("duration-text");
  const timeErrorMsg = document.getElementById("time-error-msg");

  if (!startInput || !endInput || !durationBadge || !durationText || !timeErrorMsg) {
    return true;
  }

  const start = startInput.value;
  const end = endInput.value;

  if (!start || !end) {
    durationBadge.classList.add("hidden");
    timeErrorMsg.classList.add("hidden");
    endInput.classList.remove("has-error");
    return true;
  }

  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  const diff = endTotal - startTotal;

  if (diff <= 0) {
    // Trạng thái lỗi: endTime <= startTime
    timeErrorMsg.classList.remove("hidden");
    durationBadge.className = "stitch-duration-badge error";
    durationText.innerText = "Thời gian không hợp lệ";
    endInput.classList.add("has-error");
    durationBadge.classList.remove("hidden");
    return false;
  } else {
    timeErrorMsg.classList.add("hidden");
    durationBadge.className = "stitch-duration-badge";
    endInput.classList.remove("has-error");

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    let formatted = "";
    if (hours > 0 && minutes > 0) {
      formatted = `${hours} giờ ${minutes} phút`;
    } else if (hours > 0) {
      formatted = `${hours} giờ`;
    } else {
      formatted = `${minutes} phút`;
    }

    durationText.innerText = `Thời lượng: ${formatted}`;
    durationBadge.classList.remove("hidden");
    return true;
  }
}


// =====================================================
// 2. BIẾN TOÀN CỤC
// =====================================================

const app = document.getElementById("app");

const modalOverlay = document.getElementById("modal-overlay");
const detailOverlay = document.getElementById("detail-overlay");


// =====================================================
// 3. ROUTER
// =====================================================

const routes = {
  "/": renderHome,
  "/home": renderHome,
  "/meetings": renderMeetingsPage,
  "/404": render404
};


function getCurrentRoute() {
  const hash = window.location.hash;

  if (!hash || hash === "#") {
    return "/";
  }

  return hash.substring(1);
}


function updateActiveNav(route) {
  const navLinks = document.querySelectorAll(".nav-link-custom");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const linkRoute = href ? href.replace("#", "") : "";

    const isHome =
      (route === "/" || route === "/home") &&
      (linkRoute === "/" || linkRoute === "/home");
    const isMatch = route === linkRoute;

    if (isHome || isMatch) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}


function router() {
  const route = getCurrentRoute();

  const page = routes[route] || render404;

  page();
  updateActiveNav(route);
}


window.addEventListener("hashchange", router);
document.addEventListener("DOMContentLoaded", router);


// =====================================================
// 4. HOME
// =====================================================

// =====================================================
// 4. HOME (ENTERPRISE HERO LANDING)
// =====================================================

function renderHome() {

  const totalCount = meetings.length;
  const scheduledCount = meetings.filter(m => m.status === "scheduled").length;

  app.innerHTML = `
    <section class="page home-page-enterprise">

      <div class="hero-badge">
        <span class="hero-badge-dot"></span>
        <span>Enterprise Sync • Meeting Suite SaaS</span>
      </div>

      <h1 class="hero-title">
        Tối ưu hóa Lịch họp & Phân bổ Tài nguyên Thông minh
      </h1>

      <p class="hero-subtitle">
        Giải pháp doanh nghiệp điều phối phòng họp, trang thiết bị và thời gian tự động, loại bỏ 100% tình trạng đặt trùng phòng với cơ chế Row-Lock độc quyền.
      </p>

      <div class="hero-actions">
        <a href="#/meetings" class="btn btn-primary stitch-btn-submit hero-btn-main">
          <i class="bi bi-calendar3 me-2"></i> Vào Quản lý cuộc họp
        </a>

        <button type="button" onclick="openAddModal()" class="btn btn-outline-secondary stitch-btn-cancel hero-btn-sub">
          <i class="bi bi-plus-lg me-1"></i> Tạo cuộc họp mới
        </button>
      </div>

      <div class="hero-metrics-strip mt-5">
        <div class="hero-metric-item">
          <div class="hero-metric-number">${totalCount}</div>
          <div class="hero-metric-label">Cuộc họp trong hệ thống</div>
        </div>
        <div class="hero-metric-divider"></div>
        <div class="hero-metric-item">
          <div class="hero-metric-number text-primary">${scheduledCount}</div>
          <div class="hero-metric-label">Sắp diễn ra tuần này</div>
        </div>
        <div class="hero-metric-divider"></div>
        <div class="hero-metric-item">
          <div class="hero-metric-number text-success">100%</div>
          <div class="hero-metric-label">Chống xung đột lịch trùng</div>
        </div>
      </div>

      <div class="features-grid mt-5">
        <div class="feature-card">
          <div class="feature-icon feature-blue">
            <i class="bi bi-shield-check"></i>
          </div>
          <h3 class="feature-title">Chống Đặt Trùng Lịch</h3>
          <p class="feature-desc">Cơ chế Khóa dòng (FOR UPDATE) chống xung đột Race Condition, bảo đảm an toàn dữ liệu 100%.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon feature-sky">
            <i class="bi bi-cpu"></i>
          </div>
          <h3 class="feature-title">Quản Lý Phòng & Thiết Bị</h3>
          <p class="feature-desc">Theo dõi trực quan trạng thái sức chứa phòng họp, máy chiếu, màn hình TV và thiết bị kèm theo.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon feature-emerald">
            <i class="bi bi-arrow-repeat"></i>
          </div>
          <h3 class="feature-title">Đồng Bộ & Báo Cáo</h3>
          <p class="feature-desc">Tích hợp chuẩn hóa Google Calendar, Microsoft 365, thống kê tần suất và xuất báo cáo trực quan.</p>
        </div>
      </div>

    </section>
  `;
}


// =====================================================
// 5. TRANG QUẢN LÝ CUỘC HỌP (ENTERPRISE STITCH SPEC)
// =====================================================

function renderMeetingsPage() {
  const totalCount = meetings.length;
  const scheduledCount = meetings.filter(m => m.status === "scheduled").length;
  const inProgressCount = meetings.filter(m => m.status === "in-progress").length;
  const completedCount = meetings.filter(m => m.status === "completed").length;
  const cancelledCount = meetings.filter(m => m.status === "cancelled").length;

  app.innerHTML = `
    <div id="meetings-section" class="meetings-view-wrapper">

      <!-- Breadcrumbs & Page Header -->
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
          <button type="button" id="btn-export-excel" class="btn-stitch-export" title="Xuất danh sách ra file CSV">
            <i class="bi bi-file-earmark-arrow-down"></i>
            <span>Xuất báo cáo / Excel</span>
          </button>

          <button type="button" id="btn-add-meeting" class="btn-stitch-create">
            <i class="bi bi-plus-circle-fill"></i>
            <span>Tạo cuộc họp mới</span>
          </button>
        </div>
      </div>

      <!-- KPI Overview Cards (3 Metrics) -->
      <div class="kpi-metrics-grid mb-4">
        <!-- KPI 1 -->
        <div class="kpi-card">
          <div class="kpi-card-body">
            <div class="kpi-card-content">
              <span class="kpi-label">Tổng cuộc họp của tôi</span>
              <div class="kpi-value" id="kpi-total">${totalCount}</div>
            </div>
            <div class="kpi-icon-box kpi-blue">
              <i class="bi bi-calendar-week"></i>
            </div>
          </div>
          <div class="kpi-delta-row">
            <span class="kpi-chip-positive">
              <i class="bi bi-graph-up-arrow"></i> +12%
            </span>
            <span class="kpi-delta-text">so với tuần trước</span>
          </div>
          <div class="kpi-bottom-bar bar-blue"></div>
        </div>

        <!-- KPI 2 -->
        <div class="kpi-card">
          <div class="kpi-card-body">
            <div class="kpi-card-content">
              <span class="kpi-label">Sắp diễn ra hôm nay</span>
              <div class="kpi-value d-flex align-items-baseline gap-1">
                <span id="kpi-scheduled">${scheduledCount}</span>
                <span class="kpi-value-unit">cuộc họp</span>
              </div>
            </div>
            <div class="kpi-icon-box kpi-sky">
              <i class="bi bi-clock-history"></i>
            </div>
          </div>
          <div class="kpi-delta-row">
            <span class="kpi-chip-neutral">
              <span class="pulse-dot-primary"></span> 09:00 AM
            </span>
            <span class="kpi-delta-text truncate">Gần nhất: Sprint Review</span>
          </div>
          <div class="kpi-bottom-bar bar-sky"></div>
        </div>

        <!-- KPI 3 -->
        <div class="kpi-card">
          <div class="kpi-card-body">
            <div class="kpi-card-content">
              <span class="kpi-label">Đang diễn ra</span>
              <div class="kpi-value d-flex align-items-baseline gap-1">
                <span id="kpi-inprogress">${inProgressCount}</span>
                <span class="kpi-value-unit">phòng live</span>
              </div>
            </div>
            <div class="kpi-icon-box kpi-amber">
              <i class="bi bi-broadcast"></i>
            </div>
          </div>
          <div class="kpi-delta-row">
            <span class="kpi-chip-live">
              <span class="ping-dot-live"></span> Đang diễn ra
            </span>
            <span class="kpi-delta-text truncate">Phòng họp trực tiếp</span>
          </div>
          <div class="kpi-bottom-bar bar-amber"></div>
        </div>
      </div>

      <!-- Toolbar & Multi-Filter Section -->
      <div class="filter-panel-card mb-4">
        <!-- Top row: Search + Status Tabs -->
        <div class="filter-top-row">
          <div class="search-input-wrapper">
            <label for="search-meeting" class="visually-hidden">Tìm kiếm cuộc họp</label>
            <i class="bi bi-search search-icon-left"></i>
            <input
              type="text"
              id="search-meeting"
              class="stitch-search-field"
              placeholder="Tìm theo tiêu đề, người tổ chức hoặc nội dung cuộc họp..."
              aria-label="Tìm kiếm cuộc họp"
            />
          </div>

          <div class="status-tab-group" id="status-tab-group">
            <button type="button" class="status-tab-item active" data-status="">
              Tất cả (${totalCount})
            </button>
            <button type="button" class="status-tab-item" data-status="scheduled">
              Sắp tới (${scheduledCount})
            </button>
            <button type="button" class="status-tab-item" data-status="in-progress">
              <span class="tab-pulse-dot"></span>
              Đang diễn ra (${inProgressCount})
            </button>
            <button type="button" class="status-tab-item" data-status="completed">
              Đã kết thúc (${completedCount})
            </button>
            <button type="button" class="status-tab-item" data-status="cancelled">
              Đã hủy (${cancelledCount})
            </button>
          </div>
        </div>

        <!-- Secondary Filter Row -->
        <div class="filter-bottom-row">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <div class="filter-select-wrapper">
              <label for="filter-room" class="visually-hidden">Lọc theo phòng họp</label>
              <i class="bi bi-door-open filter-icon-left"></i>
              <select id="filter-room" class="stitch-select-compact" aria-label="Lọc theo phòng họp">
                <option value="">Tất cả phòng họp</option>
                <option value="1">Phòng Tokyo (Tầng 4)</option>
                <option value="2">Phòng Silicon (Tầng 2)</option>
                <option value="3">Phòng Hội Nghị A</option>
                <option value="4">Phòng Grand Board</option>
                <option value="5">Phòng VIP</option>
              </select>
            </div>

            <button type="button" id="btn-reset-filters" class="btn-reset-link">
              <i class="bi bi-arrow-counterclockwise"></i>
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>

          <div class="filter-stats-text">
            Hiển thị <span id="filtered-count" class="fw-bold text-dark">${totalCount}</span> cuộc họp
          </div>
        </div>
      </div>

      <!-- Enterprise Data Table Container -->
      <div class="table-card-container mb-4">
        <div class="table-responsive">
          <table id="meetings-table" class="stitch-data-table">
            <thead>
              <tr>
                <th class="th-title">TIÊU ĐỀ CUỘC HỌP</th>
                <th class="th-time">THỜI GIAN & NGÀY</th>
                <th class="th-host">NGƯỜI TỔ CHỨC</th>
                <th class="th-room">PHÒNG HỌP & SỨC CHỨA</th>
                <th class="th-status">TRẠNG THÁI</th>
                <th class="th-actions text-end">THAO TÁC</th>
              </tr>
            </thead>
            <tbody id="meetings-list"></tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div id="empty-state" class="table-empty-state hidden">
          <div class="empty-icon-circle">
            <i class="bi bi-calendar-x"></i>
          </div>
          <h5 class="empty-state-title">Không tìm thấy cuộc họp nào</h5>
          <p class="empty-state-text">Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.</p>
        </div>

        <!-- Pagination Footer -->
        <div id="table-pagination-footer" class="table-pagination-footer">
          <div class="pagination-info">
            <span>Hiển thị <strong id="pag-from">1</strong> - <strong id="pag-to">${totalCount}</strong> trong tổng số <strong id="pag-total">${totalCount}</strong> cuộc họp</span>
          </div>

          <div class="pagination-controls">
            <button type="button" class="btn-page-nav" disabled>
              <i class="bi bi-chevron-left"></i>
            </button>
            <button type="button" class="btn-page-num active">1</button>
            <button type="button" class="btn-page-nav" disabled>
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

    </div>
  `;

  // Gắn sự kiện
  setupMeetingEvents();
  renderMeetingTable();
}

function updateDashboardStats() {
  const totalCount = meetings.length;
  const scheduledCount = meetings.filter(m => m.status === "scheduled").length;
  const inProgressCount = meetings.filter(m => m.status === "in-progress").length;
  const completedCount = meetings.filter(m => m.status === "completed").length;
  const cancelledCount = meetings.filter(m => m.status === "cancelled").length;

  const kpiTotal = document.getElementById("kpi-total");
  const kpiScheduled = document.getElementById("kpi-scheduled");
  const kpiInProgress = document.getElementById("kpi-inprogress");

  if (kpiTotal) kpiTotal.innerText = totalCount;
  if (kpiScheduled) kpiScheduled.innerText = scheduledCount;
  if (kpiInProgress) kpiInProgress.innerText = inProgressCount;

  const tabGroup = document.getElementById("status-tab-group");
  if (tabGroup) {
    const tabs = tabGroup.querySelectorAll(".status-tab-item");
    tabs.forEach(tab => {
      const st = tab.dataset.status;
      if (st === "") tab.innerText = `Tất cả (${totalCount})`;
      else if (st === "scheduled") tab.innerText = `Sắp tới (${scheduledCount})`;
      else if (st === "in-progress") tab.innerHTML = `<span class="tab-pulse-dot"></span> Đang diễn ra (${inProgressCount})`;
      else if (st === "completed") tab.innerText = `Đã kết thúc (${completedCount})`;
      else if (st === "cancelled") tab.innerText = `Đã hủy (${cancelledCount})`;
    });
  }
}

// =====================================================
// 6. TRANG 404
// =====================================================

function render404() {
  app.innerHTML = `
    <section class="page error-page">
      <div class="error-code">404</div>
      <h2>Không tìm thấy trang</h2>
      <p>Đường dẫn bạn truy cập không tồn tại.</p>
      <a href="#/" class="btn btn-primary stitch-btn-submit">
        <i class="bi bi-house me-1"></i> Về trang chủ
      </a>
    </section>
  `;
}

// =====================================================
// 7. GẮN EVENT CHO TRANG MEETING
// =====================================================

function setupMeetingEvents() {
  const addButton = document.getElementById("btn-add-meeting");
  const form = document.getElementById("meeting-form");
  const searchInput = document.getElementById("search-meeting");
  const exportBtn = document.getElementById("btn-export-excel");
  const tabGroup = document.getElementById("status-tab-group");
  const roomSelect = document.getElementById("filter-room");
  const btnResetFilters = document.getElementById("btn-reset-filters");
  const cancelButton = document.getElementById("btn-cancel");
  const closeModalButton = document.getElementById("btn-close-modal");
  const closeDetailButton = document.getElementById("btn-close-detail");
  const closeDetailBottom = document.getElementById("btn-close-detail-bottom");
  const meetingList = document.getElementById("meetings-list");

  // Nút thêm cuộc họp
  if (addButton) {
    addButton.addEventListener("click", openAddModal);
  }

  // Nút xuất báo cáo Excel/CSV
  if (exportBtn) {
    exportBtn.addEventListener("click", exportToCSV);
  }

  // Form submit
  if (form) {
    form.addEventListener("submit", saveMeeting);
  }

  // Tìm kiếm live
  if (searchInput) {
    searchInput.addEventListener("input", renderMeetingTable);
  }

  // Tab lọc trạng thái
  if (tabGroup) {
    tabGroup.addEventListener("click", function(e) {
      const target = e.target.closest(".status-tab-item");
      if (!target) return;
      tabGroup.querySelectorAll(".status-tab-item").forEach(p => p.classList.remove("active"));
      target.classList.add("active");
      currentStatusFilter = target.dataset.status;
      renderMeetingTable();
    });
  }

  // Lọc theo phòng họp (Rooms - Chuẩn Database)
  if (roomSelect) {
    roomSelect.addEventListener("change", function() {
      currentRoomFilter = roomSelect.value;
      renderMeetingTable();
    });
  }

  // Nút Đặt lại bộ lọc
  if (btnResetFilters) {
    btnResetFilters.addEventListener("click", function() {
      if (searchInput) searchInput.value = "";
      currentStatusFilter = "";
      currentRoomFilter = "";
      if (tabGroup) {
        tabGroup.querySelectorAll(".status-tab-item").forEach(p => p.classList.remove("active"));
        const allTab = tabGroup.querySelector('[data-status=""]');
        if (allTab) allTab.classList.add("active");
      }
      if (roomSelect) roomSelect.value = "";
      renderMeetingTable();
    });
  }

  // Hủy
  if (cancelButton) {
    cancelButton.addEventListener("click", closeMeetingModal);
  }

  // Nút đóng "X" trên modal
  if (closeModalButton) {
    closeModalButton.addEventListener("click", closeMeetingModal);
  }

  // Nút trên Success View
  const btnSuccessNew = document.getElementById("btn-success-new");
  if (btnSuccessNew) {
    btnSuccessNew.addEventListener("click", openAddModal);
  }

  const btnSuccessClose = document.getElementById("btn-success-close");
  if (btnSuccessClose) {
    btnSuccessClose.addEventListener("click", closeMeetingModal);
  }

  // Live validation trên input title
  const titleInput = document.getElementById("meeting-title");
  if (titleInput) {
    titleInput.addEventListener("input", function () {
      if (titleInput.value.trim().length > 0) {
        const titleError = document.getElementById("title-error");
        const titleErrorIcon = document.getElementById("title-error-icon");
        const globalError = document.getElementById("global-error");
        if (titleError) titleError.classList.add("hidden");
        if (titleErrorIcon) titleErrorIcon.classList.add("hidden");
        titleInput.classList.remove("has-error");
        if (globalError) globalError.classList.add("hidden");
      }
    });
  }

  // Live duration calculation khi chọn giờ bắt đầu hoặc giờ kết thúc
  const startInput = document.getElementById("meeting-start");
  const endInput = document.getElementById("meeting-end");
  if (startInput) {
    startInput.addEventListener("change", calcDuration);
    startInput.addEventListener("input", calcDuration);
  }
  if (endInput) {
    endInput.addEventListener("change", calcDuration);
    endInput.addEventListener("input", calcDuration);
  }

  // Chọn nhãn cuộc họp nhanh (Tag selector chips)
  window.selectTag = function(tag) {
    const tagInput = document.getElementById("meeting-tag");
    if (!tagInput) return;
    if (tagInput.value.trim() === tag) {
      tagInput.value = "";
    } else {
      tagInput.value = tag;
    }
    document.querySelectorAll(".btn-tag-chip-select").forEach(b => {
      if (b.dataset.tag === tagInput.value && tagInput.value !== "") {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
  };

  const tagInput = document.getElementById("meeting-tag");
  if (tagInput) {
    tagInput.addEventListener("input", function() {
      const val = this.value.trim();
      document.querySelectorAll(".btn-tag-chip-select").forEach(b => {
        if (b.dataset.tag === val) b.classList.add("active");
        else b.classList.remove("active");
      });
    });
  }

  // Đóng detail
  if (closeDetailButton) {
    closeDetailButton.addEventListener("click", closeDetailModal);
  }
  if (closeDetailBottom) {
    closeDetailBottom.addEventListener("click", closeDetailModal);
  }

  // Các nút Sửa / Xóa / Xem trong bảng
  if (meetingList) {
    meetingList.addEventListener("click", handleMeetingAction);
  }
}

// =====================================================
// 8. RENDER TABLE (ENTERPRISE STITCH SPEC)
// =====================================================

function renderMeetingTable() {
  const list = document.getElementById("meetings-list");
  const table = document.getElementById("meetings-table");
  const empty = document.getElementById("empty-state");
  const paginationFooter = document.getElementById("table-pagination-footer");
  const searchInput = document.getElementById("search-meeting");
  const filteredCountEl = document.getElementById("filtered-count");

  if (!list || !table || !empty) return;

  const keyword = (searchInput ? searchInput.value : "").trim().toLowerCase();

  const filteredMeetings = meetings.filter(meeting => {
    const title = (meeting.title || "").toLowerCase();
    const roomName = (meeting.roomName || meeting.location || "").toLowerCase();
    const host = (meeting.host || "").toLowerCase();
    const participants = (meeting.participants || []).join(" ").toLowerCase();
    const notes = (meeting.notes || "").toLowerCase();

    const matchSearch =
      title.includes(keyword) ||
      roomName.includes(keyword) ||
      host.includes(keyword) ||
      participants.includes(keyword) ||
      notes.includes(keyword);

    const matchStatus = currentStatusFilter === "" || meeting.status === currentStatusFilter;

    let matchRoom = true;
    if (currentRoomFilter !== "") {
      matchRoom = meeting.roomId === Number(currentRoomFilter);
    }

    return matchSearch && matchStatus && matchRoom;
  });

  if (filteredCountEl) {
    filteredCountEl.innerText = filteredMeetings.length;
  }

  const pagTo = document.getElementById("pag-to");
  const pagTotal = document.getElementById("pag-total");
  if (pagTo) pagTo.innerText = filteredMeetings.length;
  if (pagTotal) pagTotal.innerText = meetings.length;

  list.innerHTML = "";

  if (filteredMeetings.length === 0) {
    table.classList.add("hidden");
    if (paginationFooter) paginationFooter.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  table.classList.remove("hidden");
  if (paginationFooter) paginationFooter.classList.remove("hidden");
  empty.classList.add("hidden");

  filteredMeetings.forEach(meeting => {
    const row = document.createElement("tr");
    row.className = "stitch-table-row";

    const roomName = meeting.roomName || (meeting.roomId ? (ROOMS.find(r => r.id === meeting.roomId)?.name) : (meeting.location || "Phòng Tokyo (Tầng 4)"));
    const roomCapacity = meeting.capacity || (meeting.roomId ? (ROOMS.find(r => r.id === meeting.roomId)?.capacity) : 20);

    const hostName = meeting.host || (meeting.participants && meeting.participants[0]) || "Admin";
    const otherParticipants = (meeting.participants || []).filter(p => p !== hostName);
    const hostInitial = getInitials(hostName);
    const hostColor = getHostColor(hostName);
    const duration = calcDurationString(meeting.startTime, meeting.endTime);

    // Tag badge class
    let tagClass = "tag-neutral";
    if (meeting.tag === "Quan trọng") tagClass = "tag-danger";
    else if (meeting.tag === "Sprint 24" || meeting.tag === "Dự án mới") tagClass = "tag-primary";
    else if (meeting.tag === "Thiết kế" || meeting.tag === "Tuyển dụng") tagClass = "tag-sky";

    // Status pill
    let statusPillHtml = "";
    if (meeting.status === "in-progress") {
      statusPillHtml = `
        <span class="stitch-status-pill status-in-progress">
          <span class="status-indicator-dot dot-ping"></span>
          <span>Đang diễn ra</span>
        </span>
      `;
    } else if (meeting.status === "scheduled") {
      statusPillHtml = `
        <span class="stitch-status-pill status-scheduled">
          <span class="status-indicator-dot dot-blue"></span>
          <span>Sắp diễn ra</span>
        </span>
      `;
    } else if (meeting.status === "completed") {
      statusPillHtml = `
        <span class="stitch-status-pill status-completed">
          <i class="bi bi-check-circle-fill me-1"></i>
          <span>Đã kết thúc</span>
        </span>
      `;
    } else if (meeting.status === "cancelled") {
      statusPillHtml = `
        <span class="stitch-status-pill status-cancelled">
          <i class="bi bi-x-circle-fill me-1"></i>
          <span>Đã hủy</span>
        </span>
      `;
    }

    // Participants stack
    let participantStackHtml = "";
    if (otherParticipants.length > 0) {
      const shown = otherParticipants.slice(0, 2);
      const remaining = otherParticipants.length - shown.length;
      participantStackHtml = `
        <div class="mini-avatar-stack">
          ${shown.map(p => `<span class="mini-avatar" title="${escapeHTML(p)}">${getInitials(p)}</span>`).join("")}
          ${remaining > 0 ? `<span class="mini-avatar mini-avatar-more">+${remaining}</span>` : ""}
        </div>
      `;
    }

    row.innerHTML = `
      <td class="td-title">
        <div class="meeting-title-cell">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="meeting-title-link ${meeting.status === 'cancelled' ? 'title-cancelled' : ''}" data-action="detail" data-id="${meeting.id}">
              ${escapeHTML(meeting.title)}
            </span>
            ${meeting.tag ? `<span class="stitch-tag-chip ${tagClass}">${escapeHTML(meeting.tag)}</span>` : ""}
          </div>
          <p class="meeting-desc-sub">${escapeHTML(meeting.notes || 'Chưa có ghi chú')}</p>
        </div>
      </td>

      <td class="td-time">
        <div class="meeting-datetime-cell">
          <div class="datetime-date-row ${meeting.status === 'cancelled' ? 'text-decoration-line-through text-muted' : ''}">
            <i class="bi bi-calendar3 me-1 text-slate-400"></i>
            <span>${formatDate(meeting.date)}</span>
          </div>
          <div class="datetime-time-row">
            <span class="datetime-hours">${escapeHTML(meeting.time || (meeting.startTime + ' - ' + meeting.endTime))}</span>
            <span class="datetime-dur-chip">${duration}</span>
          </div>
        </div>
      </td>

      <td class="td-host">
        <div class="meeting-host-cell">
          <div class="host-avatar-circle" style="background: ${hostColor};">
            ${hostInitial}
          </div>
          <div class="host-info">
            <span class="host-name">${escapeHTML(hostName)}</span>
            ${participantStackHtml}
          </div>
        </div>
      </td>

      <td class="td-room">
        <div class="meeting-room-badge">
          <span class="room-name">
            <i class="bi bi-door-open text-primary me-1"></i>
            ${escapeHTML(roomName)}
          </span>
          <span class="room-capacity-chip">
            <i class="bi bi-people-fill me-1"></i>${roomCapacity} chỗ
          </span>
        </div>
      </td>

      <td class="td-status">
        ${statusPillHtml}
      </td>

      <td class="td-actions text-end">
        <div class="stitch-actions-wrapper">
          <button type="button" class="btn-stitch-icon" data-action="detail" data-id="${meeting.id}" title="Xem chi tiết">
            <i class="bi bi-eye"></i>
          </button>

          <button type="button" class="btn-stitch-icon" data-action="edit" data-id="${meeting.id}" title="Chỉnh sửa">
            <i class="bi bi-pencil"></i>
          </button>

          <button type="button" class="btn-stitch-icon btn-stitch-delete" data-action="delete" data-id="${meeting.id}" title="Xóa cuộc họp">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </td>
    `;

    list.appendChild(row);
  });
}


// =====================================================
// 9. XỬ LÝ NÚT TRONG TABLE
// =====================================================

function handleMeetingAction(event) {

  const button =
    event.target.closest("button");


  if (!button) {
    return;
  }


  const action =
    button.dataset.action;


  const id =
    Number(button.dataset.id);


  if (!id) {
    return;
  }


  switch (action) {

    case "detail":
      openDetailModal(id);
      break;

    case "edit":
      openEditModal(id);
      break;

    case "delete":
      deleteMeeting(id);
      break;

  }
}


// =====================================================
// =====================================================
// 10. THÊM CUỘC HỌP (STITCH FORM SPEC)
// =====================================================

function openAddModal() {
  const form = document.getElementById("meeting-form");
  const title = document.getElementById("modal-title");
  const subtitle = document.getElementById("modal-subtitle");
  const id = document.getElementById("meeting-id");
  const titleInput = document.getElementById("meeting-title");
  const descInput = document.getElementById("meeting-description") || document.getElementById("meeting-notes");
  const dateInput = document.getElementById("meeting-date");
  const startInput = document.getElementById("meeting-start");
  const endInput = document.getElementById("meeting-end");
  const locationInput = document.getElementById("meeting-location");
  const participantsInput = document.getElementById("meeting-participants");
  const statusInput = document.getElementById("meeting-status");
  const successView = document.getElementById("success-view");
  const globalError = document.getElementById("global-error");
  const titleError = document.getElementById("title-error");
  const titleErrorIcon = document.getElementById("title-error-icon");
  const timeErrorMsg = document.getElementById("time-error-msg");
  const submitText = document.getElementById("submit-text");

  if (!form) return;

  // Reset form & state
  form.reset();
  if (id) id.value = "";
  if (title) title.textContent = "Tạo cuộc họp mới";
  if (subtitle) subtitle.textContent = "Tạo lịch họp và thiết lập thời gian cuộc họp";
  if (submitText) submitText.textContent = "Tạo cuộc họp";

  // Hiển thị lại form nếu đang ở success view
  if (form) form.classList.remove("hidden");
  if (successView) successView.classList.add("hidden");

  // Xóa sạch trạng thái lỗi
  if (globalError) globalError.classList.add("hidden");
  if (titleError) titleError.classList.add("hidden");
  if (titleErrorIcon) titleErrorIcon.classList.add("hidden");
  if (timeErrorMsg) timeErrorMsg.classList.add("hidden");
  if (titleInput) titleInput.classList.remove("has-error");
  if (endInput) endInput.classList.remove("has-error");

  // Khởi tạo giá trị mặc định chuẩn Enterprise
  const today = new Date().toISOString().split("T")[0];
  if (dateInput) dateInput.value = today;
  if (startInput) startInput.value = "09:00";
  if (endInput) endInput.value = "10:30";
  if (statusInput) statusInput.value = "scheduled";

  const roomSelect = document.getElementById("meeting-room");
  if (roomSelect) roomSelect.value = "1";
  const organizerSelect = document.getElementById("meeting-organizer");
  if (organizerSelect) organizerSelect.value = "1";

  const tagInput = document.getElementById("meeting-tag");
  if (tagInput) tagInput.value = "";
  document.querySelectorAll(".btn-tag-chip-select").forEach(b => b.classList.remove("active"));

  // Reset IsRecurring & Equipments
  const recurringInput = document.getElementById("meeting-recurring");
  if (recurringInput) recurringInput.checked = false;
  document.querySelectorAll(".eq-checkbox").forEach(cb => { cb.checked = false; });

  calcDuration();

  modalOverlay.classList.remove("hidden");
  if (titleInput) {
    setTimeout(() => titleInput.focus(), 100);
  }
}


// =====================================================
// 11. SỬA CUỘC HỌP
// =====================================================

function openEditModal(id) {
  const meeting = meetings.find(item => item.id === id);

  if (!meeting) {
    alert("Không tìm thấy cuộc họp.");
    return;
  }

  const form = document.getElementById("meeting-form");
  const title = document.getElementById("modal-title");
  const subtitle = document.getElementById("modal-subtitle");
  const idInput = document.getElementById("meeting-id");
  const titleInput = document.getElementById("meeting-title");
  const descInput = document.getElementById("meeting-description");
  const notesInput = document.getElementById("meeting-notes");
  const dateInput = document.getElementById("meeting-date");
  const startInput = document.getElementById("meeting-start");
  const endInput = document.getElementById("meeting-end");
  const roomSelect = document.getElementById("meeting-room");
  const organizerSelect = document.getElementById("meeting-organizer");
  const locationInput = document.getElementById("meeting-location");
  const participantsInput = document.getElementById("meeting-participants");
  const statusInput = document.getElementById("meeting-status");
  const successView = document.getElementById("success-view");
  const globalError = document.getElementById("global-error");
  const titleError = document.getElementById("title-error");
  const titleErrorIcon = document.getElementById("title-error-icon");
  const timeErrorMsg = document.getElementById("time-error-msg");
  const submitText = document.getElementById("submit-text");

  if (title) title.textContent = "Chỉnh sửa cuộc họp";
  if (subtitle) subtitle.textContent = "Cập nhật thông tin và thời gian cuộc họp";
  if (submitText) submitText.textContent = "Cập nhật cuộc họp";

  if (form) form.classList.remove("hidden");
  if (successView) successView.classList.add("hidden");

  // Xóa lỗi
  if (globalError) globalError.classList.add("hidden");
  if (titleError) titleError.classList.add("hidden");
  if (titleErrorIcon) titleErrorIcon.classList.add("hidden");
  if (timeErrorMsg) timeErrorMsg.classList.add("hidden");
  if (titleInput) titleInput.classList.remove("has-error");
  if (endInput) endInput.classList.remove("has-error");

  // Điền dữ liệu
  if (idInput) idInput.value = meeting.id;
  if (titleInput) titleInput.value = meeting.title || "";
  if (descInput) descInput.value = meeting.notes || meeting.description || "";
  if (notesInput) notesInput.value = meeting.notes || "";
  if (dateInput) dateInput.value = meeting.date || "";

  // Phòng họp & Người tổ chức chuẩn Database
  if (roomSelect) roomSelect.value = meeting.roomId ? String(meeting.roomId) : "1";
  if (organizerSelect) organizerSelect.value = meeting.organizerId ? String(meeting.organizerId) : "1";

  // Nhãn cuộc họp (Tag)
  const tagInput = document.getElementById("meeting-tag");
  if (tagInput) tagInput.value = meeting.tag || "";
  document.querySelectorAll(".btn-tag-chip-select").forEach(b => {
    if (b.dataset.tag === (meeting.tag || "")) b.classList.add("active");
    else b.classList.remove("active");
  });

  // Phân tích thời gian bắt đầu và kết thúc
  let startTime = meeting.startTime;
  let endTime = meeting.endTime;

  if (!startTime || !endTime) {
    if (meeting.time && meeting.time.includes("-")) {
      const parts = meeting.time.split("-").map(p => p.trim());
      startTime = parts[0] || "09:00";
      endTime = parts[1] || "10:30";
    } else {
      startTime = meeting.time || "09:00";
      endTime = "10:30";
    }
  }

  if (startInput) startInput.value = startTime;
  if (endInput) endInput.value = endTime;
  if (locationInput) locationInput.value = meeting.location || (meeting.roomName || "");
  if (participantsInput) participantsInput.value = (meeting.participants || []).join(", ");
  if (statusInput) statusInput.value = meeting.status || "scheduled";

  // IsRecurring & Equipments
  const recurringInput = document.getElementById("meeting-recurring");
  if (recurringInput) recurringInput.checked = Boolean(meeting.isRecurring);

  const eqIds = meeting.equipmentIds || [];
  document.querySelectorAll(".eq-checkbox").forEach(cb => {
    cb.checked = eqIds.includes(Number(cb.value));
  });

  calcDuration();

  modalOverlay.classList.remove("hidden");
}


// =====================================================
// 12. LƯU (VALIDATION & SUBMIT THEO STITCH SPEC)
// =====================================================

function saveMeeting(event) {
  event.preventDefault();

  const id = document.getElementById("meeting-id").value;
  const titleInput = document.getElementById("meeting-title");
  const descInput = document.getElementById("meeting-description") || document.getElementById("meeting-notes");
  const dateInput = document.getElementById("meeting-date");
  const startInput = document.getElementById("meeting-start");
  const endInput = document.getElementById("meeting-end");
  const locationInput = document.getElementById("meeting-location");
  const participantsInput = document.getElementById("meeting-participants");
  const statusInput = document.getElementById("meeting-status");

  const titleError = document.getElementById("title-error");
  const titleErrorIcon = document.getElementById("title-error-icon");
  const globalError = document.getElementById("global-error");
  const globalErrorTitle = document.getElementById("global-error-title");
  const globalErrorDesc = document.getElementById("global-error-desc");
  const btnSubmit = document.getElementById("btn-submit");
  const submitText = document.getElementById("submit-text");
  const submitSpinner = document.getElementById("submit-spinner");
  const submitIcon = document.getElementById("submit-icon");
  const successView = document.getElementById("success-view");
  const form = document.getElementById("meeting-form");

  const roomSelect = document.getElementById("meeting-room");
  const roomId = Number(roomSelect ? roomSelect.value : 1) || 1;
  const roomObj = ROOMS.find(r => r.id === roomId) || ROOMS[0];

  const organizerSelect = document.getElementById("meeting-organizer");
  const organizerId = Number(organizerSelect ? organizerSelect.value : 1) || 1;
  const organizerObj = USERS.find(u => u.id === organizerId) || USERS[0];

  const tagInput = document.getElementById("meeting-tag");
  const tag = tagInput ? tagInput.value.trim() : "";

  const title = titleInput ? titleInput.value.trim() : "";
  const date = dateInput ? dateInput.value : "";
  const startTime = startInput ? startInput.value : "";
  const endTime = endInput ? endInput.value : "";
  const location = roomObj.name;
  const notes = descInput ? descInput.value.trim() : "";
  const status = statusInput ? statusInput.value : "scheduled";

  const participants = participantsInput
    ? participantsInput.value
        .split(",")
        .map(item => item.trim())
        .filter(item => item !== "")
    : [organizerObj.name];

  // Reset errors
  if (titleError) titleError.classList.add("hidden");
  if (titleErrorIcon) titleErrorIcon.classList.add("hidden");
  if (titleInput) titleInput.classList.remove("has-error");
  if (globalError) globalError.classList.add("hidden");

  // 1. Validate Tiêu đề (Bắt buộc)
  if (!title) {
    if (titleError) titleError.classList.remove("hidden");
    if (titleErrorIcon) titleErrorIcon.classList.remove("hidden");
    if (titleInput) {
      titleInput.classList.add("has-error");
      titleInput.focus();
    }
    if (globalError && globalErrorTitle && globalErrorDesc) {
      globalErrorTitle.innerText = "Trường bắt buộc chưa nhập";
      globalErrorDesc.innerText = "Vui lòng nhập 'Tiêu đề cuộc họp' để hoàn tất biểu mẫu.";
      globalError.classList.remove("hidden");
    }
    return;
  }

  // 2. Validate Thời gian (Bắt buộc & End > Start)
  if (!date || !startTime || !endTime) {
    if (globalError && globalErrorTitle && globalErrorDesc) {
      globalErrorTitle.innerText = "Thông tin thời gian chưa đầy đủ";
      globalErrorDesc.innerText = "Vui lòng chọn ngày họp, thời gian bắt đầu và thời gian kết thúc.";
      globalError.classList.remove("hidden");
    }
    return;
  }

  const isDurationValid = calcDuration();
  if (!isDurationValid) {
    if (globalError && globalErrorTitle && globalErrorDesc) {
      globalErrorTitle.innerText = "Thời gian không hợp lệ";
      globalErrorDesc.innerText = `Thời gian kết thúc (${endTime}) không thể sớm hơn thời gian bắt đầu (${startTime}).`;
      globalError.classList.remove("hidden");
    }
    return;
  }

  // 3. Trạng thái Loading giả lập mượt mà
  if (btnSubmit) btnSubmit.disabled = true;
  if (submitSpinner) submitSpinner.classList.remove("hidden");
  if (submitIcon) submitIcon.classList.add("hidden");
  if (submitText) submitText.innerText = id ? "Đang cập nhật..." : "Đang tạo cuộc họp...";

  const timeDisplay = `${startTime} - ${endTime}`;

  const recurringInput = document.getElementById("meeting-recurring");
  const isRecurring = recurringInput ? recurringInput.checked : false;

  const equipmentCheckboxes = Array.from(document.querySelectorAll(".eq-checkbox:checked"));
  const equipmentIds = equipmentCheckboxes.map(cb => Number(cb.value));
  const equipmentNames = equipmentIds.map(eid => {
    const found = EQUIPMENTS.find(e => e.id === eid);
    return found ? found.name : `Thiết bị #${eid}`;
  });

  const participantIds = participants.map(name => {
    const user = USERS.find(u => u.name.toLowerCase() === name.toLowerCase());
    return user ? user.id : null;
  }).filter(Boolean);

  setTimeout(() => {
    // SỬA
    if (id) {
      const index = meetings.findIndex(item => item.id === Number(id));
      if (index !== -1) {
        meetings[index] = {
          ...meetings[index],
          id: Number(id),
          title,
          tag,
          date,
          startTime,
          endTime,
          time: timeDisplay,
          roomId: roomObj.id,
          roomName: roomObj.name,
          capacity: roomObj.capacity,
          organizerId: organizerObj.id,
          host: organizerObj.name,
          location: roomObj.name,
          participants: participants.length > 0 ? participants : [organizerObj.name],
          participantIds,
          status,
          notes,
          isRecurring,
          equipmentIds,
          equipmentNames,
          startTimeISO: `${date}T${startTime}:00`,
          endTimeISO: `${date}T${endTime}:00`
        };
      }
    }
    // THÊM MỚI
    else {
      meetings.unshift({
        id: getNextId(),
        title,
        tag,
        date,
        startTime,
        endTime,
        time: timeDisplay,
        roomId: roomObj.id,
        roomName: roomObj.name,
        capacity: roomObj.capacity,
        organizerId: organizerObj.id,
        host: organizerObj.name,
        location: roomObj.name,
        participants: participants.length > 0 ? participants : [organizerObj.name],
        participantIds,
        status,
        notes,
        isRecurring,
        equipmentIds,
        equipmentNames,
        startTimeISO: `${date}T${startTime}:00`,
        endTimeISO: `${date}T${endTime}:00`
      });
    }

    // Khôi phục nút submit
    if (btnSubmit) btnSubmit.disabled = false;
    if (submitSpinner) submitSpinner.classList.add("hidden");
    if (submitIcon) submitIcon.classList.remove("hidden");
    if (submitText) submitText.innerText = id ? "Cập nhật cuộc họp" : "Tạo cuộc họp";

    // Cập nhật bảng và thống kê
    renderMeetingTable();
    updateDashboardStats();

    // Hiển thị Success View
    if (form) form.classList.add("hidden");
    if (successView) {
      successView.classList.remove("hidden");
      const successTitle = document.getElementById("success-title");
      const successTime = document.getElementById("success-time-display");
      const successDate = document.getElementById("success-date-display");
      const successRoom = document.getElementById("success-room-display");
      const successStatus = document.getElementById("success-status-display");

      if (successTitle) successTitle.innerText = `"${title}"`;
      if (successTime) {
        const durText = document.getElementById("duration-text");
        const durLabel = durText ? durText.innerText.replace("Thời lượng: ", "") : "";
        successTime.innerText = `${timeDisplay} (${durLabel})`;
      }
      if (successDate) successDate.innerText = formatDate(date);
      if (successRoom) successRoom.innerText = `${roomObj.name} (${roomObj.capacity} chỗ)`;
      if (successStatus) successStatus.innerText = getStatusText(status);
    }
  }, 350);
}


// =====================================================
// 13. ID MỚI
// =====================================================

function getNextId() {

  if (meetings.length === 0) {
    return 1;
  }


  return (
    Math.max(
      ...meetings.map(
        meeting => meeting.id
      )
    ) + 1
  );
}


// =====================================================
// 14. XÓA
// =====================================================

function deleteMeeting(id) {

  const meeting =
    meetings.find(
      item => item.id === id
    );


  if (!meeting) {
    return;
  }


  const confirmed =
    window.confirm(
      `Bạn có chắc muốn xóa cuộc họp "${meeting.title}" không?`
    );


  if (!confirmed) {
    return;
  }


  meetings =
    meetings.filter(
      item => item.id !== id
    );


  renderMeetingTable();
  updateDashboardStats();
}


// =====================================================
// 15. XEM CHI TIẾT
// =====================================================

function openDetailModal(id) {

  const meeting =
    meetings.find(
      item => item.id === id
    );


  if (!meeting) {
    return;
  }


  const roomName = meeting.roomName || (meeting.roomId ? (ROOMS.find(r => r.id === meeting.roomId)?.name) : (meeting.location || "Phòng Tokyo (Tầng 4)"));
  const roomCapacity = meeting.capacity || (meeting.roomId ? (ROOMS.find(r => r.id === meeting.roomId)?.capacity) : 20);
  const roomId = meeting.roomId || 1;
  const organizerId = meeting.organizerId || 1;
  const organizerName = meeting.host || "Nguyễn Văn An";

  let tagHtml = "";
  if (meeting.tag) {
    let tagClass = "tag-neutral";
    if (meeting.tag === "Quan trọng") tagClass = "tag-danger";
    else if (meeting.tag === "Sprint 24" || meeting.tag === "Dự án mới") tagClass = "tag-primary";
    else if (meeting.tag === "Thiết kế" || meeting.tag === "Tuyển dụng") tagClass = "tag-sky";
    tagHtml = `<span class="stitch-tag-chip ${tagClass} ms-2">${escapeHTML(meeting.tag)}</span>`;
  }

  const content = document.getElementById("detail-content");
  if (!content) return;

  content.innerHTML = `
    <div class="mb-3 pb-2 border-bottom">
      <div class="d-flex align-items-center justify-content-between mb-1">
        <span class="text-muted small fw-medium">MÃ CUỘC HỌP (MeetingID)</span>
        <span class="badge bg-light text-dark border">#${meeting.id}</span>
      </div>
      <h5 class="fw-bold text-dark m-0 d-flex align-items-center flex-wrap">
        ${escapeHTML(meeting.title)}
        ${tagHtml}
      </h5>
    </div>

    <div class="row g-2 mb-3">
      <div class="col-12 col-md-6">
        <div class="p-2 rounded border bg-light">
          <span class="text-muted small d-block mb-0.5">
            <i class="bi bi-door-open text-primary me-1"></i> PHÒNG HỌP (Rooms)
          </span>
          <div class="fw-semibold text-dark">${escapeHTML(roomName)}</div>
          <div class="small text-muted">Sức chứa: <strong>${roomCapacity} người</strong> (RoomID: ${roomId})</div>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div class="p-2 rounded border bg-light">
          <span class="text-muted small d-block mb-0.5">
            <i class="bi bi-clock-history text-primary me-1"></i> THỜI GIAN (Meetings)
          </span>
          <div class="fw-semibold text-dark">${escapeHTML(meeting.time || (meeting.startTime + ' - ' + meeting.endTime))}</div>
          <div class="small text-muted">Ngày: ${formatDate(meeting.date)} (${calcDurationString(meeting.startTime, meeting.endTime)})</div>
        </div>
      </div>
    </div>

    <div class="row g-2 mb-3">
      <div class="col-12 col-md-6">
        <span class="text-muted small d-block mb-0.5">
          <i class="bi bi-person-badge text-primary me-1"></i> NGƯỜI TỔ CHỨC (Users / OrganizerID)
        </span>
        <div class="fw-medium text-dark">${escapeHTML(organizerName)} <span class="text-muted small">(ID: ${organizerId})</span></div>
      </div>

      <div class="col-12 col-md-6">
        <span class="text-muted small d-block mb-0.5">
          <i class="bi bi-shield-check text-success me-1"></i> TRẠNG THÁI ĐẶT PHÒNG (Bookings)
        </span>
        <span class="${getStatusClass(meeting.status)}">
          ${getStatusText(meeting.status)}
        </span>
      </div>
    </div>

    <div class="mb-3">
      <span class="text-muted small d-block mb-0.5">
        <i class="bi bi-people text-primary me-1"></i> NGƯỜI THAM GIA (Meeting_Participants)
      </span>
      <div class="text-dark small">${(meeting.participants && meeting.participants.length) ? escapeHTML(meeting.participants.join(", ")) : "Chưa có"}</div>
    </div>

    <div class="row g-2 mb-3">
      <div class="col-12 col-md-6">
        <span class="text-muted small d-block mb-0.5">
          <i class="bi bi-arrow-repeat text-primary me-1"></i> CUỘC HỌP ĐỊNH KỲ (Meetings.IsRecurring)
        </span>
        <div>
          ${meeting.isRecurring 
            ? '<span class="badge bg-primary-subtle text-primary border border-primary"><i class="bi bi-check2-circle me-1"></i>Có (Lặp lại định kỳ)</span>' 
            : '<span class="badge bg-light text-muted border">Không (Cuộc họp một lần)</span>'}
        </div>
      </div>

      <div class="col-12 col-md-6">
        <span class="text-muted small d-block mb-0.5">
          <i class="bi bi-laptop text-primary me-1"></i> THIẾT BỊ PHÒNG HỌP (Booking_Equipments)
        </span>
        <div class="text-dark small">
          ${(meeting.equipmentNames && meeting.equipmentNames.length) 
            ? meeting.equipmentNames.map(eq => `<span class="badge bg-light text-dark border me-1">${escapeHTML(eq)}</span>`).join("")
            : (meeting.equipmentIds && meeting.equipmentIds.length)
              ? meeting.equipmentIds.map(eid => `<span class="badge bg-light text-dark border me-1">${escapeHTML(EQUIPMENTS.find(e => e.id === eid)?.name || `Thiết bị #${eid}`)}</span>`).join("")
              : '<span class="text-muted">Không yêu cầu thiết bị bổ sung</span>'}
        </div>
      </div>
    </div>

    <div>
      <span class="text-muted small d-block mb-0.5">
        <i class="bi bi-card-text text-primary me-1"></i> MÔ TẢ (Meetings.Description)
      </span>
      <div class="p-2 rounded bg-light border small text-dark">${escapeHTML(meeting.notes || "Không có ghi chú")}</div>
    </div>
  `;

  detailOverlay.classList.remove("hidden");
}


// =====================================================
// 16. ĐÓNG MODAL
// =====================================================

function closeMeetingModal() {
  modalOverlay.classList.add("hidden");

  const form = document.getElementById("meeting-form");
  const successView = document.getElementById("success-view");
  const globalError = document.getElementById("global-error");
  const titleError = document.getElementById("title-error");
  const titleErrorIcon = document.getElementById("title-error-icon");
  const timeErrorMsg = document.getElementById("time-error-msg");
  const titleInput = document.getElementById("meeting-title");
  const endInput = document.getElementById("meeting-end");
  const id = document.getElementById("meeting-id");

  if (form) {
    form.reset();
    form.classList.remove("hidden");
  }
  if (successView) {
    successView.classList.add("hidden");
  }
  if (id) {
    id.value = "";
  }
  if (globalError) globalError.classList.add("hidden");
  if (titleError) titleError.classList.add("hidden");
  if (titleErrorIcon) titleErrorIcon.classList.add("hidden");
  if (timeErrorMsg) timeErrorMsg.classList.add("hidden");
  if (titleInput) titleInput.classList.remove("has-error");
  if (endInput) endInput.classList.remove("has-error");

  const recurringInput = document.getElementById("meeting-recurring");
  if (recurringInput) recurringInput.checked = false;
  document.querySelectorAll(".eq-checkbox").forEach(cb => { cb.checked = false; });
}


function closeDetailModal() {

  detailOverlay.classList.add("hidden");
}


// =====================================================
// 17. FORMAT DATE
// =====================================================

function formatDate(date) {

  if (!date) {
    return "";
  }


  const parts =
    date.split("-");


  if (parts.length !== 3) {
    return date;
  }


  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


// =====================================================
// 18. STATUS
// =====================================================

function getStatusText(status) {

  const statusMap = {

    scheduled: "Sắp diễn ra",

    "in-progress": "Đang diễn ra",

    completed: "Đã hoàn thành",

    cancelled: "Đã hủy"

  };


  return (
    statusMap[status] ||
    "Không xác định"
  );
}


function getStatusClass(status) {
  return `stitch-status-pill status-${status}`;
}


// =====================================================
// 19. CHỐNG HTML INJECTION
// =====================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");
}


// =====================================================
// 20. CLICK RA NGOÀI MODAL
// =====================================================

modalOverlay.addEventListener(
  "click",
  function (event) {

    if (event.target === modalOverlay) {
      closeMeetingModal();
    }

  }
);


detailOverlay.addEventListener(
  "click",
  function (event) {

    if (event.target === detailOverlay) {
      closeDetailModal();
    }

  }
);


// =====================================================
// 21. PHÍM ESC
// =====================================================

document.addEventListener(
  "keydown",
  function (event) {

    if (event.key !== "Escape") {
      return;
    }


    if (
      !modalOverlay.classList.contains("hidden")
    ) {
      closeMeetingModal();
    }


    if (
      !detailOverlay.classList.contains("hidden")
    ) {
      closeDetailModal();
    }

  }
);


// =====================================================
// 22. KHỞI ĐỘNG ROUTER
// =====================================================

router();