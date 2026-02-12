<script lang="ts">
	type Item = {
		id: number;
		name: string;
		description: string | null;
	};

	type Props = {
		data: {
			items: Item[];
		};
	};

	let { data }: Props = $props();
</script>

<main class="mx-auto max-w-3xl p-6">
	<h1 class="text-2xl font-semibold tracking-tight">Items</h1>

	{#if data.items.length === 0}
		<p class="mt-4 text-muted-foreground">No items yet.</p>
	{:else}
		<ul class="mt-6 space-y-4">
			{#each data.items as item (item.id)}
				<li class="rounded-lg border p-4">
					<div class="font-medium" data-testid="item-name">{item.name}</div>
					{#if item.description}
						<div class="mt-1 text-sm text-muted-foreground" data-testid="item-description">
							{item.description}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>

