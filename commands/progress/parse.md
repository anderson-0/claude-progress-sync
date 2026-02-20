---
description: Re-parse plan.md and rebuild checkpoint state
---

# Progress Parse Command

Force re-parse of plan.md to rebuild checkpoint state from current checkboxes.

## Task

1. **Find Active Plan**: Get from `$CK_ACTIVE_PLAN` or session state
2. **Read Plan**: Load `plan.md` content
3. **Parse Markers**: Extract all checkpoint markers
4. **Rebuild State**: Create fresh `.checkpoint/state.json`
5. **Report**: Show parsed structure

## When to Use

- After manually editing plan.md checkboxes
- When state.json is out of sync
- To migrate from old memory-bank format
- After adding checkpoint markers to existing plan

## Markers Parsed

| Marker | Purpose |
|--------|---------|
| `<!-- CHECKPOINT: id -->` | Phase boundary |
| `<!-- TASK: id -->` | Task checkbox |
| `<!-- ACCEPT: id -->` | Acceptance criteria |
| `<!-- DECISION: text -->` | Decision record |
| `<!-- BLOCKER: text -->` | Active blocker |

## Output Format

```
[Progress Sync] Parsed: {plan-name}

Structure found:
  Phases: {count}
  Tasks: {count} ({completed} done)
  Acceptance: {count}
  Decisions: {count}
  Blockers: {count}

Progress: {percentage}%

Phases:
  1. {phase-id}: {status} ({x}/{y} tasks)
  2. {phase-id}: {status} ({x}/{y} tasks)

Checkpoint created: .checkpoint/state.json
```

## Instructions

1. Read plan.md completely
2. Find all `<!-- CHECKPOINT: -->` markers → phases
3. Find all `- [x]` and `- [ ]` with `<!-- TASK: -->` → tasks
4. Find all `<!-- ACCEPT: -->` → acceptance criteria
5. Find all `<!-- DECISION: -->` → decisions list
6. Find all `<!-- BLOCKER: -->` → blockers list
7. Build complete state object
8. Write to `.checkpoint/state.json`
9. Create backup in `recovery.json`
10. Append to `history.jsonl`

## Notes

- Existing state will be **overwritten**
- Session notes and agent tracking will be **lost**
- Use `/progress:save` first if you want to preserve context
