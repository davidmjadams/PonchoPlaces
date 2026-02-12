Feature: User authentication

  Scenario: user authentication
    Given I am a logged out user
    When I try to access the restricted "restricted-items" page
    Then I am taken to the login screen

    Given I am a logged in user
    When I try to access the restricted "restricted-items" page
    Then I can see the list of restricted items

  Scenario: login via the header
    Given I am a logged out user
    When I click the "login" header link
    Then I am taken to the login screen

    Given I am a logged in user
    When I click the "logout" header link
    Then I should be logged out
    And I should be taken to the homepage
    And the "login" link should show in the header
