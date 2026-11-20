// Creates (or resets the password of) the admin login.
// Usage:  npx ts-node --transpile-only src/scripts/seed-admin.ts admin@yourmail.com YourStrongPassword
import prisma from '../shared/prisma';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.log('Usage: npx ts-node --transpile-only src/scripts/seed-admin.ts <email> <password (8+ chars)>');
    return;
  }
  const hashed = bcrypt.hashSync(password, 12);
  const existing = await prisma.auth.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== UserRole.admin) {
      console.log(`${email} already exists as a ${existing.role}. Use a different email.`);
      return;
    }
    await prisma.auth.update({ where: { email }, data: { password: hashed } });
    console.log('Admin password updated.');
    return;
  }
  await prisma.auth.create({ data: { email, password: hashed, role: UserRole.admin } });
  console.log('Admin created. Log in at /login, then open /admin/doctors');
}
main().finally(() => prisma.$disconnect());
