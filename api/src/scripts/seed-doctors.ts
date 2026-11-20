// DEMO ONLY: fictional Lucknow-style doctors so the site is not empty.
// Delete them (admin panel or pgAdmin) before a real launch.
import prisma from '../shared/prisma';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

const areas = ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Indira Nagar', 'Alambagh', 'Mahanagar', 'Charbagh', 'Aminabad'];
const doctors = [
  ['Amit', 'Verma', 'Cardiologist', 'MBBS, MD'],
  ['Sunita', 'Srivastava', 'Gynecologist', 'MBBS, MS'],
  ['Rahul', 'Mishra', 'Orthopedic Surgeon', 'MBBS, MS'],
  ['Neha', 'Tiwari', 'Dermatologist', 'MBBS, MD'],
  ['Vikas', 'Pandey', 'Neurologist', 'MBBS, DM'],
  ['Pooja', 'Agarwal', 'Pediatrician', 'MBBS, MD'],
  ['Imran', 'Siddiqui', 'ENT', 'MBBS, MS'],
  ['Anjali', 'Singh', 'Dentist', 'BDS, MDS'],
];

async function main() {
  const password = bcrypt.hashSync('Doctor@123', 12);
  for (let i = 0; i < doctors.length; i++) {
    const [firstName, lastName, specialization, degree] = doctors[i];
    const email = `${firstName}.${lastName}@demo.com`.toLowerCase();
    if (await prisma.auth.findUnique({ where: { email } })) continue;
    const doc = await prisma.doctor.create({
      data: {
        firstName, lastName, email, specialization, degree,
        services: specialization,
        city: 'Lucknow', state: 'Uttar Pradesh', country: 'India',
        address: `${areas[i]}, Lucknow`,
        clinicName: `${lastName} Clinic`, clinicAddress: `${areas[i]}, Lucknow`,
        price: '500', experience: '10',
        verified: true, approved: true,
      },
    });
    await prisma.auth.create({
      data: { email, password, role: UserRole.doctor, userId: doc.id },
    });
  }
  console.log('Done');
}
main().finally(() => prisma.$disconnect());
