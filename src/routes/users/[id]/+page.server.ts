import type { PageServerLoad } from './$types';
import { db, users, departments } from '$lib/db';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const user = db.select().from(users).where(eq(users.id, +params.id)).get();
	if (!user) throw error(404, 'User not found');

	const allDepartments = db.select().from(departments).all();

	return { user, departments: allDepartments };
};
