<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { pushContext, popContext } from '$lib/shortcuts';
	import { terminalFade } from '$lib/animations/transitions';
	import { getStaggerDelay } from '$lib/animations';

	let { data }: { data: PageData } = $props();

	onMount(() => {
		pushContext('list');
		return () => popContext('list');
	});

	function formatChanges(changes: string) {
		try {
			return JSON.stringify(JSON.parse(changes), null, 2);
		} catch {
			return changes;
		}
	}

	const actionColors: Record<string, string> = {
		create: 'action-create',
		update: 'action-update',
		delete: 'action-delete'
	};

	function formatTime(dateStr: string) {
		const d = new Date(dateStr);
		return d.toISOString().replace('T', ' ').slice(0, 19);
	}
</script>

<div class="terminal-page">
	<div class="page-header">
		<div class="header-title">
			<span class="header-decoration">───</span>
			<span class="header-text">AUDIT LOG</span>
			<span class="header-decoration">───────────────────────────────────────────────</span>
		</div>
		<div class="header-meta">
			<span class="meta-item"><span class="meta-label">entries:</span><span class="meta-value">{data.logs.length}</span></span>
			<span class="meta-divider">│</span>
			<span class="meta-item"><span class="meta-label">source:</span><span class="meta-value">/var/log/audit</span></span>
		</div>
	</div>

	{#if data.logs.length === 0}
		<div class="empty-state">
			<div class="empty-icon">∅</div>
			<div class="empty-text">No entries in /var/log/audit</div>
			<div class="empty-hint">Activity logs will appear here as changes are made</div>
		</div>
	{:else}
		<div class="log-container">
			{#each data.logs as log, i (log.id)}
				<div class="log-entry" in:terminalFade={{ delay: getStaggerDelay(i) }}>
					<div class="log-header">
						<div class="log-info">
							<span class="log-entity">{log.entityType}</span>
							{#if log.entityId}
								<span class="log-id">#{log.entityId}</span>
							{/if}
							<span class="log-action {actionColors[log.action] || ''}">[{log.action.toUpperCase()}]</span>
						</div>
						<span class="log-time">{formatTime(log.performedAt)}</span>
					</div>
					<pre class="log-changes">{formatChanges(log.changes)}</pre>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.terminal-page { max-width: 100%; }
	.page-header { margin-bottom: 24px; }
	.header-title { font-size: 14px; letter-spacing: 2px; margin-bottom: 8px; }
	.header-decoration { color: var(--terminal-dim); }
	.header-text { color: var(--terminal-cyan); margin: 0 8px; }
	.header-meta { font-size: 12px; display: flex; gap: 12px; }
	.meta-label { color: var(--terminal-dim); }
	.meta-value { color: var(--terminal-text-bright); margin-left: 4px; }
	.meta-divider { color: var(--terminal-muted); }

	.empty-state { padding: 64px 32px; text-align: center; border: 1px solid var(--terminal-border); background: var(--terminal-bg-alt); }
	.empty-icon { font-size: 48px; color: var(--terminal-muted); margin-bottom: 16px; }
	.empty-text { font-size: 14px; color: var(--terminal-dim); margin-bottom: 8px; }
	.empty-hint { font-size: 12px; color: var(--terminal-muted); }

	.log-container { display: flex; flex-direction: column; gap: 12px; }

	.log-entry {
		border: 1px solid var(--terminal-border);
		background: var(--terminal-bg-alt);
	}

	.log-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid var(--terminal-border);
		background: var(--terminal-bg-panel);
	}

	.log-info { display: flex; align-items: center; gap: 8px; }
	.log-entity { color: var(--terminal-text-bright); font-weight: 500; }
	.log-id { color: var(--terminal-dim); font-size: 12px; }

	.log-action {
		font-size: 10px;
		padding: 2px 6px;
		border: 1px solid;
		font-weight: 500;
		letter-spacing: 0.5px;
	}

	.action-create { color: var(--terminal-green); border-color: var(--terminal-green); }
	.action-update { color: var(--terminal-amber); border-color: var(--terminal-amber); }
	.action-delete { color: var(--terminal-red); border-color: var(--terminal-red); }

	.log-time {
		font-size: 11px;
		color: var(--terminal-dim);
		font-family: monospace;
	}

	.log-changes {
		padding: 12px 16px;
		margin: 0;
		font-size: 11px;
		color: var(--terminal-dim);
		overflow-x: auto;
		max-height: 200px;
		background: var(--terminal-bg);
	}

	/* Mobile responsive */
	@media (max-width: 639px) {
		.log-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}

		.log-time {
			font-size: 10px;
		}

		.log-changes {
			font-size: 10px;
			padding: 10px 12px;
		}

		.header-meta {
			flex-direction: column;
			gap: 4px;
		}

		.meta-divider {
			display: none;
		}
	}
</style>
