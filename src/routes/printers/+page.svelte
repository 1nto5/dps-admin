<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { showDisposal } from '$lib/stores/settings';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { terminalFade } from '$lib/animations/transitions';
	import { getStaggerDelay } from '$lib/animations';
	import AutocompleteInput from '$lib/components/AutocompleteInput.svelte';

	let { data }: { data: PageData } = $props();
	const statusColors: Record<string, string> = {
		in_use: 'status-active',
		disposal: 'status-disposal',
		preparing: 'status-preparing',
		to_collect: 'status-collect'
	};

	let filters = $state({ name: '', status: '', device: '', model: '', ip: '', network: '', room: '' });
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
		return !filters.name && !filters.status && !filters.device && !filters.model && !filters.ip && !filters.network && !filters.room;
	}

	function handleEscape() {
		if (filtersEmpty()) {
			goto('/');
		} else {
			filters = { name: '', status: '', device: '', model: '', ip: '', network: '', room: '' };
			(document.activeElement as HTMLElement)?.blur();
		}
	}

	function handleFilterKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && filteredPrinters.length > 0) {
			e.preventDefault();
			goto(`/printers/${filteredPrinters[0].id}`);
		}
	}

	onMount(() => {
		pushContext('list');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'alt+n', action: () => goto('/printers/new'), context: 'list', description: 'Add new printer' }));
		unsubs.push(registerShortcut({ key: '/', action: focusSearch, context: 'list', description: 'Focus search' }));
		unsubs.push(registerShortcut({ key: 'escape', action: handleEscape, context: 'list', description: 'Clear filters / Go to search', allowInInput: true }));
		return () => { popContext('list'); unsubs.forEach(u => u()); };
	});

	let filteredPrinters = $derived(
		data.printers
			.filter((p) => $showDisposal || p.status !== 'disposal')
			.filter((p) => {
				const nameMatch = p.name.toLowerCase().includes(filters.name.toLowerCase());
				const statusMatch = p.status.toLowerCase().includes(filters.status.toLowerCase());
				const deviceName = p.computerName || p.notebookName || '';
				const deviceMatch = deviceName.toLowerCase().includes(filters.device.toLowerCase());
				const modelMatch = [p.manufacturer, p.model].filter(Boolean).join(' ').toLowerCase().includes(filters.model.toLowerCase());
				const ipMatch = (p.ipAddress || '').toLowerCase().includes(filters.ip.toLowerCase());
				const networkMatch = (p.isNetwork ? 'yes' : 'no').includes(filters.network.toLowerCase());
				const roomMatch = (p.roomName || '').toLowerCase().includes(filters.room.toLowerCase());
				return nameMatch && statusMatch && deviceMatch && modelMatch && ipMatch && networkMatch && roomMatch;
			})
	);

	let suggestions = $derived({
		status: [...new Set(data.printers.map(p => p.status))].sort(),
		device: [...new Set(data.printers.map(p => p.computerName || p.notebookName).filter(Boolean))].sort(),
		model: [...new Set(data.printers.map(p => [p.manufacturer, p.model].filter(Boolean).join(' ')).filter(Boolean))].sort(),
		ip: [...new Set(data.printers.map(p => p.ipAddress).filter(Boolean))].sort(),
		room: [...new Set(data.printers.map(p => p.roomName).filter(Boolean))].sort()
	});
</script>

