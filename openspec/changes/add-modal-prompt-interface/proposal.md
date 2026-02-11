# Change: Add Prompt Interface to Task Result Modal

## Why

After creating a new task in the Roadmap Manager, users may want to continue refining or expanding on the task details through natural language prompts. Currently, the ResultModal only displays the execution results and provides a close button, requiring users to close the modal and use the main InputArea for any follow-up requests. This breaks the conversational flow and requires context switching.

## What Changes

- Enhanced ResultModal component to include a prompt input field at the bottom
- Added new state management for modal prompt mode (distinguishing between display-only and interactive modes)
- Implemented streaming response support within the modal for follow-up prompts
- Created a new API endpoint for modal-only prompt execution
- Added visual indicators to distinguish modal prompt mode from main input

## Impact

- Affected specs: modal-prompt (new capability)
- Affected code:
  - `src/components/ResultModal.tsx` - Enhanced modal with prompt interface
  - `src/store/resultModalStore.ts` - Extended state for prompt mode
  - `src/services/opencodeAPI.ts` - New API method for modal prompts
  - `src/hooks/useModalPrompt.ts` - New hook for modal prompt logic
