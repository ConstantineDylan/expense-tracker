# GitHub Issues

---

## Issue 1: Project Setup

**Title:** Project Setup - React + Vite

**Description:**
Initialize React + Vite project with localForage, react-router, and routing setup.

**Acceptance Criteria:**
- [x] React + Vite project initialized
- [x] localForage installed and configured
- [x] React Router set up with routes (Dashboard, Transactions, Import, Reports, Settings)
- [x] Basic layout with navigation

---

## Issue 2: Data Model & Storage

**Title:** Data Model & Storage Service

**Description:**
Define Transaction and Category schemas, implement StorageService with localForage.

**Acceptance Criteria:**
- [x] Transaction schema: id, date, description, amount, type, category, account, createdAt, updatedAt
- [x] Category schema: id, name, type, keywords, isDefault
- [x] StorageService: CRUD operations for transactions and categories
- [x] Data persists in IndexedDB

---

## Issue 3: CSV Parser

**Title:** CSV Parser for BCA Bank Statements

**Description:**
Parse BCA CSV format with Indonesian number format and date parsing.

**Acceptance Criteria:**
- [x] Parse CSV with correct date format (DD/MM/YYYY)
- [x] Handle Indonesian number format (comma as decimal)
- [x] Extract transaction type (DB/CR)
- [x] Validation for BCA format

---

## Issue 4: Auto-Categorization

**Title:** Auto-Categorization with Keywords

**Description:**
Automatically categorize transactions based on keywords in description.

**Acceptance Criteria:**
- [x] Predefined categories with keywords
- [x] Auto-match description to category
- [x] Fallback to "Etc" for unmatched
- [x] Support custom categories

---

## Issue 5: Import Feature

**Title:** Import Feature - File Upload & Preview

**Description:**
UI for uploading CSV, previewing transactions, and confirming import.

**Acceptance Criteria:**
- [x] File upload input
- [x] Preview parsed transactions before import
- [x] Import all transactions button
- [x] Success/error feedback

---

## Issue 6: Dashboard

**Title:** Dashboard - Balance & Summary

**Description:**
Show current balance, monthly income/expense, and recent transactions.

**Acceptance Criteria:**
- [x] Current balance display
- [x] Monthly income card
- [x] Monthly expense card
- [x] Recent transactions list (5 items)

---

## Issue 7: Transaction List & CRUD

**Title:** Transactions Page with Filters & CRUD

**Description:**
View, add, edit, delete transactions with filtering.

**Acceptance Criteria:**
- [x] List all transactions
- [x] Filter by month, category, type
- [x] Add new transaction
- [x] Edit existing transaction
- [x] Delete transaction

---

## Issue 8: Reports

**Title:** Reports - Monthly Spending Charts

**Description:**
Show monthly spending breakdown by category with pie chart.

**Acceptance Criteria:**
- [x] Month selector
- [x] Pie chart visualization
- [x] Category breakdown list
- [x] Percentage per category

---

## Issue 9: Custom Categories

**Title:** Custom Categories Management

**Description:**
Allow users to create, edit, delete custom categories.

**Acceptance Criteria:**
- [x] Add custom category with name and keywords
- [x] Delete custom category
- [x] Custom categories included in auto-categorization

---

## Issue 10: Export/Import Data

**Title:** Data Backup - Export/Import

**Description:**
Export all data to JSON and restore from backup.

**Acceptance Criteria:**
- [x] Export to JSON file
- [x] Import from JSON file
- [x] Data restoration works correctly
