import { 
  insertExpense, 
  getLastFiveExpenses, 
  deleteLastFiveExpenses,
  updateExpense,
  deleteExpense,
  getExpenseById
} from '../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const result = await insertExpense(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } 
  else if (req.method === 'GET') {
    try {
      const expenses = await getLastFiveExpenses();
      res.status(200).json({ success: true, data: expenses });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  else if (req.method === 'DELETE') {
    try {
      if (req.query.id) {
        // Delete specific expense
        await deleteExpense(req.query.id);
      } else {
        // Delete last 5 expenses
        await deleteLastFiveExpenses();
      }
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  else if (req.method === 'PUT') {
    try {
      const { id, ...expenseData } = req.body;
      const result = await updateExpense(id, expenseData);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 