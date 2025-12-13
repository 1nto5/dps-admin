import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function persisted<T>(key: string, initial: T) {
	const stored = browser ? localStorage.getItem(key) : null;
	const value = stored ? JSON.parse(stored) : initial;
	const store = writable<T>(value);
	if (browser) store.subscribe((v) => localStorage.setItem(key, JSON.stringify(v)));
	return store;
}

// Default: OFF (hide disposal items)
export const showDisposal = writable(false);

// Sidebar preferences (persisted)
export const sidebarWidth = persisted('sidebarWidth', 280);
export const sidebarCollapsed = persisted('sidebarCollapsed', false);
