import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const MOBILE_BREAKPOINT = 1024;

function createMobileStore() {
	const { subscribe, set } = writable(false);

	if (browser) {
		const check = () => set(window.innerWidth < MOBILE_BREAKPOINT);
		check();
		window.addEventListener('resize', check);
	}

	return { subscribe };
}

export const isMobile = createMobileStore();
