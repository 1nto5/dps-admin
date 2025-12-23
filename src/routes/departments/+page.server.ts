import type { PageServerLoad } from './$types';
import { db, departments } from '$lib/db';
import { asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ depends }) => {
	depends('data:departments');
	const allDepartments = db.select().from(departments).orderBy(asc(departments.name)).all();

	return {
		departments: allDepartments
	};
};
