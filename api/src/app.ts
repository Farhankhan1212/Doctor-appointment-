import express, {
    Application,
    NextFunction,
    Request,
    Response,
} from 'express';

import cors from 'cors';
import CookieParser from 'cookie-parser';
import httpStatus from 'http-status';

import ApiError from './errors/apiError';
import router from './app/routes';
import config from './config';

const app: Application = express();

// CORS configuration
app.use(cors({
    origin: [
        config.clientUrl,
        process.env.CLIENT_LOCAL_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ].filter(Boolean) as string[],
    credentials: true,
}));
// Middlewares
app.use(CookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Favicon
app.get('/favicon.ico', (req: Request, res: Response) => {
    res.status(204).end();
});

// Backend health check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Doctor Appointment API is running!',
        status: 'OK',
    });
});

// Root route
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Doctor Appointment Backend API',
        health: '/health',
        api: '/api/v1',
    });
});

// API routes
app.use('/api/v1', router);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Global error handler
app.use((
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log('=== SERVER ERROR ===', err);

    const statusCode = err instanceof ApiError
        ? err.statusCode
        : httpStatus.INTERNAL_SERVER_ERROR;

    const message = err instanceof ApiError
        ? err.message
        : (err?.message || 'Something Went Wrong');

    res.status(statusCode).json({
        success: false,
        message,
    });
});

export default app;