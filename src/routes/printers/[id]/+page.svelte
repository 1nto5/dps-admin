<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { statusValues } from '$lib/db/schema';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { getBackInfo } from '$lib/stores/navigation';
	import MonthInput from '$lib/components/MonthInput.svelte';
	import DeleteConfirmModal from '$lib/components/DeleteConfirmModal.svelte';

	let { data }: { data: PageData } = $props();

	const hasPrefix = /^(LP|NP)-DPS-/.test(data.printer.name);
	const nameNumber = hasPrefix ? data.printer.name.replace(/^(LP|NP)-DPS-/, '') : data.printer.name;
	let customName = $state(!hasPrefix);
	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/printers', 'Printers');

	onMount(() => {
		pushContext('form');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'meta+enter', action: () => formEl?.requestSubmit(), context: 'form', description: 'Save', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'escape', action: () => goto(backInfo.href), context: 'form', description: 'Cancel', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'alt+backspace', action: () => (showDelete = true), context: 'form', description: 'Delete', allowInInput: true }));
		return () => { popContext('form'); unsubs.forEach(u => u()); };
	});

	let form = $state({
		nameNumber,
		status: data.printer.status as 'in_use' | 'disposal' | 'preparing' | 'to_collect',
		inventoryNumber: data.printer.inventoryNumber || '',
		manufacturer: data.printer.manufacturer || '',
		model: data.printer.model || '',
		serialNumber: data.printer.serialNumber || '',
		ipAddress: data.printer.ipAddress || '',
		isNetwork: !!data.printer.isNetwork,
		notes: data.printer.notes || '',
		purchaseDate: data.printer.purchaseDate || '',
		roomId: data.printer.roomId as number | null,
		computerId: data.printer.computerId as number | null,
		notebookId: data.printer.notebookId as number | null
	});
	let error = $state('');
	let loading = $state(false);
	let showDelete = $state(false);

	let prefix = $derived(form.isNetwork ? 'NP' : 'LP');

	async function handleSubmit() {
		if (!form.nameNumber.trim()) { error = 'Name required'; return; }
		error = ''; loading = true;
		const payload = { ...form, name: customName ? form.nameNumber.trim() : `${prefix}-DPS-${form.nameNumber.trim()}`, isNetwork: form.isNetwork ? 1 : 0 };
		delete (payload as any).nameNumber;
		try {
			const res = await fetch(`/api/printers/${data.printer.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
			if (res.ok) goto(backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Error'; } finally { loading = false; }
	}

	async function handleDelete() {
		loading = true;
		try {
			const res = await fetch(`/api/printers/${data.printer.id}`, { method: 'DELETE' });
			if (res.ok) goto(backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Error'; } finally { loading = false; showDelete = false; }
	}
</script>

<div class="terminal-page max-w-3xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">EDIT PRINTER</span>
			<span class="header-decoration">─────────────────────────────────────────</span>
		</div>
	</div>

	{#if error}<div class="error-box"><span class="error-prefix">[ERR]</span> {error}</div>{/if}

	<div class="form-container">
		<form bind:this={formEl} onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-grid-2">
				<div class="form-group">
					<label class="form-label checkbox-label">
						<input type="checkbox" bind:checked={customName} />
						<span>custom name</span>
					</label>
					{#if customName}
						<input bind:value={form.nameNumber} placeholder="Full name" class="form-input" required />
					{:else}
						<div class="name-input-group">
							<span class="name-prefix">{prefix}-DPS-</span>
							<input bind:value={form.nameNumber} class="form-input" required autofocus />
						</div>
					{/if}
				</div>
				<div class="form-group">
					<label class="form-label">inventory number</label>
					<input bind:value={form.inventoryNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-2">
				<div class="form-group">
					<label class="form-label">status</label>
					<select bind:value={form.status} class="form-input">{#each statusValues as s}<option value={s}>{s}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label class="form-label">room</label>
					<select bind:value={form.roomId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.rooms as room}<option value={room.id}>{room.name}</option>{/each}</select>
				</div>
			</div>

			<div class="form-grid-3">
				<div class="form-group">
					<label class="form-label">manufacturer</label>
					<input bind:value={form.manufacturer} class="form-input" />
				</div>
				<div class="form-group">
					<label class="form-label">model</label>
					<input bind:value={form.model} class="form-input" />
				</div>
				<div class="form-group">
					<label class="form-label">serial number</label>
					<input bind:value={form.serialNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-2">
				<div class="form-group">
					<label class="form-label">ip address</label>
					<input bind:value={form.ipAddress} class="form-input font-mono" />
				</div>
				<div class="form-group checkbox-group">
					<label class="form-label checkbox-label">
						<input type="checkbox" bind:checked={form.isNetwork} />
						<span>network printer</span>
					</label>
				</div>
			</div>

			<div class="form-grid-2">
				<div class="form-group">
					<label class="form-label">computer</label>
					<select bind:value={form.computerId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.computers as c}<option value={c.id}>{c.name}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label class="form-label">notebook</label>
					<select bind:value={form.notebookId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.notebooks as nb}<option value={nb.id}>{nb.name}</option>{/each}</select>
				</div>
			</div>

			<div class="form-group">
				<label class="form-label">purchase date</label>
				<MonthInput bind:value={form.purchaseDate} class="form-input" />
			</div>

			<div class="form-group">
				<label class="form-label">notes</label>
				<textarea bind:value={form.notes} rows="2" class="form-input"></textarea>
			</div>

			<div class="form-actions-split">
				<div class="form-actions-left">
					<button type="submit" disabled={loading} class="btn-primary">{loading ? 'Saving...' : 'Save'} <kbd>↵</kbd></button>
					<a href={backInfo.href} class="btn-secondary">Cancel <kbd>Esc</kbd></a>
				</div>
				<button type="button" onclick={() => showDelete = true} class="btn-danger">Delete <kbd>⌥⌫</kbd></button>
			</div>
		</form>
	</div>
</div>

<DeleteConfirmModal bind:show={showDelete} title="Delete Printer" message="Delete &quot;{data.printer.name}&quot;?" {loading} onconfirm={handleDelete} />

<style>
	.terminal-page { max-width: 48rem; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }
	.checkbox-label { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; cursor: pointer; }
	.checkbox-group { display: flex; align-items: flex-end; padding-bottom: 10px; }
	.name-input-group { display: flex; }
	.name-prefix { padding: 10px 12px; background: var(--terminal-bg-panel); border: 1px solid var(--terminal-border); border-right: none; color: var(--terminal-dim); font-size: 13px; white-space: nowrap; }
	.name-input-group .form-input { border-left: none; }
	.font-mono { font-family: monospace; }
	.form-actions-split { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--terminal-border); }
	.form-actions-left { display: flex; flex-direction: column; gap: 12px; }
	@media (min-width: 640px) { .form-actions-split { flex-direction: row; justify-content: space-between; align-items: center; } .form-actions-left { flex-direction: row; } }
	.btn-danger { padding: 10px 20px; background: transparent; border: 1px solid var(--terminal-red); color: var(--terminal-red); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s ease; }
	.btn-danger:hover { background: var(--terminal-red); color: var(--terminal-bg); }
	.btn-danger kbd { font-size: 10px; padding: 2px 6px; background: var(--terminal-bg); border: 1px solid var(--terminal-border); color: var(--terminal-muted); }
</style>
