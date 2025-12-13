import { writable, get } from 'svelte/store';

// Track previous path for smart "back" navigation
export const previousPath = writable<string | null>(null);

export function setPreviousPath(path: string) {
	previousPath.set(path);
}

export function getPreviousPath(): string | null {
	return get(previousPath);
}

// Map paths to human-readable labels
const pathLabels: Record<string, string> = {
	'/': 'Search',
	'/computers': 'Computers',
	'/notebooks': 'Notebooks',
	'/monitors': 'Monitors',
	'/printers': 'Printers',
	'/users': 'Users',
	'/departments': 'Departments',
	'/rooms': 'Rooms',
	'/history': 'History'
};

export function getBackInfo(fallbackPath: string, fallbackLabel: string): { href: string; label: string } {
	const prev = getPreviousPath();
	if (prev && pathLabels[prev]) {
		return { href: prev, label: pathLabels[prev] };
	}
	return { href: fallbackPath, label: fallbackLabel };
}
