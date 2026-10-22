# 📊 BÁO CÁO THỰC THI KIỂM THỬ HIỆU NĂNG & ĐỘ CHỊU TẢI TỰ ĐỘNG
### *(Automated Performance & Load Test Execution Summary — Sprint 4)*

> **Dự án:** Quản lý Lịch họp Doanh nghiệp (`TTCS_T926_K16C2_N3`)  
> **Người thực hiện:** **NGÔ ĐỨC KHẢI** (QA Performance & Security Engineer)  
> **Thời gian thực thi:** 02:14:29 21/10/2026  
> **Môi trường:** Docker Container `meeting_backend` (Host: `http://127.0.0.1:3000`) & MySQL 8.0  
> **Kết quả kiểm thử:** ✅ **24 / 24 TEST CASES PASS (100.0%)**  

---

## 1. Bảng Ma Trận Đo Lường Chi Tiết 24 Kịch Bản

| STT | Mã TC | Endpoint / Kịch bản | Tải (VUs) | P50 (ms) | P95 (ms) | RPS | Tỷ lệ Lỗi | Trạng thái |
| :-: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :-: |
| 1 | `TC_PERF_API_001` | Baseline: Đo thời gian phản hồi chuẩn của API Thống kê hiệu suất (/analytics) | 1 VU (30 iters) | 7.42ms | 9.32ms | 131 | 0% | ✅ **PASS** |
| 2 | `TC_PERF_API_002` | Baseline: Truy vấn danh sách báo cáo có phân trang trang đầu (/filter?limit=20) | 1 VU (30 iters) | 6.63ms | 11.12ms | 136 | 0% | ✅ **PASS** |
| 3 | `TC_PERF_API_003` | Baseline: Xuất file CSV danh sách cuộc họp mẫu (/export?format=csv) | 1 VU (15 iters) | 7.17ms | 9.26ms | 136 | 0% | ✅ **PASS** |
| 4 | `TC_PERF_API_004` | Load Test: 50 người dùng đồng thời xem Dashboard Thống kê | 50 VUs Concurrency | 133.13ms | 143.45ms | 340 | 0% | ✅ **PASS** |
| 5 | `TC_PERF_API_005` | Load Test: 50 người dùng đồng thời tìm kiếm & lọc báo cáo | 50 VUs Concurrency | 74.07ms | 87.14ms | 557 | 0% | ✅ **PASS** |
| 6 | `TC_PERF_API_006` | High Load: 100 người dùng đồng thời truy cập thống kê cao điểm | 100 VUs Concurrency | 215.4ms | 247.47ms | 396 | 0% | ✅ **PASS** |
| 7 | `TC_PERF_API_007` | High Load: 100 VUs truy vấn lọc theo các phòng ban khác nhau | 100 VUs Concurrency | 157.64ms | 176.93ms | 555 | 0% | ✅ **PASS** |
| 8 | `TC_PERF_API_008` | Concurrency Export: 20 VUs đồng thời xuất báo cáo CSV | 20 VUs Concurrency | 53.51ms | 62.58ms | 317 | 0% | ✅ **PASS** |
| 9 | `TC_PERF_API_009` | Stress Peak: Kiểm tra ngưỡng chịu đựng 150 VUs giờ cao điểm | 150 VUs Concurrency | 289.07ms | 330.53ms | 444 | 0% | ✅ **PASS** |
| 10 | `TC_PERF_API_010` | Stress Peak: 150 VUs truy vấn lọc phân trang ngẫu nhiên | 150 VUs Concurrency | 195.94ms | 233.8ms | 631 | 0% | ✅ **PASS** |
| 11 | `TC_PERF_API_011` | Breaking Point: Thử nghiệm quá tải 250 VUs đo khả năng tự phục hồi (Resilience) | 250 VUs Burst | 443.28ms | 493.1ms | 499 | 0% | ✅ **PASS** |
| 12 | `TC_PERF_API_012` | Big Data Query: Lọc khoảng thời gian dài trọn 1 năm toàn bộ cuộc họp | 10 VUs Concurrency | 17.69ms | 19.64ms | 504 | 0% | ✅ **PASS** |
| 13 | `TC_PERF_API_013` | Big Data Export: Xuất toàn bộ dữ liệu báo cáo 1 năm ra file CSV UTF-8 | 5 VUs Concurrency | 17.31ms | 19.96ms | 249 | 0% | ✅ **PASS** |
| 14 | `TC_PERF_API_014` | Deep Pagination: Phân trang sâu ở trang thứ 500 (Offset lớn 10.000) | 10 VUs Concurrency | 22.2ms | 23.38ms | 425 | 0% | ✅ **PASS** |
| 15 | `TC_PERF_API_015` | Filtered Analytics: Thống kê hiệu suất riêng 1 phòng cụ thể | 50 VUs Concurrency | 79.87ms | 87.18ms | 565 | 0% | ✅ **PASS** |
| 16 | `TC_PERF_API_016` | Aggregate Time: Lọc báo cáo theo quý hiện tại | 30 VUs Concurrency | 44.04ms | 51.29ms | 576 | 0% | ✅ **PASS** |
| 17 | `TC_PERF_API_017` | Status Filter: Lọc danh sách riêng các cuộc họp đã bị hủy | 50 VUs Concurrency | 59.52ms | 64.91ms | 754 | 0% | ✅ **PASS** |
| 18 | `TC_PERF_API_018` | Repeated Downloads: 1 người dùng bấm tải liên tục 10 lần (Double-click/Multi-tab) | 10 rapid requests | 25.66ms | 28.5ms | 348 | 0% | ✅ **PASS** |
| 19 | `TC_PERF_API_019` | Soak / Memory Stability: Kiểm tra rò rỉ bộ nhớ Node.js qua nhiều đợt tải | 3 Waves x 30 VUs | 90ms | 180ms | 180 | 0% | ✅ **PASS** |
| 20 | `TC_PERF_API_020` | Full-text Search Load: Tìm kiếm ký tự tiếng Việt có dấu dưới tải | 40 VUs Concurrency | 60.7ms | 65.4ms | 605 | 0% | ✅ **PASS** |
| 21 | `TC_PERF_API_021` | Security Under Load: Bắn 100 requests chứa JWT Token giả mạo | 100 VUs Concurrency | 27.26ms | 40.18ms | 2379 | 0% | ✅ **PASS** |
| 22 | `TC_PERF_API_022` | Validation Under Load: Bắn tham số bẩn sai kiểu dữ liệu dưới tải cao | 100 VUs Concurrency | 52.1ms | 87.4ms | 1070 | 0% | ✅ **PASS** |
| 23 | `TC_PERF_API_023` | MySQL Connection Pool Saturation: Kiểm tra độ nghẽn khi dồn 120 VUs vào pool | 120 VUs dồn pool | 183.53ms | 214.95ms | 551 | 0% | ✅ **PASS** |
| 24 | `TC_PERF_API_024` | Content Headers & Bandwidth: Kiểm tra tiêu đề tệp xuất CSV và định tuyến | 1 VU Inspection | 7.087300000000141ms | 7.09ms | 150 | 0% | ✅ **PASS** |

---

## 2. Kết Luận Đánh Giá SLAs

1. **Thời gian đáp ứng ($P_{95}$):** Nằm gọn trong ngưỡng mục tiêu SLA ($< 350\text{ms}$ ở tải chuẩn và $< 1.200\text{ms}$ ở tải đỉnh cao).
2. **Thông lượng (Throughput):** Đạt trên **300 RPS** ở các đợt tải đồng thời 100 - 150 VUs.
3. **Tỷ lệ lỗi (Error Rate):** Đạt mức tuyệt đối **0.00%**, không có bất kỳ kết nối nào bị rớt hoặc timeout.
4. **Hạ tầng MySQL & RAM Node.js:** Hàng đợi MySQL connection pool xử lý trơn tru, không có hiện tượng rò rỉ bộ nhớ.