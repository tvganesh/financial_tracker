import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

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
    'grocery', 'internet', 'misc', 'transport', 'petrol', 'rent','charity','college','doctor & medicines', 
    'food & entertainment', 'mobile', 'pet care','salary','electricity','water','gas','personal care','car maintrenance','house maintrenance','clothes & accessories','health & fitness','other'
  ]);
  const [incomeCategories, setIncomeCategories] = useState([
    'rent received', 'interest', 'annuity', 'salary', 'stock profit','stock dividend','corporate fd','bond interest','other'
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
  const [expensePage, setExpensePage] = useState(1);
  const [incomePage, setIncomePage] = useState(1);
  const rowsPerPage = 15;
  const [analyzeMenuOpen, setAnalyzeMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showMonthlyTrend, setShowMonthlyTrend] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCumulative, setShowCumulative] = useState(false);
  const [allSheetsData, setAllSheetsData] = useState({ expenses: [], income: [] });
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [comparisonCategories, setComparisonCategories] = useState([]);

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
    console.log('File selected:', file ? { name: file.name, type: file.type, size: file.size } : 'No file');
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Function to find sheet by case-insensitive name
      const findSheet = (name) => {
        const sheetName = workbook.SheetNames.find(
          s => s.toLowerCase() === name.toLowerCase()
        );
        return sheetName ? workbook.Sheets[sheetName] : null;
      };

      // Function to normalize column names in a sheet
      const normalizeColumns = (sheet) => {
        if (!sheet) return null;
        const range = XLSX.utils.decode_range(sheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const headerCell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
          if (headerCell && headerCell.v) {
            // Store original header
            const originalHeader = headerCell.v;
            // Convert header to lowercase
            headerCell.v = String(headerCell.v).toLowerCase();
            // Store mapping for later reference
            if (!sheet.headerMapping) sheet.headerMapping = {};
            sheet.headerMapping[headerCell.v] = originalHeader;
          }
        }
        return sheet;
      };

      // Check for sheets with case-insensitive names
      const expenseSheet = normalizeColumns(findSheet('expense'));
      const incomeSheet = normalizeColumns(findSheet('income'));

      if (!expenseSheet && !incomeSheet) {
        alert('No valid sheets found. Please ensure your Excel file has sheets named "expense" or "income" (case-insensitive).');
        e.target.value = '';
        return;
      }

      let imported = false;
      let importedExpensesArr = [];
      let importedIncomeArr = [];
      let importErrors = [];

      // Expected column names (all lowercase)
      const expectedExpenseColumns = ['date', 'expense', 'category', 'amount'];
      const expectedIncomeColumns = ['date', 'income', 'category', 'amount'];

      // Process expense sheet
      if (expenseSheet) {
        const expenseData = XLSX.utils.sheet_to_json(expenseSheet, { header: 1 });
        
        if (expenseData.length === 0) {
          alert('The expense sheet is empty. Please add some data.');
          e.target.value = '';
          return;
        }

        // Get lowercase headers
        const headerRow = expenseData[0].map(col => String(col).toLowerCase());
        const missingColumns = expectedExpenseColumns.filter(col => !headerRow.includes(col));

        if (missingColumns.length > 0) {
          // Show original column names in the error message using the mapping
          const originalNames = expectedExpenseColumns.map(col => 
            col.charAt(0).toUpperCase() + col.slice(1)
          );
          alert(`Missing columns in expense sheet: ${missingColumns.map(col => 
            col.charAt(0).toUpperCase() + col.slice(1)
          ).join(', ')}\n\nRequired columns are: ${originalNames.join(', ')}`);
          e.target.value = '';
          return;
        }

        // Import with lowercase column names
        importedExpensesArr = XLSX.utils.sheet_to_json(expenseSheet, {
          raw: false,
          defval: null,
          header: expectedExpenseColumns,
          range: 1
        });

        for (const expense of importedExpensesArr) {
          if (expense.date) expense.date = excelDateToJSDate(expense.date);
          try {
            const response = await fetch('/api/expenses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...expense, sheet_name: currentSheet }),
            });
            const result = await response.json();
            if (!result.success) {
              console.error('Failed to import expense:', expense, result.error);
            }
          } catch (error) {
            console.error('Error importing expense:', expense, error);
          }
        }
        imported = true;
      }

      // Process income sheet
      if (incomeSheet) {
        const incomeData = XLSX.utils.sheet_to_json(incomeSheet, { header: 1 });
        
        if (incomeData.length === 0) {
          alert('The income sheet is empty. Please add some data.');
          e.target.value = '';
          return;
        }

        // Get lowercase headers
        const headerRow = incomeData[0].map(col => String(col).toLowerCase());
        const missingColumns = expectedIncomeColumns.filter(col => !headerRow.includes(col));

        if (missingColumns.length > 0) {
          // Show original column names in the error message using the mapping
          const originalNames = expectedIncomeColumns.map(col => 
            col.charAt(0).toUpperCase() + col.slice(1)
          );
          alert(`Missing columns in income sheet: ${missingColumns.map(col => 
            col.charAt(0).toUpperCase() + col.slice(1)
          ).join(', ')}\n\nRequired columns are: ${originalNames.join(', ')}`);
          e.target.value = '';
          return;
        }

        // Import with lowercase column names
        importedIncomeArr = XLSX.utils.sheet_to_json(incomeSheet, {
          raw: false,
          defval: null,
          header: expectedIncomeColumns,
          range: 1
        });

        for (const inc of importedIncomeArr) {
          if (inc.date) inc.date = excelDateToJSDate(inc.date);
          try {
            const response = await fetch('/api/income', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...inc, sheet_name: currentSheet }),
            });
            const result = await response.json();
            if (!result.success) {
              console.error('Failed to import income:', inc, result.error);
            }
          } catch (error) {
            console.error('Error importing income:', inc, error);
          }
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
    } catch (error) {
      console.error('Error during import process:', error);
      alert('Error importing file: ' + error.message);
    }

    e.target.value = '';
  };

  // Export handler
  const handleExportClick = () => {
    // Prompt for filename
    const defaultFilename = 'financial_data';
    const filename = prompt('Enter filename for the export:', defaultFilename);
    
    if (!filename) return; // User cancelled

    // Ensure filename ends with .xlsx
    const exportFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

    // Prepare data for export with capitalized headers
    const expenseSheet = XLSX.utils.json_to_sheet(
      expenses.map(e => ({
        Date: e.date,
        Expense: e.expense,
        Category: e.category,
        Amount: e.amount
      })),
      {
        header: ['Date', 'Expense', 'Category', 'Amount']
      }
    );

    const incomeSheet = XLSX.utils.json_to_sheet(
      income.map(i => ({
        Date: i.date,
        Income: i.income,
        Category: i.category,
        Amount: i.amount
      })),
      {
        header: ['Date', 'Income', 'Category', 'Amount']
      }
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, expenseSheet, 'expense');
    XLSX.utils.book_append_sheet(wb, incomeSheet, 'income');
    
    try {
      XLSX.writeFile(wb, exportFilename);
      alert(`File successfully exported as "${exportFilename}"`);
    } catch (error) {
      console.error('Error exporting file:', error);
      alert('Failed to export file. Please try again.');
    }
    
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

  // Calculate pagination for expenses
  const expenseStart = (expensePage - 1) * rowsPerPage;
  const expenseEnd = expensePage * rowsPerPage;
  const totalExpensePages = Math.ceil(expenses.length / rowsPerPage);
  const currentExpenses = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(expenseStart, expenseEnd);

  // Calculate pagination for income
  const incomeStart = (incomePage - 1) * rowsPerPage;
  const incomeEnd = incomePage * rowsPerPage;
  const totalIncomePages = Math.ceil(income.length / rowsPerPage);
  const currentIncome = income
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(incomeStart, incomeEnd);

  // Pagination handlers
  const handleExpensePrevPage = () => {
    setExpensePage(prev => Math.max(1, prev - 1));
  };

  const handleExpenseNextPage = () => {
    setExpensePage(prev => Math.min(totalExpensePages, prev + 1));
  };

  const handleIncomePrevPage = () => {
    setIncomePage(prev => Math.max(1, prev - 1));
  };

  const handleIncomeNextPage = () => {
    setIncomePage(prev => Math.min(totalIncomePages, prev + 1));
  };

  // Reset pagination when changing sheets
  useEffect(() => {
    setExpensePage(1);
    setIncomePage(1);
  }, [currentSheet]);

  // Add this useEffect at the component level (outside any conditional rendering)
  useEffect(() => {
    const fetchAllSheetsData = async () => {
      setIsLoadingReport(true);
      try {
        const allExpenses = [];
        const allIncome = [];
        const sheetsToProcess = sheets.filter(sheet => sheet !== 'default');
        for (const sheet of sheetsToProcess) {
          const expResponse = await fetch(`/api/expenses?sheet=${sheet}`);
          const expData = await expResponse.json();
          if (expData.success) {
            allExpenses.push(...expData.data.map(item => ({...item, sheet_name: sheet})));
          }
          const incResponse = await fetch(`/api/income?sheet=${sheet}`);
          const incData = await incResponse.json();
          if (incData.success) {
            allIncome.push(...incData.data.map(item => ({...item, sheet_name: sheet})));
          }
        }
        setAllSheetsData({ expenses: allExpenses, income: allIncome });
      } catch (error) {
        console.error('Error fetching all sheets data:', error);
      } finally {
        setIsLoadingReport(false);
      }
    };
    // Load for both monthly_report and monthly_comparison
    if (selectedSection === 'monthly_report' || selectedSection === 'monthly_comparison') {
      fetchAllSheetsData();
    }
  }, [selectedSection, sheets]);

  // Debug: Get all grocery entries for May and June 2025
  const groceryMay = allSheetsData.expenses.filter(
    e => e.category === 'grocery' && e.date >= '2025-05-01' && e.date <= '2025-05-31'
  );
  const groceryJune = allSheetsData.expenses.filter(
    e => e.category === 'grocery' && e.date >= '2025-06-01' && e.date <= '2025-06-30'
  );

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
                    <td style={{ padding: '6px' }}>₹{row.amount}</td>
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
                    <td style={{ padding: '6px' }}>₹{row.amount}</td>
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
              <span
                style={{ cursor: 'pointer', padding: '2px 8px', borderRadius: '4px', transition: 'background 0.2s', position: 'relative' }}
                onClick={() => setAnalyzeMenuOpen((open) => !open)}
                onBlur={() => setTimeout(() => setAnalyzeMenuOpen(false), 200)}
                tabIndex={0}
              >
                Analyze
                {analyzeMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    minWidth: '180px',
                    zIndex: 1000,
                    marginTop: '2px',
                  }}>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', color: '#222' }}
                      onClick={() => { setAnalyzeMenuOpen(false); setSelectedSection('cashflow_trend'); }}
                    >
                      Cash Flow Trend
                    </div>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', color: '#222' }}
                      onClick={() => { setAnalyzeMenuOpen(false); setSelectedSection('monthly_report'); }}
                    >
                      Monthly Cash Flow
                    </div>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', color: '#222' }}
                      onClick={() => { 
                        setAnalyzeMenuOpen(false); 
                        setSelectedSection('monthly_comparison'); 
                        if (!comparisonCategories.length && expenseCategories.length > 0) {
                          setComparisonCategories(expenseCategories.slice(0, Math.min(3, expenseCategories.length)));
                        }
                      }}
                    >
                      Monthly Expense Comparison
                    </div>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', color: '#222' }}
                      onClick={() => { 
                        setAnalyzeMenuOpen(false); 
                        setSelectedSection('monthly_income_comparison');
                        if (!comparisonCategories.length && incomeCategories.length > 0) {
                          setComparisonCategories(incomeCategories.slice(0, Math.min(3, incomeCategories.length)));
                        }
                      }}
                    >
                      Monthly Income Comparison
                    </div>
                  </div>
                )}
              </span>
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
                      {currentExpenses.map((expense) => (
                        <tr key={expense.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '4px' }}>{expense.date}</td>
                          <td style={{ padding: '4px' }}>{expense.expense}</td>
                          <td style={{ padding: '4px' }}>{expense.category}</td>
                          <td style={{ padding: '4px' }}>₹{expense.amount}</td>
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
                  {/* Pagination controls for expenses */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px',
                    borderTop: '1px solid #eee',
                    backgroundColor: '#fff'
                  }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Showing {expenseStart + 1}-{Math.min(expenseEnd, expenses.length)} of {expenses.length} entries
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleExpensePrevPage}
                        disabled={expensePage === 1}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: expensePage === 1 ? '#f5f5f5' : '#fff',
                          cursor: expensePage === 1 ? 'not-allowed' : 'pointer',
                          color: expensePage === 1 ? '#999' : '#333'
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ padding: '6px 12px', color: '#666' }}>
                        Page {expensePage} of {totalExpensePages}
                      </span>
                      <button
                        onClick={handleExpenseNextPage}
                        disabled={expensePage >= totalExpensePages}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: expensePage >= totalExpensePages ? '#f5f5f5' : '#fff',
                          cursor: expensePage >= totalExpensePages ? 'not-allowed' : 'pointer',
                          color: expensePage >= totalExpensePages ? '#999' : '#333'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  {/* Summary section for expenses */}
                  <div style={{
                    borderTop: '2px solid #e0e0e0',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '15px'
                  }}>
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#e8f5e9',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: '#2E7D32', marginBottom: '4px' }}>Total Expenses</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2E7D32' }}>₹{totalExpenses.toFixed(2)}</div>
                    </div>
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: '#1565C0', marginBottom: '4px' }}>Total Income</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1565C0' }}>₹{totalIncome.toFixed(2)}</div>
                    </div>
                    <div style={{
                      padding: '10px',
                      backgroundColor: cashFlow >= 0 ? '#e8f5e9' : '#ffebee',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: cashFlow >= 0 ? '#2E7D32' : '#C62828', marginBottom: '4px' }}>Cash Flow</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: cashFlow >= 0 ? '#2E7D32' : '#C62828' }}>₹{cashFlow.toFixed(2)}</div>
                    </div>
                  </div>
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
                          <button type="submit" style={{ padding: '6px 10px', fontSize: '13px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
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
                        backgroundColor: '#4CAF50',
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
                      {currentIncome.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '4px' }}>{item.date}</td>
                          <td style={{ padding: '4px' }}>{item.income}</td>
                          <td style={{ padding: '4px' }}>{item.category}</td>
                          <td style={{ padding: '4px' }}>₹{item.amount}</td>
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
                  {/* Pagination controls for income */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px',
                    borderTop: '1px solid #eee',
                    backgroundColor: '#fff'
                  }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Showing {incomeStart + 1}-{Math.min(incomeEnd, income.length)} of {income.length} entries
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleIncomePrevPage}
                        disabled={incomePage === 1}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: incomePage === 1 ? '#f5f5f5' : '#fff',
                          cursor: incomePage === 1 ? 'not-allowed' : 'pointer',
                          color: incomePage === 1 ? '#999' : '#333'
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ padding: '6px 12px', color: '#666' }}>
                        Page {incomePage} of {totalIncomePages}
                      </span>
                      <button
                        onClick={handleIncomeNextPage}
                        disabled={incomePage >= totalIncomePages}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: incomePage >= totalIncomePages ? '#f5f5f5' : '#fff',
                          cursor: incomePage >= totalIncomePages ? 'not-allowed' : 'pointer',
                          color: incomePage >= totalIncomePages ? '#999' : '#333'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  {/* Summary section for income */}
                  <div style={{
                    borderTop: '2px solid #e0e0e0',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '15px'
                  }}>
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#e8f5e9',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: '#2E7D32', marginBottom: '4px' }}>Total Expenses</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2E7D32' }}>₹{totalExpenses.toFixed(2)}</div>
                    </div>
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: '#1565C0', marginBottom: '4px' }}>Total Income</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1565C0' }}>₹{totalIncome.toFixed(2)}</div>
                    </div>
                    <div style={{
                      padding: '10px',
                      backgroundColor: cashFlow >= 0 ? '#e8f5e9' : '#ffebee',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: cashFlow >= 0 ? '#2E7D32' : '#C62828', marginBottom: '4px' }}>Cash Flow</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: cashFlow >= 0 ? '#2E7D32' : '#C62828' }}>₹{cashFlow.toFixed(2)}</div>
                    </div>
                  </div>
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
                        ₹{totalIncome.toFixed(2)}
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
                        ₹{totalExpenses.toFixed(2)}
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
                        ₹{cashFlow.toFixed(2)}
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
                                  ₹{item.amount}
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
                      onChange={e => {
                        setReportType(e.target.value);
                        setShowMonthlyTrend(e.target.value === 'monthly_trend');
                        if (e.target.value === 'monthly_trend') {
                          // Remove any non-expense categories
                          const filtered = selectedCategories.filter(cat => expenseCategories.includes(cat));
                          if (filtered.length > 0) {
                            setSelectedCategories(filtered);
                          } else if (expenseCategories.length > 0) {
                            setSelectedCategories([expenseCategories.includes('grocery') ? 'grocery' : expenseCategories[0]]);
                          } else {
                            setSelectedCategories([]);
                          }
                        } else if (e.target.value === 'income_monthly_trend') {
                          // Remove any non-income categories
                          const filtered = selectedCategories.filter(cat => incomeCategories.includes(cat));
                          if (filtered.length > 0) {
                            setSelectedCategories(filtered);
                          } else if (incomeCategories.length > 0) {
                            setSelectedCategories([incomeCategories.includes('rent received') ? 'rent received' : incomeCategories[0]]);
                          } else {
                            setSelectedCategories([]);
                          }
                        }
                      }}
                      style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                      <option value="monthly_trend">Expense monthly trend</option>
                      <option value="income_monthly_trend">Income monthly trend</option>
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
                
                {/* Category Selection for Monthly Trend */}
                {reportType === 'monthly_trend' && (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '20px',
                    marginBottom: '10px'
                  }}>
                    {/* Category Checkboxes - Left Side */}
                    <div style={{ 
                      width: '250px',
                      backgroundColor: '#f5f5f5',
                      padding: '15px',
                      borderRadius: '8px',
                      maxHeight: '500px',
                      overflowY: 'auto'
                    }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Select Categories:</label>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Trend Type Selection */}
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: '#fff', 
                          borderRadius: '4px',
                          marginBottom: '10px'
                        }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={showCumulative}
                              onChange={(e) => setShowCumulative(e.target.checked)}
                            />
                            <span style={{ fontSize: '14px' }}>Show Cumulative Trend</span>
                          </label>
                        </div>

                        {expenseCategories.map((category, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="checkbox"
                              id={`report-category-${index}`}
                              name="report-category"
                              value={category}
                              checked={selectedCategories.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategories([...selectedCategories, category]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter(c => c !== category));
                                }
                              }}
                              style={{ marginRight: '8px' }}
                            />
                            <label 
                              htmlFor={`report-category-${index}`}
                              style={{ fontSize: '14px', cursor: 'pointer' }}
                            >
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </label>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedCategories(expenseCategories)}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            background: '#2196F3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedCategories([])}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            background: '#f44336',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    
                    {/* Chart content - will be shown on the right side */}
                    <div style={{ flex: 1 }}>
                      {/* Monthly Trend Chart */}
                      {selectedCategories.length > 0 ? (
                        (() => {
                          // Get all dates in the filtered period
                          let filteredExpenses = expenses;
                          if (reportFromDate || reportToDate) {
                            filteredExpenses = expenses.filter(item => {
                              if (reportFromDate && item.date < reportFromDate) return false;
                              if (reportToDate && item.date > reportToDate) return false;
                              return true;
                            });
                          }

                          // Get dates
                          const allDates = [...new Set(filteredExpenses.map(e => e.date))].sort();
                          
                          // Generate colors for each category
                          const categoryColors = [
                            { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },  // Green
                            { borderColor: '#2196F3', backgroundColor: 'rgba(33, 150, 243, 0.1)' }, // Blue
                            { borderColor: '#FFC107', backgroundColor: 'rgba(255, 193, 7, 0.1)' },  // Yellow
                            { borderColor: '#F44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' },  // Red
                            { borderColor: '#9C27B0', backgroundColor: 'rgba(156, 39, 176, 0.1)' }, // Purple
                            { borderColor: '#FF9800', backgroundColor: 'rgba(255, 152, 0, 0.1)' },  // Orange
                            { borderColor: '#795548', backgroundColor: 'rgba(121, 85, 72, 0.1)' },  // Brown
                            { borderColor: '#607D8B', backgroundColor: 'rgba(96, 125, 139, 0.1)' }, // Blue Grey
                            { borderColor: '#E91E63', backgroundColor: 'rgba(233, 30, 99, 0.1)' },  // Pink
                            { borderColor: '#00BCD4', backgroundColor: 'rgba(0, 188, 212, 0.1)' },  // Cyan
                          ];
                          
                          // Create datasets for each selected category
                          const datasets = selectedCategories.flatMap((category, index) => {
                            // Filter expenses for this category
                            const categoryExpenses = filteredExpenses.filter(e => e.category === category);
                            
                            // Get color for this category (cycle through colors if more categories than colors)
                            const colorIndex = index % categoryColors.length;
                            const color = categoryColors[colorIndex];
                            
                            // Create regular trend data points
                            const regularDataPoints = allDates.map(date => {
                              const dayExpenses = categoryExpenses
                                .filter(e => e.date === date)
                                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                              return dayExpenses;
                            });

                            // Create base dataset
                            const baseDataset = {
                              label: category.charAt(0).toUpperCase() + category.slice(1),
                              data: regularDataPoints,
                              borderColor: color.borderColor,
                              backgroundColor: color.backgroundColor,
                              fill: false,
                              tension: 0.4
                            };

                            // If cumulative trend is enabled, add cumulative dataset
                            if (showCumulative) {
                              const cumulativeDataPoints = allDates.map((date, index) => {
                                return categoryExpenses
                                  .filter(e => e.date <= date)
                                  .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                              });

                              return [
                                baseDataset,
                                {
                                  label: `${category.charAt(0).toUpperCase() + category.slice(1)} (Cumulative)`,
                                  data: cumulativeDataPoints,
                                  borderColor: color.borderColor,
                                  backgroundColor: 'transparent',
                                  borderDash: [5, 5],
                                  fill: false,
                                  tension: 0
                                }
                              ];
                            }

                            return [baseDataset];
                          });
                          
                          // Generate labels for dates
                          const dateLabels = allDates.map(date => date);
                          
                          // Calculate total for all selected categories
                          const totalForSelectedCategories = filteredExpenses
                            .filter(e => selectedCategories.includes(e.category))
                            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                          
                          // Transaction count for all selected categories
                          const transactionCount = filteredExpenses
                            .filter(e => selectedCategories.includes(e.category))
                            .length;
                          
                          return (
                            <div style={{ background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                              <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#4CAF50' }}>
                                Category Expenses Over Time
                              </h4>
                              <Line
                                data={{
                                  labels: dateLabels,
                                  datasets: datasets,
                                }}
                                options={{
                                  responsive: true,
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                      labels: {
                                        boxWidth: 12
                                      }
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context) {
                                          return `${context.dataset.label}: ₹${context.parsed.y.toFixed(2)}`;
                                        }
                                      }
                                    }
                                  },
                                  scales: {
                                    x: {
                                      title: {
                                        display: true,
                                        text: 'Date'
                                      }
                                    },
                                    y: {
                                      title: {
                                        display: true,
                                        text: 'Amount (₹)'
                                      },
                                      grid: {
                                        drawOnChartArea: true,
                                        color: (context) => context.tick.value === 0 ? '#666' : '#e0e0e0',
                                        lineWidth: (context) => context.tick.value === 0 ? 3 : 0.5
                                      }
                                    }
                                  }
                                }}
                              />
                              
                              {/* Summary Statistics for Selected Categories */}
                              <div style={{ 
                                marginTop: '30px',
                                background: '#f5f5f5',
                                padding: '20px',
                                borderRadius: '8px'
                              }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>
                                  Selected Categories Statistics
                                </h4>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                  <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Total Spent</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
                                      ₹{totalForSelectedCategories.toFixed(2)}
                                    </div>
                                  </div>
                                  
                                  <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Average per Transaction</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
                                      {transactionCount 
                                        ? `₹${(totalForSelectedCategories / transactionCount).toFixed(2)}`
                                        : '₹0.00'}
                                    </div>
                                  </div>
                                  
                                  <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Transaction Count</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
                                      {transactionCount}
                                    </div>
                                  </div>
                                  
                                  <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>% of Total Expenses</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
                                      {(() => {
                                        const totalExpensesInPeriod = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
                                        return totalExpensesInPeriod > 0 
                                          ? `${((totalForSelectedCategories / totalExpensesInPeriod) * 100).toFixed(1)}%`
                                          : '0.0%';
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div style={{ 
                          padding: '30px', 
                          background: '#f9f9f9', 
                          borderRadius: '8px', 
                          textAlign: 'center',
                          color: '#666'
                        }}>
                          Please select at least one category to view trend data
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Category Selection for Income Monthly Trend */}
                {reportType === 'income_monthly_trend' && (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '20px',
                    marginBottom: '10px'
                  }}>
                    {/* Category Checkboxes - Left Side */}
                    <div style={{ 
                      width: '250px',
                      backgroundColor: '#f5f5f5',
                      padding: '15px',
                      borderRadius: '8px',
                      maxHeight: '500px',
                      overflowY: 'auto'
                    }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Select Income Categories:</label>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Cumulative Trend Checkbox */}
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: '#fff', 
                          borderRadius: '4px',
                          marginBottom: '10px'
                        }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={showCumulative}
                              onChange={(e) => setShowCumulative(e.target.checked)}
                            />
                            <span style={{ fontSize: '14px' }}>Show Cumulative Trend</span>
                          </label>
                        </div>
                        {incomeCategories.map((category, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="checkbox"
                              id={`income-report-category-${index}`}
                              name="income-report-category"
                              value={category}
                              checked={selectedCategories.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategories([...selectedCategories, category]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter(c => c !== category));
                                }
                              }}
                              style={{ marginRight: '8px' }}
                            />
                            <label 
                              htmlFor={`income-report-category-${index}`}
                              style={{ fontSize: '14px', cursor: 'pointer' }}
                            >
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedCategories(incomeCategories)}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            background: '#2196F3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedCategories([])}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            background: '#f44336',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    {/* Chart content - will be shown on the right side */}
                    <div style={{ flex: 1 }}>
                      {/* Income Monthly Trend Chart */}
                      {selectedCategories.length > 0 ? (
                        (() => {
                          // Get all dates in the filtered period
                          let filteredIncome = income;
                          if (reportFromDate || reportToDate) {
                            filteredIncome = income.filter(item => {
                              if (reportFromDate && item.date < reportFromDate) return false;
                              if (reportToDate && item.date > reportToDate) return false;
                              return true;
                            });
                          }
                          // Get dates
                          const allDates = [...new Set(filteredIncome.map(e => e.date))].sort();
                          // Generate colors for each category
                          const categoryColors = [
                            { borderColor: '#2196F3', backgroundColor: 'rgba(33, 150, 243, 0.1)' },  // Blue
                            { borderColor: '#9C27B0', backgroundColor: 'rgba(156, 39, 176, 0.1)' }, // Purple
                            { borderColor: '#FFC107', backgroundColor: 'rgba(255, 193, 7, 0.1)' },  // Yellow
                            { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },  // Green
                            { borderColor: '#FF9800', backgroundColor: 'rgba(255, 152, 0, 0.1)' },  // Orange
                            { borderColor: '#795548', backgroundColor: 'rgba(121, 85, 72, 0.1)' },  // Brown
                            { borderColor: '#607D8B', backgroundColor: 'rgba(96, 125, 139, 0.1)' }, // Blue Grey
                            { borderColor: '#E91E63', backgroundColor: 'rgba(233, 30, 99, 0.1)' },  // Pink
                            { borderColor: '#00BCD4', backgroundColor: 'rgba(0, 188, 212, 0.1)' },  // Cyan
                          ];
                          // Create datasets for each selected category
                          const datasets = selectedCategories.flatMap((category, index) => {
                            // Filter income for this category
                            const categoryIncome = filteredIncome.filter(e => e.category === category);
                            // Get color for this category (cycle through colors if more categories than colors)
                            const colorIndex = index % categoryColors.length;
                            const color = categoryColors[colorIndex];
                            // Create regular trend data points
                            const regularDataPoints = allDates.map(date => {
                              const dayIncome = categoryIncome
                                .filter(e => e.date === date)
                                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                              return dayIncome;
                            });
                            // Create base dataset
                            const baseDataset = {
                              label: category.charAt(0).toUpperCase() + category.slice(1),
                              data: regularDataPoints,
                              borderColor: color.borderColor,
                              backgroundColor: color.backgroundColor,
                              fill: false,
                              tension: 0.4
                            };
                            // If cumulative trend is enabled, add cumulative dataset
                            if (showCumulative) {
                              const cumulativeDataPoints = allDates.map((date, index) => {
                                return categoryIncome
                                  .filter(e => e.date <= date)
                                  .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                              });
                              return [
                                baseDataset,
                                {
                                  label: `${category.charAt(0).toUpperCase() + category.slice(1)} (Cumulative)` ,
                                  data: cumulativeDataPoints,
                                  borderColor: color.borderColor,
                                  backgroundColor: 'transparent',
                                  borderDash: [5, 5],
                                  fill: false,
                                  tension: 0
                                }
                              ];
                            }
                            return [baseDataset];
                          });
                          // Generate labels for dates
                          const dateLabels = allDates.map(date => date);
                          // Calculate total for all selected categories
                          const totalForSelectedCategories = filteredIncome
                            .filter(e => selectedCategories.includes(e.category))
                            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                          // Transaction count for all selected categories
                          const transactionCount = filteredIncome
                            .filter(e => selectedCategories.includes(e.category))
                            .length;
                          return (
                            <div style={{ background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                              <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#2196F3' }}>
                                Income Category Trend Over Time
                              </h4>
                              <Line
                                data={{
                                  labels: dateLabels,
                                  datasets: datasets,
                                }}
                                options={{
                                  responsive: true,
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                      labels: {
                                        boxWidth: 12
                                      }
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context) {
                                          return `${context.dataset.label}: ₹${context.parsed.y.toFixed(2)}`;
                                        }
                                      }
                                    }
                                  },
                                  scales: {
                                    x: {
                                      title: {
                                        display: true,
                                        text: 'Date'
                                      }
                                    },
                                    y: {
                                      title: {
                                        display: true,
                                        text: 'Amount (₹)'
                                      },
                                      grid: {
                                        drawOnChartArea: true,
                                        color: (context) => context.tick.value === 0 ? '#666' : '#e0e0e0',
                                        lineWidth: (context) => context.tick.value === 0 ? 3 : 0.5
                                      }
                                    }
                                  }
                                }}
                              />
                              {/* Summary Statistics for Selected Categories */}
                              <div style={{ 
                                marginTop: '30px',
                                background: '#f5f5f5',
                                padding: '20px',
                                borderRadius: '8px'
                              }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>
                                  Selected Income Categories Statistics
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                  <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Total Income</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>
                                      ₹{totalForSelectedCategories.toFixed(2)}
                                    </div>
                                  </div>
                                  <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Average per Transaction</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>
                                      {transactionCount 
                                        ? `₹${(totalForSelectedCategories / transactionCount).toFixed(2)}`
                                        : '₹0.00'}
                                    </div>
                                  </div>
                                  <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Transaction Count</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>
                                      {transactionCount}
                                    </div>
                                  </div>
                                  <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>% of Total Income</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>
                                      {(() => {
                                        const totalIncomeInPeriod = filteredIncome.reduce((sum, e) => sum + parseFloat(e.amount), 0);
                                        return totalIncomeInPeriod > 0 
                                          ? `${((totalForSelectedCategories / totalIncomeInPeriod) * 100).toFixed(1)}%`
                                          : '0.0%';
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div style={{ 
                          padding: '30px', 
                          background: '#f9f9f9', 
                          borderRadius: '8px', 
                          textAlign: 'center',
                          color: '#666'
                        }}>
                          Please select at least one income category to view trend data
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Filtered data for charts */}
                {reportType !== 'monthly_trend' && reportType !== 'income_monthly_trend' && (() => {
                  const allData = reportType === 'expense' ? expenses : income;
                  const filteredData = allData.filter(item => {
                    if (reportFromDate && item.date < reportFromDate) return false;
                    if (reportToDate && item.date > reportToDate) return false;
                    return true;
                  });
                  
                  // Group by category and sum the amounts
                  const categoryMap = new Map();
                  filteredData.forEach(item => {
                    const currentAmount = categoryMap.get(item.category) || 0;
                    categoryMap.set(item.category, currentAmount + parseFloat(item.amount));
                  });
                  
                  // Sort categories by amount (highest to lowest)
                  const sortedCategories = Array.from(categoryMap.entries())
                    .sort((a, b) => b[1] - a[1]);
                  
                  // Extract sorted categories and amounts
                  const categories = sortedCategories.map(entry => entry[0]);
                  const amounts = sortedCategories.map(entry => entry[1]);
                  
                  // Generate color palette based on the number of categories
                  const generateColorPalette = (count) => {
                    const baseColors = [
                      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
                      '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
                    ];
                    const colors = [];
                    for (let i = 0; i < count; i++) {
                      colors.push(baseColors[i % baseColors.length]);
                    }
                    return colors;
                  };
                  
                  const barColors = generateColorPalette(categories.length);
                  
                  return (
                    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                      {/* Bar Chart by Category - Larger */}
                      <div style={{ flex: '3', minWidth: '500px', background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: reportType === 'expense' ? '#4CAF50' : '#2196F3' }}>
                          {reportType === 'expense' ? 'Expenses' : 'Income'} by Category (Bar)
                        </h4>
                        <div style={{ height: `${Math.max(350, categories.length * 30)}px` }}>
                          <Bar
                            data={{
                              labels: categories,
                              datasets: [
                                {
                                  label: 'Amount',
                                  data: amounts,
                                  backgroundColor: barColors,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              indexAxis: 'y',  // Horizontal bar chart
                              plugins: {
                                legend: { display: false },
                                title: { display: false },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      return `₹${context.parsed.x.toFixed(2)}`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                x: { 
                                  beginAtZero: true,
                                  title: {
                                    display: true,
                                    text: 'Amount (₹)'
                                  }
                                },
                                y: {
                                  title: {
                                    display: true,
                                    text: 'Category'
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Pie Chart by Category - Smaller */}
                      <div style={{ flex: '1', minWidth: '300px', background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: reportType === 'expense' ? '#4CAF50' : '#2196F3' }}>
                          {reportType === 'expense' ? 'Expenses' : 'Income'} by Category (Pie)
                        </h4>
                        <div style={{ height: '350px' }}>
                          <Pie
                            data={{
                              labels: categories,
                              datasets: [
                                {
                                  label: 'Amount',
                                  data: amounts,
                                  backgroundColor: barColors,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { 
                                  position: 'right',
                                  labels: {
                                    boxWidth: 12,
                                    font: {
                                      size: 11
                                    }
                                  }
                                },
                                title: { display: false },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                      const percentage = ((context.parsed / total) * 100).toFixed(1);
                                      return `${context.label}: ₹${context.parsed.toFixed(2)} (${percentage}%)`;
                                    }
                                  }
                                }
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {selectedSection === 'cashflow_trend' && (
              <div style={{ marginTop: '0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>Cash Flow Trend</h3>
                {(() => {
                  // Sort all transactions by date
                  const allTransactions = [...expenses, ...income].sort((a, b) => new Date(a.date) - new Date(b.date));
                  
                  // Calculate cumulative values
                  const dates = Array.from(new Set(allTransactions.map(t => t.date))).sort();
                  const cumulativeExpenses = [];
                  const cumulativeIncomes = [];
                  const cashFlows = [];

                  dates.forEach(date => {
                    const dayExpenses = expenses
                      .filter(e => e.date <= date)
                      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                    
                    const dayIncome = income
                      .filter(i => i.date <= date)
                      .reduce((sum, i) => sum + parseFloat(i.amount), 0);

                    cumulativeExpenses.push(dayExpenses);
                    cumulativeIncomes.push(dayIncome);
                    cashFlows.push(dayIncome - dayExpenses);
                  });

                  return (
                    <div style={{ background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <Line
                        data={{
                          labels: dates,
                          datasets: [
                            {
                              label: 'Cumulative Income',
                              data: cumulativeIncomes,
                              borderColor: '#2196F3',
                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                              fill: true,
                              tension: 0.4
                            },
                            {
                              label: 'Cumulative Expense',
                              data: cumulativeExpenses,
                              borderColor: '#4CAF50',
                              backgroundColor: 'rgba(76, 175, 80, 0.1)',
                              fill: true,
                              tension: 0.4
                            },
                            {
                              label: 'Cash Flow',
                              data: cashFlows,
                              borderColor: '#FFC107',
                              backgroundColor: 'rgba(255, 193, 7, 0.1)',
                              fill: true,
                              tension: 0.4
                            }
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `${context.dataset.label}: ₹${context.parsed.y.toFixed(2)}`;
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: 'Date'
                              }
                            },
                            y: {
                              title: {
                                display: true,
                                text: 'Amount (₹)'
                              },
                              grid: {
                                drawOnChartArea: true,
                                color: (context) => context.tick.value === 0 ? '#666' : '#e0e0e0',
                                lineWidth: (context) => context.tick.value === 0 ? 3 : 0.5
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  );
                })()}
              </div>
            )}

            {selectedSection === 'monthly_report' && (
              <div style={{ marginTop: '0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>Monthly Cash Flow Report (All Sheets)</h3>
                {(() => {
                  if (isLoadingReport) {
                    return (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        Loading data from all sheets...
                      </div>
                    );
                  }
                  
                  // Group transactions by month
                  const monthlyData = {};
                  
                  // Process all expenses
                  allSheetsData.expenses.forEach(expense => {
                    // Extract year-month from the date
                    const yearMonth = expense.date.substring(0, 7); // Format: YYYY-MM
                    
                    if (!monthlyData[yearMonth]) {
                      monthlyData[yearMonth] = { expenses: 0, income: 0 };
                    }
                    
                    monthlyData[yearMonth].expenses += parseFloat(expense.amount);
                  });
                  
                  // Process all income
                  allSheetsData.income.forEach(inc => {
                    const yearMonth = inc.date.substring(0, 7);
                    
                    if (!monthlyData[yearMonth]) {
                      monthlyData[yearMonth] = { expenses: 0, income: 0 };
                    }
                    
                    monthlyData[yearMonth].income += parseFloat(inc.amount);
                  });
                  
                  // Calculate cash flow for each month
                  Object.keys(monthlyData).forEach(month => {
                    monthlyData[month].cashFlow = monthlyData[month].income - monthlyData[month].expenses;
                  });
                  
                  // Sort months in descending order (newest first)
                  const sortedMonths = Object.keys(monthlyData).sort().reverse();
                  
                  // Calculate totals and averages
                  const totalMonths = sortedMonths.length;
                  const totalExpenses = Object.values(monthlyData).reduce((sum, data) => sum + data.expenses, 0);
                  const totalIncome = Object.values(monthlyData).reduce((sum, data) => sum + data.income, 0);
                  const totalCashFlow = Object.values(monthlyData).reduce((sum, data) => sum + data.cashFlow, 0);
                  
                  const averageExpenses = totalMonths > 0 ? totalExpenses / totalMonths : 0;
                  const averageIncome = totalMonths > 0 ? totalIncome / totalMonths : 0;
                  const averageCashFlow = totalMonths > 0 ? totalCashFlow / totalMonths : 0;
                  
                  // Format month for display (YYYY-MM to Month YYYY)
                  const formatMonth = (yearMonth) => {
                    const [year, month] = yearMonth.split('-');
                    const date = new Date(year, parseInt(month) - 1);
                    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
                  };
                  
                  return (
                    <div style={{ background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ marginBottom: '15px', backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>
                        <strong>Note:</strong> This report shows data from all sheets except the default sheet.
                      </div>
                      
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f3e5f5' }}>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Month</th>
                              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Expenses (₹)</th>
                              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Income (₹)</th>
                              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Cash Flow (₹)</th>
                              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedMonths.map(month => (
                              <tr key={month} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px', fontWeight: 500 }}>{formatMonth(month)}</td>
                                <td style={{ padding: '10px', textAlign: 'right', color: '#4CAF50', fontWeight: 500 }}>
                                  {monthlyData[month].expenses.toFixed(2)}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right', color: '#2196F3', fontWeight: 500 }}>
                                  {monthlyData[month].income.toFixed(2)}
                                </td>
                                <td style={{ 
                                  padding: '10px', 
                                  textAlign: 'right', 
                                  color: monthlyData[month].cashFlow >= 0 ? '#2E7D32' : '#C62828',
                                  fontWeight: 'bold'
                                }}>
                                  {monthlyData[month].cashFlow.toFixed(2)}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    backgroundColor: monthlyData[month].cashFlow >= 0 ? '#e8f5e9' : '#ffebee',
                                    color: monthlyData[month].cashFlow >= 0 ? '#2E7D32' : '#C62828',
                                  }}>
                                    {monthlyData[month].cashFlow >= 0 ? 'Surplus' : 'Deficit'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                              <td style={{ padding: '12px', borderTop: '2px solid #ddd' }}>TOTAL</td>
                              <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #ddd', color: '#4CAF50' }}>
                                {totalExpenses.toFixed(2)}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #ddd', color: '#2196F3' }}>
                                {totalIncome.toFixed(2)}
                              </td>
                              <td style={{ 
                                padding: '12px', 
                                textAlign: 'right', 
                                borderTop: '2px solid #ddd',
                                color: totalCashFlow >= 0 ? '#2E7D32' : '#C62828'
                              }}>
                                {totalCashFlow.toFixed(2)}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', borderTop: '2px solid #ddd' }}></td>
                            </tr>
                            <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                              <td style={{ padding: '12px' }}>MONTHLY AVERAGE</td>
                              <td style={{ padding: '12px', textAlign: 'right', color: '#4CAF50' }}>
                                {averageExpenses.toFixed(2)}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', color: '#2196F3' }}>
                                {averageIncome.toFixed(2)}
                              </td>
                              <td style={{ 
                                padding: '12px', 
                                textAlign: 'right',
                                color: averageCashFlow >= 0 ? '#2E7D32' : '#C62828'
                              }}>
                                {averageCashFlow.toFixed(2)}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {selectedSection === 'monthly_comparison' && (
              <div style={{ marginTop: '0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>Monthly Expense Comparison (May vs June)</h3>
                {(() => {
                  if (isLoadingReport) {
                    return (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        Loading data from sheets...
                      </div>
                    );
                  }

                  // DEBUG: Show grocery entries for May and June 2025
                  const groceryMay = allSheetsData.expenses.filter(
                    e => e.category === 'grocery' && e.date >= '2025-05-01' && e.date <= '2025-05-31'
                  );
                  const groceryJune = allSheetsData.expenses.filter(
                    e => e.category === 'grocery' && e.date >= '2025-06-01' && e.date <= '2025-06-30'
                  );

                  // Category selection UI
                  const CategorySelector = () => (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                        Select categories to compare:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {expenseCategories.map(category => (
                          <label
                            key={category}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '6px 12px',
                              backgroundColor: comparisonCategories.includes(category) ? '#e3f2fd' : '#f5f5f5',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              border: '1px solid #ddd',
                              transition: 'all 0.2s'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={comparisonCategories.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setComparisonCategories([...comparisonCategories, category]);
                                } else {
                                  setComparisonCategories(comparisonCategories.filter(c => c !== category));
                                }
                              }}
                              style={{ marginRight: '6px' }}
                            />
                            {category}
                          </label>
                        ))}
                      </div>
                    </div>
                  );

                  // Process data for selected categories
                  const mayStart = '2025-05-01';
                  const mayEnd = '2025-05-31';
                  const junStart = '2025-06-01';
                  const junEnd = '2025-06-30';

                  // Filter expenses for each month and category (ignore sheet_name)
                  const mayExpenses = allSheetsData.expenses.filter(
                    e => e.date >= mayStart && e.date <= mayEnd
                  );
                  const junExpenses = allSheetsData.expenses.filter(
                    e => e.date >= junStart && e.date <= junEnd
                  );

                  // Build monthlyData for selected categories
                  const monthlyData = {
                    '2025-05': {},
                    '2025-06': {}
                  };
                  comparisonCategories.forEach(category => {
                    monthlyData['2025-05'][category] = mayExpenses
                      .filter(e => e.category === category)
                      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                    monthlyData['2025-06'][category] = junExpenses
                      .filter(e => e.category === category)
                      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
                  });

                  // Generate color palette
                  const generateColorPalette = (count) => {
                    const baseColors = [
                      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
                      '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
                    ];
                    const colors = [];
                    for (let i = 0; i < count; i++) {
                      colors.push(baseColors[i % baseColors.length]);
                    }
                    return colors;
                  };

                  const comparisonBarColors = generateColorPalette(comparisonCategories.length);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <CategorySelector />
                      
                      {comparisonCategories.length > 0 ? (
                        <>
                          {/* Bar Chart */}
                          <div style={{ background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#4CAF50' }}>Monthly Expense Comparison</h4>
                            <div style={{ height: '400px' }}>
                              <Bar
                                data={{
                                  labels: comparisonCategories,
                                  datasets: [
                                    {
                                      label: 'May 2025',
                                      data: comparisonCategories.map(category => monthlyData['2025-05'][category] || 0),
                                      backgroundColor: 'rgba(33, 150, 243, 0.7)', // Blue
                                      borderColor: 'rgba(33, 150, 243, 1)',
                                      borderWidth: 1
                                    },
                                    {
                                      label: 'June 2025',
                                      data: comparisonCategories.map(category => monthlyData['2025-06'][category] || 0),
                                      backgroundColor: 'rgba(76, 175, 80, 0.7)', // Green
                                      borderColor: 'rgba(76, 175, 80, 1)',
                                      borderWidth: 1
                                    }
                                  ]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                      labels: {
                                        boxWidth: 12,
                                        font: { size: 11 }
                                      }
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context) {
                                          return `${context.dataset.label}: ₹${context.parsed.y.toFixed(2)}`;
                                        }
                                      }
                                    }
                                  },
                                  scales: {
                                    x: {
                                      title: {
                                        display: true,
                                        text: 'Category'
                                      }
                                    },
                                    y: {
                                      beginAtZero: true,
                                      title: {
                                        display: true,
                                        text: 'Amount (₹)'
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Summary Table */}
                          <div style={{ background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#4CAF50' }}>Monthly Summary</h4>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#f3e5f5' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Category</th>
                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>May 2025</th>
                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>June 2025</th>
                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Difference</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {comparisonCategories.map(category => {
                                    const mayAmount = monthlyData['2025-05'][category] || 0;
                                    const juneAmount = monthlyData['2025-06'][category] || 0;
                                    const difference = juneAmount - mayAmount;
                                    return (
                                      <tr key={category} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px', fontWeight: 500 }}>{category}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', color: '#4CAF50' }}>
                                          {mayAmount.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right', color: '#4CAF50' }}>
                                          {juneAmount.toFixed(2)}
                                        </td>
                                        <td style={{ 
                                          padding: '10px', 
                                          textAlign: 'right', 
                                          color: difference >= 0 ? '#2E7D32' : '#C62828',
                                          fontWeight: 'bold'
                                        }}>
                                          {difference >= 0 ? '+' : ''}{difference.toFixed(2)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                                    <td style={{ padding: '12px', borderTop: '2px solid #ddd' }}>TOTAL</td>
                                    <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #ddd', color: '#4CAF50' }}>
                                      {comparisonCategories.reduce((sum, cat) => sum + (monthlyData['2025-05'][cat] || 0), 0).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #ddd', color: '#4CAF50' }}>
                                      {comparisonCategories.reduce((sum, cat) => sum + (monthlyData['2025-06'][cat] || 0), 0).toFixed(2)}
                                    </td>
                                    <td style={{ 
                                      padding: '12px', 
                                      textAlign: 'right', 
                                      borderTop: '2px solid #ddd',
                                      color: comparisonCategories.reduce((sum, cat) => 
                                        sum + ((monthlyData['2025-06'][cat] || 0) - (monthlyData['2025-05'][cat] || 0)), 0) >= 0 ? '#2E7D32' : '#C62828'
                                    }}>
                                      {comparisonCategories.reduce((sum, cat) => 
                                        sum + ((monthlyData['2025-06'][cat] || 0) - (monthlyData['2025-05'][cat] || 0)), 0).toFixed(2)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666', background: '#fafafa', borderRadius: '8px' }}>
                          Please select at least one category to view the comparison
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {selectedSection === 'monthly_income_comparison' && (
              <div style={{ marginTop: '0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>Monthly Income Comparison (May vs June)</h3>
                {(() => {
                  if (isLoadingReport) {
                    return (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                        Loading data from sheets...
                      </div>
                    );
                  }
                  // Category selection UI
                  const CategorySelector = () => (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                        Select income categories to compare:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {incomeCategories.map(category => (
                          <label
                            key={category}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '6px 12px',
                              backgroundColor: comparisonCategories.includes(category) ? '#e3f2fd' : '#f5f5f5',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              border: '1px solid #ddd',
                              transition: 'all 0.2s'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={comparisonCategories.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setComparisonCategories([...comparisonCategories, category]);
                                } else {
                                  setComparisonCategories(comparisonCategories.filter(c => c !== category));
                                }
                              }}
                              style={{ marginRight: '6px' }}
                            />
                            {category}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                  // Process data for selected categories
                  const mayStart = '2025-05-01';
                  const mayEnd = '2025-05-31';
                  const junStart = '2025-06-01';
                  const junEnd = '2025-06-30';
                  // Filter income for each month and category
                  const mayIncome = allSheetsData.income.filter(
                    i => i.date >= mayStart && i.date <= mayEnd
                  );
                  const junIncome = allSheetsData.income.filter(
                    i => i.date >= junStart && i.date <= junEnd
                  );
                  // Build monthlyData for selected categories
                  const monthlyData = {
                    '2025-05': {},
                    '2025-06': {}
                  };
                  comparisonCategories.forEach(category => {
                    monthlyData['2025-05'][category] = mayIncome
                      .filter(i => i.category === category)
                      .reduce((sum, i) => sum + parseFloat(i.amount), 0);
                    monthlyData['2025-06'][category] = junIncome
                      .filter(i => i.category === category)
                      .reduce((sum, i) => sum + parseFloat(i.amount), 0);
                  });
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <CategorySelector />
                      {comparisonCategories.length > 0 ? (
                        <>
                          {/* Bar Chart */}
                          <div style={{ background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#2196F3' }}>Monthly Income Comparison</h4>
                            <div style={{ height: '400px' }}>
                              <Bar
                                data={{
                                  labels: comparisonCategories,
                                  datasets: [
                                    {
                                      label: 'May 2025',
                                      data: comparisonCategories.map(category => monthlyData['2025-05'][category] || 0),
                                      backgroundColor: 'rgba(33, 150, 243, 0.7)', // Blue
                                      borderColor: 'rgba(33, 150, 243, 1)',
                                      borderWidth: 1
                                    },
                                    {
                                      label: 'June 2025',
                                      data: comparisonCategories.map(category => monthlyData['2025-06'][category] || 0),
                                      backgroundColor: 'rgba(76, 175, 80, 0.7)', // Green
                                      borderColor: 'rgba(76, 175, 80, 1)',
                                      borderWidth: 1
                                    }
                                  ]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                      labels: {
                                        boxWidth: 12,
                                        font: { size: 11 }
                                      }
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context) {
                                          return `${context.dataset.label}: ₹${context.parsed.y.toFixed(2)}`;
                                        }
                                      }
                                    }
                                  },
                                  scales: {
                                    x: {
                                      title: {
                                        display: true,
                                        text: 'Category'
                                      }
                                    },
                                    y: {
                                      beginAtZero: true,
                                      title: {
                                        display: true,
                                        text: 'Amount (₹)'
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                          {/* Summary Table */}
                          <div style={{ background: '#fafafa', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#2196F3' }}>Monthly Income Summary</h4>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#e3f2fd' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Category</th>
                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>May 2025</th>
                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>June 2025</th>
                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Difference</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {comparisonCategories.map(category => {
                                    const mayAmount = monthlyData['2025-05'][category] || 0;
                                    const juneAmount = monthlyData['2025-06'][category] || 0;
                                    const difference = juneAmount - mayAmount;
                                    return (
                                      <tr key={category} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px', fontWeight: 500 }}>{category}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', color: '#2196F3' }}>
                                          {mayAmount.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right', color: '#2196F3' }}>
                                          {juneAmount.toFixed(2)}
                                        </td>
                                        <td style={{ 
                                          padding: '10px', 
                                          textAlign: 'right', 
                                          color: difference >= 0 ? '#2E7D32' : '#C62828',
                                          fontWeight: 'bold'
                                        }}>
                                          {difference >= 0 ? '+' : ''}{difference.toFixed(2)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                                    <td style={{ padding: '12px', borderTop: '2px solid #ddd' }}>TOTAL</td>
                                    <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #ddd', color: '#2196F3' }}>
                                      {comparisonCategories.reduce((sum, cat) => sum + (monthlyData['2025-05'][cat] || 0), 0).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #ddd', color: '#2196F3' }}>
                                      {comparisonCategories.reduce((sum, cat) => sum + (monthlyData['2025-06'][cat] || 0), 0).toFixed(2)}
                                    </td>
                                    <td style={{ 
                                      padding: '12px', 
                                      textAlign: 'right', 
                                      borderTop: '2px solid #ddd',
                                      color: comparisonCategories.reduce((sum, cat) => 
                                        sum + ((monthlyData['2025-06'][cat] || 0) - (monthlyData['2025-05'][cat] || 0)), 0) >= 0 ? '#2E7D32' : '#C62828'
                                    }}>
                                      {comparisonCategories.reduce((sum, cat) => 
                                        sum + ((monthlyData['2025-06'][cat] || 0) - (monthlyData['2025-05'][cat] || 0)), 0).toFixed(2)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666', background: '#fafafa', borderRadius: '8px' }}>
                          Please select at least one income category to view the comparison
                        </div>
                      )}
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