
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import "./App.css";

// Use the deployed backend URL from Vercel.
// Fall back to localhost when running the project locally.
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const suggestedQuestions = [
  "Tell me about Shashank's technical skills.",
  "Explain Shashank's three projects.",
  "What experience and certifications does Shashank have?",
  "Why should we hire Shashank?",
];

function App() {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Admin state
  const [view, setView] = useState("chat");
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");

  // Resume state
  const [resumeInfo, setResumeInfo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  // --------------------------------------------------
  // CHAT FUNCTIONALITY
  // --------------------------------------------------

  async function sendMessage(text) {
    const content = text.trim();

    if (!content || loading) return;

    const userMessage = {
      role: "user",
      content,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages([
      ...updatedMessages,
      { role: "assistant", content: "" },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response stream is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, {
          stream: true,
        });

        if (chunk) {
          setMessages((previous) =>
            previous.map((message, index) =>
              index === previous.length - 1
                ? {
                    ...message,
                    content: message.content + chunk,
                  }
                : message
            )
          );
        }
      }

      const remaining = decoder.decode();

      if (remaining) {
        setMessages((previous) =>
          previous.map((message, index) =>
            index === previous.length - 1
              ? {
                  ...message,
                  content: message.content + remaining,
                }
              : message
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((previous) =>
        previous.map((message, index) =>
          index === previous.length - 1
            ? {
                ...message,
                content:
                  "Something went wrong. Please check whether the backend is running and try again.",
              }
            : message
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  const markdownComponents = {
    table: ({ node, ...props }) => (
      <div className="table-wrapper">
        <table {...props} />
      </div>
    ),
  };

  // --------------------------------------------------
  // ADMIN AUTHENTICATION
  // --------------------------------------------------

  async function handleAdminLogin(event) {
    event.preventDefault();

    const key = adminKeyInput.trim();

    if (!key) {
      setAdminError("Enter your admin key.");
      return;
    }

    setAdminLoading(true);
    setAdminError("");
    setAdminSuccess("");

    try {
      const response = await fetch(`${API_URL}/admin/verify`, {
        method: "POST",
        headers: {
          "X-Admin-Key": key,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Authentication failed.");
      }

      setAdminKey(key);
      setAdminKeyInput("");
      setView("admin");

      await fetchResumeInfo(key);
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setAdminLoading(false);
    }
  }

  // --------------------------------------------------
  // FETCH CURRENT RESUME INFORMATION
  // --------------------------------------------------

  async function fetchResumeInfo(key = adminKey) {
    if (!key) return;

    setAdminError("");

    try {
      const response = await fetch(`${API_URL}/admin/resume-info`, {
        method: "GET",
        headers: {
          "X-Admin-Key": key,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Could not fetch resume information.");
      }

      setResumeInfo(result);
    } catch (error) {
      setAdminError(error.message);
    }
  }

  // --------------------------------------------------
  // RESUME FILE SELECTION
  // --------------------------------------------------

  function handleFileSelection(event) {
    const file = event.target.files?.[0];

    setAdminError("");
    setAdminSuccess("");
    setSelectedFile(null);

    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["pdf", "docx"].includes(extension)) {
      setAdminError("Only PDF and DOCX files are supported.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAdminError("File size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  // --------------------------------------------------
  // UPLOAD NEW RESUME
  // --------------------------------------------------

  async function handleResumeUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setAdminError("Please select a resume first.");
      return;
    }

    if (!adminKey) {
      setAdminError("Please log in again.");
      return;
    }

    setUploading(true);
    setAdminError("");
    setAdminSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/admin/upload-resume`, {
        method: "POST",
        headers: {
          "X-Admin-Key": adminKey,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Resume upload failed.");
      }

      setAdminSuccess(
        `Resume "${result.filename}" uploaded successfully. ${result.characters_extracted} characters extracted.`
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchResumeInfo(adminKey);
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setUploading(false);
    }
  }

  // --------------------------------------------------
  // ADMIN LOGOUT
  // --------------------------------------------------

  function handleAdminLogout() {
    setAdminKey("");
    setAdminKeyInput("");
    setResumeInfo(null);
    setSelectedFile(null);
    setAdminError("");
    setAdminSuccess("");
    setView("chat");
  }

  // --------------------------------------------------
  // ADMIN LOGIN SCREEN
  // --------------------------------------------------

  function renderAdminLogin() {
    return (
      <section className="admin-page">
        <div className="admin-card">
          <div className="admin-icon">🔐</div>

          <h2>Admin Login</h2>

          <p className="admin-description">
            Sign in to manage Shashank's resume and chatbot knowledge.
          </p>

          <form onSubmit={handleAdminLogin}>
            <label htmlFor="admin-key">Admin Secret Key</label>

            <input
              id="admin-key"
              type="password"
              value={adminKeyInput}
              onChange={(event) => setAdminKeyInput(event.target.value)}
              placeholder="Enter your admin key"
              autoComplete="current-password"
              required
            />

            {adminError && (
              <p className="admin-error">{adminError}</p>
            )}

            <button
              type="submit"
              className="admin-primary-button"
              disabled={adminLoading}
            >
              {adminLoading ? "Verifying..." : "Login"}
            </button>
          </form>

          <button
            type="button"
            className="admin-back-button"
            onClick={() => {
              setView("chat");
              setAdminError("");
            }}
          >
            ← Back to Portfolio
          </button>
        </div>
      </section>
    );
  }

  // --------------------------------------------------
  // ADMIN DASHBOARD
  // --------------------------------------------------

  function renderAdminDashboard() {
    return (
      <section className="admin-page">
        <div className="admin-dashboard">

          <div className="admin-dashboard-header">
            <div>
              <p className="admin-eyebrow">PORTFOLIO MANAGEMENT</p>
              <h2>Admin Dashboard</h2>
              <p className="admin-description">
                Manage the resume used by your AI portfolio assistant.
              </p>
            </div>

            <button
              type="button"
              className="admin-logout-button"
              onClick={handleAdminLogout}
            >
              Logout
            </button>
          </div>

          <div className="resume-status-card">
            <h3>Current Knowledge Source</h3>

            {resumeInfo ? (
              <>
                <div className="resume-status-row">
                  <span>Status</span>
                  <strong>
                    {resumeInfo.resume_uploaded
                      ? "Uploaded Resume"
                      : "Using profile.json"}
                  </strong>
                </div>

                <div className="resume-status-row">
                  <span>Filename</span>
                  <strong>
                    {resumeInfo.filename || "No uploaded resume"}
                  </strong>
                </div>

                <div className="resume-status-row">
                  <span>Characters extracted</span>
                  <strong>
                    {resumeInfo.characters_extracted ?? "—"}
                  </strong>
                </div>

                <div className="resume-status-row">
                  <span>Last uploaded</span>
                  <strong>
                    {resumeInfo.uploaded_at
                      ? new Date(resumeInfo.uploaded_at).toLocaleString()
                      : "—"}
                  </strong>
                </div>
              </>
            ) : (
              <p>Loading resume information...</p>
            )}

            <button
              type="button"
              className="admin-refresh-button"
              onClick={() => fetchResumeInfo()}
            >
              Refresh Information
            </button>
          </div>

          <div className="resume-upload-card">
            <h3>Upload or Replace Resume</h3>

            <p className="admin-description">
              Upload your latest resume. The chatbot will use the extracted
              information immediately after a successful upload.
            </p>

            <form onSubmit={handleResumeUpload}>
              <label htmlFor="resume-file">
                Select Resume (PDF or DOCX)
              </label>

              <input
                ref={fileInputRef}
                id="resume-file"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelection}
              />

              {selectedFile && (
                <div className="selected-file">
                  <span>Selected file</span>
                  <strong>{selectedFile.name}</strong>
                  <span>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}

              <p className="upload-hint">
                Maximum file size: 5 MB. Supported formats: PDF and DOCX.
              </p>

              {adminError && (
                <p className="admin-error">{adminError}</p>
              )}

              {adminSuccess && (
                <p className="admin-success">{adminSuccess}</p>
              )}

              <button
                type="submit"
                className="admin-primary-button"
                disabled={uploading || !selectedFile}
              >
                {uploading ? "Uploading and Processing..." : "Upload Resume"}
              </button>
            </form>
          </div>

          <div className="admin-note">
            <strong>Important:</strong> Uploading a new resume replaces
            the previous resume used by the chatbot. Keep a backup of
            your original file.
          </div>

          <button
            type="button"
            className="admin-back-button"
            onClick={() => setView("chat")}
          >
            ← Return to Chatbot
          </button>
        </div>
      </section>
    );
  }

  // --------------------------------------------------
  // MAIN APPLICATION
  // --------------------------------------------------

  return (
    <main className="app">

      <header className="header">
        <div className="profile-icon">SS</div>

        <div>
          <h1>Shashank Shukla</h1>
          <p>AI-Powered Portfolio Assistant</p>
        </div>

        <div className="header-actions">
          {view !== "admin" && (
            <button
              type="button"
              className="admin-nav-button"
              onClick={() => {
                setAdminError("");
                setAdminSuccess("");
                setView("login");
              }}
            >
              Admin
            </button>
          )}

          <div className="online-status">
            <span className="status-dot"></span>
            AI Assistant
          </div>
        </div>
      </header>

      {view === "login" && renderAdminLogin()}

      {view === "admin" && renderAdminDashboard()}

      {view === "chat" && (
        <>
          <section className="chat-container">
            {messages.length === 0 ? (
              <div className="welcome-screen">
                <div className="welcome-icon">✦</div>

                <h2>Welcome to Shashank's Portfolio</h2>

                <p className="welcome-description">
                  I'm Shashank's AI portfolio assistant.
                  Ask me about his technical skills, projects,
                  education, experience, and certifications.
                </p>

                <div className="suggestions-heading">
                  Suggested questions
                </div>

                <div className="suggestions">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      className="suggestion-card"
                      key={index}
                      onClick={() => sendMessage(question)}
                      disabled={loading}
                      type="button"
                    >
                      <span>{question}</span>
                      <span className="suggestion-arrow">↗</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="messages">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message-row ${message.role}`}
                  >
                    {message.role === "assistant" && (
                      <div className="message-avatar">AI</div>
                    )}

                    <div className={`message ${message.role}`}>
                      {message.role === "assistant" ? (
                        message.content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            components={markdownComponents}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <span className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </span>
                        )
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))}

                <div ref={chatEndRef} />
              </div>
            )}
          </section>

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about skills, projects, experience..."
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
            >
              {loading ? "Thinking..." : "Send"}
              {!loading && <span> ↗</span>}
            </button>
          </form>

          <p className="footer-note">
            Powered by AI · Responses are based on Shashank's profile
          </p>
        </>
      )}
    </main>
  );
}

export default App;
