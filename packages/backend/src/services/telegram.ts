/**
 * Telegram Bot Service
 *
 * Handles both outbound notifications and inbound command processing.
 * Only responds to messages from TELEGRAM_CHAT_ID for security.
 *
 * Outbound:
 *   - Assessment complete notifications
 *   - Submission error alerts
 *   - New organisation registration alerts
 *   - Daily 8am summary
 *
 * Inbound commands:
 *   - /status  — submissions today, total orgs, stuck jobs
 *   - /submissions — last 5 submissions
 *   - /errors — errors in last 24h
 *   - /help — available commands
 *
 * Feature request flow:
 *   - Any non-command message → logged to tasks.md → confirmation requested
 *   - YES → task marked CONFIRMED
 *   - IGNORE → task marked DISCARDED
 */

import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import prisma from '../db/client.js';

let bot: TelegramBot | null = null;

// In-memory error log for the last 24h (keyed by timestamp)
interface ErrorEntry {
  timestamp: Date;
  context: string;
  message: string;
}
const recentErrors: ErrorEntry[] = [];

// Pending feature request confirmations: maps messageText → taskIndex in tasks.md
const pendingConfirmations = new Map<string, { taskText: string; lineIndex: number }>();

// Path to tasks.md in project root
const isProduction = process.env.NODE_ENV === 'production';
const TASKS_MD_PATH = isProduction
  ? path.join(process.cwd(), 'tasks.md')
  : path.join(process.cwd(), '..', '..', 'tasks.md');

function getChatId(): string | null {
  return process.env.TELEGRAM_CHAT_ID || null;
}

function getBot(): TelegramBot | null {
  return bot;
}

async function send(message: string): Promise<void> {
  const chatId = getChatId();
  const b = getBot();
  if (!b || !chatId) return;
  try {
    await b.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[Telegram] Failed to send message:', err);
  }
}

// ─── Tasks.md helpers ────────────────────────────────────────────────────────

function ensureTasksFile(): void {
  if (!fs.existsSync(TASKS_MD_PATH)) {
    fs.writeFileSync(
      TASKS_MD_PATH,
      `# Claude Code Task Queue\n\nTasks logged via Telegram. Claude Code should pick up CONFIRMED tasks.\n\n---\n\n`,
      'utf-8'
    );
  }
}

function appendTask(taskText: string): number {
  ensureTasksFile();
  const content = fs.readFileSync(TASKS_MD_PATH, 'utf-8');
  const timestamp = new Date().toISOString();
  const entry = `\n## Task\n- **Logged:** ${timestamp}\n- **Status:** PENDING\n- **Description:** ${taskText}\n`;
  fs.writeFileSync(TASKS_MD_PATH, content + entry, 'utf-8');
  // Return the line number where status appears (for later update)
  const lines = fs.readFileSync(TASKS_MD_PATH, 'utf-8').split('\n');
  return lines.length - 4; // approximate line of the Status field
}

function updateTaskStatus(taskText: string, status: 'CONFIRMED' | 'DISCARDED'): void {
  const content = fs.readFileSync(TASKS_MD_PATH, 'utf-8');
  const lines = content.split('\n');
  let found = false;
  const updated = lines.map((line) => {
    if (!found && line.includes(taskText)) found = true;
    if (found && line.includes('- **Status:** PENDING')) {
      found = false;
      return line.replace('PENDING', status);
    }
    return line;
  });
  fs.writeFileSync(TASKS_MD_PATH, updated.join('\n'), 'utf-8');
}

// ─── Bot command handlers ─────────────────────────────────────────────────────

async function handleStatus(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [submissionsToday, totalOrgs] = await Promise.all([
      prisma.submission.count({ where: { createdAt: { gte: today } } }),
      prisma.organisation.count(),
    ]);

    const stuckThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
    const stuckJobs = await prisma.submission.count({
      where: { status: 'processing', createdAt: { lt: stuckThreshold } },
    });

    const lines = [
      `📊 *Status*`,
      ``,
      `Submissions today: *${submissionsToday}*`,
      `Total organisations: *${totalOrgs}*`,
      `Stuck jobs (>30min): *${stuckJobs}*`,
    ];

    await send(lines.join('\n'));
  } catch (err) {
    await send('❌ Failed to fetch status.');
    console.error('[Telegram] /status error:', err);
  }
}

