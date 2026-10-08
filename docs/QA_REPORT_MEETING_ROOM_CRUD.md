# Báo cáo QA: CRUD danh mục phòng họp

## 1. Mục tiêu và phạm vi

Kiểm thử API quản lý danh mục phòng họp (Room): liệt kê, xem chi tiết, tạo, cập nhật, xóa; bao gồm validation, dữ liệu trùng và bảo vệ ràng buộc booking. Đây là CRUD phòng họp, không phải CRUD cuộc họp (Meeting).

- Bộ test cases: [QA_TEST_CASES_MEETING_CRUD.csv](QA_TEST_CASES_MEETING_CRUD.csv), 16 ca theo mẫu QA 10 cột.
- API dự kiến/thực tế được đăng ký: `GET /api/rooms`, `GET /api/rooms/:id`, `POST /api/rooms`, `PUT /api/rooms/:id`, `DELETE /api/rooms/:id`.
- Ngoài CRUD chính: validation tên/mã/sức chứa/loại/trạng thái, xử lý ID không hợp lệ/không tồn tại, chống trùng và không xóa phòng đang có cuộc họp đã xác nhận chưa kết thúc.
- Không bao gồm kiểm thử giao diện quản trị phòng, phân quyền, hiệu năng hoặc kiểm thử bảo mật chuyên sâu.

## 2. Môi trường và phương pháp

| Hạng mục | Kết quả |
|---|---|
| Ngày | 2026-09-28 |
| Hệ điều hành | Windows |
| API base URL | `http://localhost:3000/api/rooms` |
| Runtime | Không tìm thấy `node`/`npm` trong PATH hoặc vị trí cài đặt phổ biến đã kiểm tra |
| Backend | Không chạy; truy cập `http://localhost:3000/api/rooms` trả `ERR_CONNECTION_REFUSED` |
| Database | Chưa kiểm thử kết nối/tích hợp |
| Kiểm tra mã | Đã đối chiếu route, controller, validator, model và test `server/test/roomCrud.test.js` |

## 3. Kết quả thực thi

| Trạng thái | Số ca | Ghi chú |
|---|---:|---|
| Pass | 0 | Chưa có API response thực tế để xác nhận. |
| Fail | 0 | Không có đủ điều kiện chạy để kết luận lỗi runtime. |
| Blocked | 16 | Backend không lắng nghe tại localhost:3000; Node/npm hiện không khả dụng để chạy test tự động. |
| Tổng | 16 | Xem từng ca và expected result trong CSV. |

**Kết luận:** Mã nguồn hiện có các endpoint CRUD phòng họp và unit tests tương ứng. Tuy nhiên, trong phiên QA này chưa chạy được API hoặc automated tests, do đó chưa thể nghiệm thu chức năng runtime. Không đánh dấu Pass dựa riêng trên việc đọc mã.

## 4. Thiết kế dữ liệu và quy tắc kiểm thử

Bảng `Rooms` trong `database/init_database.sql` gồm `RoomID`, `RoomCode`, `RoomName`, `Capacity`, `Type`, `Floor`, `Status`, `QRCode`, `Description`, `CreatedAt`, `UpdatedAt`.

Theo validator hiện tại:

- Tên phòng bắt buộc, 2-100 ký tự, không được chứa `<` hoặc `>`.
- Sức chứa bắt buộc, số nguyên từ 1 đến 500.
- Mã phòng là tùy chọn; nếu nhập phải dài 2-50 ký tự, chỉ gồm chữ, số, `_` hoặc `-`.
- Trạng thái: `Active`, `Maintenance`, `Inactive`.
- Loại phòng: `Hội nghị`, `Nhóm / Tech`, `Hội trường lớn`, `Đại sảnh / Board`, `VIP / Phỏng vấn`.
- Tên và mã phòng trùng được kiểm tra không phân biệt hoa thường; trùng trả HTTP 409.
- Không cho xóa phòng có booking `Confirmed` gắn với meeting có `EndTime >= NOW()`; API dự kiến trả HTTP 409 với code `CANNOT_DELETE_ACTIVE_MEETINGS`.

Expected status code trong CSV được đối chiếu từ controller: list/detail thành công `200`, tạo `201`, cập nhật/xóa `200`, dữ liệu không hợp lệ `400`, không tìm thấy `404`, dữ liệu trùng hoặc xóa bị ràng buộc `409`.

## 5. Coverage đã có trong mã nguồn

