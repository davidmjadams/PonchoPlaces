import { getDomainModule } from '$lib/server/infra/domainModule';
import type { EventBookingModule } from '$lib/server/domain/event-booking/event-booking.module';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { eventBookingService } = getDomainModule<EventBookingModule>('event-booking');
	const events = await eventBookingService.listPublicEvents({ organizerSlug: params.organizerSlug });
	const bookings = await eventBookingService.listOrganizerBookings(params.organizerSlug);

	return {
		organizerSlug: params.organizerSlug,
		events,
		bookings
	};
}) satisfies PageServerLoad;
