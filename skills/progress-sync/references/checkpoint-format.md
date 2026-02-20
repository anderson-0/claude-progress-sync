# Checkpoint Format Reference

## Directory Structure

```
plans/{plan-id}/
├── plan.md                    # Main plan file (SOURCE OF TRUTH)
├── phase-01-*.md              # Optional phase files
├── phase-02-*.md
├── .checkpoint/               # Progress tracking
│   ├── state.json            # Current snapshot
│   ├── history.jsonl         # Activity log (append-only)
│   └── recovery.json         # Backup for crash recovery
└── .memory/                   # Legacy (deprecated)
    └── progress.json
```

## state.json Schema

```typescript
interface CheckpointState {
  // Metadata
  version: 2;
  planId: string;              // e.g., "260220-1149-feature"
  planPath: string;            // Absolute path to plan.md
  lastCheckpoint: string;      // ISO timestamp
  checksum: string;            // SHA256 of plan.md content

  // Progress summary
  progress: {
    totalTasks: number;
    completedTasks: number;
    percentage: number;        // 0-100
  };

  // Phase tracking
  phases: {
    [phaseId: string]: {
      status: "pending" | "in_progress" | "completed";
      startedAt?: string;
      completedAt?: string;
      tasks: {
        [taskId: string]: {
          done: boolean;
          completedAt?: string;
          completedBy?: string;  // "main" | "subagent:{type}" | "team:{id}"
        };
      };
      acceptance: {
        [criteriaId: string]: {
          met: boolean;
          verifiedAt?: string;
        };
      };
    };
  };

  // Current position
  currentPhase: string | null;
  currentTask: string | null;

  // Context
  blockers: string[];
  decisions: Array<{
    time: string;
    decision: string;
    reason?: string;
  }>;
  sessionNotes: string | null;

  // Agent tracking
  agents: {
    [agentId: string]: {
      type: string;
      assignedTasks: string[];
      completedTasks: string[];
      lastActive: string;
    };
  };
}
```

## history.jsonl Format

Each line is a JSON object (append-only log):

```jsonl
{"ts":"2026-02-20T11:49:00Z","event":"checkpoint_created","planId":"260220-1149-feature"}
{"ts":"2026-02-20T11:52:00Z","event":"task_completed","taskId":"db-schema","by":"main"}
{"ts":"2026-02-20T12:05:00Z","event":"subagent_started","agentType":"fullstack","tasks":["auth-middleware"]}
{"ts":"2026-02-20T12:15:00Z","event":"task_completed","taskId":"auth-middleware","by":"subagent:fullstack"}
{"ts":"2026-02-20T12:16:00Z","event":"subagent_stopped","agentType":"fullstack","completed":1}
{"ts":"2026-02-20T12:30:00Z","event":"phase_completed","phaseId":"phase-1-setup"}
{"ts":"2026-02-20T12:31:00Z","event":"session_crash","lastKnownState":"recovery.json"}
{"ts":"2026-02-20T12:45:00Z","event":"session_recovered","from":"recovery.json","tasksRestored":7}
```

## recovery.json

Copy of state.json made every 5 checkpoints or on significant events:

```json
{
  "savedAt": "2026-02-20T12:25:00Z",
  "reason": "pre_subagent_spawn",
  "state": { /* full state.json content */ }
}
```

## Plan File Markers

### Phase Markers

```markdown
## Phase 1: Setup
<!-- CHECKPOINT: phase-1-setup -->
```

Pattern: `<!-- CHECKPOINT: {phase-id} -->`

### Task Markers

```markdown
- [ ] Create database schema <!-- TASK: db-schema -->
- [x] Setup auth middleware <!-- TASK: auth-middleware -->
```

Pattern: `- [x] ... <!-- TASK: {task-id} -->` or `- [ ] ...`

### Acceptance Criteria Markers

```markdown
- [ ] All migrations pass <!-- ACCEPT: migrations -->
- [x] Tests green <!-- ACCEPT: tests -->
```

Pattern: `<!-- ACCEPT: {criteria-id} -->`

### Decision Markers

```markdown
<!-- DECISION: Using async SQLAlchemy 2.0 for better performance -->
```

Pattern: `<!-- DECISION: {decision text} -->`

### Blocker Markers

```markdown
<!-- BLOCKER: Waiting for API key from external team -->
```

Pattern: `<!-- BLOCKER: {blocker text} -->`

## Parsing Algorithm

```javascript
function parseProgressFromPlan(planContent) {
  const phases = {};
  const tasks = {};

  // 1. Find all checkpoint markers
  const phaseMatches = planContent.matchAll(
    /<!-- CHECKPOINT: ([\w-]+) -->/g
  );

  // 2. Find all task checkboxes
  const taskMatches = planContent.matchAll(
    /- \[([ x])\] (.+?) <!-- TASK: ([\w-]+) -->/g
  );

  for (const match of taskMatches) {
    const [, checked, description, taskId] = match;
    tasks[taskId] = {
      done: checked === 'x',
      description: description.trim()
    };
  }

  // 3. Calculate progress
  const total = Object.keys(tasks).length;
  const completed = Object.values(tasks).filter(t => t.done).length;

  return {
    tasks,
    progress: {
      totalTasks: total,
      completedTasks: completed,
      percentage: total > 0 ? (completed / total * 100).toFixed(1) : 0
    }
  };
}
```

## Checksum Verification

Used to detect external changes to plan.md:

```javascript
const crypto = require('crypto');

function computeChecksum(content) {
  return 'sha256:' + crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .slice(0, 16);
}

// On checkpoint load:
if (state.checksum !== computeChecksum(planContent)) {
  // Plan was modified externally, re-parse
  return parseProgressFromPlan(planContent);
}
```

## Event Triggers

| Event | Action |
|-------|--------|
| `SessionStart` | Load state, verify checksum, output resume context |
| `PostToolUse:Edit` on plan.md | Re-parse checkboxes, update state |
| `PostToolUse:Write` on plan.md | Re-parse checkboxes, update state |
| `SubagentStop` | Parse output for completed tasks, verify plan.md |
| `UserPromptSubmit` (every 5th) | Create checkpoint backup |
| `SessionEnd/Compact` | Final checkpoint with session notes |

## Error Handling

### Checksum Mismatch
```
state.checksum !== plan.md checksum
→ Re-parse plan.md (source of truth)
→ Log: {"event":"checksum_mismatch","action":"reparse"}
```

### Parse Failure
```
Plan.md parsing fails
→ Use last known state.json
→ Log: {"event":"parse_error","fallback":"state.json"}
```

### State Corruption
```
state.json invalid JSON
→ Restore from recovery.json
→ Log: {"event":"state_corrupted","restored_from":"recovery.json"}
```

### Recovery Failure
```
Both state.json and recovery.json corrupted
→ Re-parse plan.md from scratch
→ Log: {"event":"full_recovery","source":"plan.md_reparse"}
```
