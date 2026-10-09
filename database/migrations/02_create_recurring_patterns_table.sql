-- =====================================================
-- Migration 02: Tạo bảng Recurring_Patterns
-- Lưu trữ quy tắc lặp lịch họp (tuần/tháng/custom)
-- =====================================================

CREATE TABLE IF NOT EXISTS Recurring_Patterns (
    PatternID       INT AUTO_INCREMENT PRIMARY KEY,
    -- Loại lặp: 'weekly' | 'monthly' | 'custom'
    RecurrenceType  VARCHAR(20) NOT NULL,
    -- Khoảng cách giữa các lần lặp (ví dụ: 2 = mỗi 2 tuần/2 tháng)
    IntervalValue   INT NOT NULL DEFAULT 1,
    -- Ngày trong tuần (0=CN,1=T2..6=T7) - dùng cho weekly/custom, NULL cho monthly
    DayOfWeek       INT NULL,
    -- Ngày trong tháng (1-31) - dùng cho monthly, NULL cho weekly
    DayOfMonth      INT NULL,
    -- Tổng số buổi trong chuỗi
    TotalOccurrences INT NOT NULL,
    -- Ngày bắt đầu và kết thúc chuỗi recurring
    SeriesStartDate DATE NOT NULL,
    SeriesEndDate   DATE NOT NULL,
    CreatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Constraints nghiệp vụ
    CONSTRAINT chk_recurrence_type CHECK (RecurrenceType IN ('weekly', 'monthly', 'custom')),
    CONSTRAINT chk_interval_value CHECK (IntervalValue >= 1 AND IntervalValue <= 12),
    CONSTRAINT chk_total_occurrences CHECK (TotalOccurrences >= 2 AND TotalOccurrences <= 52),
    CONSTRAINT chk_day_of_week CHECK (DayOfWeek IS NULL OR (DayOfWeek >= 0 AND DayOfWeek <= 6)),
    CONSTRAINT chk_day_of_month CHECK (DayOfMonth IS NULL OR (DayOfMonth >= 1 AND DayOfMonth <= 31))
);

-- Thêm cột RecurringPatternID vào bảng Meetings để liên kết với chuỗi lặp
ALTER TABLE Meetings
    ADD COLUMN RecurringPatternID INT NULL AFTER IsRecurring,
    ADD COLUMN OccurrenceIndex INT NULL AFTER RecurringPatternID,
    ADD CONSTRAINT fk_meetings_recurring_pattern
        FOREIGN KEY (RecurringPatternID) REFERENCES Recurring_Patterns(PatternID)
        ON DELETE SET NULL;

-- Index để truy vấn nhanh các cuộc họp theo chuỗi recurring
CREATE INDEX idx_meetings_recurring_pattern ON Meetings(RecurringPatternID);
