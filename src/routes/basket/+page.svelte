<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import Input from '$lib/components/ui/input.svelte';

	type EventSummary = {
		id: string;
		organizerName: string;
		title: string;
	};

	type Props = {
		data: {
			orderId: string;
			orderState: string | null;
			events: EventSummary[];
			discountMessage: string | null;
		};
		form?: {
			discountMessage?: string;
			checkoutError?: string;
		};
	};

	let { data, form }: Props = $props();
</script>

<main class="mx-auto max-w-3xl space-y-6 p-6">
	<Card>
		<CardHeader>
			<CardTitle>Basket</CardTitle>
			<CardDescription>
				Order {data.orderId} · state <span class="font-medium">{data.orderState ?? 'draft'}</span>
			</CardDescription>
		</CardHeader>
		<CardContent className="space-y-4">
			<p class="text-sm text-muted-foreground">
				2 events in basket · Single organizer per basket (V1/V2 scaffold).
			</p>
			<p class="text-sm text-muted-foreground">2 attendees</p>
			<ul class="space-y-1 text-sm">
				{#each data.events.slice(0, 2) as event (event.id)}
					<li>{event.title} · {event.organizerName}</li>
				{/each}
			</ul>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Discounts</CardTitle>
			<CardDescription>Early bird, siblings, and tiered group pricing scaffolds.</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/applyDiscount" class="flex gap-2" data-testid="basket-discount">
				<Input name="discount_code" placeholder="EARLY20" />
				<Button type="submit" variant="secondary">Apply</Button>
			</form>
			{#if form?.discountMessage}
				<p class="mt-3 text-sm text-muted-foreground">{form.discountMessage}</p>
			{/if}
			<p class="mt-2 text-sm text-muted-foreground">Discounts are non-combinable in V2.</p>
			<p class="mt-3 text-sm text-muted-foreground">
				Rule engine evaluation (V3 scaffold): priority and conflict handling are TODO.
			</p>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Checkout</CardTitle>
			<CardDescription>Redirect hosted checkout with PonchoPay.</CardDescription>
		</CardHeader>
		<CardContent className="space-y-3">
			<form method="POST" action="?/checkout">
				<input type="hidden" name="order_id" value={data.orderId} />
				<Button type="submit">Checkout with PonchoPay</Button>
			</form>
			{#if form?.checkoutError}
				<p class="text-sm text-destructive">{form.checkoutError}</p>
			{/if}
		</CardContent>
	</Card>
</main>
