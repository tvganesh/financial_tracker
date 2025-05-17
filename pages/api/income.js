import { initializeDatabase } from '../../utils/db';

export default async function handler(req, res) {
  const db = await initializeDatabase();

  if (req.method === 'GET') {
    try {
      const sheet = req.query.sheet || 'default';
      const income = await db.all('SELECT * FROM income WHERE sheet_name = ? ORDER BY date DESC', [sheet]);
      res.status(200).json({ success: true, data: income });
    } catch (error) {
      console.error('Error fetching income:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { date, income, category, amount, sheet_name = 'default' } = req.body;
      await db.run(
        'INSERT INTO income (date, income, category, amount, sheet_name) VALUES (?, ?, ?, ?, ?)',
        [date, income, category, amount, sheet_name]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error creating income:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, date, income, category, amount, sheet_name = 'default' } = req.body;
      await db.run(
        'UPDATE income SET date = ?, income = ?, category = ?, amount = ?, sheet_name = ? WHERE id = ?',
        [date, income, category, amount, sheet_name, id]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating income:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      await db.run('DELETE FROM income WHERE id = ?', [id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting income:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 