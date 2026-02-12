@event-booking @v2
Feature: Event booking V2 basket, waitlist, discounts, and refunds
  Basket supports multiple events per organizer with basic discounting and waitlist flow.

  Background:
    Given the deterministic fixture set "baseline" is loaded
    And the platform timezone is "Europe/London"

  @v2 @basket @multi-event
  Scenario: Basket supports multiple events from a single organizer
    Given I am browsing as a "guest" customer
    When I navigate to "/basket"
    And I add basket line items:
      | event_id                              | ticket_type_id                         | quantity |
      | 11111111-1111-1111-1111-111111111002  | 33333333-3333-3333-3333-333333333103   | 1        |
      | 11111111-1111-1111-1111-111111111004  | 33333333-3333-3333-3333-333333333105   | 2        |
    Then I should see text "2 events in basket"
    And I should see text "Little Acorns"

  @v2 @basket @multi-tenant
  Scenario: Basket blocks mixing organizers in a single checkout
    Given I am browsing as a "guest" customer
    When I navigate to "/basket"
    And I add basket line items:
      | event_id                              | ticket_type_id                         | quantity |
      | 11111111-1111-1111-1111-111111111002  | 33333333-3333-3333-3333-333333333103   | 1        |
      | 11111111-1111-1111-1111-111111111005  | 33333333-3333-3333-3333-333333333103   | 1        |
    Then I should see text "Single organizer per basket"

  @v2 @event-types @course
  Scenario: Multi-session course detail renders session schedule
    Given the event "Art Explorers Course" with id "11111111-1111-1111-1111-111111111003" exists for organizer "Little Acorns"
    When I navigate to "/events/little-acorns/art-explorers-course"
    Then I should see text "course_multi_session"
    And I should see text "2026-03-01"
    And I should see text "2026-03-08"

  @v2 @event-types @camp
  Scenario: Multi-day camp detail renders all day blocks
    Given the event "Half Term Camp" with id "11111111-1111-1111-1111-111111111001" exists for organizer "Little Acorns"
    When I navigate to "/events/little-acorns/half-term-camp-2026"
    Then I should see text "camp_multi_day"
    And I should see text "2026-02-17"
    And I should see text "2026-02-19"

  @v2 @event-types @recurring
  Scenario: Recurring drop-in detail allows selecting an occurrence
    Given the event "Saturday Drop-In Football" with id "11111111-1111-1111-1111-111111111004" exists for organizer "Little Acorns"
    When I navigate to "/events/little-acorns/saturday-drop-in-football"
    Then I should see text "recurring_drop_in"
    And I should see text "Choose occurrence"

  @v2 @capacity @waitlist
  Scenario: Customer joins waitlist when capacity is full
    Given the ticket type "General Admission" with id "33333333-3333-3333-3333-333333333103" exists for event "Toddler Music Monday"
    And the attendee slot id "77777777-7777-7777-7777-777777777101" should have state "held"
    When I navigate to "/events/little-acorns/toddler-music-monday"
    And I click button "Join waitlist"
    Then I should see text "Added to waitlist"
    And the waitlist entry id "cccccccc-cccc-cccc-cccc-ccccccccc101" should have state "waiting"

  @v2 @waitlist @cancellation
  Scenario: Cancellation can promote first waiting attendee
    Given the waitlist entry id "cccccccc-cccc-cccc-cccc-ccccccccc101" should have state "waiting"
    When I trigger PonchoPay webhook "refund_issued" with payload id "evt_v2_refund_for_promotion_0001"
    Then the response status should be 202
    And I should see text "Webhook accepted"
    And the waitlist entry id "cccccccc-cccc-cccc-cccc-ccccccccc101" should have state "offered"

  @v2 @discounts @early-bird
  Scenario: Early bird discount applies before cut-off date
    Given I am browsing as a "guest" customer
    When I navigate to "/basket"
    And I add basket line items:
      | event_id                              | ticket_type_id                         | quantity |
      | 11111111-1111-1111-1111-111111111001  | 33333333-3333-3333-3333-333333333101   | 1        |
    And I complete form "basket-discount" with values:
      | discount_code | EARLY20 |
    And I submit form "basket-discount"
    Then I should see text "Early bird 20%"

  @v2 @discounts @group-pricing
  Scenario: Tiered group pricing applies for three attendees
    Given I am browsing as a "guest" customer
    When I navigate to "/basket"
    And I add basket line items:
      | event_id                              | ticket_type_id                         | quantity |
      | 11111111-1111-1111-1111-111111111001  | 33333333-3333-3333-3333-333333333101   | 3        |
    Then I should see text "Group tier discount"

  @v2 @discounts @siblings
  Scenario: Siblings discount applies and remains non-combinable
    Given I am browsing as a "guest" customer
    When I navigate to "/basket"
    And I add basket line items:
      | event_id                              | ticket_type_id                         | quantity |
      | 11111111-1111-1111-1111-111111111001  | 33333333-3333-3333-3333-333333333102   | 2        |
    And I complete form "basket-discount" with values:
      | discount_code | SIBLING10 |
    And I submit form "basket-discount"
    Then I should see text "Siblings discount applied"
    And I should see text "Discounts are non-combinable in V2"

  @v2 @discounts @edge-case
  Scenario: Invalid discount code does not change basket total
    Given I am browsing as a "guest" customer
    When I navigate to "/basket"
    And I complete form "basket-discount" with values:
      | discount_code | DOES_NOT_EXIST |
    And I submit form "basket-discount"
    Then I should see text "Discount not applicable"

  @v2 @refunds @cancellation-policy
  Scenario: Organizer can process partial attendee refund
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/bookings"
    And I click button "Refund attendee"
    Then I should see text "Partial refund"
    And the order id "55555555-5555-5555-5555-555555555102" should have state "partially_refunded"

  @v2 @check-in
  Scenario: Check-in list allows marking attendee present
    Given user role "organizer-check-in" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/check-in"
    Then I should see text "Check-in list"
    And I should see text "Noah Example"
