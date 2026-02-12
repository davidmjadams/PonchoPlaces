Feature: User signup

  Scenario: user can sign up (profile is optional)
    Given I am a logged out user
    When I visit the signup page
    And I enter an email and password
    Then I am logged in and I am redirected to the "account-created" page

  Scenario: user can sign up and complete profile
    Given I am a logged out user
    When I visit the signup page
    And I enter an email and password
    Then I am logged in and I am redirected to the "account-created" page
    When I go to the profile page
    And I set my profile name to "Test User" and description to "Hello from e2e"
    Then my profile name is "Test User" and description is "Hello from e2e"

