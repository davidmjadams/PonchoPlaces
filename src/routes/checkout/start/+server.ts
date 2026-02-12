import { error, redirect } from '@sveltejs/kit';
import { getDomainModule } from '$lib/server/infra/domainModule';
import type { EventBookingModule } from '$lib/server/domain/event-booking/event-booking.module';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const orderId = url.searchParams.get('orderId');
	if (!orderId) {
		throw error(400, 'Missing orderId query parameter');
	}

	const successReturnUrl = `${url.origin}/checkout/return?status=success&orderId=${encodeURIComponent(orderId)}`;
	const cancelReturnUrl = `${url.origin}/checkout/return?status=cancel&orderId=${encodeURIComponent(orderId)}`;

	const { eventBookingService } = getDomainModule<EventBookingModule>('event-booking');
	const checkoutSession = await eventBookingService.createCheckoutSession({
		orderId,
		successReturnUrl,
		cancelReturnUrl
	});

	// TODO(v1-payments): redirect to real PonchoPay hosted checkout URL.
	// This scaffold uses a deterministic local redirect URL for E2E wiring.
	throw redirect(303, checkoutSession.redirectUrl);
};
