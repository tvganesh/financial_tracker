import { 
  insertIncome, 
  getLastFiveIncome, 
  deleteLastFiveIncome,
  updateIncome,
  deleteIncome,
  getIncomeById
} from '../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const result = await insertIncome(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } 
  else if (req.method === 'GET') {
    try {
      const income = await getLastFiveIncome();
      res.status(200).json({ success: true, data: income });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  else if (req.method === 'DELETE') {
    try {
      if (req.query.id) {
        // Delete specific income
        await deleteIncome(req.query.id);
      } else {
        // Delete last 5 income entries
        await deleteLastFiveIncome();
      }
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  else if (req.method === 'PUT') {
    try {
      const { id, ...incomeData } = req.body;
      const result = await updateIncome(id, incomeData);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 