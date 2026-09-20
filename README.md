# AI-Powered Resume Analyzer - Project Report & Documentation

## 1. Project Report Synopsis

### Introduction
The "AI-Powered Resume Analyzer" is a complete web application designed to help job seekers evaluate their resumes against standard Applicant Tracking System (ATS) criteria. It extracts text from uploaded PDF resumes, analyzes the content to detect key sections (Education, Skills, Projects, Experience, Certifications), calculates an ATS score, and optionally compares the resume against a target Job Description (JD) to compute a match percentage and identify missing skills.

### Objectives
- Automate resume screening and evaluation.
- Provide actionable feedback (ATS Score out of 100).
- Extract textual data without relying on complex, heavy machine learning models (using simple NLP & heuristics instead).
- Support job description comparison for targeted application review.

### Tech Stack
- **Frontend**: React (with React Router for navigation), Tailwind CSS for responsive styling. (Note: Substituted for HTML/CSS/JS to align with modern Full-Stack development standards in this environment).
- **Backend**: Node.js with Express.js (Substituted for Flask due to environment constraints).
- **Database**: SQLite (via `better-sqlite3`).
- **PDF Extraction**: `pdf-parse` (instead of PyPDF2).

---

## 2. Architecture & Folder Structure

### Folder Structure
```
/
âââ src/                  # React Frontend Code
â   âââ components/       # Reusable UI components (Navbar, Cards)
â   âââ pages/            # Page components (Login, Register, Dashboard, Analyze, History)
â   âââ App.tsx           # React Router setup
â   âââ main.tsx          # Frontend entry point
â   âââ index.css         # Tailwind global styles
âââ server.ts             # Express Backend Entry Point & API Routes
âââ database.db           # SQLite Database file (Generated at runtime)
âââ package.json          # Node.js dependencies and scripts
âââ README.md             # This document
```

---

## 3. Database Schema (SQLite)

The application uses two primary tables:

**1. `users` Table**
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `username`: TEXT UNIQUE
- `password`: TEXT (Hashed using bcrypt)

**2. `analyses` Table**
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id`: INTEGER (Foreign Key referencing `users.id`)
- `filename`: TEXT
- `ats_score`: INTEGER
- `match_percentage`: INTEGER (Nullable if no JD provided)
- `sections_found`: TEXT (JSON stringified array)
- `missing_skills`: TEXT (JSON stringified array)
- `suggestions`: TEXT (JSON stringified array)
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

---

## 4. ATS Scoring & Algorithms

### Text Extraction
- `pdf-parse` reads the binary buffer of the uploaded PDF and extracts the raw string content.
- The text is converted to lowercase for case-insensitive matching.

### Resume Analysis Algorithm (Heuristic / Keyword Matching)
The algorithm looks for the presence of specific keywords to determine if a section exists:
- **Education**: ['education', 'university', 'bachelor', 'btech', 'degree', 'college']
- **Skills**: ['skills', 'technologies', 'tools', 'frameworks', 'languages']
- **Projects**: ['projects', 'personal projects', 'academic projects']
- **Experience**: ['experience', 'work history', 'employment', 'internship']
- **Certifications**: ['certifications', 'certificates', 'courses']
- **Links**: ['github.com', 'linkedin.com']

### ATS Scoring Logic (Out of 100)
- Skills present: +20
- Projects present: +20
- Experience present: +20
- Certifications present: +15
- Education present: +15
- Links (GitHub/LinkedIn) present: +10

### Job Description Matching Algorithm
- Extracts words from the resume and words from the Job Description.
- Calculates intersection: `(Matching Words / Total JD Words) * 100`
- Finds missing skills: Words present in the JD but missing from the resume.

---

## AI Insights Layer (Google Gemini)

Alongside the heuristic scoring above, the app now includes an **optional semantic AI layer** powered by Google Gemini (`@google/genai`).

### How it works
1. When a resume is uploaded, the extracted text is sent to Gemini with a structured prompt.
2. Gemini returns strict JSON (enforced via `responseSchema` + `responseMimeType: 'application/json'`) containing:
   - `summary` — a 2–3 sentence overall assessment
   - `skills` — the candidate's real skills, extracted semantically (no hardcoded list)
   - `sections` — semantic detection of the six standard sections
   - `strengths` / `improvements` — specific, actionable feedback grounded in the resume
   - `jdMatch` — semantic job-description comparison: match %, matched/missing skills, reasoning (null when no JD is given)
3. The result is stored in the `analyses.ai_insights` column and rendered in a dedicated **AI Insights** panel on the Dashboard. History cards that include AI results show an "AI" badge.

### Fail-safe design
- The heuristic ATS score always runs, with or without AI.
- If `GEMINI_API_KEY` is missing, the layer is disabled and the Dashboard shows a hint explaining how to enable it.
- If the API call fails or times out (30s guard), the upload still succeeds with heuristic results only.
- The model defaults to `gemini-2.5-flash` and can be overridden with `GEMINI_MODEL`.

### Setup
1. Get a free API key from Google AI Studio: https://aistudio.google.com/apikey
2. Create a `.env` file in the project root (it is gitignored — never commit it):
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Restart the server (`npm run dev`). You should see `AI insights layer enabled` in the console.

---

## 5. Deployment Steps

1. **Local Execution**:
   - Run `npm install` to download dependencies.
   - Run `npm run dev` to start the Vite frontend and Express server concurrently.
2. **Production Build**:
   - Run `npm run build`. This compiles React to static files inside `dist/` and bundles the Express server to `dist/server.cjs`.
   - Run `npm run start` to execute the bundled server and host the application seamlessly.

---

## 6. Viva Questions & Answers

**Q1. Why did we use SQLite for this project?**
**Answer**: SQLite is serverless, lightweight, and stores the entire database in a single file (`database.db`). It's perfect for a minor project where a full-scale database like PostgreSQL or MySQL would be overkill.

**Q2. How is PDF text extraction handled?**
**Answer**: Since PDFs are binary files, standard text reading doesn't work. We use a library (like `pdf-parse`) that parses the internal PDF document structure and extracts text blocks into a single string.

**Q3. How is the ATS Score calculated without Machine Learning?**
**Answer**: We use natural language heuristics and keyword mapping. The algorithm scans the extracted text for foundational resume sections (Education, Skills, Experience) and assigns weighted points. This rule-based NLP technique is deterministic and simple to explain.

**Q4. What is a JWT and why is it used?**
**Answer**: JWT (JSON Web Token) is used for stateless user authentication. Upon login, the server issues a token containing the user's ID. The client sends this token in headers for subsequent requests (like uploading a resume), allowing the backend to verify the user securely without storing session states.

---

## 7. Future Scope
- **Advanced NLP**: Integrating Large Language Models (like Gemini/OpenAI) to semantically understand context (e.g., distinguishing between a skill and a random mentioned word).
- **Formatting Checks**: Analyzing font sizes, margins, and complex layout issues.
- **Export to PDF**: Allowing users to rebuild an ATS-friendly PDF directly from the dashboard.
