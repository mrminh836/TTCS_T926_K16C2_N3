---
name: fe-development-guide
description: Cẩm nang quy chuẩn phát triển Frontend cho dự án Quản lý Cuộc họp (TTCS_T926_K16C2_N3). Cung cấp đầy đủ hướng dẫn thiết kế UI/UX theo Stitch Enterprise, cấu trúc mã nguồn, quy tắc đặt tên, quản lý state, validation, accessibility và tích hợp API đồng bộ CSDL.
---

# 🎨 CẨM NĂNG PHÁT TRIỂN FRONTEND (FRONTEND DEVELOPMENT GUIDE & SKILL)
*(Dự án: TTCS_T926_K16C2_N3 • Doanh nghiệp: Enterprise Sync Meeting Suite)*

Tài liệu này là cẩm nang bắt buộc dành cho lập trình viên Frontend (FE Dev) và AI Coding Assistant khi phát triển, chỉnh sửa hoặc mở rộng bất kỳ tính năng giao diện nào trong thư mục `client/`.

---

## 1. Triết Lý Thiết Kế & Hệ Thống Stitch Design System

Giao diện của dự án tuân theo phong cách **Enterprise SaaS hiện đại**, lấy cảm hứng từ Linear, Notion và bộ thiết kế Stitch UI:
- **Tối giản & Tinh tế**: Sử dụng các mảng màu trung tính làm nền (Slate / Neutral), làm nổi bật các điểm nhấn màu xanh dương (`#2563EB`) và nhãn phân loại.
- **Tập trung vào dữ liệu**: Bảng dữ liệu hiển thị rõ ràng, dễ đọc, khoảng cách padding thoáng (`14px - 18px`), bo góc chuẩn mực (`border-radius: 8px - 14px`).
- **Phản hồi vi mô (Micro-interactions)**: Mọi thao tác người dùng (hover nút bấm, mở modal, submit form, lọc danh sách) đều có hiệu ứng mượt mà (`transition: all 0.15s ease`).
- **Phản hồi trạng thái tức thì**: Có loading spinner khi submit, có Success View Banner xác nhận khi hoàn tất, có thẻ cảnh báo lỗi rõ ràng.

---

## 2. Bảng Mã Màu & Design Tokens Chuẩn (`client/style.css`)

Khi viết CSS mới, **BẮT BUỘC** sử dụng các biến CSS Variable đã khai báo, không được dùng mã màu tùy tiện:

```css
:root {
  /* Màu chủ đạo (Brand Primary) */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-500: #3b82f6;
  --primary-600: #2563eb; /* Màu nút chính & điểm nhấn */
  --primary-700: #1d4ed8;

  /* Bảng màu trung tính (Slate Neutrals) */
  --slate-50: #f8fafc;  /* Nền bảng, nền input readonly */
  --slate-100: #f1f5f9; /* Viền phụ, đường kẻ phân cách */
  --slate-200: #e2e8f0; /* Viền thẻ card, viền input */
  --slate-300: #cbd5e1; /* Viền hover */
  --slate-400: #94a3b8; /* Chữ placeholder, hint icon */
  --slate-500: #64748b; /* Chữ mô tả phụ, thời gian */
  --slate-600: #475569;
  --slate-700: #334155;
  --slate-800: #1e293b; /* Tiêu đề phụ, label form */
  --slate-900: #0f172a; /* Tiêu đề chính h1, h2 */

  /* Màu trạng thái nghiệp vụ (Status) */
  --status-scheduled-bg: #eff6ff;
  --status-scheduled-text: #1d4ed8;
  --status-inprogress-bg: #fef3c7;
  --status-inprogress-text: #b45309;
  --status-completed-bg: #ecfdf5;
  --status-completed-text: #047857;
  --status-cancelled-bg: #fef2f2;
  --status-cancelled-text: #b91c1c;
}
```

---

## 3. Cấu Trúc Mã Nguồn Frontend (`client/`)

```text
client/
├── index.html       # App Shell: Header SaaS, Container <div id="app">, Modal Forms
├── style.css        # Toàn bộ Style: Design Tokens, Responsive, Components, Animations
└── main.js          # Logic: Hash Router, Mock Data/Store, Event Handlers, CRUD, Export
```

### Phân công trách nhiệm:
1. **`index.html`**:
   - Chứa Top Navigation Bar doanh nghiệp.
   - Thẻ `<main id="app">` để Router render nội dung trang (`#/` và `#/meetings`).
   - Khung Modal cố định: `#modal-overlay` (Modal thêm/sửa) và `#detail-overlay` (Modal chi tiết).
