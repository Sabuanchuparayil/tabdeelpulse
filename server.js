const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// === Middleware ===
// Enable CORS for all routes so your frontend can talk to your backend on another domain
app.use(cors());

// === Serve static files from the root directory ===
// This tells Express to serve your built React app (e.g., bundle.js, index.html)
app.use(express.static(path.join(__dirname, '')));

// === Catch-all for Single-Page Applications ===
// This is important for apps that use client-side routing. It ensures that if a
// user refreshes on a page like /users, the server still sends index.html,
// and the React application takes over the routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
});
