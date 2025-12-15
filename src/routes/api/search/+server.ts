import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db, computers, notebooks, monitors, printers, users, rooms, departments } from '$lib/db';
import { like, or, eq } from 'drizzle-orm';

export type SearchResultType = 'computer' | 'notebook' | 'monitor' | 'printer' | 'user' | 'room' | 'department' | 'action' | 'category';

export interface SearchResult {
	id: number | string;
	type: SearchResultType;
	name: string;
	subtitle: string;
	status?: string;
	href: string;
}

// Action commands for quick access
const actionCommands: Omit<SearchResult, 'id'>[] = [
	{ type: 'action', name: 'Add Computer', subtitle: 'Create new PC', href: '/computers/new' },
	{ type: 'action', name: 'Add Notebook', subtitle: 'Create new notebook', href: '/notebooks/new' },
	{ type: 'action', name: 'Add Monitor', subtitle: 'Create new monitor', href: '/monitors/new' },
	{ type: 'action', name: 'Add Printer', subtitle: 'Create new printer', href: '/printers/new' },
	{ type: 'action', name: 'Add User', subtitle: 'Create new user', href: '/users/new' },
	{ type: 'action', name: 'Add Room', subtitle: 'Create new room', href: '/rooms/new' },
	{ type: 'action', name: 'Add Department', subtitle: 'Create new department', href: '/departments/new' },
	{ type: 'action', name: 'Add Work Entry', subtitle: 'Log work hours', href: '/work-time/new' }
];

// Category navigation commands
const categoryCommands: Omit<SearchResult, 'id'>[] = [
	{ type: 'category', name: 'Computers', subtitle: 'Browse all PCs', href: '/computers' },
	{ type: 'category', name: 'Notebooks', subtitle: 'Browse all notebooks', href: '/notebooks' },
	{ type: 'category', name: 'Monitors', subtitle: 'Browse all monitors', href: '/monitors' },
	{ type: 'category', name: 'Printers', subtitle: 'Browse all printers', href: '/printers' },
	{ type: 'category', name: 'Users', subtitle: 'Browse all users', href: '/users' },
	{ type: 'category', name: 'Rooms', subtitle: 'Browse all rooms', href: '/rooms' },
	{ type: 'category', name: 'Departments', subtitle: 'Browse all departments', href: '/departments' },
	{ type: 'category', name: 'Work Time', subtitle: 'View work hours', href: '/work-time' },
	{ type: 'category', name: 'History', subtitle: 'View audit log', href: '/history' }
];

