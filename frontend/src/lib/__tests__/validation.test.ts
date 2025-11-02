import { describe, it, expect } from 'vitest';
import {
  normalizeEmail,
  isValidEmail,
  isValidPhoneNumber,
  passwordValidationRules,
  emailValidationRules,
  nameValidationRules,
  phoneValidationRules,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from '../validation';

describe('validation', () => {
  describe('normalizeEmail', () => {
    it('should convert email to lowercase', () => {
      expect(normalizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should handle empty string', () => {
      expect(normalizeEmail('')).toBe('');
    });

    it('should handle mixed case with spaces', () => {
      expect(normalizeEmail('  Test.User@Example.COM  ')).toBe('test.user@example.com');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('test123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@')).toBe(false);
      expect(isValidEmail('@missing.com')).toBe(false);
      expect(isValidEmail('missing.domain@')).toBe(false);
      expect(isValidEmail('no spaces@example.com')).toBe(false);
    });

    it('should reject emails without domain extension', () => {
      expect(isValidEmail('test@example')).toBe(false);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate various phone formats', () => {
      expect(isValidPhoneNumber('+1234567890')).toBe(true);
      expect(isValidPhoneNumber('(123) 456-7890')).toBe(true);
      expect(isValidPhoneNumber('123-456-7890')).toBe(true);
      expect(isValidPhoneNumber('1234567890')).toBe(true);
      expect(isValidPhoneNumber('123.456.7890')).toBe(true);
    });

    it('should accept international numbers', () => {
      expect(isValidPhoneNumber('+44 20 1234 5678')).toBe(true); // UK
      expect(isValidPhoneNumber('+1 (555) 123-4567')).toBe(true); // US with country code
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('')).toBe(false);
      expect(isValidPhoneNumber('123')).toBe(false); // Too short
      expect(isValidPhoneNumber('abc')).toBe(false); // No digits
      expect(isValidPhoneNumber('12345')).toBe(false); // Too short
    });

    it('should reject numbers that are too long', () => {
      expect(isValidPhoneNumber('1234567890123456')).toBe(false); // 16 digits
    });

    it('should handle null/undefined gracefully', () => {
      expect(isValidPhoneNumber(null as any)).toBe(false);
      expect(isValidPhoneNumber(undefined as any)).toBe(false);
    });
  });

  describe('passwordValidationRules', () => {
    it('should have all required validation rules', () => {
      expect(passwordValidationRules).toHaveLength(5);
    });

    it('should validate minimum length (8 characters)', () => {
      const rule = passwordValidationRules[0];
      expect(rule.test('short')).toBe(false);
      expect(rule.test('longenough')).toBe(true);
      expect(rule.message).toContain('8 characters');
    });

    it('should validate uppercase letter', () => {
      const rule = passwordValidationRules[1];
      expect(rule.test('lowercase')).toBe(false);
      expect(rule.test('Uppercase')).toBe(true);
    });

    it('should validate lowercase letter', () => {
      const rule = passwordValidationRules[2];
      expect(rule.test('UPPERCASE')).toBe(false);
      expect(rule.test('lowercase')).toBe(true);
    });

    it('should validate number', () => {
      const rule = passwordValidationRules[3];
      expect(rule.test('noNumber')).toBe(false);
      expect(rule.test('hasNumber1')).toBe(true);
    });

    it('should validate special character', () => {
      const rule = passwordValidationRules[4];
      expect(rule.test('noSpecial')).toBe(false);
      expect(rule.test('hasSpecial!')).toBe(true);
      expect(rule.test('hasSpecial@')).toBe(true);
      expect(rule.test('hasSpecial#')).toBe(true);
    });
  });

  describe('emailValidationRules', () => {
    it('should have required validation rules', () => {
      expect(emailValidationRules).toHaveLength(2);
    });

    it('should validate email is required', () => {
      const rule = emailValidationRules[0];
      expect(rule.test('')).toBe(false);
      expect(rule.test('test@example.com')).toBe(true);
    });

    it('should validate email format', () => {
      const rule = emailValidationRules[1];
      expect(rule.test('invalid')).toBe(false);
      expect(rule.test('valid@example.com')).toBe(true);
    });
  });

  describe('nameValidationRules', () => {
    it('should have required validation rules', () => {
      expect(nameValidationRules).toHaveLength(2);
    });

    it('should validate minimum length (2 characters)', () => {
      const rule = nameValidationRules[0];
      expect(rule.test('A')).toBe(false);
      expect(rule.test('AB')).toBe(true);
      expect(rule.test('  A  ')).toBe(false); // After trim
    });

    it('should validate maximum length (100 characters)', () => {
      const rule = nameValidationRules[1];
      const longName = 'A'.repeat(101);
      expect(rule.test(longName)).toBe(false);
      expect(rule.test('A'.repeat(100))).toBe(true);
    });
  });

  describe('phoneValidationRules', () => {
    it('should have phone validation rule', () => {
      expect(phoneValidationRules).toHaveLength(1);
    });

    it('should validate phone number format', () => {
      const rule = phoneValidationRules[0];
      expect(rule.test('123')).toBe(false);
      expect(rule.test('+1234567890')).toBe(true);
    });
  });

  describe('calculatePasswordStrength', () => {
    it('should return 0 for weak passwords', () => {
      expect(calculatePasswordStrength('short')).toBe(0);
      expect(calculatePasswordStrength('lowercase')).toBe(0);
    });

    it('should return 1 for fair passwords', () => {
      expect(calculatePasswordStrength('password1')).toBe(1);
    });

    it('should return 2 for good passwords', () => {
      expect(calculatePasswordStrength('Password123')).toBe(2);
    });

    it('should return 3 for strong passwords', () => {
      expect(calculatePasswordStrength('StrongP@ssw0rd123')).toBeGreaterThanOrEqual(2);
      expect(calculatePasswordStrength('VeryLongP@ssw0rd123!!!')).toBe(3);
    });

    it('should give bonus for length >= 12', () => {
      const longPassword = 'LongPassword123!';
      expect(calculatePasswordStrength(longPassword)).toBe(3);
    });

    it('should cap at maximum strength of 3', () => {
      const superStrong = 'VeryLongP@ssw0rd123!!!';
      expect(calculatePasswordStrength(superStrong)).toBe(3);
    });
  });

  describe('getPasswordStrengthLabel', () => {
    it('should return correct labels', () => {
      expect(getPasswordStrengthLabel(0)).toBe('Weak');
      expect(getPasswordStrengthLabel(1)).toBe('Fair');
      expect(getPasswordStrengthLabel(2)).toBe('Good');
      expect(getPasswordStrengthLabel(3)).toBe('Strong');
    });

    it('should default to "Weak" for invalid values', () => {
      expect(getPasswordStrengthLabel(-1)).toBe('Weak');
      expect(getPasswordStrengthLabel(99)).toBe('Weak');
    });
  });

  describe('getPasswordStrengthColor', () => {
    it('should return correct colors', () => {
      expect(getPasswordStrengthColor(0)).toBe('#ef4444'); // Red
      expect(getPasswordStrengthColor(1)).toBe('#f59e0b'); // Orange
      expect(getPasswordStrengthColor(2)).toBe('#3b82f6'); // Blue
      expect(getPasswordStrengthColor(3)).toBe('#10b981'); // Green
    });

    it('should default to red for invalid values', () => {
      expect(getPasswordStrengthColor(-1)).toBe('#ef4444');
      expect(getPasswordStrengthColor(99)).toBe('#ef4444');
    });
  });

  describe('integration tests', () => {
    it('should validate a complete valid registration form', () => {
      const email = normalizeEmail('  Test.User@Example.COM  ');
      const password = 'StrongP@ssw0rd123';
      const phone = '+1 (555) 123-4567';
      const name = 'John Doe';

      expect(isValidEmail(email)).toBe(true);
      expect(calculatePasswordStrength(password)).toBe(3);
      expect(isValidPhoneNumber(phone)).toBe(true);
      expect(nameValidationRules.every(rule => rule.test(name))).toBe(true);
    });

    it('should reject invalid registration form', () => {
      const email = 'invalid-email';
      const password = 'weak';
      const phone = '123';
      const name = 'A';

      expect(isValidEmail(email)).toBe(false);
      expect(calculatePasswordStrength(password)).toBe(0);
      expect(isValidPhoneNumber(phone)).toBe(false);
      expect(nameValidationRules[0].test(name)).toBe(false);
    });
  });
});
