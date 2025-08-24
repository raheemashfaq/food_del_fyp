import React, { useEffect, useRef, useState, useContext } from "react";
import { StoreContext } from "../../Context/StoreContext";
import "./Chatbot.css";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', address: '', area: '' });
  const scrollRef = useRef(null);
  const chatbotRef = useRef(null);
  const { url, token } = useContext(StoreContext);

  const avatarBot = "🤖";
  const avatarUser = "🧑";
  const botName = "Support Bot";
  const userName = "You";
  const quickReplies = ["Show menu", "Order now", "My addresses", "Delivery time", "Track my order"];

  // Initialize with default bot message
  const getDefaultMessage = () => ([
    {
      from: "bot",
      name: botName,
      text: "Hello! Welcome to our food delivery service. 🍕\n\nWe deliver throughout Lahore from our Johar Town location. How can I help you today?",
      timestamp: new Date()
    }
  ]);

  // Load saved addresses from localStorage
  useEffect(() => {
    if (token) {
      const saved = localStorage.getItem(`savedAddresses_${token}`);
      if (saved) {
        setSavedAddresses(JSON.parse(saved));
      }
    } else {
      setSavedAddresses([]);
    }
  }, [token]);

  // Handle clicking outside chatbot to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target) && open) {
        setOpen(false);
        setShowLocationPicker(false);
        setShowAddressForm(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Save addresses to localStorage
  const saveAddressesToStorage = (addresses) => {
    if (token) {
      localStorage.setItem(`savedAddresses_${token}`, JSON.stringify(addresses));
    }
  };

  // Load chat history from localStorage only if user is authenticated
  useEffect(() => {
    if (token) {
      const saved = localStorage.getItem(`chatHistory_${token}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages(getDefaultMessage());
      }
    } else {
      // Clear messages and show default when not authenticated
      setMessages(getDefaultMessage());
      // Clear any existing chat history from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chatHistory_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [token]);

  // Save chat history and scroll to bottom (only if user is authenticated)
  useEffect(() => {
    if (token && messages.length > 0) {
      localStorage.setItem(`chatHistory_${token}`, JSON.stringify(messages));
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, token]);

  const sendMessage = async (messageText = null, coordinates = null) => {
    const trimmed = messageText || input.trim();
    if (!trimmed && !coordinates) return;

    if (!coordinates) {
      const newMsg = {
        from: "user",
        name: userName,
        text: trimmed,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMsg]);
    }
    
    setInput("");
    setIsTyping(true);

    try {
      const requestBody = { message: trimmed };
      if (coordinates) {
        requestBody.coordinates = coordinates;
      }
      // Add userId for authenticated users
      if (token) {
        requestBody.userId = token; // Using token as userId identifier
      }

      const res = await fetch(url + "/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { token })
        },
        body: JSON.stringify(requestBody)
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
        
        // Show location picker if backend requests it
        if (data.needsLocation) {
          setShowLocationPicker(true);
        } else {
          setShowLocationPicker(false);
        }
        
        // Handle special response features
        if (data.showOrderOptions) {
          // Could add special UI for ordering in the future
        }
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

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          handleLocationSelect(lat, lng, "Current Location");
        },
        (error) => {
          console.error("Geolocation error:", error);
          setMessages(prev => [
            ...prev,
            {
              from: "bot",
              name: botName,
              text: "Unable to get your current location. Please pin your location on the map manually or add a saved address.",
              timestamp: new Date()
            }
          ]);
        }
      );
    } else {
      setMessages(prev => [
        ...prev,
        {
          from: "bot",
          name: botName,
          text: "Geolocation is not supported by your browser. Please pin your location on the map manually or add a saved address.",
          timestamp: new Date()
        }
      ]);
    }
  };

  // Handle adding a new address
  const handleAddAddress = () => {
    if (newAddress.name && newAddress.address && newAddress.area) {
      // Convert address to approximate coordinates (this is simplified - in production, use geocoding API)
      const lat = 31.582045 + (Math.random() - 0.5) * 0.1; // Random coordinates within Lahore
      const lng = 74.329376 + (Math.random() - 0.5) * 0.1;
      
      const addressWithCoords = {
        ...newAddress,
        lat,
        lng,
        id: Date.now()
      };
      
      const updatedAddresses = [...savedAddresses, addressWithCoords];
      setSavedAddresses(updatedAddresses);
      saveAddressesToStorage(updatedAddresses);
      
      setNewAddress({ name: '', address: '', area: '' });
      setShowAddressForm(false);
      
      setMessages(prev => [
        ...prev,
        {
          from: "bot",
          name: botName,
          text: `✅ Address "${addressWithCoords.name}" saved successfully! You can now use it for delivery.`,
          timestamp: new Date()
        }
      ]);
    }
  };

  // Handle selecting a saved address
  const handleSelectSavedAddress = (address) => {
    handleLocationSelect(address.lat, address.lng, address.name);
  };

  // Handle location selection
  const handleLocationSelect = (lat, lng, locationName = "Selected Location") => {
    setUserLocation({ lat, lng, name: locationName });
    setShowLocationPicker(false);
    
    // Send location to backend
    sendMessage(`Location selected: ${locationName}`, { lat, lng, name: locationName });
  };

  return (
    <div className="chatbot-wrapper" ref={chatbotRef}>
      <button className="chatbot-toggle" onClick={() => setOpen(v => !v)}>
        {open ? "Close Chat" : "Chat"}
      </button>

      {open && (
        <div className="chatbot-window">
          {/* Chat Header with Close Button */}
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <span className="chatbot-avatar">{avatarBot}</span>
              <span className="chatbot-title">{botName}</span>
            </div>
            <button 
              className="chatbot-close-btn"
              onClick={() => {
                setOpen(false);
                setShowLocationPicker(false);
                setShowAddressForm(false);
              }}
              title="Close Chat"
            >
              ×
            </button>
          </div>
          
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
                      if (text === "Pin location" || text === "My addresses") {
                        setShowLocationPicker(true);
                      } else if (text === "Order now") {
                        setInput(text);
                        sendMessage(text);
                      } else {
                        setInput(text);
                        sendMessage(text);
                      }
                    }}
                  >
                    {text === "Show menu" && "🍽️ "}
                    {text === "Order now" && "🛒 "}
                    {text === "My addresses" && "🏠 "}
                    {text === "Delivery time" && "🚚 "}
                    {text === "Track my order" && "📎 "}
                    {text}
                  </button>
                ))}
              </div>
            )}
            
            {/* Order guidance section */}
            {!isTyping && (
              <div className="order-guidance">
                <div className="guidance-tip">
                  💡 <strong>Quick Tip:</strong> We deliver from Johar Town throughout Lahore! Save your delivery addresses for easy ordering.
                </div>
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
          
          {showLocationPicker && (
            <div className="location-picker">
              <div className="location-picker-header">
                <h4>📍 Select Your Delivery Location</h4>
                <button 
                  className="close-location-picker"
                  onClick={() => {
                    setShowLocationPicker(false);
                    setShowAddressForm(false);
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* Quick Location Options */}
              <div className="location-options">
                <button 
                  className="location-option-btn"
                  onClick={getCurrentLocation}
                >
                  📱 Use Current Location
                </button>
                
                <button 
                  className="location-option-btn"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                >
                  🏠 Add New Address
                </button>
              </div>
              
              {/* Saved Addresses */}
              {savedAddresses.length > 0 && (
                <div className="saved-addresses">
                  <h5>💾 Saved Addresses:</h5>
                  <div className="address-list">
                    {savedAddresses.map((address) => (
                      <div key={address.id} className="saved-address-item">
                        <div className="address-info">
                          <strong>{address.name}</strong>
                          <small>{address.area}, {address.address}</small>
                        </div>
                        <button 
                          className="select-address-btn"
                          onClick={() => handleSelectSavedAddress(address)}
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add New Address Form */}
              {showAddressForm && (
                <div className="address-form">
                  <h5>🏠 Add New Address:</h5>
                  <input
                    type="text"
                    placeholder="Address Name (e.g., Home, Office)"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                    className="address-input"
                  />
                  <input
                    type="text"
                    placeholder="Area/Locality in Lahore"
                    value={newAddress.area}
                    onChange={(e) => setNewAddress({...newAddress, area: e.target.value})}
                    className="address-input"
                  />
                  <textarea
                    placeholder="Complete Address"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                    className="address-textarea"
                    rows="3"
                  />
                  <div className="address-form-buttons">
                    <button 
                      className="save-address-btn"
                      onClick={handleAddAddress}
                      disabled={!newAddress.name || !newAddress.address || !newAddress.area}
                    >
                      Save Address
                    </button>
                    <button 
                      className="cancel-address-btn"
                      onClick={() => {
                        setShowAddressForm(false);
                        setNewAddress({ name: '', address: '', area: '' });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {/* Map Selection */}
              <div className="location-manual-select">
                <p>Or click on the map to pin your location:</p>
                <div className="simple-map" onClick={(e) => {
                  const rect = e.target.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  // Convert click position to approximate Lahore coordinates
                  const lat = 31.582045 + (y / rect.height - 0.5) * 0.2;
                  const lng = 74.329376 + (x / rect.width - 0.5) * 0.3;
                  
                  handleLocationSelect(lat, lng, "Map Location");
                }}>
                  <div className="map-placeholder">
                    🗺️ Click anywhere on this map to pin your location in Lahore
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
