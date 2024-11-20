/**
 * Core logging utility that provides standardized logging functionality across the backend application.
 * 
 * Requirements addressed:
 * - Monitoring & Observability: Implements comprehensive application metrics and error tracking
 * - System Performance: Support monitoring of API response times and system performance
 */

import pino from 'pino'; // ^8.0.0
import pinoPretty from 'pino-pretty'; // ^8.0.0
import { BaseError, ErrorCode } from './errors';

// Environment variables
const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';
const NODE_ENV = process.env.NODE_ENV;

/**
 * Creates and configures a new logger instance with appropriate settings based on environment
 * Requirement: Monitoring & Observability - Standardized logging format
 */
const createLogger = () => {
  const baseConfig = {
    name: 'case-interview-platform',
    level: LOG_LEVEL,
    timestamp: true,
    formatters: {
      level: (label: string) => ({ level: label }),
      bindings: (bindings: pino.Bindings) => ({ pid: bindings.pid, host: bindings.hostname }),
    },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res
    }
  };

  // Development-specific configuration with pretty printing
  if (NODE_ENV === 'development') {
    return pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    });
  }

  // Production configuration with JSON output
  return pino(baseConfig);
};

// Create the logger instance
export const logger = createLogger();

/**
 * Logs error details with proper context and stack traces
 * Requirement: Monitoring & Observability - Error tracking with context
 */
export const logError = (error: Error, context: Record<string, any> = {}) => {
  const logData: Record<string, any> = {
    ...context
  };

  if (error instanceof BaseError) {
    logData.errorCode = error.code;
    logData.errorDetails = error.details;
    logData.timestamp = error.timestamp;
  } else {
    logData.errorCode = ErrorCode.INTERNAL_ERROR;
    logData.timestamp = new Date().toISOString();
  }

  // Include stack trace in development
  if (NODE_ENV === 'development') {
    logData.stack = error.stack;
  }

  // Add request tracking ID if available
  if (context.requestId) {
    logData.requestId = context.requestId;
  }

  logger.error(logData, error.message);
};

/**
 * Logs API request details for monitoring and debugging
 * Requirement: System Performance - API response time monitoring
 */
export const logAPIRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number
) => {
  const logData = {
    method,
    path,
    statusCode,
    durationMs: duration,
    timestamp: new Date().toISOString()
  };

  // Log based on status code
  if (statusCode >= 500) {
    logger.error(logData, 'API Request Failed');
  } else if (statusCode >= 400) {
    logger.warn(logData, 'API Request Error');
  } else {
    logger.info(logData, 'API Request Completed');
  }
};

// Export named functions and logger instance
export default {
  logger,
  logError,
  logAPIRequest
};