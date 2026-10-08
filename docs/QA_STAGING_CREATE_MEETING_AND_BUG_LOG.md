# Runbook QA Staging: Tạo cuộc họp và ghi nhận lỗi

> **Phạm vi:** Kiểm thử thực tế luồng tạo cuộc họp trên môi trường được chỉ định là staging; hướng dẫn chạy bộ 41 test case và ghi nhận kết quả.
> **Bộ test case:** [test_case_create_meeting.csv](./test_case_create_meeting.csv)
> **Execution log:** [QA_STAGING_EXECUTION_LOG.csv](./QA_STAGING_EXECUTION_LOG.csv)
> **Mẫu bug log:** [QA_BUG_LOG_TEMPLATE.csv](./QA_BUG_LOG_TEMPLATE.csv)

## 1. Trạng thái xác minh môi trường

Thông tin dưới đây là những gì đã quan sát trực tiếp trong phiên ngày **28/09/2026**. Đây là kiểm tra khả năng truy cập ban đầu, **không phải kết quả của 41 test case chức năng**.

| Hạng mục | Kết quả quan sát |
|---|---|
| Trình duyệt / hệ điều hành | Tab trình duyệt được chia sẻ; Windows |
| UI đang mở | `file:///C:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/client/index.html#/meetings` |
| Thao tác UI đã xác nhận | Trang quản lý cuộc họp hiển thị; đã mở được modal “Tạo cuộc họp mới”. Chưa submit form. |
| API health | `GET http://localhost:3000/api/health` trả `{"status":"ok","database":"connected"}` |
| URL gốc của backend | `GET http://localhost:3000/` trả 404 JSON `Tuyến đường không tồn tại: GET /` |
| URL staging được triển khai | Chưa được xác nhận; UI đang mở từ tệp local, không phải URL web staging |
| Test case tạo cuộc họp | Chưa thực thi; chưa ghi nhận PASS/FAIL cho các ca chức năng |

**Kết luận hiện tại:** Backend tại `localhost:3000` và kết nối database phản hồi health check thành công tại thời điểm kiểm tra. Tuy nhiên, chưa đủ bằng chứng để xác nhận đây là deployment staging hoàn chỉnh: giao diện đang được mở trực tiếp từ `file://` và URL web gốc trả 404. Cần xác nhận URL frontend staging và phiên bản/build trước khi dùng kết quả để nghiệm thu staging. Không gửi payload tạo meeting vào DB cho đến khi xác nhận đây là dữ liệu staging có thể ghi.

## 2. Mục tiêu và phạm vi

Xác minh quy trình tạo cuộc họp từ giao diện đến API và nơi lưu dữ liệu, bao gồm:

- Form mở được, hiển thị các trường và kiểm tra dữ liệu bắt buộc.
- Ngày giờ, thời lượng và phòng họp được xác thực đúng.
- Tạo thành công với dữ liệu hợp lệ; phản hồi API và dữ liệu lưu khớp.
- Từ chối dữ liệu không hợp lệ hoặc khung giờ xung đột.
- Không tạo bản ghi ngoài ý muốn khi lỗi, gửi lại hoặc tải lại trang.

Bộ chi tiết 41 ca là nguồn expected result chính. Runbook này bổ sung các bước xác minh môi trường, quản lý dữ liệu/bằng chứng và quy tắc kết luận. Không mở rộng sang kiểm thử tải, bảo mật chuyên sâu hay CRUD danh mục phòng.

## 3. Điều kiện trước khi chạy

1. Xác nhận với người phụ trách môi trường **URL frontend staging**, API base URL, build/commit đang deploy và quyền truy cập. Không dùng `localhost` thay cho staging nếu chưa xác nhận máy và service đó chính là staging.
2. Xác nhận staging cho phép ghi dữ liệu, cơ chế dọn dữ liệu test, và khoảng thời gian/phòng test được phép dùng. Không chạy trên production.
3. Ghi nhận browser/version, thời gian chạy và tester trong execution log. Không ghi mật khẩu, token, cookie hoặc dữ liệu cá nhân thật vào log/ảnh.
4. Mở trang quản lý cuộc họp trên URL staging được xác nhận; mở DevTools Network/Console để kiểm tra request và lỗi. Kiểm tra health endpoint trước khi bắt đầu.
5. Dùng dữ liệu giả lập, tiêu đề có mã lần chạy duy nhất, ví dụ `QA-STG-MEETING-20260928-<tester>-01`. Chọn ngày/giờ tương lai và phòng test được xác nhận còn trống.
6. Kiểm tra danh sách họp ban đầu và ghi lại số lượng/ID liên quan. Không sửa hoặc xóa dữ liệu seed hay lịch của người dùng khác.

