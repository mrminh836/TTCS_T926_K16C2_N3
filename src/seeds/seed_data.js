/**
 * Seed: Dữ liệu mẫu cho phát triển
 */
exports.seed = async function (knex) {
  // Xóa dữ liệu cũ theo thứ tự phụ thuộc
  await knex('Booking_Equipments').del();
  await knex('Meeting_Participants').del();
  await knex('Bookings').del();
  await knex('Meetings').del();
  await knex('Equipments').del();
  await knex('Rooms').del();
  await knex('Users').del();
  await knex('Departments').del();

  // 1. Departments
  await knex('Departments').insert([
    { id: 1, name: 'Phòng Kỹ thuật', code: 'TECH' },
    { id: 2, name: 'Phòng Nhân sự', code: 'HR' },
    { id: 3, name: 'Phòng Marketing', code: 'MKT' },
    { id: 4, name: 'Phòng Kinh doanh', code: 'SALES' }
  ]);

  // 2. Users
  await knex('Users').insert([
    { id: 1, full_name: 'Nguyễn Văn An', email: 'an.nguyen@company.com', department_id: 1, status: 'ACTIVE' },
    { id: 2, full_name: 'Trần Thị Bình', email: 'binh.tran@company.com', department_id: 1, status: 'ACTIVE' },
    { id: 3, full_name: 'Lê Minh Châu', email: 'chau.le@company.com', department_id: 2, status: 'ACTIVE' },
    { id: 4, full_name: 'Phạm Hoàng Dũng', email: 'dung.pham@company.com', department_id: 3, status: 'ACTIVE' },
    { id: 5, full_name: 'Hoàng Thị Em', email: 'em.hoang@company.com', department_id: 4, status: 'ACTIVE' },
    { id: 6, full_name: 'Nguyễn Thanh Phong', email: 'phong.nguyen@company.com', department_id: 2, status: 'INACTIVE' }
  ]);

  // 3. Rooms
  await knex('Rooms').insert([
    { id: 1, name: 'Phòng họp A1', location: 'Tầng 1', capacity: 10, status: 'AVAILABLE' },
    { id: 2, name: 'Phòng họp B2', location: 'Tầng 2', capacity: 20, status: 'AVAILABLE' },
    { id: 3, name: 'Phòng họp C3', location: 'Tầng 3', capacity: 5, status: 'MAINTENANCE' }
  ]);

  // 4. Equipments
  await knex('Equipments').insert([
    { id: 1, name: 'Máy chiếu', code: 'PRJ-001', total_quantity: 3, description: 'Máy chiếu Epson Full HD', status: 'ACTIVE' },
    { id: 2, name: 'Loa Bluetooth', code: 'SPK-001', total_quantity: 5, description: 'Loa JBL Flip 5', status: 'ACTIVE' },
    { id: 3, name: 'Bảng trắng di động', code: 'WB-001', total_quantity: 4, description: 'Bảng trắng 1.2m x 0.9m', status: 'ACTIVE' },
    { id: 4, name: 'Webcam HD', code: 'CAM-001', total_quantity: 2, description: 'Logitech C920', status: 'ACTIVE' },
    { id: 5, name: 'Micro không dây', code: 'MIC-001', total_quantity: 6, description: 'Micro Shure cầm tay', status: 'MAINTENANCE' }
  ]);

  // 5. Meetings
  await knex('Meetings').insert([
    {
      id: 1,
      title: 'Họp Sprint Review Q4',
      description: 'Review kết quả sprint tuần 40',
      room_id: 1,
      start_time: '2026-10-10 09:00:00',
      end_time: '2026-10-10 10:30:00',
      created_by: 1,
      status: 'SCHEDULED'
    },
    {
      id: 2,
      title: 'Training Onboarding',
      description: 'Đào tạo nhân viên mới',
      room_id: 2,
      start_time: '2026-10-10 14:00:00',
      end_time: '2026-10-10 16:00:00',
      created_by: 3,
      status: 'SCHEDULED'
    }
  ]);

  // 6. Meeting_Participants
  await knex('Meeting_Participants').insert([
    { meeting_id: 1, user_id: 1, status: 'ACCEPTED' },
    { meeting_id: 1, user_id: 2, status: 'ACCEPTED' },
    { meeting_id: 1, user_id: 4, status: 'PENDING' },
    { meeting_id: 2, user_id: 3, status: 'ACCEPTED' },
    { meeting_id: 2, user_id: 5, status: 'TENTATIVE' }
  ]);

  // 7. Bookings
  await knex('Bookings').insert([
    {
      id: 1,
      title: 'Đặt phòng cho Sprint Review',
      room_id: 1,
      start_time: '2026-10-10 09:00:00',
      end_time: '2026-10-10 10:30:00',
      created_by: 1,
      status: 'CONFIRMED'
    }
  ]);

  // 8. Booking_Equipments
  await knex('Booking_Equipments').insert([
    { booking_id: 1, equipment_id: 1, quantity: 1 },
    { booking_id: 1, equipment_id: 2, quantity: 2 }
  ]);
};
