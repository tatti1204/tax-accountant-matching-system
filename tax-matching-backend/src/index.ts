import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';
import { config } from './utils/config';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import diagnosisRoutes from './routes/diagnosis';
import matchingRoutes from './routes/matching';
import taxAccountantRoutes from './routes/taxAccountant';
import oauthRoutes from './routes/oauth';
import { OAuthService } from './services/oauth';

// Create Express app
const app: Application = express();

// Trust proxy - important for rate limiting and getting real IPs
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
}));

// Compression middleware
app.use(compression());

// Session middleware (required for OAuth)
app.use(session({
  secret: config.security.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
OAuthService.initializePassport();

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/tax-accountants', taxAccountantRoutes);
app.use('/api/oauth', oauthRoutes);

// Default route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Tax Matching Backend API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${config.nodeEnv} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

export default app;