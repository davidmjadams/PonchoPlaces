Feature: Items page

  Scenario: Page loads with DB-backed content
    Given I open the items page
    Then I should see "Test item"
    And I should see "Seeded for cucumber + playwright e2e"

