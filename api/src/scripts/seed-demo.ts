// DEMO DATA for portfolio / interview. Everything here is fictional sample data.
// Creates: 30 Lucknow-style doctors (approved), weekly time slots, 6 demo patients,
// and reviews so ratings on the doctor cards are real numbers.
// Safe to run again: existing emails are skipped.
//
// Run (one line):  npx ts-node --transpile-only src/scripts/seed-demo.ts
//
// Logins created:
//   doctor : amit.verma@demo.com   / Doctor@123   (every demo doctor uses Doctor@123)
//   patient: patient1@demo.com     / Patient@123
import prisma from '../shared/prisma';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

const DOCTOR_PASSWORD = 'Doctor@123';
const PATIENT_PASSWORD = 'Patient@123';

// speciality names match the filter list on the website
const specs: Record<string, { fee: number; degree: string; word: string }> = {
  Cardiologist: { fee: 900, degree: 'MBBS, MD, DM (Cardiology)', word: 'Heart' },
  Dentist: { fee: 500, degree: 'BDS, MDS', word: 'Dental' },
  Dermatologist: { fee: 700, degree: 'MBBS, MD (Dermatology)', word: 'Skin' },
  Gynecologist: { fee: 800, degree: 'MBBS, MS (Obstetrics & Gynaecology)', word: 'Women Care' },
  'Orthopedic Surgeon': { fee: 800, degree: 'MBBS, MS (Orthopaedics)', word: 'Bone & Joint' },
  Pediatrician: { fee: 600, degree: 'MBBS, MD (Paediatrics)', word: 'Child Care' },
  Neurologist: { fee: 1000, degree: 'MBBS, MD, DM (Neurology)', word: 'Neuro' },
  ENT: { fee: 600, degree: 'MBBS, MS (ENT)', word: 'ENT' },
  Ophthalmologist: { fee: 600, degree: 'MBBS, MS (Ophthalmology)', word: 'Eye' },
  'General Physician': { fee: 400, degree: 'MBBS, MD (Medicine)', word: 'Family' },
  Gastroenterologist: { fee: 900, degree: 'MBBS, MD, DM (Gastroenterology)', word: 'Digestive' },
};

// [first, last, gender, speciality]
const doctors: [string, string, 'male' | 'female', string][] = [
  ['Amit', 'Verma', 'male', 'Cardiologist'],
  ['Saurabh', 'Tripathi', 'male', 'Cardiologist'],
  ['Meenal', 'Johri', 'female', 'Cardiologist'],
  ['Anjali', 'Singh', 'female', 'Dentist'],
  ['Rohit', 'Chauhan', 'male', 'Dentist'],
  ['Farah', 'Naqvi', 'female', 'Dentist'],
  ['Kunal', 'Saxena', 'male', 'Dentist'],
  ['Neha', 'Tiwari', 'female', 'Dermatologist'],
  ['Harsh', 'Bajpai', 'male', 'Dermatologist'],
  ['Swati', 'Bhatnagar', 'female', 'Dermatologist'],
  ['Sunita', 'Srivastava', 'female', 'Gynecologist'],
  ['Kavita', 'Dixit', 'female', 'Gynecologist'],
  ['Nidhi', 'Rathore', 'female', 'Gynecologist'],
  ['Rahul', 'Mishra', 'male', 'Orthopedic Surgeon'],
  ['Nitin', 'Awasthi', 'male', 'Orthopedic Surgeon'],
  ['Pankaj', 'Shukla', 'male', 'Orthopedic Surgeon'],
  ['Pooja', 'Agarwal', 'female', 'Pediatrician'],
  ['Ritu', 'Kapoor', 'female', 'Pediatrician'],
  ['Faisal', 'Ansari', 'male', 'Pediatrician'],
  ['Vikas', 'Pandey', 'male', 'Neurologist'],
  ['Shweta', 'Mehrotra', 'female', 'Neurologist'],
  ['Imran', 'Siddiqui', 'male', 'ENT'],
  ['Priya', 'Nigam', 'female', 'ENT'],
  ['Manish', 'Dubey', 'male', 'Ophthalmologist'],
  ['Aarti', 'Tandon', 'female', 'Ophthalmologist'],
  ['Arvind', 'Srivastava', 'male', 'General Physician'],
  ['Deepak', 'Yadav', 'male', 'General Physician'],
  ['Shalini', 'Pathak', 'female', 'General Physician'],
  ['Sandeep', 'Gupta', 'male', 'Gastroenterologist'],
  ['Aditya', 'Rastogi', 'male', 'Gastroenterologist'],
];

