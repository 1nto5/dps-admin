<script lang="ts">
	import { onMount } from 'svelte';
	import { parseKeyEvent, isInputElement } from './utils';
	import { getShortcut, getActiveContext, getContextStack } from './store.svelte';

	function handleKeyDown(event: KeyboardEvent) {
		const key = parseKeyEvent(event);
		const shortcut = getShortcut(key);

		if (!shortcut) return;

		const inInput = isInputElement(event.target);
		const activeContext = getActiveContext();
		const contextStack = getContextStack();

		// Check if shortcut is allowed in input
		if (inInput && !shortcut.allowInInput) {
			// Always allow escape
			if (key !== 'escape') return;
		}

		// Check context - global shortcuts always work, others need matching context
		if (shortcut.context !== 'global') {
			// For non-global shortcuts, check if context is in the stack
			if (!contextStack.includes(shortcut.context)) return;

			// Modal context has highest priority - if modal is active, only modal shortcuts work
			if (activeContext === 'modal' && shortcut.context !== 'modal') return;
		}

		event.preventDefault();
		shortcut.action();
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});
</script>
