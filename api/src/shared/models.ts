// Mongoose models converted from prisma/schema.prisma
import mongoose, { Schema, model } from "mongoose";
const { ObjectId } = Schema.Types;

const opts = {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false, transform: (_d: any, r: any) => { delete r._id; } },
  toObject: { virtuals: true },
};

const rel = (schema: Schema, name: string, ref: string, localField: string, justOne = true) =>
  schema.virtual(name, { ref, localField, foreignField: "_id", justOne });

// ---------- Auth & tokens ----------
const authSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userId: { type: ObjectId },
    role: { type: String, enum: ["admin", "patient", "doctor"], required: true },
  },
  { ...opts, collection: "Auth" }
);

const userVerificationSchema = new Schema(
  { userId: { type: ObjectId, required: true }, uniqueString: String, expiresAt: Date },
  opts
);

const forgotPasswordSchema = new Schema(
  { userId: { type: ObjectId, required: true }, uniqueString: String, expiresAt: Date },
  { ...opts, collection: "forgot-password" }
);

// ---------- Patient ----------
const patientSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    bloodGroup: String,
    mobile: String,
    city: String,
    state: String,
    zipCode: String,
    gender: String,
    country: String,
    email: { type: String, required: true, unique: true },
    address: String,
    img: String,
  },
  { ...opts, collection: "Patient" }
);
["Appointments:appointments", "Reviews:Reviews", "Prescription:Prescription", "Favourites:favourites"].forEach((s: string) => {
  const [ref, name] = s.split(":");
  patientSchema.virtual(name, { ref, localField: "_id", foreignField: "patientId" });
});

// ---------- Doctor ----------
const doctorSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: String,
    img: String,
    phone: String,
    gender: { type: String, enum: ["male", "female"] },
    dob: String,
    biography: String,
    clinicName: String,
    clinicAddress: String,
    clinicImages: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    price: String,
    services: String,
    specialization: String,
    degree: String,
    college: String,
    completionYear: String,
    experience: String,
    designation: String,
    award: String,
    awardYear: String,
    registration: String,
    year: String,
    experienceHospitalName: String,
    expericenceStart: String,
    expericenceEnd: String,
    verified: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
  },
  { ...opts, collection: "Doctor" }
);
["Appointments:appointments", "Prescription:prescription", "Favourites:favourites",
 "DoctorTimeSlot:DoctorTimeSlot", "Blogs:blogs", "Reviews:reviews"].forEach((s: string) => {
  const [ref, name] = s.split(":");
  doctorSchema.virtual(name, { ref, localField: "_id", foreignField: ref === "Blogs" ? "userId" : "doctorId" });
});

// ---------- Appointments ----------
const appointmentSchema = new Schema(
  {
    patientId: { type: ObjectId, ref: "Patient" },
    doctorId: { type: ObjectId, ref: "Doctor" },
    trackingId: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    description: String,
    scheduleDate: String,
    scheduleTime: String,
    reasonForVisit: String,
    status: { type: String, default: "pending" },
    paymentStatus: { type: String, enum: ["paid", "unpaid"], default: "unpaid" },
    prescriptionStatus: { type: String, enum: ["issued", "notIssued"], default: "notIssued" },
    isFollowUp: { type: Boolean, default: false },
    patientType: String,
  },
  { ...opts, collection: "Appointments" }
);
appointmentSchema.index({ trackingId: 1 }, { unique: true, partialFilterExpression: { trackingId: { $type: "string" } } });
rel(appointmentSchema, "patient", "Patient", "patientId");
rel(appointmentSchema, "doctor", "Doctor", "doctorId");
appointmentSchema.virtual("prescription", { ref: "Prescription", localField: "_id", foreignField: "appointmentId" });
appointmentSchema.virtual("payment", { ref: "Payment", localField: "_id", foreignField: "appointmentId" });

