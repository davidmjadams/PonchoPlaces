<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	type Props = {
		data: {
			status: string;
			orderId: string | null;
			orderState: string | null;
		};
	};

	let { data }: Props = $props();
</script>

<main class="mx-auto flex min-h-[70vh] max-w-xl items-center p-6">
	<Card className="w-full">
		<CardHeader>
			<CardTitle>Checkout return</CardTitle>
			<CardDescription>
				Status: <span class="font-medium">{data.status}</span>
			</CardDescription>
		</CardHeader>
		<CardContent className="space-y-3">
			{#if data.status === 'success'}
				{#if data.orderState === 'paid' || data.orderState === 'partially_refunded'}
					<p>Booking confirmed.</p>
				{:else}
					<p>Processing payment confirmation. We are waiting for final webhook confirmation.</p>
					<p class="text-sm text-muted-foreground">Booking confirmed once webhook processing completes.</p>
				{/if}
			{:else if data.status === 'cancel'}
				<p>Payment not completed.</p>
			{:else}
				<p>Unknown return status. Please check your bookings or contact support.</p>
			{/if}

			{#if data.orderId}
				<p class="text-sm text-muted-foreground">Order: {data.orderId}</p>
			{/if}
			<p class="text-sm text-muted-foreground">
				Webhooks are authoritative; return page is eventual-consistency friendly.
			</p>

			<div class="flex gap-2">
				<Button as="a" href="/basket" variant="secondary">Back to basket</Button>
				<Button as="a" href="/events">Browse events</Button>
			</div>
		</CardContent>
	</Card>
</main>
