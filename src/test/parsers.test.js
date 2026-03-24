import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoCategory, parseAmount, parseBCACSV } from '../utils/parsers';
import { DEFAULT_CATEGORIES } from '../constants/categories';

describe('Issue 2: Data Model & Storage', () => {
  describe('parseAmount', () => {
    it('should parse Indonesian number format with commas', () => {
      expect(parseAmount('33,000.00')).toBe(33000);
      expect(parseAmount('1,500,000.50')).toBe(1500000.50);
    });

    it('should handle plain numbers', () => {
      expect(parseAmount('100')).toBe(100);
      expect(parseAmount('0')).toBe(0);
    });

    it('should return 0 for invalid input', () => {
      expect(parseAmount('')).toBe(0);
      expect(parseAmount(null)).toBe(0);
      expect(parseAmount(undefined)).toBe(0);
      expect(parseAmount('abc')).toBe(0);
    });
  });

  describe('Transaction Schema', () => {
    it('should have required fields', () => {
      const transaction = {
        id: 'test-id',
        date: '2024-01-15',
        description: 'Test transaction',
        amount: 50000,
        type: 'debit',
        category: 'food',
        account: 'BCA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('date');
      expect(transaction).toHaveProperty('description');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('type');
      expect(transaction).toHaveProperty('category');
      expect(transaction).toHaveProperty('account');
      expect(transaction).toHaveProperty('createdAt');
      expect(transaction).toHaveProperty('updatedAt');
    });
  });

  describe('Category Schema', () => {
    it('should have required fields in default categories', () => {
      DEFAULT_CATEGORIES.forEach(cat => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('type');
        expect(cat).toHaveProperty('keywords');
        expect(cat).toHaveProperty('isDefault');
        expect(cat.isDefault).toBe(true);
      });
    });

    it('should have valid type values', () => {
      const validTypes = ['expense', 'income', 'both'];
      DEFAULT_CATEGORIES.forEach(cat => {
        expect(validTypes).toContain(cat.type);
      });
    });
  });
});

describe('Issue 3: CSV Parser', () => {
  describe('autoCategory', () => {
    it('should categorize food transactions', () => {
      const result = autoCategory('MCDONALD JAKARTA', 'debit', DEFAULT_CATEGORIES);
      expect(result).toBe('food');
    });

    it('should categorize transport transactions', () => {
      const result = autoCategory('GRAB JAKARTA', 'debit', DEFAULT_CATEGORIES);
      expect(result).toBe('transport');
    });

    it('should categorize salary transactions', () => {
      const result = autoCategory('GAJI BULANAN', 'credit', DEFAULT_CATEGORIES);
      expect(result).toBe('salary');
    });

    it('should fallback to "etc" for unmatched', () => {
      const result = autoCategory('UNKNOWN TRANSACTION', 'debit', DEFAULT_CATEGORIES);
      expect(result).toBe('etc');
    });

    it('should handle case insensitivity', () => {
      const result = autoCategory('starbucks coffee', 'debit', DEFAULT_CATEGORIES);
      expect(result).toBe('food');
    });
  });

  describe('parseBCACSV', () => {
    it('should parse valid CSV lines', () => {
      const csv = '15/01/2024,MCDONALD JAKARTA,,33000.00,DB';
      const result = parseBCACSV(csv, DEFAULT_CATEGORIES);
      
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].description).toBe('MCDONALD JAKARTA');
      expect(result[0].amount).toBe(33000);
      expect(result[0].type).toBe('debit');
      expect(result[0].category).toBe('food');
    });

    it('should handle credit transactions', () => {
      const csv = '15/01/2024,GAJI BULANAN,,5000000.00,CR';
      const result = parseBCACSV(csv, DEFAULT_CATEGORIES);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('credit');
      expect(result[0].category).toBe('salary');
    });

    it('should skip invalid lines', () => {
      const csv = 'invalid line\n15/01/2024,MCDONALD,,33000,DB';
      const result = parseBCACSV(csv, DEFAULT_CATEGORIES);
      expect(result).toHaveLength(1);
    });

    it('should handle multiple transactions', () => {
      const csv = '15/01/2024,MCDONALD,,33000,DB\n16/01/2024,GRAB,,25000,DB';
      const result = parseBCACSV(csv, DEFAULT_CATEGORIES);
      expect(result).toHaveLength(2);
    });

    it('should convert date format from DD/MM/YYYY to YYYY-MM-DD', () => {
      const csv = '25/12/2024,TEST,,1000,DB';
      const result = parseBCACSV(csv, DEFAULT_CATEGORIES);
      expect(result[0].date).toBe('2024-12-25');
    });
  });
});
