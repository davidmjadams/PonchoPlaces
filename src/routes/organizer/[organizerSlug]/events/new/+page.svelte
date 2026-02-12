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
			organizerSlug: string;
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
			<CardTitle>Create event</CardTitle>
			<CardDescription>Organizer: {data.organizerSlug}</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="mb-4 text-sm text-muted-foreground">Configure event type, capacity, and starter ticket type.</p>
			<form method="POST" class="space-y-4" data-testid="organizer-create">
				<label class="block space-y-2">
					<div class="text-sm font-medium">Title</div>
					<Input name="title" required />
				</label>
				<label class="block space-y-2">
					<div class="text-sm font-medium">Slug</div>
					<Input name="slug" placeholder="half-term-camp-2026" />
				</label>
				<label class="block space-y-2">
					<div class="text-sm font-medium">Event type</div>
					<select
						name="event_type"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="single_session">single_session</option>
						<option value="course_multi_session">course_multi_session</option>
						<option value="recurring_drop_in">recurring_drop_in</option>
						<option value="camp_multi_day">camp_multi_day</option>
					</select>
				</label>
				<label class="block space-y-2">
					<div class="text-sm font-medium">Capacity</div>
					<Input name="capacity_total" type="number" min="1" placeholder="20" />
				</label>
				<label class="block space-y-2">
					<div class="text-sm font-medium">Basic ticket type name</div>
					<Input name="ticket_name" placeholder="General Admission" />
				</label>
				<label class="block space-y-2">
					<div class="text-sm font-medium">Basic ticket price (pence)</div>
					<Input name="ticket_price_pence" type="number" min="0" placeholder="1200" />
				</label>
				{#if form?.error}
					<p class="text-sm text-destructive">{form.error}</p>
				{/if}
				<Button type="submit">Create organizer event</Button>
			</form>
		</CardContent>
	</Card>
</main>
