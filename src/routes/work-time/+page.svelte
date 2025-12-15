<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { terminalFade } from '$lib/animations/transitions';
	import { getStaggerDelay } from '$lib/animations';
	import { setSidebarEdit, clearSidebarEdit } from '$lib/stores/sidebar.svelte';
	import { getBackInfo } from '$lib/stores/navigation';
	import Toast from '$lib/components/Toast.svelte';
	import SendEmailModal from '$lib/components/SendEmailModal.svelte';

	let { data }: { data: PageData } = $props();
	const backInfo = getBackInfo('/', 'Search');

	let selectedYear = $state(0);
	let selectedMonthNum = $state(0);
	let selectedMonth = $derived(`${selectedYear}-${String(selectedMonthNum).padStart(2, '0')}`);

	// Sync with data when it changes (e.g., navigation)
	$effect(() => {
		selectedYear = parseInt(data.currentMonth.split('-')[0]);
		selectedMonthNum = parseInt(data.currentMonth.split('-')[1]);
	});
	let monthInput: HTMLInputElement;
	let exporting = $state(false);
	let sending = $state(false);
	let toast = $state({ show: false, message: '', type: 'success' as 'success' | 'error' });
	let showSendConfirm = $state(false);

	function formatDuration(minutes: number): string {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return `${h}:${String(m).padStart(2, '0')}`;
	}

	function formatCurrency(amount: number): string {
		return amount.toLocaleString('pl-PL', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}) + ' zł';
	}

	function formatDate(dateStr: string): string {
		const [y, m, d] = dateStr.split('-');
		return `${d}.${m}.${y}`;
	}

	async function handleExport() {
		exporting = true;
		try {
			const res = await fetch(`/api/work-time/export?month=${selectedMonth}`);
			if (res.ok) {
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `ewidencja-${selectedMonth}.docx`;
				a.click();
				URL.revokeObjectURL(url);
			}
		} finally {
			exporting = false;
		}
	}

	async function handleSend(recipient: string) {
		sending = true;
		try {
			const res = await fetch('/api/work-time/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ month: selectedMonth, recipient })
			});
			const result = await res.json();
			if (res.ok) {
				toast = { show: true, message: result.message || 'Email sent', type: 'success' };
			} else {
				toast = { show: true, message: result.error || 'Failed to send', type: 'error' };
			}
		} catch {
			toast = { show: true, message: 'Connection error', type: 'error' };
		} finally {
			sending = false;
			showSendConfirm = false;
		}
	}

	function validateMonth() {
		if (isNaN(selectedMonthNum) || selectedMonthNum < 1) selectedMonthNum = 1;
		else if (selectedMonthNum > 12) selectedMonthNum = 12;
		else selectedMonthNum = Math.floor(selectedMonthNum);
	}

	function validateYear() {
		if (isNaN(selectedYear) || selectedYear < 2020) selectedYear = 2020;
		else if (selectedYear > 2099) selectedYear = 2099;
		else selectedYear = Math.floor(selectedYear);
	}

	function handleMonthChange() {
		validateMonth();
		validateYear();
		goto(`/work-time?month=${selectedMonth}`);
	}

	function handleFilterKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && data.entries.length > 0) {
			e.preventDefault();
			goto(`/work-time/${data.entries[0].id}`);
		}
	}

	function handleEscape() {
		const active = document.activeElement as HTMLElement;
		const isInputFocused = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';

		if (isInputFocused) {
			active.blur();
		} else {
			goto(backInfo.href);
		}
	}

	onMount(() => {
		pushContext('list');
		const unsubs: (() => void)[] = [];

		unsubs.push(registerShortcut({ key: 'alt+n', action: () => goto('/work-time/new'), context: 'list', description: 'Add entry' }));
		unsubs.push(registerShortcut({ key: 'alt+e', action: handleExport, context: 'list', description: 'Export Word' }));
		unsubs.push(registerShortcut({ key: 'alt+s', action: () => showSendConfirm = true, context: 'list', description: 'Send email' }));
		unsubs.push(registerShortcut({ key: '/', action: () => monthInput?.focus(), context: 'list', description: 'Filter month' }));
		unsubs.push(registerShortcut({ key: 'escape', action: handleEscape, context: 'list', description: 'Go to search', allowInInput: true }));

		return () => { popContext('list'); unsubs.forEach(u => u()); clearSidebarEdit(); };
	});

	$effect(() => {
		setSidebarEdit({
			addUrl: '/work-time/new',
			addLabel: 'Add Entry',
			totalCount: data.entries.length,
			filteredCount: data.entries.length
		});
	});
</script>

