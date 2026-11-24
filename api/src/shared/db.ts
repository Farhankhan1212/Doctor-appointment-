import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
  console.log("MongoDB connected");

  // The first Mongo version of the Favourites schema had a unique index on doctorId alone.
  // Drop it if it is still there; the (doctorId, patientId) index replaces it.
  try {
    await mongoose.connection.collection("Favourites").dropIndex("doctorId_1");
  } catch {
    /* index (or collection) does not exist - nothing to do */
  }
}
