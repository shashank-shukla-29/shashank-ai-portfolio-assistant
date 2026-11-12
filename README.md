
# AI Portfolio Assistant

An AI-powered portfolio chatbot that represents a candidate and answers recruiter questions using information from their resume and portfolio.

Built with React, FastAPI, Python, and Groq LLM API.

## Overview

The AI Portfolio Assistant allows recruiters and visitors to interact with an AI representative of the candidate.

Instead of manually browsing through a resume, visitors can ask questions about technical skills, projects, certifications, education, and experience through a conversational interface.

The system also includes an admin dashboard that allows the candidate to upload or replace their resume. The chatbot uses the newly uploaded resume as its knowledge source.

## Features

- **AI-powered conversations:** Answers recruiter questions using the candidate's available information.
- **Streaming responses:** Displays AI responses as they are generated.
- **Resume-based knowledge:** Extracts text from PDF and DOCX resumes.
- **Dynamic resume updates:** Uploading a new resume updates the chatbot's knowledge source.
- **Admin authentication:** Protects resume management functionality with an admin secret key.
- **Resume management dashboard:** Displays uploaded resume details and extraction status.
- **Markdown support:** Formats responses with headings, lists, and tables.
- **Responsive interface:** Dark-themed interface designed for desktop and mobile devices.

## Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS
- React Markdown

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic

### AI Integration
- Groq API
- OpenAI GPT-OSS 20B model

### Document Processing
- PyMuPDF
- python-docx
- python-multipart

## Project Structure

```text
ai-portfolio-assistant/
│
├── backend/
│   ├── main.py
│   ├── profile.json
│   ├── requirements.txt
│   └── data/                 # Private uploaded resume data
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── .gitignore
```

## Getting Started

### Prerequisites

Install the following:

- Python 3.11 or later
- Node.js and npm
- Git
- A Groq API key

### 1. Clone the Repository

```bash
git clone https://github.com/shashank-shukla-29/shashank-ai-portfolio-assistant.git
cd shashank-ai-portfolio-assistant
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

Add the following:

```env
GROQ_API_KEY=your_groq_api_key
ADMIN_UPLOAD_KEY=your_secure_admin_key
```

Replace the placeholder values with your own credentials.

**Never commit your `.env` file or expose your API keys publicly.**

### 4. Start the Backend

From the backend directory, run:

```bash
uvicorn main:app --reload
```

Backend API:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

### 5. Frontend Setup

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend application:

```text
http://localhost:5173
```

Both backend and frontend servers must remain running while using the application.

## Resume Management

The Admin Dashboard provides functionality to:

1. Authenticate using the admin secret key.
2. View the currently uploaded resume.
3. Upload a PDF or DOCX resume.
4. Extract text from the uploaded document.
5. Replace the previous resume.
6. Update the chatbot's knowledge source immediately after a successful upload.

**Upload restrictions:** PDF and DOCX files, maximum 5 MB.

Scanned PDFs without extractable text are not supported by the current implementation.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/chat` | Chat with the AI assistant |
| POST | `/admin/verify` | Verify admin credentials |
| GET | `/admin/resume-info` | Retrieve current resume information |
| POST | `/admin/upload-resume` | Upload or replace a resume |

Interactive API documentation is available through FastAPI Swagger UI at `/docs`.

## Security Considerations

- API credentials are stored in environment variables.
- `.env` files are excluded through `.gitignore`.
- Uploaded resume data is excluded from the public Git repository.
- Admin endpoints require the configured admin secret key.
- Production deployment should use HTTPS, appropriate CORS settings, secure authentication, and persistent file storage.

## Future Improvements

- Deploy frontend and backend using Vercel and Render.
- Implement stronger admin authentication.
- Add persistent cloud storage for uploaded resumes.
- Improve document processing and knowledge retrieval.
- Add job description matching and candidate suitability analysis.
- Add conversation analytics and recruiter insights.

## Author

**Shashank Shukla**

B.Tech Computer Science and Engineering  
KIET Group of Institutions (2023–2027)

- GitHub: [shashank-shukla-29](https://github.com/shashank-shukla-29)
- LinkedIn: [Shashank Shukla](https://www.linkedin.com/in/shashank-shukla-a7a4362b2)

---

If you find this project interesting, consider giving the repository a star!
