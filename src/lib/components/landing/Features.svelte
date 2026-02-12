<script lang="ts">
	import Badge from '$lib/components/ui/badge.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	const features = [
		{
			title: 'SvelteKit-ready structure',
			description:
				'Keep routes, layouts, and server logic organized with a clean, scalable project layout.'
		},
		{
			title: 'Database-first workflows',
			description:
				'Built-in Drizzle tooling keeps migrations, schemas, and local testing aligned from day one.'
		},
		{
			title: 'Shadcn UI system',
			description:
				'Composable UI components with consistent tokens, typography, and spacing.'
		},
		{
			title: 'Production-friendly defaults',
			description:
				'Environment configs, linting hooks, and deploy-ready scripts reduce setup overhead.'
		}
	];
</script>

<section id="components" class="space-y-8">
	<div class="flex flex-col gap-3">
		<Badge variant="outline" className="w-fit">Why Mamuf</Badge>
		<h2 class="text-3xl font-semibold">Everything you need to ship faster.</h2>
		<p class="max-w-2xl text-muted-foreground">
			A curated stack that removes the setup grind and gives you a clean launchpad for any product.
		</p>
	</div>
	<div class="grid gap-6 md:grid-cols-2">
		{#each features as feature}
			<Card>
				<CardHeader>
					<CardTitle>{feature.title}</CardTitle>
					<CardDescription>{feature.description}</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="h-1 w-12 rounded-full bg-primary/80"></div>
				</CardContent>
			</Card>
		{/each}
	</div>
</section>
