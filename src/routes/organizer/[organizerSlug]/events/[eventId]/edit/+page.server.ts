import { fail, redirect } from '@sveltejs/kit';
import { getDomainModule } from '$lib/server/infra/domainModule';
import type { EventBookingModule } from '$lib/server/domain/event-booking/event-booking.module';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { eventBookingService } = getDomainModule<EventBookingModule>('event-booking');
	const events = await eventBookingService.listPublicEvents({ organizerSlug: params.organizerSlug });
	const event = events.find((row) => row.id === params.eventId) ?? null;

	if (!event) throw redirect(303, `/organizer/${params.organizerSlug}/dashboard`);

	return {
		organizerSlug: params.organizerSlug,
		event
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ params, request }) => {
		const form = await request.formData();
		const title = form.get('title');
		if (typeof title !== 'string' || title.trim().length === 0) {
			return fail(400, { error: 'Title is required.' });
		}

		// TODO(v1-v3-organizer): persist event edits and enforce role permissions via RLS.
		throw redirect(
			303,
			`/organizer/${params.organizerSlug}/events/${params.eventId}/edit?saved=true`
		);
	}
};
