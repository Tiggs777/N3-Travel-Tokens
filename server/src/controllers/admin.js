const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { mintTo, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, createMint, getAccount } = require('@solana/spl-token');
const { sendAndConfirmTransaction } = require('@solana/web3.js');
const bcrypt = require('bcrypt');

const YOUR_ADMIN_SECRET_KEY_ARRAY = require("/home/tiggs777/.config/solana/id.json");
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(YOUR_ADMIN_SECRET_KEY_ARRAY));
const { createTransferInstruction } = require('@solana/spl-token');
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

exports.createToken = async (req, res) => {
  const { name, supply, image_url, description, ticker } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const mintKeypair = Keypair.generate();
    console.log('Creating token with mint:', mintKeypair.publicKey.toBase58());

    const adminBalance = await connection.getBalance(adminKeypair.publicKey);
    console.log('Admin balance:', adminBalance / 1e9, 'SOL');
    if (adminBalance < 0.01) throw new Error('Admin wallet has insufficient SOL');

    const mintPubkey = await createMint(
      connection,
      adminKeypair,
      adminKeypair.publicKey,
      null,
      9
    );
    console.log('Mint created:', mintPubkey.toBase58());

    const mintInfo = await connection.getAccountInfo(mintPubkey);
    if (!mintInfo) throw new Error('Mint account not found after creation');
    console.log('Mint account verified on-chain, owner:', mintInfo.owner.toBase58());

    const adminATA = await getOrCreateAssociatedTokenAccount(
      connection,
      adminKeypair,
      mintPubkey,
      adminKeypair.publicKey
    );
    console.log('Admin ATA:', adminATA.address.toBase58());

    const adjustedSupply = supply * Math.pow(10, 9);
    const tx = await mintTo(
      connection,
      adminKeypair,
      mintPubkey,
      adminATA.address,
      adminKeypair,
      adjustedSupply
    );
    console.log('Initial supply minted (raw units):', adjustedSupply, 'tx:', tx);

    await pool.query(
      'INSERT INTO tokens (mint, name, supply, image_url, description, ticker) VALUES ($1, $2, $3, $4, $5, $6)',
      [mintPubkey.toBase58(), name, supply, image_url, description, ticker]
    );

    res.json({ mint: mintPubkey.toBase58() });
  } catch (error) {
    console.error('Token creation error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create token', details: error.message });
  }
};

exports.getTokens = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const result = await pool.query('SELECT * FROM tokens');
    res.json(result.rows);
  } catch (error) {
    console.error('Get tokens error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch tokens', details: error.message });
  }
};

exports.deleteToken = async (req, res) => {
  const { mint } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    await pool.query('DELETE FROM tokens WHERE mint = $1', [mint]);
    res.json({ success: true, message: 'Token deleted' });
  } catch (error) {
    console.error('Delete token error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to delete token', details: error.message });
  }
};

exports.mintMoreTokens = async (req, res) => {
  const { mint, amount } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const mintPubkey = new PublicKey(mint);
    const adminATA = await getOrCreateAssociatedTokenAccount(
      connection,
      adminKeypair,
      mintPubkey,
      adminKeypair.publicKey
    );

    const adjustedAmount = amount * Math.pow(10, 9);
    const tx = await mintTo(
      connection,
      adminKeypair,
      mintPubkey,
      adminATA.address,
      adminKeypair,
      adjustedAmount
    );
    console.log(`Minted ${amount} more tokens for ${mint}, tx:`, tx);

    await pool.query(
      'UPDATE tokens SET supply = supply + $1 WHERE mint = $2',
      [amount, mint]
    );

    res.json({ success: true, message: `Minted ${amount} more tokens for ${mint}` });
  } catch (error) {
    console.error('Mint more tokens error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to mint more tokens', details: error.message });
  }
};

