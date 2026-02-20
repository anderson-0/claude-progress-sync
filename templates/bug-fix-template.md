# [Bug Fix] Implementation Plan

**Date**: YYYY-MM-DD
**Type**: Bug Fix
**Priority**: [Critical/High/Medium/Low]
**Context Tokens**: <150 words

## Executive Summary
Brief description of the bug and its impact.

## Issue Analysis
<!-- CHECKPOINT: analysis -->

### Symptoms
- [ ] Symptom 1 identified <!-- TASK: symptom-1 -->
- [ ] Symptom 2 identified <!-- TASK: symptom-2 -->

### Root Cause
Brief explanation of the underlying cause.

### Evidence
- **Logs**: Reference to log files (don't include full logs)
- **Error Messages**: Key error patterns
- **Affected Components**: List of impacted files/modules

## Context Links
- **Related Issues**: [GitHub issue numbers]
- **Recent Changes**: [Relevant commits or PRs]
- **Dependencies**: [Related systems]

## Solution Design
<!-- CHECKPOINT: solution -->

### Approach
High-level fix strategy in 2-3 sentences.

<!-- DECISION: [Record key decision about fix approach here] -->

### Changes Required
1. **File 1** (`path/to/file.ts`): Brief change description
2. **File 2** (`path/to/file.ts`): Brief change description

## Implementation Steps
<!-- CHECKPOINT: implementation -->

- [ ] Step 1 - file: `path/to/file.ts` <!-- TASK: impl-1 -->
- [ ] Step 2 - file: `path/to/file.ts` <!-- TASK: impl-2 -->
- [ ] Run test suite <!-- TASK: impl-tests -->
- [ ] Validate fix in relevant environments <!-- TASK: impl-validate -->

## Verification Plan
<!-- CHECKPOINT: verification -->

### Test Cases
- [ ] Test case 1: Expected behavior <!-- TASK: test-1 -->
- [ ] Test case 2: Edge case handling <!-- TASK: test-2 -->
- [ ] Regression test: No new issues <!-- TASK: test-regression -->

### Rollback Plan
If the fix causes issues:
1. Revert commit: `git revert <commit-hash>`
2. Restore previous behavior in files X, Y, Z

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Risk 1 | Medium | Mitigation plan |

## Final Checklist
<!-- CHECKPOINT: finalization -->

- [ ] Fix implemented <!-- TASK: final-impl -->
- [ ] Tests updated <!-- TASK: final-tests -->
- [ ] Full test suite passes <!-- TASK: final-suite -->
- [ ] Code review passed <!-- TASK: final-review -->
- [ ] Deployed and verified <!-- TASK: final-deploy -->

---

<!--
Progress Sync Markers Guide:
- CHECKPOINT: phase-id  → Marks phase boundaries
- TASK: task-id        → Marks trackable tasks
- DECISION: text       → Records key decisions
- BLOCKER: text        → Marks active blockers
-->
