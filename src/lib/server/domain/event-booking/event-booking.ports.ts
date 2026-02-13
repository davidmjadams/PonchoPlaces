import type {
	BookingState,
	EventBookingBooking,
	EventBookingOrder,
	EventDetail,
	EventSummary,
	OrderState
} from './event-booking.types';

export type ListEventsInput = {
	organizerSlug?: string;
};

export type GetEventDetailInput = {
	organizerSlug: string;
	eventSlug: string;
};

export type CreateCheckoutSessionInput = {
	orderId: string;
	successReturnUrl: string;
	cancelReturnUrl: string;
};

export type CheckoutSessionResult = {
	orderId: string;
	provider: 'ponchopay';
	providerSessionId: string;
	redirectUrl: string;
};

export type PonchoPayWebhookInput = {
	providerEventId: string;
	eventType: string;
	payload: Record<string, unknown>;
};

export type PonchoPayWebhookResult = {
	providerEventId: string;
	accepted: boolean;
	message: string;
};

export interface EventBookingStorePort {
	listPublicEvents(input: ListEventsInput): Promise<EventSummary[]>;
	findEventDetail(input: GetEventDetailInput): Promise<EventDetail | null>;
	findOrderById(orderId: string): Promise<EventBookingOrder | null>;
	findBookingById(bookingId: string): Promise<EventBookingBooking | null>;
	listBookingsByOrganizer(organizerSlug: string): Promise<EventBookingBooking[]>;
}

export interface EventBookingServicePort {
	listPublicEvents(input: ListEventsInput): Promise<EventSummary[]>;
	getEventDetail(input: GetEventDetailInput): Promise<EventDetail | null>;
	getOrderState(orderId: string): Promise<OrderState | null>;
	getBookingState(bookingId: string): Promise<BookingState | null>;
	listOrganizerBookings(organizerSlug: string): Promise<EventBookingBooking[]>;
	createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult>;
	recordWebhook(input: PonchoPayWebhookInput): Promise<PonchoPayWebhookResult>;
}
