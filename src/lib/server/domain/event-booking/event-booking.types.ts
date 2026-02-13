export type EventType = 'single_session' | 'course_multi_session' | 'recurring_drop_in' | 'camp_multi_day';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived';
export type OrderState =
	| 'draft'
	| 'pending_payment'
	| 'paid'
	| 'partially_refunded'
	| 'refunded'
	| 'cancelled';
export type BookingState = 'reserved' | 'confirmed' | 'cancelled';
export type AttendeeSlotState = 'held' | 'confirmed' | 'cancelled';
export type WaitlistState = 'waiting' | 'offered' | 'accepted' | 'expired';

export type EventBookingOrganizer = {
	id: string;
	slug: string;
	name: string;
	timezone: string;
};

export type EventBookingEvent = {
	id: string;
	organizerId: string;
	slug: string;
	title: string;
	description: string;
	eventType: EventType;
	status: EventStatus;
	timezone: string;
	locationName: string | null;
	startsAt: string | null;
	endsAt: string | null;
	capacityTotal: number | null;
	confirmedAttendeeCount: number;
	waitlistEnabled: boolean;
};

export type EventBookingSession = {
	id: string;
	eventId: string;
	startsAt: string;
	endsAt: string;
};

export type EventBookingTicketType = {
	id: string;
	eventId: string;
	name: string;
	pricePence: number;
	capacity: number | null;
};

export type EventBookingOrder = {
	id: string;
	state: OrderState;
	totalPence: number;
	currencyCode: string;
};

export type EventBookingBooking = {
	id: string;
	organizerSlug: string;
	bookingReference: string;
	attendeeName: string;
	state: BookingState;
};

export type EventBookingSeedData = {
	organizers: EventBookingOrganizer[];
	events: EventBookingEvent[];
	sessions: EventBookingSession[];
	ticketTypes: EventBookingTicketType[];
	bookings: EventBookingBooking[];
	orders: EventBookingOrder[];
};

export type EventSummary = {
	id: string;
	organizerSlug: string;
	organizerName: string;
	slug: string;
	title: string;
	description: string;
	eventType: EventType;
	timezone: string;
	locationName: string | null;
	startsAt: string | null;
	endsAt: string | null;
	capacityTotal: number | null;
	confirmedAttendeeCount: number;
	waitlistEnabled: boolean;
};

export type EventDetail = EventSummary & {
	sessions: EventBookingSession[];
	ticketTypes: EventBookingTicketType[];
};
