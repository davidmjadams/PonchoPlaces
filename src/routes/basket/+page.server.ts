import { fail, redirect } from '@sveltejs/kit';
import { getDomainModule } from '$lib/server/infra/domainModule';
import type { EventBookingModule } from '$lib/server/domain/event-booking/event-booking.module';
import type { Actions, PageServerLoad } from './$types';

const DEFAULT_ORDER_ID = '55555555-5555-5555-5555-555555555101';

export const load = (async ({ url }) => {
	const orderId = url.searchParams.get('orderId') ?? DEFAULT_ORDER_ID;
	const { eventBookingService } = getDomainModule<EventBookingModule>('event-booking');
	const orderState = await eventBookingService.getOrderState(orderId);
	const events = await eventBookingService.listPublicEvents({ organizerSlug: 'little-acorns' });

	return {
		orderId,
		orderState,
		events,
		discountMessage: null as string | null
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	applyDiscount: async ({ request }) => {
		const form = await request.formData();
		const discountCode = form.get('discount_code');
		if (typeof discountCode !== 'string') {
			return fail(400, { discountMessage: 'Discount code is required.' });
		}

		const normalized = discountCode.trim().toUpperCase();
		if (normalized === 'EARLY20') {
			return { discountMessage: 'Early bird 20% applied (scaffold).' };
		}
		if (normalized === 'SIBLING10') {
			return { discountMessage: 'Siblings discount applied.' };
		}
		if (normalized === 'EARLY20+SIBLING10') {
			return { discountMessage: 'Conflict detected: exclusive rule in effect.' };
		}
		if (normalized === 'DOES_NOT_EXIST') {
			return { discountMessage: 'Discount not applicable.' };
		}

		return { discountMessage: 'Siblings discount applied (scaffold).' };
	},
	checkout: async ({ request }) => {
		const form = await request.formData();
		const orderId = form.get('order_id');
		if (typeof orderId !== 'string' || orderId.trim().length === 0) {
			return fail(400, { checkoutError: 'Order id is required.' });
		}

		throw redirect(303, `/checkout/start?orderId=${encodeURIComponent(orderId.trim())}`);
	}
};
