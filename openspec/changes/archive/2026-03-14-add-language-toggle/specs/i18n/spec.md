# i18n Specification Delta

## ADDED Requirements

### Requirement: Language Toggle UI
The system SHALL provide a language toggle button on the login page that allows users to switch between Chinese and English.

#### Scenario: Language toggle button display
- **WHEN** the login page renders
- **THEN** a language toggle button SHALL be displayed
- **AND** the button SHALL show the current language ("EN" or "中")

#### Scenario: User switches language
- **GIVEN** user is on the login page
- **WHEN** user clicks the language toggle button
- **THEN** the UI language SHALL switch between Chinese and English
- **AND** all UI text SHALL update immediately

#### Scenario: Language toggle placement
- **WHEN** the login page renders
- **THEN** the language toggle button SHALL be positioned near the theme toggle button in the top-right corner

### Requirement: Language Persistence
The system SHALL persist the user's language preference across sessions.

#### Scenario: Language preference saved
- **GIVEN** user has selected a language preference
- **WHEN** the language is changed
- **THEN** the preference SHALL be saved to localStorage

#### Scenario: Language preference restored on startup
- **GIVEN** user has previously selected a language preference
- **WHEN** the application starts
- **THEN** the saved language preference SHALL be loaded from localStorage
- **AND** the UI SHALL display in the saved language

#### Scenario: No saved preference uses default
- **GIVEN** no language preference is saved in localStorage
- **WHEN** the application starts
- **THEN** the default language SHALL be English

### Requirement: Translation Coverage
The system SHALL provide translations for all user-facing UI strings (75 items total).

#### Scenario: Login page translations (32 items)
- **WHEN** the login page displays in Chinese
- **THEN** the following strings SHALL be translated:
  - Title: "Roadmap Manager"
  - Tagline: "Your AI Personal Task Assistant" / "您的 AI 个人任务助手"
  - Sub-tagline: "Turn natural language into structured tasks and notes" / "将自然语言转化为结构化任务和笔记"
  - Labels: "Username or Email", "Password", "Email", "Invitation Code"
  - Buttons: "Sign In", "Sign Up", "Cancel", "Confirm", "Copy", "Got it"
  - Links: "Forgot password?", "Don't have an account?"
  - Modals: "Create an Account", "Get Invitation Code"
  - Placeholders: "Enter your username", "Choose a username", "Enter your email", "Create a password (min 6 characters)", "Confirm your password", "Enter invitation code"
  - Messages: Registration success, error messages

#### Scenario: Header translations (4 items)
- **WHEN** the header displays in Chinese
- **THEN** the following strings SHALL be translated:
  - "Connected" / "已连接"
  - "Offline" / "离线"
  - "Search tasks..." / "搜索任务..."
  - Theme toggle tooltips

#### Scenario: Account popup translations (13 items)
- **WHEN** the account popup displays in Chinese
- **THEN** the following strings SHALL be translated:
  - Menu items: "Change Username", "Change Password", "Logout"
  - Placeholders: "New username", "Current password", "New password", "Confirm new password"
  - Messages: Error and success messages

#### Scenario: Input area translations (2 items)
- **WHEN** the input area displays in Chinese
- **THEN** the following strings SHALL be translated:
  - Placeholder: "Enter a prompt to create or update tasks..." / "输入提示以创建或更新任务..."
  - Tooltip: "New conversation" / "新对话"

#### Scenario: Maps sidebar translations (8 items)
- **WHEN** the maps sidebar displays in Chinese
- **THEN** the following strings SHALL be translated:
  - Button: "New Map" / "新建地图"
  - Placeholder: "Map name..." / "地图名称..."
  - Empty state: "No maps found" / "暂无地图"
  - Tooltips: "Expand sidebar", "Collapse sidebar", "Rename", "Delete", "Confirm"

#### Scenario: Session list translations (5 items)
- **WHEN** the session list displays in Chinese
- **THEN** the following strings SHALL be translated:
  - Button: "New Conversation" / "新对话"
  - Count: "{n} sessions" / "{n} 个会话"
  - Empty state: "No sessions found" / "暂无会话"
  - Tooltips: "Refresh sessions", "Delete session", "Click again to confirm"

#### Scenario: Subtask list translations (3 items + 1 bug fix)
- **WHEN** the subtask list displays in Chinese
- **THEN** the following strings SHALL be translated:
  - Prompt: "ADD TASK" / "添加任务"
  - Placeholder: "Enter subtask content..." / "输入子任务内容..."
  - Tooltip: "Delete subtask" / "删除子任务"
- **AND** the existing placeholder bug SHALL be fixed:
  - Change from: `placeholder="输入任务内容..."`
  - Change to: `placeholder="Enter subtask content..."`

### Requirement: Translation Safety
The system SHALL NOT translate certain technical strings to avoid breaking functionality.

#### Scenario: API error messages preserved
- **WHEN** an API error message is received from the server
- **THEN** the error message SHALL display as-is (in English from backend)
- **AND** SHALL NOT be translated by the i18n system

#### Scenario: Model names preserved
- **WHEN** model names are displayed in the UI
- **THEN** model names (e.g., "MiniMax", "OpenCode", "Kimi") SHALL remain in English
- **AND** provider display names SHALL remain in English

#### Scenario: Fallback for missing translations
- **GIVEN** a translation key is missing from the dictionary
- **WHEN** the `t()` function is called with the missing key
- **THEN** it SHALL return the English fallback value
- **AND** SHALL NOT throw an error or display undefined

### Requirement: i18n Store
The system SHALL provide a Zustand store for managing language state.

#### Scenario: Store provides current language
- **WHEN** a component needs the current language
- **THEN** the store SHALL provide `language` state with value "en" or "zh"

#### Scenario: Store provides translation function
- **WHEN** a component needs translated text
- **THEN** the store SHALL provide a `t(key: string)` function that returns the translated string

#### Scenario: Store provides setLanguage action
- **WHEN** user changes the language
- **THEN** the store SHALL provide `setLanguage(lang: 'en' | 'zh')` action to update the language