### Lưu ý cấu hình hiện tại cần kiểm tra trên staging

- Frontend trong workspace khai báo API là `http://localhost:3000` và fallback lưu vào `localStorage`. Bản frontend `file://` vì vậy có thể gọi backend localhost trên máy QA, không đại diện cho frontend staging.
- Trong source hiện tại, route meeting được đăng ký là `POST /api/meetings`; không thấy route GET danh sách meeting. Không dùng giả định rằng refresh hoặc GET API sẽ xác minh được persistence. Xác minh DB bằng truy vấn read-only được người phụ trách cấp phép, hoặc bằng cơ chế quản trị đã được phê duyệt.
- Health check thành công chỉ chứng minh endpoint và DB đáp ứng tại thời điểm gọi; không tự chứng minh UI đang trỏ đúng deployment, nghiệp vụ tạo họp thành công hoặc dữ liệu đã commit.
- URL gốc `http://localhost:3000/` đã trả 404 trong lần quan sát ban đầu. Ghi nhận đúng URL và response của staging đã xác nhận; không coi trang API root 404 là lỗi chức năng cuộc họp nếu deployment chỉ phục vụ API.

## 4. Quy trình thực thi

### A. Smoke test và kiểm tra deployment

1. Mở URL frontend staging đã được xác nhận, ghi URL (không chứa query/token bí mật) và build/commit.
2. Gọi `GET <API_BASE_URL>/api/health`. Kỳ vọng HTTP 200, trạng thái dịch vụ OK và DB connected. Ghi status code, response đã loại bỏ thông tin nhạy cảm, thời gian và kết quả.
3. Tải lại trang; xác nhận không có lỗi tải tài nguyên hoặc lỗi JavaScript nghiêm trọng. Xác minh API host trong Network đúng staging, không phải localhost hoặc production.
4. Điều hướng tới “Cuộc họp”, mở “Tạo cuộc họp mới”, xác nhận modal và trường bắt buộc hiển thị.
5. Nếu một điều kiện môi trường không đạt, dừng test chức năng phụ thuộc điều kiện đó, ghi `Blocked` và mở bug/incident phù hợp; không giả lập PASS.

### B. Chạy 41 test case tạo cuộc họp

1. Mở [test_case_create_meeting.csv](./test_case_create_meeting.csv) trong spreadsheet giữ nguyên mã `TC_MEET_REQ_*` và `TC_MEET_TIME_*`.
2. Chạy từng ca theo đúng thứ tự và dữ liệu của case. Ca tạo thành công phải dùng tiêu đề duy nhất và slot test được cấp phép; tránh dùng lại dữ liệu của ca trước nếu nó tạo booking.
3. Trước khi lưu, ghi nhận dữ liệu test và trạng thái phòng/slot. Với ca không hợp lệ, xác nhận không phát sinh request tạo thành công hay bản ghi mới.
4. Với ca thành công, quan sát Network: xác nhận request `POST /api/meetings`, status/body thực tế, và phản hồi UI. Kỳ vọng thành công theo đặc tả là HTTP 201; đối chiếu response schema thực tế trước khi khẳng định.
5. Xác minh bản ghi được lưu bền bằng phương thức read-only được phê duyệt (DB query hoặc công cụ staging). Đối chiếu title, room, organizer, thời điểm, participants/equipment và ID. Không chỉ dựa vào toast, dòng UI hoặc localStorage.
6. Với ca xung đột, dùng booking test đã được chuẩn bị hoặc tạo bởi chính lượt chạy. Xác nhận không có booking trùng sau phản hồi lỗi.
7. Sau mỗi ca, cập nhật cột `Actual Result`, `Status`, `Ghi chú / Bug ID` và đường dẫn evidence trong CSV. Không thay expected result sau khi thấy actual; nếu spec sai/không khả thi, ghi nhận sai lệch và tạo bug/decision.
8. Lặp lại kiểm tra persistence/reload chỉ khi có phương thức đọc dữ liệu có thẩm quyền. Ghi riêng hành vi UI/localStorage với hành vi API/database.

