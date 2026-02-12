# InputBox UI Redesign - Design Document

**Date:** 2026-02-13  
**Status:** Approved  
**Designer:** AI Assistant

---

## Overview

Redesign the InputArea component in Roadmap Manager to create a cleaner, more modern interface inspired by OpenCode's design language. The redesign focuses on minimalism, better component positioning, and subtle visual feedback.

---

## Goals

1. Remove visual clutter by eliminating the submit button
2. Reposition controls for better UX (model on left, sessions on right)
3. Add elegant processing state visualization (animated gradient line)
4. Maintain Enter-only keyboard submission (remove all click-to-submit)
5. Keep minimal, clean design aesthetic

---

## Final Design

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Enter a prompt to create or update tasks...                 │  ← Textarea
│                                                              │
└──────────────────────────────────────────────────────────────┘
├═════════════════════════════════════════════════════════════┤  ← Gradient line (processing)
│ [MiniMax-M2.1 MiniMax ▼]         [💬 Session ▼] +          │  ← Toolbar
│     ↑ ModelSelector (left)              ↑ SessionList (right)│
│     Minimal text-style                                        │
└──────────────────────────────────────────────────────────────┘
```

### Processing State

When `isProcessing = true`, an animated gradient line flows through the middle of the separator:

```
═══════════════◀═══════════════════════════════════════▶
     (blue → purple → cyan → transparent gradient flow)
```

---

## Component Changes

### 1. InputArea.tsx

**Changes:**
- ✅ **Remove submit button entirely** - Click anywhere no longer triggers submission
- ✅ **Remove form onSubmit handler** - Only Enter key triggers submission
- ✅ **Remove animated gradient border** - Replaced with animated gradient line
- ✅ **Add animated gradient line in separator** - Middle of textarea/toolbar boundary
- ✅ **Reposition toolbar**: ModelSelector left, SessionList right

**Toolbar Layout:**
```jsx
<div className="relative">
  {/* Animated gradient line in the middle */}
  <div className="absolute left-0 right-0 top-0 h-px overflow-hidden">
    <div className={`w-full h-full ${isProcessing ? 'gradient-line-animation' : ''}`} />
  </div>
  
  {/* Toolbar content */}
  <div className="px-3 py-2 flex items-center justify-between ... rounded-b-2xl">
    <ModelSelector />  {/* Left side */}
    <SessionList />     {/* Right side */}
  </div>
