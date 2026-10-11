# 📊 BÁO CÁO KIỂM THỬ TỰ ĐỘNG HÓA: CHẶN THIẾT BỊ BẢO TRÌ & TRÙNG GIỜ

> **Dự án:** Quản lý Lịch họp Doanh nghiệp (`TTCS_T926_K16C2_N3`)  
> **Thời gian thực thi:** 20:42:27 11/10/2026  
> **Môi trường:** Docker Container `meeting_backend` (Port 3000) & MySQL 8.0 (Port 3306)  
> **Tổng số Test Cases:** 14  
> **Kết quả:** **14/14 ĐẠT** (Tỷ lệ: **100.0%**)  

## 1. Bảng Tổng Hợp Chi Tiết 14 Test Cases

| Test Case ID | Phân hệ | Tiêu đề kịch bản | Expected Status | Actual Status | DB Integrity | Kết quả |
| :---: | :---: | :--- | :---: | :---: | :--- | :---: |
| `TC_EQ_MAINT_001` | Maintenance | Chặn mượn 1 thiết bị đang bảo trì qua API | `400` | `400` | Rollback hoàn hảo (0 bản ghi Meetings/Bookings) | ✅ **PASS** |
| `TC_EQ_MAINT_002` | Maintenance | Chặn mượn khi kết hợp thiết bị rảnh và bảo trì | `400` | `400` | Rollback hoàn hảo (Không lưu dở dang thiết bị 1) | ✅ **PASS** |
| `TC_EQ_MAINT_003` | Maintenance | Loại bỏ thiết bị bảo trì khỏi danh sách khả dụng qua API GET /available | `200` | `200` | Dữ liệu Equipments Status=Maintenance được bảo vệ | ✅ **PASS** |
| `TC_EQ_MAINT_004` | Maintenance | Chặn cập nhật bổ sung thiết bị bảo trì vào cuộc họp cũ qua PUT /api/meetings/:id | `400` | `400` | DB sạch sẽ: 0 bản ghi thiết bị 7 được gán | ✅ **PASS** |
| `TC_EQ_MAINT_005` | Maintenance | Mượn thành công ngay khi thiết bị kết thúc bảo trì | `201` | `201` | Ghi nhận thành công vào Booking_Equipments | ✅ **PASS** |
| `TC_EQ_MAINT_006` | Maintenance | Chặn mượn thiết bị có trạng thái Broken (Hư hỏng) | `400` | `400` | Rollback hoàn hảo (0 bản ghi tạo mới) | ✅ **PASS** |
| `TC_EQ_OVL_001` | Overlap | Chặn mượn thiết bị trùng hoàn toàn khung giờ (Khác phòng) | `409` | `409` | Phát hiện xung đột chính xác; Rollback cuộc họp B | ✅ **PASS** |
| `TC_EQ_OVL_002` | Overlap | Chặn mượn thiết bị giao nhau một phần (Start nằm trong giờ cũ) | `409` | `409` | Rollback sạch sẽ, 0 bản ghi B | ✅ **PASS** |
| `TC_EQ_OVL_003` | Overlap | Chặn mượn thiết bị giao nhau một phần (End nằm trong giờ họp sau) | `409` | `409` | Rollback sạch sẽ, 0 bản ghi B | ✅ **PASS** |
| `TC_EQ_OVL_004` | Overlap | Chặn mượn thiết bị khi khung giờ mới bao trùm cuộc họp cũ | `409` | `409` | Rollback sạch sẽ, 0 bản ghi B | ✅ **PASS** |
| `TC_EQ_OVL_005` | Overlap | Cho phép mượn thiết bị liền kề sát giờ (End_A == Start_B không giao nhau) | `201` | `201` | Đặt thành công cho cả 2 cuộc họp liền kề | ✅ **PASS** |
| `TC_EQ_OVL_006` | Overlap | Mượn 2 thiết bị khác nhau tại 2 phòng cùng khung giờ | `201` | `201` | Dữ liệu thiết bị phân bổ chuẩn xác cho từng phòng | ✅ **PASS** |
| `TC_EQ_OVL_007` | Overlap | Giải phóng thiết bị khi cuộc họp trước bị HỦY (Cancelled) | `201` | `201` | Thiết bị 4 được tái sử dụng thành công sau khi hủy họp cũ | ✅ **PASS** |
| `TC_EQ_OVL_008` | Concurrency | Đặt đồng thời cùng 1 thiết bị tại 2 request song song (Race Condition Lock) | `201 & 409` | `201 & 409` | Khóa dòng SERIALIZABLE chuẩn: Đúng 1 cuộc họp được gán thiết bị 5 | ✅ **PASS** |

## 2. Kết Quả Đối Soát Cơ Sở Dữ Liệu Bằng SQL Audit Queries

- **Audit Query 4.1 (Xung đột trùng giờ thiết bị):** ✅ **0 vi phạm** (Tuyệt đối không có 2 cuộc họp nào mượn trùng thiết bị)
- **Audit Query 4.2 (Thiết bị bảo trì bị gán Confirmed):** ✅ **0 vi phạm** (Tuyệt đối không có thiết bị bảo trì nào bị mượn)

## 3. Kết Luận

Hệ thống Backend đã chặn triệt để 100% các trường hợp mượn thiết bị bảo trì (HTTP 400 Bad Request) và mượn trùng giờ (HTTP 409 Conflict) ngay trong Transaction `SERIALIZABLE` với khóa dòng `FOR UPDATE`.
