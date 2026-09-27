-- =====================================================================
-- MIGRATION: 01_create_rooms_table.sql
-- Mô tả: Khởi tạo bảng Rooms chuẩn 3NF, chỉ mục tối ưu và dữ liệu mẫu ban đầu
-- Dự án: Hệ thống Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
-- =====================================================================

-- 1. Tạo bảng Rooms (hoặc nâng cấp cấu trúc nếu đã tồn tại)
CREATE TABLE IF NOT EXISTS Rooms (
    RoomID INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính định danh phòng họp',
    RoomCode VARCHAR(50) NOT NULL COMMENT 'Mã phòng duy nhất (vd: RM-001)',
    RoomName VARCHAR(100) NOT NULL COMMENT 'Tên phòng họp (vd: Phòng Tokyo)',
    Capacity INT NOT NULL COMMENT 'Sức chứa tối đa (chỗ ngồi)',
    Type VARCHAR(50) DEFAULT 'Hội nghị' COMMENT 'Phân loại phòng (Hội nghị, Nhóm / Tech, Hội trường lớn, Đại sảnh / Board, VIP)',
    Floor VARCHAR(100) DEFAULT NULL COMMENT 'Vị trí tầng / tòa nhà',
    Status VARCHAR(50) DEFAULT 'Active' COMMENT 'Trạng thái hoạt động (Active, Maintenance, Inactive)',
    QRCode VARCHAR(255) DEFAULT NULL COMMENT 'Mã QR phục vụ check-in nhanh',
    Description TEXT DEFAULT NULL COMMENT 'Mô tả chi tiết trang thiết bị và đặc điểm',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm khởi tạo phòng',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',

    -- Chỉ mục ràng buộc duy nhất và chỉ mục truy vấn tối ưu
    UNIQUE KEY uq_rooms_code (RoomCode),
    UNIQUE KEY uq_rooms_name (RoomName),
    INDEX idx_rooms_status_capacity (Status, Capacity),
    INDEX idx_rooms_type (Type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục phòng họp doanh nghiệp';

-- 2. Dữ liệu hạt giống ban đầu (Seed Data)
INSERT INTO Rooms (RoomID, RoomCode, RoomName, Capacity, Type, Floor, Status, QRCode, Description)
VALUES
    (1, 'RM-001', 'Phòng Tokyo (Tầng 4)', 20, 'Hội nghị', 'Tầng 4, Tòa A', 'Active', 'QR-ROOM-001', 'Phòng hội thảo tiêu chuẩn cao, view thoáng, cách âm tốt, chuyên tổ chức họp ban giám đốc và đối tác.'),
    (2, 'RM-002', 'Phòng Silicon (Tầng 2)', 12, 'Nhóm / Tech', 'Tầng 2, Tòa B', 'Active', 'QR-ROOM-002', 'Thiết kế mở theo phong cách Silicon Valley, trang bị màn hình tương tác và bảng viết brainstorming.'),
    (3, 'RM-003', 'Phòng Hội Nghị A', 30, 'Hội trường lớn', 'Tầng 1, Tòa Trung tâm', 'Active', 'QR-ROOM-003', 'Hội trường lớn phù hợp cho họp toàn công ty, hội thảo khách hàng, đào tạo nhân sự định kỳ.'),
    (4, 'RM-004', 'Phòng Grand Board', 50, 'Đại sảnh / Board', 'Tầng 5, Tòa A', 'Maintenance', 'QR-ROOM-004', 'Đang nâng cấp hệ thống âm thanh vòm và điều hòa trung tâm.'),
    (5, 'RM-005', 'Phòng VIP', 10, 'VIP / Phỏng vấn', 'Tầng 3, Tòa VIP', 'Active', 'QR-ROOM-005', 'Phòng tiếp đón đối tác cao cấp, phỏng vấn nhân sự cấp quản lý.')
ON DUPLICATE KEY UPDATE
    RoomName = VALUES(RoomName),
    Capacity = VALUES(Capacity),
    Type = VALUES(Type),
    Floor = VALUES(Floor),
    Status = VALUES(Status),
    Description = VALUES(Description),
    UpdatedAt = CURRENT_TIMESTAMP;
