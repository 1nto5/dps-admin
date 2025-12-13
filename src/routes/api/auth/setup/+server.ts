import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setPassword, hasPassword } from '$lib/auth';

export const POST: RequestHandler = async ({ request }) => {
	// Only allow setup if no password exists
	if (hasPassword()) {
		return json({ error: 'Password already set' }, { status: 400 });
	}

	const { password } = await request.json();

	if (!password || password.length < 4) {
		return json({ error: 'Password must be at least 4 characters' }, { status: 400 });
	}

	await setPassword(password);

	return json({ success: true });
};
