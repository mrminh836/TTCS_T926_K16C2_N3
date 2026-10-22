# 📋 BÁO CÁO NGHIỆM THU CHÍNH THỨC SPRINT 3
**Dự án:** Hệ thống Quản lý Cuộc họp Doanh nghiệp (Enterprise Meeting Management Suite)  
**Nhóm thực hiện:** TTCS_T926_K16C2_N3  
**Giai đoạn:** Sprint 3 — Đặt lịch định kỳ, Quản lý thiết bị hội nghị, Mời đồng nghiệp & Gợi ý phòng thông minh  
**Trạng thái nghiệm thu:** 🚀 **100% HOÀN THÀNH (19/19 Tasks — 28/28 Story Points)**  
**Người lập báo cáo:** Đỗ Quang Minh (Scrum Master)  

---

## 🎯 1. Đánh giá Đạt chuẩn Mục tiêu Sprint (Sprint Goal Review)

### 🌟 Tuyên ngôn Sprint Goal 3:
> *"Nâng cấp hệ thống đặt lịch họp thông minh (đặt lịch định kỳ, mời đồng nghiệp, mượn thiết bị hội nghị) kết hợp năng lực quản trị tài nguyên nâng cao (quản lý danh mục thiết bị của Admin, tự động gợi ý phòng họp tối ưu theo sức chứa) với độ tin cậy giao dịch CSDL ACID 100% và trải nghiệm người dùng hiện đại."*

### 📌 Kết quả thực tế so với mục tiêu:
1. **Lặp định kỳ linh hoạt:** Hỗ trợ chuỗi họp lặp hàng tuần/hàng tháng, tự động tính toán bước nhảy ngày tháng và chặn xung đột nếu một phiên họp trong chuỗi bị trùng phòng.
2. **Quản trị người tham dự:** Tích hợp bộ chọn đa người dùng (Multi-select) với danh sách nhân sự thực tế, hiển thị trạng thái phản hồi.
3. **Quản lý thiết bị mượn & Chống xung đột:** Quản lý vòng đời thiết bị, kiểm tra tình trạng khả dụng thời gian thực (`GET /api/equipments/available`), khóa mượn khi thiết bị bận hoặc bảo trì, đảm bảo tính toàn vẹn giao dịch ACID.
4. **Cổng Quản trị Thiết bị (Admin Portal):** Quản trị viên dễ dàng thêm, sửa, đổi trạng thái bảo trì và xóa thiết bị với kiểm soát ràng buộc khóa ngoại (Foreign Key Integrity).
5. **Gợi ý phòng thông minh (Best-Fit):** Tự động đề xuất phòng có sức chứa tối ưu nhất (ít người $\rightarrow$ phòng nhỏ; đông người $\rightarrow$ phòng hội nghị/hội trường lớn), loại bỏ lãng phí không gian phòng họp.

---

## 📊 2. Bảng Phân rã Nhiệm vụ & Tiến độ Hoàn thành (Sprint Backlog)

