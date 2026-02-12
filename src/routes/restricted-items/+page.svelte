<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	type RestrictedItem = {
		id: number;
		name: string;
		description: string | null;
	};

	type Props = {
		data: {
			restrictedItems: RestrictedItem[];
		};
	};

	let { data }: Props = $props();
</script>

<main class="mx-auto max-w-3xl space-y-6 p-6">
	<Card>
		<CardHeader>
			<CardTitle>Restricted Items</CardTitle>
		</CardHeader>
		<CardContent>
			{#if data.restrictedItems.length === 0}
				<p class="text-muted-foreground">No restricted items yet.</p>
			{:else}
				<ul class="space-y-4">
					{#each data.restrictedItems as item (item.id)}
						<li class="rounded-lg border p-4">
							<div class="font-medium" data-testid="restricted-item-name">{item.name}</div>
							{#if item.description}
								<div class="mt-1 text-sm text-muted-foreground" data-testid="restricted-item-description">
									{item.description}
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</CardContent>
	</Card>
</main>

