## ADDED Requirements

### Requirement: Event Deduplication

The system SHALL implement event deduplication to prevent duplicate content from being displayed in the modal during prompt processing.

#### Scenario: Server-side event deduplication
- **WHEN** the OpenCode server sends multiple events with the same content
- **THEN** the API endpoint SHALL track processed event IDs using a Set
- **AND** duplicate events SHALL be filtered out before streaming to the client
- **AND** each unique event SHALL only be processed once

#### Scenario: Event ID generation
- **WHEN** processing events from the OpenCode server
- **THEN** the eventId SHALL be generated using a monotonically increasing counter
- **AND** the counter SHALL be scoped to each session
- **AND** the format SHALL be `${eventType}-${sessionId}-${counter}`

#### Scenario: No duplicate tool calls displayed
- **WHEN** the same tool is called multiple times during execution
- **THEN** each tool-call event SHALL appear exactly once in the modal
- **AND** tool-result events SHALL not be duplicated

### Requirement: Backend Deduplication Consistency

Both `/api/execute-navigate` and `/api/execute-modal-prompt` endpoints SHALL use consistent deduplication mechanisms.

#### Scenario: Navigate endpoint deduplication
- **WHEN** events are streamed from the OpenCode server to `/api/execute-navigate`
- **THEN** the endpoint SHALL maintain a `processedEvents` Set
- **AND** events already in the Set SHALL be skipped
- **AND** the Set SHALL be scoped to each request

#### Scenario: Modal prompt endpoint deduplication
- **WHEN** events are streamed from the OpenCode server to `/api/execute-modal-prompt`
- **THEN** the endpoint SHALL maintain a `processedEvents` Set
- **AND** eventId generation SHALL use an incrementing counter
- **AND** duplicate events SHALL not reach the client
