<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import Input from '$lib/components/ui/input.svelte';

	type Props = {
		data: {
			events: Array<{ id: string; title: string; organizerName: string }>;
		};
		form?: {
			created?: boolean;
			impersonation?: string;
		};
	};

	let { data, form }: Props = $props();
</script>

<main class="mx-auto max-w-5xl space-y-6 p-6">
	<section class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">Organizer management</h1>
		<p class="text-sm text-muted-foreground">
			Role gates are scaffolded. Access denied responses should be enforced by platform admin checks.
		</p>
		<p class="text-sm text-muted-foreground">Access denied</p>
	</section>

	<div class="grid gap-4 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Create organizer</CardTitle>
				<CardDescription>Admin onboarding and tenant setup.</CardDescription>
			</CardHeader>
			<CardContent>
				<form method="POST" action="?/createOrganizer" class="space-y-3" data-testid="organizer-create">
					<Input name="name" placeholder="Little Seeds" />
					<Input name="slug" placeholder="little-seeds" />
					<Button type="submit">Create organizer</Button>
				</form>
				{#if form?.created}
					<p class="mt-3 text-sm text-muted-foreground">Organizer scaffold created.</p>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Admin impersonation</CardTitle>
				<CardDescription>Impersonate user</CardDescription>
			</CardHeader>
			<CardContent>
				<form method="POST" action="?/impersonate" class="space-y-3">
					<Input name="user_email" placeholder="parent1@example.com" />
					<Button type="submit" variant="secondary">Impersonate user</Button>
				</form>
				{#if form?.impersonation}
					<p class="mt-3 text-sm text-muted-foreground">Impersonation started</p>
				{/if}
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Moderation queue</CardTitle>
			<CardDescription>Moderate events before/after publication.</CardDescription>
		</CardHeader>
		<CardContent>
			<ul class="space-y-1 text-sm">
				{#each data.events.slice(0, 3) as event (event.id)}
					<li>{event.title} · {event.organizerName}</li>
				{/each}
			</ul>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>B2B account preparation</CardTitle>
			<CardDescription>Future multi-seat account controls.</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="text-sm text-muted-foreground">
				TODO: account hierarchies, purchase orders, cost centers, and delegated approvers.
			</p>
		</CardContent>
	</Card>
</main>
