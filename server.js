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
let db = {
    users: [], // This will be populated from the database
};

// Helper function to format date into a "time ago" string
const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};

// Function to load users from DB into the in-memory cache
const loadUsersIntoMemory = async () => {
    try {
        const result = await pool.query('SELECT id, name, email, role as "roleId", status, avatar_url as "avatarUrl", mobile FROM users');
        db.users = result.rows;
        console.log(`Successfully loaded ${db.users.length} users into memory cache.`);
    } catch (error) {
        console.error('FATAL: Failed to load users from database on startup:', error);
    }
};

// --- Database Initialization ---
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Initializing database schema...');

        // NOTE: This section drops all tables on every server start.
        // This is useful for development to ensure a clean state,
        // but should be REMOVED for a production environment to avoid data loss.
        console.log('Dropping existing tables...');
        const tablesToDrop = [
            'announcements', 'tasks', 'messages', 'thread_participants', 
            'threads', 'service_jobs', 'deposits', 'collections', 
            'payment_instructions', 'account_heads', 'projects', 'users', 'roles'
        ];
        for (const table of tablesToDrop) {
            await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
        }
        console.log('Tables dropped successfully.');

        // Create Roles Table
        await client.query(`
            CREATE TABLE roles (
                id TEXT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                permissions JSONB
            );
        `);

        // Create Users Table
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role TEXT REFERENCES roles(id),
                status VARCHAR(50) NOT NULL,
                avatar_url TEXT,
                mobile VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create Projects Table
        await client.query(`
            CREATE TABLE projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL
            );
        `);
        
        await client.query(`
            CREATE TABLE account_heads (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                account_number VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL
            );
        `);

        await client.query(`
            CREATE TABLE payment_instructions (
                id SERIAL PRIMARY KEY,
                payee VARCHAR(255) NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'AED',
                due_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending',
                is_recurring BOOLEAN DEFAULT FALSE,
                next_due_date DATE,
                balance DECIMAL(12, 2),
                submitted_by VARCHAR(255) NOT NULL,
                history JSONB
            );
        `);
        
        await client.query(`
            CREATE TABLE collections (
                id SERIAL PRIMARY KEY,
                project VARCHAR(255) NOT NULL,
                payer VARCHAR(255) NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                type VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'Collected',
                outstanding_amount DECIMAL(12, 2),
                document_url TEXT
            );
        `);
        
        await client.query(`
            CREATE TABLE deposits (
                id SERIAL PRIMARY KEY,
                account_head_id INTEGER REFERENCES account_heads(id) ON DELETE SET NULL,
                amount DECIMAL(12, 2) NOT NULL,
                date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending',
                document_url TEXT
            );
        `);

        await client.query(`
            CREATE TABLE service_jobs (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                project VARCHAR(255) NOT NULL,
                technician_name VARCHAR(255),
                technician_avatar_url TEXT,
                status VARCHAR(50) NOT NULL,
                priority VARCHAR(50) NOT NULL
            );
        `);

        await client.query(`
            CREATE TABLE threads (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        await client.query(`
            CREATE TABLE thread_participants (
                thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                PRIMARY KEY (thread_id, user_id)
            );
        `);

        await client.query(`
            CREATE TABLE messages (
                id SERIAL PRIMARY KEY,
                thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE tasks (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                deadline DATE NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
            );
        `);
        
        await client.query(`
            CREATE TABLE announcements (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                author_name VARCHAR(255) NOT NULL,
                author_avatar_url TEXT,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('Schema creation complete.');

        // Seed Data
        console.log('Seeding data...');
        const defaultRoles = [
            { id: 'Administrator', name: 'Administrator', description: 'Has all permissions and can manage the entire system.', permissions: ['system:admin','users:create','users:read','users:update','users:delete','users:reset_password','finance:approve','jobs:assign','roles:manage','projects:create','projects:update','projects:delete','accounts:create','accounts:update','accounts:delete','announcements:create','announcements:delete'] },
            { id: 'Manager', name: 'Manager', description: 'Can manage users, projects, and approve financial transactions.', permissions: ['users:create', 'users:read', 'users:update', 'finance:approve', 'jobs:assign', 'projects:create', 'projects:update', 'announcements:create'] },
            { id: 'Technician', name: 'Technician', description: 'Can view and update assigned service jobs.', permissions: ['users:read', 'jobs:assign'] }
        ];
        for (const role of defaultRoles) {
            await client.query('INSERT INTO roles (id, name, description, permissions) VALUES ($1, $2, $3, $4)', [role.id, role.name, role.description, JSON.stringify(role.permissions)]);
        }
        console.log('Roles seeded.');

        const defaultUsers = [
            { name: 'Admin User', email: 'admin@tabdeel.com', password: 'password', role: 'Administrator', status: 'Active', avatar_url: 'https://picsum.photos/seed/admin/100/100' },
            { name: 'Manager Mike', email: 'manager@tabdeel.com', password: 'password', role: 'Manager', status: 'Active', avatar_url: 'https://picsum.photos/seed/manager/100/100' },
            { name: 'Technician Tom', email: 'tech@tabdeel.com', password: 'password', role: 'Technician', status: 'Active', avatar_url: 'https://picsum.photos/seed/tech/100/100' },
        ];
        for (const user of defaultUsers) {
            await client.query('INSERT INTO users (name, email, password, role, status, avatar_url) VALUES ($1, $2, $3, $4, $5, $6)', [user.name, user.email, user.password, user.role, user.status, user.avatar_url]);
        }
        console.log('Users seeded.');

        await client.query('COMMIT');
        console.log('Database initialization transaction committed.');

    } catch (err) {
        console.error('Error during database initialization, rolling back transaction:', err);
        await client.query('ROLLBACK');
        process.exit(1);
    } finally {
        client.release();
    }
};


// ===================================
// === API Endpoints Start Here      ===
// ===================================

// --- Helper to get user details for messaging (uses in-memory cache) ---
const getUserDetails = (userId) => {
    const user = db.users.find(u => u.id === Number(userId));
    return user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl } : { id: userId, name: 'Unknown User', avatarUrl: '' };
};

