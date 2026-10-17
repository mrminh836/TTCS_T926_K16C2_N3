-- =====================================================================
-- MIGRATION: 03_add_username_to_users_table.sql
-- Mô tả: Thêm trường Username định danh duy nhất vào bảng Users
-- Phục vụ luồng xác thực đăng ký và đăng nhập (Sprint 3 / Auth API)
-- =====================================================================

-- 1. Thêm cột Username vào bảng Users
ALTER TABLE Users
    ADD COLUMN Username VARCHAR(50) NULL AFTER UserID;

-- 2. Đồng bộ Username cho toàn bộ tài khoản hiện tại từ Email
UPDATE Users
SET Username = SUBSTRING_INDEX(Email, '@', 1)
WHERE Username IS NULL OR Username = '';

-- 3. Thiết lập ràng buộc NOT NULL và chỉ mục duy nhất UNIQUE
ALTER TABLE Users
    MODIFY COLUMN Username VARCHAR(50) NOT NULL;

ALTER TABLE Users
    ADD CONSTRAINT uq_users_username UNIQUE (Username);
