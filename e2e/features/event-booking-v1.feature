@event-booking @v1 @mvp
Feature: Parents can book childcare activities in a multi-tenant marketplace (V1)
  Parents can browse, add attendees, start payment, and receive booking confirmation while organizers manage their own tenant data.

  Background:
    Given the deterministic fixture set "baseline" is loaded
    And the platform timezone is "Europe/London"

  @v1 @browse @multitenant
  Scenario: Guest parent sees published events across organizers only
    Given I am browsing as a "guest parent" customer
    When I open the event catalog
    Then the catalog should include organizer/event slugs:
      | organizer_slug | event_slug               |
      | little-acorns  | half-term-camp-2026      |
      | little-acorns  | toddler-music-monday     |
      | riverdale-kids | riverdale-swim-intro     |
    And the catalog should not include event slug "internal-staff-session"
    And every catalog event should be published

  @v1 @browse @visibility
  Scenario: Guest parent cannot open an unpublished event detail page
    Given event "internal-staff-session" for organizer "little-acorns" is in status "draft"
    When I open event detail for organizer "little-acorns" and event "internal-staff-session"
    Then the last page response status should be 404
    And I should see text "Event not found"

  @v1 @rbac @admin
  Scenario: Non-admin parent cannot open platform organizer management
    Given I am browsing as a "guest parent" customer
    When I navigate to "/admin/organizers"
    Then access should be denied for current page

  @v1 @rbac @multitenant @organizer
  Scenario: Organizer admin cannot manage another organizer by URL guessing
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I open organizer "riverdale-kids" event creation page
    Then access should be denied for current page

  @v1 @organizer @events
  Scenario: Organizer admin gets single-session defaults when creating their own event
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I open organizer "little-acorns" event creation page
    Then form field "event_type" should have value "single_session"
    And form field "capacity_total" should be empty

  @v1 @basket @attendees @guest
  Scenario: Guest parent adds two children to one organizer basket
    Given I am browsing as a "guest parent" customer
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
    And order reference "LA-ORDER-PENDING-001" should belong to organizer "little-acorns"

  @v1 @forms @validation
  Scenario: Parent cannot continue when a required booking field is missing
    Given I am browsing as a "guest parent" customer
    When I navigate to "/book/little-acorns/half-term-camp-2026/attendees"
    And I complete form "booking-capture" with values:
      | parent_name          | Parent One |
      | consent_safeguarding | true       |
    And I submit form "booking-capture"
    Then the booking capture form should show validation error message

  @v1 @basket @logged-in
  Scenario: Logged-in parent sees account email prefilled during attendee capture
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/book/little-acorns/toddler-music-monday/attendees"
    Then form field "parent_email" should have value "davidmjadams+test@gmail.com"

  @v1 @payments @ponchopay
  Scenario: Parent starts PonchoPay checkout with deterministic contract fields
    Given order reference "LA-ORDER-PENDING-001" should be in state "pending_payment"
    When I start checkout for order reference "LA-ORDER-PENDING-001"
    Then PonchoPay checkout contract should include:
      | provider              | ponchopay |
      | order_ref             | LA-ORDER-PENDING-001 |
      | currency              | GBP |
      | amount_pence          | 2400 |
      | success_return_path   | /checkout/return?status=success&orderId={order_id} |
      | cancel_return_path    | /checkout/return?status=cancel&orderId={order_id} |

  @v1 @payments @return-flow
  Scenario: Parent can return from checkout before webhook confirmation arrives
    Given order reference "LA-ORDER-PENDING-001" should be in state "pending_payment"
    When I open checkout return for order reference "LA-ORDER-PENDING-001" with status "success"
    Then checkout return should show pending confirmation guidance
    And order reference "LA-ORDER-PENDING-001" should be in state "pending_payment"

  @v1 @payments @webhooks @state-machine
  Scenario: Payment succeeded webhook confirms the order lifecycle
    Given order reference "LA-ORDER-PENDING-001" should be in state "pending_payment"
    When I send PonchoPay webhook "payment_succeeded" with provider event id "evt_v1_success_0001" for order reference "LA-ORDER-PENDING-001"
    Then the response status should be 202
    And exactly 1 webhook events should exist with provider event id "evt_v1_success_0001"
    And order reference "LA-ORDER-PENDING-001" should be in state "paid"

  @v1 @payments @webhooks @idempotency @notifications
  Scenario: Duplicate payment_succeeded delivery does not duplicate side effects
    Given order reference "LA-ORDER-PAID-001" should be in state "paid"
    And exactly 1 bookings should exist for order reference "LA-ORDER-PAID-001"
    When I send PonchoPay webhook "payment_succeeded" with provider event id "evt_v1_dup_0001" for order reference "LA-ORDER-PAID-001"
    And I send PonchoPay webhook "payment_succeeded" with provider event id "evt_v1_dup_0001" for order reference "LA-ORDER-PAID-001"
    Then the response status should be 202
    And exactly 1 webhook events should exist with provider event id "evt_v1_dup_0001"
    And exactly 1 bookings should exist for order reference "LA-ORDER-PAID-001"
    And exactly 1 booking confirmation notifications should be queued for order reference "LA-ORDER-PAID-001"

  @v1 @payments @failure
  Scenario: Parent sees retry guidance when payment fails
    Given order reference "LA-ORDER-PENDING-001" should be in state "pending_payment"
    When I send PonchoPay webhook "payment_failed" with provider event id "evt_v1_failed_0001" for order reference "LA-ORDER-PENDING-001"
    Then the response status should be 202
    And order reference "LA-ORDER-PENDING-001" should be in state "pending_payment"
    When I open checkout return for order reference "LA-ORDER-PENDING-001" with status "cancel"
    Then checkout return should show payment retry guidance

  @v1 @organizer @bookings @multitenant
  Scenario: Organizer sees only their own booking references
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/bookings"
    Then organizer bookings page should include booking reference "LA-BOOK-0001"
    And organizer bookings page should not include booking reference "RD-BOOK-0001"

  @v1 @payments @security
  Scenario: Parent sees a safe message when checkout return URL is tampered
    Given I am browsing as a "guest parent" customer
    When I navigate to "/checkout/return?status=success"
    Then checkout return should show safe verification error
    And the current page should not reveal booking reference "LA-BOOK-0001"
