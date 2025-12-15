<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { terminalFade } from '$lib/animations/transitions';
	import { getStaggerDelay } from '$lib/animations';
	import AutocompleteInput from '$lib/components/AutocompleteInput.svelte';
	import { setSidebarEdit, clearSidebarEdit } from '$lib/stores/sidebar.svelte';
	import { getBackInfo } from '$lib/stores/navigation';

	let { data }: { data: PageData } = $props();
	const backInfo = getBackInfo('/', 'Search');

	let filters = $state({ name: '', jobTitle: '', email: '', department: '' });
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
		return !filters.name && !filters.jobTitle && !filters.email && !filters.department && !mobileSearch;
	}

	function handleEscape() {
		const active = document.activeElement as HTMLElement;
		const isInputFocused = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';

		if (isInputFocused) {
			active.blur();
		} else if (!filtersEmpty()) {
			filters = { name: '', jobTitle: '', email: '', department: '' };
			mobileSearch = '';
		} else {
			goto(backInfo.href);
		}
	}

	function handleFilterKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && filteredUsers.length > 0) {
			e.preventDefault();
			goto(`/users/${filteredUsers[0].id}`);
		}
	}

	onMount(() => {
		pushContext('list');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'alt+n', action: () => goto('/users/new'), context: 'list', description: 'Add new user' }));
		unsubs.push(registerShortcut({ key: '/', action: focusSearch, context: 'list', description: 'Focus search' }));
		unsubs.push(registerShortcut({ key: 'escape', action: handleEscape, context: 'list', description: 'Clear filters / Go to search', allowInInput: true }));
		return () => { popContext('list'); unsubs.forEach(u => u()); clearSidebarEdit(); };
	});

	let filteredUsers = $derived(
		data.users.filter((u) => {
			// Mobile unified search
			if (mobileSearch) {
				const q = mobileSearch.toLowerCase();
				const allFields = [u.name, u.jobTitle, u.email, u.departmentName]
					.filter(Boolean).join(' ').toLowerCase();
				return allFields.includes(q);
			}
			// Desktop column filters
			const nameMatch = u.name.toLowerCase().includes(filters.name.toLowerCase());
			const jobMatch = (u.jobTitle || '').toLowerCase().includes(filters.jobTitle.toLowerCase());
			const emailMatch = (u.email || '').toLowerCase().includes(filters.email.toLowerCase());
			const deptMatch = (u.departmentName || '').toLowerCase().includes(filters.department.toLowerCase());
			return nameMatch && jobMatch && emailMatch && deptMatch;
		})
	);

	let suggestions = $derived({
		jobTitle: [...new Set(data.users.map(u => u.jobTitle).filter(Boolean))].sort(),
		department: [...new Set(data.users.map(u => u.departmentName).filter(Boolean))].sort()
	});

	$effect(() => {
		setSidebarEdit({
			addUrl: '/users/new',
			addLabel: 'Add User',
			totalCount: data.users.length,
			filteredCount: filteredUsers.length
		});
	});
</script>

<div class="terminal-page">
	<div class="page-header-minimal">
		<span class="header-text">USERS</span>
		<div class="mobile-header-right show-mobile">
			<span class="mobile-counts">
				<span>total: <span class="count-value">{data.users.length}</span></span>
				<span>filtered: <span class="count-value">{filteredUsers.length}</span></span>
			</span>
			<a href="/users/new" class="mobile-add-btn">+ Add</a>
		</div>
	</div>

	{#if data.users.length === 0}
		<div class="empty-state">
			<div class="empty-icon">∅</div>
			<div class="empty-text">No users found</div>
			<div class="empty-hint">Click <code>+ Add User</code> to add your first one</div>
		</div>
	{:else}
		<!-- Mobile Search -->
		<div class="mobile-search">
			<input type="text" bind:value={mobileSearch} placeholder="Search all fields..." onkeydown={handleFilterKeydown} class="search-input" />
		</div>

		<!-- Mobile Cards -->
		<div class="mobile-cards">
			{#each filteredUsers as user, i (user.id)}
				<a href="/users/{user.id}" class="card" in:terminalFade={{ delay: getStaggerDelay(i) }}>
					<div class="card-header">
						<span class="card-name">{user.name}</span>
					</div>
					<div class="card-body">
						{#if user.jobTitle}<div class="card-row"><span class="card-label">Job:</span> {user.jobTitle}</div>{/if}
						{#if user.email}<div class="card-row"><span class="card-label">Email:</span> <span class="email-text">{user.email}</span></div>{/if}
						{#if user.departmentName}<div class="card-row"><span class="card-label">Dept:</span> {user.departmentName}</div>{/if}
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
							<th>JOB</th>
							<th>EMAIL</th>
							<th>DEPT</th>
							<th class="col-actions">CMD</th>
						</tr>
						<tr class="filter-row">
							<th><input type="text" bind:value={filters.name} placeholder="/" onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.jobTitle} suggestions={suggestions.jobTitle} onkeydown={handleFilterKeydown} /></th>
							<th><input type="text" bind:value={filters.email} placeholder="Filter..." onkeydown={handleFilterKeydown} /></th>
							<th><AutocompleteInput bind:value={filters.department} suggestions={suggestions.department} onkeydown={handleFilterKeydown} /></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredUsers as user, i (user.id)}
							<tr class="data-row" in:terminalFade={{ delay: getStaggerDelay(i) }}>
								<td class="col-name">{user.name}</td>
								<td class="col-dim">{user.jobTitle || '—'}</td>
								<td class="col-email">{user.email || '—'}</td>
								<td class="col-dim">{user.departmentName || '—'}</td>
								<td class="col-actions"><a href="/users/{user.id}" class="edit-link">Edit</a></td>
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
	.col-dim { color: var(--terminal-dim); }
	.col-email { color: var(--terminal-cyan); font-size: 12px; }
	.col-actions { text-align: right; width: 80px; }
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
	.email-text { color: var(--terminal-cyan); }
</style>
