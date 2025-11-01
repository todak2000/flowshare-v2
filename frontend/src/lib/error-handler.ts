/**
 * Centralized error handling utility
 * Converts technical errors into user-friendly messages
 *
 * SECURITY: This module sanitizes errors to prevent information leakage
 * - Removes stack traces and internal paths
 * - Hides sensitive backend details in production
 * - Provides user-friendly messages while logging detailed errors
 */

export interface AppError {
  title: string;
  message: string;
  action?: string;
  code?: string;
}

/**
 * Sanitize error message to prevent information leakage
 * Removes: stack traces, file paths, internal URLs, UUIDs, tokens
 */
function sanitizeErrorMessage(message: string, isProduction: boolean = process.env.NODE_ENV === 'production'): string {
  // In production, be more aggressive with sanitization
  if (isProduction) {
    // Remove file paths (Unix and Windows)
    message = message.replace(/(?:\/[\w.-]+)+\.\w+/g, '[path]');
    message = message.replace(/[A-Z]:\\(?:[\\]?[\w.-]+)+/g, '[path]');

    // Remove UUIDs
    message = message.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[id]');

    // Remove tokens and long alphanumeric strings (potential secrets)
    message = message.replace(/[a-zA-Z0-9_-]{40,}/g, '[token]');

    // Remove stack traces
    message = message.split('\n')[0]; // Only keep first line

    // Remove internal IPs
    message = message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]');

    // Remove email addresses (except in specific error messages about emails)
    if (!message.toLowerCase().includes('email')) {
      message = message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
    }
  }

  return message;
}

/**
 * Convert any error into a user-friendly AppError
 */
export function handleApiError(error: any): AppError {
  // Axios error
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Backend returned a structured error
    if (data && typeof data === 'object') {
      // FastAPI validation error (422)
      if (status === 422 && data.detail) {
        if (Array.isArray(data.detail)) {
          const messages = data.detail.map((err: any) => {
            const field = err.loc ? err.loc.join('.') : 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');

          return {
            title: 'Validation Error',
            message: messages,
            action: 'Please check your input and try again.',
            code: '422',
          };
        }

        // String detail
        if (typeof data.detail === 'string') {
          return {
            title: getErrorTitle(status),
            message: sanitizeErrorMessage(data.detail),
            action: getErrorAction(status),
            code: status.toString(),
          };
        }
      }

      // Generic backend error with detail
      if (data.detail) {
        const rawMessage = typeof data.detail === 'string' ? data.detail : 'An error occurred while processing your request.';
        const sanitizedMessage = sanitizeErrorMessage(rawMessage);

        // Log the original error for debugging (only logged, not shown to user)
        if (typeof data.detail !== 'string') {
          console.error('[API Error Details]:', data.detail);
        }

        return {
          title: getErrorTitle(status),
          message: sanitizedMessage,
          action: getErrorAction(status),
          code: status.toString(),
        };
      }

      // Generic backend error with message
      if (data.message) {
        return {
          title: getErrorTitle(status),
          message: sanitizeErrorMessage(data.message),
          action: getErrorAction(status),
          code: status.toString(),
        };
      }
    }

    // HTTP status-based errors
    return getHttpStatusError(status);
  }

  // Network error (no response)
  if (error.request) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      action: 'Try again in a moment.',
      code: 'NETWORK_ERROR',
    };
  }

  // Firebase auth errors
  if (error.code && error.code.startsWith('auth/')) {
    return getFirebaseAuthError(error.code);
  }

  // Generic error
  const errorMessage = error.message || 'Something went wrong. Please try again.';
  return {
    title: 'Unexpected Error',
    message: sanitizeErrorMessage(errorMessage),
    action: 'If the problem persists, contact support.',
    code: 'UNKNOWN',
  };
}

/**
 * Get user-friendly title based on HTTP status
 */
function getErrorTitle(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid Request';
    case 401:
      return 'Authentication Required';
    case 403:
      return 'Access Denied';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Validation Error';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Server Error';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Error';
  }
}

/**
 * Get suggested action based on HTTP status
 */
function getErrorAction(status: number): string {
  switch (status) {
    case 400:
      return 'Please check your input and try again.';
    case 401:
      return 'Please log in to continue.';
    case 403:
      return 'You don\'t have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with existing data.';
    case 422:
      return 'Please correct the highlighted fields.';
    case 429:
      return 'Please wait a moment before trying again.';
    case 500:
      return 'Our team has been notified. Please try again later.';
    case 503:
      return 'The service is temporarily unavailable. Please try again later.';
    default:
      return 'Please try again.';
  }
}

/**
 * Get HTTP status-based error
 */
function getHttpStatusError(status: number): AppError {
  const title = getErrorTitle(status);
  const action = getErrorAction(status);

  const messages: Record<number, string> = {
    400: 'The request was invalid or cannot be processed.',
    401: 'You need to be logged in to access this resource.',
    403: 'You don\'t have permission to access this resource.',
    404: 'The requested resource could not be found.',
    409: 'This operation conflicts with existing data.',
    422: 'The provided data is invalid.',
    429: 'You\'ve made too many requests. Please slow down.',
    500: 'An internal server error occurred.',
    503: 'The service is temporarily unavailable.',
  };

  return {
    title,
    message: messages[status] || `Request failed with status ${status}`,
    action,
    code: status.toString(),
  };
}

/**
 * Get Firebase Auth error message
 */
function getFirebaseAuthError(code: string): AppError {
  const errors: Record<string, { title: string; message: string; action: string }> = {
    'auth/email-already-in-use': {
      title: 'Email Already Registered',
      message: 'This email address is already associated with an account.',
      action: 'Try logging in instead, or use a different email.',
    },
    'auth/invalid-email': {
      title: 'Invalid Email',
      message: 'The email address is not valid.',
      action: 'Please enter a valid email address.',
    },
    'auth/user-not-found': {
      title: 'Account Not Found',
      message: 'No account exists with this email address.',
      action: 'Please check your email or create a new account.',
    },
    'auth/wrong-password': {
      title: 'Incorrect Password',
      message: 'The password you entered is incorrect.',
      action: 'Please try again or reset your password.',
    },
    'auth/weak-password': {
      title: 'Weak Password',
      message: 'Your password is too weak.',
      action: 'Please use at least 6 characters with a mix of letters and numbers.',
    },
    'auth/too-many-requests': {
      title: 'Too Many Attempts',
      message: 'Access to this account has been temporarily disabled due to many failed login attempts.',
      action: 'Please try again later or reset your password.',
    },
    'auth/network-request-failed': {
      title: 'Connection Error',
      message: 'Unable to connect to authentication service.',
      action: 'Please check your internet connection and try again.',
    },
    'auth/invalid-credential': {
      title: 'Invalid Credentials',
      message: 'The email or password you entered is incorrect.',
      action: 'Please check your credentials and try again.',
    },
  };

  return errors[code] || {
    title: 'Authentication Error',
    message: code.replace('auth/', '').replace(/-/g, ' '),
    action: 'Please try again.',
    code,
  };
}

/**
 * Format error for display
 */
export function formatErrorMessage(error: AppError): string {
  let message = error.message;
  if (error.action) {
    message += ` ${error.action}`;
  }
  return message;
}
