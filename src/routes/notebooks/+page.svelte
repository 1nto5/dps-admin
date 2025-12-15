<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { showDisposal } from '$lib/stores/settings';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { terminalFade } from '$lib/animations/transitions';
	import { getStaggerDelay } from '$lib/animations';
	import AutocompleteInput from '$lib/components/AutocompleteInput.svelte';
	import { setSidebarEdit, clearSidebarEdit } from '$lib/stores/sidebar.svelte';
	import { getBackInfo } from '$lib/stores/navigation';

	let { data }: { data: PageData } = $props();
	const backInfo = getBackInfo('/', 'Search');

	const statusColors: Record<string, string> = {
		in_use: 'status-active',
		disposal: 'status-disposal',
		preparing: 'status-preparing',
		to_collect: 'status-collect'
	};

	let filters = $state({ name: '', status: '', user: '', model: '', cpu: '', ram: '', room: '' });
	let mobileSearch = $state('');
	let filterRefs: HTMLInputElement[] = [];

	function focusSearch() {
		const mobileSearch = document.querySelector('.mobile-search input') as HTMLInputElement;
		const desktopFilter = document.querySelector('.filter-row input') as HTMLInputElement;
		if (mobileSearch && window.getComputedStyle(mobileSearch.parentElement!).display !== 'none') {
			mobileSearch.focus();
		} else if (desktopFilter) {
			desktopFilter.focus();
		}
	}

	function filtersEmpty() {
		return !filters.name && !filters.status && !filters.user && !filters.model && !filters.cpu && !filters.ram && !filters.room && !mobileSearch;
	}

	function handleEscape() {
		const active = document.activeElement as HTMLElement;
		const isInputFocused = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';

		if (isInputFocused) {
			active.blur();
		} else if (!filtersEmpty()) {
			filters = { name: '', status: '', user: '', model: '', cpu: '', ram: '', room: '' };
			mobileSearch = '';
		} else {
			goto(backInfo.href);
		}
	}

	onMount(() => {
		pushContext('list');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'alt+n', action: () => goto('/notebooks/new'), context: 'list', description: 'Add new notebook' }));
		unsubs.push(registerShortcut({ key: '/', action: focusSearch, context: 'list', description: 'Focus search' }));
		unsubs.push(registerShortcut({ key: 'escape', action: handleEscape, context: 'list', description: 'Clear filters / Go to search', allowInInput: true }));
		return () => { popContext('list'); unsubs.forEach(u => u()); clearSidebarEdit(); };
	});

	let filteredNotebooks = $derived(
		data.notebooks
			.filter((n) => $showDisposal || n.status !== 'disposal')
			.filter((n) => {
				// Mobile unified search
				if (mobileSearch) {
					const q = mobileSearch.toLowerCase();
					const allFields = [n.name, n.status, n.userName, n.manufacturer, n.model, n.cpu, n.ram, n.roomName]
						.filter(Boolean).join(' ').toLowerCase();
					return allFields.includes(q);
				}
				// Desktop column filters
				const nameMatch = n.name.toLowerCase().includes(filters.name.toLowerCase());
				const statusMatch = n.status.toLowerCase().includes(filters.status.toLowerCase());
				const userMatch = (n.userName || '').toLowerCase().includes(filters.user.toLowerCase());
				const modelMatch = [n.manufacturer, n.model].filter(Boolean).join(' ').toLowerCase().includes(filters.model.toLowerCase());
				const cpuMatch = (n.cpu || '').toLowerCase().includes(filters.cpu.toLowerCase());
				const ramMatch = (n.ram || '').toLowerCase().includes(filters.ram.toLowerCase());
				const roomMatch = (n.roomName || '').toLowerCase().includes(filters.room.toLowerCase());
				return nameMatch && statusMatch && userMatch && modelMatch && cpuMatch && ramMatch && roomMatch;
			})
	);

	let suggestions = $derived({
		status: [...new Set(data.notebooks.map(n => n.status))].sort(),
		user: [...new Set(data.notebooks.map(n => n.userName).filter(Boolean))].sort(),
		model: [...new Set(data.notebooks.map(n => [n.manufacturer, n.model].filter(Boolean).join(' ')).filter(Boolean))].sort(),
		cpu: [...new Set(data.notebooks.map(n => n.cpu).filter(Boolean))].sort(),
		ram: [...new Set(data.notebooks.map(n => n.ram).filter(Boolean))].sort(),
		room: [...new Set(data.notebooks.map(n => n.roomName).filter(Boolean))].sort()
	});

	$effect(() => {
		setSidebarEdit({
			addUrl: '/notebooks/new',
			addLabel: 'Add Notebook',
			totalCount: data.notebooks.length,
			filteredCount: filteredNotebooks.length
		});
	});
