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
-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA)
-- =====================================================

INSERT INTO Users (UserID, FullName, Email, PasswordHash, Role) VALUES
    (1, 'Nguyễn Văn Quản Trị', 'admin@enterprise.vn', 'hash_admin_123', 'Admin'),
    (2, 'Trần Thị Thư Ký', 'secretary@enterprise.vn', 'hash_sec_123', 'Secretary'),
    (3, 'Lê Văn Trưởng Phòng', 'manager@enterprise.vn', 'hash_mgr_123', 'Manager'),
    (4, 'Phạm Hoàng Nhân Viên', 'employee@enterprise.vn', 'hash_emp_123', 'Employee');

INSERT INTO Rooms (RoomID, RoomCode, RoomName, Capacity, Type, Floor, Status, QRCode, Description) VALUES
    (1, 'RM-001', 'Phòng Tokyo (Tầng 4)', 20, 'Hội nghị', 'Tầng 4, Tòa A', 'Active', 'QR-ROOM-001', 'Phòng hội thảo tiêu chuẩn cao, view thoáng, cách âm tốt, chuyên tổ chức họp ban giám đốc và đối tác.'),
    (2, 'RM-002', 'Phòng Silicon (Tầng 2)', 12, 'Nhóm / Tech', 'Tầng 2, Tòa B', 'Active', 'QR-ROOM-002', 'Thiết kế mở theo phong cách Silicon Valley, trang bị màn hình tương tác và bảng viết brainstorming.'),
    (3, 'RM-003', 'Phòng Hội Nghị A', 30, 'Hội trường lớn', 'Tầng 1, Tòa Trung tâm', 'Active', 'QR-ROOM-003', 'Hội trường lớn phù hợp cho họp toàn công ty, hội thảo khách hàng, đào tạo nhân sự định kỳ.'),
    (4, 'RM-004', 'Phòng Grand Board', 50, 'Đại sảnh / Board', 'Tầng 5, Tòa A', 'Maintenance', 'QR-ROOM-004', 'Đang nâng cấp hệ thống âm thanh vòm và điều hòa trung tâm.'),
    (5, 'RM-005', 'Phòng VIP', 10, 'VIP / Phỏng vấn', 'Tầng 3, Tòa VIP', 'Active', 'QR-ROOM-005', 'Phòng tiếp đón đối tác cao cấp, phỏng vấn nhân sự cấp quản lý.');