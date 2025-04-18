const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files from the 'html' directory
app.use(express.static(path.join(__dirname, 'html')));

// Catch-all route to serve index.html for any 404
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});