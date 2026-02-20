/**
 * Progress Sync Plugin - Shared Utilities
 *
 * Self-contained utilities for the plugin (no external dependencies)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * Compute checksum for content verification
 */
function computeChecksum(content) {
  return 'sha256:' + crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Format relative time (e.g., "2h ago", "3d ago")
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'unknown';

  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Parse tasks from plan content
 */
function parseTasksFromPlan(content) {
  const tasks = {};
  const taskRegex = /- \[([ x])\] (.+?) <!-- TASK: ([\w-]+) -->/g;

  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    const [, checked, description, taskId] = match;
    tasks[taskId] = {
      done: checked === 'x',
      description: description.trim()
    };
  }

  return tasks;
}

/**
 * Parse phases from plan content
 */
function parsePhasesFromPlan(content) {
  const phases = {};
  const phaseRegex = /<!-- CHECKPOINT: ([\w-]+) -->/g;

  let match;
  while ((match = phaseRegex.exec(content)) !== null) {
    const phaseId = match[1];
    phases[phaseId] = {
      status: 'pending',
      tasks: {}
    };
  }

  return phases;
}

/**
 * Parse acceptance criteria
 */
function parseAcceptanceFromPlan(content) {
  const acceptance = {};
  const acceptRegex = /- \[([ x])\] (.+?) <!-- ACCEPT: ([\w-]+) -->/g;

  let match;
  while ((match = acceptRegex.exec(content)) !== null) {
    const [, checked, description, criteriaId] = match;
    acceptance[criteriaId] = {
      met: checked === 'x',
      description: description.trim()
    };
  }

  return acceptance;
}

/**
 * Parse blockers from plan content
 */
function parseBlockersFromPlan(content) {
  const blockers = [];
  const blockerRegex = /<!-- BLOCKER: (.+?) -->/g;

  let match;
  while ((match = blockerRegex.exec(content)) !== null) {
    blockers.push(match[1].trim());
  }

  return blockers;
}

/**
 * Parse decisions from plan content
 */
function parseDecisionsFromPlan(content) {
  const decisions = [];
  const decisionRegex = /<!-- DECISION: (.+?) -->/g;

  let match;
  while ((match = decisionRegex.exec(content)) !== null) {
    decisions.push({
      time: new Date().toISOString(),
      decision: match[1].trim()
    });
  }

  return decisions;
}

/**
 * Check if file is a plan file
 */
function isPlanFile(filePath) {
  if (!filePath) return false;

  const basename = path.basename(filePath);
  const dirname = path.dirname(filePath);

  // Direct plan files
  if (basename === 'plan.md') return true;
  if (basename.match(/^phase-\d+.*\.md$/)) return true;

  // Files in plans directory
  if (dirname.includes('/plans/') || dirname.includes('\\plans\\')) return true;

  return false;
}

/**
 * Get plan directory from file path
 */
function getPlanDirectory(filePath) {
  const dirname = path.dirname(filePath);
  const basename = path.basename(filePath);

  // If editing plan.md or phase file, parent is plan dir
  if (basename === 'plan.md' || basename.match(/^phase-\d+/)) {
    return dirname;
  }

  // Walk up to find plan.md
  let current = dirname;
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'plan.md'))) {
      return current;
    }
    current = path.dirname(current);
  }

  return null;
}

/**
 * Read checkpoint state from directory
 */
function readCheckpointState(checkpointDir) {
  const statePath = path.join(checkpointDir, 'state.json');
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (e) {
    // Corrupted state
  }
  return null;
}

/**
 * Write checkpoint state atomically
 */
function writeCheckpointState(checkpointDir, state) {
  if (!fs.existsSync(checkpointDir)) {
    fs.mkdirSync(checkpointDir, { recursive: true });
  }

  const statePath = path.join(checkpointDir, 'state.json');
  const tmpPath = statePath + '.' + Math.random().toString(36).slice(2);

  try {
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    fs.renameSync(tmpPath, statePath);
    return true;
  } catch (e) {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
    return false;
  }
}

/**
 * Append to history log (append-only)
 */
function appendHistory(checkpointDir, event) {
  const historyPath = path.join(checkpointDir, 'history.jsonl');

  if (!fs.existsSync(checkpointDir)) {
    fs.mkdirSync(checkpointDir, { recursive: true });
  }

  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    ...event
  }) + '\n';

  fs.appendFileSync(historyPath, entry);
}

/**
 * Create recovery backup
 */
function createRecoveryBackup(checkpointDir, state, reason) {
  const recoveryPath = path.join(checkpointDir, 'recovery.json');

  const backup = {
    savedAt: new Date().toISOString(),
    reason,
    state
  };

  try {
    fs.writeFileSync(recoveryPath, JSON.stringify(backup, null, 2));
  } catch (e) {
    // Non-critical
  }
}

/**
 * Read recovery backup
 */
function readRecoveryBackup(checkpointDir) {
  const recoveryPath = path.join(checkpointDir, 'recovery.json');
  try {
    if (fs.existsSync(recoveryPath)) {
      const backup = JSON.parse(fs.readFileSync(recoveryPath, 'utf8'));
      return backup.state;
    }
  } catch (e) {
    // Corrupted
  }
  return null;
}

/**
 * Check if plugin/hook is enabled
 */
function isPluginEnabled() {
  // Check for explicit disable via environment
  if (process.env.PROGRESS_SYNC_DISABLED === '1') {
    return false;
  }
  return true;
}

/**
 * Generate progress bar
 */
function progressBar(percentage, width = 20) {
  const filled = Math.round(percentage / 100 * width);
  const empty = width - filled;
  return '━'.repeat(filled) + '─'.repeat(empty);
}

module.exports = {
  computeChecksum,
  formatRelativeTime,
  parseTasksFromPlan,
  parsePhasesFromPlan,
  parseAcceptanceFromPlan,
  parseBlockersFromPlan,
  parseDecisionsFromPlan,
  isPlanFile,
  getPlanDirectory,
  readCheckpointState,
  writeCheckpointState,
  appendHistory,
  createRecoveryBackup,
  readRecoveryBackup,
  isPluginEnabled,
  progressBar
};
