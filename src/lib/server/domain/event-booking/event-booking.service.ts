import { randomUUID } from 'node:crypto';

import type {
	CheckoutSessionResult,
	CreateCheckoutSessionInput,
	EventBookingServicePort,
	EventBookingStorePort,
	PonchoPayWebhookInput,
	PonchoPayWebhookResult
} from './event-booking.ports';

export const createEventBookingService = (deps: {
	eventBookingStore: EventBookingStorePort;
}): EventBookingServicePort => ({
	listPublicEvents: async (input) => await deps.eventBookingStore.listPublicEvents(input),

	getEventDetail: async (input) => await deps.eventBookingStore.findEventDetail(input),

	getOrderState: async (orderId) => {
		const order = await deps.eventBookingStore.findOrderById(orderId);
		return order?.state ?? null;
	},

	getBookingState: async (bookingId) => {
		const booking = await deps.eventBookingStore.findBookingById(bookingId);
		return booking?.state ?? null;
	},

	listOrganizerBookings: async (organizerSlug) =>
		await deps.eventBookingStore.listBookingsByOrganizer(organizerSlug),

	createCheckoutSession: async (input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult> => {
		const order = await deps.eventBookingStore.findOrderById(input.orderId);
		if (!order) {
			throw new Error(`Order not found: ${input.orderId}`);
		}

		// TODO(v1-payments): Replace this with PonchoPay API create-intent/session call.
		// Placeholder shape intentionally mirrors redirect checkout semantics.
		const providerSessionId = `pps_stub_${randomUUID()}`;
		const redirectUrl = `${input.successReturnUrl}&checkoutSessionId=${providerSessionId}`;

		return {
			orderId: input.orderId,
			provider: 'ponchopay',
			providerSessionId,
			redirectUrl
		};
	},

	recordWebhook: async (input: PonchoPayWebhookInput): Promise<PonchoPayWebhookResult> => {
		// TODO(v1-v3-webhooks):
		// - Verify PonchoPay signature once exact signing docs/fields are available.
		// - Persist webhook idempotency keys and reconcile order/booking transitions.
		// - Handle late/out-of-order events against current order state machine.
		void input;
		return {
			providerEventId: input.providerEventId,
			accepted: true,
			message: 'Webhook accepted by scaffold handler'
		};
	}
});

export type EventBookingService = ReturnType<typeof createEventBookingService>;
