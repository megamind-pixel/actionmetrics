import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, validate } from '../middleware';
import { CreateInstitutionSchema } from '../schemas';

const router = Router();

async function nextInstId(): Promise<string> {
  const last = await prisma.institution.findFirst({ orderBy: { instId: 'desc' } });
  const num = last ? parseInt(last.instId.replace('INST-', '')) + 1 : 1;
  return 'INST-' + String(num).padStart(4, '0');
}

/* GET /api/institutions */
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const insts = await prisma.institution.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { students: true } } },
    });

    // compute avg per institution via raw query
    const avgs = await prisma.$queryRaw<{ instId: string; avg: number | null }[]>`
      SELECT s."instId", AVG(r.normalised)::float AS avg
      FROM results r
      JOIN students s ON s."stuId" = r."stuId"
      GROUP BY s."instId"
    `;
    const avgMap = Object.fromEntries(avgs.map(a => [a.instId, a.avg]));

    const result = insts.map(i => ({
      ...i,
      students: i._count.students,
      avg: avgMap[i.instId] ?? null,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
});

/* POST /api/institutions — ADMIN+ */
router.post('/', authenticate, requireRole('ADMIN'), validate(CreateInstitutionSchema), async (req: Request, res: Response) => {
  try {
    const instId = await nextInstId();
    const inst = await prisma.institution.create({
      data: { instId, name: req.body.name, type: req.body.type, county: req.body.county },
    });
    await prisma.activityLog.create({ data: { message: `Institution registered: ${inst.name}` } });
    res.status(201).json({ ...inst, students: 0, avg: null });
  } catch {
    res.status(500).json({ error: 'Failed to create institution' });
  }
});

/* DELETE /api/institutions/:instId — SUPER only */
router.delete('/:instId', authenticate, requireRole('SUPER'), async (req: Request, res: Response) => {
  try {
    await prisma.institution.delete({ where: { instId: req.params.instId } });
    await prisma.activityLog.create({ data: { message: `Institution deleted: ${req.params.instId}` } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Institution not found' });
  }
});

export default router;
