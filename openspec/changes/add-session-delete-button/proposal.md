# Change: Add Session Delete Button

## Why
Users need the ability to delete unwanted sessions directly from the session list UI. Currently, sessions can only be managed through the server API, but there's no UI to delete them. The feature should only allow deleting sessions that start with "navigate:" since those are server-created sessions, and require confirmation to prevent accidental deletion.

## What Changes
- Add delete button (X icon) to each session item in SessionList dropdown
- Delete button positioned at far right of each session row
- Delete button is nearly invisible (very light red) by default
- On hover, delete button becomes bright red
- Delete button only visible/enabled for sessions with "navigate:" prefix in title
- First click on delete button shows confirmation state
- Second click (when in confirmation state) actually deletes the session via SDK

## Impact
- Affected specs: `session`
- Affected code: `roadmap-manager/src/components/SessionList.tsx`, `roadmap-manager/src/store/sessionStore.ts`
