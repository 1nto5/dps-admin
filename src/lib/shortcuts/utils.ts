/**
 * Parse a keyboard event into a normalized key string
 * Format: modifier+modifier+key (e.g., 'alt+1', 'alt+shift+n', 'meta+enter')
 */
export function parseKeyEvent(event: KeyboardEvent): string {
	const parts: string[] = [];

	if (event.metaKey) parts.push('meta');
	if (event.altKey) parts.push('alt');
	if (event.shiftKey) parts.push('shift');
	if (event.ctrlKey) parts.push('ctrl');

	// Use event.code for physical key when Alt is pressed (macOS produces special chars)
	// e.g., Alt+1 produces '¡' in event.key but 'Digit1' in event.code
	let key: string;
	if (event.altKey && event.code) {
		key = codeToKey(event.code);
	} else {
		key = event.key.toLowerCase();
	}

	// Normalize special keys
	if (key === ' ') key = 'space';
	if (key === 'escape') key = 'escape';
	if (key === 'enter') key = 'enter';
	if (key === 'backspace') key = 'backspace';
	if (key === 'delete') key = 'delete';
	if (key === 'arrowup') key = 'up';
	if (key === 'arrowdown') key = 'down';
	if (key === 'arrowleft') key = 'left';
	if (key === 'arrowright') key = 'right';

	parts.push(key);
	return parts.join('+');
}

/**
 * Convert event.code to simple key name
 * e.g., 'Digit1' → '1', 'KeyA' → 'a', 'Slash' → '/'
 */
function codeToKey(code: string): string {
	if (code.startsWith('Digit')) return code.slice(5);
	if (code.startsWith('Key')) return code.slice(3).toLowerCase();
	if (code === 'Slash') return '/';
	if (code === 'Backslash') return '\\';
	if (code === 'Minus') return '-';
	if (code === 'Equal') return '=';
	if (code === 'BracketLeft') return '[';
	if (code === 'BracketRight') return ']';
	if (code === 'Semicolon') return ';';
	if (code === 'Quote') return "'";
	if (code === 'Comma') return ',';
	if (code === 'Period') return '.';
	if (code === 'Backquote') return '`';
	if (code === 'Space') return ' ';
	if (code === 'Enter') return 'enter';
	if (code === 'Backspace') return 'backspace';
	if (code === 'Escape') return 'escape';
	return code.toLowerCase();
}

/**
 * Format a key string for display using macOS symbols
 */
export function formatKeyForDisplay(key: string): string {
	return key
		.replace(/meta/g, '⌘')
		.replace(/alt/g, '⌥')
		.replace(/shift/g, '⇧')
		.replace(/ctrl/g, '⌃')
		.replace(/enter/g, '↵')
		.replace(/backspace/g, '⌫')
		.replace(/escape/g, 'Esc')
		.replace(/\+/g, '')
		.toUpperCase();
}

/**
 * Check if element is an input field where typing should be allowed
 */
export function isInputElement(element: EventTarget | null): boolean {
	if (!element || !(element instanceof HTMLElement)) return false;
	const tagName = element.tagName;
	if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) return true;
	if (element.isContentEditable) return true;
	return false;
}
