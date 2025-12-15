<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { statusValues } from '$lib/db/schema';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { getBackInfo } from '$lib/stores/navigation';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import MonthInput from '$lib/components/MonthInput.svelte';
	let { data }: { data: PageData } = $props();

	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/monitors', 'Monitors');

	onMount(() => {
		pushContext('form');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'meta+enter', action: () => formEl?.requestSubmit(), context: 'form', description: 'Save', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'escape', action: () => goto(backInfo.href), context: 'form', description: 'Cancel', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'alt+backspace', action: () => (showDelete = true), context: 'form', description: 'Delete', allowInInput: true }));
		return () => { popContext('form'); unsubs.forEach(u => u()); };
	});

	let form = $state({
		status: data.monitor.status as 'in_use' | 'disposal' | 'preparing' | 'to_collect',
		inventoryNumber: data.monitor.inventoryNumber || '',
		manufacturer: data.monitor.manufacturer || '',
		model: data.monitor.model || '',
		serialNumber: data.monitor.serialNumber || '',
		notes: data.monitor.notes || '',
		purchaseDate: data.monitor.purchaseDate || '',
		computerId: data.monitor.computerId as number | null
	});
	let error = $state('');
	let loading = $state(false);
	let showDelete = $state(false);

	async function handleSubmit() {
		if (!form.manufacturer.trim() && !form.model.trim()) { error = 'Manufacturer or model required'; return; }
		error = ''; loading = true;
		const name = [form.manufacturer, form.model].filter(Boolean).join(' ').trim();
		const payload = { ...form, name };
		try {
			const res = await fetch(`/api/monitors/${data.monitor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
			if (res.ok) goto(backInfo.href); else error = (await res.json()).error || 'Failed';
		} catch { error = 'Error'; } finally { loading = false; }
	}

	async function handleDelete() {
		loading = true;
		try {
			const res = await fetch(`/api/monitors/${data.monitor.id}`, { method: 'DELETE' });
			if (res.ok) goto(backInfo.href); else error = 'Failed';
		} catch { error = 'Error'; } finally { loading = false; showDelete = false; }
	}
</script>

<div class="terminal-page max-w-2xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">EDIT MONITOR</span>
			<span class="header-decoration">─────────────────────────────────────────</span>
		</div>
		<div class="header-meta">
			<span class="meta-item"><span class="meta-label">id:</span><span class="meta-value">#{data.monitor.id}</span></span>
		</div>
	</div>

	{#if error}<div class="error-box"><span class="error-prefix">[ERR]</span> {error}</div>{/if}

	<div class="form-container">
		<form bind:this={formEl} onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-grid-2">
				<div class="form-group">
					<label for="mon-edit-mfr" class="form-label">Manufacturer</label>
					<!-- svelte-ignore a11y_autofocus -->
					<input id="mon-edit-mfr" bind:value={form.manufacturer} class="form-input" placeholder="e.g. Dell, LG, Samsung" autofocus />
				</div>
				<div class="form-group">
					<label for="mon-edit-model" class="form-label">Model</label>
					<input id="mon-edit-model" bind:value={form.model} class="form-input" placeholder="e.g. E2222H, 27UK850" />
				</div>
			</div>
			<div class="form-grid-2">
				<div class="form-group">
					<label for="mon-edit-status" class="form-label">Status</label>
					<select id="mon-edit-status" bind:value={form.status} class="form-input">{#each statusValues as s}<option value={s}>{s}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label for="mon-edit-computer" class="form-label">Computer</label>
					<select id="mon-edit-computer" bind:value={form.computerId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.computers as computer}<option value={computer.id}>{computer.name}</option>{/each}</select>
				</div>
			</div>
			<div class="form-grid-2">
				<div class="form-group">
					<label for="mon-edit-inv" class="form-label">Inventory Number</label>
					<input id="mon-edit-inv" bind:value={form.inventoryNumber} class="form-input" />
				</div>
				<div class="form-group">
					<label for="mon-edit-serial" class="form-label">Serial Number</label>
					<input id="mon-edit-serial" bind:value={form.serialNumber} class="form-input" />
				</div>
			</div>
			<div class="form-group">
				<label for="mon-edit-purchase" class="form-label">Purchase Date</label>
				<MonthInput id="mon-edit-purchase" bind:value={form.purchaseDate} class="form-input" />
			</div>
			<div class="form-group">
				<label for="mon-edit-notes" class="form-label">Notes</label>
				<textarea id="mon-edit-notes" bind:value={form.notes} rows="2" class="form-input"></textarea>
			</div>
			<div class="form-actions-split">
				<div class="form-actions-left">
					<button type="submit" disabled={loading} class="btn-primary">{loading ? 'Saving...' : 'Save'} <kbd>⌘↵</kbd></button>
					<a href={backInfo.href} class="btn-secondary">Cancel <kbd>Esc</kbd></a>
				</div>
				<button type="button" onclick={() => showDelete = true} class="btn-danger">Delete <kbd>⌥⌫</kbd></button>
			</div>
		</form>
	</div>
</div>

<ConfirmModal
	bind:show={showDelete}
	title="Delete Monitor"
	message="Are you sure you want to delete this monitor? This action cannot be undone."
	loading={loading}
	onConfirm={handleDelete}
/>

<style>
	.terminal-page { max-width: 42rem; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; margin-bottom: 8px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }
	.header-meta { font-size: 12px; }
	.meta-label { color: var(--terminal-dim); }
	.meta-value { color: var(--terminal-text-bright); margin-left: 4px; }
	.error-box { padding: 12px 16px; margin-bottom: 16px; border: 1px solid var(--terminal-red); background: rgba(255, 51, 102, 0.1); font-size: 13px; color: var(--terminal-red); }
	.error-prefix { font-weight: bold; margin-right: 8px; }
	.form-container { border: 1px solid var(--terminal-border); background: var(--terminal-bg-alt); padding: 24px; }
	.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
	.form-group { margin-bottom: 16px; }
	.form-grid-2 .form-group { margin-bottom: 0; }
	.form-label { display: block; font-size: 12px; color: var(--terminal-dim); margin-bottom: 6px; text-transform: lowercase; }
	.form-input { width: 100%; padding: 10px 12px; background: var(--terminal-bg); border: 1px solid var(--terminal-border); color: var(--terminal-text); font-size: 16px; }
	.form-input:focus { border-color: var(--terminal-cyan); outline: none; box-shadow: 0 0 0 1px var(--terminal-cyan); }
	.form-input::placeholder { color: var(--terminal-muted); }
</style>
