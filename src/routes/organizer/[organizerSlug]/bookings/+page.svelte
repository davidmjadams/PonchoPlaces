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
			message?: string;
		};
	};

	let { data, form }: Props = $props();
</script>

<main class="mx-auto max-w-4xl space-y-6 p-6">
	<section>
		<h1 class="text-2xl font-semibold tracking-tight">Bookings</h1>
		<p class="text-sm text-muted-foreground">Organizer: {data.organizerSlug}</p>
	</section>

	{#if data.bookings.length === 0}
		<p class="text-sm text-muted-foreground">No bookings yet.</p>
	{:else}
		<ul class="space-y-3">
			{#each data.bookings as booking (booking.id)}
				<li>
					<Card>
						<CardHeader>
							<CardTitle>{booking.bookingReference}</CardTitle>
							<CardDescription>{booking.attendeeName} · {booking.state}</CardDescription>
						</CardHeader>
						<CardContent>
							<form method="POST" action="?/refundAttendee" class="flex items-center gap-2">
								<input type="hidden" name="booking_id" value={booking.id} />
								<Button type="submit" variant="secondary">Refund attendee</Button>
								<span class="text-sm text-muted-foreground">Partial refund</span>
							</form>
						</CardContent>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}

	{#if form?.error}
		<p class="text-sm text-destructive">{form.error}</p>
	{/if}
	{#if form?.message}
		<p class="text-sm text-muted-foreground">{form.message}</p>
	{/if}
</main>
