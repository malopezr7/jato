# Full-Stack Web Development Guidelines

## Architecture
- Separate frontend and backend concerns clearly, even in a monorepo.
- Use a shared types package or directory for types used across frontend and backend.
- API contracts should be defined explicitly (OpenAPI spec, tRPC, or shared Zod schemas).

## Frontend
- Use component-driven development: build small, reusable components.
- Keep business logic out of components — use custom hooks or service modules.
- Implement loading, error, and empty states for all async data.
- Use server state management (React Query, SWR) for API data — don't duplicate in local state.
- Follow accessibility best practices: semantic HTML, ARIA labels, keyboard navigation.

## Backend
- Use RESTful conventions or GraphQL consistently — don't mix without reason.
- Validate all inputs at the API boundary with a schema validator.
- Use middleware for cross-cutting concerns: auth, logging, rate limiting, CORS.
- Write database migrations for all schema changes.

## Shared Concerns
- Use environment variables for configuration — never hardcode URLs, keys, or secrets.
- Implement proper error boundaries on the frontend and error handlers on the backend.
- Use TypeScript on both ends for type safety across the stack.
- Set up CI/CD that runs tests, linting, and type checking for both frontend and backend.

## Development Workflow
- Run frontend and backend in parallel during development.
- Use consistent code formatting (Prettier/Biome) across the entire project.
- Write integration tests that cover the full request cycle (frontend -> API -> database).
