// Sidebar edit section state (runes-based store)
// Used by resource pages to populate the sidebar edit section

export interface SidebarEditConfig {
	addUrl: string;
	addLabel: string;
	totalCount: number;
	filteredCount: number;
}

let editConfig = $state<SidebarEditConfig | null>(null);

export function setSidebarEdit(config: SidebarEditConfig): void {
	editConfig = config;
}

export function clearSidebarEdit(): void {
	editConfig = null;
}

export function getSidebarEdit(): SidebarEditConfig | null {
	return editConfig;
}