2. **`style.css`**:
   - Được phân chia rõ ràng theo từng block có comment phân cách.
   - Tuyệt đối không dùng `!important` bừa bãi (chỉ dùng cho class tiện ích như `.hidden`).
3. **`main.js`**:
   - Khởi tạo router khi load trang và khi sự kiện `hashchange` kích hoạt.
   - Chứa mảng dữ liệu Store (`ROOMS`, `USERS`, `EQUIPMENTS`, `meetings`).
   - Xử lý các nghiệp vụ thêm, sửa, xóa, lọc, tìm kiếm, tính thời lượng, xuất file.

---

## 4. Quy Chuẩn Viết HTML & Khả Năng Tiếp Cận (Accessibility)

### 4.1. Quy tắc bắt buộc về Form & Nhãn (Labels)
> [!CAUTION]
> **Tuyệt đối không để xảy ra lỗi thẻ `<label>` mồ côi (Unassociated Labels).**
> Mọi thẻ `<label>` phải có thuộc tính `for="..."` trỏ đúng vào một `id` của `<input>`, `<select>` hoặc `<textarea>` thực tế. Nếu là tiêu đề của một nhóm hoặc section, **bắt buộc dùng thẻ `<span>` hoặc `<div>`** kèm class `.stitch-label`, không được dùng thẻ `<label>`.

### 4.2. Quy tắc bắt buộc về `aria-label`
Mọi trường nhập liệu đều phải có `aria-label` hoặc `<label for="...">` rõ ràng:
```html
<!-- CHUẨN: Có cả label lẫn aria-label -->
<div class="stitch-form-group">
  <label for="meeting-title" class="stitch-label">
    Tiêu đề cuộc họp <span class="text-danger">*</span>
  </label>
  <input
    type="text"
    id="meeting-title"
    name="meeting_title"
    class="form-control stitch-input"
    maxlength="200"
    aria-label="Tiêu đề cuộc họp"
    required
  />
</div>

<!-- CHUẨN: Tiêu đề nhóm dùng span, không dùng label -->
<div class="stitch-time-card-header">
  <span class="stitch-label m-0">
    Thời gian <span class="text-danger">*</span>
  </span>
</div>
```

---

## 5. Quy Chuẩn Đồng Bộ CSDL & Mô Hình Dữ Liệu (`main.js`)

Mọi đối tượng Cuộc họp (`meeting`) lưu trong Frontend phải tuân thủ nghiêm ngặt cấu trúc 7 bảng CSDL:

```javascript
const meetingSchema = {
  id: 1,                          // MeetingID (INT AUTO_INCREMENT)
  title: "Tiêu đề cuộc họp",      // Meetings.Title (VARCHAR 200 NOT NULL)
  tag: "Sprint 24",              // Nhãn phân loại trực quan
  date: "2026-09-26",            // Ngày họp (YYYY-MM-DD)
  startTime: "09:00",            // Giờ bắt đầu (HH:mm)
  endTime: "10:30",              // Giờ kết thúc (HH:mm)
  time: "09:00 - 10:30",         // Chuỗi hiển thị tiện ích
  roomId: 3,                     // Bookings.RoomID & Rooms.RoomID (INT)
  roomName: "Phòng Hội Nghị A",  // Rooms.RoomName (VARCHAR 100)
  capacity: 30,                  // Rooms.Capacity (INT)
  organizerId: 1,                // Meetings.OrganizerID -> Users.UserID (INT)
  host: "Nguyễn Văn An",         // Users.FullName
  participants: ["Nguyễn Văn An", "Trần Thu Hà"], // Meeting_Participants (User Names)
  participantIds: [1, 2],        // Meeting_Participants.UserID (Array of INT)
  status: "scheduled",           // Bookings.BookingStatus ('scheduled'|'in-progress'|'completed'|'cancelled')
  notes: "Ghi chú cuộc họp",     // Meetings.Description (TEXT)
  isRecurring: false,            // Meetings.IsRecurring (BOOLEAN)
  equipmentIds: [1, 3],          // Booking_Equipments.EquipmentID (Array of INT)
  equipmentNames: ["Máy chiếu Full HD", "Micro & Loa họp"], // Hiển thị trên badge
  startTimeISO: "2026-09-26T09:00:00", // Chuẩn DATETIME ISO
  endTimeISO: "2026-09-26T10:30:00"
};
```

---

## 6. Bộ Quy Tắc Nghiệp Vụ Validation (Frontend Validation Rules)

