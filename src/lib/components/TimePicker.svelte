<script lang="ts">
	let {
		value = $bindable(''),
		id = '',
		required = false
	}: {
		value: string;
		id?: string;
		required?: boolean;
	} = $props();

	// Parse HH:MM
	let hour = $derived(value ? parseInt(value.split(':')[0]) : 0);
	let minute = $derived(value ? parseInt(value.split(':')[1]) : 0);

	function updateTime(h: number, m: number) {
		const clampedH = Math.min(23, Math.max(0, h || 0));
		const clampedM = Math.min(59, Math.max(0, m || 0));
		value = `${String(clampedH).padStart(2, '0')}:${String(clampedM).padStart(2, '0')}`;
	}

	function handleHourChange(e: Event) {
		updateTime(parseInt((e.target as HTMLInputElement).value), minute);
	}

	function handleMinuteChange(e: Event) {
		updateTime(hour, parseInt((e.target as HTMLInputElement).value));
	}
</script>

<div class="time-picker">
	<input {id} type="number" value={hour} onchange={handleHourChange} min="0" max="23" class="form-input time-input" {required} />
	<span class="time-separator">:</span>
	<input type="number" value={minute} onchange={handleMinuteChange} min="0" max="59" class="form-input time-input" aria-label="Minutes" />
</div>

<style>
	.time-picker {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.time-input {
		flex: 1;
		min-width: 50px;
		text-align: center;
		padding: 10px 4px;
		-moz-appearance: textfield;
	}

	.time-input::-webkit-outer-spin-button,
	.time-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.time-separator {
		color: var(--terminal-dim);
		font-weight: 600;
	}
</style>
