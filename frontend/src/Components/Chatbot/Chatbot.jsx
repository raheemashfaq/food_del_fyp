import React, { useEffect, useRef, useState, useContext } from "react";
import { StoreContext } from "../../Context/StoreContext";
import "./Chatbot.css";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const { url } = useContext(StoreContext);

  const avatarBot = "🤖";
  const avatarUser = "🧑";
  const botName = "TomatoBot";
  const userName = "You";
  const quickReplies = ["Show menu", "Track my order", "Delivery time",];

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        {
          from: "bot",
          name: botName,
          text: "Hi! I'm your food assistant. Ask about menu, delivery or order status.",
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Save chat history and scroll to bottom
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMsg = {
      from: "user",
      name: userName,
      text: trimmed,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(url + "/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { token })
        },
        body: JSON.stringify({ message: trimmed })
      });

      const data = await res.json();
      const reply = data.reply || "Sorry, no reply.";

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            from: "bot",
            name: botName,
            text: reply,
            timestamp: new Date()
          }
        ]);
        setIsTyping(false);
      }, 1200);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          from: "bot",
          name: botName,
          text: "⚠️ Chat service error. Try again later.",
          timestamp: new Date()
        }
      ]);
      setIsTyping(false);
      console.error("Chat error:", err);
    }
  };

  const onKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chatbot-wrapper">
      <button className="chatbot-toggle" onClick={() => setOpen(v => !v)}>
        {open ? "Close Chat" : "Chat"}
      </button>

      {open && (
        <div className="chatbot-window">
          <div ref={scrollRef} className="chatbot-messages">
            {messages.map((m, i) => (
              <div
                key={i}
                className="chatbot-message-row"
                style={{
                  justifyContent: m.from === "bot" ? "flex-start" : "flex-end"
                }}
              >
                {m.from === "bot" && <div style={{ marginRight: 8 }}>{avatarBot}</div>}
                <div
                  className={`chatbot-bubble ${
                    m.from === "bot" ? "chatbot-bot" : "chatbot-user"
                  }`}
                >
                  <strong style={{ fontSize: "12px", color: "#444" }}>
                    {m.name}
                  </strong>
                  <div style={{ marginTop: 4 }}>
                    {m.text.split("\n").map((line, idx) => (
                      <div key={idx}><small>{line}</small></div>
                    ))}
                  </div>
                  <div className="chatbot-timestamp">
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
                {m.from === "user" && <div style={{ marginLeft: 8 }}>{avatarUser}</div>}
              </div>
            ))}

            {isTyping && (
              <div className="chatbot-message-row" style={{ justifyContent: "flex-start" }}>
                <div className="chatbot-bubble chatbot-bot">
                  <strong style={{ fontSize: "12px", color: "#444" }}>{botName}</strong>
                  <div style={{ marginTop: 4 }}>
                    Bot is typing<span className="typing-dots">...</span>
                  </div>
                </div>
              </div>
            )}

            {!isTyping && (
              <div className="chatbot-quick-replies">
                {quickReplies.map((text, idx) => (
                  <button
                    key={idx}
                    className="chatbot-quick-button"
                    onClick={() => {
                      setInput(text);
                      sendMessage();
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="chatbot-input-area">
            <input
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="Type a message..."
            />
            <button className="chatbot-send" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
