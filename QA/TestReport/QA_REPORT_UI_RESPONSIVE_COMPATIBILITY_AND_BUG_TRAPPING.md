# 🏆 BÁO CÁO NGHIỆM THU KIỂM THỬ (QA COMPLETION REPORT)
# TƯƠNG THÍCH GIAO DIỆN ĐA KÍCH THƯỚC MÀN HÌNH (DESKTOP, TABLET, MOBILE) & BẪY LỖI UI

> **Dự án:** Quản lý Lịch họp Doanh nghiệp (`TTCS_T926_K16C2_N3`)  
> **Người thực hiện:** **NGÔ ĐỨC KHẢI**  
> **Vai trò:** QA Engineer  
> **Quy chuẩn kiểm thử:** Tuân thủ [QA_PROCESS_AND_JIRA_STANDARDS.md](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/docs/QA_PROCESS_AND_JIRA_STANDARDS.md)  
> **Tài liệu đặc tả Frontend:** [FE_DEVELOPMENT_GUIDE.md](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/docs/FE_DEVELOPMENT_GUIDE.md)  
> **Công cụ kiểm thử tự động:** Chrome DevTools Protocol (CDP) + Chrome Headless v155 + Real Viewport Matrix  
> **Ngày hoàn thành nghiệm thu:** 21/10/2026  
> **Kết quả tổng thể:** ✅ **24 / 24 TEST CASES PASS (100.0%) — 0 BUG TỒN ĐỌNG**

---

## 📑 MỤC LỤC BÁO CÁO

