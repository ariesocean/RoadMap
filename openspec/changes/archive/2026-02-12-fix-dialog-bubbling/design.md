# Design: fix-dialog-bubbling

## Overview

This is a straightforward bug fix addressing event bubbling in React forms. No extensive design documentation required.

## Solution

### Root Cause
HTML `<button>` elements inside a `<form>` default to `type="submit"` when no type attribute is specified. This causes click events to trigger form submission.

### Fix
Add explicit `type="button"` to all buttons that should not submit the form:
- SessionList dropdown toggle button
- ModelSelector dropdown toggle button
- New session button inside SessionList dropdown
- Refresh session button inside SessionList dropdown
- Any other non-submit buttons inside the form

### Technical Details
- No state management changes required
- No prop interface changes required
- No component re-architecture needed
- Purely additive change (adding type attributes)

## Alternative Considered

**Option 1: Move dropdowns outside form (Not Selected)**
- Would require restructuring component hierarchy
- More invasive change
- Higher risk of introducing bugs

**Option 2: Add event.stopPropagation() (Not Selected)**
- More verbose and error-prone
- Would need to be applied to every click handler
- Less maintainable

**Selected: Add type="button" attributes**
- Minimal, targeted fix
- Follows HTML best practices
- Low risk, high reliability
