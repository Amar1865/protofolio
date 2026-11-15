import { Router } from 'express';
import {
  createInvestment,
  deleteInvestmentForUser,
  getInvestmentsForUser,
  logActivity,
  updateInvestmentForUser,
} from '../db/queries.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';
import {
  computePortfolioAnalytics,
  INVESTMENT_CATEGORIES,
  InvestmentCategory,
  InvestmentRecord,
} from '../utils/calculations.ts';

const router = Router();
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateInvestmentPayload(body: any): {
  valid: boolean;
  error?: string;
  data?: {
    category: InvestmentCategory;
    assetName: string;
    symbol: string;
    units: number;
    purchasePrice: number;
    currentPrice: number;
    purchaseDate: string;
    notes: string;
  };
} {
  const {
    category,
    assetName,
    symbol,
    units,
    purchasePrice,
    currentPrice,
    purchaseDate,
    notes,
  } = body ?? {};

  if (
    typeof category !== 'string' ||
    !INVESTMENT_CATEGORIES.includes(category as InvestmentCategory)
  ) {
    return {
      valid: false,
      error: 'Category must be one of: Stocks, Mutual Funds, Others.',
    };
  }
  if (typeof assetName !== 'string' || assetName.trim().length < 2) {
    return { valid: false, error: 'Asset name must be at least 2 characters.' };
  }
  if (symbol !== undefined && symbol !== null && typeof symbol !== 'string') {
    return { valid: false, error: 'Symbol must be a valid text string.' };
  }
  const cleanSymbol = typeof symbol === 'string' ? symbol.trim().toUpperCase() : '';
  if (cleanSymbol.length > 20) {
    return { valid: false, error: 'Symbol must be 20 characters or fewer.' };
  }

  const parsedUnits = Number(units);
  const parsedPurchase = Number(purchasePrice);
  const parsedCurrent = Number(currentPrice);

  if (!Number.isFinite(parsedUnits) || parsedUnits <= 0) {
    return { valid: false, error: 'Number of units must be greater than 0.' };
  }
  if (!Number.isFinite(parsedPurchase) || parsedPurchase <= 0) {
    return { valid: false, error: 'Purchase price must be greater than 0.' };
  }
  if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
    return { valid: false, error: 'Current price must be 0 or greater.' };
  }
  if (typeof purchaseDate !== 'string' || !DATE_REGEX.test(purchaseDate)) {
    return { valid: false, error: 'Purchase date must be in YYYY-MM-DD format.' };
  }

  return {
    valid: true,
    data: {
      category: category as InvestmentCategory,
      assetName: assetName.trim(),
      symbol: cleanSymbol,
      units: parsedUnits,
      purchasePrice: parsedPurchase,
      currentPrice: parsedCurrent,
      purchaseDate,
      notes: typeof notes === 'string' ? notes.trim().slice(0, 500) : '',
    },
  };
}

router.use('/investments', requireAuth);

router.get('/investments', async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const rows = await getInvestmentsForUser(req.authUser.id);
    const records: InvestmentRecord[] = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      category: r.category as InvestmentCategory,
      assetName: r.assetName,
      symbol: r.symbol,
      units: Number(r.units),
      purchasePrice: Number(r.purchasePrice),
      currentPrice: Number(r.currentPrice),
      purchaseDate: r.purchaseDate,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
    const analytics = computePortfolioAnalytics(records);
    return res.json(analytics);
  } catch (error: any) {
    console.error('Get investments error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to fetch investments.' });
  }
});

router.post('/investments', async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const validation = validateInvestmentPayload(req.body);
    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error });
    }

    const created = await createInvestment({
      userId: req.authUser.id,
      ...validation.data,
    });

    await logActivity({
      userId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'INVESTMENT_ADDED',
      entityType: 'investment',
      details: `Added ${created.symbol || created.assetName} (${created.category}) · ${created.units} units.`,
    });

    return res.status(201).json({ investment: created });
  } catch (error: any) {
    console.error('Create investment error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to create investment.' });
  }
});

router.put('/investments/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const investmentId = Number(req.params.id);
    if (!Number.isInteger(investmentId) || investmentId <= 0) {
      return res.status(400).json({ error: 'Invalid investment ID.' });
    }

    const validation = validateInvestmentPayload(req.body);
    if (!validation.valid || !validation.data) {
      return res.status(400).json({ error: validation.error });
    }

    const updated = await updateInvestmentForUser(
      investmentId,
      req.authUser.id,
      validation.data
    );
    if (!updated) {
      return res
        .status(404)
        .json({ error: 'Investment record not found or access denied.' });
    }

    await logActivity({
      userId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'INVESTMENT_UPDATED',
      entityType: 'investment',
      details: `Updated ${updated.symbol || updated.assetName} (${updated.category}) · ${updated.units} units.`,
    });

    return res.json({ investment: updated });
  } catch (error: any) {
    console.error('Update investment error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to update investment.' });
  }
});

router.delete('/investments/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const investmentId = Number(req.params.id);
    if (!Number.isInteger(investmentId) || investmentId <= 0) {
      return res.status(400).json({ error: 'Invalid investment ID.' });
    }

    const deleted = await deleteInvestmentForUser(investmentId, req.authUser.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ error: 'Investment record not found or access denied.' });
    }

    await logActivity({
      userId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'INVESTMENT_DELETED',
      entityType: 'investment',
      details: `Deleted ${deleted.symbol ? `${deleted.symbol} (${deleted.assetName})` : deleted.assetName}.`,
    });

    return res.json({ message: 'Investment removed.', id: deleted.id });
  } catch (error: any) {
    console.error('Delete investment error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to delete investment.' });
  }
});

router.post('/investments/report-log', async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const format = typeof req.body?.format === 'string' ? req.body.format : 'CSV';
    await logActivity({
      userId: req.authUser.id,
      actorEmail: req.authUser.email,
      action: 'REPORT_EXPORTED',
      entityType: 'report',
      details: `Generated ${format} portfolio report.`,
    });
    return res.json({ ok: true });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to log report export.' });
  }
});

export default router;
