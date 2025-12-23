<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { setSidebarEdit, clearSidebarEdit } from '$lib/stores/sidebar.svelte';
	import { getBackInfo } from '$lib/stores/navigation';

	let { data }: { data: PageData } = $props();
	const backInfo = getBackInfo('/', 'Search');

	let filters = $state({ name: '' });
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
		return !filters.name && !mobileSearch;
	}

	function handleEscape() {
		const active = document.activeElement as HTMLElement;
		const isInputFocused = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';

		if (isInputFocused) {
			active.blur();
		} else if (!filtersEmpty()) {
			filters = { name: '' };
			mobileSearch = '';
		} else {
			goto(backInfo.href);
		}
	}

	function handleFilterKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && filteredRooms.length > 0) {
			e.preventDefault();
			goto(`/rooms/${filteredRooms[0].id}`);
		}
	}

	onMount(() => {
		pushContext('list');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'alt+n', action: () => goto('/rooms/new'), context: 'list', description: 'Add new room' }));
		unsubs.push(registerShortcut({ key: '/', action: focusSearch, context: 'list', description: 'Focus search' }));
		unsubs.push(registerShortcut({ key: 'escape', action: handleEscape, context: 'list', description: 'Clear filters / Go to search', allowInInput: true }));
		return () => { popContext('list'); unsubs.forEach(u => u()); clearSidebarEdit(); };
	});

	let filteredRooms = $derived(
		data.rooms.filter((r) => {
			if (mobileSearch) {
				return r.name.toLowerCase().includes(mobileSearch.toLowerCase());
			}
			return r.name.toLowerCase().includes(filters.name.toLowerCase());
		})
	);

	$effect(() => {
		setSidebarEdit({
			addUrl: '/rooms/new',
			addLabel: 'Add Room',
			totalCount: data.rooms.length,
			filteredCount: filteredRooms.length
		});
	});
</script>

<div class="terminal-page">
	<div class="page-header-minimal">
		<span class="header-text">ROOMS</span>
		<div class="mobile-header-right show-mobile">
			<span class="mobile-counts">
				<span>total: <span class="count-value">{data.rooms.length}</span></span>
				<span>filtered: <span class="count-value">{filteredRooms.length}</span></span>
			</span>
			<a href="/rooms/new" class="mobile-add-btn">+ Add</a>
		</div>
	</div>

	{#if data.rooms.length === 0}
		<div class="empty-state">
			<div class="empty-icon">∅</div>
			<div class="empty-text">No rooms found</div>
			<div class="empty-hint">Click <code>+ Add Room</code> to add your first one</div>
		</div>
	{:else}
		<!-- Mobile Search -->
		<div class="mobile-search">
			<input type="text" bind:value={mobileSearch} placeholder="Search rooms..." onkeydown={handleFilterKeydown} class="search-input" />
		</div>

		<!-- Mobile Cards -->
		<div class="mobile-cards">
			{#each filteredRooms as room, i (room.id)}
				<a href="/rooms/{room.id}" class="card">
					<span class="card-name">{room.name}</span>
				</a>
			{/each}
		</div>

		<!-- Desktop Table -->
		<div class="desktop-table">
			<div class="terminal-table-container">
				<table class="terminal-table">
					<thead>
						<tr class="header-row">
							<th class="col-actions">CMD</th>
							<th>NAME</th>
						</tr>
						<tr class="filter-row">
							<th></th>
							<th><input type="text" bind:value={filters.name} placeholder="/" onkeydown={handleFilterKeydown} /></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredRooms as room, i (room.id)}
							<tr class="data-row">
								<td class="col-actions"><a href="/rooms/{room.id}" class="edit-link">Edit</a></td>
								<td class="col-name">{room.name}</td>
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
	.col-actions { text-align: left; width: 80px; }
	.edit-link { color: var(--terminal-cyan); font-size: 12px; padding: 4px 10px; border: 1px solid var(--terminal-border); transition: all 0.15s ease; }
	.edit-link:hover { border-color: var(--terminal-cyan); background: rgba(0, 255, 242, 0.1); }
	.table-footer { padding: 12px 16px; border: 1px solid var(--terminal-border); border-top: none; background: var(--terminal-bg-alt); }
	.footer-hint { font-size: 11px; color: var(--terminal-muted); }
	.footer-hint kbd { background: var(--terminal-bg); border: 1px solid var(--terminal-border); padding: 2px 6px; font-size: 10px; margin-right: 4px; color: var(--terminal-cyan); }
	.hint-divider { margin: 0 12px; color: var(--terminal-muted); }

	/* Mobile/Desktop toggle */
	.mobile-search { display: block; margin-bottom: 16px; }
	.mobile-cards { display: flex; flex-direction: column; gap: 8px; }
	.desktop-table { display: none; }
	@media (min-width: 768px) { .mobile-search, .mobile-cards { display: none; } .desktop-table { display: block; } }

	.search-input { width: 100%; padding: 12px 16px; background: var(--terminal-bg); border: 1px solid var(--terminal-border); color: var(--terminal-text); font-size: 16px; }
	.search-input:focus { border-color: var(--terminal-cyan); outline: none; }

	.card { display: block; padding: 14px 16px; background: var(--terminal-bg-alt); border: 1px solid var(--terminal-border); transition: all 0.15s ease; }
	.card:hover { border-color: var(--terminal-cyan); }
	.card-name { font-weight: 500; color: var(--terminal-text-bright); font-size: 14px; }
</style>
