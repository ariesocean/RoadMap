# Fix Dialog Bubbling Issue

**Change ID:** `fix-dialog-bubbling`

**Type:** Bug Fix

**Priority:** High

**Status:** Draft

## Summary

Dialog bubbling issue causes unintended form submissions when clicking interactive elements (ModelSelector, SessionList) inside the input area form.

## Problem Description

When a user types a prompt in the homepage input box and clicks on any area below (such as ModelSelector dropdown or SessionList dropdown), it triggers the send action. This prevents users from selecting different models or managing sessions.

### Root Cause

The `InputArea` component contains a `<form>` element wrapping the entire input card, including the toolbar with `SessionList` and `ModelSelector` components. Buttons inside a form without an explicit `type` attribute default to `type="submit"`, causing click events to bubble up and trigger form submission.

### Affected Components

1. **InputArea.tsx** - Form wrapper causing submission on any internal button click
2. **SessionList.tsx** - Dropdown button triggers form submission due to missing `type="button"`
3. **ModelSelector.tsx** - Dropdown button triggers form submission due to missing `type="button"`

## Proposed Solution

1. Add explicit `type="button"` to all non-submit buttons within the `InputArea` form
2. Verify `SessionList` and `ModelSelector` dropdown buttons prevent form submission
3. Add event propagation guards if necessary

## Scope

### In Scope
- Fix button types in InputArea.tsx
- Fix button types in SessionList.tsx
- Fix button types in ModelSelector.tsx
- Verify no regression in form submission behavior

### Out of Scope
- Architectural changes to component structure
- Changes to form submission logic
- Styling changes

## Dependencies

None.

## Risks

**Low Risk:** Simple fix adding explicit button types. No functional logic changes.

## Acceptance Criteria

1. Clicking ModelSelector dropdown does not trigger send
2. Clicking SessionList dropdown does not trigger send
3. Form submit only triggers on Enter key or Send button click
4. Send button continues to work correctly

## References

- [React Forms: Button Types](https://react.dev/learn/forms#button-types)
- [HTML Button Type Attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#type)
