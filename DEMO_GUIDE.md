# Kiro CLI Demo — Run-Through Guide

Target: ~15 min, 20 min hard ceiling. Audience: Kiro IDE users, CLI-curious but unfamiliar with commands.

Opening line (no slides, ~25-30s, say it standing at the terminal, no notes): *"Kiro CLI is the same agentic engine you already know from the IDE, but built for the terminal — which means it's built for automation. You configure agents with exactly the permissions and tools they need, hand them a task, and they can run in parallel, in the background, or inside a CI pipeline with nobody watching. Tonight I'll walk through how that actually works — agent config and permissions, planning before you build, running multiple agents on a task at once, verifying work automatically, and wiring all of it into a real GitHub Actions review — using this expense tracker as the thing we're actually building."*

---

## Before you start (setup checklist)

- [ ] Run `./reset-demo.sh` — clears H2 db, build artifacts, restores agent configs to v2. **Does NOT touch `.github/workflows/ci.yml`** — that's the real, working `Kiro Code Review` workflow now, not throwaway demo content, so it's deliberately left alone.
  - **Known gap:** the script does NOT remove live-built feature code (`backend/.../expense/*`, `frontend/.../expenses/*`, routes/models/nav edits) from a previous run either. Now that the clean skeleton is merged to `main`, reset via `git checkout main -- . && git clean -fd` instead for anything beyond what the script covers.
- [ ] Confirm `.kiro/agents/backend-agent.json` / `frontend-agent.json` are v2 shape (no `permissions` block) — should be automatic via reset script.
- [ ] Confirm `backend/src/main/resources/application.yml` DB URL is exactly `jdbc:h2:file:./data/budgetbuddy;AUTO_SERVER=TRUE` — `AUTO_SERVER=TRUE` is needed so a spawned seed task and the running app can both touch the H2 file concurrently without a lock error. **Do not combine it with `DB_CLOSE_ON_EXIT=FALSE`** — H2 rejects that combination outright (`Feature not supported: "AUTO_SERVER=TRUE && DB_CLOSE_ON_EXIT=FALSE"`, confirmed by testing, not a guess). This URL has reverted/drifted on its own multiple times tonight — **double check it's actually correct before you start**, and if the app fails to start, read the actual error before assuming it's the same issue as last time.
- [ ] Confirm `KIRO_API_KEY` exists as a **repository** secret (not environment-scoped) at `https://github.com/psyTayobHarrison/demo-practice/settings/secrets/actions`, name matches exactly.
- [ ] **Bootstrap the schema before doing anything else:** start the backend once (`cd backend && mvn spring-boot:run`), confirm it comes up clean with no Flyway errors, confirm `categories` table exists and is empty, then **shut it down** (Ctrl+C). Do this *before* beat 3's `/spawn` seed task runs.
  - **Why this matters:** if the seed task is the first thing to ever touch the H2 file, it'll find no `categories` table (app never created it) and likely just `CREATE TABLE` it itself to complete the seed — outside Flyway's knowledge, no `flyway_schema_history` entry. Then the next real app start fails with `Found non-empty schema(s) "PUBLIC" but no schema history table` (hit this exact error tonight, root-caused after the fact). Bootstrapping first avoids the race entirely — Flyway creates and tracks the table properly, seed task just `INSERT`s into it.
  - **Trade-off, worth knowing:** this means the live demo's app start won't literally be the first-ever migration application anymore — Flyway will see `V1` already applied and skip straight to running. Doesn't matter functionally (nobody's narrating "watch the migration apply"), and the two things that do matter — schema exists correctly, `categories` stays empty until the live seed — both hold.
- [ ] `categories` table should be empty after the bootstrap run — don't seed it yourself, beat 3 does that live.
- [ ] Two terminals open: one for the main session, one for filler content / crew monitor / checking files.
- [ ] Browser ready, not yet navigated anywhere.

---

## Beat 1 — Agent config, tools, permissions, v2→v3 (~2:00)

```
kiro-cli
/agent list
```

