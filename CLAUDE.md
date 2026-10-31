# CLAUDE.md — Kairos build sessions

The rules for every Kairos session, under the **Foundation Charter** (`kairos-foundation/FOUNDATION_CHARTER.md`, in the `kairos_v3` checkout), which holds the reasons. This is a verbatim copy of `kairos-foundation/CLAUDE.md`: edit the master, run `kairos-foundation/scripts/sync_claude_md.sh`, never edit a copy. If a prompt conflicts with this file, this file wins unless the Charter is amended. **When rules pull against each other:** the boundary > history safety > N.'s decisions > build rules > style.

## 1 · The boundary (non-negotiable)
- **Data classes, lowest to highest:** **Public** (anything already published) < **Personal** (mundane: chores, estimated costs, workouts) < **Held** (sensitive, already at a provider: mail, calendar, contacts; personal-strategy content) < **Crown jewels** (family, health, detailed finances, the partner's data, how to reach the house). When unsure, take the higher one. **This session is the Consumer tier: Public, Personal (by hand) and synthetic data only**; Held and Crown jewels never enter context, a repo, a fixture, a `.db`, a debug dump or a commit. Where each class may go: the matrix in Charter Part 1.
- Mocks come from the *schema*, never from a real instance, and are synthetic in shape as well as names, so nothing traces back to the real data. If a task seems to need real sensitive data, **stop and flag it**; never fictionalise real data to proceed.
- **Never pair two harmless facts into a sensitive one** (a weakness and where it is). If N. pastes Crown-jewel content (a code, a key, an unredacted photo), don't repeat it and **treat it as compromised**: say so, recommend rotating it, and never write it to a file, commit or log.
- **Never call mail, calendar, contacts, Drive, or tools that act with N.'s sign-ins** (a browser, computer use). The settings deny them; if any are present in the session, say so at the start. Never weaken the boundary: the canonical `.gitignore` block, those denies, a committed `.db`, key, `.env` or real data. Asked to, refuse and say why.
- **Enforced, so don't work around a block, hand off:** the private-data home is never touched, and untracked data in a repo is named, never opened (deny rules, `session_guard.py`, the glance). Claude never pushes to main or merges; never `--no-verify` (the guard and `audit_push.sh`).
- **Repos are private** unless the Registry's Repo column says public; making one public is N.'s decision. Sensitive or personal-strategy content is never public. Before anything goes public, scan it for real people's names, the possessive form ("X's …") included. A public repo's push from a cloud session waits for N.'s yes to the file list the audit prints, then goes with the `KAIROS_READ_OK` value it names: a check against carelessness, not a lock. The locks are the mechanisms above.

## 2 · The session
- **Start, in order:** (1) the SessionStart hook runs `kairos-foundation/scripts/session_start.sh` (glance, last work, open work); if its output isn't in context, run it. (2) Merge every repo that is behind, never rebase; on a conflict or a cache version bumped on both sides, resolve it only if the answer is obvious, else stop and tell N. (3) If the GitHub tools are here, `kairos-foundation/scripts/dashboard_write.sh --ticks`. (4) Tell N. what was last done and what is open. The glance's first lines say what this device can't do: pick work that finishes here, or say up front which step needs another device.
- **Fetch before saying whether something is done** or what state a repo is in, mid-session too: cloud sessions push.
- **Hand-off:** on the Chromebook, commit and N. runs `push_all.sh`; in a cloud session, push a `claude/…` branch and open a PR, which N. squash-merges. A PR Claude opens is watched until merged or closed: subscribe right away without asking, fix what is asked, say once when it waits only on N.'s merge.
- **History on GitHub is never rewritten.** To change unpushed commits, rebuild them on their old base and merge (the guard blocks a reset or rebase onto a fetch), then diff every file upstream touched.
- **If N. isn't there for a decision or a yes:** commit on a branch, write the question in the PR or the session, and stop. Never proceed on a yes N. didn't give.
- **End:** after the last backlog change, run `dashboard_write.sh` (the dashboard issue in one step; never edit it by hand). Then give N. one piece of feedback on how they worked with Claude this session: specific, one or two sentences, never praise.

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
- **Test first:** write the failing test from the story's DoD, see it fail, then write the code. The audit refuses code without a passing test (`test_gate.sh`); a change that honestly needs none says why in a `No-test: <reason>` commit line, which N. reads.
- **A story must be tryable on the real surface within one session.** If it's wider, say so before building and split it.
- **At most three projects in focus in a week** (the backlog's focus line). Build work on a parked project: flag it and don't start; N. decides.

## Where the detail lives
- **Charter** (`kairos-foundation/FOUNDATION_CHARTER.md`): the class-by-tier matrix (Part 1), decisions vs. mechanisms (Part 2), public repos and the Whiteboard's one door (Part 7).
- **Backlog** (`kairos-system/BACKLOG.md`): its head for the story format (DoD first, radius, designations); *Buckets* for the bucket rules (Utilities, Public profile).
- **A module:** its row in `kairos-foundation/REGISTRY.md` (tier, data class, repo, egress doors, deploy), written before any code; `kairos-foundation/MODULE_TEMPLATE.md` for its class's skeleton, conventions and deploy (the phone-app pattern included); its own README.
- **What never gets committed:** `kairos-foundation/gitignore_canonical.gitignore`.
