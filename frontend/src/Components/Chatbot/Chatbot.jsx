// src/components/Chatbot/Chatbot.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import { StoreContext } from "../../Context/StoreContext"; 

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your food assistant. Ask about menu, delivery or order status." }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const { url, token } = useContext(StoreContext); // use your base url from context

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMsg = { from: "user", text: trimmed };
    setMessages(prev => [...prev, newMsg]);
    setInput("");

    try {
      const res = await fetch(url + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, no reply.";
      setMessages(prev => [...prev, { from: "bot", text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { from: "bot", text: "Chat service error. Try again later." }]);
      console.error("Chat error:", err);
    }
  };

  const onKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <>
      <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 9999 }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            background: "#0ea5a4", color: "white", border: "none",
            padding: "10px 14px", borderRadius: 999
          }}
        >
          {open ? "Close Chat" : "Chat"}
        </button>
        {open && (
          <div style={{ width: 320, height: 420, background: "white", boxShadow: "0 6px 18px rgba(0,0,0,0.12)", marginTop: 8, borderRadius: 8, display: "flex", flexDirection: "column" }}>
            <div ref={scrollRef} style={{ padding: 12, overflowY: "auto", flex: 1 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: 8, textAlign: m.from === "bot" ? "left" : "right" }}>
                  <div style={{
                    display: "inline-block", padding: "8px 10px", borderRadius: 8,
                    background: m.from === "bot" ? "#f1f5f9" : "#dcfce7"
                  }}>
                    <small style={{ color: "#111" }}>{m.text}</small>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", padding: 8, borderTop: "1px solid #eee" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyPress}
                placeholder="Type a message..."
                style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
              <button onClick={sendMessage} style={{ marginLeft: 8, padding: "8px 12px", borderRadius: 6, background: "#06b6d4", color: "white", border: "none" }}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
