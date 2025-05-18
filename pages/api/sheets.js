import { initializeDatabase } from '../../utils/db';

export default async function handler(req, res) {
  const db = await initializeDatabase();

  if (req.method === 'POST') {
    try {
      const { name } = req.body;
      
      // Check if sheet name already exists
      const existingSheet = await db.get('SELECT name FROM sheets WHERE name = ?', [name]);
      if (existingSheet) {
        return res.status(400).json({ success: false, error: 'Sheet name already exists' });
      }

      // Insert new sheet
      await db.run('INSERT INTO sheets (name) VALUES (?)', [name]);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error creating sheet:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const sheets = await db.all('SELECT name FROM sheets ORDER BY created_at');
      res.status(200).json({ success: true, data: sheets });
    } catch (error) {
      console.error('Error fetching sheets:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { name } = req.query;
      
      // Don't allow deleting the default sheet
      if (name === 'default') {
        return res.status(400).json({ success: false, error: 'Cannot delete default sheet' });
      }

      // Delete all expenses and income for this sheet
      await db.run('DELETE FROM expenses WHERE sheet_name = ?', [name]);
      await db.run('DELETE FROM income WHERE sheet_name = ?', [name]);
      
      // Delete the sheet
      await db.run('DELETE FROM sheets WHERE name = ?', [name]);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting sheet:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 