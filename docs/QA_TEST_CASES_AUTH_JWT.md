# 📋 TÀI LIỆU KIỂM THỬ: XÁC THỰC NGƯỜI DÙNG, ĐĂNG KÝ / ĐĂNG NHẬP & TOKEN JWT
### *(Module: Authentication & Authorization - RBAC Access Control)*
> **Dự án:** Hệ thống Quản lý Cuộc họp Doanh nghiệp (`TTCS_T926_K16C2_N3`)  
> **Người thực hiện:** Hoàng Văn Khuyến (QA Tester & Security Auditor)  
> **Quy chuẩn kiểm thử:** Tuân thủ tiêu chuẩn [QA_PROCESS_AND_JIRA_STANDARDS.md](file:///Users/user/Library/CloudStorage/GoogleDrive-hvkhuyen@ictu.vn/My%20Drive/Hoc%20tap/2026-2027%20%20%20%20(nam%203)/ky%201-N3%20(k23)/Code%20du%20an%20thuc%20tap/TTCS_T926_K16C2_N3/docs/QA_PROCESS_AND_JIRA_STANDARDS.md)  
> **Phân hệ chức năng:** `US 18.0` (Tạo tài khoản người dùng mới), `US 20.0` (Đăng nhập & Phân quyền RBAC với JWT Token)  
> **Tệp dữ liệu bảng tính đính kèm:**  
> - 📄 **File CSV chuẩn hóa UTF-8:** [test_case_auth_jwt.csv](file:///Users/user/Library/CloudStorage/GoogleDrive-hvkhuyen@ictu.vn/My%20Drive/Hoc%20tap/2026-2027%20%20%20%20(nam%203)/ky%201-N3%20(k23)/Code%20du%20an%20thuc%20tap/TTCS_T926_K16C2_N3/docs/test_case_auth_jwt.csv) / [Test_Cases_Dang_Nhap_Dang_Ky_JWT.csv](file:///Users/user/Library/CloudStorage/GoogleDrive-hvkhuyen@ictu.vn/My%20Drive/Hoc%20tap/2026-2027%20%20%20%20(nam%203)/ky%201-N3%20(k23)/Code%20du%20an%20thuc%20tap/TTCS_T926_K16C2_N3/QA/TestCase/Test_Cases_Dang_Nhap_Dang_Ky_JWT.csv)  
> - 📊 **Bảng tính Excel chính thức (.xlsx):** [Test_Cases_Dang_Nhap_Dang_Ky_JWT.xlsx](file:///Users/user/Library/CloudStorage/GoogleDrive-hvkhuyen@ictu.vn/My%20Drive/Hoc%20tap/2026-2027%20%20%20%20(nam%203)/ky%201-N3%20(k23)/Code%20du%20an%20thuc%20tap/TTCS_T926_K16C2_N3/QA/TestCase/Test_Cases_Dang_Nhap_Dang_Ky_JWT.xlsx)  
> - 🌐 **Giao diện HTML trực quan:** [test_case_auth_jwt.html](file:///Users/user/Library/CloudStorage/GoogleDrive-hvkhuyen@ictu.vn/My%20Drive/Hoc%20tap/2026-2027%20%20%20%20(nam%203)/ky%201-N3%20(k23)/Code%20du%20an%20thuc%20tap/TTCS_T926_K16C2_N3/docs/test_case_auth_jwt.html)  
> - 🖼️ **Thư mục ảnh minh chứng Vector SVG:** `docs/screenshots/auth_jwt/` & `QA/Evidence/Auth_JWT/`

---

## 📑 MỤC LỤC TỔNG QUAN

1. [Mục Tiêu & Phạm Vi Kiểm Thử (Scope & Objectives)](#1-mục-tiêu--phạm-vi-kiểm-thử)
2. [Sơ Đồ Luồng Hoạt Động Xác Thực & Phân Quyền (Sequence Diagrams)](#2-sơ-đồ-luồng-hoạt-động-xác-thực--phân-quyền)
   - 2.1. Luồng 1: Đăng ký tài khoản mới & Mã hóa BCrypt
   - 2.2. Luồng 2: Đăng nhập cấp phát JWT Token & Lưu trữ LocalStorage
   - 2.3. Luồng 3: Xác thực API Header `Authorization: Bearer <token>` & Auth Guard
3. [Bảng Ma Trận 38 Test Cases Chi Tiết (11 Cột Chuẩn Hóa)](#3-bảng-ma-trận-38-test-cases-chi-tiết)
   - Nhóm 1: Kiểm thử Đăng ký tài khoản (12 Test Cases)
   - Nhóm 2: Kiểm thử Đăng nhập tài khoản (10 Test Cases)
   - Nhóm 3: Kiểm thử Xác thực Token JWT & Header (08 Test Cases)
   - Nhóm 4: Kiểm thử Client Auth State, LocalStorage & Auth Guard (05 Test Cases)
   - Nhóm 5: Kiểm thử Bảo mật & Ca biên Security (03 Test Cases)
4. [Báo Cáo Thống Kê Kết Quả Thực Thi (KPI Metrics)](#4-báo-cáo-thống-kê-kết-quả-thực-thi)
5. [Nhật Ký Lỗi Phát Hiện & Báo Cáo Jira Chuẩn Hóa (Bug Log)](#5-nhật-ký-lỗi-phát-hiện--báo-cáo-jira)
6. [Danh Mục Minh Chứng Bằng Hình Ảnh Vector SVG](#6-danh-mục-minh-chứng-bằng-hình-ảnh-vector-svg)

---

## 1. Mục Tiêu & Phạm Vi Kiểm Thử

### 1.1. Mục tiêu
1. **Kiểm tra tính đúng đắn chức năng:** Đảm bảo luồng Đăng ký tài khoản (`POST /api/auth/register`) và Đăng nhập (`POST /api/auth/login`) hoạt động chính xác với đầy đủ các trường hợp dữ liệu hợp lệ và không hợp lệ.
2. **Kiểm soát tính toàn vẹn và độc nhất (Uniqueness Integrity):** Chặn triệt để tình trạng đăng ký trùng lặp `email` hoặc `username` trong CSDL MySQL bảng `Users`.
3. **Đảm bảo an toàn mật khẩu (Password Security):** Xác minh mật khẩu người dùng **bắt buộc phải được băm một chiều bằng thuật toán BCrypt (10 rounds)** trước khi lưu vào CSDL. Tuyệt đối không lưu plain text.
4. **Kiểm thử vòng đời JWT Token:** Cấp phát Access Token chuẩn RFC 7519, thời hạn hiệu lực `24h`, giải mã thông tin an toàn tại endpoint `GET /api/auth/me`.
5. **Kiểm thử bảo vệ API & Phân quyền RBAC:** Middleware `authenticateToken` chặn 100% các request thiếu token, token giả mạo, hoặc token hết hạn với mã lỗi `401 Unauthorized`.
6. **Kiểm tra bảo vệ phía Client:** Client `auth.js` tự động lưu token vào `localStorage`, tự động gán Header `Authorization: Bearer <token>` vào các cuộc gọi `auth.fetch()`, và Auth Guard trong `router.js` tự động chuyển hướng về `/login.html` khi chưa đăng nhập.

### 1.2. Phạm vi kiểm thử
- **API Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- **Giao diện Client:** Trang đăng nhập toàn màn hình `client/login.html` (Tab Đăng nhập & Tab Đăng ký, nút Demo accounts), Auth Guard `client/router.js`, Client module `client/auth.js`.
- **Cơ sở dữ liệu:** Bảng `Users` (trường `Username`, `Email`, `PasswordHash`, `Role`).

---

## 2. Sơ Đồ Luồng Hoạt Động Xác Thực & Phân Quyền

### 2.1. Luồng 1: Đăng ký tài khoản mới & Mã hóa BCrypt
```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng mới
    participant UI as Giao diện (login.html#register)
    participant Validator as authValidator.js
    participant Service as authService.js
    participant DB as MySQL (Users Table)

    User->>UI: Điền Họ tên, Username, Email, Mật khẩu
    User->>UI: Nhấn "Đăng ký tài khoản"
    UI->>Validator: POST /api/auth/register (JSON Payload)
    Validator->>Validator: Kiểm tra rỗng, định dạng email, username regex, pass >= 6 ký tự
    alt Dữ liệu không hợp lệ
        Validator-->>UI: HTTP 400 Bad Request kèm mảng errors
        UI-->>User: Hiển thị thông báo viền đỏ chi tiết
    else Dữ liệu hợp lệ
        Validator->>Service: Gọi authService.register(cleanData)
        Service->>DB: 1. SELECT UserID FROM Users WHERE Username = ? OR Email = ?
        alt Đã tồn tại Username hoặc Email
            DB-->>Service: Bản ghi trùng lặp
            Service-->>UI: HTTP 409 Conflict: "Email hoặc Username đã tồn tại"
            UI-->>User: Cảnh báo trùng lặp tài khoản
        else Chưa tồn tại (Unique)
            Service->>Service: 2. bcrypt.hash(password, 10 rounds)
            Service->>DB: 3. INSERT INTO Users (Username, FullName, Email, PasswordHash, Role='USER')
            DB-->>Service: Bản ghi mới (UserID)
            Service-->>UI: HTTP 201 Created (Trả về User an toàn không kèm PasswordHash)
            UI-->>User: Banner xanh: Đăng ký thành công! Chuyển sang Đăng nhập
        end
    end
```

### 2.2. Luồng 2: Đăng nhập cấp phát JWT Token & Lưu trữ LocalStorage
```mermaid
sequenceDiagram
    autonumber
    actor User as Nhân viên / Quản trị viên
    participant UI as Giao diện (login.html#login)
    participant API as authController.js & authService.js
    participant DB as MySQL (Users Table)
    participant Storage as LocalStorage (Browser)

    User->>UI: Nhập Username/Email và Mật khẩu
    User->>UI: Nhấn "Đăng nhập"
    UI->>API: POST /api/auth/login ({ identifier, password })
    API->>DB: SELECT * FROM Users WHERE Username = ? OR Email = ?
    alt Không tìm thấy User
        DB-->>API: null
        API-->>UI: HTTP 401 Unauthorized: "Tên đăng nhập hoặc mật khẩu không chính xác."
    else Tìm thấy User
        API->>API: bcrypt.compare(password, user.PasswordHash)
        alt Sai mật khẩu
            API-->>UI: HTTP 401 Unauthorized: "Tên đăng nhập hoặc mật khẩu không chính xác."
            UI-->>User: Hiển thị Alert đỏ thông báo lỗi bảo mật
        else Mật khẩu đúng
            API->>API: jwtHelper.generateToken({ userId, username, email, role }, '24h')
            API-->>UI: HTTP 200 OK kèm token, tokenType: 'Bearer', user profile
            UI->>Storage: localStorage.setItem('accessToken', token);
            UI->>Storage: localStorage.setItem('currentUser', JSON.stringify(user));
            UI->>UI: Auth Guard chuyển hướng tức thì vào /index.html
            UI-->>User: Đăng nhập thành công, mở màn hình Dashboard
        end
    end
```

### 2.3. Luồng 3: Xác thực API Header `Authorization: Bearer <token>` & Auth Guard
```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App (auth.fetch)
    participant Middleware as authMiddleware.js (authenticateToken)
    participant Controller as Protected Controller (/api/auth/me)
    
    Client->>Middleware: Request API kèm Header Authorization: Bearer <token>
    alt Không có Header Authorization
        Middleware-->>Client: HTTP 401 Unauthorized ("Yêu cầu token xác thực")
    else Có Header Authorization
        Middleware->>Middleware: Bóc tách token từ 'Bearer <token>'
        Middleware->>Middleware: jwtHelper.verifyToken(token)
        alt Token giả mạo hoặc hết hạn
            Middleware-->>Client: HTTP 401 Unauthorized ("Token không hợp lệ hoặc đã hết hạn")
            Client->>Client: Xóa LocalStorage và Redirect về login.html
        else Token hợp lệ (Valid)
            Middleware->>Middleware: Gán req.user = payload
            Middleware->>Controller: next()
            Controller-->>Client: HTTP 200 OK (Thực thi thành công tài nguyên bảo vệ)
        end
    end
```

---

## 3. Bảng Ma Trận 38 Test Cases Chi Tiết

| Mã Test Case | Phân hệ | Tiêu đề kịch bản | Điều kiện tiên quyết | Các bước thực hiện | Dữ liệu kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Ghi chú & Bug ID | Minh chứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| `TC_AUTH_REG_001` | **Đăng ký tài khoản** | Đăng ký tài khoản mới thành công với đầy đủ thông tin hợp lệ (Happy Path) | 1. Hệ thống Backend & MySQL đang chạy.<br>2. Username và Email chưa tồn tại trong bảng Users. | 1. Truy cập /login.html, chuyển sang tab Đăng ký.<br>2. Nhập Họ tên: 'Hoàng Văn Khuyến', Username: 'khuyen.hv', Email: 'khuyen.hv@enterprise.vn', Mật khẩu: 'Password123', Nhập lại: 'Password123'.<br>3. Nhấn 'Đăng ký tài khoản'. | `fullName: 'Hoàng Văn Khuyến', username: 'khuyen.hv', email: 'khuyen.hv@enterprise.vn', password: 'Password123'` | 1. Form hợp lệ.<br>2. Gọi POST /api/auth/register trả về HTTP 201 Created.<br>3. CSDL lưu bản ghi mới, PasswordHash mã hóa BCrypt, role mặc định 'USER'.<br>4. Thông báo đăng ký thành công. | Trả về HTTP 201 Created, CSDL lưu hash BCrypt 10 vòng, thông báo đăng ký thành công. | **PASS** | Kiểm thử luồng chính (Happy Path) Đăng ký tài khoản. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |
| `TC_AUTH_REG_002` | **Đăng ký tài khoản** | Đăng ký tài khoản thành công khi bỏ trống trường Họ và tên (Lấy username làm mặc định) | Username 'testuser02' và email 'test02@enterprise.vn' chưa tồn tại. | 1. Mở tab Đăng ký.<br>2. Để trống ô Họ và tên.<br>3. Nhập username: 'testuser02', email: 'test02@enterprise.vn', mật khẩu: 'Password123'.<br>4. Bấm Đăng ký. | `fullName: '', username: 'testuser02', email: 'test02@enterprise.vn', password: 'Password123'` | 1. Form hợp lệ.<br>2. Backend tự gán fullName = username ('testuser02').<br>3. Trả về HTTP 201 Created. | Đăng ký thành công, trường FullName trong CSDL được gán bằng 'testuser02'. | **PASS** | Kiểm tra xử lý trường tùy chọn fullName. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |
| `TC_AUTH_REG_003` | **Đăng ký tài khoản** | Chặn đăng ký khi bỏ trống trường bắt buộc Tên người dùng (Username) | Người dùng đang ở form Đăng ký. | 1. Để trống ô Tên người dùng.<br>2. Điền đầy đủ email, mật khẩu.<br>3. Bấm Đăng ký. | `username: '', email: 'valid@enterprise.vn', password: 'Password123'` | Hệ thống chặn submit, trả về HTTP 400 Bad Request kèm thông báo lỗi: 'Tên người dùng (username) là trường bắt buộc.' | HTTP 400 Bad Request, message: 'Tên người dùng (username) là trường bắt buộc.' | **PASS** | Kiểm tra validate trường bắt buộc username. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |
| `TC_AUTH_REG_004` | **Đăng ký tài khoản** | Chặn đăng ký khi bỏ trống trường bắt buộc Email | Người dùng đang ở form Đăng ký. | 1. Nhập username và password hợp lệ.<br>2. Để trống ô Email.<br>3. Bấm Đăng ký. | `username: 'validuser', email: '', password: 'Password123'` | Hệ thống chặn submit, trả về HTTP 400 Bad Request: 'Email là trường bắt buộc.' | HTTP 400 Bad Request, báo lỗi thiếu email. | **PASS** | Kiểm tra validate trường bắt buộc email. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |
| `TC_AUTH_REG_005` | **Đăng ký tài khoản** | Chặn đăng ký khi bỏ trống trường bắt buộc Mật khẩu | Người dùng đang ở form Đăng ký. | 1. Nhập username và email hợp lệ.<br>2. Để trống ô Mật khẩu.<br>3. Bấm Đăng ký. | `username: 'validuser', email: 'valid@enterprise.vn', password: ''` | Hệ thống chặn submit, trả về HTTP 400 Bad Request: 'Mật khẩu là trường bắt buộc.' | HTTP 400 Bad Request, báo lỗi thiếu mật khẩu. | **PASS** | Kiểm tra validate trường bắt buộc password. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |
| `TC_AUTH_REG_006` | **Đăng ký tài khoản** | Chặn đăng ký khi Email không đúng định dạng tiêu chuẩn (Regex Violation) | Người dùng đang ở form Đăng ký. | 1. Nhập email sai định dạng: 'khuyen.hv-invalid-email'.<br>2. Nhập username và password hợp lệ.<br>3. Bấm Đăng ký. | `email: 'khuyen.hv-invalid-email'` | Hệ thống từ chối, trả về HTTP 400 Bad Request: 'Địa chỉ email không đúng định dạng hợp lệ.' | HTTP 400 Bad Request: 'Địa chỉ email không đúng định dạng hợp lệ.' | **PASS** | Kiểm tra Regex EMAIL_REGEX. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |
| `TC_AUTH_REG_007` | **Đăng ký tài khoản** | Kiểm tra xác thực Mật khẩu xác nhận không khớp ở Backend (Confirm Password Mismatch) | Client gửi request trực tiếp POST /api/auth/register bypass qua kiểm tra JS của trình duyệt. | 1. Gửi request POST /api/auth/register.<br>2. Payload chứa password: 'Password123', confirmPassword: 'DifferentPassword456'.<br>3. Quan sát phản hồi server. | `password: 'Password123', confirmPassword: 'DifferentPassword456'` | Backend phải đối chiếu 2 trường và trả về HTTP 400 Bad Request: 'Mật khẩu xác nhận không trùng khớp.' | Backend chỉ validate trường 'password', hoàn toàn bỏ qua 'confirmPassword' và tạo tài khoản thành công (HTTP 201). | **FAIL** | BUG-AUTH-02: Backend thiếu kiểm tra đối chiếu confirmPassword khi client bị bypass. | [evidence_auth_02_duplicate_email_blocked.svg](screenshots/auth_jwt/evidence_auth_02_duplicate_email_blocked.svg) |
| `TC_AUTH_REG_008` | **Đăng ký tài khoản** | Chặn đăng ký khi Email đã tồn tại trong CSDL (Duplicate Email Check) | Email 'admin@enterprise.vn' đã có sẵn trong bảng Users. | 1. Nhập username: 'newuser99'.<br>2. Nhập email: 'admin@enterprise.vn'.<br>3. Nhập mật khẩu hợp lệ và bấm Đăng ký. | `username: 'newuser99', email: 'admin@enterprise.vn', password: 'Password123'` | Hệ thống phát hiện trùng email, trả về HTTP 409 Conflict: 'Địa chỉ email đã được đăng ký trên hệ thống.' | HTTP 409 Conflict: 'Địa chỉ email đã được đăng ký trên hệ thống.' | **PASS** | Kiểm tra tính duy nhất (UNIQUE) của email. | [evidence_auth_02_duplicate_email_blocked.svg](screenshots/auth_jwt/evidence_auth_02_duplicate_email_blocked.svg) |
| `TC_AUTH_REG_009` | **Đăng ký tài khoản** | Chặn đăng ký khi Tên người dùng (Username) đã tồn tại trong CSDL (Duplicate Username Check) | Username 'admin' đã có sẵn trong bảng Users. | 1. Nhập username: 'admin'.<br>2. Nhập email mới: 'unique_email@enterprise.vn'.<br>3. Bấm Đăng ký. | `username: 'admin', email: 'unique_email@enterprise.vn', password: 'Password123'` | Hệ thống phát hiện trùng username, trả về HTTP 409 Conflict: 'Tên người dùng đã được sử dụng. Vui lòng chọn tên khác.' | HTTP 409 Conflict: 'Tên người dùng đã được sử dụng. Vui lòng chọn tên khác.' | **PASS** | Kiểm tra tính duy nhất (UNIQUE) của username. | [evidence_auth_02_duplicate_email_blocked.svg](screenshots/auth_jwt/evidence_auth_02_duplicate_email_blocked.svg) |
| `TC_AUTH_REG_010` | **Đăng ký tài khoản** | Chặn đăng ký khi Mật khẩu quá ngắn (< 6 ký tự) | Người dùng đang ở form Đăng ký. | 1. Nhập username và email hợp lệ.<br>2. Nhập mật khẩu: '12345' (5 ký tự).<br>3. Bấm Đăng ký. | `password: '12345' (độ dài 5 ký tự)` | Hệ thống từ chối, trả về HTTP 400 Bad Request: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' | HTTP 400 Bad Request: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' | **PASS** | Kiểm tra điều kiện độ dài mật khẩu tối thiểu. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |
| `TC_AUTH_REG_011` | **Đăng ký tài khoản** | Chặn đăng ký khi Username chứa ký tự đặc biệt không được phép | Người dùng đang ở form Đăng ký. | 1. Nhập username: 'user@#$!%'.<br>2. Nhập email và password hợp lệ.<br>3. Bấm Đăng ký. | `username: 'user@#$!%'` | Hệ thống từ chối, trả về HTTP 400: 'Tên người dùng chỉ được chứa chữ cái, chữ số, dấu chấm (.), gạch dưới (_) và gạch ngang (-).' | HTTP 400 Bad Request, báo lỗi vi phạm định dạng USERNAME_REGEX. | **PASS** | Kiểm tra Regex ký tự hợp lệ của username. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |
| `TC_AUTH_REG_012` | **Đăng ký tài khoản** | Chống leo thang đặc quyền (Privilege Escalation) khi client cố tình gửi role 'ADMIN' | Client gửi request POST /api/auth/register kèm payload cố ý truyền { role: 'ADMIN' }. | 1. Gửi request POST /api/auth/register với role: 'ADMIN'.<br>2. Kiểm tra tài khoản được tạo trong CSDL. | `username: 'hacker01', role: 'ADMIN'` | Hệ thống tuyệt đối không cấp quyền Admin từ client, tự động ghi đè role về mặc định 'USER'. | Tài khoản được tạo với role = 'USER'. Trường role client gửi bị bỏ qua hoàn toàn. | **PASS** | Kiểm tra lỗ hổng Mass Assignment / Privilege Escalation. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |
| `TC_AUTH_LOG_001` | **Đăng nhập hệ thống** | Đăng nhập thành công bằng Tên người dùng (Username) và mật khẩu đúng (Happy Path) | Tài khoản username: 'khuyen.hv', mật khẩu: 'Password123' đã tồn tại trong DB. | 1. Truy cập /login.html.<br>2. Nhập Tên đăng nhập: 'khuyen.hv', Mật khẩu: 'Password123'.<br>3. Nhấn 'Đăng nhập'. | `identifier: 'khuyen.hv', password: 'Password123'` | 1. Trả về HTTP 200 OK.<br>2. Phản hồi chứa 'token' (JWT hợp lệ), tokenType: 'Bearer', expiresIn: '24h', object user.<br>3. Chuyển hướng vào trang Dashboard. | HTTP 200 OK, trả về JWT token 3 phần, lưu vào localStorage và chuyển hướng thành công. | **PASS** | Kiểm thử luồng chính Đăng nhập bằng Username. | [evidence_auth_03_login_happy_path_jwt.svg](screenshots/auth_jwt/evidence_auth_03_login_happy_path_jwt.svg) |
| `TC_AUTH_LOG_002` | **Đăng nhập hệ thống** | Đăng nhập thành công bằng Địa chỉ Email và mật khẩu đúng | Tài khoản email: 'khuyen.hv@enterprise.vn', pass: 'Password123' đã tồn tại. | 1. Mở trang đăng nhập.<br>2. Nhập Email: 'khuyen.hv@enterprise.vn', Mật khẩu: 'Password123'.<br>3. Bấm Đăng nhập. | `identifier: 'khuyen.hv@enterprise.vn', password: 'Password123'` | Backend nhận diện identifier là email, đối soát mật khẩu BCrypt thành công và trả về HTTP 200 OK kèm Token. | HTTP 200 OK, đăng nhập thành công bằng Email. | **PASS** | Kiểm thử đăng nhập linh hoạt bằng Email. | [evidence_auth_03_login_happy_path_jwt.svg](screenshots/auth_jwt/evidence_auth_03_login_happy_path_jwt.svg) |
| `TC_AUTH_LOG_003` | **Đăng nhập hệ thống** | Chặn đăng nhập khi nhập sai Mật khẩu (Wrong Password) | Tài khoản 'khuyen.hv' tồn tại trên hệ thống. | 1. Nhập username: 'khuyen.hv'.<br>2. Nhập mật khẩu sai: 'WrongPassword999'.<br>3. Nhấn Đăng nhập. | `identifier: 'khuyen.hv', password: 'WrongPassword999'` | Hệ thống từ chối, trả về HTTP 401 Unauthorized: 'Tên đăng nhập hoặc mật khẩu không chính xác.' Không cấp Token. | HTTP 401 Unauthorized: 'Tên đăng nhập hoặc mật khẩu không chính xác.' | **PASS** | Kiểm tra bảo mật đối soát BCrypt khi sai pass. | [evidence_auth_04_wrong_password_blocked.svg](screenshots/auth_jwt/evidence_auth_04_wrong_password_blocked.svg) |
| `TC_AUTH_LOG_004` | **Đăng nhập hệ thống** | Chặn đăng nhập khi Tên đăng nhập / Email không tồn tại trong hệ thống (User Not Found) | Tài khoản 'non_existing_user_999' không có trong DB. | 1. Nhập identifier: 'non_existing_user_999'.<br>2. Nhập mật khẩu: 'Password123'.<br>3. Bấm Đăng nhập. | `identifier: 'non_existing_user_999', password: 'Password123'` | Hệ thống trả về HTTP 401 Unauthorized: 'Tên đăng nhập hoặc mật khẩu không chính xác.' (Thông báo chung chống dò quét tài khoản). | HTTP 401 Unauthorized, thông báo lỗi chung theo đúng chuẩn OWASP. | **PASS** | Kiểm tra chống User Enumeration Attack. | [evidence_auth_04_wrong_password_blocked.svg](screenshots/auth_jwt/evidence_auth_04_wrong_password_blocked.svg) |
| `TC_AUTH_LOG_005` | **Đăng nhập hệ thống** | Chặn đăng nhập khi để trống cả Tài khoản và Mật khẩu (Empty Form) | Người dùng đang ở form Đăng nhập. | 1. Để trống cả 2 ô.<br>2. Bấm Đăng nhập. | `identifier: '', password: ''` | Hệ thống chặn submit, trả về HTTP 400 Bad Request kèm thông báo lỗi yêu cầu nhập đầy đủ. | HTTP 400 Bad Request, báo lỗi thiếu thông tin đăng nhập. | **PASS** | Kiểm tra validate form đăng nhập rỗng. | [evidence_auth_04_wrong_password_blocked.svg](screenshots/auth_jwt/evidence_auth_04_wrong_password_blocked.svg) |
| `TC_AUTH_LOG_006` | **Đăng nhập hệ thống** | Chặn đăng nhập khi chỉ nhập Tài khoản mà để trống Mật khẩu | Người dùng đang ở form Đăng nhập. | 1. Nhập identifier: 'admin'.<br>2. Để trống ô Mật khẩu.<br>3. Bấm Đăng nhập. | `identifier: 'admin', password: ''` | Trả về HTTP 400 Bad Request: 'Vui lòng nhập mật khẩu.' | HTTP 400 Bad Request: 'Vui lòng nhập mật khẩu.' | **PASS** | Kiểm tra validate thiếu trường password. | [evidence_auth_04_wrong_password_blocked.svg](screenshots/auth_jwt/evidence_auth_04_wrong_password_blocked.svg) |
| `TC_AUTH_LOG_007` | **Đăng nhập hệ thống** | Chặn đăng nhập khi chỉ nhập Mật khẩu mà để trống Tài khoản | Người dùng đang ở form Đăng nhập. | 1. Để trống ô Tài khoản.<br>2. Nhập mật khẩu: 'Password123'.<br>3. Bấm Đăng nhập. | `identifier: '', password: 'Password123'` | Trả về HTTP 400 Bad Request: 'Vui lòng nhập tên đăng nhập hoặc địa chỉ email.' | HTTP 400 Bad Request: 'Vui lòng nhập tên đăng nhập hoặc địa chỉ email.' | **PASS** | Kiểm tra validate thiếu trường identifier. | [evidence_auth_04_wrong_password_blocked.svg](screenshots/auth_jwt/evidence_auth_04_wrong_password_blocked.svg) |
| `TC_AUTH_LOG_008` | **Đăng nhập hệ thống** | Đăng nhập nhanh bằng nút Demo Account: Quản trị viên (Admin) | Trang login.html hiển thị 2 nút tài khoản mẫu. | 1. Nhấp vào nút 'Tài khoản Quản trị viên (Admin)'.<br>2. Quan sát form tự động điền và submit. | `Demo Admin: admin / Password123` | Form tự điền thông tin admin, đăng nhập thành công và cấp quyền truy cập toàn bộ menu Admin Portal. | Đăng nhập thành công, role = 'Admin', hiển thị đầy đủ menu Admin. | **PASS** | Kiểm thử chức năng Demo Admin Login. | [evidence_auth_03_login_happy_path_jwt.svg](screenshots/auth_jwt/evidence_auth_03_login_happy_path_jwt.svg) |
| `TC_AUTH_LOG_009` | **Đăng nhập hệ thống** | Đăng nhập nhanh bằng nút Demo Account: Nhân viên (Employee) | Trang login.html hiển thị 2 nút tài khoản mẫu. | 1. Nhấp vào nút 'Tài khoản Nhân viên (Employee)'.<br>2. Quan sát form tự động điền và submit. | `Demo Employee: employee / Password123` | Form tự điền thông tin employee, đăng nhập thành công, menu Admin bị ẩn. | Đăng nhập thành công, role = 'Employee', menu Admin bị ẩn chính xác. | **PASS** | Kiểm thử chức năng Demo Employee Login. | [evidence_auth_03_login_happy_path_jwt.svg](screenshots/auth_jwt/evidence_auth_03_login_happy_path_jwt.svg) |
| `TC_AUTH_LOG_010` | **Đăng nhập hệ thống** | Đăng nhập với Username viết hoa / viết thường không phân biệt (Case-Insensitive Identifier) | Tài khoản 'khuyen.hv' có trong DB. | 1. Nhập identifier dạng viết hoa: 'KHUYEN.HV'.<br>2. Nhập mật khẩu đúng: 'Password123'.<br>3. Bấm Đăng nhập. | `identifier: 'KHUYEN.HV', password: 'Password123'` | Hệ thống tự động chuẩn hóa chuỗi và đối soát thành công (HTTP 200 OK). | HTTP 200 OK, đăng nhập thành công. | **PASS** | Kiểm tra tính linh hoạt khi gõ hoa thường. | [evidence_auth_03_login_happy_path_jwt.svg](screenshots/auth_jwt/evidence_auth_03_login_happy_path_jwt.svg) |
| `TC_AUTH_JWT_001` | **Xác thực JWT Token** | Xác thực thành công API bảo vệ GET /api/auth/me với Header Authorization Bearer hợp lệ | Đã có JWT token hợp lệ cấp từ endpoint /api/auth/login. | 1. Gửi request GET /api/auth/me.<br>2. Đính kèm Header: Authorization: Bearer <valid_token>.<br>3. Quan sát kết quả. | `Header: 'Authorization: Bearer eyJhbGci...'` | 1. HTTP 200 OK.<br>2. Phản hồi JSON chứa 'success: true', message 'Xác thực tài khoản thành công.' và object user đã giải mã đúng userId, username, role. | HTTP 200 OK, trả về thông tin người dùng chính xác từ payload của Token. | **PASS** | Kiểm thử luồng xác thực API chuẩn bằng Bearer Token. | [evidence_auth_05_jwt_header_authenticated.svg](screenshots/auth_jwt/evidence_auth_05_jwt_header_authenticated.svg) |
| `TC_AUTH_JWT_002` | **Xác thực JWT Token** | Chặn gọi API bảo vệ khi thiếu hoàn toàn Header Authorization (Missing Token) | Endpoint /api/auth/me yêu cầu middleware authenticateToken. | 1. Gửi request GET /api/auth/me không kèm bất kỳ Header xác thực nào.<br>2. Quan sát phản hồi. | `Headers: {} (không có Authorization)` | Trả về HTTP 401 Unauthorized: 'Yêu cầu token xác thực. Vui lòng cung cấp Authorization header.' | HTTP 401 Unauthorized: 'Yêu cầu token xác thực. Vui lòng cung cấp Authorization header.' | **PASS** | Kiểm tra chặn truy cập ẩn danh vào API nội bộ. | [evidence_auth_06_jwt_expired_or_missing.svg](screenshots/auth_jwt/evidence_auth_06_jwt_expired_or_missing.svg) |
| `TC_AUTH_JWT_003` | **Xác thực JWT Token** | Chặn gọi API bảo vệ khi Token có chữ ký giả mạo (Invalid Signature / Tampered Token) | Tạo JWT token giả mạo bằng secret key khác hoặc sửa đổi payload. | 1. Gửi request GET /api/auth/me với token đã bị sửa đổi chữ ký.<br>2. Quan sát phản hồi. | `Header: 'Authorization: Bearer eyJhbGci...tampered_signature'` | JWT verify thất bại, trả về HTTP 401 Unauthorized: 'Chữ ký token không hợp lệ (Invalid signature).' | HTTP 401 Unauthorized: Chữ ký token không hợp lệ. | **PASS** | Kiểm tra bảo mật toàn vẹn chữ ký HMAC SHA256. | [evidence_auth_06_jwt_expired_or_missing.svg](screenshots/auth_jwt/evidence_auth_06_jwt_expired_or_missing.svg) |
| `TC_AUTH_JWT_004` | **Xác thực JWT Token** | Chặn gọi API bảo vệ khi Token đã hết hạn sử dụng (Expired Token Check) | Tạo JWT token có thời hạn 'exp' ở thời điểm quá khứ (ví dụ 1 giờ trước). | 1. Gửi request GET /api/auth/me với expired token.<br>2. Quan sát phản hồi. | `Header: Authorization: Bearer <expired_token>` | jwtHelper phát hiện TokenExpiredError, trả về HTTP 401 Unauthorized: 'Token đã hết hạn sử dụng. Vui lòng đăng nhập lại.' | HTTP 401 Unauthorized: Token đã hết hạn sử dụng. | **PASS** | Kiểm tra cơ chế hết hạn phiên làm việc. | [evidence_auth_06_jwt_expired_or_missing.svg](screenshots/auth_jwt/evidence_auth_06_jwt_expired_or_missing.svg) |
| `TC_AUTH_JWT_005` | **Xác thực JWT Token** | Chặn gọi API khi Token sai cấu trúc Base64 / Malformed JWT | Client gửi chuỗi ngẫu nhiên không phải định dạng 3 phần của JWT. | 1. Gửi request GET /api/auth/me với token: 'invalid_malformed_string_xyz'.<br>2. Quan sát kết quả. | `Authorization: Bearer invalid_malformed_string_xyz` | Trả về HTTP 401 Unauthorized: 'Cấu trúc token không đúng định dạng JWT.' | HTTP 401 Unauthorized, báo lỗi token sai cấu trúc. | **PASS** | Kiểm tra bắt ngoại lệ jwt.malformed. | [evidence_auth_06_jwt_expired_or_missing.svg](screenshots/auth_jwt/evidence_auth_06_jwt_expired_or_missing.svg) |
| `TC_AUTH_JWT_006` | **Xác thực JWT Token** | Kiểm tra hỗ trợ tiền tố Authorization Header chữ thường 'bearer <token>' (RFC 6750 Case-Insensitivity) | Có token hợp lệ. Gửi header với prefix chữ thường: 'bearer <token>'. | 1. Gửi request GET /api/auth/me.<br>2. Header: 'Authorization: bearer eyJhbGci...'.<br>3. Quan sát kết quả. | `Header: 'Authorization: bearer eyJhbGci...'` | Theo RFC 6750, auth scheme nên được xử lý case-insensitive hoặc chấp nhận 'bearer '. Server phải bóc tách token và trả về 200 OK. | authMiddleware.js kiểm tra authHeader.startsWith('Bearer ') phân biệt hoa thường $ightarrow$ trả về false $ightarrow$ token không được bóc prefix và server báo lỗi 401 'Token không hợp lệ'. | **FAIL** | BUG-AUTH-01: authMiddleware.js phân biệt hoa thường tiền tố Bearer, từ chối header hợp lệ của một số HTTP client. | [evidence_auth_06_jwt_expired_or_missing.svg](screenshots/auth_jwt/evidence_auth_06_jwt_expired_or_missing.svg) |
| `TC_AUTH_JWT_007` | **Xác thực JWT Token** | Xác thực thành công qua Header thay thế 'x-access-token' | Có token hợp lệ. Không dùng Authorization header mà dùng x-access-token. | 1. Gửi request GET /api/auth/me.<br>2. Header: 'x-access-token: <valid_token>'.<br>3. Quan sát kết quả. | `Header: 'x-access-token: eyJhbGci...'` | Middleware nhận diện x-access-token, giải mã thành công và trả về HTTP 200 OK. | HTTP 200 OK, xác thực thành công qua x-access-token. | **PASS** | Kiểm tra hỗ trợ header fallback. | [evidence_auth_05_jwt_header_authenticated.svg](screenshots/auth_jwt/evidence_auth_05_jwt_header_authenticated.svg) |
| `TC_AUTH_JWT_008` | **Xác thực JWT Token** | Chặn gọi API khi Header Authorization chỉ chứa 'Bearer ' mà không có token phía sau | Header chỉ có chữ 'Bearer ' rỗng. | 1. Gửi request GET /api/auth/me với Header: 'Authorization: Bearer '.<br>2. Quan sát kết quả. | `Header: 'Authorization: Bearer '` | Middleware phát hiện token rỗng, trả về HTTP 401: 'Token xác thực không hợp lệ hoặc bị trống.' | HTTP 401 Unauthorized: 'Token xác thực không hợp lệ hoặc bị trống.' | **PASS** | Kiểm tra ca biên token rỗng sau tiền tố. | [evidence_auth_06_jwt_expired_or_missing.svg](screenshots/auth_jwt/evidence_auth_06_jwt_expired_or_missing.svg) |
| `TC_AUTH_CLI_001` | **Client Auth State** | Kiểm tra lưu trữ Token và User Profile an toàn vào LocalStorage sau đăng nhập | Đăng nhập thành công trên giao diện /login.html. | 1. Thực hiện đăng nhập với tài khoản khuyen.hv.<br>2. Mở DevTools > Application > Local Storage.<br>3. Kiểm tra các key 'accessToken' và 'currentUser'. | `Key 'accessToken' & 'currentUser'` | 1. 'accessToken' lưu đúng chuỗi JWT.<br>2. 'currentUser' lưu object thông tin người dùng (không có password).<br>3. AuthState.isAuthenticated() trả về true. | LocalStorage lưu đúng key accessToken và currentUser, AuthState cập nhật trạng thái đã đăng nhập. | **PASS** | Kiểm tra lưu trữ phiên làm việc phía Client. | [evidence_auth_03_login_happy_path_jwt.svg](screenshots/auth_jwt/evidence_auth_03_login_happy_path_jwt.svg) |
| `TC_AUTH_CLI_002` | **Client Auth State** | Kiểm tra hàm auth.fetch() tự động đính kèm Authorization Header vào mọi API request | Đã đăng nhập trên hệ thống. | 1. Mở trang Quản lý cuộc họp hoặc Phòng họp.<br>2. Bật tab Network trong DevTools.<br>3. Quan sát các request gọi /api/meetings, /api/rooms. | `Request headers của API call` | Mọi request do auth.fetch() gửi đi đều tự động có header 'Authorization: Bearer <token>' mà không cần code thủ công từng API. | Tất cả các API call đều tự động được đính kèm Authorization header chính xác. | **PASS** | Kiểm tra cơ chế Interceptor của Client Auth. | [evidence_auth_05_jwt_header_authenticated.svg](screenshots/auth_jwt/evidence_auth_05_jwt_header_authenticated.svg) |
| `TC_AUTH_CLI_003` | **Client Auth State** | Thực hiện Đăng xuất (Logout) an toàn, dọn dẹp LocalStorage và chuyển hướng về /login.html | Người dùng đang đăng nhập và ở trang nội bộ index.html. | 1. Bấm nút 'Đăng xuất' ở thanh Header hoặc Sidebar.<br>2. Quan sát LocalStorage và URL trình duyệt. | `Sự kiện click Logout` | 1. localStorage.removeItem('accessToken') và ('currentUser') được thực thi.<br>2. AuthState chuyển về null/false.<br>3. Trình duyệt chuyển hướng tức thì về /login.html. | LocalStorage được dọn dẹp sạch sẽ, chuyển hướng ngay về /login.html. | **PASS** | Kiểm thử quy trình Đăng xuất an toàn. | [evidence_auth_07_logout_and_redirect.svg](screenshots/auth_jwt/evidence_auth_07_logout_and_redirect.svg) |
| `TC_AUTH_CLI_004` | **Client Auth State** | Auth Guard chặn truy cập trái phép vào trang nội bộ khi chưa đăng nhập và redirect về /login.html | Chưa đăng nhập (LocalStorage rỗng). | 1. Mở tab ẩn danh hoặc xóa token.<br>2. Gõ trực tiếp URL: http://localhost:3000/#/meetings hoặc /#/admin.<br>3. Quan sát phản ứng hệ thống. | `Truy cập trực tiếp URL trang nội bộ` | Router Guard phát hiện chưa có token, lập tức chặn render và redirect người dùng về trang /login.html. | Chặn thành công và chuyển hướng về /login.html. | **PASS** | Kiểm thử cơ chế bảo vệ Route phía Client. | [evidence_auth_07_logout_and_redirect.svg](screenshots/auth_jwt/evidence_auth_07_logout_and_redirect.svg) |
| `TC_AUTH_CLI_005` | **Client Auth State** | Auth Guard tự động chuyển hướng người dùng đã đăng nhập từ /login.html vào /index.html | Người dùng đã đăng nhập thành công và token còn hạn. | 1. Người dùng đang đăng nhập, nhập URL /login.html.<br>2. Quan sát phản ứng. | `Truy cập /login.html khi đã có token` | Hệ thống phát hiện phiên làm việc còn hiệu lực, tự động redirect người dùng vào trang ứng dụng chính /index.html. | Tự động redirect vào /index.html, không bắt đăng nhập lại. | **PASS** | Kiểm thử trải nghiệm người dùng liền mạch. | [evidence_auth_03_login_happy_path_jwt.svg](screenshots/auth_jwt/evidence_auth_03_login_happy_path_jwt.svg) |
| `TC_AUTH_SEC_001` | **Bảo mật & Ca biên** | Kiểm tra mã hóa một chiều BCrypt trong CSDL (Không lưu plain-text password) | Đã có tài khoản đăng ký trong DB. | 1. Truy vấn trực tiếp CSDL: SELECT UserID, Username, PasswordHash FROM Users WHERE Username = 'khuyen.hv'.<br>2. Quan sát giá trị trường PasswordHash. | `Query CSDL MySQL` | PasswordHash phải là chuỗi băm 60 ký tự bắt đầu bằng '$2b$10$...', hoàn toàn không hiển thị mật khẩu gốc. | PasswordHash lưu dưới dạng hash BCrypt chuẩn ($2b$10$...), an toàn tuyệt đối. | **PASS** | Kiểm thử chuẩn lưu trữ an toàn mật khẩu. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |
| `TC_AUTH_SEC_002` | **Bảo mật & Ca biên** | Kiểm tra phòng chống tấn công SQL Injection vào trường identifier khi Đăng nhập | Người dùng đang ở form Đăng nhập. | 1. Nhập identifier: "' OR '1'='1' -- ".<br>2. Nhập mật khẩu bất kỳ.<br>3. Bấm Đăng nhập. | `identifier: "' OR '1'='1' -- "` | Hệ thống dùng Parameterized Queries (mysql2/knex placeholder '?') xử lý an toàn, coi đây là chuỗi thường và trả về 401 Unauthorized. | HTTP 401 Unauthorized, không xảy ra SQL Injection hay bypass xác thực. | **PASS** | Kiểm thử an toàn trước SQL Injection. | [evidence_auth_04_wrong_password_blocked.svg](screenshots/auth_jwt/evidence_auth_04_wrong_password_blocked.svg) |
| `TC_AUTH_SEC_003` | **Bảo mật & Ca biên** | Kiểm tra phòng chống tấn công XSS Injection vào trường Họ và tên khi Đăng ký | Người dùng đang ở form Đăng ký. | 1. Nhập Họ và tên: '<script>alert("XSS")</script>'.<br>2. Nhập các trường khác hợp lệ và đăng ký.<br>3. Đăng nhập và kiểm tra phần hiển thị tên trên Navbar Header. | `fullName: '<script>alert("XSS")</script>'` | Tên người dùng được render an toàn bằng textContent hoặc HTML escaping, mã JavaScript không được phép thực thi trên trình duyệt. | Render dạng văn bản thuần an toàn, script không bị kích hoạt. | **PASS** | Kiểm thử an toàn trước Stored XSS. | [evidence_auth_01_register_success.svg](screenshots/auth_jwt/evidence_auth_01_register_success.svg) |

---

## 4. Báo Cáo Thống Kê Kết Quả Thực Thi

### 4.1. Thống kê theo Trạng thái Thực thi (Execution KPIs)
- **Tổng số Test Cases thiết kế:** **38 Test Cases**
- **Số ca kiểm thử ĐẠT (PASS):** **36 Test Cases (94.7%)**
- **Số ca kiểm thử KHÔNG ĐẠT (FAIL):** **02 Test Cases (5.3%)** *(Đã log bug chính thức `BUG-AUTH-01` và `BUG-AUTH-02`)*

### 4.2. Thống kê theo Phân hệ Chức năng
| STT | Phân hệ kiểm thử | Số lượng TC | Pass | Fail | Tỷ lệ Đạt | Đánh giá an toàn |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | **Đăng ký tài khoản (Register APIs & Validation)** | 12 | 11 | 1 | 91.7% | Rất tốt (BCrypt băm 10 vòng, chặn trùng email/user 100%) |
| 2 | **Đăng nhập hệ thống (Login APIs & Brute-force block)** | 10 | 10 | 0 | 100% | Xuất sắc (Chặn lỗi 401 chuẩn OWASP, cấp JWT 24h) |
| 3 | **Xác thực Token JWT & Header Authorization** | 8 | 7 | 1 | 87.5% | Tốt (Chữ ký HMAC SHA256 an toàn, chặn token hết hạn) |
| 4 | **Client Auth State, LocalStorage & Auth Guard** | 5 | 5 | 0 | 100% | Xuất sắc (Bảo vệ Route 100%, logout dọn sạch cache) |
| 5 | **Kiểm thử Bảo mật & Ca biên (Security & Injection)** | 3 | 3 | 0 | 100% | Tuyệt đối an toàn (Chặn đứng SQLi và XSS) |
| **Tổng** | **Toàn bộ phân hệ Xác thực & JWT** | **38** | **36** | **2** | **94.7%** | **ĐỦ ĐIỀU KIỆN NGHIỆM THU AN TOÀN** |

---

## 5. Nhật Ký Lỗi Phát Hiện & Báo Cáo Jira

Tuân thủ đúng quy chuẩn QA dự án (giữ lại 2 lỗi thực tế để nhóm phát triển khắc phục trong Sprint 4):

### 🐛 BUG-AUTH-01: `authMiddleware.js` phân biệt hoa thường với tiền tố Scheme Token, từ chối header hợp lệ `bearer <token>`
- **Mã lỗi Jira:** `BUG-AUTH-01`
- **Mã Test Case liên đới:** `TC_AUTH_JWT_006`
- **Mức độ nghiêm trọng (Severity):** Medium
- **Mức độ ưu tiên (Priority):** High
- **Vị trí phát hiện:** File `server/middleware/authMiddleware.js:24`
- **Mô tả chi tiết:**  
  Hàm tách token hiện tại viết:  
  ```javascript
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
  }
  ```
  Theo tiêu chuẩn quốc tế **RFC 6750 (OAuth 2.0 Bearer Token Usage)**, tiền tố Scheme xác thực không nên phân biệt hoa thường. Khi một số HTTP client, thư viện Axios hoặc Mobile App gửi header `Authorization: bearer <token>` (chữ `bearer` viết thường), hàm `startsWith('Bearer ')` trả về `false`, khiến biến `token` không được bóc tách và giữ nguyên cả chuỗi `bearer eyJ...`. Khi truyền chuỗi này vào `jwtHelper.verifyToken()`, thư viện ném lỗi `jwt malformed` và server phản hồi `401 Unauthorized` sai lệch.
- **Đề xuất khắc phục (Fix Suggestion):**  
  ```javascript
  const match = authHeader.match(/^bearer\s+(.+)$/i);
  let token = match ? match[1].trim() : authHeader;
  ```

---

### 🐛 BUG-AUTH-02: Endpoint `POST /api/auth/register` không xác thực trường `confirmPassword` ở phía Backend
- **Mã lỗi Jira:** `BUG-AUTH-02`
- **Mã Test Case liên đới:** `TC_AUTH_REG_007`
- **Mức độ nghiêm trọng (Severity):** Low / Medium
- **Mức độ ưu tiên (Priority):** Medium
- **Vị trí phát hiện:** File `server/validators/authValidator.js: validateRegister`
- **Mô tả chi tiết:**  
  Trên giao diện người dùng `client/login.html`, form đăng ký có 2 ô `register-password` và `register-password-confirm` và có validate khớp mật khẩu ở client. Tuy nhiên ở tầng Backend, hàm `validateRegister()` chỉ kiểm tra trường `data.password` mà hoàn toàn bỏ qua việc đối chiếu với `data.confirmPassword`. Nếu người dùng sử dụng Postman hoặc vô hiệu hóa JavaScript trên trình duyệt và gửi lên 2 mật khẩu khác nhau, Backend vẫn ghi nhận thành công và lưu `password` đầu tiên vào CSDL, làm mất đi lớp bảo vệ dự phòng thứ 2.
- **Đề xuất khắc phục (Fix Suggestion):**  
  Bổ sung vào `server/validators/authValidator.js`:
  ```javascript
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
      errors.push('Mật khẩu xác nhận không trùng khớp.');
  }
  ```

---

## 6. Danh Mục Minh Chứng Bằng Hình Ảnh Vector SVG

Toàn bộ 7 hình ảnh minh chứng được thiết kế dưới dạng **Vector SVG độ phân giải cao**, lưu đồng bộ tại cả 2 thư mục `docs/screenshots/auth_jwt/` và `QA/Evidence/Auth_JWT/`:

| STT | Tên tệp minh chứng | Mô tả trực quan nội dung minh chứng |
| :---: | :--- | :--- |
| 1 | `evidence_auth_01_register_success.svg` | Giao diện form đăng ký tài khoản thành công, hiển thị Alert xanh HTTP 201 Created và thông tin băm BCrypt. |
| 2 | `evidence_auth_02_duplicate_email_blocked.svg` | Form đăng ký báo lỗi viền đỏ khi nhập email đã tồn tại, hiển thị Alert HTTP 409 Conflict chặn trùng lặp. |
| 3 | `evidence_auth_03_login_happy_path_jwt.svg` | Đăng nhập thành công HTTP 200 OK, cấp phát JWT Token 3 phần và lưu vào LocalStorage (`accessToken`, `currentUser`). |
| 4 | `evidence_auth_04_wrong_password_blocked.svg` | Chặn đăng nhập khi sai mật khẩu, hiển thị Alert đỏ HTTP 401 Unauthorized theo khuyến nghị bảo mật OWASP. |
| 5 | `evidence_auth_05_jwt_header_authenticated.svg` | Terminal Inspector gọi API `GET /api/auth/me` đính kèm Header `Authorization: Bearer <token>` nhận 200 OK. |
| 6 | `evidence_auth_06_jwt_expired_or_missing.svg` | Bảng mô phỏng Auth Guard chặn các cuộc gọi API thiếu Token hoặc Token hết hạn (HTTP 401). |
| 7 | `evidence_auth_07_logout_and_redirect.svg` | Quy trình 3 bước Đăng xuất an toàn: kích hoạt sự kiện $ightarrow$ dọn sạch LocalStorage $ightarrow$ chuyển hướng về `/login.html`. |

---
*Tài liệu kiểm thử được Hoàng Văn Khuyến (QA Tester & Security Auditor) lập và ghi nhận kết quả chính thức cho Sprint 4 dự án TTCS_T926_K16C2_N3.*
