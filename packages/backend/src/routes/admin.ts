import express, { Request, Response } from 'express';
import passport from 'passport';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import prisma from '../db/client.js';
import { isAdminEmail, verifyAdminCredentials, requireAdminSession } from '../middleware/admin-auth.js';

const router = express.Router();

// ─── Microsoft SSO Setup ────────────────────────────────────────────────────

const ADMIN_CALLBACK_URL = process.env.NODE_ENV === 'production'
  ? 'https://www.attlee.ai/api/admin/auth/microsoft/callback'
  : 'http://localhost:3001/api/admin/auth/microsoft/callback';

const FRONTEND_ADMIN_URL = process.env.NODE_ENV === 'production'
  ? 'https://www.attlee.ai/admin'
  : 'http://localhost:5173/admin';

if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
  const msStrategy = new MicrosoftStrategy(
    {
      clientID: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      callbackURL: ADMIN_CALLBACK_URL,
      scope: ['user.read'],
      tenant: 'common',
      addUPNAsEmail: true,
    },
    (_accessToken, _refreshToken, profile, done) => {
      // Extract email from profile
      const email = profile.emails?.[0]?.value
        || profile._json?.mail
        || profile._json?.userPrincipalName
        || '';

      if (!email || !isAdminEmail(email.toLowerCase())) {
        return done(null, false);
      }
      return done(null, { email: email.toLowerCase() });
    }
  );
  passport.use('admin-microsoft', msStrategy as unknown as passport.Strategy);
  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));
}

// ─── Auth ───────────────────────────────────────────────────────────────────

// Microsoft SSO — redirect to Microsoft login
router.get('/auth/microsoft', (req: Request, res: Response, next) => {
  if (!process.env.AZURE_CLIENT_ID) {
    return res.status(501).json({ error: 'Microsoft SSO not configured' });
  }
  passport.authenticate('admin-microsoft')(req, res, next);
});

