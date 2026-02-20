---
description: View current plan progress with visual indicators
---

# Progress Status Command

Show current progress state with visual progress bar and task breakdown.

## Task

1. **Find Active Plan**: Check `$CK_ACTIVE_PLAN` or resolve from session state
2. **Read Checkpoint**: Load `.checkpoint/state.json` from plan directory
3. **If No Checkpoint**: Parse `plan.md` for tasks with `<!-- TASK: id -->` markers
4. **Display Progress**: Show formatted output

## Output Format

```
[Progress Sync] Plan: {plan-name}
━━━━━━━━━━━━━━━━━━━━ {percentage}% ({completed}/{total} tasks)

Phase 1: Setup ✓ COMPLETE
  [x] task-1 (main, 2h ago)
  [x] task-2 (fullstack-agent, 1h ago)

Phase 2: Core ◐ IN PROGRESS
  [x] task-3 (main, 30m ago)
  [ ] task-4 ← CURRENT
  [ ] task-5

Next: task-4
Notes: "{session-notes}"
Last checkpoint: {relative-time}
```

## Status Icons

- `✓` - Phase complete
- `◐` - Phase in progress
- `○` - Phase pending
- `→` - Current task
- `!` - Blocker

## Instructions

1. Read `.checkpoint/state.json` from active plan directory
2. If not found, read `plan.md` and parse tasks
3. Generate progress bar: `━` for complete, `─` for remaining
4. Show phase breakdown with task status
5. Highlight current task with `→` marker
6. Show blockers if any

If no active plan, output:
```
[Progress Sync] No active plan
Set with: node .claude/hooks/set-active-plan.cjs <plan-path>
Or work on a plan file to auto-detect.
```
