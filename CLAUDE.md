# Agile Battle - Project Instructions

This file contains instructions and context for Claude Code when working in this project.

## Project Overview

**Agile Battle** is a real-time two-player quiz game about Agile/Scrum knowledge.

- Players join a room (host creates, guest joins via 5-character code)
- 20 questions per game: Scrum, Kanban, and Agile principles (MCQ, true/false, fill-in-the-blank)
- 15-second timer per question — faster correct answers = more points (up to 200 + 50 speed bonus)
- Leaderboard checkpoints every 5 questions, winner screen at the end
- Host's browser drives the state machine; guest follows via Firebase sync
- No login, no persistence — open play, disposable rooms
- Uses seeded shuffle so both players get identical question order

## Tech Stack

- **Frontend**: Single-file `index.html` (HTML + CSS + vanilla JS, no build step)
- **Database**: Firebase Realtime Database (real-time sync between players)
- **Hosting**: Netlify Drop (static deploy via drag and drop)
- **Fonts**: Google Fonts (Syne, JetBrains Mono)

## Development Conventions

<!-- Document coding style, naming conventions, file structure, etc. -->

## Common Commands

<!-- List frequently used commands, e.g.: -->
<!-- npm run dev - Start development server -->
<!-- npm test - Run tests -->

## Deployment

- **Netlify Drop** — drag and drop the project folder (or index.html) onto drop.netlify.com to publish instantly
- No build step required; the app is a single static `index.html`

## Suggested VS Code Extensions

- **Firebase Explorer** (`jsayol.firebaseexplorer`) — browse and inspect Firebase Realtime Database from VS Code
- **Prettier** (`esbenp.prettier-vscode`) — format the single-file HTML/CSS/JS consistently
- **ESLint** (`dbaeumer.vscode-eslint`) — catch JS errors and bad patterns in the script block
- **Error Lens** (`usernamehw.errorlens`) — surface lint/type errors inline in the editor
- **HTML CSS Support** (`ecmel.vscode-html-css`) — CSS class autocomplete inside HTML files
- **indent-rainbow** (`oderwat.indent-rainbow`) — visual indentation guides, helpful in large single-file HTML

## Notes for Claude

### Do Not Modify
- **Firebase config block** in `index.html` (lines ~14–27) — credentials and project settings are already configured and working. Never touch this block.
