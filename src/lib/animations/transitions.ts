import type { TransitionConfig } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';

// Terminal fade - subtle translateY with opacity
export function terminalFade(
	node: Element,
	{ delay = 0, duration = 150 }: { delay?: number; duration?: number } = {}
): TransitionConfig {
	if (prefersReducedMotion.current) {
		return { delay: 0, duration: 0 };
	}

	return {
		delay,
		duration,
		css: (t) => {
			const eased = cubicOut(t);
			return `opacity: ${eased}; transform: translateY(${(1 - eased) * 8}px)`;
		}
	};
}

// Scale reveal - for modals and panels
export function scaleReveal(
	node: Element,
	{ delay = 0, duration = 150 }: { delay?: number; duration?: number } = {}
): TransitionConfig {
	if (prefersReducedMotion.current) {
		return { delay: 0, duration: 0 };
	}

	return {
		delay,
		duration,
		css: (t) => {
			const eased = cubicOut(t);
			return `
				opacity: ${eased};
				transform: scale(${0.95 + eased * 0.05});
			`;
		}
	};
}

// Glitch in - horizontal offset with slight blur
export function glitchIn(
	node: Element,
	{ delay = 0, duration = 100 }: { delay?: number; duration?: number } = {}
): TransitionConfig {
	if (prefersReducedMotion.current) {
		return { delay: 0, duration: 0 };
	}

	return {
		delay,
		duration,
		css: (t) => {
			const offset = (1 - t) * 5;
			return `
				opacity: ${t};
				transform: translateX(${offset}px);
				filter: blur(${(1 - t) * 1}px);
			`;
		}
	};
}

// Digital reveal - clip-path scan effect (top to bottom)
export function digitalReveal(
	node: Element,
	{ delay = 0, duration = 200 }: { delay?: number; duration?: number } = {}
): TransitionConfig {
	if (prefersReducedMotion.current) {
		return { delay: 0, duration: 0 };
	}

	return {
		delay,
		duration,
		css: (t) => `
			clip-path: inset(0 0 ${(1 - t) * 100}% 0);
			opacity: ${t};
		`
	};
}

// Slide in from left - for nav items
export function slideIn(
	node: Element,
	{ delay = 0, duration = 150 }: { delay?: number; duration?: number } = {}
): TransitionConfig {
	if (prefersReducedMotion.current) {
		return { delay: 0, duration: 0 };
	}

	return {
		delay,
		duration,
		css: (t) => {
			const eased = cubicOut(t);
			return `
				opacity: ${eased};
				transform: translateX(${(1 - eased) * -10}px);
			`;
		}
	};
}
