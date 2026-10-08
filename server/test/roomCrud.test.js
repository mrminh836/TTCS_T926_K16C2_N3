const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../config/database');
const Room = require('../models/roomModel');
const roomController = require('../controllers/roomController');
const { validateRoomInput } = require('../validators/roomValidator');

// Helper mock request và response cho Controller
function createMockReqRes({ body = {}, params = {}, query = {}, validatedRoomData } = {}) {
    const req = {
        body,
        params,
        query,
        validatedRoomData
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

describe('Phòng Họp: Unit Test Model Room & CRUD APIs (Luồng 1.1, 1.2, 1.3)', () => {

    beforeEach(() => {
        Room._resetMockRoomsFallback();
    });

    // =====================================================
    // 1. UNIT TEST MODEL: Room Methods & SQL Queries
    // =====================================================
    describe('1. Room Model - Methods & SQL Execution', () => {

        it('Room.findAll should execute correct SQL and return formatted list', async () => {
            const originalExecute = db.execute;
            let capturedSql = '';
            let capturedParams = [];

            db.execute = async (sql, params) => {
                capturedSql = sql;
                capturedParams = params;
                return [[
                    {
                        RoomID: 1,
                        RoomCode: 'RM-001',
                        RoomName: 'Phòng Tokyo',
                        Capacity: 20,
                        Type: 'Hội nghị',
                        Floor: 'Tầng 4',
                        Status: 'Active',
                        QRCode: 'QR-RM-001',
                        Description: 'Mô tả Tokyo'
                    }
                ]];
            };

            try {
                const rooms = await Room.findAll({ status: 'Active', minCapacity: 15, search: 'Tokyo' });
                assert.ok(capturedSql.includes('SELECT RoomID, RoomCode, RoomName'), 'Must select all room columns');
                assert.ok(capturedSql.includes('Status = ?'), 'Must filter by status');
                assert.ok(capturedSql.includes('Capacity >= ?'), 'Must filter by capacity');
                assert.ok(capturedSql.includes('RoomName LIKE ?'), 'Must filter by keyword search');

                assert.equal(rooms.length, 1);
                assert.equal(rooms[0].id, 1);
                assert.equal(rooms[0].code, 'RM-001');
                assert.equal(rooms[0].name, 'Phòng Tokyo');
                assert.equal(rooms[0].capacity, 20);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.findAll fallback should filter correctly when DB is offline', async () => {
            const originalExecute = db.execute;
            db.execute = async () => { throw new Error('DB Connection Refused'); };

            try {
                const activeRooms = await Room.findAll({ status: 'Active' });
                assert.ok(Array.isArray(activeRooms));
                assert.ok(activeRooms.every(r => r.status === 'Active'));

                const filteredCapacity = await Room.findAll({ minCapacity: 25 });
                assert.ok(filteredCapacity.every(r => r.capacity >= 25));

                const searched = await Room.findAll({ search: 'Silicon' });
                assert.equal(searched.length, 1);
                assert.equal(searched[0].code, 'RM-002');
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.findById should return single room or null when not found', async () => {
            const originalExecute = db.execute;
            db.execute = async (sql, params) => {
                if (params[0] === 1) {
                    return [[{ RoomID: 1, RoomCode: 'RM-001', RoomName: 'Phòng Tokyo', Capacity: 20, Status: 'Active' }]];
                }
                return [[]];
            };

            try {
                const room1 = await Room.findById(1);
                assert.notEqual(room1, null);
                assert.equal(room1.id, 1);
                assert.equal(room1.name, 'Phòng Tokyo');

                const room999 = await Room.findById(999);
                assert.equal(room999, null);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.findByName should find duplicate names case-insensitively and support excludeId', async () => {
            const originalExecute = db.execute;
            let capturedSql = '';
            let capturedParams = [];

            db.execute = async (sql, params) => {
                capturedSql = sql;
                capturedParams = params;
                return [[{ RoomID: 2, RoomCode: 'RM-002', RoomName: 'Phòng Silicon' }]];
            };

            try {
                const found = await Room.findByName('phòng silicon', 1);
                assert.ok(capturedSql.includes('LOWER(RoomName) = LOWER(?)'));
                assert.equal(capturedParams[0], 'phòng silicon');
                assert.equal(capturedParams[1], 1);
                assert.notEqual(found, null);
                assert.equal(found.id, 2);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.findByCode should find duplicate code and support excludeId', async () => {
            const originalExecute = db.execute;
            let capturedSql = '';
            let capturedParams = [];

            db.execute = async (sql, params) => {
                capturedSql = sql;
                capturedParams = params;
                return [[{ RoomID: 3, RoomCode: 'RM-003', RoomName: 'Phòng Hội Nghị A' }]];
            };

            try {
                const found = await Room.findByCode('RM-003', null);
                assert.ok(capturedSql.includes('LOWER(RoomCode) = LOWER(?)'));
                assert.equal(capturedParams[0], 'RM-003');
                assert.notEqual(found, null);
                assert.equal(found.id, 3);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.hasActiveMeetings (Luồng 1.3) should return true when active/upcoming meetings exist', async () => {
            const originalExecute = db.execute;
            let capturedSql = '';

            db.execute = async (sql) => {
                capturedSql = sql;
                return [[{ count: 2 }]];
            };

            try {
                const hasMeetings = await Room.hasActiveMeetings(1);
                assert.ok(capturedSql.includes('BookingStatus = \'Confirmed\''));
                assert.ok(capturedSql.includes('m.EndTime >= NOW()'));
                assert.equal(hasMeetings, true);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.hasActiveMeetings should return false when no active/upcoming meetings exist', async () => {
            const originalExecute = db.execute;
            db.execute = async () => [[{ count: 0 }]];

            try {
                const hasMeetings = await Room.hasActiveMeetings(2);
                assert.equal(hasMeetings, false);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.create should insert into database and return created room with generated code/qr', async () => {
            const originalExecute = db.execute;
            let insertedData = [];

            db.execute = async (sql, params) => {
                if (sql.includes('SELECT MAX(RoomID)')) {
                    return [[{ maxId: 5 }]];
                }
                if (sql.includes('INSERT INTO rooms')) {
                    insertedData = params;
                    return [{ insertId: 6 }];
                }
                return [[]];
            };

            try {
                const created = await Room.create({
                    name: 'Phòng Sáng Tạo Mới',
                    capacity: 15,
                    type: 'Nhóm / Tech',
                    floor: 'Tầng 3'
                });

                assert.equal(created.id, 6);
                assert.equal(created.code, 'RM-006');
                assert.equal(created.name, 'Phòng Sáng Tạo Mới');
                assert.equal(created.capacity, 15);
                assert.equal(insertedData[0], 'RM-006');
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.update should execute UPDATE query and return fresh room object', async () => {
            const originalExecute = db.execute;
            let updateParams = [];

            db.execute = async (sql, params) => {
                if (sql.includes('UPDATE rooms')) {
                    updateParams = params;
                    return [{ affectedRows: 1 }];
                }
                if (sql.includes('SELECT RoomID')) {
                    return [[{
                        RoomID: 1,
                        RoomCode: 'RM-001',
                        RoomName: 'Phòng Tokyo VIP Cải Tạo',
                        Capacity: 25,
                        Type: 'Hội nghị',
                        Floor: 'Tầng 4',
                        Status: 'Active'
                    }]];
                }
                return [[]];
            };

            try {
                const updated = await Room.update(1, {
                    name: 'Phòng Tokyo VIP Cải Tạo',
                    capacity: 25,
                    type: 'Hội nghị',
                    floor: 'Tầng 4',
                    status: 'Active'
                });

                assert.equal(updated.id, 1);
                assert.equal(updated.name, 'Phòng Tokyo VIP Cải Tạo');
                assert.equal(updated.capacity, 25);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.delete should block and throw error if active meetings exist (Luồng 1.3)', async () => {
            const originalExecute = db.execute;
            db.execute = async (sql) => {
                if (sql.includes('SELECT COUNT(*)')) {
                    return [[{ count: 1 }]]; // Đang có cuộc họp
                }
                return [[]];
            };

            try {
                await assert.rejects(
                    async () => { await Room.delete(1); },
                    (err) => err.code === 'ACTIVE_MEETINGS_EXIST'
                );
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.delete should successfully execute DELETE query when no active meetings exist', async () => {
            const originalExecute = db.execute;
            let deletedId = null;

            db.execute = async (sql, params) => {
                if (sql.includes('SELECT COUNT(*)')) {
                    return [[{ count: 0 }]]; // Không có cuộc họp
                }
                if (sql.includes('DELETE FROM rooms')) {
                    deletedId = params[0];
                    return [{ affectedRows: 1 }];
                }
                return [[]];
            };

            try {
                const result = await Room.delete(2);
                assert.equal(result.id, 2);
                assert.equal(result.deleted, true);
                assert.equal(deletedId, 2);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('Room.toggleStatus should switch Active to Maintenance and vice versa', async () => {
            const originalExecute = db.execute;
            let toggleExecuted = false;

            db.execute = async (sql, params) => {
                if (sql.includes('CASE WHEN Status = \'Active\' THEN \'Maintenance\'')) {
                    toggleExecuted = true;
                    return [{ affectedRows: 1 }];
                }
                if (sql.includes('SELECT RoomID')) {
                    return [[{ RoomID: 1, RoomCode: 'RM-001', RoomName: 'Phòng Tokyo', Capacity: 20, Status: 'Maintenance' }]];
                }
                return [[]];
            };

            try {
                const toggled = await Room.toggleStatus(1);
                assert.equal(toggleExecuted, true);
                assert.equal(toggled.status, 'Maintenance');
            } finally {
                db.execute = originalExecute;
            }
        });
    });

    // =====================================================
    // 2. UNIT TEST CONTROLLER: CRUD API Endpoints
    // =====================================================
    describe('2. Room Controller - CRUD Handlers', () => {

        it('getAllRooms should return 200 with list of rooms', async () => {
            const { req, res } = createMockReqRes();
            await roomController.getAllRooms(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.ok(Array.isArray(res.jsonData.data));
            assert.equal(res.jsonData.data.length, 5);
        });

        it('getRoomById should return 200 for valid existing room ID', async () => {
            const { req, res } = createMockReqRes({ params: { id: '1' } });
            await roomController.getRoomById(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.equal(res.jsonData.data.id, 1);
            assert.equal(res.jsonData.data.code, 'RM-001');
        });

        it('getRoomById should return 400 for invalid ID parameter', async () => {
            const { req, res } = createMockReqRes({ params: { id: 'invalid_id' } });
            await roomController.getRoomById(req, res, () => {});

            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
        });

        it('getRoomById should return 404 for non-existent room ID', async () => {
            const { req, res } = createMockReqRes({ params: { id: '9999' } });
            await roomController.getRoomById(req, res, () => {});

            assert.equal(res.statusCode, 404);
            assert.equal(res.jsonData.success, false);
        });

        it('createRoom should return 201 when creating new valid room', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    name: 'Phòng Hội Thảo Quốc Tế',
                    capacity: 40,
                    type: 'Hội nghị',
                    floor: 'Tầng 6',
                    status: 'Active'
                }
            });

            await roomController.createRoom(req, res, () => {});

            assert.equal(res.statusCode, 201);
            assert.equal(res.jsonData.success, true);
            assert.equal(res.jsonData.data.name, 'Phòng Hội Thảo Quốc Tế');
            assert.equal(res.jsonData.data.capacity, 40);
        });

        it('createRoom should return 400 when input validation fails (e.g. empty name)', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    name: '',
                    capacity: 10
                }
            });

            await roomController.createRoom(req, res, () => {});

            assert.equal(res.statusCode, 400);
            assert.equal(res.jsonData.success, false);
            assert.ok(res.jsonData.message.includes('Tên phòng họp là bắt buộc'));
        });

        it('createRoom should return 409 when room name already exists', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    name: 'Phòng Tokyo (Tầng 4)', // Đã tồn tại
                    capacity: 20
                }
            });

            await roomController.createRoom(req, res, () => {});

            assert.equal(res.statusCode, 409);
            assert.equal(res.jsonData.success, false);
            assert.ok(res.jsonData.message.includes('đã tồn tại'));
        });

        it('createRoom should return 409 when room code already exists', async () => {
            const { req, res } = createMockReqRes({
                body: {
                    code: 'RM-001', // Đã tồn tại
                    name: 'Phòng Mới Khác Tên',
                    capacity: 15
                }
            });

            await roomController.createRoom(req, res, () => {});

            assert.equal(res.statusCode, 409);
            assert.equal(res.jsonData.success, false);
            assert.ok(res.jsonData.message.includes('Mã phòng họp'));
        });

        it('updateRoom should return 200 when updating existing room successfully', async () => {
            const { req, res } = createMockReqRes({
                params: { id: '2' },
                body: {
                    name: 'Phòng Silicon Đổi Mới Sáng Tạo',
                    capacity: 16,
                    type: 'Nhóm / Tech',
                    floor: 'Tầng 2, Tòa B',
                    status: 'Active'
                }
            });

            await roomController.updateRoom(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.equal(res.jsonData.data.name, 'Phòng Silicon Đổi Mới Sáng Tạo');
            assert.equal(res.jsonData.data.capacity, 16);
        });

        it('updateRoom should return 404 for non-existent room', async () => {
            const { req, res } = createMockReqRes({
                params: { id: '8888' },
                body: {
                    name: 'Phòng Không Tồn Tại',
                    capacity: 20
                }
            });

            await roomController.updateRoom(req, res, () => {});

            assert.equal(res.statusCode, 404);
            assert.equal(res.jsonData.success, false);
        });

        it('updateRoom should return 409 when renaming to a name already used by another room', async () => {
            const { req, res } = createMockReqRes({
                params: { id: '2' },
                body: {
                    name: 'Phòng Tokyo (Tầng 4)', // Tên của phòng 1
                    capacity: 12
                }
            });

            await roomController.updateRoom(req, res, () => {});

            assert.equal(res.statusCode, 409);
            assert.equal(res.jsonData.success, false);
            assert.ok(res.jsonData.message.includes('đã được sử dụng bởi phòng khác'));
        });

        it('deleteRoom should return 409 with Luồng 1.3 constraint error when active meetings exist', async () => {
            // Thiết lập phòng 1 có cuộc họp đang diễn ra
            Room._setMockActiveBookings([
                {
                    roomId: 1,
                    status: 'Confirmed',
                    endTime: new Date(Date.now() + 3600000).toISOString() // 1 tiếng sau
                }
            ]);

            const { req, res } = createMockReqRes({ params: { id: '1' } });
            await roomController.deleteRoom(req, res, () => {});

            assert.equal(res.statusCode, 409);
            assert.equal(res.jsonData.success, false);
            assert.equal(res.jsonData.code, 'CANNOT_DELETE_ACTIVE_MEETINGS');
            assert.ok(res.jsonData.message.includes('Không thể xóa phòng họp'));
            assert.ok(res.jsonData.message.includes('Bảo trì'));
        });

        it('deleteRoom should return 200 when deleting room without active meetings', async () => {
            // Phòng 2 không có cuộc họp
            Room._setMockActiveBookings([]);

            const { req, res } = createMockReqRes({ params: { id: '2' } });
            await roomController.deleteRoom(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.ok(res.jsonData.message.includes('thành công'));

            // Xác minh phòng 2 đã bị xóa
            const check = await Room.findById(2);
            assert.equal(check, null);
        });

        it('toggleRoomStatus should return 200 with changed status', async () => {
            const { req, res } = createMockReqRes({ params: { id: '1' } });
            await roomController.toggleRoomStatus(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.equal(res.jsonData.data.status, 'Maintenance');
        });
    });

    // =====================================================
    // 3. UNIT TEST VALIDATOR: Room Code & Fields
    // =====================================================
    describe('3. Room Validator - RoomCode & Fields', () => {

        it('should accept valid roomCode and assign it in validated data', () => {
            const result = validateRoomInput({
                roomCode: 'RM-CUSTOM-99',
                name: 'Phòng Thử Nghiệm',
                capacity: 10
            });
            assert.equal(result.isValid, true);
            assert.equal(result.data.code, 'RM-CUSTOM-99');
        });

        it('should reject invalid characters in roomCode', () => {
            const result = validateRoomInput({
                roomCode: 'RM@INVALID!',
                name: 'Phòng Thử Nghiệm',
                capacity: 10
            });
            assert.equal(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('Mã phòng họp chỉ được chứa')));
        });

        it('should reject too short or too long roomCode', () => {
            const resultShort = validateRoomInput({
                roomCode: 'A',
                name: 'Phòng Thử Nghiệm',
                capacity: 10
            });
            assert.equal(resultShort.isValid, false);

            const resultLong = validateRoomInput({
                roomCode: 'A'.repeat(51),
                name: 'Phòng Thử Nghiệm',
                capacity: 10
            });
            assert.equal(resultLong.isValid, false);
        });
    });
});
