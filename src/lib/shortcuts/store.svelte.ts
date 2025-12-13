import type { ShortcutContext, ShortcutDefinition } from './types';

// Active context stack (modal > form > list > global)
// Higher priority contexts are at the end of the array
let contextStack = $state<ShortcutContext[]>(['global']);

// Registered shortcuts
let shortcuts = $state<Map<string, ShortcutDefinition>>(new Map());

export function getContextStack(): ShortcutContext[] {
	return contextStack;
}

export function getActiveContext(): ShortcutContext {
	return contextStack[contextStack.length - 1];
}

export function pushContext(ctx: ShortcutContext): void {
	if (!contextStack.includes(ctx)) {
		contextStack = [...contextStack, ctx];
	}
}

export function popContext(ctx?: ShortcutContext): void {
	if (ctx) {
		contextStack = contextStack.filter((c) => c !== ctx);
	} else if (contextStack.length > 1) {
		contextStack = contextStack.slice(0, -1);
	}
}

export function registerShortcut(shortcut: ShortcutDefinition): () => void {
	shortcuts.set(shortcut.key, shortcut);
	return () => {
		shortcuts.delete(shortcut.key);
	};
}

export function getShortcut(key: string): ShortcutDefinition | undefined {
	return shortcuts.get(key);
}

export function getAllShortcuts(): ShortcutDefinition[] {
	return Array.from(shortcuts.values());
}
