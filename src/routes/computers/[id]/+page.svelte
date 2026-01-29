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

	const hasPrefix = data.computer.name.startsWith('WS-DPS-');
	const nameNumber = hasPrefix ? data.computer.name.replace('WS-DPS-', '') : data.computer.name;
	let customName = $state(!hasPrefix);
	let formEl: HTMLFormElement;
	const backInfo = getBackInfo('/computers', 'Computers');

	onMount(() => {
		pushContext('form');
		const unsubs: (() => void)[] = [];
		unsubs.push(registerShortcut({ key: 'meta+enter', action: () => formEl?.requestSubmit(), context: 'form', description: 'Save', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'escape', action: () => goto(backInfo.href), context: 'form', description: 'Cancel', allowInInput: true }));
		unsubs.push(registerShortcut({ key: 'alt+d', action: () => (showDelete = true), context: 'form', description: 'Delete', allowInInput: true }));
		return () => { popContext('form'); unsubs.forEach(u => u()); };
	});

	let form = $state({
		nameNumber,
		status: data.computer.status as 'in_use' | 'disposal' | 'preparing' | 'to_collect',
		inventoryNumber: data.computer.inventoryNumber || '',
		manufacturer: data.computer.manufacturer || '',
		model: data.computer.model || '',
		serialNumber: data.computer.serialNumber || '',
		cpu: data.computer.cpu || '',
		ram: data.computer.ram || '',
		storage: data.computer.storage || '',
		windows: data.computer.windows || '',
		office: data.computer.office || '',
		notes: data.computer.notes || '',
		purchaseDate: data.computer.purchaseDate || '',
		roomId: data.computer.roomId as number | null,
		userId: data.computer.userId as number | null
	});
	let error = $state('');
	let loading = $state(false);
	let showDelete = $state(false);

	async function handleSubmit() {
		if (!form.nameNumber.trim()) { error = 'Name required'; return; }
		error = ''; loading = true;

		const payload = {
			...form,
			name: customName ? form.nameNumber.trim() : `WS-DPS-${form.nameNumber.trim()}`,
			type: 'PC'
		};
		delete (payload as any).nameNumber;

		try {
			const res = await fetch(`/api/computers/${data.computer.id}`, {
				method: 'PUT', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (res.ok) await toastAndGoto('Computer saved', backInfo.href, 'success', 'data:computers');
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Error'; } finally { loading = false; }
	}

	async function handleDelete() {
		loading = true;
		try {
			const res = await fetch(`/api/computers/${data.computer.id}`, { method: 'DELETE' });
			if (res.ok) await toastAndGoto('Computer deleted', backInfo.href, 'success', 'data:computers');
			else error = (await res.json()).error || 'Failed';
		} catch { error = 'Error'; } finally { loading = false; showDelete = false; }
	}
</script>

<div class="terminal-page max-w-3xl">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">EDIT COMPUTER</span>
			<span class="header-decoration">────────────────────────────────────────</span>
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
						<input id="comp-name" bind:value={form.nameNumber} placeholder="Full name" class="form-input" required />
					{:else}
						<div class="name-input-group">
							<span class="name-prefix">WS-DPS-</span>
<input id="comp-name" bind:value={form.nameNumber} class="form-input" required use:desktopAutofocus />
						</div>
					{/if}
				</div>
				<div class="form-group">
					<label for="comp-inv" class="form-label">inventory number</label>
					<input id="comp-inv" bind:value={form.inventoryNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-3">
				<div class="form-group">
					<label for="comp-status" class="form-label">status</label>
					<select id="comp-status" bind:value={form.status} class="form-input">
						{#each statusValues as s}<option value={s}>{s}</option>{/each}
					</select>
				</div>
				<div class="form-group">
					<label for="comp-room" class="form-label">room</label>
					<select id="comp-room" bind:value={form.roomId} class="form-input">
						<option value={null}>-- Not assigned --</option>
						{#each data.rooms as room}<option value={room.id}>{room.name}</option>{/each}
					</select>
				</div>
				<div class="form-group">
					<label for="comp-user" class="form-label">user</label>
					<select id="comp-user" bind:value={form.userId} class="form-input">
						<option value={null}>-- Not assigned --</option>
						{#each data.users as user}<option value={user.id}>{user.name}</option>{/each}
					</select>
				</div>
			</div>

			<div class="form-grid-3">
				<div class="form-group">
					<label for="comp-mfr" class="form-label">manufacturer</label>
					<input id="comp-mfr" bind:value={form.manufacturer} class="form-input" />
				</div>
				<div class="form-group">
					<label for="comp-model" class="form-label">model</label>
					<input id="comp-model" bind:value={form.model} class="form-input" />
				</div>
				<div class="form-group">
					<label for="comp-serial" class="form-label">serial number</label>
					<input id="comp-serial" bind:value={form.serialNumber} class="form-input" />
				</div>
			</div>

			<div class="form-grid-3">
				<div class="form-group">
					<label for="comp-cpu" class="form-label">cpu</label>
					<input id="comp-cpu" bind:value={form.cpu} class="form-input" />
				</div>
				<div class="form-group">
					<label for="comp-ram" class="form-label">ram</label>
					<input id="comp-ram" bind:value={form.ram} class="form-input" />
				</div>
				<div class="form-group">
					<label for="comp-storage" class="form-label">storage</label>
					<input id="comp-storage" bind:value={form.storage} class="form-input" />
				</div>
			</div>

			<div class="form-grid-2">
				<div class="form-group">
					<label for="comp-windows" class="form-label">windows</label>
					<input id="comp-windows" bind:value={form.windows} class="form-input" />
				</div>
				<div class="form-group">
					<label for="comp-office" class="form-label">office</label>
					<input id="comp-office" bind:value={form.office} class="form-input" />
				</div>
			</div>

			<div class="form-group">
				<label for="comp-purchase" class="form-label">purchase date</label>
				<MonthInput id="comp-purchase" bind:value={form.purchaseDate} class="form-input" />
			</div>

			<div class="form-group">
				<label for="comp-notes" class="form-label">notes</label>
				<textarea id="comp-notes" bind:value={form.notes} rows="3" class="form-input"></textarea>
			</div>

			{#if data.monitors.length > 0}
			<div class="assigned-section">
				<span class="form-label">assigned monitors</span>
				<div class="assigned-items">
					{#each data.monitors as m}
						<a href="/monitors/{m.id}" class="assigned-item">{m.name}</a>
					{/each}
				</div>
			</div>
			{/if}

			<div class="form-actions-split">
				<div class="form-actions-left">
					<button type="submit" disabled={loading} class="btn-primary">
						{loading ? 'Saving...' : 'Save'} <kbd>⌘↵</kbd>
					</button>
					<a href={backInfo.href} class="btn-secondary">Cancel <kbd>Esc</kbd></a>
				</div>
				<button type="button" onclick={() => showDelete = true} class="btn-danger">
					Delete <kbd>⌥D</kbd>
				</button>
			</div>
		</form>
	</div>
</div>

<ConfirmModal
	bind:show={showDelete}
	title="Delete Computer"
	message="Delete &quot;{data.computer.name}&quot;?"
	{loading}
	onConfirm={handleDelete}
/>

<style>
	.terminal-page { max-width: 48rem; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
		cursor: pointer;
	}

	.name-input-group {
		display: flex;
	}

	.name-prefix {
		padding: 10px 12px;
		background: var(--terminal-bg-panel);
		border: 1px solid var(--terminal-border);
		border-right: none;
		color: var(--terminal-dim);
		font-size: 13px;
		white-space: nowrap;
	}

	.name-input-group .form-input {
		border-left: none;
	}

	@media (max-width: 400px) {
		.name-input-group {
			flex-direction: column;
		}
		.name-prefix {
			border-right: 1px solid var(--terminal-border);
			border-bottom: none;
		}
		.name-input-group .form-input {
			border-left: 1px solid var(--terminal-border);
		}
	}

	.assigned-section {
		margin-bottom: 16px;
		padding: 16px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
	}

	.assigned-items {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;
	}

	.assigned-item {
		padding: 6px 12px;
		background: var(--terminal-bg-panel);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-cyan);
		font-size: 12px;
		transition: all 0.15s ease;
	}

	.assigned-item:hover {
		border-color: var(--terminal-cyan);
	}
</style>