Open `.kiro/agents/backend-agent.json` in terminal 2. Point out `allowedTools` / `toolsSettings.write.allowedPaths` + `deniedPaths` — backend agent can't write to `frontend/`. Say: *"This is v2 — flat tools list, no capability-based rules yet."*

Live transform:
```
/upgrade-agent backend-agent
```
Show the diff — introduces `permissions.rules` (capability/match/effect) + `policies`. **Note:** migration is additive, not destructive — old fields (`tools`, `allowedTools`, `toolsSettings`) stay, `permissions` gets layered on top. Don't assert which one wins if they conflict — untested.

**If time / audience interest allows, side-by-side of what a *native* (non-migrated) v3 config looks like:**
- v2: `"tools": ["read","write","shell","grep","glob"]`, `toolsSettings.write.allowedPaths/deniedPaths`, `toolsSettings.shell.allowedCommands` + `autoAllowReadonly`
- v3 native: `permissions.rules` (explicit `effect: allow/deny` per capability) + `policies: ["read-only-shell"]`, tags replace tool IDs (`grep`/`glob` fold into `read` tag), and the whole file becomes **Markdown with YAML frontmatter**, not JSON — prompt as the Markdown body.
- Tag table: `read` (read_file, list_directory, grep_search, code), `write`, `shell`, `web`, `subagent`, `knowledge`, `todo_list`, `@mcp`, `@builtin`, `*`.
- One-liner: *"New tools shipped under a tag get picked up automatically — v2 needs a manual edit every time."*

**Clarify `/model` vs `/agent`:** *"`/agent swap` changes which configured identity — prompt, tools, permissions — is active. `/model` changes which LLM answers. Different levers."*

### Hooks: v2 vs v3, same hook side by side

Real files in this repo, not staged — same intent both ways: auto-run Prettier when the frontend agent writes a file. Payoff is visible on screen (messy → tidy), not just an admin-y log line.

**Confirmed v2 CLI trigger set (camelCase, five total, no more, no less):** `agentSpawn`, `userPromptSubmit`, `preToolUse`, `postToolUse`, `stop`. **There is no dedicated file-save trigger in v2** — to react to a write, you match `postToolUse` against the write tool itself, not a file-lifecycle event. (Earlier draft of this guide used a fabricated `onFileSave` trigger — corrected.)

**v2 — embedded in `.kiro/agents/frontend-agent.json`. Confirmed live** (this got auto-corrected in the actual file when tested — my first draft's shape, an array of `{trigger, matcher, match, command}` objects, was wrong; real shape is an **object keyed by trigger name**, and there's no separate file-path `match` field at all — just `matcher` + `command`):
```json
"hooks": {
  "postToolUse": [
    {
      "matcher": "write",
      "command": "cd frontend; npx prettier --write ."
    }
  ]
}
```
Note the corrected version also uses `;` not `&&` between commands — unclear if that's a hard requirement or just what got auto-applied; keep it as-is since it's confirmed working shape, not a hypothesis.

**Real bug found and fixed while testing this:** the hook didn't fire the first time — not a hooks problem at all, a permissions one. `frontend-agent`'s `shell.allowedCommands` never had `npx.*` listed, **and `allowedTools` was missing `shell` entirely** (pre-existing gap in the original scaffold, not something introduced by the hook — just never exercised until now, since nothing had asked this agent to run a shell command before). Both are fixed now (`shell` added to `allowedTools`, `npx.*` added to `allowedCommands`). Good live material: this is the direct flip side of the CI `--trust-all-tools` story — there, blanket trust made the allowlist decorative; here, with no blanket trust flag active, the allowlist genuinely blocked an unlisted command. Both halves of the same mechanism, worth showing back to back if you have the time.

**v3 — standalone file at `.kiro/hooks/frontend-format.json`:**
```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "frontend-format",
      "trigger": "PostFileSave",
      "matcher": "frontend/.*\\.(ts|html|scss)$",
      "action": { "type": "command", "command": "cd frontend && npx prettier --write ." },
      "timeout": 30,
      "enabled": true
    }
  ]
}
```

