import type { PageServerLoad } from './$types';
import { db, workEntries, settings } from '$lib/db';
import { desc, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ url }) => {
	const monthParam = url.searchParams.get('month');
	const now = new Date();
	const [year, month] = monthParam?.split('-').map(Number) || [now.getFullYear(), now.getMonth() + 1];

	const billingMonth = `${year}-${String(month).padStart(2, '0')}`;

	const entries = db
		.select()
		.from(workEntries)
		.where(eq(workEntries.billingMonth, billingMonth))
		.orderBy(desc(workEntries.date), desc(workEntries.startTime))
		.all();

	const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
	const hourlyRate = parseFloat(env[`HOURLY_RATE_${year}`] || '0');
	const totalEarnings = (totalMinutes / 60) * hourlyRate;

	// Get contract date setting
	const contractDateSetting = db.select().from(settings).where(eq(settings.key, 'contract_date')).get();

	return {
		entries,
		currentMonth: `${year}-${String(month).padStart(2, '0')}`,
		totalMinutes,
		hourlyRate,
		totalEarnings,
		contractDate: contractDateSetting?.value || '01.02.2023'
	};
};
