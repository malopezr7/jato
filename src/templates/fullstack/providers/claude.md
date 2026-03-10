# Claude Code — Full-Stack Context

## When working on this full-stack project:
- Identify whether a change affects frontend, backend, or both before starting.
- Check for shared types or contracts between frontend and backend.
- Run both frontend and backend tests after changes that touch the API layer.
- Follow the project's monorepo conventions for imports and dependencies.

## Frontend Changes
- Use the project's component library and design system.
- Test components with the project's testing setup (Jest, Vitest, Playwright, etc.).
- Check responsive design across breakpoints.

## Backend Changes
- Follow the existing route and controller patterns.
- Create migrations for database changes.
- Update API documentation when endpoints change.

## Cross-Stack Changes
- Update shared types when changing API contracts.
- Test the integration: frontend -> API -> database -> response -> frontend.
- Consider backward compatibility when changing API response shapes.
