# 🖥️ TÀI LIỆU SLIDE THUYẾT TRÌNH & KỊCH BẢN VIDEO DEMO
## ĐỒ ÁN THỰC TẬP CƠ SỞ: HỆ THỐNG QUẢN LÝ CUỘC HỌP DOANH NGHIỆP TRÊN NỀN TẢNG WEB
**Mã lớp học phần:** `TTCS_T926_K16C2_N3` | **Khoa:** Công nghệ Thông tin — Đại học ICTU  
**Nhóm thực hiện:** Nhóm 3 (10 thành viên) | **Scrum Master:** Đỗ Quang Minh  

---

# PHẦN 1: BỘ NỘI DUNG SLIDE THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN (20 SLIDES)

### SLIDE 1: TRANG TIÊU ĐỀ (Title Slide)
* **Tiêu đề lớn:** HỆ THỐNG QUẢN LÝ CUỘC HỌP DOANH NGHIỆP TRÊN NỀN TẢNG WEB (Enterprise Meeting Management Suite)
* **Học phần:** Thực tập Cơ sở — Ngành Công nghệ Phần mềm
* **Nhóm sinh viên thực hiện:** Nhóm 3 — Lớp K16C2 (10 thành viên)
* **Người trình bày:** Đỗ Quang Minh (Scrum Master) & Nhóm trưởng các bộ phận (FE, BE, QA)
* **Giảng viên hướng dẫn:** Bộ môn Công nghệ Phần mềm — ICTU
* **Thời gian:** Tháng 10/2026

### SLIDE 2: NỘI DUNG TRÌNH BÀY (Agenda)
1. Bối cảnh & Tính cấp thiết của đề tài
2. Mục tiêu nghiên cứu & Giải pháp công nghệ
3. Kiến trúc hệ thống & Triển khai Docker Compose 1-Click
4. Quy trình phát triển Agile/Scrum qua 4 Sprints
5. Trình diễn tính năng thực tế (Live Demo)
6. Đánh giá chất lượng QA & Kiểm thử E2E Staging
7. Kết luận & Hướng phát triển tương lai

### SLIDE 3: BỐI CẢNH & TÍNH CẤP THIẾT (Problem Statement)
* **Thực trạng doanh nghiệp:** Lịch họp phân tán, ghi nhận thủ công qua chat/email, tỷ lệ xung đột phòng họp cao.
* **Các "nỗi đau" (Pain Points) chính:**
  - ❌ **Double-booking:** 2 cuộc họp đặt trùng một phòng hoặc mượn chung thiết bị hội nghị.
  - ❌ **Lãng phí không gian:** Phòng 50 chỗ nhưng chỉ có 3 người tham gia; phòng nhỏ thì quá tải.
  - ❌ **Quên lịch họp:** Thiếu khả năng đồng bộ lịch với Google Calendar / Outlook cá nhân.
  - ❌ **Thiếu dữ liệu điều hành:** Quản trị viên không đo lường được hiệu suất sử dụng phòng.

### SLIDE 4: MỤC TIÊU DỰ ÁN & GIẢI PHÁP ĐỀ XUẤT (Project Goals)
* **Mục tiêu:** Xây dựng hệ thống quản lý tập trung, trực quan, tin cậy cao và thân thiện với người dùng.
* **Giải pháp cốt lõi:**
  - ✅ **Chống trùng lịch 100%:** Kiểm tra giao thoa thời gian và thiết bị trong MySQL Transaction.
  - ✅ **Gợi ý phòng thông minh (Best-Fit):** Tự động đề xuất phòng phù hợp nhất theo số lượng người tham gia.
  - ✅ **Mã QR Check-in cửa phòng:** Sinh mã SVG tức thì phục vụ quét thẻ và in bảng dán cửa phòng.
  - ✅ **Đồng bộ iCalendar (.ics):** 1-Click đồng bộ lịch vào Google Calendar / Outlook.
  - ✅ **Phân tích số liệu trực quan:** Báo cáo tần suất sử dụng và xuất file Excel chuẩn UTF-8.

### SLIDE 5: HỆ SINH THÁI CÔNG NGHỆ ÁP DỤNG (Technology Stack)
* **Frontend:** Vanilla HTML5, CSS3 chuẩn Stitch Enterprise Design System (Dark/Light Mode, Glassmorphism, Micro-animations), Vanilla JavaScript ES6+ module hóa.
* **Backend:** Node.js 20, Express RESTful API, JWT Authentication, bcrypt, Middleware RBAC.
* **Database:** MySQL 8.0, ACID Transactions, Connection Pooling, Indexed Queries.
* **DevOps & QA:** Docker, Docker Compose đa container, Nginx reverse proxy, Node.js Native Test Runner (E2E Staging Tests), Jira Software.

