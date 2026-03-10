<p align="center">
  <img src="https://img.shields.io/badge/jato-v0.1.0-e0944a?style=flat-square&labelColor=1a1a1a" alt="version" />
  <img src="https://img.shields.io/github/license/malopezr7/jato?style=flat-square&labelColor=1a1a1a&color=918e88" alt="license" />
  <img src="https://img.shields.io/github/stars/malopezr7/jato?style=flat-square&labelColor=1a1a1a&color=918e88" alt="stars" />
  <img src="https://img.shields.io/badge/node-%3E%3D22-918e88?style=flat-square&labelColor=1a1a1a" alt="node" />
  <img src="https://img.shields.io/github/last-commit/malopezr7/jato?style=flat-square&labelColor=1a1a1a&color=918e88" alt="last commit" />
</p>

<h1 align="center">jato</h1>

<p align="center">
  <strong>One directory. Every AI tool.</strong><br />
  <sub>Centralized configuration for Claude Code, Codex CLI, Gemini CLI, and OpenCode.</sub><br /><br />
  <a href="https://jato.pages.dev">jato.pages.dev</a>
</p>

<br />

```bash
npx jato init
```

---

## Why

You use multiple AI coding tools. Each has its own config format, its own skills directory, its own way of handling MCPs. You end up maintaining the same instructions in three different places.

**jato** gives you one source of truth: `~/.jato/`. You organize configs into **jatos** — named profiles like `mobile`, `backend`, `code-review` — and `jato use mobile` materializes the native files each tool expects.

The real trick: jato installs a **skill that teaches your LLM to be your config wizard**. Describe what you need, and the AI writes the configs, picks the MCPs, generates the skills. The CLI is plumbing — the LLM is the interface.

## Quick Start

```bash
# Install and create your first jato
npx jato init

# Activate it
jato use my-jato

# Check everything's working
jato doctor
```

Three init paths:
- **Import** — scans your existing Claude/Codex/Gemini configs and extracts them
- **Template** — starts from a built-in template (`starter`, `mobile`, `backend`, `fullstack`)
- **Wizard** — just ask your AI to build one (the jato-manager skill handles it)

## How It Works

A jato is a folder. Everything inside is your AI setup:

```
~/.jato/
  config.yaml                    # active_jato: mobile
  skills/
    jato-manager.md              # global skill — teaches LLM to manage jatos
  rigs/
    mobile/
      jato.yaml                  # manifest: providers, MCPs, permissions
      instructions.md            # shared instructions for all providers
      providers/
        claude.md                # → becomes CLAUDE.md
        codex.md                 # → becomes AGENTS.md
      skills/
        code-review.md           # available to every LLM via context skill
        testing-rn.md
```

When you run `jato use mobile`, jato:

1. Reads the manifest and all associated files
2. Materializes native configs for each enabled provider
3. Installs two skills per provider:
   - **jato-context** — briefing about your active setup (skills, MCPs, instructions)
   - **jato-manager** — meta-skill that lets the LLM create/modify jatos conversationally
4. Creates timestamped backups of everything it overwrites

## Providers

| Provider | Config | Instructions | Skills |
|:---------|:-------|:-------------|:-------|
| Claude Code | `~/.claude/settings.json` | `CLAUDE.md` | `~/.claude/skills/` |
| Codex CLI | `~/.codex/config.toml` | `AGENTS.md` | `~/.codex/skills/` |
| Gemini CLI | `~/.gemini/settings.json` | `GEMINI.md` | `~/.gemini/skills/` |
| OpenCode | `~/.config/opencode/opencode.json` | — | — |

## Commands

```
jato init                 Create your first jato (import, template, or empty)
jato use <name>           Activate a jato — write configs, install skills
jato list                 Show available jatos
jato off                  Deactivate the current jato
jato doctor               Health check — schema, env vars, providers, skills
jato install <repo>       Install jatos from a git repository
```

That's the whole surface.

## The Skill

The jato-manager skill is what makes this different from a dotfiles manager. Once installed, your AI can:

- Create new jatos from a conversation ("I need a setup for React Native with Supabase")
- Add MCPs, skills, and agents on demand
- Switch between jatos
- Run diagnostics
- Knows 10+ common MCP configurations out of the box

You describe what you want. The AI writes the YAML, the markdown, the provider files — everything.

## Manifest

```yaml
name: mobile
description: React Native mobile development

providers:
  claude: true
  codex: true
  gemini: false

mcp_servers:
  - id: github
    command: npx
    args: [-y, "@modelcontextprotocol/server-github"]
    env: [GITHUB_TOKEN]
  - id: supabase
    command: npx
    args: [-y, "@anthropic/mcp-server-supabase"]
    env: [SUPABASE_URL, SUPABASE_KEY]

permissions:
  auto_execute: false
```

## Teams

A jato is a folder. Share it like you share code:

```bash
# Install from a repo
jato install github.com/acme/ai-jato --jato mobile

# Activate
jato use mobile
# ✓ Ready. Same tools, same context, zero config.
```

No sync services. No cloud accounts. A git repo is your distribution mechanism.

## Development

```bash
pnpm install
pnpm build
pnpm test        # 98 tests
pnpm lint
```

## License

MIT

---

<p align="center">
  <a href="https://star-history.com/#malopezr7/jato&Date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=malopezr7/jato&type=Date&theme=dark" />
      <img alt="Star History" src="https://api.star-history.com/svg?repos=malopezr7/jato&type=Date" width="600" />
    </picture>
  </a>
</p>
