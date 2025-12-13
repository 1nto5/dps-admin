import { tweened, spring, prefersReducedMotion } from 'svelte/motion';
import { cubicOut, linear } from 'svelte/easing';
import { MediaQuery } from 'svelte/reactivity';

// Responsive detection
const isMobile = new MediaQuery('(max-width: 768px)');

// Terminal-style easing functions
export const terminalEasing = {
	step: (t: number) => Math.round(t * 4) / 4,
	sharp: cubicOut,
	linear
};

// Duration constants (ms) - shorter on mobile
export function getDuration() {
	const mobile = isMobile.current;
	const reduced = prefersReducedMotion.current;

	if (reduced) {
		return { instant: 0, fast: 0, normal: 0, slow: 0 };
	}

	return {
		instant: mobile ? 25 : 50,
		fast: mobile ? 50 : 100,
		normal: mobile ? 100 : 150,
		slow: mobile ? 150 : 200
	};
}

// Static durations for non-reactive contexts
export const duration = {
	instant: 50,
	fast: 100,
	normal: 150,
	slow: 200
};

// Stagger delay calculator - disabled on mobile
export function getStaggerDelay(index: number): number {
	if (prefersReducedMotion.current || isMobile.current) return 0;
	return Math.min(index * 20, 300);
}

// Tweened store factories
export function createFade(initial = 0) {
	const d = getDuration();
	return tweened(initial, { duration: d.normal, easing: terminalEasing.sharp });
}

export function createSlide(initial = -10) {
	const d = getDuration();
	return tweened(initial, { duration: d.fast, easing: terminalEasing.sharp });
}

export function createScale(initial = 0.95) {
	const d = getDuration();
	return tweened(initial, { duration: d.fast, easing: terminalEasing.sharp });
}

// Spring config - high damping for digital feel (no bounce)
export const springConfig = {
	stiffness: 0.3,
	damping: 0.8
};

export function createGlow(initial = 0) {
	return spring(initial, springConfig);
}

// Re-export for convenience
export { prefersReducedMotion, isMobile };
