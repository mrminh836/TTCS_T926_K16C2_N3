

## 🌟 Tầm Nhìn Sản Phẩm (Product Vision)

> **"Trở thành giải pháp quản lý lịch họp số 1 cho doanh nghiệp, mang lại hiệu suất làm việc cao hơn thông qua việc tổ chức họp thông minh, tiết kiệm thời gian và tối ưu tài nguyên."**

Nền tảng giúp doanh nghiệp tối ưu hóa việc phân bổ phòng họp, trang thiết bị và thời gian, đảm bảo các cuộc họp được tổ chức hiệu quả, đúng lúc và đúng chỗ.

### Giá trị cốt lõi hướng tới:
* **Loại bỏ hoàn toàn xung đột:** Chấm dứt tình trạng đặt trùng phòng hoặc chồng chéo lịch trình.
* **Minh bạch tài nguyên:** Quản lý rõ ràng trạng thái phòng họp, máy chiếu, thiết bị hội nghị theo thời gian thực.
* **Tích hợp liền mạch:** Đồng bộ dữ liệu 2 chiều với Google Calendar, Microsoft Outlook và hệ sinh thái ERP/HRM.
* **Trải nghiệm tối ưu:** Đơn giản hóa các thao tác đặt phòng, gửi lời mời và phối hợp công việc cho nhân viên.

---

## 🎯 Mục Tiêu Sản Phẩm (Product Goals)

### 1. Tối ưu hóa quy trình đặt lịch
* Đặt, thay đổi hoặc hủy lịch họp chỉ trong vài thao tác đơn giản.
* Thuật toán gợi ý khung giờ họp tối ưu dựa trên thời gian trống của toàn bộ người tham dự.

### 2. Quản lý hiệu quả phòng họp & thiết bị
* Phân bổ phòng họp hợp lý, giảm thiểu tỷ lệ "phòng trống ảo" (đặt nhưng không dùng).
* Cho phép chọn kèm trang thiết bị phục vụ (máy chiếu, micro, bảng vẽ, camera họp trực tuyến).

### 3. Nâng cao trải nghiệm người dùng
* **Hỗ trợ đa nền tảng:** Giao diện Responsive tối ưu trên cả Web và Ứng dụng Di động (Mobile App).
* **Đồng bộ tự động:** Kết nối trực tiếp với lịch cá nhân (Google Calendar, Microsoft Outlook).
* **Thông báo thông minh:** Tự động gửi lời nhắc trước giờ họp qua Email/Push Notification để tránh lỡ họp.

### 4. Báo cáo và phân tích thông minh (Analytics)
* Báo cáo tần suất sử dụng chi tiết theo từng phòng họp và thiết bị.
* Đo lường tỷ lệ trễ hẹn, hủy họp hoặc phòng đặt nhưng không check-in, cung cấp dữ liệu hỗ trợ cải thiện văn hóa họp của tổ chức.

### 5. Hiện đại hóa và mở rộng tích hợp
* **Chatbot trợ lý ảo:** Đặt lịch hoặc tra cứu phòng trống tức thì qua tin nhắn.
* **Check-in/Check-out bằng mã QR:** Xác thực sự hiện diện thực tế tại cửa phòng họp.
* **Kết nối ERP/HRM:** Đồng bộ sơ đồ tổ chức, danh sách nhân sự và quyền hạn tự động.

---

## 🚀 Các Tính Năng Nổi Bật (Key Features)

| Phân hệ | Mô tả tính năng |
| :--- | :--- |
| **Booking Hub** | Tìm kiếm phòng theo sức chứa, thiết bị và đặt phòng tức thời. |
| **Smart Scheduler** | Tự động quét lịch biểu để tìm ra khoảng trống phù hợp cho nhóm. |
| **QR Check-in** | Tự động hủy phòng và giải phóng tài nguyên nếu sau 10-15 phút không quét QR. |
| **Third-party Sync** | Đồng bộ liên tục với Google Workspace và Microsoft 365. |
| **Admin Dashboard** | Thống kê hiệu suất, quản lý danh mục phòng và lịch bảo trì thiết bị. |


---

## 🐳 Hướng Dẫn Chạy Dự Án Với Docker Compose

### Yêu cầu hệ thống
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (bao gồm Docker Engine & Docker Compose)

### Khởi động nhanh

```bash
# 1. Clone dự án
git clone <repository-url>
cd TTCS_T926_K16C2_N3

# 2. Tạo file .env từ mẫu
cp .env.example .env
# Sửa DB_PASSWORD trong .env nếu cần (mặc định: root123)

# 3. Khởi động toàn bộ hệ thống (Backend + MySQL)
docker compose up --build
```

> **Lần chạy đầu tiên**, MySQL sẽ tự động tạo database `meeting_management` và import đầy đủ **7 bảng** từ file `init_database.sql`.

### Kiểm tra hệ thống

Sau khi khởi động thành công, truy cập endpoint healthcheck:

```bash
curl http://localhost:3000/api/health
```

Kết quả mong đợi:

```json
{
  "status": "ok",
  "database": "connected"
}
```

### Các lệnh Docker hữu ích

```bash
# Chạy ở chế độ nền (detached)
docker compose up --build -d

# Xem log
docker compose logs -f backend
docker compose logs -f mysql_db

# Dừng & xóa container (GIỮ dữ liệu MySQL)
docker compose down

# Dừng & xóa container + XÓA dữ liệu MySQL
docker compose down -v

# Khởi động lại
docker compose up
```

### Hot-reload khi phát triển

Khi chạy bằng Docker Compose, thư mục mã nguồn được **bind mount** vào container. Mọi thay đổi code trên máy host sẽ tự động được phản ánh và server sẽ **restart ngay lập tức** nhờ `node --watch`.

### Cấu hình biến môi trường

| Biến | Giá trị Docker | Giá trị Local | Mô tả |
| :--- | :--- | :--- | :--- |
| `DB_HOST` | `mysql_db` | `127.0.0.1` | Hostname của MySQL |
| `DB_PORT` | `3306` | `3306` | Port MySQL |
| `DB_USER` | `root` | `root` | Tài khoản MySQL |
| `DB_PASSWORD` | `root123` | *(tuỳ chỉnh)* | Mật khẩu MySQL |
| `DB_NAME` | `meeting_management` | `meeting_management` | Tên database |
| `PORT` | `3000` | `3000` | Port Backend API |

---

## 🛠️ Chạy Local (Không Docker)

```bash
# 1. Cài đặt dependencies
npm install

# 2. Sửa .env: đổi DB_HOST=127.0.0.1 (đảm bảo MySQL đang chạy local)

# 3. Import database
mysql -u root -p meeting_management < init_database.sql

# 4. Chạy server (hot-reload)
npm run dev
```
