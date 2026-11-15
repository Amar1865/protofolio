import { Router } from 'express';
import {
  findUserById,
  getAdminOverviewMetrics,
  getAllUsersWithInvestmentStats,
  getRecentActivities,
  logActivity,
  sanitizeUser,
  updateUserStatus,
} from '../db/queries.ts';
import { AuthRequest, requireAdmin, requireAuth } from '../middleware/auth.ts';

const router = Router();

router.use('/admin', requireAuth, requireAdmin);

router.get('/admin/overview', async (_req: AuthRequest, res) => {
  try {
    const metrics = await getAdminOverviewMetrics();
    return res.json(metrics);
  } catch (error: any) {
    console.error('Admin overview error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to load admin overview.' });
  }
});

router.get('/admin/users', async (_req: AuthRequest, res) => {
  try {
    const users = await getAllUsersWithInvestmentStats();
    return res.json({ users });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to load users.' });
  }
});

router.patch('/admin/users/:id/status', async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const targetUserId = Number(req.params.id);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const { status } = req.body ?? {};
    if (status !== 'active' && status !== 'inactive') {
      return res
        .status(400)
        .json({ error: 'Status must be either "active" or "inactive".' });
    }

    if (targetUserId === req.authUser.id && status === 'inactive') {
      return res
        .status(400)
        .json({ error: 'You cannot deactivate your own administrator account.' });
    }

    const target = await findUserById(targetUserId);
    if (!target) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const updated = await updateUserStatus(targetUserId, status);
    if (!updated) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    await logActivity({
      userId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'USER_STATUS_CHANGED',
      entityType: 'user',
      details: `Set ${updated.email} account status to ${status}.`,
    });

    return res.json({ user: sanitizeUser(updated) });
  } catch (error: any) {
    console.error('Update user status error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to update account status.' });
  }
});

router.get('/admin/activities', async (req: AuthRequest, res) => {
  try {
    const limitParam = Number(req.query.limit);
    const limit =
      Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 200
        ? limitParam
        : 100;
    const activities = await getRecentActivities(limit);
    return res.json({ activities });
  } catch (error: any) {
    console.error('Admin activities error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to load activity logs.' });
  }
});

export default router;
