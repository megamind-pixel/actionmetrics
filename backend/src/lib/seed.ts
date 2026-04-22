import 'dotenv/config';
import prisma from './prisma';
import { hashPassword } from './auth';

async function main() {
  const email = process.env.SEED_EMAIL ?? 'admin@actionmetrics.ke';
  const password = process.env.SEED_PASSWORD ?? 'Admin1234!';

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`⚠️  Admin already exists: ${email}`);
    return;
  }

  const admin = await prisma.admin.create({
    data: {
      name: 'Super Admin',
      email,
      passwordHash: await hashPassword(password),
      role: 'SUPER',
    },
  });

  console.log('✅ Seed complete!');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ${admin.role}`);
  console.log('\n   Change this password after first login!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
