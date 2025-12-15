<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { getBackInfo } from '$lib/stores/navigation';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	let { data }: { data: PageData } = $props();

	let name = $state(data.room.name);
	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/rooms', 'Rooms');

	onMount(() => {
		pushContext('form');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'meta+enter', action: () => formEl?.requestSubmit(), context: 'form', description: 'Save', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'escape', action: () => goto(backInfo.href), context: 'form', description: 'Cancel', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'alt+backspace', action: () => (showDelete = true), context: 'form', description: 'Delete', allowInInput: true }));
		return () => { popContext('form'); unsubs.forEach(u => u()); };
	});
	let error = $state('');
	let loading = $state(false);
	let showDelete = $state(false);

	async function handleSubmit() {
		if (!name.trim()) { error = 'Name is required'; return; }
		error = ''; loading = true;
		try {
			const res = await fetch(`/api/rooms/${data.room.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
			if (res.ok) goto(backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Connection error'; } finally { loading = false; }
	}

	async function handleDelete() {
		loading = true;
		try {
			const res = await fetch(`/api/rooms/${data.room.id}`, { method: 'DELETE' });
			if (res.ok) goto(backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Connection error'; } finally { loading = false; showDelete = false; }
	}
</script>

<div class="terminal-page max-w-xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">EDIT ROOM</span>
			<span class="header-decoration">─────────────────────────────────────────</span>
		</div>
	</div>

	{#if error}<div class="error-box"><span class="error-prefix">[ERR]</span> {error}</div>{/if}

	<div class="form-container">
		<form bind:this={formEl} onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-group">
				<label class="form-label">name <span class="required">*</span></label>
				<input bind:value={name} class="form-input" required autofocus />
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

<ConfirmModal bind:show={showDelete} title="Delete Room" message="Delete &quot;{data.room.name}&quot;?" {loading} onconfirm={handleDelete} />

<style>
	.terminal-page { max-width: 32rem; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }
	.required { color: var(--terminal-red); }
	.form-actions-split { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--terminal-border); }
	.form-actions-left { display: flex; flex-direction: column; gap: 12px; }
	@media (min-width: 640px) { .form-actions-split { flex-direction: row; justify-content: space-between; align-items: center; } .form-actions-left { flex-direction: row; } }
	.btn-danger { padding: 10px 20px; background: transparent; border: 1px solid var(--terminal-red); color: var(--terminal-red); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s ease; }
	.btn-danger:hover { background: var(--terminal-red); color: var(--terminal-bg); }
	.btn-danger kbd { font-size: 10px; padding: 2px 6px; background: var(--terminal-bg); border: 1px solid var(--terminal-border); color: var(--terminal-muted); }
</style>
