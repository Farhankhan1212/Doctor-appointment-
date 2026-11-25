import app from "./app";
import { connectDB } from "./shared/db";

let connecting: Promise<void> | null = null;

export default async function handler(req: any, res: any) {
    if (!connecting) {
        connecting = connectDB().catch((e) => {
            connecting = null;
            throw e;
        });
    }
    await connecting;
    return app(req, res);
}
