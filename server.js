
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

// Create a new pool instance to connect to the database
// Render will provide the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();
const port = process.env.PORT || 3001;

// === Middleware ===
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON bodies

// === Serve static files from the root directory ===
// This tells Express to serve your index.html, index.tsx, etc.
app.use(express.static(path.join(__dirname, '')));


// ====================================================================
// ========================== API ROUTES ==============================
// ====================================================================

// --- USERS API ---
// GET all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, status, avatar_url as "avatarUrl", role as "roleId" FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST a new user
app.post('/api/users', async (req, res) => {
    const { name, email, roleId, status, avatarUrl } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (name, email, role, status, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, status, avatar_url as "avatarUrl", role as "roleId"',
            [name, email, roleId, status, avatarUrl]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT (update) an existing user
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, roleId, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, email = $2, role = $3, status = $4 WHERE id = $5 RETURNING id, name, email, role, status, avatar_url as "avatarUrl", role as "roleId"',
            [name, email, roleId, status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE a user
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tasks WHERE user_id = $1', [id]);
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(204).send(); // 204 No Content
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


// --- PROJECTS API ---
// GET all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST a new project
app.post('/api/projects', async (req, res) => {
    const { name, client, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO projects (name, client, status) VALUES ($1, $2, $3) RETURNING *',
            [name, client, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PUT (update) a project
app.put('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { name, client, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE projects SET name = $1, client = $2, status = $3 WHERE id = $4 RETURNING *',
            [name, client, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE a project
app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM projects WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});


// --- TASKS API ---
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT id::text, description, deadline, is_completed as "isCompleted" FROM tasks ORDER BY deadline ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST a new task
app.post('/api/tasks', async (req, res) => {
    const { description, deadline } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (description, deadline, is_completed) VALUES ($1, $2, $3) RETURNING id::text, description, deadline, is_completed as "isCompleted"',
            [description, deadline, false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT to toggle a task's completion status
app.put('/api/tasks/:id/toggle', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE tasks SET is_completed = NOT is_completed WHERE id = $1 RETURNING id::text, description, deadline, is_completed as "isCompleted"',
            [id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to toggle task' });
    }
});


// --- ANNOUNCEMENTS API ---
app.get('/api/announcements', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id::text, 
        title, 
        content, 
        json_build_object('name', author_name, 'avatarUrl', author_avatar_url) as author, 
        "timestamp" 
      FROM announcements 
      ORDER BY "timestamp" DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST a new announcement
app.post('/api/announcements', async (req, res) => {
    const { title, content, author } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO announcements (title, content, author_name, author_avatar_url, "timestamp") VALUES ($1, $2, $3, $4, NOW()) RETURNING id::text, title, content, json_build_object(\'name\', author_name, \'avatarUrl\', author_avatar_url) as author, "timestamp"',
            [title, content, author.name, author.avatarUrl]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

// --- FINANCE API ---
app.get('/api/finance/instructions', async (req, res) => {
  try {
    const result = await pool.query('SELECT id::text, payee, amount, currency, due_date as "dueDate", status, is_recurring as "isRecurring", next_due_date as "nextDueDate", balance, submitted_by as "submittedBy", history FROM payment_instructions ORDER BY due_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/finance/collections', async (req, res) => {
    try {
        const result = await pool.query('SELECT id::text, project, payer, amount, type, date, status, outstanding_amount as "outstandingAmount" FROM collections ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/finance/deposits', async (req, res) => {
    try {
        const result = await pool.query('SELECT id::text, account_head as "accountHead", amount, date, status FROM deposits ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- SERVICE JOBS API ---
app.get('/api/service-jobs', async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT 
            id::text, 
            title, 
            project, 
            json_build_object('name', technician_name, 'avatarUrl', technician_avatar_url) as technician, 
            status, 
            priority 
        FROM service_jobs ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/service-jobs', async (req, res) => {
    const { title, project, technician, priority } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO service_jobs (title, project, technician_name, technician_avatar_url, status, priority) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id::text, title, project, json_build_object(\'name\', technician_name, \'avatarUrl\', technician_avatar_url) as technician, status, priority',
            [title, project, technician.name, technician.avatarUrl, 'Assigned', priority]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create service job' });
    }
});

// --- ACCOUNT HEADS API ---
app.get('/api/account-heads', async (req, res) => {
    try {
        const result = await pool.query('SELECT id::text, name, bank_name as "bankName", account_number as "accountNumber", status FROM account_heads ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/account-heads', async (req, res) => {
    const { name, bankName, accountNumber, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO account_heads (name, bank_name, account_number, status) VALUES ($1, $2, $3, $4) RETURNING id::text, name, bank_name as "bankName", account_number as "accountNumber", status',
            [name, bankName, accountNumber, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create account head' });
    }
});

// === NEW: Catch-all to serve index.html for any other request ===
// This is important for single-page apps that use client-side routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