exports.getUserTokenBalances = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const users = await pool.query('SELECT id, wallet FROM users');
    const tokens = await pool.query('SELECT mint FROM tokens');
    const balances = { users: [], admin: {} };

    // Fetch admin balances
    console.log('Fetching admin balances for tokens:', tokens.rows.map(t => t.mint));
    for (const token of tokens.rows) {
      const mintPubkey = new PublicKey(token.mint);
      try {
        const adminATA = await getOrCreateAssociatedTokenAccount(
          connection,
          adminKeypair,
          mintPubkey,
          adminKeypair.publicKey
        );
        const ataAccount = await getAccount(connection, adminATA.address);
        balances.admin[token.mint] = Number(ataAccount.amount) / Math.pow(10, 9);
        console.log(`Admin balance for ${token.mint}: ${balances.admin[token.mint]}`);
      } catch (error) {
        balances.admin[token.mint] = 0;
        console.error(`No ATA or error for admin token ${token.mint}:`, error.message);
      }
    }

    // Fetch user balances
    for (const user of users.rows) {
      if (!user.wallet) {
        balances.users.push({ userId: user.id, wallet: null, tokens: {} });
        continue;
      }

      const userBalances = { userId: user.id, wallet: user.wallet, tokens: {} };
      let userPubkey;
      try {
        userPubkey = new PublicKey(user.wallet);
      } catch (error) {
        console.error(`Invalid wallet for user ${user.id}: ${user.wallet}`, error.message);
        balances.users.push(userBalances);
        continue;
      }

      for (const token of tokens.rows) {
        const mintPubkey = new PublicKey(token.mint);
        try {
          const ataAddress = await getAssociatedTokenAddress(mintPubkey, userPubkey);
          const ataAccount = await getAccount(connection, ataAddress);
          userBalances.tokens[token.mint] = Number(ataAccount.amount) / Math.pow(10, 9);
        } catch (error) {
          userBalances.tokens[token.mint] = 0;
        }
      }
      balances.users.push(userBalances);
    }

    res.json(balances);
  } catch (error) {
    console.error('Get user token balances error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch user token balances', details: error.message });
  }
};

exports.createTravelPackage = async (req, res) => {
  const { name, price, image_url, description } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const result = await pool.query(
      'INSERT INTO travel_packages (name, price, image_url, description) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, price, image_url, description]
    );
    res.json({ id: result.rows[0].id });
  } catch (error) {
    console.error('Create travel package error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create travel package', details: error.message });
  }
};

exports.getTravelPackages = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM travel_packages');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch travel packages' });
  }
};

exports.updateTravelPackage = async (req, res) => {
  const { id, name, price, image_url, description } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    await pool.query(
      'UPDATE travel_packages SET name = $1, price = $2, image_url = $3, description = $4 WHERE id = $5',
      [name, price, image_url, description, id]
    );
    res.json({ success: true, message: 'Travel package updated' });
  } catch (error) {
    console.error('Update travel package error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update travel package', details: error.message });
  }
};

exports.deleteTravelPackage = async (req, res) => {
  const { ids } = req.body; // Changed from 'id' to 'ids' to accept an array
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    // Ensure ids is an array; if single ID, convert to array
    const idArray = Array.isArray(ids) ? ids : [ids];
    if (idArray.length === 0) return res.status(400).json({ error: 'No IDs provided' });

    await pool.query('DELETE FROM travel_packages WHERE id = ANY($1)', [idArray]);
    res.json({ success: true, message: `${idArray.length} travel package(s) deleted` });
  } catch (error) {
    console.error('Delete travel package error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to delete travel package(s)', details: error.message });
  }
};

exports.getUserTokens = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const userId = decoded.id;

    const tokensResult = await pool.query('SELECT mint, name, ticker FROM tokens');
    res.json(tokensResult.rows);
  } catch (error) {
    console.error('Get user tokens error:', error.message, error.stack);
    if (error.message === 'Token expired. Please log in again.') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch user tokens', details: error.message });
  }
};

