# Changelog

All notable changes to Progress Sync will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-20

### Added
- Initial release
- Auto-checkpoint on plan file edits (PostToolUse hook)
- Session resume with progress context (SessionStart hook)
- Subagent progress tracking (SubagentStop hook)
- Crash recovery via `recovery.json` backups
- Visual progress bars and phase breakdown
- Commands: `/progress:status`, `/progress:save`, `/progress:recover`, `/progress:parse`
- Checkpoint markers: `CHECKPOINT`, `TASK`, `ACCEPT`, `DECISION`, `BLOCKER`
- Plan templates with checkpoint markers
- Append-only history log (`history.jsonl`)
- Self-contained utilities (no external dependencies)
