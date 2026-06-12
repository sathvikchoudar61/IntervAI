# IntervAI — AI Mock Interviewer

IntervAI is a modern, web-based AI Mock Interviewer designed for software developers and professionals. By parsing an uploaded PDF resume and targeting a specific job role, the application generates tailor-made, context-aware interview questions. Candidates can reply using text or real-time voice inputs. Answers are strictly evaluated by a local LLM to generate an interactive, detailed performance scorecard.

---

## Key Features

*   **Tailored Question Generation:** Extracts credentials from an uploaded **PDF resume** and matches them against your target **Job Role** to formulate custom, highly relevant questions.
*   **Voice & Audio Integration:**
    *   **Text-to-Speech (TTS):** Reads interview questions out loud using the browser's speech synthesis engine.
    *   **Speech-to-Text (STT):** Dictates spoken answers in real-time using the HTML5 Web Speech API.
    *   **Interactive Audio Wave Visualizer:** A canvas-based audio wave frequency visualizer showing live voice inputs when recording.
*   **Interviewer Persona Tones:**
    *   **Friendly:** Supportive, encouraging, and reads questions with a gentler voice pitch.
    *   **Professional:** Objective, balanced, and standard corporate-level grading.
    *   **Brutal:** Hyper-critical, fast-paced, and strictly grades incomplete or short answers (forces 0 scores for wrong answers).
*   **Granular Performance Dashboard:**
    *   **Circular overall score gauges** and comparative metrics charts.
    *   Technical Knowledge vs. Communication Skill rating sliders.
    *   Bullet-point breakdowns of **Key Strengths**, **Critical Weaknesses**, and **Suggested Improvements**.
    *   Clear hiring recommendations: `Hire`, `Consider`, or `Reject`.
*   **LeetCode/GitHub Design Style:** Minimalist, sleek developer-friendly UI with sharp white cards, thin gray borders, and vibrant green accents.

---

## Tech Stack

### Backend
*   **Framework:** FastAPI (Python 3)
*   **LLM Engine:** Ollama running `qwen2.5:3b`
*   **PDF Parser:** `pdfplumber`

### Frontend
*   **Core:** React 19, Vite (Fast build & hot reload)
*   **Styling:** Tailwind CSS (Modern developer theme)
*   **Audio APIs:** Web Audio API (Canvas visualizer) & Web Speech API (Dictation/TTS)

---

## Project Structure

```text
├── backend/
│   ├── Ai_Evaluate.py     # Evaluation prompt & Ollama chat call
│   ├── Ai_Questions.py    # Question generation prompt
│   ├── main.py            # FastAPI endpoints & static file serving
│   ├── parser.py          # PDF text extraction utility
│   ├── resume/            # Directory where uploaded resumes are stored
│   └── static/            # Directory serving React's built assets (index.html, JS, CSS)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ReportDashboard.jsx  # SVG score cards, feedback & strengths/weaknesses
│   │   │   └── WaveVisualizer.jsx   # Live audio frequency visualizer canvas
│   │   ├── App.jsx                  # Setup screen, active interview & STT/TTS routing
│   │   ├── index.css                # Custom global styles
│   │   └── main.jsx                 # React DOM mount point
│   ├── tailwind.config.js           # Green brand design-token definitions
│   └── vite.config.js               # Development proxy & build-out routing to backend/static
│
├── requirements.txt                 # Backend Python package dependencies
└── README.md                        # Project documentation (this file)
```

---

## Installation & Setup

### Prerequisites
1.  **Python 3.9+** installed on your system.
2.  **Node.js (v18+)** and **npm** installed.
3.  **Ollama** installed locally.

---

### Step 1: Set Up the AI Model (Ollama)
Ensure the Ollama application is running on your machine, then pull the `qwen2.5:3b` model:
```bash
ollama pull qwen2.5:3b
```

---

### Step 2: Set Up and Run the Backend
1.  Navigate to the project root directory.
2.  Install the Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Start the FastAPI development server:
    ```bash
    python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
    ```
    *The API will be available at `http://127.0.0.1:8000`.*

---

### Step 3: Set Up the Frontend

#### Running in Development Mode (Hot Reload)
1.  Navigate to the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install the package dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
    *The web interface will open at `http://localhost:5173`. Any API calls to `/api` will be proxied automatically to the backend running on port 8000.*

#### Running in Production Mode (Pre-bundled Static Assets)
If you want to compile the frontend and let the backend server serve the static bundle directly:
1.  Run the build script in the `frontend` folder:
    ```bash
    npm run build
    ```
    *This cleans `backend/static/` and compiles the React application files straight into it.*
2.  Open your browser and navigate directly to:
    ```text
    http://127.0.0.1:8000/
    ```

---

## Permissions & Browser Compatibility
*   **Microphone Access:** To use the speech-to-text recording functionality, please allow microphone access inside your browser when prompted.
*   **Browser Support:** The voice dictation features rely on the Web Speech API, which is supported on Google Chrome, Edge, Safari, and Opera. Firefox does not support continuous speech recognition natively.

---

## License
This project is open-source and free to modify. Happy practicing!
