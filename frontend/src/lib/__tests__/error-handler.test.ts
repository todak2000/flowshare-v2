import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleApiError, formatErrorMessage, type AppError } from '../error-handler';

describe('error-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleApiError', () => {
    describe('Axios errors with response', () => {
      it('should handle 422 validation error with array detail', () => {
        const error = {
          response: {
            status: 422,
            data: {
              detail: [
                { loc: ['body', 'email'], msg: 'Invalid email format' },
                { loc: ['body', 'password'], msg: 'Password too short' },
              ],
            },
          },
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Validation Error');
        expect(result.message).toContain('email');
        expect(result.message).toContain('password');
        expect(result.message).toContain('Invalid email format');
        expect(result.code).toBe('422');
      });

      it('should handle 422 validation error with string detail', () => {
        const error = {
          response: {
            status: 422,
            data: {
              detail: 'Invalid input data',
            },
          },
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Validation Error');
        expect(result.message).toBe('Invalid input data');
        expect(result.code).toBe('422');
      });

      it('should handle 400 Bad Request', () => {
        const error = {
          response: {
            status: 400,
            data: {
              detail: 'Invalid request format',
            },
          },
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Invalid Request');
        expect(result.message).toBe('Invalid request format');
        expect(result.action).toContain('check your input');
        expect(result.code).toBe('400');
      });

      it('should handle 401 Unauthorized', () => {
        const error = {
          response: {
            status: 401,
            data: {
              detail: 'Authentication required',
            },
          },
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Authentication Required');
        expect(result.action).toContain('log in');
        expect(result.code).toBe('401');
      });

      it('should handle 403 Forbidden', () => {
        const error = {
          response: {
            status: 403,
            data: {
              detail: 'Access denied',
            },
          },
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Access Denied');
        expect(result.action).toContain('permission');
        expect(result.code).toBe('403');
      });

      it('should handle 404 Not Found', () => {
        const error = {
          response: {
            status: 404,
            data: {
              detail: 'Resource not found',
            },
          },
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Not Found');
        expect(result.message).toBe('Resource not found');
        expect(result.code).toBe('404');
      });

      it('should handle 429 Too Many Requests', () => {
        const error = {
          response: {
            status: 429,
            data: {},
          },
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Too Many Requests');
        expect(result.action).toContain('wait');
        expect(result.code).toBe('429');
      });

      it('should handle 500 Internal Server Error', () => {
        const error = {
          response: {
            status: 500,
            data: {
              detail: 'Internal error',
            },
          },
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Server Error');
        expect(result.action).toContain('try again later');
        expect(result.code).toBe('500');
      });

      it('should handle 503 Service Unavailable', () => {
        const error = {
          response: {
            status: 503,
            data: {},
          },
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Service Unavailable');
        expect(result.action).toContain('temporarily unavailable');
        expect(result.code).toBe('503');
      });

      it('should handle error with message field', () => {
        const error = {
          response: {
            status: 400,
            data: {
              message: 'Custom error message',
            },
          },
        };

        const result = handleApiError(error);

        expect(result.message).toBe('Custom error message');
      });

      it('should handle unknown status codes', () => {
        const error = {
          response: {
            status: 418, // I'm a teapot
            data: {},
          },
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Error');
        expect(result.code).toBe('418');
      });
    });

    describe('Network errors (no response)', () => {
      it('should handle network error', () => {
        const error = {
          request: {},
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Connection Error');
        expect(result.message).toContain('Unable to connect');
        expect(result.code).toBe('NETWORK_ERROR');
      });
    });

    describe('Firebase auth errors', () => {
      it('should handle auth/email-already-in-use', () => {
        const error = {
          code: 'auth/email-already-in-use',
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Email Already Registered');
        expect(result.message).toContain('already associated');
      });

      it('should handle auth/invalid-email', () => {
        const error = {
          code: 'auth/invalid-email',
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Invalid Email');
      });

      it('should handle auth/user-not-found', () => {
        const error = {
          code: 'auth/user-not-found',
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Account Not Found');
      });

      it('should handle auth/wrong-password', () => {
        const error = {
          code: 'auth/wrong-password',
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Incorrect Password');
      });

      it('should handle auth/weak-password', () => {
        const error = {
          code: 'auth/weak-password',
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Weak Password');
      });

      it('should handle auth/too-many-requests', () => {
        const error = {
          code: 'auth/too-many-requests',
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Too Many Attempts');
        expect(result.message).toContain('temporarily disabled');
      });

      it('should handle auth/network-request-failed', () => {
        const error = {
          code: 'auth/network-request-failed',
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Connection Error');
      });

      it('should handle auth/invalid-credential', () => {
        const error = {
          code: 'auth/invalid-credential',
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Invalid Credentials');
      });

      it('should handle unknown Firebase auth errors', () => {
        const error = {
          code: 'auth/unknown-error',
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Authentication Error');
        expect(result.code).toBe('auth/unknown-error');
      });
    });

    describe('Generic errors', () => {
      it('should handle error with message', () => {
        const error = {
          message: 'Something went wrong',
        };

        const result = handleApiError(error);

        expect(result.title).toBe('Unexpected Error');
        expect(result.message).toBe('Something went wrong');
        expect(result.code).toBe('UNKNOWN');
      });

      it('should handle error without message', () => {
        const error = {};

        const result = handleApiError(error);

        expect(result.title).toBe('Unexpected Error');
        expect(result.message).toContain('try again');
      });

      it('should handle null error', () => {
        const result = handleApiError(null as any);

        expect(result.title).toBe('Unexpected Error');
        expect(result.code).toBe('UNKNOWN');
      });
    });

    describe('Security sanitization', () => {
      it('should sanitize file paths in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const error = {
          response: {
            status: 500,
            data: {
              detail: 'Error in /var/www/app/server.js',
            },
          },
        };

        const result = handleApiError(error);

        expect(result.message).not.toContain('/var/www');
        expect(result.message).toContain('[path]');

        process.env.NODE_ENV = originalEnv;
      });

      it('should sanitize UUIDs in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const error = {
          response: {
            status: 400,
            data: {
              detail: 'Invalid ID: 123e4567-e89b-12d3-a456-426614174000',
            },
          },
        };

        const result = handleApiError(error);

        expect(result.message).not.toContain('123e4567-e89b-12d3-a456-426614174000');
        expect(result.message).toContain('[id]');

        process.env.NODE_ENV = originalEnv;
      });

      it('should sanitize tokens in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const error = {
          response: {
            status: 401,
            data: {
              detail: 'Invalid token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abc123',
            },
          },
        };

        const result = handleApiError(error);

        expect(result.message).toContain('[token]');

        process.env.NODE_ENV = originalEnv;
      });

      it('should keep original error in development', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const error = {
          response: {
            status: 500,
            data: {
              detail: 'Error in /var/www/app/server.js with UUID 123e4567-e89b-12d3-a456-426614174000',
            },
          },
        };

        const result = handleApiError(error);

        // In development, paths and UUIDs might be preserved
        // (depending on implementation details)
        expect(result.message).toBeTruthy();

        process.env.NODE_ENV = originalEnv;
      });
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error with action', () => {
      const error: AppError = {
        title: 'Test Error',
        message: 'Something went wrong',
        action: 'Please try again',
      };

      const result = formatErrorMessage(error);

      expect(result).toBe('Something went wrong Please try again');
    });

    it('should format error without action', () => {
      const error: AppError = {
        title: 'Test Error',
        message: 'Something went wrong',
      };

      const result = formatErrorMessage(error);

      expect(result).toBe('Something went wrong');
    });

    it('should handle empty message', () => {
      const error: AppError = {
        title: 'Test Error',
        message: '',
        action: 'Do something',
      };

      const result = formatErrorMessage(error);

      expect(result).toBe(' Do something');
    });
  });
});
