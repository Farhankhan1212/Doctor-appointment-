export const UserRole = { admin: 'admin', patient: 'patient', doctor: 'doctor' } as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const paymentStatus = { paid: 'paid', unpaid: 'unpaid' } as const;
export type paymentStatus = (typeof paymentStatus)[keyof typeof paymentStatus];
