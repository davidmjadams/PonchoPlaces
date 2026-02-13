import { getDomainModule } from '$lib/server/infra/domainModule';
import type { EventBookingModule } from '$lib/server/domain/event-booking/event-booking.module';
import type { PageServerLoad } from './$types';

export const load = (async ({ url }) => {
	const orderId = url.searchParams.get('orderId');
	const status = url.searchParams.get('status') ?? 'unknown';

	let orderState: string | null = null;
	if (orderId) {
		const { eventBookingService } = getDomainModule<EventBookingModule>('event-booking');
		orderState = await eventBookingService.getOrderState(orderId);
	}

	return {
		status,
		orderId,
		orderState,
		isOrderKnown: orderId !== null && orderState !== null
	};
}) satisfies PageServerLoad;
