<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	type Command = {
		name: string;
		description: string;
		href: string;
		category: 'nav' | 'action';
	};

	const commands: Command[] = [
		// Navigation
		{ name: 'Computers', description: 'View all computers', href: '/computers', category: 'nav' },
		{ name: 'Notebooks', description: 'View all notebooks', href: '/notebooks', category: 'nav' },
		{ name: 'Monitors', description: 'View all monitors', href: '/monitors', category: 'nav' },
		{ name: 'Printers', description: 'View all printers', href: '/printers', category: 'nav' },
		{ name: 'Users', description: 'View all users', href: '/users', category: 'nav' },
		{ name: 'Departments', description: 'View departments', href: '/departments', category: 'nav' },
		{ name: 'Rooms', description: 'View rooms', href: '/rooms', category: 'nav' },
		{ name: 'History', description: 'View audit log', href: '/history', category: 'nav' },
		// Actions
		{ name: 'New Computer', description: 'Add a new computer', href: '/computers/new', category: 'action' },
		{ name: 'New Notebook', description: 'Add a new notebook', href: '/notebooks/new', category: 'action' },
		{ name: 'New Monitor', description: 'Add a new monitor', href: '/monitors/new', category: 'action' },
		{ name: 'New Printer', description: 'Add a new printer', href: '/printers/new', category: 'action' },
		{ name: 'New User', description: 'Add a new user', href: '/users/new', category: 'action' },
		{ name: 'New Department', description: 'Add a department', href: '/departments/new', category: 'action' },
		{ name: 'New Room', description: 'Add a room', href: '/rooms/new', category: 'action' },
	];

	let query = $state('');
	let selectedIndex = $state(0);
	let inputRef: HTMLInputElement;

	let filtered = $derived(
		query.length === 0
			? commands
			: commands.filter(
					(c) =>
						c.name.toLowerCase().includes(query.toLowerCase()) ||
						c.description.toLowerCase().includes(query.toLowerCase())
			  )
	);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter' && filtered[selectedIndex]) {
			e.preventDefault();
			goto(filtered[selectedIndex].href);
		}
	}

	function execute(cmd: Command) {
		goto(cmd.href);
	}

	onMount(() => {
		inputRef?.focus();
	});

	$effect(() => {
		// Reset selection when filter changes
		if (query) selectedIndex = 0;
	});
</script>

<div class="command-bar">
	<div class="prompt-line">
		<span class="user">root</span><span class="at">@</span><span class="host">dps-admin</span><span class="colon">:</span><span class="path">~</span><span class="dollar">$</span>
		<input
			type="text"
			bind:value={query}
			bind:this={inputRef}
			onkeydown={handleKeydown}
			class="command-input"
			placeholder="type command or search..."
			spellcheck="false"
			autocomplete="off"
		/>
		<span class="cursor"></span>
	</div>

	<div class="results">
		{#if filtered.length === 0}
			<div class="no-results">
				<span class="text-red">No results for "{query}"</span>
			</div>
		{:else}
			{#each filtered as cmd, i}
				<button
					class="result-item"
					class:selected={i === selectedIndex}
					onclick={() => execute(cmd)}
					onmouseenter={() => (selectedIndex = i)}
				>
					<span class="result-name">{cmd.name}</span>
					<span class="result-desc">{cmd.description}</span>
					{#if cmd.category === 'action'}
						<span class="action-badge">+</span>
					{/if}
				</button>
			{/each}
		{/if}
	</div>

	<div class="hints">
		<span><kbd>↑↓</kbd> navigate</span>
		<span><kbd>↵</kbd> execute</span>
		<span><kbd>esc</kbd> clear</span>
	</div>
</div>

<style>
	.command-bar {
		max-width: 700px;
		margin: 0 auto;
	}

	.prompt-line {
		display: flex;
		align-items: center;
		padding: 16px 20px;
		background: var(--terminal-bg-alt);
		border: 1px solid var(--terminal-border);
		font-size: 15px;
	}

	.user { color: var(--terminal-green); }
	.at { color: var(--terminal-dim); }
	.host { color: var(--terminal-cyan); }
	.colon { color: var(--terminal-dim); }
	.path { color: var(--terminal-blue); }
	.dollar { color: var(--terminal-dim); margin-right: 12px; }

	.command-input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--terminal-text-bright);
		font-size: 15px;
		outline: none;
		padding: 0;
	}

	.command-input::placeholder {
		color: var(--terminal-muted);
	}

	.cursor {
		width: 10px;
		height: 20px;
		background: var(--terminal-cyan);
		margin-left: 2px;
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		0%, 50% { opacity: 1; }
		51%, 100% { opacity: 0; }
	}

	.results {
		border: 1px solid var(--terminal-border);
		border-top: none;
		max-height: 400px;
		overflow-y: auto;
	}

	.no-results {
		padding: 16px 20px;
		background: var(--terminal-bg-panel);
	}

	.result-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 20px;
		background: var(--terminal-bg-panel);
		border: none;
		border-bottom: 1px solid var(--terminal-border);
		text-align: left;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.result-item:last-child {
		border-bottom: none;
	}

	.result-item:hover,
	.result-item.selected {
		background: var(--terminal-bg-alt);
	}

	.result-item.selected {
		border-left: 2px solid var(--terminal-cyan);
		padding-left: 18px;
	}

	.result-item.selected .result-name {
		color: var(--terminal-cyan);
		text-shadow: 0 0 8px rgba(0, 255, 242, 0.3);
	}

	.result-name {
		color: var(--terminal-text);
		min-width: 140px;
		font-weight: 500;
	}

	.result-desc {
		flex: 1;
		color: var(--terminal-dim);
	}

	.action-badge {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--terminal-pink);
		color: var(--terminal-bg);
		font-size: 12px;
		font-weight: bold;
	}

	.hints {
		display: flex;
		gap: 24px;
		padding: 12px 20px;
		background: var(--terminal-bg-alt);
		border: 1px solid var(--terminal-border);
		border-top: none;
		font-size: 11px;
		color: var(--terminal-muted);
	}

	.hints kbd {
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		padding: 2px 6px;
		margin-right: 6px;
		font-size: 10px;
	}

	.text-red {
		color: var(--terminal-red);
	}
</style>
