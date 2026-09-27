// =====================================================
// PRODUCT BACKLOG - MEETING MANAGEMENT
// JavaScript thuần
// Bootstrap 5 + Bootstrap Icons
// Router Base + CRUD + Search + Filter
// + Validate Form + Ghép API tạo/cập nhật cuộc họp
// =====================================================


// =====================================================
// 0. CẤU HÌNH API
// =====================================================

// TODO: Thay bằng base URL API thật của bạn (vd: "https://api.ictu.edu.vn/v1")
const API_BASE_URL = "https://api.example.com";

// Đường dẫn resource cuộc họp
const API_MEETINGS_ENDPOINT = `${API_BASE_URL}/meetings`;


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

    // Xóa lỗi validate ngay khi người dùng gõ lại / chọn lại
    form.addEventListener("input", handleFieldLiveClear);
    form.addEventListener("change", handleFieldLiveClear);
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

  clearFormErrors();
  hideFormAlert();

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


  clearFormErrors();
  hideFormAlert();

  modalOverlay.classList.remove("hidden");
}


// =====================================================
// 12. VALIDATE FORM (CLIENT-SIDE)
// =====================================================

// Danh sách field cần validate và selector tương ứng
const FORM_FIELDS = [
  "meeting-title",
  "meeting-date",
  "meeting-time",
  "meeting-location",
  "meeting-participants",
  "meeting-notes"
];


// Kiểm tra dữ liệu form, trả về { valid, errors }
// errors có dạng: { "meeting-title": "Thông báo lỗi..." }
function validateMeetingForm(data) {

  const errors = {};


  // --- Tiêu đề: bắt buộc, tối thiểu 3 ký tự, tối đa 200 ---
  if (!data.title) {
    errors["meeting-title"] =
      "Vui lòng nhập tiêu đề cuộc họp.";
  } else if (data.title.length < 3) {
    errors["meeting-title"] =
      "Tiêu đề phải có ít nhất 3 ký tự.";
  } else if (data.title.length > 200) {
    errors["meeting-title"] =
      "Tiêu đề không được vượt quá 200 ký tự.";
  }


  // --- Ngày: bắt buộc, đúng định dạng ---
  if (!data.date) {
    errors["meeting-date"] =
      "Vui lòng chọn ngày họp.";
  } else if (Number.isNaN(new Date(data.date).getTime())) {
    errors["meeting-date"] =
      "Ngày họp không hợp lệ.";
  }


  // --- Giờ: bắt buộc, đúng định dạng HH:MM ---
  if (!data.time) {
    errors["meeting-time"] =
      "Vui lòng chọn giờ họp.";
  } else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.time)) {
    errors["meeting-time"] =
      "Giờ họp không hợp lệ.";
  }


  // --- Ngày + giờ không được nằm trong quá khứ khi tạo mới cuộc họp
  //     đang ở trạng thái "Sắp diễn ra" ---
  if (
    !errors["meeting-date"] &&
    !errors["meeting-time"] &&
    data.status === "scheduled" &&
    !data.isEditing
  ) {

    const meetingDateTime =
      new Date(`${data.date}T${data.time}`);

    const now = new Date();

    if (meetingDateTime.getTime() < now.getTime()) {
      errors["meeting-date"] =
        "Cuộc họp \"Sắp diễn ra\" cần có thời gian trong tương lai.";
    }
  }


  // --- Địa điểm: không bắt buộc, tối đa 200 ký tự ---
  if (data.location && data.location.length > 200) {
    errors["meeting-location"] =
      "Địa điểm / Link không được vượt quá 200 ký tự.";
  }


  // --- Người tham gia: nếu có nhập thì mỗi tên tối đa 100 ký tự ---
  if (data.participants.some(name => name.length > 100)) {
    errors["meeting-participants"] =
      "Mỗi tên người tham gia không được vượt quá 100 ký tự.";
  }


  // --- Ghi chú: không bắt buộc, tối đa 1000 ký tự ---
  if (data.notes && data.notes.length > 1000) {
    errors["meeting-notes"] =
      "Ghi chú không được vượt quá 1000 ký tự.";
  }


  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}


// Hiển thị lỗi cho 1 field cụ thể
function showFieldError(fieldId, message) {

  const input =
    document.getElementById(fieldId);

  const errorBox =
    document.getElementById(`error-${fieldId}`);


  if (input) {
    input.classList.add("is-invalid");
  }

  if (errorBox) {
    errorBox.textContent = message;
    errorBox.classList.add("show");
  }
}


// Xóa lỗi của 1 field cụ thể
function clearFieldError(fieldId) {

  const input =
    document.getElementById(fieldId);

  const errorBox =
    document.getElementById(`error-${fieldId}`);


  if (input) {
    input.classList.remove("is-invalid");
  }

  if (errorBox) {
    errorBox.textContent = "";
    errorBox.classList.remove("show");
  }
}


// Hiển thị toàn bộ lỗi trả về từ validateMeetingForm
function showFormErrors(errors) {

  clearFormErrors();

  Object.keys(errors).forEach(fieldId => {
    showFieldError(fieldId, errors[fieldId]);
  });

  // Focus vào field lỗi đầu tiên để người dùng sửa nhanh hơn
  const firstFieldId = Object.keys(errors)[0];

  const firstInput =
    firstFieldId &&
    document.getElementById(firstFieldId);

  if (firstInput) {
    firstInput.focus();
  }
}


// Xóa toàn bộ lỗi validate trên form
function clearFormErrors() {

  FORM_FIELDS.forEach(fieldId => {
    clearFieldError(fieldId);
  });
}


