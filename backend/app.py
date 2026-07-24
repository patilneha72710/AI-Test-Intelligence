import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
from PyPDF2 import PdfReader
import docx

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.3-70b-versatile"

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/")
def home():
    return jsonify({"message": "AI Test Intelligence Platform backend is running!"})


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


def extract_text_from_pdf(filepath):
    reader = PdfReader(filepath)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def extract_text_from_docx(filepath):
    doc = docx.Document(filepath)
    return "\n".join([para.text for para in doc.paragraphs])


def extract_text_from_txt(filepath):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


@app.route("/api/analyze-requirements", methods=["POST"])
def analyze_requirements():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    # Extract text based on file type
    ext = file.filename.rsplit(".", 1)[-1].lower()
    try:
        if ext == "pdf":
            raw_text = extract_text_from_pdf(filepath)
        elif ext == "docx":
            raw_text = extract_text_from_docx(filepath)
        elif ext == "txt":
            raw_text = extract_text_from_txt(filepath)
        else:
            return jsonify({"error": "Unsupported file type. Use PDF, DOCX, or TXT."}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500

    if not raw_text.strip():
        return jsonify({"error": "No readable text found in the file."}), 400

    # Send to Gemini for structured requirement extraction
    prompt = f"""
You are a senior QA analyst. Read the following software requirement document text
and extract clear, structured software requirements from it.

Return the output as a numbered list of individual requirements, each written as a
single clear sentence describing one functional capability the software must have.
Do not include commentary, only the numbered list.

Document text:
{raw_text[:8000]}
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        requirements_text = response.choices[0].message.content
    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500
    
    return jsonify({
        "filename": file.filename,
        "requirements": requirements_text
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
