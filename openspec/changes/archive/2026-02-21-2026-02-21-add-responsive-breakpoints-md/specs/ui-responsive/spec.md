# UI Responsive Breakpoints Specification

## Purpose
Defines the responsive breakpoint system and visual transition patterns for consistent UI scaling across device sizes.

## ADDED Requirements
### Requirement: 4-Level Breakpoint System
The system SHALL use a 4-level breakpoint system for smooth visual transitions across device sizes.

#### Scenario: Breakpoint definitions
- **WHEN** screen width is <640px
- **THEN** default (base) styles SHALL apply (small mobile)

- **WHEN** screen width is ≥640px
- **THEN** `sm:` styles SHALL apply (landscape phone / small tablet)

- **WHEN** screen width is ≥768px
- **THEN** `md:` styles SHALL apply (tablet / small laptop)

- **WHEN** screen width is ≥1024px
- **THEN** `lg:` styles SHALL apply (desktop)

### Requirement: Font Size Scaling
The system SHALL apply consistent font size scaling across breakpoints for visual hierarchy.

#### Scenario: Main title font scaling
- **WHEN** viewing main page title
- **THEN** font size SHALL scale: text-base (16px) → text-lg (18px) → text-xl (20px) → text-2xl (24px)

#### Scenario: Card title font scaling
- **WHEN** viewing task card titles
- **THEN** font size SHALL scale: text-sm (14px) → text-base (16px) → text-base (16px) → text-lg (18px)

#### Scenario: Body text font scaling
- **WHEN** viewing body text content
- **THEN** font size SHALL scale: text-xs (12px) → text-sm (14px) → text-sm (14px) → text-base (16px)

#### Scenario: Helper text font scaling
- **WHEN** viewing helper/auxiliary text
- **THEN** font size SHALL scale: text-[10px] (10px) → text-xs (12px) → text-xs (12px) → text-sm (14px)

#### Scenario: Icon size scaling
- **WHEN** viewing icons throughout the UI
- **THEN** icon size SHALL scale: w-3.5 h-3.5 → w-4 h-4 → w-4 h-4 → w-5 h-5

### Requirement: Spacing System
The system SHALL apply consistent spacing scaling across breakpoints using 1.5x progression ratio.

#### Scenario: Card padding scaling
- **WHEN** viewing card internal padding
- **THEN** padding SHALL scale: p-2 (8px) → p-3 (12px) → p-3 (12px) → p-4 (16px)

#### Scenario: Card margin scaling
- **WHEN** viewing spacing between cards
- **THEN** margin SHALL scale: mb-2 (8px) → mb-3 (12px) → mb-3 (12px) → mb-4 (16px)

#### Scenario: Gap scaling
- **WHEN** viewing gap between elements
- **THEN** gap SHALL scale: gap-1 (4px) → gap-2 (8px) → gap-2 (8px) → gap-3 (12px)

#### Scenario: Header/Content horizontal padding scaling
- **WHEN** viewing page layout horizontal padding
- **THEN** padding SHALL scale: px-3 (12px) → px-4 (16px) → px-5 (20px) → px-6 (24px)

### Requirement: Component Coverage
The following components SHALL implement the 4-level responsive breakpoint system:

#### Scenario: App component responsive layout
- **WHEN** App.tsx renders
- **THEN** Header layout, Logo size, search box width, and main content spacing SHALL follow breakpoint rules

#### Scenario: TaskCard responsive styling
- **WHEN** TaskCard.tsx renders
- **THEN** card title, description text, icon sizes, spacing and padding SHALL follow breakpoint rules

#### Scenario: TaskList responsive spacing
- **WHEN** TaskList.tsx renders
- **THEN** list item spacing SHALL follow breakpoint rules

#### Scenario: SubtaskList responsive styling
- **WHEN** SubtaskList.tsx renders
- **THEN** subtask item font, icons, and spacing SHALL follow breakpoint rules

#### Scenario: InputArea responsive sizing
- **WHEN** InputArea.tsx renders
- **THEN** input area padding and button sizes SHALL follow breakpoint rules

#### Scenario: ResultModal responsive sizing
- **WHEN** ResultModal.tsx renders
- **THEN** modal font, padding, and icon sizes SHALL follow breakpoint rules

#### Scenario: ModelSelector responsive styling
- **WHEN** ModelSelector.tsx renders
- **THEN** model selector font and spacing SHALL follow breakpoint rules