<div class="terminal-page">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">PRINTERS</span>
			<span class="header-decoration">──────────────────────────────────────────────────</span>
		</div>
		<div class="header-meta">
			<span class="meta-item"><span class="meta-label">total:</span><span class="meta-value">{data.printers.length}</span></span>
			<span class="meta-divider">│</span>
			<span class="meta-item"><span class="meta-label">filtered:</span><span class="meta-value">{filteredPrinters.length}</span></span>
		</div>
	</div>

	<div class="page-actions">
		<a href="/printers/new" class="action-btn action-primary">
			<span class="action-icon">+</span>
			<span>Add Printer</span>
			<kbd>⌥N</kbd>
		</a>
	</div>

	{#if data.printers.length === 0}
		<div class="empty-state">
			<div class="empty-icon">∅</div>
			<div class="empty-text">No printers found</div>
			<div class="empty-hint">Click <code>+ Add Printer</code> to add your first one</div>
		</div>
	{:else}
		<!-- Mobile Search -->
		<div class="mobile-search">
			<input type="text" bind:value={filters.name} bind:this={filterRefs[0]} placeholder="Search printers..." onkeydown={handleFilterKeydown} class="search-input" />
		</div>

		<!-- Mobile Cards -->
		<div class="mobile-cards">
			{#each filteredPrinters as item}
				<a href="/printers/{item.id}" class="card">
					<div class="card-header">
						<span class="card-name">{item.name}</span>
						<span class="status-badge {statusColors[item.status] || ''}">{item.status}</span>
					</div>
					<div class="card-body">
						{#if item.manufacturer || item.model}<div class="card-row"><span class="card-label">Model:</span> {[item.manufacturer, item.model].filter(Boolean).join(' ')}</div>{/if}
						{#if item.ipAddress}<div class="card-row"><span class="card-label">IP:</span> <span class="ip-text">{item.ipAddress}</span></div>{/if}
						{#if item.roomName}<div class="card-row"><span class="card-label">Room:</span> {item.roomName}</div>{/if}
						<div class="card-row"><span class="card-label">Network:</span> <span class="{item.isNetwork ? 'net-yes' : 'net-no'}">{item.isNetwork ? 'Yes' : 'No'}</span></div>
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
							<th>DEVICE</th>
							<th>MODEL</th>
							<th>IP</th>
							<th>NET</th>
							<th>ROOM</th>
							<th class="col-actions">CMD</th>
						</tr>
						<tr class="filter-row">
							<th><input type="text" bind:value={filters.name} placeholder="/" onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.status} suggestions={suggestions.status} onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.device} suggestions={suggestions.device} onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.model} suggestions={suggestions.model} onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.ip} suggestions={suggestions.ip} onkeydown={handleFilterKeydown} /></th>
							<th><input type="text" bind:value={filters.network} placeholder="Filter..." onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.room} suggestions={suggestions.room} onkeydown={handleFilterKeydown} /></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredPrinters as item}
							<tr class="data-row">
								<td class="col-name">{item.name}</td>
								<td><span class="status-badge {statusColors[item.status] || ''}">{item.status}</span></td>
								<td class="col-dim">{item.computerName || item.notebookName || '—'}</td>
								<td class="col-dim">{[item.manufacturer, item.model].filter(Boolean).join(' ') || '—'}</td>
								<td class="col-mono">{item.ipAddress || '—'}</td>
								<td><span class="net-badge {item.isNetwork ? 'net-yes' : 'net-no'}">{item.isNetwork ? 'Y' : 'N'}</span></td>
								<td class="col-dim">{item.roomName || '—'}</td>
								<td class="col-actions"><a href="/printers/{item.id}" class="edit-link">Edit</a></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="table-footer">
				<span class="footer-hint"><kbd>/</kbd> search <span class="hint-divider">│</span> <kbd>Esc</kbd> clear <span class="hint-divider">│</span> <kbd>↵</kbd> edit first</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.terminal-page { max-width: 100%; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; margin-bottom: 8px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }
	.header-meta { font-size: 12px; display: flex; gap: 12px; }
	.meta-label { color: var(--terminal-dim); }
	.meta-value { color: var(--terminal-text-bright); margin-left: 4px; }
	.meta-divider { color: var(--terminal-muted); }
	.page-actions { margin-bottom: 24px; }
	.action-btn { display: inline-flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 13px; border: 1px solid var(--terminal-border); background: transparent; transition: all 0.15s ease; }
	.action-primary { border-color: var(--terminal-cyan); color: var(--terminal-cyan); }
	.action-primary:hover { background: var(--terminal-cyan); color: var(--terminal-bg); box-shadow: 0 0 15px rgba(0, 255, 242, 0.3); }
	.action-icon { font-weight: bold; }
	.action-btn kbd { font-size: 10px; padding: 2px 6px; background: var(--terminal-bg); border: 1px solid var(--terminal-border); color: var(--terminal-muted); }
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
	.col-mono { font-family: monospace; font-size: 12px; color: var(--terminal-amber); }
	.col-actions { text-align: right; width: 80px; }
	.status-badge { font-size: 11px; padding: 3px 8px; border: 1px solid; text-transform: uppercase; letter-spacing: 0.5px; }
	.status-active { color: var(--terminal-green); border-color: var(--terminal-green); background: rgba(0, 255, 136, 0.1); }
	.status-disposal { color: var(--terminal-red); border-color: var(--terminal-red); background: rgba(255, 51, 102, 0.1); }
	.status-preparing { color: var(--terminal-amber); border-color: var(--terminal-amber); background: rgba(255, 184, 0, 0.1); }
	.status-collect { color: var(--terminal-blue); border-color: var(--terminal-blue); background: rgba(0, 102, 255, 0.1); }
	.net-badge { font-size: 11px; padding: 2px 6px; font-weight: 500; }
	.net-yes { color: var(--terminal-green); }
	.net-no { color: var(--terminal-muted); }
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

	.search-input { width: 100%; padding: 12px 16px; background: var(--terminal-bg); border: 1px solid var(--terminal-border); color: var(--terminal-text); font-size: 14px; }
	.search-input:focus { border-color: var(--terminal-cyan); outline: none; }

	.card { display: block; padding: 16px; background: var(--terminal-bg-alt); border: 1px solid var(--terminal-border); transition: all 0.15s ease; }
	.card:hover { border-color: var(--terminal-cyan); }
	.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
	.card-name { font-weight: 500; color: var(--terminal-text-bright); font-size: 14px; }
	.card-body { display: flex; flex-direction: column; gap: 6px; }
	.card-row { font-size: 12px; color: var(--terminal-dim); }
	.card-label { color: var(--terminal-muted); }
	.ip-text { font-family: monospace; color: var(--terminal-amber); }
</style>
