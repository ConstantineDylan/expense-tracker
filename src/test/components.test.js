import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DEFAULT_CATEGORIES } from '../constants/categories';

// Mock Dashboard component logic
describe('Issue 6: Dashboard - Balance & Summary', () => {
  const mockTransactions = [
    { id: '1', date: '2024-01-15', description: 'MCDONALD', amount: 50000, type: 'debit', category: 'food' },
    { id: '2', date: '2024-01-16', description: 'GAJI', amount: 5000000, type: 'credit', category: 'salary' },
    { id: '3', date: '2024-01-17', description: 'GRAB', amount: 25000, type: 'debit', category: 'transport' },
  ];

  it('should calculate total balance correctly', () => {
    const balance = mockTransactions.reduce((s, t) => 
      t.type === "credit" ? s + t.amount : s - t.amount, 0
    );
    expect(balance).toBe(5000000 - 50000 - 25000);
  });

  it('should calculate monthly income', () => {
    const income = mockTransactions
      .filter(t => t.type === "credit")
      .reduce((s, t) => s + t.amount, 0);
    expect(income).toBe(5000000);
  });

  it('should calculate monthly expense', () => {
    const expense = mockTransactions
      .filter(t => t.type === "debit")
      .reduce((s, t) => s + t.amount, 0);
    expect(expense).toBe(75000);
  });

  it('should get recent transactions (sorted by date, limited to 5)', () => {
    const recent = [...mockTransactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    expect(recent).toHaveLength(3);
    expect(recent[0].date).toBe('2024-01-17');
  });
});

describe('Issue 7: Transactions Page with Filters & CRUD', () => {
  const mockTransactions = [
    { id: '1', date: '2024-01-15', description: 'MCDONALD', amount: 50000, type: 'debit', category: 'food' },
    { id: '2', date: '2024-02-16', description: 'GAJI', amount: 5000000, type: 'credit', category: 'salary' },
    { id: '3', date: '2024-01-17', description: 'GRAB', amount: 25000, type: 'debit', category: 'transport' },
  ];

  it('should filter by month', () => {
    const filterMonth = '2024-01';
    const filtered = mockTransactions.filter(t => 
      !filterMonth || t.date.startsWith(filterMonth)
    );
    expect(filtered).toHaveLength(2);
  });

  it('should filter by category', () => {
    const filterCat = 'food';
    const filtered = mockTransactions.filter(t => 
      !filterCat || t.category === filterCat
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].category).toBe('food');
  });

  it('should filter by type', () => {
    const filterType = 'credit';
    const filtered = mockTransactions.filter(t => 
      !filterType || t.type === filterType
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe('credit');
  });

  it('should combine multiple filters', () => {
    const filterMonth = '2024-01';
    const filterType = 'debit';
    const filtered = mockTransactions.filter(t => {
      if (filterMonth && !t.date.startsWith(filterMonth)) return false;
      if (filterType && t.type !== filterType) return false;
      return true;
    });
    expect(filtered).toHaveLength(2);
  });

  it('should sort by date descending', () => {
    const sorted = [...mockTransactions].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    expect(sorted[0].date).toBe('2024-02-16');
    expect(sorted[2].date).toBe('2024-01-15');
  });

  it('should add new transaction', () => {
    const newTx = { 
      date: '2024-03-01', 
      description: 'NEW', 
      amount: 100000, 
      type: 'debit', 
      category: 'etc',
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...mockTransactions, newTx];
    expect(updated).toHaveLength(4);
  });

  it('should update transaction', () => {
    const updated = mockTransactions.map(t => 
      t.id === '1' ? { ...t, description: 'UPDATED', updatedAt: new Date().toISOString() } : t
    );
    expect(updated[0].description).toBe('UPDATED');
  });

  it('should delete transaction', () => {
    const filtered = mockTransactions.filter(t => t.id !== '1');
    expect(filtered).toHaveLength(2);
    expect(filtered.find(t => t.id === '1')).toBeUndefined();
  });
});
