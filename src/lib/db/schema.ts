import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Status enum values
export const statusValues = ['in_use', 'disposal', 'preparing', 'to_collect'] as const;
export type Status = (typeof statusValues)[number];

// Computer type enum values
export const computerTypeValues = ['PC', 'Notebook'] as const;
export type ComputerType = (typeof computerTypeValues)[number];

// Departments table (organizational units)
export const departments = sqliteTable('departments', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull()
});

// Rooms table (physical locations)
export const rooms = sqliteTable('rooms', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull()
});

// Users table (employees)
export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	jobTitle: text('job_title'),
	email: text('email'),
	departmentId: integer('department_id').references(() => departments.id, { onDelete: 'set null' }),
	createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull()
});

// Computers table
export const computers = sqliteTable('computers', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	type: text('type').notNull().$type<ComputerType>(),
	status: text('status').notNull().$type<Status>(),
	inventoryNumber: text('inventory_number'),
	manufacturer: text('manufacturer'),
	model: text('model'),
	serialNumber: text('serial_number'),
	cpu: text('cpu'),
	ram: text('ram'),
	storage: text('storage'),
	windows: text('windows'),
	office: text('office'),
	notes: text('notes'),
	purchaseDate: text('purchase_date'),
	roomId: integer('room_id').references(() => rooms.id, { onDelete: 'set null' }),
	userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
	createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull()
});

// Monitors table
export const monitors = sqliteTable('monitors', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	status: text('status').notNull().$type<Status>(),
	inventoryNumber: text('inventory_number'),
	manufacturer: text('manufacturer'),
	model: text('model'),
	serialNumber: text('serial_number'),
	notes: text('notes'),
	purchaseDate: text('purchase_date'),
	computerId: integer('computer_id').references(() => computers.id, { onDelete: 'set null' }),
	createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull()
});

// Notebooks table
export const notebooks = sqliteTable('notebooks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	status: text('status').notNull().$type<Status>(),
	inventoryNumber: text('inventory_number'),
	manufacturer: text('manufacturer'),
	model: text('model'),
	serialNumber: text('serial_number'),
	cpu: text('cpu'),
	ram: text('ram'),
	storage: text('storage'),
	windows: text('windows'),
	office: text('office'),
	notes: text('notes'),
	purchaseDate: text('purchase_date'),
	roomId: integer('room_id').references(() => rooms.id, { onDelete: 'set null' }),
	userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
	createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull()
});

// Printers table
export const printers = sqliteTable('printers', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	status: text('status').notNull().$type<Status>(),
	inventoryNumber: text('inventory_number'),
	manufacturer: text('manufacturer'),
	model: text('model'),
	serialNumber: text('serial_number'),
	ipAddress: text('ip_address'),
	isNetwork: integer('is_network').default(0),
	notes: text('notes'),
	purchaseDate: text('purchase_date'),
	roomId: integer('room_id').references(() => rooms.id, { onDelete: 'set null' }),
	computerId: integer('computer_id').references(() => computers.id, { onDelete: 'set null' }),
	notebookId: integer('notebook_id').references(() => notebooks.id, { onDelete: 'set null' }),
	createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull()
});

// Audit log table
export const auditLog = sqliteTable('audit_log', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	entityType: text('entity_type').notNull(), // 'location', 'user', 'computer', 'notebook', 'monitor', 'printer', 'assignment'
	entityId: integer('entity_id'),
	action: text('action').notNull(), // 'create', 'update', 'delete'
	changes: text('changes').notNull(), // JSON
	performedAt: text('performed_at').default(sql`(datetime('now'))`).notNull()
});

// Settings table (for password storage etc.)
export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

// Work time entries table (ewidencja godzin)
export const workEntries = sqliteTable('work_entries', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	date: text('date').notNull(), // YYYY-MM-DD format
	billingMonth: text('billing_month').notNull(), // YYYY-MM format (okres rozliczeniowy)
	startTime: text('start_time').notNull(), // HH:MM format
	endTime: text('end_time').notNull(), // HH:MM format
	duration: integer('duration').notNull(), // auto-calculated minutes from start/end
	scope: text('scope').notNull(), // zakres prac (work scope)
	createdAt: text('created_at').default(sql`(datetime('now'))`).notNull(),
	updatedAt: text('updated_at').default(sql`(datetime('now'))`).notNull()
});

// Type exports
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Computer = typeof computers.$inferSelect;
export type NewComputer = typeof computers.$inferInsert;
export type Notebook = typeof notebooks.$inferSelect;
export type NewNotebook = typeof notebooks.$inferInsert;
export type Monitor = typeof monitors.$inferSelect;
export type NewMonitor = typeof monitors.$inferInsert;
export type Printer = typeof printers.$inferSelect;
export type NewPrinter = typeof printers.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type WorkEntry = typeof workEntries.$inferSelect;
export type NewWorkEntry = typeof workEntries.$inferInsert;
