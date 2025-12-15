<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { registerShortcut, pushContext, popContext } from '$lib/shortcuts';
	import { getBackInfo } from '$lib/stores/navigation';
	import { toastAndGoto } from '$lib/stores/toast';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { desktopAutofocus } from '$lib/actions/autofocus';

	let { data }: { data: PageData } = $props();

	const emailDomain = 'dpsszczytno.pl';
	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/users', 'Users');

	onMount(() => {
		pushContext('form');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'meta+enter', action: () => formEl?.requestSubmit(), context: 'form', description: 'Save', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'escape', action: () => goto(backInfo.href), context: 'form', description: 'Cancel', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'alt+backspace', action: () => (showDelete = true), context: 'form', description: 'Delete', allowInInput: true }));
		return () => { popContext('form'); unsubs.forEach(u => u()); };
	});

	const emailParts = data.user.email ? data.user.email.split('@') : ['', emailDomain];
	let name = $state(data.user.name);
	let jobTitle = $state(data.user.jobTitle || '');
	let emailUsername = $state(emailParts[0] || '');
	let departmentId = $state<number | null>(data.user.departmentId);
	let error = $state('');
	let loading = $state(false);
	let showDelete = $state(false);

	async function handleSubmit() {
		if (!name.trim()) { error = 'Name is required'; return; }
		error = ''; loading = true;
		const email = emailUsername.trim() ? `${emailUsername.trim()}@${emailDomain}` : null;
		try {
			const res = await fetch(`/api/users/${data.user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), jobTitle: jobTitle.trim() || null, email, departmentId }) });
			if (res.ok) await toastAndGoto('User saved', backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Connection error'; } finally { loading = false; }
	}

	async function handleDelete() {
		loading = true;
		try {
			const res = await fetch(`/api/users/${data.user.id}`, { method: 'DELETE' });
			if (res.ok) await toastAndGoto('User deleted', backInfo.href);
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Connection error'; } finally { loading = false; showDelete = false; }
	}
</script>

<div class="terminal-page max-w-2xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">EDIT USER</span>
			<span class="header-decoration">──────────────────────────────────────────</span>
		</div>
	</div>

	{#if error}<div class="error-box"><span class="error-prefix">[ERR]</span> {error}</div>{/if}

	<div class="form-container">
		<form bind:this={formEl} onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-group">
				<label for="user-name" class="form-label">name <span class="required">*</span></label>
<input id="user-name" bind:value={name} class="form-input" required use:desktopAutofocus />
			</div>

			<div class="form-group">
				<label for="user-job" class="form-label">job title</label>
				<input id="user-job" bind:value={jobTitle} class="form-input" />
			</div>

			<div class="form-group">
				<label for="user-email" class="form-label">email</label>
				<div class="email-input-group">
					<input id="user-email" bind:value={emailUsername} class="form-input" placeholder="username" />
					<span class="email-suffix">@{emailDomain}</span>
				</div>
			</div>

			<div class="form-group">
				<label for="user-dept" class="form-label">department</label>
				<select id="user-dept" bind:value={departmentId} class="form-input">
					<option value={null}>-- Select department --</option>
					{#each data.departments as dept}<option value={dept.id}>{dept.name}</option>{/each}
				</select>
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

<ConfirmModal bind:show={showDelete} title="Delete User" message="Delete &quot;{data.user.name}&quot;?" {loading} onConfirm={handleDelete} />

<style>
	.terminal-page { max-width: 40rem; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }
	.required { color: var(--terminal-red); }
	.email-input-group { display: flex; }
	.email-input-group .form-input { flex: 1; border-right: none; }
	.email-suffix { padding: 10px 12px; background: var(--terminal-bg-panel); border: 1px solid var(--terminal-border); border-left: none; color: var(--terminal-dim); font-size: 13px; white-space: nowrap; }
</style>
