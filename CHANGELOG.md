# @malopezr7/jato

## 0.2.0

### Minor Changes

- ### New features

  - `jato skill install` command to install the jato-manager skill to detected providers
  - Skills now follow the official Anthropic SKILL.md format with YAML frontmatter and trigger phrases

  ### Fixes

  - Hub directory renamed from `rigs/` to `jatos/` for consistency with the project name
  - Package renamed to `@malopezr7/jato` for npm publish

  ### Improvements

  - jato-manager skill rewritten with progressive disclosure, troubleshooting section, and skill recommendations by stack
  - jato-context skill now includes YAML frontmatter with dynamic jato name
  - Both CLI and guided manual jato creation are supported
