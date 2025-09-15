
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001; // Use a different port like 3001 for the backend

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// --- In-Memory Cache for User Details ---
// This is used by features like messaging that rely on quick user lookups.
// It's loaded on startup and synced with the database on any user change.
let db = {
    users: [], // This will be populated from the database
    // Data for modules not yet migrated to the database
    tasks: [
        { id: 'task-1', description: 'Review Q3 financial report', deadline: '2024-08-15', isCompleted: false },
        { id: 'task-2', description: 'Prepare presentation for board meeting', deadline: '2024-08-20', isCompleted: false },
    ],
    // announcements are now fetched from the database
};


// Function to load users from DB into the in-memory cache
const loadUsersIntoMemory = async () => {
    try {
        const result = await pool.query('SELECT id, name, email, role as "roleId", status, avatar_url as "avatarUrl" FROM users');
        db.users = result.rows;
        console.log(`Successfully loaded ${db.users.length} users into memory cache.`);
    } catch (error) {
        console.error('FATAL: Failed to load users from database on startup:', error);
    }
};

// ===================================
// === API Endpoints Start Here      ===
// ===================================

// --- Helper to get user details for messaging (uses in-memory cache) ---
const getUserDetails = (userId) => {
    const user = db.users.find(u => u.id === Number(userId));
    return user ? { name: user.name, avatarUrl: user.avatarUrl } : { name: 'Unknown User', avatarUrl: '' };
};

