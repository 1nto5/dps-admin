<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { getBackInfo } from '$lib/stores/navigation';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	let { data }: { data: PageData } = $props();

	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/work-time', 'Work Time');

	let billingYear = $state(parseInt(data.entry.billingMonth.split('-')[0]));
	let billingMonthNum = $state(parseInt(data.entry.billingMonth.split('-')[1]));

	let form = $state({
		date: data.entry.date,
		startTime: data.entry.startTime,
		endTime: data.entry.endTime,
		scope: data.entry.scope
	});

	let billingMonth = $derived(`${billingYear}-${String(billingMonthNum).padStart(2, '0')}`);

	function validateBillingMonth() {
		if (isNaN(billingMonthNum) || billingMonthNum < 1) billingMonthNum = 1;
		else if (billingMonthNum > 12) billingMonthNum = 12;
		else billingMonthNum = Math.floor(billingMonthNum);
	}

	function validateBillingYear() {
		if (isNaN(billingYear) || billingYear < 2020) billingYear = 2020;
		else if (billingYear > 2099) billingYear = 2099;
		else billingYear = Math.floor(billingYear);
	}

	let error = $state('');
	let loading = $state(false);
	let showDelete = $state(false);
	let deleting = $state(false);

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
			const res = await fetch(`/api/work-time/${data.entry.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...form, billingMonth })
			});
			if (res.ok) goto(backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch {
			error = 'Connection error';
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		deleting = true;
		try {
			const res = await fetch(`/api/work-time/${data.entry.id}`, { method: 'DELETE' });
			if (res.ok) goto(backInfo.href);
			else error = (await res.json()).error || 'Failed to delete';
		} catch {
			error = 'Connection error';
		} finally {
			deleting = false;
			showDelete = false;
		}
	}

	onMount(() => {
		pushContext('form');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'meta+enter', action: () => formEl?.requestSubmit(), context: 'form', description: 'Save', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'escape', action: () => goto(backInfo.href), context: 'form', description: 'Cancel', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'alt+backspace', action: () => showDelete = true, context: 'form', description: 'Delete', allowInInput: true }));
		return () => { popContext('form'); unsubs.forEach(u => u()); };
	});
</script>

<ConfirmModal
	bind:show={showDelete}
	title="Delete Entry"
	message="Are you sure you want to delete this work entry? This action cannot be undone."
	loading={deleting}
	onConfirm={handleDelete}
/>

<div class="terminal-page max-w-2xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">EDIT ENTRY</span>
			<span class="header-decoration">──────────────────────────────────────────</span>
		</div>
	</div>

	{#if error}<div class="error-box"><span class="error-prefix">[ERR]</span> {error}</div>{/if}

	<div class="form-container">
		<form bind:this={formEl} onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-grid-5">
				<div class="form-group">
					<label for="wt-date" class="form-label">date</label>
					<!-- svelte-ignore a11y_autofocus -->
					<input id="wt-date" type="date" bind:value={form.date} class="form-input" required autofocus />
				</div>
				<div class="form-group">
					<label for="wt-start" class="form-label">start time</label>
					<input id="wt-start" type="time" bind:value={form.startTime} class="form-input" required />
				</div>
				<div class="form-group">
					<label for="wt-end" class="form-label">end time</label>
					<input id="wt-end" type="time" bind:value={form.endTime} class="form-input" required />
				</div>
				<div class="form-group">
					<span class="form-label">duration</span>
					<div class="duration-display" aria-label="Calculated duration">{formatDuration(duration)}</div>
				</div>
				<div class="form-group">
					<label for="wt-billing-month" class="form-label">billing month</label>
					<div class="billing-month-row">
						<input id="wt-billing-month" type="number" bind:value={billingMonthNum} onblur={validateBillingMonth} min="1" max="12" class="form-input month-input" />
						<input type="number" bind:value={billingYear} onblur={validateBillingYear} min="2020" max="2099" class="form-input year-input" aria-label="Billing year" />
					</div>
				</div>
			</div>

			<div class="form-group">
				<label for="wt-scope" class="form-label">scope of work (zakres prac)</label>
				<textarea id="wt-scope" bind:value={form.scope} rows="4" class="form-input" placeholder="Describe the work performed..." required></textarea>
			</div>

			<div class="form-actions">
				<button type="submit" disabled={loading} class="btn-primary">
					{loading ? 'Saving...' : 'Save'} <kbd>⌘↵</kbd>
				</button>
				<a href={backInfo.href} class="btn-secondary">Cancel <kbd>Esc</kbd></a>
				<button type="button" onclick={() => showDelete = true} class="btn-danger">
					Delete <kbd>⌥⌫</kbd>
				</button>
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

	@media (max-width: 768px) {
		.form-grid-5 {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 480px) {
		.form-grid-5 {
			grid-template-columns: repeat(2, 1fr);
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

	.month-input { width: 70px; text-align: center; }
	.year-input { width: 90px; text-align: center; }
</style>
