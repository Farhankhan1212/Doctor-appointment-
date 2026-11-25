import "dotenv/config";
import app from "./app";
import { connectDB } from "./shared/db";

const PORT = Number(process.env.PORT) || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on ${PORT}`));
  })
  .catch((e) => {
    console.error("STARTUP ERROR:", e);
    process.exit(1);
  });