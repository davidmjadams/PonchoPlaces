<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	type Props = {
		data: {
			entries: Array<{
				id: string;
				action: string;
				correlationId: string;
				occurredAt: string;
			}>;
		};
	};

	let { data }: Props = $props();
</script>

<main class="mx-auto max-w-4xl space-y-6 p-6">
	<section class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">Audit log</h1>
		<p class="text-sm text-muted-foreground">correlation_id indexed for reconciliation lookups.</p>
	</section>

	<Card>
		<CardHeader>
			<CardTitle>Recent entries</CardTitle>
			<CardDescription>Admin and payment events</CardDescription>
		</CardHeader>
		<CardContent>
			<ul class="space-y-2 text-sm">
				{#each data.entries as entry (entry.id)}
					<li class="rounded-md border p-3">
						<div class="font-medium">{entry.action}</div>
						<div class="text-muted-foreground">
							correlation_id: {entry.correlationId} · {entry.occurredAt}
						</div>
					</li>
				{/each}
			</ul>
		</CardContent>
	</Card>
</main>
