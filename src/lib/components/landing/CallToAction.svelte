<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
</script>

<section class="pb-16">
	<Card className="bg-primary text-primary-foreground">
		<CardContent className="flex flex-col items-start gap-6 p-10 md:flex-row md:items-center md:justify-between">
			<div class="space-y-3">
				<h2 class="text-3xl font-semibold">Ready to build on Mamuf?</h2>
				<p class="max-w-xl text-sm text-primary-foreground/80">
					Ship your next product with a starter kit that keeps architecture decisions out of the way.
				</p>
			</div>
			<Button as="a" href="/" variant="secondary" size="lg">
				Start crafting
			</Button>
		</CardContent>
	</Card>
</section>
