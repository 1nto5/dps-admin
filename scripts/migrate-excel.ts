import * as XLSX from 'xlsx';
import { Database } from 'bun:sqlite';

// Connect to database
const db = new Database('./data/inventory.db');

// Status mapping (Polish → English)
const statusMap: Record<string, string> = {
	'w użyciu': 'in_use',
	'utylizacja': 'disposal',
	'w przygotowaniu': 'preparing',
	'do odbioru :)': 'to_collect',
	'do odbioru': 'to_collect'
};

function mapStatus(polishStatus: string): string {
	const normalized = polishStatus?.toLowerCase().trim();
	return statusMap[normalized] || 'in_use';
}

// Parse manufacturer and model from "Producent model" column
function parseManufacturerModel(value: string): { manufacturer: string; model: string } {
	if (!value) return { manufacturer: '', model: '' };
	const parts = value.trim().split(/\s+/);
	if (parts.length === 1) return { manufacturer: parts[0], model: '' };
	return { manufacturer: parts[0], model: parts.slice(1).join(' ') };
}

// Normalize purchase date
function normalizePurchaseDate(value: any): string | null {
	if (!value) return null;
	if (typeof value === 'number') return String(value);
	return String(value).trim() || null;
}

// Stats tracking
const stats = {
	departments: { created: 0, updated: 0 },
	rooms: { created: 0, updated: 0 },
	users: { created: 0, updated: 0 },
	computers: { created: 0, updated: 0 },
	notebooks: { created: 0, updated: 0 },
	printers: { created: 0, updated: 0 },
	monitors: { created: 0, updated: 0 },
	assignments: { created: 0, updated: 0 }
};

// Cache for lookups
const departmentCache = new Map<string, number>();
const roomCache = new Map<string, number>();
const userCache = new Map<string, number>();
const computerCache = new Map<string, number>();
const notebookCache = new Map<string, number>();
const printerCache = new Map<string, number>();

// Prepared statements
const stmts = {
	getDepartments: db.prepare('SELECT id, name FROM departments'),
	insertDepartment: db.prepare('INSERT INTO departments (name) VALUES (?) RETURNING id'),

	getRooms: db.prepare('SELECT id, name FROM rooms'),
	insertRoom: db.prepare('INSERT INTO rooms (name) VALUES (?) RETURNING id'),

	getUsers: db.prepare('SELECT id, name FROM users'),
	insertUser: db.prepare('INSERT INTO users (name, job_title, email, department_id) VALUES (?, ?, ?, ?) RETURNING id'),
	updateUser: db.prepare('UPDATE users SET job_title = COALESCE(?, job_title), email = COALESCE(?, email), department_id = COALESCE(?, department_id), updated_at = datetime(\'now\') WHERE id = ?'),

	getComputers: db.prepare('SELECT id, name, inventory_number FROM computers'),
	insertComputer: db.prepare(`
		INSERT INTO computers (name, type, status, inventory_number, manufacturer, model, cpu, ram, storage, windows, office, notes, purchase_date, room_id, user_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
	`),
	updateComputer: db.prepare(`
		UPDATE computers SET name = ?, type = ?, status = ?, inventory_number = ?, manufacturer = ?, model = ?, cpu = ?, ram = ?, storage = ?, windows = ?, office = ?, notes = ?, purchase_date = ?, room_id = ?, user_id = ?, updated_at = datetime('now')
		WHERE id = ?
	`),

	getNotebooks: db.prepare('SELECT id, name, inventory_number FROM notebooks'),
	insertNotebook: db.prepare(`
		INSERT INTO notebooks (name, status, inventory_number, manufacturer, model, cpu, ram, storage, windows, office, notes, purchase_date, room_id, user_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
	`),
	updateNotebook: db.prepare(`
		UPDATE notebooks SET name = ?, status = ?, inventory_number = ?, manufacturer = ?, model = ?, cpu = ?, ram = ?, storage = ?, windows = ?, office = ?, notes = ?, purchase_date = ?, room_id = ?, user_id = ?, updated_at = datetime('now')
		WHERE id = ?
	`),

	getPrinters: db.prepare('SELECT id, name, inventory_number FROM printers'),
	insertPrinter: db.prepare(`
		INSERT INTO printers (name, status, inventory_number, manufacturer, model, notes, purchase_date, room_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
	`),
	updatePrinter: db.prepare(`
		UPDATE printers SET name = ?, status = ?, inventory_number = ?, manufacturer = ?, model = ?, notes = ?, purchase_date = ?, room_id = ?, updated_at = datetime('now')
		WHERE id = ?
	`),

	getMonitorByName: db.prepare('SELECT id, computer_id FROM monitors WHERE name = ?'),
	insertMonitor: db.prepare(`
		INSERT INTO monitors (name, status, inventory_number, computer_id)
		VALUES (?, ?, ?, ?) RETURNING id
	`),
	updateMonitorComputer: db.prepare('UPDATE monitors SET computer_id = ?, updated_at = datetime(\'now\') WHERE id = ?'),

	getAssignments: db.prepare('SELECT id, user_id, computer_id, notebook_id, printer_id FROM assignments WHERE user_id = ?'),
	insertAssignment: db.prepare('INSERT INTO assignments (user_id, computer_id, notebook_id, printer_id) VALUES (?, ?, ?, ?)'),

	countTable: (table: string) => db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }
};

