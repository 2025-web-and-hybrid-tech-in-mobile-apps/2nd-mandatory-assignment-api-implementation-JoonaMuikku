const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//
const jwt = require("jsonwebtoken");
const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true, strict: true });
require("ajv-formats")(ajv);
const jwtSecret = 'secret';

// AJV schemas
const userLoginSignupSchema = {
  type: 'object',
  required: ['userHandle', 'password'],
  additionalProperties: false,
  properties: {
    userHandle: {
      type: 'string',
      minLength: 6,
    },
    password: {
      type: 'string',
      minLength: 6,
    },
  },
};

const highScoreSchema = {
  type: 'object',
  required: ['level', 'userHandle', 'score', 'timestamp'],
  additionalProperties: false,
  properties: {
    level: { type: 'string' },
    userHandle: { type: 'string' },
    score: { type: 'integer' },
    timestamp: {
      type: 'string',
      format: 'date-time',
    },
  },
};

// Middleware
const validateUserLoginSignup = (req, res, next) => {
  const validate = ajv.compile(userLoginSignupSchema);
  const valid = validate(req.body);
  if (!valid) return res.status(400).json({ error: 'Invalid request body' });
  next();
};

const validateHighScore = (req, res, next) => {
  const validate = ajv.compile(highScoreSchema);
  const valid = validate(req.body);
  if (!valid) return res.status(400).json({ error: 'Invalid request body' });
  next();
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
};

// Routes
app.post('/signup', validateUserLoginSignup, (req, res) => {
  const { userHandle, password } = req.body;

  if (users.some(u => u.userHandle === userHandle)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  users.push({ userHandle, password });
  res.sendStatus(201);
});

app.post('/login', validateUserLoginSignup, (req, res) => {
  const { userHandle, password } = req.body;
  const user = users.find(u => u.userHandle === userHandle && u.password === password);

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const token = jwt.sign({ userHandle }, jwtSecret);
  res.json({ jsonWebToken: token });
});

app.post('/high-scores', authenticateToken, validateHighScore, (req, res) => {
  highscores.push(req.body);
  res.sendStatus(201);
});

app.get('/high-scores', (req, res) => {
  const { level, page = 1 } = req.query;
  
  if (!level) return res.status(400).json({ error: 'Missing level parameter' });
  if (isNaN(page) || page < 1) return res.status(400).json({ error: 'Invalid page number' });

  const filtered = highscores
    .filter(h => h.level === level)
    .sort((a, b) => b.score - a.score);

  const pageSize = 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  res.json(filtered.slice(start, end));
});

// Server management
let serverInstance = null;
let users = [];
let highscores = [];

module.exports = {
  start: function () {
    // Reset storage on server start
    users = [];
    highscores = [];
//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};