/**
 * Script chạy Migration tự động cho Database
 * Usage: node server/scripts/migrate.js
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigrations() {
    console.log('--- BẮT ĐẦU CHẠY DATABASE MIGRATIONS ---');
    const migrationsDir = path.resolve(__dirname, '../../database/migrations');

    if (!fs.existsSync(migrationsDir)) {
        console.error(`Thư mục migration không tồn tại: ${migrationsDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    console.log(`Tìm thấy ${files.length} file migration cần thực thi.`);

    let connection;
    try {
        connection = await db.getConnection();
        console.log('✓ Kết nối CSDL MySQL thành công.');

        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            console.log(`Đang chạy migration: ${file}...`);
            const sqlContent = fs.readFileSync(filePath, 'utf8');

            // Tách các câu lệnh theo dấu ;
            const statements = sqlContent
                .split(/;\s*$/m)
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                if (statement.length > 0) {
                    await connection.query(statement);
                }
            }
            console.log(`✓ Hoàn thành migration: ${file}`);
        }

        console.log('--- TOÀN BỘ MIGRATION ĐÃ HOÀN TẤT THÀNH CÔNG ---');
    } catch (error) {
        console.error('✗ Lỗi khi thực thi migration:', error.message);
        process.exit(1);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

if (require.main === module) {
    runMigrations();
}

module.exports = runMigrations;
