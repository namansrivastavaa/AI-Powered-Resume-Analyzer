import express, { Request, Response } from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-minor-project';

// Basic middleware
app.use(express.json());
app.use(cors());

// Configure Multer for PDF file uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize SQLite Database
// This will create a 'database.db' file in the root directory
const db = new Database('database.db');

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Setup Database Schema
function setupDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      ats_score INTEGER NOT NULL,
      match_percentage INTEGER,
      sections_found TEXT NOT NULL,
      missing_skills TEXT NOT NULL,
      suggestions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Seed default demo admin account if not present
  try {
    const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!existingAdmin) {
      const hashed = bcrypt.hashSync('admin', 10);
      db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hashed);
    }
  } catch (e) {
    console.error('Failed to seed admin user:', e);
  }
}
setupDatabase();

// --- Authentication Middleware ---
// Validates the JWT token sent from the React frontend
function authenticateToken(req: any, res: Response, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  // Fast-track demo admin token if used
  if (token === 'admin-demo-token-12345') {
    let adminUser = db.prepare('SELECT id, username FROM users WHERE username = ?').get('admin') as any;
    if (!adminUser) {
      const hashed = bcrypt.hashSync('admin', 10);
      const insertRes = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hashed);
      adminUser = { id: insertRes.lastInsertRowid, username: 'admin' };
    }
    req.user = adminUser;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
}

// --- API Endpoints ---

// 1. User Registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    stmt.run(username, hashedPassword);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// 2. User Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username) as any;

  if (!user) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: user.username });
});

// --- NLP & Parsing Logic ---
// We keep it simple (No Machine Learning) to fit the "beginner project" constraints.

const COMMON_SKILLS = ['python', 'java', 'javascript', 'react', 'node', 'express', 'sql', 'sqlite', 'html', 'css', 'c++', 'aws', 'docker', 'git', 'flask', 'django'];

function analyzeResumeText(text: string, jdText?: string) {
  const lowerText = text.toLowerCase();
  
  // Section Keywords
  const sections = {
    education: ['education', 'university', 'bachelor', 'btech', 'degree', 'college', 'institute'],
    skills: ['skills', 'technologies', 'tools', 'frameworks', 'languages'],
    projects: ['projects', 'personal projects', 'academic projects'],
    experience: ['experience', 'work history', 'employment', 'internship', 'intern'],
    certifications: ['certifications', 'certificates', 'courses'],
    links: ['github.com', 'linkedin.com']
  };

  const sectionsFound: Record<string, boolean> = {
    education: false,
    skills: false,
    projects: false,
    experience: false,
    certifications: false,
    links: false
  };

  // Check presence of sections
  for (const [section, keywords] of Object.entries(sections)) {
    sectionsFound[section] = keywords.some(kw => lowerText.includes(kw));
  }

  // ATS Scoring Logic
  let score = 0;
  if (sectionsFound.skills) score += 20;
  if (sectionsFound.projects) score += 20;
  if (sectionsFound.experience) score += 20;
  if (sectionsFound.certifications) score += 15;
  if (sectionsFound.education) score += 15;
  if (sectionsFound.links) score += 10;

  // Improvement Suggestions
  const suggestions = [];
  if (!sectionsFound.skills) suggestions.push('Add a dedicated "Skills" section to highlight your technical abilities.');
  if (!sectionsFound.projects) suggestions.push('Include a "Projects" section with links to GitHub repositories.');
  if (!sectionsFound.experience) suggestions.push('If you lack work experience, consider adding an "Internships" or "Volunteering" section.');
  if (!sectionsFound.certifications) suggestions.push('Add online courses or certifications to boost credibility.');
  if (!sectionsFound.education) suggestions.push('Clearly list your degree, university, and graduation year.');
  if (!sectionsFound.links) suggestions.push('Include links to GitHub or LinkedIn to provide proof of work.');

  if (score === 100) {
    suggestions.push('Great job! Your resume contains all standard ATS sections.');
  }

  // Job Description Matching
  let matchPercentage = null;
  const missingSkills = [];
  
  if (jdText) {
    const jdLower = jdText.toLowerCase();
    
    // Extract potential skills from JD (simple intersection)
    const jdSkills = COMMON_SKILLS.filter(skill => jdLower.includes(skill));
    
    if (jdSkills.length > 0) {
      let matchedCount = 0;
      for (const skill of jdSkills) {
        if (lowerText.includes(skill)) {
          matchedCount++;
        } else {
          missingSkills.push(skill);
        }
      }
      matchPercentage = Math.round((matchedCount / jdSkills.length) * 100);
    } else {
      matchPercentage = 0; // No standard technical skills found in JD
    }
  }

  return {
    score,
    sectionsFound,
    suggestions,
    matchPercentage,
    missingSkills
  };
}

// 3. Analyze Resume Endpoint
app.post('/api/analyze', authenticateToken, upload.single('resume'), async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  const jdText = req.body.jdText || '';

  try {
    // Extract text from binary PDF buffer using PDFParse v2
    let extractedText = '';
    try {
      const parser = new PDFParse({ data: req.file.buffer });
      const pdfData = await parser.getText();
      extractedText = pdfData?.text || '';
    } catch (parseErr) {
      console.warn("Primary PDFParse extraction error, attempting raw string fallback:", parseErr);
      const raw = req.file.buffer.toString('utf-8');
      const printable = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (printable.length > 20) {
        extractedText = printable;
      } else {
        throw new Error('Could not parse text from this PDF file. Please ensure it contains selectable text.');
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      extractedText = req.file.originalname || 'Resume';
    }

    // Run the analysis algorithm
    const analysis = analyzeResumeText(extractedText, jdText);

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO analyses 
      (user_id, filename, ats_score, match_percentage, sections_found, missing_skills, suggestions) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      req.user.id,
      req.file.originalname,
      analysis.score,
      analysis.matchPercentage,
      JSON.stringify(analysis.sectionsFound),
      JSON.stringify(analysis.missingSkills),
      JSON.stringify(analysis.suggestions)
    );

    res.json(analysis);

  } catch (error: any) {
    console.error("PDF Processing Error:", error);
    res.status(500).json({ error: error?.message || 'Failed to process PDF file' });
  }
});

// 4. Get Analysis History
app.get('/api/history', authenticateToken, (req: any, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC');
    const history = stmt.all(req.user.id);
    
    // Parse JSON strings back to objects before sending to frontend
    const formattedHistory = history.map((item: any) => ({
      ...item,
      sections_found: JSON.parse(item.sections_found),
      missing_skills: JSON.parse(item.missing_skills),
      suggestions: JSON.parse(item.suggestions)
    }));

    res.json(formattedHistory);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Vite middleware for serving frontend
import { createServer as createViteServer } from 'vite';

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
