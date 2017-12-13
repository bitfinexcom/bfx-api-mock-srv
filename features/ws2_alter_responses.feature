Feature: Client can alter the mock v2 ws server responses
  In order to control server response behavior
  As a client
  I want to alter the server responses

  Scenario: Existing response changed
    Given I have a mock v2 ws server
    When I change an existing response
    Then the response is updated

  Scenario: Unknown response changed
    Given I have a mock v2 ws server
    When I change an unknown response
    Then the server responds with an error

  Scenario: Existing response requested
    Given I have a mock v2 ws server
    When I read an existing response
    Then the server responds with that response JSON

  Scenario: Unknown response requested
    Given I have a mock v2 ws server
    When I read an unknown response
    Then the server responds with an error