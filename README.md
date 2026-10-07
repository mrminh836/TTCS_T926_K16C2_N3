# Meeting Room Booking API

Hệ thống API quản lý đặt phòng họp, thiết bị, và người tham gia.

## Yêu cầu

- **Node.js** >= 18.x ([Tải tại đây](https://nodejs.org/))
- **MySQL** >= 8.0 ([Tải tại đây](https://dev.mysql.com/downloads/installer/))

## Cài đặt

### 1. Cài Node.js
Tải và cài Node.js LTS từ [nodejs.org](https://nodejs.org/).  
Sau khi cài, mở terminal mới và kiểm tra:
```bash
node --version
npm --version
```

### 2. Tạo database MySQL
```sql
CREATE DATABASE meeting_booking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Cấu hình .env
Sửa file `.env` ở thư mục gốc:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=meeting_booking_db
```

### 4. Cài dependencies
```bash
npm install
```

### 5. Chạy migration (tạo bảng)
```bash
npm run migrate
```

### 6. Chạy seed (dữ liệu mẫu - tùy chọn)
```bash
npm run seed
```

### 7. Khởi động server
```bash
# Development (auto-reload khi thay đổi code)
npm run dev

# Production
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## API Endpoints

### Users
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/users?search=&departmentId=&limit=` | Tìm kiếm nhân viên |

### Meetings & Participants
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/meetings/:id/participants` | Xem người tham gia & trạng thái |
| POST | `/api/meetings/:id/participants` | Thêm người tham gia |
| PATCH | `/api/meetings/:id/participants/:userId/status` | Cập nhật trạng thái phản hồi |
| DELETE | `/api/meetings/:id/participants/:userId` | Xóa người tham gia |

### Equipments (CRUD)
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/equipments?search=&status=&page=&limit=` | Danh sách thiết bị |
| GET | `/api/equipments/available?date=&startTime=&endTime=` | Thiết bị khả dụng |
| GET | `/api/equipments/:id` | Chi tiết thiết bị |
| POST | `/api/equipments` | Thêm mới |
| PUT | `/api/equipments/:id` | Cập nhật toàn bộ |
| PATCH | `/api/equipments/:id/status` | Cập nhật trạng thái |
| DELETE | `/api/equipments/:id` | Xóa thiết bị |

### Bookings
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/bookings?roomId=&date=&status=` | Danh sách đặt phòng |
| GET | `/api/bookings/:id` | Chi tiết (kèm thiết bị) |
| POST | `/api/bookings` | Tạo mới (kèm thiết bị mượn) |
| PATCH | `/api/bookings/:id/cancel` | Hủy đặt phòng |

## Ví dụ Request

### Tìm kiếm users
```bash
curl "http://localhost:3000/api/users?search=Nguyen&departmentId=1"
```

### Tạo booking kèm thiết bị
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Họp team Backend",
    "roomId": 1,
    "startTime": "2026-10-12 09:00:00",
    "endTime": "2026-10-12 10:30:00",
    "userId": 1,
    "equipments": [
      { "equipmentId": 1, "quantity": 1 },
      { "equipmentId": 2, "quantity": 2 }
    ]
  }'
```

### Thêm người tham gia cuộc họp
```bash
curl -X POST http://localhost:3000/api/meetings/1/participants \
  -H "Content-Type: application/json" \
  -d '{ "userIds": [1, 2, 3] }'
```

### Lọc thiết bị khả dụng
```bash
curl "http://localhost:3000/api/equipments/available?date=2026-10-10&startTime=09:00&endTime=11:00"
```
