import { useEffect, useState } from "react";

const modules = [
  { id: "requirements", name: "Requirement Analyzer", desc: "Extract structured requirements from PDF/DOCX/TXT", active: true },
  { id: "testcases", name: "Test Case Generator", desc: "Functional, boundary & negative test cases", active: true },
  { id: "api", name: "API Test Generator", desc: "Generate Postman collections from requirements", active: true },
  { id: "selenium", name: "Selenium Script Generator", desc: "Auto-generate Selenium automation scripts", active: true },
  { id: "playwright", name: "Playwright Script Generator", desc: "Auto-generate Playwright automation scripts", active: true },
  { id: "testdata", name: "Test Data Generator", desc: "Realistic & edge-case test data", active: true },
  { id: "locators", name: "Self-Healing Locators", desc: "Detect and repair broken UI locators", active: true },
  { id: "report", name: "AI Report Generator", desc: "Summarized, AI-written test reports", active: true },
  { id: "history", name: "Test History", desc: "View everything you've generated", active: true },
  { id: "profile", name: "User Profile", desc: "View your account details", active: true },
  { id: "activity", name: "Activity Logs", desc: "Recent actions on your account", active: true },
  { id: "search", name: "Search Test Cases", desc: "Search and filter your generated test cases", active: true },
];

const endpoints = {
  requirements: {
    url: "http://127.0.0.1:5000/api/analyze-requirements",
    resultKey: "requirements",
    title: "Requirement Analyzer",
    desc: "Upload a PDF, DOCX, or TXT requirement document to extract structured requirements.",
    buttonLabel: "Analyze Requirements",
    downloadable: false,
  },
  testcases: {
    url: "http://127.0.0.1:5000/api/generate-testcases",
    resultKey: "testcases",
    title: "Test Case Generator",
    desc: "Upload a requirement document to generate functional, positive, negative & boundary test cases.",
    buttonLabel: "Generate Test Cases",
    downloadable: false,
  },
  api: {
    url: "http://127.0.0.1:5000/api/generate-api-tests",
    resultKey: "postman_collection",
    title: "API Test Generator",
    desc: "Upload a requirement document to generate a downloadable Postman collection.",
    buttonLabel: "Generate Postman Collection",
    downloadable: true,
    downloadName: "postman_collection.json",
    downloadType: "application/json",
  },
  selenium: {
    url: "http://127.0.0.1:5000/api/generate-selenium",
    resultKey: "selenium_script",
    title: "Selenium Script Generator",
    desc: "Upload a requirement document to generate a Python Selenium automation test script.",
    buttonLabel: "Generate Selenium Script",
    downloadable: true,
    downloadName: "test_selenium.py",
    downloadType: "text/x-python",
  },
  playwright: {
    url: "http://127.0.0.1:5000/api/generate-playwright",
    resultKey: "playwright_script",
    title: "Playwright Script Generator",
    desc: "Upload a requirement document to generate a Python Playwright automation test script.",
    buttonLabel: "Generate Playwright Script",
    downloadable: true,
    downloadName: "test_playwright.py",
    downloadType: "text/x-python",
  },
  testdata: {
    url: "http://127.0.0.1:5000/api/generate-testdata",
    resultKey: "test_data",
    title: "Test Data Generator",
    desc: "Upload a requirement document to generate realistic, boundary & edge-case test data.",
    buttonLabel: "Generate Test Data",
    downloadable: true,
    downloadName: "test_data.json",
    downloadType: "application/json",
  },
};

const SAMPLE_OLD_HTML = `<form id="login-form">
  <input id="email" type="text" name="email" />
  <input id="password" type="password" name="password" />
  <button id="login-button">Log In</button>
</form>`;

const SAMPLE_NEW_HTML = `<form id="login-form">
  <input id="user-email" type="text" name="email" />
  <input id="user-password" type="password" name="password" />
  <button class="btn-primary" data-testid="submit-login">Log In</button>
</form>`;

const SAMPLE_LOCATORS = `#email
#password
#login-button`;

const SAMPLE_FAILURES = `test_invalid_login_credentials - AssertionError: expected error message not shown
test_account_lock_after_five_failed_logins - TimeoutError: #account-locked-message not found`;

