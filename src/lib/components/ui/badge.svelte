<script lang="ts">
	import { cva, type VariantProps } from 'class-variance-authority';
	import { cn } from '$lib/utils';

	const badgeVariants = cva(
		'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
		{
			variants: {
				variant: {
					default: 'border-transparent bg-primary text-primary-foreground',
					secondary: 'border-transparent bg-secondary text-secondary-foreground',
					outline: 'text-foreground'
				}
			},
			defaultVariants: {
				variant: 'default'
			}
		}
	);

	type BadgeVariants = VariantProps<typeof badgeVariants>;

	export let variant: BadgeVariants['variant'] = 'default';
	export let className = '';
</script>

<div class={cn(badgeVariants({ variant }), className)}>
	<slot />
</div>
