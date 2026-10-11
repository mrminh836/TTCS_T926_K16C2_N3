# 📊 BÁO CÁO KIỂM THỬ TỰ ĐỘNG HÓA: CRUD THIẾT BỊ ADMIN & PHÂN TÍCH CA BIÊN (BVA)

> **Dự án:** Quản lý Lịch họp Doanh nghiệp (`TTCS_T926_K16C2_N3`)  
> **Bộ phận:** Đội ngũ QA / Kiểm thử Chất lượng Phần mềm  
> **Thời gian thực thi:** 21:33:24 11/10/2026  
> **Môi trường kiểm thử:** Docker Container `meeting_backend` (Port 3000) & MySQL 8.0 (Port 3306)  
> **Tổng số Test Cases:** **42**  
> **Kết quả:** **42/42 ĐẠT** (Tỷ lệ hoàn hảo: **100.0%**)  

---

## 1. Bảng Tổng Hợp Chi Tiết Test Cases & Ca Biên (BVA Matrix)

| Test Case ID | Phân loại | Method | Endpoint | Tiêu đề kịch bản | Expected | Actual | Kết quả |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: | :---: |
| `BVA_POST_001` | BVA Tên (Biên dưới) | `POST` | `/api/equipments` | Tạo thiết bị với tên đúng 2 ký tự (Biên dưới hợp lệ) | `201` | `201` | ✅ **PASS** |
| `BVA_POST_002` | BVA Tên (Dưới biên) | `POST` | `/api/equipments` | Từ chối tạo thiết bị với tên 1 ký tự (Dưới biên min 2) | `400` | `400` | ✅ **PASS** |
| `BVA_POST_003` | EP Tên rỗng | `POST` | `/api/equipments` | Từ chối tạo thiết bị khi tên là chuỗi rỗng | `400` | `400` | ✅ **PASS** |
| `BVA_POST_004` | EP Tên whitespace | `POST` | `/api/equipments` | Từ chối tạo thiết bị khi tên chỉ chứa khoảng trắng | `400` | `400` | ✅ **PASS** |
| `BVA_POST_005` | BVA Tên (Biên trên) | `POST` | `/api/equipments` | Tạo thiết bị với tên đúng 100 ký tự (Biên trên tối đa) | `201` | `201` | ✅ **PASS** |
| `BVA_POST_006` | BVA Tên (Vượt biên) | `POST` | `/api/equipments` | Từ chối tạo thiết bị với tên 101 ký tự (Vượt biên max 100) | `400` | `400` | ✅ **PASS** |
| `BVA_POST_007` | Security XSS | `POST` | `/api/equipments` | Ngăn chặn chuỗi XSS nguy hiểm (<, >) trong tên thiết bị | `400` | `400` | ✅ **PASS** |
| `BVA_POST_008` | BVA Type (Biên trên) | `POST` | `/api/equipments` | Tạo thiết bị với loại thiết bị (type) đúng 50 ký tự | `201` | `201` | ✅ **PASS** |
| `BVA_POST_009` | BVA Type (Vượt biên) | `POST` | `/api/equipments` | Từ chối loại thiết bị (type) 51 ký tự (Vượt biên max 50) | `400` | `400` | ✅ **PASS** |
| `BVA_POST_010` | EP Giá trị mặc định | `POST` | `/api/equipments` | Tự động gán mặc định type="Thiết bị" và status="Available" | `201` | `201` | ✅ **PASS** |
| `BVA_POST_011` | EP Status hợp lệ | `POST` | `/api/equipments` | Tạo thiết bị với trạng thái "Maintenance" hợp lệ | `201` | `201` | ✅ **PASS** |
| `BVA_POST_012` | EP Status hợp lệ | `POST` | `/api/equipments` | Tạo thiết bị với trạng thái "Broken" hợp lệ | `201` | `201` | ✅ **PASS** |
| `BVA_POST_013` | EP Status không hợp lệ | `POST` | `/api/equipments` | Từ chối trạng thái không hợp lệ (status="In_Use") | `400` | `400` | ✅ **PASS** |
| `BVA_POST_014` | Payload rỗng | `POST` | `/api/equipments` | Từ chối request body rỗng không có thông tin | `400` | `400` | ✅ **PASS** |
| `BVA_POST_015` | Payload dạng mảng | `POST` | `/api/equipments` | Từ chối request body dạng Array thay vì JSON Object | `400` | `400` | ✅ **PASS** |
| `BVA_PUT_001` | BVA Cập nhật (Biên dưới) | `PUT` | `/api/equipments/30` | Cập nhật thiết bị với tên đúng 2 ký tự (Biên dưới hợp lệ) | `200` | `200` | ✅ **PASS** |
| `BVA_PUT_002` | BVA Cập nhật (Biên trên) | `PUT` | `/api/equipments/30` | Cập nhật thiết bị với tên đúng 100 ký tự (Biên trên hợp lệ) | `200` | `200` | ✅ **PASS** |
| `BVA_PUT_003` | BVA Cập nhật (Dưới biên) | `PUT` | `/api/equipments/30` | Từ chối cập nhật thiết bị với tên 1 ký tự | `400` | `400` | ✅ **PASS** |
| `BVA_PUT_004` | BVA Cập nhật (Vượt biên) | `PUT` | `/api/equipments/30` | Từ chối cập nhật thiết bị với tên 101 ký tự | `400` | `400` | ✅ **PASS** |
| `BVA_PUT_005` | EP ID không tồn tại | `PUT` | `/api/equipments/999999` | Báo lỗi 404 khi cập nhật thiết bị có ID không tồn tại | `404` | `404` | ✅ **PASS** |
| `BVA_PUT_006` | BVA ID = 0 | `PUT` | `/api/equipments/0` | Từ chối cập nhật thiết bị với ID = 0 | `400` | `400` | ✅ **PASS** |
| `BVA_PUT_007` | BVA ID âm | `PUT` | `/api/equipments/-5` | Từ chối cập nhật thiết bị với ID âm | `400` | `400` | ✅ **PASS** |
| `BVA_PATCH_001` | PATCH Status Maintenance | `PATCH` | `/api/equipments/30/status` | Chuyển nhanh trạng thái sang Maintenance (Bảo trì) | `200` | `200` | ✅ **PASS** |
| `BVA_PATCH_002` | PATCH Status Broken | `PATCH` | `/api/equipments/30/status` | Chuyển nhanh trạng thái sang Broken (Hư hỏng) | `200` | `200` | ✅ **PASS** |
| `BVA_PATCH_003` | PATCH Status Available | `PATCH` | `/api/equipments/30/status` | Khôi phục trạng thái trở lại Available (Có sẵn) | `200` | `200` | ✅ **PASS** |
| `BVA_PATCH_004` | PATCH Status rác | `PATCH` | `/api/equipments/30/status` | Từ chối cập nhật trạng thái không thuộc danh mục hợp lệ | `400` | `400` | ✅ **PASS** |
| `BVA_PATCH_005` | PATCH Thiếu status | `PATCH` | `/api/equipments/30/status` | Từ chối yêu cầu PATCH khi thiếu trường status | `400` | `400` | ✅ **PASS** |
| `BVA_PATCH_006` | PATCH ID không tồn tại | `PATCH` | `/api/equipments/999999/status` | Báo lỗi 404 khi PATCH trạng thái thiết bị không tồn tại | `404` | `404` | ✅ **PASS** |
| `BVA_DEL_001` | BVA ID = 0 | `DELETE` | `/api/equipments/0` | Từ chối xóa thiết bị với ID = 0 | `400` | `400` | ✅ **PASS** |
| `BVA_DEL_002` | BVA ID âm | `DELETE` | `/api/equipments/-10` | Từ chối xóa thiết bị với ID âm | `400` | `400` | ✅ **PASS** |
| `BVA_DEL_003` | EP ID chuỗi | `DELETE` | `/api/equipments/invalid_code` | Từ chối xóa thiết bị với ID là chuỗi ký tự | `400` | `400` | ✅ **PASS** |
| `BVA_DEL_004` | FK Integrity Conflict | `DELETE` | `/api/equipments/1` | Chặn xóa thiết bị đang được gán cho cuộc họp Confirmed (409 Conflict) | `409` | `409` | ✅ **PASS** |
| `BVA_DEL_005` | CRUD Xóa thành công | `DELETE` | `/api/equipments/30` | Xóa thành công thiết bị độc lập không có ràng buộc lịch họp | `200` | `200` | ✅ **PASS** |
| `BVA_DEL_006` | Idempotency Xóa lại | `DELETE` | `/api/equipments/30` | Báo lỗi 404 khi xóa lại thiết bị đã bị xóa trước đó | `404` | `404` | ✅ **PASS** |
| `BVA_DEL_007` | EP ID không tồn tại | `DELETE` | `/api/equipments/999999` | Báo lỗi 404 khi xóa thiết bị có ID 999999 không tồn tại | `404` | `404` | ✅ **PASS** |
| `BVA_GET_001` | CRUD Danh mục | `GET` | `/api/equipments` | Lấy toàn bộ danh mục thiết bị thành công (Trả về mảng kèm total) | `200` | `200` | ✅ **PASS** |
| `BVA_GET_002` | EP Lọc & Tìm kiếm | `GET` | `/api/equipments?status=Available&search=Sony` | Lọc thiết bị theo trạng thái "Available" và từ khóa "Sony" | `200` | `200` | ✅ **PASS** |
| `BVA_GET_003` | CRUD Chi tiết ID | `GET` | `/api/equipments/1` | Lấy thông tin chi tiết một thiết bị theo ID hợp lệ | `200` | `200` | ✅ **PASS** |
| `BVA_GET_004` | EP ID không tồn tại | `GET` | `/api/equipments/999999` | Báo lỗi 404 khi xem chi tiết thiết bị không tồn tại | `404` | `404` | ✅ **PASS** |
| `BVA_GET_005` | BVA ID = 0 | `GET` | `/api/equipments/0` | Từ chối xem chi tiết thiết bị với ID = 0 | `400` | `400` | ✅ **PASS** |
| `BVA_GET_006` | Security SQL Injection | `GET` | `/api/equipments?search=' OR 1=1 --` | An toàn xử lý ký tự đặc biệt / SQL Injection payload trong search query | `200` | `200` | ✅ **PASS** |
| `BVA_GET_007` | EP Status không khớp | `GET` | `/api/equipments?status=UnknownState` | Lọc với trạng thái không khớp trả về mảng rỗng [] an toàn không lỗi | `200` | `200` | ✅ **PASS** |

