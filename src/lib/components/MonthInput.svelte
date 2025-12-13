<script lang="ts">
	let {
		value = $bindable(''),
		class: className = ''
	}: {
		value: string;
		class?: string;
	} = $props();

	// Convert YYYY-MM to MM/YYYY for display
	let displayValue = $derived.by(() => {
		if (!value) return '';
		const [year, month] = value.split('-');
		return month && year ? `${month}/${year}` : '';
	});

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		let v = input.value.replace(/[^0-9/]/g, '');

		// Auto-add slash after 2 digits
		if (v.length === 2 && !v.includes('/')) {
			v = v + '/';
		}

		input.value = v;

		// Parse MM/YYYY to YYYY-MM
		const match = v.match(/^(\d{2})\/(\d{4})$/);
		if (match) {
			const [, month, year] = match;
			const m = parseInt(month, 10);
			if (m >= 1 && m <= 12) {
				value = `${year}-${month}`;
			}
		} else if (v === '') {
			value = '';
		}
	}

	function handleBlur(e: Event) {
		const input = e.target as HTMLInputElement;
		// Reset to formatted value on blur
		input.value = displayValue;
	}
</script>

<input
	type="text"
	value={displayValue}
	oninput={handleInput}
	onblur={handleBlur}
	placeholder="MM/YYYY"
	maxlength="7"
	class={className}
/>
