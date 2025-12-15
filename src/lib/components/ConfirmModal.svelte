<script lang="ts">
	import { untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { pushContext, popContext } from '$lib/shortcuts';

	let {
		show = $bindable(false),
		title = 'Delete Item',
		message = 'Are you sure?',
		loading = false,
		onConfirm
	}: {
		show: boolean;
		title?: string;
		message?: string;
		loading?: boolean;
		onConfirm: () => void | Promise<void>;
	} = $props();

	// svelte-ignore non_reactive_update - bind:this refs don't need $state
	let confirmBtn: HTMLButtonElement;

	// Use untrack to prevent reactive loops when modifying context stack
	$effect(() => {
		if (show) {
			untrack(() => pushContext('modal'));
			setTimeout(() => confirmBtn?.focus(), 0);
			return () => untrack(() => popContext('modal'));
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			show = false;
		} else if (e.key === 'Enter' && !loading) {
			e.preventDefault();
			onConfirm();
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="modal-overlay" role="dialog" aria-modal="true" tabindex="-1" onkeydown={handleKeydown} transition:fade={{ duration: 150 }}>
		<div class="modal-box">
			<div class="modal-header">
				<span class="warning-icon">⚠</span>
				<span class="header-text">{title.toUpperCase()}</span>
			</div>

			<div class="modal-body">
				<p class="modal-message">{message}</p>
			</div>

			<div class="modal-footer">
				<button type="button" onclick={() => (show = false)} class="btn-abort">
					[ABORT]
					<kbd>Esc</kbd>
				</button>
				<button
					bind:this={confirmBtn}
					type="button"
					onclick={onConfirm}
					disabled={loading}
					class="btn-confirm"
				>
					{#if loading}
						<span class="spinner"></span> Processing...
					{:else}
						[CONFIRM]
						<kbd>↵</kbd>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		backdrop-filter: blur(2px);
	}

	.modal-box {
		width: 100%;
		max-width: 400px;
		margin: 16px;
		border: 1px solid var(--terminal-red);
		background: var(--terminal-bg);
		box-shadow: 0 0 30px rgba(255, 51, 102, 0.2);
	}

	.modal-header {
		padding: 16px 20px;
		border-bottom: 1px solid var(--terminal-border);
		background: var(--terminal-bg-alt);
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.warning-icon {
		color: var(--terminal-red);
		font-size: 18px;
	}

	.header-text {
		color: var(--terminal-red);
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 1px;
	}

	.modal-body {
		padding: 20px;
	}

	.modal-message {
		color: var(--terminal-text);
		font-size: 13px;
		line-height: 1.6;
		margin: 0;
	}

	.modal-footer {
		padding: 16px 20px;
		border-top: 1px solid var(--terminal-border);
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn-abort,
	.btn-confirm {
		padding: 10px 16px;
		font-size: 12px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-abort {
		background: transparent;
		border: 1px solid var(--terminal-border);
		color: var(--terminal-dim);
	}

	.btn-abort:hover {
		border-color: var(--terminal-text);
		color: var(--terminal-text);
	}

	.btn-confirm {
		background: transparent;
		border: 1px solid var(--terminal-red);
		color: var(--terminal-red);
	}

	.btn-confirm:hover:not(:disabled) {
		background: var(--terminal-red);
		color: var(--terminal-bg);
		box-shadow: 0 0 15px rgba(255, 51, 102, 0.3);
	}

	.btn-confirm:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-abort kbd,
	.btn-confirm kbd {
		font-size: 10px;
		padding: 2px 6px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-muted);
	}

	.spinner::before {
		content: '⠋';
		animation: spin 0.8s steps(1) infinite;
	}

	@keyframes spin {
		0% { content: '⠋'; }
		12.5% { content: '⠙'; }
		25% { content: '⠹'; }
		37.5% { content: '⠸'; }
		50% { content: '⠼'; }
		62.5% { content: '⠴'; }
		75% { content: '⠦'; }
		87.5% { content: '⠧'; }
	}
</style>