// --- Roles ---
app.get('/api/roles', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, description, permissions FROM roles');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/roles', async (req, res) => {
    const { id, name, description, permissions } = req.body;
    if (!id || !name) {
        return res.status(400).json({ message: 'Role ID and name are required.' });
    }
    try {
        const query = 'INSERT INTO roles (id, name, description, permissions) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [id, name, description, JSON.stringify(permissions || [])]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating role:', err);
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ message: `Role with ID '${id}' already exists.` });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/roles/:id', async (req, res) => {
    const { id } = req.params;
    const { permissions } = req.body; // Only permissions are updated from the UI

    if (permissions === undefined) {
        return res.status(400).json({ message: 'Permissions field is required.' });
    }
    if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: 'Permissions must be an array.' });
    }

    try {
        const query = 'UPDATE roles SET permissions = $1 WHERE id = $2 RETURNING *';
        const result = await pool.query(query, [JSON.stringify(permissions), id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Error updating role ${id}:`, err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/api/roles/:id', async (req, res) => {
    const { id } = req.params;
    const defaultRoles = ['Administrator', 'Manager', 'Technician'];

    if (defaultRoles.includes(id)) {
        return res.status(403).json({ message: 'Cannot delete default system roles.' });
    }
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Reassign users with this role to a default role (e.g., 'Technician')
        await client.query("UPDATE users SET role = 'Technician' WHERE role = $1", [id]);
        
        // Delete the role
        const deleteResult = await client.query('DELETE FROM roles WHERE id = $1', [id]);
        
        await client.query('COMMIT');
        
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: 'Role not found' });
        }

        res.status(204).send();
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error deleting role ${id}:`, err);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        client.release();
    }
});


