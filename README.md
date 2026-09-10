# EmployeeInfoMap2

A full-stack employee data management system with AI-powered resume parsing using the Groq API.

## Features

- Employee data management (CRUD operations)
- AI-powered resume parsing using Groq API
- [Add other key features here]

## Tech Stack

- **Frontend:** [React / your framework]
- **Backend:** [Node.js / Python / your framework]
- **Resume Parser:** Python, Groq API
- **Database:** [MongoDB / PostgreSQL / your DB]

## Project Structure

```
EmployeeInfoMap2/
├── backend/              # Server-side API
├── Frontend/             # Client-side application
└── resume_parser_python/ # Resume parsing module (Groq AI)
```

## Setup Instructions

### Prerequisites
- Node.js / Python installed
- Groq API key

### Installation

1. Clone the repository
   ```
   git clone https://github.com/dishagarg3310-bot/EmployeeInfoMap2.git
   cd EmployeeInfoMap2
   ```

2. Backend setup
   ```
   cd backend
   npm install   # or pip install -r requirements.txt
   ```

3. Add your Groq API key in a `.env` file inside `backend/`:
   ```
   GROQ_API_KEY=your_api_key_here
   ```

4. Frontend setup
   ```
   cd ../Frontend
   npm install
   ```

5. Resume parser setup
   ```
   cd ../resume_parser_python
   pip install -r requirements.txt
   ```

## Usage

1. Start the backend server
   ```
   cd backend
   node server.js
   ```

2. Start the frontend
   ```
   The frontend will run automatically at `http://localhost:5000`.

3. Run the resume parser
   ```
   cd resume_parser_python
   python parser.py
   ```

## License

[Add license if applicable]
