# CLAUDE.md — Claude Code's way into the Kairos rules

The rules for every agent are in `AGENTS.md`, beside this file, imported here so Claude Code loads them. This is a verbatim copy of `kairos-foundation/CLAUDE.md`; edit the masters and merge them, and a workflow on GitHub writes every copy (`sync_copies_push.sh`); never edit a copy.

@AGENTS.md

## Claude Code only
- Your row in the Actors table: Claude Code, the Consumer tier, every Kairos repo.
- Your SessionStart hook runs the glance; `session_guard.py` and the deny rules in your settings are a second layer (Charter Part 2: enforcement below the agent). The first layer is the operating system, git, GitHub and each module's `agent_guard.py`.
- End commit messages with your model's `Co-Authored-By:` trailer, as the session's attribution reminder gives it.
- Before a step goes to N., in chat or in the backlog, run the `step-check` skill: a fresh subagent tries to take each line off N., and N. gets only what is left (N., 2026-11-20).
- Before a hand-off (a pull request, `push_all.sh`, `outbox.sh`), run the `charter-check` skill on the whole change: a fresh subagent reads the diff against the Charter, and its one-line verdict goes first in what N. reads.
