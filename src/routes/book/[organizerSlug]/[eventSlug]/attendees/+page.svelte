<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import Input from '$lib/components/ui/input.svelte';

	type FormField = {
		key: string;
		label: string;
		scope: string;
		required: boolean;
	};

	type EventDetail = {
		title: string;
		organizerName: string;
		eventType: string;
		ticketTypes: Array<{
			id: string;
			name: string;
			pricePence: number;
		}>;
	};

	type Props = {
		data: {
			event: EventDetail;
			parentEmail: string | null;
			formTemplateFields: FormField[];
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
			<CardTitle>Select attendees</CardTitle>
			<CardDescription>
				{data.event.title} · {data.event.organizerName} · {data.event.eventType}
			</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="mb-4 text-sm text-muted-foreground">Use child profile (scaffold) or enter attendee details manually.</p>
			<form method="POST" class="space-y-4" data-testid="booking-capture">
				<div class="grid gap-4 md:grid-cols-2">
					<label class="space-y-2">
						<div class="text-sm font-medium">Parent name</div>
						<Input name="parent_name" required />
					</label>
					<label class="space-y-2">
						<div class="text-sm font-medium">Parent email</div>
						<input
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							type="email"
							name="parent_email"
							required
							value={data.parentEmail ?? ''}
							data-testid="parent-email-input"
						/>
					</label>
				</div>

				<div class="rounded-md border p-4">
					<h2 class="text-sm font-semibold">Attendee 1</h2>
					<div class="mt-3 grid gap-4 md:grid-cols-2">
						<label class="space-y-2">
							<div class="text-sm font-medium">Name</div>
							<Input name="attendee_1_name" required />
						</label>
						<label class="space-y-2">
							<div class="text-sm font-medium">DOB (optional)</div>
							<Input name="attendee_1_dob" type="date" />
						</label>
					</div>
				</div>

				<div class="rounded-md border p-4">
					<h2 class="text-sm font-semibold">Attendee 2 (optional)</h2>
					<div class="mt-3 grid gap-4 md:grid-cols-2">
						<label class="space-y-2">
							<div class="text-sm font-medium">Name</div>
							<Input name="attendee_2_name" />
						</label>
						<label class="space-y-2">
							<div class="text-sm font-medium">DOB</div>
							<Input name="attendee_2_dob" type="date" />
						</label>
					</div>
				</div>

				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" name="consent_safeguarding" value="true" />
					I agree to safeguarding terms (optional/configurable)
				</label>

				<div class="space-y-2">
					<h3 class="text-sm font-semibold">Available ticket types</h3>
					<ul class="space-y-1 text-sm text-muted-foreground">
						{#each data.event.ticketTypes as ticketType (ticketType.id)}
							<li>{ticketType.name} - GBP {(ticketType.pricePence / 100).toFixed(2)}</li>
						{/each}
					</ul>
				</div>

				{#if form?.error}
					<p class="text-sm text-destructive">{form.error}</p>
				{/if}

				<Button type="submit">Continue to basket</Button>
			</form>
		</CardContent>
	</Card>
</main>
