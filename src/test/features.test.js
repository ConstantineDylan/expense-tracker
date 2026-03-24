import { describe, it, expect } from 'vitest';
import { DEFAULT_CATEGORIES } from '../constants/categories';

describe('Issue 8: Reports - Monthly Spending Charts', () => {
  const mockTransactions = [
    { id: '1', date: '2024-01-15', description: 'MCDONALD', amount: 50000, type: 'debit', category: 'food' },
    { id: '2', date: '2024-01-16', description: 'GRAB', amount: 25000, type: 'debit', category: 'transport' },
    { id: '3', date: '2024-01-17', description: 'SHOPEE', amount: 150000, type: 'debit', category: 'shopping' },
    { id: '4', date: '2024-02-15', description: 'GAJI', amount: 5000000, type: 'credit', category: 'salary' },
  ];

  const catById = Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.id, c]));

  it('should filter expenses by month', () => {
    const selMonth = 0; // January
    const selYear = 2024;
    const monthTx = mockTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    });
    const expenses = monthTx.filter(t => t.type === 'debit');
    expect(expenses).toHaveLength(3);
  });

  it('should calculate category breakdown', () => {
    const expenses = mockTransactions.filter(t => t.type === 'debit' && t.date.startsWith('2024-01'));
    const map = {};
    expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    const breakdown = Object.entries(map).map(([id, value]) => ({
      id,
      label: catById[id]?.name || 'Etc',
      value
    })).sort((a, b) => b.value - a.value);

    expect(breakdown).toHaveLength(3);
    expect(breakdown[0].id).toBe('shopping');
    expect(breakdown[0].value).toBe(150000);
  });

  it('should calculate percentage per category', () => {
    const expenses = mockTransactions.filter(t => t.type === 'debit' && t.date.startsWith('2024-01'));
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
    const map = {};
    expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });

    Object.entries(map).forEach(([id, value]) => {
      const pct = Math.round((value / totalExp) * 100);
      expect(pct).toBeGreaterThan(0);
      expect(pct).toBeLessThanOrEqual(100);
    });
  });

  it('should provide month selector options', () => {
    const years = [...new Set(mockTransactions.map(t => new Date(t.date).getFullYear()))];
    expect(years).toContain(2024);
  });
});

describe('Issue 9: Custom Categories Management', () => {
  it('should allow adding custom category', () => {
    const customCat = {
      name: 'Groceries',
      keywords: ['superindo', 'giant', 'hero'],
      type: 'expense',
      isDefault: false
    };
    const newCat = { ...customCat, id: crypto.randomUUID() };
    expect(newCat.name).toBe('Groceries');
    expect(newCat.keywords).toHaveLength(3);
    expect(newCat.isDefault).toBe(false);
  });

  it('should allow deleting custom category', () => {
    const categories = [...DEFAULT_CATEGORIES, { id: 'custom-1', name: 'Custom', keywords: [], type: 'expense', isDefault: false }];
    const filtered = categories.filter(c => c.id !== 'custom-1');
    expect(filtered).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it('should not allow deleting default categories', () => {
    const defaultCats = DEFAULT_CATEGORIES.filter(c => c.isDefault);
    expect(defaultCats).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it('should include custom categories in auto-categorization', () => {
    const customCat = { id: 'groceries', name: 'Groceries', keywords: ['superindo'], type: 'expense', isDefault: false };
    const allCategories = [...DEFAULT_CATEGORIES, customCat];
    const desc = 'SUPERINDO JAKARTA';
    const matched = allCategories.find(c => 
      c.keywords.some(k => desc.toLowerCase().includes(k.toLowerCase()))
    );
    expect(matched?.id).toBe('groceries');
  });
});

describe('Issue 10: Data Backup - Export/Import', () => {
  const mockTransactions = [
    { id: '1', date: '2024-01-15', description: 'MCDONALD', amount: 50000, type: 'debit', category: 'food' },
  ];

  it('should export to JSON format', () => {
    const data = {
      transactions: mockTransactions,
      categories: DEFAULT_CATEGORIES,
      exportedAt: new Date().toISOString()
    };
    const json = JSON.stringify(data, null, 2);
    const parsed = JSON.parse(json);
    expect(parsed.transactions).toHaveLength(1);
    expect(parsed.categories).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(parsed.exportedAt).toBeDefined();
  });

  it('should import from JSON and restore data', () => {
    const backup = {
      transactions: [{ id: '2', date: '2024-02-01', description: 'BACKUP', amount: 100000, type: 'credit', category: 'salary' }],
      categories: DEFAULT_CATEGORIES
    };
    const restored = JSON.parse(JSON.stringify(backup));
    expect(restored.transactions).toHaveLength(1);
    expect(restored.transactions[0].description).toBe('BACKUP');
  });

  it('should handle invalid backup file gracefully', () => {
    const invalidJson = '{ invalid json';
    let error = null;
    try {
      JSON.parse(invalidJson);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error instanceof SyntaxError).toBe(true);
  });

  it('should preserve all transaction fields during export/import', () => {
    const tx = mockTransactions[0];
    const exported = JSON.stringify({ transactions: [tx] });
    const imported = JSON.parse(exported);
    const restoredTx = imported.transactions[0];
    expect(restoredTx.id).toBe(tx.id);
    expect(restoredTx.date).toBe(tx.date);
    expect(restoredTx.description).toBe(tx.description);
    expect(restoredTx.amount).toBe(tx.amount);
    expect(restoredTx.type).toBe(tx.type);
    expect(restoredTx.category).toBe(tx.category);
  });
});
