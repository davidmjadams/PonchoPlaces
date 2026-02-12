<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import Input from '$lib/components/ui/input.svelte';

	type Props = {
		form?: {
			error?: string;
		};
	};

	let { form }: Props = $props();
</script>

<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
	<Card>
		<CardHeader>
			<CardTitle>Sign up</CardTitle>
			<CardDescription>Create an account to continue.</CardDescription>
		</CardHeader>
		<CardContent>
			<form class="space-y-4" method="POST">
				<label class="block space-y-2">
					<div class="text-sm font-medium">Email</div>
					<Input type="email" name="email" autocomplete="email" required />
				</label>

				<label class="block space-y-2">
					<div class="text-sm font-medium">Password</div>
					<Input type="password" name="password" autocomplete="new-password" required />
				</label>

				{#if form?.error}
					<p class="text-sm text-destructive" role="alert" data-testid="signup-error">
						{form.error}
					</p>
				{/if}

				<Button type="submit" className="w-full">Create account</Button>
			</form>

			<Button as="a" href="/login" variant="secondary" className="mt-4 w-full">
				Back to login
			</Button>
		</CardContent>
	</Card>
</main>

