import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = join(__dirname, '../data/database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Initializing database...');

db.serialize(() => {
  try {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      is_admin INTEGER,
      created_at TEXT,
      qbit_url TEXT,
      qbit_username TEXT,
      qbit_password TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        throw err;
      }
    });

    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating settings table:', err);
        throw err;
      }
    });

    // Create admin user if it doesn't exist
    db.get("SELECT * FROM users WHERE username = 'admin'", async (err, row) => {
      if (err) {
        console.error('Error checking admin user:', err);
        return;
      }

      if (!row) {
        console.log('Creating admin user...');
        const hashedPassword = await bcrypt.hash('admin', 10);
        db.run(
          'INSERT INTO users (id, username, password, is_admin, created_at) VALUES (?, ?, ?, ?, ?)',
          [
            crypto.randomUUID(),
            'admin',
            hashedPassword,
            1,
            new Date().toISOString()
          ],
          (err) => {
            if (err) {
              console.error('Error creating admin user:', err);
            } else {
              console.log('Admin user created successfully');
            }
          }
        );
      }
    });

    // Initialize default settings if they don't exist
    db.get("SELECT COUNT(*) as count FROM settings", (err, row) => {
      if (err) {
        console.error('Error checking settings:', err);
        return;
      }

      if (row.count === 0) {
        console.log('Initializing default settings...');
        const defaultSettings = {
          prowlarr_url: '',
          prowlarr_api_key: '',
          tmdb_access_token: '',
          min_seeds: 3
        };

        const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        Object.entries(defaultSettings).forEach(([key, value]) => {
          stmt.run(key, JSON.stringify(value));
        });
        stmt.finalize();
        console.log('Default settings initialized');
      }
    });

  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// API Routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        isAdmin: user.is_admin === 1 
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        is_admin: user.is_admin === 1,
        qbit_url: user.qbit_url,
        qbit_username: user.qbit_username,
        qbit_password: user.qbit_password
      }
    });
  });
});

// Settings routes
app.get('/api/settings', authenticateToken, (req, res) => {
  // Permettre la lecture des paramètres à tous les utilisateurs authentifiés
  db.all('SELECT key, value FROM settings', (err, settings) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const settingsObject = settings.reduce((acc, curr) => {
      try {
        acc[curr.key] = JSON.parse(curr.value);
      } catch (e) {
        acc[curr.key] = curr.value;
      }
      return acc;
    }, {});

    res.json(settingsObject);
  });
});

app.put('/api/settings', authenticateToken, (req, res) => {
  // Garder la restriction admin pour la modification
  if (!req.user.isAdmin) {
    return res.sendStatus(403);
  }

  const settings = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  try {
    Object.entries(settings).forEach(([key, value]) => {
      stmt.run(key, JSON.stringify(value));
    });
    stmt.finalize();
    
    console.log('Settings updated successfully:', settings);
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Error updating settings' });
  }
});

// Users routes
app.get('/api/users', authenticateToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.sendStatus(403);
  }

  db.all('SELECT id, username, is_admin, created_at, qbit_url, qbit_username, qbit_password FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

app.post('/api/users', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.sendStatus(403);
  }

  const { username, password, isAdmin } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (id, username, password, is_admin, created_at) VALUES (?, ?, ?, ?, ?)',
      [
        crypto.randomUUID(),
        username,
        hashedPassword,
        isAdmin ? 1 : 0,
        new Date().toISOString()
      ],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error creating user' });
        }
        res.status(201).json({ message: 'User created successfully' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!req.user.isAdmin && req.user.id !== id) {
    return res.sendStatus(403);
  }

  let query = 'UPDATE users SET ';
  const params = [];
  const allowedUpdates = ['qbit_url', 'qbit_username', 'qbit_password', 'password'];

  const updateParts = [];
  for (const [key, value] of Object.entries(updates)) {
    if (allowedUpdates.includes(key)) {
      updateParts.push(`${key} = ?`);
      params.push(key === 'password' ? await bcrypt.hash(value, 10) : value);
    }
  }

  if (updateParts.length === 0) {
    return res.status(400).json({ error: 'No valid updates provided' });
  }

  query += updateParts.join(', ');
  query += ' WHERE id = ?';
  params.push(id);

  db.run(query, params, (err) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ error: 'Error updating user' });
    }
    res.json({ message: 'User updated successfully' });
  });
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.sendStatus(403);
  }

  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ? AND is_admin = 0', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting user' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// Serve static files only in production
if (!isDevelopment) {
  const distPath = join(__dirname, '../dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(join(distPath, 'index.html'));
    });
  }
}

// Start server
try {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}