// --- Users (Database-backed) ---
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role as "roleId", status, avatar_url as "avatarUrl", mobile FROM users ORDER BY name ASC');
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
        const result = await pool.query('SELECT id, name, email, role as "roleId", status, avatar_url as "avatarUrl", mobile, password FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

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
    const defaultPassword = 'password'; // Default password for new users
    try {
        const query = 'INSERT INTO users (name, email, role, status, avatar_url, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role as "roleId", status, avatar_url as "avatarUrl", mobile';
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
    const body = req.body;

    try {
        const fields = {
            name: body.name,
            email: body.email,
            role: body.roleId,
            status: body.status,
            avatar_url: body.avatarUrl,
            mobile: body.mobile,
        };

        const updates = [];
        const values = [];
        let queryIndex = 1;

        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                updates.push(`${key} = $${queryIndex++}`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            const currentUser = await pool.query('SELECT id, name, email, role as "roleId", status, avatar_url as "avatarUrl", mobile FROM users WHERE id = $1', [id]);
            return res.json(currentUser.rows[0]);
        }
        
        values.push(id);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING id, name, email, role as "roleId", status, avatar_url as "avatarUrl", mobile`;
        
        const result = await pool.query(query, values);

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

app.delete('/api/finance/payment-instructions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Use RETURNING id for a more reliable check of whether a row was deleted.
        const result = await pool.query('DELETE FROM payment_instructions WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Instruction not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(`Error deleting instruction ${id}:`, err);
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

// --- Account Heads ---
app.get('/api/account-heads', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM account_heads ORDER BY name ASC');
        res.json(result.rows.map(row => ({
            id: String(row.id), name: row.name, bankName: row.bank_name, accountNumber: row.account_number, status: row.status
        })));
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

app.post('/api/account-heads', async (req, res) => {
    const { name, bankName, accountNumber, status } = req.body;
    try {
        const query = 'INSERT INTO account_heads (name, bank_name, account_number, status) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [name, bankName, accountNumber, status]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

app.put('/api/account-heads/:id', async (req, res) => {
    const { id } = req.params;
    const { name, bankName, accountNumber, status } = req.body;
    try {
        const query = 'UPDATE account_heads SET name = $1, bank_name = $2, account_number = $3, status = $4 WHERE id = $5 RETURNING *';
        const result = await pool.query(query, [name, bankName, accountNumber, status, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

app.delete('/api/account-heads/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM account_heads WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

// --- Threads & Messages ---
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

app.put('/api/threads/:threadId/participants', async (req, res) => {
    const { threadId } = req.params;
    const { participantIds, currentUserId } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || !currentUserId) {
        return res.status(400).json({ message: 'Participant IDs and current user ID are required.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Ensure the current user is always included
        const finalParticipantIds = [...new Set([currentUserId, ...participantIds.map(id => Number(id))])];

        // Delete old participants
        await client.query('DELETE FROM thread_participants WHERE thread_id = $1', [threadId]);

        // Insert new participants
        const insertPromises = finalParticipantIds.map(userId => 
            client.query('INSERT INTO thread_participants (thread_id, user_id) VALUES ($1, $2)', [threadId, userId])
        );
        await Promise.all(insertPromises);

        await client.query('COMMIT');
        
        // Return the updated list of participants details
        const newParticipantsDetails = finalParticipantIds.map(id => getUserDetails(id));
        res.status(200).json({ success: true, participants: newParticipantsDetails });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error updating participants for thread ${threadId}:`, err);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        client.release();
    }
});


