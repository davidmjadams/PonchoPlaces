@event-booking @v3
Feature: Parents and staff get advanced governance and reconciliation controls (V3)
  The platform enforces richer discount logic, staff permissions, admin controls, and payment reconciliation invariants.

  Background:
    Given the deterministic fixture set "baseline" is loaded
    And the platform timezone is "Europe/London"

  @v3 @discounts @rule-engine
  Scenario: Parent gets a deterministic winner when multiple discount rules apply
    Given I am browsing as a "guest parent" customer
    When I navigate to "/basket"
    And I complete form "basket-discount" with values:
      | discount_code | EARLY20 |
      | sibling_flag  | true    |
    And I submit form "basket-discount"
    Then I should see text "Rule engine evaluation (V3 scaffold)"
    And I should see text "priority"

  @v3 @discounts @conflicts
  Scenario: Parent gets a clear conflict reason when discount rules are incompatible
    Given I am browsing as a "guest parent" customer
    When I navigate to "/basket"
    And I complete form "basket-discount" with values:
      | discount_code | EARLY20+SIBLING10 |
    And I submit form "basket-discount"
    Then I should see text "Conflict detected"
    And I should see text "exclusive rule"

  @v3 @rbac @organizer @admin
  Scenario: Organizer admin can edit events and access bookings for their tenant
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/events/11111111-1111-1111-1111-111111111001/edit"
    Then I should see text "Edit event"
    When I navigate to "/organizer/little-acorns/bookings"
    Then organizer bookings page should include booking reference "LA-BOOK-0001"

  @v3 @rbac @organizer @editor
  Scenario: Organizer editor cannot access platform-level organizer administration
    Given user role "organizer-editor" is signed in as "editor1@example.com"
    When I navigate to "/admin/organizers"
    Then access should be denied for current page

  @v3 @rbac @organizer @check-in
  Scenario: Check-in staff can access check-in list but not event editing
    Given user role "organizer-check-in" is signed in as "checkin1@example.com"
    When I navigate to "/organizer/little-acorns/check-in"
    Then I should see text "Check-in list"
    When I navigate to "/organizer/little-acorns/events/11111111-1111-1111-1111-111111111001/edit"
    Then access should be denied for current page

  @v3 @admin @moderation
  Scenario: Platform admin can review moderation queue entries
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I navigate to "/admin/organizers"
    Then I should see text "Moderation queue"
    And I should see text "Half Term Camp"

  @v3 @admin @impersonation @audit
  Scenario: Platform admin impersonation writes a governance audit event
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I navigate to "/admin/organizers"
    And I click button "Impersonate user"
    Then I should see text "Impersonation started"
    And an audit log entry should exist with action "admin.impersonation.started"

  @v3 @payments @webhooks @idempotency
  Scenario: Duplicate payment webhook delivery remains idempotent
    Given order reference "LA-ORDER-PENDING-001" should be in state "pending_payment"
    When I send PonchoPay webhook "payment_succeeded" with provider event id "evt_v3_payment_succeeded_0001" for order reference "LA-ORDER-PENDING-001"
    And I send PonchoPay webhook "payment_succeeded" with provider event id "evt_v3_payment_succeeded_0001" for order reference "LA-ORDER-PENDING-001"
    Then the response status should be 202
    And exactly 1 webhook events should exist with provider event id "evt_v3_payment_succeeded_0001"

  @v3 @payments @webhooks @out-of-order
  Scenario: Late payment_failed event does not regress an already paid order
    Given order reference "LA-ORDER-PAID-001" should be in state "paid"
    When I send PonchoPay webhook "payment_failed" with provider event id "evt_v3_late_failed_0001" for order reference "LA-ORDER-PAID-001"
    Then the response status should be 202
    And order reference "LA-ORDER-PAID-001" should be in state "paid"

  @v3 @payments @webhooks @chargeback
  Scenario: Chargeback webhook is stored for reconciliation and audit
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I send PonchoPay webhook "chargeback" with provider event id "evt_v3_chargeback_0001" for order reference "LA-ORDER-PAID-001"
    Then the response status should be 202
    And exactly 1 webhook events should exist with provider event id "evt_v3_chargeback_0001"
    And an audit log entry should exist with action "payments.chargeback.received"

  @v3 @payments @webhooks @refunds
  Scenario: Refund webhook updates refund lifecycle for attendee-level tracking
    Given booking reference "LA-BOOK-0001" should be in state "confirmed"
    When I send PonchoPay webhook "refund_issued" with provider event id "evt_v3_refund_0001" for order reference "LA-ORDER-PAID-001"
    Then the response status should be 202
    And order reference "LA-ORDER-PAID-001" should be in state "partially_refunded"

  @v3 @admin @audit
  Scenario: Platform admin can review audit entries with correlation ids
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I navigate to "/admin/audit-log"
    Then I should see text "Audit log"
    And I should see text "correlation_id"

  @v3 @reporting @stub
  Scenario: Organizer admin can open reporting area while CSV export remains stubbed
    Given user role "organizer-admin" is signed in as "davidmjadams+test@gmail.com"
    When I navigate to "/organizer/little-acorns/dashboard"
    Then I should see text "Reporting stub"
    And I should see text "CSV export is not implemented yet"

  @v3 @b2b @future
  Scenario: Platform admin sees explicit B2B preparation TODOs
    Given user role "platform-admin" is signed in as "platform.admin@example.com"
    When I navigate to "/admin/organizers"
    Then I should see text "B2B account preparation"
    And I should see text "TODO"
