<script lang="ts">
	import { cva, type VariantProps } from 'class-variance-authority';
	import { cn } from '$lib/utils';

	const buttonVariants = cva(
		'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background',
		{
			variants: {
				variant: {
					default: 'bg-primary text-primary-foreground hover:bg-primary/90',
					secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
					outline:
						'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
					ghost: 'hover:bg-accent hover:text-accent-foreground',
					link: 'text-primary underline-offset-4 hover:underline'
				},
				size: {
					default: 'h-10 px-4 py-2',
					sm: 'h-9 rounded-md px-3',
					lg: 'h-11 rounded-md px-8'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	type ButtonVariants = VariantProps<typeof buttonVariants>;

	export let variant: ButtonVariants['variant'] = 'default';
	export let size: ButtonVariants['size'] = 'default';
	export let className = '';
	export let as: 'button' | 'a' = 'button';
	export let href: string | undefined = undefined;
	export let type: 'button' | 'submit' | 'reset' = 'button';
</script>

<svelte:element
	this={as}
	class={cn(buttonVariants({ variant, size }), className)}
	href={as === 'a' ? href : undefined}
	type={as === 'button' ? type : undefined}
>
	<slot />
</svelte:element>
