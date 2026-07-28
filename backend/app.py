import os
from functools import wraps
from flask import Flask, jsonify, request, session, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
from PyPDF2 import PdfReader
import docx
from werkzeug.security import generate_password_hash, check_password_hash
from database import init_db, get_connection, log_activity
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import io
import re

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-this")
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

init_db()

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


@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request must be JSON."}), 400

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not username or not email or not password:
        return jsonify({"error": "username, email, and password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    password_hash = generate_password_hash(password)

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, password_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
    except Exception:
        conn.close()
        return jsonify({"error": "Username or email already exists."}), 409

    conn.close()

    session["user_id"] = user_id
    session["username"] = username

    return jsonify({"message": "Signup successful", "username": username}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request must be JSON."}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "email and password are required."}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    session["user_id"] = user["id"]
    session["username"] = user["username"]

    return jsonify({"message": "Login successful", "username": user["username"]})


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@app.route("/api/me")
def me():
    if "user_id" not in session:
        return jsonify({"logged_in": False}), 200
    return jsonify({"logged_in": True, "username": session["username"]})


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Please log in to use this feature."}), 401
        return f(*args, **kwargs)
    return decorated


@app.route("/api/profile")
@login_required
def get_profile():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, email, created_at FROM users WHERE id = ?", (session["user_id"],))
    user = cursor.fetchone()
    conn.close()
    return jsonify(dict(user))


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


def save_history(table, filename, content):
    project_id = request.form.get("project_id") or None
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"INSERT INTO {table} (user_id, filename, content, project_id) VALUES (?, ?, ?, ?)",
        (session["user_id"], filename, content, project_id)
    )
    conn.commit()
    conn.close()


@app.route("/api/analyze-requirements", methods=["POST"])
@login_required
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

    save_history("uploaded_requirements", file.filename, requirements_text)
    log_activity(session["user_id"], "analyze_requirements", file.filename)

    return jsonify({
        "filename": file.filename,
        "requirements": requirements_text
    })


@app.route("/api/generate-testcases", methods=["POST"])
@login_required
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

    save_history("generated_testcases", file.filename, testcases_text)
    log_activity(session["user_id"], "generate_testcases", file.filename)

    return jsonify({
        "filename": file.filename,
        "testcases": testcases_text
    })


@app.route("/api/generate-api-tests", methods=["POST"])
@login_required
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

        if collection_text.startswith("```"):
            collection_text = collection_text.split("```")[1]
            if collection_text.startswith("json"):
                collection_text = collection_text[4:]
            collection_text = collection_text.strip()

    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    log_activity(session["user_id"], "generate_api_tests", file.filename)

    return jsonify({
        "filename": file.filename,
        "postman_collection": collection_text
    })


@app.route("/api/generate-selenium", methods=["POST"])
@login_required
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

        if script_text.startswith("```"):
            script_text = script_text.split("```")[1]
            if script_text.startswith("python"):
                script_text = script_text[6:]
            script_text = script_text.strip()

    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    save_history("selenium_scripts", file.filename, script_text)
    log_activity(session["user_id"], "generate_selenium", file.filename)

    return jsonify({
        "filename": file.filename,
        "selenium_script": script_text
    })


@app.route("/api/generate-playwright", methods=["POST"])
@login_required
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

        if script_text.startswith("```"):
            script_text = script_text.split("```")[1]
            if script_text.startswith("python"):
                script_text = script_text[6:]
            script_text = script_text.strip()

    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    save_history("playwright_scripts", file.filename, script_text)
    log_activity(session["user_id"], "generate_playwright", file.filename)

    return jsonify({
        "filename": file.filename,
        "playwright_script": script_text
    })


@app.route("/api/generate-testdata", methods=["POST"])
@login_required
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

        if testdata_text.startswith("```"):
            testdata_text = testdata_text.split("```")[1]
            if testdata_text.startswith("json"):
                testdata_text = testdata_text[4:]
            testdata_text = testdata_text.strip()

    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    save_history("test_data", file.filename, testdata_text)
    log_activity(session["user_id"], "generate_testdata", file.filename)

    return jsonify({
        "filename": file.filename,
        "test_data": testdata_text
    })


@app.route("/api/heal-locators", methods=["POST"])
@login_required
def heal_locators():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request must be JSON with 'old_html', 'new_html', and 'locators'."}), 400

    old_html = data.get("old_html", "").strip()
    new_html = data.get("new_html", "").strip()
    locators = data.get("locators", "").strip()

    if not old_html or not new_html or not locators:
        return jsonify({"error": "old_html, new_html, and locators are all required."}), 400

    prompt = f"""
You are a self-healing test automation engine. You are given:
1. The OLD HTML a test script was originally written against.
2. The NEW HTML after the page changed.
3. A list of LOCATORS the test script currently uses (CSS selectors or IDs).

Your job: for each locator, determine if it still exists/works in the NEW HTML.
If it's broken, find the most likely replacement element in the NEW HTML and suggest
a new locator for it, explaining what changed.

Return the output as a JSON array of objects, one per locator, each with:
- "old_locator": the original locator
- "status": "unchanged" or "broken"
- "suggested_locator": the new locator to use (same as old_locator if unchanged)
- "explanation": short explanation of what changed and why the new locator was chosen

Return ONLY valid JSON (an array), no markdown code fences, no commentary.

OLD HTML:
{old_html[:4000]}

NEW HTML:
{new_html[:4000]}

LOCATORS TO CHECK:
{locators}
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        healing_text = response.choices[0].message.content.strip()

        if healing_text.startswith("```"):
            healing_text = healing_text.split("```")[1]
            if healing_text.startswith("json"):
                healing_text = healing_text[4:]
            healing_text = healing_text.strip()

    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    log_activity(session["user_id"], "heal_locators", "locator check")

    return jsonify({
        "healing_result": healing_text
    })


@app.route("/api/generate-report", methods=["POST"])
@login_required
def generate_report():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request must be JSON with test run details."}), 400

    project_name = data.get("project_name", "").strip()
    total_tests = data.get("total_tests", "").strip()
    passed = data.get("passed", "").strip()
    failed = data.get("failed", "").strip()
    failures = data.get("failures", "").strip()

    if not project_name or not total_tests:
        return jsonify({"error": "project_name and total_tests are required."}), 400

    prompt = f"""
You are a senior QA lead writing a test execution summary report for stakeholders.

Test run details:
- Project: {project_name}
- Total tests run: {total_tests}
- Passed: {passed}
- Failed: {failed}
- Failure details:
{failures if failures else "None"}

Write a clear, professional test execution report in Markdown format including:
1. A short executive summary (2-3 sentences, pass rate and overall health)
2. A results table (Total / Passed / Failed / Pass Rate %)
3. A "Key Issues" section listing each failure with a one-line likely cause and suggested next step
4. A brief "Recommendation" section (e.g. ready to release, needs fixes before release, etc.)

Return ONLY the Markdown report, no commentary outside it.
"""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        report_text = response.choices[0].message.content.strip()

        if report_text.startswith("```"):
            report_text = report_text.split("```")[1]
            if report_text.startswith("markdown"):
                report_text = report_text[8:]
            report_text = report_text.strip()

    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO reports (user_id, project_name, content) VALUES (?, ?, ?)",
        (session["user_id"], project_name, report_text)
    )
    conn.commit()
    conn.close()
    log_activity(session["user_id"], "generate_report", project_name)

    return jsonify({
        "report": report_text
    })


@app.route("/api/download-report-pdf", methods=["POST"])
@login_required
def download_report_pdf():
    data = request.get_json(silent=True)
    if not data or "report" not in data:
        return jsonify({"error": "report content is required."}), 400

    report_md = data["report"]

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    story = []

    for line in report_md.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 8))
            continue

        if line.startswith("# "):
            story.append(Paragraph(line[2:], styles["Title"]))
        elif line.startswith("## "):
            story.append(Paragraph(line[3:], styles["Heading2"]))
        elif line.startswith("|"):
            continue
        else:
            clean = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", line)
            story.append(Paragraph(clean, styles["Normal"]))
            story.append(Spacer(1, 4))

    doc.build(story)
    buffer.seek(0)

    log_activity(session["user_id"], "download_report_pdf", "test_report.pdf")

    return send_file(
        buffer,
        as_attachment=True,
        download_name="test_report.pdf",
        mimetype="application/pdf"
    )


@app.route("/api/history")
@login_required
def get_history():
    conn = get_connection()
    cursor = conn.cursor()
    user_id = session["user_id"]

    history = {}
    for table in ["uploaded_requirements", "generated_testcases", "selenium_scripts",
                  "playwright_scripts", "test_data", "reports"]:
        cursor.execute(
            f"SELECT * FROM {table} WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
        )
        history[table] = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return jsonify(history)


@app.route("/api/projects", methods=["GET"])
@login_required
def list_projects():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC",
        (session["user_id"],)
    )
    projects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({"projects": projects})


@app.route("/api/projects", methods=["POST"])
@login_required
def create_project():
    data = request.get_json(silent=True)
    if not data or not data.get("name", "").strip():
        return jsonify({"error": "Project name is required."}), 400

    name = data["name"].strip()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO projects (user_id, name) VALUES (?, ?)",
        (session["user_id"], name)
    )
    conn.commit()
    project_id = cursor.lastrowid
    conn.close()

    log_activity(session["user_id"], "create_project", name)

    return jsonify({"id": project_id, "name": name}), 201


if __name__ == "__main__":
    app.run(debug=True, port=5000)