const areas = [
  'Hazratganj', 'Gomti Nagar', 'Aliganj', 'Indira Nagar', 'Alambagh', 'Mahanagar', 'Charbagh',
  'Aminabad', 'Rajajipuram', 'Vikas Nagar', 'Jankipuram', 'Kapoorthala', 'Vibhuti Khand', 'Chowk',
];
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const patients = [
  ['Rakesh', 'Kumar'], ['Pooja', 'Rani'], ['Mohit', 'Verma'],
  ['Sana', 'Khan'], ['Ankit', 'Mishra'], ['Divya', 'Singh'],
];
const comments = [
  'Explained everything clearly and did not rush the visit.',
  'Very patient and friendly. Clinic was clean and on time.',
  'Good diagnosis, medicines worked well.',
  'Waiting time was a little long but the consultation was worth it.',
  'Highly recommended, will visit again.',
  'Helpful staff and easy appointment booking.',
];

// small deterministic pseudo-random so every run gives the same data
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];

async function main() {
  const doctorHash = bcrypt.hashSync(DOCTOR_PASSWORD, 12);
  const patientHash = bcrypt.hashSync(PATIENT_PASSWORD, 12);

  // demo patients
  const patientIds: string[] = [];
  for (let i = 0; i < patients.length; i++) {
    const [firstName, lastName] = patients[i];
    const email = `patient${i + 1}@demo.com`;
    let auth = await prisma.auth.findUnique({ where: { email } });
    if (!auth) {
      const p = await prisma.patient.create({
        data: { firstName, lastName, email, city: 'Lucknow', state: 'Uttar Pradesh', country: 'India' },
      });
      await prisma.auth.create({ data: { email, password: patientHash, role: UserRole.patient, userId: p.id } });
      patientIds.push(p.id);
    } else if (auth.userId) {
      patientIds.push(auth.userId);
    }
  }

  let created = 0;
  for (let i = 0; i < doctors.length; i++) {
    const [firstName, lastName, gender, speciality] = doctors[i];
    const email = `${firstName}.${lastName}@demo.com`.toLowerCase();
    if (await prisma.auth.findUnique({ where: { email } })) continue;

    const s = specs[speciality];
    const area = areas[i % areas.length];
    const experience = 4 + Math.floor(rnd() * 22);
    const doc = await prisma.doctor.create({
      data: {
        firstName, lastName, email, gender,
        phone: `90000${String(10000 + i).slice(-5)}`,
        specialization: speciality,
        services: speciality,
        degree: s.degree,
        college: 'Demo Institute of Medical Sciences',
        designation: `Consultant ${speciality}`,
        experience: String(experience),
        price: String(s.fee),
        registration: `DEMO-${String(i + 1).padStart(4, '0')}`,
        biography: `Demo profile. Dr. ${firstName} ${lastName} is a sample ${speciality.toLowerCase()} created for demonstration purposes only.`,
        clinicName: `${lastName} ${s.word} Clinic`,
        clinicAddress: `${area}, Lucknow`,
        address: `${area}, Lucknow`,
        city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', postalCode: '2260' + String(10 + (i % 20)),
        verified: true, approved: true,
      },
    });
    await prisma.auth.create({ data: { email, password: doctorHash, role: UserRole.doctor, userId: doc.id } });

    // weekly time slots: 5 working days, morning + evening
    const start = i % 3; // rotate the weekly off-days a little
    const working = [0, 1, 2, 3, 4, 5].map((n) => days[(start + n) % 7]).slice(0, 5);
    for (const day of working) {
      await prisma.doctorTimeSlot.create({
        data: {
          doctorId: doc.id,
          day: day as any,
          weekDay: cap(day),
          maximumPatient: 20,
          timeSlot: {
            create: [
              { startTime: '10:00 AM', endTime: '01:00 PM' },
              { startTime: '05:00 PM', endTime: '08:00 PM' },
            ],
          },
        },
      });
    }

    // 2 to 5 reviews from the demo patients
    const reviewCount = 2 + Math.floor(rnd() * 4);
    for (let r = 0; r < reviewCount && patientIds.length; r++) {
      const star = rnd() < 0.7 ? 5 : rnd() < 0.7 ? 4 : 3;
      await prisma.reviews.create({
        data: {
          doctorId: doc.id,
          patientId: patientIds[r % patientIds.length],
          description: pick(comments),
          star: String(star),
          isRecommended: star >= 4,
        },
      });
    }
    created++;
  }
  console.log(`Demo doctors created: ${created} (skipped existing)`);
  console.log(`Doctor login : amit.verma@demo.com / ${DOCTOR_PASSWORD}`);
  console.log(`Patient login: patient1@demo.com / ${PATIENT_PASSWORD}`);
}

main()
  .catch((e) => console.error('FAILED:', e.message))
  .finally(() => prisma.$disconnect());