function loadExistingData() {
	// Load departments
	for (const d of stmts.getDepartments.all() as any[]) {
		departmentCache.set(d.name.toLowerCase(), d.id);
	}

	// Load rooms
	for (const r of stmts.getRooms.all() as any[]) {
		roomCache.set(r.name.toLowerCase(), r.id);
	}

	// Load users
	for (const u of stmts.getUsers.all() as any[]) {
		userCache.set(u.name.toLowerCase(), u.id);
	}

	// Load computers
	for (const c of stmts.getComputers.all() as any[]) {
		computerCache.set(c.name.toLowerCase(), c.id);
		if (c.inventory_number) {
			computerCache.set(c.inventory_number.toLowerCase(), c.id);
		}
	}

	// Load notebooks
	for (const n of stmts.getNotebooks.all() as any[]) {
		notebookCache.set(n.name.toLowerCase(), n.id);
		if (n.inventory_number) {
			notebookCache.set(n.inventory_number.toLowerCase(), n.id);
		}
	}

	// Load printers
	for (const p of stmts.getPrinters.all() as any[]) {
		printerCache.set(p.name.toLowerCase(), p.id);
		if (p.inventory_number) {
			printerCache.set(p.inventory_number.toLowerCase(), p.id);
		}
	}

	console.log('Loaded existing data:');
	console.log(`  Departments: ${departmentCache.size}`);
	console.log(`  Rooms: ${roomCache.size}`);
	console.log(`  Users: ${userCache.size}`);
	console.log(`  Computers: ${stmts.countTable('computers').count}`);
	console.log(`  Notebooks: ${stmts.countTable('notebooks').count}`);
	console.log(`  Printers: ${stmts.countTable('printers').count}`);
}

function getOrCreateDepartment(name: string): number | null {
	if (!name) return null;
	const normalized = name.toLowerCase().trim();

	// Handle typo in Excel: "Adminstracja" should be "Administracja"
	const corrected = normalized === 'adminstracja' ? 'administracja' : normalized;

	if (departmentCache.has(corrected)) {
		return departmentCache.get(corrected)!;
	}

	// Create new department
	const displayName = name.trim();
	const result = stmts.insertDepartment.get(displayName) as { id: number };

	departmentCache.set(corrected, result.id);
	stats.departments.created++;
	console.log(`  Created department: ${displayName}`);
	return result.id;
}

function getOrCreateRoom(name: string): number | null {
	if (!name) return null;
	const normalized = String(name).toLowerCase().trim();

	if (roomCache.has(normalized)) {
		return roomCache.get(normalized)!;
	}

	// Create new room
	const displayName = String(name).trim();
	const result = stmts.insertRoom.get(displayName) as { id: number };

	roomCache.set(normalized, result.id);
	stats.rooms.created++;
	console.log(`  Created room: ${displayName}`);
	return result.id;
}

