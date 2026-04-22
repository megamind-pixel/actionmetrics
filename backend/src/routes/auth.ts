import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { signToken, hashPassword, comparePassword } from '../lib/auth';
import { authenticate, requireRole, validate } from '../middleware';
import { LoginSchema, RegisterAdminSchema } from '../schemas';

const router = Router();

/* POST /api/auth/login */
router.post('/login', validate(LoginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const ok = await comparePassword(password, admin.passwordHash);
    if (!ok) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    const token = signToken({ adminId: admin.id, email: admin.email, role: admin.role });
    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/* GET /api/auth/me */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user!.adminId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }
    res.json(admin);
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/* POST /api/auth/register — SUPER only */
router.post('/register',
  authenticate,
  requireRole('SUPER'),
  validate(RegisterAdminSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body;
      const exists = await prisma.admin.findUnique({ where: { email } });
      if (exists) { res.status(400).json({ error: 'Email already registered' }); return; }
      const passwordHash = await hashPassword(password);
      const admin = await prisma.admin.create({
        data: { name, email, passwordHash, role },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      res.status(201).json(admin);
    } catch {
      res.status(500).json({ error: 'Failed to create admin' });
    }
  }
);

/* GET /api/auth/admins — SUPER only */
router.get('/admins', authenticate, requireRole('SUPER'), async (_req: Request, res: Response) => {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(admins);
  } catch {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

/* DELETE /api/auth/admins/:id — SUPER only */
router.delete('/admins/:id', authenticate, requireRole('SUPER'), async (req: Request, res: Response) => {
  try {
    if (req.user!.adminId === req.params.id) {
      res.status(400).json({ error: 'Cannot delete your own account' }); return;
    }
    await prisma.admin.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Admin not found' });
  }
});

export default router;
