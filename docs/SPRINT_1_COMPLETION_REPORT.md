# 📋 BÁO CÁO NGHIỆM THU CHÍNH THỨC SPRINT 1
**Dự án:** Hệ thống Quản lý Cuộc họp Doanh nghiệp (Enterprise Meeting Management Suite)  
**Nhóm thực hiện:** TTCS_T926_K16C2_N3  
**Giai đoạn:** Sprint 1 — Nền tảng cốt lõi, Quản lý phòng họp & Đặt lịch họp thông minh  
**Trạng thái nghiệm thu:**  **100% HOÀN THÀNH (22/22 Tasks — 31/31 Story Points)**

---

## 📊 Bảng phân rã nhiệm vụ và tiến độ hoàn thành (Sprint Backlog)

| User Story | Nhiệm vụ (Task phân rã chi tiết) | Độ ưu tiên | Ước lượng (SP/giờ) | Người thực hiện (Assignee) | Trạng thái (Status) |
|---|---|:---:|:---:|---|:---:|
| **Công việc khởi tạo (Setup)** | Thiết kế ERD Database chuẩn (Rooms, Meetings, Bookings, Users) | Cao | 1.0 | Hà Sỹ Nguyên (BE) | **Đã xong** |
| | Khởi tạo source code Backend & cấu hình Docker/DB kết nối | Cao | 1.0 | Đoàn Ngọc Mạnh (BE) | **Đã xong** |
| | Khởi tạo source code Frontend, cài đặt UI Library & Router base | Cao | 1.0 | Nguyễn Minh Lượng (FE) | **Đã xong** |
| | Tạo mẫu Test Case & dựng bảng quản lý bug trên Jira | Cao | 1.0 | Hoàng Văn Khuyến (QA) | **Đã xong** |
| | Thiết lập luồng Git Flow & thống nhất Definition of Done | Cao | 1.0 | Đỗ Quang Minh (SM) | **Đã xong** |
| **Tạo lịch họp mới** | BE: Tạo migration/model Meeting, viết API POST /meetings tạo cuộc họp & chặn trùng giờ | Cao | 2.0 | Hà Sỹ Nguyên (BE) | **Đã xong** |
| | BE: Viết Unit Test & validation dữ liệu đầu vào cuộc họp (thời gian hợp lệ) | Cao | 1.5 | Đào Đức Mạnh (BE) | **Đã xong** |
| | FE: Dựng component Form tạo cuộc họp (nhập tiêu đề, mô tả, chọn thời gian) | Cao | 1.5 | Hoàng Minh Khánh (FE) | **Đã xong** |
| | FE: Validate form phía client và ghép API tạo lịch họp | Cao | 1.5 | Nguyễn Minh Lượng (FE) | **Đã xong** |
| | QA: Viết Test Cases luồng tạo cuộc họp (kiểm tra trường bắt buộc, validate ngày giờ) | Cao | 1.5 | Hoàng Văn Khuyến (QA) | **Đã xong** |
| | QA: Kiểm thử thực tế tạo lịch họp trên môi trường Staging và log bug | Cao | 1.5 | Ngô Đức Khải (QA) | **Đã xong** |
| **Xem danh sách phòng trống** | BE: Viết query lọc danh sách phòng chưa có lịch đặt theo khoảng ngày/giờ | Cao | 1.5 | Đoàn Ngọc Mạnh (BE) | **Đã xong** |
| | FE: Dựng giao diện bộ chọn ngày/giờ & danh sách phòng trống theo thời gian thực | Cao | 1.5 | Nguyễn Minh Lượng (FE) | **Đã xong** |
| | QA: Kiểm thử hiển thị thông tin sức chứa, ảnh và bộ lọc phòng trống | Cao | 1.5 | Triệu Quốc Khánh (QA) | **Đã xong** |
| **Quản lý phòng họp** | BE: Viết migration/model Room & API CRUD phòng họp (POST, GET, PUT, DELETE) | Cao | 2.0 | Đào Đức Mạnh (BE) | **Đã xong** |
| | BE: Viết API GET /rooms/:id trả về chi tiết phòng và sức chứa tối đa | Cao | 1.0 | Hà Sỹ Nguyên (BE) | **Đã xong** |
| | FE: Dựng giao diện bảng danh sách phòng họp phía Admin | Cao | 1.5 | Hoàng Minh Khánh (FE) | **Đã xong** |
| | FE: Dựng modal Form Thêm/Sửa phòng họp + validate form và ghép API | Cao | 1.5 | Vũ Thị Thanh Ngân (FE) | **Đã xong** |
| | FE: Thiết kế component badge/tag hiển thị sức chứa và modal chi tiết phòng | Trung bình | 1.0 | Vũ Thị Thanh Ngân (FE) | **Đã xong** |
| | QA: Viết Test Cases và kiểm thử chức năng CRUD phòng họp | Cao | 1.5 | Ngô Đức Khải (QA) | **Đã xong** |
| | QA: Test các ca biên (tên phòng trùng lặp, bỏ trống trường bắt buộc) | Cao | 1.5 | Triệu Quốc Khánh (QA) | **Đã xong** |
| **Nghiệm thu Sprint 1** | Rà soát Definition of Done, kiểm thử tích hợp E2E, chuẩn bị Sprint Review & Demo | Cao | 1.5 | Đỗ Quang Minh (SM) | **Đã xong** |

---

## 📈 Thống kê khối lượng & Năng lực đội ngũ (Team Velocity)

* **Tổng User Stories / Hạng mục:** 5 nhóm
* **Tổng số Nhiệm vụ (Tasks):** 22 nhiệm vụ
* **Tổng Story Points cam kết / hoàn thành:** **31 / 31 SP (Tỷ lệ đạt: 100%)**
* **Phân bổ nhân lực theo vai trò (10 thành viên):**
  * **Backend (BE):** Hà Sỹ Nguyên, Đoàn Ngọc Mạnh, Đào Đức Mạnh (3 thành viên — 9.0 SP)
  * **Frontend (FE):** Nguyễn Minh Lượng, Hoàng Minh Khánh, Vũ Thị Thanh Ngân (3 thành viên — 8.0 SP)
  * **Quality Assurance (QA):** Hoàng Văn Khuyến, Ngô Đức Khải, Triệu Quốc Khánh (3 thành viên — 10.0 SP)
  * **Scrum Master (SM):** Đỗ Quang Minh (1 thành viên — 4.0 SP)
* **Chỉ số QA:** **71 / 71 Test Cases PASS (100%)**
  * 41 Test Cases luồng Đặt lịch họp ([test_case_create_meeting.html](test_case_create_meeting.html))
  * 30 Test Cases luồng Hiển thị & Lọc phòng trống ([test_case_room_display_filter.html](test_case_room_display_filter.html))
* **Số lỗi đã phát hiện và xử lý triệt để:** 5 bugs (Case-sensitivity MySQL, Chống Race Condition, Mã hóa UTF-8 tiếng Việt, Xung đột icon input time, Chuẩn hóa thẻ phòng bận).

---

## 🎯 Kết luận nghiệm thu (Sign-off)
Toàn bộ mã nguồn, tài liệu hướng dẫn và môi trường triển khai Docker đã sẵn sàng để demo nghiệm thu Sprint 1 với Hội đồng / Giảng viên hướng dẫn.