Trước khi submit hoặc gửi request, Frontend phải kiểm tra đầy đủ các quy tắc:

1. **Tiêu đề cuộc họp (`Title`)**:
   - Bắt buộc nhập, không được chỉ chứa khoảng trắng rỗng (`!title.trim()`).
   - Chiều dài: Tối thiểu 1 ký tự, tối đa 200 ký tự (theo `maxlength="200"`).
   - Khi lỗi: Thêm class `.has-error` vào input, hiển thị icon chấm than đỏ và focus vào ô nhập.

2. **Thời gian cuộc họp (`Time`)**:
   - Ngày họp, giờ bắt đầu và giờ kết thúc là **bắt buộc**.
   - **Giờ kết thúc phải lớn hơn giờ bắt đầu (`endTime > startTime`)**: Sử dụng hàm `calcDuration()` để tự động so sánh số phút. Nếu không thỏa mãn, hiển thị hộp cảnh báo `#time-error-msg` và chặn submit.
   - **Thời lượng cuộc họp**: Tối thiểu 5 phút, tối đa 24 giờ.

3. **Phòng họp & Người tổ chức**:
   - Bắt buộc chọn từ danh mục chuẩn `ROOMS` và `USERS`.

---

## 7. Mẫu Tích Hợp API Chuẩn (RESTful Fetch & Mock Fallback)

Khi gọi API Backend từ Frontend, luôn dùng mô hình **Graceful Fallback**: nếu máy chủ Backend đang hoạt động, gửi dữ liệu qua API; nếu máy chủ chưa bật hoặc ngắt kết nối, lưu trữ trên Local State để người dùng không bị gián đoạn trải nghiệm:

```javascript
async function submitMeetingToBackend(meetingData) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const response = await fetch("http://localhost:3000/api/meetings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: meetingData.title,
        description: meetingData.notes,
        startTime: meetingData.startTimeISO,
        endTime: meetingData.endTimeISO,
        organizerId: meetingData.organizerId,
        roomId: meetingData.roomId,
        isRecurring: meetingData.isRecurring,
        participantIds: meetingData.participantIds,
        equipmentIds: meetingData.equipmentIds
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const result = await response.json();
    return result;
  } catch (error) {
    console.warn("API Backend offline hoặc timeout, chuyển sang lưu trữ bộ nhớ client.");
    return null;
  }
}
```

---

## 8. Hướng Dẫn Xuất Báo Cáo Excel / CSV (Chuẩn Tiếng Việt BOM UTF-8)

Để xuất danh sách cuộc họp ra file CSV mở được bằng Microsoft Excel mà không bị lỗi font tiếng Việt, **bắt buộc chèn tiền tố Byte Order Mark (`\uFEFF`)**:

```javascript
function exportToCSV() {
  const headers = [
    "Mã cuộc họp (MeetingID)",
    "Tiêu đề (Title)",
    "Ngày họp",
    "Thời gian",
    "Phòng họp",
    "Người tổ chức",
    "Trạng thái"
  ];
  const rows = meetings.map(m => [
    m.id,
    `"${(m.title || '').replace(/"/g, '""')}"`,
    m.date,
    `"${m.time}"`,
    `"${m.roomName}"`,
    `"${m.host}"`,
    `"${m.status}"`
  ]);

  // \uFEFF là UTF-8 BOM bắt buộc
  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `danh_sach_cuoc_hop_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
```

---

## 9. Checklist Kiểm Thử Frontend Trước Khi Bàn Giao (FE QA Checklist)

Mỗi khi chỉnh sửa xong code FE, lập trình viên hoặc AI phải kiểm tra danh sách tiêu chí sau:

- [ ] **Console Sạch**: Mở Chrome DevTools (F12) Console, đảm bảo **0 error, 0 warning**.
- [ ] **Accessibility (A11y)**: Không có cảnh báo `No label associated with a form field`.
- [ ] **Form Validation**:
  - Bấm submit khi để trống tiêu đề -> Báo đỏ và focus vào ô tiêu đề.
  - Chọn giờ kết thúc nhỏ hơn giờ bắt đầu -> Hiển thị cảnh báo thời gian không hợp lệ.
- [ ] **Modal Lifecycle**:
  - Bấm nút "+" -> Mở modal, reset form sạch sẽ, focus ô tiêu đề.
  - Bấm "Hủy" hoặc nút "X" -> Đóng modal, không lưu rác vào bảng.
  - Bấm "Lưu" -> Hiện spinner loading, sau đó chuyển sang Success View Banner.