</div>
```

### 2. ModelSelector.tsx

**Changes:**
- ✅ **Remove background color** - No colored pill background
- ✅ **Remove border** - Clean text-only appearance
- ✅ **Remove dot indicator** - No color dot
- ✅ **Swap display order** - Model name first, Provider name second
- ✅ **Adjust font weights** - Model name bold, Provider name lighter
- ✅ **Match font size with SessionList** - All text-xs
- ✅ **Text color only** - Provider differentiation via text color

**Visual Style:**
```
MiniMax-M2.1 MiniMax ▼  ← Model name (bold), Provider name (lighter)
```

**Display Format:**
```
Primary: {model.displayName} {formatProviderName(model.providerID)}
Secondary: {formatProviderName(model.providerID)} (lighter opacity)
```

**Dropdown Menu:**
- All items use text-xs font size
- Model name bold, provider name lighter opacity
- Clean list without color dots

### 3. SessionList.tsx

**Changes:**
- ✅ **Increase button text width** - max-w-[160px] (was 120px)
- ✅ **Decrease dropdown font sizes** - Match ModelSelector (text-xs)
- ✅ **Maintain pill-style button** - With icon
- ✅ **Consistent toolbar positioning** - Right side

**Dimensions:**
- Button text max-width: `160px`
- Dropdown width: `w-72` (18rem / 288px)
- Dropdown item font: `text-xs`
- "New Conversation" button: `text-xs`

---

## Visual Effects

### Animated Gradient Line (Processing State)

**Location:** Middle of the separator line between textarea and toolbar

**Implementation:**
```css
.gradient-line-animation {
  background: linear-gradient(
    90deg,
    transparent 0%,
    #0078D4 20%,
    #6366F1 40%,
    #8B5CF6 60%,
    #06B6D4 80%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: gradient-line-flow 2s linear infinite;
}

@keyframes gradient-line-flow {
  0% {
    background-position: 100% 0%;
  }
  100% {
    background-position: -100% 0%;
  }
}
```

**Effect:**
- Horizontal gradient flowing left to right
- Colors: Blue → Purple → Cyan → Transparent
- Smooth continuous animation during processing
- Returns to invisible when not processing

---

## Color Scheme

### ModelSelector Colors (Text Only)

| Provider | ProviderID | Text Color |
|----------|------------|------------|
| MiniMax | minimax-cn-coding-plan | Orange |
| Alibaba | alibaba-cn | Purple |
| OpenCode | opencode | Blue |
| Zhipu | zhipuai | Emerald |

**Style:**
- Light mode: `text-orange-600`, `text-purple-600`, etc.
- Dark mode: `text-orange-400`, `text-purple-400`, etc.

### SessionList Colors

- Button: Secondary text color with pill background
- Icon: Opacity reduced (60%)
- Dropdown: Consistent with other dropdowns

---

## Interaction Details

### Submission Behavior (Modified)

**✅ ENTER-ONLY SUBMISSION**
- **Enter**: Submit prompt
- **Shift + Enter**: Insert new line in textarea
- **Click anywhere**: No action (no submission)
- **Escape**: Close any open dropdowns

**Previous (Removed):**
- Click on textarea → Submit ❌
- Click on toolbar → Submit ❌
- Form submit handler → Removed ✅

### Hover States

**ModelSelector:**
- Hover: `hover:bg-secondary-bg/50` (subtle background)
- No background color by default

**SessionList:**
- Hover: Background darkens slightly
- Pill style maintained

### Dropdown Positioning

- ModelSelector dropdown: Opens upward (bottom-full)
- SessionList dropdown: Opens upward (bottom-full)
- Z-index: `z-[200]` to appear above other content
- Fixed positioning to avoid clipping issues

---

## Technical Implementation

### Files Modified

1. `src/components/InputArea.tsx` - Removed submit, added gradient line
2. `src/components/ModelSelector.tsx` - Minimal text-only redesign
3. `src/components/SessionList.tsx` - Width and font adjustments
4. `src/styles/index.css` - Added gradient line animation

### State Management

- Use existing `isProcessing` from `useTaskStore`
- No new state needed
- Removed form submit handler

### CSS Animations

**gradient-line-animation** (in index.css):
- Horizontal flowing gradient
- 2 second animation cycle
- Applied during processing state only

---

## Accessibility

- ✅ Keyboard navigation maintained
- ✅ Enter key submission preserved
- ✅ Dropdowns remain accessible
- ✅ Color contrast maintained for text
- ✅ Hover states provide visual feedback

---

## Success Criteria

1. ✅ **Submit button completely removed**
2. ✅ **Only Enter key submits** - No click-to-submit
3. ✅ **ModelSelector minimal text-style on left**
4. ✅ **SessionList pill-style on right**
5. ✅ **Animated gradient line during processing**
6. ✅ **All existing functionality preserved**
7. ✅ **Clean, modern minimal aesthetic**
8. ✅ **Both light and dark themes polished**
9. ✅ **Consistent font sizes between components**
10. ✅ **Dropdown widths and positioning correct**

---

## Design Evolution Summary

| Version | Change |
|---------|--------|
| v1.0 | Initial design with gradient border |
| v1.1 | ✅ Removed gradient border |
| v1.2 | ✅ Added gradient line in separator middle |
| v1.3 | ✅ ModelSelector: Removed background, border, dot |
| v1.4 | ✅ ModelSelector: Swapped model/provider order |
| v1.5 | ✅ Removed all click-to-submit, Enter-only |
| v1.6 | ✅ SessionList: 120px → 160px text width |
| v1.7 | ✅ SessionList: Font sizes match ModelSelector |

---

## Notes

- The gradient line is subtle and positioned in the middle of the separator
- ModelSelector maintains identity through text color, not background
- Font consistency between ModelSelector and SessionList dropdowns
- All submission happens via keyboard only - cleaner UX

