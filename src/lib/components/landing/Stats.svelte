<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	const stats = [
		{
			label: 'Setup time',
			value: '< 10 min'
		},
		{
			label: 'Opinionated defaults',
			value: '100%'
		},
		{
			label: 'Reusable UI pieces',
			value: '20+'
		}
	];
</script>

<section class="grid gap-6 md:grid-cols-3">
	{#each stats as stat}
		<Card>
			<CardHeader>
				<CardTitle className="text-2xl">{stat.value}</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">{stat.label}</p>
			</CardContent>
		</Card>
	{/each}
</section>
