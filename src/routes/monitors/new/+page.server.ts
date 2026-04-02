import type { PageServerLoad } from './$types';
import { db, computers } from '$lib/db';
import { asc } from 'drizzle-orm';
export const load: PageServerLoad = async () => ({ computers: db.select().from(computers).orderBy(asc(computers.name)).all() });
