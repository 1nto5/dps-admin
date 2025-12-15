<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { showDisposal } from '$lib/stores/settings';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
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

	let filters = $state({ name: '', status: '', model: '', cpu: '', ram: '', room: '', user: '' });
	let mobileSearch = $state('');
	let filterRefs: HTMLInputElement[] = [];

	function focusSearch() {
		// Focus the visible search input (mobile or desktop)
		const mobileSearch = document.querySelector('.mobile-search input') as HTMLInputElement;
		const desktopFilter = document.querySelector('.filter-row input') as HTMLInputElement;
		if (mobileSearch && window.getComputedStyle(mobileSearch.parentElement!).display !== 'none') {
			mobileSearch.focus();
		} else if (desktopFilter) {
			desktopFilter.focus();
		}
	}

	function filtersEmpty() {
		return !filters.name && !filters.status && !filters.model && !filters.cpu && !filters.ram && !filters.room && !filters.user && !mobileSearch;
	}

	function handleEscape() {
		const active = document.activeElement as HTMLElement;
		const isInputFocused = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';

		if (isInputFocused) {
			active.blur();
		} else if (!filtersEmpty()) {
			filters = { name: '', status: '', model: '', cpu: '', ram: '', room: '', user: '' };
			mobileSearch = '';
		} else {
			goto(backInfo.href);
		}
	}

	function handleFilterKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && filteredComputers.length > 0) {
			e.preventDefault();
			goto(`/computers/${filteredComputers[0].id}`);
		}
	}

	onMount(() => {
		pushContext('list');
		const unsubs: (() => void)[] = [];

		unsubs.push(registerShortcut({ key: 'alt+n', action: () => goto('/computers/new'), context: 'list', description: 'Add new computer' }));
		unsubs.push(registerShortcut({ key: '/', action: focusSearch, context: 'list', description: 'Focus search' }));
		unsubs.push(registerShortcut({ key: 'escape', action: handleEscape, context: 'list', description: 'Clear filters / Go to search', allowInInput: true }));

		return () => { popContext('list'); unsubs.forEach(u => u()); clearSidebarEdit(); };
	});

	let filteredComputers = $derived(
		data.computers
			.filter((c) => $showDisposal || c.status !== 'disposal')
			.filter((c) => {
				// Mobile unified search - matches any field
				if (mobileSearch) {
					const q = mobileSearch.toLowerCase();
					const allFields = [c.name, c.status, c.userName, c.manufacturer, c.model, c.cpu, c.ram, c.roomName]
						.filter(Boolean).join(' ').toLowerCase();
					return allFields.includes(q);
				}
				// Desktop column filters
				const nameMatch = c.name.toLowerCase().includes(filters.name.toLowerCase());
				const statusMatch = c.status.toLowerCase().includes(filters.status.toLowerCase());
				const modelMatch = [c.manufacturer, c.model].filter(Boolean).join(' ').toLowerCase().includes(filters.model.toLowerCase());
				const cpuMatch = (c.cpu || '').toLowerCase().includes(filters.cpu.toLowerCase());
				const ramMatch = (c.ram || '').toLowerCase().includes(filters.ram.toLowerCase());
				const roomMatch = (c.roomName || '').toLowerCase().includes(filters.room.toLowerCase());
				const userMatch = (c.userName || '').toLowerCase().includes(filters.user.toLowerCase());
				return nameMatch && statusMatch && modelMatch && cpuMatch && ramMatch && roomMatch && userMatch;
			})
	);

	// Unique values for autocomplete suggestions
	let suggestions = $derived({
		status: [...new Set(data.computers.map(c => c.status))].sort(),
		user: [...new Set(data.computers.map(c => c.userName).filter(Boolean))].sort(),
		model: [...new Set(data.computers.map(c => [c.manufacturer, c.model].filter(Boolean).join(' ')).filter(Boolean))].sort(),
		cpu: [...new Set(data.computers.map(c => c.cpu).filter(Boolean))].sort(),
		ram: [...new Set(data.computers.map(c => c.ram).filter(Boolean))].sort(),
		room: [...new Set(data.computers.map(c => c.roomName).filter(Boolean))].sort()
	});

	$effect(() => {
		setSidebarEdit({
			addUrl: '/computers/new',
			addLabel: 'Add Computer',
			totalCount: data.computers.length,
			filteredCount: filteredComputers.length
		});
	});

	function getCopyUrl(comp: typeof data.computers[0]): string {
		const params = new URLSearchParams();
		if (comp.status) params.set('status', comp.status);
		if (comp.inventoryNumber) params.set('inventoryNumber', comp.inventoryNumber);
		if (comp.manufacturer) params.set('manufacturer', comp.manufacturer);
		if (comp.model) params.set('model', comp.model);
		if (comp.cpu) params.set('cpu', comp.cpu);
		if (comp.ram) params.set('ram', comp.ram);
		if (comp.storage) params.set('storage', comp.storage);
		if (comp.windows) params.set('windows', comp.windows);
		if (comp.office) params.set('office', comp.office);
		if (comp.notes) params.set('notes', comp.notes);
		if (comp.purchaseDate) params.set('purchaseDate', comp.purchaseDate);
		if (comp.roomId) params.set('roomId', String(comp.roomId));
		if (comp.userId) params.set('userId', String(comp.userId));
		return `/computers/new?${params.toString()}`;
	}
