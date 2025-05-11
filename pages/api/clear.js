import { deleteAllExpenses, deleteAllIncome } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await deleteAllExpenses();
      await deleteAllIncome();
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 