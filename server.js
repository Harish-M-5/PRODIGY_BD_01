// server.js

const http = require('http');
const { v4: uuidv4 } = require('uuid');

// In-memory user storage (like HashMap)
let users = {};

// Helper: Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper: Parse JSON body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Create the server
const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('/').filter(Boolean);
  const method = req.method;
  res.setHeader('Content-Type', 'application/json');

  // ------------------------
  // POST /users -> Create User
  // ------------------------
  if (method === 'POST' && req.url === '/users') {
    try {
      const body = await parseRequestBody(req);
      const { name, email, age } = body;

      if (!name || !email || !age) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ message: 'Name, email, and age are required' }));
      }

      if (!isValidEmail(email)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ message: 'Invalid email format' }));
      }

      const id = uuidv4();
      const newUser = { id, name, email, age };
      users[id] = newUser;

      res.statusCode = 201;
      return res.end(JSON.stringify({ message: 'User created successfully', user: newUser }));
    } catch (err) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ message: 'Invalid JSON data' }));
    }
  }

  // ------------------------
  // GET /users -> Get All Users
  // ------------------------
  else if (method === 'GET' && req.url === '/users') {
    const allUsers = Object.values(users);
    res.statusCode = 200;
    return res.end(JSON.stringify(allUsers));
  }

  // ------------------------
  // GET /users/:id -> Get Single User
  // ------------------------
  else if (method === 'GET' && urlParts[0] === 'users' && urlParts[1]) {
    const id = urlParts[1];
    const user = users[id];
    if (!user) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ message: 'User not found' }));
    }
    res.statusCode = 200;
    return res.end(JSON.stringify(user));
  }

  // ------------------------
  // PUT /users/:id -> Update User
  // ------------------------
  else if (method === 'PUT' && urlParts[0] === 'users' && urlParts[1]) {
    const id = urlParts[1];
    const existingUser = users[id];

    if (!existingUser) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ message: 'User not found' }));
    }

    try {
      const body = await parseRequestBody(req);
      const { name, email, age } = body;

      if (email && !isValidEmail(email)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ message: 'Invalid email format' }));
      }

      users[id] = {
        ...existingUser,
        name: name || existingUser.name,
        email: email || existingUser.email,
        age: age || existingUser.age,
      };

      res.statusCode = 200;
      return res.end(JSON.stringify({ message: 'User updated successfully', user: users[id] }));
    } catch {
      res.statusCode = 400;
      return res.end(JSON.stringify({ message: 'Invalid JSON data' }));
    }
  }

  // ------------------------
  // DELETE /users/:id -> Delete User
  // ------------------------
  else if (method === 'DELETE' && urlParts[0] === 'users' && urlParts[1]) {
    const id = urlParts[1];
    if (!users[id]) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ message: 'User not found' }));
    }

    delete users[id];
    res.statusCode = 200;
    return res.end(JSON.stringify({ message: 'User deleted successfully' }));
  }

  // ------------------------
  // 404 Not Found (Invalid Route)
  // ------------------------
  else {
    res.statusCode = 404;
    return res.end(JSON.stringify({ message: 'Route not found' }));
  }
});

// Start server
const PORT = 9000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
