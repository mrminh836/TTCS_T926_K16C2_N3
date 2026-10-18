/**
 * Model Báo cáo & Thống kê Hiệu suất Phòng họp (Report & Analytics Model)
 * Dự án: Quản lý Cuộc họp Doanh nghiệp (TTCS_T926_K16C2_N3)
 *
 * Tính toán:
 * 1. Tần suất sử dụng phòng họp (Meeting counts, total hours, usage share %, ranking)
 * 2. Tỷ lệ lấp đầy % (Time occupancy rate % & Capacity / Seat occupancy rate %)
 * 3. Tỷ lệ cuộc họp bị hủy % (Cancellation rate % toàn hệ thống và theo từng phòng)
 * 4. Phân bổ trạng thái cuộc họp & Xu hướng sử dụng theo ngày (Timeline)
 */

const db = require('../config/database');

const ReportModel = {
    /**
     * Lấy dữ liệu phân tích và thống kê hiệu suất theo các điều kiện lọc
     * @param {Object} filters
     * @param {string} [filters.startDate] - YYYY-MM-DD
     * @param {string} [filters.endDate] - YYYY-MM-DD
     * @param {number} [filters.roomId] - ID phòng họp cụ thể
     * @param {number} [filters.workingHoursPerDay=10] - Số giờ làm việc chuẩn mỗi ngày
     * @returns {Promise<Object>}
     */
    getAnalytics: async (filters = {}) => {
        const {
            startDate,
            endDate,
            roomId,
            workingHoursPerDay = 10
        } = filters;

        // 1. Xác định khung thời gian khảo sát
        let effectiveStartDate = startDate;
        let effectiveEndDate = endDate;

        if (!effectiveStartDate || !effectiveEndDate) {
            // Tra cứu ngày bắt đầu nhỏ nhất và lớn nhất trong CSDL
            const [dateBoundRows] = await db.query(`
                SELECT 
                    MIN(DATE(StartTime)) AS minDate,
                    MAX(DATE(StartTime)) AS maxDate
                FROM Meetings
            `);

            const minDateInDb = dateBoundRows[0]?.minDate;
            const maxDateInDb = dateBoundRows[0]?.maxDate;

            if (!effectiveStartDate) {
                effectiveStartDate = minDateInDb ? formatDateOnly(minDateInDb) : new Date().toISOString().slice(0, 10);
            }
            if (!effectiveEndDate) {
                effectiveEndDate = maxDateInDb ? formatDateOnly(maxDateInDb) : effectiveStartDate;
            }

            // Nếu minDate > maxDate (ví dụ rỗng), chuẩn hóa cùng 1 ngày
            if (new Date(effectiveStartDate) > new Date(effectiveEndDate)) {
                effectiveEndDate = effectiveStartDate;
            }
        }

        // Tính tổng số ngày trong kỳ khảo sát (tối thiểu 1 ngày)
        const dayDifferenceMs = new Date(effectiveEndDate).getTime() - new Date(effectiveStartDate).getTime();
        const totalDays = Math.max(1, Math.round(dayDifferenceMs / (1000 * 60 * 60 * 24)) + 1);
        const availableHoursPerRoom = totalDays * workingHoursPerDay;

        // 2. Xây dựng điều kiện lọc cho cuộc họp (Meetings filter conditions)
        const meetingConditions = [];
        const meetingParams = [];

        if (effectiveStartDate) {
            meetingConditions.push('DATE(m.StartTime) >= ?');
            meetingParams.push(effectiveStartDate);
        }
        if (effectiveEndDate) {
            meetingConditions.push('DATE(m.StartTime) <= ?');
            meetingParams.push(effectiveEndDate);
        }
        if (roomId) {
            meetingConditions.push('b.RoomID = ?');
            meetingParams.push(roomId);
        }

        const meetingWhereClause = meetingConditions.length > 0 
            ? 'WHERE ' + meetingConditions.join(' AND ') 
            : '';

        // 3. Tổng hợp số liệu Cấp cao toàn hệ thống (System Overview Summary)
        const summarySql = `
            SELECT 
                COUNT(DISTINCT m.MeetingID) AS totalMeetings,
                SUM(CASE WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) IN ('cancelled', 'canceled') THEN 1 ELSE 0 END) AS cancelledMeetings,
                SUM(CASE WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) = 'confirmed' THEN 1 ELSE 0 END) AS confirmedMeetings,
                SUM(CASE WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) = 'completed' THEN 1 ELSE 0 END) AS completedMeetings,
                COALESCE(SUM(CASE 
                    WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) NOT IN ('cancelled', 'canceled') 
                    THEN TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime) 
                    ELSE 0 
                END), 0) AS totalDurationMinutes
            FROM Meetings m
            JOIN Bookings b ON m.MeetingID = b.MeetingID
            ${meetingWhereClause}
        `;

        const [summaryRows] = await db.query(summarySql, meetingParams);
        const rawSummary = summaryRows[0] || {};

        const totalMeetings = Number(rawSummary.totalMeetings || 0);
        const cancelledMeetings = Number(rawSummary.cancelledMeetings || 0);
        const confirmedMeetings = Number(rawSummary.confirmedMeetings || 0);
        const completedMeetings = Number(rawSummary.completedMeetings || 0);
        const otherMeetings = Math.max(0, totalMeetings - cancelledMeetings - confirmedMeetings - completedMeetings);
        const totalDurationMinutes = Number(rawSummary.totalDurationMinutes || 0);
        const totalBookingHours = roundToTwo(totalDurationMinutes / 60.0);

        // Tỷ lệ cuộc họp bị hủy (%) toàn hệ thống
        const cancellationRate = totalMeetings > 0 
            ? roundToTwo((cancelledMeetings / totalMeetings) * 100) 
            : 0;

        // Thời lượng trung bình mỗi cuộc họp diễn ra
        const effectiveMeetingCount = totalMeetings - cancelledMeetings;
        const averageMeetingDurationMinutes = effectiveMeetingCount > 0 
            ? roundToTwo(totalDurationMinutes / effectiveMeetingCount) 
            : 0;

        // 4. Lấy số lượng phòng họp và danh sách phòng phục vụ tính toán
        let roomCondition = '';
        const roomParams = [];
        if (roomId) {
            roomCondition = 'WHERE r.RoomID = ?';
            roomParams.push(roomId);
        }

        const [roomListRows] = await db.query(`
            SELECT 
                r.RoomID    AS roomId,
                r.RoomCode  AS roomCode,
                r.RoomName  AS roomName,
                r.Capacity  AS capacity,
                r.Type      AS type,
                r.Floor     AS floor,
                r.Status    AS status
            FROM Rooms r
            ${roomCondition}
            ORDER BY r.RoomID ASC
        `, roomParams);

        const totalRooms = roomListRows.length;
        const activeRoomsCount = roomListRows.filter(r => (r.status || '').toLowerCase() === 'active').length || totalRooms;

        // 5. Thống kê chi tiết Tần suất sử dụng & Tỷ lệ lấp đầy theo từng phòng
        // Lưu ý: LEFT JOIN để phòng chưa có cuộc họp nào vẫn hiển thị với thông số 0
        const roomStatsSql = `
            SELECT 
                r.RoomID    AS roomId,
                COUNT(m.MeetingID) AS totalMeetings,
                SUM(CASE WHEN m.MeetingID IS NOT NULL AND LOWER(b.BookingStatus) IN ('cancelled', 'canceled') THEN 1 ELSE 0 END) AS cancelledMeetings,
                SUM(CASE WHEN m.MeetingID IS NOT NULL AND LOWER(COALESCE(b.BookingStatus, 'confirmed')) = 'confirmed' THEN 1 ELSE 0 END) AS confirmedMeetings,
                SUM(CASE WHEN m.MeetingID IS NOT NULL AND LOWER(b.BookingStatus) = 'completed' THEN 1 ELSE 0 END) AS completedMeetings,
                COALESCE(SUM(CASE 
                    WHEN m.MeetingID IS NOT NULL AND LOWER(COALESCE(b.BookingStatus, 'confirmed')) NOT IN ('cancelled', 'canceled') 
                    THEN TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime) 
                    ELSE 0 
                END), 0) AS totalMinutes
            FROM Rooms r
            LEFT JOIN Bookings b ON r.RoomID = b.RoomID
            LEFT JOIN Meetings m ON b.MeetingID = m.MeetingID 
                AND DATE(m.StartTime) >= ? 
                AND DATE(m.StartTime) <= ?
            ${roomCondition}
            GROUP BY r.RoomID
        `;

        const [roomStatsRows] = await db.query(roomStatsSql, [
            effectiveStartDate,
            effectiveEndDate,
            ...roomParams
        ]);

        const statsByRoomId = new Map();
        for (const row of roomStatsRows) {
            statsByRoomId.set(Number(row.roomId), row);
        }

        // 6. Truy vấn số lượng người tham gia thực tế trung bình cho từng cuộc họp để tính Tỷ lệ lấp đầy sức chứa (% Capacity Occupancy)
        const participantOccupancySql = `
            SELECT 
                m.MeetingID,
                b.RoomID,
                r.Capacity,
                GREATEST(1, COUNT(mp.UserID)) AS participantCount
            FROM Meetings m
            JOIN Bookings b ON m.MeetingID = b.MeetingID
            JOIN Rooms r ON b.RoomID = r.RoomID
            LEFT JOIN Meeting_Participants mp ON m.MeetingID = mp.MeetingID
            ${meetingWhereClause ? meetingWhereClause + " AND LOWER(COALESCE(b.BookingStatus, 'confirmed')) NOT IN ('cancelled', 'canceled')" : "WHERE LOWER(COALESCE(b.BookingStatus, 'confirmed')) NOT IN ('cancelled', 'canceled')"}
            GROUP BY m.MeetingID, b.RoomID, r.Capacity
        `;

        const [participantRows] = await db.query(participantOccupancySql, meetingParams);

        // Nhóm số liệu sức chứa theo roomId và tính trung bình toàn hệ thống
        const roomCapacityStats = new Map();
        let totalParticipantCountsAll = 0;
        let totalSeatOccupancyPctAll = 0;
        let totalEffectiveMeetingsAll = participantRows.length;

        for (const row of participantRows) {
            const rId = Number(row.RoomID);
            const count = Number(row.participantCount || 1);
            const cap = Number(row.Capacity || 1);
            const seatPct = Math.min(100, (count / cap) * 100);

            totalParticipantCountsAll += count;
            totalSeatOccupancyPctAll += seatPct;

            if (!roomCapacityStats.has(rId)) {
                roomCapacityStats.set(rId, { totalParticipants: 0, totalSeatPct: 0, count: 0 });
            }
            const current = roomCapacityStats.get(rId);
            current.totalParticipants += count;
            current.totalSeatPct += seatPct;
            current.count += 1;
        }

        // Tỷ lệ lấp đầy sức chứa trung bình toàn hệ thống
        const systemCapacityOccupancyRate = totalEffectiveMeetingsAll > 0 
            ? roundToTwo(totalSeatOccupancyPctAll / totalEffectiveMeetingsAll) 
            : 0;

        // Tỷ lệ lấp đầy thời gian toàn hệ thống
        const totalSystemAvailableHours = (activeRoomsCount || 1) * availableHoursPerRoom;
        const systemTimeOccupancyRate = totalSystemAvailableHours > 0 
            ? Math.min(100, roundToTwo((totalBookingHours / totalSystemAvailableHours) * 100)) 
            : 0;

        // 7. Tổng hợp danh sách từng phòng với đầy đủ chỉ số hiệu suất
        const roomUtilization = roomListRows.map(room => {
            const stats = statsByRoomId.get(Number(room.roomId)) || {};
            const rTotalMeetings = Number(stats.totalMeetings || 0);
            const rCancelledMeetings = Number(stats.cancelledMeetings || 0);
            const rConfirmedMeetings = Number(stats.confirmedMeetings || 0);
            const rCompletedMeetings = Number(stats.completedMeetings || 0);
            const rTotalMinutes = Number(stats.totalMinutes || 0);
            const rTotalHours = roundToTwo(rTotalMinutes / 60.0);

            // Tỷ lệ hủy của riêng phòng
            const rCancellationRate = rTotalMeetings > 0 
                ? roundToTwo((rCancelledMeetings / rTotalMeetings) * 100) 
                : 0;

            // Tần suất sử dụng phòng (%) = (Số cuộc họp của phòng / Tổng số cuộc họp toàn hệ thống) * 100
            const usageShare = totalMeetings > 0 
                ? roundToTwo((rTotalMeetings / totalMeetings) * 100) 
                : 0;

            // Tỷ lệ lấp đầy theo thời gian của riêng phòng (%) = (Tổng giờ dùng / Tổng giờ khả dụng của phòng) * 100
            const timeOccupancyRate = availableHoursPerRoom > 0 
                ? Math.min(100, roundToTwo((rTotalHours / availableHoursPerRoom) * 100)) 
                : 0;

            // Tỷ lệ lấp đầy sức chứa của riêng phòng (%)
            const capData = roomCapacityStats.get(Number(room.roomId));
            const averageParticipants = capData && capData.count > 0 
                ? roundToTwo(capData.totalParticipants / capData.count) 
                : 0;
            const capacityOccupancyRate = capData && capData.count > 0 
                ? Math.min(100, roundToTwo(capData.totalSeatPct / capData.count)) 
                : 0;

            return {
                roomId: room.roomId,
                roomCode: room.roomCode,
                roomName: room.roomName,
                capacity: room.capacity,
                type: room.type,
                floor: room.floor,
                status: room.status,
                totalMeetings: rTotalMeetings,
                confirmedMeetings: rConfirmedMeetings,
                completedMeetings: rCompletedMeetings,
                cancelledMeetings: rCancelledMeetings,
                cancellationRate: rCancellationRate,
                totalHours: rTotalHours,
                totalMinutes: rTotalMinutes,
                usageShare,
                timeOccupancyRate,
                capacityOccupancyRate,
                averageParticipants
            };
        });

        // Xếp hạng (Rank) phòng theo tổng số giờ sử dụng giảm dần (và số cuộc họp)
        roomUtilization.sort((a, b) => b.totalHours - a.totalHours || b.totalMeetings - a.totalMeetings);
        roomUtilization.forEach((item, index) => {
            item.rank = index + 1;
        });

        // 8. Xác định Phòng được dùng nhiều nhất (Most Utilized) & ít nhất (Least Utilized)
        const activeUtilizedRooms = roomUtilization.filter(r => (r.status || '').toLowerCase() === 'active');
        const mostUtilized = activeUtilizedRooms.length > 0 ? {
            roomId: activeUtilizedRooms[0].roomId,
            roomCode: activeUtilizedRooms[0].roomCode,
            roomName: activeUtilizedRooms[0].roomName,
            totalMeetings: activeUtilizedRooms[0].totalMeetings,
            totalHours: activeUtilizedRooms[0].totalHours,
            occupancyRate: activeUtilizedRooms[0].timeOccupancyRate
        } : null;

        const leastUtilizedSource = [...activeUtilizedRooms].reverse();
        const leastUtilized = leastUtilizedSource.length > 0 ? {
            roomId: leastUtilizedSource[0].roomId,
            roomCode: leastUtilizedSource[0].roomCode,
            roomName: leastUtilizedSource[0].roomName,
            totalMeetings: leastUtilizedSource[0].totalMeetings,
            totalHours: leastUtilizedSource[0].totalHours,
            occupancyRate: leastUtilizedSource[0].timeOccupancyRate
        } : null;

        // 9. Phân bổ trạng thái cuộc họp (Status Distribution)
        const statusDistribution = {
            confirmed: {
                count: confirmedMeetings,
                percentage: totalMeetings > 0 ? roundToTwo((confirmedMeetings / totalMeetings) * 100) : 0
            },
            completed: {
                count: completedMeetings,
                percentage: totalMeetings > 0 ? roundToTwo((completedMeetings / totalMeetings) * 100) : 0
            },
            cancelled: {
                count: cancelledMeetings,
                percentage: totalMeetings > 0 ? roundToTwo((cancelledMeetings / totalMeetings) * 100) : 0
            }
        };

        if (otherMeetings > 0) {
            statusDistribution.other = {
                count: otherMeetings,
                percentage: totalMeetings > 0 ? roundToTwo((otherMeetings / totalMeetings) * 100) : 0
            };
        }

        // 10. Xu hướng sử dụng theo ngày (Daily Timeline Trends)
        const timelineSql = `
            SELECT 
                DATE(m.StartTime) AS meetingDate,
                COUNT(DISTINCT m.MeetingID) AS meetingCount,
                COALESCE(SUM(CASE 
                    WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) NOT IN ('cancelled', 'canceled') 
                    THEN TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime) 
                    ELSE 0 
                END), 0) AS totalMinutes,
                SUM(CASE WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) IN ('cancelled', 'canceled') THEN 1 ELSE 0 END) AS cancelledCount
            FROM Meetings m
            JOIN Bookings b ON m.MeetingID = b.MeetingID
            ${meetingWhereClause}
            GROUP BY DATE(m.StartTime)
            ORDER BY meetingDate ASC
        `;

        const [timelineRows] = await db.query(timelineSql, meetingParams);
        const timeline = (timelineRows || []).map(row => ({
            date: formatDateOnly(row.meetingDate),
            meetingCount: Number(row.meetingCount || 0),
            totalHours: roundToTwo(Number(row.totalMinutes || 0) / 60.0),
            cancelledCount: Number(row.cancelledCount || 0)
        }));

        // Trả về cấu trúc kết quả phân tích hoàn chỉnh
        return {
            filter: {
                startDate: effectiveStartDate,
                endDate: effectiveEndDate,
                roomId: roomId ? Number(roomId) : null,
                totalDays,
                workingHoursPerDay
            },
            summary: {
                totalMeetings,
                confirmedMeetings,
                completedMeetings,
                cancelledMeetings,
                cancellationRate,
                totalRooms,
                activeRooms: activeRoomsCount,
                totalBookingHours,
                averageMeetingDurationMinutes,
                timeOccupancyRate: systemTimeOccupancyRate,
                capacityOccupancyRate: systemCapacityOccupancyRate,
                overallOccupancyRate: systemTimeOccupancyRate
            },
            statusDistribution,
            topRooms: {
                mostUtilized,
                leastUtilized
            },
            roomUtilization,
            timeline
        };
    },

    /**
     * Lọc danh sách báo cáo chi tiết theo khoảng thời gian và phòng ban
     * @param {Object} filters
     * @returns {Promise<Object>}
     */
    filterReports: async (filters = {}) => {
        const {
            startDate,
            endDate,
            department,
            roomId,
            status,
            page = 1,
            limit = 10
        } = filters;

        const conditions = [];
        const params = [];

        if (startDate) {
            conditions.push('DATE(m.StartTime) >= ?');
            params.push(startDate);
        }
        if (endDate) {
            conditions.push('DATE(m.StartTime) <= ?');
            params.push(endDate);
        }
        if (roomId) {
            conditions.push('b.RoomID = ?');
            params.push(roomId);
        }
        if (status) {
            conditions.push('LOWER(b.BookingStatus) = LOWER(?)');
            params.push(status);
        }
        if (department) {
            conditions.push('(LOWER(COALESCE(u.Department, "")) = LOWER(?) OR EXISTS (SELECT 1 FROM Meeting_Participants mp JOIN Users pu ON mp.UserID = pu.UserID WHERE mp.MeetingID = m.MeetingID AND LOWER(COALESCE(pu.Department, "")) = LOWER(?)))');
            params.push(department, department);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // 1. Đếm tổng số bản ghi phục vụ phân trang
        const countSql = `
            SELECT COUNT(DISTINCT m.MeetingID) AS total
            FROM Meetings m
            LEFT JOIN Bookings b ON m.MeetingID = b.MeetingID
            LEFT JOIN Rooms r ON b.RoomID = r.RoomID
            LEFT JOIN Users u ON m.OrganizerID = u.UserID
            ${whereClause}
        `;
        const [countRows] = await db.query(countSql, params);
        const total = Number(countRows[0]?.total || 0);
        const totalPages = Math.ceil(total / limit) || 1;
        const offset = (page - 1) * limit;

        // 2. Truy vấn danh sách cuộc họp chi tiết
        const listSql = `
            SELECT 
                m.MeetingID     AS meetingId,
                m.Title         AS title,
                m.Description   AS description,
                m.StartTime     AS startTime,
                m.EndTime       AS endTime,
                TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime) AS durationMinutes,
                ROUND(TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime) / 60.0, 2) AS durationHours,
                m.IsRecurring   AS isRecurring,
                m.CreatedAt     AS createdAt,
                m.OrganizerID   AS organizerId,
                u.FullName      AS organizerName,
                u.Email         AS organizerEmail,
                COALESCE(u.Department, 'Kỹ thuật') AS organizerDepartment,
                u.Role          AS organizerRole,
                b.BookingID     AS bookingId,
                COALESCE(b.BookingStatus, 'Confirmed') AS bookingStatus,
                r.RoomID        AS roomId,
                r.RoomName      AS roomName,
                r.RoomCode      AS roomCode,
                r.Capacity      AS roomCapacity,
                r.Type          AS roomType,
                r.Floor         AS roomFloor,
                (SELECT COUNT(*) FROM Meeting_Participants mp WHERE mp.MeetingID = m.MeetingID) AS participantCount,
                (SELECT GROUP_CONCAT(pu.FullName SEPARATOR ', ') FROM Meeting_Participants mp JOIN Users pu ON mp.UserID = pu.UserID WHERE mp.MeetingID = m.MeetingID) AS participantNames
            FROM Meetings m
            LEFT JOIN Bookings b ON m.MeetingID = b.MeetingID
            LEFT JOIN Rooms r ON b.RoomID = r.RoomID
            LEFT JOIN Users u ON m.OrganizerID = u.UserID
            ${whereClause}
            ORDER BY m.StartTime DESC
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, Number(limit), Number(offset)];
        const [meetingRows] = await db.query(listSql, dataParams);

        // 3. Tóm tắt KPI của tập dữ liệu lọc
        const summarySql = `
            SELECT 
                COUNT(DISTINCT m.MeetingID) AS totalMeetings,
                SUM(CASE WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) IN ('cancelled', 'canceled') THEN 1 ELSE 0 END) AS cancelledMeetings,
                SUM(CASE WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) = 'confirmed' THEN 1 ELSE 0 END) AS confirmedMeetings,
                SUM(CASE WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) = 'completed' THEN 1 ELSE 0 END) AS completedMeetings,
                COALESCE(SUM(CASE 
                    WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) NOT IN ('cancelled', 'canceled') 
                    THEN TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime) 
                    ELSE 0 
                END), 0) AS totalDurationMinutes,
                COUNT(DISTINCT b.RoomID) AS roomsUsedCount
            FROM Meetings m
            LEFT JOIN Bookings b ON m.MeetingID = b.MeetingID
            LEFT JOIN Users u ON m.OrganizerID = u.UserID
            ${whereClause}
        `;
        const [summaryRows] = await db.query(summarySql, params);
        const sum = summaryRows[0] || {};
        const sumTotal = Number(sum.totalMeetings || 0);
        const sumCancelled = Number(sum.cancelledMeetings || 0);
        const sumConfirmed = Number(sum.confirmedMeetings || 0);
        const sumCompleted = Number(sum.completedMeetings || 0);
        const sumMinutes = Number(sum.totalDurationMinutes || 0);
        const sumHours = roundToTwo(sumMinutes / 60.0);
        const cancellationRate = sumTotal > 0 ? roundToTwo((sumCancelled / sumTotal) * 100) : 0;
        const effectiveMeetings = sumTotal - sumCancelled;
        const averageMeetingDurationMinutes = effectiveMeetings > 0 ? roundToTwo(sumMinutes / effectiveMeetings) : 0;

        // 4. Phân bổ theo Phòng ban (Department Breakdown)
        const deptSql = `
            SELECT 
                COALESCE(u.Department, 'Khác') AS department,
                COUNT(DISTINCT m.MeetingID) AS meetingCount,
                ROUND(COALESCE(SUM(TIMESTAMPDIFF(MINUTE, m.StartTime, m.EndTime)), 0) / 60.0, 2) AS totalHours,
                SUM(CASE WHEN LOWER(COALESCE(b.BookingStatus, 'confirmed')) IN ('cancelled', 'canceled') THEN 1 ELSE 0 END) AS cancelledCount
            FROM Meetings m
            LEFT JOIN Bookings b ON m.MeetingID = b.MeetingID
            LEFT JOIN Users u ON m.OrganizerID = u.UserID
            ${whereClause}
            GROUP BY COALESCE(u.Department, 'Khác')
            ORDER BY meetingCount DESC
        `;
        const [deptRows] = await db.query(deptSql, params);
        const departmentBreakdown = (deptRows || []).map(r => ({
            department: r.department,
            meetingCount: Number(r.meetingCount || 0),
            totalHours: Number(r.totalHours || 0),
            cancelledCount: Number(r.cancelledCount || 0),
            sharePercentage: sumTotal > 0 ? roundToTwo((Number(r.meetingCount || 0) / sumTotal) * 100) : 0
        }));

        return {
            meetings: meetingRows,
            pagination: {
                currentPage: page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            summary: {
                totalMeetings: sumTotal,
                confirmedMeetings: sumConfirmed,
                completedMeetings: sumCompleted,
                cancelledMeetings: sumCancelled,
                cancellationRate,
                totalHours: sumHours,
                totalMinutes: sumMinutes,
                averageMeetingDurationMinutes,
                roomsUsedCount: Number(sum.roomsUsedCount || 0)
            },
            departmentBreakdown
        };
    },

    /**
     * Sinh tệp báo cáo dạng CSV chuẩn RFC 4180 có gắn UTF-8 BOM (\uFEFF)
     * Đảm bảo mở trực tiếp trên Microsoft Excel tiếng Việt không bị lỗi font
     * @param {Object} reportData - Dữ liệu thống kê từ getAnalytics và filterReports
     * @param {Object} meta - Thông tin người xuất, thời gian xuất, kỳ báo cáo
     * @returns {string} Nội dung tệp CSV hoàn chỉnh
     */
    generateCSVReport: (analyticsData, filteredData, meta = {}) => {
        const escapeCsv = (val) => {
            if (val === null || val === undefined) return '""';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return `"${str}"`;
        };

        const lines = [];

        // UTF-8 BOM
        const BOM = '\uFEFF';

        // ── PHẦN 1: TIÊU ĐỀ & METADATA ──
        lines.push(`${escapeCsv('BÁO CÁO THỐNG KÊ HIỆU SUẤT VÀ TÌNH HÌNH SỬ DỤNG PHÒNG HỌP')}`);
        lines.push(`${escapeCsv('Hệ thống Quản lý Cuộc họp Doanh nghiệp (ICTU Meeting Management Suite)')}`);
        lines.push(`${escapeCsv('Kỳ khảo sát:')},${escapeCsv(`Từ ${meta.startDate || 'Toàn thời gian'} Đến ${meta.endDate || 'Hiện tại'}`)}`);
        lines.push(`${escapeCsv('Phòng ban:')},${escapeCsv(meta.department || 'Tất cả phòng ban')}`);
        lines.push(`${escapeCsv('Phòng họp:')},${escapeCsv(meta.roomName || (meta.roomId ? `ID Phòng ${meta.roomId}` : 'Tất cả phòng họp'))}`);
        lines.push(`${escapeCsv('Ngày xuất:')},${escapeCsv(meta.exportedAt || new Date().toLocaleString('vi-VN'))}`);
        lines.push(`${escapeCsv('Người xuất:')},${escapeCsv(meta.exportedBy || 'Quản trị viên')}`);
        lines.push(''); // Dòng trống ngăn cách

        // ── PHẦN 2: CHỈ SỐ TỔNG QUAN (KPIs) ──
        const sum = analyticsData?.summary || filteredData?.summary || {};
        lines.push(`${escapeCsv('=== 1. CHỈ SỐ HIỆU SUẤT TỔNG QUAN (EXECUTIVE SUMMARY) ===')}`);
        lines.push(`${escapeCsv('Chỉ số')},${escapeCsv('Giá trị')},${escapeCsv('Đơn vị')},${escapeCsv('Ghi chú')}`);
        lines.push(`${escapeCsv('Tổng số cuộc họp')},${escapeCsv(sum.totalMeetings || 0)},${escapeCsv('Cuộc họp')},${escapeCsv('Bao gồm đã xác nhận, hoàn thành và đã hủy')}`);
        lines.push(`${escapeCsv('Cuộc họp đã xác nhận (Confirmed)')},${escapeCsv(sum.confirmedMeetings || 0)},${escapeCsv('Cuộc họp')},${escapeCsv('Đã lên lịch thành công')}`);
        lines.push(`${escapeCsv('Cuộc họp đã hoàn thành (Completed)')},${escapeCsv(sum.completedMeetings || 0)},${escapeCsv('Cuộc họp')},${escapeCsv('Đã diễn ra trọn vẹn')}`);
        lines.push(`${escapeCsv('Cuộc họp đã hủy (Cancelled)')},${escapeCsv(sum.cancelledMeetings || 0)},${escapeCsv('Cuộc họp')},${escapeCsv('Đã được giải phóng phòng')}`);
        lines.push(`${escapeCsv('Tỷ lệ cuộc họp bị hủy')},${escapeCsv(`${sum.cancellationRate || 0}%`)},${escapeCsv('%')},${escapeCsv('Tỷ lệ cuộc họp hủy trên tổng số đặt')}`);
        lines.push(`${escapeCsv('Tổng thời lượng sử dụng')},${escapeCsv(sum.totalBookingHours || sum.totalHours || 0)},${escapeCsv('Giờ')},${escapeCsv('Tổng số giờ phòng có lịch họp')}`);
        lines.push(`${escapeCsv('Thời lượng trung bình mỗi cuộc họp')},${escapeCsv(sum.averageMeetingDurationMinutes || 0)},${escapeCsv('Phút')},${escapeCsv('Thời gian họp bình quân')}`);
        lines.push(`${escapeCsv('Tỷ lệ lấp đầy theo thời gian')},${escapeCsv(`${sum.timeOccupancyRate || 0}%`)},${escapeCsv('%')},${escapeCsv('Tỷ lệ giờ sử dụng trên tổng giờ khả dụng')}`);
        lines.push(`${escapeCsv('Tỷ lệ lấp đầy theo sức chứa')},${escapeCsv(`${sum.capacityOccupancyRate || 0}%`)},${escapeCsv('%')},${escapeCsv('Bình quân số người tham gia trên sức chứa phòng')}`);
        lines.push(''); // Dòng trống

        // ── PHẦN 3: HIỆU SUẤT THEO TỪNG PHÒNG HỌP ──
        const rooms = analyticsData?.roomUtilization || [];
        if (rooms.length > 0) {
            lines.push(`${escapeCsv('=== 2. THỐNG KÊ TẦN SUẤT SỬ DỤNG & HIỆU SUẤT TỪNG PHÒNG HỌP ===')}`);
            lines.push([
                escapeCsv('Xếp hạng'),
                escapeCsv('Mã phòng'),
                escapeCsv('Tên phòng họp'),
                escapeCsv('Loại phòng'),
                escapeCsv('Vị trí'),
                escapeCsv('Sức chứa'),
                escapeCsv('Trạng thái'),
                escapeCsv('Tổng cuộc họp'),
                escapeCsv('Đã hủy'),
                escapeCsv('Tỷ lệ hủy (%)'),
                escapeCsv('Tổng giờ sử dụng (h)'),
                escapeCsv('Tần suất sử dụng (%)'),
                escapeCsv('Tỷ lệ lấp đầy thời gian (%)'),
                escapeCsv('Tỷ lệ lấp đầy sức chứa (%)'),
                escapeCsv('Số người trung bình')
            ].join(','));

            for (const r of rooms) {
                lines.push([
                    escapeCsv(r.rank || ''),
                    escapeCsv(r.roomCode || ''),
                    escapeCsv(r.roomName || ''),
                    escapeCsv(r.type || ''),
                    escapeCsv(r.floor || ''),
                    escapeCsv(r.capacity || ''),
                    escapeCsv(r.status || ''),
                    escapeCsv(r.totalMeetings || 0),
                    escapeCsv(r.cancelledMeetings || 0),
                    escapeCsv(`${r.cancellationRate || 0}%`),
                    escapeCsv(r.totalHours || 0),
                    escapeCsv(`${r.usageShare || 0}%`),
                    escapeCsv(`${r.timeOccupancyRate || 0}%`),
                    escapeCsv(`${r.capacityOccupancyRate || 0}%`),
                    escapeCsv(r.averageParticipants || 0)
                ].join(','));
            }
            lines.push(''); // Dòng trống
        }

        // ── PHẦN 4: DANH SÁCH CHI TIẾT CÁC CUỘC HỌP ──
        const meetings = filteredData?.meetings || [];
        if (meetings.length > 0) {
            lines.push(`${escapeCsv('=== 3. DANH SÁCH CHI TIẾT CÁC CUỘC HỌP TRONG KỲ ===')}`);
            lines.push([
                escapeCsv('STT'),
                escapeCsv('Mã cuộc họp'),
                escapeCsv('Tiêu đề cuộc họp'),
                escapeCsv('Phòng họp'),
                escapeCsv('Thời gian bắt đầu'),
                escapeCsv('Thời gian kết thúc'),
                escapeCsv('Thời lượng (phút)'),
                escapeCsv('Người tổ chức'),
                escapeCsv('Phòng ban'),
                escapeCsv('Email'),
                escapeCsv('Số người tham gia'),
                escapeCsv('Trạng thái')
            ].join(','));

            meetings.forEach((m, idx) => {
                lines.push([
                    escapeCsv(idx + 1),
                    escapeCsv(m.meetingId || ''),
                    escapeCsv(m.title || ''),
                    escapeCsv(m.roomName || ''),
                    escapeCsv(m.startTime ? new Date(m.startTime).toLocaleString('vi-VN') : ''),
                    escapeCsv(m.endTime ? new Date(m.endTime).toLocaleString('vi-VN') : ''),
                    escapeCsv(m.durationMinutes || 0),
                    escapeCsv(m.organizerName || ''),
                    escapeCsv(m.organizerDepartment || 'Kỹ thuật'),
                    escapeCsv(m.organizerEmail || ''),
                    escapeCsv(m.participantCount || 1),
                    escapeCsv(m.bookingStatus || 'Confirmed')
                ].join(','));
            });
        }

        return BOM + lines.join('\r\n');
    }
};

/**
 * Định dạng đối tượng Date hoặc chuỗi về YYYY-MM-DD
 */
function formatDateOnly(dateVal) {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') return dateVal.slice(0, 10);
    const d = new Date(dateVal);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Làm tròn đến 2 chữ số thập phân
 */
function roundToTwo(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

module.exports = ReportModel;
