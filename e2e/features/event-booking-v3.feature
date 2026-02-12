@event-booking @v3
Feature: Event booking V3 rule engine, RBAC, and admin controls
  Advanced discount behavior, governance controls, and webhook reconciliation.

  Background:
    Given the deterministic fixture set "baseline" is loaded
    And the platform timezone is "Europe/London"

  @v3 @discounts @rule-engine
  Scenario: Rule engine evaluates discount combinations by priority
    Given I am browsing as a "guest" customer
    When I navigate to "/basket"
    And I add basket line items:
      | event_id                              | ticket_type_id                         | quantity |
      | 11111111-1111-1111-1111-111111111001  | 33333333-3333-3333-3333-333333333101   | 4        |
    And I complete form "basket-discount" with values:
      | discount_code | EARLY20 |
      | sibling_flag  | true    |
    And I submit form "basket-discount"
    Then I should see text "Rule engine evaluation (V3 scaffold)"
    And I should see text "priority"

  @v3 @discounts @conflicts
  Scenario: Discount conflict is explained to organizer and customer
    Given I am browsing as a "guest" customer
    When I navigate to "/basket"
    And I complete form "basket-discount" with values:
      | discount_code | EARLY20+SIBLING10 |
    And I submit form "basket-discount"
    Then I should see text "Conflict detected"
    And I should see text "exclusive rule"

  @v3 @rbac @organizer @admin
  Scenario: Organizer admin can access event edit and bookings pages
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/events/11111111-1111-1111-1111-111111111001/edit"
    Then I should see text "Edit event"
    When I navigate to "/organizer/little-acorns/bookings"
    Then I should see text "Bookings"

  @v3 @rbac @organizer @editor
  Scenario: Organizer editor cannot access organizer membership management
    Given user role "organizer-editor" is signed in as "editor1@example.com"
    When I navigate to "/admin/organizers"
    Then I should see text "Access denied"

  @v3 @rbac @organizer @check-in
  Scenario: Check-in role can access check-in page but not event edit
    Given user role "organizer-check-in" is signed in as "checkin1@example.com"
    When I navigate to "/organizer/little-acorns/check-in"
    Then I should see text "Check-in list"
    When I navigate to "/organizer/little-acorns/events/11111111-1111-1111-1111-111111111001/edit"
    Then I should see text "Access denied"

  @v3 @admin @moderation
  Scenario: Platform admin sees moderation queue scaffold
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I navigate to "/admin/organizers"
    Then I should see text "Moderation queue"
    And I should see text "Half Term Camp"

  @v3 @admin @impersonation @audit
  Scenario: Platform admin impersonation creates audit log entry
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I navigate to "/admin/organizers"
    And I click button "Impersonate user"
    Then I should see text "Impersonation started"
    And an audit log entry should exist with action "admin.impersonation.started"

  @v3 @payments @webhooks @idempotency
  Scenario: Duplicate payment_succeeded webhook is idempotent
    Given the order id "55555555-5555-5555-5555-555555555101" should have state "pending_payment"
    When I trigger PonchoPay webhook "payment_succeeded" with payload id "evt_v3_payment_succeeded_0001"
    Then the response status should be 202
    When I trigger PonchoPay webhook "payment_succeeded" with payload id "evt_v3_payment_succeeded_0001"
    Then the response status should be 202
    And the latest webhook event "evt_v3_payment_succeeded_0001" should be processed idempotently

  @v3 @payments @webhooks @out-of-order
  Scenario: Late payment_failed webhook does not regress paid order
    Given the order id "55555555-5555-5555-5555-555555555102" should have state "paid"
    When I trigger PonchoPay webhook "payment_failed" with payload id "evt_v3_late_failed_0001"
    Then the response status should be 202
    And the order id "55555555-5555-5555-5555-555555555102" should have state "paid"

  @v3 @payments @webhooks @chargeback
  Scenario: Chargeback webhook is stored for reconciliation and audit
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I trigger PonchoPay webhook "chargeback" with payload id "evt_v3_chargeback_0001"
    Then the response status should be 202
    And the latest webhook event "evt_v3_chargeback_0001" should be processed idempotently
    And an audit log entry should exist with action "payments.chargeback.received"

  @v3 @payments @webhooks @refunds
  Scenario: Refund webhook updates attendee and order state scaffold
    Given the booking id "88888888-8888-8888-8888-888888888101" should have state "confirmed"
    When I trigger PonchoPay webhook "refund_issued" with payload id "evt_v3_refund_0001"
    Then the response status should be 202
    And the order id "55555555-5555-5555-5555-555555555102" should have state "partially_refunded"

  @v3 @admin @audit
  Scenario: Admin audit log page scaffold is available
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I navigate to "/admin/audit-log"
    Then I should see text "Audit log"
    And I should see text "correlation_id"

  @v3 @reporting @stub
  Scenario: Reporting/export endpoint remains stubbed and authenticated
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/dashboard"
    Then I should see text "Reporting stub"
    And I should see text "CSV export is not implemented yet"

  @v3 @b2b @future
  Scenario: B2B account preparation fields are documented as TODO
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I navigate to "/admin/organizers"
    Then I should see text "B2B account preparation"
    And I should see text "TODO"