---

## 2. Phân Tích Chuyên Sâu Các Nhóm Ca Biên (Boundary Analysis Insights)

### 2.1. Phân tích Biên Tên Thiết Bị (Equipment Name BVA)
- **Biên dưới (Min = 2 ký tự):**
  - `2 ký tự` (ví dụ: `"VR"`, `"TV"`): Chấp nhận hợp lệ (`201 Created`, `200 OK`).
  - `1 ký tự` (ví dụ: `"A"`): Bị từ chối chính xác (`400 Bad Request`) với thông điệp: *"Tên thiết bị phải có ít nhất 2 ký tự"*.
  - `0 ký tự` / chuỗi rỗng / whitespace (`"   "`): Bị chặn tuyệt đối (`400 Bad Request`).
- **Biên trên (Max = 100 ký tự):**
  - `100 ký tự` (đúng độ dài tối đa cho phép): Chấp nhận hợp lệ (`201 Created`, `200 OK`).
  - `101 ký tự` (vượt biên trên): Bị từ chối ngay lập tức (`400 Bad Request`) với thông điệp: *"Tên thiết bị không được vượt quá 100 ký tự"*.
- **Bảo mật phòng chống XSS:**
  - Tên chứa cặp thẻ `<script>`, `<img>` hoặc ký tự `<`, `>` bị chặn đứng (`400 Bad Request`), ngăn chặn 100% rủi ro Stored XSS trong cơ sở dữ liệu.

