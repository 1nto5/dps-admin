<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let password = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);
	let bootComplete = $state(false);
	let bootLines = $state<string[]>([]);

	const bootSequence = [
		'[    0.000000] DPS Admin System v2.0.0',
		'[    0.001234] Initializing kernel...',
		'[    0.012345] Loading device drivers...',
		'[    0.023456] Mounting filesystems...',
		'[    0.034567] Starting network services...',
		'[    0.045678] Initializing database connection...',
		'[    0.056789] System ready.',
		''
	];

	onMount(() => {
		let i = 0;
		const interval = setInterval(() => {
			if (i < bootSequence.length) {
				bootLines = [...bootLines, bootSequence[i]];
				i++;
			} else {
				clearInterval(interval);
				setTimeout(() => { bootComplete = true; }, 300);
			}
		}, 120);

		return () => clearInterval(interval);
	});

	async function handleLogin() {
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});

			const result = await res.json();

			if (res.ok) {
				window.location.href = '/';
			} else {
				error = result.error || 'Authentication failed';
			}
		} catch {
			error = 'Connection error';
		} finally {
			loading = false;
		}
	}

	async function handleSetup() {
		error = '';

		if (newPassword.length < 4) {
			error = 'Password must be at least 4 characters';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;

		try {
			const res = await fetch('/api/auth/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: newPassword })
			});

			const result = await res.json();

			if (res.ok) {
				window.location.reload();
			} else {
				error = result.error || 'Setup failed';
			}
		} catch {
			error = 'Connection error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="login-terminal">
	<!-- Boot sequence -->
	<div class="boot-screen" class:hidden={bootComplete}>
		<div class="boot-output">
			{#each bootLines as line}
				<div class="boot-line">{line}</div>
			{/each}
			{#if bootLines.length < bootSequence.length}
				<span class="cursor-blink">█</span>
			{/if}
		</div>
	</div>

	<!-- Login form -->
	<div class="login-container" class:visible={bootComplete}>
		<div class="login-box">
			<!-- ASCII Header -->
			<pre class="ascii-logo">
╔════════════════════════════════╗
║     ██████╗ ██████╗ ███████╗   ║
║     ██╔══██╗██╔══██╗██╔════╝   ║
║     ██║  ██║██████╔╝███████╗   ║
║     ██║  ██║██╔═══╝ ╚════██║   ║
║     ██████╔╝██║     ███████║   ║
║     ╚═════╝ ╚═╝     ╚══════╝   ║
╚════════════════════════════════╝</pre>

			<div class="login-subtitle">
				<span class="text-dim">IT Management</span>
				<span class="text-cyan">v2.0.0</span>
			</div>

			{#if error}
				<div class="error-box">
					<span class="error-prefix">[ERR]</span>
					{error}
				</div>
			{/if}

			{#if data.needsSetup}
				<form onsubmit={(e) => { e.preventDefault(); handleSetup(); }}>
					<div class="setup-notice">
						<span class="text-amber">[SETUP]</span> Initial configuration required
					</div>

					<div class="input-group">
						<label for="newPassword">
							<span class="prompt">new_password:</span>
						</label>
						<input
							type="password"
							id="newPassword"
							bind:value={newPassword}
							class="terminal-input"
							required
						/>
					</div>

					<div class="input-group">
						<label for="confirmPassword">
							<span class="prompt">confirm:</span>
						</label>
						<input
							type="password"
							id="confirmPassword"
							bind:value={confirmPassword}
							class="terminal-input"
							required
						/>
					</div>

					<button type="submit" disabled={loading} class="submit-btn">
						{#if loading}
							<span class="terminal-spinner"></span> Configuring...
						{:else}
							[EXECUTE] Set Password
						{/if}
					</button>
				</form>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
					<div class="input-group">
						<label for="password">
							<span class="prompt">password:</span>
						</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							class="terminal-input"
							required
							autofocus
						/>
					</div>

					<button type="submit" disabled={loading} class="submit-btn">
						{#if loading}
							<span class="terminal-spinner"></span> Authenticating...
						{:else}
							[LOGIN]
						{/if}
					</button>
				</form>
			{/if}

			<div class="login-footer">
				<span class="text-muted">Press Enter to submit</span>
			</div>
		</div>
	</div>
</div>

<style>
	.login-terminal {
		min-height: 100vh;
		background: var(--terminal-bg);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Boot screen */
	.boot-screen {
		position: fixed;
		inset: 0;
		background: var(--terminal-bg);
		padding: 40px;
		overflow: hidden;
		transition: opacity 0.3s ease;
	}

	.boot-screen.hidden {
		opacity: 0;
		pointer-events: none;
	}

	.boot-output {
		font-size: 13px;
		line-height: 1.6;
	}

	.boot-line {
		color: var(--terminal-green);
		white-space: pre;
	}

	.cursor-blink {
		color: var(--terminal-cyan);
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		0%, 50% { opacity: 1; }
		51%, 100% { opacity: 0; }
	}

	/* Login container */
	.login-container {
		opacity: 0;
		transform: translateY(10px);
		transition: all 0.4s ease;
	}

	.login-container.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.login-box {
		width: 100%;
		max-width: 400px;
		padding: 32px;
		border: 1px solid var(--terminal-border);
		background: var(--terminal-bg-alt);
	}

	.ascii-logo {
		font-size: 9px;
		line-height: 1.2;
		color: var(--terminal-cyan);
		text-shadow: 0 0 20px rgba(0, 255, 242, 0.3);
		margin: 0 0 16px 0;
		text-align: center;
	}

	.login-subtitle {
		text-align: center;
		font-size: 12px;
		margin-bottom: 24px;
		display: flex;
		justify-content: center;
		gap: 12px;
	}

	.error-box {
		padding: 12px;
		margin-bottom: 16px;
		border: 1px solid var(--terminal-red);
		background: rgba(255, 51, 102, 0.1);
		font-size: 12px;
		color: var(--terminal-red);
	}

	.error-prefix {
		font-weight: bold;
		margin-right: 8px;
	}

	.setup-notice {
		padding: 12px;
		margin-bottom: 16px;
		border: 1px solid var(--terminal-amber);
		background: rgba(255, 184, 0, 0.1);
		font-size: 12px;
		color: var(--terminal-amber);
	}

	.input-group {
		margin-bottom: 16px;
	}

	.input-group label {
		display: block;
		margin-bottom: 6px;
	}

	.prompt {
		color: var(--terminal-dim);
		font-size: 12px;
	}

	.terminal-input {
		width: 100%;
		padding: 10px 14px;
		background: var(--terminal-bg);
		border: 1px solid var(--terminal-border);
		color: var(--terminal-text);
		font-size: 14px;
	}

	.terminal-input:focus {
		border-color: var(--terminal-cyan);
		outline: none;
		box-shadow: 0 0 0 1px var(--terminal-cyan), 0 0 15px rgba(0, 255, 242, 0.2);
	}

	.submit-btn {
		width: 100%;
		padding: 12px;
		margin-top: 8px;
		background: transparent;
		border: 1px solid var(--terminal-cyan);
		color: var(--terminal-cyan);
		font-size: 13px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 1px;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.submit-btn:hover:not(:disabled) {
		background: var(--terminal-cyan);
		color: var(--terminal-bg);
		box-shadow: 0 0 20px rgba(0, 255, 242, 0.3);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.terminal-spinner::before {
		content: '⠋';
		animation: spin 0.8s steps(1) infinite;
	}

	@keyframes spin {
		0% { content: '⠋'; }
		12.5% { content: '⠙'; }
		25% { content: '⠹'; }
		37.5% { content: '⠸'; }
		50% { content: '⠼'; }
		62.5% { content: '⠴'; }
		75% { content: '⠦'; }
		87.5% { content: '⠧'; }
	}

	.login-footer {
		margin-top: 20px;
		text-align: center;
		font-size: 11px;
	}

	/* Colors */
	.text-cyan { color: var(--terminal-cyan); }
	.text-amber { color: var(--terminal-amber); }
	.text-dim { color: var(--terminal-dim); }
	.text-muted { color: var(--terminal-muted); }
</style>
