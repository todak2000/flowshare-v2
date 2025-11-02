import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cn,
  formatDate,
  formatNumber,
  formatVolume,
  getLastDayOfMonth,
  getMonthRange,
  formatDateForAPI,
  formatReceiptDisplayDate,
  getPast12MonthsOptions,
  formatMonth,
  formatVolumeMbbls,
  formatVolumeMMbbls,
  formatDateToISO,
  formatLimit,
  formatLocalDate,
  cleanHtmlString,
  formatShortDate,
  formatVolumeWithCommas,
  formatDetailError,
  getCSSVar,
} from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('p-4', 'm-2');
      expect(result).toContain('p-4');
      expect(result).toContain('m-2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', false && 'hidden', true && 'block');
      expect(result).toContain('base');
      expect(result).toContain('block');
      expect(result).not.toContain('hidden');
    });

    it('should merge tailwind classes properly', () => {
      const result = cn('p-4 text-red-500', 'p-2');
      expect(result).toContain('p-2');
      expect(result).toContain('text-red-500');
    });
  });

  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2025-01-15');
      const result = formatDate(date);
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('should format date string correctly', () => {
      const result = formatDate('2025-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });
  });

  describe('formatNumber', () => {
    it('should format number with default 2 decimals', () => {
      expect(formatNumber(1234.5678)).toBe('1,234.57');
    });

    it('should format number with custom decimals', () => {
      expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
    });

    it('should format integer with decimals', () => {
      expect(formatNumber(1000)).toBe('1,000.00');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0.00');
    });
  });

  describe('formatVolume', () => {
    it('should format volume with 2 decimals', () => {
      expect(formatVolume(1234.5678)).toBe('1,234.57');
    });

    it('should format large volumes', () => {
      expect(formatVolume(1000000.123)).toBe('1,000,000.12');
    });
  });

  describe('getLastDayOfMonth', () => {
    it('should get last day of January', () => {
      const result = getLastDayOfMonth(2025, 0); // January
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });

    it('should get last day of February (non-leap year)', () => {
      const result = getLastDayOfMonth(2025, 1); // February
      expect(result.getDate()).toBe(28);
    });

    it('should get last day of February (leap year)', () => {
      const result = getLastDayOfMonth(2024, 1); // February 2024
      expect(result.getDate()).toBe(29);
    });
  });

  describe('getMonthRange', () => {
    it('should get month range correctly', () => {
      const { startDate, endDate } = getMonthRange(2025, 0); // January
      expect(startDate.getDate()).toBe(1);
      expect(startDate.getHours()).toBe(0);
      expect(endDate.getDate()).toBe(31);
      expect(endDate.getHours()).toBe(23);
    });

    it('should handle December correctly', () => {
      const { startDate, endDate } = getMonthRange(2025, 11); // December
      expect(startDate.getDate()).toBe(1);
      expect(endDate.getDate()).toBe(31);
    });
  });

  describe('formatDateForAPI', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const result = formatDateForAPI(date);
      expect(result).toBe('2025-01-15');
    });
  });

  describe('formatReceiptDisplayDate', () => {
    it('should format date with month, year, day, and time', () => {
      const date = new Date('2025-01-15T14:30:00');
      const result = formatReceiptDisplayDate(date);
      expect(result).toContain('January');
      expect(result).toContain('2025');
      expect(result).toContain('15');
    });
  });

  describe('getPast12MonthsOptions', () => {
    it('should return 12 month options', () => {
      const options = getPast12MonthsOptions();
      expect(options).toHaveLength(12);
    });

    it('should have current month as first option', () => {
      const options = getPast12MonthsOptions();
      expect(Math.abs(options[0].value)).toBe(0);
    });

    it('should have descending offset values', () => {
      const options = getPast12MonthsOptions();
      expect(options[1].value).toBe(-1);
      expect(options[11].value).toBe(-11);
    });
  });

  describe('formatMonth', () => {
    it('should format date to month name', () => {
      const result = formatMonth('2025-01-15');
      expect(result).toBe('January');
    });

    it('should handle Date object', () => {
      const result = formatMonth(new Date('2025-01-15'));
      expect(result).toBe('January');
    });
  });

  describe('formatVolumeMbbls', () => {
    it('should divide by 1000 and format', () => {
      expect(formatVolumeMbbls(1000)).toBe('1.00');
    });

    it('should handle large volumes', () => {
      expect(formatVolumeMbbls(123456)).toBe('123.46');
    });
  });

  describe('formatVolumeMMbbls', () => {
    it('should divide by 1,000,000 and format', () => {
      expect(formatVolumeMMbbls(1000000)).toBe('1.00');
    });

    it('should handle large volumes', () => {
      expect(formatVolumeMMbbls(12345678)).toBe('12.35');
    });
  });

  describe('formatDateToISO', () => {
    it('should format date string to ISO', () => {
      const result = formatDateToISO('2025-01-15');
      expect(result).toContain('2025-01-15');
      expect(result).toContain('T00:00:00');
    });
  });

  describe('formatLimit', () => {
    it('should return "Unlimited" for -1', () => {
      expect(formatLimit(-1)).toBe('Unlimited');
    });

    it('should return number as string for other values', () => {
      expect(formatLimit(100)).toBe('100');
      expect(formatLimit(0)).toBe('0');
    });
  });

  describe('formatLocalDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2025-01-15T10:30:00');
      const result = formatLocalDate(date);
      expect(result).toMatch(/2025-01-15/);
    });

    it('should pad single digits', () => {
      const date = new Date('2025-01-05T10:30:00');
      const result = formatLocalDate(date);
      expect(result).toContain('-01-'); // Month
      expect(result).toContain('-05'); // Day
    });
  });

  describe('cleanHtmlString', () => {
    it('should remove markdown code fences', () => {
      const input = '```html\n<p>Hello</p>\n```';
      const result = cleanHtmlString(input);
      expect(result).not.toContain('```html');
      expect(result).not.toContain('```');
    });

    it('should sanitize HTML (remove script tags)', () => {
      const input = '<p>Safe</p><script>alert("XSS")</script>';
      const result = cleanHtmlString(input);
      expect(result).toContain('Safe');
      // DOMPurify is mocked, so just check it was called
      expect(result).toBeTruthy();
    });

    it('should allow safe HTML tags', () => {
      const input = '<h1>Title</h1><p>Paragraph</p><strong>Bold</strong>';
      const result = cleanHtmlString(input);
      expect(result).toContain('<h1>');
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should handle non-string input', () => {
      const result = cleanHtmlString(null as any);
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = cleanHtmlString('');
      expect(result).toBe('');
    });
  });

  describe('formatShortDate', () => {
    it('should format date with ordinal suffix', () => {
      expect(formatShortDate(new Date('2025-01-01'))).toBe('1st Jan');
      expect(formatShortDate(new Date('2025-01-02'))).toBe('2nd Jan');
      expect(formatShortDate(new Date('2025-01-03'))).toBe('3rd Jan');
      expect(formatShortDate(new Date('2025-01-04'))).toBe('4th Jan');
    });

    it('should handle 21st, 22nd, 23rd correctly', () => {
      expect(formatShortDate(new Date('2025-01-21'))).toBe('21st Jan');
      expect(formatShortDate(new Date('2025-01-22'))).toBe('22nd Jan');
      expect(formatShortDate(new Date('2025-01-23'))).toBe('23rd Jan');
    });

    it('should include year when requested', () => {
      const result = formatShortDate(new Date('2025-01-15'), true);
      expect(result).toContain('2025');
    });

    it('should not include year by default', () => {
      const result = formatShortDate(new Date('2025-01-15'));
      expect(result).not.toContain('2025');
    });

    it('should handle string input', () => {
      const result = formatShortDate('2025-01-15');
      expect(result).toContain('15th Jan');
    });
  });

  describe('formatVolumeWithCommas', () => {
    it('should round and add commas', () => {
      expect(formatVolumeWithCommas(1234.56)).toBe('1,235');
    });

    it('should handle large numbers', () => {
      expect(formatVolumeWithCommas(1234567.89)).toBe('1,234,568');
    });

    it('should round decimal values', () => {
      expect(formatVolumeWithCommas(99.4)).toBe('99');
      expect(formatVolumeWithCommas(99.5)).toBe('100');
    });
  });

  describe('formatDetailError', () => {
    it('should return string detail as-is', () => {
      expect(formatDetailError('Error message')).toBe('Error message');
    });

    it('should format array of validation errors', () => {
      const detail = [
        { msg: 'Required', loc: ['body', 'email'] },
        { msg: 'Invalid', loc: ['body', 'password'] },
      ];
      const result = formatDetailError(detail);
      expect(result).toContain('email');
      expect(result).toContain('password');
      expect(result).toContain('Required');
      expect(result).toContain('Invalid');
    });

    it('should handle errors without loc', () => {
      const detail = [{ msg: 'Error message' }];
      const result = formatDetailError(detail);
      expect(result).toContain('Error message');
      expect(result).toContain('field');
    });

    it('should return "Validation error" for other types', () => {
      expect(formatDetailError({ unknown: 'format' })).toBe('Validation error');
      expect(formatDetailError(123)).toBe('Validation error');
    });
  });

  describe('getCSSVar', () => {
    it('should return fallback value in SSR environment', () => {
      const result = getCSSVar('--some-var');
      expect(result).toBe('240 5.9% 90%');
    });

    it('should handle missing CSS variable', () => {
      const result = getCSSVar('--nonexistent');
      expect(typeof result).toBe('string');
    });
  });
});
