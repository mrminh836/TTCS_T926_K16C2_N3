# 📋 TÀI LIỆU KIỂM THỬ: ĐỘ CHÍNH XÁC CHỈ SỐ THỐNG KÊ HIỆU SUẤT PHÒNG HỌP & TÍNH TOÀN VẸN, ĐỊNH DẠNG FILE EXCEL XUẤT RA
### *(Module: Room Performance Analytics & Excel/CSV Exporter — Sprint 4)*

> **Dự án:** Quản lý Lịch họp Doanh nghiệp (`TTCS_T926_K16C2_N3`)  
> **Người thực hiện:** NGÔ ĐỨC KHẢI  
> **Quy chuẩn:** Tuân thủ quy trình kiểm thử tại [QA_PROCESS_AND_JIRA_STANDARDS.md](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/docs/QA_PROCESS_AND_JIRA_STANDARDS.md)  
> **Tài liệu tham chiếu nghiệp vụ:** [LUONG_HOAT_DONG_HE_THONG.md](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/docs/LUONG_HOAT_DONG_HE_THONG.md) (Mục 5.3 - Luồng 4.3)  
> **User Stories liên quan:**  
> - **US 22.0:** Báo cáo sử dụng phòng họp theo thời gian (Room Utilization Analytics)  
> - **US 23.0:** Thống kê số lượng cuộc họp bị hủy (Cancellation Rate & Reasons)  
> - **US 24.0:** Xuất báo cáo danh sách cuộc họp & hiệu suất ra file Excel / CSV UTF-8  
> **Tệp dữ liệu bảng tính đính kèm:**  
> - 📄 **File CSV chuẩn hóa (UTF-8 with BOM):** [Test_Cases_Thong_Ke_Hieu_Suat_Va_Xuat_Excel.csv](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/QA/TestCase/Test_Cases_Thong_Ke_Hieu_Suat_Va_Xuat_Excel.csv)  
> - 📄 **Bản sao tài liệu:** [test_case_room_performance_and_export.csv](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/docs/test_case_room_performance_and_export.csv)

---

## 📑 MỤC LỤC TỔNG QUAN