// Khi người dùng gõ / chọn lại field đang lỗi -> xóa lỗi field đó
function handleFieldLiveClear(event) {

  const fieldId = event.target.id;

  if (FORM_FIELDS.includes(fieldId)) {
    clearFieldError(fieldId);
  }
}


// =====================================================
// 13. THÔNG BÁO LỖI / THÀNH CÔNG CHUNG (form-alert)
// =====================================================

function showFormAlert(message, type = "error") {

  const alertBox =
    document.getElementById("form-alert");

  if (!alertBox) {
    return;
  }

  alertBox.textContent = message;

  alertBox.classList.remove("hidden", "form-alert-success");

  if (type === "success") {
    alertBox.classList.add("form-alert-success");
  }
}


function hideFormAlert() {

  const alertBox =
    document.getElementById("form-alert");

  if (!alertBox) {
    return;
  }

  alertBox.textContent = "";
  alertBox.classList.add("hidden");
}


// Bật / tắt trạng thái loading cho nút Lưu khi đang gọi API
function setSaveButtonLoading(isLoading) {

  const button =
    document.getElementById("btn-save-meeting");

  const spinner =
    document.getElementById("btn-save-spinner");

  const icon =
    document.getElementById("btn-save-icon");

  const text =
    document.getElementById("btn-save-text");

  if (!button) {
    return;
  }

  button.disabled = isLoading;

  if (spinner) {
    spinner.classList.toggle("hidden", !isLoading);
  }

  if (icon) {
    icon.classList.toggle("hidden", isLoading);
  }

  if (text) {
    text.textContent =
      isLoading ? "Đang lưu..." : "Lưu";
  }
}


// =====================================================
// 14. GỌI API TẠO / CẬP NHẬT CUỘC HỌP
// =====================================================

// Đọc message lỗi trả về từ API một cách an toàn (không throw nếu body không phải JSON)
async function readErrorMessage(response, fallbackMessage) {

  try {

    const errorBody = await response.json();

    if (errorBody && errorBody.message) {
      return errorBody.message;
    }

  } catch (err) {
    // Body không phải JSON hợp lệ -> bỏ qua, dùng fallback
  }

  return fallbackMessage;
}


// POST /meetings -> tạo cuộc họp mới
async function apiCreateMeeting(payload) {

  const response = await fetch(API_MEETINGS_ENDPOINT, {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(payload)
  });


  if (!response.ok) {

    const message = await readErrorMessage(
      response,
      "Không thể tạo cuộc họp. Vui lòng thử lại."
    );

    throw new Error(message);
  }


  return response.json();
}


// PUT /meetings/:id -> cập nhật cuộc họp
async function apiUpdateMeeting(id, payload) {

  const response = await fetch(
    `${API_MEETINGS_ENDPOINT}/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(payload)
    }
  );


  if (!response.ok) {

    const message = await readErrorMessage(
      response,
      "Không thể cập nhật cuộc họp. Vui lòng thử lại."
    );

    throw new Error(message);
  }


  return response.json();
}


// =====================================================
// 15. LƯU (VALIDATE + GHÉP API)
// =====================================================

async function saveMeeting(event) {

  event.preventDefault();

  hideFormAlert();


  const idValue =
    document.getElementById("meeting-id")
      .value;

  const isEditing = Boolean(idValue);


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


  const formData = {
    title,
    date,
    time,
    location,
    participants,
    status,
    notes,
    isEditing
  };


  // ----- VALIDATE CLIENT-SIDE -----
  const { valid, errors } =
    validateMeetingForm(formData);

  if (!valid) {
    showFormErrors(errors);
    return;
  }


  // Payload gửi lên API (không cần field nội bộ isEditing)
  const payload = {
    title,
    date,
    time,
    location,
    participants,
    status,
    notes
  };


  setSaveButtonLoading(true);


  try {

    if (isEditing) {

      // ----- CẬP NHẬT CUỘC HỌP -----
      const id = Number(idValue);

      const updated =
        await apiUpdateMeeting(id, payload);

      const index =
        meetings.findIndex(
          item => item.id === id
        );

      if (index !== -1) {

        meetings[index] = {
          id,
          ...payload,
          ...(updated || {})
        };

      }

    } else {

      // ----- TẠO CUỘC HỌP MỚI -----
      const created =
        await apiCreateMeeting(payload);

      // Ưu tiên id do server trả về, nếu không có thì tự sinh tạm ở client
      const newMeeting = {
        id: (created && created.id) || getNextId(),
        ...payload,
        ...(created || {})
      };

      meetings.push(newMeeting);
    }

    closeMeetingModal();

    renderMeetingTable();

  } catch (error) {

    console.error("Lỗi khi lưu cuộc họp:", error);

    showFormAlert(
      error.message ||
      "Đã có lỗi xảy ra, vui lòng thử lại."
    );

  } finally {

    setSaveButtonLoading(false);
  }
}


// =====================================================
// 16. ID MỚI (dự phòng khi API không trả về id)
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
// 17. XÓA
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
// 18. XEM CHI TIẾT
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
// 19. ĐÓNG MODAL
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


  clearFormErrors();
  hideFormAlert();
  setSaveButtonLoading(false);
}


function closeDetailModal() {

  detailOverlay.classList.add("hidden");
}


// =====================================================
// 20. FORMAT DATE
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
// 21. STATUS
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
// 22. CHỐNG HTML INJECTION
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
// 23. CLICK RA NGOÀI MODAL
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
// 24. PHÍM ESC
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
// 25. KHỞI ĐỘNG ROUTER
// =====================================================

router();