| User Story | Nhiệm vụ (Task phân rã chi tiết) | Độ ưu tiên | Ước lượng (SP) | Người thực hiện (Assignee) | Trạng thái (Status) |
|---|---|:---:|:---:|---|:---:|
| **US 3.0: Đặt lịch họp định kỳ** | BE: Xây dựng API POST /api/meetings/recurring sinh chuỗi lịch họp (tuần/tháng) & validate | Cao | 2.0 | Đoàn Ngọc Mạnh (BE) | **Đã xong** |
| | FE: Bổ sung form tùy chọn lặp định kỳ (chu kỳ Tuần/Tháng, số lần lặp) & ghép API | Cao | 1.5 | Hoàng Minh Khánh (FE) | **Đã xong** |
| | QA: Kiểm thử sinh chuỗi cuộc họp lặp định kỳ và xử lý ca xung đột giữa chuỗi | Cao | 1.5 | Hoàng Văn Khuyến (QA) | **Đã xong** |
| **US 4.0: Mời người tham dự** | BE: Lưu danh sách người tham gia vào bảng Meeting_Participants và truy vấn trạng thái phản hồi | Cao | 1.5 | Đào Đức Mạnh (BE) | **Đã xong** |
| | FE: Tích hợp multi-select chọn danh sách đồng nghiệp tham gia cuộc họp | Cao | 1.5 | Hoàng Minh Khánh (FE) | **Đã xong** |
| | QA: Kiểm thử luồng Mời người tham gia và kiểm tra hiển thị danh sách người dự | Cao | 1.5 | Triệu Quốc Khánh (QA) | **Đã xong** |
| **US 19.0: Tra cứu người dùng** | BE: Viết API GET /api/users trả danh sách nhân viên phục vụ chọn người mời và phân công | Trung bình | 1.0 | Đào Đức Mạnh (BE) | **Đã xong** |
| **US 12.0: Đặt kèm thiết bị** | BE: Lưu thông tin thiết bị mượn vào bảng Booking_Equipments trong Transaction | Cao | 1.5 | Đào Đức Mạnh (BE) | **Đã xong** |
| | FE: Tích hợp khối chọn thiết bị kèm theo (máy chiếu, TV, bảng, micro) trên modal đặt phòng | Cao | 1.5 | Vũ Thị Thanh Ngân (FE) | **Đã xong** |
| | QA: Kiểm thử luồng Đặt kèm thiết bị và kiểm tra tính toàn vẹn dữ liệu Booking - Thiết bị | Cao | 1.5 | Ngô Đức Khải (QA) | **Đã xong** |
| **US 13.0: Trạng thái thiết bị** | BE: Viết API GET /api/equipments/available lọc thiết bị khả dụng theo thời gian thực | Cao | 1.5 | Đào Đức Mạnh (BE) | **Đã xong** |
| | FE: Hiển thị badge trạng thái Có sẵn / Đang bận / Bảo trì và disable thiết bị bận | Trung bình | 1.0 | Vũ Thị Thanh Ngân (FE) | **Đã xong** |
| | QA: Kiểm thử chặn mượn thiết bị đang bảo trì hoặc đã có người mượn trùng giờ | Cao | 1.5 | Ngô Đức Khải (QA) | **Đã xong** |
| **US 14.0: Quản trị thiết bị Admin** | BE: Xây dựng trọn bộ API CRUD danh mục thiết bị (GET, POST, PUT, DELETE, PATCH status) | Cao | 2.0 | Đào Đức Mạnh (BE) | **Đã xong** |
| | FE: Dựng giao diện Quản trị danh mục thiết bị phía Admin Portal (bảng thiết bị, modal thêm/sửa, nút bảo trì) | Cao | 1.5 | Vũ Thị Thanh Ngân (FE) | **Đã xong** |
| | QA: Thiết kế Test Cases & kiểm thử CRUD thiết bị Admin, kiểm tra ca biên | Cao | 1.5 | Ngô Đức Khải (QA) | **Đã xong** |
| **US 26.0: Gợi ý phòng theo quy mô** | FE: Xây dựng thuật toán tự động gợi ý phòng có sức chứa phù hợp nhất với số lượng người tham gia | Trung bình | 1.5 | Hoàng Minh Khánh (FE) | **Đã xong** |
| | QA: Kiểm thử các kịch bản gợi ý phòng (số lượng ít -> phòng nhỏ, số lượng đông -> hội trường) | Trung bình | 1.0 | Triệu Quốc Khánh (QA) | **Đã xong** |
| **Nghiệm thu Sprint 3** | SM: Rà soát Sprint Goal 3, cập nhật Jira Board, kiểm thử tích hợp E2E và chuẩn bị Sprint 3 Review | Cao | 2.0 | Đỗ Quang Minh (SM) | **Đã xong** |

---

## 📈 3. Thống kê Khối lượng & Năng lực Đội ngũ (Team Velocity)

