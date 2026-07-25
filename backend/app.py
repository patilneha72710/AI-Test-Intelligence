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


def extract_text(file, filepath):
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        return extract_text_from_pdf(filepath)
    elif ext == "docx":
        return extract_text_from_docx(filepath)
    elif ext == "txt":
        return extract_text_from_txt(filepath)
    else:
        return None


@app.route("/api/analyze-requirements", methods=["POST"])
def analyze_requirements():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        raw_text = extract_text(file, filepath)
        if raw_text is None:
            return jsonify({"error": "Unsupported file type. Use PDF, DOCX, or TXT."}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500

    if not raw_text.strip():
        return jsonify({"error": "No readable text found in the file."}), 400

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


@app.route("/api/generate-testcases", methods=["POST"])
def generate_testcases():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        raw_text = extract_text(file, filepath)
        if raw_text is None:
            return jsonify({"error": "Unsupported file type. Use PDF, DOCX, or TXT."}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500

    if not raw_text.strip():
        return jsonify({"error": "No readable text found in the file."}), 400

    prompt = f"""
You are a senior QA engineer. Read the following software requirement text and generate
a complete set of test cases covering these four categories:

1. Functional Test Cases
2. Positive Test Cases
3. Negative Test Cases
4. Boundary Test Cases

For each test case, include:
- Test Case ID (e.g. TC_001)
- Title
- Category (Functional / Positive / Negative / Boundary)
- Steps
- Expected Result

Format the output clearly with headers for each category. Do not include commentary,
only the structured test cases.

Requirement text:
{raw_text[:8000]}
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        testcases_text = response.choices[0].message.content
    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    return jsonify({
        "filename": file.filename,
        "testcases": testcases_text
    })


@app.route("/api/generate-api-tests", methods=["POST"])
def generate_api_tests():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        raw_text = extract_text(file, filepath)
        if raw_text is None:
            return jsonify({"error": "Unsupported file type. Use PDF, DOCX, or TXT."}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500

    if not raw_text.strip():
        return jsonify({"error": "No readable text found in the file."}), 400

    prompt = f"""
You are a senior QA automation engineer. Read the following software requirement text
and generate a Postman collection in valid Postman Collection v2.1 JSON format.

Rules:
- Infer reasonable REST API endpoints based on the requirements (e.g. login, password reset, user list).
- Use a base URL variable: {{{{base_url}}}}
- Include realistic HTTP methods (GET, POST, PUT, DELETE) matching each requirement's action.
- Include a JSON request body where relevant (e.g. login with email/password).
- Include at least one test script per request checking status code 200 or 201 using pm.test(...).
- Return ONLY valid JSON, no markdown code fences, no commentary, no explanation text.

Requirement text:
{raw_text[:8000]}
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        collection_text = response.choices[0].message.content.strip()

        # Clean up in case the model wraps it in markdown fences anyway
        if collection_text.startswith("```"):
            collection_text = collection_text.split("```")[1]
            if collection_text.startswith("json"):
                collection_text = collection_text[4:]
            collection_text = collection_text.strip()

    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    return jsonify({
        "filename": file.filename,
        "postman_collection": collection_text
    })


@app.route("/api/generate-selenium", methods=["POST"])
def generate_selenium():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        raw_text = extract_text(file, filepath)
        if raw_text is None:
            return jsonify({"error": "Unsupported file type. Use PDF, DOCX, or TXT."}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500

    if not raw_text.strip():
        return jsonify({"error": "No readable text found in the file."}), 400

    prompt = f"""
You are a senior QA automation engineer. Read the following software requirement text
and generate a complete Python Selenium test automation script.

Rules:
- Use Python with the selenium package (webdriver, By, expected_conditions, WebDriverWait).
- Structure it as a proper test file using Python's unittest framework.
- Use placeholder CSS selectors like (By.ID, "email") and (By.ID, "password") — reasonable guesses based on the requirement text.
- Include setUp (open browser, navigate to a placeholder URL like "https://example.com/login") and tearDown (quit browser) methods.
- Write one test method per requirement, with clear method names like test_successful_login.
- Include assertions that check expected outcomes (e.g. checking page title, URL, or element text after an action).
- Add short comments explaining each major step.
- Return ONLY the Python code, no markdown code fences, no commentary outside the code.

Requirement text:
{raw_text[:8000]}
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        script_text = response.choices[0].message.content.strip()

        # Clean up in case the model wraps it in markdown fences anyway
        if script_text.startswith("```"):
            script_text = script_text.split("```")[1]
            if script_text.startswith("python"):
                script_text = script_text[6:]
            script_text = script_text.strip()

    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    return jsonify({
        "filename": file.filename,
        "selenium_script": script_text
    })


@app.route("/api/generate-playwright", methods=["POST"])
def generate_playwright():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        raw_text = extract_text(file, filepath)
        if raw_text is None:
            return jsonify({"error": "Unsupported file type. Use PDF, DOCX, or TXT."}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500

    if not raw_text.strip():
        return jsonify({"error": "No readable text found in the file."}), 400

    prompt = f"""
You are a senior QA automation engineer. Read the following software requirement text
and generate a complete Python Playwright test automation script.

Rules:
- Use Python with the playwright.sync_api package (sync_playwright, Page, expect).
- Structure it using Pytest-style test functions (def test_xxx(page): ...).
- Use placeholder CSS selectors like page.locator("#email") and page.locator("#password") — reasonable guesses based on the requirement text.
- Navigate to a placeholder URL like "https://example.com/login" at the start of each test.
- Write one test function per requirement, with clear function names like test_successful_login.
- Use Playwright's expect() assertions to check expected outcomes (e.g. URL, visible text, element state) after each action.
- Add short comments explaining each major step.
- Return ONLY the Python code, no markdown code fences, no commentary outside the code.

Requirement text:
{raw_text[:8000]}
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        script_text = response.choices[0].message.content.strip()

        # Clean up in case the model wraps it in markdown fences anyway
        if script_text.startswith("```"):
            script_text = script_text.split("```")[1]
            if script_text.startswith("python"):
                script_text = script_text[6:]
            script_text = script_text.strip()

    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    return jsonify({
        "filename": file.filename,
        "playwright_script": script_text
    })


@app.route("/api/generate-testdata", methods=["POST"])
def generate_testdata():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        raw_text = extract_text(file, filepath)
        if raw_text is None:
            return jsonify({"error": "Unsupported file type. Use PDF, DOCX, or TXT."}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500

    if not raw_text.strip():
        return jsonify({"error": "No readable text found in the file."}), 400

    prompt = f"""
You are a senior QA engineer. Read the following software requirement text and generate
realistic test data for testing it.

Return the output as a JSON array of objects. Each object should represent one test data
record and include these fields:
- "category": one of "valid", "invalid", "boundary", "edge_case"
- "field": the input field this data is for (e.g. "email", "password")
- "value": the actual test data value
- "reason": a short explanation of why this value is useful to test

Generate at least 3 records per relevant field, covering valid, invalid, boundary, and
edge case values (e.g. empty strings, very long strings, special characters, min/max lengths).

Return ONLY valid JSON (an array), no markdown code fences, no commentary.

Requirement text:
{raw_text[:8000]}
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        testdata_text = response.choices[0].message.content.strip()

        # Clean up in case the model wraps it in markdown fences anyway
        if testdata_text.startswith("```"):
            testdata_text = testdata_text.split("```")[1]
            if testdata_text.startswith("json"):
                testdata_text = testdata_text[4:]
            testdata_text = testdata_text.strip()

    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    return jsonify({
        "filename": file.filename,
        "test_data": testdata_text
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)