import type { PageServerLoad } from './$types';
import { db, departments } from '$lib/db';

export const load: PageServerLoad = async () => {
	const allDepartments = db.select().from(departments).all();
	return { departments: allDepartments };
};
