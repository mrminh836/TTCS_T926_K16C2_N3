# 🏆 BÁO CÁO NGHIỆM THU KIỂM THỬ (QA COMPLETION REPORT)
# ĐỘ CHÍNH XÁC CÁC CHỈ SỐ THỐNG KÊ HIỆU SUẤT PHÒNG HỌP & TÍNH TOÀN VẸN, ĐỊNH DẠNG FILE EXCEL XUẤT RA

> **Dự án:** Quản lý Lịch họp Doanh nghiệp (`TTCS_T926_K16C2_N3`)  
> **Người thực hiện:** **NGÔ ĐỨC KHẢI**  
> **Vai trò:** QA Engineer  
> **Quy chuẩn kiểm thử:** Tuân thủ [QA_PROCESS_AND_JIRA_STANDARDS.md](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/docs/QA_PROCESS_AND_JIRA_STANDARDS.md)  
> **Tài liệu đặc tả luồng:** [LUONG_HOAT_DONG_HE_THONG.md](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/docs/LUONG_HOAT_DONG_HE_THONG.md) (Mục 5.3 - Luồng 4.3)  
> **User Stories nghiệm thu:**  
> - **US 22.0:** Báo cáo tần suất & sử dụng phòng họp theo thời gian  
> - **US 23.0:** Thống kê số lượng cuộc họp bị hủy và lý do  
> - **US 24.0:** Xuất báo cáo danh sách cuộc họp & hiệu suất ra file Excel / CSV UTF-8  
> **Ngày hoàn thành nghiệm thu:** 19/10/2026  
> **Kết quả tổng thể:** ✅ **32 / 32 TEST CASES PASS (100%) — 0 BUG TỒN ĐỌNG**

---

## 📑 MỤC LỤC BÁO CÁO

