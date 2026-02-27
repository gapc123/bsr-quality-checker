import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/team/members - Get team members from Clerk
// Note: This is a placeholder. In production, you would use Clerk's Users API
// to fetch organization members. For now, returns mock data or can be extended.
router.get('/members', async (req: Request, res: Response) => {
  try {
    // TODO: Integrate with Clerk's Users API
    // const { clerkClient } = await import('@clerk/express');
    // const users = await clerkClient.users.getUserList();

    // For now, return a placeholder response
    // In production, this should fetch from Clerk or a local cache
    const members = [
      {
        userId: 'user_placeholder_1',
        name: 'Team Member 1',
        email: 'member1@example.com',
        avatarUrl: null,
      },
      {
        userId: 'user_placeholder_2',
        name: 'Team Member 2',
        email: 'member2@example.com',
        avatarUrl: null,
      },
    ];

    res.json(members);
  } catch (error) {
    console.error('Error getting team members:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
});

export default router;
