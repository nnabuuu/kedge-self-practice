import { HttpException, HttpStatus } from '@nestjs/common';
import { z } from 'zod';

export class AppError extends HttpException {
  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly code?: string
  ) {
    super(
      {
        message,
        code,
        statusCode,
        timestamp: new Date().toISOString(),
      },
      statusCode
    );
  }
}

export class ValidationError extends AppError {
  public readonly errors: z.ZodError['errors'];

  constructor(message: string, errors: z.ZodError['errors']) {
    super(message, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR');
  }
}

export class RedisError extends AppError {
  constructor(message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'REDIS_ERROR');
  }
}

export class NodeNotFoundError extends AppError {
  constructor(nodeId: string) {
    super(`Node ${nodeId} not found`, HttpStatus.NOT_FOUND, 'NODE_NOT_FOUND');
  }
}

export class NodeOfflineError extends AppError {
  constructor(nodeId: string) {
    super(`Node ${nodeId} is offline`, HttpStatus.SERVICE_UNAVAILABLE, 'NODE_OFFLINE');
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return new ValidationError('Validation failed', error.errors);
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('An unknown error occurred');
}; 