### SLIDE 6: KIẾN TRÚC TỔNG THỂ HỆ THỐNG (System Architecture)
* **Mô hình Client - Server - Database đa tầng:**
  - **Client Layer:** Trình duyệt Web máy tính & Mobile truy cập cổng `:8080`.
  - **Reverse Proxy Layer:** Nginx 1.27 Alpine phục vụ Static SPA và điều hướng `/api/` về Backend.
  - **Application Service Layer:** Node.js Express API cổng `:3000` xử lý nghiệp vụ và bảo mật.
  - **Data Storage Layer:** MySQL 8.0 cổng `:3308` lưu trữ dữ liệu bền vững qua Docker Volume.
  - **Management GUI Layer:** phpMyAdmin cổng `:8082` phục vụ quản trị dữ liệu trực quan.

### SLIDE 7: THIẾT KẾ CƠ SỞ DỮ LIỆU QUAN HỆ (Database Schema & ERD)
* **6 Bảng CSDL cốt lõi:**
  1. `Users`: Lưu trữ tài khoản, mật khẩu bcrypt, vai trò (Admin, Manager, Employee), phòng ban.
  2. `Rooms`: Quản lý phòng họp, vị trí, sức chứa chuẩn và sức chứa tối đa, trạng thái.
  3. `Meetings`: Cuộc họp, thời gian bắt đầu/kết thúc, người tổ chức, trạng thái xác nhận.
  4. `Bookings`: Phiên đặt phòng họp liên kết với Meetings và Rooms.
  5. `Equipments`: Danh mục thiết bị hội nghị, mã tài sản, trạng thái sẵn sàng/bảo trì.
  6. `Booking_Equipments` & `Meeting_Participants`: Bảng liên kết mượn thiết bị và mời người tham dự.
* **Ràng buộc toàn vẹn:** Khóa ngoại `ON DELETE RESTRICT` bảo vệ dữ liệu lịch sử giao dịch.

### SLIDE 8: PHÂN QUYỀN TRUY CẬP DỰA TRÊN VAI TRÒ (RBAC Architecture)
* **Admin (Quản trị viên hệ thống):**
  - Quản lý danh mục phòng họp (Thêm/Sửa/Xóa/Chuyển trạng thái bảo trì).
  - Quản trị thiết bị hội nghị, xem báo cáo tổng hợp toàn công ty, cấp quyền tài khoản.
* **Manager (Trưởng phòng / Quản lý):**
  - Tổ chức cuộc họp, đặt phòng ưu tiên, mượn thiết bị, mời nhân sự, xuất file iCalendar và báo cáo.
* **Employee (Nhân viên thông thường):**
  - Xem lịch họp cá nhân, đặt phòng họp tiêu chuẩn, xác nhận tham dự (Accepted/Declined).

### SLIDE 9: QUY TRÌNH PHÁT TRIỂN AGILE/SCRUM (Agile Lifecycle)
* **Áp dụng mô hình Scrum chuẩn:**
  - Chu kỳ phát triển: 4 Sprints (mỗi Sprint 2 tuần).
  - Các sự kiện Scrum: Sprint Planning, Daily Standup (hàng ngày), Sprint Review & Sprint Retrospective.
  - Công cụ quản trị: Jira Software Board với quy trình 4 cột (`To Do` → `In Progress` → `In Review` → `Done`).
* **Tổng kết năng lực đội ngũ:**
  - Sprint 1: 24.0 SP | Sprint 2: 26.0 SP | Sprint 3: 28.0 SP | Sprint 4: 32.0 SP.
  - **Tổng cộng: 110.0 Story Points hoàn thành 100%.**

### SLIDE 10: TÍNH NĂNG 1 — ĐẶT PHÒNG HỌP & CHỐNG XUNG ĐỘT (Conflict Prevention)
* **Thuật toán kiểm tra giao thoa thời gian:**
  - Điều kiện xung đột: $\text{StartTime} < \text{EndExisting} \land \text{EndTime} > \text{StartExisting}$.
  - Khi phát hiện trùng lặp: Ngay lập tức từ chối và trả về mã HTTP `409 Conflict` kèm thông tin phòng đang bận.