</script>

<div class="terminal-page">
	<div class="page-header-minimal">
		<span class="header-text">NOTEBOOKS</span>
		<div class="mobile-header-right show-mobile">
			<span class="mobile-counts">
				<span>total: <span class="count-value">{data.notebooks.length}</span></span>
				<span>filtered: <span class="count-value">{filteredNotebooks.length}</span></span>
			</span>
			<a href="/notebooks/new" class="mobile-add-btn">+ Add</a>
		</div>
	</div>

	{#if data.notebooks.length === 0}
		<div class="empty-state">
			<div class="empty-icon">∅</div>
			<div class="empty-text">No notebooks found</div>
			<div class="empty-hint">Click <code>+ Add Notebook</code> to add your first one</div>
		</div>
	{:else}
		<!-- Mobile Search -->
		<div class="mobile-search">
			<input type="text" bind:value={mobileSearch} placeholder="Search all fields..." class="search-input" />
		</div>

		<!-- Mobile Cards -->
		<div class="mobile-cards">
			{#each filteredNotebooks as nb}
				<a href="/notebooks/{nb.id}" class="card">
					<div class="card-header">
						<span class="card-name">{nb.name}</span>
						<span class="status-badge {statusColors[nb.status] || ''}">{nb.status}</span>
					</div>
					<div class="card-body">
						{#if nb.userName}<div class="card-row"><span class="card-label">User:</span> {nb.userName}</div>{/if}
						{#if nb.manufacturer || nb.model}<div class="card-row"><span class="card-label">Model:</span> {[nb.manufacturer, nb.model].filter(Boolean).join(' ')}</div>{/if}
						{#if nb.roomName}<div class="card-row"><span class="card-label">Room:</span> {nb.roomName}</div>{/if}
					</div>
				</a>
			{/each}
		</div>

		<!-- Desktop Table -->
		<div class="desktop-table">
			<div class="terminal-table-container">
				<table class="terminal-table">
					<thead>
						<tr class="header-row">
							<th>NAME</th>
							<th>STATUS</th>
							<th>USER</th>
							<th>MODEL</th>
							<th>CPU</th>
							<th>RAM</th>
							<th>ROOM</th>
							<th class="col-actions">CMD</th>
						</tr>
						<tr class="filter-row">
							<th><input type="text" bind:value={filters.name} placeholder="/" /></th>
							<th><AutocompleteInput bind:value={filters.status} suggestions={suggestions.status} /></th>
							<th><AutocompleteInput bind:value={filters.user} suggestions={suggestions.user} /></th>
							<th><AutocompleteInput bind:value={filters.model} suggestions={suggestions.model} /></th>
							<th><AutocompleteInput bind:value={filters.cpu} suggestions={suggestions.cpu} /></th>
							<th><AutocompleteInput bind:value={filters.ram} suggestions={suggestions.ram} /></th>
							<th><AutocompleteInput bind:value={filters.room} suggestions={suggestions.room} /></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredNotebooks as nb}
							<tr class="data-row">
								<td class="col-name">{nb.name}</td>
								<td><span class="status-badge {statusColors[nb.status] || ''}">{nb.status}</span></td>
								<td class="col-dim">{nb.userName || '—'}</td>
								<td class="col-dim">{[nb.manufacturer, nb.model].filter(Boolean).join(' ') || '—'}</td>
								<td class="col-dim">{nb.cpu || '—'}</td>
								<td class="col-dim">{nb.ram || '—'}</td>
								<td class="col-dim">{nb.roomName || '—'}</td>
								<td class="col-actions"><a href="/notebooks/{nb.id}" class="edit-link">Edit</a></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="table-footer">
				<span class="footer-hint"><kbd>/</kbd> search <span class="hint-divider">│</span> <kbd>Esc</kbd> clear</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.terminal-page { max-width: 100%; }
	.page-header-minimal { margin-bottom: 20px; }
	.header-text { color: var(--terminal-cyan); font-size: 12px; letter-spacing: 2px; }
	.empty-state { padding: 64px 32px; text-align: center; border: 1px solid var(--terminal-border); background: var(--terminal-bg-alt); }
	.empty-icon { font-size: 48px; color: var(--terminal-muted); margin-bottom: 16px; }
	.empty-text { font-size: 14px; color: var(--terminal-dim); margin-bottom: 8px; }
	.empty-hint { font-size: 12px; color: var(--terminal-muted); }
	.empty-hint code { color: var(--terminal-cyan); background: var(--terminal-bg); padding: 2px 6px; }
	.terminal-table-container { border: 1px solid var(--terminal-border); overflow-x: auto; }
	.terminal-table { width: 100%; border-collapse: collapse; }
	.header-row th { padding: 12px 16px; font-size: 11px; font-weight: 500; text-align: left; color: var(--terminal-dim); background: var(--terminal-bg-alt); border-bottom: 1px solid var(--terminal-border); letter-spacing: 0.5px; }
	.filter-row th { padding: 8px 12px; background: var(--terminal-bg-panel); border-bottom: 1px solid var(--terminal-border); }
	.filter-row input { width: 100%; padding: 6px 10px; font-size: 12px; background: var(--terminal-bg); border: 1px solid var(--terminal-border); color: var(--terminal-text); }
	.filter-row input:focus { border-color: var(--terminal-cyan); outline: none; }
	.filter-row input::placeholder { color: var(--terminal-muted); }
	.data-row { transition: background 0.1s ease; }
	.data-row:hover { background: var(--terminal-bg-alt); }
	.data-row td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--terminal-border); }
	.col-name { color: var(--terminal-text-bright); font-weight: 500; }
	.col-dim { color: var(--terminal-dim); }
	.col-actions { text-align: right; width: 80px; }
	.status-badge { font-size: 11px; padding: 3px 8px; border: 1px solid; text-transform: uppercase; letter-spacing: 0.5px; }
	.status-active { color: var(--terminal-green); border-color: var(--terminal-green); background: rgba(0, 255, 136, 0.1); }
	.status-disposal { color: var(--terminal-red); border-color: var(--terminal-red); background: rgba(255, 51, 102, 0.1); }
	.status-preparing { color: var(--terminal-amber); border-color: var(--terminal-amber); background: rgba(255, 184, 0, 0.1); }
	.status-collect { color: var(--terminal-blue); border-color: var(--terminal-blue); background: rgba(0, 102, 255, 0.1); }
	.edit-link { color: var(--terminal-cyan); font-size: 12px; padding: 4px 10px; border: 1px solid var(--terminal-border); transition: all 0.15s ease; }
	.edit-link:hover { border-color: var(--terminal-cyan); background: rgba(0, 255, 242, 0.1); }
	.table-footer { padding: 12px 16px; border: 1px solid var(--terminal-border); border-top: none; background: var(--terminal-bg-alt); }
	.footer-hint { font-size: 11px; color: var(--terminal-muted); }
	.footer-hint kbd { background: var(--terminal-bg); border: 1px solid var(--terminal-border); padding: 2px 6px; font-size: 10px; margin-right: 4px; color: var(--terminal-cyan); }
	.hint-divider { margin: 0 12px; color: var(--terminal-muted); }

	/* Mobile/Desktop toggle */
	.mobile-search { display: block; margin-bottom: 16px; }
	.mobile-cards { display: flex; flex-direction: column; gap: 12px; }
	.desktop-table { display: none; }
	@media (min-width: 768px) { .mobile-search, .mobile-cards { display: none; } .desktop-table { display: block; } }

	.search-input { width: 100%; padding: 12px 16px; background: var(--terminal-bg); border: 1px solid var(--terminal-border); color: var(--terminal-text); font-size: 16px; }
	.search-input:focus { border-color: var(--terminal-cyan); outline: none; }

	.card { display: block; padding: 16px; background: var(--terminal-bg-alt); border: 1px solid var(--terminal-border); transition: all 0.15s ease; }
	.card:hover { border-color: var(--terminal-cyan); }
	.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
	.card-name { font-weight: 500; color: var(--terminal-text-bright); font-size: 14px; }
	.card-body { display: flex; flex-direction: column; gap: 6px; }
	.card-row { font-size: 12px; color: var(--terminal-dim); }
	.card-label { color: var(--terminal-muted); }
</style>
