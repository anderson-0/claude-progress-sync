---
description: Recover from crash using backup state
---

# Progress Recover Command

Restore progress state from backup after crash or corruption.

## Task

1. **Find Active Plan**: Get from `$CK_ACTIVE_PLAN` or session state
2. **Check State Health**: Verify `.checkpoint/state.json` is valid
3. **If Corrupted**: Restore from `recovery.json`
4. **If Both Corrupted**: Rebuild from `plan.md`
5. **Report Recovery**: Show what was restored

## Recovery Priority

1. `state.json` - Primary state (check for corruption)
2. `recovery.json` - Backup state (use if primary corrupted)
3. `plan.md` - Source of truth (rebuild if all else fails)

## Output Format

### If state.json valid:
```
[Progress Sync] State healthy
  Last checkpoint: {relative-time}
  Progress: {percentage}%
  No recovery needed.
```

### If recovered from backup:
```
[Progress Sync] Recovered from recovery.json
  Backup created: {backup-time}
  Restored progress: {percentage}%
  Tasks restored: {count}

  Warning: Some recent progress may be lost.
  Last known state from {time-ago}.
```

### If rebuilt from plan:
```
[Progress Sync] Rebuilt from plan.md
  All checkboxes parsed
  Progress: {percentage}% ({completed}/{total})

  Note: Session context (notes, decisions) lost.
  Checkpoint created from current plan state.
```

## Instructions

1. Try to read `.checkpoint/state.json`
2. If valid JSON with required fields → report healthy
3. If invalid → try `recovery.json`
4. If recovery valid → restore to state.json
5. If recovery invalid → parse plan.md
6. Rebuild state from checkbox markers
7. Write new state.json
8. Report what was recovered

## State Validation

Check these fields exist and are valid:
- `version` - Must be 2
- `planId` - Non-empty string
- `progress` - Object with totalTasks, completedTasks
- `lastCheckpoint` - Valid ISO timestamp

If any missing/invalid → state is corrupted.