Route được đăng ký trong [roomRoutes.js](../server/routes/roomRoutes.js) và gắn vào `/api` trong [server.js](../server/server.js). Test [roomCrud.test.js](../server/test/roomCrud.test.js) có kiểm tra model CRUD, controller list/detail/create/update/delete, validation, trùng tên/mã và ràng buộc xóa khi có meeting hoạt động. Đây là coverage đã được kiểm tra tĩnh, chưa phải kết quả chạy test.

## 6. Điều kiện để chạy lại

1. Cài Node.js/npm và dependencies tại thư mục `server/`.
2. Khởi chạy MySQL/backend theo cấu hình `.env` và `docker-compose.yml`, hoặc dùng môi trường test có DB tương ứng.
3. Chạy `npm test` trong `server/`; lưu lại số test pass/fail và log.
4. Chạy các ca API trong CSV bằng Postman hoặc công cụ tương đương; dùng dữ liệu test riêng, không xóa dữ liệu seed dùng chung.
5. Chạy lại riêng ca xóa có booking tương lai và ca xóa thành công sau khi xác nhận database có trạng thái cần thiết.

**Tiêu chí nghiệm thu:** 16 ca hoàn thành; các mã HTTP/body khớp expected result; create/update được xác minh bằng GET lại; delete thành công không còn trả về bản ghi; delete bị chặn không làm mất phòng/booking liên quan.# Báo cáo QA: CRUD cuộc họp và phòng họp

## 1. Mục tiêu

Ghi nhận bộ test case và kết quả kiểm thử chức năng tạo, xem, cập nhật, xóa cuộc họp trên giao diện hiện có; đồng thời xác định mức độ sẵn sàng của CRUD danh mục phòng họp.

> Phân biệt nghiệp vụ: giao diện hiện tại quản lý **cuộc họp** (meeting) và trường địa điểm dạng văn bản. Danh mục **phòng họp** (room) là dữ liệu riêng trong bảng `Rooms`; giao diện và API CRUD cho danh mục này chưa được triển khai.

## 2. Tài liệu và phạm vi

- Bộ test case chi tiết, gồm 14 ca theo mẫu QA 10 cột: [QA_TEST_CASES_MEETING_CRUD.csv](QA_TEST_CASES_MEETING_CRUD.csv).
- Test UI: danh sách, tạo, xem chi tiết, sửa, xóa, validation trường bắt buộc, tìm kiếm/lọc và lưu dữ liệu qua lần tải lại.
- Test API CRUD danh mục phòng: lập expected behavior cho GET, POST, GET by ID, PUT và DELETE; các ca này đang Blocked vì endpoint chưa có.
- Không bao gồm kiểm thử phân quyền, tải đồng thời, hiệu năng, bảo mật hoặc tích hợp MySQL.

## 3. Môi trường và phương pháp

| Hạng mục | Giá trị |
|---|---|
| Ngày thực hiện | 2026-09-28 |
| Hệ điều hành | Windows |
| Ứng dụng | Client tĩnh, mở bằng trình duyệt tại `client/index.html#/meetings` |
| Dữ liệu ban đầu | 3 cuộc họp mẫu trong mảng JavaScript |
| Phương pháp | Kiểm thử chức năng UI bằng trình duyệt; đối chiếu route và mã xử lý hiện có |
| Backend / database | Không chạy trong lượt kiểm thử này |
| Automated backend tests | Không thực hiện được: `node` và `npm` không khả dụng trong PATH |

## 4. Kết quả tổng quan

| Trạng thái | Số ca | Diễn giải |
|---|---:|---|
| Pass | 8 | Các luồng UI cuộc họp đã chạy và cho kết quả đúng theo expected result. |
| Fail | 1 | Cuộc họp mới biến mất sau khi tải lại trang. |
| Blocked | 5 | Chưa có API CRUD danh mục phòng họp để thực thi. |
| Tổng | 14 | Chi tiết xem trong CSV test cases. |

**Kết luận:** CRUD cuộc họp trên giao diện đạt các thao tác trong phiên làm việc, nhưng dữ liệu không được lưu bền. Chưa thể nghiệm thu CRUD phòng họp ở backend; hiện không có API quản lý `Rooms`.

## 5. Bằng chứng kiểm thử UI

Các ca `TC_MEETCRUD_001` đến `TC_MEETCRUD_008` đã chạy trên trang cuộc họp:

- Danh sách ban đầu hiển thị đủ 3 cuộc họp mẫu.
- Tạo `QA CRUD Meeting` thành công với ID=4; dữ liệu hiển thị đúng và form đóng.
- Modal chi tiết hiển thị đúng bản ghi đã chọn.
- Cập nhật tiêu đề và địa điểm giữ nguyên ID=4, không tạo bản ghi trùng.
- Hủy hộp thoại xác nhận xóa giữ lại bản ghi; xác nhận xóa loại bản ghi khỏi danh sách.
- Thiếu tiêu đề làm form không hợp lệ.
- Tìm `Sprint Planning`, lọc `completed` và bỏ bộ lọc trả kết quả đúng.

Ca `TC_MEETCRUD_009` được chạy riêng: tạo `QA Persistence Check`, xác nhận bản ghi xuất hiện, tải lại trang; bản ghi biến mất và danh sách quay lại 3 dữ liệu mẫu. Kết quả là **Fail**.

## 6. Defect cần xử lý

### BUG-LOCAL-001: Cuộc họp mới không được lưu bền

- **Severity đề xuất:** Major. **Priority đề xuất:** High. Đây là đề xuất QA, chưa phải Jira issue đã tạo.
- **Môi trường:** Windows, trình duyệt tích hợp, mở client từ file URL.
- **Tiền điều kiện:** Mở trang `#/meetings`.
- **Các bước tái hiện:**
  1. Chọn **Thêm cuộc họp**.
  2. Nhập tiêu đề, ngày, giờ hợp lệ và lưu.
  3. Xác nhận bản ghi xuất hiện trong danh sách.
  4. Tải lại trang.
- **Kết quả thực tế:** Bản ghi vừa tạo biến mất; dữ liệu trở về ba bản ghi khởi tạo.
- **Kết quả mong đợi:** Dữ liệu đã lưu tiếp tục tồn tại sau khi tải lại và khi mở lại ứng dụng.
- **Bằng chứng kỹ thuật:** `client/main.js` khởi tạo `meetings` bằng mảng mẫu và thao tác lưu chỉ thay đổi mảng trong bộ nhớ; không gọi API hoặc ghi `localStorage`.
- **Hướng xử lý đề xuất:** Kết nối giao diện với API lưu trữ bền vững. Ưu tiên database/backend; không dùng `localStorage` làm giải pháp cuối cho dữ liệu dùng chung nhiều người.

## 7. CRUD danh mục phòng họp: trạng thái API

| Thao tác | Ca kiểm thử | Trạng thái | Ghi chú |
|---|---|---|---|
| Liệt kê phòng | `TC_ROOMCRUD_001` | Blocked | Chưa có `GET /api/rooms`. |
| Tạo phòng | `TC_ROOMCRUD_002` | Blocked | Chưa có `POST /api/rooms`; `POST /api/meetings` tạo cuộc họp kèm booking, không phải tạo room. |
| Xem chi tiết phòng | `TC_ROOMCRUD_003` | Blocked | Chưa có `GET /api/rooms/{roomId}`. |
| Cập nhật phòng | `TC_ROOMCRUD_004` | Blocked | Chưa có `PUT /api/rooms/{roomId}`. |
| Xóa phòng | `TC_ROOMCRUD_005` | Blocked | Chưa có `DELETE /api/rooms/{roomId}`; cần quy định xóa mềm/cứng khi có booking liên quan. |

Route hiện đăng ký duy nhất `POST /meetings` trong [meetingRoutes.js](../server/routes/meetingRoutes.js). Bảng `Rooms` có các trường `RoomID`, `RoomName`, `Capacity`, `Status`, `QRCode`; chưa có luồng CRUD để QA chạy thực tế.

## 8. Điều kiện để kiểm thử lại và nghiệm thu

1. Triển khai API CRUD phòng họp và hợp đồng response/status code; xác định hành vi khi phòng đang được booking tham chiếu.
2. Kết nối giao diện với backend và database để dữ liệu cuộc họp/phòng được lưu bền.
3. Cài Node.js/npm và dependencies của `server/`, sau đó chạy `npm test` cùng kiểm thử API trên database test.
4. Chạy lại `TC_MEETCRUD_009` và toàn bộ `TC_ROOMCRUD_001` đến `TC_ROOMCRUD_005`; chỉ nghiệm thu khi defect đã được xử lý và không còn ca Blocked.