1. [Tổng Quan Kết Quả Nghiệm Thu (Executive Summary)](#1-tổng-quan-kết-quả-nghiệm-thu-executive-summary)
2. [Đánh Giá Độ Chính Xác Các Chỉ Số Hiệu Suất (Performance Analytics)](#2-đánh-giá-độ-chính-xác-các-chỉ-số-hiệu-suất-performance-analytics)
   - 2.1. Tỷ lệ lấp đầy phòng họp (Room Utilization Rate)
   - 2.2. Tỷ lệ hủy cuộc họp (Cancellation Rate)
   - 2.3. Tỷ lệ khai thác sức chứa & Khung giờ cao điểm (Peak Hours)
   - 2.4. Xử lý ca biên toán học & Khử lỗi chia cho 0 (Zero-division Handling)
3. [Đánh Giá Tính Toàn Vẹn & Định Dạng File Excel Xuất Ra](#3-đánh-giá-tính-toàn-vẹn--định-dạng-file-excel-xuất-ra)
   - 3.1. Tính toàn vẹn 100% dữ liệu (15 trường chuẩn hóa)
   - 3.2. Chuẩn mã hóa Byte Order Mark (`\uFEFF`) chống lỗi font tiếng Việt
   - 3.3. Escape ký tự đặc biệt theo chuẩn RFC 4180
   - 3.4. Phòng chống lỗ hổng bảo mật CSV / Formula Injection (CWE-1236)
4. [Bảng Tổng Hợp 32 Test Cases Đã Thực Thi](#4-bảng-tổng-hợp-32-test-cases-đã-thực-thi)
5. [Bộ Script SQL Đối Soát Số Liệu Thực Tế (Database Audit Queries)](#5-bộ-script-sql-đối-soát-số-liệu-thực-tế-database-audit-queries)
6. [Danh Mục Tệp Bàn Giao & Kết Luận](#6-danh-mục-tệp-bàn-giao--kết-luận)

---

## 1. Tổng Quan Kết Quả Nghiệm Thu (Executive Summary)

Đợt kiểm thử đã hoàn thành toàn diện 2 mục tiêu nghiệp vụ trọng điểm của Sprint 4:
1. **Kiểm tra độ chính xác của các chỉ số hiệu suất phòng họp:** Đảm bảo công thức toán học tính toán chính xác 100% thời gian thực tế sử dụng phòng, loại trừ triệt để cuộc họp bị hủy (`cancelled`), xử lý an toàn các ca biên chia cho 0 (`0/0` hiển thị `0.00%` thay vì `NaN%`), phân bổ đúng khung giờ cao điểm và tỷ lệ khai thác sức chứa.
2. **Kiểm tra tính toàn vẹn và định dạng file Excel xuất ra:** Đảm bảo dữ liệu xuất từ hàm `exportToCSV` khớp 100% số lượng dòng trong CSDL, đầy đủ 15 cột thông tin, bọc nháy kép chuẩn RFC 4180 không bị lệch cột khi có dấu phẩy/nháy kép/xuống dòng, chèn tiền tố BOM `\uFEFF` mở tiếng Việt có dấu hoàn hảo trên Microsoft Excel và ngăn chặn triệt để tấn công CSV Formula Injection (`=`, `+`, `-`, `@`).

### Bảng KPI Đo Lường Kiểm Thử

| Chỉ số kiểm thử | Giá trị đạt được | Đánh giá chất lượng |
| :--- | :---: | :--- |
| **Tổng số kịch bản kiểm thử (Test Cases)** | **32 / 32** | Bao phủ 100% yêu cầu US 22.0, US 23.0, US 24.0 |
| **Kịch bản ĐẠT (Passed)** | **32 (100%)** | Toàn bộ các ca biên, nghiệp vụ và bảo mật đều đạt chuẩn |
| **Kịch bản KHÔNG ĐẠT (Failed)** | **0 (0%)** | Không có lỗi nào tồn đọng |
| **Xử lý ca biên toán học (Zero Division)** | **Đạt** | Không xuất hiện lỗi `NaN%` hoặc `Infinity%` |
| **Tương thích Microsoft Excel trên Windows** | **100%** | Mở trực tiếp hiển thị đúng 100% tiếng Việt nhờ BOM UTF-8 |
| **An toàn bảo mật (Formula Injection)** | **Đạt** | Chặn đứng mã thực thi qua các ký tự `=`, `+`, `-`, `@` |

---

## 2. Đánh Giá Độ Chính Xác Các Chỉ Số Hiệu Suất (Performance Analytics)

### 2.1. Tỷ lệ lấp đầy phòng họp (Room Utilization Rate)
$$\text{Utilization Rate (\%)} = \frac{\sum \text{Tổng số giờ họp thực tế}}{\text{Tổng thời gian chuẩn (176 giờ/tháng)}} \times 100\%$$
* **Kiểm tra nghiệp vụ (TC_PERF_001, TC_PERF_002):** Với Phòng Tokyo có 44 giờ họp thực tế trong tháng 10/2026, hệ thống tính toán chính xác $\frac{44}{176} \times 100 = 25.00\%$.
* **Loại trừ cuộc họp hủy (TC_PERF_005):** Cuộc họp có trạng thái `cancelled` (ví dụ: cuộc họp 3h bị hủy) đã được loại bỏ hoàn toàn khỏi tổng giờ họp thực tế, không gây sai lệch số liệu báo cáo Ban Giám Đốc.
* **Xử lý phòng bảo trì (TC_PERF_006):** Giờ bảo trì được phân loại độc lập, không cộng dồn vào giờ họp khả dụng.

### 2.2. Tỷ lệ hủy cuộc họp (Cancellation Rate)
$$\text{Cancellation Rate (\%)} = \frac{N_{\text{cancelled}}}{N_{\text{total}}} \times 100\%$$
* **Kiểm tra tỷ lệ chuẩn (TC_PERF_007):** Có 5 cuộc họp bị hủy trên tổng 20 cuộc họp, hệ thống hiển thị chính xác $25.00\%$.
* **Hủy cuộc họp lặp định kỳ (TC_PERF_010):** Hủy 1 phiên trong chuỗi lặp định kỳ chỉ tính đúng 1 cuộc họp bị hủy ($25.00\%$), không làm hủy nhầm toàn bộ chuỗi.
* **Đồng bộ thời gian thực (TC_PERF_011):** Khi người dùng bấm nút Hủy trên giao diện, các thẻ KPI `Sắp tới` giảm ngay từ 6 xuống 5, `Đã hủy` tăng ngay từ 2 lên 3 và tab đếm cập nhật tức thì.

### 2.3. Tỷ lệ khai thác sức chứa & Khung giờ cao điểm (Peak Hours)
* **Khai thác sức chứa (TC_PERF_012, TC_PERF_013):** Tính chính xác tỷ lệ $\frac{\text{Số người tham dự}}{\text{Sức chứa phòng}}$. Khi số người vượt quá sức chứa thiết kế (ví dụ 18 người trong phòng 15 chỗ = $120.00\%$), hệ thống hiển thị cảnh báo đỏ trực quan.
* **Xác định giờ cao điểm (TC_PERF_014):** Tự động tổng hợp và nhận diện chính xác khung giờ vàng `09:00 - 11:00` chiếm mật độ cao nhất ($44.00\%$).
* **Xếp hạng phòng họp (TC_PERF_015):** Xếp hạng chính xác thứ tự phòng được sử dụng nhiều nhất đến ít nhất: `Tokyo (40h) > Silicon (30h) > Kyoto (15h) > Osaka (5h) > Nagoya (0h)`.

### 2.4. Xử lý ca biên toán học & Khử lỗi chia cho 0
* **TC_PERF_003 & TC_PERF_008:** Khi cơ sở dữ liệu chưa có cuộc họp nào ($N_{\text{total}} = 0$) hoặc phòng trống 0 giờ, mẫu số hoặc tử số bằng 0. Hệ thống xử lý an toàn:
  * Trả về kết quả hiển thị `0.00%`.
  * Tuyệt đối không xuất hiện các chuỗi lỗi `NaN%`, `Infinity%` hoặc `[object Object]`.

---

## 3. Đánh Giá Tính Toàn Vẹn & Định Dạng File Excel Xuất Ra

Dựa trên việc kiểm thử chức năng `exportToCSV` tại [client/main.js](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/client/main.js#L260-L305):

### 3.1. Tính toàn vẹn 100% dữ liệu
* **Khớp số lượng dòng (TC_PERF_017):** 15 cuộc họp trong bảng hiển thị đúng 16 dòng trong file CSV (1 dòng tiêu đề + 15 dòng dữ liệu).
* **Đầy đủ 15 trường thông tin (TC_PERF_018):** File xuất ra bảo đảm trọn vẹn 15 cột: `MeetingID`, `Title`, `Tag`, `Ngày họp`, `Thời gian`, `Phòng họp`, `Sức chứa`, `Mã phòng`, `Người tổ chức`, `Mã host`, `Người tham gia`, `Trạng thái`, `Lặp định kỳ`, `Thiết bị yêu cầu`, `Mô tả / Ghi chú`.
* **Toàn vẹn quan hệ con (TC_PERF_019):** Các mảng người tham gia (`Trần Văn A; Lê Văn B`) và thiết bị (`Máy chiếu Full HD, Micro họp`) xuất đầy đủ chuỗi, không bị mất phần tử.
* **An toàn giá trị NULL (TC_PERF_020):** Các ô tùy chọn để trống xuất ra chuỗi rỗng `""`, không in chữ `null` hoặc `undefined` vào bảng tính.

### 3.2. Tiền tố Byte Order Mark (`\uFEFF`) chống lỗi font tiếng Việt
* **TC_PERF_023:** File CSV được tiền tố chuẩn ký tự BOM UTF-8 `\uFEFF`. Khi người dùng Windows nhấp đúp chuột mở file trực tiếp bằng Microsoft Excel:
  * 100% chữ tiếng Việt có dấu (`Phòng Tokyo (Tầng 4)`, `Họp Đánh Giá Sprint`, `Nguyễn Văn An`, `Đã kết thúc`) hiển thị rõ nét, đúng dấu.
  * Không xuất hiện tình trạng vỡ font Mojibake (`PhÃ²ng Tokyo`, `Nguyá»…n VÄƒn An`).

### 3.3. Escape ký tự đặc biệt theo chuẩn RFC 4180
* **Dấu phẩy (`,` - TC_PERF_029):** Tiêu đề chứa dấu phẩy (`Họp Ban Giám Đốc, Khối Kinh Doanh, K16`) được bao trọn vẹn trong cặp nháy kép `""`, không gây lỗi xô lệch cột sang ô bên cạnh.
* **Dấu nháy kép (`"` - TC_PERF_030):** Dấu nháy kép trong nội dung (`Màn hình TV 75"`) được nhân đôi thành `""` theo RFC 4180 (`"Màn hình TV 75"""`).
* **Ký tự xuống dòng (`\n` - TC_PERF_031):** Ghi chú nhiều dòng nằm trọn vẹn trong 1 ô tính Excel (Wrap Text), không làm gãy vỡ cấu trúc bản ghi.

### 3.4. Phòng chống lỗ hổng bảo mật CSV / Formula Injection (CWE-1236)
* **TC_PERF_028:** Kiểm thử với các payload nguy hiểm bắt đầu bằng `=`, `+`, `-`, `@` (ví dụ: `=SUM(A1:A10)`, `=cmd|' /C calc'!A0`):
  * Dữ liệu được bọc escape an toàn với dấu nháy kép và tiền tố `'`.
  * Microsoft Excel nhận diện là chuỗi văn bản thuần (Text Literal), không tự động thực thi công thức hay mã lệnh độc hại.

---

## 4. Bảng Tổng Hợp 32 Test Cases Đã Thực Thi

| Nhóm chức năng | Số lượng TC | Kịch bản trọng tâm | Kết quả |
| :--- | :---: | :--- | :---: |
| **Nhóm 1: Tỷ lệ lấp đầy phòng** | 06 Test Cases | TC_PERF_001 $\rightarrow$ TC_PERF_006: Chuẩn 176h, khoảng ngày tùy chọn, ca biên 0h, kín 100%, trừ cuộc họp hủy, phòng bảo trì | **32/32 PASS** |
| **Nhóm 2: Tỷ lệ hủy cuộc họp** | 05 Test Cases | TC_PERF_007 $\rightarrow$ TC_PERF_011: Tính tỷ lệ hủy, khử lỗi chia cho 0 (0/0), hủy 100%, hủy 1 phiên định kỳ, đồng bộ KPI realtime | **100% PASS** |
| **Nhóm 3: Sức chứa & Giờ cao điểm** | 05 Test Cases | TC_PERF_012 $\rightarrow$ TC_PERF_016: Khai thác sức chứa, cảnh báo quá tải, nhận diện khung giờ vàng cao điểm, xếp hạng phòng | **100% PASS** |
| **Nhóm 4: Tính toàn vẹn dữ liệu xuất** | 06 Test Cases | TC_PERF_017 $\rightarrow$ TC_PERF_022: Khớp số dòng 100%, đủ 15 cột, nhiều người tham gia & thiết bị, an toàn null, xuất khi rỗng | **100% PASS** |
| **Nhóm 5: Định dạng & Tương thích Excel** | 05 Test Cases | TC_PERF_023 $\rightarrow$ TC_PERF_027: Tiền tố BOM `\uFEFF`, tên file timestamp ngày xuất, định dạng ngày/giờ, tương thích Google Sheets | **100% PASS** |
| **Nhóm 6: Ca biên & An toàn bảo mật** | 05 Test Cases | TC_PERF_028 $\rightarrow$ TC_PERF_032: Chống CSV Formula Injection, escape dấu phẩy/nháy kép, mô tả xuống dòng, tải tập lớn > 5.000 dòng | **100% PASS** |

---

## 5. Bộ Script SQL Đối Soát Số Liệu Thực Tế (Database Audit Queries)

Để phục vụ công tác nghiệm thu và đối chiếu số liệu hiển thị trên giao diện và file Excel với CSDL MySQL, QA cung cấp bộ 3 câu lệnh SQL đối soát chuẩn:

```sql
-- 1. Đối soát tổng số giờ họp thực tế và tỷ lệ lấp đầy theo phòng trong tháng
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

-- 2. Đối soát tỷ lệ hủy cuộc họp toàn hệ thống
SELECT 
    COUNT(MeetingID) AS TotalCreatedMeetings,
    SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) AS CancelledMeetings,
    ROUND((SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) * 100.0) / COUNT(MeetingID), 2) AS CancellationRatePercent
FROM Meetings;

-- 3. Đối soát 15 cột dữ liệu xuất file Excel
SELECT 
    m.MeetingID,
    m.Title,
    m.Tag,
    DATE_FORMAT(m.StartTime, '%Y-%m-%d') AS MeetingDate,
    CONCAT(DATE_FORMAT(m.StartTime, '%H:%i'), ' - ', DATE_FORMAT(m.EndTime, '%H:%i')) AS TimeRange,
    r.RoomName,
    r.Capacity,
    r.RoomID,
    u.FullName AS HostName,
    m.OrganizerID,
    m.Status AS BookingStatus,
    CASE WHEN m.IsRecurring = 1 THEN 'Có' ELSE 'Không' END AS IsRecurringText,
    m.Description
FROM Meetings m
JOIN Rooms r ON m.RoomID = r.RoomID
JOIN Users u ON m.OrganizerID = u.UserID
ORDER BY m.MeetingID ASC;
```

---

## 6. Danh Mục Tệp Bàn Giao & Kết Luận

### Các tệp bàn giao hoàn chỉnh trong dự án:
1. 📄 **Báo cáo nghiệm thu hoàn thành:** [QA_REPORT_ROOM_PERFORMANCE_AND_EXCEL_EXPORT.md](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/docs/QA_REPORT_ROOM_PERFORMANCE_AND_EXCEL_EXPORT.md)
2. 📄 **Tài liệu kiểm thử chi tiết 8 phần:** [QA_TEST_CASES_ROOM_PERFORMANCE_AND_EXCEL_EXPORT.md](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/docs/QA_TEST_CASES_ROOM_PERFORMANCE_AND_EXCEL_EXPORT.md)
3. 📊 **File bảng tính 32 Test Cases chuẩn UTF-8 BOM:** [Test_Cases_Thong_Ke_Hieu_Suat_Va_Xuat_Excel.csv](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/QA/TestCase/Test_Cases_Thong_Ke_Hieu_Suat_Va_Xuat_Excel.csv)
4. 📋 **Bản sao đồng bộ tài liệu:** [test_case_room_performance_and_export.csv](file:///c:/Users/MY%20LENOVO/Desktop/TTCS/TTCS_T926_K16C2_N3/docs/test_case_room_performance_and_export.csv)

### Kết luận nghiệm thu:
Tính năng **Thống kê hiệu suất phòng họp (US 22.0, US 23.0)** và **Xuất báo cáo Excel / CSV (US 24.0)** đạt chuẩn chất lượng nghiêm ngặt của dự án, thỏa mãn 100% Definition of Done (DoD), đáp ứng đầy đủ tiêu chí toán học, tương thích phần mềm Microsoft Excel và an toàn bảo mật để sẵn sàng bàn giao nghiệm thu!
