# 📘 BÁO CÁO TỔNG KẾT HỌC PHẦN THỰC TẬP CƠ SỞ (TTCS)
## ĐỀ TÀI: XÂY DỰNG HỆ THỐNG QUẢN LÝ CUỘC HỌP DOANH NGHIỆP TRÊN NỀN TẢNG WEB (ENTERPRISE MEETING MANAGEMENT SUITE)

* **Mã lớp học phần:** `TTCS_T926_K16C2_N3`  
* **Đơn vị đào tạo:** Trường Đại học Công nghệ Thông tin & Truyền thông (ICTU) — Đại học Thái Nguyên  
* **Khoa:** Công nghệ Thông tin  
* **Nhóm sinh viên thực hiện:** Nhóm 3 (10 thành viên)  
* **Sinh viên đại diện / Scrum Master:** Đỗ Quang Minh  
* **Giảng viên hướng dẫn:** Bộ môn Công nghệ Phần mềm  
* **Thời gian thực hiện:** Tháng 09/2026 – Tháng 10/2026 (4 Sprints Agile/Scrum)  
* **Trạng thái nghiệm thu:** 🚀 **HOÀN THÀNH 100% — DEFINITION OF DONE ĐẠT 100% — READY FOR PRODUCTION**

---

## 📑 MỤC LỤC TỔNG QUAN

1. **CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI & BỐI CẢNH DỰ ÁN**
   - 1.1. Tính cấp thiết của đề tài
   - 1.2. Mục tiêu nghiên cứu và phạm vi triển khai
   - 1.3. Cơ cấu tổ chức đội ngũ và phân công vai trò (RACI Matrix)
2. **CHƯƠNG 2: PHÂN TÍCH YÊU CẦU & KIẾN TRÚC HỆ THỐNG**
   - 2.1. Phân tích yêu cầu chức năng (Functional Requirements)
   - 2.2. Phân tích yêu cầu phi chức năng (Non-Functional Requirements)
   - 2.3. Thiết kế kiến trúc tổng thể (System Architecture & Docker Micro-services)
   - 2.4. Thiết kế cơ sở dữ liệu quan hệ (Database Schema & ERD)
3. **CHƯƠNG 3: QUÁ TRÌNH TRIỂN KHAI THEO MÔ HÌNH AGILE/SCRUM**
   - 3.1. Tổng quan lộ trình phát triển qua 4 Sprints
   - 3.2. Sprint 1: Nền tảng Xác thực JWT, CRUD Phòng họp & Lịch biểu cơ sở
   - 3.3. Sprint 2: Lọc phòng trống thời gian thực, RBAC & Thang đo sức chứa trực quan
   - 3.4. Sprint 3: Đặt lịch định kỳ, Mời người tham dự, Mượn thiết bị & Gợi ý phòng thông minh
   - 3.5. Sprint 4: Kiểm thử toàn trình E2E, Đóng 100% bugs, Đóng gói Docker Compose 1-Click
4. **CHƯƠNG 4: KẾT QUẢ ĐẠT ĐƯỢC & ĐÁNH GIÁ CHẤT LƯỢNG (QA/QC)**
   - 4.1. Bảng tổng hợp tính năng sản phẩm hoàn thiện
   - 4.2. Kết quả kiểm thử tự động toàn trình E2E trên Staging (31/31 Test Cases Pass)
   - 4.3. Báo cáo rà soát và đóng 100% bugs trên bảng Jira Board (18/18 Closed)
   - 4.4. Kiểm định Tiêu chuẩn Hoàn thành (Definition of Done - DoD 100%)
5. **CHƯƠNG 5: KẾT LUẬN & HƯỚNG PHÁT TRIỂN TIẾP THEO**
   - 5.1. Đánh giá kết quả đạt được so với mục tiêu học phần
   - 5.2. Bài học kinh nghiệm trong kỹ năng làm việc nhóm & quản trị dự án Agile
   - 5.3. Định hướng nâng cấp sản phẩm trong tương lai

---

## 🏢 CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI & BỐI CẢNH DỰ ÁN

