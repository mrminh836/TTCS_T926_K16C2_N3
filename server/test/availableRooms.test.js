const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../config/database');
const Room = require('../models/roomModel');
const {
    validateAvailableRoomsQuery,
    validateAvailableRoomsMiddleware,
    formatToMySQLDateTime
} = require('../validators/roomValidator');
const roomController = require('../controllers/roomController');

describe('Query Lọc Phòng Trống Theo Khoảng Ngày/Giờ (Available Rooms Query)', () => {

    // =====================================================
    // 1. UNIT TEST VALIDATOR: validateAvailableRoomsQuery
    // =====================================================
    describe('1. Validator: validateAvailableRoomsQuery', () => {

        it('should pass with valid date, startTime, and endTime', () => {
            const query = {
                date: '2026-10-01',
                startTime: '09:00',
                endTime: '10:30'
            };
            const result = validateAvailableRoomsQuery(query);
            assert.equal(result.isValid, true);
            assert.equal(result.errors.length, 0);
            assert.equal(result.data.startTime, '2026-10-01 09:00:00');
            assert.equal(result.data.endTime, '2026-10-01 10:30:00');
            assert.equal(result.data.minCapacity, null);
        });

        it('should pass with valid full ISO or standard datetime strings', () => {
            const query = {
                startTime: '2026-10-01 14:00:00',
                endTime: '2026-10-01 15:30:00'
            };
            const result = validateAvailableRoomsQuery(query);
            assert.equal(result.isValid, true);
            assert.equal(result.data.startTime, '2026-10-01 14:00:00');
            assert.equal(result.data.endTime, '2026-10-01 15:30:00');
        });

        it('should pass with optional minCapacity and excludeMeetingId', () => {
            const query = {
                date: '2026-10-01',
                startTime: '08:00',
                endTime: '09:00',
                minCapacity: '25',
                excludeMeetingId: '10'
            };
            const result = validateAvailableRoomsQuery(query);
            assert.equal(result.isValid, true);
            assert.equal(result.data.minCapacity, 25);
            assert.equal(result.data.excludeMeetingId, 10);
        });

        it('should fail when startTime or endTime is missing', () => {
            const result1 = validateAvailableRoomsQuery({});
            assert.equal(result1.isValid, false);
            assert.ok(result1.errors[0].includes('Vui lòng cung cấp đầy đủ thời gian bắt đầu'));

            const result2 = validateAvailableRoomsQuery({ date: '2026-10-01', startTime: '09:00' });
            assert.equal(result2.isValid, false);
        });

        it('should fail when endTime is before or equal to startTime', () => {
            const resultEqual = validateAvailableRoomsQuery({
                date: '2026-10-01',
                startTime: '10:00',
                endTime: '10:00'
            });
            assert.equal(resultEqual.isValid, false);
            assert.ok(resultEqual.errors.some(e => e.includes('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu')));

            const resultBefore = validateAvailableRoomsQuery({
                date: '2026-10-01',
                startTime: '11:00',
                endTime: '09:00'
            });
            assert.equal(resultBefore.isValid, false);
            assert.ok(resultBefore.errors.some(e => e.includes('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu')));
        });

        it('should fail when duration is shorter than minimum (5 minutes)', () => {
            const result = validateAvailableRoomsQuery({
                date: '2026-10-01',
                startTime: '09:00:00',
                endTime: '09:02:00'
            });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('tối thiểu phải từ 5 phút trở lên')));
        });

        it('should fail when minCapacity is not a positive integer', () => {
            const result = validateAvailableRoomsQuery({
                date: '2026-10-01',
                startTime: '09:00',
                endTime: '10:00',
                minCapacity: '-5'
            });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('Sức chứa tối thiểu')));
        });

        it('should fail when excludeMeetingId is not a positive integer', () => {
            const result = validateAvailableRoomsQuery({
                date: '2026-10-01',
                startTime: '09:00',
                endTime: '10:00',
                excludeMeetingId: 'abc'
            });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('ID cuộc họp cần loại trừ')));
        });
    });

    // =====================================================
    // 2. UNIT TEST MODEL & SQL QUERY: Room.findAvailableRooms
    // =====================================================
    describe('2. Model: Room.findAvailableRooms (SQL Query & Overlap Logic)', () => {

        it('should execute SQL with NOT EXISTS overlap check and correct parameter order', async () => {
            const originalExecute = db.execute;
            let capturedSql = '';
            let capturedParams = [];

            db.execute = async (sql, params) => {
                capturedSql = sql;
                capturedParams = params;
                return [[
                    { RoomID: 1, RoomName: 'Phòng Tokyo', Capacity: 20, Status: 'Active', QRCode: 'QR-001' },
                    { RoomID: 2, RoomName: 'Phòng Silicon', Capacity: 12, Status: 'Active', QRCode: 'QR-002' }
                ]];
            };

            try {
                const rooms = await Room.findAvailableRooms({
                    startTime: '2026-10-01 09:00:00',
                    endTime: '2026-10-01 10:30:00',
                    minCapacity: 10,
                    excludeMeetingId: 5
                });

                // Kiểm tra mệnh đề SQL
                assert.ok(capturedSql.includes('SELECT'), 'SQL must contain SELECT');
                assert.ok(capturedSql.includes('FROM rooms r'), 'SQL must query from rooms table');
                assert.ok(capturedSql.includes("r.Status = 'Active'"), 'SQL must filter Active rooms');
                assert.ok(capturedSql.includes('NOT EXISTS'), 'SQL must use NOT EXISTS to filter bookings');
                assert.ok(capturedSql.includes("b.BookingStatus = 'Confirmed'"), 'SQL must check Confirmed bookings');
                assert.ok(capturedSql.includes('m.StartTime < ?'), 'SQL must check overlap (StartTime < endTime)');
                assert.ok(capturedSql.includes('m.EndTime > ?'), 'SQL must check overlap (EndTime > startTime)');

                // Kiểm tra thứ tự các tham số truyền vào db.execute
                assert.equal(capturedParams[0], 10, 'Param 0 should be minCapacity');
                assert.equal(capturedParams[1], 10, 'Param 1 should be minCapacity');
                assert.equal(capturedParams[2], '2026-10-01 10:30:00', 'Param 2 should be query endTime');
                assert.equal(capturedParams[3], '2026-10-01 09:00:00', 'Param 3 should be query startTime');
                assert.equal(capturedParams[4], 5, 'Param 4 should be excludeMeetingId');
                assert.equal(capturedParams[5], 5, 'Param 5 should be excludeMeetingId');

                // Kiểm tra kết quả trả về
                assert.equal(rooms.length, 2);
                assert.equal(rooms[0].id, 1);
                assert.equal(rooms[0].name, 'Phòng Tokyo');
                assert.equal(rooms[0].isAvailable, true);
                assert.equal(rooms[1].id, 2);
                assert.equal(rooms[1].name, 'Phòng Silicon');
            } finally {
                db.execute = originalExecute;
            }
        });

        it('should return empty array when all rooms are booked or maintenance in SQL', async () => {
            const originalExecute = db.execute;
            db.execute = async () => [[]];

            try {
                const rooms = await Room.findAvailableRooms({
                    startTime: '2026-10-01 09:00:00',
                    endTime: '2026-10-01 10:30:00'
                });
                assert.equal(Array.isArray(rooms), true);
                assert.equal(rooms.length, 0);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('should fallback gracefully to in-memory filter when database is offline', async () => {
            const originalExecute = db.execute;
            db.execute = async () => {
                const err = new Error('ECONNREFUSED 127.0.0.1:3306');
                err.code = 'ECONNREFUSED';
                throw err;
            };

            try {
                const rooms = await Room.findAvailableRooms({
                    startTime: '2026-10-01 09:00:00',
                    endTime: '2026-10-01 10:30:00',
                    minCapacity: 20
                });

                assert.ok(Array.isArray(rooms));
                // Fallback chỉ trả về các phòng Active có capacity >= 20
                assert.ok(rooms.every(r => r.status === 'Active' && r.capacity >= 20));
                // Phòng Grand Board (50 chỗ nhưng Maintenance) không được xuất hiện
                assert.ok(!rooms.some(r => r.name.includes('Grand Board')));
            } finally {
                db.execute = originalExecute;
            }
        });
    });

    // =====================================================
    // 3. INTEGRATION TEST: Controller & Middleware
    // =====================================================
    describe('3. Controller: getAvailableRooms API Endpoint', () => {

        it('should return 200 and list of available rooms when valid query provided', async () => {
            const originalFind = Room.findAvailableRooms;
            Room.findAvailableRooms = async () => [
                { id: 1, name: 'Phòng Tokyo', capacity: 20, status: 'Active', isAvailable: true }
            ];

            const req = {
                query: {
                    date: '2026-10-01',
                    startTime: '09:00',
                    endTime: '10:30'
                }
            };

            let responseStatus = null;
            let responseBody = null;

            const res = {
                status: (code) => {
                    responseStatus = code;
                    return {
                        json: (data) => {
                            responseBody = data;
                        }
                    };
                }
            };

            try {
                await roomController.getAvailableRooms(req, res, () => {});
                assert.equal(responseStatus, 200);
                assert.equal(responseBody.success, true);
                assert.equal(responseBody.total, 1);
                assert.equal(responseBody.data[0].name, 'Phòng Tokyo');
                assert.equal(responseBody.query.startTime, '2026-10-01 09:00:00');
                assert.equal(responseBody.query.endTime, '2026-10-01 10:30:00');
            } finally {
                Room.findAvailableRooms = originalFind;
            }
        });

        it('should return 400 when missing required query parameters', async () => {
            const req = {
                query: {}
            };

            let responseStatus = null;
            let responseBody = null;

            const res = {
                status: (code) => {
                    responseStatus = code;
                    return {
                        json: (data) => {
                            responseBody = data;
                        }
                    };
                }
            };

            await roomController.getAvailableRooms(req, res, () => {});
            assert.equal(responseStatus, 400);
            assert.equal(responseBody.success, false);
            assert.ok(responseBody.message.includes('Vui lòng cung cấp đầy đủ thời gian bắt đầu'));
        });

        it('should call next() in middleware when query is valid', () => {
            let nextCalled = false;
            const req = {
                query: {
                    date: '2026-10-01',
                    startTime: '09:00',
                    endTime: '10:00'
                }
            };
            const res = {};
            validateAvailableRoomsMiddleware(req, res, () => {
                nextCalled = true;
            });

            assert.equal(nextCalled, true);
            assert.ok(req.validatedAvailableQuery);
            assert.equal(req.validatedAvailableQuery.startTime, '2026-10-01 09:00:00');
        });

        it('should return 400 in middleware when query is invalid', () => {
            let responseStatus = null;
            let responseBody = null;
            const req = {
                query: {
                    date: '2026-10-01',
                    startTime: '10:00',
                    endTime: '09:00'
                }
            };
            const res = {
                status: (code) => {
                    responseStatus = code;
                    return {
                        json: (data) => {
                            responseBody = data;
                        }
                    };
                }
            };
            validateAvailableRoomsMiddleware(req, res, () => {});

            assert.equal(responseStatus, 400);
            assert.equal(responseBody.success, false);
            assert.ok(responseBody.message.includes('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu'));
        });
    });
});
