# Kiểm thử luồng đặt kèm thiết bị và tính toàn vẹn Booking - Thiết bị

## 1. Mục tiêu

Xác nhận luồng tạo cuộc họp/đặt phòng có thể đính kèm thiết bị, đồng thời dữ liệu trong `Bookings`, `Equipments` và bảng liên kết `Booking_Equipments` nhất quán sau khi thành công hoặc thất bại.

## 2. Phạm vi và căn cứ

- API tạo cuộc họp: `POST /api/meetings`; danh sách thiết bị truyền qua trường `equipmentIds`.
- Khi tạo thành công, hệ thống tạo `Meeting`, `Booking` và các dòng liên kết thiết bị trong cùng transaction.
- Validator yêu cầu `equipmentIds` là mảng ID số nguyên dương, loại bỏ ID trùng và áp dụng giới hạn `MAX_EQUIPMENT_COUNT`.
- Model kiểm tra các ID có tồn tại trong `Equipments`. ID không tồn tại trả lỗi nghiệp vụ 404 và rollback transaction.
- `Booking_Equipments` có khóa chính ghép `(BookingID, EquipmentID)`, khóa ngoại tới `Bookings` và `Equipments`; `Quantity` mặc định là 1.
- Response tạo cuộc họp trả `bookingId` và `equipmentCount`, không trả danh sách chi tiết thiết bị. Dùng truy vấn DB để xác minh các liên kết thực tế.
- Phạm vi này không kiểm tra tồn kho, khả năng đặt đồng thời thiết bị, thay đổi thiết bị khi cập nhật cuộc họp hoặc quy tắc theo trạng thái thiết bị.

## 3. Điều kiện và dữ liệu kiểm thử

- Backend và MySQL đang hoạt động; database đã chạy schema/seed hiện hành.
- Có user tổ chức hợp lệ, phòng `Active` không trùng lịch, và ít nhất hai thiết bị tồn tại.
- Mỗi ca tạo cuộc họp dùng thời gian tương lai, khác khung giờ các booking hiện có; ghi lại `meetingId` và `bookingId` trả về để đối chiếu.
- Dùng ID thiết bị không tồn tại riêng biệt, ví dụ `99999`; xác nhận ID này thực sự chưa có trong `Equipments` trước khi chạy.

Payload mẫu:

```json
{
  "title": "QA - Booking kem thiet bi",
  "startTime": "2099-10-01T09:00:00.000Z",
  "endTime": "2099-10-01T10:00:00.000Z",
  "organizerId": 1,
  "roomId": 1,
  "equipmentIds": [1, 2]
}
```

## 4. Test cases

