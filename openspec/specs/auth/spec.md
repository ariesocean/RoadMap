# auth Specification

## Purpose
TBD - created by archiving change add-login-page. Update Purpose after archive.
## Requirements
### Requirement: Login Page Display
The system SHALL display a login page as the entry point when the user is not logged in.

#### Scenario: User opens application
- **GIVEN** user is not logged in
- **WHEN** user opens the application
- **THEN** the login page SHALL be displayed instead of the main interface

#### Scenario: User refreshes page while logged in
- **GIVEN** user is logged in
- **WHEN** user refreshes the page
- **THEN** the login page SHALL NOT be displayed
- **AND** the main interface SHALL be displayed

### Requirement: Login Functionality
The system SHALL provide a login form that authenticates the user and grants access to the main interface. The login state SHALL reuse the existing `isConnected` state from `useTaskStore` to avoid duplicate development.

#### Scenario: User logs in successfully
- **GIVEN** user is on the login page
- **WHEN** user enters username and password and clicks login
- **THEN** the `isConnected` state SHALL be set to true (same as current Connected behavior)
- **AND** the username SHALL be stored in localStorage
- **AND** user SHALL be redirected to the main interface
- **AND** the username SHALL be displayed in the header

#### Scenario: Login state persistence
- **GIVEN** user has successfully logged in
- **WHEN** user refreshes the browser
- **THEN** the login state SHALL be loaded from localStorage
- **AND** `isConnected` SHALL be set to true
- **AND** user SHALL remain logged in

### Requirement: Login Error Handling
The system SHALL provide user-friendly error feedback when login fails.

#### Scenario: User enters invalid credentials
- **GIVEN** user is on the login page
- **WHEN** user enters incorrect username or password and clicks login
- **THEN** an error message SHALL be displayed
- **AND** the error message SHALL advise the user to check their username or password
- **AND** the login page SHALL remain displayed
- **AND** the `isConnected` state SHALL remain false

#### Scenario: User encounters localStorage error
- **GIVEN** user has successfully logged in
- **WHEN** the system attempts to save login state to localStorage but fails
- **THEN** an error message SHALL be displayed
- **AND** the user SHALL be logged out
- **AND** the login page SHALL be displayed

### Requirement: Registration Functionality
The system SHALL provide a registration modal for new users to create an account.

#### Scenario: User opens registration modal
- **GIVEN** user is on the login page
- **WHEN** user clicks "Sign up" link
- **THEN** the registration modal SHALL be displayed

#### Scenario: User registers successfully
- **GIVEN** user has the registration modal open
- **WHEN** user fills in username, email, password and clicks register
- **THEN** the user SHALL be automatically logged in
- **AND** the main interface SHALL be displayed

### Requirement: Account Management
The system SHALL provide an account management popup that allows users to manage their account information.

#### Scenario: User accesses account popup
- **GIVEN** user is logged in
- **WHEN** user clicks on the username in the header
- **THEN** an account management popup SHALL be displayed

#### Scenario: User updates username
- **GIVEN** account popup is open
- **WHEN** user enters a new username and confirms
- **THEN** the username SHALL be updated in the system
- **AND** the header SHALL display the new username

#### Scenario: User updates password
- **GIVEN** account popup is open
- **WHEN** user enters a new password and confirms
- **THEN** the password SHALL be updated (frontend simulation)

#### Scenario: User logs out
- **GIVEN** account popup is open
- **WHEN** user clicks the logout button
- **THEN** the `isConnected` state SHALL be set to false (same as current Disconnected behavior)
- **AND** the login state SHALL be cleared from localStorage
- **AND** the username SHALL be cleared
- **AND** the login page SHALL be displayed

### Requirement: Header Display
The system SHALL display the logged-in username in the header instead of "Connected/Disconnected" status.

#### Scenario: Display username in header
- **GIVEN** user is logged in
- **WHEN** the main interface is rendered
- **THEN** the header SHALL display the username
- **AND** the header SHALL NOT display "Connected" or "Disconnected" text

