import { initializeDatabase } from '../../utils/db';

export default async function handler(req, res) {
  const db = await initializeDatabase();

  if (req.method === 'GET') {
    try {
      const sheet = req.query.sheet || 'default';
      const expenses = await db.all('SELECT * FROM expenses WHERE sheet_name = ? ORDER BY date DESC', [sheet]);
      res.status(200).json({ success: true, data: expenses });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { date, expense, category, amount, sheet_name = 'default' } = req.body;
      await db.run(
        'INSERT INTO expenses (date, expense, category, amount, sheet_name) VALUES (?, ?, ?, ?, ?)',
        [date, expense, category, amount, sheet_name]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, date, expense, category, amount, sheet_name = 'default' } = req.body;
      await db.run(
        'UPDATE expenses SET date = ?, expense = ?, category = ?, amount = ?, sheet_name = ? WHERE id = ?',
        [date, expense, category, amount, sheet_name, id]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      await db.run('DELETE FROM expenses WHERE id = ?', [id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 