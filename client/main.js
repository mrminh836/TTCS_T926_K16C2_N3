// ==========================================
// QUẢN LÝ CUỘC HỌP - MAIN.JS
// JavaScript thuần, không dùng thư viện
// ==========================================

// ---------- DỮ LIỆU MẪU ----------
let meetings = [
  {
    id: 1,
    title: "Họp nhóm phát triển Frontend",
    date: "2026-09-25",
    time: "09:00",
    location: "Phòng họp A",
    participants: ["Nguyễn Minh Lượng", "Trần Văn A", "Lê Văn B"],
    status: "scheduled",
    notes: "Thảo luận tiến độ phát triển giao diện."
  },
  {
    id: 2,
    title: "Sprint Planning",
    date: "2026-09-26",
    time: "14:00",
    location: "Google Meet",
    participants: ["Nguyễn Minh Lượng", "Phạm Văn C"],
    status: "in-progress",
    notes: "Lên kế hoạch công việc cho Sprint tiếp theo."
  },
  {
    id: 3,
    title: "Demo sản phẩm",
    date: "2026-09-20",
    time: "15:30",
    location: "Phòng Lab",
    participants: ["Nguyễn Minh Lượng", "Trần Văn A"],
    status: "completed",
    notes: "Demo các chức năng đã hoàn thành."
  }
];

// ---------- LẤY CÁC PHẦN TỬ HTML ----------
const searchMeeting = document.getElementById("search-meeting");
const filterStatus = document.getElementById("filter-status");
const btnAddMeeting = document.getElementById("btn-add-meeting");

const meetingsTable = document.getElementById("meetings-table");
const meetingsList = document.getElementById("meetings-list");
const emptyState = document.getElementById("empty-state");

// Modal thêm / sửa
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const meetingForm = document.getElementById("meeting-form");

const meetingId = document.getElementById("meeting-id");
const meetingTitle = document.getElementById("meeting-title");
const meetingDate = document.getElementById("meeting-date");
const meetingTime = document.getElementById("meeting-time");
const meetingLocation = document.getElementById("meeting-location");
const meetingParticipants = document.getElementById("meeting-participants");
const meetingStatus = document.getElementById("meeting-status");
const meetingNotes = document.getElementById("meeting-notes");

const btnCancel = document.getElementById("btn-cancel");

// Modal chi tiết
const detailOverlay = document.getElementById("detail-overlay");
const detailContent = document.getElementById("detail-content");
const btnCloseDetail = document.getElementById("btn-close-detail");


// ==========================================
// HÀM HỖ TRỢ
// ==========================================

// Chuyển trạng thái sang tiếng Việt
function getStatusText(status) {
  const statusMap = {
    "scheduled": "Sắp diễn ra",
    "in-progress": "Đang diễn ra",
    "completed": "Đã hoàn thành",
    "cancelled": "Đã hủy"
  };

  return statusMap[status] || "Không xác định";
}


// Lấy class tương ứng với trạng thái
function getStatusClass(status) {
  return `badge badge-${status}`;
}


// Format ngày từ YYYY-MM-DD thành DD/MM/YYYY
function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const parts = dateString.split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


// Escape HTML để tránh chèn HTML ngoài ý muốn
function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ==========================================
// RENDER DANH SÁCH CUỘC HỌP
// ==========================================