### C. Dọn dữ liệu test

- Ghi lại ID/title của bản ghi được tạo và đối chiếu với lượt chạy hiện tại.
- Backend source hiện chỉ đăng ký `POST /api/meetings`; không giả định có API DELETE để dọn meeting.
- Chỉ nhờ người quản trị staging dọn các bản ghi có marker QA đã xác nhận. Yêu cầu dùng transaction/điều kiện hẹp theo ID; không chạy lệnh xóa hàng loạt hoặc thao tác trực tiếp không được duyệt.
- Sau khi dọn, xác minh riêng bản ghi test đã biến mất và lịch seed/người dùng khác không đổi. Ghi kết quả cleanup vào log.

## 5. Quy tắc trạng thái và bằng chứng

| Trạng thái | Dùng khi |
|---|---|
| `Pass` | Đã thực thi đủ bước; actual khớp expected; có bằng chứng phù hợp. |
| `Fail` | Đã thực thi; actual sai expected hoặc có lỗi/side effect. Tạo bug ID và đính kèm evidence. |
| `Blocked` | Không thể chạy hoặc kết luận vì URL, quyền, dữ liệu, dependency hay môi trường chưa sẵn sàng. Nêu blocker cụ thể. |
| `Untested` | Chưa chạy. Không đổi thành Pass dựa trên source code, tài liệu hoặc health check. |

Mỗi evidence nên ghi mã test, thời điểm, môi trường/build, URL đã loại thông tin nhạy cảm, bước tái hiện, kết quả và ảnh/log/network cần thiết. Che PII, authorization header, cookie, token và thông tin kết nối DB trước khi chia sẻ.

## 6. Tiêu chí nghiệm thu

- Toàn bộ ca thuộc phạm vi đã chạy hoặc được chấp thuận loại trừ; không còn ca `Untested` mà không có lý do.
- Các ca PASS có bằng chứng; tất cả FAIL có bug ID, mức độ ảnh hưởng và bước tái hiện.
- Ca happy path có xác minh persistence độc lập với trạng thái hiển thị trên trình duyệt.
- Không có lỗi nghiêm trọng/cao chưa xử lý; lỗi còn lại có quyết định chấp nhận rủi ro và người phê duyệt.
- Dữ liệu test được dọn hoặc có người chịu trách nhiệm và thời hạn dọn rõ ràng.
- Kết quả chỉ được gọi là **Staging QA** sau khi frontend URL, API host và build staging được xác nhận.

## 7. Log lần xác minh ban đầu

| ID | Kiểm tra | Actual result | Status | Ghi chú |
|---|---|---|---|---|
| ENV-001 | Mở trang cuộc họp từ client trong workspace | Trang quản lý cuộc họp hiển thị; điều hướng được tới form | Pass (UI local) | Không phải bằng chứng frontend staging |
| ENV-002 | Mở modal tạo cuộc họp | Modal hiển thị; chưa submit form | Pass (UI local) | Không tạo dữ liệu |
| ENV-003 | `GET http://localhost:3000/api/health` | HTTP 200; `status=ok`, `database=connected` | Pass (health only) | Chỉ xác nhận health tại thời điểm kiểm tra |
| ENV-004 | `GET http://localhost:3000/` | HTTP 404; JSON báo route không tồn tại | Blocked (staging URL chưa rõ) | Cần xác nhận URL frontend/deployment |
| TC_MEET_REQ_001–TC_MEET_TIME_023 | Bộ 41 ca tạo cuộc họp | Chưa chạy | Untested | Thực thi sau khi staging và quyền ghi dữ liệu được xác nhận |
