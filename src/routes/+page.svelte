<script lang="ts">
	import GlobalSearch from '$lib/components/GlobalSearch.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="home-terminal">
	<!-- Global Search (first on mobile) -->
	<div class="search-section">
		<GlobalSearch counts={data.counts} />
	</div>

	<!-- ASCII Art Header (hidden on mobile to save space) -->
	<div class="ascii-header">
		<pre class="ascii-art">
╔═══════════════════════════════════════════════════════════════════╗
║  ██████╗ ██████╗ ███████╗     █████╗ ██████╗ ███╗   ███╗██╗███╗   ██╗  ║
║  ██╔══██╗██╔══██╗██╔════╝    ██╔══██╗██╔══██╗████╗ ████║██║████╗  ██║  ║
║  ██║  ██║██████╔╝███████╗    ███████║██║  ██║██╔████╔██║██║██╔██╗ ██║  ║
║  ██║  ██║██╔═══╝ ╚════██║    ██╔══██║██║  ██║██║╚██╔╝██║██║██║╚██╗██║  ║
║  ██████╔╝██║     ███████║    ██║  ██║██████╔╝██║ ╚═╝ ██║██║██║ ╚████║  ║
║  ╚═════╝ ╚═╝     ╚══════╝    ╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝  ║
╚═══════════════════════════════════════════════════════════════════╝</pre>
		<div class="subtitle">
			<span class="text-dim">IT Management System</span>
			<span class="text-cyan">v153.2.3</span>
		</div>
	</div>
</div>

<style>
	.home-terminal {
		max-width: 900px;
		margin: 0 auto;
	}

	/* ASCII Header */
	.ascii-header {
		text-align: center;
		margin-bottom: 48px;
	}

	.ascii-art {
		font-size: 10px;
		line-height: 1.2;
		color: var(--terminal-cyan);
		text-shadow: 0 0 20px rgba(0, 255, 242, 0.3);
		margin: 0;
		overflow-x: auto;
	}

	.subtitle {
		margin-top: 16px;
		font-size: 13px;
		display: flex;
		justify-content: center;
		gap: 12px;
	}

	/* Search Section */
	.search-section {
		margin-bottom: 48px;
	}

	/* Color utilities */
	.text-cyan {
		color: var(--terminal-cyan);
	}
	.text-dim {
		color: var(--terminal-dim);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.ascii-art {
			font-size: 6px;
		}
	}

	@media (max-width: 1023px) {
		.ascii-header {
			display: none;
		}

		.search-section {
			margin-bottom: 24px;
		}
	}
</style>
