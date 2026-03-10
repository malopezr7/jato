# Prompt para Claude Code — Proyecto “rig”

## Contexto

Tengo un proyecto existente en `~/projects/agentstack-cli` (repo: github.com/malopezr7/agentstack-cli) que voy a reemplazar por completo con un nuevo proyecto llamado **rig**. Necesito que crees un nuevo repositorio desde cero, rescatando selectivamente código valioso del proyecto anterior.

## Qué es rig

rig es un gestor de configuración centralizada para herramientas de IA de coding (Claude Code, Codex CLI, Gemini CLI, OpenCode). La idea es simple:

**`~/.rig/` es la única fuente de verdad.** Todas las instrucciones, skills, MCPs, agents y configs de tu entorno de IA viven ahí, organizadas en rigs (mobile, backend, code-review, etc.). Cuando haces `rig use mobile`, rig materializa los archivos nativos que cada herramienta espera encontrar y además instala skills que dan contexto al LLM sobre qué tiene disponible.

El pitch en una frase: **“Un directorio configura todas tus herramientas de IA. Cambia de contexto con un comando. Comparte la config con tu equipo con git clone.”**

## Terminología

- **rig** (sustantivo): una configuración completa de entorno de IA — un directorio con manifiesto, instrucciones, skills, agents, y MCPs. Equivale a “perfil” pero con identidad propia. “Mi rig de mobile”, “el rig del equipo backend”.
- **hub**: el directorio raíz `~/.rig/` donde viven todos los rigs.
- **materializar**: escribir los archivos nativos que cada herramienta espera (settings.json, config.toml, etc.) a partir de un rig.
- **provider**: una herramienta de IA soportada (Claude Code, Codex CLI, Gemini CLI, OpenCode).

## Qué NO es rig (guardrails estrictos)

NO construyas nada de esto:

- ❌ Editor web / UI visual (nada de React, Vite, web server)
- ❌ Múltiples backends de sync (nada de gist, git sync, zero-config sync)
- ❌ Bundle export/import
- ❌ Skills orchestrator, allowlists, redaction engine
- ❌ Sistema de secrets/keychain
- ❌ Migraciones de schema (v1→v2→v3→v4). Solo hay una versión.
- ❌ Compatibility reports / parity scoring / portability matrices
- ❌ Mascota animada, gradientes, figlet banners (el CLI debe ser limpio y funcional, sin circo)
- ❌ Site de docs (Astro, Starlight, nada de eso)
- ❌ Soporte Windows

-----

## Arquitectura del hub — `~/.rig/`

```
~/.rig/
  config.yaml                 ← estado global de rig
  skills/
    rig-manager.md            ← META-SKILL: skill global que enseña al LLM a usar rig
  rigs/
    mobile/
      rig.yaml                ← manifiesto del rig
      instructions.md         ← instrucciones compartidas para todos los providers
      providers/
        claude.md             ← se materializa como CLAUDE.md en target-root
        codex.md              ← se materializa como AGENTS.md en target-root
        gemini.md             ← se materializa como GEMINI.md en target-root
      skills/
        code-review.md
        testing-rn.md
      agents/
        reviewer.md
      .env.example
    backend/
      rig.yaml
      instructions.md
      providers/
        claude.md
      skills/
        api-design.md
      .env.example
```

### config.yaml (estado global)

```yaml
active_rig: mobile
```

Solo eso. Si no hay rig activo, no existe el campo.

### rig.yaml (manifiesto del rig)

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

  - id: expo
    command: npx
    args: [-y, "expo-mcp-server"]
    env: [EXPO_TOKEN]

permissions:
  auto_execute: false
