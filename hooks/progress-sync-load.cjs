#!/usr/bin/env node
/**
 * Progress Sync Load Hook
 *
 * Loads checkpoint state on session start and outputs resume context.
 * Handles crash recovery if state is corrupted.
 *
 * Fires: SessionStart (startup, resume, clear, compact)
 */

const fs = require('fs');
const path = require('path');
const {
  computeChecksum,
  formatRelativeTime,
  parseTasksFromPlan,
  readCheckpointState,
  writeCheckpointState,
  readRecoveryBackup,
  appendHistory,
  isPluginEnabled,
  progressBar
} = require('./lib/utils.cjs');

// Early exit if disabled
if (!isPluginEnabled()) {
  process.exit(0);
}

/**
 * Find active plan in current directory tree
 */
function findActivePlan() {
  const cwd = process.cwd();

  // Check for plans directory
  const plansDir = path.join(cwd, 'plans');
  if (!fs.existsSync(plansDir)) {
    return null;
  }

  // Find most recent plan directory
  try {
    const entries = fs.readdirSync(plansDir, { withFileTypes: true });
    const planDirs = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'templates' && e.name !== 'reports')
      .map(e => ({
        name: e.name,
        path: path.join(plansDir, e.name),
        planFile: path.join(plansDir, e.name, 'plan.md')
      }))
      .filter(p => fs.existsSync(p.planFile))
      .map(p => ({
        ...p,
        mtime: fs.statSync(p.planFile).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (planDirs.length > 0) {
      // Return the most recently modified plan
      return planDirs[0].path;
    }
  } catch (e) {
    // Ignore errors
  }

  return null;
}

/**
 * Rebuild state from plan.md (crash recovery)
 */
function rebuildStateFromPlan(planPath) {
  const content = fs.readFileSync(planPath, 'utf8');
  const tasks = parseTasksFromPlan(content);

  const taskIds = Object.keys(tasks);
  const totalTasks = taskIds.length;
  const completedTasks = taskIds.filter(id => tasks[id].done).length;

  return {
    version: 2,
    planId: path.basename(path.dirname(planPath)),
    planPath: path.resolve(planPath),
    lastCheckpoint: new Date().toISOString(),
    checksum: computeChecksum(content),
    progress: {
      totalTasks,
      completedTasks,
      percentage: totalTasks > 0 ? parseFloat((completedTasks / totalTasks * 100).toFixed(1)) : 0
    },
    phases: {
      main: {
        status: completedTasks === totalTasks ? 'completed' : 'in_progress',
        tasks: Object.fromEntries(
          Object.entries(tasks).map(([id, t]) => [id, {
            done: t.done,
            description: t.description
          }])
        )
      }
    },
    currentPhase: 'main',
    currentTask: taskIds.find(id => !tasks[id].done) || null,
    blockers: [],
    decisions: [],
    sessionNotes: 'Recovered from crash',
    agents: {},
    _recovered: true
  };
}

/**
 * Format resume context output
 */
function formatResumeContext(state, planDir, recoverySource = null) {
  const lines = [];
  const planName = path.basename(planDir);

  // Header
  if (recoverySource) {
    lines.push(`[Progress Sync] Recovered from ${recoverySource}`);
  } else {
    lines.push(`[Progress Sync] Resuming: ${planName}`);
  }

  // Progress bar
  const { percentage, completedTasks, totalTasks } = state.progress;
  lines.push(`${progressBar(percentage)} ${percentage}% (${completedTasks}/${totalTasks} tasks)`);
  lines.push('');

  // Phase summary
  if (state.phases) {
    for (const [phaseId, phase] of Object.entries(state.phases)) {
      const tasks = Object.entries(phase.tasks || {});
      const completed = tasks.filter(([, t]) => t.done).length;
      const total = tasks.length;

      let statusIcon = '○';
      if (phase.status === 'completed') statusIcon = '✓';
      else if (phase.status === 'in_progress') statusIcon = '◐';

      lines.push(`${statusIcon} ${phaseId} (${completed}/${total})`);

      // Show pending tasks in current phase
      if (phase.status === 'in_progress') {
        const pending = tasks.filter(([, t]) => !t.done).slice(0, 3);
        for (const [taskId, task] of pending) {
          const isCurrent = taskId === state.currentTask;
          const marker = isCurrent ? '  → ' : '    ';
          lines.push(`${marker}[ ] ${task.description || taskId}`);
        }
        if (tasks.filter(([, t]) => !t.done).length > 3) {
          lines.push(`    ... +${tasks.filter(([, t]) => !t.done).length - 3} more`);
        }
      }
    }
  }

  // Current position
  if (state.currentTask) {
    lines.push('');
    lines.push(`Next: ${state.currentTask}`);
  }

  // Session notes
  if (state.sessionNotes) {
    lines.push(`Notes: "${state.sessionNotes}"`);
  }

  // Last checkpoint
  lines.push(`Last checkpoint: ${formatRelativeTime(state.lastCheckpoint)}`);

  // Blockers
  if (state.blockers && state.blockers.length > 0) {
    lines.push('');
    lines.push('Blockers:');
    for (const blocker of state.blockers) {
      lines.push(`  ! ${blocker}`);
    }
  }

  return lines.join('\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    // Find active plan
    const planDir = findActivePlan();
    if (!planDir) {
      process.exit(0);
    }

    const planPath = path.join(planDir, 'plan.md');
    if (!fs.existsSync(planPath)) {
      process.exit(0);
    }

    const checkpointDir = path.join(planDir, '.checkpoint');

    // Try to load state
    let state = readCheckpointState(checkpointDir);
    let recoverySource = null;

    // If state exists, verify checksum
    if (state) {
      const planContent = fs.readFileSync(planPath, 'utf8');
      const currentChecksum = computeChecksum(planContent);

      if (state.checksum !== currentChecksum) {
        // Plan was modified externally, rebuild from plan
        state = rebuildStateFromPlan(planPath);
        recoverySource = 'plan.md (external changes detected)';
        writeCheckpointState(checkpointDir, state);
        appendHistory(checkpointDir, {
          event: 'checksum_mismatch',
          action: 'rebuilt_from_plan'
        });
      }
    } else {
      // No state, try recovery
      state = readRecoveryBackup(checkpointDir);

      if (state) {
        recoverySource = 'recovery.json';
        writeCheckpointState(checkpointDir, state);
        appendHistory(checkpointDir, {
          event: 'session_recovered',
          from: 'recovery.json'
        });
      } else if (fs.existsSync(planPath)) {
        // Check if plan has checkpoint markers
        const planContent = fs.readFileSync(planPath, 'utf8');
        if (planContent.includes('<!-- TASK:') || planContent.includes('<!-- CHECKPOINT:')) {
          // Has markers, rebuild
          state = rebuildStateFromPlan(planPath);
          recoverySource = 'plan.md (initial parse)';
          writeCheckpointState(checkpointDir, state);
          appendHistory(checkpointDir, {
            event: 'checkpoint_created',
            from: 'plan_parse'
          });
        }
      }
    }

    // Output resume context (only if we have meaningful state)
    if (state && state.progress && state.progress.totalTasks > 0) {
      console.log('\n' + formatResumeContext(state, planDir, recoverySource) + '\n');
    }

    process.exit(0);
  } catch (error) {
    // Silent failure - non-critical
    process.exit(0);
  }
}

main();
