<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { statusValues } from '$lib/db/schema';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { getBackInfo } from '$lib/stores/navigation';
	import MonthInput from '$lib/components/MonthInput.svelte';

	let { data }: { data: PageData } = $props();

	let nameNumber = $state('');
	let customName = $state(false);
	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/notebooks', 'Notebooks');

	onMount(() => {
		pushContext('form');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'meta+enter', action: () => formEl?.requestSubmit(), context: 'form', description: 'Save', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'escape', action: () => goto(backInfo.href), context: 'form', description: 'Cancel', allowInInput: true }));
		return () => { popContext('form'); unsubs.forEach(u => u()); };
	});
	let form = $state({
		status: 'preparing' as 'in_use' | 'disposal' | 'preparing' | 'to_collect',
		inventoryNumber: '',
		manufacturer: '',
		model: '',
		serialNumber: '',
		cpu: '',
		ram: '',
		storage: '',
		windows: '',
		office: '',
		notes: '',
		purchaseDate: '',
		roomId: null as number | null,
		userId: null as number | null
	});
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit() {
		if (!nameNumber.trim()) { error = 'Name is required'; return; }
		error = ''; loading = true;

		const payload = { ...form, name: customName ? nameNumber.trim() : `NB-DPS-${nameNumber.trim()}` };
		try {
			const res = await fetch('/api/notebooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
			if (res.ok) goto(backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Connection error'; } finally { loading = false; }
	}
</script>

<div class="terminal-page max-w-3xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">NEW NOTEBOOK</span>
			<span class="header-decoration">──────────────────────────────────────────</span>
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
						<input bind:value={nameNumber} placeholder="Full name" class="form-input" required />
					{:else}
						<div class="name-input-group">
							<span class="name-prefix">NB-DPS-</span>
							<input bind:value={nameNumber} class="form-input" required autofocus />
						</div>
					{/if}
				</div>
				<div class="form-group">
					<label class="form-label">inventory number</label>
					<input bind:value={form.inventoryNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-3">
				<div class="form-group">
					<label class="form-label">status</label>
					<select bind:value={form.status} class="form-input">{#each statusValues as s}<option value={s}>{s}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label class="form-label">room</label>
					<select bind:value={form.roomId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.rooms as room}<option value={room.id}>{room.name}</option>{/each}</select>
				</div>
				<div class="form-group">
					<label class="form-label">user</label>
					<select bind:value={form.userId} class="form-input"><option value={null}>-- Not assigned --</option>{#each data.users as user}<option value={user.id}>{user.name}</option>{/each}</select>
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

			<div class="form-grid-3">
				<div class="form-group">
					<label class="form-label">cpu</label>
					<input bind:value={form.cpu} class="form-input" />
				</div>
				<div class="form-group">
					<label class="form-label">ram</label>
					<input bind:value={form.ram} class="form-input" />
				</div>
				<div class="form-group">
					<label class="form-label">storage</label>
					<input bind:value={form.storage} class="form-input" />
				</div>
			</div>

			<div class="form-grid-2">
				<div class="form-group">
					<label class="form-label">windows</label>
					<input bind:value={form.windows} class="form-input" />
				</div>
				<div class="form-group">
					<label class="form-label">office</label>
					<input bind:value={form.office} class="form-input" />
				</div>
			</div>

			<div class="form-group">
				<label class="form-label">purchase date</label>
				<MonthInput bind:value={form.purchaseDate} class="form-input" />
			</div>

			<div class="form-group">
				<label class="form-label">notes</label>
				<textarea bind:value={form.notes} rows="3" class="form-input"></textarea>
			</div>

			<div class="form-actions">
				<button type="submit" disabled={loading} class="btn-primary">{loading ? 'Creating...' : 'Create'} <kbd>↵</kbd></button>
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
	.name-input-group { display: flex; }
	.name-prefix { padding: 10px 12px; background: var(--terminal-bg-panel); border: 1px solid var(--terminal-border); border-right: none; color: var(--terminal-dim); font-size: 13px; white-space: nowrap; }
	.name-input-group .form-input { border-left: none; }
</style>
