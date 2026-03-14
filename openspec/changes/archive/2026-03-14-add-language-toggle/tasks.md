## 1. Core Infrastructure
- [x] 1.1 Create `i18nStore.ts` with Zustand for language state (zh/en, default: en)
- [x] 1.2 Create `translations.ts` with translation dictionary for all UI strings (75 items)
- [x] 1.3 Add localStorage persistence for language preference

## 2. LoginPage.tsx Translations
- [x] 2.1 Title, tagline, and labels
- [x] 2.2 Buttons and links
- [x] 2.3 Placeholders (Enter your username, Password, etc.)
- [x] 2.4 Error and success messages
- [x] 2.5 Registration modal content
- [x] 2.6 Invitation help modal content

## 3. Header.tsx Translations
- [x] 3.1 Status text (Connected/Offline)
- [x] 3.2 Search placeholder (Search tasks...)
- [x] 3.3 Theme toggle tooltips

## 4. AccountPopup.tsx Translations
- [x] 4.1 Menu items (Change Username, Change Password, Logout)
- [x] 4.2 Placeholders
- [x] 4.3 Error and success messages

## 5. InputArea.tsx Translations
- [x] 5.1 Placeholder text
- [x] 5.2 Tooltip (New conversation)

## 6. MapsSidebar.tsx Translations
- [x] 6.1 Button text (New Map)
- [x] 6.2 Placeholder (Map name...)
- [x] 6.3 Empty state (No maps found)
- [x] 6.4 Tooltips (Expand/Collapse sidebar, Rename, Delete, Confirm)

## 7. SessionList.tsx Translations
- [x] 7.1 Button and default title (New Conversation)
- [x] 7.2 Session count ({n} sessions)
- [x] 7.3 Empty state (No sessions found)
- [x] 7.4 Tooltips (Refresh sessions, Delete session, Click again to confirm)

## 8. SubtaskList.tsx Translations
- [x] 8.1 Add task prompt (ADD TASK)
- [x] 8.2 Placeholder (Enter subtask content...)
- [x] 8.3 Tooltip (Delete subtask)
- [x] 8.4 **FIX BUG**: Change placeholder from "输入任务内容..." to "Enter subtask content..."

## 9. Testing & Validation
- [x] 9.1 Verify language toggle persists after page refresh
- [x] 9.2 Verify all UI strings display correctly in both languages
- [x] 9.3 Verify API error messages are NOT translated (they should display as-is from server)
- [x] 9.4 Verify model/provider names remain in English
- [x] 9.5 Run type check: `npx tsc --noEmit`

---

## 10. Additional Bug Fixes & UI Improvements
- [x] 10.1 Fix App.tsx search placeholder (was hardcoded "Search tasks...")
- [x] 10.2 Update joinTagline translation: "使用Roadmap Manager来管理你的任务和笔记"
- [x] 10.3 Update invitationCodeHelp: "此应用暂不对外开放，请添加微信获取邀请码。"

## 11. Language Toggle Button Enhancements
- [x] 11.1 Add language toggle button to App.tsx (main page, after login)
- [x] 11.2 Enhance button styling with background and border (Header.tsx)
- [x] 11.3 Add button to App.tsx without background, matching theme colors
- [x] 11.4 Adjust button order: language toggle before theme toggle
- [x] 11.5 Adjust button spacing (-mr-5) in App.tsx

## 12. Username Display Styling
- [x] 12.1 Increase username font size to text-sm with font-medium
- [x] 12.2 Use secondary text color for better visibility without being too bright

---

## Important Notes

### Items NOT to Translate
- API error messages from server (e.g., "Login failed", "Registration failed")
- Model names (MiniMax, OpenCode, Kimi, etc.)
- Provider names in ModelSelector
- Technical identifiers and file paths
- Date/time formatting (use locale-aware formatting instead)
- "Roadmap Manager" brand name (always in English)

### Implementation Safety
- Always test that translated text doesn't break layout/overflow
- Keep button labels short - avoid long translations that break UI
- Use `t()` function with fallback to English for safety
- Do NOT translate strings that come directly from API responses

---

## Translation Summary (76 items)

### LoginPage.tsx (32 items)
- Title, tagline, labels, buttons, links, placeholders, error/success messages
- joinTagline: "Join Roadmap Manager..." / "使用Roadmap Manager来管理你的任务和笔记"
- invitationCodeHelp: "This app is currently..." / "此应用暂不对外开放，请添加微信获取邀请码。"

### Header.tsx (4 items)
- Status text, search placeholder, theme tooltips

### App.tsx (1 item)
- Search placeholder translation

### AccountPopup.tsx (13 items)
- Menu items, placeholders, error/success messages
- Username display styling adjustments

### InputArea.tsx (2 items)
- Placeholder, tooltip

### MapsSidebar.tsx (8 items)
- Button, placeholder, empty state, tooltips

### SessionList.tsx (5 items)
- Button, count, empty state, tooltips

### SubtaskList.tsx (3 items)
- Add task prompt, placeholder, tooltip

### Bug Fix (1 item)
- SubtaskList placeholder: "输入任务内容..." → "Enter subtask content..."