// Microsoft SSO — callback from Microsoft
router.get('/auth/microsoft/callback', (req: Request, res: Response, next) => {
  passport.authenticate('admin-microsoft', (err: Error | null, user: { email: string } | false) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND_ADMIN_URL}/login?error=unauthorized`);
    }
    (req as any).session.adminUser = user.email;
    return res.redirect(FRONTEND_ADMIN_URL);
  })(req, res, next);
});

// Password login (fallback / dev)
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const valid = await verifyAdminCredentials(email, password);
  if (!valid) {
    return res.status(403).json({ error: 'Invalid credentials or not authorised' });
  }
  (req as any).session.adminUser = email;
  res.json({ ok: true, email });
});

router.post('/logout', (req: Request, res: Response) => {
  (req as any).session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/me', (req: Request, res: Response) => {
  const session = (req as any).session;
  if (session?.adminUser) {
    return res.json({ email: session.adminUser });
  }
  res.status(401).json({ error: 'Not authenticated' });
});

// ─── Operations Dashboard ────────────────────────────────────────────────────

router.get('/submissions', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const { orgName, status, from, to, limit = '200', offset = '0' } = req.query as Record<string, string>;

    const where: any = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    if (orgName) {
      where.organisation = { name: { contains: orgName, mode: 'insensitive' } };
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: { organisation: true },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.submission.count({ where }),
    ]);

    // Stat cards
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [allTimeStats, last30Stats] = await Promise.all([
      prisma.submission.aggregate({
        _count: { id: true },
        _avg: { regulatoryReadinessScore: true, processingTimeSeconds: true },
      }),
      prisma.submission.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
      }),
    ]);

    res.json({
      submissions: submissions.map(s => ({
        id: s.id,
        orgName: s.organisation.name,
        orgId: s.organisationId,
        userEmail: s.userEmail,
        createdAt: s.createdAt,
        completedAt: s.completedAt,
        processingTimeSeconds: s.processingTimeSeconds,
        documentCount: s.documentCount,
        documentNames: JSON.parse(s.documentNames || '[]'),
        totalChecksRun: s.totalChecksRun,
        checksPassed: s.checksPassed,
        checksPartial: s.checksPartial,
        checksFailed: s.checksFailed,
        regulatoryReadinessScore: s.regulatoryReadinessScore,
        failureCategories: JSON.parse(s.failureCategories || '[]'),
        apiCallsMade: s.apiCallsMade,
        tokensInput: s.tokensInput,
        tokensOutput: s.tokensOutput,
        estimatedApiCostGbp: s.estimatedApiCostGbp,
        status: s.status,
        errorMessage: s.errorMessage,
      })),
      total,
      stats: {
        allTime: allTimeStats._count.id,
        last30Days: last30Stats._count.id,
        avgReadinessScore: allTimeStats._avg.regulatoryReadinessScore,
        avgProcessingSeconds: allTimeStats._avg.processingTimeSeconds,
      },
    });
  } catch (err) {
    console.error('Admin submissions error:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

router.get('/submissions/:id', requireAdminSession, async (req: Request, res: Response) => {
  try {
    const sub = await prisma.submission.findUnique({
      where: { id: String(req.params.id) },
      include: { organisation: true },
    });
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

router.get('/organisations', requireAdminSession, async (_req: Request, res: Response) => {
  try {
    const orgs = await prisma.organisation.findMany({
      orderBy: { lastActiveAt: 'desc' },
    });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    res.json(orgs.map(o => ({
      id: o.id,
      name: o.name,
      primaryEmail: o.primaryEmail,
      createdAt: o.createdAt,
      lastActiveAt: o.lastActiveAt,
      submissionCount: o.submissionCount,
      isPilot: o.isPilot,
      isActive: o.lastActiveAt >= thirtyDaysAgo,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch organisations' });
  }
});

router.get('/costs', requireAdminSession, async (_req: Request, res: Response) => {
  try {
    const agg = await prisma.submission.aggregate({
      _sum: { apiCallsMade: true, tokensInput: true, tokensOutput: true, estimatedApiCostGbp: true },
      _avg: { estimatedApiCostGbp: true, tokensInput: true, tokensOutput: true },
      _count: { id: true },
    });
    const errorCount = await prisma.submission.count({ where: { status: 'error' } });
    res.json({
      totalApiCalls: agg._sum.apiCallsMade ?? 0,
      totalSpendGbp: agg._sum.estimatedApiCostGbp ?? 0,
      avgCostPerSubmission: agg._avg.estimatedApiCostGbp ?? 0,
      avgTokensInput: agg._avg.tokensInput ?? 0,
      avgTokensOutput: agg._avg.tokensOutput ?? 0,
      totalSubmissions: agg._count.id,
      errorRate: agg._count.id > 0 ? (errorCount / agg._count.id) * 100 : 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch costs' });
  }
});

router.get('/health', requireAdminSession, async (_req: Request, res: Response) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const stuckSubmissions = await prisma.submission.findMany({
      where: { status: 'processing', createdAt: { lte: oneHourAgo } },
      include: { organisation: true },
      orderBy: { createdAt: 'asc' },
    });
    const recentErrors = await prisma.submission.findMany({
      where: { status: 'error' },
      include: { organisation: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({
      stuckSubmissions: stuckSubmissions.map(s => ({
        id: s.id,
        orgName: s.organisation.name,
        createdAt: s.createdAt,
        minutesStuck: Math.round((Date.now() - s.createdAt.getTime()) / 60000),
      })),
      recentErrors: recentErrors.map(s => ({
        id: s.id,
        orgName: s.organisation.name,
        createdAt: s.createdAt,
        errorMessage: s.errorMessage,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch health data' });
  }
});

// ─── CSV Exports ─────────────────────────────────────────────────────────────

router.get('/export/submissions', requireAdminSession, async (_req: Request, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: { organisation: true },
      orderBy: { createdAt: 'desc' },
    });
    const rows = [
      ['ID', 'Organisation', 'User Email', 'Created At', 'Status', 'Documents', 'Readiness Score', 'Passed', 'Partial', 'Failed', 'Processing (s)', 'API Calls', 'Cost (GBP)'].join(','),
      ...submissions.map(s => [
        s.id, `"${s.organisation.name}"`, s.userEmail,
        s.createdAt.toISOString(), s.status,
        s.documentCount, s.regulatoryReadinessScore?.toFixed(1) ?? '',
        s.checksPassed, s.checksPartial, s.checksFailed,
        s.processingTimeSeconds ?? '', s.apiCallsMade,
        s.estimatedApiCostGbp.toFixed(4),
      ].join(',')),
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
    res.send(rows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/export/organisations', requireAdminSession, async (_req: Request, res: Response) => {
  try {
    const orgs = await prisma.organisation.findMany({ orderBy: { createdAt: 'desc' } });
    const rows = [
      ['ID', 'Name', 'Email', 'Created At', 'Last Active', 'Submissions', 'Pilot'].join(','),
      ...orgs.map(o => [
        o.id, `"${o.name}"`, o.primaryEmail,
        o.createdAt.toISOString(), o.lastActiveAt.toISOString(),
        o.submissionCount, o.isPilot ? 'Yes' : 'No',
      ].join(',')),
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="organisations.csv"');
    res.send(rows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// ─── Showcase Dashboard ───────────────────────────────────────────────────────

router.get('/showcase', requireAdminSession, async (_req: Request, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { status: 'completed' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, createdAt: true, completedAt: true,
        documentCount: true, totalChecksRun: true,
        checksPassed: true, checksPartial: true, checksFailed: true,
        regulatoryReadinessScore: true, failureCategories: true,
        organisationId: true,
      },
    });

    const orgs = await prisma.organisation.findMany({ select: { id: true, createdAt: true } });

    // Headline stats
    const totalAssessments = submissions.length;
    const uniqueOrgIds = new Set(submissions.map(s => s.organisationId));
    const totalOrgs = uniqueOrgIds.size;
    const totalDocs = submissions.reduce((sum, s) => sum + s.documentCount, 0);
    const totalGaps = submissions.reduce((sum, s) => sum + s.checksFailed + s.checksPartial, 0);
    const avgReadiness = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (s.regulatoryReadinessScore ?? 0), 0) / submissions.length
      : 0;

    // Pass/partial/fail split
    const passes = submissions.filter(s => (s.regulatoryReadinessScore ?? 0) >= 75).length;
    const partials = submissions.filter(s => {
      const score = s.regulatoryReadinessScore ?? 0;
      return score >= 40 && score < 75;
    }).length;
    const fails = submissions.filter(s => (s.regulatoryReadinessScore ?? 0) < 40).length;

    // Failure category rankings
    const categoryCounts: Record<string, number> = {};
    for (const s of submissions) {
      const cats: string[] = JSON.parse(s.failureCategories || '[]');
      for (const cat of cats) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }
    const failureCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Readiness score histogram
    const histogram = [
      { label: '0-25%', count: 0 },
      { label: '25-50%', count: 0 },
      { label: '50-75%', count: 0 },
      { label: '75-100%', count: 0 },
    ];
    for (const s of submissions) {
      const score = s.regulatoryReadinessScore ?? 0;
      if (score < 25) histogram[0].count++;
      else if (score < 50) histogram[1].count++;
      else if (score < 75) histogram[2].count++;
      else histogram[3].count++;
    }

    // Assessments per month (last 12 months)
    const monthlyMap: Record<string, number> = {};
    for (const s of submissions) {
      const key = s.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap[key] = (monthlyMap[key] || 0) + 1;
    }
    const assessmentsPerMonth = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Cumulative orgs joined over time
    const orgsByMonth: Record<string, number> = {};
    for (const org of orgs) {
      const key = org.createdAt.toISOString().slice(0, 7);
      orgsByMonth[key] = (orgsByMonth[key] || 0) + 1;
    }
    let cumulative = 0;
    const cumulativeOrgs = Object.entries(orgsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => {
        cumulative += count;
        return { month, cumulative };
      });

    res.json({
      headline: {
        totalAssessments,
        totalOrgs,
        totalGaps,
        totalDocs,
        avgReadiness: Math.round(avgReadiness),
      },
      passFailSplit: [
        { label: 'Pass (≥75%)', value: passes },
        { label: 'Partial (40-74%)', value: partials },
        { label: 'Fail (<40%)', value: fails },
      ],
      failureCategories,
      readinessHistogram: histogram,
      assessmentsPerMonth,
      cumulativeOrgs,
    });
  } catch (err) {
    console.error('Showcase error:', err);
    res.status(500).json({ error: 'Failed to fetch showcase data' });
  }
});

export default router;