* **Hỗ trợ đặt lịch định kỳ:** Sinh chuỗi họp lặp hàng tuần hoặc hàng tháng, kiểm tra tính khả dụng của toàn bộ chuỗi.

### SLIDE 11: TÍNH NĂNG 2 — GỢI Ý PHÒNG THÔNG MINH THEO QUY MÔ (Smart Best-Fit)
* **Cơ chế hoạt động:**
  - Khi người dùng chọn số lượng người tham dự (hoặc tích chọn danh sách đồng nghiệp), thuật toán Best-Fit tự động phân tích:
    - $\Delta = \text{Room Capacity} - \text{Participant Count}$ ($\Delta \ge 0$).
  - Ưu tiên chọn phòng có độ lệch $\Delta$ nhỏ nhất và ở trạng thái `Active`.
* **Trải nghiệm người dùng:** Hiển thị Banner khuyến nghị nổi bật trên modal và nút 1-Click "Áp dụng gợi ý".

### SLIDE 12: TÍNH NĂNG 3 — MƯỢN THIẾT BỊ HỘI NGHỊ THỜI GIAN THỰC (Equipment Booking)
* **Vòng đời mượn thiết bị:**
  - Lọc danh sách thiết bị khả dụng theo thời gian thực (`GET /api/equipments/available`).
  - Badge trạng thái trực quan: Xanh lá (Có sẵn), Cam (Đang bận khung giờ này), Xám (Đang bảo trì).
  - Vô hiệu hóa checkbox chọn thiết bị nếu thiết bị không khả dụng, ngăn chặn lỗi từ phía người dùng.
* **An toàn giao dịch:** Mượn nhiều thiết bị cùng lúc trong một Transaction CSDL, nếu một thiết bị lỗi thì tự động rollback toàn bộ.

### SLIDE 13: TÍNH NĂNG 4 — BÁO CÁO HIỆU SUẤT & XUẤT EXCEL (Analytics & Export)
* **Dashboard trực quan:**
  - Biểu đồ tỷ lệ lấp đầy phòng họp (Occupancy Rate).
  - Thống kê tổng số cuộc họp, tổng số giờ họp theo phòng ban và theo tháng.
* **Xuất dữ liệu linh hoạt:**
  - Xuất báo cáo bảng biểu định dạng Excel/CSV hỗ trợ font tiếng Việt Unicode chuẩn UTF-8 BOM.
  - Xuất tệp iCalendar `.ics` chuẩn RFC-5545 phục vụ đồng bộ lịch biểu tức thì.

### SLIDE 14: BẢO MẬT & TỐI ƯU HÓA HỆ THỐNG (Security & Optimization)
* **Chống SQL Injection:** 100% truy vấn CSDL dùng Prepared Statements parameterized (`?`).
* **Chống Cross-Site Scripting (XSS):** Làm sạch đầu vào bằng Regex và mã hóa HTML (`escapeHTML`) khi hiển thị.
* **Bảo mật dữ liệu nhạy cảm:** Tuyệt đối không trả về trường `PasswordHash` trong bất kỳ API nào.
* **Tối ưu hóa Database Index:** Đánh chỉ mục B-Tree trên các cột tìm kiếm và lọc thời gian (`StartTime`, `EndTime`, `Role`, `Department`).

### SLIDE 15: TRIỂN KHAI 1-CLICK VỚI DOCKER COMPOSE (DevOps Showcase)
* **Triển khai tự động chỉ với 1 dòng lệnh:** `docker-compose up -d --build`
* **4 Dịch vụ containerized kết nối mạng nội bộ `meeting_net`:**
  - `meeting_frontend`: Cổng `8080` (Nginx SPA + Reverse Proxy).
  - `meeting_backend`: Cổng `3000` (Node.js API + Healthcheck 15s).
  - `meeting_mysql`: Cổng host `3308` ↔ Cổng nội bộ `3306` (MySQL 8.0 bền vững).
  - `meeting_phpmyadmin`: Cổng `8082` (Giao diện quản lý CSDL).
* **Khả năng chống xung đột:** Tự động né cổng MySQL 3306 của máy host, đảm bảo chạy mượt trên mọi môi trường.

