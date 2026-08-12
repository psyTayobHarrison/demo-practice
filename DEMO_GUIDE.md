# Kiro CLI Demo — Run-Through Guide

Target: ~15 min, 20 min hard ceiling. Audience: Kiro IDE users, CLI-curious but unfamiliar with commands.

Opening line (no slides, ~30s): *"The IDE gives you one agent in one window. The CLI gives you agents you configure per task, running in parallel, resumable across days, scriptable in CI. Same engine, different unit of work."*

---

## Before you start (setup checklist)

- [ ] Run `./reset-demo.sh` — clears H2 db, build artifacts, restores agent configs to v2, removes `.github/workflows/ci.yml` if present.
  - **Known gap:** this does NOT remove live-built feature code (`backend/.../expense/*`, `frontend/.../expenses/*`, routes/models/nav edits) from a previous run. Plan: commit the clean stripped-scaffold state to `main`, branch off it for each demo/practice run, and reset via `git checkout main -- . && git clean -fd` instead once that's done. Until then, manually verify `expense/` and `expenses/` dirs are gone after reset.
- [ ] Confirm `.kiro/agents/backend-agent.json` / `frontend-agent.json` are v2 shape (no `permissions` block) — should be automatic via reset script.
- [ ] Confirm `backend/src/main/resources/application.yml` DB URL includes `;AUTO_SERVER=TRUE` (needed so a spawned seed task and the running app can both touch the H2 file concurrently without a lock error). This has reverted on its own before — **double check it's actually there before you start.**
- [ ] Confirm `KIRO_API_KEY` exists as a **repository** secret (not environment-scoped) at `https://github.com/psyTayobHarrison/demo-practice/settings/secrets/actions`, name matches exactly.
- [ ] `categories` table should be empty (fresh H2 file) — don't pre-seed, beat 3 does this live.
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

      - name: Run Kiro headless review
        env:
          KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }}
        run: |
          kiro-cli chat --no-interactive --trust-all-tools \
            "Review the changes in this PR diff for correctness, security issues, and convention violations against .kiro/steering. Format the response as a GitHub PR review comment: start with a one-sentence summary, then one '### Issue N: <short title>' section per finding, each with a brief problem description (name the specific file/class/function), a short fenced code block if it helps illustrate the issue, and a '**What to do instead:**' line with the concrete fix. Max 5 issues. If there are no issues, respond with exactly: 'No issues found.' Do not narrate your review process, do not restate the full diff, do not include a closing summary or sign-off — output nothing but the summary sentence and the issue sections themselves." \
            > review-output.md

      - name: Post review as PR comment
        env:
          GH_TOKEN: ${{ github.token }}
        run: gh pr comment ${{ github.event.pull_request.number }} --body-file review-output.md
```

**Timing risk:** a real Actions run takes 1-3+ min (runner queue, checkout, install, review, post). **Trigger this early** (open the PR right after beat 4's build finishes), keep going with other beats, reveal the posted comment near the end — same "start it, walk away, come back" pattern as `/spawn`.

**Talking point (real, not staged):** `--trust-tools=read,grep` actually failed on this exact workflow during rehearsal because reviewing a diff needed shell access it wasn't granted — switched to `--trust-all-tools`. Good live example of the same scoped-vs-broad tradeoff from beat 1/4, this time with a real failure behind it.

**Be precise:** this has no relationship to the crew monitor from beat 4 — it's a separate invocation model running on GitHub's infrastructure, not something the local session is tracking.

**Known setup gotchas (already solved, but could recur):**
- `kiro-cli` is not preinstalled on the runner — needs the explicit `curl -fsSL https://cli.kiro.dev/install | bash` step.
- `KIRO_API_KEY` not arriving silently falls through to an interactive/device-flow auth error (`Failed to open browser for authentication`) — doesn't mention API keys at all, easy to misread as "API key auth isn't supported." It just means the key never reached the process. Checklist when this happens: (1) is this a fresh run after adding the secret, (2) exact name match, (3) **repository secret vs environment secret** — this was the actual root cause last time, (4) is the PR from a fork (fork PRs never get secrets).
- Debug trick if stuck again: temporary step printing `SET, length=N` / `EMPTY` for the env var, without leaking the value.

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