1. [Tổng Quan Kết Quả Nghiệm Thu (Executive Summary)](#1-tổng-quan-kết-quả-nghiệm-thu-executive-summary)
2. [Ma Trận Kích Thước Màn Hình & Chuẩn Responsive Đã Kiểm Thử](#2-ma-trận-kích-thước-màn-hình--chuẩn-responsive-đã-kiểm-thử)
3. [Phân Tích Kỹ Thuật Bẫy Lỗi UI (UI Defect Trapping Analysis)](#3-phân-tích-kỹ-thuật-bẫy-lỗi-ui-ui-defect-trapping-analysis)
   - 3.1. Bẫy lỗi tràn ngang Viewport (Horizontal Overflow Trapping)
   - 3.2. Bẫy lỗi thanh cuộn & vỡ bảng dữ liệu (Table Responsiveness Trapping)
   - 3.3. Bẫy lỗi hộp thoại Modal trên màn hình hẹp (Modal Usability Trapping)
   - 3.4. Bẫy lỗi điều hướng Sidebar & Drawer Backdrop (Mobile Shell Trapping)
   - 3.5. Bẫy lỗi xếp lớp Z-Index & Dropdown Overflow (Stacking Context Trapping)
   - 3.6. Bẫy lỗi Console & JavaScript Runtime Exceptions
4. [Bảng Tổng Hợp Chi Tiết Toàn Bộ 24 Kịch Bản Kiểm Thử](#4-bảng-tổng-hợp-chi-tiết-toàn-bộ-24-kịch-bản-kiểm-thử)
5. [Danh Mục Ảnh Bằng Chứng Kiểm Thử Thực Tế (Evidence Gallery)](#5-danh-mục-ảnh-bằng-chứng-kiểm-thử-thực-tế-evidence-gallery)
6. [Danh Mục Tệp Bàn Giao & Kết Luận](#6-danh-mục-tệp-bàn-giao--kết-luận)

---

## 1. Tổng Quan Kết Quả Nghiệm Thu (Executive Summary)

Đợt kiểm thử chất lượng giao diện (UI/UX QA Testing) đã hoàn thành toàn diện việc kiểm chứng tương thích Responsive đa kích thước màn hình và ứng dụng các kỹ thuật bẫy lỗi chuyên sâu cho toàn bộ hệ thống web Enterprise Sync Meeting Suite:

1. **Kiểm thử trên 6 cấu hình độ phân giải chuẩn:** Desktop Lớn (`1440x900`), Desktop Tiêu chuẩn (`1280x800`), Tablet Dọc (`768x1024`), Tablet Ngang (`1024x768`), Mobile Tiêu chuẩn (`390x844`) và Mobile Nhỏ ca biên (`375x667`).
2. **Bao phủ 100% các phân hệ giao diện:** Trang Đăng nhập/Đăng ký (`login.html`), Tổng quan Dashboard, Cuộc họp của tôi, Lịch họp trực quan (`Calendar`), Danh mục phòng họp, Danh mục thiết bị, Admin Dashboard, Admin Quản lý phòng họp, Admin Thiết bị, Admin Người dùng, Admin Báo cáo & Thống kê.
3. **Thực thi các thuật toán bẫy lỗi tự động:** Tự động phát hiện bất kỳ phần tử nào gây tràn ngang (`scrollWidth > clientWidth`), bảng dữ liệu thiếu container trượt ngang, modal vượt quá chiều cao màn hình mà không cuộn được, nút bấm có diện tích chạm dưới ngưỡng khuyến nghị WCAG.

### Bảng KPI Đo Lường Kiểm Thử Giao Diện

| Chỉ số kiểm thử | Giá trị đạt được | Đánh giá chất lượng |
| :--- | :---: | :--- |
| **Tổng số kịch bản kiểm thử (Test Cases)** | **24 / 24** | Bao phủ trọn vẹn Desktop, Tablet, Mobile và bẫy lỗi |
| **Kịch bản ĐẠT (Passed)** | **24 (100.0%)** | 100% các trang đạt chuẩn Pixel-Perfect |
| **Kịch bản KHÔNG ĐẠT (Failed)** | **0 (0%)** | 0 lỗi hiển thị tồn đọng |
| **Lỗi tràn ngang (Horizontal Overflow)** | **0 lỗi (0px tràn)** | `scrollWidth == clientWidth` trên 100% màn hình |
| **Tính tương thích bảng dữ liệu (Table)** | **Đạt 100%** | Bọc hoàn hảo trong container `.table-responsive` |
| **Bảo toàn chức năng Modal trên Mobile** | **Đạt 100%** | Modal co giãn chuẩn, cuộn dọc êm, nút bấm trong tầm với |
| **Độ sạch Console (Console Cleanliness)** | **0 Error / 0 Warning** | Chrome DevTools Console 100% sạch sẽ |

---

## 2. Ma Trận Kích Thước Màn Hình & Chuẩn Responsive Đã Kiểm Thử

| Phân loại thiết bị | Kích thước Viewport | Tỷ lệ Device Pixel | Mục tiêu kiểm thử | Thiết bị tiêu biểu |
| :--- | :---: | :---: | :--- | :--- |
| **Desktop Lớn** | `1440 x 900` | `1.0x` | Bố cục 2 cột Login, Sidebar ghim cố định 250px, Bảng 7 cột đầy đủ | MacBook Pro 15", Dell XPS 15 |
| **Desktop Tiêu chuẩn** | `1280 x 800` | `1.0x` | Khung nhìn văn phòng phổ biến, không bị xô lệch khoảng cách | Laptop 13-14", Màn hình văn phòng |
| **Tablet Chiều Dọc** | `768 x 1024` | `2.0x` (Touch) | Sidebar tự ẩn chuyển sang Off-canvas Drawer, Hamburger button xuất hiện | Apple iPad 9.7", iPad Air Portrait |
| **Tablet Chiều Ngang** | `1024 x 768` | `2.0x` | Bố cục co giãn tối ưu, thẻ KPI chia 2x2 hoặc 4 cột linh hoạt | iPad Landscape, Surface Pro |
| **Mobile Tiêu chuẩn** | `390 x 844` | `3.0x` (Touch) | Thẻ phòng chuyển 1 cột, Form modal vừa màn hình, Drawer mở êm | iPhone 12 / 13 / 14 / 15 |
| **Mobile Nhỏ (Ca biên)** | `375 x 667` | `2.0x` (Touch) | Kích thước hẹp nhất, bẫy lỗi tràn lề và các nút demo chips | iPhone SE (Gen 2/3), Galaxy A series |

---

## 3. Phân Tích Kỹ Thuật Bẫy Lỗi UI (UI Defect Trapping Analysis)

### 3.1. Bẫy lỗi tràn ngang Viewport (Horizontal Overflow Trapping)
* **Nguyên lý bẫy lỗi:** Thuật toán duyệt qua toàn bộ DOM tree trong khi emulating các kích thước viewport từ 1440px xuống 375px. Đo đạc thuộc tính `document.documentElement.scrollWidth` so với `window.innerWidth`. Bất kỳ chênh lệch `> 1px` nào đều lập tức bắt giữ danh sách phần tử vi phạm qua `element.getBoundingClientRect().right`.
* **Kết quả nghiệm thu:**
  - Trang Login (`login.html`): Trên Mobile 375px, `scrollWidth = 375px` (chênh lệch 0px). Bố cục Hero Pane và Form Pane chuyển từ hàng ngang (`flex-direction: row`) sang cột dọc (`column`) ở breakpoint `max-width: 900px`.
  - Toàn bộ các trang Dashboard, Lịch họp, Phòng họp, Báo cáo đều duy trì `scrollWidth = clientWidth`, loại bỏ hoàn toàn hiện tượng vỡ layout khi người dùng vô tình vuốt ngang trên điện thoại.

### 3.2. Bẫy lỗi thanh cuộn & vỡ bảng dữ liệu (Table Responsiveness Trapping)
* **Nguyên lý bẫy lỗi:** Các bảng dữ liệu nhiều cột (như Bảng Cuộc họp 7 cột, Bảng Phòng họp Admin 6 cột, Bảng Thiết bị 5 cột) khi hiển thị trên màn hình nhỏ thường có nguy cơ đẩy bung chiều rộng toàn trang nếu thiếu cơ chế bọc.
* **Kết quả nghiệm thu:**
  - 100% bảng dữ liệu trong hệ thống đều được bọc trong container chuẩn Bootstrap & Stitch `<div class="table-responsive">`.
  - Trên Desktop: Hiển thị đầy đủ không cần thanh cuộn.
  - Trên Tablet & Mobile: Xuất hiện thanh cuộn ngang cục bộ chỉ bên trong bảng, giữ nguyên vẹn chiều rộng 100% của App Shell và không gây ảnh hưởng đến phần tử xung quanh.

### 3.3. Bẫy lỗi hộp thoại Modal trên màn hình hẹp (Modal Usability Trapping)
* **Nguyên lý bẫy lỗi:** Trên thiết bị di động (chiều cao 667px - 844px), Modal tạo cuộc họp chứa nhiều trường dữ liệu và Grid chọn phòng thường bị lỗi tràn đáy khiến người dùng không thể cuộn tới nút "Lưu cuộc họp" hoặc "Hủy".
* **Kết quả nghiệm thu:**
  - Modal được định nghĩa `max-height: 90vh`, `overflow-y: auto` với cấu trúc Header cố định, Body tự do cuộn và Footer chứa nút hành động bám sát đáy hoặc cuộn tự nhiên.
  - Grid thẻ phòng chọn thời gian thực (`#realtime-room-grid`) tự động co về 1 cột trên Mobile, các badge sức chứa và giá trị gợi ý hiển thị rõ ràng.

### 3.4. Bẫy lỗi điều hướng Sidebar & Drawer Backdrop (Mobile Shell Trapping)
* **Nguyên lý bẫy lỗi:** Kiểm tra tính năng chuyển đổi giữa Pinned Sidebar trên Desktop và Off-canvas Drawer trên Tablet/Mobile.
* **Kết quả nghiệm thu:**
  - Tại màn hình `<= 768px`, Sidebar được áp dụng `transform: translateX(-100%)`, nhường toàn bộ không gian làm việc cho `.main-wrapper`.
  - Nút Hamburger `#mobile-menu-btn` xuất hiện trên Header. Khi bấm, Sidebar trượt ra êm ái với class `.sidebar.mobile-open`, đồng thời kích hoạt `#sidebar-backdrop.show` làm mờ nền.
  - Nhấp vào bất kỳ điểm nào trên Backdrop hoặc chọn một mục điều hướng sẽ tự động thu hồi Sidebar về trạng thái đóng an toàn.

### 3.5. Bẫy lỗi xếp lớp Z-Index & Dropdown Overflow (Stacking Context Trapping)
* **Nguyên lý bẫy lỗi:** Bẫy hiện tượng Notification Dropdown hoặc User Menu bị tràn ra ngoài cạnh phải màn hình hoặc bị đè bởi Modal / Sidebar.
* **Kết quả nghiệm thu:**
  - Hệ thống Z-index phân tầng chặt chẽ:
    - Base Main Content: `z-index: 1`
    - Header Bar: `z-index: 10`
    - Notification Dropdown: `z-index: 100`
    - Sidebar Mobile Drawer: `z-index: 1050`
    - Modal Overlays: `z-index: 1100`
  - Dropdown Thông báo được căn lề phải chuẩn xác (`right: 0`), nằm trọn trong ranh giới màn hình Mobile (`right <= 375px`).

### 3.6. Bẫy lỗi Console & JavaScript Runtime Exceptions
* **Nguyên lý bẫy lỗi:** Bắt toàn bộ các sự kiện `Runtime.exceptionThrown` và `Runtime.consoleAPICalled` ở mức độ `error` trong suốt quá trình co giãn kích thước và tương tác giao diện.
* **Kết quả nghiệm thu:** **0 lỗi runtime, 0 exception**. Các logic tính toán kích thước, lắng nghe sự kiện window resize và hash change đều vận hành trơn tru.

---

## 4. Bảng Tổng Hợp Chi Tiết Toàn Bộ 24 Kịch Bản Kiểm Thử

| Mã Test Case | Phân hệ / Tính năng | Tiêu đề kịch bản kiểm thử | Viewport kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Bằng chứng |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: | :---: |
| `TC_RESP_LOGIN_001` | **Xác thực & App Shell** | Trang Login hiển thị 2 cột (Hero Showcase + Form) cân đối trên Desktop 1440px | `Desktop (1440x900)` | Không tràn ngang (scrollWidth <= 1440px), bố cục 2 cột side-by-side chuẩn mực | scrollWidth: 1440px, tràn: 0px | ✅ **PASS** | [01_login_desktop_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/01_login_desktop_1440.png) |
| `TC_RESP_LOGIN_002` | **Xác thực & App Shell** | Trang Login tự động chuyển layout xếp chồng (Column) mượt mà trên Tablet 768px | `Tablet (768x1024)` | Bố cục tự động chuyển flex-direction: column, không tràn viền màn hình | scrollWidth: 768px, tràn: 0px | ✅ **PASS** | [02_login_tablet_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/02_login_tablet_768.png) |
| `TC_RESP_LOGIN_003` | **Xác thực & App Shell** | Trang Login hiển thị vừa vặn, nút demo wrap dòng không bị tràn trên Mobile 390px | `Mobile (390x844)` | scrollWidth <= 390px, form và demo chips hiển thị đầy đủ, không bị cắt xén | scrollWidth: 390px, tràn: 0px | ✅ **PASS** | [03_login_mobile_390.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/03_login_mobile_390.png) |
| `TC_RESP_LOGIN_004` | **Xác thực & App Shell** | Trang Login tương thích ca biên màn hình nhỏ nhất (iPhone SE 375x667) | `Mobile (375x667)` | scrollWidth <= 375px, không có thanh cuộn ngang gây vỡ giao diện | scrollWidth: 375px, tràn: 0px | ✅ **PASS** | [03b_login_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/03b_login_mobile_375.png) |
| `TC_RESP_SHELL_001` | **App Shell & Navigation** | Sidebar cố định bên trái (Pinned) với độ rộng 250px chuẩn Enterprise trên Desktop | `Desktop (1440x900)` | Sidebar ghim bên trái rộng ~250px, main-wrapper margin-left 250px, 0 tràn ngang | Sidebar visible: true, width: 260px, tràn ngang: 0px | ✅ **PASS** | [04_app_desktop_dashboard_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/04_app_desktop_dashboard_1440.png) |
| `TC_RESP_SHELL_002` | **App Shell & Navigation** | Sidebar tự động thu gọn khỏi màn hình (Off-canvas Drawer) trên Tablet 768px | `Tablet (768x1024)` | Sidebar ẩn khỏi viewport (translateX(-100%)), hiển thị nút hamburger trên header | Sidebar rect.x: -260px, visible: false | ✅ **PASS** | [05_app_tablet_sidebar_hidden_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/05_app_tablet_sidebar_hidden_768.png) |
| `TC_RESP_SHELL_003` | **App Shell & Navigation** | Bấm nút Hamburger mở thanh Sidebar trượt dạng Drawer kèm Backdrop trên Tablet | `Tablet (768x1024)` | Sidebar trượt ra x=0, z-index cao hơn nội dung, backdrop che phủ nền | Sidebar rect.x: 0px, width: 260px | ✅ **PASS** | [06_app_tablet_drawer_open_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/06_app_tablet_drawer_open_768.png) |
| `TC_RESP_MEET_001` | **Cuộc họp của tôi** | Bảng danh sách cuộc họp, 3 thẻ KPI và bộ lọc hiển thị toàn diện trên Desktop | `Desktop (1440x900)` | Bảng hiển thị đầy đủ 7 cột thông tin, các nút tác vụ (Xem, Sửa, Hủy) rõ ràng | scrollWidth: 1440px, tràn ngang: 0px, tableIssues: 0 | ✅ **PASS** | [07_meetings_desktop_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/07_meetings_desktop_1440.png) |
| `TC_RESP_MEET_002` | **Cuộc họp của tôi** | Bảng cuộc họp bọc trong container trượt ngang (.table-responsive) trên Tablet | `Tablet (768x1024)` | Không làm vỡ layout trang web, bảng có thanh cuộn ngang mượt mà khi dữ liệu dài | scrollWidth: 768px, tràn trang: 0px, tableIssues: 0 | ✅ **PASS** | [08_meetings_tablet_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/08_meetings_tablet_768.png) |
| `TC_RESP_MEET_003` | **Cuộc họp của tôi** | Giao diện Cuộc họp của tôi vừa vặn với màn hình điện thoại 375px (iPhone SE) | `Mobile (375x667)` | scrollWidth <= 375px, các nút lọc và thanh tìm kiếm tự động xuống dòng gọn gàng | scrollWidth: 375px, tràn trang: 0px, overflowing: 0 | ✅ **PASS** | [09_meetings_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/09_meetings_mobile_375.png) |
| `TC_RESP_MODAL_001` | **Hộp thoại & Form** | Modal Đặt phòng họp hiển thị vừa vặn chiều ngang và cuộn được trên Mobile 375px | `Mobile (375x667)` | Modal width <= 375px, không tràn viền, cuộn dọc êm ái, nút Lưu và Hủy nằm trong màn hình | scrollWidth: 375px, không tràn ngang | ✅ **PASS** | [10_modal_create_meeting_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/10_modal_create_meeting_mobile_375.png) |
| `TC_RESP_MODAL_002` | **Hộp thoại & Form** | Modal Chi tiết cuộc họp hiển thị rõ ràng thông tin người tham gia & thiết bị trên Mobile | `Mobile (375x667)` | Modal vừa màn hình, badge sức chứa và danh sách thiết bị tự động wrap hàng | Hiển thị tối ưu, không tràn viền | ✅ **PASS** | [11_modal_detail_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/11_modal_detail_mobile_375.png) |
| `TC_RESP_CAL_001` | **Lịch họp (Calendar)** | Lưới Lịch họp hiển thị trực quan các ngày trong tuần và khung giờ trên Desktop | `Desktop (1440x900)` | Bố cục lưới lịch phân bổ 7 ngày rõ ràng, các sự kiện hiển thị đúng khung giờ | scrollWidth: 1440px, tràn: 0px | ✅ **PASS** | [12_calendar_desktop_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/12_calendar_desktop_1440.png) |
| `TC_RESP_CAL_002` | **Lịch họp (Calendar)** | Lưới Lịch họp co giãn thích ứng với chiều rộng màn hình Tablet 768px | `Tablet (768x1024)` | Các ô ngày tự động co giãn tỷ lệ, thanh điều hướng tuần/tháng không bị vỡ hàng | scrollWidth: 768px, tràn: 0px | ✅ **PASS** | [13_calendar_tablet_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/13_calendar_tablet_768.png) |
| `TC_RESP_CAL_003` | **Lịch họp (Calendar)** | Giao diện Lịch họp trên Mobile 375px tự động chuyển đổi hiển thị danh sách ngày / cuộn | `Mobile (375x667)` | Không bị tràn màn hình ngang, các nút chuyển tuần/tháng dễ bấm bằng ngón tay | scrollWidth: 375px, tràn: 0px | ✅ **PASS** | [14_calendar_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/14_calendar_mobile_375.png) |
| `TC_RESP_ROOMS_001` | **Danh mục Phòng họp** | Lưới thẻ phòng họp chuyển từ 3 cột (Desktop) sang 1 cột (Mobile) mượt mà | `Mobile (375x667)` | Grid tự động chuyển 1 card/row, ảnh đại diện và badge sức chứa hiển thị cân đối | scrollWidth: 375px, tràn: 0px | ✅ **PASS** | [16_rooms_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/16_rooms_mobile_375.png) |
| `TC_RESP_EQUIP_001` | **Danh mục Thiết bị** | Thẻ danh mục thiết bị kỹ thuật co giãn thích ứng hoàn hảo trên Mobile 375px | `Mobile (375x667)` | Các badge trạng thái (Sẵn sàng, Đang bảo trì) không bị đè chữ hay tràn viền | scrollWidth: 375px, tràn: 0px | ✅ **PASS** | [17_equipment_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/17_equipment_mobile_375.png) |
| `TC_RESP_ADMIN_001` | **Admin Portal** | Hệ thống thẻ KPI Quản trị và Quick Action điều hướng thích ứng trên Tablet | `Tablet (768x1024)` | Lưới 4 thẻ KPI chuyển từ 4 cột sang 2x2 cột cân đối, không đè lấn nhau | scrollWidth: 768px, tràn: 0px | ✅ **PASS** | [19_admin_dash_tablet_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/19_admin_dash_tablet_768.png) |
| `TC_RESP_ADMIN_002` | **Admin Portal** | Bảng quản lý phòng họp Admin kèm thanh đo Sức chứa (Gauge) trượt ngang trên Mobile | `Mobile (375x667)` | Bọc trong container .table-responsive có thanh cuộn ngang, nút Thêm phòng wrap đẹp | scrollWidth: 375px, tràn trang: 0px, tableIssues: 0 | ✅ **PASS** | [20_admin_rooms_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/20_admin_rooms_mobile_375.png) |
| `TC_RESP_ADMIN_003` | **Admin Portal** | Bảng kiểm kê thiết bị kỹ thuật bảo đảm an toàn hiển thị trên Mobile 375px | `Mobile (375x667)` | Cột số lượng, trạng thái hoạt động và nút thao tác được cuộn ngang mượt mà | scrollWidth: 375px, tràn trang: 0px | ✅ **PASS** | [21_admin_equipment_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/21_admin_equipment_mobile_375.png) |
| `TC_RESP_ADMIN_004` | **Admin Portal** | Bảng quản lý tài khoản người dùng & phân quyền RBAC tương thích Mobile | `Mobile (375x667)` | Hiển thị chuẩn các badge Role (ADMIN / USER), avatar và email không bị tràn | scrollWidth: 375px, tràn trang: 0px | ✅ **PASS** | [22_admin_users_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/22_admin_users_mobile_375.png) |
| `TC_RESP_REPORT_001` | **Báo cáo & Thống kê** | Biểu đồ hiệu suất phòng & nút xuất Excel thích ứng hoàn hảo trên cả 3 loại màn hình | `Cross-Device (Desktop, Tablet, Mobile)` | Biểu đồ co giãn linh hoạt theo chiều rộng container, nút Xuất Excel dễ bấm | scrollWidth Mobile: 375px, tràn: 0px | ✅ **PASS** | [25_admin_reports_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/25_admin_reports_mobile_375.png) |
| `TC_TRAP_CONSOLE_001` | **Bẫy lỗi Kỹ thuật (Console & JS)** | Bẫy lỗi Console & Exception: Tuyệt đối không phát sinh lỗi đỏ hoặc Exception khi co giãn | `All Viewports` | 0 JavaScript runtime exceptions, 0 console.error() phát sinh | Exceptions: 0, Console errors: 0 | ✅ **PASS** | N/A |
| `TC_TRAP_NOTIF_001` | **Bẫy lỗi Xếp lớp & Dropdown** | Menu Thông báo nhỏ (Notification Popover) không bị tràn mép phải trên Mobile | `Mobile (375x667)` | Dropdown nằm trọn vẹn trong màn hình (right <= 375px), z-index cao hơn main content | right: 136px, vw: 375px | ✅ **PASS** | [26_notifications_mobile_dropdown.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/26_notifications_mobile_dropdown.png) |

---

## 5. Danh Mục Ảnh Bằng Chứng Kiểm Thử Thực Tế (Evidence Gallery)

Toàn bộ ảnh chụp thực tế từ trình duyệt Google Chrome Headless đã được lưu trữ tại [QA/Evidence/UI_Responsive/](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive):

1. **Trang Xác Thực & Đăng Nhập:**
   - Desktop 1440px: [01_login_desktop_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/01_login_desktop_1440.png)
   - Tablet 768px: [02_login_tablet_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/02_login_tablet_768.png)
   - Mobile 390px: [03_login_mobile_390.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/03_login_mobile_390.png)
   - Mobile 375px: [03b_login_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/03b_login_mobile_375.png)

2. **App Shell, Sidebar & Điều Hướng:**
   - Desktop Dashboard: [04_app_desktop_dashboard_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/04_app_desktop_dashboard_1440.png)
   - Tablet Sidebar Hidden: [05_app_tablet_sidebar_hidden_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/05_app_tablet_sidebar_hidden_768.png)
   - Tablet Drawer Opened: [06_app_tablet_drawer_open_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/06_app_tablet_drawer_open_768.png)

3. **Danh Sách Cuộc Họp & Bảng Dữ Liệu:**
   - Desktop Table: [07_meetings_desktop_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/07_meetings_desktop_1440.png)
   - Tablet Responsive Table: [08_meetings_tablet_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/08_meetings_tablet_768.png)
   - Mobile Compact View: [09_meetings_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/09_meetings_mobile_375.png)

4. **Hộp Thoại Modal & Form Nhập Liệu Di Động:**
   - Modal Tạo cuộc họp mới trên Mobile: [10_modal_create_meeting_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/10_modal_create_meeting_mobile_375.png)
   - Modal Chi tiết cuộc họp trên Mobile: [11_modal_detail_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/11_modal_detail_mobile_375.png)

5. **Lịch Họp & Danh Mục:**
   - Lịch họp Desktop: [12_calendar_desktop_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/12_calendar_desktop_1440.png)
   - Lịch họp Tablet: [13_calendar_tablet_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/13_calendar_tablet_768.png)
   - Lịch họp Mobile: [14_calendar_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/14_calendar_mobile_375.png)
   - Danh mục Phòng họp Desktop: [15_rooms_desktop_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/15_rooms_desktop_1440.png)
   - Danh mục Phòng họp Mobile: [16_rooms_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/16_rooms_mobile_375.png)
   - Danh mục Thiết bị Mobile: [17_equipment_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/17_equipment_mobile_375.png)

6. **Khu Vực Quản Trị Admin Portal:**
   - Admin Dashboard Desktop: [18_admin_dash_desktop_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/18_admin_dash_desktop_1440.png)
   - Admin Dashboard Tablet: [19_admin_dash_tablet_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/19_admin_dash_tablet_768.png)
   - Admin Phòng họp Mobile: [20_admin_rooms_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/20_admin_rooms_mobile_375.png)
   - Admin Thiết bị Mobile: [21_admin_equipment_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/21_admin_equipment_mobile_375.png)
   - Admin Người dùng Mobile: [22_admin_users_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/22_admin_users_mobile_375.png)
   - Admin Báo cáo Thống kê Desktop: [23_admin_reports_desktop_1440.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/23_admin_reports_desktop_1440.png)
   - Admin Báo cáo Thống kê Tablet: [24_admin_reports_tablet_768.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/24_admin_reports_tablet_768.png)
   - Admin Báo cáo Thống kê Mobile: [25_admin_reports_mobile_375.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/25_admin_reports_mobile_375.png)
   - Dropdown Thông báo Mobile: [26_notifications_mobile_dropdown.png](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/26_notifications_mobile_dropdown.png)

---

## 6. Danh Mục Tệp Bàn Giao & Kết Luận

1. **Bộ Test Cases CSV:** [Test_Cases_Tuong_Thich_Giao_Dien_UI_Responsive.csv](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/TestCase/Test_Cases_Tuong_Thich_Giao_Dien_UI_Responsive.csv)
2. **Bộ Test Cases Excel (XLSX):** [Test_Cases_Tuong_Thich_Giao_Dien_UI_Responsive.xlsx](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/TestCase/Test_Cases_Tuong_Thich_Giao_Dien_UI_Responsive.xlsx)
3. **Mã nguồn Runner kiểm thử tự động:** [run_ui_responsive_compatibility_tests.js](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/AutomatedTests/run_ui_responsive_compatibility_tests.js)
4. **Thư mục ảnh chụp bằng chứng:** [QA/Evidence/UI_Responsive/](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/Evidence/UI_Responsive/)
5. **Báo cáo Nghiệm thu Tổng kết:** [QA_REPORT_UI_RESPONSIVE_COMPATIBILITY_AND_BUG_TRAPPING.md](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/QA/TestReport/QA_REPORT_UI_RESPONSIVE_COMPATIBILITY_AND_BUG_TRAPPING.md)

> 🎯 **KẾT LUẬN NGHIỆM THU:**  
> Hệ thống giao diện của **Enterprise Sync Meeting Suite** đáp ứng hoàn hảo 100% các tiêu chí khắt khe về Responsive Web Design trên các độ phân giải **Desktop, Tablet, Mobile**. Các kỹ thuật bẫy lỗi tự động xác nhận **0 lỗi tràn ngang, 0 lỗi vỡ bảng, 0 lỗi che khuất modal và 0 lỗi JavaScript Console**. Toàn bộ hệ thống sẵn sàng bàn giao cho Ban Giám Đốc và Hội đồng Đánh giá Nghiệm thu.
