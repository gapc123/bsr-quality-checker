# Migration Guide: SaaS to Agency Tool

This guide covers the steps needed to deploy the conversion from SaaS to internal agency tool.

## Pre-Deployment Checklist

### 1. Database Migration

Run the following SQL against your production database to remove subscription tables:

```sql
-- Drop subscription-related tables
DROP TABLE IF EXISTS "SubmissionCredit";
DROP TABLE IF EXISTS "SubmissionUsage";
DROP TABLE IF EXISTS "Subscription";
DROP TABLE IF EXISTS "StripeCustomer";
```

Or use Prisma migrate:
```bash
cd packages/backend
npx prisma migrate deploy
```

### 2. Environment Variables

**Remove these variables from your production environment:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PER_SUBMISSION`
- `STRIPE_PRICE_PROFESSIONAL`
- `STRIPE_PRICE_ENTERPRISE`
- `APP_URL` (if only used for Stripe)

**Keep these variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - For AI features
- `CLERK_SECRET_KEY` - For authentication
- `VITE_CLERK_PUBLISHABLE_KEY` - For frontend auth
- `NODE_ENV` - production
- `PORT` - 3001 (or your preferred port)

### 3. Clerk Configuration

1. Log into your Clerk dashboard
2. Go to **User & Authentication** > **Restrictions**
3. Disable public signups (set to "Invite only")
4. Manually invite team members (2-5 users) via email
5. Update redirect URLs:
   - After sign-in: `/clients`
   - After sign-out: `/sign-in`

### 4. Dependency Updates

The Stripe package has been removed from backend dependencies. Run:

```bash
cd packages/backend
npm install
```

### 5. Build and Deploy

```bash
# Build frontend
cd packages/frontend
npm run build

# Build backend
cd packages/backend
npm run build

# Deploy (Railway/your platform)
# The app will now redirect / to /clients automatically
```

## Verification Steps

After deployment, verify the following:

1. ✅ Root path (`/`) redirects to `/clients`
2. ✅ All team members can sign in
3. ✅ No subscription gates block access to features
4. ✅ Clients page loads and shows all clients
5. ✅ Packs page loads and shows all packs
6. ✅ Can create new client
7. ✅ Can create new pack for a client
8. ✅ Can upload documents to a pack
9. ✅ Can run analysis on pack version
10. ✅ Can view results
11. ✅ No console errors related to Stripe or subscriptions

## Rollback Plan

If issues occur, you can rollback by:

1. Revert to previous git commit
2. Restore database backup
3. Re-add Stripe environment variables
4. Redeploy

## Files Changed

### Deleted Files:
- `packages/backend/src/routes/subscription.ts`
- `packages/frontend/src/pages/Landing.tsx`
- `packages/frontend/src/pages/Pricing.tsx`
- `packages/frontend/src/pages/SignUp.tsx`
- `packages/frontend/src/components/SubscriptionGate.tsx`
- `packages/frontend/src/components/UsageDisplay.tsx`

### Modified Files:
- `packages/backend/src/index.ts` - Removed subscription router
- `packages/backend/prisma/schema.prisma` - Removed subscription models
- `packages/backend/package.json` - Removed stripe dependency
- `packages/frontend/src/App.tsx` - Removed subscription gates, simplified routing
- `.env.example` - Removed Stripe variables

### Database Changes:
- Dropped: `StripeCustomer`, `Subscription`, `SubmissionUsage`, `SubmissionCredit` tables

## Next Steps

After successful deployment of SaaS removal:

1. **Project 2**: Implement enhanced task management (assignments, due dates, priorities)
2. **Project 3**: Add pack lifecycle and status tracking
3. **Project 4**: Create service package templates
4. **Project 5**: Enhance AI summaries with progress and action items

See the main implementation plan for details on each project.
