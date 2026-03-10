# Claude Code — Backend API Context

## When working on this backend project:
- Check the existing middleware stack before adding new middleware.
- Follow the project's error handling pattern — look for existing error classes or handlers.
- Use the project's ORM/query builder consistently — don't mix raw SQL and ORM calls.
- Run the test suite after making changes: check package.json for the test command.

## Database Changes
- Create migration files for schema changes, never modify tables directly.
- Test migrations both up and down (rollback).
- Add seed data for development/testing environments.

## API Endpoints
- Follow the existing route registration pattern.
- Add input validation using the project's validation library (Zod, Joi, etc.).
- Write integration tests for new endpoints covering success and error cases.
- Document new endpoints in the project's API documentation format.
