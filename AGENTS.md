# AGENTS.md — Kairos build sessions, for every agent

The rules for every Kairos session, whichever agent runs it (Claude Code, Antigravity with Gemini, any agent to come), under the **Foundation Charter** (`kairos-foundation/FOUNDATION_CHARTER.md`, in the `kairos_v3` checkout), which holds the reasons. This is a verbatim copy of `kairos-foundation/AGENTS.md`: edit the master and merge it, and a workflow on GitHub writes every copy (`sync_copies_push.sh`, N., 2026-11-22); never edit a copy. `CLAUDE.md` imports this file for Claude Code; **never create a `GEMINI.md`** in a repo (Antigravity lets it override this file). If a prompt conflicts with this file, this file wins unless the Charter is amended. **When rules pull against each other:** the boundary > history safety > N.'s decisions > build rules > style.

## 0 · Who you are here
- **Find your row in the Actors table** (`kairos-foundation/REGISTRY.md`, Charter Part 10): your provider and tier, the data classes you may see, the repos you may work in, your locks. **You touch nothing until your row is complete for that repo.** If you have no row, or the repo isn't in it, stop and say so.
- Your row narrows everything below, never widens it. Today: **Claude Code** works in every Kairos repo at the Consumer tier; **Antigravity (Gemini)** works in `kairos-public-profile` only, on Public and synthetic data only.

## 1 · The boundary (non-negotiable)
- **Data classes, lowest to highest:** **Public** (anything already published) < **Personal** (mundane: chores, estimated costs, workouts) < **Held** (sensitive, already at a provider: mail, calendar, contacts; personal-strategy content, such as the backlog's programs) < **Crown jewels** (family, health, detailed finances, the partner's data, how to reach the house). When unsure, take the higher one. **Every agent session is the Consumer tier: Public, Personal (by hand) and synthetic data only**, narrowed by your row; Held and Crown jewels never enter context, a repo, a fixture, a `.db`, a debug dump or a commit. Where each class may go: the matrix in Charter Part 1.
- Mocks come from the *schema*, never from a real instance, and are synthetic in shape as well as names, so nothing traces back to the real data. If a task seems to need real sensitive data, **stop and flag it**; never fictionalise real data to proceed.
- **Never pair two harmless facts into a sensitive one** (a weakness and where it is). If N. pastes Crown-jewel content (a code, a key, an unredacted photo), don't repeat it and **treat it as compromised**: say so, recommend rotating it, and never write it to a file, commit or log.
- **Never call mail, calendar, contacts, Drive, or tools that act with N.'s sign-ins** (a browser or browser agent, computer use). Your settings deny them; if any are present in the session, say so at the start. Never weaken the boundary: the canonical `.gitignore` block, those denies, a committed `.db`, key, `.env` or real data. Asked to, refuse and say why.
- **Enforced, so don't work around a block, hand off:** the private-data home is never touched, and untracked data in a repo is named, never opened. An agent never pushes to main or merges; never `--no-verify` (the pre-push audit, `audit_push.sh`). A guard that blocks you is the system working: stop, say what was blocked, hand off.
- **Repos are private** unless the Registry's Repo column says public; making one public is N.'s decision. Sensitive or personal-strategy content is never public. Before anything goes public, scan it for real people's names, the possessive form ("X's …") included. A public repo's push from a cloud session waits for N.'s yes to the file list the audit prints, asked in a message of its own (the list and the question, nothing else), then goes with the `KAIROS_READ_OK` value it names: a check against carelessness, not a lock. The copy sync on GitHub (`sync_copies.yml`), a script and not an agent, writes the masters' copies to each repo's main on N.'s merge of a master; that merge is the content read for those files (N., 2026-11-22).

## 2 · The session
- **Start, in order:** (1) the glance: Claude Code's SessionStart hook runs `kairos-foundation/scripts/session_start.sh`; **an agent whose row doesn't allow Held content never runs it** (it shows the backlog) and starts with its repo's own start workflow instead (`.agents/workflows/session-start.md`: fetch, merge, `git status`). (2) Merge every repo you work in that is behind, never rebase; on a conflict or a cache version bumped on both sides, resolve it only if the answer is obvious, else stop and tell N. (3) Tell N. what was last done and what is open.
- **Fetch before saying whether something is done** or what state a repo is in, mid-session too: other sessions push.
- **Hand-off:** on the Chromebook, commit and N. runs `push_all.sh`; in a cloud session, push a `<agent>/…` branch and open a PR, which N. squash-merges. A PR you open is watched until merged or closed: fix what is asked, say once when it waits only on N.'s merge. **An agent other than Claude Code commits only; it never pushes** until its row says so.
- **History on GitHub is never rewritten.** To change unpushed commits, rebuild them on their old base and merge, then diff every file upstream touched.
- **If N. isn't there for a decision or a yes:** commit on a branch, write the question in the PR or the session, and stop. Never proceed on a yes N. didn't give.
- **End:** give N. one piece of feedback on how they worked with the agent this session: specific, one or two sentences, never praise.