function renderMeetings() {
  const keyword = searchMeeting.value.trim().toLowerCase();
  const statusFilter = filterStatus.value;

  // Lọc dữ liệu
  const filteredMeetings = meetings.filter(function (meeting) {

    const matchesKeyword =
      meeting.title.toLowerCase().includes(keyword) ||
      meeting.location.toLowerCase().includes(keyword) ||
      meeting.participants.join(", ").toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "" ||
      meeting.status === statusFilter;

    return matchesKeyword && matchesStatus;
  });

  // Xóa danh sách cũ
  meetingsList.innerHTML = "";

  // Không có dữ liệu
  if (filteredMeetings.length === 0) {
    meetingsTable.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  // Có dữ liệu
  meetingsTable.classList.remove("hidden");
  emptyState.classList.add("hidden");

  // Render từng cuộc họp
  filteredMeetings.forEach(function (meeting) {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td data-label="ID">${meeting.id}</td>

      <td data-label="Tiêu đề">
        <strong>${escapeHTML(meeting.title)}</strong>
      </td>

      <td data-label="Ngày giờ">
        ${formatDate(meeting.date)}
        <br>
        <small>${escapeHTML(meeting.time)}</small>
      </td>

      <td data-label="Địa điểm / Link">
        ${escapeHTML(meeting.location || "Chưa cập nhật")}
      </td>

      <td data-label="Người tham gia">
        ${escapeHTML(meeting.participants.join(", "))}
      </td>

      <td data-label="Trạng thái">
        <span class="${getStatusClass(meeting.status)}">
          ${getStatusText(meeting.status)}
        </span>
      </td>

      <td data-label="Hành động">
        <button
          class="btn-icon"
          title="Xem chi tiết"
          data-action="detail"
          data-id="${meeting.id}"
        >
          👁️
        </button>

        <button
          class="btn-icon"
          title="Chỉnh sửa"
          data-action="edit"
          data-id="${meeting.id}"
        >
          ✏️
        </button>

        <button
          class="btn-icon"
          title="Xóa"
          data-action="delete"
          data-id="${meeting.id}"
        >
          🗑️
        </button>
      </td>
    `;

    meetingsList.appendChild(row);
  });
}


// ==========================================
// MỞ MODAL THÊM CUỘC HỌP
// ==========================================

function openAddModal() {

  modalTitle.textContent = "Thêm cuộc họp";

  meetingForm.reset();

  meetingId.value = "";

  modalOverlay.classList.remove("hidden");
}


// ==========================================
// ĐÓNG MODAL THÊM / SỬA
// ==========================================

function closeMeetingModal() {
  modalOverlay.classList.add("hidden");
  meetingForm.reset();
  meetingId.value = "";
}


// ==========================================
// MỞ MODAL SỬA CUỘC HỌP
// ==========================================

function openEditModal(id) {

  const meeting = meetings.find(function (item) {
    return item.id === id;
  });

  if (!meeting) {
    return;
  }

  modalTitle.textContent = "Chỉnh sửa cuộc họp";

  meetingId.value = meeting.id;
  meetingTitle.value = meeting.title;
  meetingDate.value = meeting.date;
  meetingTime.value = meeting.time;
  meetingLocation.value = meeting.location;
  meetingParticipants.value = meeting.participants.join(", ");
  meetingStatus.value = meeting.status;
  meetingNotes.value = meeting.notes;

  modalOverlay.classList.remove("hidden");
}


// ==========================================
// LƯU CUỘC HỌP
// ==========================================

meetingForm.addEventListener("submit", function (event) {

  event.preventDefault();

  const title = meetingTitle.value.trim();
  const date = meetingDate.value;
  const time = meetingTime.value;
  const location = meetingLocation.value.trim();

  const participants = meetingParticipants.value
    .split(",")
    .map(function (person) {
      return person.trim();
    })
    .filter(function (person) {
      return person !== "";
    });

  const status = meetingStatus.value;
  const notes = meetingNotes.value.trim();

  // Kiểm tra dữ liệu bắt buộc
  if (!title || !date || !time) {
    alert("Vui lòng nhập đầy đủ Tiêu đề, Ngày và Giờ.");
    return;
  }

  // Nếu có ID -> cập nhật
  if (meetingId.value) {

    const id = Number(meetingId.value);

    const index = meetings.findIndex(function (meeting) {
      return meeting.id === id;
    });

    if (index !== -1) {

      meetings[index] = {
        id: id,
        title: title,
        date: date,
        time: time,
        location: location,
        participants: participants,
        status: status,
        notes: notes
      };
    }

  } else {

    // Nếu không có ID -> thêm mới
    const newMeeting = {
      id: getNextId(),
      title: title,
      date: date,
      time: time,
      location: location,
      participants: participants,
      status: status,
      notes: notes
    };

    meetings.push(newMeeting);
  }

  // Đóng modal
  closeMeetingModal();

  // Render lại danh sách
  renderMeetings();
});


// ==========================================
// TẠO ID MỚI
// ==========================================

function getNextId() {

  if (meetings.length === 0) {
    return 1;
  }

  const maxId = Math.max.apply(
    null,
    meetings.map(function (meeting) {
      return meeting.id;
    })
  );

  return maxId + 1;
}


// ==========================================
// XÓA CUỘC HỌP
// ==========================================

function deleteMeeting(id) {

  const meeting = meetings.find(function (item) {
    return item.id === id;
  });

  if (!meeting) {
    return;
  }

  const confirmed = confirm(
    `Bạn có chắc muốn xóa cuộc họp "${meeting.title}" không?`
  );

  if (!confirmed) {
    return;
  }

  meetings = meetings.filter(function (item) {
    return item.id !== id;
  });

  renderMeetings();
}


// ==========================================
// XEM CHI TIẾT CUỘC HỌP
// ==========================================

function openDetailModal(id) {

  const meeting = meetings.find(function (item) {
    return item.id === id;
  });

  if (!meeting) {
    return;
  }

  detailContent.innerHTML = `
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
      ${escapeHTML(meeting.location || "Chưa cập nhật")}
    </p>

    <p>
      <strong>Người tham gia:</strong>
      ${escapeHTML(meeting.participants.join(", ") || "Chưa có")}
    </p>

    <p>
      <strong>Trạng thái:</strong>
      <span class="${getStatusClass(meeting.status)}">
        ${getStatusText(meeting.status)}
      </span>
    </p>

    <p>
      <strong>Ghi chú:</strong>
      ${escapeHTML(meeting.notes || "Không có ghi chú")}
    </p>
  `;

  detailOverlay.classList.remove("hidden");
}


// ==========================================
// ĐÓNG MODAL CHI TIẾT
// ==========================================

function closeDetailModal() {
  detailOverlay.classList.add("hidden");
}


// ==========================================
// SỰ KIỆN NÚT THÊM
// ==========================================

btnAddMeeting.addEventListener("click", function () {
  openAddModal();
});


// ==========================================
// SỰ KIỆN NÚT HỦY
// ==========================================

btnCancel.addEventListener("click", function () {
  closeMeetingModal();
});


// ==========================================
// SỰ KIỆN NÚT ĐÓNG CHI TIẾT
// ==========================================

btnCloseDetail.addEventListener("click", function () {
  closeDetailModal();
});


// ==========================================
// TÌM KIẾM
// ==========================================

searchMeeting.addEventListener("input", function () {
  renderMeetings();
});


// ==========================================
// LỌC TRẠNG THÁI
// ==========================================

filterStatus.addEventListener("change", function () {
  renderMeetings();
});


// ==========================================
// XỬ LÝ CÁC NÚT HÀNH ĐỘNG TRONG TABLE
// ==========================================

meetingsList.addEventListener("click", function (event) {

  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const id = Number(button.dataset.id);

  if (action === "detail") {
    openDetailModal(id);
  }

  if (action === "edit") {
    openEditModal(id);
  }

  if (action === "delete") {
    deleteMeeting(id);
  }
});


// ==========================================
// CLICK RA NGOÀI MODAL ĐỂ ĐÓNG
// ==========================================

modalOverlay.addEventListener("click", function (event) {

  if (event.target === modalOverlay) {
    closeMeetingModal();
  }
});


detailOverlay.addEventListener("click", function (event) {

  if (event.target === detailOverlay) {
    closeDetailModal();
  }
});


// ==========================================
// PHÍM ESC ĐỂ ĐÓNG MODAL
// ==========================================

document.addEventListener("keydown", function (event) {

  if (event.key === "Escape") {

    if (!modalOverlay.classList.contains("hidden")) {
      closeMeetingModal();
    }

    if (!detailOverlay.classList.contains("hidden")) {
      closeDetailModal();
    }
  }
});


// ==========================================
// KHỞI CHẠY ỨNG DỤNG
// ==========================================

renderMeetings();