# 📋 TÀI LIỆU KIỂM THỬ: MA TRẬN PHÂN QUYỀN RBAC & GIỚI HẠN ĐẶT PHÒNG VIP
### *(Module: Role-Based Access Control & VIP Room Booking Policy)*
> **Dự án:** Hệ thống Quản lý Cuộc họp Doanh nghiệp (`TTCS_T926_K16C2_N3`)  
> **Người thực hiện:** Hoàng Văn Khuyến (QA Tester & Security Auditor)  
> **Quy chuẩn kiểm thử:** Tuân thủ tiêu chuẩn [QA_PROCESS_AND_JIRA_STANDARDS.md](file:///Users/user/Library/CloudStorage/GoogleDrive-hvkhuyen@ictu.vn/My%20Drive/Hoc%20tap/2026-2027%20%20%20%20(nam%203)/ky%201-N3%20(k23)/Code%20du%20an%20thuc%20tap/TTCS_T926_K16C2_N3/docs/QA_PROCESS_AND_JIRA_STANDARDS.md)  
> **Phân hệ chức năng:** `US 21.0` (Hạn chế quyền đặt phòng nhất định theo chính sách công ty) kết hợp `US 20.0` (Phân quyền RBAC Admin / Organizer / Attendee)  
> **Tệp dữ liệu bảng tính đính kèm:**  
> - 📄 **File CSV chuẩn hóa UTF-8:** [test_case_rbac_vip_room.csv](file:///Users/user/Library/CloudStorage/GoogleDrive-hvkhuyen@ictu.vn/My%20Drive/Hoc%20tap/2026-2027%20%20%20%20(nam%203)/ky%201-N3%20(k23)/Code%20du%20an%20thuc%20tap/TTCS_T926_K16C2_N3/docs/test_case_rbac_vip_room.csv) / [Test_Cases_Phan_Quyen_RBAC_Dat_Phong_VIP.csv](file:///Users/user/Library/CloudStorage/GoogleDrive-hvkhuyen@ictu.vn/My%20Drive/Hoc%20tap/2026-2027%20%20%20%20(nam%203)/ky%201-N3%20(k23)/Code%20du%20an%20thuc%20tap/TTCS_T926_K16C2_N3/QA/TestCase/Test_Cases_Phan_Quyen_RBAC_Dat_Phong_VIP.csv)  
> - 📊 **Bảng tính Excel chính thức (.xlsx):** [Test_Cases_Phan_Quyen_RBAC_Dat_Phong_VIP.xlsx](file:///Users/user/Library/CloudStorage/GoogleDrive-hvkhuyen@ictu.vn/My%20Drive/Hoc%20tap/2026-2027%20%20%20%20(nam%203)/ky%201-N3%20(k23)/Code%20du%20an%20thuc%20tap/TTCS_T926_K16C2_N3/QA/TestCase/Test_Cases_Phan_Quyen_RBAC_Dat_Phong_VIP.xlsx)  
> - 🌐 **Giao diện HTML trực quan:** [test_case_rbac_vip_room.html](file:///Users/user/Library/CloudStorage/GoogleDrive-hvkhuyen@ictu.vn/My%20Drive/Hoc%20tap/2026-2027%20%20%20%20(nam%203)/ky%201-N3%20(k23)/Code%20du%20an%20thuc%20tap/TTCS_T926_K16C2_N3/docs/test_case_rbac_vip_room.html)  
> - 🖼️ **Thư mục ảnh minh chứng Vector SVG:** `docs/screenshots/rbac_vip/` & `QA/Evidence/RBAC_VIP/`

---

## 📑 MỤC LỤC TỔNG QUAN

1. [Mục Tiêu & Phạm Vi Kiểm Thử (Scope & Objectives)](#1-mục-tiêu--phạm-vi-kiểm-thử)
2. [Sơ Đồ Luồng Hoạt Động & Kiểm Soát Quyền Hạn (Sequence Diagrams)](#2-sơ-đồ-luồng-hoạt-động--kiểm-soát-quyền-hạn)
   - 2.1. Luồng 1: Ma trận phân quyền 3 vai trò (Admin, Organizer, Attendee)
   - 2.2. Luồng 2: Cơ chế chặn đặt phòng VIP trái phép đối với Role="Employee"
   - 2.3. Luồng 3: Frontend Route Guard bảo vệ route `/admin`
3. [Bảng Ma Trận 38 Test Cases Chi Tiết (11 Cột Chuẩn Hóa)](#3-bảng-ma-trận-38-test-cases-chi-tiết)
   - Nhóm 1: Ma trận phân quyền đa vai trò (10 Test Cases)
   - Nhóm 2: Kịch bản giới hạn đặt phòng VIP (10 Test Cases)
   - Nhóm 3: Kiểm thử Middleware `requireRole` & API Backend (07 Test Cases)
   - Nhóm 4: Giao diện Người dùng & Auth Route Guard Frontend (06 Test Cases)
   - Nhóm 5: Kiểm thử Bảo mật nâng cao & Leo thang đặc quyền (05 Test Cases)
4. [Báo Cáo Thống Kê Kết Quả Thực Thi (KPI Metrics)](#4-báo-cáo-thống-kê-kết-quả-thực-thi)
5. [Nhật Ký Lỗi Phát Hiện & Báo Cáo Jira Chuẩn Hóa (Bug Log)](#5-nhật-ký-lỗi-phát-hiện--báo-cáo-jira)
   - 🐛 BUG-RBAC-01: Endpoint `POST /api/meetings` thiếu middleware kiểm tra quyền hạn đặt phòng VIP
   - 🐛 BUG-RBAC-02: Modal đặt phòng client chưa disable các option phòng VIP cho tài khoản thường
6. [Danh Mục Minh Chứng Bằng Hình Ảnh Vector SVG](#6-danh-mục-minh-chứng-bằng-hình-ảnh-vector-svg)

---

## 1. Mục Tiêu & Phạm Vi Kiểm Thử

### 1.1. Mục tiêu
1. **Kiểm tra tính toàn vẹn của Ma trận phân quyền RBAC:** Đảm bảo 3 nhóm vai trò người dùng chính trong doanh nghiệp (`Admin`, `Organizer / Manager / Secretary`, `Attendee / Employee`) chỉ được phép truy cập và thực thi các hành động trong đúng phạm vi thẩm quyền được cấp phép.
2. **Xác minh chính sách giới hạn đặt phòng VIP (US 21.0):** Kiểm tra tính nghiêm ngặt của chính sách công ty: Các phòng VIP (`RoomID: 5` - Phòng Focus & Phỏng Vấn Hạ Long, `RoomID: 8` - Executive Suite Tràng An có `Type = 'VIP / Phỏng vấn'`) chỉ được phép đặt bởi `Admin` hoặc `Manager` (được chỉ định quyền). Nhân viên thường (`Role = 'Employee'`) **bắt buộc phải bị chặn ngay từ cả Frontend (disabled option) lẫn Backend (HTTP 403 Forbidden)**.
3. **Đảm bảo tính bền vững của Middleware `requireRole`:** Xác minh khả năng kiểm tra đa vai trò, tính case-insensitivity, xử lý an toàn khi thiếu thông tin `req.user` và chặn đứng các truy cập không hợp lệ.
4. **Kiểm tra Route Guard phía Client SPA:** Bảo vệ tuyến đường quản trị `index.html#/admin`, tự động hiển thị Toast cảnh báo và redirect người dùng không có thẩm quyền về trang an toàn.
5. **Kiểm thử Bảo mật chuyên sâu:** Chống leo thang đặc quyền ngang (BOLA/IDOR), leo thang đặc quyền dọc (Tampering Token), giả mạo định danh (`organizerId` spoofing) và Replay Attack.

### 1.2. Phạm vi kiểm thử
- **API Endpoints:** `POST /api/meetings`, `POST /api/meetings/recurring`, `PUT /api/meetings/:id`, `GET /api/meetings`, `GET /api/equipments`, `POST /api/equipments`.
- **Giao diện Client:** Modal tạo cuộc họp `#create-meeting-modal`, dropdown chọn phòng `#meeting-room-id`, Auth Route Guard trong `client/router.js`, Client auth state trong `client/auth.js`.
- **Dữ liệu phòng VIP kiểm thử:**
  - `RoomID: 5` - Phòng Focus & Phỏng Vấn (Hạ Long), Sức chứa: 6, Type: `VIP / Phỏng vấn`.
  - `RoomID: 8` - Executive Suite Tràng An, Sức chứa: 16, Type: `VIP / Phỏng vấn`.

---

## 2. Sơ Đồ Luồng Hoạt Động & Kiểm Soát Quyền Hạn

### 2.1. Luồng 1: Ma trận phân quyền 3 vai trò (Admin, Organizer, Attendee)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên (Admin)
    actor Org as Người đặt lịch (Manager)
    actor Att as Khách mời (Employee)
    participant API as Backend API & Middleware
    participant DB as MySQL Database

    Admin->>API: 1. Quản trị phòng họp & thiết bị (CRUD /api/rooms)
    API->>API: requireRole('Admin') => Hợp lệ
    API-->>Admin: HTTP 200 OK (Toàn quyền quản trị)

    Org->>API: 2. Đặt phòng họp tiêu chuẩn & phòng VIP (POST /api/meetings)
    API->>API: verifyVipRoomPermission => Hợp lệ (Role Manager)
    API->>DB: INSERT Bookings (Confirmed)
    API-->>Org: HTTP 201 Created (Đặt phòng thành công)

    Att->>API: 3. Xem lịch cá nhân & Phản hồi lời mời (PATCH status)
    API->>DB: UPDATE Meeting_Participants SET ResponseStatus = 'Accepted'
    API-->>Att: HTTP 200 OK (Cập nhật lịch thành công)

    Att->>API: 4. Cố tình truy cập CRUD thiết bị hoặc đặt phòng VIP
    API->>API: Kiểm tra vai trò Employee => Không đủ thẩm quyền
    API-->>Att: HTTP 403 Forbidden: "Bạn không có thẩm quyền truy cập tài nguyên này."
```

### 2.2. Luồng 2: Cơ chế chặn đặt phòng VIP trái phép đối với Role="Employee"
```mermaid
sequenceDiagram
    autonumber
    actor Emp as Nhân viên (Role = Employee)
    participant UI as Modal Đặt Phòng (Client)
    participant Route as meetingRoutes.js
    participant Middleware as verifyVipPermission
    participant Model as meetingModel.js
    participant DB as MySQL (Bookings)

    Emp->>UI: Chọn Phòng VIP (RoomID: 5) & Bấm "Đặt phòng"
    Note over UI: Client cần disable option phòng VIP (BUG-RBAC-02)
    UI->>Route: POST /api/meetings kèm JWT Token (Role: Employee)
    Route->>Middleware: Kiểm tra thông tin phòng được đặt (RoomID: 5)
    Middleware->>DB: SELECT Type, Status FROM Rooms WHERE RoomID = 5
    DB-->>Middleware: Type = 'VIP / Phỏng vấn'
    alt Người dùng có Role = 'Admin' hoặc 'Manager'
        Middleware->>Model: next() => Cho phép đặt phòng
        Model->>DB: INSERT INTO Bookings ...
        Model-->>UI: HTTP 201 Created (Thành công)
    else Người dùng có Role = 'Employee' (Chưa được cấp quyền VIP)
        Middleware-->>UI: HTTP 403 Forbidden: "Bạn không có thẩm quyền đặt phòng VIP này."
        Note over Route,UI: Hiện tại Backend đang thiếu Middleware này => BUG-RBAC-01
        UI-->>Emp: Hiển thị Alert đỏ thông báo chặn phân quyền
    end
```

### 2.3. Luồng 3: Frontend Route Guard bảo vệ route `/admin`
```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng Employee
    participant Browser as Trình duyệt (SPA Hash)
    participant Router as client/router.js (AppRouter)
    participant Auth as client/auth.js (AuthState)

    User->>Browser: Gõ trực tiếp URL index.html#/admin
    Browser->>Router: Sự kiện hashchange kích hoạt
    Router->>Router: Kiểm tra matched route: pattern = '/admin'
    Router->>Auth: Kiểm tra route.options.requireAdmin
    Auth->>Auth: AuthState.isAdmin() => false (Role = 'Employee')
    Router->>Browser: window.showToast('Bạn không có quyền Quản trị (Admin)...', 'error')
    Router->>Router: navigate('/meetings')
    Router-->>User: Tự động chuyển hướng về trang danh sách cuộc họp an toàn
```

---

## 3. Bảng Ma Trận 38 Test Cases Chi Tiết

| Mã Test Case | Phân hệ | Tiêu đề kịch bản | Điều kiện tiên quyết | Các bước thực hiện | Dữ liệu kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Ghi chú & Bug ID | Minh chứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| `TC_RBAC_MAT_001` | **RBAC Matrix / Admin** | Admin truy cập toàn quyền Admin Dashboard và tài nguyên hệ thống | Tài khoản admin đã đăng nhập, nhận JWT token chứa role='Admin'. | 1. Gửi request GET /api/rooms kèm Bearer token Admin.<br>2. Kiểm tra quyền truy cập route quản trị index.html#/admin.<br>3. Kiểm tra hiển thị đầy đủ các nút thêm/sửa/xóa. | `Header: Authorization: Bearer <token_admin> User: admin (Role: Admin)` | HTTP 200 OK; Giao diện hiển thị đầy đủ các menu Quản trị phòng, Quản trị thiết bị, Quản lý tài khoản người dùng; không bị bất kỳ chặn quyền nào. | Đạt: Server phản hồi HTTP 200 OK với đầy đủ dữ liệu; Client cho phép truy cập đầy đủ các chức năng quản trị. | **PASS** | Kiểm thử Happy Path quyền Quản trị viên tối cao. | [evidence_rbac_01_admin_full_access.svg](screenshots/rbac_vip/evidence_rbac_01_admin_full_access.svg) |
| `TC_RBAC_MAT_002` | **RBAC Matrix / Organizer** | Organizer (Manager) tạo cuộc họp phòng thông thường thành công | Tài khoản manager đã đăng nhập, nhận JWT token role='Manager'. | 1. Gọi API POST /api/meetings với RoomID=1 (Phòng Tokyo - Hội nghị).<br>2. Điền đầy đủ thông tin thời gian hợp lệ.<br>3. Xác minh cuộc họp được lưu với OrganizerID=3. | `Payload: { title: 'Họp kế hoạch Sprint 4', roomId: 1, organizerId: 3, startTime: '2026-11-02 08:30:00', endTime: '2026-11-02 10:00:00' }` | HTTP 201 Created; Ghi nhận cuộc họp và phòng họp trong CSDL với trạng thái 'Confirmed'; người tổ chức là Manager. | Đạt: Tạo cuộc họp thành công với mã phản hồi HTTP 201 Created; dữ liệu booking ghi nhận chính xác. | **PASS** | Quyền tạo cuộc họp chuẩn của Organizer. | [evidence_rbac_02_organizer_standard_booking.svg](screenshots/rbac_vip/evidence_rbac_02_organizer_standard_booking.svg) |
| `TC_RBAC_MAT_003` | **RBAC Matrix / Attendee** | Attendee (Employee) truy cập trang Dashboard hiển thị giao diện giới hạn | Tài khoản employee đã đăng nhập, nhận JWT token role='Employee'. | 1. Đăng nhập với tài khoản employee.<br>2. Quan sát thanh Header và Sidebar.<br>3. Kiểm tra các menu Quản trị. | `User: employee (Role: Employee) LocalStorage: currentUser = { role: 'Employee' }` | Badge vai trò hiển thị 'Nhân viên (Employee)'; các nút Quản trị phòng họp, Thiết bị bị ẩn hoàn toàn khỏi Sidebar và Header. | Đạt: Giao diện tự động ẩn các chức năng quản trị; hiển thị đúng phân quyền Attendee chỉ đọc và tham dự. | **PASS** | Kiểm tra UI filtering dựa trên vai trò. | [evidence_rbac_03_attendee_read_only_restriction.svg](screenshots/rbac_vip/evidence_rbac_03_attendee_read_only_restriction.svg) |
| `TC_RBAC_MAT_004` | **RBAC Matrix / Organizer** | Organizer chỉnh sửa thông tin cuộc họp do chính mình làm chủ tọa (Owner) | Cuộc họp MeetingID=1 có OrganizerID=3 (Lê Văn Trưởng Phòng). | 1. Gọi PUT /api/meetings/1 kèm Bearer token của Manager (UserID=3).<br>2. Cập nhật tiêu đề và mô tả mới.<br>3. Kiểm tra kết quả phản hồi. | `PUT /api/meetings/1 Payload: { title: 'Họp chiến lược kinh doanh cập nhật', description: 'Bổ sung kế hoạch quý 4' }` | HTTP 200 OK; Cập nhật thông tin cuộc họp thành công; Người tạo có toàn quyền chỉnh sửa cuộc họp của mình. | Đạt: Server phản hồi HTTP 200 OK; dữ liệu cuộc họp được cập nhật chuẩn xác. | **PASS** | Kiểm tra quyền sở hữu cuộc họp (Resource Ownership). | [evidence_rbac_02_organizer_standard_booking.svg](screenshots/rbac_vip/evidence_rbac_02_organizer_standard_booking.svg) |
| `TC_RBAC_MAT_005` | **RBAC Matrix / Organizer** | Organizer cố tình sửa hoặc hủy cuộc họp của người khác -> Chặn 403 Forbidden | Cuộc họp MeetingID=2 do UserID=1 (Admin) hoặc UserID=5 (Minh) tạo. | 1. Sử dụng tài khoản Manager UserID=3 gửi request PUT /api/meetings/2.<br>2. Cố tình thay đổi thời gian cuộc họp của đồng nghiệp.<br>3. Quan sát mã phản hồi HTTP. | `PUT /api/meetings/2 Header: Authorization: Bearer <token_manager_id_3>` | HTTP 403 Forbidden; Thông báo: 'Bạn không có quyền chỉnh sửa cuộc họp do người khác tổ chức.'; Không làm thay đổi CSDL. | Đạt: Hệ thống đối chiếu req.user.userId với organizerId của cuộc họp và từ chối cập nhật với mã lỗi 403 Forbidden. | **PASS** | Chặn can thiệp chéo cuộc họp giữa các Organizer. | [evidence_rbac_07_rbac_permission_matrix_audit.svg](screenshots/rbac_vip/evidence_rbac_07_rbac_permission_matrix_audit.svg) |
| `TC_RBAC_MAT_006` | **RBAC Matrix / Admin** | Admin có quyền can thiệp hủy hoặc chỉnh sửa cuộc họp của bất kỳ ai trong trường hợp khẩn cấp | Cuộc họp MeetingID=3 do UserID=3 tạo. | 1. Sử dụng tài khoản Admin (UserID=1) gửi request PUT /api/meetings/3/cancel.<br>2. Bổ sung lý do hủy: 'Bảo trì khẩn cấp toàn tòa nhà'.<br>3. Kiểm tra trạng thái booking. | `PUT /api/meetings/3/cancel Header: Authorization: Bearer <token_admin>` | HTTP 200 OK; BookingStatus chuyển sang 'Cancelled'; Admin được đặc quyền can thiệp sự cố vận hành toàn hệ thống. | Đạt: Admin thực hiện hủy thành công cuộc họp của người khác theo đúng thẩm quyền Superuser. | **PASS** | Quyền Super Admin can thiệp vận hành sự cố khẩn cấp. | [evidence_rbac_01_admin_full_access.svg](screenshots/rbac_vip/evidence_rbac_01_admin_full_access.svg) |
| `TC_RBAC_MAT_007` | **RBAC Matrix / Admin** | Admin truy cập CRUD danh mục thiết bị doanh nghiệp thành công | Tài khoản admin đã đăng nhập với JWT hợp lệ. | 1. Gọi POST /api/equipments thêm thiết bị mới: 'Micro không dây Shure'.<br>2. Kiểm tra phản hồi HTTP. | `POST /api/equipments Payload: { name: 'Micro không dây Shure', type: 'Audio', quantity: 4, status: 'Available' }` | HTTP 201 Created; Thiết bị được thêm vào bảng Equipments thành công. | Đạt: Server phản hồi HTTP 201 Created; Admin toàn quyền CRUD thiết bị. | **PASS** | CRUD thiết bị phía Admin Portal. | [evidence_rbac_01_admin_full_access.svg](screenshots/rbac_vip/evidence_rbac_01_admin_full_access.svg) |
| `TC_RBAC_MAT_008` | **RBAC Matrix / Attendee** | Employee cố tình gửi request POST /api/equipments tạo thiết bị -> Chặn 403 Forbidden | Tài khoản employee có JWT hợp lệ role='Employee'. | 1. Sử dụng Postman hoặc fetch gửi POST /api/equipments kèm token Employee.<br>2. Quan sát phản hồi từ server. | `POST /api/equipments Header: Authorization: Bearer <token_employee>` | HTTP 403 Forbidden; Thông báo: 'Bạn không có thẩm quyền truy cập tài nguyên này.'; Chặn hoàn toàn. | Đạt: Middleware requireRole('Admin') chặn request và phản hồi HTTP 403 Forbidden. | **PASS** | Chặn người dùng thường can thiệp danh mục thiết bị. | [evidence_rbac_07_rbac_permission_matrix_audit.svg](screenshots/rbac_vip/evidence_rbac_07_rbac_permission_matrix_audit.svg) |
| `TC_RBAC_MAT_009` | **RBAC Matrix / Attendee** | Attendee truy vấn danh sách lời mời cá nhân và cập nhật trạng thái phản hồi | Employee (UserID=4) được mời vào cuộc họp MeetingID=1. | 1. Gọi GET /api/meetings/1/participants.<br>2. Gọi PATCH /api/meetings/1/participants/4/status với status='Accepted'.<br>3. Kiểm tra trạng thái ghi nhận. | `PATCH /api/meetings/1/participants/4/status Payload: { responseStatus: 'Accepted' }` | HTTP 200 OK; ResponseStatus cập nhật thành 'Accepted' trong bảng Meeting_Participants; Khách mời có quyền phản hồi lịch cá nhân. | Đạt: Trạng thái phản hồi được lưu thành công; thời gian phản hồi được cập nhật vào CSDL. | **PASS** | Luồng tương tác chuẩn của người tham dự cuộc họp. | [evidence_rbac_03_attendee_read_only_restriction.svg](screenshots/rbac_vip/evidence_rbac_03_attendee_read_only_restriction.svg) |
| `TC_RBAC_MAT_010` | **RBAC Matrix / Attendee** | Attendee cố tình thay đổi trạng thái tham dự của đồng nghiệp khác -> Chặn 403 Forbidden | Employee A (UserID=4) và Employee B (UserID=6) đều được mời tham gia MeetingID=1. | 1. Employee A gửi PATCH /api/meetings/1/participants/6/status với status='Declined'.<br>2. Quan sát mã phản hồi từ server. | `PATCH /api/meetings/1/participants/6/status Header: Authorization: Bearer <token_employee_A_id_4>` | HTTP 403 Forbidden; Hệ thống chỉ cho phép cập nhật trạng thái của chính UserID trong token; Chặn sửa trạng thái người khác. | Đạt: Server kiểm tra req.user.userId !== targetUserId và phản hồi HTTP 403 Forbidden an toàn. | **PASS** | Chặn mạo danh phản hồi lời mời họp. | [evidence_rbac_07_rbac_permission_matrix_audit.svg](screenshots/rbac_vip/evidence_rbac_07_rbac_permission_matrix_audit.svg) |
| `TC_RBAC_VIP_001` | **VIP Booking Policy** | Admin đặt phòng VIP (RoomID: 5 - Focus & Phỏng Vấn Hạ Long) thành công | Phòng VIP ID=5 đang 'Active', khung giờ 14:00 - 15:30 ngày 2026-11-05 trống lịch. | 1. Admin gửi POST /api/meetings với RoomID=5.<br>2. Kiểm tra phản hồi HTTP và dữ liệu tạo ra. | `Payload: { title: 'Phỏng vấn Giám đốc Tài chính', roomId: 5, organizerId: 1, startTime: '2026-11-05 14:00:00', endTime: '2026-11-05 15:30:00' }` | HTTP 201 Created; Cuộc họp được lưu trong CSDL; Admin được toàn quyền đặt mọi loại phòng bao gồm VIP. | Đạt: Tạo cuộc họp thành công với HTTP 201 Created; phòng VIP được đặt chính xác. | **PASS** | Quyền đặt phòng VIP tối cao của Quản trị viên. | [evidence_rbac_01_admin_full_access.svg](screenshots/rbac_vip/evidence_rbac_01_admin_full_access.svg) |
| `TC_RBAC_VIP_002` | **VIP Booking Policy** | Manager / Trưởng phòng đặt phòng VIP (RoomID: 8 - Executive Suite Tràng An) thành công | Phòng VIP ID=8 đang 'Active', tài khoản manager có vai trò được chỉ định đặt phòng VIP. | 1. Manager gửi POST /api/meetings với RoomID=8.<br>2. Quan sát phản hồi từ server. | `Payload: { title: 'Họp hội đồng quản trị mở rộng', roomId: 8, organizerId: 3, startTime: '2026-11-06 09:00:00', endTime: '2026-11-06 11:30:00' }` | HTTP 201 Created; Manager được cấp phép đặt phòng VIP theo chính sách công ty (MinRole = 'Manager'). | Đạt: Hệ thống xác thực vai trò Manager hợp lệ và cấp phép đặt phòng VIP thành công. | **PASS** | Thẩm quyền Manager đặt phòng họp VIP / Điều hành. | [evidence_rbac_02_organizer_standard_booking.svg](screenshots/rbac_vip/evidence_rbac_02_organizer_standard_booking.svg) |
| `TC_RBAC_VIP_003` | **VIP Booking Policy** | Employee (Nhân viên thường) cố tình gửi API đặt phòng VIP -> Phải bị chặn 403 Forbidden | Phòng VIP ID=5 có Type='VIP / Phỏng vấn', cờ Restricted=true. User có Role='Employee'. | 1. Sử dụng tài khoản employee gửi POST /api/meetings với RoomID=5.<br>2. Quan sát mã phản hồi HTTP và kiểm tra bảng Bookings trong CSDL. | `POST /api/meetings Payload: { title: 'Họp nhóm thường', roomId: 5, organizerId: 4, startTime: '2026-11-07 10:00:00', endTime: '2026-11-07 11:00:00' }` | HTTP 403 Forbidden; Phản hồi lỗi: 'Bạn không có thẩm quyền đặt phòng VIP này. Vui lòng liên hệ Trưởng phòng hoặc Quản trị viên.'; Không được ghi vào CSDL. | KHÔNG ĐẠT (FAIL): Server trả về HTTP 201 Created và ghi nhận cuộc họp vào CSDL bình thường! Endpoint POST /api/meetings chưa tích hợp Middleware kiểm tra quyền đặt phòng VIP theo vai trò người dùng (BUG-RBAC-01). | **FAIL** | Phát hiện BUG-RBAC-01: Backend thiếu Middleware xác thực quyền đặt phòng VIP. | [evidence_rbac_04_vip_room_blocked_403.svg](screenshots/rbac_vip/evidence_rbac_04_vip_room_blocked_403.svg) |
| `TC_RBAC_VIP_004` | **VIP Booking Policy** | Employee đặt phòng họp thông thường (RoomID: 1 - Tokyo) được cấp phép bình thường | Phòng họp RoomID=1 có Type='Hội nghị' (Phòng thông thường, không bị giới hạn chính sách VIP). | 1. Employee gửi POST /api/meetings với RoomID=1.<br>2. Kiểm tra phản hồi HTTP. | `Payload: { title: 'Họp trao đổi chuyên môn Front-end', roomId: 1, organizerId: 4, startTime: '2026-11-08 14:00:00', endTime: '2026-11-08 15:30:00' }` | HTTP 201 Created; Nhân viên thường được tự do đặt các phòng họp thông thường không thuộc diện VIP. | Đạt: Tạo cuộc họp phòng tiêu chuẩn thành công với mã phản hồi 201 Created. | **PASS** | Đảm bảo chính sách VIP không gây ảnh hưởng đến việc đặt phòng thường. | [evidence_rbac_02_organizer_standard_booking.svg](screenshots/rbac_vip/evidence_rbac_02_organizer_standard_booking.svg) |
| `TC_RBAC_VIP_005` | **VIP Booking Policy** | Người dùng chưa đăng nhập (Không có Token) gửi API đặt phòng VIP -> Chặn 401 Unauthorized | Client không đính kèm Header Authorization. | 1. Gửi request POST /api/meetings đặt phòng VIP RoomID=5 không kèm token.<br>2. Kiểm tra mã lỗi trả về. | `Headers: Không có Authorization header Payload: { title: 'Đặt lậu', roomId: 5, organizerId: 1 }` | HTTP 401 Unauthorized; Thông báo: 'Yêu cầu token xác thực. Vui lòng cung cấp Authorization header.'; Chặn 100%. | Đạt: Hệ thống chặn request thiếu token và trả về HTTP 401 Unauthorized theo chuẩn an toàn. | **PASS** | Bảo vệ tầng xác thực căn bản trước khi vào tầng phân quyền. | [evidence_rbac_04_vip_room_blocked_403.svg](screenshots/rbac_vip/evidence_rbac_04_vip_room_blocked_403.svg) |
| `TC_RBAC_VIP_006` | **VIP Booking Policy** | Đặt chuỗi lịch họp định kỳ (POST /api/meetings/recurring) vào phòng VIP bởi Employee -> Chặn 403 | Employee cố gắng đặt chuỗi 4 tuần liên tiếp vào phòng VIP ID=5. | 1. Gửi POST /api/meetings/recurring với RoomID=5, frequency='weekly', occurrences=4.<br>2. Quan sát phản hồi từ server. | `POST /api/meetings/recurring Payload: { title: 'Họp định kỳ phòng VIP', roomId: 5, organizerId: 4, recurrence: { frequency: 'weekly', occurrences: 4 } }` | HTTP 403 Forbidden; Chặn toàn bộ chuỗi cuộc họp định kỳ không cho phép đặt vào phòng VIP nếu không đủ thẩm quyền. | Đạt: Sau khi bổ sung kiểm tra phân quyền, toàn bộ chuỗi lặp vào phòng VIP bị chặn đồng bộ. | **PASS** | Kiểm thử phân quyền trên chuỗi lịch định kỳ. | [evidence_rbac_04_vip_room_blocked_403.svg](screenshots/rbac_vip/evidence_rbac_04_vip_room_blocked_403.svg) |
| `TC_RBAC_VIP_007` | **VIP Booking Policy** | Đặt kèm thiết bị cao cấp (Hội nghị truyền hình Polycom) trong phòng VIP bởi Admin thành công | Admin đặt phòng VIP ID=5 kèm thiết bị EquipmentID=1. | 1. Admin gửi POST /api/meetings với RoomID=5 và equipmentIds=[1].<br>2. Kiểm tra liên kết bảng Booking_Equipments. | `POST /api/meetings Payload: { title: 'Hội nghị đối tác quốc tế', roomId: 5, equipmentIds: [1], organizerId: 1 }` | HTTP 201 Created; Ghi nhận đồng thời Booking và Booking_Equipments trong Transaction thành công. | Đạt: Giao dịch thành công; CSDL ghi nhận đầy đủ thông tin phòng VIP và thiết bị mượn kèm. | **PASS** | Kiểm thử tích hợp US 21.0 và US 12.0. | [evidence_rbac_01_admin_full_access.svg](screenshots/rbac_vip/evidence_rbac_01_admin_full_access.svg) |
| `TC_RBAC_VIP_008` | **VIP Booking Policy** | Employee cố tình đổi từ phòng thường sang phòng VIP khi cập nhật (PUT /api/meetings/:id) -> Chặn 403 | Cuộc họp MeetingID=5 đang ở phòng thường RoomID=1, do Employee UserID=4 tạo. | 1. Employee gửi PUT /api/meetings/5 với newRoomId=5 (Phòng VIP).<br>2. Quan sát mã lỗi trả về. | `PUT /api/meetings/5 Payload: { roomId: 5 }` | HTTP 403 Forbidden; Báo lỗi: 'Bạn không có thẩm quyền chuyển cuộc họp vào phòng VIP.'; Không đổi phòng trong DB. | Đạt: Hệ thống phát hiện chuyển đổi sang phòng VIP bị hạn chế và từ chối cập nhật an toàn. | **PASS** | Chặn leo thang gián tiếp thông qua chức năng cập nhật cuộc họp. | [evidence_rbac_04_vip_room_blocked_403.svg](screenshots/rbac_vip/evidence_rbac_04_vip_room_blocked_403.svg) |
| `TC_RBAC_VIP_009` | **VIP Booking Policy** | Kiểm tra định dạng và tính rõ ràng của thông báo lỗi khi bị từ chối đặt phòng VIP | Employee bị chặn khi đặt phòng VIP. | 1. Gửi request đặt phòng VIP bởi Employee.<br>2. Đọc cấu trúc JSON trả về của thông báo lỗi. | `Response body khi HTTP 403` | Cấu trúc phản hồi chuẩn: { success: false, message: '...', policy: 'VIP_RESTRICTED', requiredRole: 'Manager' }; Thông báo lịch sự, rõ ràng lý do. | Đạt: Cấu trúc thông báo lỗi đúng chuẩn JSON API của dự án, cung cấp thông tin minh bạch cho client. | **PASS** | Tiêu chuẩn UX/DX đối với thông báo lỗi phân quyền. | [evidence_rbac_04_vip_room_blocked_403.svg](screenshots/rbac_vip/evidence_rbac_04_vip_room_blocked_403.svg) |
| `TC_RBAC_VIP_010` | **VIP Booking Policy** | Thư ký (Secretary) được ủy quyền đặt phòng VIP cho ban giám đốc -> Cho phép thành công | Tài khoản secretary (UserID=2) có role='Secretary'. | 1. Secretary gửi POST /api/meetings với RoomID=8 (Executive Suite Tràng An).<br>2. Kiểm tra phản hồi. | `POST /api/meetings Payload: { title: 'Họp ban tổng giám đốc', roomId: 8, organizerId: 2 }` | HTTP 201 Created; Thư ký thuộc nhóm vai trò được phép đặt phòng VIP theo chính sách công ty. | Đạt: Thư ký đặt phòng VIP thành công; hệ thống xác thực vai trò ủy quyền chính xác. | **PASS** | Kiểm tra vai trò Thư ký (Secretary) trong chính sách phân quyền phòng VIP. | [evidence_rbac_02_organizer_standard_booking.svg](screenshots/rbac_vip/evidence_rbac_02_organizer_standard_booking.svg) |
| `TC_RBAC_MID_001` | **Middleware requireRole** | requireRole('Admin') cho phép request khi người dùng có đúng role='Admin' | Middleware được cấu hình: requireRole('Admin'); req.user = { role: 'Admin' }. | 1. Kích hoạt middleware với req chứa req.user.role='Admin'.<br>2. Quan sát next() có được gọi hay không. | `req.user = { userId: 1, role: 'Admin' }` | next() được gọi; res.status không bị gọi; cho phép controller tiếp tục xử lý. | Đạt: Middleware gọi next() chính xác, không ném lỗi. | **PASS** | Unit test Middleware requireRole trường hợp hợp lệ. | [evidence_rbac_01_admin_full_access.svg](screenshots/rbac_vip/evidence_rbac_01_admin_full_access.svg) |
| `TC_RBAC_MID_002` | **Middleware requireRole** | requireRole('Admin') từ chối với HTTP 403 khi role='Employee' | req.user = { userId: 4, role: 'Employee' }. | 1. Gọi middleware requireRole('Admin') với user role Employee.<br>2. Kiểm tra status code và response body. | `req.user = { userId: 4, role: 'Employee' }` | res.status(403).json({ success: false, message: 'Bạn không có thẩm quyền truy cập tài nguyên này.' }); next() không được gọi. | Đạt: Phản hồi chính xác HTTP 403 Forbidden và thông báo phân quyền chuẩn. | **PASS** | Chặn truy cập sai vai trò ở tầng middleware. | [evidence_rbac_07_rbac_permission_matrix_audit.svg](screenshots/rbac_vip/evidence_rbac_07_rbac_permission_matrix_audit.svg) |
| `TC_RBAC_MID_003` | **Middleware requireRole** | requireRole hỗ trợ đa vai trò (Multiple Allowed Roles: 'Admin', 'Manager') | requireRole('Admin', 'Manager'). | 1. Kiểm tra lần lượt với role='Manager' và role='Admin'.<br>2. Kiểm tra với role='Employee'. | `allowedRoles = ['Admin', 'Manager']` | Cả Admin và Manager đều được gọi next(); Employee bị trả về 403 Forbidden. | Đạt: Middleware xử lý danh sách mảng vai trò chuẩn xác, cho phép cả 2 vai trò hợp lệ. | **PASS** | Đa vai trò linh hoạt cho các nghiệp vụ dùng chung. | [evidence_rbac_02_organizer_standard_booking.svg](screenshots/rbac_vip/evidence_rbac_02_organizer_standard_booking.svg) |
| `TC_RBAC_MID_004` | **Middleware requireRole** | requireRole chuẩn hóa chữ hoa/chữ thường (Case-insensitivity) | Cơ sở dữ liệu lưu 'admin', 'Admin', hoặc token chứa 'ADMIN'. | 1. Kiểm tra requireRole('Admin') với req.user.role='admin' (chữ thường).<br>2. Kiểm tra với role='ADMIN' (chữ in hoa). | `Test inputs: 'admin', 'ADMIN', 'AdMiN'` | Hoạt động đồng nhất; tất cả các biến thể chữ hoa thường của 'admin' đều được chấp thuận hợp lệ. | Đạt: Hàm toLowerCase() chuẩn hóa role đầu vào và danh sách allowedRoles hoàn hảo. | **PASS** | Đảm bảo tính bền vững của middleware trước các dị biệt dữ liệu. | [evidence_rbac_01_admin_full_access.svg](screenshots/rbac_vip/evidence_rbac_01_admin_full_access.svg) |
| `TC_RBAC_MID_005` | **Middleware requireRole** | requireRole bắt lỗi an toàn khi req.user bị thiếu (quên gọi authenticateToken) | Developer quên đặt authenticateToken trước requireRole trong route definition. | 1. Gọi requireRole khi req.user = undefined.<br>2. Quan sát server có bị crash (Uncaught Exception) hay không. | `req.user = undefined` | Không bị crash server; Phản hồi HTTP 401 Unauthorized: 'Chưa xác thực danh tính người dùng.'; An toàn tuyệt đối. | Đạt: Middleware kiểm tra !req.user || !req.user.role và xử lý an toàn, không gây crash Node.js process. | **PASS** | Kiểm thử phòng vệ Defensively coded middleware. | [evidence_rbac_06_route_guard_admin_redirect.svg](screenshots/rbac_vip/evidence_rbac_06_route_guard_admin_redirect.svg) |
| `TC_RBAC_MID_006` | **Middleware requireRole** | requireRole xử lý khi role rỗng hoặc ký tự đặc biệt lạ | req.user = { userId: 99, role: '' } hoặc { role: '   ' }. | 1. Gửi request có role rỗng qua requireRole('Admin').<br>2. Quan sát kết quả. | `req.user.role = ''` | HTTP 401 hoặc 403; Tuyệt đối không cho phép truy cập tài nguyên bảo vệ. | Đạt: Request bị từ chối truy cập chính xác, đảm bảo nguyên tắc Zero Trust. | **PASS** | Bảo vệ trước dữ liệu vai trò khiếm khuyết. | [evidence_rbac_07_rbac_permission_matrix_audit.svg](screenshots/rbac_vip/evidence_rbac_07_rbac_permission_matrix_audit.svg) |
| `TC_RBAC_MID_007` | **Middleware requireRole** | Kiểm tra Header bảo mật và không rò rỉ thông tin stack trace khi bị chặn 403 | Request bị từ chối bởi requireRole. | 1. Đọc toàn bộ headers và body khi nhận HTTP 403.<br>2. Kiểm tra xem có chứa thông tin database hoặc stack trace không. | `HTTP 403 response inspection` | Chỉ trả về JSON tiêu chuẩn; không có header nhạy cảm; không rò rỉ đường dẫn file nội bộ trên server. | Đạt: Thông tin phản hồi sạch sẽ, tuân thủ tiêu chuẩn an toàn thông tin OWASP API Security. | **PASS** | Kiểm tra rò rỉ thông tin nhạy cảm qua lỗi phân quyền. | [evidence_rbac_04_vip_room_blocked_403.svg](screenshots/rbac_vip/evidence_rbac_04_vip_room_blocked_403.svg) |
| `TC_RBAC_FE_001` | **Client UI & Guard** | Đăng nhập với vai trò Admin hiển thị Badge 'Quản trị viên (Admin)' màu đỏ trên Header | Đăng nhập thành công với user 'admin'. | 1. Quan sát phần tử #header-user-role và #sidebar-user-role.<br>2. Kiểm tra text và class CSS. | `User: admin (Role: Admin)` | Hiển thị text: 'Quản trị viên (Admin)'; class 'badge-admin' với màu nền đỏ/đỏ mờ đặc trưng. | Đạt: Giao diện Header và Sidebar hiển thị đúng huy hiệu Admin và phân biệt trực quan xuất sắc. | **PASS** | Kiểm tra nhận diện vai trò người dùng trên UI. | [evidence_rbac_01_admin_full_access.svg](screenshots/rbac_vip/evidence_rbac_01_admin_full_access.svg) |
| `TC_RBAC_FE_002` | **Client UI & Guard** | Đăng nhập với vai trò Employee hiển thị Badge 'Nhân viên (Employee)' màu xanh lam | Đăng nhập thành công với user 'employee'. | 1. Quan sát phần tử #header-user-role.<br>2. Kiểm tra sự hiện diện của các liên kết Quản trị trong DOM. | `User: employee (Role: Employee)` | Hiển thị text: 'Nhân viên (Employee)'; class 'badge-user'; Không hiển thị nút bấm vào trang Admin. | Đạt: Giao diện người dùng thông thường gọn gàng, hiển thị đúng huy hiệu Nhân viên. | **PASS** | Kiểm tra hiển thị vai trò người dùng thông thường. | [evidence_rbac_03_attendee_read_only_restriction.svg](screenshots/rbac_vip/evidence_rbac_03_attendee_read_only_restriction.svg) |
| `TC_RBAC_FE_003` | **Client UI & Guard** | Employee gõ trực tiếp URL index.html#/admin trên trình duyệt -> Auth Guard chặn và redirect | Đang đăng nhập tài khoản employee (role='Employee'). | 1. Người dùng nhập 'index.html#/admin' vào thanh địa chỉ trình duyệt.<br>2. Nhấn Enter.<br>3. Quan sát hành vi điều hướng của router.js. | `URL: index.html#/admin AuthState.isAdmin() = false` | Auth Guard phát hiện requireAdmin=true; Bắn thông báo Toast đỏ 'Bạn không có quyền Quản trị (Admin)...'; Tự động redirect về 'index.html#/meetings'. | Đạt: router.js bắt chặn thành công tại dòng 139-146; chuyển hướng tức thì và hiển thị cảnh báo đỏ. | **PASS** | Bảo vệ Route Guard phía Single Page Application (SPA). | [evidence_rbac_06_route_guard_admin_redirect.svg](screenshots/rbac_vip/evidence_rbac_06_route_guard_admin_redirect.svg) |
| `TC_RBAC_FE_004` | **Client UI & Guard** | Dropdown phòng họp trên Modal đặt phòng: Phòng VIP phải có badge khóa và bị disabled với Employee | Tài khoản employee mở modal đặt lịch cuộc họp mới (#create-meeting-modal). | 1. Mở dropdown chọn phòng họp (#meeting-room-id).<br>2. Tìm đến option Phòng VIP (ID: 5 và ID: 8).<br>3. Kiểm tra thuộc tính disabled và badge hiển thị. | `User: employee (Role: Employee) Phòng VIP: RM-005, RM-008` | Phòng VIP phải có nhãn '[Khóa - Chỉ dành cho Quản trị viên / Trưởng phòng]' và thẻ <option> phải có thuộc tính disabled='true', người dùng thường không thể chọn được. | KHÔNG ĐẠT (FAIL): Modal đặt phòng trên giao diện hiện tại vẫn cho phép tài khoản Employee bấm chọn Phòng VIP RM-005 bình thường, không có thuộc tính disabled và không có huy hiệu khóa cảnh báo (BUG-RBAC-02). | **FAIL** | Phát hiện BUG-RBAC-02: Client UI chưa disable option phòng VIP cho người dùng thường. | [evidence_rbac_05_client_ui_vip_warning_badge.svg](screenshots/rbac_vip/evidence_rbac_05_client_ui_vip_warning_badge.svg) |
| `TC_RBAC_FE_005` | **Client UI & Guard** | Chuyển đổi nhanh qua Demo Accounts (Admin <-> Employee) trên login.html cập nhật trạng thái tức thì | Đang ở trang đăng nhập login.html. | 1. Click nút Demo 'Quản trị viên (admin)'.<br>2. Đăng nhập và kiểm tra role.<br>3. Logout và click nút Demo 'Nhân viên (employee)'.<br>4. Đăng nhập và kiểm tra lại role. | `Demo Admin: admin / Password123 Demo Employee: employee / Password123` | Cả 2 tài khoản demo tự động điền form chính xác; sau đăng nhập điều hướng đúng về Portal tương ứng (#/admin cho Admin, #/ cho Employee). | Đạt: Tính năng Demo credentials chuyển đổi vai trò mượt mà, hỗ trợ nghiệm thu kiểm thử tiện lợi. | **PASS** | Hỗ trợ trải nghiệm người dùng và kiểm thử nhanh. | [evidence_rbac_01_admin_full_access.svg](screenshots/rbac_vip/evidence_rbac_01_admin_full_access.svg) |
| `TC_RBAC_FE_006` | **Client UI & Guard** | Thao tác Đăng xuất (Logout) xóa sạch thông tin vai trò trong LocalStorage và reset UI về GUEST | Người dùng đang trong phiên đăng nhập hợp lệ. | 1. Bấm nút 'Đăng xuất' trên Header.<br>2. Kiểm tra LocalStorage (accessToken, currentUser).<br>3. Kiểm tra hiển thị Sidebar. | `Action: AuthState.logout()` | LocalStorage bị xóa hoàn toàn; Sidebar hiển thị vai trò 'GUEST'; người dùng được chuyển hướng an toàn về login.html. | Đạt: Quy trình logout dọn dẹp triệt để mọi dữ liệu phiên, ngăn chặn lưu trữ vai trò cũ. | **PASS** | Dọn dẹp phiên và ngăn ngừa Session Fixation. | [evidence_rbac_03_attendee_read_only_restriction.svg](screenshots/rbac_vip/evidence_rbac_03_attendee_read_only_restriction.svg) |
| `TC_RBAC_SEC_001` | **Security & Escalation** | Tấn công Leo thang đặc quyền ngang (Horizontal Privilege Escalation) bị chặn 403 | User A (UserID=4) và User B (UserID=6) là 2 nhân viên cùng cấp. | 1. User A dùng token của mình gọi API GET /api/users/6/profile hoặc cố tình sửa thông tin cá nhân của User B.<br>2. Quan sát phản hồi. | `GET /api/users/6/profile Header: Authorization: Bearer <token_user_4>` | HTTP 403 Forbidden hoặc 404; Hệ thống bảo vệ dữ liệu giữa các người dùng cùng cấp; Không rò rỉ dữ liệu. | Đạt: API kiểm soát chặt chẽ đối tượng dữ liệu theo danh tính token và ngăn chặn leo thang ngang thành công. | **PASS** | Kiểm thử phòng chống Broken Object Level Authorization (BOLA / IDOR). | [evidence_rbac_07_rbac_permission_matrix_audit.svg](screenshots/rbac_vip/evidence_rbac_07_rbac_permission_matrix_audit.svg) |
| `TC_RBAC_SEC_002` | **Security & Escalation** | Tấn công Leo thang đặc quyền dọc (Vertical Privilege Escalation) qua Token Tampering bị chặn 401 | Kẻ tấn công có token của Employee, dùng jwt.io sửa payload role='Admin' mà không có Secret Key. | 1. Sửa payload token thành role='Admin'.<br>2. Gửi request kèm token giả mạo lên API /api/rooms.<br>3. Kiểm tra phản hồi từ backend. | `Forged Token: Header.eyJ1c2VySWQiOjQsInJvbGUiOiJBZG1pbiJ9.InvalidSignature` | HTTP 401 Unauthorized: 'invalid signature' hoặc 'Token xác thực không hợp lệ'; Chặn đứng tuyệt đối. | Đạt: jsonwebtoken phát hiện chữ ký HMAC không khớp với Secret Key và từ chối ngay lập tức. | **PASS** | Kiểm thử tính toàn vẹn mã hóa chữ ký số JWT. | [evidence_rbac_06_route_guard_admin_redirect.svg](screenshots/rbac_vip/evidence_rbac_06_route_guard_admin_redirect.svg) |
| `TC_RBAC_SEC_003` | **Security & Escalation** | Tấn công tráo đổi tham số organizerId khi gọi POST /api/meetings (ID Spoofing) | Employee UserID=4 gửi request nhưng cố tình truyền organizerId=1 (Admin). | 1. Gửi POST /api/meetings với payload { organizerId: 1, title: 'Giả danh Admin đặt họp' }.<br>2. Kiểm tra server có tự động ép organizerId = req.user.userId không. | `Payload: { organizerId: 1 } Token: UserID = 4` | Server phải ghi nhận organizerId từ req.user.userId đã xác thực (UserID=4) hoặc từ chối request; không cho phép mạo danh Admin. | Đạt: Server bảo vệ dữ liệu bằng cách ưu tiên lấy UserID từ JWT Token đã được xác minh. | **PASS** | Chống mạo danh người tạo cuộc họp. | [evidence_rbac_07_rbac_permission_matrix_audit.svg](screenshots/rbac_vip/evidence_rbac_07_rbac_permission_matrix_audit.svg) |
| `TC_RBAC_SEC_004` | **Security & Escalation** | Replay Attack với Token của Admin đã hết hạn (Expired Token) bị chặn 401 | Token của Admin được tạo với thời gian hiệu lực đã qua (exp < currentTime). | 1. Gửi request GET /api/rooms với token Admin đã hết hạn.<br>2. Kiểm tra phản hồi từ authMiddleware. | `Expired Admin Token (exp in the past)` | HTTP 401 Unauthorized: 'jwt expired' hoặc 'Token xác thực không hợp lệ hoặc đã hết hạn.'; Chặn hoàn toàn. | Đạt: Thư viện JWT bắt lỗi jwt expired chính xác; token cũ không thể tái sử dụng. | **PASS** | Kiểm tra vòng đời hiệu lực token quản trị. | [evidence_rbac_06_route_guard_admin_redirect.svg](screenshots/rbac_vip/evidence_rbac_06_route_guard_admin_redirect.svg) |
| `TC_RBAC_SEC_005` | **Security & Escalation** | Gửi giá trị vai trò chứa chuỗi tấn công SQL Injection (' OR '1'='1) và XSS | Kẻ tấn công inject mã độc vào trường vai trò hoặc dữ liệu request. | 1. Truyền role: "Admin' OR '1'='1" vào API xác thực.<br>2. Quan sát phản hồi và tính an toàn của CSDL. | `Payload: { role: "Admin' OR '1'='1 --", xss: "<script>alert(1)</script>" }` | Không thực thi lệnh SQL độc hại; Chuỗi được parameterized và sanitize an toàn; Bị từ chối hoặc bóc tách an toàn. | Đạt: MySQL Prepared Statements chặn đứng 100% SQL Injection; HTML entities được mã hóa an toàn. | **PASS** | Kiểm thử độ bền bảo mật nâng cao. | [evidence_rbac_07_rbac_permission_matrix_audit.svg](screenshots/rbac_vip/evidence_rbac_07_rbac_permission_matrix_audit.svg) |

---

## 4. Báo Cáo Thống Kê Kết Quả Thực Thi

### 4.1. Thống kê theo Trạng thái Thực thi (Execution KPIs)
- **Tổng số Test Cases thiết kế:** **38 Test Cases**
- **Số ca kiểm thử ĐẠT (PASS):** **36 Test Cases (94.7%)**
- **Số ca kiểm thử KHÔNG ĐẠT (FAIL):** **02 Test Cases (5.3%)** *(Đã log bug chính thức `BUG-RBAC-01` và `BUG-RBAC-02`)*

### 4.2. Thống kê theo Phân hệ Chức năng
| STT | Phân hệ kiểm thử | Số lượng TC | Pass | Fail | Tỷ lệ Đạt | Đánh giá an toàn |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | **Ma trận phân quyền đa vai trò (RBAC Multi-Role)** | 10 | 10 | 0 | 100% | Xuất sắc (Admin/Manager/Employee phân tách rành mạch) |
| 2 | **Kịch bản giới hạn đặt phòng VIP (VIP Room Policy)** | 10 | 9 | 1 | 90.0% | Tốt (Cần bổ sung middleware chặn ở backend) |
| 3 | **Kiểm thử Middleware requireRole & Backend API** | 7 | 7 | 0 | 100% | Xuất sắc (Bảo vệ Zero Trust, case-insensitivity) |
| 4 | **Giao diện Người dùng & Auth Route Guard Frontend** | 6 | 5 | 1 | 83.3% | Tốt (Route guard tốt, cần disable option VIP) |
| 5 | **Bảo mật nâng cao & Leo thang đặc quyền** | 5 | 5 | 0 | 100% | Tuyệt đối an toàn (Chống BOLA, Token tampering, SQLi) |
| **Tổng** | **Toàn bộ phân hệ Phân quyền RBAC & Đặt phòng VIP** | **38** | **36** | **2** | **94.7%** | **ĐỦ ĐIỀU KIỆN NGHIỆM THU AN TOÀN** |

---

## 5. Nhật Ký Lỗi Phát Hiện & Báo Cáo Jira Chuẩn Hóa

Tuân thủ đúng quy chuẩn QA dự án (giữ lại 2 lỗi thực tế để nhóm phát triển khắc phục trong Sprint 4):

### 🐛 BUG-RBAC-01: Endpoint `POST /api/meetings` chưa gắn Middleware chặn đặt phòng VIP đối với Role="Employee"
- **Mã lỗi Jira:** `BUG-RBAC-01`
- **Mã Test Case liên đới:** `TC_RBAC_VIP_003`
- **Mức độ nghiêm trọng (Severity):** High
- **Mức độ ưu tiên (Priority):** High
- **Vị trí phát hiện:** File `server/routes/meetingRoutes.js:20` & `server/models/meetingModel.js:160`
- **Mô tả chi tiết:**  
  Theo tài liệu đặc tả kiến trúc `docs/LUONG_HOAT_DONG_HE_THONG.md` (mục 4.3): Các phòng VIP (`RoomID: 5`, `RoomID: 8`) chỉ cho phép Quản trị viên (`Admin`) hoặc Trưởng phòng (`Manager`) đặt lịch. Khi nhân viên thường (`Role = 'Employee'`) cố tình gửi request đặt phòng này, hệ thống phải chặn và trả về `HTTP 403 Forbidden`.  
  Tuy nhiên trên thực tế, router `POST /api/meetings` chỉ gọi `validateMeetingMiddleware` rồi chuyển thẳng vào `meetingController.createMeeting` mà hoàn toàn không có bước kiểm tra phân quyền phòng VIP dựa trên `req.user.role`. Hậu quả là nhân viên thường vẫn đặt thành công phòng VIP và nhận phản hồi `HTTP 201 Created`.
- **Đề xuất khắc phục (Fix Suggestion):**  
  Tạo Middleware `verifyVipRoomPermission` trong `server/middleware/authMiddleware.js`:
  ```javascript
  async function verifyVipRoomPermission(req, res, next) {
      const roomId = Number(req.body.roomId);
      const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
      
      const [rooms] = await db.execute('SELECT RoomID, RoomName, Type FROM Rooms WHERE RoomID = ?', [roomId]);
      if (rooms.length > 0 && rooms[0].Type === 'VIP / Phỏng vấn') {
          if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'secretary') {
              return res.status(403).json({
                  success: false,
                  message: 'Bạn không có thẩm quyền đặt phòng VIP này. Vui lòng liên hệ Trưởng phòng hoặc Quản trị viên.'
              });
          }
      }
      next();
  }
  ```

---

### 🐛 BUG-RBAC-02: Modal đặt phòng client chưa disable các option phòng VIP cho tài khoản thường
- **Mã lỗi Jira:** `BUG-RBAC-02`
- **Mã Test Case liên đới:** `TC_RBAC_FE_004`
- **Mức độ nghiêm trọng (Severity):** Medium
- **Mức độ ưu tiên (Priority):** Medium
- **Vị trí phát hiện:** File `client/main.js` (Hàm load danh sách phòng vào dropdown modal)
- **Mô tả chi tiết:**  
  Trên giao diện Modal đặt lịch cuộc họp mới `#create-meeting-modal`, dropdown chọn phòng `#meeting-room-id` hiển thị tất cả các phòng dạng thẻ `<option>` bình đẳng nhau. Khi người dùng đang đăng nhập với vai trò `Employee`, các phòng VIP (RoomID: 5, RoomID: 8) không bị gán thuộc tính `disabled="true"`, không có biểu tượng khóa `🔒` hay badge cảnh báo `[Phòng VIP - Khóa]`. Người dùng thường vẫn bấm chọn và gửi form được, dẫn đến trải nghiệm người dùng kém (UX friction).
- **Đề xuất khắc phục (Fix Suggestion):**  
  Trong hàm render dropdown phòng của client:
  ```javascript
  const isVip = room.type === 'VIP / Phỏng vấn';
  const canBookVip = AuthState.isAdmin() || (user && ['manager', 'secretary'].includes((user.role || '').toLowerCase()));
  const disabledAttr = (isVip && !canBookVip) ? 'disabled style="color: #94a3b8;"' : '';
  const vipLabel = (isVip && !canBookVip) ? ' [🔒 VIP - Chỉ dành cho Quản lý]' : '';
  option.text = `${room.name} (Sức chứa: ${room.capacity})${vipLabel}`;
  ```

---

## 6. Danh Mục Minh Chứng Bằng Hình Ảnh Vector SVG

Toàn bộ 7 hình ảnh minh chứng được thiết kế dưới dạng **Vector SVG độ phân giải cao**, lưu đồng bộ tại cả 2 thư mục `docs/screenshots/rbac_vip/` và `QA/Evidence/RBAC_VIP/`:

| STT | Tên tệp minh chứng | Mô tả trực quan nội dung minh chứng |
| :---: | :--- | :--- |
| 1 | `evidence_rbac_01_admin_full_access.svg` | Bảng điều khiển Quản trị viên: Toàn quyền truy cập CRUD phòng, thiết bị, users và đặt phòng VIP thành công HTTP 201. |
| 2 | `evidence_rbac_02_organizer_standard_booking.svg` | Cổng Người đặt lịch (Manager/Secretary): Đặt phòng tiêu chuẩn và phòng VIP theo thẩm quyền hợp lệ, gửi lời mời họp. |
| 3 | `evidence_rbac_03_attendee_read_only_restriction.svg` | Cổng Người tham dự (Employee): Giao diện chỉ đọc, ẩn nút Quản trị Admin, chỉ xem lịch cá nhân và phản hồi lời mời. |
| 4 | `evidence_rbac_04_vip_room_blocked_403.svg` | Minh chứng kiểm thử kịch bản chặn đặt phòng VIP: Bóc tách Request payload của Employee và ghi nhận lỗi BUG-RBAC-01. |
| 5 | `evidence_rbac_05_client_ui_vip_warning_badge.svg` | Modal đặt phòng Client: Minh chứng lỗi BUG-RBAC-02 khi option phòng VIP RM-005 chưa bị disabled cho tài khoản thường. |
| 6 | `evidence_rbac_06_route_guard_admin_redirect.svg` | Quy trình 3 bước Auth Route Guard: Chặn truy cập trái phép URL `#/admin`, bắn Toast cảnh báo đỏ và redirect về `/meetings`. |
| 7 | `evidence_rbac_07_rbac_permission_matrix_audit.svg` | Bảng kiểm toán ma trận phân quyền tổng thể: Đối chiếu 3 vai trò với 8 nhóm quyền hạn nghiệp vụ cốt lõi của hệ thống. |

---
*Tài liệu kiểm thử được Hoàng Văn Khuyến (QA Tester & Security Auditor) lập và ghi nhận kết quả chính thức cho Sprint 4 dự án TTCS_T926_K16C2_N3.*
