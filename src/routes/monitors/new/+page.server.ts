import type { PageServerLoad } from './$types';
import { db, computers } from '$lib/db';
export const load: PageServerLoad = async () => ({ computers: db.select().from(computers).all() });
