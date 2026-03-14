# Change: Add Chinese/English Language Toggle

## Why
The UI currently displays all text in English only. Users who prefer Chinese need the ability to switch the interface language between Chinese and English.

## What Changes
- Add a language toggle button on the login page (alongside the theme toggle)
- Add a language toggle button on the main page (App.tsx) after login
- Create a new `i18n` capability with Zustand store for language state management
- Store language preference in localStorage for persistence across sessions
- Replace all hardcoded UI strings with translation keys
- Default language: English
- **IMPORTANT**: Only translate pure UI elements visible to users
- **EXCLUDED from translation**:
  - API error messages from server (already handled by backend)
  - Model/Provider names (MiniMax, OpenCode, Kimi, etc.)
  - File paths and technical identifiers
  - Non-user-facing strings
  - Brand name "Roadmap Manager" (always in English)

## Impact
- Affected specs: new `i18n` capability
- Affected code:
  - `LoginPage.tsx` - add language toggle button + translate UI strings
  - `App.tsx` - add language toggle button + fix search placeholder translation
  - `Header.tsx` - translate status text (Connected/Offline) + search placeholder + enhanced button styling
  - `InputArea.tsx` - translate placeholder + tooltip
  - `TaskCard.tsx` - no changes needed (no hardcoded text)
  - `MapsSidebar.tsx` - translate buttons + placeholders + tooltips
  - `SessionList.tsx` - translate button + empty state + tooltips
  - `SubtaskList.tsx` - translate prompt + placeholder (also fix existing bug)
  - `AccountPopup.tsx` - translate menu items + placeholders + messages + username display styling
  - `ModelSelector.tsx` - no changes needed (model names should stay English)
  - `ResultModal.tsx` - translate labels + status messages
  - New `store/i18nStore.ts` - language state management
  - New `utils/translations.ts` - translation dictionary (76 items)