function getOrCreateUser(
	name: string,
	jobTitle?: string,
	email?: string,
	departmentId?: number | null
): number | null {
	if (!name) return null;
	const normalized = name.toLowerCase().trim();

	if (userCache.has(normalized)) {
		const userId = userCache.get(normalized)!;
		// Update user if we have more info
		if (jobTitle || email || departmentId) {
			stmts.updateUser.run(jobTitle || null, email || null, departmentId || null, userId);
			stats.users.updated++;
		}
		return userId;
	}

	// Create new user
	const result = stmts.insertUser.get(name.trim(), jobTitle || null, email || null, departmentId || null) as { id: number };

	userCache.set(normalized, result.id);
	stats.users.created++;
	console.log(`  Created user: ${name.trim()}`);
	return result.id;
}

function processComputer(row: any, roomId: number | null, userId: number | null): number | null {
	const name = row['Nazwa'];
	const inventoryNumber = row['Numer inwentarzowy'];

	if (!name && !inventoryNumber) return null;

	// Check if exists
	const nameKey = name?.toLowerCase().trim();
	const invKey = inventoryNumber?.toLowerCase().trim();

	let existingId = nameKey ? computerCache.get(nameKey) : undefined;
	if (!existingId && invKey && invKey !== '-') {
		existingId = computerCache.get(invKey);
	}

	const { manufacturer, model } = parseManufacturerModel(row['Producent model']);
	const status = mapStatus(row['Status']);

	const displayName = name?.trim() || `PC-${inventoryNumber}`;
	const inv = inventoryNumber && inventoryNumber !== '-' ? inventoryNumber.trim() : null;

	if (existingId) {
		stmts.updateComputer.run(
			displayName, 'PC', status, inv,
			manufacturer || null, model || null,
			row['Procesor'] || null,
			row['Pamięć'] ? String(row['Pamięć']) : null,
			row['Dysk'] || null,
			row['Windows'] ? String(row['Windows']) : null,
			row['Office'] || null,
			row['Notatka'] || null,
			normalizePurchaseDate(row['Data zakupu']),
			roomId, userId,
			existingId
		);
		stats.computers.updated++;
		return existingId;
	} else {
		const result = stmts.insertComputer.get(
			displayName, 'PC', status, inv,
			manufacturer || null, model || null,
			row['Procesor'] || null,
			row['Pamięć'] ? String(row['Pamięć']) : null,
			row['Dysk'] || null,
			row['Windows'] ? String(row['Windows']) : null,
			row['Office'] || null,
			row['Notatka'] || null,
			normalizePurchaseDate(row['Data zakupu']),
			roomId, userId
		) as { id: number };
		computerCache.set(nameKey, result.id);
		if (invKey && invKey !== '-') {
			computerCache.set(invKey, result.id);
		}
		stats.computers.created++;
		return result.id;
	}
}

