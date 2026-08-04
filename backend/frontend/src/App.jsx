import { useState } from "react";
import api from "./services/api";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!question.trim() || loading) return;

    const userMessage = question.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post("/chat/", {
        question: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.answer,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>SupportPilot AI</h1>
          <p>AI-powered customer support assistant</p>
        </div>

        <div className="status">
          <span></span>
          Online
        </div>
      </header>

      <main className="chat-container">
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="logo">🤖</div>

            <h2>How can I help you?</h2>

            <p>
              Ask questions about the documents uploaded to SupportPilot AI.
            </p>

            <div className="suggestions">
              <button
                onClick={() =>
                  setQuestion("What is SupportPilot AI?")
                }
              >
                What is SupportPilot AI?
              </button>

              <button
                onClick={() =>
                  setQuestion("What information is available?")
                }
              >
                What information is available?
              </button>

              <button
                onClick={() =>
                  setQuestion("Summarize the uploaded document")
                }
              >
                Summarize the document
              </button>
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${
                  message.role === "user" ? "user" : "assistant"
                }`}
              >
                <div className="avatar">
                  {message.role === "user" ? "👤" : "🤖"}
                </div>

                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="message assistant">
                <div className="avatar">🤖</div>

                <div className="message-content typing">
                  SupportPilot AI is thinking...
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <form className="input-area" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Ask SupportPilot AI anything..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />

        <button type="submit" disabled={loading || !question.trim()}>
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default App;