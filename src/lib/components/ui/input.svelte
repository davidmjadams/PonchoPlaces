<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLInputAttributes } from 'svelte/elements';

	export let className = '';
	export let type: HTMLInputAttributes['type'] = 'text';
	export let name: HTMLInputAttributes['name'] = undefined;
	export let id: HTMLInputAttributes['id'] = undefined;
	export let autocomplete: HTMLInputAttributes['autocomplete'] = undefined;
	export let placeholder: HTMLInputAttributes['placeholder'] = undefined;
	export let required: HTMLInputAttributes['required'] = false;
	export let disabled: HTMLInputAttributes['disabled'] = false;
</script>

<input
	{type}
	{name}
	{id}
	{autocomplete}
	{placeholder}
	{required}
	{disabled}
	class={cn(
		'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
/>