// --- Tasks ---
app.get('/api/tasks', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.id, 
                t.name,
                t.description, 
                t.deadline, 
                t.is_completed, 
                t.assigned_to_user_id,
                u.name as assigned_to_name,
                u.avatar_url as assigned_to_avatar_url
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to_user_id = u.id
            ORDER BY t.deadline ASC, t.id DESC
        `);
        res.json(result.rows.map(r => ({
            id: String(r.id),
            name: r.name,
            description: r.description,
            deadline: r.deadline,
            isCompleted: r.is_completed,
            assignedToUserId: r.assigned_to_user_id,
            assignedTo: r.assigned_to_user_id ? { name: r.assigned_to_name, avatarUrl: r.assigned_to_avatar_url } : undefined
        })));
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});
app.post('/api/tasks', async (req, res) => {
    const { name, description, deadline, assignedToUserId } = req.body;
    try {
        const query = 'INSERT INTO tasks (name, description, deadline, is_completed, assigned_to_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id';
        const result = await pool.query(query, [name, description, deadline, false, assignedToUserId || null]);
        const newTaskId = result.rows[0].id;

        const fullTaskResult = await pool.query(`
            SELECT 
                t.id, t.name, t.description, t.deadline, t.is_completed, t.assigned_to_user_id,
                u.name as assigned_to_name, u.avatar_url as assigned_to_avatar_url
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to_user_id = u.id
            WHERE t.id = $1
        `, [newTaskId]);
        
        const r = fullTaskResult.rows[0];
        res.status(201).json({
            id: String(r.id),
            name: r.name,
            description: r.description,
            deadline: r.deadline,
            isCompleted: r.is_completed,
            assignedTo: r.assigned_to_user_id ? { name: r.assigned_to_name, avatarUrl: r.assigned_to_avatar_url } : undefined
        });
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { isCompleted } = req.body;
    try {
        const query = 'UPDATE tasks SET is_completed = $1 WHERE id = $2 RETURNING *';
        const result = await pool.query(query, [isCompleted, id]);
        const r = result.rows[0];
        if (!r) return res.status(404).json({ message: 'Task not found' });
        res.json({
            id: String(r.id),
            name: r.name,
            description: r.description,
            deadline: r.deadline,
            isCompleted: r.is_completed
        });
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(`Error deleting task ${id}:`, err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// --- Announcements (Database-backed) ---
app.get('/api/announcements', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM announcements ORDER BY id DESC');
        res.json(result.rows.map(row => ({
            id: String(row.id), title: row.title, content: row.content, author: { name: row.author_name, avatarUrl: row.author_avatar_url, },
            timestamp: new Date(row.timestamp).toLocaleDateString(),
        })));
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});
app.post('/api/announcements', async (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author || !author.name) return res.status(400).json({ message: 'Missing required fields' });
    try {
        const query = 'INSERT INTO announcements (title, content, author_name, author_avatar_url, timestamp) VALUES ($1, $2, $3, $4, NOW()) RETURNING *';
        const result = await pool.query(query, [title, content, author.name, author.avatarUrl || '']);
        const newAnn = result.rows[0];
        res.status(201).json({
            id: String(newAnn.id), title: newAnn.title, content: newAnn.content, author: { name: newAnn.author_name, avatarUrl: newAnn.author_avatar_url },
            timestamp: 'Just now',
        });
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});
app.delete('/api/announcements/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Announcement not found' });
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: 'Internal Server Error' }); }
});

// --- NEW MOCK ENDPOINTS to remove frontend mock data ---

app.get('/api/notifications', async (req, res) => {
    const { userId } = req.query;
    try {
        const pendingPayments = await pool.query(
            "SELECT id, payee, amount FROM payment_instructions WHERE status = 'Pending' ORDER BY id DESC LIMIT 3"
        );

        const paymentNotifications = pendingPayments.rows.map((p, index) => ({
            id: `payment_${p.id}`,
            title: 'Pending Payment Approval',
            description: `Payment of AED ${p.amount} to ${p.payee} requires your approval.`,
            timestamp: `${(index + 1) * 5}m ago`,
            read: false,
            iconName: 'CreditCardIcon',
            link: 'finance'
        }));

        let messageNotifications = [];
        if (userId) {
            const recentMessages = await pool.query(`
                SELECT
                    m.id AS message_id,
                    m.text,
                    t.title AS thread_title,
                    u.name AS sender_name
                FROM 
                    messages m
                JOIN 
                    threads t ON m.thread_id = t.id
                JOIN
                    users u ON m.user_id = u.id
                JOIN 
                    (
                        SELECT thread_id, MAX(created_at) as max_created_at
                        FROM messages
                        GROUP BY thread_id
                    ) lm ON m.thread_id = lm.thread_id AND m.created_at = lm.max_created_at
                WHERE 
                    m.thread_id IN (SELECT thread_id FROM thread_participants WHERE user_id = $1)
                    AND m.user_id != $1
                    AND m.created_at > NOW() - INTERVAL '24 hours'
                ORDER BY 
                    m.created_at DESC;
            `, [userId]);

            messageNotifications = recentMessages.rows.map(msg => ({
                id: `msg_${msg.message_id}`,
                title: `New Message in "${msg.thread_title}"`,
                description: `${msg.sender_name}: ${msg.text.substring(0, 50)}${msg.text.length > 50 ? '...' : ''}`,
                timestamp: 'Recent',
                read: false,
                iconName: 'ChatBubbleBottomCenterTextIcon',
                link: 'messages'
            }));
        }
        
        const allNotifications = [...paymentNotifications, ...messageNotifications];
        res.json(allNotifications);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json([]);
    }
});

app.get('/api/jobs/:jobId/comments', (req, res) => {
    res.json([
        { id: 1, user: { name: 'Suju', avatarUrl: 'https://picsum.photos/seed/suju/40/40' }, text: 'Please check the main valve first, could be a pressure issue.', timestamp: '2h ago' },
        { id: 2, user: { name: 'NOUMAN', avatarUrl: 'https://picsum.photos/seed/nouman/40/40' }, text: 'Will do. I am on my way to the site now.', timestamp: '1h ago' },
    ]);
});

app.post('/api/jobs/:jobId/comments', (req, res) => {
    const { text, userId } = req.body;
    const user = getUserDetails(userId);
    const newComment = {
        id: Date.now(),
        user: user,
        text: text,
        timestamp: 'Just now'
    };
    res.status(201).json(newComment);
});


app.get('/api/finance/overview', async (req, res) => {
    try {
        const query = `
            WITH months AS (
                SELECT TO_CHAR(date, 'YYYY-MM') AS yyyy_mm,
                       TO_CHAR(date, 'Mon') AS month_name,
                       EXTRACT(YEAR FROM date) AS year,
                       EXTRACT(MONTH FROM date) AS month
                FROM generate_series(
                    date_trunc('month', NOW() - interval '5 months'),
                    date_trunc('month', NOW()),
                    '1 month'
                ) AS date
            ),
            monthly_income AS (
                SELECT
                    TO_CHAR(date, 'YYYY-MM') as yyyy_mm,
                    SUM(amount) as total_income
                FROM collections
                WHERE date >= date_trunc('month', NOW() - interval '5 months')
                GROUP BY 1
            ),
            monthly_expenses AS (
                SELECT
                    TO_CHAR(due_date, 'YYYY-MM') as yyyy_mm,
                    SUM(amount) as total_expenses
                FROM payment_instructions
                WHERE status = 'Approved'
                AND due_date >= date_trunc('month', NOW() - interval '5 months')
                GROUP BY 1
            )
            SELECT 
                m.month_name as name,
                COALESCE(i.total_income, 0)::float as income,
                COALESCE(e.total_expenses, 0)::float as expenses
            FROM months m
            LEFT JOIN monthly_income i ON m.yyyy_mm = i.yyyy_mm
            LEFT JOIN monthly_expenses e ON m.yyyy_mm = e.yyyy_mm
            ORDER BY m.year, m.month;
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching financial overview:', err);
        res.status(500).json([]);
    }
});