function processNotebook(row: any, roomId: number | null, userId: number | null): number | null {
	const name = row['Nazwa'];
	const inventoryNumber = row['Numer inwentarzowy'];

	if (!name && !inventoryNumber) return null;

	const nameKey = name?.toLowerCase().trim();
	const invKey = inventoryNumber?.toLowerCase().trim();

	let existingId = nameKey ? notebookCache.get(nameKey) : undefined;
	if (!existingId && invKey && invKey !== '-') {
		existingId = notebookCache.get(invKey);
	}

	const { manufacturer, model } = parseManufacturerModel(row['Producent model']);
	const status = mapStatus(row['Status']);

	const displayName = name?.trim() || `NB-${inventoryNumber}`;
	const inv = inventoryNumber && inventoryNumber !== '-' ? inventoryNumber.trim() : null;

	if (existingId) {
		stmts.updateNotebook.run(
			displayName, status, inv,
			manufacturer || null, model || null,
			row['Procesor'] || null,
			row['Pamięć'] ? String(row['Pamięć']) : null,
			row['Dysk'] ? String(row['Dysk']) : null,
			row['Windows'] ? String(row['Windows']) : null,
			row['Office'] || null,
			row['Notatka'] || null,
			normalizePurchaseDate(row['Data zakupu']),
			roomId, userId,
			existingId
		);
		stats.notebooks.updated++;
		return existingId;
	} else {
		const result = stmts.insertNotebook.get(
			displayName, status, inv,
			manufacturer || null, model || null,
			row['Procesor'] || null,
			row['Pamięć'] ? String(row['Pamięć']) : null,
			row['Dysk'] ? String(row['Dysk']) : null,
			row['Windows'] ? String(row['Windows']) : null,
			row['Office'] || null,
			row['Notatka'] || null,
			normalizePurchaseDate(row['Data zakupu']),
			roomId, userId
		) as { id: number };
		notebookCache.set(nameKey, result.id);
		if (invKey && invKey !== '-') {
			notebookCache.set(invKey, result.id);
		}
		stats.notebooks.created++;
		return result.id;
	}
}

function processPrinter(row: any, roomId: number | null): number | null {
	const name = row['Nazwa'];
	const inventoryNumber = row['Numer inwentarzowy'];

	if (!name && !inventoryNumber) return null;

	const nameKey = name?.toLowerCase().trim();
	const invKey = inventoryNumber?.toLowerCase().trim();

	let existingId = nameKey ? printerCache.get(nameKey) : undefined;
	if (!existingId && invKey && invKey !== '-') {
		existingId = printerCache.get(invKey);
	}

	const { manufacturer, model } = parseManufacturerModel(row['Producent model']);
	const status = mapStatus(row['Status']);

	const displayName = name?.trim() || `PR-${inventoryNumber}`;
	const inv = inventoryNumber && inventoryNumber !== '-' ? inventoryNumber.trim() : null;

	if (existingId) {
		stmts.updatePrinter.run(
			displayName, status, inv,
			manufacturer || null, model || null,
			row['Notatka'] || null,
			normalizePurchaseDate(row['Data zakupu']),
			roomId,
			existingId
		);
		stats.printers.updated++;
		return existingId;
	} else {
		const result = stmts.insertPrinter.get(
			displayName, status, inv,
			manufacturer || null, model || null,
			row['Notatka'] || null,
			normalizePurchaseDate(row['Data zakupu']),
			roomId
		) as { id: number };
		printerCache.set(nameKey, result.id);
		if (invKey && invKey !== '-') {
			printerCache.set(invKey, result.id);
		}
		stats.printers.created++;
		return result.id;
	}
}

function processMonitor(
	monitorName: string,
	monitorInventory: string,
	computerId: number | null
): number | null {
	if (!monitorName || monitorName === '-' || monitorName === 'ok') return null;

	// Check if already exists by name
	const existing = stmts.getMonitorByName.get(monitorName.trim()) as { id: number; computer_id: number | null } | undefined;

	if (existing) {
		// Update with computer link if needed
		if (computerId && !existing.computer_id) {
			stmts.updateMonitorComputer.run(computerId, existing.id);
			stats.monitors.updated++;
		}
		return existing.id;
	}

	// Create new monitor
	const inv = monitorInventory && monitorInventory !== '-' ? monitorInventory.trim() : null;
	const result = stmts.insertMonitor.get(monitorName.trim(), 'in_use', inv, computerId) as { id: number };

	stats.monitors.created++;
	return result.id;
}

function createAssignment(
	userId: number,
	computerId: number | null,
	notebookId: number | null,
	printerId: number | null
) {
	if (!computerId && !notebookId && !printerId) return;

	// Check if assignment exists
	const existing = stmts.getAssignments.all(userId) as any[];

	// Check for duplicate
	const isDuplicate = existing.some(a =>
		(computerId && a.computer_id === computerId) ||
		(notebookId && a.notebook_id === notebookId) ||
		(printerId && a.printer_id === printerId)
	);

	if (isDuplicate) return;

	stmts.insertAssignment.run(userId, computerId, notebookId, printerId);
	stats.assignments.created++;
}

