# Progress Sync Quick Start

## TL;DR

Add these markers to your plan.md to enable crash-resistant progress tracking:

```markdown
## Phase 1: Setup
<!-- CHECKPOINT: phase-1-setup -->

- [ ] Create database schema <!-- TASK: db-schema -->
- [x] Setup auth middleware <!-- TASK: auth-middleware -->
```

Progress syncs automatically. View with `/progress:status`.

## 5-Minute Setup

### 1. Add Markers to Your Plan

Before:
```markdown
## Tasks
- [ ] Create database schema
- [ ] Setup auth middleware
```

After:
```markdown
## Phase 1: Setup
<!-- CHECKPOINT: phase-1 -->

### Tasks
- [ ] Create database schema <!-- TASK: db-schema -->
- [ ] Setup auth middleware <!-- TASK: auth-middleware -->
```

### 2. Work Normally

Just work on your plan. When you check off tasks (`- [x]`), progress syncs automatically.

### 3. Resume After Crash

When you restart after IDE crash:
```
[Progress Sync] Resuming: 260220-1149-feature
━━━━━━━━━━━━━━━━━━━━ 47% (7/15 tasks)

Phase 1: Setup ✓ COMPLETE
Phase 2: Core ◐ IN PROGRESS
  [ ] user-endpoints ← CURRENT

Next: user-endpoints
```

## Commands

| Command | Purpose |
|---------|---------|
| `/progress:status` | View current progress |
| `/progress:save [notes]` | Force checkpoint with notes |
| `/progress:recover` | Restore from backup |
| `/progress:parse` | Rebuild from plan.md |

## Marker Types

| Marker | Example | Purpose |
|--------|---------|---------|
| CHECKPOINT | `<!-- CHECKPOINT: phase-1 -->` | Mark phase boundaries |
| TASK | `<!-- TASK: db-schema -->` | Track individual tasks |
| ACCEPT | `<!-- ACCEPT: tests-pass -->` | Acceptance criteria |
| DECISION | `<!-- DECISION: Using PostgreSQL -->` | Record decisions |
| BLOCKER | `<!-- BLOCKER: Waiting for API key -->` | Track blockers |

## Subagent Coordination

When spawning subagents, include:

```markdown
[CHECKPOINT CONTEXT]
Plan: /path/to/plan.md
Tasks to complete:
- [ ] auth-middleware <!-- TASK: auth-middleware -->

On completion, update checkboxes in plan.md.
```

## Files Created

```
plans/260220-1149-feature/
├── plan.md                    # Your plan (SOURCE OF TRUTH)
└── .checkpoint/
    ├── state.json            # Current progress
    ├── history.jsonl         # Activity log
    └── recovery.json         # Crash backup
```

## Disable Progress Sync

In `.claude/.ck.json`:
```json
{
  "hooks": {
    "progress-sync": false
  }
}
```
