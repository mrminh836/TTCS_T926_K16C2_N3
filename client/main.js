// =====================================================
// PRODUCT BACKLOG - MEETING MANAGEMENT
// JavaScript thuần
// Bootstrap 5 + Bootstrap Icons
// Router Base + CRUD + Search + Filter
// =====================================================


// =====================================================
// 1. DỮ LIỆU
// =====================================================

let meetings = [
  {
    id: 1,
    title: "Họp nhóm phát triển Frontend",
    date: "2026-09-25",
    time: "09:00",
    location: "Phòng họp A",
    participants: [
      "Nguyễn Minh Lượng",
      "Trần Văn A",
      "Lê Văn B"
    ],
    status: "scheduled",
    notes: "Thảo luận tiến độ phát triển giao diện."
  },

  {
    id: 2,
    title: "Sprint Planning",
    date: "2026-09-26",
    time: "14:00",
    location: "Google Meet",
    participants: [
      "Nguyễn Minh Lượng",
      "Phạm Văn C"
    ],
    status: "in-progress",
    notes: "Lên kế hoạch công việc cho Sprint tiếp theo."
  },

  {
    id: 3,
    title: "Demo sản phẩm",
    date: "2026-09-20",
    time: "15:30",
    location: "Phòng Lab",
    participants: [
      "Nguyễn Minh Lượng",
      "Trần Văn A"
    ],
    status: "completed",
    notes: "Demo các chức năng đã hoàn thành."
  }
];


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


function router() {
  const route = getCurrentRoute();

  const page = routes[route] || render404;

  page();
}


window.addEventListener("hashchange", router);


// =====================================================
// 4. HOME
// =====================================================

function renderHome() {

  app.innerHTML = `
    <section class="page home-page">

      <div class="home-icon">
        <i class="bi bi-calendar-check"></i>
      </div>

      <h2>
        Chào mừng đến với hệ thống
        Quản lý Cuộc họp
      </h2>

      <p>
        Quản lý, theo dõi và tổ chức các cuộc họp
        một cách đơn giản và hiệu quả.
      </p>

      <a
        href="#/meetings"
        class="btn btn-primary">

        <i class="bi bi-calendar3"></i>
        Quản lý cuộc họp

      </a>

    </section>
  `;
}


// =====================================================
// 5. TRANG QUẢN LÝ CUỘC HỌP
// =====================================================

function renderMeetingsPage() {

  app.innerHTML = `

    <section id="meetings-section" class="page">

      <div
        class="d-flex justify-content-between
        align-items-center mb-4">

        <div>

          <h2 class="mb-1">
            <i class="bi bi-calendar3"></i>
            Danh sách cuộc họp
          </h2>

          <p class="text-muted mb-0">
            Quản lý các cuộc họp trong hệ thống
          </p>

        </div>

        <button
          type="button"
          id="btn-add-meeting"
          class="btn btn-primary">

          <i class="bi bi-plus-lg"></i>
          Thêm cuộc họp

        </button>

      </div>


      <div class="toolbar">

        <input
          type="text"
          id="search-meeting"
          class="form-control"
          placeholder="Tìm kiếm cuộc họp..."
        />

        <select
          id="filter-status"
          class="form-select">

          <option value="">
            Tất cả trạng thái
          </option>

          <option value="scheduled">
            Sắp diễn ra
          </option>

          <option value="in-progress">
            Đang diễn ra
          </option>

          <option value="completed">
            Đã hoàn thành
          </option>

          <option value="cancelled">
            Đã hủy
          </option>

        </select>

      </div>


      <div class="table-container">

        <table
          id="meetings-table"
          class="table table-hover">

          <thead>

            <tr>
              <th>ID</th>
              <th>Tiêu đề</th>
              <th>Ngày giờ</th>
              <th>Địa điểm / Link</th>
              <th>Người tham gia</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>

          </thead>

          <tbody id="meetings-list"></tbody>

        </table>

      </div>


      <p
        id="empty-state"
        class="empty-state hidden">

        <i class="bi bi-calendar-x fs-3 d-block mb-2"></i>

        Không tìm thấy cuộc họp nào.

      </p>

    </section>
  `;


  // Gắn sự kiện SAU KHI HTML được render
  setupMeetingEvents();

  renderMeetingTable();
}


// =====================================================
// 6. TRANG 404
// =====================================================

function render404() {

  app.innerHTML = `

    <section class="page error-page">

      <div class="error-code">
        404
      </div>

      <h2>
        Không tìm thấy trang
      </h2>

      <p>
        Đường dẫn bạn truy cập không tồn tại.
      </p>

      <a
        href="#/"
        class="btn btn-primary">

        <i class="bi bi-house"></i>
        Về trang chủ

      </a>

    </section>
  `;
}


