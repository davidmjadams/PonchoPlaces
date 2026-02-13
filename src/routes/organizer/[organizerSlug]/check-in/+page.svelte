<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	type Booking = {
		id: string;
		bookingReference: string;
		attendeeName: string;
		state: string;
	};

	type Props = {
		data: {
			organizerSlug: string;
			bookings: Booking[];
		};
		form?: {
			error?: string;
			success?: boolean;
		};
	};

	let { data, form }: Props = $props();
</script>

<main class="mx-auto max-w-4xl space-y-6 p-6">
	<section>
		<h1 class="text-2xl font-semibold tracking-tight">Check-in list</h1>
		<p class="text-sm text-muted-foreground">Organizer: {data.organizerSlug}</p>
	</section>

	<ul class="space-y-3">
		{#each data.bookings as booking (booking.id)}
			<li>
				<Card>
					<CardHeader>
						<CardTitle>{booking.attendeeName}</CardTitle>
						<CardDescription>{booking.bookingReference}</CardDescription>
					</CardHeader>
					<CardContent>
						<form method="POST" action="?/checkIn">
							<input type="hidden" name="booking_id" value={booking.id} />
							<Button type="submit">Mark checked in</Button>
						</form>
					</CardContent>
				</Card>
			</li>
		{/each}
	</ul>

	{#if form?.error}
		<p class="text-sm text-destructive">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="text-sm text-muted-foreground">Check-in saved (scaffold).</p>
	{/if}
</main>
