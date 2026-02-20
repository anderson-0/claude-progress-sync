#!/usr/bin/env node
/**
 * Progress Sync Checkpoint Hook
 *
 * Creates checkpoints when plan files are modified.
 * Parses checkboxes from plan.md and syncs to .checkpoint/state.json
 *
 * Fires: PostToolUse (Edit|Write|MultiEdit on plan files), SubagentStop
 */

const fs = require('fs');
const path = require('path');
const {
  computeChecksum,
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
  isPluginEnabled
} = require('./lib/utils.cjs');

// Early exit if disabled
if (!isPluginEnabled()) {
  process.exit(0);
}

/**
 * Find task in phases structure
 */
function findTaskInPhases(phases, taskId) {
  for (const phase of Object.values(phases)) {
    if (phase.tasks && phase.tasks[taskId]) {
      return phase.tasks[taskId];
    }
  }
  return null;
}

/**
 * Build or update checkpoint state from plan content
 */
function buildCheckpointState(planPath, planContent, existingState) {
  const planId = path.basename(path.dirname(planPath));
  const tasks = parseTasksFromPlan(planContent);
  const phases = parsePhasesFromPlan(planContent);
  const acceptance = parseAcceptanceFromPlan(planContent);
  const decisions = parseDecisionsFromPlan(planContent);
  const blockers = parseBlockersFromPlan(planContent);

  // Calculate progress
  const taskIds = Object.keys(tasks);
  const totalTasks = taskIds.length;
  const completedTasks = taskIds.filter(id => tasks[id].done).length;
  const percentage = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;

  // Detect newly completed tasks
  const newlyCompleted = [];
  if (existingState && existingState.phases) {
    for (const taskId of taskIds) {
      const existingTask = findTaskInPhases(existingState.phases, taskId);
      if (tasks[taskId].done && (!existingTask || !existingTask.done)) {
        newlyCompleted.push(taskId);
      }
    }
  }

  // Build phase structure
  const phaseIds = Object.keys(phases);

  // If no phases defined, create default
  if (phaseIds.length === 0) {
    phases['main'] = { status: 'in_progress', tasks: {} };
  }

  // Assign tasks to first phase (simplified)
  const defaultPhase = phaseIds[0] || 'main';
  for (const [taskId, task] of Object.entries(tasks)) {
    if (!phases[defaultPhase].tasks) {
      phases[defaultPhase].tasks = {};
    }
    phases[defaultPhase].tasks[taskId] = {
      done: task.done,
      description: task.description,
      completedAt: task.done ? (
        existingState?.phases?.[defaultPhase]?.tasks?.[taskId]?.completedAt ||
        new Date().toISOString()
      ) : undefined,
      completedBy: task.done ? (
        existingState?.phases?.[defaultPhase]?.tasks?.[taskId]?.completedBy ||
        'main'
      ) : undefined
    };
  }

  // Determine current phase and task
  let currentPhase = null;
  let currentTask = null;

  for (const [phaseId, phase] of Object.entries(phases)) {
    const phaseTasks = Object.entries(phase.tasks || {});
    const pendingTasks = phaseTasks.filter(([, t]) => !t.done);
    const completedInPhase = phaseTasks.filter(([, t]) => t.done);

    if (pendingTasks.length > 0) {
      currentPhase = phaseId;
      currentTask = pendingTasks[0][0];
      phase.status = 'in_progress';
    } else if (completedInPhase.length === phaseTasks.length && phaseTasks.length > 0) {
      phase.status = 'completed';
    }
  }

  const state = {
    version: 2,
    planId,
    planPath: path.resolve(planPath),
    lastCheckpoint: new Date().toISOString(),
    checksum: computeChecksum(planContent),
    progress: {
      totalTasks,
      completedTasks,
      percentage: parseFloat(percentage.toFixed(1))
    },
    phases,
    acceptance,
    currentPhase,
    currentTask,
    blockers,
    decisions: existingState?.decisions || decisions,
    sessionNotes: existingState?.sessionNotes || null,
    agents: existingState?.agents || {}
  };

  return { state, newlyCompleted };
}

/**
 * Main execution
 */
async function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const data = JSON.parse(stdin);

    // Get file path from tool input
    const filePath = data.tool_input?.file_path || data.tool_input?.path;

    // Only process plan files
    if (!isPlanFile(filePath)) {
      process.exit(0);
    }

    // Get plan directory
    const planDir = getPlanDirectory(filePath);
    if (!planDir) {
      process.exit(0);
    }

    // Read plan content
    const planPath = path.join(planDir, 'plan.md');
    if (!fs.existsSync(planPath)) {
      process.exit(0);
    }

    const planContent = fs.readFileSync(planPath, 'utf8');
    const checkpointDir = path.join(planDir, '.checkpoint');

    // Read existing state
    const existingState = readCheckpointState(checkpointDir);

    // Check if content changed (by checksum)
    if (existingState && existingState.checksum === computeChecksum(planContent)) {
      // No changes, skip
      process.exit(0);
    }

    // Build new state
    const { state, newlyCompleted } = buildCheckpointState(planPath, planContent, existingState);

    // Write state
    if (!writeCheckpointState(checkpointDir, state)) {
      console.error('[Progress Sync] Failed to write checkpoint');
      process.exit(0);
    }

    // Log to history
    appendHistory(checkpointDir, {
      event: 'checkpoint_updated',
      tool: data.tool_name,
      file: path.basename(filePath),
      tasksCompleted: newlyCompleted.length,
      progress: state.progress.percentage
    });

    // Create recovery backup periodically (every 5 checkpoints)
    const historyPath = path.join(checkpointDir, 'history.jsonl');
    if (fs.existsSync(historyPath)) {
      const historyLines = fs.readFileSync(historyPath, 'utf8').split('\n').filter(Boolean);
      if (historyLines.length % 5 === 0) {
        createRecoveryBackup(checkpointDir, state, 'periodic_backup');
      }
    }

    // Output progress update (only if tasks completed)
    if (newlyCompleted.length > 0) {
      console.log(`[Progress Sync] +${newlyCompleted.length} task(s) → ${state.progress.percentage}% (${state.progress.completedTasks}/${state.progress.totalTasks})`);
    }

    process.exit(0);
  } catch (error) {
    // Silent failure - non-critical
    process.exit(0);
  }
}

main();
