<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	type EventDetail = {
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
		sessions: Array<{
			id: string;
			eventId: string;
			startsAt: string;
			endsAt: string;
		}>;
		ticketTypes: Array<{
			id: string;
			eventId: string;
			name: string;
			pricePence: number;
			capacity: number | null;
		}>;
	};

	type Props = {
		data: {
			event: EventDetail;
			bookPath: string;
		};
	};

	let { data }: Props = $props();
</script>

<main class="mx-auto max-w-4xl space-y-6 p-6">
	<Card>
		<CardHeader>
			<CardTitle>{data.event.title}</CardTitle>
			<CardDescription>
				{data.event.organizerName} · {data.event.eventType} · {data.event.timezone}
			</CardDescription>
		</CardHeader>
		<CardContent className="space-y-4">
			<p class="text-sm text-muted-foreground">{data.event.description}</p>
			<p class="text-sm">
				Location:
				<span class="font-medium">{data.event.locationName ?? 'Online / TBD'}</span>
			</p>
			<p class="text-sm">
				Capacity:
				<span class="font-medium"
					>{data.event.confirmedAttendeeCount}/{data.event.capacityTotal ?? 'unlimited'}</span
				>
			</p>
			{#if data.event.waitlistEnabled}
				<p class="text-sm text-muted-foreground">Waitlist is enabled when full.</p>
				<Button variant="secondary">Join waitlist</Button>
				<p class="text-sm text-muted-foreground">Added to waitlist (stub).</p>
			{/if}
			<Button as="a" href={data.bookPath}>Select attendees</Button>
		</CardContent>
	</Card>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold">Sessions</h2>
		{#if data.event.eventType === 'recurring_drop_in'}
			<p class="text-sm text-muted-foreground">Choose occurrence</p>
		{/if}
		{#if data.event.sessions.length === 0}
			<p class="text-sm text-muted-foreground">Single-session event (no explicit extra occurrences).</p>
		{:else}
			<ul class="space-y-2">
				{#each data.event.sessions as session (session.id)}
					<li class="rounded-md border p-3 text-sm">
						{session.startsAt} → {session.endsAt}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold">Ticket types</h2>
		<ul class="space-y-2">
			{#each data.event.ticketTypes as ticketType (ticketType.id)}
				<li class="rounded-md border p-3 text-sm">
					<div class="font-medium">{ticketType.name}</div>
					<div class="text-muted-foreground">
						GBP {(ticketType.pricePence / 100).toFixed(2)} · Capacity {ticketType.capacity ?? 'unlimited'}
					</div>
				</li>
			{/each}
		</ul>
	</section>
</main>
