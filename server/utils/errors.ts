import type { H3Error } from 'h3'

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  statusCode: number
  message: string
  timestamp: string
  details?: Record<string, string[]>
}

/**
 * Error context for logging and debugging
 */
export interface ErrorContext {
  route?: string
  userId?: string
  operation?: string
  [key: string]: unknown
}

/**
 * Create a standardized API error
 * 
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code (default: 500)
 * @param details - Optional validation error details
 * @returns NuxtError with standardized format
 */
export function createApiError(
  message: string,
  statusCode: number = 500,
  details?: Record<string, string[]>
) {
  return createError({
    statusCode,
    message,
    data: {
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}),
    },
  })
}

/**
 * Create a validation error with field-specific details
 * 
 * @param message - General error message
 * @param details - Field-specific validation errors
 * @returns Error with 400 status code
 */
export function createValidationError(
  message: string = 'Validation failed',
  details: Record<string, string[]>
) {
  return createApiError(message, 400, details)
}

/**
 * Create an authentication error
 * 
 * @param message - Error message (default: 'Authentication required')
 * @returns Error with 401 status code
 */
export function createAuthError(message: string = 'Authentication required') {
  return createApiError(message, 401)
}

/**
 * Create a not found error
 * 
 * @param resource - The resource that was not found
 * @returns Error with 404 status code
 */
export function createNotFoundError(resource: string = 'Resource') {
  return createApiError(`${resource} not found`, 404)
}

/**
 * Create a conflict error (e.g., duplicate resource)
 * 
 * @param message - Error message
 * @returns Error with 409 status code
 */
export function createConflictError(message: string) {
  return createApiError(message, 409)
}

/**
 * Create a forbidden error
 * 
 * @param message - Error message (default: 'Access denied')
 * @returns Error with 403 status code
 */
export function createForbiddenError(message: string = 'Access denied') {
  return createApiError(message, 403)
}

/**
 * Handle and log API errors with context
 * 
 * @param error - The caught error
 * @param context - Context information for logging
 * @returns Error with standardized format
 */
export function handleApiError(error: unknown, context: ErrorContext = {}) {
  // If it's already an H3Error, return it
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return error as H3Error
  }

  // Log the error with context
  const route = context.route || 'unknown'
  const userId = context.userId || 'anonymous'
  const operation = context.operation || 'unknown'

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  // Log error details (in production, this would go to a logging service)
  console.error('[API Error]', {
    route,
    userId,
    operation,
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    ...context,
  })

  // Return a standardized error response
  return createApiError(
    errorMessage,
    500,
    { error: ['An unexpected error occurred'] }
  )
}

/**
 * Validate URL path parameters (e.g., UUID format)
 * 
 * @param id - The ID to validate
 * @param paramName - Name of the parameter for error messages
 * @returns The validated ID
 * @throws H3Error with 400 status code if validation fails
 */
export function validateId(id: string | undefined, paramName: string = 'id'): string {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!id) {
    throw createApiError(`Valid ${paramName} is required`, 400)
  }

  if (!UUID_RE.test(id)) {
    throw createApiError(`Invalid ${paramName} format`, 400)
  }

  return id
}

/**
 * Type guard to check if an error is an H3Error
 */
export function isH3Error(error: unknown): error is H3Error {
  return error != null && typeof error === 'object' && 'statusCode' in error
}

/**
 * Safely execute an async operation with standardized error handling
 * 
 * @param operation - The async operation to execute
 * @param context - Context for error logging
 * @returns The result of the operation
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw handleApiError(error, context)
  }
}
