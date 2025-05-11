import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Initialize database
async function initializeDatabase() {
  const db = await open({
    filename: './expenses.db',
    driver: sqlite3.Database
  });

  // Create expenses table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      expense TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create income table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      income TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

// Expense functions
export async function insertExpense(expense) {
  const db = await initializeDatabase();
  const { date, expense: expenseName, category, amount } = expense;
  
  const result = await db.run(
    'INSERT INTO expenses (date, expense, category, amount) VALUES (?, ?, ?, ?)',
    [date, expenseName, category, amount]
  );
  
  return result;
}

export async function getLastFiveExpenses() {
  const db = await initializeDatabase();
  const expenses = await db.all(
    'SELECT * FROM expenses ORDER BY created_at DESC LIMIT 10'
  );
  return expenses;
}

export async function deleteLastFiveExpenses() {
  const db = await initializeDatabase();
  await db.run(`
    DELETE FROM expenses 
    WHERE id IN (
      SELECT id FROM expenses 
      ORDER BY created_at DESC 
      LIMIT 5
    )
  `);
}

export async function updateExpense(id, expense) {
  const db = await initializeDatabase();
  const { date, expense: expenseName, category, amount } = expense;
  
  const result = await db.run(
    'UPDATE expenses SET date = ?, expense = ?, category = ?, amount = ? WHERE id = ?',
    [date, expenseName, category, amount, id]
  );
  
  return result;
}

export async function deleteExpense(id) {
  const db = await initializeDatabase();
  const result = await db.run('DELETE FROM expenses WHERE id = ?', [id]);
  return result;
}

export async function getExpenseById(id) {
  const db = await initializeDatabase();
  const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
  return expense;
}

// Income functions
export async function insertIncome(income) {
  const db = await initializeDatabase();
  const { date, income: incomeName, category, amount } = income;
  
  const result = await db.run(
    'INSERT INTO income (date, income, category, amount) VALUES (?, ?, ?, ?)',
    [date, incomeName, category, amount]
  );
  
  return result;
}

export async function getLastFiveIncome() {
  const db = await initializeDatabase();
  const income = await db.all(
    'SELECT * FROM income ORDER BY created_at DESC LIMIT 10'
  );
  return income;
}

export async function deleteLastFiveIncome() {
  const db = await initializeDatabase();
  await db.run(`
    DELETE FROM income 
    WHERE id IN (
      SELECT id FROM income 
      ORDER BY created_at DESC 
      LIMIT 5
    )
  `);
}

export async function updateIncome(id, income) {
  const db = await initializeDatabase();
  const { date, income: incomeName, category, amount } = income;
  
  const result = await db.run(
    'UPDATE income SET date = ?, income = ?, category = ?, amount = ? WHERE id = ?',
    [date, incomeName, category, amount, id]
  );
  
  return result;
}

export async function deleteIncome(id) {
  const db = await initializeDatabase();
  const result = await db.run('DELETE FROM income WHERE id = ?', [id]);
  return result;
}

export async function getIncomeById(id) {
  const db = await initializeDatabase();
  const income = await db.get('SELECT * FROM income WHERE id = ?', [id]);
  return income;
}

export async function deleteAllExpenses() {
  const db = await initializeDatabase();
  await db.run('DELETE FROM expenses');
}

export async function deleteAllIncome() {
  const db = await initializeDatabase();
  await db.run('DELETE FROM income');
} 