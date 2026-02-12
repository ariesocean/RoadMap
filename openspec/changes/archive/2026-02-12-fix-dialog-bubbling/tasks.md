# Tasks: fix-dialog-bubbling

## Implementation Tasks

### 1. Fix SessionList dropdown button type
**Status:** pending
**Description:** Add explicit `type="button"` to the dropdown toggle button in SessionList.tsx
**File:** `roadmap-manager/src/components/SessionList.tsx`
**Lines:** ~109
**Validation:**
- Run the app and verify clicking session dropdown doesn't trigger form submit
- Command: `cd roadmap-manager && npm run dev`

### 2. Fix ModelSelector dropdown button type
**Status:** pending
**Description:** Add explicit `type="button"` to the dropdown toggle button in ModelSelector.tsx
**File:** `roadmap-manager/src/components/ModelSelector.tsx`
**Lines:** ~29
**Validation:**
- Run the app and verify clicking model selector doesn't trigger form submit
- Command: `cd roadmap-manager && npm run dev`

### 3. Verify Send button behavior
**Status:** pending
**Description:** Confirm Send button still triggers form submission correctly
**File:** `roadmap-manager/src/components/InputArea.tsx`
**Lines:** ~103-123
**Validation:**
- Type a prompt and click Send button - should submit
- Press Enter in textarea - should submit

### 4. Test full interaction flow
**Status:** pending
**Description:** Test complete user journey without unintended submissions
**Validation:**
- Open app
- Type in input box
- Click SessionList dropdown - should open, not submit
- Click ModelSelector dropdown - should open, not submit
- Select session/model - should work
- Click Send button - should submit

### 5. Run lint and typecheck
**Status:** pending
**Description:** Verify code quality after changes
**Validation:**
- Command: `cd roadmap-manager && npm run lint`
- Command: `cd roadmap-manager && npm run typecheck`
