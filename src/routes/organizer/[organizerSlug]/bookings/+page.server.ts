import { fail } from '@sveltejs/kit';
import { getDomainModule } from '$lib/server/infra/domainModule';
import type { EventBookingModule } from '$lib/server/domain/event-booking/event-booking.module';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { eventBookingService } = getDomainModule<EventBookingModule>('event-booking');
	const bookings = await eventBookingService.listOrganizerBookings(params.organizerSlug);

	return {
		organizerSlug: params.organizerSlug,
		bookings
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	refundAttendee: async ({ request }) => {
		const form = await request.formData();
		const bookingId = form.get('booking_id');
		if (typeof bookingId !== 'string' || bookingId.trim().length === 0) {
			return fail(400, { error: 'booking_id is required.' });
		}

		// TODO(v2-refunds): call domain service to create per-attendee refund and PonchoPay refund request.
		return {
			success: true,
			message: 'Partial refund scaffold created.'
		};
	}
};
