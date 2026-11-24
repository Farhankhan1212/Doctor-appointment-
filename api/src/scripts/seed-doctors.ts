// DEMO ONLY: fictional Lucknow-style doctors so the site is not empty.
// Usage (from the api folder):
//   node --env-file=.env -r ts-node/register/transpile-only src/scripts/seed-doctors.ts
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB } from '../shared/db';
import { Auth, Doctor, DoctorTimeSlot } from '../shared/models';
import { UserRole } from '../shared/enums';
const areas = ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Indira Nagar', 'Alambagh', 'Mahanagar', 'Charbagh', 'Aminabad'];
const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
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
// Mon-Sat, 09:00 am - 01:00 pm and 02:00 pm - 06:00 pm, in 30 minute bookable slots
async function ensureSlots(doctorId: any) {
  if (!doctorId) return;
  for (const day of weekDays) {
    if (await DoctorTimeSlot.exists({ doctorId, day })) continue;
    await DoctorTimeSlot.create({
      doctorId, day, weekDay: day, maximumPatient: 16,
      timeSlot: [
        { startTime: '09:00 am', endTime: '01:00 pm' },
        { startTime: '02:00 pm', endTime: '06:00 pm' },
      ],
    });
  }
}

async function main() {
  await connectDB();
  const password = await bcrypt.hash('Doctor@123', 12);
  for (let i = 0; i < doctors.length; i++) {
    const [firstName, lastName, specialization, degree] = doctors[i];
    const email = `${firstName}.${lastName}@demo.com`.toLowerCase();
    const existing = await Auth.findOne({ email });
    if (existing) {
      // doctor already seeded earlier: just make sure the booking page has slots for them
      await ensureSlots(existing.userId);
      continue;
    }
    const doc = await Doctor.create({
      firstName, lastName, email, specialization, degree,
      services: specialization,
      city: 'Lucknow', state: 'Uttar Pradesh', country: 'India',
      address: `${areas[i]}, Lucknow`,
      clinicName: `${lastName} Clinic`, clinicAddress: `${areas[i]}, Lucknow`,
      price: '500', experience: '10',
      verified: true, approved: true,
    });
    await Auth.create({ email, password, role: UserRole.doctor, userId: doc._id });
    await ensureSlots(doc._id);
  }
  console.log('Done');
}
main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
