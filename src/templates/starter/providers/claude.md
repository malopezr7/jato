# Claude Code Instructions

## Behavior
- Read existing code before making changes. Understand the codebase first.
- Prefer editing existing files over creating new ones.
- Keep changes minimal and focused on the requested task.
- Run tests after making changes to verify nothing is broken.

## Code Style
- Follow the existing code style and conventions in the project.
- Use the project's existing patterns for error handling, logging, and structure.
- Don't add unnecessary comments, type annotations, or documentation to unchanged code.

## Git
- Create atomic commits with clear, descriptive messages.
- Don't amend or force-push unless explicitly asked.
- Stage only the files relevant to the current change.
