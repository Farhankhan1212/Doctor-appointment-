import prisma from '../shared/prisma';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

const ADMIN_EMAIL = 'admin@demo.com';
const ADMIN_PASSWORD = 'Admin@12345';

async function main() {
  const approved = await prisma.doctor.updateMany({ data: { approved: true } });
  console.log(`Doctors approved: ${approved.count}`);

  const hashed = bcrypt.hashSync(ADMIN_PASSWORD, 12);
  const existing = await prisma.auth.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    if (existing.role !== UserRole.admin) {
      console.log(`${ADMIN_EMAIL} already exists as a ${existing.role}.`);
      return;
    }
    await prisma.auth.update({ where: { email: ADMIN_EMAIL }, data: { password: hashed } });
    console.log('Admin already existed, password reset.');
  } else {
    await prisma.auth.create({ data: { email: ADMIN_EMAIL, password: hashed, role: UserRole.admin } });
    console.log('Admin created.');
  }
  console.log(`Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}
main()
  .catch((e) => console.error('FAILED:', e.message))
  .finally(() => prisma.$disconnect());