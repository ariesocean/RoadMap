# model-selection Specification

## Purpose
TBD - created by archiving change add-model-selection. Update Purpose after archive.
## Requirements
### Requirement: Model Selection UI
The system SHALL provide a model selection dropdown in the header, allowing users to choose from predefined models.

#### Scenario: User sees model dropdown in header
- **GIVEN** the user has loaded the Roadmap Manager application
- **WHEN** the header is rendered
- **THEN** a model selection dropdown is displayed in the top-right corner
- **AND** the dropdown shows the currently selected model name
- **AND** clicking the dropdown reveals four model options: "MiniMax-M2.1", "Qwen3-Coder-Flash", "Big-Pickle", "GLM-4.7"

#### Scenario: User selects a model from dropdown
- **GIVEN** the user has clicked the model dropdown
- **WHEN** the user clicks on "Qwen3-Coder-Flash" from the options
- **THEN** the dropdown closes
- **AND** the displayed model name updates to "Qwen3-Coder-Flash"
- **AND** the selection is persisted to localStorage
- **AND** subsequent prompts use this model

#### Scenario: User preference persists across sessions
- **GIVEN** the user has selected "Big-Pickle" as their model
- **WHEN** the user refreshes the page or closes and reopens the application
- **THEN** the dropdown displays "Big-Pickle" as the selected model
- **AND** the stored preference is used for all subsequent prompt executions

### Requirement: Model Configuration
The system SHALL support four specific models with proper provider/model formatting.

#### Scenario: Application has predefined model list
- **GIVEN** the application is initialized
- **THEN** four models are available for selection:
| Display Name | Provider ID | Model ID |
|-------------|-------------|----------|
| MiniMax-M2.1 | minimax-cn-coding-plan | MiniMax-M2.1 |
| Qwen3-Coder-Flash | alibaba-cn | qwen3-coder-flash |
| Big-Pickle | opencode | big-pickle |
| GLM-4.7 | zhipuai | glm-4.7 |

#### Scenario: Dropdown only displays modelID
- **GIVEN** the model dropdown is rendered
- **WHEN** the options are displayed
- **THEN** each option shows only the modelID portion (e.g., "MiniMax-M2.1")
- **AND** the providerID is not visible in the dropdown

### Requirement: Model Integration with API
The system SHALL include the selected model in API requests to the OpenCode Server.

#### Scenario: Prompt submitted with selected model
- **GIVEN** the user has selected "MiniMax-M2.1" as the model
- **WHEN** the user submits a prompt via the input area
- **THEN** the frontend sends a request to `/api/execute-navigate` with the model included:
```json
{
  "prompt": "Create a new task",
  "sessionId": "ses_abc123",
  "model": {
    "providerID": "minimax-cn-coding-plan",
    "modelID": "MiniMax-M2.1"
  }
}
```

#### Scenario: Vite middleware forwards model to OpenCode Server
- **GIVEN** a request is received at `/api/execute-navigate` with model
- **WHEN** the request is processed
- **THEN** the Vite middleware forwards to OpenCode Server:
```json
POST /session/{sessionId}/prompt_async
{
  "model": {
    "providerID": "minimax-cn-coding-plan",
    "modelID": "MiniMax-M2.1"
  },
  "parts": [{ "type": "text", "text": "navigate: ..." }]
}
```

#### Scenario: No model selected uses default behavior
- **GIVEN** no model has been explicitly selected by the user
- **WHEN** the user submits a prompt
- **THEN** the model field is not included in the API request
- **AND** OpenCode Server uses its default model selection

### Requirement: Model State Management
The system SHALL manage model selection state with persistence.

#### Scenario: Model store initializes with default
- **GIVEN** the application is loaded for the first time
- **WHEN** the model store is initialized
- **THEN** the first model in the list ("MiniMax-M2.1") is selected by default

#### Scenario: Model store updates selection
- **GIVEN** the model store has a selected model
- **WHEN** `setSelectedModel(model)` is called with a different model
- **THEN** `selectedModel` is updated to the new model
- **AND** the new selection is saved to localStorage

#### Scenario: Model store loads from localStorage
- **GIVEN** localStorage contains a saved model selection
- **WHEN** the model store is initialized
- **THEN** the saved model is restored as the selected model

