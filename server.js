const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = 3000;

// Lecture demo database: mydb8, table: customers4
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mydb8',
  waitForConnections: true,
  connectionLimit: 10
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Demo keys for classroom testing only. Do not use these keys in production.
const profiles = {
  'guest-demo-key':   { role: 'Guest',   maxRows: 2,  credits: 4,  actions: ['load'],             fields: ['Name'] },
  'student-demo-key': { role: 'Student', maxRows: 3,  credits: 8,  actions: ['load', 'search'],   fields: ['Name', 'Address'] },
  'teacher-demo-key': { role: 'Teacher', maxRows: 10, credits: 30, actions: ['load', 'search'],   fields: ['Name', 'Address'] },
  'admin-demo-key':   { role: 'Admin',   maxRows: 20, credits: 50, actions: ['load', 'search', 'usage'], fields: ['Name', 'Address'] }
};

function identify(req, res, next) {
  const key = req.get('x-api-key');
  const profile = key && profiles[key];
  if (!profile) return res.status(401).json({ error: 'Unknown or missing API key.' });
  req.accessProfile = profile;
  next();
}

function permit(action) {
  return (req, res, next) => {
    const profile = req.accessProfile;
    if (!profile.actions.includes(action)) {
      return res.status(403).json({ error: `${profile.role} is not permitted to ${action}.` });
    }
    if (profile.credits <= 0) {
      return res.status(429).json({ error: 'No credits remaining. Restart the server for a fresh demo.' });
    }
    next();
  };
}

function consumeCredit(req, res, next) {
  req.accessProfile.credits -= 1;
  next();
}

function safeRows(rows, profile) {
  // Guest receives only Name from the server; Address is never sent.
  return rows.map(row => profile.role === 'Guest' ? { Name: row.Name } : { Name: row.Name, Address: row.Address });
}

app.get('/api/customers', identify, permit('load'), consumeCredit, async (req, res) => {
  try {
    const requested = Number.parseInt(req.query.limit, 10);
    const requestedRows = Number.isInteger(requested) && requested > 0 ? requested : 10;
    const allowedRows = Math.min(requestedRows, req.accessProfile.maxRows);
    const [rows] = await db.execute(
      'SELECT Name, Address FROM customers4 LIMIT ?',
      [allowedRows]
    );
    res.json({
      data: safeRows(rows, req.accessProfile),
      meta: { role: req.accessProfile.role, requestedRows, allowedRows, remainingCredits: req.accessProfile.credits }
    });
  } catch (error) {
    req.accessProfile.credits += 1; // Do not charge for a failed database request.
    console.error('Load customers failed:', error.message);
    res.status(500).json({ error: 'Could not load customers. Check MySQL and the table/column names.' });
  }
});

app.get('/api/customers/search', identify, permit('search'), consumeCredit, async (req, res) => {
  try {
    const name = String(req.query.name || '').trim();
    if (!name) {
      req.accessProfile.credits += 1;
      return res.status(400).json({ error: 'Enter a customer name to search.' });
    }
    const [rows] = await db.execute(
      'SELECT Name, Address FROM customers4 WHERE Name LIKE ? LIMIT ?',
      [`%${name}%`, req.accessProfile.maxRows]
    );
    res.json({
      data: safeRows(rows, req.accessProfile),
      meta: { role: req.accessProfile.role, allowedRows: req.accessProfile.maxRows, remainingCredits: req.accessProfile.credits }
    });
  } catch (error) {
    req.accessProfile.credits += 1;
    console.error('Search customers failed:', error.message);
    res.status(500).json({ error: 'Could not search customers. Check MySQL and the table/column names.' });
  }
});

app.get('/api/access/summary', identify, (req, res, next) => {
  if (req.accessProfile.role !== 'Admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
}, (req, res) => {
  // Usage view does not expose keys, passwords, or other database credentials.
  const usage = Object.values(profiles).map(profile => ({
    role: profile.role,
    remainingCredits: profile.credits,
    maxCredits: profile.role === 'Guest' ? 4 : profile.role === 'Student' ? 8 : profile.role === 'Teacher' ? 30 : 50
  }));
  res.json({ data: usage });
});

app.get('/api/health', (req, res) => res.json({ status: 'AccessDesk API is running' }));

app.listen(PORT, () => console.log(`AccessDesk running at http://localhost:${PORT}`));
