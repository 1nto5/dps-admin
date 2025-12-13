import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, notebooks, auditLog } from '$lib/db';
import { eq, and, ne } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const item = db.select().from(notebooks).where(eq(notebooks.id, +params.id)).get();
	if (!item) throw error(404, 'Not found');
	return json(item);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = +params.id;
	const data = await request.json();
	const existing = db.select().from(notebooks).where(eq(notebooks.id, id)).get();
	if (!existing) throw error(404, 'Not found');

	if (!data.name?.trim()) return json({ error: 'Name is required' }, { status: 400 });

	const trimmedName = data.name.trim();
	const trimmedInv = data.inventoryNumber?.trim() || null;
	const trimmedSerial = data.serialNumber?.trim() || null;

	const dupName = db.select().from(notebooks).where(and(eq(notebooks.name, trimmedName), ne(notebooks.id, id))).get();
	if (dupName) return json({ error: `Notebook '${trimmedName}' already exists` }, { status: 400 });

	if (trimmedInv) {
		const dupInv = db.select().from(notebooks).where(and(eq(notebooks.inventoryNumber, trimmedInv), ne(notebooks.id, id))).get();
		if (dupInv) return json({ error: `Inventory number '${trimmedInv}' already exists` }, { status: 400 });
	}

	if (trimmedSerial) {
		const dupSerial = db.select().from(notebooks).where(and(eq(notebooks.serialNumber, trimmedSerial), ne(notebooks.id, id))).get();
		if (dupSerial) return json({ error: `Serial number '${trimmedSerial}' already exists` }, { status: 400 });
	}

	const result = db.update(notebooks).set({
		name: trimmedName,
		status: data.status,
		inventoryNumber: trimmedInv,
		manufacturer: data.manufacturer?.trim() || null,
		model: data.model?.trim() || null,
		serialNumber: trimmedSerial,
		cpu: data.cpu?.trim() || null,
		ram: data.ram?.trim() || null,
		storage: data.storage?.trim() || null,
		windows: data.windows?.trim() || null,
		office: data.office?.trim() || null,
		notes: data.notes?.trim() || null,
		purchaseDate: data.purchaseDate || null,
		roomId: data.roomId || null,
		updatedAt: new Date().toISOString()
	}).where(eq(notebooks.id, id)).returning().get();

	db.insert(auditLog).values({
		entityType: 'notebook', entityId: id, action: 'update',
		changes: JSON.stringify({ before: existing, after: result })
	}).run();

	return json(result);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = +params.id;
	const existing = db.select().from(notebooks).where(eq(notebooks.id, id)).get();
	if (!existing) throw error(404, 'Not found');

	db.insert(auditLog).values({
		entityType: 'notebook', entityId: id, action: 'delete',
		changes: JSON.stringify(existing)
	}).run();

	db.delete(notebooks).where(eq(notebooks.id, id)).run();
	return json({ success: true });
};
