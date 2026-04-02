<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { pushContext, popContext } from '$lib/shortcuts';

	let { data }: { data: PageData } = $props();

	onMount(() => {
		pushContext('list');
		return () => popContext('list');
	});

	const actionColors: Record<string, string> = {
		create: 'action-create',
		update: 'action-update',
		delete: 'action-delete'
	};

	function formatTime(dateStr: string) {
		const d = new Date(dateStr);
		return d.toISOString().replace('T', ' ').slice(0, 19);
	}

	const fieldLabels: Record<string, string> = {
		name: 'name',
		status: 'status',
		type: 'type',
		inventoryNumber: 'inventory number',
		manufacturer: 'manufacturer',
		model: 'model',
		serialNumber: 'serial number',
		cpu: 'cpu',
		ram: 'ram',
		storage: 'storage',
		windows: 'windows',
		office: 'office',
		notes: 'notes',
		purchaseDate: 'purchase date',
		ipAddress: 'IP',
		isNetwork: 'network',
		roomId: 'room',
		userId: 'user',
		computerId: 'computer',
		notebookId: 'notebook',
		departmentId: 'department',
		jobTitle: 'job title',
		email: 'email',
		date: 'date',
		billingMonth: 'billing month',
		startTime: 'start time',
		endTime: 'end time',
		duration: 'duration (min)',
		scope: 'scope'
	};

	const hiddenFields = new Set(['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at']);

	const fkLookups: Record<string, string> = {
		userId: 'users',
		roomId: 'rooms',
		departmentId: 'departments',
		computerId: 'computers',
		notebookId: 'notebooks'
	};

	function resolveValue(field: string, value: unknown): string {
		if (value === null || value === undefined) return '-';
		if (field === 'isNetwork') return value ? 'yes' : 'no';
		const lookupKey = fkLookups[field];
		if (lookupKey && typeof value === 'number') {
			const map = (data.lookups as Record<string, Record<number, string>>)[lookupKey];
			return map?.[value] ?? `#${value}`;
		}
		return String(value);
	}

	type ChangeRow = { field: string; label: string; oldVal?: string; newVal?: string };

	function parseChanges(action: string, changesJson: string): ChangeRow[] {
		try {
			const parsed = JSON.parse(changesJson);

			if (action === 'update' && parsed.before && parsed.after) {
				const rows: ChangeRow[] = [];
				const allKeys = new Set([...Object.keys(parsed.before), ...Object.keys(parsed.after)]);
				for (const key of allKeys) {
					if (hiddenFields.has(key)) continue;
					const oldRaw = parsed.before[key];
					const newRaw = parsed.after[key];
					if (JSON.stringify(oldRaw) === JSON.stringify(newRaw)) continue;
					rows.push({
						field: key,
						label: fieldLabels[key] || key,
						oldVal: resolveValue(key, oldRaw),
						newVal: resolveValue(key, newRaw)
					});
				}
				return rows;
			}

			// create or delete - flat object
			const obj = parsed.before || parsed.after || parsed;
			const rows: ChangeRow[] = [];
			for (const key of Object.keys(obj)) {
				if (hiddenFields.has(key)) continue;
				const val = resolveValue(key, obj[key]);
				if (val === '-') continue;
				rows.push({ field: key, label: fieldLabels[key] || key, newVal: val });
			}
			return rows;
		} catch {
			return [{ field: 'raw', label: 'dane', newVal: changesJson }];
		}
	}

	const entityLabels: Record<string, string> = {
		computer: 'computer',
		notebook: 'notebook',
		monitor: 'monitor',
		printer: 'printer',
		user: 'user',
		room: 'room',
		department: 'department',
		work_entry: 'work entry'
	};
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
			{#each data.logs as log (log.id)}
				{@const rows = parseChanges(log.action, log.changes)}
				<div class="log-entry">
					<div class="log-header">
						<div class="log-info">
							<span class="log-entity">{entityLabels[log.entityType] || log.entityType}</span>
							{#if log.entityId}
								<span class="log-id">#{log.entityId}</span>
							{/if}
							<span class="log-action {actionColors[log.action] || ''}">[{log.action.toUpperCase()}]</span>
						</div>
						<span class="log-time">{formatTime(log.performedAt)}</span>
					</div>
					<div class="log-changes-table">
						{#if rows.length === 0}
							<div class="no-changes">no changes</div>
						{:else if log.action === 'update'}
							<table>
								<thead><tr><th>field</th><th>before</th><th>after</th></tr></thead>
								<tbody>
									{#each rows as row}
										<tr>
											<td class="field-name">{row.label}</td>
											<td class="val-old">{row.oldVal}</td>
											<td class="val-new">{row.newVal}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{:else}
							<table>
								<thead><tr><th>field</th><th>value</th></tr></thead>
								<tbody>
									{#each rows as row}
										<tr>
											<td class="field-name">{row.label}</td>
											<td>{row.newVal}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>
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

	.log-changes-table {
		padding: 0;
		overflow-x: auto;
		background: var(--terminal-bg);
	}

	.log-changes-table table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
	}

	.log-changes-table th {
		text-align: left;
		padding: 6px 16px;
		color: var(--terminal-dim);
		font-weight: 500;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 1px solid var(--terminal-border);
	}

	.log-changes-table td {
		padding: 5px 16px;
		border-bottom: 1px solid var(--terminal-border);
		color: var(--terminal-text);
	}

	.log-changes-table tr:last-child td {
		border-bottom: none;
	}

	.field-name {
		color: var(--terminal-cyan);
		white-space: nowrap;
		width: 1%;
	}

	.val-old {
		color: var(--terminal-red);
	}

	.val-new {
		color: var(--terminal-green);
	}

	.no-changes {
		padding: 12px 16px;
		color: var(--terminal-muted);
		font-size: 12px;
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

		.log-changes-table th,
		.log-changes-table td {
			padding: 4px 10px;
			font-size: 11px;
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
