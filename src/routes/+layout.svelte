<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { goto, beforeNavigate, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { showDisposal, sidebarWidth, sidebarCollapsed } from '$lib/stores/settings';
	import { setPreviousPath } from '$lib/stores/navigation';
	import { GlobalListener, registerShortcut } from '$lib/shortcuts';
	import { getSidebarEdit } from '$lib/stores/sidebar.svelte';

	// Track navigation for smart "back" behavior - save current path BEFORE navigating away
	beforeNavigate(({ from }) => {
		if (from?.url.pathname) {
			setPreviousPath(from.url.pathname);
		}
	});

	let { children } = $props();

	// Mobile sidebar state
	let sidebarOpen = $state(false);
	let isMobile = $state(false);

	// Resize state
	let isResizing = $state(false);
	const MIN_WIDTH = 200;
	const MAX_WIDTH = 400;

	// Sidebar edit section (from resource pages)
	let sidebarEdit = $derived(getSidebarEdit());

	function checkMobile() {
		isMobile = window.innerWidth < 1024;
		if (!isMobile) sidebarOpen = false;
	}

	function startResize(e: MouseEvent) {
		if (isMobile) return;
		isResizing = true;
		e.preventDefault();
	}

	function onMouseMove(e: MouseEvent) {
		if (!isResizing) return;
		const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
		sidebarWidth.set(newWidth);
	}

	function stopResize() {
		isResizing = false;
	}

	function toggleSidebar() {
		sidebarCollapsed.update((v) => !v);
	}

	// Close sidebar on navigation (mobile)
	afterNavigate(() => {
		if (isMobile) sidebarOpen = false;
	});

	const navItems = [
		{ href: '/', label: 'Home', shortcut: '1' },
		{ href: '/work-time', label: 'Work Time', shortcut: '2' },
		{ href: '/computers', label: 'Computers', shortcut: '3' },
		{ href: '/notebooks', label: 'Notebooks', shortcut: '4' },
		{ href: '/monitors', label: 'Monitors', shortcut: '5' },
		{ href: '/printers', label: 'Printers', shortcut: '6' },
		{ href: '/users', label: 'Users', shortcut: '7' },
		{ href: '/departments', label: 'Departments', shortcut: '8' },
		{ href: '/rooms', label: 'Rooms', shortcut: '9' },
		{ href: '/history', label: 'History', shortcut: '' }
	];

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		window.location.href = '/login';
	}

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', stopResize);

		const unsubscribers: (() => void)[] = [];

		// Sidebar toggle shortcut
		unsubscribers.push(
			registerShortcut({
				key: 'alt+0',
				action: toggleSidebar,
				context: 'global',
				description: 'Toggle sidebar',
				allowInInput: true
			})
		);

		navItems.forEach((item, i) => {
			unsubscribers.push(
				registerShortcut({
					key: `alt+${i + 1}`,
					action: () => goto(item.href),
					context: 'global',
					description: `Go to ${item.label}`,
					allowInInput: true
				})
			);
		});

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', stopResize);
			unsubscribers.forEach((unsub) => unsub());
		};
	});

	function isActive(href: string): boolean {
		if (href === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>DPS admin</title>
</svelte:head>

<GlobalListener />

{#if $page.url.pathname === '/login'}
	{@render children()}
{:else}
	<div class="terminal-container" class:resizing={isResizing}>
		<!-- Mobile Header - disabled to save space, logo accessible via search icon -->
		<!-- {#if isMobile}
			<header class="mobile-header">
				<a href="/" class="mobile-logo">
					<span class="text-cyan">DPS</span><span class="text-pink">ADMIN</span>
				</a>
			</header>
		{/if} -->

		<!-- Expand button (when collapsed, desktop only) -->
		{#if !isMobile && $sidebarCollapsed}
			<button class="expand-btn" onclick={toggleSidebar} aria-label="Expand sidebar">
				<span class="text-cyan">»</span>
			</button>
		{/if}

		<!-- Backdrop -->
		{#if isMobile && sidebarOpen}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<button class="sidebar-backdrop" onclick={() => sidebarOpen = false} transition:fade={{ duration: 150 }} aria-label="Close sidebar"></button>
		{/if}

		<!-- Mobile Bottom Bar (thumb-zone) -->
		{#if isMobile}
			<div class="mobile-bottom-bar">
				{#if sidebarEdit}
					<a href={sidebarEdit.addUrl} class="bottom-bar-btn bottom-bar-add">
						+
					</a>
				{/if}
				<div class="bottom-bar-row">
					<a href="/" class="bottom-bar-btn bottom-bar-search" aria-label="Search / Home">
						⌕
					</a>
					<button
						class="bottom-bar-btn"
						onclick={() => sidebarOpen = !sidebarOpen}
						aria-label="Toggle menu"
					>
						{sidebarOpen ? '✕' : '☰'}
					</button>
				</div>
			</div>
		{/if}

		<!-- Sidebar Terminal -->
		<aside
			class="terminal-sidebar"
			class:open={sidebarOpen}
			class:mobile={isMobile}
			class:collapsed={!isMobile && $sidebarCollapsed}
			style={!isMobile && !$sidebarCollapsed ? `width: ${$sidebarWidth}px` : ''}
		>
			<!-- Hide button (desktop only) -->
			{#if !isMobile}
				<button class="collapse-btn" onclick={toggleSidebar} aria-label="Collapse sidebar">
					<span class="text-cyan">«</span>
					<span class="text-dim">hide</span>
				</button>
			{/if}

			<!-- Navigation -->
			<nav class="nav-section">
				<ul class="nav-list">
					{#each navItems as item}
						<li>
							<a
								href={item.href}
								class="nav-item"
								class:active={isActive(item.href)}
							>
								<span class="prompt">{isActive(item.href) ? '>' : ' '}</span>
								<span class="nav-label">{item.label}</span>
								{#if item.shortcut}<kbd class="shortcut">⌥{item.shortcut}</kbd>{/if}
							</a>
							<!-- Edit sub-section (under active nav item) -->
							{#if isActive(item.href) && sidebarEdit}
								<div class="nav-sub-section">
									<div class="sub-counts hide-mobile">
										<span class="meta-label">total:</span>
										<span class="meta-value">{sidebarEdit.totalCount}</span>
										<span class="meta-divider">|</span>
										<span class="meta-label">filtered:</span>
										<span class="meta-value">{sidebarEdit.filteredCount}</span>
									</div>
									<a href={sidebarEdit.addUrl} class="sub-add-btn hide-mobile">
										<span class="action-icon">+</span>
										<span>{sidebarEdit.addLabel}</span>
										<kbd>⌥N</kbd>
									</a>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</nav>

			<!-- Footer -->
			<div class="sidebar-footer">
				<button
					type="button"
					onclick={() => ($showDisposal = !$showDisposal)}
					class="toggle-btn"
				>
					<span class="text-cyan">show disposal</span>
					<span class={$showDisposal ? 'text-green' : 'text-red'}>
						[{$showDisposal ? 'ON' : 'OFF'}]
					</span>
				</button>
				<button onclick={logout} class="logout-btn">
					<span class="text-red">LOGOUT</span>
				</button>
			</div>

			<!-- Resize handle (desktop only) -->
			{#if !isMobile}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					class="resize-handle"
					onmousedown={startResize}
					role="separator"
					aria-label="Resize sidebar"
					tabindex="-1"
				></div>
			{/if}
		</aside>

		<!-- Main Content -->
		<main class="terminal-main">
			<div class="main-content">
				{@render children()}
			</div>
		</main>
	</div>
{/if}

<style>
	.terminal-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--terminal-bg);
		overflow: hidden;
	}

	@media (min-width: 1024px) {
		.terminal-container {
			flex-direction: row;
		}
	}

	/* Mobile Header */
	.mobile-header {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		background: var(--terminal-bg-alt);
		border-bottom: 1px solid var(--terminal-border);
		flex-shrink: 0;
	}

	.mobile-logo {
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
	}

	/* Mobile Bottom Bar (thumb-zone) */
	.mobile-bottom-bar {
		position: fixed;
		bottom: 20px;
		right: 20px;
		display: flex;
		flex-direction: column-reverse;
		align-items: flex-end;
		gap: 12px;
		z-index: 60;
	}

	.bottom-bar-row {
		display: flex;
		gap: 12px;
	}

	.bottom-bar-btn {
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--terminal-bg-alt);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-cyan);
		font-size: 24px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		transition: all 0.15s ease;
		text-decoration: none;
	}

	.bottom-bar-btn:active {
		transform: scale(0.95);
	}

	.bottom-bar-add {
		background: var(--terminal-cyan);
		color: var(--terminal-bg);
		border-color: var(--terminal-cyan);
	}

	.bottom-bar-search {
		font-size: 28px;
	}

	/* Backdrop */
	.sidebar-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 40;
		border: none;
		cursor: default;
	}

	/* Sidebar */
	.terminal-sidebar {
		position: relative;
		width: 280px;
		background: var(--terminal-bg-alt);
		border-right: 1px solid var(--terminal-border);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		transition: width 0.2s ease;
	}

	.terminal-sidebar.collapsed {
		width: 0 !important;
		overflow: hidden;
		border-right: none;
	}

	.terminal-container.resizing .terminal-sidebar {
		transition: none;
	}

	.terminal-container.resizing {
		user-select: none;
		cursor: col-resize;
	}

	/* Mobile sidebar - overlay from RIGHT */
	.terminal-sidebar.mobile {
		position: fixed;
		right: 0;
		left: auto;
		top: 0;
		height: 100vh;
		z-index: 50;
		transform: translateX(100%);
		transition: transform 0.25s ease;
		border-right: none;
		border-left: 1px solid var(--terminal-border);
		padding-bottom: 100px; /* Space for bottom bar icons */
	}

	.terminal-sidebar.mobile.open {
		transform: translateX(0);
	}

	/* Resize handle */
	.resize-handle {
		position: absolute;
		right: 0;
		top: 0;
		width: 4px;
		height: 100%;
		cursor: col-resize;
		background: transparent;
		transition: background 0.15s ease;
		z-index: 10;
	}

	.resize-handle:hover {
		background: var(--terminal-cyan);
		box-shadow: 0 0 8px rgba(0, 255, 242, 0.4);
	}

	/* Collapse button (top of sidebar) */
	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin: 12px 16px;
		padding: 8px 12px;
		background: transparent;
		border: 1px solid var(--terminal-border);
		font-size: 12px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.collapse-btn:hover {
		border-color: var(--terminal-cyan);
		background: rgba(0, 255, 242, 0.05);
	}

	/* Expand button (floating when collapsed) */
	.expand-btn {
		position: fixed;
		left: 0;
		top: 12px;
		width: 12px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--terminal-bg-alt);
		border: 1px solid var(--terminal-border);
		border-left: none;
		border-radius: 0 4px 4px 0;
		font-size: 10px;
		padding: 0;
		cursor: pointer;
		transition: all 0.15s ease;
		z-index: 40;
		overflow: hidden;
	}

	.expand-btn:hover {
		border-color: var(--terminal-cyan);
		box-shadow: 0 0 8px rgba(0, 255, 242, 0.3);
	}

	/* Toggle */
	.toggle-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		text-align: left;
		font-size: 12px;
		transition: all 0.15s ease;
	}

	.toggle-btn:hover {
		border-color: var(--terminal-cyan);
	}

	/* Navigation */
	.nav-section {
		flex: 1;
		padding: 16px;
		overflow-y: auto;
	}

	.nav-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.nav-item {
		display: flex;
		align-items: center;
		padding: 8px 12px;
		margin-bottom: 4px;
		font-size: 12px;
		color: var(--terminal-text);
		transition: all 0.15s ease;
		border: 1px solid transparent;
	}

	.nav-item:hover {
		background: var(--terminal-bg);
		border-color: var(--terminal-border);
	}

	.nav-item.active {
		background: var(--terminal-bg);
		border-color: var(--terminal-cyan);
		box-shadow: 0 0 10px rgba(0, 255, 242, 0.1);
	}

	.nav-item.active .nav-label {
		color: var(--terminal-cyan);
		text-shadow: 0 0 8px rgba(0, 255, 242, 0.4);
	}

	.prompt {
		width: 12px;
		color: var(--terminal-cyan);
		font-weight: bold;
	}

	.nav-label {
		flex: 1;
		margin-left: 8px;
	}

	.shortcut {
		font-size: 10px;
		padding: 2px 6px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-muted);
	}

	/* Nav Sub-Section (under active item) */
	.nav-sub-section {
		margin-left: 20px;
		padding: 8px 12px;
		border-left: 1px solid var(--terminal-border);
	}

	.sub-counts {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 8px;
		font-size: 11px;
	}

	.sub-counts .meta-label {
		color: var(--terminal-dim);
	}

	.sub-counts .meta-value {
		color: var(--terminal-cyan);
		font-weight: 500;
	}

	.sub-counts .meta-divider {
		color: var(--terminal-border);
	}

	.sub-add-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 10px;
		font-size: 12px;
		border: 1px solid var(--terminal-cyan);
		color: var(--terminal-cyan);
		background: transparent;
		transition: all 0.15s ease;
	}

	.sub-add-btn:hover {
		background: var(--terminal-cyan);
		color: var(--terminal-bg);
		box-shadow: 0 0 12px rgba(0, 255, 242, 0.3);
	}

	.sub-add-btn .action-icon {
		font-weight: bold;
	}

	.sub-add-btn kbd {
		margin-left: auto;
		font-size: 9px;
		padding: 2px 5px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-muted);
	}

	.sub-add-btn:hover kbd {
		background: var(--terminal-bg-alt);
		border-color: var(--terminal-cyan);
	}

	/* Footer */
	.sidebar-footer {
		padding: 16px;
		border-top: 1px solid var(--terminal-border);
	}

	.logout-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 8px;
		padding: 8px 12px;
		background: transparent;
		border: 1px solid var(--terminal-border);
		font-size: 12px;
		transition: all 0.15s ease;
	}

	.logout-btn:hover {
		border-color: var(--terminal-red);
		background: rgba(255, 51, 102, 0.1);
	}

	/* Main Content */
	.terminal-main {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		background: var(--terminal-bg);
	}

	.main-content {
		padding: 32px;
		min-height: 100%;
		max-width: 100%;
		overflow-x: hidden;
	}

	/* Color utilities */
	.text-cyan { color: var(--terminal-cyan); }
	.text-pink { color: var(--terminal-pink); }
	.text-green { color: var(--terminal-green); }
	.text-red { color: var(--terminal-red); }
	.text-dim { color: var(--terminal-dim); }

	/* Responsive */
	@media (max-width: 1023px) {
		.main-content {
			padding: 20px;
		}

		/* Mobile sidebar: reorder content for thumb access */
		.sidebar-footer {
			order: -1;
			border-top: none;
			border-bottom: 1px solid var(--terminal-border);
			display: flex;
			flex-direction: column;
		}

		/* Logout at very top */
		.logout-btn {
			order: -1;
			margin-top: 0;
			margin-bottom: 8px;
		}
	}

	@media (max-width: 640px) {
		.main-content {
			padding: 16px;
		}

		.shortcut {
			display: none;
		}
	}
</style>
