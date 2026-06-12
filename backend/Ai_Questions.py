import ollama
import time


def GenerateQuestions(resume_text, job_role="Software Developer", num_questions=5):
    prompt = f"""
        You are an interviewer conducting a mock interview for the role of '{job_role}'.

        Based on the following resume, generate exactly {num_questions} interview questions tailored to the role and the candidate's background.

        Return ONLY valid JSON in this format:

        {{
            "questions": [
                "question1",
                "question2"
            ]
        }}

        Do not include any other text, markdown blocks (like ```json), or explanations. Return ONLY the JSON object.

        Resume:
        {resume_text}
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

    print("Response Time:", round(end - start, 2), "seconds")
    return response["message"]["content"]