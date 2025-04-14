const express = require('express');
const fs = require('fs');
const path = require('path');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'testKey-DO-NOT-USE-IN-PRODUCTION';

const app = express();
const PORT = 3000;
const DATA_FOLDER = path.join(__dirname, 'data');

app.use(express.json());

// make sure data folder exists
if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(DATA_FOLDER);
}

// TEMPORARY
// serve a simple frontend page ../frontend/public/index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});


// authentication
users = []

// register endpoint
// POST /register - register a new user
// request body: { "username": "user", "password": "pass" }
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Check if user already exists
    if (users.some(user => user.username === username)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);
    const salt = await bcrypt.genSalt(10);
    users.push({ username, password: hashedPassword, salt: salt });

    res.status(201).json({ message: 'User registered successfully' });
});



// login endpoint
// POST /login - login a user
// request body: { "username": "user", "password": "pass" }
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user by username
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(400).json({ error: 'User not found' });
    }

    // Compare the entered password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
});


// middleware to verify JWT token
// usage cause ill forget
// header authorization = Bearer <token>
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; 

    if (!token) {
        return res.status(403).json({ error: 'Token is required' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded;  // Save the decoded info (e.g., username) to `req.user`
        next();
    });
};




// file interaction

// file and folder listing
//examples cause ill forget lol
// GET /files - list all files and folders
// GET /files/file.txt - get file content
// GET /files/folder - list all files and folders in a folder
// GET /files/folder/file.txt - get file content
app.get('/files/{*splat}', verifyToken, (req, res) => {
    const relativePath = req.params.splat || '';
    const targetPath = path.join(DATA_FOLDER, ...(Array.isArray(relativePath) ? relativePath : [relativePath]));

    try {
        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({ error: 'Path not found' });
        }

        const stats = fs.statSync(targetPath);

        if (stats.isFile()) {
            // stream the file
            const fileStream = fs.createReadStream(targetPath);
            fileStream.pipe(res);
            fileStream.on('error', (err) => {
                res.status(500).json({ error: 'Error reading file' });
            });
        } else {
            const items = fs.readdirSync(targetPath, { withFileTypes: true });
            const files = items.map((item) => ({
                name: item.name,
                type: item.isDirectory() ? 'folder' : 'file'
            }));

            res.json({ type: 'folder', name: path.basename(targetPath), files });
        }
    } catch (err) {
        res.status(500).json({ error: 'Unable to access path' });
    }
});


// file and folder creation
// examples
// POST /files - create a new folder
// POST /files/file.txt - create a new file
// POST /files/folder?type=folder - create a new folder
app.post('/files/{*splat}', verifyToken, (req, res) => {
    const relativePath = req.params.splat || '';
    const targetPath = path.join(DATA_FOLDER, ...(Array.isArray(relativePath) ? relativePath : [relativePath]));

    const { type } = req.query.type ? req.query : { type: 'file' };

    if (!type) {
        return res.status(400).json({ error: 'Type parameter is required' });
    }

    if (!type || (type !== 'file' && type !== 'folder')) {
        return res.status(400).json({ error: 'Invalid type specified' });
    }

    try {
        if (type === 'folder') {
            fs.mkdirSync(targetPath, { recursive: true });
            res.status(201).json({ message: 'Folder created successfully' });
        } else if (type === 'file') {
            fs.writeFileSync(targetPath, '', { flag: 'wx' }); // create an empty file
            res.status(201).json({ message: 'File created successfully' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Unable to create file/folder' });
    }
});

// file and folder deletion
// examples
// DELETE /files - delete a folder
// DELETE /files/file.txt - delete a file
app.delete('/files/{*splat}', verifyToken, (req, res) => {
    const relativePath = req.params.splat || '';
    const targetPath = path.join(DATA_FOLDER, ...(Array.isArray(relativePath) ? relativePath : [relativePath]));

    try {
        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({ error: 'Path not found' });
        }

        if (fs.statSync(targetPath).isDirectory()) {
            fs.rmdirSync(targetPath, { recursive: true });
        } else {
            fs.unlinkSync(targetPath);
        }

        res.status(200).json({ message: 'File/Folder deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Unable to delete file/folder' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});