const { Keypair } = require('@solana/web3.js');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verifyToken = (token) => {
  try {
    return jwt.verify(token, 'secret');
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired. Please log in again.');
    }
    throw error;
  }
};

exports.connectWallet = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const userId = decoded.id;

    const existing = await pool.query('SELECT wallet, private_key FROM users WHERE id = $1', [userId]);
    if (existing.rows[0]?.wallet) {
      return res.json({ wallet: existing.rows[0].wallet });
    }

    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const privateKey = Buffer.from(keypair.secretKey).toString('base64');

    await pool.query('UPDATE users SET wallet = $1, private_key = $2 WHERE id = $3', [publicKey, privateKey, userId]);
    res.json({ wallet: publicKey });
  } catch (error) {
    console.error('Connect wallet error:', error.message, error.stack);
    if (error.message === 'Token expired. Please log in again.') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to connect wallet', details: error.message });
  }
};

exports.getWallet = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const userId = decoded.id;

    const result = await pool.query('SELECT wallet FROM users WHERE id = $1', [userId]);
    const wallet = result.rows[0]?.wallet;
    if (!wallet) return res.status(404).json({ error: 'No wallet found' });
    res.json({ wallet });
  } catch (error) {
    console.error('Get wallet error:', error.message, error.stack);
    if (error.message === 'Token expired. Please log in again.') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch wallet', details: error.message });
  }
};

exports.getPrivateKey = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const userId = decoded.id;

    const result = await pool.query('SELECT private_key FROM users WHERE id = $1', [userId]);
    const privateKey = result.rows[0]?.private_key;
    if (!privateKey) {
      const keypair = Keypair.generate();
      const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
      await pool.query('UPDATE users SET private_key = $1 WHERE id = $2', [privateKeyBase64, userId]);
      res.json({ privateKey: privateKeyBase64 });
    } else {
      res.json({ privateKey });
    }
  } catch (error) {
    console.error('Get private key error:', error.message, error.stack);
    if (error.message === 'Token expired. Please log in again.') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch private key', details: error.message });
  }
};