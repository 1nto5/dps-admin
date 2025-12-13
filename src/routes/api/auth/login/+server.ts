import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyPassword, createSessionToken, getSessionExpiry } from '$lib/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { password } = await request.json();

	const valid = await verifyPassword(password);
	if (!valid) {
		return json({ error: 'Invalid password' }, { status: 401 });
	}

	const token = createSessionToken();
	const expiry = getSessionExpiry();

	cookies.set('session', token, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		expires: expiry
	});

	return json({ success: true });
};