**Prettier is installed as a real devDependency now** (`frontend/package.json`, added ahead of time specifically so this doesn't cold-pull over `npx` mid-demo) — confirmed working locally (`npx prettier --version` → 3.9.6, `--check` against real source ran clean, flagged 13 files as unformatted as expected, no errors). `.prettierrc` already existed in the repo (100 char width, single quotes, Angular parser for `.html`) — the hook just makes it automatic instead of a manual step.

**Multi-fire caveat:** if frontend-agent writes 5 component files in one turn, this fires 5 times, each re-formatting the whole `frontend/` tree (not just the one changed file — there's no confirmed way to interpolate the specific changed path into the command). Redundant but harmless here, since Prettier is idempotent and fast — repeated runs just no-op quickly on already-formatted files. That's actually a nice illustration of *why* v3's task-level hooks matter more for some actions than others: cheap-and-repeated (Prettier) is fine as a per-file hook, expensive-and-repeated (a full compile, a test run) is exactly the case `PreTaskExec`/`PostTaskExec` were added to solve.

**Confirmed v3 trigger set, ten total:** `SessionStart`, `Stop`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PreTaskExec`, `PostTaskExec`, `PostFileCreate`, `PostFileSave`, `PostFileDelete`.

**What actually changed, bullet by bullet:**
- **Location:** embedded inside the agent's own JSON (v2) → standalone file at `.kiro/hooks/<id>.json` (v3). Hooks are no longer tied to a single agent's config — they live independently.
- **Not just casing — some triggers were renamed outright, not just re-cased.** Confirmed: `agentSpawn` → `SessionStart` (different word, not a case change). Don't assume every v2 trigger has a same-named PascalCase twin.
- **v3 added dedicated file-lifecycle triggers** (`PostFileCreate`, `PostFileSave`, `PostFileDelete`) that v2 never had — v2 could only approximate a file-save reaction by matching `postToolUse` against the write tool name, a blunter instrument (fires for *any* write, not specifically a "save").
- **v3 added task-level hooks** (`PreTaskExec`/`PostTaskExec`) specifically to solve the multi-fire problem above — v2 had no equivalent, no way to get task-level granularity at all.
- **v3 hooks can block.** `PreToolUse`, `UserPromptSubmit`, and `PreTaskExec` support blocking — a command action exiting with code 2 stops the operation and returns stderr to the agent. Real validation-gate behavior, not just a reactive log. No evidence v2's trigger set supports blocking at all.
- **Schema is versioned** (`"version": "v1"`) in v3 — the file format itself can evolve without breaking old hooks.
- **Two action types in v3**: `"type": "command"` (shell) or `"type": "agent"` (a prompt handed to the agent) — v2's embedded shape only really supports a shell command per hook, no agent-prompt action type.

Field names beyond the confirmed v2 trigger list (`matcher`/`match`/`command` shape) are still my best reconstruction of "embedded in agent config" — the trigger name itself is sourced, the surrounding schema isn't. Confirm it parses before relying on it live.

---

## Beat 2 — `/plan` (~1:30)

```
/plan
```
It's interactive, not a one-shot prompt — describe conversationally when asked:

> Add an expense feature to the expense tracker: backend REST module (Expense entity, controller, service, repository, DTOs) following the category module's conventions, frontend list/form matching the categories UI. Expense has amount, date, description, required category FK. Implementation only, no tests — we'll add those separately with /goal.

While it thinks: point out it's drawing on `.kiro/steering/product.md` / `tech.md` / `structure.md` without you repeating those conventions.

**Do not implement.** Leave the plan on screen, move on.

---

## Beat 3 — `/spawn` seed data (~0:30 to kick off)

```
/spawn Seed the categories table in the local H2 database (jdbc:h2:file:./data/budgetbuddy;AUTO_SERVER=TRUE, user sa, no password) with 4 rows: Groceries, Rent, Transport, Utilities. Connect directly via the H2 JDBC driver and run INSERT statements — do not go through the running application's REST API. Confirm the rows exist afterward with a SELECT.
```

Say, then **don't wait**: *"`/spawn` isn't a subagent delegated mid-task — it's a separate long-running session I can walk away from."* Move straight to beat 4.

---

## Beat 4 — Implement the plan, backend-agent + frontend-agent in parallel (~3:00 actual build time)

From the default agent, right after kicking off beat 3's spawn:

```
Implement the plan you just generated for the expense feature. Delegate the backend REST module to backend-agent, and the frontend list/form to frontend-agent — run them in parallel, not sequentially. Implementation only, no tests, we'll add those separately afterward.
```

**Unverified:** whether plain-language agent-naming triggers real parallel delegation, or whether you need `/agent swap backend-agent` in separate panes as a fallback. Test this once before relying on it live.

Press **Ctrl+G** to open the crew monitor, show all spawned/delegated sessions' status live.

**Confirmed from last run: took ~3 minutes.** Say the number out loud — concrete beats vague.

### Filler while it runs — tool trust/permissions, live (~1-2 min)

When a permission prompt fires for a spawned/delegated agent, pause and point at it:

*"This is the enforcement side of the config we looked at in beat 1 — every time an agent tries something outside its allowlist, it stops and asks. Trust is scoped per capability, per path, per command pattern, not granted broadly for a session."*

If a `deniedPaths`/`fs_write deny` rule actually blocks a cross-boundary attempt (frontend touching backend/ or vice versa) — **best possible moment if it happens**, call it out explicitly.

**Corrected framing (don't overclaim):** it is NOT true that `kiro-default` only allows whole-tool-trust or ask-every-time — shell prompts get an interactive tiered picker (exact command / with args / wildcard base) even without a custom agent. The real differentiator of custom agents is **persistence and reusability** — the allowlist is written once, checked into the repo, shared with the team, instead of everyone re-answering the same prompt every session. `~/.kiro/agents/agent.json` is itself just the default agent's own config file — "you were already using agent config, you just never opened the file."

**`/tools`** — mention here: shows canonical current trust state in one command, without waiting for a prompt to fire.

---

## Beat 5 — `/goal`, verification scale (~1:00 to kick off + wait for result)

```
/agent swap backend-agent
/goal Add a backend test for the new Expense controller (create + get, following the existing CategoryControllerTest pattern) and run it to confirm it passes. --max 3
```

Contrast with beat 3's seed spawn: *"That one was one-shot and mechanical. This one plans, implements, runs, and verifies against a pass/fail condition before calling itself done."*

Swapping to `backend-agent` first should mean fewer permission interrupts than running under `kiro-default` — call that out if it visibly happens, it's a direct payoff of beat 1/4's permissions story.

**`/effort`** — one-liner here: *"The seed task could've run at low effort, this verification loop benefits from cranking it up."*

---

## Beat 6 — Show it actually working (still pending as of last practice run — don't skip)

Browser → `/expenses`. Confirm the page renders, shows seeded categories, create/list works. Nothing sells "the build worked" like the page loading. **Do this before going further into commands.**

---

## Beat 7 — `/checkpoint` + `/rewind` (still pending)

Now that there's real agent-written code: break something deliberately (ask the agent to change something you don't want), then:
- **`/checkpoint`** restores files (and the agent's understanding rewinds with it) — undoes work.
- **`/rewind`** forks the conversation only, files untouched — redirects without losing work.

Not "classic vs new" — they solve different problems, say that explicitly.

---

## Beat 8 — `/chat save` / `/chat resume` (~1:30, still pending)

```
/chat save .kiro/sessions/demo-run
/quit
```
Relaunch:
```
kiro-cli
/chat resume
```
Say: *"Same conversation, not a summary — full context, same agent state. In the IDE, closing the window basically means starting over."*

Both relative and absolute paths work for save; no `~` shorthand; no default save location configured.

**`/compact`** — one-liner if session is getting long: *"And when this conversation gets big enough to matter, `/compact` reclaims the space instead of starting over."*

---

## Beat 9 — `/context` + `/knowledge` (still pending — payoff moment)

```
/context show
/context add backend/src/main/java/com/expensetracker/category/**
```

**Callback:** *"Remember earlier when the plan agent had to grep through `category/` to learn conventions? That's the discovery cost this next command is designed to front-load."*

```
/knowledge
```

Distinction: **`/context`** = literal files, injected whole, every turn — precise but re-discovered every time. **`/knowledge`** = pre-indexed, semantic retrieval — costs an indexing step upfront, doesn't auto-refresh if files change after indexing, but scales better than hand-picked globs on a big codebase.

**`/mcp`** — one-liner: *"This is also how you'd wire in an external MCP server — inline, in the agent config, same file we saw in beat 1."*

---

## Beat 10 — `/guide` / `/help` (still pending, quick)

Ask it something real about the docs live. Keep short.

---

## Beat 11 — `/tangent` + `/todo` (mention/demo, still pending)

Good demo prompt for `/tangent` (real, not staged) — reuse the actual AUTO_SERVER=TRUE question from setup:

```
/tangent
```
```
Quick aside — explain what AUTO_SERVER=TRUE does in the H2 JDBC URL and why it matters when a spawned task and the running app both touch the same file.
```

Payoff isn't the answer, it's that the main thread's context is undisturbed afterward — no unrelated H2-locking explanation baked into the feature-build context.

**Unverified:** exact syntax for naming/nesting a tangent, and the close command. Check once before building the beat around it.

`/todo` — mention only, not a full demo.

---

## Beat 12 — `/prompts` (commit + push) — deferred until diff is clean

```
/prompts list
```
Show `.kiro/prompts/commit-push.md` exists as a real, reusable saved prompt.

**Do not run this until the working tree diff is clean** — right now scaffold-stripping changes and live-build changes are entangled in one diff, which makes for a messy commit story. Fix: commit the clean skeleton to `main` first (see setup checklist), branch for the demo, so the only diff at commit time is what the agents built live.

**Skills vs prompts** — one-liner: *"A prompt is a saved instruction. A skill in `.kiro/skills/` becomes a full custom slash command — more capability, same idea."*

---

## Beat 13 — Headless mode / CI PR review

Confirmed working setup — file at `.github/workflows/ci.yml`:

```yaml
name: Kiro Code Review

on:
  pull_request:
    branches: [main]

jobs:
  kiro-review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: Install Kiro CLI
        run: curl -fsSL https://cli.kiro.dev/install | bash

      - name: Run Kiro headless review (agent posts its own PR comment via gh CLI)
        env:
          KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }}
          GH_TOKEN: ${{ github.token }}
        run: |
          kiro-cli chat --no-interactive --trust-all-tools --agent code-reviewer \
            "Review PR #${{ github.event.pull_request.number }} in ${{ github.repository }} and post your findings as a comment on it using the gh CLI."
```

Agent config at `.kiro/agents/code-reviewer.json` — no GitHub MCP dependency (see below for why), `tools: ["fs_read","grep","glob","shell"]`, shell allowlist scoped to `gh pr view/diff/comment` plus read-only git commands, prompt instructs it to fetch the diff itself, review against `.kiro/steering`, and post the comment itself via `gh pr comment` (summary + `### Issue N` sections + `**What to do instead:**`, max 5 issues, stay under 60k chars).

**Timing risk:** a real Actions run takes 1-3+ min (runner queue, checkout, install, review, post). **Trigger this early** (open the PR right after beat 4's build finishes), keep going with other beats, reveal the posted comment near the end — same "start it, walk away, come back" pattern as `/spawn`.

**Talking point (real, not staged):** `--trust-tools=read,grep` actually failed on this exact workflow during rehearsal because reviewing a diff needed shell access it wasn't granted — switched to `--trust-all-tools`. Good live example of the same scoped-vs-broad tradeoff from beat 1/4, this time with a real failure behind it. **Second correction to make out loud if asked:** `--trust-all-tools` overrides `toolsSettings`/`permissions.rules` allowlists *completely*, for any tool — confirmed directly from a run's own warning output (`"You have trusted execute_bash tool, which overrides the toolsSettings: allowedCommands"`). So the scoped git-only allowlist on `code-reviewer` is documentation of intent, not enforcement, as long as `--trust-all-tools` stays on the command line. Don't claim it as a real security boundary in this configuration.

**Be precise:** this has no relationship to the crew monitor from beat 4 — it's a separate invocation model running on GitHub's infrastructure, not something the local session is tracking.

**GitHub MCP does not currently work in headless mode** — tried it, got `Failed to retrieve MCP settings; MCP functionality disabled` consistently, including in an *independently confirmed working* example from a different project that also hit this exact warning. That project's agent worked anyway because it had `shell` access and fell back to the plain `gh` CLI — which is exactly the pattern `code-reviewer` now uses. If asked "can headless mode use MCP servers," the honest answer is "not reliably, as of this testing — plan around `gh`/shell instead." Root cause of the MCP failure itself is still unknown, don't speculate on it live.

**Known setup gotchas (already solved, but could recur):**
- `kiro-cli` is not preinstalled on the runner — needs the explicit `curl -fsSL https://cli.kiro.dev/install | bash` step.
- `KIRO_API_KEY` not arriving silently falls through to an interactive/device-flow auth error (`Failed to open browser for authentication`) — doesn't mention API keys at all, easy to misread as "API key auth isn't supported." It just means the key never reached the process. Checklist when this happens: (1) is this a fresh run after adding the secret, (2) exact name match, (3) **repository secret vs environment secret** — this was the actual root cause last time, (4) is the PR from a fork (fork PRs never get secrets).
- Debug trick if stuck again: temporary step printing `SET, length=N` / `EMPTY` for the env var, without leaking the value.
- If the agent needs to run `gh` itself (not just the workflow), **`GH_TOKEN` must be in that step's own `env:` block** — it silently can't authenticate otherwise, no loud error, it just fails to act.

---

## v3 umbrella wrap-up slide (close)

Consolidate rather than re-explain:
- JSON → **Markdown + YAML frontmatter** for agent configs (biggest structural change, audience will notice if they open a file)
- **Tags replace individual tool IDs** — `read`/`write`/`shell`/`web`/`subagent`/`knowledge`/`todo_list`/`@mcp`/`@builtin`/`*`
- **`permissions.rules`** (capability/match/effect) + **`policies`** replace scattered per-tool `toolsSettings`
- `/spec`, `/plan` Shift+Tab mode, `/tangent` — new in v3
- `/upgrade-agent` migrates in place, additively

---

## Timing recap (rough)

| Beat | Target |
|---|---|
| Open | 0:30 |
| 1 — Agent config / v2→v3 | 2:00 |
| 2 — `/plan` | 1:30 |
| 3 — `/spawn` seed (kick off) | 0:30 |
| 4 — Parallel build + permissions filler | ~3:00 (real) + 1-2:00 filler |
| 5 — `/goal` verify | 1:00 |
| 6 — Show it working | 1:00 |
| 7 — checkpoint/rewind | 1:30 |
| 8 — chat save/resume | 1:30 |
| 9 — context/knowledge | 2:00 |
| 10 — guide/help | 0:30 |
| 11 — tangent/todo | 1:00 |
| 12 — prompts commit-push | 1:00 |
| 13 — headless CI (background, revealed near end) | reveal only, ~0:30 |
| v3 wrap slide | 1:00 |

Total is already tight against 15 min once beats 6-13 (still unrehearsed as full run-throughs) are actually timed for real — expect to cut something live. Best cut candidates if short on time: `/tangent`/`/todo` (already mention-only), full `/prompts` demo (keep to "here's the file" instead of running commit-push), `/guide`/`/help` (fold into a single sentence rather than a live query).
