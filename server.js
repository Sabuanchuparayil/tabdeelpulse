const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the root directory where bundle.js is located
app.use(express.static(path.join(__dirname)));

// For any request that doesn't match a static file, serve index.html.
// This is crucial for single-page applications like React to handle routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend server listening at http://localhost:${port}`);
});
