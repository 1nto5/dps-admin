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

	const hasPrefix = data.notebook.name.startsWith('NB-DPS-');
	const nameNumber = hasPrefix ? data.notebook.name.replace('NB-DPS-', '') : data.notebook.name;
	let customName = $state(!hasPrefix);
	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/notebooks', 'Notebooks');

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
		status: data.notebook.status as 'in_use' | 'disposal' | 'preparing' | 'to_collect',
		inventoryNumber: data.notebook.inventoryNumber || '',
		manufacturer: data.notebook.manufacturer || '',
		model: data.notebook.model || '',
		serialNumber: data.notebook.serialNumber || '',
		cpu: data.notebook.cpu || '',
		ram: data.notebook.ram || '',
		storage: data.notebook.storage || '',
		windows: data.notebook.windows || '',
		office: data.notebook.office || '',
		notes: data.notebook.notes || '',
		purchaseDate: data.notebook.purchaseDate || '',
		roomId: data.notebook.roomId as number | null,
		userId: data.notebook.userId as number | null
	});
	let error = $state('');
	let loading = $state(false);
	let showDelete = $state(false);

	async function handleSubmit() {
		if (!form.nameNumber.trim()) { error = 'Name required'; return; }
		error = ''; loading = true;
		const payload = { ...form, name: customName ? form.nameNumber.trim() : `NB-DPS-${form.nameNumber.trim()}` };
		delete (payload as any).nameNumber;
		try {
			const res = await fetch(`/api/notebooks/${data.notebook.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
			if (res.ok) await toastAndGoto('Notebook saved', backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Error'; } finally { loading = false; }
	}

	async function handleDelete() {
		loading = true;
		try {
			const res = await fetch(`/api/notebooks/${data.notebook.id}`, { method: 'DELETE' });
			if (res.ok) await toastAndGoto('Notebook deleted', backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Error'; } finally { loading = false; showDelete = false; }
	}
</script>

<div class="terminal-page max-w-3xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">EDIT NOTEBOOK</span>
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
						<input id="nb-name" bind:value={form.nameNumber} placeholder="Full name" class="form-input" required />
					{:else}
						<div class="name-input-group">
							<span class="name-prefix">NB-DPS-</span>
<input id="nb-name" bind:value={form.nameNumber} class="form-input" required use:desktopAutofocus />
						</div>
					{/if}
				</div>
				<div class="form-group">
					<label for="nb-inv" class="form-label">inventory number</label>
					<input id="nb-inv" bind:value={form.inventoryNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-3">
				<div class="form-group">
					<label for="nb-status" class="form-label">status</label>
					<select id="nb-status" bind:value={form.status} class="form-input">{#each statusValues as s}<option value={s}>{s}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label for="nb-room" class="form-label">room</label>
					<select id="nb-room" bind:value={form.roomId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.rooms as room}<option value={room.id}>{room.name}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label for="nb-user" class="form-label">user</label>
					<select id="nb-user" bind:value={form.userId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.users as user}<option value={user.id}>{user.name}</option>{/each}</select>
				</div>
			</div>

			<div class="form-grid-3">
				<div class="form-group">
					<label for="nb-mfr" class="form-label">manufacturer</label>
					<input id="nb-mfr" bind:value={form.manufacturer} class="form-input" />
				</div>
				<div class="form-group">
					<label for="nb-model" class="form-label">model</label>
					<input id="nb-model" bind:value={form.model} class="form-input" />
				</div>
				<div class="form-group">
					<label for="nb-serial" class="form-label">serial number</label>
					<input id="nb-serial" bind:value={form.serialNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-3">
				<div class="form-group">
					<label for="nb-cpu" class="form-label">cpu</label>
					<input id="nb-cpu" bind:value={form.cpu} class="form-input" />
				</div>
				<div class="form-group">
					<label for="nb-ram" class="form-label">ram</label>
					<input id="nb-ram" bind:value={form.ram} class="form-input" />
				</div>
				<div class="form-group">
					<label for="nb-storage" class="form-label">storage</label>
					<input id="nb-storage" bind:value={form.storage} class="form-input" />
				</div>
			</div>

			<div class="form-grid-2">
				<div class="form-group">
					<label for="nb-windows" class="form-label">windows</label>
					<input id="nb-windows" bind:value={form.windows} class="form-input" />
				</div>
				<div class="form-group">
					<label for="nb-office" class="form-label">office</label>
					<input id="nb-office" bind:value={form.office} class="form-input" />
				</div>
			</div>

			<div class="form-group">
				<label for="nb-purchase" class="form-label">purchase date</label>
				<MonthInput id="nb-purchase" bind:value={form.purchaseDate} class="form-input" />
			</div>

			<div class="form-group">
				<label for="nb-notes" class="form-label">notes</label>
				<textarea id="nb-notes" bind:value={form.notes} rows="3" class="form-input"></textarea>
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

<ConfirmModal bind:show={showDelete} title="Delete Notebook" message="Delete &quot;{data.notebook.name}&quot;?" {loading} onConfirm={handleDelete} />

<style>
	.terminal-page { max-width: 48rem; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }
	.checkbox-label { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; cursor: pointer; }
	.name-input-group { display: flex; }
	.name-prefix { padding: 10px 12px; background: var(--terminal-bg-panel); border: 1px solid var(--terminal-border); border-right: none; color: var(--terminal-dim); font-size: 13px; white-space: nowrap; }
	.name-input-group .form-input { border-left: none; }
	@media (max-width: 400px) {
		.name-input-group { flex-direction: column; }
		.name-prefix { border-right: 1px solid var(--terminal-border); border-bottom: none; }
		.name-input-group .form-input { border-left: 1px solid var(--terminal-border); }
	}
</style>