async function handleSubmissions(): Promise<void> {
  try {
    const submissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { organisation: { select: { name: true } } },
    });

    if (submissions.length === 0) {
      await send('No submissions yet.');
      return;
    }

    const lines = [`📋 *Last 5 Submissions*`, ``];
    for (const s of submissions) {
      const score = s.regulatoryReadinessScore != null ? `${Math.round(s.regulatoryReadinessScore)}%` : 'N/A';
      const date = s.createdAt.toLocaleDateString('en-GB');
      lines.push(`• *${s.organisation.name}* — ${score} — ${date}`);
    }

    await send(lines.join('\n'));
  } catch (err) {
    await send('❌ Failed to fetch submissions.');
    console.error('[Telegram] /submissions error:', err);
  }
}

async function handleErrors(): Promise<void> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Combine in-memory errors and DB errors
  const inMemory = recentErrors.filter((e) => e.timestamp >= since);

  let dbErrors: Array<{ id: string; organisation: { name: string }; errorMessage: string | null; createdAt: Date }> = [];
  try {
    dbErrors = await prisma.submission.findMany({
      where: { status: 'error', createdAt: { gte: since } },
      include: { organisation: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  } catch (_) {}

  if (inMemory.length === 0 && dbErrors.length === 0) {
    await send('✅ No errors in the last 24 hours.');
    return;
  }

  const lines = [`🚨 *Errors (last 24h)*`, ``];

  for (const e of dbErrors) {
    lines.push(`• *${e.organisation.name}* — ${e.errorMessage || 'Unknown error'}`);
  }
  for (const e of inMemory) {
    lines.push(`• [${e.context}] ${e.message}`);
  }

  await send(lines.join('\n'));
}

async function handleHelp(): Promise<void> {
  const message = [
    `🤖 *BSR Quality Checker Bot*`,
    ``,
    `*Commands:*`,
    `/status — submissions today, total orgs, stuck jobs`,
    `/submissions — last 5 submissions`,
    `/errors — errors in last 24 hours`,
    `/help — this message`,
    ``,
    `*Feature requests:*`,
    `Send any non-command message to log a task for Claude Code.`,
    `Reply YES to confirm or IGNORE to discard.`,
  ].join('\n');
  await send(message);
}

// ─── Feature request flow ─────────────────────────────────────────────────────

async function handleFeatureRequest(text: string): Promise<void> {
  appendTask(text);

  pendingConfirmations.set('__latest__', { taskText: text, lineIndex: 0 });

  await send(
    `📝 *Task logged:* "${text}"\n\nReply *YES* to confirm you want Claude Code to action this, or *IGNORE* to discard.`
  );
}

async function handleConfirmation(response: string): Promise<void> {
  const pending = pendingConfirmations.get('__latest__');
  if (!pending) {
    await send('No pending task to confirm.');
    return;
  }

  if (response === 'YES') {
    updateTaskStatus(pending.taskText, 'CONFIRMED');
    pendingConfirmations.delete('__latest__');
    await send(`✅ Task confirmed and ready for Claude Code. Open \`tasks.md\` to review.`);
  } else if (response === 'IGNORE') {
    updateTaskStatus(pending.taskText, 'DISCARDED');
    pendingConfirmations.delete('__latest__');
    await send(`🗑️ Task discarded.`);
  }
}

// ─── Daily summary ─────────────────────────────────────────────────────────────

async function sendDailySummary(): Promise<void> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalSubmissions, totalOrgs, errorsCount] = await Promise.all([
      prisma.submission.count({ where: { createdAt: { gte: since } } }),
      prisma.organisation.count(),
      prisma.submission.count({ where: { status: 'error', createdAt: { gte: since } } }),
    ]);

    const inMemoryErrors = recentErrors.filter((e) => e.timestamp >= since).length;
    const totalErrors = errorsCount + inMemoryErrors;

    const message = [
      `☀️ *Daily Summary*`,
      ``,
      `Submissions (last 24h): *${totalSubmissions}*`,
      `Total organisations: *${totalOrgs}*`,
      `Errors (last 24h): *${totalErrors}*`,
    ].join('\n');

    await send(message);
  } catch (err) {
    console.error('[Telegram] Daily summary error:', err);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function recordError(context: string, message: string): void {
  recentErrors.push({ timestamp: new Date(), context, message });
  // Keep only last 24h of errors
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  while (recentErrors.length > 0 && recentErrors[0].timestamp < cutoff) {
    recentErrors.shift();
  }
}

export async function sendAssessmentCompleteNotification(params: {
  organisationName: string;
  readinessScore: number;
  passed: number;
  partial: number;
  failed: number;
}): Promise<void> {
  const { organisationName, readinessScore, passed, partial, failed } = params;
  const scoreEmoji = readinessScore >= 80 ? '🟢' : readinessScore >= 50 ? '🟡' : '🔴';

  await send(
    [
      `✅ *Assessment Complete*`,
      ``,
      `*Organisation:* ${organisationName}`,
      `*Regulatory Readiness Score:* ${scoreEmoji} ${readinessScore}%`,
      ``,
      `✅ Passed: ${passed}`,
      `🟡 Partial: ${partial}`,
      `❌ Failed: ${failed}`,
    ].join('\n')
  );
}

export async function sendSubmissionErrorNotification(params: {
  submissionId: string;
  errorMessage: string;
}): Promise<void> {
  const { submissionId, errorMessage } = params;
  recordError('submission', errorMessage);
  await send(
    [
      `🚨 *Submission Error*`,
      ``,
      `*Submission ID:* \`${submissionId}\``,
      `*Error:* ${errorMessage}`,
    ].join('\n')
  );
}

export async function sendNewOrgNotification(orgName: string): Promise<void> {
  await send(`🏢 *New organisation registered:* ${orgName}`);
}

// ─── Initialization ───────────────────────────────────────────────────────────

export async function initializeTelegramBot(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = getChatId();

  if (!token || !chatId) {
    console.log('[Telegram] Bot not initialized — TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');
    return;
  }

  // Create bot without auto-starting polling so we can clear stale state first
  bot = new TelegramBot(token, { polling: false });

  // Clear any lingering webhook or ghost polling connection from a previous deploy.
  // drop_pending_updates: true discards messages that accumulated while the old
  // instance was dying — they would be processed by the wrong (dead) context anyway.
  try {
    await (bot as any).deleteWebhook({ drop_pending_updates: true });
    console.log('[Telegram] Stale webhook/polling cleared');
  } catch (err) {
    console.error('[Telegram] Failed to clear webhook (non-fatal):', err);
  }

  // Now start polling cleanly
  bot.startPolling();
  console.log('[Telegram] Bot initialized with polling');

  // Graceful shutdown — stops polling so Railway redeploys don't leave ghost connections
  const shutdown = async (signal: string) => {
    console.log(`[Telegram] ${signal} received — stopping bot polling`);
    if (bot) {
      try {
        await bot.stopPolling();
      } catch (err) {
        console.error('[Telegram] Error stopping polling:', err);
      }
    }
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  bot.on('message', async (msg) => {
    // Security: only respond to the configured chat
    if (String(msg.chat.id) !== chatId) {
      console.warn(`[Telegram] Ignoring message from unknown chat ${msg.chat.id} (expected ${chatId})`);
      return;
    }

    const text = (msg.text || '').trim();

    if (text === '/status') {
      await handleStatus();
    } else if (text === '/submissions') {
      await handleSubmissions();
    } else if (text === '/errors') {
      await handleErrors();
    } else if (text === '/help') {
      await handleHelp();
    } else if (text === 'YES' || text === 'IGNORE') {
      await handleConfirmation(text);
    } else if (text.startsWith('/')) {
      await send(`Unknown command. Try /help`);
    } else {
      await handleFeatureRequest(text);
    }
  });

  bot.on('polling_error', (err) => {
    console.error('[Telegram] Polling error:', err.message);
  });

  // Schedule daily summary at 8am
  cron.schedule('0 8 * * *', async () => {
    await sendDailySummary();
  });

  console.log('[Telegram] Daily summary scheduled for 08:00');
}