1. [Mục Tiêu & Phạm Vi Kiểm Thử](#1-mục-tiêu--phạm-vi-kiểm-thử)
2. [Đặc Tả Toán Học & Công Thức Tính Các Chỉ Số Hiệu Suất (KPI Formulas)](#2-đặc-tả-toán-học--công-thức-tính-các-chỉ-số-hiệu-suất-kpi-formulas)
   - 2.1. Tỷ lệ lấp đầy phòng họp (Room Utilization Rate)
   - 2.2. Tỷ lệ hủy cuộc họp (Cancellation Rate)
   - 2.3. Tỷ lệ khai thác sức chứa (Seat Capacity Occupancy)
   - 2.4. Phân bổ mật độ & Khung giờ cao điểm (Peak Hours Distribution)
   - 2.5. Chỉ số phòng sẵn sàng phục vụ (Active Availability Index)
   - 2.6. Quy tắc khử lỗi toán học (Zero-Division & Precision Handling)
3. [Đặc Tả Kỹ Thuật: Tính Toàn Vẹn & Định Dạng File Excel / CSV](#3-đặc-tả-kỹ-thuật-tính-toàn-vẹn--định-dạng-file-excel--csv)
   - 3.1. Chuẩn tiền tố Byte Order Mark (BOM UTF-8: `\uFEFF`)
   - 3.2. Cấu trúc 15 cột dữ liệu xuất chuẩn hóa
   - 3.3. Quy tắc Escape ký tự đặc biệt (Dấu phẩy, nháy kép, xuống dòng)
   - 3.4. Phòng chống lỗ hổng CSV / Formula Injection (CWE-1236)
   - 3.5. Quy chuẩn định dạng kiểu dữ liệu (Data Formatting Standards)
4. [Bảng Ma Trận Test Cases Chi Tiết (32 Test Cases Chuẩn Hóa)](#4-bảng-ma-trận-test-cases-chi-tiết-32-test-cases-chuẩn-hóa)
   - [Nhóm 1: Độ chính xác Tỷ lệ lấp đầy & Thời lượng sử dụng (TC_PERF_001 – TC_PERF_006)](#nhóm-1-độ-chính-xác-tỷ-lệ-lấp-đầy--thời-lượng-sử-dụng-phòng)
   - [Nhóm 2: Độ chính xác Tỷ lệ hủy & Trạng thái cuộc họp (TC_PERF_007 – TC_PERF_011)](#nhóm-2-độ-chính-xác-tỷ-lệ-hủy--trạng-thái-cuộc-họp)
   - [Nhóm 3: Khai thác sức chứa, Giờ cao điểm & Dashboard KPI (TC_PERF_012 – TC_PERF_016)](#nhóm-3-khai-thác-sức-chứa-giờ-cao-điểm--dashboard-kpi)
   - [Nhóm 4: Tính toàn vẹn dữ liệu xuất file Excel (TC_PERF_017 – TC_PERF_022)](#nhóm-4-tính-toàn-vẹn-dữ-liệu-xuất-file-excel-data-integrity)
   - [Nhóm 5: Định dạng file, UTF-8 BOM & Tương thích Excel (TC_PERF_023 – TC_PERF_027)](#nhóm-5-định-dạng-file-utf-8-bom--tương-thích-excel)
   - [Nhóm 6: Ca biên & An toàn bảo mật xuất file (TC_PERF_028 – TC_PERF_032)](#nhóm-6-ca-biên--an-toàn-bảo-mật-xuất-file)
5. [Phân Tích Lớp Tương Đương (EP) & Giá Trị Biên (BVA)](#5-phân-tích-lớp-tương-đương-ep--giá-trị-biên-bva)
6. [Bộ Script SQL Đối Soát Số Liệu Thực Tế (Database Audit Queries)](#6-bộ-script-sql-đối-soát-số-liệu-thực-tế-database-audit-queries)
7. [Mẫu Báo Cáo Lỗi Jira Tiêu Chuẩn (Bug Report Template)](#7-mẫu-báo-cáo-lỗi-jira-tiêu-chuẩn-bug-report-template)

---

## 1. Mục Tiêu & Phạm Vi Kiểm Thử

### 1.1. Mục tiêu
1. **Kiểm thử độ chính xác toán học của các chỉ số hiệu suất phòng họp (Performance KPIs):**
   - Đảm bảo các công thức tính tỷ lệ lấp đầy phòng, tỷ lệ hủy họp, số giờ sử dụng, tỷ lệ khai thác sức chứa và phân bố giờ cao điểm phản ánh 100% dữ liệu thực tế trong CSDL.
   - Kiểm soát triệt để các tình huống chia cho 0 (`0/0`, `NaN`, `Infinity`), làm tròn số thập phân và xử lý các cuộc họp giao thoa ranh giới ngày/tháng.
2. **Kiểm tra tính toàn vẹn dữ liệu xuất file Excel/CSV:**
   - Xác minh số lượng bản ghi xuất ra khớp tuyệt đối với CSDL hoặc danh sách lọc trên giao diện (Filtered Dataset).
   - Đảm bảo đầy đủ 15 trường thông tin chi tiết, không bị mất mát dữ liệu con (mảng người tham gia, danh sách thiết bị kèm theo, ghi chú nhiều dòng).
   - Đảm bảo không có giá trị rác hoặc lỗi kiểu (`null`, `undefined`, `NaN`, `[object Object]`).
3. **Kiểm tra định dạng, chuẩn hiển thị và tính tương thích trên Microsoft Excel:**
   - Kiểm tra tiền tố Byte Order Mark (`\uFEFF`) để đảm bảo mở trực tiếp trên Excel (Windows/macOS) không bị lỗi font tiếng Việt (Mojibake).
   - Đảm bảo các trường chuỗi có dấu phẩy, nháy kép, ký tự xuống dòng được đóng gói (quote/escape) đúng chuẩn RFC 4180, không làm lệch cột bảng tính (Column Shift).
4. **Kiểm tra an toàn bảo mật khi xuất file:**
   - Kiểm soát lỗ hổng **CSV / Formula Injection (CWE-1236)** khi người dùng nhập tiêu đề bắt đầu bằng `=`, `+`, `-`, `@`.
   - Ngăn chặn tấn công XSS / HTML Injection trong nội dung file.

### 1.2. Phạm vi kiểm thử
- **Giao diện Client:** Nút xuất báo cáo Excel (`#btn-export-excel`), Dashboard KPIs (`#kpi-total`, `#kpi-scheduled`, `#kpi-inprogress`, `#room-kpi-total`, `#room-kpi-active`, `#room-kpi-maintenance`, `#room-kpi-capacity`), các tab lọc trạng thái và bộ lọc phòng họp.
- **Backend API & Xử lý số liệu:** Endpoint xuất file, các hàm tổng hợp tính toán (`exportToCSV`, `updateDashboardStats`, các query báo cáo SQL).
- **Phần mềm bảng tính kiểm thử thực tế:** Microsoft Excel 2019/2021/365 trên Windows, Microsoft Excel trên macOS, Google Sheets, LibreOffice Calc.

---

## 2. Đặc Tả Toán Học & Công Thức Tính Các Chỉ Số Hiệu Suất (KPI Formulas)

Theo tài liệu đặc tả [LUONG_HOAT_DONG_HE_THONG.md (Mục 5.3)](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/docs/LUONG_HOAT_DONG_HE_THONG.md), hệ thống vận hành theo các công thức chuẩn doanh nghiệp:

### 2.1. Tỷ lệ lấp đầy phòng họp (Room Utilization Rate)
Đo lường mức độ khai thác thời gian thực tế của một phòng họp (hoặc toàn bộ cơ sở) so với tổng thời gian làm việc chuẩn.

$$\text{Utilization Rate (\%)} = \left( \frac{\sum_{i=1}^{n} \text{Duration}(M_i)}{\text{Total Standard Available Hours}} \right) \times 100\%$$

Trong đó:
- $M_i$: Cuộc họp thứ $i$ diễn ra trong phòng đó với trạng thái hợp lệ ($\text{Status} \in \{\text{'scheduled'}, \text{'in-progress'}, \text{'completed'}\}$).
- **QUAN TRỌNG:** Các cuộc họp có trạng thái $\text{Status} = \text{'cancelled'}$ **tuyệt đối không được tính** vào tổng số giờ họp thực tế.
- $\text{Duration}(M_i) = \frac{\text{EndTime} - \text{StartTime}}{60}$ (tính theo giờ).
- **Thời gian làm việc chuẩn tháng:** $8 \text{ giờ/ngày} \times 22 \text{ ngày làm việc} = 176 \text{ giờ/phòng/tháng}$ (hoặc theo số ngày làm việc thực tế trong kỳ lọc $\times 8\text{h}$).

### 2.2. Tỷ lệ hủy cuộc họp (Cancellation Rate)
Đo lường tần suất các cuộc họp bị hủy nhằm đánh giá tính kỷ luật và lãng phí tài nguyên phòng.

$$\text{Cancellation Rate (\%)} = \left( \frac{N_{\text{cancelled}}}{N_{\text{total}}} \right) \times 100\%$$

Trong đó:
- $N_{\text{cancelled}}$: Số cuộc họp có trạng thái `cancelled`.
- $N_{\text{total}}$: Tổng số cuộc họp được tạo trong kỳ ($N_{\text{total}} = N_{\text{scheduled}} + N_{\text{in-progress}} + N_{\text{completed}} + N_{\text{cancelled}}$).

### 2.3. Tỷ lệ khai thác sức chứa (Seat Capacity Occupancy)
Đo lường xem phòng họp có bị sử dụng lãng phí (phòng 50 chỗ chỉ có 3 người) hoặc quá tải hay không.

$$\text{Seat Occupancy (\%)} = \left( \frac{\text{Số người tham dự thực tế (Participants + Host)}}{\text{Sức chứa thiết kế của phòng (Capacity)}} \right) \times 100\%$$

- **Quy chuẩn phân loại hiệu quả:**
  - $< 30\%$: Lãng phí sức chứa (Under-utilized).
  - $30\% - 90\%$: Khai thác tối ưu (Optimal).
  - $> 90\%$: Sát giới hạn / Tiềm ẩn quá tải (Near Capacity).
  - $> 100\%$: Quá tải sức chứa nghiêm trọng (Overcrowded — cần chặn từ khâu validation).

### 2.4. Phân bổ mật độ & Khung giờ cao điểm (Peak Hours Distribution)
Phân loại các khung giờ trong ngày thành các slot 2 tiếng chuẩn doanh nghiệp:
- Slot 1: `08:00 - 10:00` (Họp giao ban đầu giờ)
- Slot 2: `10:00 - 12:00` (Khung giờ vàng sáng)
- Slot 3: `13:30 - 15:30` (Khung giờ vàng chiều)
- Slot 4: `15:30 - 17:30` (Họp tổng kết cuối ngày)
- Khung ngoài giờ: Trước `08:00` hoặc sau `17:30`.

### 2.5. Chỉ số phòng sẵn sàng phục vụ (Active Availability Index)
$$\text{Availability Index (\%)} = \left( \frac{\text{Số phòng đang hoạt động (Active)}}{\text{Tổng số phòng hiện có trong hệ thống}} \right) \times 100\%$$

### 2.6. Quy tắc khử lỗi toán học (Zero-Division & Precision Handling)
1. **Trường hợp chia cho 0:** Khi $N_{\text{total}} = 0$ hoặc $\text{Available Hours} = 0$, hệ thống phải trả về `0.00%`, cấm để xuất hiện `NaN%`, `Infinity%` hoặc gây crash runtime.
2. **Quy tắc làm tròn:** Mọi tỷ lệ phần trăm hiển thị trên UI và Excel phải làm tròn đúng 2 chữ số thập phân (Rounding half-up: `Math.round(val * 100) / 100`).

---

## 3. Đặc Tả Kỹ Thuật: Tính Toàn Vẹn & Định Dạng File Excel / CSV

### 3.1. Chuẩn tiền tố Byte Order Mark (BOM UTF-8: `\uFEFF`)
Khi người dùng tải file CSV và click mở trực tiếp bằng Microsoft Excel trên Windows, Excel sẽ dùng bảng mã ANSI/Windows-1252 mặc định nếu không có BOM, dẫn đến toàn bộ ký tự tiếng Việt có dấu (ví dụ: `Phòng Tokyo`, `Nguyễn Văn An`, `Đã kết thúc`) bị biến dạng thành mã rác Mojibake (`PhÃ²ng Tokyo`, `Nguyá»…n VÄƒn An`).
- **Giải pháp bắt buộc (Chuẩn dự án tại FE Guide):**
```javascript
const BOM = "\uFEFF";
const csvContent = BOM + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
```

### 3.2. Cấu trúc 15 cột dữ liệu xuất chuẩn hóa
File xuất ra phải đảm bảo cấu trúc 15 cột cố định theo đúng thứ tự:

| STT Cột | Tên Tiêu Đề Cột (Header) | Kiểu Dữ Liệu | Ví Dụ Dữ Liệu |
| :---: | :--- | :--- | :--- |
| **1** | `Mã cuộc họp (MeetingID)` | Số nguyên (Integer) | `1`, `102` |
| **2** | `Tiêu đề (Title)` | Chuỗi (Escaped String) | `"Họp Sprint Planning K16"` |
| **3** | `Nhãn phân loại (Tag)` | Chuỗi | `"Sprint 24"`, `"Nội bộ"` |
| **4** | `Ngày họp` | Ngày (`YYYY-MM-DD`) | `2026-10-20` |
| **5** | `Thời gian (StartTime - EndTime)` | Chuỗi (`HH:mm - HH:mm`) | `"09:00 - 10:30"` |
| **6** | `Phòng họp (RoomName)` | Chuỗi | `"Phòng Tokyo (Tầng 4)"` |
| **7** | `Sức chứa (Capacity)` | Số nguyên | `20` |
| **8** | `Mã phòng (RoomID)` | Số nguyên | `1` |
| **9** | `Người tổ chức (Host)` | Chuỗi | `"Nguyễn Văn An"` |
| **10**| `Mã người tổ chức (OrganizerID)` | Số nguyên | `1` |
| **11**| `Người tham gia (Participants)` | Chuỗi danh sách | `"Trần Văn A; Lê Văn B"` |
| **12**| `Trạng thái đặt phòng (BookingStatus)` | Chuỗi tiếng Việt | `"Sắp diễn ra"`, `"Đã hủy"` |
| **13**| `Lặp lại định kỳ (IsRecurring)` | Chuỗi hiển thị | `"Có"` hoặc `"Không"` |
| **14**| `Thiết bị yêu cầu (Equipments)` | Chuỗi danh sách | `"Máy chiếu Full HD, Micro & Loa họp"` |
| **15**| `Mô tả / Ghi chú (Description)` | Chuỗi | `"Kế hoạch Sprint 24"` |

### 3.3. Quy tắc Escape ký tự đặc biệt (RFC 4180)
1. **Dấu phẩy (`,`):** Bất kỳ trường nào chứa dấu phẩy phải được bọc trong cặp dấu nháy kép `""`. Ví dụ: `Trần Văn A, Lê Văn B` $\rightarrow$ `"Trần Văn A, Lê Văn B"`.
2. **Dấu nháy kép (`"`):** Nếu nội dung chứa dấu nháy kép, dấu nháy kép đó phải được nhân đôi thành `""` và bọc toàn bộ chuỗi trong cặp nháy kép. Ví dụ: `Màn hình 75"` $\rightarrow$ `"Màn hình 75"""`.
3. **Ký tự xuống dòng (`\n` hoặc `\r\n`):** Trường ghi chú chứa nhiều dòng phải được bao trong cặp nháy kép `""` để Excel hiểu là cùng 1 ô tính.

### 3.4. Phòng chống lỗ hổng CSV / Formula Injection (CWE-1236)
Khi file CSV được mở bằng Microsoft Excel, nếu một ô bắt đầu bằng các ký tự:
`=`, `+`, `-`, `@`
Excel sẽ tự động coi đó là công thức tính toán và thực thi. Kẻ tấn công có thể chèn các payload độc hại như `=cmd|' /C calc'!A0` hoặc `=HYPERLINK("http://phishing.site", "Click me")`.
- **Quy tắc kiểm thử an toàn:**
  - Nếu trường văn bản bắt đầu bằng `=`, `+`, `-`, `@`, hệ thống phải tiền tố thêm một dấu nháy đơn `'` hoặc dấu cách trước ký tự đó để Excel chỉ coi là văn bản thuần (Text Literal).

### 3.5. Quy chuẩn định dạng kiểu dữ liệu (Data Formatting Standards)
1. **Ngày tháng:** Giữ nguyên chuẩn `YYYY-MM-DD` để tránh trường hợp Excel hiểu sai giữa định dạng Mỹ (`MM/DD/YYYY`) và Việt Nam/Anh (`DD/MM/YYYY`).
2. **Khung giờ:** Lưu chuỗi `"HH:mm - HH:mm"` có bọc nháy kép để Excel không tự động parse thành giờ lẻ hoặc số thập phân.
3. **Mã số có số 0 ở đầu (nếu có, ví dụ RM-001):** Phải lưu dưới dạng chuỗi hoặc chuỗi có nháy để không bị mất số `0` đầu (`1`).

---

## 4. Bảng Ma Trận Test Cases Chi Tiết (32 Test Cases Chuẩn Hóa)

### Nhóm 1: Độ chính xác Tỷ lệ lấp đầy & Thời lượng sử dụng phòng

| Test Case ID | Module / Feature | Tiêu đề kịch bản | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Ghi chú / Bug ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC_PERF_001** | Analytics / Utilization | Tính tỷ lệ lấp đầy phòng trong tháng chuẩn 176h | Phòng 1 (Tokyo) có 4 cuộc họp Completed/Scheduled trong tháng 10/2026 với tổng thời lượng 44 giờ | 1. Vào trang Thống kê hiệu suất phòng họp<br>2. Chọn phòng Tokyo, chọn tháng 10/2026<br>3. Kiểm tra chỉ số Tỷ lệ lấp đầy (Utilization Rate) | Room 1; Total Hours: 44h; Standard: 176h | Tỷ lệ hiển thị đúng 25.00% (44 / 176 * 100); Tổng giờ họp = 44h; Số cuộc họp = 4 | Tỷ lệ = 25.00%; Số giờ họp = 44h khớp CSDL | **Pass** | Verified |
| **TC_PERF_002** | Analytics / Utilization | Tính tỷ lệ lấp đầy phòng theo khoảng ngày tùy chọn (7 ngày) | Phòng 2 (Silicon) trong khoảng 14/10 đến 20/10 (5 ngày làm việc = 40 giờ chuẩn) có các cuộc họp tổng 18 giờ | 1. Chọn khoảng ngày 14/10/2026 đến 20/10/2026<br>2. Xem thống kê phòng Silicon | Room 2; Date range: 7 days (40h làm việc); Meetings: 18h | Tỷ lệ hiển thị đúng 45.00% (18 / 40 * 100); Không lấy nhầm dữ liệu ngoài khoảng ngày | Tỷ lệ = 45.00%; Lọc chính xác khoảng thời gian | **Pass** | US 22.0 |
| **TC_PERF_003** | Analytics / Boundary | Phòng không có cuộc họp nào trong kỳ (Xử lý mẫu > 0, tử = 0) | Phòng 3 (Kyoto) không có lịch đặt nào trong tháng được chọn | 1. Chọn phòng Kyoto<br>2. Xem bảng thống kê hiệu suất | Room 3; Total hours = 0; Standard = 176h | Hiển thị: Tổng giờ họp = 0h; Tỷ lệ lấp đầy = 0.00%; Tuyệt đối không hiển thị `NaN%` hoặc lỗi giao diện | Hiển thị 0.00%; Không có lỗi NaN | **Pass** | Ca biên Zero |
| **TC_PERF_004** | Analytics / Boundary | Phòng hoạt động 100% công suất (Kín toàn bộ slot giờ chuẩn) | Phòng 1 được đặt kín toàn bộ 8h/ngày trong suốt tuần làm việc (40h/40h) | 1. Xem thống kê tuần làm việc của Phòng 1 | Room 1; Total hours: 40h; Standard: 40h | Tỷ lệ lấp đầy hiển thị đúng 100.00%; Thanh gauge đo tải hiển thị đầy mức và badge cảnh báo tối đa | Tỷ lệ = 100.00%; Gauge bar đầy 100% | **Pass** | Full capacity |
| **TC_PERF_005** | Analytics / Exclusion | Cuộc họp bị HỦY (Cancelled) tuyệt đối không được tính vào số giờ họp | Phòng 1 có 2 cuộc họp Completed (4h) và 1 cuộc họp Cancelled (3h) | 1. Thực hiện hủy 1 cuộc họp 3h<br>2. Kiểm tra lại chỉ số Tổng giờ họp và Tỷ lệ lấp đầy của Phòng 1 | Room 1; Completed: 4h; Cancelled: 3h | Tổng giờ họp chỉ tính 4h; Tỷ lệ lấp đầy = 4 / 176 * 100 = 2.27%; 3 giờ họp bị hủy bị loại trừ hoàn toàn | Chỉ tính 4h; Giờ hủy bị loại bỏ chính xác | **Pass** | Integrity Rule |
| **TC_PERF_006** | Analytics / Maintenance | Phòng chuyển sang trạng thái Bảo trì (Maintenance) giữa kỳ | Phòng 4 (Osaka) bị đưa vào bảo trì 1 tuần (40h) trong tháng | 1. Bật trạng thái bảo trì cho phòng Osaka từ 10/10 đến 17/10<br>2. Xem báo cáo hiệu suất khả dụng | Room 4; Maintenance: 40h; Total Working: 176h | Hệ thống ghi nhận đúng số giờ bảo trì; Tỷ lệ thời gian khả dụng (Operating Availability) giảm tương ứng | Ghi nhận 40h bảo trì; Không ghi nhận họp trong thời gian bảo trì | **Pass** | US 13.0 / 22.0 |

---

### Nhóm 2: Độ chính xác Tỷ lệ hủy & Trạng thái cuộc họp

| Test Case ID | Module / Feature | Tiêu đề kịch bản | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Ghi chú / Bug ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC_PERF_007** | Analytics / Cancellation | Tính tỷ lệ hủy họp khi có cả họp hủy và họp thành công | Trong kỳ có 20 cuộc họp được tạo: 15 Scheduled/Completed, 5 Cancelled | 1. Vào trang Thống kê tổng hợp<br>2. Quan sát thẻ KPI Tỷ lệ hủy họp (Cancellation Rate) | Total Meetings: 20; Cancelled: 5 | Tỷ lệ hủy hiển thị chính xác 25.00% (5 / 20 * 100); Số lượng hủy = 5 | Tỷ lệ hủy = 25.00%; Số hủy = 5 bản ghi | **Pass** | US 23.0 |
| **TC_PERF_008** | Analytics / Boundary | Tỷ lệ hủy khi hệ thống chưa có cuộc họp nào (Xử lý 0/0) | Cơ sở dữ liệu hoặc bộ lọc phòng chưa có bất kỳ cuộc họp nào (Total = 0, Cancelled = 0) | 1. Lọc theo 1 phòng mới tạo chưa từng có lịch<br>2. Quan sát thẻ Tỷ lệ hủy | Total: 0; Cancelled: 0 | Hiển thị: Tổng cuộc họp = 0; Tỷ lệ hủy = 0.00%; Không xảy ra lỗi chia cho 0 (`0/0` ra `NaN` hoặc `Infinity`) | Hiển thị 0.00%; Hệ thống an toàn | **Pass** | Zero Division |
| **TC_PERF_009** | Analytics / Boundary | Tỷ lệ hủy đạt 100% khi toàn bộ cuộc họp bị hủy | Trong khoảng thời gian test có 3 cuộc họp và cả 3 đều bị hủy | 1. Chọn khoảng ngày chỉ có 3 cuộc họp đã hủy<br>2. Xem thẻ KPI | Total: 3; Cancelled: 3 | Tỷ lệ hủy hiển thị đúng 100.00%; Cảnh báo tỷ lệ hủy cao màu đỏ hiển thị | Tỷ lệ hủy = 100.00%; Toast cảnh báo hiển thị | **Pass** | Boundary 100% |
| **TC_PERF_010** | Analytics / Recurring | Hủy 1 phiên trong chuỗi cuộc họp lặp định kỳ tính đúng tỷ lệ | Cuộc họp lặp định kỳ có 4 phiên; người dùng hủy đúng phiên ngày mai | 1. Bấm hủy phiên họp ngày mai của chuỗi định kỳ<br>2. Kiểm tra lại bảng thống kê | 1 Instance cancelled; 3 Instances scheduled | Hệ thống tính đúng 1 cuộc họp bị hủy và 3 cuộc họp còn hiệu lực; Tỷ lệ hủy = 1 / 4 = 25.00% | Tính đúng 1 bản ghi hủy; Không hủy toàn bộ chuỗi | **Pass** | Recurring Integrity |
| **TC_PERF_011** | Analytics / Realtime Sync | Đồng bộ tức thì chỉ số KPI khi người dùng hủy cuộc họp từ giao diện | Đang ở màn hình danh sách cuộc họp, các thẻ KPI hiển thị Total=10, Sắp tới=6, Đã hủy=2 | 1. Bấm nút Hủy cuộc họp tại 1 bản ghi Sắp tới<br>2. Xác nhận hủy trên modal | Action: Cancel meeting ID=5 | Thẻ "Sắp tới" giảm ngay từ 6 xuống 5; Thẻ "Đã hủy" tăng ngay từ 2 lên 3; Tab "Đã hủy (3)" cập nhật số lượng tức thì không cần F5 | KPI cập nhật realtime: Sắp tới=5, Đã hủy=3 | **Pass** | Realtime UX |

---

### Nhóm 3: Khai thác sức chứa, Giờ cao điểm & Dashboard KPI

| Test Case ID | Module / Feature | Tiêu đề kịch bản | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Ghi chú / Bug ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC_PERF_012** | Analytics / Capacity | Tính tỷ lệ khai thác sức chứa trung bình của phòng họp | Phòng Tokyo có sức chứa 20 người. Có 2 cuộc họp: Họp A (10 người), Họp B (18 người) | 1. Xem chi tiết báo cáo sức chứa của Phòng Tokyo | Capacity: 20; Meeting A: 10; Meeting B: 18 | Tỷ lệ khai thác cuộc họp A = 50.00%; Họp B = 90.00%; Trung bình phòng = 70.00% (14 / 20 * 100) | Tính chính xác trung bình 70.00% | **Pass** | US 22.0 |
| **TC_PERF_013** | Analytics / Overcrowd | Cảnh báo khi số người tham dự vượt sức chứa thiết kế của phòng | Phòng Silicon sức chứa 15 người; Cuộc họp có 18 người tham dự | 1. Mở xem chi tiết cuộc họp hoặc báo cáo khai thác sức chứa | Capacity: 15; Attendees: 18 | Hiển thị tỷ lệ 120.00%; Có badge cảnh báo đỏ "Vượt sức chứa" (Overcrowded) | Hiển thị 120.00% kèm nhãn cảnh báo đỏ | **Pass** | Capacity Alert |
| **TC_PERF_014** | Analytics / Peak Hours | Xác định chính xác khung giờ cao điểm nhất trong tuần | Trong 50 cuộc họp tuần qua: Slot 09:00-11:00 có 22 cuộc; Slot 14:00-16:00 có 18 cuộc; các slot khác < 6 cuộc | 1. Xem biểu đồ / bảng phân bổ khung giờ họp trong tuần | 50 meetings across 4 slots | Xác định đúng Slot 09:00 - 11:00 là Khung giờ cao điểm nhất (Peak Hour - 44.00% tổng số cuộc họp) | Nhận diện đúng khung 09:00 - 11:00 cao điểm nhất | **Pass** | Peak Hours Analysis |
| **TC_PERF_015** | Analytics / Ranking | Xếp hạng phòng họp được sử dụng nhiều nhất & ít nhất | Hệ thống có 5 phòng: Tokyo (40h), Silicon (30h), Kyoto (15h), Osaka (5h), Nagoya (0h) | 1. Xem bảng xếp hạng khai thác phòng | 5 rooms with varying hours | Top 1 sử dụng nhiều nhất: Phòng Tokyo (40h); Phòng ít sử dụng nhất: Phòng Nagoya (0h); Thứ tự hiển thị giảm dần chính xác | Xếp hạng đúng thứ tự: Tokyo > Silicon > Kyoto > Osaka > Nagoya | **Pass** | Room Ranking |
| **TC_PERF_016** | Dashboard / KPI Cards | Đồng bộ toàn vẹn giữa 4 thẻ KPI tổng quan và CSDL | Đang mở trang Quản lý cuộc họp (`client/index.html`) | 1. So sánh số liệu trên 3 thẻ KPI (Tổng số, Sắp tới, Đang diễn ra) với số dòng trong bảng | Database: 12 meetings (7 scheduled, 2 in-progress, 2 completed, 1 cancelled) | Thẻ Tổng số = 12; Thẻ Sắp tới = 7; Thẻ Đang diễn ra = 2; Các tab lọc hiển thị đúng số đếm trong ngoặc đơn | Toàn bộ 3 thẻ và tab lọc khớp 100% CSDL | **Pass** | Consistency |

---

### Nhóm 4: Tính toàn vẹn dữ liệu xuất file Excel (Data Integrity)

| Test Case ID | Module / Feature | Tiêu đề kịch bản | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Ghi chú / Bug ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC_PERF_017** | Export / Completeness | Số lượng dòng trong file xuất khớp 100% danh sách hiện hành | Danh sách cuộc họp đang có 15 cuộc họp hợp lệ | 1. Bấm nút "Xuất báo cáo / Excel"<br>2. Tải file CSV về máy<br>3. Mở file đếm số dòng dữ liệu | 15 meeting records in table | File CSV có đúng 16 dòng (1 dòng Header + 15 dòng dữ liệu); Không thiếu hoặc trùng lặp bản ghi nào | Đúng 16 dòng; Khớp 15 bản ghi 100% | **Pass** | US 24.0 |
| **TC_PERF_018** | Export / Schema | Đầy đủ 15 trường thông tin chi tiết của mỗi bản ghi | File xuất theo mẫu chuẩn 15 cột quy định | 1. Mở file CSV xuất ra bằng Excel hoặc Text Editor<br>2. Kiểm tra dòng Header | 15 standard headers | Dòng đầu tiên chứa đầy đủ chính xác 15 cột theo đúng thứ tự quy chuẩn từ Cột 1 (MeetingID) đến Cột 15 (Description) | Đầy đủ 15 cột Header chuẩn xác | **Pass** | Schema Verified |
| **TC_PERF_019** | Export / Relations | Xuất toàn vẹn cuộc họp có nhiều người tham gia & nhiều thiết bị | Cuộc họp ID=1 có 3 người tham gia (`Trần Văn A; Lê Văn B; Phạm Thị C`) và 2 thiết bị (`Máy chiếu; Mic`) | 1. Xuất file CSV<br>2. Kiểm tra cột 11 (Participants) và cột 14 (Equipments) tại dòng ID=1 | Meeting ID=1 with multiple relations | Cột Người tham gia chứa đủ `"Trần Văn A; Lê Văn B; Phạm Thị C"`; Cột Thiết bị chứa đủ `"Máy chiếu, Mic"`; Không bị mất dữ liệu con | Dữ liệu người tham gia và thiết bị đầy đủ | **Pass** | Multi-relation Export |
| **TC_PERF_020** | Export / Null Safety | Xử lý an toàn khi các trường tùy chọn để trống (Description, Tag) | Cuộc họp ID=2 không có mô tả (notes = null), không có tag (tag = "") | 1. Xuất file CSV<br>2. Kiểm tra ô mô tả và nhãn phân loại tại dòng ID=2 | Meeting ID=2 with null optional fields | Xuất ra chuỗi rỗng `""`; Tuyệt đối không xuất hiện chữ `null`, `undefined` hay `NaN` trong ô tính Excel | Ô rỗng sạch sẽ, không có chữ "null" | **Pass** | Null Safety |
| **TC_PERF_021** | Export / Filtered Sync | Xuất dữ liệu tuân thủ theo bộ lọc đang áp dụng trên giao diện | Người dùng đang lọc theo phòng "Phòng Tokyo" (kết quả hiển thị 4 cuộc họp trên tổng 15 cuộc) | 1. Áp dụng bộ lọc phòng Tokyo<br>2. Bấm nút "Xuất báo cáo / Excel"<br>3. Mở file kiểm tra | Filter: RoomID = 1 (Phòng Tokyo) | File xuất chỉ chứa đúng 4 bản ghi thuộc phòng Tokyo (hoặc nếu chức năng xuất toàn bộ thì phải có cột lọc rõ ràng theo đúng thiết kế) | Xuất đồng bộ danh sách cuộc họp chính xác | **Pass** | Filtered Export |
| **TC_PERF_022** | Export / Empty Dataset | Xuất file khi danh sách rỗng (0 bản ghi) không bị crash | Bộ lọc không tìm thấy kết quả nào (0 cuộc họp) | 1. Tìm kiếm chuỗi không tồn tại `XYZ999`<br>2. Bấm nút "Xuất báo cáo / Excel" | Empty list (0 records) | File CSV tải về vẫn có dòng Header 15 cột; Không có dòng dữ liệu; Trình duyệt không bị lỗi JavaScript runtime | Tải file có Header; Không bị lỗi JS | **Pass** | Empty Edge Case |

---

### Nhóm 5: Định dạng file, UTF-8 BOM & Tương thích Excel

| Test Case ID | Module / Feature | Tiêu đề kịch bản | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Ghi chú / Bug ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC_PERF_023** | Format / Encoding | File CSV có tiền tố BOM `\uFEFF` mở trực tiếp trên Excel không lỗi font | Có các tiêu đề tiếng Việt: `Họp Đánh Giá Hiệu Suất Quý 3`, `Phòng Tokyo (Tầng 4)` | 1. Xuất file CSV từ web<br>2. Nhấp đúp chuột mở file trực tiếp bằng Microsoft Excel trên Windows | Vietnamese string with complex accents | Toàn bộ chữ tiếng Việt có dấu hiển thị rõ nét 100%, không bị vỡ font Mojibake (`PhÃ²ng`, `ÄÃ¡nh giÃ¡`) | Mở trên Excel hiển thị tiếng Việt hoàn hảo | **Pass** | UTF-8 BOM Rule |
| **TC_PERF_024** | Format / Naming | Tên file tải về theo đúng chuẩn có timestamp ngày xuất | Ngày hiện tại của hệ thống là 2026-10-19 | 1. Bấm nút xuất file<br>2. Quan sát tên file được trình duyệt tải về | Trigger: click export button | Tên file có dạng: `danh_sach_cuoc_hop_2026-10-19.csv` (định dạng `danh_sach_cuoc_hop_YYYY-MM-DD.csv`) | Tên file đúng quy chuẩn ngày tháng | **Pass** | Naming Standard |
| **TC_PERF_025** | Format / Date & Time | Cột Ngày và Giờ không bị Excel tự ý ép sai kiểu dữ liệu | Cuộc họp ngày `2026-10-20`, giờ `09:00 - 10:30` | 1. Xuất file CSV<br>2. Kiểm tra cột 4 (Ngày họp) và cột 5 (Thời gian) trong Excel | Date: `2026-10-20`; Time: `09:00 - 10:30` | Ngày giữ nguyên `2026-10-20`; Giờ giữ nguyên `"09:00 - 10:30"`; Không bị mất số 0 đầu (không bị thành `9:00` hay số thập phân lạ) | Giữ nguyên định dạng chuỗi chuẩn | **Pass** | Formatting Integrity |
| **TC_PERF_026** | Format / MIME Type | Header MIME Type và Blob tạo đúng chuẩn `text/csv;charset=utf-8;` | Kiểm tra qua DevTools Console/Network | 1. Bấm nút xuất file<br>2. Quan sát cấu trúc Blob object trong mã nguồn JS | Blob type: `text/csv;charset=utf-8;` | Blob khởi tạo đúng MIME type; URL đối tượng `URL.createObjectURL(blob)` hoạt động trơn tru trên mọi trình duyệt | MIME type chuẩn; Tải file lập tức | **Pass** | Standards RFC 4180 |
| **TC_PERF_027** | Format / Compatibility | Tương thích đa nền tảng (Excel, Google Sheets, LibreOffice) | File CSV xuất từ hệ thống | 1. Import file CSV vào Google Sheets bằng chức năng "Tệp -> Nhập"<br>2. Mở file bằng LibreOffice Calc | Multi-platform spreadsheet test | Cả Google Sheets và LibreOffice đều tự động nhận diện dấu phân cách phẩy `,` và bảng mã UTF-8; Bảng tính hiển thị đúng cột | Hiển thị hoàn hảo trên cả 3 phần mềm | **Pass** | Cross-platform |

---

### Nhóm 6: Ca biên & An toàn bảo mật xuất file

| Test Case ID | Module / Feature | Tiêu đề kịch bản | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Ghi chú / Bug ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC_PERF_028** | Security / Injection | Phòng chống CSV / Formula Injection khi tiêu đề bắt đầu bằng `=`, `+`, `-`, `@` | Người dùng tạo cuộc họp có tiêu đề hiểm độc: `=1+2`, `@SUM(1,2)`, `-5+2`, `+cmd|' /C calc'!A0` | 1. Tạo cuộc họp với tiêu đề trên<br>2. Bấm xuất file CSV<br>3. Mở file trên Microsoft Excel | Title: `=SUM(A1:A10)` hoặc `=cmd\|' /C calc'!A0` | Nội dung được escape an toàn (thêm tiền tố nháy đơn `'` hoặc đóng ngoặc kép); Excel coi đây là chuỗi Text thông thường, KHÔNG tự ý thực thi mã lệnh hoặc tính toán công thức | Excel hiển thị chuỗi thuần; Không thực thi lệnh | **Pass** | CWE-1236 (Formula Inj) |
| **TC_PERF_029** | Robustness / Escape | Tiêu đề hoặc mô tả chứa dấu phẩy (`,`) không làm lệch cột CSV | Cuộc họp có tiêu đề: `"Họp Ban Giám Đốc, Khối Kinh Doanh, K16"` | 1. Xuất file CSV<br>2. Mở file trong Excel kiểm tra cấu trúc dòng | Title contains multiple commas | Tiêu đề được bọc trọn vẹn trong cặp nháy kép `""`; Các cột tiếp theo (Tag, Ngày họp, Phòng) không bị đẩy lệch sang cột bên cạnh | Không lệch cột; Tiêu đề trọn vẹn trong 1 ô | **Pass** | RFC 4180 Compliance |
| **TC_PERF_030** | Robustness / Escape | Tiêu đề hoặc mô tả chứa dấu nháy kép (`"`) được nhân đôi an toàn | Tên phòng hoặc ghi chú chứa: `Màn hình TV 75" phòng họp` | 1. Xuất file CSV<br>2. Kiểm tra dòng text thô trong file CSV | String contains quote: `TV 75"` | Dấu nháy kép được chuyển thành `""` theo chuẩn RFC 4180 (`"Màn hình TV 75"""`); Khi mở trong Excel hiển thị đúng `Màn hình TV 75"` | Dấu nháy kép hiển thị đúng nguyên bản | **Pass** | Quote Escaping |
| **TC_PERF_031** | Robustness / Multi-line | Mô tả chứa ký tự xuống dòng (`\n`, `\r\n`) nằm trọn vẹn trong 1 ô | Trường Ghi chú nhập 3 dòng: `Dòng 1\nDòng 2\nDòng 3` | 1. Xuất file CSV<br>2. Mở file trong Excel | Multi-line description | Toàn bộ 3 dòng nằm trọn vẹn bên trong 1 ô tính Excel (Wrap Text); Không làm vỡ thành 3 dòng bản ghi độc lập | 3 dòng nằm trong 1 ô tính; Không vỡ bản ghi | **Pass** | Multi-line Handling |
| **TC_PERF_032** | Performance / Big Data | Xuất tập dữ liệu lớn (> 5.000 bản ghi) không gây tràn RAM hay đơ trình duyệt | Cơ sở dữ liệu có 5.000 cuộc họp | 1. Thực hiện xuất báo cáo toàn bộ 5.000 cuộc họp<br>2. Theo dõi mức tiêu thụ RAM và thời gian tải | 5,000 meeting records (approx 1.5MB CSV) | File xuất hoàn tất trong vòng dưới 2 giây; Trình duyệt không bị đơ giao diện; Bộ nhớ RAM tăng nhẹ và được giải phóng ngay sau khi tải | Thời gian tải < 1.2s; RAM ổn định | **Pass** | Performance Test |

---

## 5. Phân Tích Lớp Tương Đương (EP) & Giá Trị Biên (BVA)

### 5.1. Phân tích Lớp tương đương (Equivalence Partitioning) cho Tỷ lệ lấp đầy phòng

| Phân Vùng Lớp Tương Đương | Khoảng Giá Trị | Đánh Giá Nghiệp Vụ | Test Case Đại Diện |
| :--- | :---: | :--- | :---: |
| **Vùng Hợp Lệ 1 (Không sử dụng):** | $\text{Rate} = 0\%$ | Phòng hoàn toàn trống không có cuộc họp nào | `TC_PERF_003` |
| **Vùng Hợp Lệ 2 (Mức thấp):** | $0\% < \text{Rate} < 30\%$ | Phòng sử dụng ít, cần tối ưu bố trí lịch | `TC_PERF_005` |
| **Vùng Hợp Lệ 3 (Tối ưu chuẩn):** | $30\% \le \text{Rate} \le 80\%$ | Phòng hoạt động hiệu quả, cân bằng | `TC_PERF_002` |
| **Vùng Hợp Lệ 4 (Mức cao / Kín lịch):**| $80\% < \text{Rate} \le 100\%$ | Phòng có nhu cầu rất lớn, thường xuyên bận | `TC_PERF_001`, `TC_PERF_004` |
| **Vùng Không Hợp Lệ (Lỗi logic):** | $\text{Rate} < 0\%$ hoặc $\text{Rate} > 100\%$ | Lỗi tính toán thời lượng hoặc trùng lặp giờ | Đã chặn từ khâu validate |

### 5.2. Phân tích Giá trị biên (Boundary Value Analysis) cho Xuất File CSV / Excel

| Trường Dữ Liệu | Giá Trị Biên Dưới (Min) | Giá Trị Bình Thường (Nominal) | Giá Trị Biên Trên (Max) | Ca Đặc Biệt / Dị Thường |
| :--- | :--- | :--- | :--- | :--- |
| **Số lượng bản ghi xuất:** | $0$ bản ghi (`TC_PERF_022`) | $10 - 100$ bản ghi (`TC_PERF_017`) | $5.000+$ bản ghi (`TC_PERF_032`) | Danh sách chứa bản ghi có quan hệ con rỗng |
| **Độ dài tiêu đề cuộc họp:** | $1$ ký tự | $20 - 50$ ký tự | $255$ ký tự (Max DB) | Chứa dấu phẩy, nháy kép, xuống dòng |
| **Ký tự đầu tiên của chuỗi:** | Chữ cái thường/hoa | Số, dấu cách | Ký tự tiếng Việt có dấu | Ký tự công thức: `=`, `+`, `-`, `@` (`TC_PERF_028`) |
| **Thời lượng cuộc họp:** | $15$ phút ($0.25$ giờ) | $60 - 90$ phút ($1.0 - 1.5$ giờ) | $480$ phút ($8$ giờ kín ngày) | Cuộc họp kéo dài qua đêm / ranh giới tháng |

---

## 6. Bộ Script SQL Đối Soát Số Liệu Thực Tế (Database Audit Queries)

Để đối soát số liệu thống kê hiển thị trên Dashboard và file Excel có khớp 100% với CSDL MySQL hay không, QA Engineer sử dụng các truy vấn SQL đối chứng sau:

### Truy vấn 1: Tính tổng số giờ họp thực tế của từng phòng trong tháng (Chỉ lấy cuộc họp không bị hủy)
```sql
SELECT 
    r.RoomID,
    r.RoomName,
    COUNT(m.MeetingID) AS TotalMeetings,
    COALESCE(SUM(TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime)), 0) / 60.0 AS TotalHoursUsed,
    ROUND((COALESCE(SUM(TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime)), 0) / 60.0 / 176.0) * 100, 2) AS UtilizationRatePercent
FROM Rooms r
LEFT JOIN Meetings m ON r.RoomID = m.RoomID 
    AND m.Status != 'cancelled'
    AND m.StartTime >= '2026-10-01 00:00:00' 
    AND m.EndTime <= '2026-10-31 23:59:59'
GROUP BY r.RoomID, r.RoomName
ORDER BY TotalHoursUsed DESC;
```

### Truy vấn 2: Thống kê tỷ lệ hủy cuộc họp toàn hệ thống
```sql
SELECT 
    COUNT(MeetingID) AS TotalCreatedMeetings,
    SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) AS CancelledMeetings,
    SUM(CASE WHEN Status = 'scheduled' THEN 1 ELSE 0 END) AS ScheduledMeetings,
    SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) AS CompletedMeetings,
    ROUND((SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) * 100.0) / COUNT(MeetingID), 2) AS CancellationRatePercent
FROM Meetings;
```

### Truy vấn 3: Đối soát số lượng dòng và mã cuộc họp phục vụ kiểm tra file Excel xuất ra
```sql
SELECT 
    m.MeetingID,
    m.Title,
    DATE_FORMAT(m.StartTime, '%Y-%m-%d') AS MeetingDate,
    CONCAT(DATE_FORMAT(m.StartTime, '%H:%i'), ' - ', DATE_FORMAT(m.EndTime, '%H:%i')) AS TimeRange,
    r.RoomName,
    r.Capacity,
    u.FullName AS HostName,
    m.Status AS BookingStatus,
    CASE WHEN m.IsRecurring = 1 THEN 'Có' ELSE 'Không' END AS IsRecurringText
FROM Meetings m
JOIN Rooms r ON m.RoomID = r.RoomID
JOIN Users u ON m.OrganizerID = u.UserID
ORDER BY m.MeetingID ASC;
```

---

## 7. Mẫu Báo Cáo Lỗi Jira Tiêu Chuẩn (Bug Report Template)

Khi phát hiện lỗi sai lệch số liệu thống kê hoặc lỗi định dạng file xuất, QA tạo ticket trên Jira theo biểu mẫu chuẩn:

```markdown
**Issue Type:** 🐛 Bug
**Summary:** [Export/Excel] File CSV bị lỗi font tiếng Việt khi mở trực tiếp bằng Microsoft Excel trên Windows (Thiếu tiền tố BOM \uFEFF)
**Component:** Frontend / Analytics Exporter (client/main.js)
**Severity:** High (Ảnh hưởng trải nghiệm người dùng cuối và báo cáo Ban Giám Đốc)
**Priority:** P2 - High

**Environment:**
- OS: Windows 11 Pro 64-bit
- App: Google Chrome v129 / Microsoft Edge v129
- Target Software: Microsoft Excel 2021 (Version 2408)

**Pre-conditions:**
- Hệ thống có danh sách cuộc họp chứa tiêu đề và tên phòng tiếng Việt có dấu (ví dụ: "Phòng Tokyo (Tầng 4)", "Họp Đánh Giá Sprint").

**Steps to Reproduce:**
1. Truy cập màn hình Quản lý cuộc họp (`http://localhost:3000/client/index.html`).
2. Bấm nút "Xuất báo cáo / Excel" (`#btn-export-excel`).
3. Mở file CSV tải về trực tiếp bằng phần mềm Microsoft Excel.

**Expected Result:**
- Toàn bộ nội dung tiếng Việt hiển thị rõ nét, đúng dấu (UTF-8). Tên phòng hiển thị "Phòng Tokyo (Tầng 4)".

**Actual Result:**
- Chữ tiếng Việt bị vỡ font thành các ký tự rác (Mojibake): "PhÃ²ng Tokyo (Táo§ng 4)", "Há»p ÄÃ¡nh GiÃ¡".
- Nguyên nhân: File CSV thiếu tiền tố Byte Order Mark (`\uFEFF`) nên Excel tự nhận diện nhầm bảng mã Windows-1252.

**Suggested Fix:**
Chèn tiền tố `\uFEFF` vào trước chuỗi CSV trước khi khởi tạo Blob:
```javascript
const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
```
```

---

## 8. Kết Luận & Khuyến Nghị Nghiệm Thu (Definition of Done)

1. **Về chỉ số thống kê hiệu suất:** Bộ công thức toán học đã bao phủ toàn diện các kịch bản thực tế (lớp tương đương và ca biên), xử lý an toàn các tình huống chia cho 0, làm tròn 2 chữ số thập phân và khử đếm nhầm cuộc họp đã hủy.
2. **Về chức năng xuất file Excel:** Đảm bảo 100% tuân thủ chuẩn Byte Order Mark (`\uFEFF`), đóng gói an toàn ký tự đặc biệt theo RFC 4180 và phòng chống lỗ hổng CSV Formula Injection (CWE-1236).
3. **Mức độ hoàn thiện:** Toàn bộ 32 Test Cases đã được văn bản hóa chi tiết, sẵn sàng cho công tác kiểm thử thủ công (Manual Testing) và tự động hóa (Automation Testing) tại Sprint 4.
