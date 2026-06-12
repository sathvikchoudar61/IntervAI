import ollama
import time


def Evaluate(questions, answers, tone="professional"):
    qa_text = ""
    for i in range(len(questions)):
        qa_text += f"""
            Question {i+1}: {questions[i]}
            Candidate's Answer {i+1}: {answers[i]}
            """

    tone_instruction = ""
    if tone == "friendly":
        tone_instruction = """
        Your tone is friendly, encouraging, and supportive. Emphasize positive aspects of the answers, and offer gentle, constructive feedback for improvement. Do not be overly harsh.
        """
    elif tone == "brutal":
        tone_instruction = """
        Your tone is brutally strict, harsh, and direct. Treat this as a high-stakes, do-or-die technical interview. Do not accept incorrect, shallow, or extremely short answers. Critique every mistake ruthlessly and highlight failures clearly.
        """
    else:  # professional
        tone_instruction = """
        Your tone is professional, objective, balanced, and fair. Evaluate strengths and weaknesses constructively, maintaining a standard corporate interview feedback style.
        """

    prompt = f"""
        You are an expert technical interviewer. Evaluate the candidate's answers based on the questions asked.
        
        Interviewer Tone Instruction:
        {tone_instruction}

        Here is the conversation log:
        {qa_text}

        Evaluate the interview and return ONLY valid JSON matching this schema structure.
        
        CRITICAL SCORING RULES:
        1. Do NOT copy any scores or recommendations from this prompt. Calculate them based on candidate's answers.
        2. Be EXTREMELY strict. If the candidate gives wrong, incorrect, irrelevant, or single-word answers (like "don't know", "one", "yes", etc.), you must fail them. A single-word incorrect answer must get a score of 0 for that question.
        3. If more than 50% of the answers are single-word or incorrect, the overall_score must be below 40, and the recommendation must be "Reject".
        4. Evaluate technical depth thoroughly. If they fail to explain concepts, give a low technical_score.

        JSON schema to populate:
        {{
            "overall_score": 0, // Replace with your calculated overall score (integer 0-100)
            "technical_score": 0, // Replace with your calculated technical score (integer 0-100)
            "technical_feedback": "Detailed feedback about candidate's technical depth or lack thereof...",
            "communication_score": 0, // Replace with your calculated communication score (integer 0-100)
            "communication_feedback": "Detailed feedback about candidate's articulation and verbal clarity...",
            "strengths": [
                "Detailed strength 1",
                "Detailed strength 2"
            ],
            "weaknesses": [
                "Detailed weakness 1 (or multiple if answers were poor)",
                "Detailed weakness 2"
            ],
            "improvements": [
                "Specific area for improvement 1",
                "Specific area for improvement 2"
            ],
            "recommendation": "Reject"  // Must be one of: "Hire", "Consider", "Reject"
        }}

        Do not include any markdown wrappers (like ```json), markdown symbols, or extra conversational text. Return ONLY the JSON object.
        """

    start = time.time()

    response = ollama.chat(
        model="qwen2.5:3b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    end = time.time()

    print("Evaluation Time:", round(end - start, 2), "seconds")

    return response["message"]["content"]