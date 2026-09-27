/**
 * Bộ kiểm thử tự động cho API GET /rooms/:id (Chi tiết phòng và sức chứa tối đa)
 * User Story: US 10.0 (Xem sức chứa tối đa & chi tiết phòng họp)
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../config/database');
const Room = require('../models/roomModel');
const roomController = require('../controllers/roomController');
const { validateRoomIdMiddleware } = require('../validators/roomValidator');

function createMockReqRes({ params = {}, query = {}, body = {}, roomId } = {}) {
    const req = {
        params,
        query,
        body,
        roomId
    };
    const res = {
        statusCode: null,
        jsonData: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        }
    };
    return { req, res };
}

describe('API GET /rooms/:id - Chi tiết phòng và Sức chứa tối đa (US 10.0)', () => {

    beforeEach(() => {
        Room._resetMockRoomsFallback();
    });

    // =====================================================
    // 1. UNIT TEST VALIDATOR: validateRoomIdMiddleware
    // =====================================================
    describe('1. Middleware: validateRoomIdMiddleware', () => {

        it('should pass and attach req.roomId for valid positive integer string', () => {
            const { req, res } = createMockReqRes({ params: { id: '5' } });
            let nextCalled = false;

            validateRoomIdMiddleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, true);
            assert.equal(req.roomId, 5);
            assert.equal(res.statusCode, null);
        });

        it('should reject non-numeric string with 400 Bad Request', () => {
            const { req, res } = createMockReqRes({ params: { id: 'abc' } });
            let nextCalled = false;

            validateRoomIdMiddleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
            assert.ok(res.jsonData.message.includes('ID phòng họp không hợp lệ'));
        });

        it('should reject zero (0) with 400 Bad Request', () => {
            const { req, res } = createMockReqRes({ params: { id: '0' } });
            let nextCalled = false;

            validateRoomIdMiddleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
        });

        it('should reject negative number with 400 Bad Request', () => {
            const { req, res } = createMockReqRes({ params: { id: '-5' } });
            let nextCalled = false;

            validateRoomIdMiddleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
        });

        it('should reject float / decimal with 400 Bad Request', () => {
            const { req, res } = createMockReqRes({ params: { id: '3.14' } });
            let nextCalled = false;

            validateRoomIdMiddleware(req, res, () => { nextCalled = true; });

            assert.equal(nextCalled, false);
            assert.equal(res.statusCode, 400);
        });
    });

    // =====================================================
    // 2. UNIT TEST MODEL: Room.findById (SQL & MaxCapacity)
    // =====================================================
    describe('2. Model: Room.findById (SQL Query & Dữ liệu chi tiết)', () => {

        it('should return complete room detail with maxCapacity and capacity from SQL', async () => {
            const originalExecute = db.execute;
            let capturedSql = '';
            let capturedParams = [];

            db.execute = async (sql, params) => {
                capturedSql = sql;
                capturedParams = params;
                if (sql.includes('FROM rooms') && sql.includes('RoomID = ?')) {
                    return [[
                        {
                            RoomID: 1,
                            RoomCode: 'RM-001',
                            RoomName: 'Phòng Tokyo (Tầng 4)',
                            Capacity: 20,
                            Type: 'Hội nghị',
                            Floor: 'Tầng 4, Tòa A',
                            Status: 'Active',
                            QRCode: 'QR-ROOM-001',
                            Description: 'Phòng hội thảo tiêu chuẩn cao.',
                            CreatedAt: '2026-09-01 08:00:00',
                            UpdatedAt: '2026-09-01 08:00:00'
                        }
                    ]];
                }
                if (sql.includes('bookings') && sql.includes('COUNT(*)')) {
                    return [[{ count: 3 }]];
                }
                return [[]];
            };

            try {
                const room = await Room.findById(1);

                assert.notEqual(room, null);
                assert.equal(room.id, 1);
                assert.equal(room.code, 'RM-001');
                assert.equal(room.name, 'Phòng Tokyo (Tầng 4)');
                assert.equal(room.capacity, 20);
                assert.equal(room.maxCapacity, 20); // Sức chứa tối đa phải có
                assert.equal(room.type, 'Hội nghị');
                assert.equal(room.floor, 'Tầng 4, Tòa A');
                assert.equal(room.status, 'Active');
                assert.equal(room.qrCode, 'QR-ROOM-001');
                assert.ok(Array.isArray(room.equipments), 'equipments must be an array');
                assert.equal(room.activeMeetingsCount, 3);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('should return null when room ID is not found in database', async () => {
            const originalExecute = db.execute;
            db.execute = async () => [[]];

            try {
                const room = await Room.findById(9999);
                assert.equal(room, null);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('should return null when roomId is invalid (0 or negative)', async () => {
            const roomZero = await Room.findById(0);
            assert.equal(roomZero, null);

            const roomNegative = await Room.findById(-10);
            assert.equal(roomNegative, null);

            const roomNaN = await Room.findById('invalid');
            assert.equal(roomNaN, null);
        });

        it('should fallback to mock data when database is offline and include maxCapacity', async () => {
            const originalExecute = db.execute;
            db.execute = async () => { throw new Error('DB Offline'); };

            try {
                const room = await Room.findById(3);
                assert.notEqual(room, null);
                assert.equal(room.id, 3);
                assert.equal(room.name, 'Phòng Hội Nghị A');
                assert.equal(room.capacity, 30);
                assert.equal(room.maxCapacity, 30);
                assert.equal(room.type, 'Hội trường lớn');
                assert.ok(room.equipments.includes('Máy chiếu Full HD'));
            } finally {
                db.execute = originalExecute;
            }
        });
    });

    // =====================================================
    // 3. UNIT TEST CONTROLLER: getRoomById API Handler
    // =====================================================
    describe('3. Controller: getRoomById (Phản hồi HTTP chuẩn RESTful)', () => {

        it('should return 200 OK with full details and maxCapacity for valid room ID', async () => {
            const { req, res } = createMockReqRes({ params: { id: '1' }, roomId: 1 });

            await roomController.getRoomById(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.ok(res.jsonData.message.includes('thành công'));

            const data = res.jsonData.data;
            assert.equal(data.id, 1);
            assert.equal(data.code, 'RM-001');
            assert.equal(data.name, 'Phòng Tokyo (Tầng 4)');
            assert.equal(data.capacity, 20);
            assert.equal(data.maxCapacity, 20);
            assert.equal(data.type, 'Hội nghị');
            assert.equal(data.floor, 'Tầng 4, Tòa A');
            assert.equal(data.status, 'Active');
            assert.equal(data.qrCode, 'QR-ROOM-001');
            assert.ok(Array.isArray(data.equipments));
            assert.ok(data.description.length > 0);
        });

        it('should return 400 Bad Request when id param is invalid', async () => {
            const { req, res } = createMockReqRes({ params: { id: 'abc' } });

            await roomController.getRoomById(req, res, () => {});

            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
            assert.ok(res.jsonData.message.includes('ID phòng họp không hợp lệ'));
        });

        it('should return 404 Not Found when room ID does not exist', async () => {
            const { req, res } = createMockReqRes({ params: { id: '99999' }, roomId: 99999 });

            await roomController.getRoomById(req, res, () => {});

            assert.equal(res.statusCode, 404);
            assert.equal(res.jsonData.success, false);
            assert.ok(res.jsonData.message.includes('Không tìm thấy phòng họp'));
        });

        it('should verify all 5 default enterprise rooms have valid maxCapacity', async () => {
            for (let id = 1; id <= 5; id++) {
                const { req, res } = createMockReqRes({ params: { id: String(id) }, roomId: id });
                await roomController.getRoomById(req, res, () => {});

                assert.equal(res.statusCode, 200);
                assert.equal(res.jsonData.data.id, id);
                assert.ok(typeof res.jsonData.data.capacity === 'number' && res.jsonData.data.capacity > 0);
                assert.ok(typeof res.jsonData.data.maxCapacity === 'number' && res.jsonData.data.maxCapacity > 0);
                assert.equal(res.jsonData.data.maxCapacity, res.jsonData.data.capacity);
            }
        });
    });
});
