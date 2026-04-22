import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware';

const router = Router();

/* GET /api/analytics/overview */
router.get('/overview', authenticate, async (_req: Request, res: Response) => {
  try {
    const [institutions, students, results, activity] = await Promise.all([
      prisma.institution.count(),
      prisma.student.count(),
      prisma.result.count(),
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    const agg = await prisma.result.aggregate({ _avg: { normalised: true } });
    res.json({ institutions, students, results, system_avg: agg._avg.normalised, activity });
  } catch {
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

/* GET /api/analytics/levels */
router.get('/levels', authenticate, async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<{ level: string; students: bigint; avg: number | null }[]>`
      SELECT s.level,
        COUNT(DISTINCT s."stuId") AS students,
        AVG(r.normalised)::float AS avg
      FROM students s
      LEFT JOIN results r ON r."stuId" = s."stuId"
      GROUP BY s.level
    `;
    res.json(rows.map(r => ({ ...r, students: Number(r.students) })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch level analytics' });
  }
});

/* GET /api/analytics/institutions?type= */
router.get('/institutions', authenticate, async (req: Request, res: Response) => {
  try {
    const { type } = req.query as { type?: string };
    const where = type && type !== 'all' ? `WHERE i.type = '${type}'` : '';
    const rows = await prisma.$queryRawUnsafe<{ instId: string; name: string; type: string; county: string | null; students: bigint; avg: number | null }[]>(`
      SELECT i."instId", i.name, i.type, i.county,
        COUNT(DISTINCT s."stuId") AS students,
        AVG(r.normalised)::float AS avg
      FROM institutions i
      LEFT JOIN students s ON s."instId" = i."instId"
      LEFT JOIN results r ON r."stuId" = s."stuId"
      ${where}
      GROUP BY i."instId", i.name, i.type, i.county
      ORDER BY avg DESC NULLS LAST
    `);
    res.json(rows.map(r => ({ ...r, students: Number(r.students) })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch institution analytics' });
  }
});

/* GET /api/analytics/subjects */
router.get('/subjects', authenticate, async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<{ subject: string; count: bigint; avg: number; min: number; max: number }[]>`
      SELECT subject,
        COUNT(*)::bigint AS count,
        AVG(normalised)::float AS avg,
        MIN(normalised)::float AS min,
        MAX(normalised)::float AS max
      FROM results
      GROUP BY subject
      ORDER BY avg DESC
    `;
    res.json(rows.map(r => ({ ...r, count: Number(r.count) })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch subject analytics' });
  }
});

/* GET /api/analytics/trends */
router.get('/trends', authenticate, async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<{ term: string; year: string; level: string; avg: number; count: bigint }[]>`
      SELECT r.term, r.year, s.level,
        AVG(r.normalised)::float AS avg,
        COUNT(*)::bigint AS count
      FROM results r
      JOIN students s ON s."stuId" = r."stuId"
      GROUP BY r.term, r.year, s.level
      ORDER BY r.year, r.term, s.level
    `;
    res.json(rows.map(r => ({ ...r, count: Number(r.count) })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

/* GET /api/analytics/distribution */
router.get('/distribution', authenticate, async (_req: Request, res: Response) => {
  try {
    const row = await prisma.$queryRaw<{ fail: bigint; pass: bigint; merit: bigint; distinction: bigint }[]>`
      SELECT
        COUNT(*) FILTER (WHERE normalised < 50) AS fail,
        COUNT(*) FILTER (WHERE normalised >= 50 AND normalised < 70) AS pass,
        COUNT(*) FILTER (WHERE normalised >= 70 AND normalised < 90) AS merit,
        COUNT(*) FILTER (WHERE normalised >= 90) AS distinction
      FROM results
    `;
    const r = row[0];
    res.json({ fail: Number(r.fail), pass: Number(r.pass), merit: Number(r.merit), distinction: Number(r.distinction) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch distribution' });
  }
});

/* GET /api/analytics/individual/:stuId */
router.get('/individual/:stuId', authenticate, async (req: Request, res: Response) => {
  try {
    const { stuId } = req.params;
    const student = await prisma.student.findUnique({
      where: { stuId },
      include: { institution: { select: { name: true } } },
    });
    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    const [subjects, trends, classmates] = await Promise.all([
      prisma.$queryRaw<{ subject: string; avg: number; count: bigint }[]>`
        SELECT subject, AVG(normalised)::float AS avg, COUNT(*)::bigint AS count
        FROM results WHERE "stuId" = ${stuId}
        GROUP BY subject ORDER BY avg DESC
      `,
      prisma.$queryRaw<{ term: string; year: string; avg: number }[]>`
        SELECT term, year, AVG(normalised)::float AS avg
        FROM results WHERE "stuId" = ${stuId}
        GROUP BY term, year ORDER BY year, term
      `,
      prisma.$queryRaw<{ stuId: string; mean: number }[]>`
        SELECT r."stuId", AVG(r.normalised)::float AS mean
        FROM results r
        JOIN students s ON s."stuId" = r."stuId"
        WHERE s.class = ${student.class} AND s."instId" = ${student.instId}
        GROUP BY r."stuId"
        ORDER BY mean DESC
      `,
    ]);

    const agg = await prisma.result.aggregate({ where: { stuId }, _avg: { normalised: true } });
    const rank = classmates.findIndex(c => c.stuId === stuId) + 1;

    res.json({
      profile: { ...student, instName: student.institution.name, mean: agg._avg.normalised },
      subjects: subjects.map(s => ({ ...s, count: Number(s.count) })),
      trends,
      rank,
      class_size: classmates.length,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch individual analytics' });
  }
});

export default router;
