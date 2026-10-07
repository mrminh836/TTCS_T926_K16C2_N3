/**
 * Migration: Tạo tất cả các bảng cần thiết
 * - Users, Departments, Rooms, Meetings, Meeting_Participants
 * - Bookings, Equipments, Booking_Equipments
 */
exports.up = async function (knex) {
  // 1. Bảng Departments (Phòng ban)
  await knex.schema.createTable('Departments', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('code', 20).unique();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 2. Bảng Users (Người dùng)
  await knex.schema.createTable('Users', (table) => {
    table.increments('id').primary();
    table.string('full_name', 100).notNullable();
    table.string('email', 150).notNullable().unique();
    table.string('password_hash', 255);
    table.string('avatar_url', 500);
    table.integer('department_id').unsigned().references('id').inTable('Departments').onDelete('SET NULL');
    table.enum('status', ['ACTIVE', 'INACTIVE']).defaultTo('ACTIVE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 3. Bảng Rooms (Phòng họp)
  await knex.schema.createTable('Rooms', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('location', 255);
    table.integer('capacity').unsigned().defaultTo(10);
    table.enum('status', ['AVAILABLE', 'MAINTENANCE', 'UNAVAILABLE']).defaultTo('AVAILABLE');
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 4. Bảng Meetings (Cuộc họp)
  await knex.schema.createTable('Meetings', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description');
    table.integer('room_id').unsigned().references('id').inTable('Rooms').onDelete('SET NULL');
    table.datetime('start_time').notNullable();
    table.datetime('end_time').notNullable();
    table.integer('created_by').unsigned().references('id').inTable('Users').onDelete('SET NULL');
    table.enum('status', ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).defaultTo('SCHEDULED');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 5. Bảng Meeting_Participants (Người tham gia cuộc họp)
  await knex.schema.createTable('Meeting_Participants', (table) => {
    table.increments('id').primary();
    table.integer('meeting_id').unsigned().notNullable()
      .references('id').inTable('Meetings').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('Users').onDelete('CASCADE');
    table.enum('status', ['PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE']).defaultTo('PENDING');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['meeting_id', 'user_id'], { indexName: 'unique_meeting_user' });
  });

  // 6. Bảng Bookings (Đặt phòng)
  await knex.schema.createTable('Bookings', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.integer('room_id').unsigned().references('id').inTable('Rooms').onDelete('SET NULL');
    table.datetime('start_time').notNullable();
    table.datetime('end_time').notNullable();
    table.integer('created_by').unsigned().references('id').inTable('Users').onDelete('SET NULL');
    table.enum('status', ['CONFIRMED', 'CANCELLED', 'COMPLETED']).defaultTo('CONFIRMED');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 7. Bảng Equipments (Thiết bị)
  await knex.schema.createTable('Equipments', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('code', 50).notNullable().unique();
    table.integer('total_quantity').unsigned().defaultTo(1);
    table.text('description');
    table.enum('status', ['ACTIVE', 'MAINTENANCE', 'INACTIVE']).defaultTo('ACTIVE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 8. Bảng Booking_Equipments (Thiết bị đã mượn cho đặt phòng)
  await knex.schema.createTable('Booking_Equipments', (table) => {
    table.increments('id').primary();
    table.integer('booking_id').unsigned().notNullable()
      .references('id').inTable('Bookings').onDelete('CASCADE');
    table.integer('equipment_id').unsigned().notNullable()
      .references('id').inTable('Equipments');
    table.integer('quantity').unsigned().notNullable().defaultTo(1);
  });
};

/**
 * Migration: Xóa tất cả các bảng (rollback)
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('Booking_Equipments');
  await knex.schema.dropTableIfExists('Equipments');
  await knex.schema.dropTableIfExists('Bookings');
  await knex.schema.dropTableIfExists('Meeting_Participants');
  await knex.schema.dropTableIfExists('Meetings');
  await knex.schema.dropTableIfExists('Rooms');
  await knex.schema.dropTableIfExists('Users');
  await knex.schema.dropTableIfExists('Departments');
};
