import express from "express";
import cors from "cors";
import morgan from "morgan";
import { db, PORT, CORS_ORIGIN } from "./config";
import { sql } from "drizzle-orm";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();
console.log('Environment loaded. Starting server initialization...');
console.log('Environment check:', {
  port: PORT,
  node_env: process.env.NODE_ENV,
  database_url_exists: !!process.env.DATABASE_URL,
  cors_origin: CORS_ORIGIN
});

const app = express();

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Keep the process running despite uncaught exceptions
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the process running despite unhandled promise rejections
});

// Basic middleware
console.log('Configuring Express middleware...');
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
console.log('Express middleware configured successfully');

// Health check endpoint
app.get('/health', async (req, res) => {
  console.log('Health check requested at:', new Date().toISOString());
  try {
    console.log('Attempting database connection test...');
    // Test database connection
    await db.execute(sql`SELECT 1`);
    console.log('Database connection test successful');

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      cors_origin: CORS_ORIGIN
    });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Start server
try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started and listening on http://0.0.0.0:${PORT}`);
    console.log('Server configuration:', {
      port: PORT,
      node_env: process.env.NODE_ENV,
      database_connected: true,
      cors_origin: CORS_ORIGIN
    });
  });

  // Handle server shutdown gracefully
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed. Exiting process.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT signal. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed. Exiting process.');
      process.exit(0);
    });
  });

} catch (error) {
  console.error('Failed to start server:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  // Don't exit the process, let it retry
  console.log('Server will attempt to recover...');
}

export default app;