// Creates (or resets the password of) the admin login.
// Usage (from the api folder):
//   node --env-file=.env -r ts-node/register/transpile-only src/scripts/seed-admin.ts admin@yourmail.com YourStrongPassword
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB } from '../shared/db';
import { Auth } from '../shared/models';
import { UserRole } from '../shared/enums';
async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.log('Usage: node --env-file=.env -r ts-node/register/transpile-only src/scripts/seed-admin.ts <email> <password (8+ chars)>');
    return;
  }
  await connectDB();
  const hashed = await bcrypt.hash(password, 12);
  const existing = await Auth.findOne({ email });
  if (existing) {
    if (existing.role !== UserRole.admin) {
      console.log(`${email} already exists as a ${existing.role}. Use a different email.`);
      return;
    }
    existing.password = hashed;
    await existing.save();
    console.log('Admin password updated.');
    return;
  }
  await Auth.create({ email, password: hashed, role: UserRole.admin });
  console.log('Admin created. Log in at /login, then open /admin/doctors');
}
main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