// ---------- Payment ----------
const paymentSchema = new Schema(
  {
    appointmentId: { type: ObjectId, ref: "Appointments", required: true },
    paymentMethod: { type: String, required: true },
    paymentType: { type: String, required: true },
    DoctorFee: { type: Number, required: true },
    bookingFee: { type: Number, required: true },
    vat: Number,
    totalAmount: { type: Number, required: true },
  },
  { ...opts, collection: "Payment" }
);
rel(paymentSchema, "appointment", "Appointments", "appointmentId");

// ---------- Reviews ----------
const reviewSchema = new Schema(
  {
    doctorId: { type: ObjectId, ref: "Doctor", required: true },
    patientId: { type: ObjectId, ref: "Patient", required: true },
    description: String,
    star: String,
    isRecommended: Boolean,
    response: String,
  },
  { ...opts, collection: "Reviews" }
);
rel(reviewSchema, "doctor", "Doctor", "doctorId");
rel(reviewSchema, "patient", "Patient", "patientId");

// ---------- Prescription (medicines embedded) ----------
const medicineSchema = new Schema(
  { medicine: String, dosage: String, frequency: String, duration: String },
  opts
);
const prescriptionSchema = new Schema(
  {
    doctorId: { type: ObjectId, ref: "Doctor", required: true },
    patientId: { type: ObjectId, ref: "Patient", required: true },
    appointmentId: { type: ObjectId, ref: "Appointments", required: true },
    followUpdate: String,
    instruction: String,
    isFullfilled: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    daignosis: String,
    disease: { type: String, required: true },
    test: String,
    medicines: [medicineSchema],
  },
  { ...opts, collection: "Prescription" }
);
rel(prescriptionSchema, "doctor", "Doctor", "doctorId");
rel(prescriptionSchema, "patient", "Patient", "patientId");
rel(prescriptionSchema, "appointment", "Appointments", "appointmentId");

// ---------- Favourites ----------
const favouriteSchema = new Schema(
  {
    doctorId: { type: ObjectId, ref: "Doctor", required: true },
    patientId: { type: ObjectId, ref: "Patient" },
  },
  { ...opts, collection: "Favourites" }
);
// one favourite per (patient, doctor). The old schema made doctorId unique on its own,
// which stopped a second patient from favouriting the same doctor.
favouriteSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });
rel(favouriteSchema, "doctor", "Doctor", "doctorId");
rel(favouriteSchema, "patient", "Patient", "patientId");

// ---------- DoctorTimeSlot (ScheduleDay embedded as timeSlot) ----------
const scheduleDaySchema = new Schema({ startTime: { type: String, required: true }, endTime: { type: String, required: true } }, opts);
const doctorTimeSlotSchema = new Schema(
  {
    doctorId: { type: ObjectId, ref: "Doctor", required: true },
    day: { type: String, enum: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"] },
    timeSlot: [scheduleDaySchema],
    weekDay: String,
    maximumPatient: Number,
  },
  { ...opts, collection: "DoctorTimeSlot" }
);
rel(doctorTimeSlotSchema, "doctor", "Doctor", "doctorId");

// ---------- Blogs ----------
const blogSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    img: String,
    userId: { type: ObjectId, ref: "Doctor", required: true },
  },
  { ...opts, collection: "Blogs" }
);
rel(blogSchema, "user", "Doctor", "userId");

// Reuse an existing model if the file is reloaded (ts-node-dev / hot reload)
const reuse = (name: string, schema: Schema) => mongoose.models[name] || model(name, schema);

export const Auth = reuse("Auth", authSchema);
export const UserVerfication = reuse("UserVerfication", userVerificationSchema);
export const ForgotPassword = reuse("ForgotPassword", forgotPasswordSchema);
export const Patient = reuse("Patient", patientSchema);
export const Doctor = reuse("Doctor", doctorSchema);
export const Appointments = reuse("Appointments", appointmentSchema);
export const Payment = reuse("Payment", paymentSchema);
export const Reviews = reuse("Reviews", reviewSchema);
export const Prescription = reuse("Prescription", prescriptionSchema);
export const Favourites = reuse("Favourites", favouriteSchema);
export const DoctorTimeSlot = reuse("DoctorTimeSlot", doctorTimeSlotSchema);
export const Blogs = reuse("Blogs", blogSchema);