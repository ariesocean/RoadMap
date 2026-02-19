# OpenCode Project: Roadmap

## Overview

macOS native desktop application for managing `roadmap.md` with Microsoft To Do-style UI. Part of the OpenCode AI coding toolkit.

## Tech Stack

- **Runtime**: Vite dev server
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **Icons**: lucide-react

## Project Structure

```
RoadMap/
├── roadmap-manager/
│   └── src/                      # React application
│       ├── components/           # React components (PascalCase)
│       ├── hooks/                # Custom React hooks (use*.ts)
│       ├── services/             # API and file services
│       ├── store/                # Zustand stores (*Store.ts)
│       ├── utils/                # Utility functions
│       ├── constants/            # App constants
│       ├── config/               # App configuration
│       ├── styles/               # Global styles
│       ├── types/                # TypeScript type definitions
│       └── test/                 # Test utilities
├── openspec/                     # OpenSpec documentation
├── roadmap.md                    # Main task roadmap
└── achievements.md               # Completed tasks archive
```

## Capabilities

### input-interaction
Form submission control - ensures input area only submits when user explicitly intends to send a prompt.

### modal-prompt
Modal dialog interface for displaying results and confirmations.

### model-selection
Model selection dropdown for choosing AI models.

### session
Session management - persistent conversation context across app restarts.

## Dependencies

See `roadmap-manager/package.json` for current dependencies.

## Status

Active development of task management skills.
