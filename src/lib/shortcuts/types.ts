export type ShortcutContext = 'global' | 'list' | 'form' | 'modal';

export interface ShortcutDefinition {
	key: string; // e.g., 'alt+1', 'alt+shift+n'
	action: () => void;
	context: ShortcutContext;
	description: string;
	allowInInput?: boolean; // defaults to false
}

export interface NavItem {
	href: string;
	label: string;
	icon: string;
	shortcut: string; // display hint e.g., '1'
}