### 1.1. Tính cấp thiết của đề tài
Trong môi trường doanh nghiệp hiện đại, các cuộc họp trao đổi nội bộ, gặp gỡ đối tác và điều hành dự án diễn ra với tần suất cao. Tuy nhiên, các phương thức quản lý truyền thống (ghi chép thủ công, trao đổi qua nhóm chat) bộc lộ rất nhiều bất cập nghiêm trọng:
* **Xung đột tài nguyên (Double-booking):** Hai hoặc nhiều phòng ban cùng đến sử dụng một phòng họp hoặc cùng mượn một thiết bị chuyên dụng tại cùng một khung giờ.
* **Lãng phí không gian:** Nhóm 3-5 người đặt phòng hội thảo lớn 50 chỗ, khiến các cuộc họp quy mô lớn không có không gian tổ chức.
* **Thiếu khả năng đồng bộ lịch biểu cá nhân:** Người tham dự hay quên lịch, không có tệp iCalendar đồng bộ vào Google Calendar hay Outlook.
* **Khó khăn trong tổng hợp dữ liệu:** Quản trị viên không có công cụ báo cáo thống kê tỷ lệ lấp đầy phòng họp, tần suất mượn thiết bị để tối ưu chi phí vận hành.

Chính vì vậy, đề tài **"Xây dựng Hệ thống Quản lý Cuộc họp Doanh nghiệp trên nền tảng Web"** được nhóm lựa chọn thực hiện nhằm giải quyết triệt để các vấn đề nêu trên bằng một giải pháp công nghệ hiện đại, chuẩn hóa và tự động hóa cao.

### 1.2. Mục tiêu nghiên cứu và phạm vi triển khai
* **Mục tiêu:** Xây dựng hoàn chỉnh một ứng dụng Web Single Page Application (SPA) với kiến trúc RESTful API, cung cấp khả năng đặt phòng họp thông minh, quản lý mượn thiết bị hội nghị, mời đồng nghiệp, đồng bộ iCalendar và xuất báo cáo thống kê trực quan.
* **Phạm vi kỹ thuật:**
  * **Frontend:** Vanilla HTML5, CSS3 hiện đại theo chuẩn thiết kế Stitch Enterprise Design System, Vanilla JavaScript ES6+ module hóa.
  * **Backend:** Node.js 20, Express RESTful API, xác thực bảo mật JWT, mã hóa bcrypt, kiến trúc MVC.
  * **Database:** MySQL 8.0, tuân thủ nghiêm ngặt tính toàn vẹn giao dịch ACID.
  * **DevOps:** Đóng gói toàn bộ hệ thống bằng Docker và Docker Compose, hỗ trợ triển khai 1-Click thông suốt.

### 1.3. Cơ cấu tổ chức đội ngũ và phân công vai trò (RACI Matrix)

| STT | Thành viên | Vai trò chính | Nhiệm vụ trọng tâm | Mức độ đóng góp |
|:---:|---|:---:|---|:---:|
| 1 | **Đỗ Quang Minh** | **Scrum Master (SM) & DevOps** | Quản trị dự án Agile/Jira, điều phối Standup, cấu hình Docker Compose, rà soát DoD, viết Báo cáo tổng kết | **100% (Lead)** |
| 2 | **Đoàn Ngọc Mạnh** | **Backend Lead (BE)** | Thiết kế kiến trúc API, Database Migration, logic chống xung đột lịch, xác thực JWT & RBAC | **100%** |
| 3 | **Đào Đức Mạnh** | **Backend Developer (BE)** | Xây dựng API Quản lý thiết bị, Module Báo cáo/Analytics, Xuất Excel/ICS, tối ưu hóa CSDL | **100%** |
| 4 | **Hoàng Minh Khánh** | **Frontend Lead (FE)** | Thiết kế kiến trúc SPA, Hệ thống Router, Trang Lịch biểu tương tác, Modal Đặt phòng & Thuật toán Best-Fit | **100%** |
| 5 | **Vũ Thị Thanh Ngân** | **Frontend Developer (FE)** | Xây dựng Giao diện Quản trị Admin, Dashboard Thống kê, Thanh đo sức chứa Gauge, Quản lý thiết bị | **100%** |
| 6 | **Ngô Đức Khải** | **QA Lead** | Thiết kế Chiến lược kiểm thử, Xây dựng kịch bản E2E Staging, Rà soát và nghiệm thu đóng Bugs Jira | **100%** |
| 7 | **Triệu Quốc Khánh** | **QA / Tester** | Kiểm thử chức năng Luồng Đặt phòng, Kiểm thử bảo mật (SQLi, XSS), Quay Video Demo hệ thống | **100%** |
| 8 | **Hoàng Văn Khuyến** | **QA / Tester** | Kiểm thử hiệu năng, Kiểm thử biên giao dịch ACID CSDL, Thiết kế Slide thuyết trình | **100%** |
| 9 | **Lương Thị Kim Ngân** | **Business Analyst (BA)** | Khảo sát nghiệp vụ, Viết tài liệu đặc tả User Stories và Tiêu chí chấp nhận (Acceptance Criteria) | **100%** |
| 10 | **Dương Thị Hương** | **Technical Writer (TW)** | Biên soạn Sổ tay hướng dẫn sử dụng, Soát lỗi tài liệu kỹ thuật và biên tập hồ sơ nghiệm thu | **100%** |

