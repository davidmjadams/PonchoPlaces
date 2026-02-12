import { fail, redirect } from '@sveltejs/kit';
import { getDomainModule } from '$lib/server/infra/domainModule';
import type { EventBookingModule } from '$lib/server/domain/event-booking/event-booking.module';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { eventBookingService } = getDomainModule<EventBookingModule>('event-booking');
	const event = await eventBookingService.getEventDetail({
		organizerSlug: params.organizerSlug,
		eventSlug: params.eventSlug
	});

	if (!event) {
		throw redirect(303, '/events');
	}

	return {
		event,
		formTemplateFields: [
			{ key: 'parent_name', label: 'Parent name', scope: 'booking', required: true },
			{ key: 'parent_email', label: 'Parent email', scope: 'booking', required: true },
			{ key: 'attendee_name', label: 'Attendee name', scope: 'attendee', required: true },
			{ key: 'attendee_dob', label: 'Attendee DOB', scope: 'attendee', required: false },
			{ key: 'consent_safeguarding', label: 'Safeguarding consent', scope: 'booking', required: false }
		]
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const parentEmail = form.get('parent_email');
		const attendeeOneName = form.get('attendee_1_name');

		if (typeof parentEmail !== 'string' || parentEmail.trim().length === 0) {
			return fail(400, { error: 'Parent email is required.' });
		}
		if (typeof attendeeOneName !== 'string' || attendeeOneName.trim().length === 0) {
			return fail(400, { error: 'At least one attendee is required.' });
		}

		// TODO(v1-basket): Persist attendee selections and form responses into basket/order tables.
		throw redirect(303, '/basket');
	}
};
