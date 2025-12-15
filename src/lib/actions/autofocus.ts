import { get } from 'svelte/store';
import { isMobile } from '$lib/stores/mobile';

/**
 * Svelte action that applies autofocus only on desktop devices.
 * On mobile, autofocus is disabled to prevent the keyboard from popping up automatically.
 */
export function desktopAutofocus(node: HTMLElement) {
	if (!get(isMobile)) {
		// Small delay to ensure DOM is ready
		setTimeout(() => node.focus(), 0);
	}
}
