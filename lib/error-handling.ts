/**
 * Comprehensive Error Handling for Saga AI Coach
 * Provides standardized error handling across the application
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Error Types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
}

// Custom Error Classes
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.VALIDATION_ERROR, 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, ErrorType.AUTHENTICATION_ERROR, 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, ErrorType.AUTHORIZATION_ERROR, 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, ErrorType.NOT_FOUND_ERROR, 404, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number, context?: Record<string, any>) {
    super(message, ErrorType.RATE_LIMIT_ERROR, 429, true, { retryAfter, ...context });
  }
}

export class PaymentError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.PAYMENT_ERROR, 402, true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, any>) {
    super(`${service} service error: ${message}`, ErrorType.EXTERNAL_SERVICE_ERROR, 503, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.DATABASE_ERROR, 500, true, context);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorType.FILE_UPLOAD_ERROR, 400, true, context);
  }
}

// Error Response Formatter
export interface ErrorResponse {
  error: {
    type: string;
    message: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
    context?: Record<string, any>;
    suggestions?: string[];
  };
}

export function formatErrorResponse(
  error: Error | AppError,
  requestId?: string,
  includeStack: boolean = false
): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      error: {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        timestamp,
        requestId,
        context: error.context,
        suggestions: getErrorSuggestions(error.type),
        ...(includeStack && { stack: error.stack }),
      },
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Validation failed',
        statusCode: 400,
        timestamp,
        requestId,
        context: {
          validationErrors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        },
        suggestions: ['Please check your input and try again', 'Ensure all required fields are provided'],
      },
    };
  }

  // Handle unknown errors
  return {
    error: {
      type: ErrorType.INTERNAL_SERVER_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message || 'Unknown error',
      statusCode: 500,
      timestamp,
      requestId,
      suggestions: ['Please try again later', 'Contact support if the problem persists'],
      ...(includeStack && { stack: error.stack }),
    },
  };
}

// Error Suggestions
function getErrorSuggestions(errorType: ErrorType): string[] {
  switch (errorType) {
    case ErrorType.AUTHENTICATION_ERROR:
      return [
        'Please sign in to continue',
        'Check if your session has expired',
        'Try refreshing the page and signing in again',
      ];
    
    case ErrorType.AUTHORIZATION_ERROR:
      return [
        'You may need to upgrade your subscription',
        'Contact an administrator for access',
        'Ensure you have the required permissions',
      ];
    
    case ErrorType.VALIDATION_ERROR:
      return [
        'Check that all required fields are filled',
        'Ensure data formats are correct',
        'Review the validation requirements',
      ];
    
    case ErrorType.RATE_LIMIT_ERROR:
      return [
        'Wait a moment before trying again',
        'Consider upgrading for higher limits',
        'Spread out your requests over time',
      ];
    
    case ErrorType.PAYMENT_ERROR:
      return [
        'Check your payment method details',
        'Ensure sufficient funds are available',
        'Contact your bank if issues persist',
        'Try a different payment method',
      ];
    
    case ErrorType.EXTERNAL_SERVICE_ERROR:
      return [
        'This is likely a temporary issue',
        'Try again in a few minutes',
        'Contact support if the problem continues',
      ];
    
    default:
      return [
        'Please try again',
        'Contact support if the problem persists',
        'Check your internet connection',
      ];
  }
}

// API Error Handler
export function createApiErrorHandler() {
  return (error: Error | AppError, requestId?: string) => {
    const includeStack = process.env.NODE_ENV !== 'production';
    const errorResponse = formatErrorResponse(error, requestId, includeStack);
    
    // Log error for monitoring
    console.error('API Error:', {
      ...errorResponse.error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId || 'unknown',
      },
    });
  };
}

// Async Error Handler Wrapper
export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // Convert unknown errors to AppError
      console.error('Unexpected error:', error);
      throw new AppError(
        process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : (error as Error).message || 'Unknown error',
        ErrorType.INTERNAL_SERVER_ERROR,
        500,
        false,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  };
}

// Frontend Error Handler
export class FrontendErrorHandler {
  static handleError(error: any, context?: string) {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    // In production, you might want to send errors to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToLoggingService(error, context);
    }
    
    return this.getUserFriendlyMessage(error);
  }
  
  static getUserFriendlyMessage(error: any): string {
    if (error?.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.status === 401) {
      return 'Please sign in to continue';
    }
    
    if (error?.status === 403) {
      return 'You don\'t have permission to perform this action';
    }
    
    if (error?.status === 404) {
      return 'The requested resource was not found';
    }
    
    if (error?.status === 429) {
      return 'Too many requests. Please wait a moment and try again';
    }
    
    if (error?.status >= 500) {
      return 'A server error occurred. Please try again later';
    }
    
    return 'An unexpected error occurred. Please try again';
  }
}

// Retry Logic
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain error types
      if (error instanceof ValidationError || 
          error instanceof AuthenticationError || 
          error instanceof AuthorizationError ||
          error instanceof NotFoundError) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

// Request ID Generator
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Health Check Error Handler
export class HealthCheckError extends AppError {
  constructor(service: string, details?: Record<string, any>) {
    super(
      `Health check failed for ${service}`,
      ErrorType.EXTERNAL_SERVICE_ERROR,
      503,
      true,
      { service, ...details }
    );
  }
}