const LIMIT = 5;

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim().toLowerCase();
	if (!q || q.length < 2) {
		return json({ results: [] });
	}

	const pattern = `%${q}%`;
	const results: SearchResult[] = [];

	// Computers
	const computerResults = db
		.select({
			id: computers.id,
			name: computers.name,
			manufacturer: computers.manufacturer,
			model: computers.model,
			status: computers.status
		})
		.from(computers)
		.where(
			or(
				like(computers.name, pattern),
				like(computers.manufacturer, pattern),
				like(computers.model, pattern),
				like(computers.serialNumber, pattern),
				like(computers.inventoryNumber, pattern),
				like(computers.cpu, pattern)
			)
		)
		.limit(LIMIT)
		.all();

	results.push(
		...computerResults.map((c) => ({
			id: c.id,
			type: 'computer' as const,
			name: c.name,
			subtitle: [c.manufacturer, c.model].filter(Boolean).join(' ') || 'Computer',
			status: c.status,
			href: `/computers/${c.id}`
		}))
	);

	// Notebooks
	const notebookResults = db
		.select({
			id: notebooks.id,
			name: notebooks.name,
			manufacturer: notebooks.manufacturer,
			model: notebooks.model,
			status: notebooks.status
		})
		.from(notebooks)
		.where(
			or(
				like(notebooks.name, pattern),
				like(notebooks.manufacturer, pattern),
				like(notebooks.model, pattern),
				like(notebooks.serialNumber, pattern),
				like(notebooks.inventoryNumber, pattern),
				like(notebooks.cpu, pattern)
			)
		)
		.limit(LIMIT)
		.all();

	results.push(
		...notebookResults.map((n) => ({
			id: n.id,
			type: 'notebook' as const,
			name: n.name,
			subtitle: [n.manufacturer, n.model].filter(Boolean).join(' ') || 'Notebook',
			status: n.status,
			href: `/notebooks/${n.id}`
		}))
	);

	// Monitors - join with computers to get assigned computer name
	const monitorResults = db
		.select({
			id: monitors.id,
			name: monitors.name,
			manufacturer: monitors.manufacturer,
			model: monitors.model,
			status: monitors.status,
			computerName: computers.name
		})
		.from(monitors)
		.leftJoin(computers, eq(monitors.computerId, computers.id))
		.where(
			or(
				like(monitors.name, pattern),
				like(monitors.manufacturer, pattern),
				like(monitors.model, pattern),
				like(monitors.serialNumber, pattern),
				like(monitors.inventoryNumber, pattern)
			)
		)
		.limit(LIMIT)
		.all();

	results.push(
		...monitorResults.map((m) => ({
			id: m.id,
			type: 'monitor' as const,
			name: [m.manufacturer, m.model].filter(Boolean).join(' ') || m.name,
			subtitle: m.computerName ? `→ ${m.computerName}` : 'Unassigned',
			status: m.status,
			href: `/monitors/${m.id}`
		}))
	);

	// Printers
	const printerResults = db
		.select({
			id: printers.id,
			name: printers.name,
			manufacturer: printers.manufacturer,
			model: printers.model,
			status: printers.status
		})
		.from(printers)
		.where(
			or(
				like(printers.name, pattern),
				like(printers.manufacturer, pattern),
				like(printers.model, pattern),
				like(printers.serialNumber, pattern),
				like(printers.inventoryNumber, pattern),
				like(printers.ipAddress, pattern)
			)
		)
		.limit(LIMIT)
		.all();

	results.push(
		...printerResults.map((p) => ({
			id: p.id,
			type: 'printer' as const,
			name: p.name,
			subtitle: [p.manufacturer, p.model].filter(Boolean).join(' ') || 'Printer',
			status: p.status,
			href: `/printers/${p.id}`
		}))
	);

	// Users
	const userResults = db
		.select({
			id: users.id,
			name: users.name,
			jobTitle: users.jobTitle
		})
		.from(users)
		.where(or(like(users.name, pattern), like(users.email, pattern), like(users.jobTitle, pattern)))
		.limit(LIMIT)
		.all();

	results.push(
		...userResults.map((u) => ({
			id: u.id,
			type: 'user' as const,
			name: u.name,
			subtitle: u.jobTitle || 'User',
			href: `/users/${u.id}`
		}))
	);

	// Rooms
	const roomResults = db
		.select({
			id: rooms.id,
			name: rooms.name
		})
		.from(rooms)
		.where(like(rooms.name, pattern))
		.limit(LIMIT)
		.all();

	results.push(
		...roomResults.map((r) => ({
			id: r.id,
			type: 'room' as const,
			name: r.name,
			subtitle: 'Room',
			href: `/rooms/${r.id}`
		}))
	);

	// Departments
	const departmentResults = db
		.select({
			id: departments.id,
			name: departments.name
		})
		.from(departments)
		.where(like(departments.name, pattern))
		.limit(LIMIT)
		.all();

	results.push(
		...departmentResults.map((d) => ({
			id: d.id,
			type: 'department' as const,
			name: d.name,
			subtitle: 'Department',
			href: `/departments/${d.id}`
		}))
	);

	// Search category navigation commands
	const categoryKeywords = ['go', 'goto', 'navigate', 'browse', 'show', 'list', 'all', 'idz', 'pokaz', 'lista', 'wszystkie'];
	const matchingCategories = categoryCommands.filter(cmd =>
		cmd.name.toLowerCase().includes(q) ||
		cmd.subtitle.toLowerCase().includes(q) ||
		categoryKeywords.some(kw => q.includes(kw))
	);
	if (matchingCategories.length > 0) {
		results.unshift(...matchingCategories.map((cmd, i) => ({ ...cmd, id: `category-${i}` })));
	}

	// Search action commands
	const actionKeywords = ['add', 'new', 'create', 'dodaj', 'nowy', 'nowa', 'nowe'];
	const matchesAction = actionKeywords.some(kw => q.includes(kw)) ||
		actionCommands.some(cmd => cmd.name.toLowerCase().includes(q) || cmd.subtitle.toLowerCase().includes(q));

	if (matchesAction) {
		const matchingActions = actionCommands.filter(cmd =>
			cmd.name.toLowerCase().includes(q) ||
			cmd.subtitle.toLowerCase().includes(q) ||
			actionKeywords.some(kw => q.includes(kw))
		);
		results.unshift(...matchingActions.map((cmd, i) => ({ ...cmd, id: `action-${i}` })));
	}

	// Sort: actions first, then categories, then disposal items go to bottom
	results.sort((a, b) => {
		if (a.type === 'action' && b.type !== 'action') return -1;
		if (a.type !== 'action' && b.type === 'action') return 1;
		if (a.type === 'category' && b.type !== 'category' && b.type !== 'action') return -1;
		if (a.type !== 'category' && a.type !== 'action' && b.type === 'category') return 1;
		const aDisposal = a.status === 'disposal' ? 1 : 0;
		const bDisposal = b.status === 'disposal' ? 1 : 0;
		return aDisposal - bDisposal;
	});

	return json({ results });
};
