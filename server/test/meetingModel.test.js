const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../config/database');
const Meeting = require('../models/meetingModel');

describe('Meeting Model - (Kiểm thử Unit Test Model & Transaction)', () => {
    describe('Meeting.checkOverlap', () => {
        it('should return true when overlapping bookings exist', async () => {
            const originalExecute = db.execute;
            db.execute = async () => [[{ MeetingID: 10, Title: 'Họp hiện có' }]];

            try {
                const isOverlapped = await Meeting.checkOverlap(1, '2026-10-01 09:00:00', '2026-10-01 10:00:00');
                assert.equal(isOverlapped, true);
            } finally {
                db.execute = originalExecute;
            }
        });

        it('should return false when no overlapping bookings exist', async () => {
            const originalExecute = db.execute;
            db.execute = async () => [[]];

            try {
                const isOverlapped = await Meeting.checkOverlap(1, '2026-10-01 09:00:00', '2026-10-01 10:00:00');
                assert.equal(isOverlapped, false);
            } finally {
                db.execute = originalExecute;
            }
        });
    });

    describe('Meeting.create - Transaction Flow', () => {
        // Helper tạo mock connection
        const createMockConnection = (customHandlers = {}) => {
            let transactionStarted = false;
            let transactionCommitted = false;
            let transactionRolledBack = false;
            let connectionReleased = false;

            const executedQueries = [];

            const mockConnection = {
                beginTransaction: async () => { transactionStarted = true; },
                commit: async () => { transactionCommitted = true; },
                rollback: async () => { transactionRolledBack = true; },
                release: () => { connectionReleased = true; },
                execute: async (sql, params) => {
                    executedQueries.push({ sql, params });
                    if (customHandlers.execute) {
                        return customHandlers.execute(sql, params);
                    }
                    // Mặc định phản hồi thành công
                    if (sql.includes('FROM users WHERE UserID')) {
                        return [[{ UserID: params[0], FullName: 'Nguyen Van A' }]];
                    }
                    if (sql.includes('FROM rooms WHERE RoomID')) {
                        return [[{ RoomID: params[0], RoomName: 'Phòng Hội Nghị A', Capacity: 20, Status: 'Active' }]];
                    }
                    if (sql.includes('BookingStatus = \'Confirmed\'')) {
                        return [[]]; // Không bị trùng
                    }
                    if (sql.includes('INSERT INTO meetings')) {
                        return [{ insertId: 1001 }];
                    }
                    if (sql.includes('INSERT INTO bookings')) {
                        return [{ insertId: 2001 }];
                    }
                    return [{}];
                },
                getFlags: () => ({
                    transactionStarted,
                    transactionCommitted,
                    transactionRolledBack,
                    connectionReleased,
                    executedQueries
                })
            };

            return mockConnection;
        };

        it('should successfully create meeting and commit transaction when data is valid', async () => {
            const mockConn = createMockConnection();
            const originalGetConnection = db.getConnection;
            db.getConnection = async () => mockConn;

            try {
                const meetingData = {
                    title: 'Họp Tổng Kết',
                    description: 'Đánh giá KPI',
                    startTime: '2026-10-01 09:00:00',
                    endTime: '2026-10-01 10:00:00',
                    organizerId: 1,
                    roomId: 2,
                    isRecurring: false,
                    participantIds: [2, 3],
                    equipmentIds: [5]
                };

                const result = await Meeting.create(meetingData);

                const flags = mockConn.getFlags();
                assert.equal(flags.transactionStarted, true);
                assert.equal(flags.transactionCommitted, true);
                assert.equal(flags.transactionRolledBack, false);
                assert.equal(flags.connectionReleased, true);

                assert.equal(result.meetingId, 1001);
                assert.equal(result.bookingId, 2001);
                assert.equal(result.title, 'Họp Tổng Kết');
                assert.equal(result.roomName, 'Phòng Hội Nghị A');
                assert.equal(result.participantCount, 2);
                assert.equal(result.equipmentCount, 1);
            } finally {
                db.getConnection = originalGetConnection;
            }
        });

        it('should rollback and throw 404 when organizer does not exist', async () => {
            const mockConn = createMockConnection({
                execute: async (sql, params) => {
                    if (sql.includes('FROM users WHERE UserID')) {
                        return [[]]; // Không tìm thấy User
                    }
                    return [[]];
                }
            });

            const originalGetConnection = db.getConnection;
            db.getConnection = async () => mockConn;

            try {
                await assert.rejects(
                    async () => {
                        await Meeting.create({
                            title: 'Họp Test',
                            startTime: '2026-10-01 09:00:00',
                            endTime: '2026-10-01 10:00:00',
                            organizerId: 999,
                            roomId: 1
                        });
                    },
                    (err) => {
                        assert.equal(err.status, 404);
                        assert.ok(err.message.includes('Người tổ chức với ID 999 không tồn tại'));
                        return true;
                    }
                );

                const flags = mockConn.getFlags();
                assert.equal(flags.transactionRolledBack, true);
                assert.equal(flags.connectionReleased, true);
            } finally {
                db.getConnection = originalGetConnection;
            }
        });

        it('should rollback and throw 404 when room does not exist', async () => {
            const mockConn = createMockConnection({
                execute: async (sql, params) => {
                    if (sql.includes('FROM users WHERE UserID')) {
                        return [[{ UserID: params[0], FullName: 'Nguyen Van A' }]];
                    }
                    if (sql.includes('FROM rooms WHERE RoomID')) {
                        return [[]]; // Không tìm thấy phòng
                    }
                    return [[]];
                }
            });

            const originalGetConnection = db.getConnection;
            db.getConnection = async () => mockConn;

            try {
                await assert.rejects(
                    async () => {
                        await Meeting.create({
                            title: 'Họp Test',
                            startTime: '2026-10-01 09:00:00',
                            endTime: '2026-10-01 10:00:00',
                            organizerId: 1,
                            roomId: 999
                        });
                    },
                    (err) => {
                        assert.equal(err.status, 404);
                        assert.ok(err.message.includes('Phòng họp với ID 999 không tồn tại'));
                        return true;
                    }
                );

                const flags = mockConn.getFlags();
                assert.equal(flags.transactionRolledBack, true);
                assert.equal(flags.connectionReleased, true);
            } finally {
                db.getConnection = originalGetConnection;
            }
        });

        it('should rollback and throw 400 when room is not in Active status (e.g. Maintenance)', async () => {
            const mockConn = createMockConnection({
                execute: async (sql, params) => {
                    if (sql.includes('FROM users WHERE UserID')) {
                        return [[{ UserID: params[0], FullName: 'Nguyen Van A' }]];
                    }
                    if (sql.includes('FROM rooms WHERE RoomID')) {
                        return [[{ RoomID: params[0], RoomName: 'Phòng B', Capacity: 10, Status: 'Maintenance' }]];
                    }
                    return [[]];
                }
            });

            const originalGetConnection = db.getConnection;
            db.getConnection = async () => mockConn;

            try {
                await assert.rejects(
                    async () => {
                        await Meeting.create({
                            title: 'Họp Test',
                            startTime: '2026-10-01 09:00:00',
                            endTime: '2026-10-01 10:00:00',
                            organizerId: 1,
                            roomId: 2
                        });
                    },
                    (err) => {
                        assert.equal(err.status, 400);
                        assert.ok(err.message.includes('hiện không khả dụng (Trạng thái: Maintenance)'));
                        return true;
                    }
                );

                const flags = mockConn.getFlags();
                assert.equal(flags.transactionRolledBack, true);
                assert.equal(flags.connectionReleased, true);
            } finally {
                db.getConnection = originalGetConnection;
            }
        });

        it('should rollback and throw 409 when room has schedule overlap', async () => {
            const mockConn = createMockConnection({
                execute: async (sql, params) => {
                    if (sql.includes('FROM users WHERE UserID')) {
                        return [[{ UserID: params[0], FullName: 'Nguyen Van A' }]];
                    }
                    if (sql.includes('FROM rooms WHERE RoomID')) {
                        return [[{ RoomID: params[0], RoomName: 'Phòng VIP', Capacity: 10, Status: 'Active' }]];
                    }
                    if (sql.includes('BookingStatus = \'Confirmed\'')) {
                        return [[{ MeetingID: 88, Title: 'Họp Trùng Giờ' }]]; // Đã có cuộc họp trùng
                    }
                    return [[]];
                }
            });

            const originalGetConnection = db.getConnection;
            db.getConnection = async () => mockConn;

            try {
                await assert.rejects(
                    async () => {
                        await Meeting.create({
                            title: 'Họp Trùng',
                            startTime: '2026-10-01 09:00:00',
                            endTime: '2026-10-01 10:00:00',
                            organizerId: 1,
                            roomId: 2
                        });
                    },
                    (err) => {
                        assert.equal(err.status, 409);
                        assert.ok(err.message.includes('đã có người đặt trong khung giờ này'));
                        return true;
                    }
                );

                const flags = mockConn.getFlags();
                assert.equal(flags.transactionRolledBack, true);
                assert.equal(flags.connectionReleased, true);
            } finally {
                db.getConnection = originalGetConnection;
            }
        });
    });
});
