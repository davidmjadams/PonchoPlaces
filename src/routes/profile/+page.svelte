<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';

	type Props = {
		data: {
			profile: {
				id: string;
				name: string | null;
				description: string | null;
			};
		};
		form?: {
			error?: string;
			success?: boolean;
		};
	};

	let { data, form }: Props = $props();
</script>

<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
	<Card>
		<CardHeader>
			<CardTitle>Your profile</CardTitle>
			<CardDescription>This is optional. You can fill it in now or later.</CardDescription>
		</CardHeader>
		<CardContent>
			<form class="space-y-4" method="POST" action="?/save">
				<label class="block space-y-2">
					<div class="text-sm font-medium">Name</div>
					<input
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						type="text"
						name="name"
						autocomplete="name"
						value={data.profile.name ?? ''}
						data-testid="profile-name"
					/>
				</label>

				<label class="block space-y-2">
					<div class="text-sm font-medium">Description</div>
					<textarea
						class="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						name="description"
						rows="4"
						data-testid="profile-description"
					>{data.profile.description ?? ''}</textarea>
				</label>

				{#if form?.error}
					<p class="text-sm text-destructive" role="alert" data-testid="profile-error">
						{form.error}
					</p>
				{/if}
				{#if form?.success}
					<p class="text-sm text-green-600" role="status" data-testid="profile-success">
						Saved.
					</p>
				{/if}

				<Button type="submit" className="w-full">Save</Button>
			</form>

			<Button as="a" href="/restricted-items" variant="secondary" className="mt-4 w-full">
				Continue
			</Button>
		</CardContent>
	</Card>
</main>

