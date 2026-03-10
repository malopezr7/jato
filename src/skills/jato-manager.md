---
name: jato-manager
description: >
  Manages jato configurations — create, modify, switch, and inspect AI environment setups.
  Use when user mentions 'jato', asks to 'create a jato', 'switch jato', 'add an MCP',
  'change AI config', 'set up my tools', or asks about their active environment configuration.
  Also use when user wants to add skills, agents, or MCP servers to their setup.
---

# jato Manager

You help users create, modify, and manage their jato configurations. A jato is a complete AI environment configuration that activates across all AI coding tools (Claude Code, Codex CLI, Gemini CLI, OpenCode) at once.

## Prerequisites

Verify the CLI is available before any operation:

```bash
npx @malopezr7/jato list
```

You can also use `pnpm dlx @malopezr7/jato` instead of `npx`.

## CLI Commands

| Command | Purpose |
|---------|---------|
| `jato list` | Show all jatos and which is active |
| `jato use <name>` | Activate a jato (materializes configs) |
| `jato use` | Show active jato |
| `jato off` | Deactivate current jato |
| `jato doctor` | Health check |
| `jato init` | Create new jato (interactive or flags) |
| `jato init --from auto --name <n>` | Import from existing tool configs |
| `jato init --template <t> --name <n>` | From template (starter, backend, fullstack, mobile) |
| `jato install <repo-url>` | Install jatos from git |
| `jato skill install` | Install this skill to providers |

CRITICAL: Always run `jato use <name>` after modifying any jato files to re-materialize.

## Hub Structure

```
~/.jato/
  config.yaml              ← active_jato: <name>
  skills/
    jato-manager.md        ← this file
  jatos/
    <name>/
      jato.yaml            ← manifest (providers, MCPs, permissions)
      instructions.md      ← shared instructions for all providers
      providers/
        claude.md          ← materializes as CLAUDE.md
        codex.md           ← materializes as AGENTS.md
        gemini.md          ← materializes as GEMINI.md
      skills/
        <skill-name>.md    ← specialized context files
      agents/
        <agent-name>.md    ← agent definitions
```

## Creating a New Jato

Both CLI and manual creation are valid. The CLI is faster for imports; manual creation enables a guided step-by-step experience.

### Via CLI

```bash
npx @malopezr7/jato init                                    # Interactive wizard
npx @malopezr7/jato init --from auto --name myproject       # Import existing
npx @malopezr7/jato init --template mobile --name myproject # From template
```

### Via guided manual creation

Walk the user through these steps:

**Step 1 — Understand context:** Ask about the role (mobile, backend, devops...), tech stack, and which AI tools they use.

**Step 2 — Build manifest:** Create `~/.jato/jatos/<name>/` with subdirectories `providers/`, `skills/`, `agents/`. Write `jato.yaml`:

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

**Step 3 — Write instructions:** Create `instructions.md` with shared conventions, then `providers/<name>.md` for each enabled provider.

**Step 4 — Create skills:** Recommend skills based on the stack (see below). Each skill should be a focused `.md` file in `skills/`.

**Step 5 — Activate:** Run `jato use <name>` to materialize.

## Skill Recommendations

When creating skills, recommend based on the user's stack. Each skill should be **actionable** (concrete patterns, not vague advice), **specific** (reference actual libraries and conventions), and **concise** (2-4KB, one topic per file).

### By stack

| Stack | Recommended skills |
|-------|--------------------|
| **Mobile** | testing (component/hook patterns, mock native modules), viewmodel-architecture, native-bridge, code-review |
| **Backend** | api-patterns (REST/GraphQL, error format, pagination), database (queries, migrations, pooling), testing, security |
| **Frontend** | component-patterns, testing (user-event, MSW), accessibility (ARIA, keyboard nav), styling |
| **Full-stack** | code-review, testing, git-workflow, architecture |
| **DevOps** | deployment (CI/CD, rollback), monitoring (logging, alerts), security (secrets, access) |

### What makes a good skill

- Include concrete code templates and "when to use / when NOT to use" guidance
- Reference actual libraries, file paths, and project conventions
- Keep each skill focused on one topic (under 500 lines)
- Put critical instructions at the top — Claude reads top-down

## Modifying an Existing Jato

| Change | How |
|--------|-----|
| Add MCP | Edit `jato.yaml`, add server entry |
| Add skill | Create `.md` in `skills/` |
| Change instructions | Edit `instructions.md` or `providers/*.md` |
| Add agent | Create `.md` in `agents/` |

After any change: `jato use <name>` to re-materialize.

## Common MCP Servers

| Server | Command | Env vars |
|--------|---------|----------|
| github | `npx -y @modelcontextprotocol/server-github` | GITHUB_TOKEN |
| filesystem | `npx -y @modelcontextprotocol/server-filesystem` | — |
| postgres | `npx -y @modelcontextprotocol/server-postgres` | DATABASE_URL |
| sqlite | `npx -y @modelcontextprotocol/server-sqlite` | — |
| brave-search | `npx -y @modelcontextprotocol/server-brave-search` | BRAVE_API_KEY |
| fetch | `npx -y @modelcontextprotocol/server-fetch` | — |
| memory | `npx -y @modelcontextprotocol/server-memory` | — |
| supabase | `npx -y @anthropic/mcp-server-supabase` | SUPABASE_URL, SUPABASE_KEY |
| sentry | `npx -y @sentry/mcp-server` | SENTRY_AUTH_TOKEN |
| linear | `npx -y @anthropic/mcp-server-linear` | LINEAR_API_KEY |
| slack | `npx -y @anthropic/mcp-server-slack` | SLACK_BOT_TOKEN |
| puppeteer | `npx -y @anthropic/mcp-server-puppeteer` | — |
| docker | `npx -y @modelcontextprotocol/server-docker` | — |

## Troubleshooting

### jato use fails with "not found"
**Cause:** Jato name doesn't exist in `~/.jato/jatos/`
**Fix:** Run `jato list` to see available names; check spelling

### MCP server not connecting after activation
**Cause:** Missing environment variables
**Fix:** Check `env` entries in `jato.yaml`; ensure vars are set in your shell

### Changes not reflected after editing files
**Cause:** Forgot to re-materialize
**Fix:** Run `jato use <name>` after every file change
