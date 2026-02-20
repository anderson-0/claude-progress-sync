---
description: Force checkpoint with optional session notes
arguments:
  - name: notes
    description: Optional session notes to save
---

# Progress Save Command

Create a checkpoint and save current progress with optional notes.

## Task

1. **Find Active Plan**: Get from `$CK_ACTIVE_PLAN` or session state
2. **Parse Plan**: Read `plan.md` and extract current task states
3. **Build Checkpoint**: Create/update `.checkpoint/state.json`
4. **Add Notes**: Include user-provided notes in `sessionNotes` field
5. **Create Backup**: Copy to `recovery.json` for crash protection

## Input

$ARGUMENTS

## Checkpoint Data to Capture

From conversation context, identify:
- **currentPhase**: Which phase is being worked on
- **currentTask**: Specific task in progress
- **completedItems**: Tasks finished in this session
- **pendingItems**: Tasks remaining
- **blockers**: Any blockers encountered
- **decisions**: Key decisions made (add to existing)
- **sessionNotes**: User's notes or auto-summary

## Output Format

```
[Progress Sync] Checkpoint saved: {plan-name}
  Progress: {percentage}% ({completed}/{total})
  Phase: {current-phase}
  Current: {current-task}
  Notes: "{session-notes}"
  Backup: recovery.json updated
```

## Instructions

1. Read existing `.checkpoint/state.json` if exists
2. Parse `plan.md` for current checkbox states
3. Merge with existing state (preserve history, decisions)
4. Update `lastCheckpoint` timestamp
5. Compute new checksum
6. Write state atomically
7. Append to `history.jsonl`
8. Copy to `recovery.json`

If user provided notes, store in `sessionNotes`. If not, generate brief summary from recent activity.

## Error Handling

- If no active plan: Prompt user to set one
- If plan.md missing: Error with helpful message
- If write fails: Retry once, then report failure
