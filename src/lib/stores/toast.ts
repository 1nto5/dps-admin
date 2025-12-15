import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastState {
	message: string;
	type: ToastType;
	pending: boolean;
}

export const toast = writable<ToastState | null>(null);

export function queueToast(message: string, type: ToastType = 'success') {
	toast.set({ message, type, pending: true });
}

export function flushToast() {
	toast.update((t) => (t?.pending ? { ...t, pending: false } : t));
}

export function clearToast() {
	toast.set(null);
}

export async function toastAndGoto(message: string, href: string, type: ToastType = 'success') {
	queueToast(message, type);
	await goto(href);
}
