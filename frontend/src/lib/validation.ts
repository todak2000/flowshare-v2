/**
 * Frontend validation utilities
 */

export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

/**
 * Normalize email address for case-insensitive matching
 * Must match backend normalization logic
 */
export function normalizeEmail(email: string): string {
  if (!email) return email;
  return email.toLowerCase().trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * Accepts: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Password validation rules for real-time feedback
 */
export const passwordValidationRules: ValidationRule[] = [
  {
    test: (value) => value.length >= 8,
    message: "At least 8 characters",
  },
  {
    test: (value) => /[A-Z]/.test(value),
    message: "One uppercase letter",
  },
  {
    test: (value) => /[a-z]/.test(value),
    message: "One lowercase letter",
  },
  {
    test: (value) => /\d/.test(value),
    message: "One number",
  },
  {
    test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
    message: "One special character",
  },
];

/**
 * Email validation rules for real-time feedback
 */
export const emailValidationRules: ValidationRule[] = [
  {
    test: (value) => value.length > 0,
    message: "Email is required",
  },
  {
    test: (value) => isValidEmail(value),
    message: "Must be a valid email address",
  },
];

/**
 * Name validation rules
 */
export const nameValidationRules: ValidationRule[] = [
  {
    test: (value) => value.trim().length >= 2,
    message: "At least 2 characters",
  },
  {
    test: (value) => value.trim().length <= 100,
    message: "Maximum 100 characters",
  },
];

/**
 * Phone number validation rules
 */
export const phoneValidationRules: ValidationRule[] = [
  {
    test: (value) => isValidPhoneNumber(value),
    message: "Valid phone number (e.g., +1234567890)",
  },
];

/**
 * Calculate password strength
 * Returns: 0 (weak), 1 (fair), 2 (good), 3 (strong)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  return Math.min(3, Math.floor(strength / 1.5));
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  const labels = ["Weak", "Fair", "Good", "Strong"];
  return labels[strength] || "Weak";
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(strength: number): string {
  const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
  return colors[strength] || "#ef4444";
}
