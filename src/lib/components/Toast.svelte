<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	type ToastType = 'info' | 'success' | 'error' | 'warning';

	let {
		message = '',
		type = 'info' as ToastType,
		show = $bindable(false),
		duration = 3000
	}: {
		message: string;
		type?: ToastType;
		show: boolean;
		duration?: number;
	} = $props();

	const colors: Record<ToastType, string> = {
		info: 'var(--terminal-cyan)',
		success: 'var(--terminal-green)',
		error: 'var(--terminal-red)',
		warning: 'var(--terminal-amber)'
	};

	const prefixes: Record<ToastType, string> = {
		info: 'INFO',
		success: 'OK',
		error: 'ERR',
		warning: 'WARN'
	};

	let timeoutId: ReturnType<typeof setTimeout>;

	$effect(() => {
		if (show && duration > 0) {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				show = false;
			}, duration);
		}
		return () => clearTimeout(timeoutId);
	});
</script>

{#if show}
	<div
		class="toast"
		style="--toast-color: {colors[type]}"
		in:fly={{ y: -20, duration: 150 }}
		out:fade={{ duration: 100 }}
		role="alert"
	>
		<span class="toast-prefix">[{prefixes[type]}]</span>
		<span class="toast-message">{message}</span>
		<button class="toast-close" onclick={() => (show = false)}>×</button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		top: 20px;
		right: 20px;
		padding: 12px 16px;
		background: var(--terminal-bg-panel);
		border: 1px solid var(--toast-color);
		color: var(--terminal-text);
		font-size: 13px;
		z-index: 1000;
		box-shadow: 0 0 20px color-mix(in srgb, var(--toast-color) 30%, transparent);
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: 400px;
	}

	.toast-prefix {
		color: var(--toast-color);
		font-weight: 600;
		font-size: 11px;
		letter-spacing: 0.5px;
	}

	.toast-message {
		flex: 1;
	}

	.toast-close {
		background: none;
		border: none;
		color: var(--terminal-dim);
		font-size: 18px;
		cursor: pointer;
		padding: 0 4px;
		line-height: 1;
		transition: color 0.15s ease;
	}

	.toast-close:hover {
		color: var(--terminal-text);
	}

	/* Responsive - bottom on mobile */
	@media (max-width: 768px) {
		.toast {
			left: 16px;
			right: 16px;
			bottom: 16px;
			top: auto;
			max-width: none;
		}
	}
</style>