</script>

<div class="terminal-page">
	<div class="page-header-minimal">
		<span class="header-text">COMPUTERS</span>
		<div class="mobile-header-right show-mobile">
			<span class="mobile-counts">
				<span>total: <span class="count-value">{data.computers.length}</span></span>
				<span>filtered: <span class="count-value">{filteredComputers.length}</span></span>
			</span>
			<a href="/computers/new" class="mobile-add-btn">+ Add</a>
		</div>
	</div>

	{#if data.computers.length === 0}
		<div class="empty-state">
			<div class="empty-icon">∅</div>
			<div class="empty-text">No computers found</div>
			<div class="empty-hint">Click <code>+ Add Computer</code> to add your first one</div>
		</div>
	{:else}
		<!-- Mobile Search -->
		<div class="mobile-search">
			<input type="text" bind:value={mobileSearch} placeholder="Search all fields..." onkeydown={handleFilterKeydown} class="search-input" />
		</div>

		<!-- Mobile Cards -->
		<div class="mobile-cards">
			{#each filteredComputers as comp, i (comp.id)}
				<div class="card">
					<a href="/computers/{comp.id}" class="card-content">
						<div class="card-header">
							<span class="card-name">{comp.name}</span>
							<span class="status-badge {statusColors[comp.status] || ''}">{comp.status}</span>
						</div>
						<div class="card-body">
							{#if comp.userName}<div class="card-row"><span class="card-label">User:</span> {comp.userName}</div>{/if}
							{#if comp.manufacturer || comp.model}<div class="card-row"><span class="card-label">Model:</span> {[comp.manufacturer, comp.model].filter(Boolean).join(' ')}</div>{/if}
							{#if comp.roomName}<div class="card-row"><span class="card-label">Room:</span> {comp.roomName}</div>{/if}
						</div>
					</a>
					<div class="card-actions">
						<a href={getCopyUrl(comp)} class="card-action-btn">Copy</a>
						<a href="/computers/{comp.id}" class="card-action-btn">Edit</a>
					</div>
				</div>
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
							<th><input type="text" bind:value={filters.name} placeholder="/" onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.status} suggestions={suggestions.status} onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.user} suggestions={suggestions.user} onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.model} suggestions={suggestions.model} onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.cpu} suggestions={suggestions.cpu} onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.ram} suggestions={suggestions.ram} onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.room} suggestions={suggestions.room} onkeydown={handleFilterKeydown} /></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredComputers as comp, i (comp.id)}
							<tr class="data-row" >
								<td class="col-name">{comp.name}</td>
								<td>
									<span class="status-badge {statusColors[comp.status] || ''}">{comp.status}</span>
								</td>
								<td class="col-dim">{comp.userName || '—'}</td>
								<td class="col-dim">{[comp.manufacturer, comp.model].filter(Boolean).join(' ') || '—'}</td>
								<td class="col-dim">{comp.cpu || '—'}</td>
								<td class="col-dim">{comp.ram || '—'}</td>
								<td class="col-dim">{comp.roomName || '—'}</td>
								<td class="col-actions">
									<a href={getCopyUrl(comp)} class="copy-link">Copy</a>
									<a href="/computers/{comp.id}" class="edit-link">Edit</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Footer hint -->
			<div class="table-footer">
				<span class="footer-hint">
					<kbd>/</kbd> search
					<span class="hint-divider">│</span>
					<kbd>Esc</kbd> clear
					<span class="hint-divider">│</span>
					<kbd>↵</kbd> edit first
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.terminal-page { max-width: 100%; }
	.page-header-minimal { margin-bottom: 20px; }
	.header-text { color: var(--terminal-cyan); font-size: 12px; letter-spacing: 2px; }

	/* Empty state */
	.empty-state {
		padding: 64px 32px;
		text-align: center;
		border: 1px solid var(--terminal-border);
		background: var(--terminal-bg-alt);
	}

	.empty-icon {
		font-size: 48px;
		color: var(--terminal-muted);
		margin-bottom: 16px;
	}

	.empty-text {
		font-size: 14px;
		color: var(--terminal-dim);
		margin-bottom: 8px;
	}

	.empty-hint {
		font-size: 12px;
		color: var(--terminal-muted);
	}

	.empty-hint code {
		color: var(--terminal-cyan);
		background: var(--terminal-bg);
		padding: 2px 6px;
	}

	/* Table */
	.terminal-table-container {
		border: 1px solid var(--terminal-border);
		overflow-x: auto;
	}

	.terminal-table {
		width: 100%;
		border-collapse: collapse;
	}

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

	.filter-row th {
		padding: 8px 12px;
		background: var(--terminal-bg-panel);
		border-bottom: 1px solid var(--terminal-border);
	}

	.filter-row input {
		width: 100%;
		padding: 6px 10px;
		font-size: 12px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-text);
	}

	.filter-row input:focus {
		border-color: var(--terminal-cyan);
		outline: none;
	}

	.filter-row input::placeholder {
		color: var(--terminal-muted);
	}

	.data-row {
		transition: background 0.1s ease;
	}

	.data-row:hover {
		background: var(--terminal-bg-alt);
	}

	.data-row td {
		padding: 12px 16px;
		font-size: 13px;
		border-bottom: 1px solid var(--terminal-border);
	}

	.col-name {
		color: var(--terminal-text-bright);
		font-weight: 500;
	}

	.col-dim {
		color: var(--terminal-dim);
	}

	.col-actions {
		text-align: right;
		width: 120px;
	}

	/* Status badges */
	.status-badge {
		font-size: 11px;
		padding: 3px 8px;
		border: 1px solid;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-active {
		color: var(--terminal-green);
		border-color: var(--terminal-green);
		background: rgba(0, 255, 136, 0.1);
	}

	.status-disposal {
		color: var(--terminal-red);
		border-color: var(--terminal-red);
		background: rgba(255, 51, 102, 0.1);
	}

	.status-preparing {
		color: var(--terminal-amber);
		border-color: var(--terminal-amber);
		background: rgba(255, 184, 0, 0.1);
	}

	.status-collect {
		color: var(--terminal-blue);
		border-color: var(--terminal-blue);
		background: rgba(0, 102, 255, 0.1);
	}

	/* Edit/Copy links */
	.copy-link,
	.edit-link {
		color: var(--terminal-cyan);
		font-size: 12px;
		padding: 4px 10px;
		border: 1px solid var(--terminal-border);
		transition: all 0.15s ease;
	}

	.copy-link { margin-right: 6px; }

	.copy-link:hover,
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

	.footer-hint {
		font-size: 11px;
		color: var(--terminal-muted);
	}

	.footer-hint kbd {
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		padding: 2px 6px;
		font-size: 10px;
		margin-right: 4px;
		color: var(--terminal-cyan);
	}

	.hint-divider {
		margin: 0 12px;
		color: var(--terminal-muted);
	}

	/* Mobile/Desktop toggle */
	.mobile-search { display: block; margin-bottom: 16px; }
	.mobile-cards { display: flex; flex-direction: column; gap: 12px; }
	.desktop-table { display: none; }

	@media (min-width: 768px) {
		.mobile-search { display: none; }
		.mobile-cards { display: none; }
		.desktop-table { display: block; }
	}

	/* Mobile search */
	.search-input {
		width: 100%;
		padding: 12px 16px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-text);
		font-size: 16px; /* Prevents iOS Safari zoom on focus */
	}

	.search-input:focus {
		border-color: var(--terminal-cyan);
		outline: none;
	}

	/* Mobile cards */
	.card {
		display: block;
		background: var(--terminal-bg-alt);
		border: 1px solid var(--terminal-border);
		transition: all 0.15s ease;
	}

	.card:hover {
		border-color: var(--terminal-cyan);
	}

	.card-content {
		display: block;
		padding: 16px;
		padding-bottom: 12px;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.card-name {
		font-weight: 500;
		color: var(--terminal-text-bright);
		font-size: 14px;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.card-row {
		font-size: 12px;
		color: var(--terminal-dim);
	}

	.card-label {
		color: var(--terminal-muted);
	}

	.card-actions {
		display: flex;
		gap: 8px;
		padding: 12px 16px;
		border-top: 1px solid var(--terminal-border);
	}

	.card-action-btn {
		flex: 1;
		text-align: center;
		padding: 8px;
		font-size: 12px;
		color: var(--terminal-cyan);
		border: 1px solid var(--terminal-border);
		transition: all 0.15s ease;
	}

	.card-action-btn:hover {
		border-color: var(--terminal-cyan);
		background: rgba(0, 255, 242, 0.1);
	}
</style>
