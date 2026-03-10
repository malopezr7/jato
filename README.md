# rig

Centralized configuration manager for AI coding tools.

**One directory configures all your AI tools. Switch context with one command. Share config with your team via git clone.**

## What is rig?

rig manages configurations for AI coding tools (Claude Code, Codex CLI, Gemini CLI, OpenCode) from a single source of truth: `~/.rig/`.

You organize your configs into **rigs** — named profiles like `mobile`, `backend`, `code-review`. Each rig contains instructions, skills, MCP server configs, and provider-specific settings. When you run `rig use mobile`, rig materializes the native config files each tool expects.

## Install

```bash
pnpm install -g rig
```

Requires Node.js >= 22.

## Quick Start

```bash
# Create your first rig
rig init

# Or non-interactively:
rig init --template starter --name my-rig --yes

# Activate it
rig use my-rig

# See what's active
rig list

# Check health
rig doctor
```

## Commands

### `rig init`

Interactive setup wizard with three paths:

- **Import** — Detects installed AI tools, extracts their MCPs, instructions, and permissions into a new rig
- **Template** — Creates from a built-in template (`starter`, `mobile`, `backend`, `fullstack`)
- **Empty** — Scaffolds a minimal rig for manual configuration

Non-interactive flags: `--from <providers>`, `--template <name>`, `--empty`, `--name <name>`, `--yes`

### `rig use <name>`

Activates a rig. Materializes native config files for each enabled provider:

- Claude Code: `~/.claude/settings.json`, `CLAUDE.md`, skills
- Codex CLI: `~/.codex/config.toml`, `AGENTS.md`
- Gemini CLI: `~/.gemini/settings.json`, `GEMINI.md`
- OpenCode: `~/.config/opencode/opencode.json`

Also installs two skills in each provider's skill directory:
- **rig-context** — Briefing about the active rig's available skills, MCPs, and instructions
- **rig-manager** — Teaches the LLM to create, modify, and manage rigs conversationally

### `rig use` (no argument)

Shows which rig is currently active.

### `rig list`

Lists all available rigs, marks the active one.

### `rig off`

Deactivates the current rig.

### `rig doctor`

Health checks: hub exists, rig is valid, providers are installed, env vars are set, files are materialized.

### `rig install <repo-url>`

Clones a git repo and copies its rigs to `~/.rig/rigs/`.

## Hub Structure

```
~/.rig/
  config.yaml                 ← active_rig: <name>
  skills/
    rig-manager.md            ← global meta-skill
  rigs/
    mobile/
      rig.yaml                ← manifest
      instructions.md         ← shared instructions
      providers/
        claude.md             ← materializes as CLAUDE.md
        codex.md              ← materializes as AGENTS.md
      skills/
        code-review.md
        testing.md
      agents/
        reviewer.md
```

## Rig Manifest (`rig.yaml`)

```yaml
name: mobile
description: React Native mobile development setup

providers:
  claude: true
  codex: true
  gemini: false

mcp_servers:
  - id: github
    command: npx
    args: [-y, "@modelcontextprotocol/server-github"]
    env: [GITHUB_TOKEN]

permissions:
  auto_execute: false
```

## Supported Providers

| Provider | Config File | Instructions | Skills |
|----------|------------|--------------|--------|
| Claude Code | `~/.claude/settings.json` | `CLAUDE.md` | `~/.claude/skills/` |
| Codex CLI | `~/.codex/config.toml` | `AGENTS.md` | `~/.codex/skills/` |
| Gemini CLI | `~/.gemini/settings.json` | `GEMINI.md` | `~/.gemini/skills/` |
| OpenCode | `~/.config/opencode/opencode.json` | — | — |

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

## License

MIT