- [ ] **CRUD Hoàn Chỉnh**:
  - Xem chi tiết -> Hiển thị đủ thông tin 7 bảng CSDL.
  - Chỉnh sửa -> Prefill lại 100% dữ liệu cũ (bao gồm cả checkbox lặp lại và thiết bị).
  - Xóa -> Hiện confirm dialog, xóa xong cập nhật lại bảng và 3 thẻ KPI.
- [ ] **Bộ lọc & Tìm kiếm**:
  - Lọc theo từng tab trạng thái -> Bảng cập nhật số lượng chính xác.
  - Lọc theo phòng họp -> Hiển thị đúng phòng đã chọn.
  - Gõ vào ô tìm kiếm -> Lọc live theo tiêu đề, người tổ chức và nội dung.
- [ ] **Responsive**: Kiểm tra hiển thị tốt trên Desktop (`1440px`), Laptop (`1024px`) và Mobile (`375px`).

---

## 10. Hướng Dẫn Phối Hợp & Prompt Cho Coder Khi Làm Việc Với AI Cho Các Sprint Tiếp Theo

Để các lập trình viên khi tiếp nhận các Sprint tương lai có thể ra lệnh cho AI code chính xác, không phá vỡ kiến trúc cũ, hãy áp dụng các khung Prompt chuẩn sau:

### 10.1. Mẫu Prompt phát triển SPRINT 2 (Vòng đời, Họp định kỳ & Thiết bị)
```text
Tôi đang làm Sprint 2 - Tính năng Quản lý thiết bị và Họp định kỳ (US 3.0 & US 12.0).
Đọc kỹ file docs/LUONG_HOAT_DONG_HE_THONG.md (Mục 3.2 và 3.3).
Hãy:
1. Viết API GET /api/equipments/available và POST /api/meetings/recurring.
2. Cập nhật client/main.js để khi người dùng chọn khung giờ họp, chỉ các thiết bị rảnh mới được bật; khi chọn lặp định kỳ, tính toán mảng ngày và kiểm tra xung đột toàn bộ trước khi lưu.
3. Giữ nguyên toàn bộ cấu trúc CSS Stitch và đảm bảo Chrome Console 0 lỗi.
```

### 10.2. Mẫu Prompt phát triển SPRINT 3 (Người dùng, Phân quyền RBAC & Mời họp)
```text
Tôi đang làm Sprint 3 - Phân quyền người dùng & Lời mời họp (US 4.0 & US 20.0).
Đọc kỹ file docs/LUONG_HOAT_DONG_HE_THONG.md (Mục 4.1 và 4.2).
Hãy:
1. Thêm middleware xác thực JWT và phân quyền RBAC (Admin, Organizer, Attendee).
2. Xây dựng giao diện cho phép người tham dự nhận notification và bấm Chấp nhận (Accept) hoặc Từ chối (Decline), cập nhật bảng Meeting_Participants.
3. Không làm hỏng các tính năng Sprint 1 & Sprint 2.
```

### 10.3. Mẫu Prompt phát triển SPRINT 4 (Đồng bộ Lịch cá nhân & Báo cáo thống kê)
```text
Tôi đang làm Sprint 4 - Báo cáo thống kê & Đồng bộ Lịch (US 15.0 & US 22.0).
Đọc kỹ file docs/LUONG_HOAT_DONG_HE_THONG.md (Mục 5.1 và 5.3).
Hãy:
1. Dựng trang Báo cáo thống kê: Biểu đồ tỷ lệ lấp đầy phòng họp (Utilization Rate) và tỷ lệ hủy họp (Cancellation Rate).
2. Tích hợp xuất file báo cáo định dạng Excel / PDF.
3. Viết helper tạo file .ics chuẩn iCalendar để tải và đồng bộ vào Google Calendar.
```

### 10.4. Mẫu Prompt phát triển SPRINT 5 (Smart Scheduler, Check-in QR & Chatbot)
```text
Tôi đang làm Sprint 5 - Tính năng nâng cao AI & QR Check-in (US 5.0 & US 27.0).
Đọc kỹ file docs/LUONG_HOAT_DONG_HE_THONG.md (Mục 6.1 và 6.2).
Hãy:
1. Viết thuật toán Smart Scheduler tìm top 3 khung giờ rảnh chung của nhóm 5 người.
2. Xây dựng cơ chế Check-in bằng QR Code tại cửa phòng, tự động kích hoạt cron job hủy phòng (auto-release) nếu sau 15 phút không có người check-in.
```

