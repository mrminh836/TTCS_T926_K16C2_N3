// =====================================================
// PRODUCT BACKLOG - MEETING MANAGEMENT
// JavaScript thuần
// Bootstrap 5 + Bootstrap Icons
// Router Base + CRUD + Search + Filter
// =====================================================


// =====================================================
// 1. DỮ LIỆU CHUẨN DATABASE (ROOMS, MEETINGS, USERS)
// =====================================================

let ROOMS = [
  {
    id: 1,
    code: "RM-001",
    name: "Phòng Tokyo (Tầng 4)",
    floor: "Tầng 4, Tòa A",
    capacity: 20,
    status: "Active",
    type: "Hội nghị",
    qrCode: "QR-ROOM-001",
    equipments: ["Máy chiếu Full HD", "Màn hình TV 75\"", "Micro & Loa họp"],
    description: "Phòng họp hội thảo tiêu chuẩn cao, view thoáng, cách âm tốt, chuyên tổ chức họp ban giám đốc và đối tác."
  },
  {
    id: 2,
    code: "RM-002",
    name: "Phòng Silicon (Tầng 2)",
    floor: "Tầng 2, Tòa B",
    capacity: 12,
    status: "Active",
    type: "Nhóm / Tech",
    qrCode: "QR-ROOM-002",
    equipments: ["Màn hình TV 75\"", "Bảng trắng viết", "Micro & Loa họp"],
    description: "Phòng họp nhóm kỹ thuật, trang bị bảng trắng lớn và màn hình TV cho daily sprint và pairing."
  },
  {
    id: 3,
    code: "RM-003",
    name: "Phòng Hội Nghị A",
    floor: "Tầng 1, Tòa Trung tâm",
    capacity: 30,
    status: "Active",
    type: "Hội trường lớn",
    qrCode: "QR-ROOM-003",
    equipments: ["Máy chiếu Full HD", "Micro & Loa họp", "Màn hình TV 75\"", "Bảng trắng viết"],
    description: "Hội trường đa năng phục vụ họp toàn thể phòng ban, đào tạo nội bộ và workshop công nghệ."
  },
  {
    id: 4,
    code: "RM-004",
    name: "Phòng Grand Board",
    floor: "Tầng 5, Tòa A",
    capacity: 50,
    status: "Maintenance",
    type: "Đại sảnh / Board",
    qrCode: "QR-ROOM-004",
    equipments: ["Máy chiếu Full HD", "Micro & Loa họp", "Màn hình TV 75\""],
    description: "Phòng họp cấp cao Ban Lãnh đạo, hiện đang tiến hành bảo trì nâng cấp hệ thống âm thanh vòm."
  },
  {
    id: 5,
    code: "RM-005",
    name: "Phòng VIP",
    floor: "Tầng 3, Tòa VIP",
    capacity: 10,
    status: "Active",
    type: "VIP / Phỏng vấn",
    qrCode: "QR-ROOM-005",
    equipments: ["Màn hình TV 75\"", "Micro & Loa họp"],
    description: "Không gian sang trọng, yên tĩnh, chuyên dành cho phỏng vấn lãnh đạo và tiếp khách ngoại giao."
  }
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
const roomModalOverlay = document.getElementById("room-modal-overlay");
const roomQrOverlay = document.getElementById("room-qr-overlay");
const roomDeleteOverlay = document.getElementById("room-delete-overlay");


// =====================================================
// 3. ROUTER
// =====================================================

const routes = {
  "/": renderHome,
  "/home": renderHome,
  "/meetings": renderMeetingsPage,
  "/admin/rooms": renderAdminRoomsPage,
  "/rooms": renderAdminRoomsPage,
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

        <a href="#/admin/rooms" class="btn btn-outline-primary stitch-btn-export hero-btn-sub">
          <i class="bi bi-door-open-fill me-1"></i> Quản lý phòng họp (Admin)
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
          <h3 class="feature-title">Quản Lý Phòng &amp; Thiết Bị</h3>
          <p class="feature-desc">Theo dõi trực quan trạng thái sức chứa phòng họp, máy chiếu, màn hình TV và thiết bị kèm theo.</p>
          <a href="#/admin/rooms" class="text-primary fw-semibold small text-decoration-none mt-2 d-inline-block">
            Vào cổng quản trị phòng &rarr;
          </a>
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
// 6B. TRANG QUẢN TRỊ DANH MỤC PHÒNG HỌP (ADMIN ROOMS)
// =====================================================

let roomFilterState = {
  search: "",
  status: "all",      // "all" | "Active" | "Maintenance" | "Inactive"
  capacity: "all",    // "all" | "small" (<15) | "medium" (15-30) | "large" (>30)
  sortBy: "code-asc"
};

function getFilteredRooms() {
  return ROOMS.filter(room => {
    // Tìm kiếm đa trường: tên, mã, tầng, loại phòng
    if (roomFilterState.search) {
      const q = roomFilterState.search.toLowerCase().trim();
      const matchName = (room.name || "").toLowerCase().includes(q);
      const matchCode = (room.code || "").toLowerCase().includes(q);
      const matchFloor = (room.floor || "").toLowerCase().includes(q);
      const matchType = (room.type || "").toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchFloor && !matchType) return false;
    }

    // Lọc theo trạng thái
    if (roomFilterState.status !== "all") {
      if (room.status !== roomFilterState.status) return false;
    }

    // Lọc theo quy mô sức chứa
    if (roomFilterState.capacity === "small") {
      if (room.capacity >= 15) return false;
    } else if (roomFilterState.capacity === "medium") {
      if (room.capacity < 15 || room.capacity > 30) return false;
    } else if (roomFilterState.capacity === "large") {
      if (room.capacity <= 30) return false;
    }

    return true;
  }).sort((a, b) => {
    if (roomFilterState.sortBy === "code-asc") return (a.code || "").localeCompare(b.code || "");
    if (roomFilterState.sortBy === "code-desc") return (b.code || "").localeCompare(a.code || "");
    if (roomFilterState.sortBy === "name-asc") return (a.name || "").localeCompare(b.name || "");
    if (roomFilterState.sortBy === "capacity-desc") return b.capacity - a.capacity;
    if (roomFilterState.sortBy === "capacity-asc") return a.capacity - b.capacity;
    return a.id - b.id;
  });
}

function renderAdminRoomsPage() {
  const totalRooms = ROOMS.length;
  const activeRooms = ROOMS.filter(r => r.status === "Active").length;
  const maintenanceRooms = ROOMS.filter(r => r.status === "Maintenance").length;
  const totalCapacity = ROOMS.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);

  app.innerHTML = `
    <div id="admin-rooms-section" class="admin-rooms-view-wrapper">

      <!-- Breadcrumbs & Page Header -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div class="breadcrumb-nav mb-1">
            <span>Quản trị hệ thống</span>
            <i class="bi bi-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-active">Danh mục phòng họp</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <h1 class="page-title m-0">Quản lý Danh mục Phòng họp</h1>
            <span class="admin-badge-indicator">
              <i class="bi bi-shield-lock-fill"></i> Admin Portal
            </span>
          </div>
          <p class="page-subtitle m-0">
            Quản trị trạng thái hoạt động, sức chứa, trang thiết bị và mã QR Check-in tức thì cho toàn bộ phòng họp doanh nghiệp.
          </p>
        </div>

        <div class="header-action-buttons d-flex align-items-center gap-2">
          <button type="button" id="btn-export-rooms-csv" class="btn-stitch-export" title="Xuất danh sách phòng họp ra file CSV">
            <i class="bi bi-file-earmark-arrow-down"></i>
            <span>Xuất CSV / Excel</span>
          </button>

          <button type="button" id="btn-add-room" class="btn-stitch-create">
            <i class="bi bi-plus-circle-fill"></i>
            <span>Thêm phòng họp</span>
          </button>
        </div>
      </div>

      <!-- KPI Overview Cards (4 Metrics) -->
      <div class="room-kpi-grid">
        <!-- KPI 1: Tổng số phòng -->
        <div class="kpi-card">
          <div class="kpi-card-body">
            <div class="kpi-card-content">
              <span class="kpi-label">Tổng số phòng họp</span>
              <div class="kpi-value" id="room-kpi-total">${totalRooms}</div>
            </div>
            <div class="kpi-icon-box kpi-blue">
              <i class="bi bi-door-open-fill"></i>
            </div>
          </div>
          <div class="kpi-delta-row">
            <span class="kpi-chip-neutral">
              <i class="bi bi-building"></i> Toàn cơ sở
            </span>
            <span class="kpi-delta-text">5 tầng phòng ban</span>
          </div>
          <div class="kpi-bottom-bar bar-blue"></div>
        </div>

        <!-- KPI 2: Đang sẵn sàng hoạt động -->
        <div class="kpi-card">
          <div class="kpi-card-body">
            <div class="kpi-card-content">
              <span class="kpi-label">Sẵn sàng phục vụ</span>
              <div class="kpi-value d-flex align-items-baseline gap-1">
                <span id="room-kpi-active">${activeRooms}</span>
                <span class="kpi-value-unit">phòng</span>
              </div>
            </div>
            <div class="kpi-icon-box kpi-emerald">
              <i class="bi bi-check-circle-fill"></i>
            </div>
          </div>
          <div class="kpi-delta-row">
            <span class="kpi-chip-positive">
              <i class="bi bi-broadcast"></i> Sẵn sàng đặt
            </span>
            <span class="kpi-delta-text">Không có sự cố</span>
          </div>
          <div class="kpi-bottom-bar bar-emerald"></div>
        </div>

        <!-- KPI 3: Đang bảo trì -->
        <div class="kpi-card">
          <div class="kpi-card-body">
            <div class="kpi-card-content">
              <span class="kpi-label">Đang bảo trì / Kiểm tra</span>
              <div class="kpi-value d-flex align-items-baseline gap-1">
                <span id="room-kpi-maintenance">${maintenanceRooms}</span>
                <span class="kpi-value-unit">phòng</span>
              </div>
            </div>
            <div class="kpi-icon-box kpi-amber">
              <i class="bi bi-tools"></i>
            </div>
          </div>
          <div class="kpi-delta-row">
            <span class="kpi-chip-live">
              <span class="ping-dot-live"></span> Đang nâng cấp
            </span>
            <span class="kpi-delta-text">Tạm dừng nhận lịch</span>
          </div>
          <div class="kpi-bottom-bar bar-amber"></div>
        </div>

        <!-- KPI 4: Tổng sức chứa -->
        <div class="kpi-card">
          <div class="kpi-card-body">
            <div class="kpi-card-content">
              <span class="kpi-label">Tổng sức chứa phục vụ</span>
              <div class="kpi-value d-flex align-items-baseline gap-1">
                <span id="room-kpi-capacity">${totalCapacity}</span>
                <span class="kpi-value-unit">chỗ ngồi</span>
              </div>
            </div>
            <div class="kpi-icon-box kpi-purple">
              <i class="bi bi-people-fill"></i>
            </div>
          </div>
          <div class="kpi-delta-row">
            <span class="kpi-chip-neutral">
              <i class="bi bi-bar-chart"></i> Trung bình ${Math.round(totalCapacity / (totalRooms || 1))} chỗ/phòng
            </span>
            <span class="kpi-delta-text">Tối đa 50 chỗ</span>
          </div>
          <div class="kpi-bottom-bar bar-purple"></div>
        </div>
      </div>

      <!-- Filter Panel & Toolbar -->
      <div class="room-filter-card">
        <div class="row g-3 align-items-center">

          <!-- Search Input -->
          <div class="col-lg-4 col-md-6">
            <div class="search-input-wrapper">
              <i class="bi bi-search search-input-icon"></i>
              <input
                type="text"
                id="room-search-input"
                class="form-control table-search-input"
                placeholder="Tìm theo tên phòng, mã (RM-001), tầng..."
                aria-label="Tìm kiếm phòng họp"
                value="${escapeHTML(roomFilterState.search)}"
              />
              ${roomFilterState.search ? `
                <button type="button" id="btn-clear-room-search" class="btn-clear-search" aria-label="Xóa tìm kiếm">
                  <i class="bi bi-x-circle-fill"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Status Tabs -->
          <div class="col-lg-5 col-md-6">
            <div class="d-flex align-items-center gap-1 flex-wrap" role="tablist">
              <button
                type="button"
                class="room-status-tab-btn ${roomFilterState.status === 'all' ? 'active' : ''}"
                data-status="all">
                <span>Tất cả</span>
                <span class="room-tab-count">${totalRooms}</span>
              </button>

              <button
                type="button"
                class="room-status-tab-btn ${roomFilterState.status === 'Active' ? 'active' : ''}"
                data-status="Active">
                <span>Hoạt động</span>
                <span class="room-tab-count">${activeRooms}</span>
              </button>

              <button
                type="button"
                class="room-status-tab-btn ${roomFilterState.status === 'Maintenance' ? 'active' : ''}"
                data-status="Maintenance">
                <span>Bảo trì</span>
                <span class="room-tab-count">${maintenanceRooms}</span>
              </button>

              <button
                type="button"
                class="room-status-tab-btn ${roomFilterState.status === 'Inactive' ? 'active' : ''}"
                data-status="Inactive">
                <span>Tạm ngừng</span>
                <span class="room-tab-count">${totalRooms - activeRooms - maintenanceRooms}</span>
              </button>
            </div>
          </div>

          <!-- Capacity Dropdown & Sort -->
          <div class="col-lg-3 col-md-12 d-flex align-items-center gap-2">
            <select id="room-capacity-filter" class="form-select stitch-input" aria-label="Lọc theo quy mô sức chứa">
              <option value="all" ${roomFilterState.capacity === 'all' ? 'selected' : ''}>Tất cả quy mô</option>
              <option value="small" ${roomFilterState.capacity === 'small' ? 'selected' : ''}>Nhỏ (&lt; 15 chỗ)</option>
              <option value="medium" ${roomFilterState.capacity === 'medium' ? 'selected' : ''}>Vừa (15 - 30 chỗ)</option>
              <option value="large" ${roomFilterState.capacity === 'large' ? 'selected' : ''}>Lớn (&gt; 30 chỗ)</option>
            </select>

            <button type="button" id="btn-reset-room-filter" class="btn btn-outline-secondary stitch-btn-cancel flex-shrink-0" title="Đặt lại bộ lọc" aria-label="Đặt lại bộ lọc">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>

        </div>
      </div>

      <!-- Admin Room Table Card -->
      <div class="stitch-table-card">
        <div class="stitch-table-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2">
            <span class="stitch-table-title">Danh sách phòng họp doanh nghiệp</span>
            <span class="stitch-table-count" id="room-table-count">Đang tải...</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="stitch-hint"><i class="bi bi-shield-check text-success me-1"></i>Đồng bộ CSDL chuẩn 3NF</span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table stitch-table align-middle" id="admin-rooms-table">
            <thead>
              <tr>
                <th style="width: 44px;" class="text-center">
                  <input type="checkbox" id="check-all-rooms" class="stitch-checkbox" aria-label="Chọn tất cả phòng họp" />
                </th>
                <th style="width: 105px;" class="text-center">Mã phòng</th>
                <th style="min-width: 230px;">Phòng họp &amp; Vị trí</th>
                <th style="width: 150px;">Sức chứa</th>
                <th style="min-width: 220px;">Trang thiết bị gắn kèm</th>
                <th style="width: 145px;" class="text-center">Trạng thái</th>
                <th style="width: 145px;" class="text-center text-nowrap">Mã QR Check-in</th>
                <th style="width: 130px;" class="text-center">Lịch hôm nay</th>
                <th style="width: 140px;" class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody id="admin-rooms-tbody">
              <!-- Render by JavaScript -->
            </tbody>
          </table>
        </div>

        <!-- Table Footer / Pagination -->
        <div class="stitch-table-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div class="stitch-table-info" id="room-footer-info"></div>
          <div class="stitch-pagination d-flex align-items-center gap-1">
            <button type="button" class="btn-page-nav disabled" aria-label="Trang trước"><i class="bi bi-chevron-left"></i></button>
            <span class="btn-page-nav active">1</span>
            <button type="button" class="btn-page-nav disabled" aria-label="Trang kế tiếp"><i class="bi bi-chevron-right"></i></button>
          </div>
        </div>
      </div>

    </div>
  `;

  setupAdminRoomEvents();
  renderAdminRoomsTable();
}

function renderAdminRoomsTable() {
  const tbody = document.getElementById("admin-rooms-tbody");
  const countBadge = document.getElementById("room-table-count");
  const footerInfo = document.getElementById("room-footer-info");

  if (!tbody) return;

  const filtered = getFilteredRooms();
  const total = ROOMS.length;

  if (countBadge) {
    countBadge.textContent = `${filtered.length} / ${total} phòng`;
  }

  if (footerInfo) {
    footerInfo.textContent = `Hiển thị ${filtered.length} trong tổng số ${total} phòng họp doanh nghiệp`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-5">
          <div class="empty-state-card">
            <div class="empty-icon-box mb-3">
              <i class="bi bi-door-closed fs-1 text-muted"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">Không tìm thấy phòng họp phù hợp</h5>
            <p class="text-muted small mb-3">Vui lòng điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn các điều kiện lọc.</p>
            <button type="button" class="btn btn-outline-primary btn-sm" onclick="resetRoomFilters()">
              <i class="bi bi-arrow-counterclockwise me-1"></i> Xóa bộ lọc tìm kiếm
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  tbody.innerHTML = filtered.map(room => {
    // 1. Icon phòng theo loại
    let iconClass = "bi-door-closed room-icon-default";
    if (room.type === "Hội nghị") iconClass = "bi-building room-icon-board";
    else if (room.type === "Nhóm / Tech") iconClass = "bi-laptop room-icon-tech";
    else if (room.type === "Hội trường lớn") iconClass = "bi-megaphone room-icon-hall";
    else if (room.type === "VIP / Phỏng vấn") iconClass = "bi-star-fill room-icon-vip";
    else if (room.type === "Đại sảnh / Board") iconClass = "bi-award-fill room-icon-board";

    // 2. Status Badge
    let statusBadge = "";
    if (room.status === "Active") {
      statusBadge = `<span class="stitch-status-pill status-completed"><span class="pulse-dot-primary" style="background:#10b981;"></span> Sẵn sàng</span>`;
    } else if (room.status === "Maintenance") {
      statusBadge = `<span class="stitch-status-pill status-inprogress"><span class="ping-dot-live"></span> Đang bảo trì</span>`;
    } else {
      statusBadge = `<span class="stitch-status-pill status-cancelled">Tạm ngừng</span>`;
    }

    // 3. Equipments Pills
    const eqList = (room.equipments || []).map(eq => {
      let icon = "bi-check2";
      if (eq.includes("Máy chiếu")) icon = "bi-projector-fill";
      else if (eq.includes("TV")) icon = "bi-tv-fill";
      else if (eq.includes("Micro")) icon = "bi-mic-fill";
      else if (eq.includes("Bảng")) icon = "bi-easel-fill";
      return `<span class="room-eq-pill"><i class="bi ${icon}"></i>${escapeHTML(eq)}</span>`;
    }).join("");

    // 4. Cuộc họp hôm nay
    const todayMeetings = meetings.filter(m => 
      (m.roomId === room.id || m.roomName === room.name) && 
      m.date === today && 
      m.status !== "cancelled"
    );
    const hasLiveMeeting = todayMeetings.some(m => m.status === "in-progress");

    let meetingIndicator = "";
    if (hasLiveMeeting) {
      meetingIndicator = `<span class="kpi-chip-live"><span class="ping-dot-live"></span> Đang có họp</span>`;
    } else if (todayMeetings.length > 0) {
      meetingIndicator = `<span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-semibold px-2 py-1">${todayMeetings.length} cuộc họp</span>`;
    } else {
      meetingIndicator = `<span class="text-muted small">Chưa có lịch</span>`;
    }

    // 5. Thanh đo sức chứa
    const capPct = Math.min(100, Math.round((room.capacity / 50) * 100));

    return `
      <tr data-room-id="${room.id}">
        <td class="text-center">
          <input type="checkbox" class="stitch-checkbox room-row-checkbox" value="${room.id}" aria-label="Chọn phòng ${escapeHTML(room.name)}" />
        </td>

        <td class="text-center">
          <span class="room-code-badge">${escapeHTML(room.code || `RM-00${room.id}`)}</span>
        </td>

        <td>
          <div class="room-cell-info">
            <div class="room-type-icon ${iconClass.split(' ')[1]}">
              <i class="bi ${iconClass.split(' ')[0]}"></i>
            </div>
            <div>
              <div class="room-name-text" onclick="openRoomQRModal(${room.id})" title="Nhấp để xem chi tiết phòng">
                ${escapeHTML(room.name)}
              </div>
              <div class="room-location-text">
                <i class="bi bi-geo-alt"></i>
                <span>${escapeHTML(room.floor || 'Chưa định vị')} • ${escapeHTML(room.type || 'Hội nghị')}</span>
              </div>
            </div>
          </div>
        </td>

        <td>
          <div class="capacity-cell-wrapper">
            <div class="capacity-badge-pill">
              <i class="bi bi-people-fill text-primary"></i>
              <span>${room.capacity} chỗ</span>
            </div>
            <div class="capacity-meter" title="Sức chứa: ${room.capacity} chỗ">
              <div class="capacity-meter-bar" style="width: ${capPct}%;"></div>
            </div>
            <span class="capacity-size-tag">${room.capacity < 15 ? 'Quy mô nhỏ' : (room.capacity <= 30 ? 'Quy mô vừa' : 'Quy mô lớn')}</span>
          </div>
        </td>

        <td>
          <div class="room-eq-pill-list">
            ${eqList || '<span class="text-muted small">Không có</span>'}
          </div>
        </td>

        <td class="text-center">
          ${statusBadge}
        </td>

        <td class="text-center">
          <button
            type="button"
            class="btn-qr-view"
            onclick="openRoomQRModal(${room.id})"
            title="Xem &amp; In mã QR Check-in phòng ${escapeHTML(room.name)}"
            aria-label="Xem mã QR phòng ${escapeHTML(room.name)}">
            <i class="bi bi-qr-code-scan"></i>
            <span>${escapeHTML(room.qrCode || `QR-00${room.id}`)}</span>
          </button>
        </td>

        <td class="text-center">
          ${meetingIndicator}
        </td>

        <td class="text-center">
          <div class="d-flex align-items-center justify-content-center gap-1">
            <button
              type="button"
              class="btn-room-action btn-room-action-edit"
              onclick="openEditRoomModal(${room.id})"
              title="Chỉnh sửa thông tin phòng"
              aria-label="Chỉnh sửa phòng ${escapeHTML(room.name)}">
              <i class="bi bi-pencil-square"></i>
            </button>

            <button
              type="button"
              class="btn-room-action btn-room-action-toggle"
              onclick="toggleRoomStatus(${room.id})"
              title="Chuyển trạng thái: Hoạt động &harr; Bảo trì"
              aria-label="Đổi trạng thái phòng ${escapeHTML(room.name)}">
              <i class="bi bi-arrow-repeat"></i>
            </button>

            <button
              type="button"
              class="btn-room-action btn-room-action-delete"
              onclick="confirmDeleteRoom(${room.id})"
              title="Xóa phòng họp (Kiểm tra ràng buộc)"
              aria-label="Xóa phòng ${escapeHTML(room.name)}">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function updateRoomKpiCards() {
  const totalRooms = ROOMS.length;
  const activeRooms = ROOMS.filter(r => r.status === "Active").length;
  const maintenanceRooms = ROOMS.filter(r => r.status === "Maintenance").length;
  const totalCapacity = ROOMS.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);

  const kpiTotal = document.getElementById("room-kpi-total");
  const kpiActive = document.getElementById("room-kpi-active");
  const kpiMaint = document.getElementById("room-kpi-maintenance");
  const kpiCap = document.getElementById("room-kpi-capacity");

  if (kpiTotal) kpiTotal.textContent = totalRooms;
  if (kpiActive) kpiActive.textContent = activeRooms;
  if (kpiMaint) kpiMaint.textContent = maintenanceRooms;
  if (kpiCap) kpiCap.textContent = totalCapacity;
}

function setupAdminRoomEvents() {
  // 1. Tìm kiếm live
  const searchInput = document.getElementById("room-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      roomFilterState.search = e.target.value;
      renderAdminRoomsTable();
    });
  }

  // 2. Nút xóa tìm kiếm
  const clearBtn = document.getElementById("btn-clear-room-search");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      roomFilterState.search = "";
      const input = document.getElementById("room-search-input");
      if (input) input.value = "";
      renderAdminRoomsTable();
    });
  }

  // 3. Tab trạng thái
  document.querySelectorAll(".room-status-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".room-status-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      roomFilterState.status = btn.dataset.status;
      renderAdminRoomsTable();
    });
  });

  // 4. Dropdown quy mô sức chứa
  const capSelect = document.getElementById("room-capacity-filter");
  if (capSelect) {
    capSelect.addEventListener("change", (e) => {
      roomFilterState.capacity = e.target.value;
      renderAdminRoomsTable();
    });
  }

  // 5. Nút đặt lại bộ lọc
  const resetBtn = document.getElementById("btn-reset-room-filter");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetRoomFilters();
    });
  }

  // 6. Nút thêm phòng mới
  const addRoomBtn = document.getElementById("btn-add-room");
  if (addRoomBtn) {
    addRoomBtn.addEventListener("click", openAddRoomModal);
  }

  // 7. Nút xuất file CSV
  const exportBtn = document.getElementById("btn-export-rooms-csv");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportRoomsToCSV);
  }

  // 8. Chọn tất cả checkbox
  const checkAll = document.getElementById("check-all-rooms");
  if (checkAll) {
    checkAll.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      document.querySelectorAll(".room-row-checkbox").forEach(cb => {
        cb.checked = isChecked;
      });
    });
  }
}

function resetRoomFilters() {
  roomFilterState.search = "";
  roomFilterState.status = "all";
  roomFilterState.capacity = "all";
  renderAdminRoomsPage();
}

// =====================================================
// 6B. ROOM API SERVICE (RESTful WITH GRACEFUL FALLBACK)
// =====================================================

const ROOM_API_URL = "http://localhost:3000/api/rooms";

const RoomAPI = {
  isBackendConnected: false,

  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch("http://localhost:3000/api/health", { signal: controller.signal });
      clearTimeout(timeoutId);
      this.isBackendConnected = res.ok;
    } catch {
      this.isBackendConnected = false;
    }
    this.updateStatusBadge();
    return this.isBackendConnected;
  },

  updateStatusBadge() {
    const badge = document.getElementById("room-api-status-badge");
    const text = document.getElementById("room-api-status-text");
    if (!badge || !text) return;
    if (this.isBackendConnected) {
      badge.classList.remove("offline");
      badge.title = "Backend Server đang hoạt động - Sẵn sàng đồng bộ CSDL thật";
      text.textContent = "API Live (Port 3000)";
    } else {
      badge.classList.add("offline");
      badge.title = "Backend Server chưa bật - Tự động kích hoạt Client Fallback an toàn";
      text.textContent = "Client Fallback";
    }
  },

  async getAll() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(ROOM_API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        this.isBackendConnected = true;
        this.updateStatusBadge();
        return { success: true, data: json.data || json, isFallback: false };
      }
    } catch (err) {
      this.isBackendConnected = false;
      this.updateStatusBadge();
    }
    return { success: true, data: ROOMS, isFallback: true };
  },

  async create(roomData) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(ROOM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        this.isBackendConnected = true;
        this.updateStatusBadge();
        const createdRoom = json.data || json;
        ROOMS.push(createdRoom);
        persistRoomsToStorage();
        return { success: true, data: createdRoom, isFallback: false };
      }
    } catch (err) {
      console.warn("Backend API offline hoặc timeout, chuyển sang Local Store Fallback:", err);
      this.isBackendConnected = false;
      this.updateStatusBadge();
    }

    // Local Fallback
    const maxId = ROOMS.reduce((max, r) => Math.max(max, r.id), 0);
    const newId = maxId + 1;
    const newRoom = {
      id: newId,
      code: roomData.code || `RM-00${newId}`,
      name: roomData.name,
      capacity: Number(roomData.capacity),
      type: roomData.type,
      floor: roomData.floor,
      status: roomData.status,
      qrCode: roomData.qrCode || `QR-ROOM-00${newId}`,
      equipments: roomData.equipments || [],
      description: roomData.description || ""
    };
    ROOMS.push(newRoom);
    persistRoomsToStorage();
    return { success: true, data: newRoom, isFallback: true };
  },

  async update(id, roomData) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${ROOM_API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        this.isBackendConnected = true;
        this.updateStatusBadge();
        const updated = json.data || json;
        const idx = ROOMS.findIndex(r => r.id === id);
        if (idx !== -1) ROOMS[idx] = updated;
        persistRoomsToStorage();
        return { success: true, data: updated, isFallback: false };
      }
    } catch (err) {
      console.warn("Backend API offline hoặc timeout, chuyển sang Local Store Fallback:", err);
      this.isBackendConnected = false;
      this.updateStatusBadge();
    }

    // Local Fallback
    const room = ROOMS.find(r => r.id === id);
    if (room) {
      room.name = roomData.name;
      room.capacity = Number(roomData.capacity);
      room.type = roomData.type;
      room.floor = roomData.floor;
      room.status = roomData.status;
      room.equipments = roomData.equipments || [];
      room.description = roomData.description || "";
      persistRoomsToStorage();
    }
    return { success: true, data: room, isFallback: true };
  }
};

function persistRoomsToStorage() {
  try {
    localStorage.setItem("STITCH_ROOMS_DATA", JSON.stringify(ROOMS));
  } catch (e) {
    console.warn("Lỗi khi lưu phòng vào localStorage:", e);
  }
}

function loadPersistedRooms() {
  try {
    const saved = localStorage.getItem("STITCH_ROOMS_DATA");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        ROOMS = parsed;
      }
    }
  } catch (e) {
    console.warn("Lỗi khi đọc phòng từ localStorage:", e);
  }
}

// =====================================================
// 6C. FORM VALIDATION NGHIỆP VỤ PHÒNG HỌP (STITCH SPEC)
// =====================================================

function validateRoomForm(editId = null) {
  const nameInput = document.getElementById("room-form-name");
  const capacityInput = document.getElementById("room-form-capacity");
  const floorInput = document.getElementById("room-form-floor");
  const typeSelect = document.getElementById("room-form-type");
  const statusSelect = document.getElementById("room-form-status");
  const descInput = document.getElementById("room-form-description");

  const globalError = document.getElementById("room-global-error");
  const globalErrorText = document.getElementById("room-global-error-text");
  const nameError = document.getElementById("room-name-error");
  const floorError = document.getElementById("room-floor-error");
  const capacityError = document.getElementById("room-capacity-error");
  const statusWarning = document.getElementById("room-status-warning");
  const statusWarningText = document.getElementById("room-status-warning-text");

  // Xóa trạng thái lỗi cũ
  clearRoomFormErrors();

  let isValid = true;
  let firstErrorField = null;

  const name = nameInput ? nameInput.value.trim() : "";
  const capacity = capacityInput ? parseInt(capacityInput.value, 10) : NaN;
  const floor = floorInput ? floorInput.value.trim() : "";
  const type = typeSelect ? typeSelect.value : "Hội nghị";
  const status = statusSelect ? statusSelect.value : "Active";
  const description = descInput ? descInput.value.trim() : "";

  // 1. Kiểm tra Tên phòng họp (Bắt buộc, 2-100 ký tự, không chứa thẻ HTML, duy nhất)
  if (!name) {
    isValid = false;
    showFieldError(nameInput, nameError, "Tên phòng họp không được để trống.");
    if (!firstErrorField) firstErrorField = nameInput;
  } else if (name.length < 2) {
    isValid = false;
    showFieldError(nameInput, nameError, "Tên phòng họp quá ngắn (tối thiểu 2 ký tự).");
    if (!firstErrorField) firstErrorField = nameInput;
  } else if (name.length > 100) {
    isValid = false;
    showFieldError(nameInput, nameError, "Tên phòng họp không được vượt quá 100 ký tự (chuẩn CSDL).");
    if (!firstErrorField) firstErrorField = nameInput;
  } else if (/[<>]/.test(name)) {
    isValid = false;
    showFieldError(nameInput, nameError, "Tên phòng họp không được chứa ký tự đặc biệt nguy hiểm (<, >).");
    if (!firstErrorField) firstErrorField = nameInput;
  } else {
    // Kiểm tra trùng lặp tên phòng họp (Unique Constraint)
    const duplicate = ROOMS.find(r => r.name.trim().toLowerCase() === name.toLowerCase() && r.id !== editId);
    if (duplicate) {
      isValid = false;
      showFieldError(nameInput, nameError, `Tên phòng "${name}" đã tồn tại trên hệ thống. Vui lòng chọn tên khác.`);
      if (!firstErrorField) firstErrorField = nameInput;
    }
  }

  // 2. Kiểm tra Vị trí / Tầng (Bắt buộc, tối đa 100 ký tự)
  if (!floor) {
    isValid = false;
    showFieldError(floorInput, floorError, "Vui lòng nhập vị trí hoặc tầng của phòng họp.");
    if (!firstErrorField) firstErrorField = floorInput;
  } else if (floor.length > 100) {
    isValid = false;
    showFieldError(floorInput, floorError, "Vị trí / Tầng không được vượt quá 100 ký tự.");
    if (!firstErrorField) firstErrorField = floorInput;
  }

  // 3. Kiểm tra Sức chứa (Bắt buộc, số nguyên dương từ 1 đến 500)
  if (isNaN(capacity)) {
    isValid = false;
    showFieldError(capacityInput, capacityError, "Sức chứa phòng họp phải là chữ số hợp lệ.");
    if (!firstErrorField) firstErrorField = capacityInput;
  } else if (capacity < 1 || capacity > 500) {
    isValid = false;
    showFieldError(capacityInput, capacityError, "Sức chứa phải nằm trong khoảng từ 1 đến 500 chỗ ngồi.");
    if (!firstErrorField) firstErrorField = capacityInput;
  }

  // 4. Kiểm tra Loại phòng họp
  const validTypes = ["Hội nghị", "Nhóm / Tech", "Hội trường lớn", "Đại sảnh / Board", "VIP / Phỏng vấn"];
  if (!validTypes.includes(type)) {
    isValid = false;
    if (globalErrorText) globalErrorText.textContent = "Loại phòng họp không hợp lệ.";
  }

  // 5. Cảnh báo nghiệp vụ khi chuyển sang Maintenance hoặc Inactive nếu đang có lịch họp
  if (status !== "Active" && editId) {
    const today = new Date().toISOString().split("T")[0];
    const hasUpcomingMeetings = meetings.some(m => 
      (m.roomId === editId || m.roomName === name) && 
      m.date >= today && 
      m.status !== "cancelled"
    );
    if (hasUpcomingMeetings && statusWarning && statusWarningText) {
      statusWarningText.textContent = `Lưu ý: Phòng đang có cuộc họp sắp tới. Đổi sang "${status === 'Maintenance' ? 'Bảo trì' : 'Tạm ngừng'}" có thể ảnh hưởng đến người dùng.`;
      statusWarning.classList.remove("hidden");
    }
  }

  // Phản hồi giao diện nếu có lỗi
  if (!isValid) {
    if (globalError) {
      globalError.classList.remove("hidden");
      if (globalErrorText) globalErrorText.textContent = "Vui lòng kiểm tra lại các trường được đánh dấu đỏ trước khi lưu.";
    }
    const formCard = document.querySelector(".room-modal-card");
    if (formCard) {
      formCard.classList.remove("stitch-shake");
      void formCard.offsetWidth; // Trigger reflow để kích hoạt lại animation
      formCard.classList.add("stitch-shake");
    }
    if (firstErrorField) {
      firstErrorField.focus();
    }
  }

  // Danh sách trang thiết bị được chọn
  const checkedEqs = [];
  document.querySelectorAll(".room-eq-checkbox:checked").forEach(cb => {
    checkedEqs.push(cb.value);
  });

  return {
    isValid,
    data: {
      name,
      capacity,
      floor,
      type,
      status,
      description,
      equipments: checkedEqs
    }
  };
}

function showFieldError(inputEl, errorEl, message) {
  if (inputEl) {
    inputEl.classList.add("is-invalid", "has-error");
  }
  if (errorEl) {
    errorEl.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> ${escapeHTML(message)}`;
    errorEl.classList.remove("hidden");
  }
}