app.get('/api/activity', async (req, res) => {
    try {
        let activities = [];

        // 1. Fetch payment instruction activities
        const paymentResult = await pool.query(
            "SELECT id, payee, history FROM payment_instructions WHERE jsonb_array_length(history) > 1"
        );
        
        for (const instruction of paymentResult.rows) {
            const lastAction = instruction.history[instruction.history.length - 1];
            if (lastAction && lastAction.status !== 'Pending') {
                const user = db.users.find(u => u.name === lastAction.user);
                activities.push({
                    id: `p-${instruction.id}`,
                    user: { 
                        name: lastAction.user, 
                        avatarUrl: user ? user.avatarUrl : 'https://picsum.photos/seed/user/100/100'
                    },
                    action: `${lastAction.status.toLowerCase()} a payment instruction for`,
                    target: instruction.payee,
                    timestamp: new Date(lastAction.timestamp),
                });
            }
        }

        // 2. Fetch new user activities
        const newUserResult = await pool.query(
            "SELECT id, name, avatar_url, created_at FROM users WHERE created_at > NOW() - INTERVAL '7 days' AND id > 3" // id > 3 to exclude seeded users
        );

        for (const user of newUserResult.rows) {
            activities.push({
                id: `u-${user.id}`,
                user: { name: user.name, avatarUrl: user.avatar_url },
                action: 'joined the team',
                target: '',
                timestamp: new Date(user.created_at),
            });
        }

        // 3. Sort and format activities
        activities.sort((a, b) => b.timestamp - a.timestamp);
        const formattedActivities = activities.slice(0, 5).map(act => ({
            ...act,
            timestamp: timeAgo(act.timestamp),
        }));

        res.json(formattedActivities);
    } catch (err) {
        console.error('Error fetching activity log:', err);
        res.status(500).json([]); // Return empty on error
    }
});

app.get('/api/messages/unread-count', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.json({ count: 0 });
    }
    try {
        const result = await pool.query(`
            SELECT COUNT(DISTINCT m.thread_id)
            FROM 
                messages m
            JOIN 
                (
                    SELECT thread_id, MAX(created_at) as max_created_at
                    FROM messages
                    GROUP BY thread_id
                ) lm ON m.thread_id = lm.thread_id AND m.created_at = lm.max_created_at
            WHERE 
                m.thread_id IN (SELECT thread_id FROM thread_participants WHERE user_id = $1)
                AND m.user_id != $1
                AND m.created_at > NOW() - INTERVAL '24 hours';
        `, [userId]);
        
        const count = parseInt(result.rows[0].count, 10) || 0;
        res.json({ count: count });
    } catch (err) {
        console.error("Error fetching unread count:", err);
        res.status(500).json({ count: 0 }); // Fallback on error
    }
});


// --- Health Check Endpoint ---
app.get('/', (req, res) => {
  res.status(200).send('Tabdeel Pulse Backend API is running.');
});

// --- Server Startup ---
const startServer = async () => {
    await initializeDatabase();
    await loadUsersIntoMemory(); // Load users into cache after ensuring tables exist
    app.listen(port, () => {
        console.log(`Backend server listening on port ${port}`);
    });
};

startServer();