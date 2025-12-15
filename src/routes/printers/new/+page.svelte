<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { statusValues } from '$lib/db/schema';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { getBackInfo } from '$lib/stores/navigation';
	import { toastAndGoto } from '$lib/stores/toast';
	import MonthInput from '$lib/components/MonthInput.svelte';
	import { desktopAutofocus } from '$lib/actions/autofocus';

	let { data }: { data: PageData } = $props();

	// Check URL params for copy data
	const urlParams = $page.url.searchParams;
	const isCopy = urlParams.has('status') || urlParams.has('manufacturer') || urlParams.has('model');
	const copyStatus = urlParams.get('status') as 'in_use' | 'disposal' | 'preparing' | 'to_collect' | null;
	const copyRoomId = urlParams.get('roomId');
	const copyComputerId = urlParams.get('computerId');
	const copyNotebookId = urlParams.get('notebookId');
	const copyIsNetwork = urlParams.get('isNetwork') === '1';

	let nameNumber = $state('');
	let customName = $state(false);
	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/printers', 'Printers');

	onMount(() => {
		pushContext('form');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'meta+enter', action: () => formEl?.requestSubmit(), context: 'form', description: 'Save', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'escape', action: () => goto(backInfo.href), context: 'form', description: 'Cancel', allowInInput: true }));
		return () => { popContext('form'); unsubs.forEach(u => u()); };
	});

	let form = $state({
		status: copyStatus || 'preparing' as const,
		inventoryNumber: urlParams.get('inventoryNumber') || '',
		manufacturer: urlParams.get('manufacturer') || '',
		model: urlParams.get('model') || '',
		serialNumber: '',
		ipAddress: urlParams.get('ipAddress') || '',
		isNetwork: copyIsNetwork,
		notes: urlParams.get('notes') || '',
		purchaseDate: urlParams.get('purchaseDate') || '',
		roomId: copyRoomId ? parseInt(copyRoomId) : null as number | null,
		computerId: copyComputerId ? parseInt(copyComputerId) : null as number | null,
		notebookId: copyNotebookId ? parseInt(copyNotebookId) : null as number | null
	});
	let error = $state('');
	let loading = $state(false);

	let prefix = $derived(form.isNetwork ? 'NP' : 'LP');

	async function handleSubmit() {
		if (!nameNumber.trim()) { error = 'Name required'; return; }
		error = ''; loading = true;
		const payload = { ...form, name: customName ? nameNumber.trim() : `${prefix}-DPS-${nameNumber.trim()}`, isNetwork: form.isNetwork ? 1 : 0 };
		try {
			const res = await fetch('/api/printers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
			if (res.ok) await toastAndGoto('Printer created', backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Error'; } finally { loading = false; }
	}
</script>

<div class="terminal-page max-w-3xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">{isCopy ? 'COPY PRINTER' : 'NEW PRINTER'}</span>
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
						<input id="new-prt-name" bind:value={nameNumber} placeholder="Full name" class="form-input" required />
					{:else}
						<div class="name-input-group">
							<span class="name-prefix">{prefix}-DPS-</span>
<input id="new-prt-name" bind:value={nameNumber} class="form-input" required use:desktopAutofocus />
						</div>
					{/if}
				</div>
				<div class="form-group">
					<label for="new-prt-inv" class="form-label">inventory number</label>
					<input id="new-prt-inv" bind:value={form.inventoryNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-2">
				<div class="form-group">
					<label for="new-prt-status" class="form-label">status</label>
					<select id="new-prt-status" bind:value={form.status} class="form-input">{#each statusValues as s}<option value={s}>{s}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label for="new-prt-room" class="form-label">room</label>
					<select id="new-prt-room" bind:value={form.roomId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.rooms as room}<option value={room.id}>{room.name}</option>{/each}</select>
				</div>
			</div>

			<div class="form-grid-3">
				<div class="form-group">
					<label for="new-prt-mfr" class="form-label">manufacturer</label>
					<input id="new-prt-mfr" bind:value={form.manufacturer} class="form-input" />
				</div>
				<div class="form-group">
					<label for="new-prt-model" class="form-label">model</label>
					<input id="new-prt-model" bind:value={form.model} class="form-input" />
				</div>
				<div class="form-group">
					<label for="new-prt-serial" class="form-label">serial number</label>
					<input id="new-prt-serial" bind:value={form.serialNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-2">
				<div class="form-group">
					<label for="new-prt-ip" class="form-label">ip address</label>
					<input id="new-prt-ip" bind:value={form.ipAddress} class="form-input font-mono" />
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
					<label for="new-prt-computer" class="form-label">computer</label>
					<select id="new-prt-computer" bind:value={form.computerId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.computers as c}<option value={c.id}>{c.name}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label for="new-prt-notebook" class="form-label">notebook</label>
					<select id="new-prt-notebook" bind:value={form.notebookId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.notebooks as nb}<option value={nb.id}>{nb.name}</option>{/each}</select>
				</div>
			</div>

			<div class="form-group">
				<label for="new-prt-purchase" class="form-label">purchase date</label>
				<MonthInput id="new-prt-purchase" bind:value={form.purchaseDate} class="form-input" />
			</div>

			<div class="form-group">
				<label for="new-prt-notes" class="form-label">notes</label>
				<textarea id="new-prt-notes" bind:value={form.notes} rows="2" class="form-input"></textarea>
			</div>

			<div class="form-actions">
				<button type="submit" disabled={loading} class="btn-primary">{loading ? 'Creating...' : 'Create'} <kbd>⌘↵</kbd></button>
				<a href={backInfo.href} class="btn-secondary">Cancel <kbd>Esc</kbd></a>
			</div>
		</form>
	</div>
</div>

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
	@media (max-width: 400px) {
		.name-input-group { flex-direction: column; }
		.name-prefix { border-right: 1px solid var(--terminal-border); border-bottom: none; }
		.name-input-group .form-input { border-left: 1px solid var(--terminal-border); }
	}
</style>
