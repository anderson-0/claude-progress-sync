# [Feature Name] Implementation Plan

**Date**: YYYY-MM-DD
**Type**: Feature Implementation
**Status**: Planning
**Context Tokens**: <200 words

## Executive Summary
Brief 2-3 sentence description of the feature and its business value.

## Context Links
- **Related Plans**: [List other plan files - no full content]
- **Dependencies**: [External systems, APIs, existing features]
- **Reference Docs**: [Link to docs in ./docs directory]

## Requirements
<!-- CHECKPOINT: requirements -->

### Functional Requirements
- [ ] Requirement 1 <!-- TASK: req-func-1 -->
- [ ] Requirement 2 <!-- TASK: req-func-2 -->

### Non-Functional Requirements
- [ ] Performance target <!-- TASK: req-perf -->
- [ ] Security requirement <!-- TASK: req-security -->
- [ ] Scalability requirement <!-- TASK: req-scale -->

## Architecture Overview
```mermaid
[Simple component diagram]
```

### Key Components
- **Component 1**: Brief description
- **Component 2**: Brief description

### Data Models
- **Model 1**: Key fields
- **Model 2**: Key fields

## Implementation Phases

### Phase 1: [Name]
<!-- CHECKPOINT: phase-1-name -->

**Scope**: Specific boundaries

**Tasks**:
- [ ] Task 1 - file: `path/to/file.ts` <!-- TASK: p1-task-1 -->
- [ ] Task 2 - file: `path/to/file.ts` <!-- TASK: p1-task-2 -->

**Acceptance Criteria**:
- [ ] Criteria 1 <!-- ACCEPT: p1-accept-1 -->
- [ ] Criteria 2 <!-- ACCEPT: p1-accept-2 -->

### Phase 2: [Name]
<!-- CHECKPOINT: phase-2-name -->

**Scope**: Specific boundaries

**Tasks**:
- [ ] Task 1 - file: `path/to/file.ts` <!-- TASK: p2-task-1 -->
- [ ] Task 2 - file: `path/to/file.ts` <!-- TASK: p2-task-2 -->

**Acceptance Criteria**:
- [ ] Criteria 1 <!-- ACCEPT: p2-accept-1 -->
- [ ] Criteria 2 <!-- ACCEPT: p2-accept-2 -->

## Testing Strategy
<!-- CHECKPOINT: testing -->

- [ ] Unit tests pass with >80% coverage <!-- TASK: test-unit -->
- [ ] Integration tests pass <!-- TASK: test-integration -->
- [ ] E2E tests for critical flows <!-- TASK: test-e2e -->

## Security Considerations
- [ ] Security item 1 <!-- TASK: security-1 -->
- [ ] Security item 2 <!-- TASK: security-2 -->

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Risk 1 | High | Mitigation strategy |

## Quick Reference
### Key Commands
```bash
npm run command
```

### Configuration Files
- `config/file.ts`: Purpose
- `.env.example`: Environment variables

## Final Checklist
<!-- CHECKPOINT: finalization -->

- [ ] All implementation complete <!-- TASK: final-impl -->
- [ ] All tests passing <!-- TASK: final-tests -->
- [ ] Documentation updated <!-- TASK: final-docs -->
- [ ] Code review passed <!-- TASK: final-review -->
- [ ] Ready for merge <!-- TASK: final-merge -->

---

<!--
Progress Sync Markers Guide:
- CHECKPOINT: phase-id  → Marks phase boundaries
- TASK: task-id        → Marks trackable tasks
- ACCEPT: criteria-id  → Marks acceptance criteria
- DECISION: text       → Records key decisions
- BLOCKER: text        → Marks active blockers

Example:
<!-- DECISION: Using PostgreSQL for better JSON support -->
<!-- BLOCKER: Waiting for API key from external team -->
-->
