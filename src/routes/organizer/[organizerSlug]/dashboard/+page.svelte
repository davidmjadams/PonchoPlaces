<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	type Props = {
		data: {
			organizerSlug: string;
			events: Array<{ id: string; title: string }>;
			bookings: Array<{ id: string; bookingReference: string; attendeeName: string }>;
		};
	};

	let { data }: Props = $props();
</script>

<main class="mx-auto max-w-5xl space-y-6 p-6">
	<section class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">Organizer dashboard</h1>
		<p class="text-sm text-muted-foreground">Tenant: {data.organizerSlug}</p>
	</section>

	<div class="grid gap-4 md:grid-cols-3">
		<Card>
			<CardHeader>
				<CardTitle>Events</CardTitle>
				<CardDescription>Published event records</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-semibold">{data.events.length}</div>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<CardTitle>Bookings</CardTitle>
				<CardDescription>Confirmed and reserved bookings</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-semibold">{data.bookings.length}</div>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<CardTitle>Reporting stub</CardTitle>
				<CardDescription>CSV export is not implemented yet</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">Use API/reporting adapters in V4+.</p>
			</CardContent>
		</Card>
	</div>

	<nav class="flex flex-wrap gap-3 text-sm">
		<a class="underline underline-offset-4" href={`/organizer/${data.organizerSlug}/events/new`}>Create event</a>
		<a class="underline underline-offset-4" href={`/organizer/${data.organizerSlug}/bookings`}>Bookings</a>
		<a class="underline underline-offset-4" href={`/organizer/${data.organizerSlug}/check-in`}>Check-in list</a>
	</nav>
</main>