exports.airdropTokens = async (req, res) => {
  const { userIds, groupId, amount, mint } = req.body; // Accept userIds or groupId
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    let targetUserIds = [];
    if (userIds) {
      targetUserIds = userIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    } else if (groupId) {
      const groupResult = await pool.query(
        'SELECT user_id FROM user_group_members WHERE group_id = $1',
        [groupId]
      );
      targetUserIds = groupResult.rows.map(row => row.user_id);
    } else {
      return res.status(400).json({ error: 'Provide either userIds or groupId' });
    }

    if (targetUserIds.length === 0) return res.status(404).json({ error: 'No users found' });

    const mintPubkey = new PublicKey(mint);
    const adminBalance = await connection.getBalance(adminKeypair.publicKey);
    console.log('Admin SOL balance:', adminBalance / 1e9, 'SOL');
    if (adminBalance < 0.01 * targetUserIds.length) {
      throw new Error('Admin wallet has insufficient SOL to pay fees for all airdrops');
    }

    const adjustedAmount = amount * Math.pow(10, 9);
    let successCount = 0;
    const messages = [];

    for (const userId of targetUserIds) {
      const userResult = await pool.query('SELECT wallet FROM users WHERE id = $1', [userId]);
      if (!userResult.rows[0]?.wallet) continue;

      const userWallet = new PublicKey(userResult.rows[0].wallet);
      const destinationATA = await getAssociatedTokenAddress(mintPubkey, userWallet);

      const accountInfo = await connection.getAccountInfo(destinationATA);
      if (!accountInfo) {
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            adminKeypair.publicKey,
            destinationATA,
            userWallet,
            mintPubkey
          )
        );
        await sendAndConfirmTransaction(connection, transaction, [adminKeypair]);
      }

      const tx = await mintTo(
        connection,
        adminKeypair,
        mintPubkey,
        destinationATA,
        adminKeypair,
        adjustedAmount
      );
      console.log(`Airdropped ${amount} tokens to user ${userId}, tx:`, tx);
      console.log(`This action adds ${amount} tokens to the total circulating supply for ${mint}`);

      const ataAccount = await getAccount(connection, destinationATA);
      console.log(`User ${userId} ATA balance after airdrop:`, Number(ataAccount.amount) / Math.pow(10, 9));
      successCount++;
      messages.push(`Airdropped ${amount} tokens to user ${userId} (adds to total circulating supply)`);
    }

    await pool.query(
      'UPDATE tokens SET supply = supply + $1 WHERE mint = $2',
      [amount * targetUserIds.length, mint]
    );

    res.json({
      success: true,
      message: `${successCount} users received ${amount} tokens`,
      details: messages
    });
  } catch (error) {
    console.error('Airdrop error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to airdrop tokens', details: error.message });
  }
};

