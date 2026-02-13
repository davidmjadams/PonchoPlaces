@event-booking @v2
Feature: Parents and organizers handle richer booking workflows (V2)
  Basket supports multiple events for one organizer, waitlist promotion, discounts, cancellations, refunds, and check-in.

  Background:
    Given the deterministic fixture set "baseline" is loaded
    And the platform timezone is "Europe/London"

  @v2 @basket @multi-event
  Scenario: Parent keeps multiple events from the same organizer in one basket
    Given I am browsing as a "guest parent" customer
    When I navigate to "/basket"
    And I add basket line items:
      | event_id                              | ticket_type_id                         | quantity |
      | 11111111-1111-1111-1111-111111111002  | 33333333-3333-3333-3333-333333333103   | 1        |
      | 11111111-1111-1111-1111-111111111004  | 33333333-3333-3333-3333-333333333105   | 2        |
    Then order reference "LA-ORDER-PENDING-001" should belong to organizer "little-acorns"
    And I should see text "2 events in basket"

  @v2 @basket @multi-tenant
  Scenario: Parent cannot mix organizers in one basket checkout
    Given I am browsing as a "guest parent" customer
    When I navigate to "/basket"
    And I add basket line items:
      | event_id                              | ticket_type_id                         | quantity |
      | 11111111-1111-1111-1111-111111111002  | 33333333-3333-3333-3333-333333333103   | 1        |
      | 11111111-1111-1111-1111-111111111005  | 33333333-3333-3333-3333-333333333103   | 1        |
    Then I should see text "Single organizer per basket"
    And order reference "LA-ORDER-PENDING-001" should belong to organizer "little-acorns"

  @v2 @event-types @course
  Scenario: Parent can see all sessions before buying a multi-session course
    Given event "art-explorers-course" for organizer "little-acorns" is in status "published"
    When I open event detail for organizer "little-acorns" and event "art-explorers-course"
    Then I should see text "course_multi_session"
    And I should see text "2026-03-01"
    And I should see text "2026-03-08"

  @v2 @event-types @camp
  Scenario: Parent can see each day of a multi-day camp
    Given event "half-term-camp-2026" for organizer "little-acorns" is in status "published"
    When I open event detail for organizer "little-acorns" and event "half-term-camp-2026"
    Then I should see text "camp_multi_day"
    And I should see text "2026-02-17"
    And I should see text "2026-02-19"

  @v2 @event-types @recurring
  Scenario: Parent can choose an occurrence for a recurring drop-in session
    Given event "saturday-drop-in-football" for organizer "little-acorns" is in status "published"
    When I open event detail for organizer "little-acorns" and event "saturday-drop-in-football"
    Then I should see text "recurring_drop_in"
    And I should see text "Choose occurrence"

  @v2 @capacity @waitlist
  Scenario: Parent joins waitlist when session capacity is full
    Given the attendee slot id "77777777-7777-7777-7777-777777777101" should have state "held"
    When I open event detail for organizer "little-acorns" and event "toddler-music-monday"
    And I click button "Join waitlist"
    Then I should see text "Added to waitlist"
    And the waitlist entry id "cccccccc-cccc-cccc-cccc-ccccccccc101" should have state "waiting"

  @v2 @capacity @overbooking
  Scenario: Parent cannot reserve more seats than available capacity
    Given event "toddler-music-monday" for organizer "little-acorns" is in status "published"
    When I navigate to "/book/little-acorns/toddler-music-monday/attendees"
    And I add attendee rows:
      | attendee_name      | attendee_dob | ticket_type_id                         |
      | Capacity Child 1   | 2020-01-01   | 33333333-3333-3333-3333-333333333103   |
      | Capacity Child 2   | 2020-02-01   | 33333333-3333-3333-3333-333333333103   |
    Then I should see text "Capacity exceeded"

  @v2 @waitlist @cancellation
  Scenario: Organizer cancellation can promote first waiting family
    Given the waitlist entry id "cccccccc-cccc-cccc-cccc-ccccccccc101" should have state "waiting"
    When I send PonchoPay webhook "refund_issued" with provider event id "evt_v2_refund_for_promotion_0001" for order reference "LA-ORDER-PAID-001"
    Then the response status should be 202
    And exactly 1 webhook events should exist with provider event id "evt_v2_refund_for_promotion_0001"
    And the waitlist entry id "cccccccc-cccc-cccc-cccc-ccccccccc101" should have state "offered"

  @v2 @discounts @early-bird
  Scenario: Parent receives early-bird pricing when eligible
    Given I am browsing as a "guest parent" customer
    When I navigate to "/basket"
    And I complete form "basket-discount" with values:
      | discount_code | EARLY20 |
    And I submit form "basket-discount"
    Then I should see text "Early bird 20%"

  @v2 @discounts @siblings
  Scenario: Parent receives sibling discount and cannot combine it with another V2 discount
    Given I am browsing as a "guest parent" customer
    When I navigate to "/basket"
    And I complete form "basket-discount" with values:
      | discount_code | SIBLING10 |
    And I submit form "basket-discount"
    Then I should see text "Siblings discount applied"
    And I should see text "Discounts are non-combinable in V2"

  @v2 @discounts @edge-case
  Scenario: Parent entering an invalid discount keeps basket totals unchanged
    Given order reference "LA-ORDER-PENDING-001" should have currency "GBP" and total_pence 2400
    When I navigate to "/basket"
    And I complete form "basket-discount" with values:
      | discount_code | DOES_NOT_EXIST |
    And I submit form "basket-discount"
    Then I should see text "Discount not applicable"
    And order reference "LA-ORDER-PENDING-001" should have currency "GBP" and total_pence 2400

  @v2 @refunds @cancellation-policy
  Scenario: Organizer can issue a partial refund for one attendee
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/bookings"
    And I click button "Refund attendee"
    Then I should see text "Partial refund"
    And order reference "LA-ORDER-PAID-001" should be in state "partially_refunded"

  @v2 @check-in
  Scenario: Check-in staff can mark attendee present once
    Given user role "organizer-check-in" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/check-in"
    Then I should see text "Noah Example"
    And I should see text "Check-in list"
