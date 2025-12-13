<script lang="ts">
	import { tick } from 'svelte';

	let {
		value = $bindable(''),
		suggestions = [],
		placeholder = 'Filter...',
		onkeydown
	}: {
		value: string;
		suggestions: string[];
		placeholder?: string;
		onkeydown?: (e: KeyboardEvent) => void;
	} = $props();

	let showDropdown = $state(false);
	let inputRef: HTMLInputElement | null = $state(null);
	let dropdownRef: HTMLDivElement | null = $state(null);
	let selectedIndex = $state(-1);
	let dropdownStyle = $state('');

	let filteredSuggestions = $derived(
		value.length > 0
			? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
			: suggestions
	);

	async function updateDropdownPosition() {
		if (!inputRef || !showDropdown) return;
		await tick();
		const rect = inputRef.getBoundingClientRect();
		dropdownStyle = `
			position: fixed;
			top: ${rect.bottom}px;
			left: ${rect.left}px;
			width: ${rect.width}px;
		`;
	}

	async function handleInput() {
		selectedIndex = -1;
		// Show dropdown if there are suggestions (filtered or all)
		showDropdown = suggestions.length > 0;
		await updateDropdownPosition();
	}

	async function handleFocus() {
		// Show all suggestions on focus, even with empty value
		if (suggestions.length > 0) {
			showDropdown = true;
			await updateDropdownPosition();
		}
	}

	function handleBlur() {
		// Delay to allow click on suggestion
		setTimeout(() => {
			showDropdown = false;
			selectedIndex = -1;
		}, 150);
	}

	function selectSuggestion(suggestion: string) {
		value = suggestion;
		showDropdown = false;
		selectedIndex = -1;
	}

	function scrollToSelected() {
		if (selectedIndex >= 0 && dropdownRef) {
			const items = dropdownRef.querySelectorAll('.autocomplete-item');
			if (items[selectedIndex]) {
				items[selectedIndex].scrollIntoView({ block: 'nearest' });
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!showDropdown || filteredSuggestions.length === 0) {
			onkeydown?.(e);
			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filteredSuggestions.length - 1);
			scrollToSelected();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
			scrollToSelected();
		} else if (e.key === 'Enter' && selectedIndex >= 0) {
			e.preventDefault();
			selectSuggestion(filteredSuggestions[selectedIndex]);
		} else if (e.key === 'Escape') {
			showDropdown = false;
			selectedIndex = -1;
		} else {
			onkeydown?.(e);
		}
	}
</script>

<div class="autocomplete-wrapper">
	<input
		type="text"
		bind:value
		bind:this={inputRef}
		{placeholder}
		oninput={handleInput}
		onfocus={handleFocus}
		onblur={handleBlur}
		onkeydown={handleKeydown}
		autocomplete="off"
	/>
	{#if showDropdown && filteredSuggestions.length > 0}
		<div class="autocomplete-dropdown" bind:this={dropdownRef} style={dropdownStyle}>
			{#each filteredSuggestions.slice(0, 8) as suggestion, i}
				<button
					type="button"
					class="autocomplete-item"
					class:selected={i === selectedIndex}
					onmousedown={() => selectSuggestion(suggestion)}
				>
					{suggestion}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.autocomplete-wrapper {
		position: relative;
		width: 100%;
	}

	.autocomplete-wrapper input {
		width: 100%;
		padding: 6px 10px;
		font-size: 12px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-text);
	}

	.autocomplete-wrapper input:focus {
		border-color: var(--terminal-cyan);
		outline: none;
		box-shadow: 0 0 10px rgba(0, 255, 242, 0.4), 0 0 20px rgba(0, 255, 242, 0.2);
	}

	.autocomplete-wrapper input::placeholder {
		color: var(--terminal-muted);
	}

	.autocomplete-dropdown {
		z-index: 9999;
		background: var(--terminal-bg-panel);
		border: 1px solid var(--terminal-cyan);
		max-height: 200px;
		overflow-y: auto;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.5),
			0 0 10px rgba(0, 255, 242, 0.4),
			0 0 20px rgba(0, 255, 242, 0.2),
			inset 0 0 20px rgba(0, 255, 242, 0.05);
	}

	.autocomplete-item {
		display: block;
		width: 100%;
		padding: 8px 10px;
		font-size: 12px;
		color: var(--terminal-text);
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.autocomplete-item:hover,
	.autocomplete-item.selected {
		background: var(--terminal-bg-alt);
		color: var(--terminal-cyan);
	}

	.autocomplete-item:not(:last-child) {
		border-bottom: 1px solid var(--terminal-border);
	}
</style>
