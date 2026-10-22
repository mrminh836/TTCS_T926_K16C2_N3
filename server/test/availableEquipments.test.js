/**
 * Bộ kiểm thử tự động cho API GET /api/equipments/available (Lọc thiết bị khả dụng theo thời gian thực - Luồng 2.3)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Equipment = require('../models/equipmentModel');
const equipmentController = require('../controllers/equipmentController');
const {
    validateAvailableEquipmentsQuery,
    validateAvailableEquipmentsMiddleware
} = require('../validators/equipmentValidator');

function createMockReqRes({ params = {}, query = {}, body = {}, validatedEquipmentQuery } = {}) {
    const req = {
        params,
        query,
        body,
        validatedEquipmentQuery
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

describe('API GET /api/equipments/available - Lọc thiết bị khả dụng (Luồng 2.3)', () => {

    // =====================================================
    // 1. VALIDATOR: validateAvailableEquipmentsQuery
    // =====================================================
    describe('1. Validator: validateAvailableEquipmentsQuery', () => {

        it('TC-EQ-VAL-001: Hợp lệ với date, startTime và endTime', () => {
            const query = {
                date: '2026-10-15',
                startTime: '09:00',
                endTime: '10:30'
            };
            const result = validateAvailableEquipmentsQuery(query);
            assert.equal(result.isValid, true);
            assert.equal(result.errors.length, 0);
            assert.match(result.data.startTime, /2026-10-15 09:00:00/);
            assert.match(result.data.endTime, /2026-10-15 10:30:00/);
        });

        it('TC-EQ-VAL-002: Hợp lệ với chuỗi ISO datetime trực tiếp', () => {
            const query = {
                startTime: '2026-10-15T14:00:00.000Z',
                endTime: '2026-10-15T15:30:00.000Z'
            };
            const result = validateAvailableEquipmentsQuery(query);
            assert.equal(result.isValid, true);
        });

        it('TC-EQ-VAL-003: Hợp lệ với type và excludeMeetingId', () => {
            const query = {
                date: '2026-10-15',
                startTime: '09:00',
                endTime: '10:00',
                type: 'Máy chiếu',
                excludeMeetingId: '5'
            };
            const result = validateAvailableEquipmentsQuery(query);
            assert.equal(result.isValid, true);
            assert.equal(result.data.type, 'Máy chiếu');
            assert.equal(result.data.excludeMeetingId, 5);
        });

        it('TC-EQ-VAL-004: Báo lỗi khi thiếu startTime hoặc endTime', () => {
            const result1 = validateAvailableEquipmentsQuery({ date: '2026-10-15' });
            assert.equal(result1.isValid, false);
            assert.match(result1.errors[0], /cung cấp đầy đủ thời gian/);

            const result2 = validateAvailableEquipmentsQuery({ date: '2026-10-15', startTime: '09:00' });
            assert.equal(result2.isValid, false);
        });

        it('TC-EQ-VAL-005: Báo lỗi khi endTime trước hoặc bằng startTime', () => {
            const query = {
                date: '2026-10-15',
                startTime: '10:00',
                endTime: '09:00'
            };
            const result = validateAvailableEquipmentsQuery(query);
            assert.equal(result.isValid, false);
            assert.match(result.errors[0], /Thời gian kết thúc phải diễn ra sau/);
        });

        it('TC-EQ-VAL-006: Báo lỗi khi thời lượng nhỏ hơn 5 phút', () => {
            const query = {
                date: '2026-10-15',
                startTime: '10:00',
                endTime: '10:03'
            };
            const result = validateAvailableEquipmentsQuery(query);
            assert.equal(result.isValid, false);
            assert.match(result.errors[0], /tối thiểu phải từ 5 phút/);
        });

        it('TC-EQ-VAL-007: Báo lỗi khi excludeMeetingId không phải số nguyên dương', () => {
            const query = {
                date: '2026-10-15',
                startTime: '09:00',
                endTime: '10:00',
                excludeMeetingId: 'abc'
            };
            const result = validateAvailableEquipmentsQuery(query);
            assert.equal(result.isValid, false);
            assert.match(result.errors[0], /excludeMeetingId/);
        });
    });

    // =====================================================
    // 2. MODEL: Equipment.findAvailableEquipments
    // =====================================================
    describe('2. Model: Equipment', () => {

        it('TC-EQ-MOD-001: findAvailableEquipments trả về mảng các thiết bị khả dụng', async () => {
            const equipments = await Equipment.findAvailableEquipments({
                startTime: '2026-10-15 09:00:00',
                endTime: '2026-10-15 10:30:00'
            });
            assert.ok(Array.isArray(equipments));
            assert.ok(equipments.length > 0);
        });

        it('TC-EQ-MOD-002: Tuyệt đối KHÔNG trả về thiết bị đang Bảo trì (Maintenance)', async () => {
            const equipments = await Equipment.findAvailableEquipments({
                startTime: '2026-10-15 09:00:00',
                endTime: '2026-10-15 10:30:00'
            });
            for (const eq of equipments) {
                assert.notEqual(eq.status.toLowerCase(), 'maintenance', 'Thiết bị bảo trì không được xuất hiện');
                assert.equal(eq.isAvailable, true);
                assert.notEqual(eq.id, 7, 'Thiết bị ID 7 (Epson bảo trì) phải bị lọc bỏ');
            }
        });

        it('TC-EQ-MOD-003: Lọc thiết bị theo phân loại (Type = Máy chiếu)', async () => {
            const equipments = await Equipment.findAvailableEquipments({
                startTime: '2026-10-15 09:00:00',
                endTime: '2026-10-15 10:30:00',
                type: 'Máy chiếu'
            });
            assert.ok(equipments.length > 0);
            for (const eq of equipments) {
                assert.equal(eq.type.toLowerCase(), 'máy chiếu');
            }
        });

        it('TC-EQ-MOD-004: Equipment.findById() với ID hợp lệ và không hợp lệ', async () => {
            const eq = await Equipment.findById(1);
            assert.ok(eq !== null);
            assert.equal(eq.id, 1);

            const notFound = await Equipment.findById(99999);
            assert.equal(notFound, null);
        });
    });

    // =====================================================
    // 3. CONTROLLER: getAvailableEquipments & getAllEquipments
    // =====================================================
    describe('3. Controller: equipmentController', () => {

        it('TC-EQ-CTRL-001: getAvailableEquipments trả về 200 kèm danh sách thiết bị', async () => {
            const validatedEquipmentQuery = {
                startTime: '2026-10-15 09:00:00',
                endTime: '2026-10-15 10:30:00'
            };
            const { req, res } = createMockReqRes({ validatedEquipmentQuery });

            await equipmentController.getAvailableEquipments(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.ok(Array.isArray(res.jsonData.data));
            assert.equal(res.jsonData.totalAvailable, res.jsonData.data.length);
        });

        it('TC-EQ-CTRL-002: getAllEquipments trả về toàn bộ danh mục thiết bị', async () => {
            const { req, res } = createMockReqRes();
            await equipmentController.getAllEquipments(req, res, () => {});

            assert.equal(res.statusCode, 200);
            assert.equal(res.jsonData.success, true);
            assert.ok(res.jsonData.data.length >= 10);
        });

        it('TC-EQ-CTRL-003: getEquipmentById trả về 404 cho thiết bị không tồn tại', async () => {
            const { req, res } = createMockReqRes({ params: { id: '99999' } });
            await equipmentController.getEquipmentById(req, res, () => {});

            assert.equal(res.statusCode, 404);
            assert.equal(res.jsonData.success, false);
            assert.match(res.jsonData.message, /Không tìm thấy thiết bị/);
        });
    });
});
