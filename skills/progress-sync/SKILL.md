---
name: progress-sync
description: Auto-sync plan checkboxes across agents and sessions. Crash-resilient progress tracking that survives IDE crashes and terminal closes. Use when working on plans, after completing tasks, or resuming work.
version: 2.0.0
triggers:
  - "**/plans/**/*.md"
  - "**/plan.md"
  - "**/phase-*.md"
---

# Progress Sync - Crash-Resilient Progress Tracking

Never lose progress again. This skill ensures plan checkboxes are always updated when work completes, whether by main agent, subagents, or teams.

## Core Principle

**Checkboxes in plan files ARE the source of truth.** Memory bank augments but doesn't replace.

## How It Works

### 1. Checkpoint Markers (Required in Plans)

Plans must use checkpoint markers for reliable parsing:

```markdown
## Phase 1: Setup
<!-- CHECKPOINT: phase-1-setup -->

### Tasks
- [ ] Create database schema <!-- TASK: db-schema -->
- [ ] Setup auth middleware <!-- TASK: auth-middleware -->
- [x] Configure environment <!-- TASK: env-config -->

### Acceptance Criteria
- [ ] All migrations pass <!-- ACCEPT: migrations -->
- [ ] Tests green <!-- ACCEPT: tests -->
```

### 2. Auto-Sync Triggers

Progress syncs automatically on:
- `PostToolUse`: Edit/Write on plan files → parse checkboxes → update memory
- `SubagentStop`: Any agent completes → update parent plan checkboxes
- `SessionStart`: Load checkpoint, show what's done/pending
- `UserPromptSubmit`: After 5+ tool calls → checkpoint

### 3. Checkpoint File Structure

```
plans/260220-1149-feature/
├── plan.md                    # Source of truth (checkboxes here)
├── .checkpoint/
│   ├── state.json            # Current progress snapshot
│   ├── history.jsonl         # Append-only activity log
│   └── recovery.json         # Last known good state
└── phase-01-*.md             # Phase files (also tracked)
```

### 4. state.json Schema

```json
{
  "version": 2,
  "planId": "260220-1149-feature",
  "lastCheckpoint": "2026-02-20T11:49:00Z",
  "checksum": "sha256:abc123",
  "progress": {
    "totalTasks": 15,
    "completedTasks": 7,
    "percentage": 46.7
  },
  "phases": {
    "phase-1-setup": {
      "status": "completed",
      "tasks": {
        "db-schema": { "done": true, "completedAt": "...", "completedBy": "main" },
        "auth-middleware": { "done": true, "completedAt": "...", "completedBy": "subagent:fullstack" },
        "env-config": { "done": true, "completedAt": "...", "completedBy": "main" }
      }
    },
    "phase-2-core": {
      "status": "in_progress",
      "tasks": {...}
    }
  },
  "currentPhase": "phase-2-core",
  "currentTask": "user-endpoints",
  "blockers": [],
  "decisions": [
    { "time": "...", "decision": "Using async SQLAlchemy 2.0", "reason": "Better performance" }
  ],
  "sessionNotes": "API structure complete, working on user management"
}
```

## Commands

### Manual Checkpoint
```
/progress:save [notes]
```
Force checkpoint with optional notes.

### View Progress
```
/progress:status
```
Show current progress with visual indicators:
```
[Progress Sync] Plan: 260220-1149-feature
━━━━━━━━━━━━━━━━━━━━ 47% (7/15 tasks)

Phase 1: Setup ✓ COMPLETE
  [x] db-schema (main, 2h ago)
  [x] auth-middleware (fullstack-agent, 1h ago)
  [x] env-config (main, 3h ago)

Phase 2: Core API ◐ IN PROGRESS
  [x] health-endpoint (main, 30m ago)
  [ ] user-endpoints ← CURRENT
  [ ] role-permissions
  [ ] api-validation

Next: user-endpoints
Notes: "API structure complete, working on user management"
```

### Recover from Crash
```
/progress:recover
```
Restore from last known good state if plan.md is corrupted.

### Sync from Plan (Re-parse)
```
/progress:parse
```
Re-read plan.md and rebuild checkpoint state from checkboxes.

## Subagent Protocol

When spawning subagents, include checkpoint context:

```
Task: "Implement user authentication"

[CHECKPOINT CONTEXT]
Plan: /path/to/plans/260220-1149-feature/plan.md
Phase: phase-2-core
Tasks to complete:
- [ ] auth-middleware <!-- TASK: auth-middleware -->
- [ ] session-handling <!-- TASK: session-handling -->

On completion, update checkboxes in plan.md directly.
Mark: `- [x] task name <!-- TASK: id -->`
```

### Subagent Completion Hook

Subagents MUST update plan.md checkboxes before returning:

```javascript
// In subagent final report:
"I have completed the following tasks and updated plan.md:
- [x] auth-middleware
- [x] session-handling"
```

The `progress-sync-hook.cjs` will:
1. Detect SubagentStop event
2. Parse subagent output for completed tasks
3. Update state.json checkpoint
4. Verify plan.md checkboxes match

## Integration with Existing Memory Bank

Progress Sync REPLACES the old memory-bank skill for plan tracking:

| Old (memory-bank) | New (progress-sync) |
|-------------------|---------------------|
| `.memory/progress.json` | `.checkpoint/state.json` |
| Manual save via command | Auto-save on triggers |
| No checkbox sync | Checkbox sync core feature |
| History in same file | Append-only history.jsonl |
| No crash recovery | recovery.json backup |

## Best Practices

### For Plan Authors

1. **Use checkpoint markers** - Add `<!-- CHECKPOINT: id -->` to phases
2. **Use task markers** - Add `<!-- TASK: id -->` to checkboxes
3. **Keep tasks atomic** - One checkbox = one deliverable
4. **Group by phase** - Phases have clear boundaries

### For Main Agent

1. **Check progress first** - Run `/progress:status` when resuming
2. **Include checkpoint context** in subagent prompts
3. **Verify after subagents** - Check checkboxes were updated
4. **Save notes before stopping** - `/progress:save "stopped at user validation"`

### For Subagents

1. **Update plan.md directly** when completing tasks
2. **Report what was completed** in final message
3. **Don't modify unassigned tasks** - Only check off YOUR work

## Crash Recovery Flow

When session starts after crash:

1. Hook reads `.checkpoint/state.json`
2. Compares with `plan.md` checkboxes
3. If mismatch → parse plan.md as source of truth
4. If plan.md corrupted → restore from `recovery.json`
5. Output resume context to Claude

```
[Progress Sync] Recovered from crash
  Last checkpoint: 15m ago
  Recovered state: 7/15 tasks complete
  Current phase: phase-2-core
  Resume from: user-endpoints
```

## Limitations

- Requires checkpoint markers for reliable tracking
- Large plans (100+ tasks) may slow parsing
- Nested subagents (3+ levels) may miss updates
- Team agents need explicit coordination

## Migration from memory-bank

Existing `.memory/` folders continue working. To migrate:

1. Add checkpoint markers to existing plans
2. Run `/progress:parse` to initialize `.checkpoint/`
3. Old memory-bank hooks will be deprecated

## Files

- `SKILL.md` - This documentation
- `references/checkpoint-format.md` - Detailed schema docs
- `references/subagent-protocol.md` - Multi-agent coordination
