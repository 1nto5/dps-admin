<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { getBackInfo } from '$lib/stores/navigation';

	let name = $state('');
	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/rooms', 'Rooms');

	onMount(() => {
		pushContext('form');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'meta+enter', action: () => formEl?.requestSubmit(), context: 'form', description: 'Save', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'escape', action: () => goto(backInfo.href), context: 'form', description: 'Cancel', allowInInput: true }));
		return () => { popContext('form'); unsubs.forEach(u => u()); };
	});
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit() {
		if (!name.trim()) { error = 'Name is required'; return; }
		error = ''; loading = true;
		try {
			const res = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
			if (res.ok) goto(backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Connection error'; } finally { loading = false; }
	}
</script>

<div class="terminal-page max-w-xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">NEW ROOM</span>
			<span class="header-decoration">──────────────────────────────────────────</span>
		</div>
	</div>

	{#if error}<div class="error-box"><span class="error-prefix">[ERR]</span> {error}</div>{/if}

	<div class="form-container">
		<form bind:this={formEl} onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-group">
				<label class="form-label">name <span class="required">*</span></label>
				<input bind:value={name} class="form-input" required autofocus />
			</div>

			<div class="form-actions">
				<button type="submit" disabled={loading} class="btn-primary">{loading ? 'Creating...' : 'Create'} <kbd>↵</kbd></button>
				<a href={backInfo.href} class="btn-secondary">Cancel <kbd>Esc</kbd></a>
			</div>
		</form>
	</div>
</div>

<style>
	.terminal-page { max-width: 32rem; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }
	.required { color: var(--terminal-red); }
</style>