// =====================================================
// 7. GẮN EVENT CHO TRANG MEETING
// =====================================================

function setupMeetingEvents() {

  const addButton =
    document.getElementById("btn-add-meeting");

  const form =
    document.getElementById("meeting-form");

  const searchInput =
    document.getElementById("search-meeting");

  const filterSelect =
    document.getElementById("filter-status");

  const cancelButton =
    document.getElementById("btn-cancel");

  const closeModalButton =
    document.getElementById("btn-close-modal");

  const closeDetailButton =
    document.getElementById("btn-close-detail");

  const closeDetailBottom =
    document.getElementById("btn-close-detail-bottom");

  const meetingList =
    document.getElementById("meetings-list");


  // Nút thêm
  if (addButton) {
    addButton.addEventListener("click", openAddModal);
  }


  // Form
  if (form) {
    form.addEventListener("submit", saveMeeting);
  }


  // Tìm kiếm
  if (searchInput) {
    searchInput.addEventListener(
      "input",
      renderMeetingTable
    );
  }


  // Lọc
  if (filterSelect) {
    filterSelect.addEventListener(
      "change",
      renderMeetingTable
    );
  }


  // Hủy
  if (cancelButton) {
    cancelButton.addEventListener(
      "click",
      closeMeetingModal
    );
  }


  // X nút modal
  if (closeModalButton) {
    closeModalButton.addEventListener(
      "click",
      closeMeetingModal
    );
  }


  // Đóng detail
  if (closeDetailButton) {
    closeDetailButton.addEventListener(
      "click",
      closeDetailModal
    );
  }


  // Đóng detail phía dưới
  if (closeDetailBottom) {
    closeDetailBottom.addEventListener(
      "click",
      closeDetailModal
    );
  }


  // Các nút Sửa / Xóa / Xem
  if (meetingList) {

    meetingList.addEventListener(
      "click",
      handleMeetingAction
    );

  }
}


// =====================================================
// 8. RENDER TABLE
// =====================================================

