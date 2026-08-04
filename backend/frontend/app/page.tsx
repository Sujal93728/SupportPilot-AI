"use client";

import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function askAI() {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      setAnswer(data.answer || data.response || "No answer returned.");
    } catch (error) {
      console.error(error);
      setAnswer(
        "Unable to connect to SupportPilot AI. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-slate-800 bg-slate-900 p-6 md:block">
          <h1 className="text-2xl font-bold">
            SupportPilot <span className="text-blue-400">AI</span>
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Intelligent support assistant
          </p>

          <nav className="mt-10 space-y-3">
            <button className="w-full rounded-lg bg-blue-600 px-4 py-3 text-left">
              💬 AI Chat
            </button>

            <button className="w-full rounded-lg px-4 py-3 text-left text-slate-300 hover:bg-slate-800">
              📄 Documents
            </button>

            <button className="w-full rounded-lg px-4 py-3 text-left text-slate-300 hover:bg-slate-800">
              🏢 Businesses
            </button>
          </nav>
        </aside>

        {/* Main */}
        <section className="flex flex-1 flex-col">

          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold">
                AI Support Assistant
              </h2>

              <p className="text-sm text-slate-400">
                Ask questions about your uploaded documents
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400"></span>
              Online
            </div>
          </header>

          {/* Chat area */}
          <div className="flex flex-1 flex-col items-center px-6 py-12">

            <div className="w-full max-w-4xl">

              <div className="mb-10 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl">
                  ✦
                </div>

                <h3 className="text-3xl font-bold">
                  How can I help you?
                </h3>

                <p className="mt-3 text-slate-400">
                  Ask SupportPilot AI anything about your documents.
                </p>
              </div>

              {/* Answer */}
              {answer && (
                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="mb-3 text-sm font-semibold text-blue-400">
                    SupportPilot AI
                  </div>

                  <p className="whitespace-pre-wrap leading-7 text-slate-200">
                    {answer}
                  </p>
                </div>
              )}

              {/* Input */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      askAI();
                    }
                  }}
                  placeholder="Ask SupportPilot anything..."
                  className="min-h-28 w-full resize-none bg-transparent p-3 text-white outline-none placeholder:text-slate-500"
                />

                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  <span className="text-xs text-slate-500">
                    Press Enter to ask
                  </span>

                  <button
                    onClick={askAI}
                    disabled={loading || !question.trim()}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Thinking..." : "Ask AI →"}
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <button
                  onClick={() =>
                    setQuestion("Summarize the uploaded document")
                  }
                  className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-blue-500"
                >
                  <div className="mb-2">📄</div>
                  <div className="font-medium">Summarize document</div>
                </button>

                <button
                  onClick={() =>
                    setQuestion("What are the most important points?")
                  }
                  className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-blue-500"
                >
                  <div className="mb-2">🔍</div>
                  <div className="font-medium">Key points</div>
                </button>

                <button
                  onClick={() =>
                    setQuestion("What information is available?")
                  }
                  className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-blue-500"
                >
                  <div className="mb-2">💡</div>
                  <div className="font-medium">Ask about document</div>
                </button>
              </div>

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}