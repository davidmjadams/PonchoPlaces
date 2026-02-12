@event-booking @v1 @mvp
Feature: Event booking V1 foundations
  Multi-tenant childcare-focused booking with guest and logged-in checkout.

  Background:
    Given the deterministic fixture set "baseline" is loaded
    And the platform timezone is "Europe/London"

  @v1 @multitenant @browse
  Scenario: Customer can browse published events across organizers
    Given I am browsing as a "guest" customer
    When I navigate to "/events"
    Then I should see text "Half Term Camp"
    And I should see text "Little Acorns"
    And I should see text "Riverdale Swim Intro"
    And I should see text "Riverdale Kids"

  @v1 @onboarding @admin @rbac
  Scenario: Platform admin opens organizer management scaffold
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I navigate to "/admin/organizers"
    Then I should see text "Organizer management"
    And I should see text "Create organizer"

  @v1 @organizer @events
  Scenario: Organizer admin opens create event scaffold with single-session defaults
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/events/new"
    Then I should see text "Create event"
    And I should see text "single_session"
    And I should see text "capacity"

  @v1 @browse @event-detail
  Scenario: Customer opens deterministic event detail page
    Given the event "Half Term Camp" with id "11111111-1111-1111-1111-111111111001" exists for organizer "Little Acorns"
    When I navigate to "/events/little-acorns/half-term-camp-2026"
    Then I should see text "Half Term Camp"
    And I should see text "Camp Standard"
    And I should see text "Europe/London"
    And I should see text "Little Acorns Hall"

  @v1 @basket @attendees @guest
  Scenario: Guest adds one event with two attendees to basket
    Given I am browsing as a "guest" customer
    When I navigate to "/book/little-acorns/half-term-camp-2026/attendees"
    And I add attendee rows:
      | attendee_name   | attendee_dob | ticket_type_id                         |
      | Elliot Example  | 2021-05-10   | 33333333-3333-3333-3333-333333333101   |
      | Poppy Example   | 2020-08-21   | 33333333-3333-3333-3333-333333333101   |
    And I complete form "booking-capture" with values:
      | parent_name          | Parent One           |
      | parent_email         | guest1@example.com   |
      | consent_safeguarding | true                 |
    And I submit form "booking-capture"
    Then I should be on "/basket"
    And I should see text "2 attendees"

  @v1 @basket @logged-in
  Scenario: Logged-in parent adds attendee from profile flow scaffold
    Given user role "parent" is signed in as "parent1@example.com"
    When I navigate to "/book/little-acorns/toddler-music-monday/attendees"
    And I should see text "Select attendees"
    And I should see text "Use child profile"
    Then I should see text "Toddler Music Monday"

  @v1 @payments @ponchopay @guest
  Scenario: Guest checkout starts PonchoPay redirect session
    Given the order id "55555555-5555-5555-5555-555555555101" should have state "pending_payment"
    When I start checkout for order id "55555555-5555-5555-5555-555555555101"
    Then PonchoPay checkout should be requested with:
      | provider              | ponchopay         |
      | order_id              | 55555555-5555-5555-5555-555555555101 |
      | success_return_path   | /checkout/return?status=success |
      | cancel_return_path    | /checkout/return?status=cancel  |

  @v1 @payments @return-flow
  Scenario: Success return page can load before webhook arrives
    Given the order id "55555555-5555-5555-5555-555555555101" should have state "pending_payment"
    When I navigate to "/checkout/return?status=success&orderId=55555555-5555-5555-5555-555555555101"
    Then I should see text "Processing payment confirmation"
    And I should see text "We are waiting for final webhook confirmation"

  @v1 @payments @webhooks @idempotency
  Scenario: Webhook can arrive before customer return page
    Given the order id "55555555-5555-5555-5555-555555555101" should have state "pending_payment"
    When I trigger PonchoPay webhook "payment_succeeded" with payload id "evt_v1_success_0001"
    Then the response status should be 202
    And the latest webhook event "evt_v1_success_0001" should be processed idempotently
    When I navigate to "/checkout/return?status=success&orderId=55555555-5555-5555-5555-555555555101"
    Then I should see text "Booking confirmed"

  @v1 @payments @failure
  Scenario: Payment failed webhook keeps order in pending payment review
    Given the order id "55555555-5555-5555-5555-555555555101" should have state "pending_payment"
    When I trigger PonchoPay webhook "payment_failed" with payload id "evt_v1_failed_0001"
    Then the response status should be 202
    And I navigate to "/checkout/return?status=cancel&orderId=55555555-5555-5555-5555-555555555101"
    Then I should see text "Payment not completed"
    And the order id "55555555-5555-5555-5555-555555555101" should have state "pending_payment"

  @v1 @organizer @bookings
  Scenario: Organizer bookings list shows attendee details scaffold
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/bookings"
    Then I should see text "Bookings"
    And I should see text "LA-BOOK-0001"
    And I should see text "Noah Example"

  @v1 @notifications
  Scenario: Booking confirmation notification stub is queued
    Given the booking id "88888888-8888-8888-8888-888888888101" should have state "confirmed"
    When I navigate to "/checkout/return?status=success&orderId=55555555-5555-5555-5555-555555555102"
    Then a notification stub should be queued for "booking_confirmation"
