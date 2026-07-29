const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'bankuser',
  password: process.env.DB_PASSWORD || 'bankpass',
  database: process.env.DB_NAME || 'bankdb',
  port: 5432,
});

// Fetch all account details
app.get('/api/accounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Perform fund transfer
app.post('/api/transfer', async (req, res) => {
  const { fromAccount, toAccount, amount } = req.body;
  const transferAmount = parseFloat(amount);

  if (!fromAccount || !toAccount || isNaN(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check sender balance
    const senderRes = await client.query('SELECT balance FROM accounts WHERE account_number = $1', [fromAccount]);
    if (senderRes.rows.length === 0 || parseFloat(senderRes.rows[0].balance) < transferAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient funds or account not found' });
    }

    // Deduct & Credit
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE account_number = $2', [transferAmount, fromAccount]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE account_number = $2', [transferAmount, toAccount]);
    
    await client.query('COMMIT');
    res.json({ message: 'Transfer successful' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend API running on port ${PORT}`));
