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
