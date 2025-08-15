/**
 * Simplified Error Handling for Production
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Simple Error Types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

// Simple Custom Error Class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;

  constructor(message: string, type: ErrorType, statusCode: number = 500) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
  }
}

// Common Error Classes
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, ErrorType.VALIDATION_ERROR, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorType.AUTHENTICATION_ERROR, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ErrorType.AUTHORIZATION_ERROR, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, ErrorType.NOT_FOUND_ERROR, 404);
  }
}

export class PaymentError extends AppError {
  constructor(message: string) {
    super(message, ErrorType.PAYMENT_ERROR, 402);
  }
}

// Simple Error Response
export interface ErrorResponse {
  error: {
    type: string;
    message: string;
    statusCode: number;
    timestamp: string;
  };
}

export function formatErrorResponse(error: Error | AppError): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      error: {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        timestamp,
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
    },
  };
}

// Simple API Error Handler
export function handleApiError(error: Error | AppError) {
  const errorResponse = formatErrorResponse(error);
  
  // Log error for monitoring in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', errorResponse.error);
  }

  return NextResponse.json(errorResponse, {
    status: errorResponse.error.statusCode,
  });
}

// Simple Frontend Error Handler
export function handleFrontendError(error: any): string {
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
  
  if (error?.status >= 500) {
    return 'A server error occurred. Please try again later';
  }
  
  return 'An unexpected error occurred. Please try again';
}