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
    RoomName VARCHAR(100) NOT NULL,
    Capacity INT NOT NULL,
    Status VARCHAR(50) DEFAULT 'Active',
    QRCode VARCHAR(255)
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