import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function excelDateToJSDate(serial) {
  if (typeof serial === 'string') return serial; // Already a string
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().slice(0, 10);
}

export default function Home() {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [currentSheet, setCurrentSheet] = useState('default');
  const [sheets, setSheets] = useState(['default']);
  const [newSheetName, setNewSheetName] = useState('');
  const [showNewSheetModal, setShowNewSheetModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    date: '',
    expense: '',
    category: '',
    amount: ''
  });
  const [incomeForm, setIncomeForm] = useState({
    date: '',
    income: '',
    category: '',
    amount: ''
  });
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [selectedSection, setSelectedSection] = useState('expenses'); // 'expenses', 'income', or 'cashflow'
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importedExpenses, setImportedExpenses] = useState([]);
  const [importedIncome, setImportedIncome] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([
    'grocery', 'internet', 'misc', 'transport', 'petrol', 'rent'
  ]);
  const [incomeCategories, setIncomeCategories] = useState([
    'rent received', 'interest', 'annuity'
  ]);
  const [showExpenseCategoryInput, setShowExpenseCategoryInput] = useState(false);
  const [showIncomeCategoryInput, setShowIncomeCategoryInput] = useState(false);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [reportType, setReportType] = useState('expense');
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteSheetModal, setShowDeleteSheetModal] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState('');

  // Fetch data when component mounts
  useEffect(() => {
    fetchExpenses();
    fetchIncome();
    fetchSheets();
  }, []);

  // Fetch sheets
  const fetchSheets = async () => {
    try {
      const response = await fetch('/api/sheets');
      const data = await response.json();
      if (data.success) {
        setSheets(data.data.map(sheet => sheet.name));
      }
    } catch (error) {
      console.error('Error fetching sheets:', error);
    }
  };

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      const response = await fetch(`/api/expenses?sheet=${currentSheet}`);
      const data = await response.json();
      if (data.success) {
        setExpenses(data.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  // Fetch income
  const fetchIncome = async () => {
    try {
      const response = await fetch(`/api/income?sheet=${currentSheet}`);
      const data = await response.json();
      if (data.success) {
        setIncome(data.data);
      }
    } catch (error) {
      console.error('Error fetching income:', error);
    }
  };

  // Handle sheet change
  const handleSheetChange = (newSheet) => {
    setCurrentSheet(newSheet);
  };

  // Effect to reload data when sheet changes
  useEffect(() => {
    fetchExpenses();
    fetchIncome();
  }, [currentSheet]);

  // Handle expense form changes
  const handleExpenseChange = (e) => {
    setExpenseForm({
      ...expenseForm,
      [e.target.name]: e.target.value
    });
  };

  // Handle income form changes
  const handleIncomeChange = (e) => {
    setIncomeForm({
      ...incomeForm,
      [e.target.name]: e.target.value
    });
  };

  // Handle expense form submission
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpenseId) {
        const response = await fetch('/api/expenses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingExpenseId, ...expenseForm, sheet_name: currentSheet }),
        });
        const data = await response.json();
        if (data.success) {
          setEditingExpenseId(null);
          setExpenseForm({ date: '', expense: '', category: '', amount: '' });
          fetchExpenses();
        }
      } else {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...expenseForm, sheet_name: currentSheet }),
        });
        const data = await response.json();
        if (data.success) {
          setExpenseForm({ date: '', expense: '', category: '', amount: '' });
          fetchExpenses();
        }
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  // Handle income form submission
  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingIncomeId) {
        const response = await fetch('/api/income', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingIncomeId, ...incomeForm, sheet_name: currentSheet }),
        });
        const data = await response.json();
        if (data.success) {
          setEditingIncomeId(null);
          setIncomeForm({ date: '', income: '', category: '', amount: '' });
          fetchIncome();
        }
      } else {
        const response = await fetch('/api/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...incomeForm, sheet_name: currentSheet }),
        });
        const data = await response.json();
        if (data.success) {
          setIncomeForm({ date: '', income: '', category: '', amount: '' });
          fetchIncome();
        }
      }
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  // Handle expense deletion
  const handleDeleteExpense = async (id) => {
    try {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  // Handle income deletion
  const handleDeleteIncome = async (id) => {
    try {
      const response = await fetch(`/api/income?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchIncome();
      }
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  };

  // Handle expense edit
  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setExpenseForm({
      date: expense.date,
      expense: expense.expense,
      category: expense.category,
      amount: expense.amount
    });
  };

  // Handle income edit
  const handleEditIncome = (income) => {
    setEditingIncomeId(income.id);
    setIncomeForm({
      date: income.date,
      income: income.income,
      category: income.category,
      amount: income.amount
    });
  };

  // Calculate totals
  const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const cashFlow = totalIncome - totalExpenses;

  // Import handler
  const handleImportClick = () => {
    setFileMenuOpen(false);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    let imported = false;
    let importedExpensesArr = [];
    let importedIncomeArr = [];
    // Parse expense sheet
    const expenseSheet = workbook.Sheets['expense'];
    if (expenseSheet) {
      importedExpensesArr = XLSX.utils.sheet_to_json(expenseSheet);
      for (const expense of importedExpensesArr) {
        if (expense.date) expense.date = excelDateToJSDate(expense.date);
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...expense, sheet_name: currentSheet }),
        });
      }
      imported = true;
    }
    // Parse income sheet
    const incomeSheet = workbook.Sheets['income'];
    if (incomeSheet) {
      importedIncomeArr = XLSX.utils.sheet_to_json(incomeSheet);
      console.log('Imported income rows:', importedIncomeArr);
      for (const inc of importedIncomeArr) {
        if (inc.date) inc.date = excelDateToJSDate(inc.date);
        await fetch('/api/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...inc, sheet_name: currentSheet }),
        });
      }
      imported = true;
    }
    if (imported) {
      await fetchExpenses();
      await fetchIncome();
      setImportedExpenses(importedExpensesArr.slice(0, 10));
      setImportedIncome(importedIncomeArr.slice(0, 10));
      setImportModalOpen(true);
    }
    e.target.value = '';
  };

  // Export handler
  const handleExportClick = () => {
    // Prepare data for export
    const expenseSheet = XLSX.utils.json_to_sheet(expenses.map(e => ({
      date: e.date,
      expense: e.expense,
      category: e.category,
      amount: e.amount
    })));
    const incomeSheet = XLSX.utils.json_to_sheet(income.map(i => ({
      date: i.date,
      income: i.income,
      category: i.category,
      amount: i.amount
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, expenseSheet, 'expense');
    XLSX.utils.book_append_sheet(wb, incomeSheet, 'income');
    XLSX.writeFile(wb, 'financial_data.xlsx');
    setFileMenuOpen(false);
  };

  // Handle adding new expense category
  const handleAddExpenseCategory = (e) => {
    e.preventDefault();
    if (newExpenseCategory && !expenseCategories.includes(newExpenseCategory)) {
      setExpenseCategories([...expenseCategories, newExpenseCategory]);
      setExpenseForm({ ...expenseForm, category: newExpenseCategory });
    }
    setShowExpenseCategoryInput(false);
    setNewExpenseCategory('');
  };

  // Handle adding new income category
  const handleAddIncomeCategory = (e) => {
    e.preventDefault();
    if (newIncomeCategory && !incomeCategories.includes(newIncomeCategory)) {
      setIncomeCategories([...incomeCategories, newIncomeCategory]);
      setIncomeForm({ ...incomeForm, category: newIncomeCategory });
    }
    setShowIncomeCategoryInput(false);
    setNewIncomeCategory('');
  };

  // Handler for clearing all records
  const handleClearAllRecords = async () => {
    setShowClearConfirm(false);
    try {
      const response = await fetch('/api/clear', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        fetchExpenses();
        fetchIncome();
      } else {
        alert('Failed to clear records: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to clear records: ' + err.message);
    }
  };

  // Handle creating a new sheet
  const handleCreateNewSheet = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSheetName }),
      });
      const data = await response.json();
      if (data.success) {
        setSheets([...sheets, newSheetName]);
        setCurrentSheet(newSheetName);
        setNewSheetName('');
        setShowNewSheetModal(false);
      } else {
        alert('Failed to create new sheet: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating new sheet:', error);
    }
  };

  // Handle sheet deletion
  const handleDeleteSheet = async () => {
    try {
      const response = await fetch(`/api/sheets?name=${sheetToDelete}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setSheets(sheets.filter(sheet => sheet !== sheetToDelete));
        if (currentSheet === sheetToDelete) {
          setCurrentSheet('default');
        }
        setShowDeleteSheetModal(false);
        setSheetToDelete('');
      } else {
        alert('Failed to delete sheet: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting sheet:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Arial, sans-serif', fontSize: '14px' }}>
      {/* Import Success Modal */}
      {importModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '32px', minWidth: '400px', maxWidth: '90vw', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <h2 style={{ marginTop: 0, color: '#4CAF50' }}>Import successful!</h2>
            <h3 style={{ marginBottom: '8px', color: '#222' }}>Top 10 Imported Expenses</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '18px' }}>
              <thead>
                <tr style={{ background: '#e8f5e9' }}>
                  <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Expense</th>
                  <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Category</th>
                  <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {importedExpenses && importedExpenses.length > 0 ? importedExpenses.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '6px' }}>{row.date}</td>
                    <td style={{ padding: '6px' }}>{row.expense}</td>
                    <td style={{ padding: '6px' }}>{row.category}</td>
                    <td style={{ padding: '6px' }}>{row.amount}</td>
                  </tr>
                )) : <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No expenses imported</td></tr>}
              </tbody>
            </table>
            <h3 style={{ marginBottom: '8px', color: '#222' }}>Top 10 Imported Income</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '18px' }}>
              <thead>
                <tr style={{ background: '#e3f2fd' }}>
                  <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Income</th>
                  <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Category</th>
                  <th style={{ padding: '6px', borderBottom: '1px solid #ddd' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {importedIncome && importedIncome.length > 0 ? importedIncome.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '6px' }}>{row.date}</td>
                    <td style={{ padding: '6px' }}>{row.income}</td>
                    <td style={{ padding: '6px' }}>{row.category}</td>
                    <td style={{ padding: '6px' }}>{row.amount}</td>
                  </tr>
                )) : <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No income imported</td></tr>}
              </tbody>
            </table>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setImportModalOpen(false)} style={{ padding: '8px 24px', background: '#0073aa', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation modal */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '32px', minWidth: '320px', maxWidth: '90vw', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <h2 style={{ color: '#d32f2f', marginTop: 0 }}>Clear all records?</h2>
            <p style={{ fontSize: '15px', color: '#333' }}>Are you sure you want to delete all expense and income records? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
              <button onClick={handleClearAllRecords} style={{ padding: '8px 24px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>Yes, clear all</button>
              <button onClick={() => setShowClearConfirm(false)} style={{ padding: '8px 24px', background: '#eee', color: '#333', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* New Sheet Modal */}
      {showNewSheetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '32px', minWidth: '400px', maxWidth: '90vw', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <h2 style={{ marginTop: 0, color: '#0073aa' }}>Create New Sheet</h2>
            <form onSubmit={handleCreateNewSheet} style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Sheet Name:</label>
                <input
                  type="text"
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSheetModal(false);
                    setNewSheetName('');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#e0e0e0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    background: '#0073aa',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Create Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Sheet Modal */}
      {showDeleteSheetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '32px', minWidth: '400px', maxWidth: '90vw', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <h2 style={{ marginTop: 0, color: '#d32f2f' }}>Delete Sheet</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>Select a sheet to delete. This action cannot be undone.</p>
            <div style={{ marginBottom: '20px' }}>
              <select
                value={sheetToDelete}
                onChange={(e) => setSheetToDelete(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <option value="">Select a sheet</option>
                {sheets.filter(sheet => sheet !== 'default').map(sheet => (
                  <option key={sheet} value={sheet}>{sheet}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteSheetModal(false);
                  setSheetToDelete('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e0e0e0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSheet}
                disabled={!sheetToDelete}
                style={{
                  padding: '8px 16px',
                  background: '#b71c1c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: !sheetToDelete ? 'not-allowed' : 'pointer',
                  opacity: !sheetToDelete ? 0.65 : 1,
                  fontWeight: '500'
                }}
              >
                Delete Sheet
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Main Flex Layout */}
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{
          width: '220px',
          background: '#23282d',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          minHeight: '100vh',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '30px', textAlign: 'center', letterSpacing: '1px' }}>
            Financial Tracker
          </div>
          <nav style={{ flex: 1 }}>
            <div
              onClick={() => setSelectedSection('expenses')}
              style={{
                padding: '15px 30px',
                background: selectedSection === 'expenses' ? '#0073aa' : 'none',
                color: selectedSection === 'expenses' ? '#fff' : '#c3c4c7',
                cursor: 'pointer',
                fontWeight: selectedSection === 'expenses' ? 'bold' : 'normal',
                borderLeft: selectedSection === 'expenses' ? '4px solid #00b9eb' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Expenses
            </div>
            <div
              onClick={() => setSelectedSection('income')}
              style={{
                padding: '15px 30px',
                background: selectedSection === 'income' ? '#0073aa' : 'none',
                color: selectedSection === 'income' ? '#fff' : '#c3c4c7',
                cursor: 'pointer',
                fontWeight: selectedSection === 'income' ? 'bold' : 'normal',
                borderLeft: selectedSection === 'income' ? '4px solid #00b9eb' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Income
            </div>
            <div
              onClick={() => setSelectedSection('cashflow')}
              style={{
                padding: '15px 30px',
                background: selectedSection === 'cashflow' ? '#0073aa' : 'none',
                color: selectedSection === 'cashflow' ? '#fff' : '#c3c4c7',
                cursor: 'pointer',
                fontWeight: selectedSection === 'cashflow' ? 'bold' : 'normal',
                borderLeft: selectedSection === 'cashflow' ? '4px solid #00b9eb' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Cash Flow
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, background: '#f1f1f1', padding: '40px', minHeight: '100vh' }}>
          {/* Menu Bar with Sheet Selector */}
          <div style={{
            display: 'flex',
            gap: '32px',
            fontWeight: 500,
            fontSize: '15px',
            color: '#222',
            marginBottom: '24px',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              <span
                style={{ cursor: 'pointer', padding: '2px 8px', borderRadius: '4px', transition: 'background 0.2s', position: 'relative' }}
                onClick={() => setFileMenuOpen((open) => !open)}
                onBlur={() => setTimeout(() => setFileMenuOpen(false), 200)}
                tabIndex={0}
              >
                File
                {fileMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    minWidth: '140px',
                    zIndex: 1000,
                    marginTop: '2px',
                  }}>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', color: '#222' }}
                      onClick={() => { setFileMenuOpen(false); setShowNewSheetModal(true); }}
                    >
                      New Sheet
                    </div>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', color: '#222' }}
                      onClick={() => { setFileMenuOpen(false); setShowDeleteSheetModal(true); }}
                    >
                      Delete Sheet
                    </div>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', color: '#222' }}
                      onClick={handleImportClick}
                    >
                      Import
                    </div>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', color: '#222' }}
                      onClick={handleExportClick}
                    >
                      Export
                    </div>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', color: '#d32f2f', borderTop: '1px solid #eee' }}
                      onClick={() => { setFileMenuOpen(false); setShowClearConfirm(true); }}
                    >
                      Clear all records
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </span>
              <span
                style={{ cursor: 'pointer', padding: '2px 8px', borderRadius: '4px', transition: 'background 0.2s' }}
                onClick={() => setSelectedSection('report')}
              >Report</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px' }}>Current Sheet:</label>
              <select
                value={currentSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: '#fff',
                  fontSize: '14px',
                  minWidth: '150px'
                }}
              >
                {sheets.map(sheet => (
                  <option key={sheet} value={sheet}>{sheet}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{
            width: '75%',
            minWidth: '350px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          }}>
            {selectedSection === 'expenses' && (
              <>
                {/* Add New Expense form directly below menu */}
                <form onSubmit={handleExpenseSubmit} style={{ marginBottom: '20px', width: '100%', maxWidth: 'none', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#4CAF50', textAlign: 'left', marginLeft: 0 }}>
                    {editingExpenseId ? 'Edit Expense' : 'Add New Expense'}
                  </h3>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: 0, justifyContent: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Date:</label>
                      <input
                        type="date"
                        name="date"
                        value={expenseForm.date}
                        onChange={handleExpenseChange}
                        required
                        style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Expense details:</label>
                      <input
                        type="text"
                        name="expense"
                        value={expenseForm.expense}
                        onChange={handleExpenseChange}
                        required
                        style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Category:</label>
                      {!showExpenseCategoryInput ? (
                        <select
                          name="category"
                          value={expenseForm.category}
                          onChange={e => {
                            if (e.target.value === '__add_new__') {
                              setShowExpenseCategoryInput(true);
                            } else {
                              setExpenseForm({ ...expenseForm, category: e.target.value });
                            }
                          }}
                          required
                          style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                        >
                          <option value="" disabled>Select category</option>
                          {expenseCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="__add_new__">Add new category...</option>
                        </select>
                      ) : (
                        <form onSubmit={handleAddExpenseCategory} style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="text"
                            value={newExpenseCategory}
                            onChange={e => setNewExpenseCategory(e.target.value)}
                            placeholder="New category"
                            style={{ width: '70%', padding: '6px', fontSize: '13px' }}
                            autoFocus
                          />
                          <button type="submit" style={{ padding: '6px 10px', fontSize: '13px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                          <button type="button" onClick={() => setShowExpenseCategoryInput(false)} style={{ padding: '6px 10px', fontSize: '13px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </form>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Amount:</label>
                      <input
                        type="number"
                        name="amount"
                        value={expenseForm.amount}
                        onChange={handleExpenseChange}
                        required
                        step="0.01"
                        style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '15px', justifyContent: 'center' }}>
                    <button 
                      type="submit"
                      style={{
                        padding: '8px 16px',
                        minWidth: '100px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {editingExpenseId ? 'Update Expense' : 'Add Expense'}
                    </button>
                    {editingExpenseId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingExpenseId(null);
                          setExpenseForm({ date: '', expense: '', category: '', amount: '' });
                        }}
                        style={{
                          padding: '8px 16px',
                          minWidth: '100px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                {/* Expenses Table below the form */}
                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#e8f5e9' }}>
                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Expense</th>
                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Amount</th>
                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '4px' }}>{expense.date}</td>
                          <td style={{ padding: '4px' }}>{expense.expense}</td>
                          <td style={{ padding: '4px' }}>{expense.category}</td>
                          <td style={{ padding: '4px' }}>${expense.amount}</td>
                          <td style={{ padding: '4px' }}>
                            <button
                              onClick={() => handleEditExpense(expense)}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '5px',
                                fontSize: '11px'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {selectedSection === 'income' && (
              <>
                {/* Add New Income form directly below menu */}
                <form onSubmit={handleIncomeSubmit} style={{ marginBottom: '20px', width: '100%', maxWidth: 'none', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#2196F3', textAlign: 'left', marginLeft: 0 }}>
                    {editingIncomeId ? 'Edit Income' : 'Add New Income'}
                  </h3>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: 0, justifyContent: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Date:</label>
                      <input
                        type="date"
                        name="date"
                        value={incomeForm.date}
                        onChange={handleIncomeChange}
                        required
                        style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Income details:</label>
                      <input
                        type="text"
                        name="income"
                        value={incomeForm.income}
                        onChange={handleIncomeChange}
                        required
                        style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Category:</label>
                      {!showIncomeCategoryInput ? (
                        <select
                          name="category"
                          value={incomeForm.category}
                          onChange={e => {
                            if (e.target.value === '__add_new__') {
                              setShowIncomeCategoryInput(true);
                            } else {
                              setIncomeForm({ ...incomeForm, category: e.target.value });
                            }
                          }}
                          required
                          style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                        >
                          <option value="" disabled>Select category</option>
                          {incomeCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="__add_new__">Add new category...</option>
                        </select>
                      ) : (
                        <form onSubmit={handleAddIncomeCategory} style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="text"
                            value={newIncomeCategory}
                            onChange={e => setNewIncomeCategory(e.target.value)}
                            placeholder="New category"
                            style={{ width: '70%', padding: '6px', fontSize: '13px' }}
                            autoFocus
                          />
                          <button type="submit" style={{ padding: '6px 10px', fontSize: '13px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                          <button type="button" onClick={() => setShowIncomeCategoryInput(false)} style={{ padding: '6px 10px', fontSize: '13px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </form>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Amount:</label>
                      <input
                        type="number"
                        name="amount"
                        value={incomeForm.amount}
                        onChange={handleIncomeChange}
                        required
                        step="0.01"
                        style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '15px', justifyContent: 'center' }}>
                    <button 
                      type="submit"
                      style={{
                        padding: '8px 16px',
                        minWidth: '100px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {editingIncomeId ? 'Update Income' : 'Add Income'}
                    </button>
                    {editingIncomeId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingIncomeId(null);
                          setIncomeForm({ date: '', income: '', category: '', amount: '' });
                        }}
                        style={{
                          padding: '8px 16px',
                          minWidth: '100px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                {/* Income Table below the form */}
                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#e3f2fd' }}>
                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Income</th>
                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Amount</th>
                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {income.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '4px' }}>{item.date}</td>
                          <td style={{ padding: '4px' }}>{item.income}</td>
                          <td style={{ padding: '4px' }}>{item.category}</td>
                          <td style={{ padding: '4px' }}>${item.amount}</td>
                          <td style={{ padding: '4px' }}>
                            <button
                              onClick={() => handleEditIncome(item)}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '5px',
                                fontSize: '11px'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteIncome(item.id)}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {selectedSection === 'cashflow' && (
              <>
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ 
                      backgroundColor: '#e3f2fd', 
                      padding: '20px', 
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#2196F3' }}>Total Income</h3>
                      <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                        ${totalIncome.toFixed(2)}
                      </p>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: '#e8f5e9', 
                      padding: '20px', 
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#4CAF50' }}>Total Expenses</h3>
                      <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                        ${totalExpenses.toFixed(2)}
                      </p>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: cashFlow >= 0 ? '#e8f5e9' : '#ffebee', 
                      padding: '20px', 
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        marginBottom: '10px', 
                        color: cashFlow >= 0 ? '#2E7D32' : '#C62828'
                      }}>
                        Net Cash Flow
                      </h3>
                      <p style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: cashFlow >= 0 ? '#2E7D32' : '#C62828'
                      }}>
                        ${cashFlow.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Recent Transactions</h3>
                    <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f3e5f5' }}>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...income, ...expenses]
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .slice(0, 10)
                            .map((item, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px' }}>{item.date}</td>
                                <td style={{ padding: '8px' }}>
                                  <span style={{ 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    backgroundColor: 'income' in item ? '#e3f2fd' : '#e8f5e9',
                                    color: 'income' in item ? '#2196F3' : '#4CAF50',
                                    fontSize: '12px'
                                  }}>
                                    {('income' in item ? 'Income' : 'Expense')}
                                  </span>
                                </td>
                                <td style={{ padding: '8px' }}>{item.income || item.expense}</td>
                                <td style={{ 
                                  padding: '8px',
                                  color: 'income' in item ? '#2196F3' : '#4CAF50',
                                  fontWeight: 'bold'
                                }}>
                                  ${item.amount}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedSection === 'report' && (
              <div style={{ marginTop: '0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Dropdown to select Expense or Income and date range */}
                <div style={{ marginBottom: '8px', alignSelf: 'flex-start', display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontWeight: 500, marginRight: '10px' }}>Report Type:</label>
                    <select
                      value={reportType}
                      onChange={e => setReportType(e.target.value)}
                      style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 500, marginRight: '6px' }}>From:</label>
                    <input
                      type="date"
                      value={reportFromDate}
                      onChange={e => setReportFromDate(e.target.value)}
                      style={{ padding: '6px 8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 500, marginRight: '6px' }}>To:</label>
                    <input
                      type="date"
                      value={reportToDate}
                      onChange={e => setReportToDate(e.target.value)}
                      style={{ padding: '6px 8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </div>
                </div>
                {/* Filtered data for charts */}
                {(() => {
                  const allData = reportType === 'expense' ? expenses : income;
                  const filteredData = allData.filter(item => {
                    if (reportFromDate && item.date < reportFromDate) return false;
                    if (reportToDate && item.date > reportToDate) return false;
                    return true;
                  });
                  const categories = Array.from(new Set(filteredData.map(e => e.category)));
                  const amounts = categories.map(cat =>
                    filteredData.filter(e => e.category === cat).reduce((sum, e) => sum + parseFloat(e.amount), 0)
                  );
                  return (
                    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                      {/* Bar Chart by Category */}
                      <div style={{ flex: 1, minWidth: '320px', background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: reportType === 'expense' ? '#4CAF50' : '#2196F3' }}>
                          {reportType === 'expense' ? 'Expenses' : 'Income'} by Category (Bar)
                        </h4>
                        <Bar
                          data={{
                            labels: categories,
                            datasets: [
                              {
                                label: 'Amount',
                                data: amounts,
                                backgroundColor: reportType === 'expense' ? '#4CAF50' : '#2196F3',
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { display: false },
                              title: { display: false },
                            },
                            scales: {
                              y: { beginAtZero: true }
                            }
                          }}
                        />
                      </div>
                      {/* Pie Chart by Category */}
                      <div style={{ flex: 1, minWidth: '320px', background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: reportType === 'expense' ? '#4CAF50' : '#2196F3' }}>
                          {reportType === 'expense' ? 'Expenses' : 'Income'} by Category (Pie)
                        </h4>
                        <Pie
                          data={{
                            labels: categories,
                            datasets: [
                              {
                                label: 'Amount',
                                data: amounts,
                                backgroundColor: [
                                  '#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0', '#607D8B', '#E91E63', '#00BCD4', '#8BC34A', '#FF9800'
                                ],
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { position: 'bottom' },
                              title: { display: false },
                            },
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 