# Progress Sync Plugin

Crash-resilient progress tracking for Claude Code plans. Never lose progress again.

## Features

- **Auto-checkpoint**: Progress syncs automatically when you edit plan files
- **Crash recovery**: Survives IDE crashes, terminal closes, and session resets
- **Multi-agent coordination**: Subagents update checkboxes in the same plan
- **Visual progress**: See progress bars and phase breakdown on resume
- **Source of truth**: Plan.md checkboxes ARE the source of truth

## Installation

### Step 1: Add the Marketplace

In Claude Code:
```
/plugin marketplace add anderson-0/claude-progress-sync
```

### Step 2: Install the Plugin

Choose your installation scope:

**Global (all projects):**
```
/plugin install progress-sync@anderson-0
```

**Project scope (shared with team via git):**
```bash
# From terminal:
claude plugin install progress-sync@anderson-0 --scope project
```

**Local scope (just you, this repo only):**
```bash
# From terminal:
claude plugin install progress-sync@anderson-0 --scope local
```

### Installation Scopes Explained

| Scope | Location | Shared With |
|-------|----------|-------------|
| `user` (default) | `~/.claude/` | All your projects |
| `project` | `.claude/settings.json` | Team via git |
| `local` | `.claude/settings.local.json` | Just you, this repo |

### Alternative: Development Mode (Single Session)

```bash
git clone https://github.com/anderson-0/claude-progress-sync.git
claude --plugin-dir ./claude-progress-sync
```

### Uninstall

```
/plugin remove progress-sync@anderson-0
```

## Quick Start

### 1. Add markers to your plan.md

```markdown
## Phase 1: Setup
<!-- CHECKPOINT: phase-1-setup -->

### Tasks
- [ ] Create database schema <!-- TASK: db-schema -->
- [ ] Setup auth middleware <!-- TASK: auth-middleware -->
```

### 2. Work normally

Check off tasks as you complete them. Progress syncs automatically.

### 3. Resume after crash

When you restart:
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
| `CHECKPOINT` | `<!-- CHECKPOINT: phase-1 -->` | Mark phase boundaries |
| `TASK` | `<!-- TASK: db-schema -->` | Track individual tasks |
| `ACCEPT` | `<!-- ACCEPT: tests-pass -->` | Acceptance criteria |
| `DECISION` | `<!-- DECISION: Using PostgreSQL -->` | Record decisions |
| `BLOCKER` | `<!-- BLOCKER: Waiting for API key -->` | Track blockers |

## Files Created

```
plans/260220-1149-feature/
├── plan.md                    # Your plan (SOURCE OF TRUTH)
└── .checkpoint/
    ├── state.json            # Current progress
    ├── history.jsonl         # Activity log
    └── recovery.json         # Crash backup
```

## Multi-Agent Coordination

When spawning subagents, include checkpoint context:

```markdown
[CHECKPOINT CONTEXT]
Plan: /path/to/plan.md
Tasks to complete:
- [ ] auth-middleware <!-- TASK: auth-middleware -->

On completion, update checkboxes in plan.md directly.
```

Subagents should:
1. Update plan.md checkboxes when completing tasks
2. Report completed tasks in their final message

## Templates

The plugin includes plan templates with checkpoint markers:

- `templates/feature-implementation-template.md`
- `templates/bug-fix-template.md`
- `templates/refactor-template.md`

Copy to your `plans/templates/` directory to use.

## Configuration

### Disable the plugin

Set environment variable:
```bash
export PROGRESS_SYNC_DISABLED=1
```

Or remove from plugins directory.

## Plugin Structure

```
progress-sync/
├── .claude-plugin/
│   └── plugin.json           # Plugin metadata
├── hooks/
│   ├── hooks.json            # Hook configuration
│   ├── progress-sync-load.cjs
│   ├── progress-sync-checkpoint.cjs
│   └── lib/
│       └── utils.cjs         # Shared utilities
├── commands/
│   └── progress/
│       ├── status.md
│       ├── save.md
│       ├── recover.md
│       └── parse.md
├── skills/
│   └── progress-sync/
│       ├── SKILL.md
│       └── references/
│           ├── checkpoint-format.md
│           ├── subagent-protocol.md
│           └── quick-start.md
├── templates/
│   ├── feature-implementation-template.md
│   ├── bug-fix-template.md
│   └── refactor-template.md
└── README.md
```

## How It Works

1. **SessionStart hook**: Loads `.checkpoint/state.json`, shows resume context
2. **PostToolUse hook**: On Edit/Write to plan files, re-parses checkboxes
3. **SubagentStop hook**: Captures progress from agent completions
4. **Recovery backup**: Every 5 checkpoints, backs up to `recovery.json`

## Troubleshooting

### Progress not showing on resume
- Ensure plan has `<!-- TASK: id -->` markers
- Check `.checkpoint/` directory exists

### Checksum mismatch warning
- Plan was edited outside Claude Code
- State is rebuilt from plan.md (safe)

### State corrupted
- Run `/progress:recover` to restore from backup
- Or `/progress:parse` to rebuild from plan.md

## License

MIT
