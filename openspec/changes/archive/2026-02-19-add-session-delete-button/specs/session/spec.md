## ADDED Requirements
### Requirement: Session Deletion from UI
The system SHALL provide a delete button in the session list UI that allows users to delete sessions starting with "navigate:" prefix.

#### Scenario: Delete button visibility
- **WHEN** the session dropdown is displayed
- **THEN** a delete button SHALL appear on the far right of each session row
- **AND** the delete button SHALL only be visible for sessions with title starting with "navigate:"

#### Scenario: Delete button default state
- **WHEN** the delete button is rendered
- **THEN** it SHALL have a very light red color (nearly invisible)
- **AND** the button SHALL be subtle to avoid accidental clicks

#### Scenario: Delete button hover state
- **WHEN** the user hovers over the delete button
- **THEN** the button SHALL become bright red
- **AND** this provides clear visual feedback that the button is actionable

#### Scenario: Delete confirmation flow
- **WHEN** the user clicks the delete button
- **THEN** the button SHALL enter confirmation mode (visual change)
- **AND** clicking the button again SHALL delete the session
- **AND** clicking elsewhere SHALL cancel the confirmation

#### Scenario: Session deletion via SDK
- **WHEN** the user confirms deletion
- **THEN** the system SHALL call the SDK's `client.session.delete()` method
- **AND** the session SHALL be removed from both server and local state
- **AND** the session list SHALL refresh to reflect the deletion

#### Scenario: Non-navigate sessions not deletable
- **WHEN** a session title does not start with "navigate:"
- **THEN** the delete button SHALL NOT be rendered for that session
- **AND** users cannot delete non-server-created sessions from the UI
