"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useState,
} from "react";

type Mode = "login" | "register";

type Business = {
  id: number;
  name: string;
  description?: string | null;
};

type ChatMessage = {
  id: string;
  question: string;
  answer: string;
};

type DocumentItem = {
  id: number;
  filename: string;
  filepath?: string;
  business_id: number;
  created_at?: string | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

export default function Home() {
  // =====================================================
  // AUTH
  // =====================================================

  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // =====================================================
  // BUSINESS
  // =====================================================

  const [businesses, setBusinesses] = useState<Business[]>(
    []
  );

  const [selectedBusiness, setSelectedBusiness] =
    useState<Business | null>(null);

  const [businessesLoading, setBusinessesLoading] =
    useState(false);

  const [businessesError, setBusinessesError] =
    useState("");

  // =====================================================
  // CHAT
  // =====================================================

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>(
    []
  );

  const [chatLoading, setChatLoading] = useState(false);

  const [chatError, setChatError] = useState("");

  // =====================================================
  // CHAT HISTORY
  // =====================================================

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] = useState("");

  // =====================================================
  // DOCUMENTS
  // =====================================================

  const [documents, setDocuments] = useState<
    DocumentItem[]
  >([]);

  const [documentsLoading, setDocumentsLoading] =
    useState(false);

  const [documentsError, setDocumentsError] =
    useState("");

  const [uploadLoading, setUploadLoading] =
    useState(false);

  const [uploadError, setUploadError] = useState("");

  const [deleteLoadingId, setDeleteLoadingId] =
    useState<number | null>(null);

  // =====================================================
  // CLIENT READY
  // =====================================================

  const [clientReady, setClientReady] = useState(false);

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = (): string | null => {
    if (typeof window === "undefined") {
      return null;
    }

    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("supportpilot_token")
    );
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    setClientReady(true);

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("supportpilot_token");

    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // =====================================================
  // LOAD BUSINESSES
  // =====================================================

  const loadBusinesses = async () => {
    const token = getToken();

    if (!token) {
      setIsLoggedIn(false);
      setBusinessesError("Please login again.");
      return;
    }

    setBusinessesLoading(true);
    setBusinessesError("");

    try {
      const response = await fetch(
        `${API_URL}/business/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Failed to load businesses:",
          errorText
        );

        if (response.status === 401) {
          setBusinessesError(
            "Session expired. Please login again."
          );
          setIsLoggedIn(false);
        } else {
          setBusinessesError(
            "Failed to load businesses."
          );
        }

        return;
      }

      const data = await response.json();

      const businessList: Business[] =
        Array.isArray(data)
          ? data
          : data.businesses || [];

      setBusinesses(businessList);

      if (businessList.length > 0) {
        setSelectedBusiness((previous) => {
          if (!previous) {
            return businessList[0];
          }

          const stillExists = businessList.find(
            (business) =>
              business.id === previous.id
          );

          return stillExists || businessList[0];
        });
      } else {
        setSelectedBusiness(null);
      }
    } catch (error) {
      console.error(
        "Error loading businesses:",
        error
      );

      setBusinessesError(
        "Unable to connect to the backend."
      );
    } finally {
      setBusinessesLoading(false);
    }
  };

  // =====================================================
  // LOAD CHAT HISTORY
  // =====================================================

  const loadChatHistory = async (
    businessId: number
  ) => {
    const token = getToken();

    if (!token) {
      setHistoryError("Please login again.");
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(
        `${API_URL}/chat/history?business_id=${businessId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Failed to load chat history:",
          errorText
        );

        if (response.status === 401) {
          setHistoryError(
            "Session expired. Please login again."
          );
          setIsLoggedIn(false);
        } else {
          setHistoryError(
            "Failed to load chat history."
          );
        }

        setMessages([]);
        return;
      }

      const data = await response.json();

      const history = Array.isArray(data)
        ? data
        : data.history || [];

      const formattedMessages: ChatMessage[] =
        history
          .slice()
          .reverse()
          .map(
            (
              item: {
                id?: number;
                question?: string;
                answer?: string;
              },
              index: number
            ) => ({
              id: String(
                item.id ?? `history-${index}`
              ),
              question: item.question || "",
              answer: item.answer || "",
            })
          );

      setMessages(formattedMessages);
    } catch (error) {
      console.error(
        "Error loading chat history:",
        error
      );

      setHistoryError(
        "Unable to load previous conversations."
      );

      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // =====================================================
  // LOAD DOCUMENTS
  // =====================================================

  const loadDocuments = async (
    businessId: number
  ) => {
    const token = getToken();

    if (!token) {
      setDocumentsError("Please login again.");
      return;
    }

    setDocumentsLoading(true);
    setDocumentsError("");

    try {
      const response = await fetch(
        `${API_URL}/documents/?business_id=${businessId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Failed to load documents:",
          errorText
        );

        if (response.status === 401) {
          setDocumentsError(
            "Session expired. Please login again."
          );
          setIsLoggedIn(false);
        } else {
          setDocumentsError(
            "Failed to load documents."
          );
        }

        setDocuments([]);
        return;
      }

      const data = await response.json();

      const documentList: DocumentItem[] =
        Array.isArray(data)
          ? data
          : data.documents || [];

      setDocuments(documentList);
    } catch (error) {
      console.error(
        "Error loading documents:",
        error
      );

      setDocumentsError(
        "Unable to connect to the backend."
      );

      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // =====================================================
  // LOAD DATA AFTER LOGIN
  // =====================================================

  useEffect(() => {
    if (!clientReady || !isLoggedIn) {
      return;
    }

    loadBusinesses();
  }, [clientReady, isLoggedIn]);

  // =====================================================
  // LOAD BUSINESS-SPECIFIC DATA
  // =====================================================

  useEffect(() => {
    if (!selectedBusiness) {
      setMessages([]);
      setDocuments([]);
      return;
    }

    loadChatHistory(selectedBusiness.id);
    loadDocuments(selectedBusiness.id);
  }, [selectedBusiness]);

  // =====================================================
  // AUTH
  // =====================================================

  const handleAuth = async () => {
    setAuthError("");

    if (!email.trim()) {
      setAuthError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setAuthError("Please enter your password.");
      return;
    }

    setAuthLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? "/auth/login"
          : "/auth/register";

      const body =
        mode === "login"
          ? {
              email: email.trim(),
              password,
            }
          : {
              email: email.trim(),
              password,
            };

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAuthError(
          data?.detail ||
            "Authentication failed."
        );
        return;
      }

      if (mode === "login") {
        const token = data.access_token;

        if (!token) {
          setAuthError(
            "Login succeeded but no access token was returned."
          );
          return;
        }

        localStorage.setItem(
          "access_token",
          token
        );

        localStorage.setItem(
          "supportpilot_token",
          token
        );

        localStorage.setItem(
          "supportpilot_email",
          email.trim()
        );

        setIsLoggedIn(true);
        setEmail("");
        setPassword("");
        setAuthError("");
      } else {
        setMode("login");
        setAuthError(
          "Registration successful. Please login."
        );
        setPassword("");
      }
    } catch (error) {
      console.error(
        "Authentication error:",
        error
      );

      setAuthError(
        "Unable to connect to the backend."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem(
      "supportpilot_token"
    );
    localStorage.removeItem(
      "supportpilot_email"
    );

    setIsLoggedIn(false);

    setBusinesses([]);
    setSelectedBusiness(null);
    setMessages([]);
    setDocuments([]);

    setEmail("");
    setPassword("");

    setAuthError("");
    setBusinessesError("");
    setHistoryError("");
    setDocumentsError("");
  };

  // =====================================================
  // ASK AI
  // =====================================================

  const askAI = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    if (!selectedBusiness) {
      setChatError(
        "Please select a business first."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setChatError("Please login again.");
      setIsLoggedIn(false);
      return;
    }

    setChatLoading(true);
    setChatError("");

    try {
      const response = await fetch(
        `${API_URL}/chat/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: trimmedQuestion,
            business_id: selectedBusiness.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "AI request failed:",
          data
        );

        if (response.status === 401) {
          setChatError(
            "Session expired. Please login again."
          );
          setIsLoggedIn(false);
        } else {
          setChatError(
            data?.detail ||
              "Failed to get AI response."
          );
        }

        return;
      }

      const newMessage: ChatMessage = {
        id: `chat-${Date.now()}`,
        question: trimmedQuestion,
        answer:
          data.answer ||
          "No answer returned.",
      };

      setMessages((previous) => [
        ...previous,
        newMessage,
      ]);

      setQuestion("");
    } catch (error) {
      console.error(
        "Error asking AI:",
        error
      );

      setChatError(
        "Unable to connect to the AI service."
      );
    } finally {
      setChatLoading(false);
    }
  };

  // =====================================================
  // ENTER KEY
  // =====================================================

  const handleQuestionKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (!chatLoading) {
        askAI();
      }
    }
  };

  // =====================================================
  // UPLOAD DOCUMENT
  // =====================================================

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (!selectedBusiness) {
      setUploadError(
        "Please select a business first."
      );
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setUploadError(
        "Only PDF files are supported."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setUploadError("Please login again.");
      setIsLoggedIn(false);
      return;
    }

    setUploadLoading(true);
    setUploadError("");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "business_id",
        String(selectedBusiness.id)
      );

      const response = await fetch(
        `${API_URL}/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Upload failed:",
          data
        );

        if (response.status === 401) {
          setUploadError(
            "Session expired. Please login again."
          );
          setIsLoggedIn(false);
        } else {
          setUploadError(
            data?.detail ||
              "Failed to upload document."
          );
        }

        return;
      }

      await loadDocuments(
        selectedBusiness.id
      );
    } catch (error) {
      console.error(
        "Document upload error:",
        error
      );

      setUploadError(
        "Unable to connect to the backend."
      );
    } finally {
      setUploadLoading(false);
    }
  };

  // =====================================================
  // DELETE DOCUMENT
  // =====================================================

  const deleteDocument = async (
    documentId: number
  ) => {
    if (!selectedBusiness) {
      return;
    }

    const token = getToken();

    if (!token) {
      setDocumentsError("Please login again.");
      setIsLoggedIn(false);
      return;
    }

    setDeleteLoadingId(documentId);
    setDocumentsError("");

    try {
      const response = await fetch(
        `${API_URL}/documents/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Delete failed:",
          data
        );

        if (response.status === 401) {
          setDocumentsError(
            "Session expired. Please login again."
          );
          setIsLoggedIn(false);
        } else {
          setDocumentsError(
            data?.detail ||
              "Failed to delete document."
          );
        }

        return;
      }

      await loadDocuments(
        selectedBusiness.id
      );
    } catch (error) {
      console.error(
        "Document delete error:",
        error
      );

      setDocumentsError(
        "Unable to connect to the backend."
      );
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // =====================================================
  // SUBMIT AUTH FORM
  // =====================================================

  const handleAuthSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    handleAuth();
  };

  // =====================================================
  // HYDRATION SAFE LOADING
  // =====================================================

  if (!clientReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-slate-400">
          Loading SupportPilot AI...
        </div>
      </main>
    );
  }

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold">
              SupportPilot AI
            </h1>

            <p className="mt-2 text-slate-400">
              AI-powered customer support
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex rounded-xl bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setAuthError("");
                }}
                className={`flex-1 rounded-lg py-2 font-medium ${
                  mode === "login"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setAuthError("");
                }}
                className={`flex-1 rounded-lg py-2 font-medium ${
                  mode === "register"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400"
                }`}
              >
                Register
              </button>
            </div>

            <h2 className="mb-5 text-xl font-semibold">
              {mode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h2>

            {authError && (
              <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
                {authError}
              </div>
            )}

            <form
              onSubmit={handleAuthSubmit}
            >
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                autoComplete="email"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
              />

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authLoading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Login"
                  : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // MAIN APP
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-7xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              SupportPilot AI
            </h1>

            <p className="text-sm text-slate-400">
              AI customer support workspace
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>

        {/* =================================================
            BUSINESS SELECTOR
        ================================================= */}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                Select Business
              </h2>

              <p className="text-sm text-slate-400">
                Select which business the AI should use.
              </p>
            </div>

            <button
              type="button"
              onClick={loadBusinesses}
              disabled={businessesLoading}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              {businessesLoading
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>

          {businessesError && (
            <div className="mb-3 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
              {businessesError}
            </div>
          )}

          {businesses.length === 0 &&
          !businessesLoading ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
              No businesses found.
            </div>
          ) : (
            <select
              value={
                selectedBusiness
                  ? String(selectedBusiness.id)
                  : ""
              }
              onChange={(event) => {
                const business = businesses.find(
                  (item) =>
                    item.id ===
                    Number(event.target.value)
                );

                setSelectedBusiness(
                  business || null
                );
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              {businesses.map((business) => (
                <option
                  key={business.id}
                  value={business.id}
                >
                  {business.name}
                </option>
              ))}
            </select>
          )}
        </section>

        {/* =================================================
            SELECTED BUSINESS
        ================================================= */}

        {selectedBusiness && (
          <div className="mb-6 rounded-xl border border-blue-900/50 bg-blue-950/20 px-4 py-3">
            <span className="text-sm text-slate-400">
              Active business:
            </span>{" "}
            <span className="font-semibold text-blue-300">
              {selectedBusiness.name}
            </span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* =================================================
              LEFT - CHAT
          ================================================= */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  AI Chat
                </h2>

                <p className="text-sm text-slate-400">
                  Ask questions about your business documents.
                </p>
              </div>

              {historyLoading && (
                <span className="text-xs text-slate-500">
                  Loading history...
                </span>
              )}
            </div>

            {historyError && (
              <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
                {historyError}
              </div>
            )}

            <div className="mb-5 max-h-[550px] min-h-[300px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
              {messages.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center text-center text-slate-500">
                  <div>
                    <div className="mb-2 text-3xl">
                      🤖
                    </div>

                    <p>
                      No conversation yet.
                    </p>

                    <p className="mt-1 text-sm">
                      Ask the AI something about your
                      selected business.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="space-y-3"
                    >
                      <div className="rounded-xl bg-blue-600 p-4">
                        <div className="mb-1 text-xs font-semibold uppercase text-blue-200">
                          You
                        </div>

                        <p className="whitespace-pre-wrap">
                          {message.question}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                        <div className="mb-1 text-xs font-semibold uppercase text-slate-400">
                          SupportPilot AI
                        </div>

                        <p className="whitespace-pre-wrap leading-7 text-slate-200">
                          {message.answer}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {chatError && (
              <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
                {chatError}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                onKeyDown={
                  handleQuestionKeyDown
                }
                disabled={
                  !selectedBusiness ||
                  chatLoading
                }
                placeholder={
                  selectedBusiness
                    ? "Ask something about your business..."
                    : "Select a business first..."
                }
                rows={3}
                className="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-50"
              />

              <button
                type="button"
                onClick={askAI}
                disabled={
                  chatLoading ||
                  !selectedBusiness ||
                  !question.trim()
                }
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
              >
                {chatLoading
                  ? "Thinking..."
                  : "Ask AI"}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Press Enter to send. Shift + Enter for a new line.
            </p>
          </section>

          {/* =================================================
              RIGHT - DOCUMENTS
          ================================================= */}

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    Documents
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Knowledge base for the selected business.
                  </p>
                </div>

                {selectedBusiness && (
                  <button
                    type="button"
                    onClick={() =>
                      loadDocuments(
                        selectedBusiness.id
                      )
                    }
                    disabled={documentsLoading}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  >
                    Refresh
                  </button>
                )}
              </div>

              {/* UPLOAD */}

              <label
                className={`mb-5 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-700 px-4 py-4 text-center transition ${
                  selectedBusiness
                    ? "hover:border-blue-500 hover:bg-slate-800"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  disabled={
                    !selectedBusiness ||
                    uploadLoading
                  }
                  onChange={handleUpload}
                />

                <div>
                  <div className="mb-1 text-2xl">
                    {uploadLoading ? "⏳" : "📄"}
                  </div>

                  <div className="font-medium">
                    {uploadLoading
                      ? "Uploading..."
                      : "Upload PDF"}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    PDF files only
                  </div>
                </div>
              </label>

              {uploadError && (
                <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
                  {uploadError}
                </div>
              )}

              {documentsError && (
                <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
                  {documentsError}
                </div>
              )}

              {/* DOCUMENT LIST */}

              {documentsLoading ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-500">
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center">
                  <div className="mb-2 text-2xl">
                    📂
                  </div>

                  <p className="text-sm text-slate-400">
                    No documents uploaded yet.
                  </p>

                  {selectedBusiness && (
                    <p className="mt-1 text-xs text-slate-600">
                      Upload a PDF to build this business's
                      knowledge base.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          📄
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate font-medium text-slate-200"
                            title={
                              document.filename
                            }
                          >
                            {document.filename}
                          </p>

                          {document.created_at && (
                            <p className="mt-1 text-xs text-slate-600">
                              {new Date(
                                document.created_at
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteDocument(
                            document.id
                          )
                        }
                        disabled={
                          deleteLoadingId ===
                          document.id
                        }
                        className="mt-3 w-full rounded-lg border border-red-900/70 px-3 py-2 text-sm text-red-400 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deleteLoadingId ===
                        document.id
                          ? "Deleting..."
                          : "Delete document"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* =================================================
                BUSINESS INFO
            ================================================= */}

            {selectedBusiness && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="mb-3 font-semibold">
                  Business Information
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500">
                      Name
                    </span>

                    <p className="text-slate-200">
                      {selectedBusiness.name}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Business ID
                    </span>

                    <p className="text-slate-200">
                      {selectedBusiness.id}
                    </p>
                  </div>

                  {selectedBusiness.description && (
                    <div>
                      <span className="text-slate-500">
                        Description
                      </span>

                      <p className="text-slate-300">
                        {
                          selectedBusiness.description
                        }
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500">
                      Documents
                    </span>

                    <p className="text-slate-200">
                      {documents.length}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Conversations
                    </span>

                    <p className="text-slate-200">
                      {messages.length}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

