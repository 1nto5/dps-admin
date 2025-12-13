import type { PageServerLoad } from './$types';
import { hasPassword } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	// If already logged in, redirect to home
	const session = cookies.get('session');
	if (session) {
		throw redirect(303, '/');
	}

	return {
		needsSetup: !hasPassword()
	};
};
