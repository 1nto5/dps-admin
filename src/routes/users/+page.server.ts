import type { PageServerLoad } from './$types';
import { db, users, departments } from '$lib/db';
import { asc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ depends }) => {
	depends('data:users');
	const allUsers = db
		.select({
			id: users.id,
			name: users.name,
			jobTitle: users.jobTitle,
			email: users.email,
			departmentId: users.departmentId,
			departmentName: departments.name,
			createdAt: users.createdAt
		})
		.from(users)
		.leftJoin(departments, eq(users.departmentId, departments.id))
		.orderBy(asc(users.name))
		.all();

	return {
		users: allUsers
	};
};