### SLIDE 16: KẾT QUẢ KIỂM THỬ TOÀN TRÌNH E2E TRÊN STAGING (QA Results)
* **Kịch bản kiểm thử E2E liên hoàn 8 Phase:**
  - Phase 1: Đăng nhập & Xác thực hệ thống (5/5 Pass)
  - Phase 2: Duyệt & Đặt phòng họp (6/6 Pass)
  - Phase 3: Mượn thiết bị hội nghị (5/5 Pass)
  - Phase 4: Báo cáo & Phân tích thống kê (4/4 Pass)
  - Phase 5: Quản lý hồ sơ cá nhân (2/2 Pass)
  - Phase 6: Kiểm tra bảo mật liên module (4/4 Pass)
  - Phase 7: Tính nhất quán dữ liệu & Double-booking (3/3 Pass)
  - Phase 8: Xuất lịch iCalendar & Healthcheck (2/2 Pass)
* 👉 **TỔNG KẾT: 31/31 KỊCH BẢN ĐẠT (PASS 100%) — THỜI GIAN CHẠY: 1.04 GIÂY.**

### SLIDE 17: BÁO CÁO ĐÓNG TOÀN BỘ BUGS TỒN ĐỌNG (Zero Bug Milestone)
* **Tổng số Bugs ghi nhận trên Jira qua 4 Sprints:** 18 Bugs.
* **Số lượng Bugs đã xử lý, xác minh và đóng (Closed):** 18/18 Bugs (100%).
* **Số lượng Bugs tồn đọng (Open / In Progress):** **0 BUG (Zero Defect).**
* Toàn bộ các ca biên (Edge cases) như double-booking cùng tích tắc, injection trong search, lỗi ký tự Unicode tiếng Việt khi xuất Excel đều đã được xử lý triệt để.

### SLIDE 18: NGHIỆM THU TIÊU CHUẨN DEFINITION OF DONE (DoD 100%)
* ✅ **Mã nguồn:** Tuân thủ Clean Code, không còn warning, 100% PR qua Code Review.
* ✅ **Unit Test:** 393/393 unit tests và integration tests đạt Pass.
* ✅ **E2E Staging Test:** 31/31 kịch bản kiểm thử toàn trình đạt Pass trên Docker Staging.
* ✅ **Bug Policy:** Đạt chuẩn Zero Open Bug.
* ✅ **Đóng gói:** Docker Compose 1-Click thông suốt, Nginx reverse proxy chuẩn mực.
* ✅ **Hồ sơ nghiệm thu:** Đầy đủ Báo cáo tổng kết TTCS, Slide thuyết trình và Video Demo.

### SLIDE 19: BÀI HỌC KINH NGHIỆM & KỸ NĂNG ĐẠT ĐƯỢC (Lessons Learned)
* **Kỹ thuật chuyên môn:** Nắm vững kiến trúc Web hiện đại, quản lý giao dịch CSDL ACID, đóng gói Docker Container và thiết kế giao diện UI/UX doanh nghiệp chuẩn Stitch.
* **Kỹ năng mềm & Quản trị dự án:**
  - Thành thạo mô hình Agile/Scrum và công cụ Jira Software trong quản trị tiến độ và phân rã công việc.
  - Kỹ năng phối hợp nhóm (Teamwork), giao tiếp giải tỏa rào cản kỹ thuật qua Daily Standup.
  - Kỹ năng viết tài liệu kỹ thuật và báo cáo khoa học theo chuẩn học thuật.

### SLIDE 20: TỔNG KẾT & LỜI CẢM ƠN (Conclusion & Q&A)
* **Tổng kết:** Đồ án đã hoàn thành xuất sắc 100% mục tiêu học phần Thực tập Cơ sở, sản phẩm đạt độ chín muồi cao, sẵn sàng phục vụ triển khai thực tế.
* **Lời cảm ơn:** Nhóm xin chân thành cảm ơn các Thầy Cô trong Bộ môn Công nghệ Phần mềm — Khoa CNTT — Đại học ICTU đã tận tình hướng dẫn và đóng góp ý kiến quý báu cho nhóm trong suốt quá trình thực hiện dự án!
* ❓ **KÍNH MỜI THẦY CÔ VÀ CÁC BẠN ĐẶT CÂU HỎI (Q&A Session)!**

---

# PHẦN 2: KỊCH BẢN VIDEO DEMO TOÀN TRÌNH HỆ THỐNG (DEMO SCRIPT)

* **Thời lượng video dự kiến:** 5 phút 00 giây  
* **Độ phân giải chuẩn:** Full HD 1080p (1920x1080) — 60 FPS  
* **Môi trường demo:** Chạy trực tiếp trên cụm Docker Compose (`http://localhost:8080`)  
* **Giọng đọc thuyết minh (Voice-over):** Rõ ràng, truyền cảm, tự tin, chuyên nghiệp  

