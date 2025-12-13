<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import DeleteConfirmModal from '$lib/components/DeleteConfirmModal.svelte';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';

	let { data }: { data: PageData } = $props();

	let userId = $state<number | null>(null);
	let computerId = $state<number | null>(null);
	let notebookId = $state<number | null>(null);
	let printerId = $state<number | null>(null);
	let error = $state('');
	let loading = $state(false);

	let deleteTarget = $state<number | null>(null);
	let showDeleteModal = $state(false);
	let deleteLoading = $state(false);

	let filters = $state({ user: '', computer: '', notebook: '', printer: '', created: '' });
	let filterRefs: HTMLInputElement[] = [];
	let createBtn: HTMLButtonElement;

	function clearFilters() {
		filters = { user: '', computer: '', notebook: '', printer: '', created: '' };
		(document.activeElement as HTMLElement)?.blur();
	}

	onMount(() => {
		pushContext('list');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'alt+n', action: () => createBtn?.focus(), context: 'list', description: 'Focus create button' }));
		unsubs.push(registerShortcut({ key: '/', action: () => filterRefs[0]?.focus(), context: 'list', description: 'Focus search' }));
		unsubs.push(registerShortcut({ key: 'escape', action: clearFilters, context: 'list', description: 'Clear filters', allowInInput: true }));
		return () => { popContext('list'); unsubs.forEach(u => u()); };
	});

	let filteredAssignments = $derived(
		data.assignments.filter((a) => {
			const userMatch = a.userName.toLowerCase().includes(filters.user.toLowerCase());
			const computerMatch = (a.computerName || '').toLowerCase().includes(filters.computer.toLowerCase());
			const notebookMatch = (a.notebookName || '').toLowerCase().includes(filters.notebook.toLowerCase());
			const printerMatch = (a.printerName || '').toLowerCase().includes(filters.printer.toLowerCase());
			const createdMatch = new Date(a.createdAt).toLocaleDateString().includes(filters.created);
			return userMatch && computerMatch && notebookMatch && printerMatch && createdMatch;
		})
	);

	async function createAssignment() {
		if (!userId) { error = 'Select a user'; return; }
		if (!computerId && !notebookId && !printerId) { error = 'Select at least one equipment'; return; }
		error = ''; loading = true;

		try {
			const res = await fetch('/api/assignments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, computerId, notebookId, printerId })
			});
			if (res.ok) {
				window.location.reload();
			} else {
				error = (await res.json()).error || 'Failed';
			}
		} catch { error = 'Error'; } finally { loading = false; }
	}

	function confirmDelete(id: number) {
		deleteTarget = id;
		showDeleteModal = true;
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		deleteLoading = true;
		try {
			await fetch(`/api/assignments/${deleteTarget}`, { method: 'DELETE' });
			window.location.reload();
		} catch {
			error = 'Failed to delete';
		} finally {
			deleteLoading = false;
			showDeleteModal = false;
		}
	}
</script>

<div class="terminal-page">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">ASSIGNMENTS</span>
			<span class="header-decoration">─────────────────────────────────────────</span>
		</div>
	</div>

	<div class="form-container create-section">
		<div class="section-title">CREATE ASSIGNMENT</div>
		{#if error}<div class="error-box"><span class="error-prefix">[ERR]</span> {error}</div>{/if}

		<div class="form-grid-4">
			<div class="form-group">
				<label class="form-label">user <span class="required">*</span></label>
				<select bind:value={userId} class="form-input">
					<option value={null}>-- Select --</option>
					{#each data.users as u}<option value={u.id}>{u.name}</option>{/each}
				</select>
			</div>
			<div class="form-group">
				<label class="form-label">computer</label>
				<select bind:value={computerId} class="form-input">
					<option value={null}>--</option>
					{#each data.computers as c}<option value={c.id}>{c.name}</option>{/each}
				</select>
			</div>
			<div class="form-group">
				<label class="form-label">notebook</label>
				<select bind:value={notebookId} class="form-input">
					<option value={null}>--</option>
					{#each data.notebooks as nb}<option value={nb.id}>{nb.name}</option>{/each}
				</select>
			</div>
			<div class="form-group">
				<label class="form-label">printer</label>
				<select bind:value={printerId} class="form-input">
					<option value={null}>--</option>
					{#each data.printers as p}<option value={p.id}>{p.name}</option>{/each}
				</select>
			</div>
		</div>

		<button bind:this={createBtn} onclick={createAssignment} disabled={loading} class="btn-primary">
			{loading ? 'Creating...' : 'Create'} <kbd>N</kbd>
		</button>
	</div>

	{#if data.assignments.length === 0}
		<div class="empty-state">[NO ASSIGNMENTS]</div>
	{:else}
		<div class="table-container">
			<table class="data-table">
				<thead>
					<tr>
						<th>User</th>
						<th>Computer</th>
						<th>Notebook</th>
						<th>Printer</th>
						<th>Created</th>
						<th class="actions-col"></th>
					</tr>
					<tr class="filter-row">
						<th><input type="text" bind:value={filters.user} bind:this={filterRefs[0]} class="filter-input" placeholder="/" /></th>
						<th><input type="text" bind:value={filters.computer} bind:this={filterRefs[1]} class="filter-input" /></th>
						<th><input type="text" bind:value={filters.notebook} bind:this={filterRefs[2]} class="filter-input" /></th>
						<th><input type="text" bind:value={filters.printer} bind:this={filterRefs[3]} class="filter-input" /></th>
						<th><input type="text" bind:value={filters.created} bind:this={filterRefs[4]} class="filter-input" /></th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each filteredAssignments as a}
						<tr>
							<td class="name-cell">{a.userName}</td>
							<td>{a.computerName || '-'}</td>
							<td>{a.notebookName || '-'}</td>
							<td>{a.printerName || '-'}</td>
							<td class="date-cell">{new Date(a.createdAt).toLocaleDateString()}</td>
							<td class="actions-col">
								<button onclick={() => confirmDelete(a.id)} class="remove-btn">Remove</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<DeleteConfirmModal
	bind:show={showDeleteModal}
	title="Remove Assignment"
	message="Remove this assignment?"
	loading={deleteLoading}
	onConfirm={handleDelete}
/>

<style>
	.terminal-page { max-width: 100%; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }
	.required { color: var(--terminal-red); }
	.create-section { margin-bottom: 24px; }
	.section-title { font-size: 12px; letter-spacing: 1px; color: var(--terminal-dim); margin-bottom: 16px; }
	.empty-state { padding: 32px; text-align: center; color: var(--terminal-dim); border: 1px solid var(--terminal-border); background: var(--terminal-bg-alt); }
	.table-container { overflow-x: auto; border: 1px solid var(--terminal-border); }
	.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
	.data-table th, .data-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--terminal-border); white-space: nowrap; }
	.data-table thead th { background: var(--terminal-bg-panel); color: var(--terminal-dim); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: normal; }
	.data-table tbody tr:hover { background: var(--terminal-bg-alt); }
	.filter-row th { padding: 8px; background: var(--terminal-bg); }
	.filter-input { width: 100%; padding: 6px 8px; background: var(--terminal-bg-alt); border: 1px solid var(--terminal-border); color: var(--terminal-text); font-size: 12px; }
	.name-cell { color: var(--terminal-cyan); font-weight: 500; }
	.date-cell { font-size: 11px; color: var(--terminal-muted); }
	.actions-col { width: 80px; text-align: right; }
	.remove-btn { background: none; border: none; color: var(--terminal-red); cursor: pointer; font-size: 12px; padding: 4px 8px; }
	.remove-btn:hover { text-decoration: underline; }
</style>
