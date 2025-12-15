import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, workEntries, auditLog } from '$lib/db';

function calculateDuration(startTime: string, endTime: string): number {
	const [sh, sm] = startTime.split(':').map(Number);
	const [eh, em] = endTime.split(':').map(Number);
	return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	if (!data.date?.trim()) return json({ error: 'Date is required' }, { status: 400 });
	if (!data.startTime?.trim()) return json({ error: 'Start time is required' }, { status: 400 });
	if (!data.endTime?.trim()) return json({ error: 'End time is required' }, { status: 400 });
	if (!data.scope?.trim()) return json({ error: 'Work scope is required' }, { status: 400 });

	const duration = calculateDuration(data.startTime, data.endTime);
	if (duration <= 0) return json({ error: 'End time must be after start time' }, { status: 400 });

	// Default billingMonth to date's month if not provided
	const billingMonth = data.billingMonth?.trim() || data.date.trim().slice(0, 7);

	const result = db
		.insert(workEntries)
		.values({
			date: data.date.trim(),
			billingMonth,
			startTime: data.startTime.trim(),
			endTime: data.endTime.trim(),
			duration,
			scope: data.scope.trim()
		})
		.returning()
		.get();

	db.insert(auditLog).values({
		entityType: 'work_entry',
		entityId: result.id,
		action: 'create',
		changes: JSON.stringify(result)
	}).run();

	return json(result, { status: 201 });
};
