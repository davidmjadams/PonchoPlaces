<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	type Props = {
		data: {
			organizerSlug: string;
			event: {
				id: string;
				title: string;
				eventType: string;
				capacityTotal: number | null;
				waitlistEnabled: boolean;
			};
		};
		form?: {
			error?: string;
		};
	};

	let { data, form }: Props = $props();
</script>

<main class="mx-auto max-w-3xl p-6">
	<Card>
		<CardHeader>
			<CardTitle>Edit event</CardTitle>
			<CardDescription>
				{data.organizerSlug} · {data.event.id}
			</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="mb-4 text-sm text-muted-foreground">
				Access denied should appear for non-admin/non-editor roles once RBAC gates are wired.
			</p>
			<form method="POST" class="space-y-4">
				<label class="block space-y-2">
					<div class="text-sm font-medium">Title</div>
					<input
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						name="title"
						value={data.event.title}
					/>
				</label>
				<label class="block space-y-2">
					<div class="text-sm font-medium">Event type</div>
					<input
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						name="event_type"
						value={data.event.eventType}
						readonly
					/>
				</label>
				<label class="block space-y-2">
					<div class="text-sm font-medium">Capacity</div>
					<input
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						name="capacity_total"
						type="number"
						min="1"
						value={data.event.capacityTotal ? String(data.event.capacityTotal) : ''}
					/>
				</label>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" name="waitlist_enabled" checked={data.event.waitlistEnabled} />
					Enable waitlist
				</label>
				{#if form?.error}
					<p class="text-sm text-destructive">{form.error}</p>
				{/if}
				<Button type="submit">Save event</Button>
			</form>
		</CardContent>
	</Card>
</main>
