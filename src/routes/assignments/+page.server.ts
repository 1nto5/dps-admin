import type { PageServerLoad } from './$types';
import { db, assignments, users, computers, notebooks, printers } from '$lib/db';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const allAssignments = db
		.select({
			id: assignments.id,
			userId: assignments.userId,
			userName: users.name,
			computerId: assignments.computerId,
			computerName: computers.name,
			notebookId: assignments.notebookId,
			notebookName: notebooks.name,
			printerId: assignments.printerId,
			printerName: printers.name,
			createdAt: assignments.createdAt
		})
		.from(assignments)
		.leftJoin(users, eq(assignments.userId, users.id))
		.leftJoin(computers, eq(assignments.computerId, computers.id))
		.leftJoin(notebooks, eq(assignments.notebookId, notebooks.id))
		.leftJoin(printers, eq(assignments.printerId, printers.id))
		.orderBy(desc(assignments.createdAt))
		.all();

	return {
		assignments: allAssignments,
		users: db.select().from(users).all(),
		computers: db.select().from(computers).all(),
		notebooks: db.select().from(notebooks).all(),
		printers: db.select().from(printers).all()
	};
};
