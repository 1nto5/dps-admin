<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { statusValues } from '$lib/db/schema';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { getBackInfo } from '$lib/stores/navigation';
	import { toastAndGoto } from '$lib/stores/toast';
	import MonthInput from '$lib/components/MonthInput.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { desktopAutofocus } from '$lib/actions/autofocus';

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
			if (res.ok) await toastAndGoto('Printer saved', backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Error'; } finally { loading = false; }
	}

	async function handleDelete() {
		loading = true;
		try {
			const res = await fetch(`/api/printers/${data.printer.id}`, { method: 'DELETE' });
			if (res.ok) await toastAndGoto('Printer deleted', backInfo.href);
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
						<input id="prt-name" bind:value={form.nameNumber} placeholder="Full name" class="form-input" required />
					{:else}
						<div class="name-input-group">
							<span class="name-prefix">{prefix}-DPS-</span>
<input id="prt-name" bind:value={form.nameNumber} class="form-input" required use:desktopAutofocus />
						</div>
					{/if}
				</div>
				<div class="form-group">
					<label for="prt-inv" class="form-label">inventory number</label>
					<input id="prt-inv" bind:value={form.inventoryNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-2">
				<div class="form-group">
					<label for="prt-status" class="form-label">status</label>
					<select id="prt-status" bind:value={form.status} class="form-input">{#each statusValues as s}<option value={s}>{s}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label for="prt-room" class="form-label">room</label>
					<select id="prt-room" bind:value={form.roomId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.rooms as room}<option value={room.id}>{room.name}</option>{/each}</select>
				</div>
			</div>

			<div class="form-grid-3">
				<div class="form-group">
					<label for="prt-mfr" class="form-label">manufacturer</label>
					<input id="prt-mfr" bind:value={form.manufacturer} class="form-input" />
				</div>
				<div class="form-group">
					<label for="prt-model" class="form-label">model</label>
					<input id="prt-model" bind:value={form.model} class="form-input" />
				</div>
				<div class="form-group">
					<label for="prt-serial" class="form-label">serial number</label>
					<input id="prt-serial" bind:value={form.serialNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-2">
				<div class="form-group">
					<label for="prt-ip" class="form-label">ip address</label>
					<input id="prt-ip" bind:value={form.ipAddress} class="form-input font-mono" />
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
					<label for="prt-computer" class="form-label">computer</label>
					<select id="prt-computer" bind:value={form.computerId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.computers as c}<option value={c.id}>{c.name}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label for="prt-notebook" class="form-label">notebook</label>
					<select id="prt-notebook" bind:value={form.notebookId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.notebooks as nb}<option value={nb.id}>{nb.name}</option>{/each}</select>
				</div>
			</div>

			<div class="form-group">
				<label for="prt-purchase" class="form-label">purchase date</label>
				<MonthInput id="prt-purchase" bind:value={form.purchaseDate} class="form-input" />
			</div>

			<div class="form-group">
				<label for="prt-notes" class="form-label">notes</label>
				<textarea id="prt-notes" bind:value={form.notes} rows="2" class="form-input"></textarea>
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

<ConfirmModal bind:show={showDelete} title="Delete Printer" message="Delete &quot;{data.printer.name}&quot;?" {loading} onConfirm={handleDelete} />

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
	@media (max-width: 400px) {
		.name-input-group { flex-direction: column; }
		.name-prefix { border-right: 1px solid var(--terminal-border); border-bottom: none; }
		.name-input-group .form-input { border-left: 1px solid var(--terminal-border); }
	}
	.font-mono { font-family: monospace; }
</style>
