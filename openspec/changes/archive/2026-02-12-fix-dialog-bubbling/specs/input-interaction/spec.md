# input-interaction Specification

## Purpose
Defines requirements for proper input area interaction, ensuring that form controls behave as expected without unintended side effects.

## ADDED Requirements
### Requirement: Form Submission Control
The input area form SHALL only submit when the user explicitly intends to send a prompt, not when interacting with other form controls.

#### Scenario: Dropdown interactions do not trigger submission
- **WHEN** the user clicks on the SessionList dropdown button
- **THEN** the dropdown SHALL open without triggering form submission
- **AND** the prompt SHALL not be sent
- **AND** the user SHALL be able to select a session without submitting

#### Scenario: Model selection does not trigger submission
- **WHEN** the user clicks on the ModelSelector dropdown button
- **THEN** the dropdown SHALL open without triggering form submission
- **AND** the prompt SHALL not be sent
- **AND** the user SHALL be able to select a model without submitting

#### Scenario: Session creation from dropdown does not trigger submission
- **WHEN** the user clicks "New Conversation" in the session dropdown
- **THEN** a new session SHALL be created
- **AND** the prompt input SHALL NOT be submitted
- **AND** the dropdown SHALL close

### ADDED Requirement: Explicit Button Types
All buttons within the input area form SHALL have explicit type attributes to prevent unintended form submissions.

#### Scenario: Non-submit buttons have type button
- **WHEN** the SessionList dropdown toggle button is rendered
- **THEN** it SHALL have `type="button"` attribute
- **AND** clicking it SHALL NOT submit the form

- **WHEN** the ModelSelector dropdown toggle button is rendered
- **THEN** it SHALL have `type="button"` attribute
- **AND** clicking it SHALL NOT submit the form

- **WHEN** the new session button in SessionList dropdown is rendered
- **THEN** it SHALL have `type="button"` attribute
- **AND** clicking it SHALL NOT submit the form

- **WHEN** the refresh button in SessionList dropdown is rendered
- **THEN** it SHALL have `type="button"` attribute
- **AND** clicking it SHALL NOT submit the form

- **WHEN** the session delete button in SessionList dropdown is rendered
- **THEN** it SHALL have `type="button"` attribute
- **AND** clicking it SHALL NOT submit the form

- **WHEN** model selection buttons in ModelSelector dropdown are rendered
- **THEN** they SHALL have `type="button"` attribute
- **AND** clicking them SHALL NOT submit the form

### ADDED Requirement: Submit Button Behavior
The form submit button SHALL be the only element that triggers form submission through button click.

#### Scenario: Send button submits form
- **WHEN** the user clicks the Send button
- **THEN** the form SHALL submit
- **AND** the prompt SHALL be sent
- **AND** the input SHALL be cleared after submission

#### Scenario: Enter key submits form
- **WHEN** the user presses Enter in the textarea
- **AND** the Shift key is not pressed
- **THEN** the form SHALL submit
- **AND** the prompt SHALL be sent
