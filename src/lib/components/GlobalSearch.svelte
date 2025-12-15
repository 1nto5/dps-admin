<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { glitchIn } from '$lib/animations/transitions';
	import { getStaggerDelay } from '$lib/animations';
	import type { SearchResult } from '../../routes/api/search/+server';

	type EntityCounts = {
		computers: number;
		notebooks: number;
		monitors: number;
		printers: number;
		users: number;
		rooms: number;
		departments: number;
	};

	let { counts }: { counts: EntityCounts } = $props();

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let selectedIndex = $state(0);
	let loading = $state(false);
	let inputRef = $state<HTMLInputElement | undefined>(undefined);
	let resultsRef = $state<HTMLDivElement | undefined>(undefined);
	let debounceTimer: ReturnType<typeof setTimeout>;

	const typeConfig: Record<string, { label: string; color: string }> = {
		computer: { label: 'PC', color: 'cyan' },
		notebook: { label: 'NB', color: 'blue' },
		monitor: { label: 'MON', color: 'purple' },
		printer: { label: 'LP', color: 'pink' },
		user: { label: 'USR', color: 'green' },
		room: { label: 'LOC', color: 'amber' },
		department: { label: 'ORG', color: 'amber' },
		action: { label: '+', color: 'green' },
		category: { label: '→', color: 'cyan' }
	};

	async function search(q: string) {
		if (q.length < 2) {
			results = [];
			return;
		}
		loading = true;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
			const data = await res.json();
			results = data.results;
			selectedIndex = 0;
		} finally {
			loading = false;
		}
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => search(query), 300);
	}

	function scrollToSelected() {
		if (resultsRef) {
			const items = resultsRef.querySelectorAll('.result-item');
			if (items[selectedIndex]) {
				items[selectedIndex].scrollIntoView({ block: 'nearest' });
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
			scrollToSelected();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
			scrollToSelected();
		} else if (e.key === 'Enter' && results[selectedIndex]) {
			e.preventDefault();
			goto(results[selectedIndex].href);
		} else if (e.key === 'Escape') {
			query = '';
			results = [];
		}
	}

	onMount(() => {
		// Delayed focus for mobile browser compatibility
		setTimeout(() => inputRef?.focus(), 100);
	});
</script>

<div class="global-search">
	<!-- Stats chips -->
	<div class="stats-row">
		<span class="chip"><span class="val">{counts.computers}</span> pc</span>
		<span class="chip"><span class="val">{counts.notebooks}</span> nb</span>
		<span class="chip"><span class="val">{counts.monitors}</span> mon</span>
		<span class="chip"><span class="val">{counts.printers}</span> lp</span>
		<span class="chip"><span class="val">{counts.users}</span> usr</span>
		<span class="chip"><span class="val">{counts.rooms}</span> loc</span>
		<span class="chip"><span class="val">{counts.departments}</span> org</span>
	</div>

	<!-- Search input -->
	<div class="search-box">
		<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.3-4.3" />
		</svg>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			bind:value={query}
			bind:this={inputRef}
			oninput={handleInput}
			onkeydown={handleKeydown}
			placeholder="do what you want..."
			spellcheck="false"
			autocomplete="off"
			autofocus
		/>
		{#if loading}
			<span class="spinner"></span>
		{/if}
	</div>

	<!-- Results -->
	{#if query.length >= 2}
		<div class="results" bind:this={resultsRef}>
			{#if results.length === 0 && !loading}
				<div class="no-results">No results for "{query}"</div>
			{:else}
				{#each results as result, i}
					{@const config = typeConfig[result.type]}
					<button
						class="result-item"
						class:selected={i === selectedIndex}
						onclick={() => goto(result.href)}
						onmouseenter={() => (selectedIndex = i)}
					>
						<span class="type-badge {config.color}">{config.label}</span>
						<div class="result-info">
							<span class="result-name">{result.name}</span>
							<span class="result-subtitle">{result.subtitle}</span>
						</div>
						{#if result.status}
							<span class="status-pill status-{result.status}">{result.status}</span>
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.global-search {
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
	}

	.stats-row {
		display: none;
		justify-content: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 24px;
	}

	@media (min-width: 1024px) {
		.stats-row {
			display: flex;
		}
	}

	.chip {
		display: inline-flex;
		align-items: baseline;
		gap: 4px;
		padding: 4px 10px;
		background: var(--terminal-bg-alt);
		border: 1px solid var(--terminal-border);
		font-size: 11px;
		color: var(--terminal-dim);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.chip .val {
		color: var(--terminal-text-bright);
		font-size: 13px;
		font-weight: 600;
	}

	.search-box {
		position: relative;
		margin-bottom: 8px;
	}

	.search-icon {
		position: absolute;
		left: 14px;
		top: 50%;
		transform: translateY(-50%);
		width: 18px;
		height: 18px;
		color: var(--terminal-dim);
		pointer-events: none;
	}

	.search-box input {
		width: 100%;
		padding: 14px 14px 14px 44px;
		font-size: 15px;
		background: var(--terminal-bg-alt);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-text);
		transition: all 0.15s ease;
	}

	.search-box input:focus {
		border-color: var(--terminal-cyan);
		box-shadow: 0 0 0 1px var(--terminal-cyan);
		outline: none;
	}

	.search-box input::placeholder {
		color: var(--terminal-muted);
	}

	.spinner {
		position: absolute;
		right: 14px;
		top: 50%;
		transform: translateY(-50%);
	}

	.spinner::before {
		content: '';
		display: block;
		width: 16px;
		height: 16px;
		border: 2px solid var(--terminal-border);
		border-top-color: var(--terminal-cyan);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.results {
		background: var(--terminal-bg-alt);
		border: 1px solid var(--terminal-border);
		max-height: 400px;
		overflow-y: auto;
	}

	.no-results {
		padding: 20px;
		text-align: center;
		color: var(--terminal-dim);
		font-size: 13px;
	}

	.result-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 12px 14px;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--terminal-border);
		cursor: pointer;
		text-align: left;
		transition: background 0.1s ease;
	}

	.result-item:last-child {
		border-bottom: none;
	}

	.result-item:hover,
	.result-item.selected {
		background: var(--terminal-bg-panel);
	}

	.result-item.selected {
		border-left: 2px solid var(--terminal-cyan);
		padding-left: 12px;
	}

	.type-badge {
		flex-shrink: 0;
		padding: 3px 8px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border: 1px solid;
	}

	.type-badge.cyan {
		color: var(--terminal-cyan);
		border-color: var(--terminal-cyan);
		background: rgba(0, 255, 242, 0.1);
	}
	.type-badge.blue {
		color: var(--terminal-blue);
		border-color: var(--terminal-blue);
		background: rgba(0, 102, 255, 0.1);
	}
	.type-badge.purple {
		color: var(--terminal-purple);
		border-color: var(--terminal-purple);
		background: rgba(189, 0, 255, 0.1);
	}
	.type-badge.pink {
		color: var(--terminal-pink);
		border-color: var(--terminal-pink);
		background: rgba(255, 45, 106, 0.1);
	}
	.type-badge.green {
		color: var(--terminal-green);
		border-color: var(--terminal-green);
		background: rgba(0, 255, 136, 0.1);
	}
	.type-badge.amber {
		color: var(--terminal-amber);
		border-color: var(--terminal-amber);
		background: rgba(255, 184, 0, 0.1);
	}

	.result-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.result-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--terminal-text-bright);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-subtitle {
		font-size: 12px;
		color: var(--terminal-dim);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status-pill {
		flex-shrink: 0;
		padding: 2px 8px;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border: 1px solid;
	}

	.status-pill.status-in_use {
		color: var(--terminal-green);
		border-color: var(--terminal-green);
	}
	.status-pill.status-disposal {
		color: var(--terminal-red);
		border-color: var(--terminal-red);
	}
	.status-pill.status-preparing {
		color: var(--terminal-amber);
		border-color: var(--terminal-amber);
	}
	.status-pill.status-to_collect {
		color: var(--terminal-blue);
		border-color: var(--terminal-blue);
	}
</style>
