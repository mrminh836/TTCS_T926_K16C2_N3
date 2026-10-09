DROP TABLE IF EXISTS Meeting_Participants;
DROP TABLE IF EXISTS Booking_Equipments;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Equipments;
DROP TABLE IF EXISTS Meetings;
DROP TABLE IF EXISTS Rooms;
DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(50) DEFAULT 'Employee',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE Rooms (
    RoomID INT AUTO_INCREMENT PRIMARY KEY,
    RoomCode VARCHAR(50) UNIQUE NOT NULL,
    RoomName VARCHAR(100) UNIQUE NOT NULL,
    Capacity INT NOT NULL,
    Type VARCHAR(50) DEFAULT 'Hội nghị',
    Floor VARCHAR(100),
    Status VARCHAR(50) DEFAULT 'Active',
    QRCode VARCHAR(255),
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rooms_status_capacity (Status, Capacity)
);
CREATE TABLE Meetings (
    MeetingID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(200) NOT NULL,
    Description TEXT,
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    OrganizerID INT,
    IsRecurring BOOLEAN DEFAULT FALSE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrganizerID) REFERENCES Users(UserID)
);
CREATE TABLE Bookings (
    BookingID INT AUTO_INCREMENT PRIMARY KEY,
    MeetingID INT,
    RoomID INT,
    BookingStatus VARCHAR(50) DEFAULT 'Confirmed',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MeetingID) REFERENCES Meetings(MeetingID),
    FOREIGN KEY (RoomID) REFERENCES Rooms(RoomID)
);
CREATE TABLE Meeting_Participants (
    MeetingID INT,
    UserID INT,
    ResponseStatus VARCHAR(50) DEFAULT 'Pending',
    PRIMARY KEY (MeetingID, UserID),
    FOREIGN KEY (MeetingID) REFERENCES Meetings(MeetingID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE Equipments (
    EquipmentID INT AUTO_INCREMENT PRIMARY KEY,
    EquipmentName VARCHAR(100) NOT NULL,
    Type VARCHAR(50),
    Status VARCHAR(50) DEFAULT 'Available'
);
CREATE TABLE Booking_Equipments (
    BookingID INT,
    EquipmentID INT,
    Quantity INT DEFAULT 1,
    PRIMARY KEY (BookingID, EquipmentID),
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    FOREIGN KEY (EquipmentID) REFERENCES Equipments(EquipmentID)
);

-- =====================================================
-- DỮ LIỆU KHỞI TẠO MẪU ĐẦY ĐỦ THỰC TẾ (REAL SEED DATA)
-- =====================================================

DELETE FROM Booking_Equipments;
DELETE FROM Meeting_Participants;
DELETE FROM Bookings;
DELETE FROM Meetings;
DELETE FROM Equipments;
DELETE FROM Rooms;
DELETE FROM Users;

-- 1. Danh sách người dùng / nhân viên các phòng ban
INSERT INTO Users (UserID, FullName, Email, PasswordHash, Role) VALUES
    (1, 'Nguyễn Văn Quản Trị', 'admin@enterprise.vn', 'hash_admin_123', 'Admin'),
    (2, 'Trần Thị Thư Ký', 'secretary@enterprise.vn', 'hash_sec_123', 'Secretary'),
    (3, 'Lê Văn Trưởng Phòng', 'manager@enterprise.vn', 'hash_mgr_123', 'Manager'),
    (4, 'Phạm Hoàng Nhân Viên', 'employee@enterprise.vn', 'hash_emp_123', 'Employee'),
    (5, 'Đỗ Quang Minh', 'minh.dq@enterprise.vn', 'hash_pass_123', 'Manager'),
    (6, 'Đoàn Ngọc Mạnh', 'manh.dn@enterprise.vn', 'hash_pass_123', 'Employee'),
    (7, 'Đào Đức Mạnh', 'manh.dd@enterprise.vn', 'hash_pass_123', 'Employee'),
    (8, 'Hoàng Minh Khánh', 'khanh.hm@enterprise.vn', 'hash_pass_123', 'Employee'),
    (9, 'Nguyễn Minh Lượng', 'luong.nm@enterprise.vn', 'hash_pass_123', 'Employee'),
    (10, 'Hoàng Văn Khuyến', 'khuyen.hv@enterprise.vn', 'hash_pass_123', 'Employee'),
    (11, 'Triệu Quốc Khánh', 'khanh.tq@enterprise.vn', 'hash_pass_123', 'Employee'),
    (12, 'Vũ Thị Thanh Ngân', 'ngan.vt@enterprise.vn', 'hash_pass_123', 'Employee'),
    (13, 'Ngô Đức Khải', 'khai.nd@enterprise.vn', 'hash_pass_123', 'Employee'),
    (14, 'Hà Sỹ Nguyên', 'nguyen.hs@enterprise.vn', 'hash_pass_123', 'Employee');

-- 2. Danh mục phòng họp chuẩn doanh nghiệp công nghệ tại Việt Nam
INSERT INTO Rooms (RoomID, RoomCode, RoomName, Capacity, Type, Floor, Status, QRCode, Description) VALUES
    (1, 'A4.01', 'Boardroom Thăng Long', 24, 'Đại sảnh / Board', 'Tầng 4, Tòa Trụ sở', 'Active', 'QR-A401-THANG-LONG', 'Phòng họp cấp cao Ban Tổng Giám đốc và Hội đồng Quản trị, trang bị màn hình tương tác 85 inch, cách âm tiêu chuẩn 45dB.'),
    (2, 'B2.01', 'Phòng Agile Sprint', 12, 'Nhóm / Tech', 'Tầng 2, Tòa Công nghệ', 'Active', 'QR-B201-AGILE-SPRINT', 'Phòng họp chuyên biệt cho các nhóm dự án Dev Scrum, trang bị 2 bảng kính brainstorming và màn hình trình chiếu daily.'),
    (3, 'A3.02', 'Phòng Hội Nghị Đà Nẵng', 35, 'Hội nghị', 'Tầng 3, Tòa Trụ sở', 'Active', 'QR-A302-DA-NANG', 'Phòng hội nghị đa năng quy mô vừa, phục vụ hội thảo bộ phận, đào tạo nhân sự và giao lưu đối tác kinh doanh.'),
    (4, 'TH.01', 'Hội Trường Innovation Hall', 100, 'Hội trường lớn', 'Tầng Trệt, Tòa Trụ sở', 'Maintenance', 'QR-TH01-INNOVATION-HALL', 'Hội trường lớn sức chứa 100 người, hệ thống âm thanh vòm, 3 màn hình LED sân khấu phục vụ Town Hall toàn công ty.'),
    (5, 'A3.01', 'Phòng Focus & Phỏng Vấn (Hạ Long)', 6, 'VIP / Phỏng vấn', 'Tầng 3, Tòa Trụ sở', 'Active', 'QR-A301-HA-LONG', 'Không gian yên tĩnh chuyên dụng cho phỏng vấn tuyển dụng ứng viên, họp 1-on-1 và đàm phán hợp đồng bảo mật.'),
    (6, 'B2.02', 'Creative Lab Sa Pa', 10, 'Nhóm / Tech', 'Tầng 2, Tòa Công nghệ', 'Active', 'QR-B202-CREATIVE-LAB', 'Phòng nghiên cứu sáng tạo và thiết kế UI/UX, trang bị Smart TV, bảng vẽ số và sofa thảo luận mở.'),
    (7, 'B3.01', 'Phòng Khánh Tiết Sài Gòn', 20, 'Hội nghị', 'Tầng 3, Tòa Công nghệ', 'Active', 'QR-B301-SAI-GON', 'Phòng tiếp khách đối tác chiến lược và ký kết thỏa thuận hợp tác, nội thất phong cách trang trọng hiện đại.'),
    (8, 'A5.01', 'Executive Suite Tràng An', 16, 'VIP / Phỏng vấn', 'Tầng 5, Tòa Trụ sở', 'Active', 'QR-A501-TRANG-AN', 'Phòng họp VIP view toàn cảnh thành phố, chuyên dành cho cuộc họp chiến lược tài chính và đối tác cao cấp.');

-- 3. Danh mục thiết bị hội nghị hiện đại
INSERT INTO Equipments (EquipmentID, EquipmentName, Type, Status) VALUES
    (1, 'Máy chiếu Laser Sony 4K VPL-PHZ61', 'Máy chiếu', 'Available'),
    (2, 'Màn hình tương tác Samsung Flip Pro 75 inch', 'Màn hình tương tác', 'Available'),
    (3, 'Hệ thống Camera hội nghị Logitech Rally Plus', 'Camera hội nghị', 'Available'),
    (4, 'Bộ Micro cổ ngỗng không dây Shure MXW6 (4 mic)', 'Micro hội nghị', 'Available'),
    (5, 'Loa ngoài hội nghị chuyên dụng Jabra Speak 810', 'Loa hội nghị', 'Available'),
    (6, 'Bảng kính viết bút lông cao cấp di động 1.8m', 'Bảng thảo luận', 'Available'),
    (7, 'Máy chiếu di động Epson EB-2250U', 'Máy chiếu', 'Maintenance'),
    (8, 'Bộ chia sẻ màn hình không dây Barco ClickShare CX-30', 'Thiết bị trình chiếu', 'Available'),
    (9, 'Webcam hội nghị trực tuyến Polycom Studio 4K', 'Camera hội nghị', 'Available'),
    (10, 'Hệ thống phiên dịch cabin đa ngôn ngữ BOSCH', 'Thiết bị dịch', 'Available');

-- 4. Danh sách các cuộc họp mẫu thực tế
INSERT INTO Meetings (MeetingID, Title, Description, StartTime, EndTime, OrganizerID, IsRecurring) VALUES
    (1, 'Họp Giao Ban Đầu Tuần Ban Điều Hành (Weekly Executive Sync)', 'Đánh giá chỉ số KPI toàn diện tuần trước và phê duyệt kế hoạch trọng tâm tuần mới.', '2026-10-12 08:30:00', '2026-10-12 10:00:00', 1, 1),
    (2, 'Sprint 3 Review & Demo Tính Năng Quản Lý Phòng Họp', 'Demo toàn bộ tính năng và báo cáo kiểm thử tiến độ Sprint 3 cho các bên liên quan.', '2026-10-10 14:00:00', '2026-10-10 16:00:00', 5, 0),
    (3, 'Phỏng Vấn Vòng 2 Kỹ Thuật: Ứng Viên Senior Fullstack', 'Phỏng vấn chuyên sâu kiến trúc hệ thống, Node.js và MySQL cùng Tech Lead và Manager.', '2026-10-11 09:30:00', '2026-10-11 11:00:00', 3, 0),
    (4, 'Workshop Kiến Trúc Hệ Thống & Chuẩn Hóa Docker Container', 'Đào tạo nội bộ về cơ chế điều phối microservices, tối ưu CI/CD và quy chuẩn deploy Docker.', '2026-10-13 14:00:00', '2026-10-13 17:00:00', 6, 0),
    (5, 'Họp Khẩn: Tối Ưu Hiệu Năng Truy Vấn Cơ Sở Dữ Liệu MySQL', 'Rà soát chỉ mục, giải quyết nút thắt cổ chai và xử lý tình trạng lock bảng giờ cao điểm.', '2026-10-09 21:00:00', '2026-10-09 22:30:00', 14, 0);

-- 5. Lịch đặt phòng tương ứng
INSERT INTO Bookings (BookingID, MeetingID, RoomID, BookingStatus) VALUES
    (1, 1, 1, 'Confirmed'),
    (2, 2, 2, 'Confirmed'),
    (3, 3, 5, 'Confirmed'),
    (4, 4, 3, 'Confirmed'),
    (5, 5, 6, 'Confirmed');

-- 6. Danh sách người tham gia cuộc họp
INSERT INTO Meeting_Participants (MeetingID, UserID, ResponseStatus) VALUES
    (1, 1, 'Accepted'),
    (1, 2, 'Accepted'),
    (1, 3, 'Accepted'),
    (1, 5, 'Accepted'),
    (2, 5, 'Accepted'),
    (2, 6, 'Accepted'),
    (2, 7, 'Accepted'),
    (2, 8, 'Accepted'),
    (2, 9, 'Accepted'),
    (2, 10, 'Accepted'),
    (2, 11, 'Accepted'),
    (2, 12, 'Accepted'),
    (2, 13, 'Accepted'),
    (3, 3, 'Accepted'),
    (3, 5, 'Accepted'),
    (3, 2, 'Accepted'),
    (4, 6, 'Accepted'),
    (4, 7, 'Accepted'),
    (4, 8, 'Accepted'),
    (4, 9, 'Accepted'),
    (4, 14, 'Accepted'),
    (5, 14, 'Accepted'),
    (5, 6, 'Accepted'),
    (5, 7, 'Accepted');

-- 7. Danh sách thiết bị mượn kèm cho từng cuộc họp
INSERT INTO Booking_Equipments (BookingID, EquipmentID, Quantity) VALUES
    (1, 1, 1),
    (1, 4, 1),
    (2, 2, 1),
    (2, 3, 1),
    (2, 8, 1),
    (3, 3, 1),
    (4, 1, 1),
    (4, 4, 1),
    (4, 5, 1),
    (5, 2, 1),
    (5, 6, 1);