---

## ⚙️ CHƯƠNG 2: PHÂN TÍCH YÊU CẦU & KIẾN TRÚC HỆ THỐNG

### 2.1. Phân tích yêu cầu chức năng (Functional Requirements)
Hệ thống được thiết kế theo 6 phân hệ cốt lõi:
1. **Phân hệ Xác thực & Phân quyền (Authentication & RBAC):** Đăng ký, Đăng nhập nhận JWT Token (thời hạn 24h), phân quyền 3 cấp độ: `Admin` (Toàn quyền quản trị), `Manager` (Tổ chức cuộc họp, duyệt tài nguyên), `Employee` (Tham gia cuộc họp, đặt phòng tiêu chuẩn).
2. **Phân hệ Quản lý Phòng họp (Room Management):** Quản lý danh mục phòng họp, phân cấp sức chứa (Nhỏ, Vừa, Lớn, Hội trường), xem chi tiết tiện nghi, sinh mã QR Check-in cửa phòng tự động dạng SVG.
3. **Phân hệ Đặt lịch & Chống xung đột (Meeting Booking & Conflict Detection):** Đặt lịch họp đơn lẻ hoặc định kỳ (chuỗi tuần/tháng), tự động kiểm tra giao thoa thời gian `[StartTime, EndTime]`, từ chối ngay lập tức khi phát hiện trùng lịch với mã phản hồi `409 Conflict`.
4. **Phân hệ Quản lý Thiết bị Hội nghị (Equipment Booking):** Danh mục thiết bị (Máy chiếu, Màn hình tương tác Flip, Bảng điện tử, Hệ thống Micro), bộ lọc thiết bị khả dụng thời gian thực (`GET /api/equipments/available`), bảo vệ giao dịch mượn thiết bị bằng MySQL Transaction.
5. **Phân hệ Gợi ý phòng thông minh (Best-Fit Room Recommendation):** Tự động tính toán số người tham dự để đề xuất phòng có sức chứa tối ưu nhất, hiển thị banner khuyến nghị và áp dụng 1-Click.
6. **Phân hệ Báo cáo & Đồng bộ Lịch (Analytics & Calendar Sync):** Thống kê hiệu suất sử dụng phòng, tỷ lệ lấp đầy, số giờ họp theo phòng ban; xuất báo cáo định dạng Excel/CSV chuẩn UTF-8; xuất tệp `.ics` đồng bộ tức thì vào Google Calendar & Microsoft Outlook.

### 2.2. Phân tích yêu cầu phi chức năng (Non-Functional Requirements)
* **Bảo mật (Security):** Mật khẩu người dùng được băm an toàn bằng thuật toán `bcrypt` với muối ngẫu nhiên; 100% câu truy vấn CSDL sử dụng Prepared Statements chống triệt để SQL Injection; lọc và escape ký tự đầu vào chống Cross-Site Scripting (XSS).
* **Hiệu năng (Performance):** Thời gian phản hồi trung bình của API $< 100\text{ms}$; hỗ trợ tối thiểu 200 kết nối đồng thời nhờ MySQL Connection Pool.
* **Tính khả dụng & Độ tin cậy (Availability):** Cơ chế Healthcheck giám sát kết nối CSDL và dịch vụ nền; tự động phục hồi khi gặp sự cố (`restart: unless-stopped`).
* **Tính tương thích (Compatibility):** Giao diện tương thích hoàn hảo trên các trình duyệt hiện đại (Chrome, Edge, Firefox, Safari) và hỗ trợ hiển thị tối ưu trên thiết bị di động (Responsive Design).

### 2.3. Thiết kế kiến trúc tổng thể (System Architecture & Docker Micro-services)

