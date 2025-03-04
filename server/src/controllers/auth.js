const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Keypair } = require('@solana/web3.js');

exports.signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const privateKey = Buffer.from(keypair.secretKey).toString('base64');

    const result = await pool.query(
      'INSERT INTO users (email, password, wallet, private_key, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [email, hashedPassword, publicKey, privateKey, 'user']
    );
    const token = jwt.sign({ id: result.rows[0].id, role: 'user' }, 'secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Signup error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to sign up', details: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, 'secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to log in', details: error.message });
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, 'admin']);
    const admin = result.rows[0];
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    const token = jwt.sign({ id: admin.id, role: 'admin', email: user.email }, 'secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Admin login error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to log in as admin', details: error.message });
  }
};