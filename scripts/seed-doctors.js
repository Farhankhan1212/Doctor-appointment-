"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./src/shared/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const areas = ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Indira Nagar', 'Alambagh', 'Mahanagar', 'Charbagh', 'Aminabad'];
const doctors = [
    ['Amit', 'Verma', 'Cardiology', 'MBBS, MD'],
    ['Sunita', 'Srivastava', 'Gynecology', 'MBBS, MS'],
    ['Rahul', 'Mishra', 'Orthopedics', 'MBBS, MS'],
    ['Neha', 'Tiwari', 'Dermatology', 'MBBS, MD'],
    ['Vikas', 'Pandey', 'Neurology', 'MBBS, DM'],
    ['Pooja', 'Agarwal', 'Pediatrics', 'MBBS, MD'],
    ['Imran', 'Siddiqui', 'ENT', 'MBBS, MS'],
    ['Anjali', 'Singh', 'Dentist', 'BDS, MDS'],
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const password = bcrypt_1.default.hashSync('Doctor@123', 12);
        for (let i = 0; i < doctors.length; i++) {
            const [firstName, lastName, specialization, degree] = doctors[i];
            const email = `${firstName}.${lastName}@demo.com`.toLowerCase();
            if (yield prisma_1.default.auth.findUnique({ where: { email } }))
                continue;
            const doc = yield prisma_1.default.doctor.create({
                data: {
                    firstName, lastName, email, specialization, degree,
                    city: 'Lucknow', state: 'Uttar Pradesh', country: 'India',
                    address: `${areas[i]}, Lucknow`,
                    clinicName: `${lastName} Clinic`, clinicAddress: `${areas[i]}, Lucknow`,
                    price: '500', experience: '10', verified: true,
                },
            });
            yield prisma_1.default.auth.create({
                data: { email, password, role: client_1.UserRole.doctor, userId: doc.id },
            });
        }
        console.log('Done');
    });
}
main().finally(() => prisma_1.default.$disconnect());