exports.transferTokens = async (req, res) => {
  const { userIds, groupId, amount, mint } = req.body; // Accept userIds or groupId
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    let targetUserIds = [];
    if (userIds) {
      targetUserIds = userIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    } else if (groupId) {
      const groupResult = await pool.query(
        'SELECT user_id FROM user_group_members WHERE group_id = $1',
        [groupId]
      );
      targetUserIds = groupResult.rows.map(row => row.user_id);
    } else {
      return res.status(400).json({ error: 'Provide either userIds or groupId' });
    }

    if (targetUserIds.length === 0) return res.status(404).json({ error: 'No users found' });

    const mintPubkey = new PublicKey(mint);
    const adminBalance = await connection.getBalance(adminKeypair.publicKey);
    console.log('Admin SOL balance:', adminBalance / 1e9, 'SOL');
    if (adminBalance < 0.01 * targetUserIds.length) {
      throw new Error('Admin wallet has insufficient SOL to pay fees for all transfers');
    }

    const sourceATA = await getOrCreateAssociatedTokenAccount(
      connection,
      adminKeypair,
      mintPubkey,
      adminKeypair.publicKey
    );
    const adjustedAmount = amount * Math.pow(10, 9);
    const sourceAccount = await getAccount(connection, sourceATA.address);
    if (Number(sourceAccount.amount) < adjustedAmount * targetUserIds.length) {
      return res.status(400).json({ error: 'Insufficient tokens in admin account for all transfers' });
    }

    let successCount = 0;
    const messages = [];

    for (const userId of targetUserIds) {
      const userResult = await pool.query('SELECT wallet FROM users WHERE id = $1', [userId]);
      if (!userResult.rows[0]?.wallet) continue;

      const userWallet = new PublicKey(userResult.rows[0].wallet);
      const destinationATA = await getAssociatedTokenAddress(mintPubkey, userWallet);

      const transaction = new Transaction();
      transaction.add(
        createTransferInstruction(
          sourceATA.address,
          destinationATA,
          adminKeypair.publicKey,
          adjustedAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const txHash = await sendAndConfirmTransaction(connection, transaction, [adminKeypair]);
      console.log(`Transferred ${amount} tokens to user ${userId}, tx:`, txHash);

      const userPostTransfer = await getAccount(connection, destinationATA);
      console.log(`User ${userId} ATA balance after transfer:`, Number(userPostTransfer.amount) / Math.pow(10, 9));
      const adminPostTransfer = await getAccount(connection, sourceATA.address);
      console.log('Admin ATA balance post-transfer:', Number(adminPostTransfer.amount) / Math.pow(10, 9));
      successCount++;
      messages.push(`Transferred ${amount} tokens to user ${userId}`);
    }

    res.json({
      success: true,
      message: `${successCount} users received ${amount} tokens`,
      details: messages
    });
  } catch (error) {
    console.error('Transfer error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to transfer tokens', details: error.message });
  }
};

exports.getUsers = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { sort = 'created_at', order = 'desc', startDate, endDate } = req.query;
    let query = 'SELECT id, email, wallet FROM users';
    let params = [];
    let whereClause = [];

    if (startDate || endDate) {
      if (startDate) {
        whereClause.push('created_at >= $' + (params.length + 1));
        params.push(new Date(startDate).toISOString());
      }
      if (endDate) {
        whereClause.push('created_at <= $' + (params.length + 1));
        params.push(new Date(endDate).toISOString());
      }
      query += ' WHERE ' + whereClause.join(' AND ');
    }

    query += ' ORDER BY ' + sort + ' ' + order;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
};

exports.createUser = async (req, res) => {
  const { email, password, role } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const privateKey = Buffer.from(keypair.secretKey).toString('base64');

    const result = await pool.query(
      'INSERT INTO users (email, password, wallet, private_key, role, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
      [email, hashedPassword, publicKey, privateKey, role || 'user']
    );
    res.json({ id: result.rows[0].id, message: 'User created' });
  } catch (error) {
    console.error('Create user error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
};

exports.updateUserInfo = async (req, res) => {
  const { userId, email, wallet, privateKey, role } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    await pool.query(
      'UPDATE users SET email = $1, wallet = $2, private_key = $3, role = $4 WHERE id = $5',
      [email, wallet, privateKey, role, userId]
    );
    res.json({ success: true, message: 'User info updated' });
  } catch (error) {
    console.error('Update user info error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update user info', details: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
};

exports.impersonateUser = async (req, res) => {
  const { userId } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });

    const newToken = jwt.sign({ id: userId, role: userResult.rows[0].role }, 'secret', { expiresIn: '1h' });
    res.json({ token: newToken });
  } catch (error) {
    console.error('Impersonate user error:', error.message, error.stack);
    if (error.message === 'Token expired. Please log in again.') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to impersonate user', details: error.message });
  }
};

exports.createUserGroup = async (req, res) => {
  const { name, userIds } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const result = await pool.query(
      'INSERT INTO user_groups (name) VALUES ($1) RETURNING id',
      [name]
    );
    const groupId = result.rows[0].id;

    if (userIds && userIds.length > 0) {
      const values = userIds.map(userId => `(${groupId}, ${userId})`).join(', ');
      await pool.query(
        `INSERT INTO user_group_members (group_id, user_id) VALUES ${values}`
      );
    }

    res.json({ success: true, message: `User group ${name} created`, id: groupId });
  } catch (error) {
    console.error('Create user group error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create user group', details: error.message });
  }
};