// --- Users (Database-backed) ---
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role as "roleId", status, avatar_url as "avatarUrl" FROM users ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        const result = await pool.query('SELECT id, name, email, role as "roleId", status, avatar_url as "avatarUrl", password FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        // IMPORTANT: In a production environment, use bcrypt to compare hashed passwords.
        if (user && user.password === password) {
            const { password, ...userWithoutPassword } = user;
            res.json({ user: userWithoutPassword });
        } else {
            res.status(401).json({ error: 'Invalid credentials.' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/users', async (req, res) => {
    const { name, email, roleId, status, avatarUrl } = req.body;
    const defaultPassword = 'The@t0mic25k'; // Default password for new users
    try {
        const query = 'INSERT INTO users (name, email, role, status, avatar_url, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role as "roleId", status, avatar_url as "avatarUrl"';
        const result = await pool.query(query, [name, email, roleId, status, avatarUrl, defaultPassword]);
        const newUser = result.rows[0];
        db.users.push(newUser); // Keep cache in sync
        res.status(201).json(newUser);
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, roleId, status, avatarUrl } = req.body;
    try {
        const query = 'UPDATE users SET name = $1, email = $2, role = $3, status = $4, avatar_url = $5 WHERE id = $6 RETURNING id, name, email, role as "roleId", status, avatar_url as "avatarUrl"';
        const result = await pool.query(query, [name, email, roleId, status, avatarUrl, id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const updatedUser = result.rows[0];
        const index = db.users.findIndex(u => u.id === Number(updatedUser.id));
        if (index !== -1) db.users[index] = updatedUser; // Keep cache in sync

        res.json(updatedUser);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });

        db.users = db.users.filter(u => u.id !== Number(id)); // Keep cache in sync
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/users/:id/change-password', async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    try {
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found.' });
        if (user.password !== currentPassword) return res.status(400).json({ error: 'Incorrect current password.' });

        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, id]);
        res.json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- Finance Module ---
app.get('/api/finance/payment-instructions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM payment_instructions ORDER BY id DESC');
        const instructions = result.rows.map(row => ({
            id: String(row.id),
            payee: row.payee,
            amount: parseFloat(row.amount),
            currency: row.currency,
            dueDate: row.due_date,
            status: row.status,
            isRecurring: row.is_recurring,
            nextDueDate: row.next_due_date,
            balance: row.balance ? parseFloat(row.balance) : undefined,
            submittedBy: row.submitted_by,
            history: row.history || [],
        }));
        res.json(instructions);
    } catch (err) {
        console.error('Error fetching payment instructions:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/finance/payment-instructions', async (req, res) => {
    const { payee, amount, dueDate, isRecurring, nextDueDate, balance, submittedBy } = req.body;
    if (!payee || !amount || !dueDate || !submittedBy) return res.status(400).json({ message: 'Missing required fields' });
    const initialHistory = [{ status: 'Pending', user: submittedBy, timestamp: new Date().toISOString(), remarks: 'Instruction created.' }];
    try {
        const query = `INSERT INTO payment_instructions (payee, amount, due_date, is_recurring, next_due_date, balance, submitted_by, history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`;
        const values = [payee, amount, dueDate, !!isRecurring, nextDueDate || null, balance || null, submittedBy, JSON.stringify(initialHistory)];
        const result = await pool.query(query, values);
        const newInst = result.rows[0];
        res.status(201).json({
            id: String(newInst.id), payee: newInst.payee, amount: parseFloat(newInst.amount), currency: newInst.currency, dueDate: newInst.due_date, status: newInst.status, isRecurring: newInst.is_recurring, nextDueDate: newInst.next_due_date, balance: newInst.balance ? parseFloat(newInst.balance) : undefined, submittedBy: newInst.submitted_by, history: newInst.history || [],
        });
    } catch (err) {
        console.error('Error adding payment instruction:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/finance/payment-instructions/:id', async (req, res) => {
    const { id } = req.params;
    const { status, history } = req.body;
    if (!status || !history) return res.status(400).json({ message: 'Missing status or history' });
    try {
        const query = 'UPDATE payment_instructions SET status = $1, history = $2 WHERE id = $3 RETURNING *';
        const result = await pool.query(query, [status, JSON.stringify(history), id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Instruction not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Error updating instruction ${id}:`, err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/finance/collections', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM collections ORDER BY id DESC');
        res.json(result.rows.map(row => ({
            ...row,
            id: String(row.id),
            amount: parseFloat(row.amount),
            outstandingAmount: row.outstanding_amount ? parseFloat(row.outstanding_amount) : undefined,
        })));
    } catch(err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

app.post('/api/finance/collections', async (req, res) => {
    // Note: File upload is not handled here. You would need a library like 'multer'.
    const { project, payer, amount, type, date, outstandingAmount } = req.body;
    try {
        const query = 'INSERT INTO collections (project, payer, amount, type, date, outstanding_amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const result = await pool.query(query, [project, payer, amount, type, date, outstandingAmount || null]);
        res.status(201).json(result.rows[0]);
    } catch(err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

app.get('/api/finance/deposits', async (req, res) => {
    try {
        // This query needs a JOIN to get the account head name. Assuming 'account_heads' table exists.
        const result = await pool.query(`
            SELECT d.id, ah.name as "accountHead", d.amount, d.date, d.status
            FROM deposits d
            JOIN account_heads ah ON d.account_head_id = ah.id
            ORDER BY d.id DESC
        `);
        res.json(result.rows.map(row => ({
            ...row,
            id: String(row.id),
            amount: parseFloat(row.amount),
        })));
    } catch(err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

app.post('/api/finance/deposits', async (req, res) => {
    // Note: File upload is not handled here.
    const { accountHeadId, amount, date } = req.body;
    try {
        const query = 'INSERT INTO deposits (account_head_id, amount, date) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(query, [accountHeadId, amount, date]);
        res.status(201).json(result.rows[0]);
    } catch(err) { res.status(500).json({ message: 'Internal Server Error' }); }
});


// --- Service Jobs, Projects, Messaging (Existing Endpoints) ---
app.get('/api/service-jobs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM service_jobs ORDER BY id DESC');
        res.json(result.rows.map(dbRow => ({
            id: String(dbRow.id), title: dbRow.title, project: dbRow.project, technician: { name: dbRow.technician_name, avatarUrl: dbRow.technician_avatar_url }, status: dbRow.status, priority: dbRow.priority
        })));
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});
app.post('/api/service-jobs', async (req, res) => {
    const { title, project, technician, priority } = req.body;
    try {
        const query = `INSERT INTO service_jobs (title, project, technician_name, technician_avatar_url, status, priority) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        const result = await pool.query(query, [title, project, technician.name, technician.avatarUrl, 'Assigned', priority]);
        const dbRow = result.rows[0];
        res.status(201).json({
            id: String(dbRow.id), title: dbRow.title, project: dbRow.project, technician: { name: dbRow.technician_name, avatarUrl: dbRow.technician_avatar_url }, status: dbRow.status, priority: dbRow.priority
        });
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, status FROM projects ORDER BY name ASC');
        res.json(result.rows.map(p => ({ ...p, id: String(p.id) })));
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});
app.post('/api/projects', async (req, res) => {
    const { name, status } = req.body;
    if (!name || !status) return res.status(400).json({ message: 'Missing required fields: name, status' });
    try {
        const query = 'INSERT INTO projects (name, status) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(query, [name, status]);
        res.status(201).json({ ...result.rows[0], id: String(result.rows[0].id) });
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});
app.put('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;
    if (!name || !status) return res.status(400).json({ message: 'Missing required fields: name, status' });
    try {
        const query = 'UPDATE projects SET name = $1, status = $2 WHERE id = $3 RETURNING *';
        const result = await pool.query(query, [name, status, id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Project not found' });
        res.json({ ...result.rows[0], id: String(result.rows[0].id) });
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});
app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Project not found' });
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

// Placeholder for Account Heads - will be implemented later
app.get('/api/account-heads', async (req, res) => {
    // In a real app, you'd fetch from an 'account_heads' table
    res.json([]);
});

app.get('/api/threads', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'User ID is required.' });
    try {
        const threadsResult = await pool.query(`
            SELECT t.id, t.title, t.created_at FROM threads t JOIN thread_participants tp ON t.id = tp.thread_id WHERE tp.user_id = $1
        `, [userId]);
        const threads = await Promise.all(threadsResult.rows.map(async (threadData) => {
            const participantsResult = await pool.query('SELECT user_id FROM thread_participants WHERE thread_id = $1', [threadData.id]);
            const participants = participantsResult.rows.map(p => getUserDetails(p.user_id));
            const messagesResult = await pool.query('SELECT * FROM messages WHERE thread_id = $1 ORDER BY created_at ASC', [threadData.id]);
            const messages = messagesResult.rows.map(m => ({
                id: m.id, user: getUserDetails(m.user_id), text: m.text, timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }));
            const lastMessage = messages[messages.length - 1];
            return {
                id: String(threadData.id), title: threadData.title, participants, messages,
                lastMessage: lastMessage?.text || 'No messages yet.',
                timestamp: lastMessage?.timestamp || new Date(threadData.created_at).toLocaleTimeString(),
                unreadCount: 0,
            };
        }));
        res.json(threads);
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});
app.post('/api/threads', async (req, res) => {
    const { title, initialMessage, participantIds, creatorId } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const threadResult = await client.query('INSERT INTO threads (title) VALUES ($1) RETURNING id', [title]);
        const threadId = threadResult.rows[0].id;
        const allParticipantIds = [...new Set([creatorId, ...participantIds])];
        for (const userId of allParticipantIds) {
            await client.query('INSERT INTO thread_participants (thread_id, user_id) VALUES ($1, $2)', [threadId, userId]);
        }
        await client.query('INSERT INTO messages (thread_id, user_id, text) VALUES ($1, $2, $3)', [threadId, creatorId, initialMessage]);
        await client.query('COMMIT');
        res.status(201).json({ success: true, threadId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        client.release();
    }
});
app.post('/api/threads/:threadId/messages', async (req, res) => {
    const { threadId } = req.params;
    const { text, userId } = req.body;
    try {
        const result = await pool.query('INSERT INTO messages (thread_id, user_id, text) VALUES ($1, $2, $3) RETURNING *', [threadId, userId, text]);
        const newMessage = result.rows[0];
        res.status(201).json({
             id: newMessage.id, user: getUserDetails(newMessage.user_id), text: newMessage.text, timestamp: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

// --- In-Memory Endpoints (for features not yet migrated) ---
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
app.get('/api/tasks', (req, res) => res.json(db.tasks));
app.post('/api/tasks', (req, res) => {
    const newTask = { ...req.body, id: generateId('task'), isCompleted: false };
    db.tasks.push(newTask);
    res.status(201).json(newTask);
});
app.put('/api/tasks/:id', (req, res) => {
    const index = db.tasks.findIndex(item => String(item.id) === String(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    db.tasks[index] = { ...db.tasks[index], ...req.body };
    res.json(db.tasks[index]);
});

// --- Announcements (Database-backed) ---
app.get('/api/announcements', async (req, res) => {
    try {
        // Fetch newest announcements first
        const result = await pool.query('SELECT * FROM announcements ORDER BY id DESC');
        const formattedAnnouncements = result.rows.map(row => ({
            id: String(row.id),
            title: row.title,
            content: row.content,
            author: {
                name: row.author_name,
                avatarUrl: row.author_avatar_url,
            },
            timestamp: row.timestamp,
        }));
        res.json(formattedAnnouncements);
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/announcements', async (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author || !author.name) {
        return res.status(400).json({ message: 'Missing required fields: title, content, author name' });
    }
    
    try {
        const query = 'INSERT INTO announcements (title, content, author_name, author_avatar_url, timestamp) VALUES ($1, $2, $3, $4, NOW()) RETURNING *';
        const result = await pool.query(query, [title, content, author.name, author.avatarUrl || '']);
        
        const newAnn = result.rows[0];

        if (!newAnn) {
            console.error('Database did not return the new announcement after insertion.');
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        const formattedNewAnn = {
            id: String(newAnn.id),
            title: newAnn.title,
            content: newAnn.content,
            author: {
                name: newAnn.author_name,
                avatarUrl: newAnn.author_avatar_url,
            },
            timestamp: 'Just now',
        };
        res.status(201).json(formattedNewAnn);
    } catch (err) {
        console.error('Error adding announcement:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.delete('/api/announcements/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting announcement:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// --- Health Check Endpoint ---
app.get('/', (req, res) => {
  res.status(200).send('Tabdeel Pulse Backend API is running.');
});

// --- Server Startup ---
app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
    loadUsersIntoMemory(); // Initial load of users into cache
});
