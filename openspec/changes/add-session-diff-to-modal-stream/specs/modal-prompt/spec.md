## ADDED Requirements
### Requirement: Session Diff Display in Modal
The modal SHALL display file change information (diff) received from the session.diff event, showing modified files with their additions and deletions.

#### Scenario: File diff displayed after tool execution
- **WHEN** a tool like Edit modifies files and the server sends a session.diff event
- **THEN** the modal SHALL display each changed file with its path
- **AND** show additions count in green with "+N" format
- **AND** show deletions count in red with "-N" format

#### Scenario: Multiple files changed
- **WHEN** multiple files are changed in a single tool execution
- **THEN** each file SHALL be displayed on a separate line
- **AND** files SHALL be displayed in the order received from the server

#### Scenario: Diff event arrives after tool-result
- **WHEN** a session.diff event arrives after a tool-result event
- **THEN** the diff content SHALL be displayed following the tool-result
- **AND** the streaming shall continue normally without interruption

### Requirement: Diff Segment Type
The resultModalStore SHALL support a new segment type for storing diff information.

#### Scenario: Creating diff segment
- **WHEN** a session.diff event is processed
- **THEN** a new segment with type 'diff' SHALL be created
- **AND** the segment SHALL contain an array of file diff objects with file path, additions, and deletions

#### Scenario: Appending to existing diff segment
- **WHEN** multiple session.diff events arrive sequentially
- **THEN** subsequent diffs SHALL be appended to the existing diff segment
- **OR** create new diff segments if they represent different tool invocations
