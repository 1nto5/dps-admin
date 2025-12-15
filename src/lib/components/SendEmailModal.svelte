<script lang="ts">
	import { untrack } from 'svelte';
	import { pushContext, popContext } from '$lib/shortcuts';

	let {
		show = $bindable(false),
		title = 'Send Email',
		message = '',
		loading = false,
		defaultEmail = 'uslugowy@dpsszczytno.pl',
		onConfirm
	}: {
		show: boolean;
		title?: string;
		message?: string;
		loading?: boolean;
		defaultEmail?: string;
		onConfirm: (email: string) => void | Promise<void>;
	} = $props();

	let email = $state(defaultEmail);
	let emailInput: HTMLInputElement;

	// Reset email when modal opens
	$effect(() => {
		if (show) {
			untrack(() => {
				email = defaultEmail;
				pushContext('modal');
			});
			setTimeout(() => emailInput?.focus(), 0);
			return () => untrack(() => popContext('modal'));
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			show = false;
		} else if (e.key === 'Enter' && !loading && email.trim()) {
			e.preventDefault();
			onConfirm(email.trim());
		}
	}

	function handleSubmit() {
		if (email.trim() && !loading) {
			onConfirm(email.trim());
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="modal-overlay" role="dialog" aria-modal="true" tabindex="-1" onkeydown={handleKeydown}>
		<div class="modal-box">
			<div class="modal-header">
				<span class="send-icon">✉</span>
				<span class="header-text">{title.toUpperCase()}</span>
			</div>

			<div class="modal-body">
				{#if message}
					<p class="modal-message">{message}</p>
				{/if}
				<div class="email-field">
					<label for="send-email" class="email-label">Recipient:</label>
					<input
						bind:this={emailInput}
						id="send-email"
						type="email"
						bind:value={email}
						class="email-input"
						placeholder="email@example.com"
						required
					/>
				</div>
			</div>

			<div class="modal-footer">
				<button type="button" onclick={() => (show = false)} class="btn-abort">
					[ABORT]
					<kbd>Esc</kbd>
				</button>
				<button
					type="button"
					onclick={handleSubmit}
					disabled={loading || !email.trim()}
					class="btn-send"
				>
					{#if loading}
						<span class="spinner"></span> Sending...
					{:else}
						[SEND]
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
		max-width: 440px;
		margin: 16px;
		border: 1px solid var(--terminal-cyan);
		background: var(--terminal-bg);
		box-shadow: 0 0 30px rgba(0, 255, 242, 0.15);
	}

	.modal-header {
		padding: 16px 20px;
		border-bottom: 1px solid var(--terminal-border);
		background: var(--terminal-bg-alt);
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.send-icon {
		color: var(--terminal-cyan);
		font-size: 18px;
	}

	.header-text {
		color: var(--terminal-cyan);
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
		margin: 0 0 16px 0;
	}

	.email-field {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.email-label {
		font-size: 12px;
		color: var(--terminal-dim);
		text-transform: lowercase;
	}

	.email-input {
		padding: 10px 12px;
		background: var(--terminal-bg-panel);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-text);
		font-size: 13px;
		font-family: inherit;
		width: 100%;
	}

	.email-input:focus {
		outline: none;
		border-color: var(--terminal-cyan);
	}

	.email-input::placeholder {
		color: var(--terminal-muted);
	}

	.modal-footer {
		padding: 16px 20px;
		border-top: 1px solid var(--terminal-border);
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn-abort,
	.btn-send {
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

	.btn-send {
		background: transparent;
		border: 1px solid var(--terminal-cyan);
		color: var(--terminal-cyan);
	}

	.btn-send:hover:not(:disabled) {
		background: var(--terminal-cyan);
		color: var(--terminal-bg);
		box-shadow: 0 0 15px rgba(0, 255, 242, 0.3);
	}

	.btn-send:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-abort kbd,
	.btn-send kbd {
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
