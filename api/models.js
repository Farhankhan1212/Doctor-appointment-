// Mongoose models converted from prisma/schema.prisma
// Usage: const { Doctor, Appointments } = require("./models");
const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const { ObjectId } = Schema.Types;

// Common options: createdAt/updatedAt + expose `id` (string) and hide `_id`/`__v`
// so the React frontend that already uses `.id` keeps working.
const opts = {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false, transform: (_d, r) => { delete r._id; } },
  toObject: { virtuals: true },
};

// Helper: virtual relation, so `populate("doctor")` works like Prisma's include: { doctor: true }
const rel = (schema, name, ref, localField, justOne = true) =>
  schema.virtual(name, { ref, localField, foreignField: "_id", justOne });

// ---------- Auth & tokens ----------
const authSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userId: { type: ObjectId }, // points to Patient or Doctor _id
    role: { type: String, enum: ["admin", "patient", "doctor"], required: true },
  },
  { ...opts, collection: "Auth" }
);

const userVerificationSchema = new Schema(
  {
    userId: { type: ObjectId, required: true },
    uniqueString: String,
    expiresAt: Date,
  },
  opts
);

const forgotPasswordSchema = new Schema(
  {
    userId: { type: ObjectId, required: true },
    uniqueString: String,
    expiresAt: Date,
  },
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
// Prisma back-relations: appointments, Reviews, Prescription, favourites
["Appointments:appointments", "Reviews:Reviews", "Prescription:Prescription", "Favourites:favourites"].forEach((s) => {
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
 "DoctorTimeSlot:DoctorTimeSlot", "Blogs:blogs", "Reviews:reviews"].forEach((s) => {
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
// unique only when trackingId is a real string (Prisma allows many NULLs on unique)
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
    doctorId: { type: ObjectId, ref: "Doctor", required: true, unique: true },
    patientId: { type: ObjectId, ref: "Patient" },
  },
  { ...opts, collection: "Favourites" }
);
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

module.exports = {
  Auth: model("Auth", authSchema),
  UserVerfication: model("UserVerfication", userVerificationSchema),
  ForgotPassword: model("ForgotPassword", forgotPasswordSchema),
  Patient: model("Patient", patientSchema),
  Doctor: model("Doctor", doctorSchema),
  Appointments: model("Appointments", appointmentSchema),
  Payment: model("Payment", paymentSchema),
  Reviews: model("Reviews", reviewSchema),
  Prescription: model("Prescription", prescriptionSchema),
  Favourites: model("Favourites", favouriteSchema),
  DoctorTimeSlot: model("DoctorTimeSlot", doctorTimeSlotSchema),
  Blogs: model("Blogs", blogSchema),
};
