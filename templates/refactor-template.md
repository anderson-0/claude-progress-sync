# [Component/Module] Refactoring Plan

**Date**: YYYY-MM-DD
**Type**: Refactoring
**Scope**: [Module/Component/System level]
**Context Tokens**: <200 words

## Executive Summary
Brief description of what is being refactored and why.

## Current State Analysis
<!-- CHECKPOINT: analysis -->

### Issues with Current Implementation
- [ ] Issue 1: Performance bottleneck <!-- TASK: issue-1 -->
- [ ] Issue 2: Code maintainability <!-- TASK: issue-2 -->
- [ ] Issue 3: Technical debt <!-- TASK: issue-3 -->

### Metrics (Before)
- **Performance**: Current benchmarks
- **Code Quality**: Complexity metrics
- **Test Coverage**: Current percentage

## Context Links
- **Affected Modules**: [List without full content]
- **Dependencies**: [Other systems impacted]
- **Related Documentation**: [Links to docs]

## Refactoring Strategy
### Approach
High-level strategy for the refactoring in 2-3 sentences.

<!-- DECISION: [Record key architectural decision here] -->

### Architecture Changes
```mermaid
[Before/After comparison diagram]
```

### Key Improvements
- **Improvement 1**: Brief description
- **Improvement 2**: Brief description

## Implementation Plan

### Phase 1: Preparation
<!-- CHECKPOINT: phase-1-preparation -->

**Scope**: Setup and preparation work
- [ ] Create comprehensive tests for current functionality <!-- TASK: p1-tests -->
- [ ] Document current behavior <!-- TASK: p1-docs -->
- [ ] Identify all dependencies <!-- TASK: p1-deps -->

**Acceptance Criteria**:
- [ ] Test coverage >80% for affected code <!-- ACCEPT: p1-coverage -->
- [ ] All dependencies mapped <!-- ACCEPT: p1-deps-mapped -->

### Phase 2: Core Refactoring
<!-- CHECKPOINT: phase-2-refactoring -->

**Scope**: Main refactoring work
- [ ] Refactor component A - file: `path/to/file.ts` <!-- TASK: p2-component-a -->
- [ ] Refactor component B - file: `path/to/file.ts` <!-- TASK: p2-component-b -->
- [ ] Update integration points <!-- TASK: p2-integration -->

**Acceptance Criteria**:
- [ ] All tests still pass <!-- ACCEPT: p2-tests-pass -->
- [ ] No performance regression <!-- ACCEPT: p2-perf -->

### Phase 3: Integration & Testing
<!-- CHECKPOINT: phase-3-integration -->

**Scope**: Validation and cleanup
- [ ] Integration testing <!-- TASK: p3-integration -->
- [ ] Performance validation <!-- TASK: p3-performance -->
- [ ] Documentation updates <!-- TASK: p3-docs -->

**Acceptance Criteria**:
- [ ] All integration tests pass <!-- ACCEPT: p3-int-tests -->
- [ ] Performance meets targets <!-- ACCEPT: p3-perf-target -->

## Backward Compatibility
- **Breaking Changes**: [List any breaking changes]
- **Migration Path**: [Steps for users/systems]
- **Deprecation Timeline**: [If applicable]

## Success Metrics (After)
- **Performance**: Target improvements
- **Code Quality**: Target metrics
- **Test Coverage**: Target percentage

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes | High | Comprehensive testing |
| Performance regression | Medium | Benchmarking |

## Final Checklist
<!-- CHECKPOINT: finalization -->

- [ ] Phase 1: Preparation complete <!-- TASK: final-p1 -->
- [ ] Phase 2: Core refactoring complete <!-- TASK: final-p2 -->
- [ ] Phase 3: Integration complete <!-- TASK: final-p3 -->
- [ ] Performance benchmarks validated <!-- TASK: final-perf -->
- [ ] Documentation updated <!-- TASK: final-docs -->
- [ ] Code review passed <!-- TASK: final-review -->

---

<!--
Progress Sync Markers Guide:
- CHECKPOINT: phase-id  → Marks phase boundaries
- TASK: task-id        → Marks trackable tasks
- ACCEPT: criteria-id  → Marks acceptance criteria
- DECISION: text       → Records key decisions
- BLOCKER: text        → Marks active blockers
-->
