import { prefersReducedMotion } from 'svelte/motion';
import { MediaQuery } from 'svelte/reactivity';

// Responsive detection
const isMobile = new MediaQuery('(max-width: 768px)');

// Performance cap for large lists
const MAX_ANIMATED_ITEMS = 20;

// Stagger delay calculator - disabled on mobile/reduced-motion, capped for performance
export function getStaggerDelay(index: number): number {
	if (prefersReducedMotion.current || isMobile.current) return 0;
	if (index >= MAX_ANIMATED_ITEMS) return 0;
	return Math.min(index * 20, 300);
}

// Re-export for convenience
export { prefersReducedMotion, isMobile };