```
                     ┌─────────────────────────────────────────┐
                     │            NGƯỜI DÙNG / CLIENT          │
                     │  (Trình duyệt Web máy tính / Mobile)    │
                     └────────────────────┬────────────────────┘
                                          │ HTTP :8080
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      MÔI TRƯỜNG DOCKER COMPOSE DỰ ÁN                            │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Frontend Service (meeting_frontend)                                    │  │
│  │    • Web Server: Nginx 1.27 Alpine                                        │  │
│  │    • Phục vụ Static Files (HTML5 / Vanilla CSS / ES6 JavaScript)          │  │
│  │    • Reverse Proxy: Điều hướng các request '/api/*' sang Backend :3000    │  │
│  └──────────────────────────────────────┬────────────────────────────────────┘  │
│                                         │ Proxy pass :3000                      │
│                                         ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ 2. Backend API Service (meeting_backend)                                  │  │
│  │    • Runtime: Node.js 20 Alpine (Express Framework)                       │  │
│  │    • Middleware: verifyJWT, RBAC (requireAdmin, requireManager)           │  │
│  │    • Input Validation & Conflict Detection Engine                         │  │
│  │    • Healthcheck: ping '/api/health' định kỳ 15 giây                      │  │
│  └──────────────────────────────────────┬────────────────────────────────────┘  │
│                                         │ MySQL Protocol :3306                  │
│                                         ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ 3. Database Service (meeting_mysql)                                       │  │
│  │    • Hệ quản trị CSDL: MySQL 8.0 Server (Cổng host: 3308 ↔ Cổng nội bộ: 3306)│
│  │    • Khởi tạo tự động: 'init_database.sql' (Bảng, Ràng buộc, Seed data)   │  │
│  │    • Lưu trữ bền vững: Docker Named Volume 'mysql_data'                   │  │
│  └──────────────────────────────────────┬────────────────────────────────────┘  │
│                                         │ Quản trị trực quan                    │
│                                         ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ 4. Database Admin GUI (meeting_phpmyadmin - Cổng :8082)                   │  │
│  │    • phpMyAdmin phục vụ kiểm tra dữ liệu, sao lưu và bảo trì CSDL         │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 CHƯƠNG 3: QUÁ TRÌNH TRIỂN KHAI THEO MÔ HÌNH AGILE/SCRUM

Quy trình phát triển dự án được thực hiện nghiêm ngặt theo khung làm việc **Agile/Scrum** qua 4 chu kỳ Sprint (mỗi Sprint kéo dài 2 tuần):

### 3.1. Sprint 1: Xây dựng nền tảng cốt lõi (Foundational Sprint)
* **Mục tiêu:** Thiết lập cấu trúc dự án, thiết kế lược đồ CSDL, xây dựng module xác thực JWT và CRUD phòng họp cơ sở.
* **Kết quả:** Hoàn thành 16 tasks, 24 Story Points. API Đăng ký, Đăng nhập, Xem danh sách phòng họp hoạt động ổn định.

### 3.2. Sprint 2: Lọc phòng thời gian thực & Quản trị sức chứa trực quan
* **Mục tiêu:** Xây dựng bộ lọc phòng trống theo ngày giờ, hệ thống thang đo sức chứa Gauge Bar, sinh mã QR Check-in cửa phòng và phân quyền RBAC.
* **Kết quả:** Hoàn thành 18 tasks, 26 Story Points. Đạt chuẩn hiển thị Stitch Enterprise Design System, loại bỏ 100% bug xung đột lọc phòng.

### 3.3. Sprint 3: Đặt lịch định kỳ, Mời đồng nghiệp & Quản lý thiết bị
* **Mục tiêu:** Nâng cấp hệ thống đặt lịch lặp tuần/tháng, tích hợp multi-select mời nhân sự tham gia, quản lý danh mục thiết bị mượn của Admin và thuật toán Best-Fit gợi ý phòng.
* **Kết quả:** Hoàn thành 19 tasks, 28 Story Points. Tỷ lệ kiểm thử E2E đạt 8/8 kịch bản Pass 100%.

### 3.4. Sprint 4: Kiểm thử toàn trình E2E, Đóng bugs & Đóng gói Docker Compose
* **Mục tiêu:** Hoàn thiện kiểm thử toàn trình E2E trên môi trường Staging Docker, rà soát và đóng triệt để 100% bugs còn tồn đọng trên Jira, hoàn thiện cấu hình Docker Compose 1-Click thông suốt, rà soát Definition of Done 100% và chuẩn bị bộ tài liệu bảo vệ đồ án.
* **Kết quả:** Hoàn thành xuất sắc 20 tasks, 32 Story Points. Bộ kiểm thử E2E gồm 31 kịch bản đạt 100% Pass, đóng toàn bộ 18/18 bugs trên bảng Jira Board.

---

## 📊 CHƯƠNG 4: KẾT QUẢ ĐẠT ĐƯỢC & ĐÁNH GIÁ CHẤT LƯỢNG (QA/QC)

### 4.1. Bảng tổng hợp tính năng sản phẩm hoàn thiện

| Phân hệ tính năng | Mô tả chức năng | Mức độ hoàn thiện |
|---|---|:---:|
| **Xác thực & Bảo mật** | Đăng ký, đăng nhập JWT, phân quyền Admin/Manager/Employee, chặn SQLi & XSS | **100% Hoàn thành** |
| **Quản lý Phòng họp** | Danh mục phòng, xem chi tiết, thang đo sức chứa Gauge Bar, sinh ảnh SVG QR Check-in | **100% Hoàn thành** |
| **Đặt lịch & Chống trùng** | Đặt lịch đơn lẻ/định kỳ, kiểm tra xung đột thời gian thực, trả về HTTP 409 Conflict | **100% Hoàn thành** |
| **Mời người tham dự** | Tìm kiếm nhân viên, Multi-select mời tham dự, theo dõi trạng thái phản hồi | **100% Hoàn thành** |
| **Mượn thiết bị hội nghị** | Danh mục thiết bị, lọc thiết bị khả dụng thời gian thực, quản trị bảo trì phía Admin | **100% Hoàn thành** |
| **Gợi ý phòng thông minh** | Thuật toán Best-Fit tự động gợi ý phòng theo quy mô tham dự, áp dụng 1-Click | **100% Hoàn thành** |
| **Báo cáo & Thống kê** | Dashboard phân tích hiệu suất phòng họp, xuất Excel/CSV Unicode UTF-8 | **100% Hoàn thành** |
| **Đồng bộ Lịch iCalendar** | Xuất tệp `.ics` chuẩn RFC-5545 đồng bộ trực tiếp với Google Calendar & Outlook | **100% Hoàn thành** |
| **Đóng gói & Triển khai** | Docker Compose đa dịch vụ (Frontend, Backend, MySQL, phpMyAdmin) chạy 1-Click | **100% Hoàn thành** |

### 4.2. Kết quả kiểm thử tự động toàn trình E2E trên Staging
Bộ kiểm thử toàn trình tự động được thực hiện qua tệp [`server/test/e2eStaging.test.js`](file:///d:/TTCS_T926_K16C2_N3/server/test/e2eStaging.test.js) bao gồm 8 Phase kiểm thử liên hoàn:
* **Phase 1: Đăng nhập & Xác thực hệ thống:** 5/5 kịch bản ĐẠT (Admin, Employee, Manager, Sai mật khẩu, Xác minh `/api/auth/me`).
* **Phase 2: Duyệt & Đặt phòng họp:** 6/6 kịch bản ĐẠT (Lấy danh sách phòng, Xem chi tiết, Kiểm tra phòng khả dụng, Đặt phòng mới, Xác minh lịch trong hệ thống, Kiểm tra danh sách người dự).
* **Phase 3: Mượn thiết bị hội nghị:** 5/5 kịch bản ĐẠT (Xem danh mục thiết bị, Chi tiết thiết bị, Lọc thiết bị khả dụng theo giờ, Admin tạo thiết bị mới, Employee bị từ chối theo RBAC).
* **Phase 4: Báo cáo & Phân tích thống kê:** 4/4 kịch bản ĐẠT (Xem analytics tổng quan, Lọc theo khoảng thời gian, Lọc theo phòng ban, Xuất file Excel/CSV).
* **Phase 5: Quản lý hồ sơ cá nhân:** 2/2 kịch bản ĐẠT (Xem profile, Bảo mật tuyệt đối không lộ `PasswordHash`).
* **Phase 6: Kiểm tra bảo mật liên module:** 4/4 kịch bản ĐẠT (Chặn truy cập không token, Từ chối token giả mạo, Vô hiệu hóa SQL Injection, Lọc an toàn mã độc XSS).
* **Phase 7: Tính nhất quán dữ liệu:** 3/3 kịch bản ĐẠT (Không trùng lặp dữ liệu, Chặn double-booking cùng khung giờ, Healthcheck CSDL).
* **Phase 8: Export iCalendar & Tổng kết:** 2/2 kịch bản ĐẠT (Xuất file `.ics` hợp lệ chuẩn RFC-5545, Kiểm tra 5/5 API endpoint chính).

👉 **Tổng kết kết quả kiểm thử E2E: 31/31 Kịch bản ĐẠT (PASS 100%) — Thời gian thực thi: 1.039 giây.**

### 4.3. Báo cáo rà soát và đóng 100% bugs trên bảng Jira Board
Bộ phận QA đã thực hiện rà soát và đóng toàn bộ **18/18 Bugs (100% CLOSED)**, chi tiết được lưu trữ tại [`docs/QA_BUG_CLOSURE_VERIFICATION_SPRINT_4.md`](file:///d:/TTCS_T926_K16C2_N3/docs/QA_BUG_CLOSURE_VERIFICATION_SPRINT_4.md) và tệp dữ liệu [`docs/qa_bug_log_sprint4_closed.csv`](file:///d:/TTCS_T926_K16C2_N3/docs/qa_bug_log_sprint4_closed.csv). Không còn bất kỳ lỗi nào ở trạng thái Open hay In Progress.

### 4.4. Đánh giá Tiêu chuẩn Definition of Done (DoD 100%)
Dự án đã đáp ứng đầy đủ và vượt mức tất cả các tiêu chí trong Bảng tiêu chuẩn hoàn thành:
1. Mã nguồn sạch, tuân thủ Clean Code & ESLint, 100% commit được review.
2. Bộ kiểm thử tự động gồm 393 Unit/Integration tests và 31 E2E Staging tests đạt tỷ lệ Pass tuyệt đối.
3. Không còn tồn đọng bất kỳ lỗi Blocker, Critical hay Major nào.
4. Triển khai 1-Click thành công với Docker Compose, các container tự động phục hồi khi gặp lỗi.
5. Hồ sơ tài liệu kỹ thuật, hướng dẫn triển khai, slide thuyết trình và video demo được hoàn thiện đầy đủ.

---

## 🎯 CHƯƠNG 5: KẾT LUẬN & HƯỚNG PHÁT TRIỂN TIẾP THEO

### 5.1. Đánh giá kết quả đạt được
Dự án **Hệ thống Quản lý Cuộc họp Doanh nghiệp** đã hoàn thành toàn diện 100% mục tiêu đề ra trong học phần Thực tập Cơ sở:
* Xây dựng thành công một sản phẩm phần mềm hoàn chỉnh, có tính ứng dụng thực tiễn cao cho doanh nghiệp.
* Nắm vững và áp dụng thành thạo quy trình phát triển phần mềm hiện đại Agile/Scrum kết hợp công cụ quản trị Jira.
* Làm chủ công nghệ đóng gói Container với Docker Compose, hiểu sâu về bảo mật ứng dụng web và kỹ thuật kiểm thử tự động toàn trình.

### 5.2. Bài học kinh nghiệm
* **Giao tiếp trong nhóm (Team Communication):** Việc duy trì Daily Standup đều đặn giúp phát hiện sớm các rào cản kỹ thuật và giải quyết nhanh chóng các xung đột về API contract giữa Frontend và Backend.
* **Kiểm thử liên tục (Continuous Testing):** Viết unit test và E2E test song song với quá trình viết code giúp phát hiện lỗi ngay từ giai đoạn đầu, tiết kiệm đáng kể thời gian sửa lỗi trong giai đoạn cuối của dự án.
* **Chuẩn hóa quy trình (Standardization):** Tuân thủ chặt chẽ tiêu chuẩn thiết kế UI/UX và quy tắc đặt tên giúp mã nguồn dự án dễ đọc, dễ bảo trì và dễ mở rộng.

### 5.3. Định hướng phát triển trong tương lai
* Tích hợp hội nghị truyền hình trực tuyến (Video Conference qua WebRTC / Zoom / Google Meet API).
* Ứng dụng Trí tuệ Nhân tạo (AI Chatbot Assistant) hỗ trợ tóm tắt biên bản cuộc họp và tự động phân công công việc (Action Items) sau cuộc họp.
* Xây dựng ứng dụng di động (Mobile App) trên nền tảng React Native hoặc Flutter đồng bộ chung hệ thống Backend API.

---

**XÁC NHẬN CỦA ĐỘI NGŨ THỰC HIỆN DỰ ÁN**  
*Thái Nguyên, ngày 19 tháng 10 năm 2026*  

**Thay mặt nhóm sinh viên thực hiện (Scrum Master)**  
*(Ký và ghi rõ họ tên)*  
**Đỗ Quang Minh**
