const express = require('express');
const pool = require('../config/database');

const router = express.Router();

/**
 * GET /api/health
 * Kiểm tra trạng thái kết nối tới MySQL
 */
router.get('/health', async (req, res) => {
    try {
        // Thực hiện ping/query thử tới MySQL
        await pool.query('SELECT 1');

        return res.status(200).json({
            status: 'ok',
            database: 'connected'
        });
    } catch (error) {
        console.error('Health check failed:', error.message);

        return res.status(503).json({
            status: 'error',
            database: 'disconnected',
            message: error.message
        });
    }
});

module.exports = router;