---

### PHÂN CẢNH 1: KHỞI ĐỘNG HỆ THỐNG 1-CLICK & ĐĂNG NHẬP (0:00 – 0:50)
* **Hành động trên màn hình:**
  1. Mở Terminal / PowerShell tại thư mục dự án.
  2. Gõ lệnh: `docker-compose up -d --build`.
  3. Màn hình hiển thị 4 container (`meeting_frontend`, `meeting_backend`, `meeting_mysql`, `meeting_phpmyadmin`) khởi động thành công và chuyển sang trạng thái `Healthy`.
  4. Mở trình duyệt Web, truy cập địa chỉ: `http://localhost:8080`.
  5. Giao diện trang chủ xuất hiện mượt mà với tông màu xanh doanh nghiệp Stitch Enterprise.
  6. Click nút **"Đăng nhập"**, nhập tài khoản Quản lý: `manager` / `Password123`.
  7. Nhấn Enter: Nhận thông báo đăng nhập thành công, Header hiển thị Avatar cùng thông tin tài khoản và Role Badge: `Manager`.
* **Lời thoại thuyết minh:**
  > *"Xin chào Thầy Cô và các bạn. Đây là video demo toàn trình Hệ thống Quản lý Cuộc họp Doanh nghiệp của Nhóm 3. Đầu tiên, toàn bộ hệ thống được đóng gói tối ưu hóa với Docker Compose, cho phép triển khai 1-Click thông suốt bao gồm Frontend Nginx, Backend Node.js, CSDL MySQL 8.0 và phpMyAdmin. Người dùng truy cập hệ thống tại cổng 8080 và đăng nhập an toàn bằng cơ chế mã hóa JWT Token."*

---

### PHÂN CẢNH 2: DUYỆT DANH MỤC PHÒNG & XEM MÃ QR CHECK-IN (0:50 – 1:40)
* **Hành động trên màn hình:**
  1. Điều hướng sang tab **"Phòng họp"**.
  2. Xem danh sách các phòng họp được hiển thị dạng thẻ trực quan kèm ảnh phòng, sức chứa chuẩn, sức chứa tối đa và thang đo tải trọng Gauge Bar.
  3. Kéo thanh trượt bộ lọc sức chứa: Danh sách tự động lọc mượt mà không cần tải lại trang.
  4. Nhấn nút **"Xem chi tiết"** tại thẻ `Phòng Tokyo (Tầng 4)`.
  5. Modal chi tiết mở ra, hiển thị các tiện nghi (Máy chiếu, Bảng tương tác, Điều hòa âm trần) và mã QR Check-in dạng SVG sắc nét tích hợp logo ICTU.
  6. Click nút **"In thẻ dán cửa"**: Cửa sổ in thẻ placard cửa phòng hiển thị chuẩn chỉn.
* **Lời thoại thuyết minh:**
  > *"Tiếp theo là phân hệ Quản lý Phòng họp. Giao diện cung cấp cái nhìn trực quan về hiện trạng phòng họp toàn công ty. Mỗi phòng đều có thang đo sức chứa trực quan và hệ thống mã QR Check-in cửa phòng tự động dạng SVG, giúp nhân viên có thể quét mã check-in nhanh chóng tại cửa phòng họp."*

---

### PHÂN CẢNH 3: ĐẶT PHÒNG THÔNG MINH, MỜI ĐỒNG NGHIỆP & GỢI Ý BEST-FIT (1:40 – 2:40)
* **Hành động trên màn hình:**
  1. Nhấn nút **"+ Tạo cuộc họp mới"**.
  2. Nhập tiêu đề: `Họp Đánh giá Tiến độ Sprint 4 & Nghiệm thu TTCS`.
  3. Chọn thời gian: Ngày mai từ `10:00` đến `11:30`.
  4. Tại ô **"Người tham dự"**, click mở bộ chọn Multi-select: Tích chọn 3 đồng nghiệp (`Trần Thu Hà`, `Lê Minh Tuấn`, `Phạm Quốc Dũng`).
  5. Ngay lập tức, Banner **"Smart Recommendation"** hiển thị trên đầu danh sách phòng:
     - Gợi ý: *"Phòng Tokyo (Tầng 4 - 20 chỗ) — Khớp tối ưu quy mô nhóm của bạn"*.
  6. Click nút **"Áp dụng gợi ý"**: Phòng Tokyo tự động được chọn và viền sáng nổi bật.
