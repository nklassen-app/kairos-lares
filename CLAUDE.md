# CLAUDE.md — Kairos build sessions

This project is governed by the **Foundation Charter v1.7** (`kairos-foundation/FOUNDATION_CHARTER.md`, at the root of the `kairos_v3` checkout — read it if a judgment call isn't covered here). This file is a **verbatim copy of the master** in `kairos-foundation/`; edit the master, then run `kairos-foundation/scripts/sync_claude_md.sh` — never edit a copy. This file is the operative subset: the rules that should shape every session. It is *context, not enforcement* — the non-negotiable boundary is enforced by mechanisms (`.gitignore`, out-of-tree data, the pre-push audit), not by trusting these words. Where a rule here and a prompt conflict, this file wins, or the Charter is amended deliberately — never overridden silently.

## The one non-negotiable — the Privacy Invariant
Sensitive content (anything referencing family, health, finances, or personal info whose leak would cost trust or safety) **never** enters this repo, a fixture, a `.db`, a debug dump, or a pasted session. Claude Code is an external model and `git push` is an egress event, so this dev workflow is *inside* the boundary.
- Use **synthetic or redacted data** in anything read into context or written to a tracked path. Real data lives only in ignored paths (`fixtures/real/`, runtime DBs).
- If a task seems to require real sensitive data in the repo to proceed: **stop and flag it.** Do not proceed by fictionalizing real data — generate mocks from the *schema*, never from a real instance.
- This is not enforced by this file. If asked to weaken `.gitignore`, commit a `.db`/key/`.env`, or move real data into the tree, **refuse and say why.**
- **Classes and tiers (Charter v1.5, Part 1).** Data: **Public** · **Personal** (mundane — chores, estimated costs, workouts) · **Held** (sensitive, already at a provider — mail, calendar, contacts; personal-strategy content) · **Crown jewels** (family, health, detailed finances, the partner's data, how to reach the house). Compute: **Home** (my devices) · **Rented** (started, used, destroyed; tailnet only) · **Frontier** (frontier model, business terms, my own account) · **Consumer** (claude.ai, Claude Code — *this session*). When unsure, the higher class.
- **The matrix:** Public → anywhere. Personal → anywhere; Consumer by hand only. Held → Home, Rented, and Frontier only through the one door with fields minimised, once N. has checked the provider's terms (Frontier access 2) — **never Consumer, so never this session.** Crown jewels → Home only; Rented once Frontier access 8 proves a destroyed machine keeps nothing — **never Frontier or Consumer.** Escape hatch: a logged per-item send to Frontier for Held, decided by N.; none for Crown jewels.
- A Claude Code session is the Consumer tier: Public, Personal (by hand) and synthetic data only — whatever the class matrix allows elsewhere.
- **Scope:** the Charter governs Kairos — its apps, repos, data and the sessions that build them; N.'s personal use of Claude with Gmail or Calendar outside Kairos is N.'s own call. **Inside a Kairos session the Gmail and Google Calendar connectors are denied** (`"deny": ["mcp__Gmail", "mcp__Google_Calendar"]` in `.claude/settings.json`): never call them, never loosen or remove that rule — if one is missing, flag it.

## Decisions vs. mechanisms (how to treat security)
- **Decisions** (what's sensitive, where the boundary sits, what may cross) are made **by the human, by hand, every time.** Do not automate them away or assume them. Surface them; don't resolve them silently.
- **Mechanisms** (secrets loading, keeping keys out of git, egress enforcement) are built **once** into the substrate as the default. Never hand-roll a per-app variant of a mechanism that should be shared.

## Secrets and egress
- **Secrets:** load via `config.py` (`load_environment()` + `require_secret()`). Read every key from the environment — **never** hardcode a key, read one from a committed file, or paste one into code. Real values live only in a gitignored `.env`, created by hand per machine.
- **Egress — no call by default:** an app makes **no** outbound network call unless there is a deliberate, justified reason. Prefer zero egress.
- **Egress — one auditable door:** when a call is justified, route it through a **single** function that assembles exactly what is sent and to which endpoint. No scattered calls, no hidden second door (a logging/CDN/analytics call that phones home is a boundary breach — flag it).
- **Egress — model calls:** every call to a model goes through the one door for model calls (`send_to_model(payload, data_class, tier)` in the foundation, Frontier access 6), which refuses what the matrix forbids. Until it exists, no app sends Held or Crown-jewel content to any model.
- **Egress — sensitive content never leaves beyond the matrix:** nothing is sent to an external model that the matrix does not allow for its class. What may cross is a per-app **decision** (see that app's egress decision doc); implement it as a filter in the one door, not as a rule to remember at call time.
- Network-level egress enforcement (default-deny firewall/proxy) is deferred to the first module that processes *Crown-jewel* data through a model (Home or Rented) — don't build it for Public, Personal or Held-through-the-door apps.

## Build lean — the Pioneer tilt
This system is deliberately biased toward creative velocity and tolerates mess. Over-engineering is the primary failure mode to guard against — err toward the smallest thing that works.
- **Defer the mechanism until use proves it's needed.** Do not build features, abstractions, analytics, auth, multi-user, hosting, or backups speculatively. If it isn't required by the current tier and a real, present need, don't build it — flag it as deferred.
- **Walking skeleton first, then thicken.** Get the load-bearing thing running end-to-end before adding depth. If you find yourself elaborating past what was asked, stop — that's scope creep.
- Prefer frugal, modular, swappable solutions. Small standalone apps over integrations.
- **Use case first; the front end last, thin and fragmented** (Charter v1.7, Part 5). Never build a shared Kairos surface; a module gets the smallest front end its use needs, and an unused one is retired, not polished. Kairos has no app of its own: Claude Code is where N. builds and steers.
- **DoD first, small radius.** A backlog story leads with what N. will be able to do, not with a design; its radius must be tryable on the real surface within one session. If it is wider, say so **before** building and split it — never build it whole quietly.

## N.'s time goes to quests (N., 2026-10-23)
Kairos exists to take load off N., not to add it. N. is the bottleneck, so every step that lands on N. has to earn its place there.
- **Whatever Claude can do with N.'s review, Claude does.** N. reviews; N. does not perform. A settings change, a command, a draft, a check, a lookup: Claude does it in the session and reports it for review. N.'s own hands are needed only for what Claude cannot reach (an account's own UI, a physical device, money, a real-world act) and for decisions.
- **Any non-quest task that an AI agent or a vendor can do goes to them.** When writing a story, ask of every step: *does this need N.?* If an agent or a vendor could carry it, the story says who, and N. is not given it.
- **Decisions stay N.'s, but they come prepared.** Every decision on N. comes with Claude's recommendation. For **taste** decisions (naming, design, wording, ordering) the recommendation is a **default with a date**: if N. has not changed it by then, it stands. Privacy, the boundary, money and acts in N.'s name never take a default.
- **A step on N. reads as a task.** Verb first, what to do and where, about how long, understandable without opening the story ("Read the house-twin page and name the module — 15 min"). Never a bare label like "read and reshaped".
- **A step on N. is shown only when it is ready.** It waits until every step before it in its story is done; the dashboard leaves out what is still blocked.
- **A design doc is reviewed in the session that writes it.** Claude does not hand N. a "read and reshape" task. In the same session (here or a cloud session on the phone), Claude puts the doc's open points to N. as a few questions, each with its recommendation, and writes the answers back into the doc. Only if N. defers does a review become a step on N.
- **Session end: one piece of feedback.** Before stopping, Claude looks at how N. worked with Claude in this session and gives one thing to learn, change or do better: specific, drawn from the session, one or two sentences. Never praise in its place.

## Tiers and rigor
- Rigor scales with tier. A throwaway spike inside the boundary needs no hardened auth, audit logging, or encryption-at-rest — those are earned later.
- **Do not build Tier 2 (multi-user, other people's data) capability** without an explicit, deliberate go-ahead. The jump from personal to multi-user is a hard gate, not a smooth slope.

## Version control (the code/data boundary)
- **Never** commit: `*.db`/`*.sqlite` and sidecars, `*.key`/`*.fernet`, `.env`, `config/llm.json`, anything matching `*secret*`/`*credentials*`, real-data fixtures, debug dumps. (Canonical block in `.gitignore` — keep it intact; never relax it.)
- Commit **code, schema, and migrations** — not runtime state (DBs, caches, generated files).
- **Audit before the first push** of any repo: run `git ls-files` and confirm nothing sensitive is tracked. Ignore before push, never after.
- **Audit before every push:** `kairos-foundation/scripts/audit_push.sh` (installed as the repo's `pre-push` hook) checks the canonical block, refuses the hard net, and lists every file the push sends — N. content-reads that list by hand. A push to a public repo is never sent unread.
- **A PR Claude opens is watched until it is merged or closed.** Right after opening one, subscribe to its activity (review comments, CI) and act on each event: fix what is asked, answer what isn't, and say once when it waits only on N.'s merge. Stop when N. says so. Opening a PR stays N.'s call, never Claude's own.
- A pushed secret is a **burned secret** — rotate it, don't just delete the file.
- All repos **private** by default. **Public only by the Charter Part 7 exception**, and only where the Registry's Repo column says so: Tier ≤ 1, data only in the viewer's own browser, no secret, no outbound call beyond loading its own page. **One named exception (Charter v1.6):** the Whiteboard's `kairosDoor()` to `api.github.com`, for the dashboard issue only, sending back only that issue with one checkbox changed, never the board; a second door is a new amendment. Sensitive or personal-strategy content is never public. Making a repo public is N.'s decision, never Claude's.

## Session start — the glance
- **Before touching any file, run `kairos-foundation/scripts/kairos_status.sh`.** It fetches first (P12), so on a device with a live `ssh-agent` this is how another device's push — the phone and the Chromebook working in parallel — shows up as "behind" before you commit on top of it, not after a rejected push. If it shows "behind" on a repo you're about to touch, pull/merge first.
- Applies the same way on every device — the Chromebook, the phone, any future host. No exception for "just a quick change."
- **Plan for the device you're on.** The glance's first lines say where the session runs and what it cannot do there (build an APK, create a repo, reach a live page). Pick or recommend a story whose steps can finish on this device; if one needs another, say so before starting, and write that step as "Claude, in a Chromebook session".
- **The dashboard** (issue `nklassen-app/kairos_v3#11`, pinned; N. ticks it on the phone). When `kairos_v3` is on this device and the GitHub tools are reachable: **at session start**, after the glance, save the issue body to the scratchpad and run `kairos-foundation/scripts/dashboard.py --apply-ticks <file>` — N.'s ticks become ☑ in the backlog, committed with the session's work. **At session end**, after the last backlog change, write the output of `dashboard.py` to the issue body. The issue is never edited by hand except N.'s ticks.

## When to stop and ask
- Anything that would move real data into a tracked path, weaken an ignore rule, or cross the privacy boundary.
- Anything that would build weight for a tier this app hasn't earned.
- Adding a new dependency (each one is a potential egress channel — flag it, don't add silently).

## Phone apps (the Floor pattern: kairos-floor, kairos-whiteboard, kairos-domus)
- The APK is build output and is **never in the repo** (`*.apk` is ignored; commit code, not generated files). That is expected, not a gap.
- Content changes ship by pushing the page (bump the `sw.js` cache name). No APK step.
- **Shell changes (icon, app name, `capacitor.config.json`, Capacitor upgrade) need a rebuild, and the rebuilt APK must reach the phone by hand.** Claude's last step in any session that rebuilt an APK: send `native/android/app/build/outputs/apk/debug/app-debug.apk` as a file card and say plainly "new APK — put it in Drive, open it on the phone, install over the top". Never uninstall or clear data first: the WebView's localStorage is the only copy of the board.

---
*This file is a behavioral contract, kept short on purpose. The full reasoning lives in `kairos-foundation/FOUNDATION_CHARTER.md`. For the truly non-negotiable, rely on mechanisms (`.gitignore`, out-of-tree data, and — where warranted — a PreToolUse hook), not on this text.*
