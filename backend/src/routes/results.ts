import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, validate } from '../middleware';
import { CreateResultSchema, BulkResultSchema } from '../schemas';
import { normalise } from '../lib/auth';

const router = Router();

/* GET /api/results?stuId=&year=&term= */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { stuId, year, term } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (stuId) where.stuId = stuId;
    if (year)  where.year = year;
    if (term)  where.term = term;

    const results = await prisma.result.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { name: true } } },
    });
    res.json(results.map(r => ({ ...r, stuName: r.student.name })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

/* POST /api/results — ADMIN+ */
router.post('/', authenticate, requireRole('ADMIN'), validate(CreateResultSchema), async (req: Request, res: Response) => {
  try {
    const { stuId, subject, score, scoreType, term, year } = req.body;
    const exists = await prisma.student.findUnique({ where: { stuId } });
    if (!exists) { res.status(400).json({ error: 'Student not found' }); return; }

    const norm = parseFloat(normalise(score, scoreType).toFixed(2));
    const result = await prisma.result.create({ data: { stuId, subject, score, scoreType, normalised: norm, term, year } });
    await prisma.activityLog.create({ data: { message: `Result: ${exists.name} — ${subject} ${score}${scoreType === 'gpa' ? ' GPA' : '%'}` } });
    res.status(201).json(result);
  } catch {
    res.status(500).json({ error: 'Failed to save result' });
  }
});

/* POST /api/results/bulk — ADMIN+ */
router.post('/bulk', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const parsed = BulkResultSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors }); return; }

  let inserted = 0, skipped = 0;
  const errors: string[] = [];

  for (const row of parsed.data) {
    const stu = await prisma.student.findUnique({ where: { stuId: row.student_id } });
    if (!stu) { skipped++; errors.push(`Unknown student: ${row.student_id}`); continue; }
    const norm = parseFloat(normalise(row.score, row.score_type).toFixed(2));
    await prisma.result.create({ data: { stuId: row.student_id, subject: row.subject, score: row.score, scoreType: row.score_type, normalised: norm, term: row.term, year: row.year } });
    inserted++;
  }
  await prisma.activityLog.create({ data: { message: `Bulk upload: ${inserted} results inserted, ${skipped} skipped` } });
  res.json({ inserted, skipped, errors });
});

/* DELETE /api/results/:id — ADMIN+ */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.result.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Result not found' });
  }
});

export default router;
