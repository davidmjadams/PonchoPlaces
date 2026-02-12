<script lang="ts">
	import { cn } from '$lib/utils';

	export let className = '';
</script>

<h3 class={cn('text-lg font-semibold leading-none tracking-tight', className)}>
	<slot />
</h3>
