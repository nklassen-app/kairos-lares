# CLAUDE.md — Kairos build sessions

The rules for every Kairos session, under the **Foundation Charter** (`kairos-foundation/FOUNDATION_CHARTER.md`, in the `kairos_v3` checkout), which holds the reasons. This is a verbatim copy of `kairos-foundation/CLAUDE.md`: edit the master, run `kairos-foundation/scripts/sync_claude_md.sh`, never edit a copy. If a prompt conflicts with this file, this file wins unless the Charter is amended.

## 1 · The boundary (non-negotiable)
- **This session is the Consumer tier: Public, Personal (by hand) and synthetic data only.** Family, health, finances, the partner's data, how to reach the house, mail, calendar, contacts and personal-strategy content never enter context, a repo, a fixture, a `.db`, a debug dump or a commit. When unsure of a class, take the higher one; where each class may go is the matrix in Charter Part 1.
- Mocks come from the *schema*, never from a real instance, and are synthetic in shape as well as names, so nothing traces back to the real data. If a task seems to need real sensitive data, **stop and flag it**; never fictionalise real data to proceed.
- **Real data lives outside every repo, in the private-data home; no session reads, lists, edits or copies it** (deny rules and `session_guard.py`). Data or an image found untracked in a repo is named, never opened (the glance flags it). If N. pastes Crown-jewel content (a code, a key, an unredacted photo), don't repeat it: say so and ask N. to remove it. Never pair two harmless facts into a sensitive one (a weakness and where it is).
- **Never weaken the boundary:** never relax the canonical `.gitignore` block, commit a `.db`, key, `.env` or real data, or loosen the Gmail/Google Calendar deny in `.claude/settings.json` (never call those connectors; if the rule is missing, flag it). Asked to, refuse and say why.
- **Claude never pushes to main and never merges: commit, then hand off.** On the Chromebook N. runs `push_all.sh`; in a cloud session Claude pushes a `claude/…` branch and opens a PR, and N. squash-merges it in the GitHub app. Every push goes through the audit (`audit_push.sh`, the `pre-push` hook); never `--no-verify`. A public repo's branch push waits for N.'s yes to the file list the hook prints, then goes with the `KAIROS_READ_OK` value it names. `session_guard.py` and the audit enforce this.
- **Repos are private** unless the Registry's Repo column says public; making one public is N.'s decision. Sensitive or personal-strategy content is never public. Before anything goes public, scan it for real people's names, the possessive form ("X's …") included.

## 2 · The session
- **Start:** the SessionStart hook runs `kairos-foundation/scripts/session_start.sh` (the glance, last work, open work); if its output isn't in context, run it. Before touching any file, merge every repo that is behind and tell N. what was last done and what is open. The glance's first lines say what this device can't do: pick work that finishes here, or say up front which step needs another device.
- **Start:** if `kairos_v3` and the GitHub tools are here, run `kairos-foundation/scripts/dashboard_write.sh --ticks` (N.'s ticks into the backlog).
- **Fetch before saying whether something is done** or what state a repo is in, mid-session too: cloud sessions push.
- **History on GitHub is never rewritten.** To change unpushed commits, rebuild them on their old base and merge, never reset or rebase onto a fresh fetch (the guard blocks it); then diff every file upstream touched.
- **A PR Claude opens is watched until merged or closed:** subscribe right away without asking, fix what is asked, say once when it waits only on N.'s merge.
- **End:** after the last backlog change, run `dashboard_write.sh` (fetch, ticks, render, write in one step; never edit issue #11 by hand, never split the steps). Then give N. one piece of feedback on how they worked with Claude this session: specific, one or two sentences, never praise.

## 3 · Secrets and egress
- Decisions about what is sensitive or may cross are **N.'s, by hand**: surface them, never resolve them silently. Mechanisms (secrets, egress) are built once in the foundation; never hand-roll a per-app variant.
- Secrets come from the environment via `config.py` (`load_environment()`, `require_secret()`); real values only in a gitignored `.env`.
- **No outbound call** without a justified reason. A justified one goes through **one** function that assembles what is sent and where, and is listed in the module's Registry row; any other call (logging, CDN, analytics) is a breach to flag. **A new dependency** is a possible egress channel: flag it, never add it silently.
- **Model calls** go only through `send_to_model(payload, data_class, tier)`, which refuses what the matrix forbids; until it exists, no Held or Crown-jewel content goes to any model. Network-level egress enforcement waits for the first module that puts Crown-jewel data through a model.

## 4 · Working with N.
- **Claude does whatever it can, and N. reviews.** N.'s hands only for what Claude can't reach (an account's own UI, a device, money, a real-world act) and for decisions. A step an agent or a vendor could carry names them, not N.
- **Every decision on N. comes with Claude's recommendation.** A taste decision (naming, design, wording, ordering) carries a default with a date that stands unless N. changes it; privacy, the boundary, money and acts in N.'s name never do.
- **A backlog item is always named by its ID and a short phrase** ("Lares 7, voice input"), never a bare ID.
- **A step on N. reads as a task:** verb first, what and where, about how long ("Read the house-twin page and name the module — 15 min").
- **A design doc is reviewed in the session that writes it:** put its open points to N. as questions with recommendations and write the answers back. It becomes a step on N. only if N. defers.

## 5 · How we build
- **Err toward the smallest thing that works.** Nothing speculative (features, abstractions, analytics, auth, hosting, backups): flag it as deferred. Rigor scales with tier. **Never build Tier 2** (multi-user, other people's data) without N.'s explicit go-ahead.
- **One canonical home per thing.** A copy is generated or linked, never kept in step by hand; a reconciliation is a signal to remove the duplicate.
- **No shared Kairos surface:** a module gets the smallest front end its use needs; an unused one is retired, not polished.
- **Test first:** write the failing test from the story's DoD, see it fail, then write the code. The push audit runs every suite and refuses code without a passing test (`test_gate.sh`); a change that honestly needs no test says why in a `No-test: <reason>` commit line, which N. reads.
- **A story must be tryable on the real surface within one session.** If it's wider, say so before building and split it.
- **At most three projects in focus in a week** (the backlog's focus line). Build work on a parked project: flag it and don't start; N. decides.

## Where the detail lives
- **Charter** (`kairos-foundation/FOUNDATION_CHARTER.md`): the class-by-tier matrix (Part 1), decisions vs. mechanisms (Part 2), public repos and the Whiteboard's one door (Part 7).
- **Backlog** (`kairos-system/BACKLOG.md`): its head for the story format (DoD first, radius, designations); *Buckets* for the bucket rules (Utilities, Public profile).
- **A module:** its row in `kairos-foundation/REGISTRY.md` (tier, data class, repo, egress doors, deploy), written before any code; `kairos-foundation/MODULE_TEMPLATE.md` for its class's skeleton, conventions and deploy (the phone-app pattern included); its own README.
- **What never gets committed:** `kairos-foundation/gitignore_canonical.gitignore`.