function renderMeetingTable() {

  const list =
    document.getElementById("meetings-list");

  const table =
    document.getElementById("meetings-table");

  const empty =
    document.getElementById("empty-state");

  const searchInput =
    document.getElementById("search-meeting");

  const filterSelect =
    document.getElementById("filter-status");


  // Nếu không ở trang meeting thì dừng
  if (
    !list ||
    !table ||
    !empty ||
    !searchInput ||
    !filterSelect
  ) {
    return;
  }


  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();


  const status =
    filterSelect.value;


  const filteredMeetings =
    meetings.filter(meeting => {

      const title =
        meeting.title.toLowerCase();

      const location =
        (meeting.location || "")
          .toLowerCase();

      const participants =
        meeting.participants
          .join(" ")
          .toLowerCase();


      const matchSearch =
        title.includes(keyword) ||
        location.includes(keyword) ||
        participants.includes(keyword);


      const matchStatus =
        status === "" ||
        meeting.status === status;


      return matchSearch && matchStatus;
    });


  list.innerHTML = "";


  // Không có dữ liệu
  if (filteredMeetings.length === 0) {

    table.classList.add("hidden");

    empty.classList.remove("hidden");

    return;
  }


  table.classList.remove("hidden");

  empty.classList.add("hidden");


  // Render dữ liệu
  filteredMeetings.forEach(meeting => {

    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td data-label="ID">
        ${meeting.id}
      </td>

      <td data-label="Tiêu đề">
        <strong>
          ${escapeHTML(meeting.title)}
        </strong>
      </td>

      <td data-label="Ngày giờ">
        ${formatDate(meeting.date)}
        <br>
        <small>
          ${escapeHTML(meeting.time)}
        </small>
      </td>

      <td data-label="Địa điểm / Link">
        ${escapeHTML(
          meeting.location || "Chưa cập nhật"
        )}
      </td>

      <td data-label="Người tham gia">
        ${escapeHTML(
          meeting.participants.join(", ")
        )}
      </td>

      <td data-label="Trạng thái">

        <span
          class="${getStatusClass(meeting.status)}">

          ${getStatusText(meeting.status)}

        </span>

      </td>

      <td data-label="Hành động">

        <button
          type="button"
          class="btn btn-sm btn-outline-info me-1"
          data-action="detail"
          data-id="${meeting.id}"
          title="Xem chi tiết">

          <i class="bi bi-eye"></i>

        </button>


        <button
          type="button"
          class="btn btn-sm btn-outline-primary me-1"
          data-action="edit"
          data-id="${meeting.id}"
          title="Chỉnh sửa">

          <i class="bi bi-pencil"></i>

        </button>


        <button
          type="button"
          class="btn btn-sm btn-outline-danger"
          data-action="delete"
          data-id="${meeting.id}"
          title="Xóa">

          <i class="bi bi-trash"></i>

        </button>

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
// 10. THÊM CUỘC HỌP
// =====================================================

function openAddModal() {

  const form =
    document.getElementById("meeting-form");

  const title =
    document.getElementById("modal-title");

  const id =
    document.getElementById("meeting-id");


  if (!form || !title || !id) {
    return;
  }


  form.reset();

  id.value = "";

  title.textContent =
    "Thêm cuộc họp";


  modalOverlay.classList.remove("hidden");
}


// =====================================================
// 11. SỬA CUỘC HỌP
// =====================================================

function openEditModal(id) {

  const meeting =
    meetings.find(
      item => item.id === id
    );


  if (!meeting) {
    alert("Không tìm thấy cuộc họp.");
    return;
  }


  document.getElementById("modal-title")
    .textContent =
    "Chỉnh sửa cuộc họp";


  document.getElementById("meeting-id")
    .value =
    meeting.id;


  document.getElementById("meeting-title")
    .value =
    meeting.title;


  document.getElementById("meeting-date")
    .value =
    meeting.date;


  document.getElementById("meeting-time")
    .value =
    meeting.time;


  document.getElementById("meeting-location")
    .value =
    meeting.location;


  document.getElementById("meeting-participants")
    .value =
    meeting.participants.join(", ");


  document.getElementById("meeting-status")
    .value =
    meeting.status;


  document.getElementById("meeting-notes")
    .value =
    meeting.notes;


  modalOverlay.classList.remove("hidden");
}


// =====================================================
// 12. LƯU
// =====================================================

function saveMeeting(event) {

  event.preventDefault();


  const id =
    document.getElementById("meeting-id")
      .value;


  const title =
    document.getElementById("meeting-title")
      .value
      .trim();


  const date =
    document.getElementById("meeting-date")
      .value;


  const time =
    document.getElementById("meeting-time")
      .value;


  const location =
    document.getElementById("meeting-location")
      .value
      .trim();


  const participants =
    document.getElementById("meeting-participants")
      .value
      .split(",")
      .map(item => item.trim())
      .filter(item => item !== "");


  const status =
    document.getElementById("meeting-status")
      .value;


  const notes =
    document.getElementById("meeting-notes")
      .value
      .trim();


  if (!title || !date || !time) {

    alert(
      "Vui lòng nhập đầy đủ Tiêu đề, Ngày và Giờ."
    );

    return;
  }


  // SỬA
  if (id) {

    const index =
      meetings.findIndex(
        item => item.id === Number(id)
      );


    if (index !== -1) {

      meetings[index] = {

        id: Number(id),

        title,
        date,
        time,
        location,
        participants,
        status,
        notes
      };

    }

  }

  // THÊM
  else {

    meetings.push({

      id: getNextId(),

      title,
      date,
      time,
      location,
      participants,
      status,
      notes
    });

  }


  closeMeetingModal();

  renderMeetingTable();
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


  const content =
    document.getElementById("detail-content");


  content.innerHTML = `

    <p>
      <strong>ID:</strong>
      ${meeting.id}
    </p>

    <p>
      <strong>Tiêu đề:</strong>
      ${escapeHTML(meeting.title)}
    </p>

    <p>
      <strong>Ngày:</strong>
      ${formatDate(meeting.date)}
    </p>

    <p>
      <strong>Giờ:</strong>
      ${escapeHTML(meeting.time)}
    </p>

    <p>
      <strong>Địa điểm / Link:</strong>
      ${escapeHTML(
        meeting.location || "Chưa cập nhật"
      )}
    </p>

    <p>
      <strong>Người tham gia:</strong>
      ${escapeHTML(
        meeting.participants.join(", ")
        || "Chưa có"
      )}
    </p>

    <p>
      <strong>Trạng thái:</strong>

      <span
        class="${getStatusClass(meeting.status)}">

        ${getStatusText(meeting.status)}

      </span>

    </p>

    <p>
      <strong>Ghi chú:</strong>
      ${escapeHTML(
        meeting.notes || "Không có ghi chú"
      )}
    </p>

  `;


  detailOverlay.classList.remove("hidden");
}


// =====================================================
// 16. ĐÓNG MODAL
// =====================================================

function closeMeetingModal() {

  modalOverlay.classList.add("hidden");


  const form =
    document.getElementById("meeting-form");


  if (form) {
    form.reset();
  }


  const id =
    document.getElementById("meeting-id");


  if (id) {
    id.value = "";
  }
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

  return `badge badge-${status}`;
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