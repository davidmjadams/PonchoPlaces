<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	type EventSummary = {
		id: string;
		organizerSlug: string;
		organizerName: string;
		slug: string;
		title: string;
		description: string;
		eventType: string;
		timezone: string;
		locationName: string | null;
		startsAt: string | null;
		endsAt: string | null;
		capacityTotal: number | null;
		confirmedAttendeeCount: number;
		waitlistEnabled: boolean;
	};

	type Props = {
		data: {
			events: EventSummary[];
			organizerSlug: string | null;
		};
	};

	let { data }: Props = $props();
</script>

<main class="mx-auto max-w-5xl space-y-6 p-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">Browse events</h1>
		<p class="text-sm text-muted-foreground">
			{#if data.organizerSlug}
				Filtered by organizer: <span class="font-medium">{data.organizerSlug}</span>
			{:else}
				All published organizers and events.
			{/if}
		</p>
	</div>

	{#if data.events.length === 0}
		<p class="text-muted-foreground">No published events found.</p>
	{:else}
		<ul class="grid gap-4 md:grid-cols-2">
			{#each data.events as event (event.id)}
				<li data-testid="event-card" data-organizer-slug={event.organizerSlug} data-event-slug={event.slug}>
					<Card>
						<CardHeader>
							<CardTitle>{event.title}</CardTitle>
							<CardDescription>
								{event.organizerName} · {event.eventType} · {event.timezone}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<p class="text-sm text-muted-foreground">{event.description}</p>
							<p class="text-sm">
								Location:
								<span class="font-medium">{event.locationName ?? 'Online / TBD'}</span>
							</p>
							<p class="text-sm">
								Capacity:
								<span class="font-medium">{event.confirmedAttendeeCount}/{event.capacityTotal ?? 'unlimited'}</span>
							</p>
							<a
								data-testid="event-detail-link"
								data-organizer-slug={event.organizerSlug}
								data-event-slug={event.slug}
								class="text-sm font-medium text-primary underline underline-offset-4"
								href={`/events/${event.organizerSlug}/${event.slug}`}
							>
								View event
							</a>
						</CardContent>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}
</main>
