<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
</script>

<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
	<Card>
		<CardHeader>
			<CardTitle>Account created</CardTitle>
			<CardDescription>You’re signed in and ready to go.</CardDescription>
		</CardHeader>
		<CardContent className="space-y-4">
			<Button as="a" href="/profile" variant="secondary" className="w-full">
				Complete profile (optional)
			</Button>
			<Button as="a" href="/restricted-items" className="w-full">Continue</Button>
			<Button as="a" href="/" variant="secondary" className="w-full">Home</Button>
		</CardContent>
	</Card>
</main>