* **Lời thoại thuyết minh:**
  > *"Điểm nhấn nổi bật của hệ thống là thuật toán Gợi ý phòng thông minh Best-Fit. Dựa trên số lượng nhân sự tham gia cuộc họp, hệ thống tự động tính toán và đề xuất phòng có sức chứa phù hợp nhất, loại bỏ triệt để tình trạng lãng phí không gian hội nghị doanh nghiệp."*

---

### PHÂN CẢNH 4: MƯỢN THIẾT BỊ HỘI NGHỊ & CHỐNG XUNG ĐỘT (2:40 – 3:45)
* **Hành động trên màn hình:**
  1. Cuộn xuống khối **"Trang thiết bị kèm theo"**.
  2. Quan sát danh sách thiết bị: Các thiết bị có sẵn hiển thị badge xanh lá `Có sẵn`. Các thiết bị đang bảo trì hiển thị badge `Bảo trì` và bị vô hiệu hóa checkbox.
  3. Tích chọn: `Máy chiếu Sony 4K Laser` và `Hệ thống Micro cổ ngỗng không dây`.
  4. Nhấn nút **"Tạo cuộc họp"**: Nút hiển thị hiệu ứng Loading spinner, sau đó thông báo `Tạo cuộc họp và đặt phòng thành công`.
  5. Thao tác thử nghiệm Double-booking:
     - Mở lại modal Đặt phòng.
     - Chọn cùng phòng `Phòng Tokyo` và cùng khung giờ vừa đặt (`10:00 - 11:30`).
     - Nhấn nút **"Tạo cuộc họp"**.
     - Hệ thống chặn ngay lập tức, hiển thị cảnh báo đỏ nổi bật: `Phát hiện trùng lịch phòng họp: Phòng Tokyo đã có lịch họp trong khung giờ này (HTTP 409 Conflict)`.
* **Lời thoại thuyết minh:**
  > *"Hệ thống kiểm soát tính khả dụng của thiết bị hội nghị theo thời gian thực và quản lý việc mượn thiết bị bên trong một Transaction CSDL an toàn. Cơ chế chống xung đột hoạt động tuyệt đối chính xác: khi có người cố tình đặt trùng phòng hoặc trùng giờ, hệ thống ngay lập tức từ chối và cảnh báo rõ ràng, đảm bảo tính toàn vẹn dữ liệu 100%."*

---

### PHÂN CẢNH 5: XEM BÁO CÁO, ĐỒNG BỘ ICALENDAR & KẾT THÚC (3:45 – 5:00)
* **Hành động trên màn hình:**
  1. Điều hướng sang tab **"Lịch biểu"**: Cuộc họp vừa tạo hiển thị nổi bật trên giao diện Lịch theo tuần.
  2. Click vào cuộc họp: Popup chi tiết mở ra, click nút **"Tải tệp .ics (Google/Outlook)"**.
  3. Trình duyệt tải về tệp `meeting-82.ics`. Click mở file: Ứng dụng Lịch trên máy tính tự động nhận diện và hiển thị đầy đủ tiêu đề, thời gian, phòng họp và danh sách người tham gia.
  4. Điều hướng sang tab **"Báo cáo & Thống kê"**:
     - Xem Dashboard thống kê số giờ họp theo phòng ban và tỷ lệ lấp đầy.
     - Click nút **"Xuất báo cáo Excel (CSV)"**: Tải về tệp báo cáo chuẩn font tiếng Việt Unicode UTF-8.
  5. Đăng xuất tài khoản.
  6. Màn hình hiển thị Slide Kết luận: Tổng kết 31/31 kịch bản E2E Pass, 18/18 Bugs Closed, DoD đạt 100%.
* **Lời thoại thuyết minh:**
  > *"Cuộc họp sau khi tạo có thể dễ dàng đồng bộ 1-Click vào Google Calendar hoặc Microsoft Outlook thông qua tệp iCalendar chuẩn quốc tế. Phân hệ Báo cáo cung cấp các chỉ số đo lường hiệu suất trực quan và cho phép xuất dữ liệu Excel chuẩn xác. Đồ án của nhóm đã hoàn thành toàn diện 100% tiêu chuẩn Definition of Done, đạt chứng nhận kiểm thử toàn trình E2E và sẵn sàng đưa vào vận hành thực tế. Xin trân trọng cảm ơn Thầy Cô và các bạn đã theo dõi!"*
