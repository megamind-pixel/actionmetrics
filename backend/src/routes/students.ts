import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, validate } from '../middleware';
import { CreateStudentSchema } from '../schemas';

const router = Router();

async function nextStuId(): Promise<string> {
  const last = await prisma.student.findFirst({ orderBy: { stuId: 'desc' } });
  const num = last ? parseInt(last.stuId.replace('STU-', '')) + 1 : 1;
  return 'STU-' + String(num).padStart(5, '0');
}

async function nextInstId(): Promise<string> {
  const last = await prisma.institution.findFirst({ orderBy: { instId: 'desc' } });
  const num = last ? parseInt(last.instId.replace('INST-', '')) + 1 : 1;
  return 'INST-' + String(num).padStart(4, '0');
}

/* GET /api/students */
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'asc' },
      include: { institution: { select: { name: true } } },
    });

    const avgs = await prisma.$queryRaw<{ stuId: string; mean: number | null }[]>`
      SELECT "stuId", AVG(normalised)::float AS mean FROM results GROUP BY "stuId"
    `;
    const avgMap = Object.fromEntries(avgs.map(a => [a.stuId, a.mean]));

    const result = students.map(s => ({
      ...s,
      instName: s.institution.name,
      mean: avgMap[s.stuId] ?? null,
    }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

/* GET /api/students/:stuId */
router.get('/:stuId', authenticate, async (req: Request, res: Response) => {
  try {
    const s = await prisma.student.findUnique({
      where: { stuId: req.params.stuId },
      include: { institution: { select: { name: true } } },
    });
    if (!s) { res.status(404).json({ error: 'Student not found' }); return; }
    const agg = await prisma.result.aggregate({ where: { stuId: s.stuId }, _avg: { normalised: true } });
    res.json({ ...s, instName: s.institution.name, mean: agg._avg.normalised });
  } catch {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

/* POST /api/students — ADMIN+ */
router.post('/', authenticate, requireRole('ADMIN'), validate(CreateStudentSchema), async (req: Request, res: Response) => {
  try {
    let { instId, newInstitution, name, level, class: cls, programme } = req.body;

    if (newInstitution) {
      const newInstId = await nextInstId();
      const inst = await prisma.institution.create({
        data: { instId: newInstId, name: newInstitution.name, type: newInstitution.type, county: newInstitution.county },
      });
      instId = inst.instId;
      await prisma.activityLog.create({ data: { message: `Institution created: ${inst.name}` } });
    } else {
      const exists = await prisma.institution.findUnique({ where: { instId } });
      if (!exists) { res.status(400).json({ error: 'Institution not found' }); return; }
    }

    const stuId = await nextStuId();
    const student = await prisma.student.create({
      data: { stuId, name, instId, level, class: cls, programme },
      include: { institution: { select: { name: true } } },
    });
    await prisma.activityLog.create({ data: { message: `Student registered: ${name}` } });
    res.status(201).json({ ...student, instName: student.institution.name, mean: null });
  } catch (err) {
    console.error('[Create Student Error]', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

/* DELETE /api/students/:stuId — ADMIN+ */
router.delete('/:stuId', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.student.delete({ where: { stuId: req.params.stuId } });
    await prisma.activityLog.create({ data: { message: `Student deleted: ${req.params.stuId}` } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Student not found' });
  }
});

export default router;