<Toast bind:show={toast.show} message={toast.message} type={toast.type} />
<SendEmailModal bind:show={showSendConfirm} title="Send Email" message="Send work time summary for {selectedMonth}?" loading={sending} onConfirm={handleSend} />

<div class="terminal-page">
	<div class="page-header-minimal">
		<span class="header-text">WORK TIME</span>
		<div class="mobile-header-right show-mobile">
			<span class="mobile-counts">
				<span>entries: <span class="count-value">{data.entries.length}</span></span>
			</span>
			<a href="/work-time/new" class="mobile-add-btn">+ Add</a>
		</div>
	</div>

	<!-- Controls -->
	<div class="controls">
		<div class="month-selector">
			<label for="month-input" class="control-label">Month:</label>
			<input id="month-input" bind:this={monthInput} type="number" bind:value={selectedMonthNum} onchange={handleMonthChange} onblur={validateMonth} min="1" max="12" class="month-input filter-month" />
			<input type="number" bind:value={selectedYear} onchange={handleMonthChange} onblur={validateYear} min="2020" max="2099" class="month-input filter-year" aria-label="Year" />
		</div>
		<div class="total-display">
			<span class="control-label">Total:</span>
			<span class="total-value">{formatDuration(data.totalMinutes)}</span>
			{#if data.hourlyRate > 0}
				<span class="earnings-divider">|</span>
				<span class="total-earnings">{formatCurrency(data.totalEarnings)}</span>
			{/if}
		</div>
		<div class="action-buttons">
			<button onclick={handleExport} disabled={exporting || data.entries.length === 0} class="action-btn action-secondary">
				{exporting ? 'Exporting...' : 'Export Word'}
				<kbd>⌥E</kbd>
			</button>
			<button onclick={() => showSendConfirm = true} disabled={sending || data.entries.length === 0} class="action-btn action-secondary">
				{sending ? 'Sending...' : 'Send Email'}
				<kbd>⌥S</kbd>
			</button>
		</div>
	</div>

	{#if data.entries.length === 0}
		<div class="empty-state">
			<div class="empty-icon">∅</div>
			<div class="empty-text">No entries for this month</div>
			<div class="empty-hint">Click <code>+ Add Entry</code> or press <kbd>⌥N</kbd></div>
		</div>
	{:else}
		<!-- Mobile Cards -->
		<div class="mobile-cards">
			{#each data.entries as entry, i (entry.id)}
				<a href="/work-time/{entry.id}" class="card" in:terminalFade={{ delay: getStaggerDelay(i) }}>
					<div class="card-header">
						<span class="card-name">{formatDate(entry.date)}</span>
						<span class="card-hours">{formatDuration(entry.duration)}</span>
					</div>
					<div class="card-times">
						{entry.startTime} - {entry.endTime}
					</div>
					<div class="card-scope">{entry.scope}</div>
				</a>
			{/each}
		</div>

		<!-- Desktop Table -->
		<div class="desktop-table">
			<div class="terminal-table-container">
				<table class="terminal-table">
					<thead>
						<tr class="header-row">
							<th>DATA</th>
							<th>OD</th>
							<th>DO</th>
							<th>GODZINY</th>
							<th>ZAKRES PRAC</th>
							<th class="col-actions">CMD</th>
						</tr>
					</thead>
					<tbody>
						{#each data.entries as entry, i (entry.id)}
							<tr class="data-row" in:terminalFade={{ delay: getStaggerDelay(i) }}>
								<td class="col-name">{formatDate(entry.date)}</td>
								<td>{entry.startTime}</td>
								<td>{entry.endTime}</td>
								<td class="col-dim">{formatDuration(entry.duration)}</td>
								<td class="col-scope">{entry.scope}</td>
								<td class="col-actions">
									<a href="/work-time/{entry.id}" class="edit-link">Edit</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="table-footer">
				<span class="footer-hint">
					<kbd>⌥N</kbd> add
					<span class="hint-divider">│</span>
					<kbd>⌥E</kbd> export
					<span class="hint-divider">│</span>
					<kbd>⌥S</kbd> send
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.terminal-page { max-width: 100%; }
	.page-header-minimal { margin-bottom: 20px; }
	.header-text { color: var(--terminal-cyan); font-size: 12px; letter-spacing: 2px; }

	/* Controls */
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		align-items: center;
		margin-bottom: 24px;
		padding: 16px;
		background: var(--terminal-bg-alt);
		border: 1px solid var(--terminal-border);
	}

	.month-selector, .total-display {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.control-label {
		font-size: 12px;
		color: var(--terminal-dim);
	}

	.month-input {
		padding: 8px 12px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-text);
		font-size: 13px;
	}

	.month-input:focus {
		border-color: var(--terminal-cyan);
		outline: none;
	}

	.filter-month { width: 70px; text-align: center; }
	.filter-year { width: 90px; text-align: center; }

	.total-value {
		color: var(--terminal-cyan);
		font-weight: 600;
		font-size: 14px;
	}

	.earnings-divider {
		color: var(--terminal-muted);
		margin: 0 8px;
	}

	.total-earnings {
		color: var(--terminal-green, #4ade80);
		font-weight: 600;
		font-size: 14px;
	}

	.action-buttons {
		display: flex;
		gap: 8px;
		margin-left: auto;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		font-size: 12px;
		border: 1px solid var(--terminal-border);
		background: transparent;
		color: var(--terminal-text);
		transition: all 0.15s ease;
	}

	.action-btn:hover:not(:disabled) {
		border-color: var(--terminal-cyan);
		color: var(--terminal-cyan);
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-btn kbd {
		font-size: 10px;
		padding: 2px 5px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-muted);
	}

	/* Empty state */
	.empty-state {
		padding: 64px 32px;
		text-align: center;
		border: 1px solid var(--terminal-border);
		background: var(--terminal-bg-alt);
	}

	.empty-icon { font-size: 48px; color: var(--terminal-muted); margin-bottom: 16px; }
	.empty-text { font-size: 14px; color: var(--terminal-dim); margin-bottom: 8px; }
	.empty-hint { font-size: 12px; color: var(--terminal-muted); }
	.empty-hint code, .empty-hint kbd {
		color: var(--terminal-cyan);
		background: var(--terminal-bg);
		padding: 2px 6px;
	}

	/* Table */
	.terminal-table-container {
		border: 1px solid var(--terminal-border);
		overflow-x: auto;
	}

	.terminal-table { width: 100%; border-collapse: collapse; }

	.header-row th {
		padding: 12px 16px;
		font-size: 11px;
		font-weight: 500;
		text-align: left;
		color: var(--terminal-dim);
		background: var(--terminal-bg-alt);
		border-bottom: 1px solid var(--terminal-border);
		letter-spacing: 0.5px;
	}

	.data-row { transition: background 0.1s ease; }
	.data-row:hover { background: var(--terminal-bg-alt); }

	.data-row td {
		padding: 12px 16px;
		font-size: 13px;
		border-bottom: 1px solid var(--terminal-border);
	}

	.col-name { color: var(--terminal-text-bright); font-weight: 500; }
	.col-dim { color: var(--terminal-dim); }
	.col-scope {
		color: var(--terminal-dim);
		max-width: 400px;
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: normal;
	}
	.col-actions { text-align: right; width: 80px; }

	.edit-link {
		color: var(--terminal-cyan);
		font-size: 12px;
		padding: 4px 10px;
		border: 1px solid var(--terminal-border);
		transition: all 0.15s ease;
	}

	.edit-link:hover {
		border-color: var(--terminal-cyan);
		background: rgba(0, 255, 242, 0.1);
	}

	/* Footer */
	.table-footer {
		padding: 12px 16px;
		border: 1px solid var(--terminal-border);
		border-top: none;
		background: var(--terminal-bg-alt);
	}

	.footer-hint { font-size: 11px; color: var(--terminal-muted); }

	.footer-hint kbd {
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		padding: 2px 6px;
		font-size: 10px;
		margin-right: 4px;
		color: var(--terminal-cyan);
	}

	.hint-divider { margin: 0 12px; color: var(--terminal-muted); }

	/* Mobile/Desktop toggle */
	.mobile-cards { display: flex; flex-direction: column; gap: 12px; }
	.desktop-table { display: none; }

	@media (min-width: 768px) {
		.mobile-cards { display: none; }
		.desktop-table { display: block; }
	}

	/* Mobile cards */
	.card {
		display: block;
		padding: 16px;
		background: var(--terminal-bg-alt);
		border: 1px solid var(--terminal-border);
		transition: all 0.15s ease;
	}

	.card:hover { border-color: var(--terminal-cyan); }

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.card-name {
		font-weight: 500;
		color: var(--terminal-text-bright);
		font-size: 14px;
	}

	.card-hours {
		color: var(--terminal-cyan);
		font-weight: 600;
	}

	.card-times {
		font-size: 12px;
		color: var(--terminal-dim);
		margin-bottom: 8px;
	}

	.card-scope {
		font-size: 12px;
		color: var(--terminal-muted);
	}

	/* Responsive controls */
	@media (max-width: 640px) {
		.controls {
			flex-direction: column;
			align-items: stretch;
		}

		.action-buttons {
			margin-left: 0;
			justify-content: stretch;
		}

		.action-btn {
			flex: 1;
			justify-content: center;
		}

		.action-btn kbd {
			display: none;
		}
	}
</style>
