import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, workEntries, auditLog } from '$lib/db';
import { eq } from 'drizzle-orm';

function calculateDuration(startTime: string, endTime: string): number {
	const [sh, sm] = startTime.split(':').map(Number);
	const [eh, em] = endTime.split(':').map(Number);
	return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

export const GET: RequestHandler = async ({ params }) => {
	const item = db.select().from(workEntries).where(eq(workEntries.id, +params.id)).get();
	if (!item) throw error(404, 'Not found');
	return json(item);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = +params.id;
	const data = await request.json();
	const existing = db.select().from(workEntries).where(eq(workEntries.id, id)).get();
	if (!existing) throw error(404, 'Not found');

	if (!data.date?.trim()) return json({ error: 'Date is required' }, { status: 400 });
	if (!data.startTime?.trim()) return json({ error: 'Start time is required' }, { status: 400 });
	if (!data.endTime?.trim()) return json({ error: 'End time is required' }, { status: 400 });
	if (!data.scope?.trim()) return json({ error: 'Work scope is required' }, { status: 400 });

	const duration = calculateDuration(data.startTime, data.endTime);
	if (duration <= 0) return json({ error: 'End time must be after start time' }, { status: 400 });

	// Default billingMonth to date's month if not provided
	const billingMonth = data.billingMonth?.trim() || data.date.trim().slice(0, 7);

	const result = db.update(workEntries).set({
		date: data.date.trim(),
		billingMonth,
		startTime: data.startTime.trim(),
		endTime: data.endTime.trim(),
		duration,
		scope: data.scope.trim(),
		updatedAt: new Date().toISOString()
	}).where(eq(workEntries.id, id)).returning().get();

	db.insert(auditLog).values({
		entityType: 'work_entry', entityId: id, action: 'update',
		changes: JSON.stringify({ before: existing, after: result })
	}).run();

	return json(result);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = +params.id;
	const existing = db.select().from(workEntries).where(eq(workEntries.id, id)).get();
	if (!existing) throw error(404, 'Not found');

	db.insert(auditLog).values({
		entityType: 'work_entry', entityId: id, action: 'delete',
		changes: JSON.stringify(existing)
	}).run();

	db.delete(workEntries).where(eq(workEntries.id, id)).run();
	return json({ success: true });
};