| ID | Kịch bản | Thao tác / dữ liệu | Kết quả mong đợi |
|---|---|---|---|
| EQBK-001 | Đặt kèm một thiết bị hợp lệ | Gửi payload với `equipmentIds: [1]`; lưu `bookingId` trong response. | HTTP 201; `success=true`; `equipmentCount=1`; có đúng một dòng `(bookingId, 1)` trong `Booking_Equipments`; `Quantity=1`. |
| EQBK-002 | Đặt kèm nhiều thiết bị khác nhau | Gửi `equipmentIds` gồm hai hoặc nhiều ID tồn tại. | HTTP 201; `equipmentCount` bằng số ID duy nhất; mỗi thiết bị gắn đúng `bookingId`, không tạo booking/meeting thừa. |
| EQBK-003 | Không truyền danh sách thiết bị | Bỏ hẳn `equipmentIds`. | HTTP 201; `equipmentCount=0`; booking được tạo; không có dòng liên kết thiết bị cho booking đó. |
| EQBK-004 | Danh sách thiết bị rỗng | Gửi `equipmentIds: []`. | Kết quả như EQBK-003; không phát sinh liên kết. |
| EQBK-005 | ID thiết bị bị lặp | Gửi `equipmentIds: [1, 1, 2, 2]`. | HTTP 201; validator chuẩn hóa thành ID duy nhất; `equipmentCount=2`; mỗi cặp booking-thiết bị chỉ có một dòng. |
| EQBK-006 | `equipmentIds` không phải mảng | Gửi `equipmentIds: "1,2"` hoặc object. | HTTP 400; phản hồi nêu lỗi validation; không tạo `Meeting`, `Booking` hoặc liên kết thiết bị. |
| EQBK-007 | ID sai định dạng | Lần lượt thử ID bằng 0, số âm, số thập phân và chuỗi không phải số. | HTTP 400; phản hồi nêu ID không hợp lệ; không ghi dữ liệu booking/thiết bị. |
| EQBK-008 | Vượt giới hạn số lượng thiết bị | Gửi danh sách có số phần tử lớn hơn `MAX_EQUIPMENT_COUNT` hiện cấu hình. | HTTP 400; thông báo vượt giới hạn; không tạo meeting, booking hoặc liên kết. |
| EQBK-009 | Một thiết bị không tồn tại | Gửi một ID chắc chắn không có trong `Equipments`. | HTTP 404; thông báo ID thiết bị không tồn tại; transaction rollback, không còn meeting/booking/liên kết được tạo từ request. |
| EQBK-010 | Trộn ID hợp lệ và không tồn tại | Gửi `equipmentIds` gồm một ID hiện hữu và một ID không tồn tại. | HTTP 404; không được lưu riêng thiết bị hợp lệ; toàn bộ thao tác tạo meeting, booking và liên kết bị rollback. |
| EQBK-011 | Cách ly thiết bị giữa hai booking | Tạo hai booking ở hai phòng/khung giờ không trùng; mỗi booking chọn tập ID khác nhau. | Từng `BookingID` chỉ liên kết với đúng tập thiết bị của request tương ứng; không rò hoặc gắn nhầm thiết bị giữa hai booking. |
| EQBK-012 | Từ chối liên kết tới booking/thiết bị không tồn tại ở DB | Trong môi trường kiểm thử, thử INSERT trực tiếp vào `Booking_Equipments` với `BookingID` hoặc `EquipmentID` không tồn tại. | DB từ chối bằng ràng buộc khóa ngoại; không xuất hiện dòng liên kết không hợp lệ. Không chạy thao tác này trên dữ liệu dùng chung/production. |

## 5. Truy vấn đối chiếu dữ liệu

Thay `:bookingId` bằng ID booking thực tế. Cú pháp tham số có thể cần điều chỉnh theo công cụ DB đang dùng.

```sql
-- Đối chiếu các thiết bị của một booking và giá trị số lượng mặc định
SELECT be.BookingID, be.EquipmentID, be.Quantity, e.EquipmentName
FROM Booking_Equipments AS be
JOIN Equipments AS e ON e.EquipmentID = be.EquipmentID
WHERE be.BookingID = :bookingId
ORDER BY be.EquipmentID;

-- Booking không được mồ côi khỏi Meeting hoặc Room
SELECT b.BookingID
FROM Bookings AS b
LEFT JOIN Meetings AS m ON m.MeetingID = b.MeetingID
LEFT JOIN Rooms AS r ON r.RoomID = b.RoomID
WHERE m.MeetingID IS NULL OR r.RoomID IS NULL;

-- Không được có liên kết thiết bị mồ côi
SELECT be.BookingID, be.EquipmentID
FROM Booking_Equipments AS be
LEFT JOIN Bookings AS b ON b.BookingID = be.BookingID
LEFT JOIN Equipments AS e ON e.EquipmentID = be.EquipmentID
WHERE b.BookingID IS NULL OR e.EquipmentID IS NULL;

-- Kiểm tra trùng cặp booking-thiết bị (kết quả mong đợi: không có dòng)
SELECT BookingID, EquipmentID, COUNT(*) AS DuplicateCount
FROM Booking_Equipments
GROUP BY BookingID, EquipmentID
HAVING COUNT(*) > 1;
```

Khi kiểm tra rollback, chụp `MeetingID`/`BookingID` trước và sau request hoặc chạy trong database cô lập; không dựa vào ID tự tăng liên tục vì transaction rollback không đảm bảo hoàn lại bộ đếm ID.

## 6. Ghi nhận kết quả

Với mỗi ca, ghi Actual Result, trạng thái `Pass` / `Fail` / `Blocked`, thời điểm chạy, môi trường, request/response đã ẩn dữ liệu nhạy cảm và bằng chứng truy vấn DB. Với lỗi toàn vẹn, đính kèm ID request, `meetingId`/`bookingId` nếu có, và số dòng liên quan trong ba bảng `Meetings`, `Bookings`, `Booking_Equipments`.