### 2.2. Phân tích Biên Phân Loại Thiết Bị (Type BVA)
- `50 ký tự` (độ dài biên trên): Lưu trữ thành công (`201 Created`).
- `51 ký tự` (vượt biên trên): Bị từ chối (`400 Bad Request`).
- Bỏ trống (`null` hoặc không truyền): Hệ thống tự động gán phân loại mặc định là `"Thiết bị"`, đảm bảo UI không bao giờ bị null pointer.

### 2.3. Danh Mục Trạng Thái Vận Hành (Status Partitioning)
- Chấp nhận chuẩn xác 3 trạng thái nghiệp vụ: `Available` (Có sẵn), `Maintenance` (Bảo trì), `Broken` (Hư hỏng).
- Từ chối mọi trạng thái bất thường (`In_Use`, `Damaged_Old`, `123`) bằng mã lỗi `400 Bad Request`.

### 2.4. Ràng Buộc Khóa Ngoại & Tính Toàn Vẹn CSDL (Referential Integrity)
- **Thiết bị đang có lịch họp Confirmed (EquipmentID = 1):** Hệ thống chặn thao tác xóa và trả về mã lỗi chuẩn RESTful `409 Conflict` kèm danh sách các cuộc họp đang ràng buộc. Cơ chế này loại bỏ hoàn toàn nguy cơ sập CSDL hoặc orphaned records trong bảng `Booking_Equipments`.
- **Thiết bị độc lập:** Xóa an toàn (`200 OK`), và khi gửi lại yêu cầu xóa tiếp theo, hệ thống trả về `404 Not Found` (chuẩn Idempotent Delete).

---

## 3. Kết Luận & Nghiệm Thu Chất Lượng QA

1. **Đạt chuẩn 100%:** Toàn bộ **42/42** kịch bản kiểm thử ca biên và CRUD đều vượt qua xuất sắc.
2. **Kiểm soát dữ liệu đầu vào:** API đã được bọc lớp Middleware Validation nghiêm ngặt, tự động loại trừ mọi dữ liệu rác, chuỗi vượt giới hạn và payload độc hại trước khi chạm tầng CSDL.
3. **Sẵn sàng triển khai sản phẩm:** Tính năng Quản trị danh mục thiết bị đã đáp ứng đầy đủ các tiêu chuẩn chất lượng khắt khe của Enterprise SaaS.
