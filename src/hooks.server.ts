import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/setup'];

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('session');
	const isPublicPath = PUBLIC_PATHS.some((p) => event.url.pathname.startsWith(p));

	if (!sessionToken && !isPublicPath) {
		throw redirect(303, '/login');
	}

	return resolve(event);
};