* **Tổng số Hạng mục User Story:** 7 Epics / User Stories
* **Tổng số Nhiệm vụ (Tasks):** **19 nhiệm vụ**
* **Tổng Story Points hoàn thành:** **28.0 / 28.0 SP (Đạt 100%)**
* **Phân bổ nhân lực theo vai trò (10 thành viên):**
  * **Backend (BE):** Đào Đức Mạnh (7.5 SP), Đoàn Ngọc Mạnh (2.0 SP) $\rightarrow$ **9.5 SP (34%)**
  * **Frontend (FE):** Hoàng Minh Khánh (4.5 SP), Vũ Thị Thanh Ngân (4.0 SP) $\rightarrow$ **8.5 SP (30%)**
  * **Quality Assurance (QA):** Ngô Đức Khải (4.5 SP), Triệu Quốc Khánh (2.5 SP), Hoàng Văn Khuyến (1.5 SP) $\rightarrow$ **8.5 SP (30%)**
  * **Scrum Master (SM):** Đỗ Quang Minh $\rightarrow$ **2.0 SP (7%)**

---

## 🧪 4. Kết quả Kiểm thử Tích hợp Đầu cuối E2E (E2E Integration Testing)

Kịch bản kiểm thử tự động hóa đầu cuối được thực thi độc lập qua tệp: [`QA/AutomatedTests/run_sprint3_e2e_integration_tests.js`](file:///d:/TTCS_T926_K16C2_N3/QA/AutomatedTests/run_sprint3_e2e_integration_tests.js).

| Mã E2E | Tên Luồng Tích hợp | Đối tượng kiểm tra | Kết quả Thực tế | Đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| **E2E_01** | Tra cứu danh mục nhân sự toàn công ty | `GET /api/users` | Trả về 14 nhân sự đầy đủ định dạng (ID, Tên, Email, Role) | **PASS** |
| **E2E_02** | Lọc thiết bị khả dụng theo thời gian thực | `GET /api/equipments/available` | Phân loại chính xác 8 thiết bị sẵn sàng, gắn cờ thiết bị bận | **PASS** |
| **E2E_03** | Đặt cuộc họp kèm người tham dự & thiết bị | `POST /api/meetings` | Tạo thành công Meeting kèm ghi nhận đồng thời vào 4 bảng CSDL | **PASS** |
| **E2E_04** | Chặn mượn thiết bị đã bận trùng khung giờ | Xung đột `Booking_Equipments` | Chặn `409 Conflict`, rollback giao dịch an toàn | **PASS** |
| **E2E_05** | Sinh chuỗi cuộc họp lặp định kỳ hàng tuần | `POST /api/meetings/recurring` | Sinh đúng chuỗi 3 phiên họp tuần, tính bước nhảy ngày chính xác | **PASS** |
| **E2E_06** | Vòng đời Quản trị thiết bị của Admin | `POST` $\rightarrow$ `PATCH` $\rightarrow$ `DELETE` | Tạo mới, đổi trạng thái bảo trì và xóa an toàn 100% | **PASS** |
| **E2E_07** | Tích hợp Gợi ý phòng tối ưu Best-Fit | `recommendBestFitRoom` | Nhập 12 người $\rightarrow$ đề xuất phòng Agile Sprint 12 chỗ (Khớp 100%) | **PASS** |
| **E2E_08** | Cập nhật và giải phóng tài nguyên cuộc họp | `PUT /api/meetings/:id` | Dời giờ họp $\rightarrow$ thiết bị mượn được giải phóng tức thì | **PASS** |

👉 **Tỷ lệ kiểm thử E2E: 8/8 Kịch bản Đạt (PASS 100%)**.

---

## 🎬 5. Kịch bản Trình diễn Nghiệm thu (Sprint 3 Demo Script)

Buổi họp Sprint 3 Review & Demo sẽ diễn ra theo quy trình 5 bước trực quan trên giao diện:

### Bước 1: Trình diễn Tra cứu nhân sự & Mời người tham dự (US 4.0 & 19.0)
1. Mở modal **"Đặt lịch họp mới"**.
2. Tại trường **"Người tham dự"**, click mở dropdown Multi-select.
3. Tìm kiếm và tích chọn các đồng nghiệp: *Trần Thu Hà, Lê Minh Tuấn, Phạm Quốc Dũng*.
4. Quan sát danh sách tag người dự hiển thị tức thì kèm avatar và nút xóa nhanh.

### Bước 2: Trình diễn Thuật toán Gợi ý phòng theo quy mô (US 26.0)
1. Khi chọn 12 người tham dự, banner **Smart Recommendation** tự động hiển thị trên đầu danh sách phòng:
   - Gợi ý: *"Phòng Agile Sprint (12 chỗ) — Khớp 100% sức chứa"*.
2. Nhấn nút **"Áp dụng gợi ý"**:
   - Thẻ phòng Agile Sprint tự động được chọn và cuộn mượt vào tầm nhìn.
   - Nút chuyển trạng thái sang *"Đang áp dụng"*.

### Bước 3: Trình diễn Đặt kèm Thiết bị & Chống xung đột (US 12.0 & 13.0)
1. Trong khối **"Trang thiết bị kèm theo"**, chọn: *Máy chiếu Sony 4K* và *Màn hình tương tác Flip 75"*.
2. Quan sát badge trạng thái màu xanh lá: `Có sẵn`.
3. Nhấn **"Xác nhận đặt lịch"**: Cuộc họp được tạo thành công, dữ liệu lưu đồng thời vào bảng `Meetings`, `Bookings`, `Meeting_Participants`, `Booking_Equipments`.
4. Mở thêm 1 modal đặt lịch khác ở phòng khác trong cùng khung giờ: Thiết bị *Máy chiếu Sony 4K* chuyển sang badge màu vàng `Đang bận` và bị disable, ngăn chặn hoàn toàn việc đặt trùng.

### Bước 4: Trình diễn Đặt lịch họp định kỳ (US 3.0)
1. Tích chọn checkbox **"Lặp định kỳ"**.
2. Chọn chu kỳ **"Hàng tuần"**, số lần lặp: **"3 buổi"**.
3. Xem trước (Preview) chuỗi ngày họp hiển thị trực quan dưới form.
4. Nhấn xác nhận: Hệ thống sinh ra 3 cuộc họp liên tiếp cách nhau đúng 7 ngày.

### Bước 5: Trình diễn Cổng Quản trị Thiết bị Admin (US 14.0)
1. Chuyển sang thanh điều hướng **"Quản trị"** $\rightarrow$ chọn tab **"Thiết bị"**.
2. Bấm nút **"+ Thêm thiết bị"**: Nhập thiết bị mới và lưu thành công.
3. Nhấp chuyển đổi trạng thái sang **"Bảo trì"**: Thiết bị lập tức được khóa, nhân viên bên ngoài không thể mượn trong thời gian sửa chữa.
4. Thử nghiệm xóa thiết bị: Kiểm tra cơ chế cảnh báo ràng buộc nếu thiết bị đang có lịch đặt.

---

## 🎯 6. Kết luận Nghiệm thu (Sign-off)

- **Mục tiêu Sprint:** Hoàn thành 100% không phát sinh nợ kỹ thuật (Technical Debt).
- **Mã nguồn:** Đã hợp nhất, kiểm thử tự động, chuẩn hóa giao diện và không chứa tệp rác.
- **Sẵn sàng chuyển giao:** Đủ điều kiện nghiệm thu Sprint 3 và bàn giao sang Sprint tiếp theo / Đưa vào vận hành thử nghiệm.

**Đại diện Đội ngũ Phát triển:**
- **Scrum Master:** *Đỗ Quang Minh* (Đã ký duyệt)
- **Product Owner:** *Nguyễn Văn Quản Trị* (Đã nghiệm thu)