function clearRoomFormErrors() {
  const globalError = document.getElementById("room-global-error");
  if (globalError) globalError.classList.add("hidden");

  const statusWarning = document.getElementById("room-status-warning");
  if (statusWarning) statusWarning.classList.add("hidden");

  ["room-form-name", "room-form-capacity", "room-form-floor", "room-form-type", "room-form-status"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("is-invalid", "has-error");
  });

  ["room-name-error", "room-floor-error", "room-capacity-error"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
}

function setupRoomFormValidationEvents() {
  const nameInput = document.getElementById("room-form-name");
  const floorInput = document.getElementById("room-form-floor");
  const capInput = document.getElementById("room-form-capacity");
  const statusSelect = document.getElementById("room-form-status");

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      nameInput.classList.remove("is-invalid", "has-error");
      const err = document.getElementById("room-name-error");
      if (err) err.classList.add("hidden");
      const globalError = document.getElementById("room-global-error");
      if (globalError) globalError.classList.add("hidden");
    });
  }

  if (floorInput) {
    floorInput.addEventListener("input", () => {
      floorInput.classList.remove("is-invalid", "has-error");
      const err = document.getElementById("room-floor-error");
      if (err) err.classList.add("hidden");
    });
  }

  if (capInput) {
    capInput.addEventListener("input", () => {
      capInput.classList.remove("is-invalid", "has-error");
      const err = document.getElementById("room-capacity-error");
      if (err) err.classList.add("hidden");
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener("change", () => {
      const idInput = document.getElementById("room-form-id");
      const editId = idInput && idInput.value ? parseInt(idInput.value, 10) : null;
      const statusWarning = document.getElementById("room-status-warning");
      const statusWarningText = document.getElementById("room-status-warning-text");
      if (statusSelect.value !== "Active" && editId) {
        const today = new Date().toISOString().split("T")[0];
        const hasUpcomingMeetings = meetings.some(m => 
          m.roomId === editId && m.date >= today && m.status !== "cancelled"
        );
        if (hasUpcomingMeetings && statusWarning && statusWarningText) {
          statusWarningText.textContent = `Lưu ý: Phòng đang có cuộc họp sắp tới. Đổi sang "${statusSelect.value === 'Maintenance' ? 'Bảo trì' : 'Tạm ngừng'}" có thể ảnh hưởng người dùng.`;
          statusWarning.classList.remove("hidden");
        } else if (statusWarning) {
          statusWarning.classList.add("hidden");
        }
      } else if (statusWarning) {
        statusWarning.classList.add("hidden");
      }
    });
  }
}

// =====================================================
// 6D. QUẢN LÝ MODAL THÊM / SỬA PHÒNG HỌP (STITCH FORM)
// =====================================================

function openAddRoomModal() {
  RoomAPI.checkHealth();

  const form = document.getElementById("room-form");
  const modalTitle = document.getElementById("room-modal-title");
  const modalSubtitle = document.getElementById("room-modal-subtitle");
  const submitText = document.getElementById("room-submit-text");
  const successView = document.getElementById("room-success-view");

  if (modalTitle) modalTitle.textContent = "Thêm phòng họp mới";
  if (modalSubtitle) modalSubtitle.textContent = "Cấu hình thông tin phòng, sức chứa, thiết bị và mã QR định danh";
  if (submitText) submitText.textContent = "Lưu phòng họp";

  if (form) {
    form.reset();
    form.classList.remove("hidden");
  }
  if (successView) successView.classList.add("hidden");

  // Xóa toàn bộ lỗi cũ
  clearRoomFormErrors();

  // Tự sinh mã phòng mới
  const nextId = ROOMS.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  const idInput = document.getElementById("room-form-id");
  const codeInput = document.getElementById("room-form-code");
  const qrInput = document.getElementById("room-form-qrcode");

  if (idInput) idInput.value = "";
  if (codeInput) codeInput.value = `RM-00${nextId}`;
  if (qrInput) qrInput.value = `QR-ROOM-00${nextId}`;

  // Reset checkboxes thiết bị
  document.querySelectorAll(".room-eq-checkbox").forEach(cb => cb.checked = false);

  if (roomModalOverlay) roomModalOverlay.classList.remove("hidden");

  const nameInput = document.getElementById("room-form-name");
  if (nameInput) setTimeout(() => nameInput.focus(), 100);
}

function openEditRoomModal(roomId) {
  RoomAPI.checkHealth();

  const room = ROOMS.find(r => r.id === roomId);
  if (!room) {
    alert("Không tìm thấy thông tin phòng họp.");
    return;
  }

  const form = document.getElementById("room-form");
  const modalTitle = document.getElementById("room-modal-title");
  const modalSubtitle = document.getElementById("room-modal-subtitle");
  const submitText = document.getElementById("room-submit-text");
  const successView = document.getElementById("room-success-view");

  if (modalTitle) modalTitle.textContent = "Chỉnh sửa phòng họp";
  if (modalSubtitle) modalSubtitle.textContent = `Cập nhật thông tin chi tiết phòng ${room.name}`;
  if (submitText) submitText.textContent = "Cập nhật phòng họp";

  if (form) form.classList.remove("hidden");
  if (successView) successView.classList.add("hidden");

  // Xóa toàn bộ lỗi cũ
  clearRoomFormErrors();

  // Điền dữ liệu vào form
  const idInput = document.getElementById("room-form-id");
  const nameInput = document.getElementById("room-form-name");
  const codeInput = document.getElementById("room-form-code");
  const capacityInput = document.getElementById("room-form-capacity");
  const typeSelect = document.getElementById("room-form-type");
  const floorInput = document.getElementById("room-form-floor");
  const statusSelect = document.getElementById("room-form-status");
  const qrInput = document.getElementById("room-form-qrcode");
  const descInput = document.getElementById("room-form-description");

  if (idInput) idInput.value = room.id;
  if (nameInput) nameInput.value = room.name || "";
  if (codeInput) codeInput.value = room.code || `RM-00${room.id}`;
  if (capacityInput) capacityInput.value = room.capacity || 15;
  if (typeSelect) typeSelect.value = room.type || "Hội nghị";
  if (floorInput) floorInput.value = room.floor || "";
  if (statusSelect) statusSelect.value = room.status || "Active";
  if (qrInput) qrInput.value = room.qrCode || `QR-ROOM-00${room.id}`;
  if (descInput) descInput.value = room.description || "";

  // Checkboxes equipments
  const roomEqs = room.equipments || [];
  document.querySelectorAll(".room-eq-checkbox").forEach(cb => {
    cb.checked = roomEqs.includes(cb.value);
  });

  if (roomModalOverlay) roomModalOverlay.classList.remove("hidden");

  if (nameInput) setTimeout(() => nameInput.focus(), 100);
}

function closeRoomModal() {
  if (roomModalOverlay) roomModalOverlay.classList.add("hidden");
  clearRoomFormErrors();
}

async function saveRoom(event) {
  event.preventDefault();

  const idInput = document.getElementById("room-form-id");
  const isEdit = idInput && idInput.value !== "";
  const editId = isEdit ? parseInt(idInput.value, 10) : null;

  // 1. Chạy bộ Validation nghiệp vụ
  const validation = validateRoomForm(editId);
  if (!validation.isValid) {
    return;
  }

  const roomData = validation.data;

  // 2. Hiệu ứng loading trên nút submit
  const submitBtn = document.getElementById("btn-room-submit");
  const submitSpinner = document.getElementById("room-submit-spinner");
  const submitIcon = document.getElementById("room-submit-icon");
  const submitText = document.getElementById("room-submit-text");

  if (submitSpinner) submitSpinner.classList.remove("hidden");
  if (submitIcon) submitIcon.classList.add("hidden");
  if (submitBtn) submitBtn.disabled = true;
  if (submitText) submitText.textContent = "Đang lưu dữ liệu...";

  try {
    let result;
    if (isEdit) {
      result = await RoomAPI.update(editId, roomData);
    } else {
      const nextId = ROOMS.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      roomData.code = `RM-00${nextId}`;
      roomData.qrCode = `QR-ROOM-00${nextId}`;
      result = await RoomAPI.create(roomData);
    }

    // 3. Tắt trạng thái loading
    if (submitSpinner) submitSpinner.classList.add("hidden");
    if (submitIcon) submitIcon.classList.remove("hidden");
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.textContent = isEdit ? "Cập nhật phòng họp" : "Lưu phòng họp";

    // 4. Hiển thị banner thành công
    const form = document.getElementById("room-form");
    const successView = document.getElementById("room-success-view");
    const successTitle = document.getElementById("room-success-title");
    const successDesc = document.getElementById("room-success-desc");

    if (form) form.classList.add("hidden");
    if (successView) {
      successTitle.textContent = isEdit ? "Cập nhật phòng họp thành công!" : "Thêm phòng họp mới thành công!";
      const syncStatus = result.isFallback 
        ? "Đã lưu vào bộ nhớ cục bộ (Local Store Fallback - Tự động đồng bộ CSDL)"
        : "Đã đồng bộ trực tiếp vào CSDL Backend";
      successDesc.innerHTML = `Phòng <strong>"${escapeHTML(roomData.name)}"</strong> (${roomData.capacity} chỗ ngồi, ${roomData.status}) • <span class="text-success"><i class="bi bi-shield-check me-1"></i>${syncStatus}</span>`;
      successView.classList.remove("hidden");
    }

    // 5. Cập nhật Bảng, KPI và Form Đặt lịch cuộc họp
    renderAdminRoomsTable();
    updateRoomKpiCards();
    syncMeetingRoomOptions();

  } catch (error) {
    console.error("Lỗi khi lưu phòng:", error);
    if (submitSpinner) submitSpinner.classList.add("hidden");
    if (submitIcon) submitIcon.classList.remove("hidden");
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.textContent = isEdit ? "Cập nhật phòng họp" : "Lưu phòng họp";

    const globalError = document.getElementById("room-global-error");
    const globalErrorText = document.getElementById("room-global-error-text");
    if (globalError) {
      if (globalErrorText) globalErrorText.textContent = "Có lỗi xảy ra trong quá trình lưu phòng. Vui lòng thử lại.";
      globalError.classList.remove("hidden");
    }
  }
}

// =====================================================
// 6D. MODAL MÃ QR & CHI TIẾT CHECK-IN PHÒNG HỌP (US 5.2)
// =====================================================

function generateRoomQRSVG(roomCode, roomName) {
  return `
    <svg viewBox="0 0 200 200" width="180" height="180" xmlns="http://www.w3.org/2000/svg" style="display:block; border-radius: 8px;">
      <!-- Nền trắng -->
      <rect width="200" height="200" fill="#ffffff" />

      <!-- Top-Left Finder Pattern -->
      <rect x="15" y="15" width="45" height="45" fill="#0f172a" rx="4" />
      <rect x="23" y="23" width="29" height="29" fill="#ffffff" rx="2" />
      <rect x="29" y="29" width="17" height="17" fill="#2563eb" rx="2" />

      <!-- Top-Right Finder Pattern -->
      <rect x="140" y="15" width="45" height="45" fill="#0f172a" rx="4" />
      <rect x="148" y="23" width="29" height="29" fill="#ffffff" rx="2" />
      <rect x="154" y="29" width="17" height="17" fill="#2563eb" rx="2" />

      <!-- Bottom-Left Finder Pattern -->
      <rect x="15" y="140" width="45" height="45" fill="#0f172a" rx="4" />
      <rect x="23" y="148" width="29" height="29" fill="#ffffff" rx="2" />
      <rect x="29" y="154" width="17" height="17" fill="#2563eb" rx="2" />

      <!-- Data & Timing Modules -->
      <g fill="#1e293b">
        <rect x="70" y="25" width="8" height="8" rx="1" />
        <rect x="85" y="25" width="8" height="8" rx="1" />
        <rect x="100" y="25" width="8" height="8" rx="1" />
        <rect x="115" y="25" width="8" height="8" rx="1" />

        <rect x="25" y="70" width="8" height="8" rx="1" />
        <rect x="40" y="70" width="8" height="8" rx="1" />
        <rect x="25" y="85" width="8" height="8" rx="1" />
        <rect x="40" y="100" width="8" height="8" rx="1" />
        <rect x="25" y="115" width="8" height="8" rx="1" />

        <rect x="145" y="70" width="8" height="8" rx="1" />
        <rect x="160" y="70" width="8" height="8" rx="1" />
        <rect x="175" y="85" width="8" height="8" rx="1" />
        <rect x="145" y="100" width="8" height="8" rx="1" />
        <rect x="160" y="115" width="8" height="8" rx="1" />

        <rect x="70" y="145" width="8" height="8" rx="1" />
        <rect x="85" y="160" width="8" height="8" rx="1" />
        <rect x="100" y="145" width="8" height="8" rx="1" />
        <rect x="115" y="160" width="8" height="8" rx="1" />
        <rect x="100" y="175" width="8" height="8" rx="1" />
        <rect x="145" y="145" width="8" height="8" rx="1" />
        <rect x="160" y="160" width="8" height="8" rx="1" />
        <rect x="175" y="175" width="8" height="8" rx="1" />

        <rect x="65" y="65" width="8" height="8" rx="1" />
        <rect x="125" y="65" width="8" height="8" rx="1" />
        <rect x="65" y="125" width="8" height="8" rx="1" />
        <rect x="125" y="125" width="8" height="8" rx="1" />
      </g>

      <!-- Center Logo Box -->
      <rect x="73" y="73" width="54" height="54" fill="#ffffff" stroke="#2563eb" stroke-width="2" rx="8" />
      <text x="100" y="96" font-family="Inter, sans-serif" font-size="10" font-weight="bold" fill="#2563eb" text-anchor="middle">ICTU</text>
      <text x="100" y="110" font-family="monospace" font-size="7.5" font-weight="bold" fill="#475569" text-anchor="middle">${roomCode}</text>
    </svg>
  `;
}

function openRoomQRModal(roomId) {
  const room = ROOMS.find(r => r.id === roomId);
  if (!room) return;

  const content = document.getElementById("room-qr-content");
  if (!content) return;

  const roomCode = room.code || `RM-00${room.id}`;
  const qrSvg = generateRoomQRSVG(roomCode, room.name);

  // Lấy các cuộc họp sắp diễn ra tại phòng này
  const roomMeetings = meetings.filter(m => 
    (m.roomId === room.id || m.roomName === room.name) && 
    m.status !== "cancelled"
  );

  content.innerHTML = `
    <!-- QR Visual Card -->
    <div class="qr-preview-wrapper">
      <div class="qr-code-svg-box">
        ${qrSvg}
      </div>
      <div class="qr-room-meta-title">${escapeHTML(room.name)}</div>
      <div class="qr-room-meta-sub">
        ${escapeHTML(room.floor || 'Khu phòng ban')} • Sức chứa: <strong>${room.capacity} chỗ ngồi</strong> • Mã: <code>${roomCode}</code>
      </div>
      <div class="qr-checkin-instruction">
        <i class="bi bi-phone"></i>
        <span>Nhân viên quét mã tại cửa phòng để Check-in xác nhận bắt đầu cuộc họp</span>
      </div>
    </div>

    <!-- Specs Grid -->
    <div class="row g-3 mb-4">
      <div class="col-6">
        <div class="p-3 bg-light rounded-3 border">
          <div class="text-muted small mb-1">Trạng thái phòng</div>
          <div class="fw-bold">
            ${room.status === 'Active' ? '<span class="text-success"><i class="bi bi-check-circle-fill me-1"></i>Sẵn sàng hoạt động</span>' : (room.status === 'Maintenance' ? '<span class="text-warning"><i class="bi bi-tools me-1"></i>Đang bảo trì</span>' : '<span class="text-secondary">Tạm ngừng</span>')}
          </div>
        </div>
      </div>

      <div class="col-6">
        <div class="p-3 bg-light rounded-3 border">
          <div class="text-muted small mb-1">Loại phòng</div>
          <div class="fw-bold text-dark">${escapeHTML(room.type || 'Hội nghị tiêu chuẩn')}</div>
        </div>
      </div>
    </div>

    <!-- Trang thiết bị -->
    <div class="mb-4">
      <div class="fw-semibold text-slate-800 small mb-2">Trang thiết bị sẵn có trong phòng:</div>
      <div class="d-flex flex-wrap gap-2">
        ${(room.equipments || []).map(eq => `<span class="room-eq-pill py-1 px-2"><i class="bi bi-check2-circle text-primary"></i>${escapeHTML(eq)}</span>`).join('') || '<span class="text-muted small">Chưa trang bị</span>'}
      </div>
    </div>

    <!-- Mô tả tiện ích -->
    ${room.description ? `
      <div class="mb-4">
        <div class="fw-semibold text-slate-800 small mb-1">Mô tả tiện ích:</div>
        <p class="text-muted small mb-0 p-2 bg-light rounded border">${escapeHTML(room.description)}</p>
      </div>
    ` : ''}

    <!-- Lịch các cuộc họp tại phòng này -->
    <div>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="fw-semibold text-slate-800 small">Lịch họp đã đăng ký tại phòng:</span>
        <span class="badge bg-secondary-subtle text-secondary">${roomMeetings.length} cuộc họp</span>
      </div>

      ${roomMeetings.length === 0 ? `
        <div class="text-muted small p-3 bg-light rounded text-center border">
          Hiện chưa có cuộc họp nào được đặt tại phòng này. Phòng sẵn sàng phục vụ.
        </div>
      ` : `
        <div class="list-group list-group-flush border rounded-3 overflow-hidden">
          ${roomMeetings.slice(0, 4).map(m => `
            <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
              <div>
                <strong class="small d-block text-dark">${escapeHTML(m.title)}</strong>
                <span class="text-muted small">${formatDate(m.date)} • ${m.startTime} - ${m.endTime} (${escapeHTML(m.host || 'Nguyễn Văn An')})</span>
              </div>
              <span class="${getStatusClass(m.status)}">${getStatusText(m.status)}</span>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  if (roomQrOverlay) roomQrOverlay.classList.remove("hidden");
}

function closeRoomQRModal() {
  if (roomQrOverlay) roomQrOverlay.classList.add("hidden");
}

// =====================================================
// 6E. XÓA PHÒNG & KIỂM TRA RÀNG BUỘC NGHIỆP VỤ (LUỒNG 1.3)
// =====================================================

function confirmDeleteRoom(roomId) {
  const room = ROOMS.find(r => r.id === roomId);
  if (!room) return;

  // Kiểm tra có cuộc họp nào sắp diễn ra hoặc đang diễn ra tại phòng này không
  const activeMeetings = meetings.filter(m => 
    (m.roomId === roomId || m.roomName === room.name) && 
    (m.status === "scheduled" || m.status === "in-progress")
  );

  const content = document.getElementById("room-delete-content");
  const footer = document.getElementById("room-delete-footer");

  if (!content || !footer) return;

  if (activeMeetings.length > 0) {
    // VI PHẠM RÀNG BUỘC LUỒNG 1.3: Chặn xóa phòng có lịch họp Confirmed
    content.innerHTML = `
      <div class="room-constraint-box">
        <div class="d-flex align-items-start gap-3">
          <i class="bi bi-shield-x text-danger fs-2 flex-shrink-0"></i>
          <div>
            <h5 class="text-danger fw-bold mb-1">Ràng buộc nghiệp vụ: Không thể xóa phòng họp</h5>
            <p class="text-secondary small mb-2">
              Phòng họp <strong>"${escapeHTML(room.name)}"</strong> hiện đang có <strong>${activeMeetings.length} cuộc họp</strong> đã xác nhận sắp diễn ra hoặc đang diễn ra. Theo quy chuẩn bảo đảm toàn vẹn dữ liệu hệ thống (Luồng 1.3), bạn không được phép xóa phòng này.
            </p>
            <div class="alert alert-warning py-2 px-3 small mb-0">
              <i class="bi bi-lightbulb-fill text-warning me-1"></i>
              <strong>Khuyến nghị:</strong> Bạn có thể chuyển trạng thái phòng sang <strong>"Bảo trì" (Maintenance)</strong> để tạm dừng nhận lịch mới mà không làm gián đoạn các cuộc họp đã lên lịch.
            </div>
          </div>
        </div>

        <div class="fw-semibold small text-slate-700 mt-3 mb-2">Danh sách cuộc họp bị ảnh hưởng:</div>
        <div class="room-conflict-meeting-list">
          ${activeMeetings.map(m => `
            <div class="room-conflict-item">
              <div>
                <strong>${escapeHTML(m.title)}</strong>
                <div class="text-muted small">${formatDate(m.date)} • ${m.startTime} - ${m.endTime}</div>
              </div>
              <span class="badge ${m.status === 'in-progress' ? 'bg-warning text-dark' : 'bg-primary'}">${m.status === 'in-progress' ? 'Đang diễn ra' : 'Sắp diễn ra'}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button type="button" class="btn btn-outline-secondary stitch-btn-cancel" onclick="closeRoomDeleteModal()">
        Đóng
      </button>
      <button type="button" class="btn btn-warning" onclick="toggleRoomMaintenanceAndClose(${room.id})">
        <i class="bi bi-tools me-1"></i> Chuyển sang Bảo trì ngay
      </button>
    `;
  } else {
    // Không có cuộc họp -> Cho phép xóa an toàn
    content.innerHTML = `
      <div class="text-center py-3">
        <div class="mb-3">
          <i class="bi bi-trash3-fill text-danger fs-1"></i>
        </div>
        <h5 class="fw-bold mb-2">Bạn có chắc chắn muốn xóa phòng họp này?</h5>
        <p class="text-secondary mb-3">
          Phòng họp <strong>"${escapeHTML(room.name)}"</strong> (${room.capacity} chỗ, mã <code>${room.code || `RM-00${room.id}`}</code>) sẽ bị gỡ bỏ vĩnh viễn khỏi danh mục phòng họp.
        </p>
        <div class="alert alert-success py-2 px-3 small d-inline-block">
          <i class="bi bi-check-circle-fill me-1"></i> Phòng hiện không có cuộc họp nào sắp diễn ra. Thao tác xóa an toàn.
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button type="button" class="btn btn-outline-secondary stitch-btn-cancel" onclick="closeRoomDeleteModal()">
        Hủy bỏ
      </button>
      <button type="button" class="btn btn-danger" onclick="executeDeleteRoom(${room.id})">
        <i class="bi bi-trash3 me-1"></i> Xác nhận xóa phòng
      </button>
    `;
  }

  if (roomDeleteOverlay) roomDeleteOverlay.classList.remove("hidden");
}

function closeRoomDeleteModal() {
  if (roomDeleteOverlay) roomDeleteOverlay.classList.add("hidden");
}

function executeDeleteRoom(roomId) {
  const idx = ROOMS.findIndex(r => r.id === roomId);
  if (idx !== -1) {
    ROOMS.splice(idx, 1);
  }

  closeRoomDeleteModal();
  renderAdminRoomsTable();
  updateRoomKpiCards();
  syncMeetingRoomOptions();
}

function toggleRoomMaintenanceAndClose(roomId) {
  const room = ROOMS.find(r => r.id === roomId);
  if (room) {
    room.status = "Maintenance";
  }
  closeRoomDeleteModal();
  renderAdminRoomsTable();
  updateRoomKpiCards();
  syncMeetingRoomOptions();
}

function toggleRoomStatus(roomId) {
  const room = ROOMS.find(r => r.id === roomId);
  if (!room) return;

  if (room.status === "Active") {
    room.status = "Maintenance";
  } else {
    room.status = "Active";
  }

  renderAdminRoomsTable();
  updateRoomKpiCards();
  syncMeetingRoomOptions();
}

// =====================================================
// 6F. XUẤT CSV PHÒNG HỌP & ĐỒNG BỘ DROPDOWN
// =====================================================

function exportRoomsToCSV() {
  const rows = [
    ["Mã phòng", "Tên phòng họp", "Sức chứa", "Loại phòng", "Vị trí", "Trạng thái", "Mã QR Check-in", "Trang thiết bị", "Mô tả"]
  ];

  ROOMS.forEach(r => {
    rows.push([
      r.code || `RM-00${r.id}`,
      r.name,
      r.capacity,
      r.type || "Hội nghị",
      r.floor || "",
      r.status === "Active" ? "Sẵn sàng hoạt động" : (r.status === "Maintenance" ? "Đang bảo trì" : "Tạm ngừng"),
      r.qrCode || `QR-ROOM-00${r.id}`,
      (r.equipments || []).join(", "),
      r.description || ""
    ]);
  });

  const csvContent = "\uFEFF" + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Danh_sach_phong_hop_Admin_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function syncMeetingRoomOptions() {
  const roomSelect = document.getElementById("meeting-room");
  if (roomSelect) {
    const currentVal = roomSelect.value;
    roomSelect.innerHTML = ROOMS.map(r => `
      <option value="${r.id}" ${r.status !== 'Active' ? 'disabled' : ''}>
        ${escapeHTML(r.name)} (${r.capacity} chỗ)${r.status !== 'Active' ? ' - [' + (r.status === 'Maintenance' ? 'Bảo trì' : 'Tạm ngừng') + ']' : ''}
      </option>
    `).join("");

    if (currentVal && ROOMS.some(r => r.id === parseInt(currentVal, 10))) {
      roomSelect.value = currentVal;
    }
  }

  const filterRoom = document.getElementById("filter-room");
  if (filterRoom) {
    const currFilter = filterRoom.value;
    filterRoom.innerHTML = `
      <option value="all">Tất cả phòng</option>
      ${ROOMS.map(r => `<option value="${r.id}">${escapeHTML(r.name)}</option>`).join("")}
    `;
    if (currFilter) filterRoom.value = currFilter;
  }
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


// Gắn sự kiện cho Modal Quản lý Phòng họp
const roomForm = document.getElementById("room-form");
if (roomForm) {
  roomForm.addEventListener("submit", saveRoom);
}

const btnCloseRoomModal = document.getElementById("btn-close-room-modal");
if (btnCloseRoomModal) {
  btnCloseRoomModal.addEventListener("click", closeRoomModal);
}

const btnRoomCancel = document.getElementById("btn-room-cancel");
if (btnRoomCancel) {
  btnRoomCancel.addEventListener("click", closeRoomModal);
}

const btnRoomSuccessClose = document.getElementById("btn-room-success-close");
if (btnRoomSuccessClose) {
  btnRoomSuccessClose.addEventListener("click", closeRoomModal);
}

// Modal QR Check-in
const btnCloseRoomQr = document.getElementById("btn-close-room-qr");
if (btnCloseRoomQr) {
  btnCloseRoomQr.addEventListener("click", closeRoomQRModal);
}

const btnCloseRoomQrBottom = document.getElementById("btn-close-room-qr-bottom");
if (btnCloseRoomQrBottom) {
  btnCloseRoomQrBottom.addEventListener("click", closeRoomQRModal);
}

const btnPrintRoomQr = document.getElementById("btn-print-room-qr");
if (btnPrintRoomQr) {
  btnPrintRoomQr.addEventListener("click", () => {
    window.print();
  });
}

// Modal Delete Room
const btnCloseRoomDelete = document.getElementById("btn-close-room-delete");
if (btnCloseRoomDelete) {
  btnCloseRoomDelete.addEventListener("click", closeRoomDeleteModal);
}

// Click ra ngoài modal
if (roomModalOverlay) {
  roomModalOverlay.addEventListener("click", function (event) {
    if (event.target === roomModalOverlay) {
      closeRoomModal();
    }
  });
}

if (roomQrOverlay) {
  roomQrOverlay.addEventListener("click", function (event) {
    if (event.target === roomQrOverlay) {
      closeRoomQRModal();
    }
  });
}

if (roomDeleteOverlay) {
  roomDeleteOverlay.addEventListener("click", function (event) {
    if (event.target === roomDeleteOverlay) {
      closeRoomDeleteModal();
    }
  });
}


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

    if (
      roomModalOverlay && !roomModalOverlay.classList.contains("hidden")
    ) {
      closeRoomModal();
    }

    if (
      roomQrOverlay && !roomQrOverlay.classList.contains("hidden")
    ) {
      closeRoomQRModal();
    }

    if (
      roomDeleteOverlay && !roomDeleteOverlay.classList.contains("hidden")
    ) {
      closeRoomDeleteModal();
    }

  }
);


// =====================================================
// 22. KHỞI ĐỘNG ROUTER & ĐỒNG BỘ CSDL
// =====================================================

loadPersistedRooms();
setupRoomFormValidationEvents();
RoomAPI.checkHealth();
syncMeetingRoomOptions();
router();