function migrate() {
	console.log('Starting Excel migration...\n');

	// Load existing data into caches
	loadExistingData();

	// Read Excel file
	const workbook = XLSX.readFile('./baza.xlsx');
	const sheet = workbook.Sheets['Spis'];
	const data = XLSX.utils.sheet_to_json(sheet) as any[];

	console.log(`\nProcessing ${data.length} rows from Excel...\n`);

	for (let i = 0; i < data.length; i++) {
		const row = data[i];
		const type = row['Typ'];
		const name = row['Nazwa'];

		console.log(`[${i + 1}/${data.length}] Processing: ${name || 'unnamed'} (${type || 'unknown type'})`);

		// Skip rows without type
		if (!type) {
			console.log('  Skipped: no type specified');
			continue;
		}

		// Get/create department
		const departmentId = getOrCreateDepartment(row['Dział']);

		// Get/create room
		const roomId = getOrCreateRoom(row['Miejsce']);

		// Get/create user
		const userId = getOrCreateUser(
			row['Użytkownik'],
			row['Stanowisko'],
			row['E-mail'],
			departmentId
		);

		let equipmentId: number | null = null;
		let equipmentType: 'computer' | 'notebook' | 'printer' | null = null;

		// Process based on type
		const typeNormalized = type.toLowerCase().trim();
		if (typeNormalized === 'pc') {
			equipmentId = processComputer(row, roomId, userId);
			equipmentType = 'computer';

			// Process monitor if present
			if (row['Monitor']) {
				processMonitor(row['Monitor'], row['Monitor inwentarz'], equipmentId);
			}
		} else if (typeNormalized === 'notebook') {
			equipmentId = processNotebook(row, roomId, userId);
			equipmentType = 'notebook';
		} else if (typeNormalized === 'printer') {
			equipmentId = processPrinter(row, roomId);
			equipmentType = 'printer';
		} else {
			console.log(`  Skipped: unknown type "${type}"`);
			continue;
		}

		// Create assignment if user exists
		if (userId && equipmentId) {
			createAssignment(
				userId,
				equipmentType === 'computer' ? equipmentId : null,
				equipmentType === 'notebook' ? equipmentId : null,
				equipmentType === 'printer' ? equipmentId : null
			);
		}
	}

	console.log('\n========================================');
	console.log('Migration Complete!');
	console.log('========================================\n');
	console.log('Statistics:');
	console.log(`  Departments: ${stats.departments.created} created, ${stats.departments.updated} updated`);
	console.log(`  Rooms: ${stats.rooms.created} created, ${stats.rooms.updated} updated`);
	console.log(`  Users: ${stats.users.created} created, ${stats.users.updated} updated`);
	console.log(`  Computers: ${stats.computers.created} created, ${stats.computers.updated} updated`);
	console.log(`  Notebooks: ${stats.notebooks.created} created, ${stats.notebooks.updated} updated`);
	console.log(`  Printers: ${stats.printers.created} created, ${stats.printers.updated} updated`);
	console.log(`  Monitors: ${stats.monitors.created} created, ${stats.monitors.updated} updated`);
	console.log(`  Assignments: ${stats.assignments.created} created`);

	// Final counts
	console.log('\nFinal database counts:');
	console.log(`  Departments: ${stmts.countTable('departments').count}`);
	console.log(`  Rooms: ${stmts.countTable('rooms').count}`);
	console.log(`  Users: ${stmts.countTable('users').count}`);
	console.log(`  Computers: ${stmts.countTable('computers').count}`);
	console.log(`  Notebooks: ${stmts.countTable('notebooks').count}`);
	console.log(`  Printers: ${stmts.countTable('printers').count}`);
	console.log(`  Monitors: ${stmts.countTable('monitors').count}`);
	console.log(`  Assignments: ${stmts.countTable('assignments').count}`);
}

migrate();
