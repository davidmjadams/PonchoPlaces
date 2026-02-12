<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	type Props = {
		data: {
			user: {
				id: string;
				email: string | null;
			} | null;
		};
		children: import('svelte').Snippet;
	};

	let { data, children }: Props = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="border-b bg-background">
	<div class="container flex h-14 items-center justify-between">
		<a href="/" class="text-sm font-semibold">mamuf</a>

		<nav class="flex items-center gap-4">
			{#if data.user}
				<a href="/logout" class="text-sm font-medium" data-testid="header-logout">Logout</a>
			{:else}
				<a href="/login" class="text-sm font-medium" data-testid="header-login">Login</a>
			{/if}
		</nav>
	</div>
</header>

{@render children()}
