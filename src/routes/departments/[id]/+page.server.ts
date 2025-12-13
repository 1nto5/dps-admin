import type { PageServerLoad } from './$types';
import { db, departments } from '$lib/db';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const department = db.select().from(departments).where(eq(departments.id, +params.id)).get();

	if (!department) {
		throw error(404, 'Department not found');
	}

	return {
		department
	};
};
