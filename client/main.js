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
    startTime: "09:00",
    endTime: "10:30",
    time: "09:00 - 10:30",
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
    startTime: "14:00",
    endTime: "15:30",
    time: "14:00 - 15:30",
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
    startTime: "15:30",
    endTime: "16:30",
    time: "15:30 - 16:30",
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


  // Nút thêm cuộc họp
  if (addButton) {
    addButton.addEventListener("click", openAddModal);
  }


  // Form submit
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


  // Nút đóng "X" trên modal
  if (closeModalButton) {
    closeModalButton.addEventListener(
      "click",
      closeMeetingModal
    );
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


  // Live validation trên input title (gõ là tự xóa cảnh báo đỏ)
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
  if (locationInput) locationInput.value = meeting.location || "";
  if (participantsInput) participantsInput.value = (meeting.participants || []).join(", ");
  if (statusInput) statusInput.value = meeting.status || "scheduled";

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

  const title = titleInput ? titleInput.value.trim() : "";
  const date = dateInput ? dateInput.value : "";
  const startTime = startInput ? startInput.value : "";
  const endTime = endInput ? endInput.value : "";
  const location = locationInput ? locationInput.value.trim() : "";
  const notes = descInput ? descInput.value.trim() : "";
  const status = statusInput ? statusInput.value : "scheduled";

  const participants = participantsInput
    ? participantsInput.value
        .split(",")
        .map(item => item.trim())
        .filter(item => item !== "")
    : [];

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

  setTimeout(() => {
    // SỬA
    if (id) {
      const index = meetings.findIndex(item => item.id === Number(id));
      if (index !== -1) {
        meetings[index] = {
          id: Number(id),
          title,
          date,
          startTime,
          endTime,
          time: timeDisplay,
          location,
          participants,
          status,
          notes
        };
      }
    }
    // THÊM MỚI
    else {
      meetings.unshift({
        id: getNextId(),
        title,
        date,
        startTime,
        endTime,
        time: timeDisplay,
        location,
        participants,
        status,
        notes
      });
    }

    // Khôi phục nút submit
    if (btnSubmit) btnSubmit.disabled = false;
    if (submitSpinner) submitSpinner.classList.add("hidden");
    if (submitIcon) submitIcon.classList.remove("hidden");
    if (submitText) submitText.innerText = id ? "Cập nhật cuộc họp" : "Tạo cuộc họp";

    // Cập nhật bảng
    renderMeetingTable();

    // Hiển thị Success View
    if (form) form.classList.add("hidden");
    if (successView) {
      successView.classList.remove("hidden");
      const successTitle = document.getElementById("success-title");
      const successTime = document.getElementById("success-time-display");
      const successDate = document.getElementById("success-date-display");
      const successStatus = document.getElementById("success-status-display");

      if (successTitle) successTitle.innerText = `"${title}"`;
      if (successTime) {
        const durText = document.getElementById("duration-text");
        const durLabel = durText ? durText.innerText.replace("Thời lượng: ", "") : "";
        successTime.innerText = `${timeDisplay} (${durLabel})`;
      }
      if (successDate) successDate.innerText = formatDate(date);
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