exports.getUserGroups = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const groups = await pool.query(`
      SELECT ug.id, ug.name, json_agg(u.id) as user_ids
      FROM user_groups ug
      LEFT JOIN user_group_members ugm ON ug.id = ugm.group_id
      LEFT JOIN users u ON ugm.user_id = u.id
      GROUP BY ug.id, ug.name
    `);
    res.json(groups.rows);
  } catch (error) {
    console.error('Get user groups error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch user groups', details: error.message });
  }
};

exports.updateUserGroup = async (req, res) => {
  const { groupId, name, userIds } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    await pool.query('UPDATE user_groups SET name = $1 WHERE id = $2', [name, groupId]);

    // Clear existing members
    await pool.query('DELETE FROM user_group_members WHERE group_id = $1', [groupId]);

    // Add new members
    if (userIds && userIds.length > 0) {
      const values = userIds.map(userId => `(${groupId}, ${userId})`).join(', ');
      await pool.query(
        `INSERT INTO user_group_members (group_id, user_id) VALUES ${values}`
      );
    }

    res.json({ success: true, message: `User group ${name} updated` });
  } catch (error) {
    console.error('Update user group error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update user group', details: error.message });
  }
};

exports.deleteUserGroup = async (req, res) => {
  const { groupId } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    await pool.query('DELETE FROM user_group_members WHERE group_id = $1', [groupId]);
    await pool.query('DELETE FROM user_groups WHERE id = $1', [groupId]);
    res.json({ success: true, message: 'User group deleted' });
  } catch (error) {
    console.error('Delete user group error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to delete user group', details: error.message });
  };
} 
exports.seedTravelPackages = async () => {
  const packages = [
    { name: 'Paris Getaway', price: 500, image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34', description: 'A romantic escape to the City of Lights.' },
    { name: 'New York Adventure', price: 750, image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62f167', description: 'Explore the bustling streets of NYC.' },
    { name: 'Tokyo Explorer', price: 1000, image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', description: 'Dive into the vibrant culture of Tokyo.' },
  ];
  for (const pkg of packages) {
    await pool.query(
      'INSERT INTO travel_packages (name, price, image_url, description) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [pkg.name, pkg.price, pkg.image_url, pkg.description]
    );
  }
  console.log('Sample travel packages seeded');
};

exports.getSystemWalletBalance = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const balance = await connection.getBalance(adminKeypair.publicKey);
    res.json({ balance: balance / 1e9 });
  } catch (error) {
    console.error('Get system wallet balance error:', error.message, error.stack);
    if (error.message === 'Token expired. Please log in again.') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch system wallet balance', details: error.message });
  }
};

exports.getSystemWalletPublicKey = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    res.json({ publicKey: adminKeypair.publicKey.toBase58() });
  } catch (error) {
    console.error('Get system wallet public key error:', error.message, error.stack);
    if (error.message === 'Token expired. Please log in again.') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch system wallet public key', details: error.message });
  }
};

exports.getAllUsersInfo = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { sort = 'created_at', order = 'desc', startDate, endDate } = req.query;
    let query = 'SELECT id, email, wallet, private_key, role, created_at FROM users';
    let params = [];
    let whereClause = [];

    if (startDate || endDate) {
      if (startDate) {
        whereClause.push('created_at >= $' + (params.length + 1));
        params.push(new Date(startDate).toISOString());
      }
      if (endDate) {
        whereClause.push('created_at <= $' + (params.length + 1));
        params.push(new Date(endDate).toISOString());
      }
      query += ' WHERE ' + whereClause.join(' AND ');
    }

    query += ' ORDER BY ' + sort + ' ' + order;
    const users = await pool.query(query, params);
    res.json(users.rows);
  } catch (error) {
    console.error('Get all users info error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch users info', details: error.message });
  }
};