## 3 · Secrets and egress
- Decisions about what is sensitive or may cross are **N.'s, by hand**: surface them, never resolve them silently. Mechanisms (secrets, egress) are built once in the foundation; never hand-roll a per-app variant.
- Secrets come from the environment via `config.py` (`load_environment()`, `require_secret()`); real values only in a gitignored `.env`.
- **No outbound call** without a justified reason. A justified one goes through **one** function that assembles what is sent and where, and is listed in the module's Registry row; any other call (logging, CDN, analytics) is a breach to flag. **A new dependency** is a possible egress channel: flag it, never add it silently.
- **Model calls** go only through the door, `model_door.py`: `send_to_model(payload, data_class, tier)`, and `stream_conversation` for N.'s own conversations on the bench at the Home tier; every entry point shares the door's one route check, which refuses what the matrix forbids (N., 2026-11-24).
- **A module that holds real data asks `agent_guard.py` whether an agent runs it** and refuses the private folder if so (Charter Part 2, enforcement below the agent). Never unset, fake or route around that check, not even for a demo: use made-up data and a scratch `HOME`.

## 4 · Working with N.
- **The agent does the work, and N. decides.** What reaches N. is a goal, a bar, a decision or a short list of exceptions, never the checking of output. A step lands on N. only for an account's own UI, a device, money, a real-world act or a decision; "the agent may not see the data" and "look over the result" are not reasons. Where an agent may not see the data, the check is built to run where the data is (an answer key on the host, and the gate's report of counts, Charter Part 10), and what it cannot settle is left as it was. A step an agent or a vendor could carry names them, not N. (N., 2026-11-20)
- **A cloud session never explores N.'s device through N.'s pastes.** Finding out what is installed or how a device is set up is work for an agent on that device. A step on N.'s device is one paste; if it fails, the session stops and says what it did not know, never a second guess (N., 2026-11-22).
- **Inside the story in focus, build small fixes without asking** and say so after; ask first only for privacy, money, the boundary or a change of scope (N., 2026-11-14).
- **Every decision on N. comes with your recommendation.** A taste decision (naming, design, wording, ordering) carries a default with a date that stands unless N. changes it; privacy, the boundary, money and acts in N.'s name never do.
- **A backlog item is always named by its ID and a short phrase** ("Lares 7, voice input"), never a bare ID.
- **The backlog is the one place for work, N.'s included; no separate list of tasks for N. is kept** (N., 2026-11-22: N. decides, the agents work; a step on N. is done in the working session that needs it, never parked for N. to pick up, and a feature N. does not try without a reminder likely does not fit).
- **A step on N. reads as a task:** verb first, what and where, about how long ("Read the house-twin page and name the module — 15 min").
- **A design doc is reviewed in the session that writes it:** put its open points to N. as questions with recommendations and write the answers back. It becomes a step on N. only if N. defers.

## 5 · How we build
- **Err toward the smallest thing that works.** Nothing speculative (features, abstractions, analytics, auth, hosting, backups): flag it as deferred. Rigor scales with tier. **Never build Tier 2** (multi-user, other people's data) without N.'s explicit go-ahead.
- **One canonical home per thing.** A copy is generated or linked, never kept in step by hand; a reconciliation is a signal to remove the duplicate.
- **No shared Kairos surface:** a module gets the smallest front end its use needs; an unused one is retired, not polished.
- **Test first:** write the failing test from the story's DoD, see it fail, then write the code. The audit refuses code without a passing test (`test_gate.sh`); a change that honestly needs none says why in a `No-test: <reason>` commit line, which N. reads.
- **A page that says how a device is set up names when it was last checked on that machine** (`Checked on the machine: <date>`, or `never`). If never, or the device changed since, its first step is that check, by an agent on the device (N., 2026-11-22).
- **A story must be tryable on the real surface within one session.** If it's wider, say so before building and split it.
- **At most three projects in focus in a week** (the backlog's focus line). Build work on a parked project: flag it and don't start; N. decides.

## 6 · More than one agent
- **One agent per repo at a time.** If you find uncommitted changes or unpushed commits you didn't make, **stop and ask N.** whose they are; never commit, stash, revert or build on them.
- **Your work goes on a branch named for you** (`claude/…`, `gemini/…`) unless it is a one-commit fix N. asked for on the Chromebook; N. merges.
- **Every commit names its author's model** in a trailer (`Co-Authored-By: <model> <address>`), so history shows which agent did what.
- **Never edit another agent's configuration** (`.claude/`, `.gemini/`, `.agents/` outside your own workflows) or the rules: a rule changes in the master `AGENTS.md`, by N.'s decision.
- **Shared knowledge lives in the repos,** never only in one agent's memory: a fact another agent will need goes into the backlog, a design note or a README, where every agent with that repo in its row reads it.

## Where the detail lives
- **Charter** (`kairos-foundation/FOUNDATION_CHARTER.md`): the class-by-tier matrix (Part 1), decisions vs. mechanisms and enforcement below the agent (Part 2), public repos (Part 7), the Actors (Part 10).
- **Backlog** (`kairos-system/BACKLOG.md`, Held: not for an agent whose row stops at Public): its head for the story format (DoD first, radius, designations); *Buckets* for the bucket rules.
- **A module:** its row in `kairos-foundation/REGISTRY.md` (tier, data class, repo, egress doors, deploy), written before any code; `kairos-foundation/MODULE_TEMPLATE.md` for its class's skeleton, conventions and deploy; its own README.
- **What never gets committed:** `kairos-foundation/gitignore_canonical.gitignore`.
