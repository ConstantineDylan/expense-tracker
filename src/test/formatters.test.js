import { describe, it, expect } from 'vitest';
import { fmt, fmtShort, fmtDate, MONTHS } from '../utils/formatters';

describe('Issue 1: Formatters', () => {
  describe('fmt', () => {
    it('should format currency in Indonesian Rupiah', () => {
      const result = fmt(50000);
      expect(result).toContain('50');
      expect(result).toContain('000');
    });

    it('should handle zero', () => {
      const result = fmt(0);
      expect(result).toContain('0');
    });

    it('should handle large numbers', () => {
      const result = fmt(1000000);
      expect(result).toContain('1');
      expect(result).toContain('000');
      expect(result).toContain('000');
    });
  });

  describe('fmtShort', () => {
    it('should format billions as "M"', () => {
      const result = fmtShort(1500000000);
      expect(result).toContain('1.5M');
    });

    it('should format millions as "jt"', () => {
      const result = fmtShort(5000000);
      expect(result).toContain('5.0jt');
    });

    it('should format thousands as "rb"', () => {
      const result = fmtShort(50000);
      expect(result).toContain('50rb');
    });

    it('should format small numbers as-is', () => {
      const result = fmtShort(500);
      expect(result).toContain('500');
    });
  });

  describe('fmtDate', () => {
    it('should format date in Indonesian format', () => {
      const result = fmtDate('2024-01-15');
      expect(result).toContain('15');
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });
  });

  describe('MONTHS', () => {
    it('should have 12 months', () => {
      expect(MONTHS).toHaveLength(12);
    });

    it('should start with Jan', () => {
      expect(MONTHS[0]).toBe('Jan');
    });

    it('should end with Dec', () => {
      expect(MONTHS[11]).toBe('Dec');
    });
  });
});
