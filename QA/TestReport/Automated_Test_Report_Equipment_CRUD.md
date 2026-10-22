# 📊 BÁO CÁO KIỂM THỬ TỰ ĐỘNG HÓA: TRỌN BỘ CRUD API THIẾT BỊ

> **Dự án:** Quản lý Lịch họp Doanh nghiệp (`TTCS_T926_K16C2_N3`)  
> **Thời gian thực thi:** 21:05:06 11/10/2026  
> **Môi trường:** Docker Container `meeting_backend` (Port 3000) & MySQL 8.0 (Port 3306)  
> **Tổng số Test Cases:** 19  
> **Kết quả:** **19/19 ĐẠT** (Tỷ lệ: **100.0%**)  

## 1. Bảng Tổng Hợp Chi Tiết Test Cases CRUD

| Test Case ID | Phương thức | Endpoint | Tiêu đề kịch bản | Expected | Actual | Kết quả |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: |
| `CRUD_GET_001` | `GET` | `/api/equipments` | Lấy toàn bộ danh sách thiết bị | `200` | `200` | ✅ **PASS** |
| `CRUD_GET_002` | `GET` | `/api/equipments?status=Available&search=Sony` | Lọc thiết bị theo status và từ khóa tìm kiếm | `200` | `200` | ✅ **PASS** |
| `CRUD_GET_003` | `GET` | `/api/equipments/1` | Lấy thông tin chi tiết một thiết bị theo ID | `200` | `200` | ✅ **PASS** |
| `CRUD_GET_004` | `GET` | `/api/equipments/999999` | Xử lý lỗi khi ID thiết bị không tồn tại | `404` | `404` | ✅ **PASS** |
| `CRUD_GET_005` | `GET` | `/api/equipments/invalid-id` | Từ chối ID thiết bị không phải số nguyên dương | `400` | `400` | ✅ **PASS** |
| `CRUD_POST_001` | `POST` | `/api/equipments` | Tạo mới thiết bị thành công với dữ liệu hợp lệ | `201` | `201` | ✅ **PASS** |
| `CRUD_POST_002` | `POST` | `/api/equipments` | Từ chối khi thiếu tên thiết bị (equipmentName) | `400` | `400` | ✅ **PASS** |
| `CRUD_POST_003` | `POST` | `/api/equipments` | Từ chối khi trạng thái (status) không thuộc danh mục hợp lệ | `400` | `400` | ✅ **PASS** |
| `CRUD_POST_004` | `POST` | `/api/equipments` | Ngăn chặn ký tự nguy hiểm (<, >) trong tên thiết bị | `400` | `400` | ✅ **PASS** |
| `CRUD_PUT_001` | `PUT` | `/api/equipments/14` | Cập nhật toàn diện thông tin thiết bị thành công | `200` | `200` | ✅ **PASS** |
| `CRUD_PUT_002` | `PUT` | `/api/equipments/999999` | Báo lỗi 404 khi cập nhật thiết bị không tồn tại | `404` | `404` | ✅ **PASS** |
| `CRUD_PATCH_001` | `PATCH` | `/api/equipments/14/status` | Chuyển nhanh trạng thái thiết bị sang Maintenance (Bảo trì) | `200` | `200` | ✅ **PASS** |
| `CRUD_PATCH_002` | `PATCH` | `/api/equipments/14/status` | Chuyển nhanh trạng thái thiết bị sang Broken (Hư hỏng) | `200` | `200` | ✅ **PASS** |
| `CRUD_PATCH_003` | `PATCH` | `/api/equipments/14/status` | Chuyển trạng thái trở lại Available (Có sẵn) | `200` | `200` | ✅ **PASS** |
| `CRUD_PATCH_004` | `PATCH` | `/api/equipments/14/status` | Từ chối cập nhật trạng thái không hợp lệ | `400` | `400` | ✅ **PASS** |
| `CRUD_DEL_001` | `DELETE` | `/api/equipments/1` | Chặn xóa thiết bị đang được gán cho cuộc họp Confirmed (409 Conflict) | `409` | `409` | ✅ **PASS** |
| `CRUD_DEL_002` | `DELETE` | `/api/equipments/14` | Xóa thành công thiết bị không có ràng buộc lịch họp | `200` | `200` | ✅ **PASS** |
| `CRUD_DEL_003` | `GET` | `/api/equipments/14` | Xác minh thiết bị đã xóa không còn tồn tại trong hệ thống (404) | `404` | `404` | ✅ **PASS** |
| `CRUD_DEL_004` | `DELETE` | `/api/equipments/14` | Báo lỗi 404 khi xóa thiết bị không tồn tại | `404` | `404` | ✅ **PASS** |

## 2. Kết Luận & Đánh Giá Chất Lượng

- Trọn bộ API CRUD danh mục thiết bị đã được xây dựng hoàn chỉnh (`GET`, `POST`, `PUT`, `DELETE`, `PATCH status`).
- Ràng buộc toàn vẹn CSDL được bảo vệ 100%: Thiết bị đang có lịch họp `Confirmed` không thể bị xóa (`409 Conflict`).
- Kiểm soát dữ liệu đầu vào nghiêm ngặt: Chặn các chuỗi độc hại, validate danh mục trạng thái (`Available`, `Maintenance`, `Broken`).
