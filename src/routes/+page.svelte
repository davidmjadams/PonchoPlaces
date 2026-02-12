<script lang="ts">
	import CallToAction from '$lib/components/landing/CallToAction.svelte';
	import Features from '$lib/components/landing/Features.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import SetupSteps from '$lib/components/landing/SetupSteps.svelte';
	import Stats from '$lib/components/landing/Stats.svelte';
</script>

<main class="min-h-screen bg-background">
	<div class="container space-y-16 py-12">
		<Hero />
		<Stats />
		<Features />
		<SetupSteps />
		<CallToAction />
		<Footer />
	</div>
</main>
