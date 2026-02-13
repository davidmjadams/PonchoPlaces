import { error } from '@sveltejs/kit';
import { getDomainModule } from '$lib/server/infra/domainModule';
import type { EventBookingModule } from '$lib/server/domain/event-booking/event-booking.module';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { eventBookingService } = getDomainModule<EventBookingModule>('event-booking');
	const event = await eventBookingService.getEventDetail({
		organizerSlug: params.organizerSlug,
		eventSlug: params.eventSlug
	});

	if (!event) {
		throw error(404, 'Event not found');
	}

	return {
		event,
		bookPath: `/book/${params.organizerSlug}/${params.eventSlug}/attendees`
	};
}) satisfies PageServerLoad;
