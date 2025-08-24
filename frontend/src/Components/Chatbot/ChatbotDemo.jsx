import React, { useState } from 'react';
import Chatbot from './Chatbot';
import LocationMap from '../LocationMap/LocationMap';

const ChatbotDemo = () => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🤖 Customer Support Chatbot Demo</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h3>Features:</h3>
        <ul>
          <li>✅ Lahore-only delivery service</li>
          <li>✅ Interactive location pinning</li>
          <li>✅ Automatic delivery time calculation</li>
          <li>✅ Boundary validation for Lahore</li>
          <li>✅ Professional customer support responses</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>How to Test:</h3>
        <ol>
          <li>Click the "Chat" button in the bottom-right corner</li>
          <li>Try these commands:
            <ul>
              <li>"Hello" - See the initial greeting</li>
              <li>"Delivery time" - Get prompted for location</li>
              <li>"Pin location" - Open location picker</li>
              <li>"Show menu" - View available items</li>
            </ul>
          </li>
          <li>Use the location picker to pin your location in Lahore</li>
          <li>Get instant delivery time estimates!</li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowDemo(!showDemo)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0ea5a4',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {showDemo ? 'Hide' : 'Show'} Location Map Demo
        </button>
      </div>

      {showDemo && (
        <div style={{ marginBottom: '20px' }}>
          <LocationMap 
            interactive={true}
            onLocationSelect={(lat, lng) => {
              console.log('Location selected:', lat, lng);
              alert(`Location selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }}
          />
        </div>
      )}

      {/* The chatbot will appear in bottom-right corner */}
      <Chatbot />
      
      <div style={{ marginTop: '40px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <h4>Test Scenarios:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <strong>✅ Valid Lahore Location:</strong>
            <p>Try clicking anywhere on the map above or enter coordinates like 31.5804, 74.3294</p>
          </div>
          <div>
            <strong>❌ Outside Lahore:</strong>
            <p>The system will reject locations outside Lahore boundaries and show an appropriate message</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotDemo;