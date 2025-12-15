<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { getBackInfo } from '$lib/stores/navigation';
	import { toastAndGoto } from '$lib/stores/toast';

	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/work-time', 'Work Time');

	// Default to today's date
	const today = new Date().toISOString().split('T')[0];
	const currentYear = new Date().getFullYear();
	const currentMonthNum = new Date().getMonth() + 1;

	let form = $state({
		date: today,
		startTime: '08:00',
		endTime: '16:00',
		scope: ''
	});

	// Billing month as primary state (YYYY-MM format)
	let billingMonth = $state(`${currentYear}-${String(currentMonthNum).padStart(2, '0')}`);

	// Derived values for desktop number inputs
	let billingYear = $derived(parseInt(billingMonth.split('-')[0]));
	let billingMonthNum = $derived(parseInt(billingMonth.split('-')[1]));

	// Update handlers for desktop inputs
	function updateBillingMonth(year: number, month: number) {
		const y = Math.min(2099, Math.max(2020, year || currentYear));
		const m = Math.min(12, Math.max(1, month || 1));
		billingMonth = `${y}-${String(m).padStart(2, '0')}`;
	}

	function handleYearChange(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value);
		updateBillingMonth(val, billingMonthNum);
	}

	function handleMonthNumChange(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value);
		updateBillingMonth(billingYear, val);
	}

	let error = $state('');
	let loading = $state(false);

	// Auto-calculate duration
	let duration = $derived.by(() => {
		const [sh, sm] = form.startTime.split(':').map(Number);
		const [eh, em] = form.endTime.split(':').map(Number);
		return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
	});

	function formatDuration(mins: number): string {
		if (isNaN(mins) || mins < 0) return '--:--';
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return `${h}:${String(m).padStart(2, '0')}`;
	}

	async function handleSubmit() {
		if (!form.date) {
			error = 'Date is required';
			return;
		}
		if (!form.scope.trim()) {
			error = 'Work scope is required';
			return;
		}
		if (duration <= 0) {
			error = 'End time must be after start time';
			return;
		}

		error = '';
		loading = true;

		try {
			const res = await fetch('/api/work-time', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...form, billingMonth })
			});
			if (res.ok) await toastAndGoto('Entry created', backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch {
			error = 'Connection error';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		pushContext('form');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'meta+enter', action: () => formEl?.requestSubmit(), context: 'form', description: 'Save', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'escape', action: () => goto(backInfo.href), context: 'form', description: 'Cancel', allowInInput: true }));
		return () => { popContext('form'); unsubs.forEach(u => u()); };
	});
</script>

<div class="terminal-page max-w-2xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">NEW ENTRY</span>
			<span class="header-decoration">───────────────────────────────────────────</span>
		</div>
	</div>

	{#if error}<div class="error-box"><span class="error-prefix">[ERR]</span> {error}</div>{/if}

	<div class="form-container">
		<form bind:this={formEl} onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-grid-5">
				<div class="form-group">
					<label for="entry-date" class="form-label">date</label>
					<!-- svelte-ignore a11y_autofocus -->
					<input id="entry-date" type="date" bind:value={form.date} class="form-input" required autofocus />
				</div>
				<div class="form-group">
					<label for="start-time" class="form-label">start time</label>
					<input id="start-time" type="time" bind:value={form.startTime} step="900" class="form-input" required />
				</div>
				<div class="form-group">
					<label for="end-time" class="form-label">end time</label>
					<input id="end-time" type="time" bind:value={form.endTime} step="900" class="form-input" required />
				</div>
				<div class="form-group">
					<span class="form-label">duration</span>
					<div class="duration-display" aria-label="Calculated duration">{formatDuration(duration)}</div>
				</div>
				<div class="form-group">
					<label for="billing-month" class="form-label">billing month</label>
					<!-- Mobile: native month picker -->
					<input type="month" bind:value={billingMonth} class="form-input billing-month-mobile" />
					<!-- Desktop: number inputs -->
					<div class="billing-month-row billing-month-desktop">
						<input id="billing-month" type="number" value={billingMonthNum} onchange={handleMonthNumChange} min="1" max="12" class="form-input month-input" />
						<input type="number" value={billingYear} onchange={handleYearChange} min="2020" max="2099" class="form-input year-input" aria-label="Billing year" />
					</div>
				</div>
			</div>

			<div class="form-group">
				<label for="work-scope" class="form-label">scope of work (zakres prac)</label>
				<textarea id="work-scope" bind:value={form.scope} rows="4" class="form-input" placeholder="Describe the work performed..." required></textarea>
			</div>

			<div class="form-actions">
				<button type="submit" disabled={loading} class="btn-primary">
					{loading ? 'Creating...' : 'Create'} <kbd>⌘↵</kbd>
				</button>
				<a href={backInfo.href} class="btn-secondary">Cancel <kbd>Esc</kbd></a>
			</div>
		</form>
	</div>
</div>

<style>
	.terminal-page { max-width: 42rem; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }

	.form-grid-5 {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 16px;
		margin-bottom: 20px;
	}

	@media (max-width: 1023px) {
		.form-grid-5 {
			grid-template-columns: 1fr;
		}
	}

	/* Prevent grid children from overflowing on mobile */
	.form-grid-5 > * {
		min-width: 0;
	}

	/* Ensure native date/time inputs don't overflow */
	.form-grid-5 input[type="date"],
	.form-grid-5 input[type="time"],
	.form-grid-5 input[type="month"] {
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}

	/* Force all form inputs to respect container width on mobile */
	@media (max-width: 1023px) {
		.form-grid-5 .form-input {
			width: 100% !important;
			max-width: 100% !important;
		}
	}

	.duration-display {
		padding: 10px 8px;
		background: var(--terminal-bg-panel);
		border: 1px solid var(--terminal-border);
		border-radius: 4px;
		color: var(--terminal-cyan);
		font-size: 13px;
		font-weight: 600;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
	}

	.billing-month-row {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.month-input { flex: 1; min-width: 60px; text-align: center; }
	.year-input { flex: 1; min-width: 70px; text-align: center; }

	/* Mobile: show month picker, hide number inputs */
	.billing-month-mobile { display: block; }
	.billing-month-desktop { display: none; }

	@media (min-width: 1024px) {
		.billing-month-mobile { display: none; }
		.billing-month-desktop { display: flex; }
	}
</style>