```

El YAML es SOLO metadata, MCPs, providers habilitados y permisos. Las instrucciones, skills, agents y provider-specific docs se descubren por convención del filesystem:

- `instructions.md` → instrucciones globales compartidas
- `providers/<provider>.md` → instrucciones específicas por proveedor
- `skills/*.md` → skills disponibles
- `agents/*.md` → agent definitions
- `.env.example` → variables de entorno necesarias

### Schema Zod del rig.yaml

```typescript
import { z } from "zod";

const mcpServerSchema = z.object({
  id: z.string().min(1),
  transport: z.enum(["stdio", "http"]).default("stdio"),
  command: z.string().optional(),
  args: z.array(z.string()).default([]),
  url: z.string().optional(),
  env: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});

const rigManifestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),

  providers: z.record(z.string(), z.boolean()).default({}),

  mcp_servers: z.array(mcpServerSchema).default([]),

  permissions: z.object({
    auto_execute: z.boolean().default(false),
  }).default({ auto_execute: false }),
});
```

Una sola versión. Sin campo `version`. Si algún día necesitamos migrar, lo añadimos entonces.

-----

## Comandos del CLI

El CLI debe ser mínimo y directo. Usa `commander`. Sin animaciones, sin banners.

### `rig init`

Setup interactivo. Crea `~/.rig/` y genera un primer rig. Ofrece tres caminos:

```
$ rig init

  How do you want to start?

  ❯ Import from my current tools    (detected: Claude Code, Codex CLI)
    Start from a template            (mobile, backend, fullstack...)
    Empty rig                        (I'll configure it myself)
```

**Camino 1 — Import**: Detecta qué herramientas tiene el usuario instaladas escaneando los paths conocidos (~/.claude/settings.json, ~/.codex/config.toml, ~/.gemini/settings.json, ~/.config/opencode/opencode.json). Para cada herramienta detectada, extrae MCPs, instrucciones, y skills existentes. Pide un nombre para el rig y genera todo.

**Camino 2 — Template**: Ofrece una lista de templates built-in. El usuario elige uno y le da un nombre. Más detalle en la sección de Templates.

**Camino 3 — Empty**: Pide un nombre y crea un rig vacío con scaffold mínimo (rig.yaml con providers detectados habilitados, instructions.md placeholder, carpetas providers/ skills/ agents/).

En los tres caminos, después de crear el rig:

1. Instala la meta-skill `rig-manager.md` en `~/.rig/skills/`
1. Pregunta si quiere activar el rig creado (`rig use <nombre>`)

Para uso no interactivo (CI, scripts):

```
rig init --from claude --name my-rig --yes
rig init --template mobile --name mobile-dev --yes
rig init --empty --name scratch --yes
```

### `rig use <rig-name>`

Este es el comando principal. Lee el rig y materializa todo.

```
rig use mobile
```

Pasos internos:

1. Validar que `~/.rig/rigs/mobile/rig.yaml` existe y es válido
1. Para cada proveedor habilitado en el manifiesto:
   a. Materializar config nativa de MCPs (settings.json, config.toml, etc.)
   b. Si existe `providers/<provider>.md`, copiarlo donde corresponda
1. Generar e instalar el rig-context SKILL.md (skill específica del rig) en los directorios de skills de cada herramienta habilitada
1. Instalar o actualizar la meta-skill `rig-manager.md` (skill global) en los directorios de skills de cada herramienta habilitada
1. Actualizar `~/.rig/config.yaml` → `active_rig: mobile`
1. Mostrar resumen limpio de qué se escribió

Antes de escribir cualquier archivo, SIEMPRE hacer backup con timestamp (`.bak.<timestamp>`).

### `rig use` (sin argumento)

Muestra qué rig está activo.

### `rig list`

Lista rigs disponibles, marca el activo.

```
  mobile     React Native mobile development setup  [active]
  backend    Backend API services
```

### `rig doctor`

Validaciones de salud:

- ¿Existe ~/.rig/?
- ¿El rig activo tiene rig.yaml válido?
- ¿Los providers habilitados están instalados en el sistema?
- ¿Las env vars de los MCPs están definidas?
- ¿Los archivos materializados existen y corresponden al rig activo?
- ¿La meta-skill está instalada?

### `rig install <repo-url> [--rig <n>]`

Clona un repo con rigs y los copia a `~/.rig/rigs/`.

```
rig install github.com/team/ai-rig --rig mobile
```

Internamente: `git clone` a tmp → copiar el rig indicado (o todos) a `~/.rig/rigs/` → limpiar tmp.

### `rig off`

Desactiva el rig actual. Elimina `active_rig` de config.yaml. NO borra archivos materializados.

-----

## Sistema de dos skills

Esta es la pieza más importante del proyecto. Hay DOS tipos de skill que se instalan en las herramientas:

### 1. Rig Context Skill (por rig, generada dinámicamente)

Se genera cada vez que haces `rig use <nombre>`. Vive instalada en el directorio de skills de cada herramienta (ej: `~/.claude/skills/rig-context/SKILL.md`).

Su propósito es darle al LLM el contexto de qué tiene disponible en el rig activo. Es un briefing, no un controlador.

```markdown
# rig — Active Context

You are working within a rig-managed environment.

## Active Rig: mobile
React Native mobile development setup

## Available Skills

The following skill files contain specialized context. Read them when the task is relevant:

- `~/.rig/rigs/mobile/skills/code-review.md` — Code review guidelines
- `~/.rig/rigs/mobile/skills/testing-rn.md` — React Native testing patterns

## Configured MCP Servers

The following MCP servers are configured and available in this session:

- **github** — `npx -y @modelcontextprotocol/server-github` (requires: GITHUB_TOKEN)
- **expo** — `npx -y expo-mcp-server` (requires: EXPO_TOKEN)

## Global Instructions

[contenido de instructions.md si existe]

## Agents

- `~/.rig/rigs/mobile/agents/reviewer.md` — Code reviewer agent definition
```

Debe ser < 4KB. Se genera leyendo el contenido real del rig activo.

### 2. Rig Manager Skill (global, el meta-skill)

Este es el SKILL más importante del proyecto. Vive en `~/.rig/skills/rig-manager.md` y se instala en `~/.claude/skills/rig-manager/SKILL.md` (y equivalentes para otros providers).

Su propósito es enseñar al LLM a ser el gestor principal de rigs. Es la interfaz conversacional de rig. El LLM se convierte en el wizard que ayuda al usuario a crear, modificar, y gestionar sus rigs.

El contenido del rig-manager.md debe cubrir:

#### A. Operaciones CLI

El LLM puede ejecutar todos los comandos de rig:

```markdown
## CLI Operations

You can manage rigs by running these commands:

- `rig list` — Show all available rigs and which is active
- `rig use <n>` — Switch to a different rig (materializes all configs)
- `rig off` — Deactivate the current rig
- `rig doctor` — Check health of the current rig setup

Always run `rig use <n>` after modifying a rig's files to re-materialize.
```

#### B. Rig Creation Wizard

Esta es la funcionalidad estrella. Cuando el usuario dice “quiero crear un nuevo rig” o “configúrame un rig para backend con Python”, el LLM sigue un protocolo conversacional:

```markdown
## Creating a New Rig

When the user wants to create a new rig, guide them through this process:

### Step 1: Understand the context
Ask about:
- What role/context is this rig for? (mobile dev, backend, data science, devops, code review...)
- What tech stack? (React Native, Node.js, Python, Go...)
- What AI tools do they use? (Claude Code, Codex, Gemini...)

### Step 2: Build the manifest
Based on their answers, create the rig directory structure:

1. Create directory: `~/.rig/rigs/<name>/`
2. Create subdirectories: `providers/`, `skills/`, `agents/`
3. Write `rig.yaml` with:
   - Appropriate name and description
   - Enabled providers based on their tools
   - MCP servers relevant to their stack
   - Permission settings based on their preference

### Step 3: Generate instructions
Create `instructions.md` with context-appropriate guidelines:
- Coding conventions for their stack
- Review standards
- Architecture patterns they follow

### Step 4: Generate provider-specific instructions
For each enabled provider, create `providers/<provider>.md`:
- `claude.md` → Instructions specific to Claude Code behavior
- `codex.md` → Instructions specific to Codex CLI behavior
- Tailor each to the provider's strengths and format expectations

### Step 5: Generate skills
Create relevant skill files in `skills/`:
- Code review guidelines for their stack
- Testing patterns
- Architecture decision records
- Deployment procedures
- Any domain-specific knowledge

### Step 6: Generate agents (if requested)
Create agent definitions in `agents/`:
- Reviewer agent
- Architect agent
- Testing agent

### Step 7: Activate
After generating all files, run `rig use <name>` to materialize.

### Common MCP Server References

When suggesting MCPs, use these known configurations:

- **github**: `npx -y @modelcontextprotocol/server-github` env: [GITHUB_TOKEN]
- **filesystem**: `npx -y @modelcontextprotocol/server-filesystem` args: [<paths>]
- **postgres**: `npx -y @modelcontextprotocol/server-postgres` env: [DATABASE_URL]
- **sqlite**: `npx -y @modelcontextprotocol/server-sqlite` args: [<db-path>]
- **brave-search**: `npx -y @modelcontextprotocol/server-brave-search` env: [BRAVE_API_KEY]
- **fetch**: `npx -y @modelcontextprotocol/server-fetch`
- **memory**: `npx -y @modelcontextprotocol/server-memory`
- **supabase**: `npx -y @anthropic/mcp-server-supabase` env: [SUPABASE_URL, SUPABASE_KEY]
- **sentry**: `npx -y @sentry/mcp-server` env: [SENTRY_AUTH_TOKEN]
- **linear**: `npx -y @anthropic/mcp-server-linear` env: [LINEAR_API_KEY]
```

#### C. Rig Modification

```markdown
## Modifying an Existing Rig

When the user wants to modify their active rig:

- **Add an MCP**: Edit `~/.rig/rigs/<active>/rig.yaml`, add the server entry, then run `rig use <active>`
- **Add a skill**: Create a new `.md` file in `~/.rig/rigs/<active>/skills/`, then run `rig use <active>`
- **Change instructions**: Edit `instructions.md` or files in `providers/`, then run `rig use <active>`
- **Add an agent**: Create a new `.md` file in `~/.rig/rigs/<active>/agents/`, then run `rig use <active>`

Always remind the user to run `rig use <name>` after changes to re-materialize.
```

#### D. Rig Overview

```markdown
## Inspecting a Rig

When the user asks about their current rig or wants to see what's configured:

1. Read `~/.rig/config.yaml` to find the active rig
2. Read `~/.rig/rigs/<active>/rig.yaml` for the manifest
3. List files in skills/, agents/, providers/ to show what's available
4. Present a clear summary
```

**IMPORTANTE sobre el meta-skill**: Este archivo es LARGO (probablemente 3-4KB). Está bien. Es el skill más importante del sistema. Escríbelo con cuidado, con ejemplos concretos, y con el catálogo de MCPs conocidos. Cuanto mejor sea este skill, mejor será la experiencia del usuario con rig.

-----

## Importer — `rig init --from <provider>`

El importer lee la configuración nativa de una herramienta y genera un rig completo.

### Detección automática de herramientas

Al ejecutar `rig init`, escanea estos paths para detectar qué hay instalado:

|Provider   |Config path                       |Instructions file     |
|-----------|----------------------------------|----------------------|
|Claude Code|`~/.claude/settings.json`         |`CLAUDE.md` en cwd o ~|
|Codex CLI  |`~/.codex/config.toml`            |`AGENTS.md` en cwd o ~|
|Gemini CLI |`~/.gemini/settings.json`         |`GEMINI.md` en cwd o ~|
|OpenCode   |`~/.config/opencode/opencode.json`|—                     |

### Qué extrae el importer

De cada herramienta detectada:

1. **MCPs**: Lee la sección de mcp_servers/mcpServers y los convierte al formato rig.yaml
1. **Instructions**: Si encuentra el archivo de instrucciones del provider, lo copia a `providers/<provider>.md`
1. **Permissions**: Lee la config de permisos y la mapea a `permissions.auto_execute`
1. **Skills**: Si el provider tiene skills configuradas (ej: `~/.claude/skills/`), las copia a `skills/`

### Merge de múltiples providers

Si el usuario tiene Claude y Codex, el importer debe:

- Hacer merge de MCPs (deduplicate por id)
- Mantener las instructions separadas por provider
- Usar el permission más conservador
- Generar un `rig.yaml` con ambos providers habilitados

### Flujo interactivo

```
$ rig init

  Scanning for AI tools...

    ✓ Claude Code  — 3 MCPs configured, CLAUDE.md found
    ✓ Codex CLI    — 2 MCPs configured, AGENTS.md found
    ○ Gemini CLI   — not installed
    ○ OpenCode     — not installed

  Import from detected tools? (Y/n) y

  Name for your new rig: main

  ✓ Imported 4 unique MCPs (1 shared between Claude and Codex)
  ✓ Imported Claude instructions → providers/claude.md
  ✓ Imported Codex instructions → providers/codex.md
  ✓ Created rig.yaml
  ✓ Created instructions.md (combined global instructions)
  ✓ Installed rig-manager skill

  Activate rig 'main' now? (Y/n) y

  ✓ Active rig: main
```

### Para uso no interactivo

```
rig init --from claude --name my-rig --yes
rig init --from claude,codex --name my-rig --yes
rig init --from auto --name my-rig --yes    # auto-detect all
```

-----

## Templates

Templates son rigs pre-configurados que vienen built-in con rig. Cada template es un directorio dentro del código fuente de rig en `src/templates/`.

### Templates incluidos en v0.1

#### `starter` — Minimal sensible defaults

Solo GitHub MCP, instrucciones genéricas de buenas prácticas, un skill de code-review básico. El punto de partida más simple posible.

#### `mobile` — Mobile development (React Native / Expo)

MCPs: github, filesystem. Instructions con RN conventions. Skills: code-review.md, testing.md. Provider docs: claude.md.

#### `backend` — Backend API development (Node.js / Python)

MCPs: github, postgres. Instructions con API design patterns. Skills: api-design.md, database.md. Provider docs: claude.md.

#### `fullstack` — Full-stack web development

Combinación de backend + frontend. MCPs: github, filesystem, postgres. Skills: code-review.md, frontend.md, api-design.md.

### Flujo de templates

```
$ rig init --template

  Choose a template:

  ❯ starter      Minimal sensible defaults
    mobile       React Native / Expo development
    backend      Backend API development
    fullstack    Full-stack web development

  Name for your new rig: my-mobile

  ✓ Created rig from template 'mobile'
  ✓ Installed rig-manager skill

  Activate rig 'my-mobile' now? (Y/n)
```

### Dónde viven los templates

En el código fuente:

```
src/
  templates/
    starter/
      rig.yaml
      instructions.md
      providers/claude.md
      skills/code-review.md
    mobile/
      ...
    backend/
      ...
    fullstack/
      ...
```

Al ejecutar `rig init --template mobile --name my-mobile`, se copia el contenido del template a `~/.rig/rigs/my-mobile/` ajustando el name en rig.yaml.

-----

## Materialización por proveedor

### Claude Code

- Config nativa: `~/.claude/settings.json`
  - Escribe MCPs en formato Claude (mcpServers con command, args, env)
  - Mapea `permissions.auto_execute` → permissions mode
- Provider instructions: Si existe `providers/claude.md`, lo materializa como `CLAUDE.md` en `--target-root` (o cwd por defecto)
- Skills: Instala DOS skills:
  - `~/.claude/skills/rig-context/SKILL.md` ← skill de contexto del rig activo (generada)
  - `~/.claude/skills/rig-manager/SKILL.md` ← meta-skill global (copiada de ~/.rig/skills/rig-manager.md)

### Codex CLI

- Config nativa: `~/.codex/config.toml`
  - Escribe MCPs en formato TOML (mcp_servers sections)
  - Mapea `permissions.auto_execute` → approval_policy
- Provider instructions: Si existe `providers/codex.md`, lo materializa como `AGENTS.md` en target-root
- Skills: Instala las dos skills en `~/.codex/skills/` (si soporta skills)

### Gemini CLI

- Config nativa: `~/.gemini/settings.json`
  - Escribe MCPs en formato Gemini (mcpServers con trust, env mapping)
  - Mapea permissions → approvalMode
- Provider instructions: Si existe `providers/gemini.md`, lo materializa como `GEMINI.md` en target-root

### OpenCode

- Config nativa: `~/.config/opencode/opencode.json`
  - Escribe MCPs en formato OpenCode
  - Mapea permissions → mode

-----

## Qué rescatar del proyecto anterior

El proyecto anterior está en `~/projects/agentstack-cli`. Rescata SOLO esto:

### 1. Lógica de materialización de MCPs por proveedor

Archivos: `src/adapters/*/map.ts`. Extrae la lógica de generación de archivos nativos y reescríbela adaptada al nuevo schema. NO copies los compatibility reports ni TranslationResult.

### 2. Lógica de importación por proveedor

Archivos: `src/adapters/*/import.ts`. Rescata la lógica de parsing pero simplifica. El output debe ser directamente un rig.yaml + archivos, no un CanonicalProfile intermedio.

### 3. Backup atómico

De `src/core/engine/applier.ts`, rescata el patrón de `applyWithBackup`.

### 4. Patrón CLI

De `src/cli/index.ts`, rescata el patrón de `CliResult` con `{ exitCode, stdout, stderr }`.

### 5. Nada más

-----

## Estructura del nuevo repo

```
rig/
  src/
    cli/
      index.ts
      commands/
        init.ts
        use.ts
        list.ts
        off.ts
        doctor.ts
        install.ts
    core/
      schema.ts
      hub.ts
      rig.ts
      materializer.ts
      backup.ts
    skills/
      rig-context.ts
      rig-manager.ts
      rig-manager.md          ← contenido del meta-skill (estático)
    providers/
      types.ts
      claude.ts
      codex.ts
      gemini.ts
      opencode.ts
      registry.ts
      detector.ts
    importers/
      types.ts
      claude.ts
      codex.ts
      gemini.ts
      opencode.ts
      merge.ts
    templates/
      starter/
        rig.yaml
        instructions.md
        providers/claude.md
        skills/code-review.md
      mobile/
        rig.yaml
        instructions.md
        providers/claude.md
        skills/code-review.md
        skills/testing.md
      backend/
        rig.yaml
        instructions.md
        providers/claude.md
        skills/api-design.md
        skills/database.md
      fullstack/
        rig.yaml
        instructions.md
        providers/claude.md
        skills/code-review.md
        skills/frontend.md
        skills/api-design.md
  tests/
    core/
      schema.test.ts
      hub.test.ts
      rig.test.ts
      materializer.test.ts
    skills/
      rig-context.test.ts
      rig-manager.test.ts
    providers/
      claude.test.ts
      codex.test.ts
      gemini.test.ts
      opencode.test.ts
      detector.test.ts
    importers/
      claude.test.ts
      codex.test.ts
      merge.test.ts
    cli/
      init.test.ts
      use.test.ts
      list.test.ts
      doctor.test.ts
    integration/
      full-lifecycle.test.ts
      import-and-use.test.ts
  package.json
  tsconfig.json
  vitest.config.ts
  README.md
  .gitignore
```

-----

## Stack técnico

- TypeScript (ESM, moduleResolution: node16)
- Node.js >= 22
- pnpm como package manager
- Commander para CLI
- @clack/prompts para interactive prompts (el init wizard)
- Zod para validación de schema
- yaml (npm) para parsing de YAML
- chalk para colores mínimos en output
- vitest para testing
- Biome para lint/format

### package.json

```json
{
  "name": "rig",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "rig": "dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "pnpm dlx @biomejs/biome@latest check src tests"
  },
  "engines": {
    "node": ">=22"
  },
  "dependencies": {
    "@clack/prompts": "^0.8.2",
    "commander": "^14.0.0",
    "chalk": "^5.4.1",
    "yaml": "^2.8.1",
    "zod": "^4.1.5"
  },
  "devDependencies": {
    "@types/node": "^24.3.0",
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

-----

## Prioridad de implementación

Sigue este orden exacto. Cada paso debe compilar y tener tests antes de avanzar:

1. **Scaffold** — Inicia el repo, package.json, tsconfig, vitest config, .gitignore
1. **Schema** — `src/core/schema.ts` con Zod. Tests de validación.
1. **Hub** — `src/core/hub.ts` paths y ensure. Tests.
1. **Rig** — `src/core/rig.ts` leer y resolver rig completo desde filesystem. Tests.
1. **Providers** — Los 4 providers con materialización de config nativa. Rescata lógica del proyecto anterior. Tests por provider.
1. **Backup** — `src/core/backup.ts`. Tests.
1. **Skills — rig-context** — `src/skills/rig-context.ts` genera el skill dinámico. Tests.
1. **Skills — rig-manager** — `src/skills/rig-manager.md` contenido del meta-skill + `src/skills/rig-manager.ts` para instalación. Tests.
1. **Materializer** — `src/core/materializer.ts` que orquesta todo. Tests.
1. **Detector** — `src/providers/detector.ts` detecta tools instaladas. Tests.
1. **Importers** — Los 4 importers + merge. Rescata lógica del proyecto anterior. Tests.
1. **Templates** — Los 4 templates con contenido REAL y ÚTIL (no stubs).
1. **CLI — init** — El wizard interactivo con los 3 caminos. Tests.
1. **CLI — use, list, off** — Los comandos básicos. Tests.
1. **CLI — doctor** — Health check. Tests.
1. **CLI — install** — git clone + copy. Tests.
1. **Integration tests** — full lifecycle: init → use → list → off. Import → use. Template → use.
1. **README** — Documentación clara y concisa.

-----

## Principios de código

- Sin `as any`, sin `@ts-ignore`
- Sin console.log en código de producción
- Funciones puras donde sea posible. Side effects aislados en la capa CLI.
- Tests con filesystem temporal (vitest tmp dirs o mock homeDir)
- Cada función exportada tiene al menos un test
- Sin over-engineering: si algo se puede resolver con 10 líneas, no hagas una clase con 3 abstracciones
- Los errores son strings descriptivos, no clases custom de error con herencia

-----

## Sobre el contenido de los templates y skills

ESTO ES CRÍTICO: Los templates no son stubs vacíos. Cada template debe tener contenido REAL y ÚTIL:

- Las `instructions.md` deben tener buenas prácticas reales para ese contexto
- Los skills deben tener guidelines concretas (no “write good code”, sino patrones reales)
- Los `providers/claude.md` deben tener instrucciones que aprovechen las capacidades específicas de Claude Code

El `rig-manager.md` debe ser exhaustivo con ejemplos concretos de MCPs, patrones de skills, y un protocolo claro de wizard. Este archivo es lo que hace que la experiencia conversacional funcione — si está mal escrito, toda la propuesta de valor del LLM-as-wizard se cae.

Invierte tiempo real en escribir buen contenido para estos archivos. Son la cara del producto.

-----

## Importante

Lee el código del proyecto anterior ANTES de implementar los providers e importers. Los adapters de `~/projects/agentstack-cli/src/adapters/*/map.ts` e `import.ts` tienen lógica valiosa sobre cómo cada herramienta espera su config y cómo parsear la existente. No la reinventes — adáptala al nuevo schema más simple.

Ahora empieza. Scaffold primero, schema después, y ve subiendo.
