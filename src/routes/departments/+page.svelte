<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { terminalFade } from '$lib/animations/transitions';
	import { getStaggerDelay } from '$lib/animations';

	let { data }: { data: PageData } = $props();

	let filters = $state({ name: '' });
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
		return !filters.name;
	}

	function handleEscape() {
		if (filtersEmpty()) {
			goto('/');
		} else {
			filters = { name: '' };
			(document.activeElement as HTMLElement)?.blur();
		}
	}

	function handleFilterKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && filteredDepartments.length > 0) {
			e.preventDefault();
			goto(`/departments/${filteredDepartments[0].id}`);
		}
	}

	onMount(() => {
		pushContext('list');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'alt+n', action: () => goto('/departments/new'), context: 'list', description: 'Add new department' }));
		unsubs.push(registerShortcut({ key: '/', action: focusSearch, context: 'list', description: 'Focus search' }));
		unsubs.push(registerShortcut({ key: 'escape', action: handleEscape, context: 'list', description: 'Clear filters / Go to search', allowInInput: true }));
		return () => { popContext('list'); unsubs.forEach(u => u()); };
	});

	let filteredDepartments = $derived(
		data.departments.filter((d) => d.name.toLowerCase().includes(filters.name.toLowerCase()))
	);
</script>

<div class="terminal-page">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">DEPARTMENTS</span>
			<span class="header-decoration">───────────────────────────────────────────</span>
		</div>
		<div class="header-meta">
			<span class="meta-item"><span class="meta-label">total:</span><span class="meta-value">{data.departments.length}</span></span>
			<span class="meta-divider">│</span>
			<span class="meta-item"><span class="meta-label">filtered:</span><span class="meta-value">{filteredDepartments.length}</span></span>
		</div>
	</div>

	<div class="page-actions">
		<a href="/departments/new" class="action-btn action-primary">
			<span class="action-icon">+</span>
			<span>Add Department</span>
			<kbd>⌥N</kbd>
		</a>
	</div>

	{#if data.departments.length === 0}
		<div class="empty-state">
			<div class="empty-icon">∅</div>
			<div class="empty-text">No departments found</div>
			<div class="empty-hint">Click <code>+ Add Department</code> to add your first one</div>
		</div>
	{:else}
		<!-- Mobile Search -->
		<div class="mobile-search">
			<input type="text" bind:value={filters.name} bind:this={filterRefs[0]} placeholder="Search departments..." onkeydown={handleFilterKeydown} class="search-input" />
		</div>

		<!-- Mobile Cards -->
		<div class="mobile-cards">
			{#each filteredDepartments as department}
				<a href="/departments/{department.id}" class="card">
					<span class="card-name">{department.name}</span>
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
							<th class="col-actions">CMD</th>
						</tr>
						<tr class="filter-row">
							<th><input type="text" bind:value={filters.name} placeholder="/" onkeydown={handleFilterKeydown} /></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredDepartments as department}
							<tr class="data-row">
								<td class="col-name">{department.name}</td>
								<td class="col-actions"><a href="/departments/{department.id}" class="edit-link">Edit</a></td>
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
	.col-actions { text-align: right; width: 80px; }
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

	.search-input { width: 100%; padding: 12px 16px; background: var(--terminal-bg); border: 1px solid var(--terminal-border); color: var(--terminal-text); font-size: 14px; }
	.search-input:focus { border-color: var(--terminal-cyan); outline: none; }

	.card { display: block; padding: 14px 16px; background: var(--terminal-bg-alt); border: 1px solid var(--terminal-border); transition: all 0.15s ease; }
	.card:hover { border-color: var(--terminal-cyan); }
	.card-name { font-weight: 500; color: var(--terminal-text-bright); font-size: 14px; }
</style>
