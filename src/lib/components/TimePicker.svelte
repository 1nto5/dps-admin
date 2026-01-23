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
		value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
	}

	function handleHourChange(e: Event) {
		updateTime(parseInt((e.target as HTMLSelectElement).value), minute);
	}

	function handleMinuteChange(e: Event) {
		updateTime(hour, parseInt((e.target as HTMLSelectElement).value));
	}

	const hours = Array.from({ length: 24 }, (_, i) => i);
	const minutes = [0, 15, 30, 45];
</script>

<div class="time-picker">
	<select {id} value={hour} onchange={handleHourChange} class="form-input time-select" {required}>
		{#each hours as h}
			<option value={h}>{String(h).padStart(2, '0')}</option>
		{/each}
	</select>
	<span class="time-separator">:</span>
	<select value={minute} onchange={handleMinuteChange} class="form-input time-select" aria-label="Minutes">
		{#each minutes as m}
			<option value={m}>{String(m).padStart(2, '0')}</option>
		{/each}
	</select>
</div>

<style>
	.time-picker {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.time-select {
		flex: 1;
		min-width: 50px;
		text-align: center;
		padding: 10px 4px;
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
	}

	.time-separator {
		color: var(--terminal-dim);
		font-weight: 600;
	}
</style>
