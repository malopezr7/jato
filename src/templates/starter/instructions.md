# General Development Guidelines

## Code Quality
- Write clear, readable code. Favor explicitness over cleverness.
- Keep functions small and focused on a single responsibility.
- Name variables and functions descriptively — the name should explain the intent.
- Avoid premature abstraction. Duplicate code is better than the wrong abstraction.

## Version Control
- Write atomic commits that represent a single logical change.
- Use conventional commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`.
- Keep PRs small and reviewable. If a change is too big, break it into smaller PRs.

## Error Handling
- Handle errors at the appropriate level — don't swallow errors silently.
- Provide meaningful error messages that help diagnose the issue.
- Validate inputs at system boundaries (API endpoints, CLI args, user input).

## Testing
- Write tests for business logic and edge cases.
- Tests should be fast, independent, and deterministic.
- Use descriptive test names that explain the expected behavior.

## Documentation
- Document the "why", not the "what" — code should be self-explanatory.
- Keep README files up to date with setup and usage instructions.
- Add comments only where the code's intent isn't obvious.
