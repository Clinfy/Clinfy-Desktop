# Clinfy Desktop — Claude Instructions

## Language

- All responses, code, comments, variable names, commit messages, and documentation MUST be written in English.
- Do NOT use Spanish or any other language in generated code or responses.

## Git

- Do NOT run any git commands (`git commit`, `git add`, `git push`, `git checkout`, etc.).
- Version control is handled exclusively by the developer.

## Workflow — Spec-Driven Development (SDD)

All non-trivial changes MUST follow the SDD workflow:

```
/sdd-new <change-name>   → explore + propose
/sdd-continue            → spec → design → tasks
/sdd-apply               → implement
/sdd-verify              → validate
/sdd-archive             → close
```

- **Never implement directly** without a proposal and spec for changes that touch multiple files or introduce new architecture.
- Simple, isolated fixes (typo, single-line correction) may be done inline without SDD.
- When in doubt, run `/sdd-new` first.

## Stack

- **Renderer**: React 19, TypeScript 6, Vite 8, Tailwind CSS 4, shadcn/ui
- **Main process**: Electron 41 with contextIsolation and no nodeIntegration
- **IPC**: exposed via `contextBridge` under `window.clinfy.*`
- **Build**: vite-plugin-electron + electron-builder

## Code Conventions

- Follow existing patterns in `electron/ipc/` for new IPC handlers.
- New UI components go in `src/components/ui/` (shadcn pattern).
- Use `cn()` from `src/lib/utils.ts` for conditional class merging.
- Shared Electron/renderer types go in `src/shared/types/`.
- No test runner is configured — do NOT generate test files unless one is installed first.
