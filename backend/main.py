import sys
import os
import shutil
import json
import traceback
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add current directory to path to ensure imports work regardless of CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

import parser as pp
import Ai_Questions as AiQuestions
import Ai_Evaluate as AiEvaluate

app = FastAPI(title="AI Mock Interviewer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
RESUME_DIR = os.path.join(BASE_DIR, "resume")
STATIC_DIR = os.path.join(BASE_DIR, "static")
os.makedirs(RESUME_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

class EvaluationRequest(BaseModel):
    questions: list[str]
    answers: list[str]
    tone: str = "professional"

def clean_json_response(raw_text: str) -> dict:
    """Helper to clean and parse JSON response from Ollama, handles codeblocks and whitespace."""
    text = raw_text.strip()
    
    # Extract JSON if it is wrapped in markdown code blocks
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
        
    text = text.strip()
    
    # Try parsing
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"JSON Parsing Error: {e}. Raw Text: {raw_text}")
        # Secondary parsing attempts
        # Sometimes Ollama adds leading/trailing commentary, let's find the first '{' and last '}'
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1:
            try:
                return json.loads(text[start_idx:end_idx+1])
            except Exception:
                pass
        raise e

@app.post("/api/upload")
async def upload_resume(
    file: UploadFile = File(...),
    job_role: str = Form("Software Developer"),
    num_questions: int = Form(5)
):
    try:
        # Validate file type
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")
        
        # Save file to resume folder
        file_path = os.path.join(RESUME_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse PDF
        resume_text = pp.pdfparser(file_path)
        if not resume_text.strip():
            raise HTTPException(
                status_code=400, 
                detail="Could not extract text from the PDF. Please make sure the PDF has readable text."
            )
        
        # Generate Questions
        raw_questions = AiQuestions.GenerateQuestions(resume_text, job_role, num_questions)
        
        try:
            questions_data = clean_json_response(raw_questions)
            questions = questions_data.get("questions", [])
        except Exception as e:
            print(f"Fallback question parsing needed: {e}")
            # Fallback parsing if JSON parsing fails - split by newlines/dashes
            questions = [
                line.strip("- *1234567890. ").strip()
                for line in raw_questions.split("\n")
                if line.strip() and "?" in line
            ]
            if not questions:
                questions = ["Can you tell me about your background?", "Describe a challenging project from your resume."]
        
        return {
            "success": True,
            "filename": file.filename,
            "job_role": job_role,
            "questions": questions
        }
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate")
async def evaluate_interview(req: EvaluationRequest):
    try:
        if len(req.questions) != len(req.answers):
            raise HTTPException(
                status_code=400, 
                detail="The number of questions must match the number of answers."
            )
            
        raw_eval = AiEvaluate.Evaluate(req.questions, req.answers, req.tone)
        
        try:
            eval_data = clean_json_response(raw_eval)
        except Exception as e:
            print(f"Fallback evaluation formatting needed: {e}")
            # Fallback if Ollama output is not JSON but markdown/text
            eval_data = {
                "overall_score": 70,
                "technical_score": 70,
                "technical_feedback": "Unable to parse structured score details, but here is the raw evaluation output.",
                "communication_score": 70,
                "communication_feedback": "Unable to parse structured communication details.",
                "strengths": ["Review raw evaluation response"],
                "weaknesses": ["Review raw evaluation response"],
                "improvements": ["Review raw evaluation response"],
                "recommendation": "Consider",
                "raw_text": raw_eval
            }
            
        return eval_data
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Serve frontend static files
# Make sure to put the index.html fallback at the end so it serves static assets and falls back to index.html
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def read_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Welcome to AI Mock Interviewer. Please place index.html in backend/static/"}