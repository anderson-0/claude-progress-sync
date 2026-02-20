# Subagent Progress Protocol

How to coordinate progress tracking across multiple agents.

## The Problem

When main agent spawns subagents:
1. Subagent completes tasks
2. Subagent returns final report
3. **Gap**: Plan.md checkboxes not updated
4. Main agent doesn't know what's done
5. IDE crashes → all progress lost

## The Solution

### 1. Include Checkpoint Context in Spawn

When spawning a subagent, ALWAYS include:

```markdown
[CHECKPOINT CONTEXT]
Plan: /absolute/path/to/plans/260220-1149-feature/plan.md
Phase: phase-2-core
Assigned Tasks:
- [ ] auth-middleware <!-- TASK: auth-middleware -->
- [ ] session-handling <!-- TASK: session-handling -->

IMPORTANT: On completion, update the plan.md file directly:
1. Change `- [ ]` to `- [x]` for completed tasks
2. List completed tasks in your final report
```

### 2. Subagent Completion Protocol

Subagent MUST do these before returning:

```javascript
// 1. Update plan.md checkboxes
await editFile(planPath, {
  old: '- [ ] auth-middleware <!-- TASK: auth-middleware -->',
  new: '- [x] auth-middleware <!-- TASK: auth-middleware -->'
});

// 2. Report completions in final message
return `
## Completion Report

### Tasks Completed
- [x] auth-middleware - Implemented JWT authentication
- [x] session-handling - Added Redis session store

### Files Modified
- src/middleware/auth.ts (created)
- src/services/session.ts (created)
- tests/auth.test.ts (created)

### Notes
Used asymmetric JWT for better security.
`;
```

### 3. Main Agent Verification

After subagent returns, main agent should:

```markdown
1. Parse subagent's completion report
2. Read plan.md to verify checkboxes updated
3. If mismatch → update plan.md manually
4. Run `/progress:status` to confirm
```

## Template: Subagent Spawn Prompt

```markdown
# Task: [Specific task description]

## Context
Working on plan: {plan-name}
Phase: {current-phase}
Branch: {git-branch}

## Checkpoint Context
Plan file: {absolute-path-to-plan.md}
Assigned tasks:
{list of tasks with TASK markers}

## Instructions
1. Complete the assigned tasks
2. Update plan.md checkboxes when done (change [ ] to [x])
3. Report all completed tasks in your final message

## Files to Modify
- {list of expected files}

## Success Criteria
- All assigned tasks marked [x] in plan.md
- Tests passing
- Code reviewed

## On Completion
Update these checkboxes in plan.md:
```
- [ ] task-1 <!-- TASK: task-1 -->
- [ ] task-2 <!-- TASK: task-2 -->
```
Change to:
```
- [x] task-1 <!-- TASK: task-1 -->
- [x] task-2 <!-- TASK: task-2 -->
```
```

## Agent Types & Responsibilities

### fullstack-developer
- Updates plan.md for implementation tasks
- Creates completion report with file list

### tester
- Updates plan.md for test tasks
- Reports test coverage metrics

### code-reviewer
- Does NOT update plan.md (review is advisory)
- Reports issues to main agent

### debugger
- Updates plan.md only for fix tasks
- Reports root cause analysis

### planner
- Creates/updates plan.md structure
- Adds checkpoint markers to new plans

## Team Agent Protocol

When using agent teams (`/team`):

### Team Lead Responsibilities
1. Share plan.md path with all teammates
2. Assign non-overlapping tasks
3. Monitor progress via `/progress:status`
4. Resolve conflicts if multiple agents edit same file

### Teammate Responsibilities
1. Update plan.md for assigned tasks only
2. Use Edit tool (not Write) to avoid conflicts
3. Announce completions in team chat
4. Wait for acknowledgment before moving on

### Conflict Resolution

If two agents try to update same checkbox:

```javascript
// Use atomic edit with old_string match
{
  tool: "Edit",
  file_path: planPath,
  old_string: "- [ ] shared-task <!-- TASK: shared-task -->",
  new_string: "- [x] shared-task <!-- TASK: shared-task -->"
}
// If old_string doesn't match, task already completed
```

## Progress Hook Integration

### SubagentStop Hook

```javascript
// .claude/hooks/progress-sync-subagent.cjs
// Triggered when any subagent completes

const data = JSON.parse(stdin);

// 1. Parse final message for completed tasks
const completedTasks = parseCompletions(data.final_message);

// 2. Verify plan.md was updated
const planContent = fs.readFileSync(planPath, 'utf8');
const planTasks = parseTasksFromPlan(planContent);

// 3. Check for mismatches
const mismatches = completedTasks.filter(
  t => !planTasks[t].done
);

if (mismatches.length > 0) {
  console.warn(`[Progress Sync] Tasks reported but not checked:
    ${mismatches.join(', ')}
    Updating plan.md...`);
  // Auto-fix the checkboxes
}

// 4. Update checkpoint state
updateCheckpoint(planPath, completedTasks, data.agent_type);
```

## Crash Recovery for Multi-Agent

When session crashes during subagent work:

1. **On Resume**: Hook reads checkpoint state
2. **Check Agent Status**: Were subagents running?
3. **Verify Plan State**: Parse plan.md checkboxes
4. **Report**: Show what was in-flight

```
[Progress Sync] Recovered from crash during subagent work
  Active agents at crash:
    - fullstack-developer: auth-middleware (in progress)
    - tester: unit-tests (in progress)

  Verified state from plan.md:
    - auth-middleware: [ ] NOT COMPLETE (was in-flight)
    - unit-tests: [x] COMPLETE (saved before crash)

  Resume: auth-middleware needs to be restarted
```

## Best Practices

### DO
- Include full checkpoint context in subagent prompts
- Use TASK markers for all trackable work
- Verify checkboxes after subagent returns
- Use atomic edits to prevent race conditions

### DON'T
- Assume subagent updated plan.md
- Spawn multiple agents on overlapping tasks
- Skip checkpoint verification after crashes
- Modify checkboxes for tasks you didn't complete

## Debugging Progress Issues

### Task shows done but wasn't completed
```bash
# Check history
cat plans/{plan}/.checkpoint/history.jsonl | grep {task-id}

# Manual fix
# 1. Edit plan.md to uncheck
# 2. Run /progress:parse to rebuild state
```

### Checkpoint out of sync
```bash
# Force re-parse from plan.md
/progress:parse

# Or manually rebuild
rm plans/{plan}/.checkpoint/state.json
# Next session will re-parse
```

### Agent reported completion but checkbox not updated
```
Main agent: "Subagent reported auth-middleware complete but plan.md shows [ ]"

Fix:
1. Edit plan.md manually: - [ ] → - [x]
2. Run /progress:save "fixed missing checkbox"
3. Verify with /progress:status
```
