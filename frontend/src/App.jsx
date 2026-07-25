import { useEffect, useState } from "react";

const modules = [
  { id: "requirements", name: "Requirement Analyzer", desc: "Extract structured requirements from PDF/DOCX/TXT", active: true },
  { id: "testcases", name: "Test Case Generator", desc: "Functional, boundary & negative test cases", active: true },
  { id: "api", name: "API Test Generator", desc: "Generate Postman collections from requirements", active: true },
  { id: "selenium", name: "Selenium Script Generator", desc: "Auto-generate Selenium automation scripts", active: true },
  { id: "playwright", name: "Playwright Script Generator", desc: "Auto-generate Playwright automation scripts", active: true },
  { id: "testdata", name: "Test Data Generator", desc: "Realistic & edge-case test data", active: true },
  { id: "locators", name: "Self-Healing Locators", desc: "Detect and repair broken UI locators", active: true },
  { id: "report", name: "AI Report Generator", desc: "Summarized, AI-written test reports", active: false },
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

function App() {
  const [status, setStatus] = useState("connecting");
  const [log, setLog] = useState([]);
  const [activeModule, setActiveModule] = useState("requirements");

  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Self-healing locator state
  const [oldHtml, setOldHtml] = useState(SAMPLE_OLD_HTML);
  const [newHtml, setNewHtml] = useState(SAMPLE_NEW_HTML);
  const [locators, setLocators] = useState(SAMPLE_LOCATORS);
  const [healResult, setHealResult] = useState(null);

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

  const switchModule = (id) => {
    setActiveModule(id);
    setFile(null);
    setResult(null);
    setError(null);
    setHealResult(null);
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

    try {
      const res = await fetch(config.url, {
        method: "POST",
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

  const config = endpoints[activeModule];

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#E8EAF0] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#232838] px-6 py-8 hidden md:block">
        <h1 className="font-display font-bold text-lg tracking-tight">
          Test<span className="text-[#4CC9F0]">Intel</span>
        </h1>
        <p className="text-xs text-[#7C8699] mt-1 mb-8">AI Test Intelligence Platform</p>

        <nav className="space-y-1">
          {modules.map((m) => (
            <div
              key={m.id}
              onClick={() => m.active && switchModule(m.id)}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                m.active
                  ? activeModule === m.id
                    ? "bg-[#141821] text-[#E8EAF0] border border-[#4CC9F0]/40 cursor-pointer"
                    : "text-[#E8EAF0] hover:bg-[#141821] cursor-pointer border border-transparent"
                  : "text-[#7C8699] cursor-not-allowed"
              }`}
            >
              {m.name}
              {!m.active && (
                <span className="text-[10px] uppercase tracking-wide text-[#4CC9F0]/60 ml-2">soon</span>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 px-6 md:px-12 py-8">
        <div className="max-w-3xl">
          <p className="font-mono text-xs text-[#7C8699] mb-2">SYSTEM STATUS</p>

          <div className="bg-[#141821] border border-[#232838] rounded-xl p-4 mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "ok" ? "bg-[#34D399]" : status === "down" ? "bg-red-500" : "bg-[#4CC9F0] animate-pulse"
                }`}
              />
              <span className="font-mono text-xs text-[#7C8699]">
                backend {status === "ok" ? "connected" : status === "down" ? "unreachable" : "checking..."}
              </span>
            </div>
            <div className="font-mono text-xs space-y-1">
              {log.length === 0 && <p className="text-[#7C8699]">awaiting first check...</p>}
              {log.map((line, i) => (
                <p key={i} className={line.includes("200") ? "text-[#34D399]" : "text-red-400"}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {activeModule === "locators" ? (
            <>
              <h2 className="font-display text-2xl font-bold mb-1">Self-Healing Locators</h2>
              <p className="text-[#7C8699] text-sm mb-6">
                Paste the old HTML, the new HTML after a page change, and the locators your
                script uses. The AI detects which ones broke and suggests fixes.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="font-mono text-xs text-[#7C8699] mb-1 block">OLD HTML</label>
                  <textarea
                    value={oldHtml}
                    onChange={(e) => setOldHtml(e.target.value)}
                    rows={8}
                    className="w-full bg-[#101319] border border-[#232838] rounded-lg p-3 text-xs font-mono text-[#E8EAF0] focus:outline-none focus:border-[#4CC9F0]/40"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs text-[#7C8699] mb-1 block">NEW HTML</label>
                  <textarea
                    value={newHtml}
                    onChange={(e) => setNewHtml(e.target.value)}
                    rows={8}
                    className="w-full bg-[#101319] border border-[#232838] rounded-lg p-3 text-xs font-mono text-[#E8EAF0] focus:outline-none focus:border-[#4CC9F0]/40"
                  />
                </div>
              </div>

              <label className="font-mono text-xs text-[#7C8699] mb-1 block">
                LOCATORS TO CHECK (one per line)
              </label>
              <textarea
                value={locators}
                onChange={(e) => setLocators(e.target.value)}
                rows={4}
                className="w-full bg-[#101319] border border-[#232838] rounded-lg p-3 text-xs font-mono text-[#E8EAF0] mb-6 focus:outline-none focus:border-[#4CC9F0]/40"
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
                <div className="mt-6 border border-[#232838] bg-[#141821] rounded-xl p-6">
                  <p className="font-mono text-xs text-[#7C8699] mb-3">HEALING RESULT</p>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-[#E8EAF0] leading-relaxed max-h-96 overflow-y-auto">
                    {healResult}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold mb-1">{config.title}</h2>
              <p className="text-[#7C8699] text-sm mb-6">{config.desc}</p>

              <div className="border border-dashed border-[#232838] rounded-xl p-8 text-center bg-[#101319] mb-6">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="block mx-auto text-sm text-[#7C8699] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#4CC9F0]/10 file:text-[#4CC9F0] file:text-sm hover:file:bg-[#4CC9F0]/20 cursor-pointer"
                />
                {file && (
                  <p className="font-mono text-xs text-[#7C8699] mt-3">{file.name}</p>
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
                <div className="mt-6 border border-[#232838] bg-[#141821] rounded-xl p-6">
                  <p className="font-mono text-xs text-[#7C8699] mb-3">
                    OUTPUT FOR {result.filename.toUpperCase()}
                  </p>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-[#E8EAF0] leading-relaxed max-h-96 overflow-y-auto">
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

export default App;