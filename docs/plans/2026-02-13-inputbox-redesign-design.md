# InputBox UI Redesign - Design Document

**Date:** 2026-02-13  
**Status:** Approved

---

## Overview

Redesign InputArea component for cleaner, modern interface. Focus on minimalism, better positioning, and subtle visual feedback.

## Goals

1. Remove submit button - Enter-only submission
2. Reposition controls (model left, sessions right)
3. Add animated gradient line during processing
4. Maintain Enter-only keyboard submission
5. Keep minimal, clean design

---

## Final Design

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Enter a prompt to create or update tasks...                 │
└──────────────────────────────────────────────────────────────┘
├═════════════════════════════════════════════════════════════┤
│ [MiniMax-M2.1 MiniMax ▼]         [💬 Session ▼] +          │
│     ↑ ModelSelector (left)              ↑ SessionList (right)
```

### Processing State

When `isProcessing = true`, animated gradient line flows through separator:
```
══════════════◀══════════════════════════════════════▶
   (blue → purple → cyan → transparent gradient)
```

---

## Color Scheme

### ModelSelector (Text Only)

| Provider | Text Color |
|----------|------------|
| MiniMax | Orange |
| Alibaba | Purple |
| OpenCode | Blue |
| Zhipu | Emerald |

---

## Submission Behavior

**ENTER-ONLY SUBMISSION:**
- **Enter**: Submit prompt
- **Shift + Enter**: New line in textarea
- **Click**: No action (no submission)
- **Escape**: Close dropdowns

---

## Technical Implementation

### Files Modified
1. `src/components/InputArea.tsx` - Removed submit, added gradient line
2. `src/components/ModelSelector.tsx` - Minimal text-only style
3. `src/components/SessionList.tsx` - Width and font adjustments
4. `src/styles/index.css` - Gradient line animation

### CSS Animation
- Horizontal flowing gradient during processing
- 2 second animation cycle

---

## Success Criteria

1. ✅ Submit button removed
2. ✅ Enter-only submission
3. ✅ ModelSelector minimal on left
4. ✅ SessionList on right
5. ✅ Animated gradient during processing
6. ✅ Both themes polished

---

## Design Evolution

| Version | Change |
|---------|--------|
| v1.0 | Initial gradient border |
| v1.1 | Removed gradient border |
| v1.2 | Added gradient line |
| v1.3-1.5 | Minimal styling, Enter-only |
| v1.6-1.7 | Font/width consistency |
