<script lang="ts">
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
</script>

<section class="relative overflow-hidden rounded-3xl border bg-card px-6 py-16 shadow-sm">
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.15),_transparent_55%)]"></div>
	<div class="relative z-10 flex flex-col gap-8">
		<Badge variant="secondary" className="w-fit">Mamuf Starter Pack</Badge>
		<div class="space-y-4">
			<h1 class="text-4xl font-semibold leading-tight md:text-5xl">
				Use Mamuf to launch full-stack SvelteKit apps with a modern, batteries-included foundation.
			</h1>
			<p class="max-w-2xl text-base text-muted-foreground md:text-lg">
				Mamuf gives you the essentials: SvelteKit, database tooling, and opinionated UI building blocks
				so you can move from idea to deployment fast.
			</p>
		</div>
		<div class="flex flex-wrap gap-4">
			<Button as="a" href="#getting-started">Explore the starter</Button>
			<Button as="a" href="#components" variant="outline">
				View components
			</Button>
		</div>
	</div>
</section>
