<script lang="ts">
	import Badge from '$lib/components/ui/badge.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	const steps = [
		{
			title: 'Clone and configure',
			copy: 'Duplicate the repo, set environment variables, and start the dev server.'
		},
		{
			title: 'Model your data',
			copy: 'Add Drizzle schemas and run the migration scripts to align your database.'
		},
		{
			title: 'Ship polished UI',
			copy: 'Compose landing pages, dashboards, and flows with the shadcn component kit.'
		}
	];
</script>

<section id="getting-started" class="space-y-8">
	<div class="flex flex-col gap-3">
		<Badge variant="secondary" className="w-fit">Getting started</Badge>
		<h2 class="text-3xl font-semibold">A clear path from setup to launch.</h2>
		<p class="max-w-2xl text-muted-foreground">
			Focus on your product while Mamuf handles the scaffolding and structure.
		</p>
	</div>
	<div class="grid gap-6 lg:grid-cols-3">
		{#each steps as step, index}
			<Card>
				<CardHeader>
					<CardTitle>
						<span class="text-muted-foreground">0{index + 1}.</span>
						<span class="ml-2">{step.title}</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground">{step.copy}</p>
				</CardContent>
			</Card>
		{/each}
	</div>
</section>