function AuthPage({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full bg-[#101319] border border-[#232838] rounded-lg p-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#4CC9F0]/40";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url =
      mode === "login"
        ? "http://127.0.0.1:5000/api/login"
        : "http://127.0.0.1:5000/api/signup";

    const body =
      mode === "login" ? { email, password } : { username, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        onAuthed(data.username);
      }
    } catch (err) {
      setError("Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#E8EAF0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display font-bold text-2xl tracking-tight text-center mb-1">
          Test<span className="text-[#4CC9F0]">Intel</span>
        </h1>
        <p className="text-xs text-[#7C8699] text-center mb-8">AI Test Intelligence Platform</p>

        <div className="bg-[#141821] border border-[#232838] rounded-xl p-6">
          <div className="flex mb-6 border border-[#232838] rounded-lg overflow-hidden text-sm">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2 transition ${mode === "login" ? "bg-[#4CC9F0] text-[#0B0D12] font-medium" : "text-[#7C8699]"}`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 py-2 transition ${mode === "signup" ? "bg-[#4CC9F0] text-[#0B0D12] font-medium" : "text-[#7C8699]"}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="font-mono text-xs text-[#7C8699] mb-1 block">USERNAME</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            )}
            <div>
              <label className="font-mono text-xs text-[#7C8699] mb-1 block">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="font-mono text-xs text-[#7C8699] mb-1 block">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            {error && (
              <div className="border border-red-500/30 bg-red-500/10 text-red-400 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4CC9F0] text-[#0B0D12] font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4CC9F0]/90 transition mt-2"
            >
              {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ username, onLogout }) {
  const [status, setStatus] = useState("connecting");
  const [log, setLog] = useState([]);
  const [activeModule, setActiveModule] = useState("requirements");

  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [oldHtml, setOldHtml] = useState(SAMPLE_OLD_HTML);
  const [newHtml, setNewHtml] = useState(SAMPLE_NEW_HTML);
  const [locators, setLocators] = useState(SAMPLE_LOCATORS);
  const [healResult, setHealResult] = useState(null);

  const [projectName, setProjectName] = useState("AI Test Intelligence Platform");
  const [totalTests, setTotalTests] = useState("12");
  const [passed, setPassed] = useState("10");
  const [failed, setFailed] = useState("2");
  const [failures, setFailures] = useState(SAMPLE_FAILURES);
  const [reportResult, setReportResult] = useState(null);

  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [newProjectName, setNewProjectName] = useState("");

  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [activityLogs, setActivityLogs] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [theme, setTheme] = useState("dark");
  const isDark = theme === "dark";

  const t = {
    pageBg: isDark ? "bg-[#0B0D12]" : "bg-[#F4F6F8]",
    pageText: isDark ? "text-[#E8EAF0]" : "text-[#1A1D23]",
    sidebarBg: isDark ? "" : "bg-white",
    sidebarBorder: isDark ? "border-[#232838]" : "border-[#E2E5EA]",
    panelBg: isDark ? "bg-[#141821]" : "bg-white",
    panelBorder: isDark ? "border-[#232838]" : "border-[#E2E5EA]",
    inputBg: isDark ? "bg-[#101319]" : "bg-[#F7F8FA]",
    inputBorder: isDark ? "border-[#232838]" : "border-[#DDE1E7]",
    inputText: isDark ? "text-[#E8EAF0]" : "text-[#1A1D23]",
    mutedText: isDark ? "text-[#7C8699]" : "text-[#6B7280]",
    dashedBg: isDark ? "bg-[#101319]" : "bg-[#F7F8FA]",
    dashedBorder: isDark ? "border-[#232838]" : "border-[#DDE1E7]",
    navHover: isDark ? "hover:bg-[#141821]" : "hover:bg-[#F0F2F5]",
    navActive: isDark ? "bg-[#141821]" : "bg-[#EEF2F6]",
  };

  useEffect(() => {
    const check = () => {
      fetch("http://127.0.0.1:5000/health")
        .then((res) => res.json())
        .then((data) => {
          setStatus("ok");
          setLog((prev) => [...prev.slice(-3), `[${new Date().toLocaleTimeString()}] GET /health → 200 ${data.status}`]);
        })
        .catch(() => {
          setStatus("down");
          setLog((prev) => [...prev.slice(-3), `[${new Date().toLocaleTimeString()}] GET /health → failed`]);
        });
    };
    check();
    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/projects", {
        credentials: "include",
      });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      setProjects([]);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch("http://127.0.0.1:5000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newProjectName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewProjectName("");
        await loadProjects();
        setSelectedProject(String(data.id));
      }
    } catch (err) {
      // ignore
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/history", {
        credentials: "include",
      });
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/profile", {
        credentials: "include",
      });
      const data = await res.json();
      setProfileData(data);
    } catch (err) {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    setActivityLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/activity-logs", {
        credentials: "include",
      });
      const data = await res.json();
      setActivityLogs(data.logs || []);
    } catch (err) {
      setActivityLogs(null);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (searchCategory) params.append("category", searchCategory);

      const res = await fetch(`http://127.0.0.1:5000/api/search-testcases?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const switchModule = (id) => {
    setActiveModule(id);
    setFile(null);
    setResult(null);
    setError(null);
    setHealResult(null);
    setReportResult(null);
    if (id === "history") loadHistory();
    if (id === "profile") loadProfile();
    if (id === "activity") loadActivityLogs();
    if (id === "search") handleSearch();
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    const config = endpoints[activeModule];
    setAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (selectedProject) formData.append("project_id", selectedProject);

    try {
      const res = await fetch(config.url, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Could not reach the backend.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleHeal = async () => {
    setAnalyzing(true);
    setError(null);
    setHealResult(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/heal-locators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ old_html: oldHtml, new_html: newHtml, locators }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setHealResult(data.healing_result);
      }
    } catch (err) {
      setError("Could not reach the backend.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    setAnalyzing(true);
    setError(null);
    setReportResult(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          project_name: projectName,
          total_tests: totalTests,
          passed,
          failed,
          failures,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setReportResult(data.report);
      }
    } catch (err) {
      setError("Could not reach the backend.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const config = endpoints[activeModule];
    const blob = new Blob([result[config.resultKey]], { type: config.downloadType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = config.downloadName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    if (!reportResult) return;
    const blob = new Blob([reportResult], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test_report.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReportPdf = async () => {
    if (!reportResult) return;
    try {
      const res = await fetch("http://127.0.0.1:5000/api/download-report-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ report: reportResult }),
      });
      if (!res.ok) {
        setError("Could not generate PDF.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "test_report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Could not reach the backend.");
    }
  };

  const config = endpoints[activeModule];

  const inputClass = `w-full ${t.inputBg} border ${t.inputBorder} rounded-lg p-2.5 text-sm ${t.inputText} focus:outline-none focus:border-[#4CC9F0]/40`;
  const textareaClass = `w-full ${t.inputBg} border ${t.inputBorder} rounded-lg p-3 text-xs font-mono ${t.inputText} focus:outline-none focus:border-[#4CC9F0]/40`;

  return (
    <div className={`min-h-screen flex ${t.pageBg} ${t.pageText}`}>
      <aside className={`w-64 border-r px-6 py-8 hidden md:flex md:flex-col ${t.sidebarBorder} ${t.sidebarBg}`}>
        <h1 className="font-display font-bold text-lg tracking-tight">
          Test<span className="text-[#4CC9F0]">Intel</span>
        </h1>
        <p className={`text-xs ${t.mutedText} mt-1 mb-6`}>AI Test Intelligence Platform</p>

        <div className="mb-6">
          <label className={`font-mono text-[10px] ${t.mutedText} uppercase block mb-1`}>Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-lg p-2 text-xs ${t.inputText} mb-2`}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project..."
              className={`flex-1 ${t.inputBg} border ${t.inputBorder} rounded-lg p-2 text-xs ${t.inputText}`}
            />
            <button
              onClick={handleCreateProject}
              className="bg-[#4CC9F0]/10 text-[#4CC9F0] text-xs px-2 rounded-lg hover:bg-[#4CC9F0]/20"
            >
              +
            </button>
          </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
          {modules.map((m) => (
            <div
              key={m.id}
              onClick={() => m.active && switchModule(m.id)}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                m.active
                  ? activeModule === m.id
                    ? `${t.navActive} border border-[#4CC9F0]/40 cursor-pointer`
                    : `${t.navHover} cursor-pointer border border-transparent`
                  : `${t.mutedText} cursor-not-allowed`
              }`}
            >
              {m.name}
              {!m.active && (
                <span className="text-[10px] uppercase tracking-wide text-[#4CC9F0]/60 ml-2">soon</span>
              )}
            </div>
          ))}
        </nav>

        <div className={`border-t ${t.sidebarBorder} pt-4 mt-4`}>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`w-full text-xs ${t.mutedText} hover:opacity-80 transition mb-3 text-left`}
          >
            {isDark ? "☀ Switch to light mode" : "🌙 Switch to dark mode"}
          </button>
          <p className={`text-xs ${t.mutedText} mb-2`}>
            Signed in as <span className={t.pageText}>{username}</span>
          </p>
          <button
            onClick={onLogout}
            className="text-xs text-red-400 hover:text-red-300 transition"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-6 md:px-12 py-8">
        <div className="max-w-3xl">
          <p className={`font-mono text-xs ${t.mutedText} mb-2`}>SYSTEM STATUS</p>

          <div className={`${t.panelBg} border ${t.panelBorder} rounded-xl p-4 mb-10`}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "ok" ? "bg-[#34D399]" : status === "down" ? "bg-red-500" : "bg-[#4CC9F0] animate-pulse"
                }`}
              />
              <span className={`font-mono text-xs ${t.mutedText}`}>
                backend {status === "ok" ? "connected" : status === "down" ? "unreachable" : "checking..."}
              </span>
            </div>
            <div className="font-mono text-xs space-y-1">
              {log.length === 0 && <p className={t.mutedText}>awaiting first check...</p>}
              {log.map((line, i) => (
                <p key={i} className={line.includes("200") ? "text-[#34D399]" : "text-red-400"}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {activeModule === "locators" && (
            <>
              <h2 className="font-display text-2xl font-bold mb-1">Self-Healing Locators</h2>
              <p className={`${t.mutedText} text-sm mb-6`}>
                Paste the old HTML, the new HTML after a page change, and the locators your
                script uses. The AI detects which ones broke and suggests fixes.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`font-mono text-xs ${t.mutedText} mb-1 block`}>OLD HTML</label>
                  <textarea
                    value={oldHtml}
                    onChange={(e) => setOldHtml(e.target.value)}
                    rows={8}
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className={`font-mono text-xs ${t.mutedText} mb-1 block`}>NEW HTML</label>
                  <textarea
                    value={newHtml}
                    onChange={(e) => setNewHtml(e.target.value)}
                    rows={8}
                    className={textareaClass}
                  />
                </div>
              </div>

              <label className={`font-mono text-xs ${t.mutedText} mb-1 block`}>
                LOCATORS TO CHECK (one per line)
              </label>
              <textarea
                value={locators}
                onChange={(e) => setLocators(e.target.value)}
                rows={4}
                className={`${textareaClass} mb-6`}
              />

              <button
                onClick={handleHeal}
                disabled={analyzing}
                className="bg-[#4CC9F0] text-[#0B0D12] font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4CC9F0]/90 transition"
              >
                {analyzing ? "Checking..." : "Check & Heal Locators"}
              </button>

              {error && (
                <div className="mt-6 border border-red-500/30 bg-red-500/10 text-red-400 text-sm rounded-xl p-4">
                  {error}
                </div>
              )}

              {healResult && (
                <div className={`mt-6 border ${t.panelBorder} ${t.panelBg} rounded-xl p-6`}>
                  <p className={`font-mono text-xs ${t.mutedText} mb-3`}>HEALING RESULT</p>
                  <pre className={`whitespace-pre-wrap font-mono text-xs ${t.pageText} leading-relaxed max-h-96 overflow-y-auto`}>
                    {healResult}
                  </pre>
                </div>
              )}
            </>
          )}

          {activeModule === "report" && (
            <>
              <h2 className="font-display text-2xl font-bold mb-1">AI Report Generator</h2>
              <p className={`${t.mutedText} text-sm mb-6`}>
                Enter your test run results and get a clean, stakeholder-ready summary report.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`font-mono text-xs ${t.mutedText} mb-1 block`}>PROJECT NAME</label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`font-mono text-xs ${t.mutedText} mb-1 block`}>TOTAL TESTS</label>
                  <input
                    value={totalTests}
                    onChange={(e) => setTotalTests(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`font-mono text-xs ${t.mutedText} mb-1 block`}>PASSED</label>
                  <input
                    value={passed}
                    onChange={(e) => setPassed(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`font-mono text-xs ${t.mutedText} mb-1 block`}>FAILED</label>
                  <input
                    value={failed}
                    onChange={(e) => setFailed(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <label className={`font-mono text-xs ${t.mutedText} mb-1 block`}>
                FAILURE DETAILS (one per line)
              </label>
              <textarea
                value={failures}
                onChange={(e) => setFailures(e.target.value)}
                rows={4}
                className={`${textareaClass} mb-6`}
              />

              <div className="flex gap-3">
                <button
                  onClick={handleGenerateReport}
                  disabled={analyzing}
                  className="bg-[#4CC9F0] text-[#0B0D12] font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4CC9F0]/90 transition"
                >
                  {analyzing ? "Generating..." : "Generate Report"}
                </button>

                {reportResult && (
                  <>
                    <button
                      onClick={handleDownloadReport}
                      className="border border-[#34D399]/40 text-[#34D399] font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#34D399]/10 transition"
                    >
                      Download .md
                    </button>
                    <button
                      onClick={handleDownloadReportPdf}
                      className="border border-[#4CC9F0]/40 text-[#4CC9F0] font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#4CC9F0]/10 transition"
                    >
                      Download PDF
                    </button>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-6 border border-red-500/30 bg-red-500/10 text-red-400 text-sm rounded-xl p-4">
                  {error}
                </div>
              )}

              {reportResult && (
                <div className={`mt-6 border ${t.panelBorder} ${t.panelBg} rounded-xl p-6`}>
                  <p className={`font-mono text-xs ${t.mutedText} mb-3`}>GENERATED REPORT</p>
                  <pre className={`whitespace-pre-wrap font-mono text-xs ${t.pageText} leading-relaxed max-h-96 overflow-y-auto`}>
                    {reportResult}
                  </pre>
                </div>
              )}
            </>
          )}

          {activeModule === "history" && (
            <>
              <h2 className="font-display text-2xl font-bold mb-1">Test History</h2>
              <p className={`${t.mutedText} text-sm mb-6`}>
                Everything you've generated, saved to your account.
              </p>

              {historyLoading && <p className={`${t.mutedText} font-mono text-sm`}>Loading...</p>}

              {historyData && Object.entries(historyData).map(([table, rows]) => (
                <div key={table} className="mb-6">
                  <p className="font-mono text-xs text-[#4CC9F0] uppercase mb-2">
                    {table.replace(/_/g, " ")} ({rows.length})
                  </p>
                  {rows.length === 0 ? (
                    <p className={`text-xs ${t.mutedText} mb-2`}>Nothing here yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {rows.map((row) => (
                        <div key={row.id} className={`border ${t.panelBorder} ${t.panelBg} rounded-lg p-3`}>
                          <p className="text-sm">{row.filename || row.project_name}</p>
                          <p className={`text-[10px] ${t.mutedText} font-mono`}>{row.created_at}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {activeModule === "profile" && (
            <>
              <h2 className="font-display text-2xl font-bold mb-1">User Profile</h2>
              <p className={`${t.mutedText} text-sm mb-6`}>Your account details.</p>

              {profileLoading && <p className={`${t.mutedText} font-mono text-sm`}>Loading...</p>}

              {profileData && (
                <div className={`border ${t.panelBorder} ${t.panelBg} rounded-xl p-6 max-w-md`}>
                  <div className="mb-4">
                    <p className={`font-mono text-[10px] ${t.mutedText} uppercase mb-1`}>Username</p>
                    <p className="text-sm">{profileData.username}</p>
                  </div>
                  <div className="mb-4">
                    <p className={`font-mono text-[10px] ${t.mutedText} uppercase mb-1`}>Email</p>
                    <p className="text-sm">{profileData.email}</p>
                  </div>
                  <div>
                    <p className={`font-mono text-[10px] ${t.mutedText} uppercase mb-1`}>Member Since</p>
                    <p className="text-sm">{profileData.created_at}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeModule === "activity" && (
            <>
              <h2 className="font-display text-2xl font-bold mb-1">Activity Logs</h2>
              <p className={`${t.mutedText} text-sm mb-6`}>Your last 50 actions on this account.</p>

              {activityLoading && <p className={`${t.mutedText} font-mono text-sm`}>Loading...</p>}

              {activityLogs && activityLogs.length === 0 && (
                <p className={`text-sm ${t.mutedText}`}>No activity yet.</p>
              )}

              {activityLogs && activityLogs.length > 0 && (
                <div className="space-y-2">
                  {activityLogs.map((log) => (
                    <div key={log.id} className={`border ${t.panelBorder} ${t.panelBg} rounded-lg p-3 flex justify-between items-center`}>
                      <div>
                        <p className="text-sm font-medium">{log.action.replace(/_/g, " ")}</p>
                        {log.details && (
                          <p className={`text-xs ${t.mutedText} mt-0.5`}>{log.details}</p>
                        )}
                      </div>
                      <p className={`text-[10px] font-mono ${t.mutedText} whitespace-nowrap ml-4`}>{log.created_at}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeModule === "search" && (
            <>
              <h2 className="font-display text-2xl font-bold mb-1">Search Test Cases</h2>
              <p className={`${t.mutedText} text-sm mb-6`}>
                Search across all your generated test cases by keyword or category.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`font-mono text-xs ${t.mutedText} mb-1 block`}>KEYWORD</label>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. login, password reset..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`font-mono text-xs ${t.mutedText} mb-1 block`}>CATEGORY</label>
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">All categories</option>
                    <option value="functional">Functional</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="boundary">Boundary</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="bg-[#4CC9F0] text-[#0B0D12] font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4CC9F0]/90 transition mb-6"
              >
                {searchLoading ? "Searching..." : "Search"}
              </button>

              {searchResults && searchResults.length === 0 && (
                <p className={`text-sm ${t.mutedText}`}>No matching test cases found.</p>
              )}

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((row) => (
                    <div key={row.id} className={`border ${t.panelBorder} ${t.panelBg} rounded-xl p-4`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">{row.filename}</p>
                        <p className={`text-[10px] font-mono ${t.mutedText}`}>{row.created_at}</p>
                      </div>
                      <pre className={`whitespace-pre-wrap font-mono text-xs ${t.pageText} leading-relaxed max-h-48 overflow-y-auto`}>
                        {row.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeModule !== "locators" &&
            activeModule !== "report" &&
            activeModule !== "history" &&
            activeModule !== "profile" &&
            activeModule !== "activity" &&
            activeModule !== "search" && (
            <>
              <h2 className="font-display text-2xl font-bold mb-1">{config.title}</h2>
              <p className={`${t.mutedText} text-sm mb-6`}>{config.desc}</p>

              <div className={`border border-dashed ${t.dashedBorder} rounded-xl p-8 text-center ${t.dashedBg} mb-6`}>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className={`block mx-auto text-sm ${t.mutedText} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#4CC9F0]/10 file:text-[#4CC9F0] file:text-sm hover:file:bg-[#4CC9F0]/20 cursor-pointer`}
                />
                {file && (
                  <p className={`font-mono text-xs ${t.mutedText} mt-3`}>{file.name}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!file || analyzing}
                  className="bg-[#4CC9F0] text-[#0B0D12] font-medium text-sm px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4CC9F0]/90 transition"
                >
                  {analyzing ? "Working..." : config.buttonLabel}
                </button>

                {config.downloadable && result && (
                  <button
                    onClick={handleDownload}
                    className="border border-[#34D399]/40 text-[#34D399] font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#34D399]/10 transition"
                  >
                    Download {config.downloadName}
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-6 border border-red-500/30 bg-red-500/10 text-red-400 text-sm rounded-xl p-4">
                  {error}
                </div>
              )}

              {result && (
                <div className={`mt-6 border ${t.panelBorder} ${t.panelBg} rounded-xl p-6`}>
                  <p className={`font-mono text-xs ${t.mutedText} mb-3`}>
                    OUTPUT FOR {result.filename.toUpperCase()}
                  </p>
                  <pre className={`whitespace-pre-wrap font-mono text-xs ${t.pageText} leading-relaxed max-h-96 overflow-y-auto`}>
                    {result[config.resultKey]}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.logged_in) setUsername(data.username);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await fetch("http://127.0.0.1:5000/api/logout", {
      method: "POST",
      credentials: "include",
    });
    setUsername(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0B0D12] flex items-center justify-center">
        <p className="text-[#7C8699] font-mono text-sm">Loading...</p>
      </div>
    );
  }

  if (!username) {
    return <AuthPage onAuthed={(name) => setUsername(name)} />;
  }

  return <Dashboard username={username} onLogout={handleLogout} />;
}

export default App;