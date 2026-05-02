# Project

SNU (Seoul National University) Course Registration Helper

## Architecture & Structure

- idol/: Backend REST API (Handles time synchronization and captcha solving).
- mitsuha/: AI model training code for captcha resolution.
- src/: Frontend Chrome Extension (React).
  - assets/: Static files (images, icons).
  - core/: Service worker logic.
  - popup/: Popup page UI.
  - style/: CSS files.
  - views/: React components.
  - main.tsx: React entry point.

## Development Rules

- Build: Use `npm run build`.
- Formatting: Strictly adhere to `.editorconfig`.
- Chrome Message Passing:
  1. Register opcodes in `core/background.ts`.
  2. Message format must strictly be: `{ opcode: number, (payload) }`. Refer to existing examples.
  3. Use explicit opcode naming (e.g., "CAPTCHA_SOLVE_REQUEST").
  4. Route and handle all messages via opcode branching.
