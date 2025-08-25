import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './LocationMap.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Lahore city boundaries
const LAHORE_BOUNDS = {
  north: 31.6963,
  south: 31.3884,
  east: 74.5133,
  west: 74.1866
};

// Check if coordinates are within Lahore
const isWithinLahore = (lat, lng) => {
  return lat >= LAHORE_BOUNDS.south && lat <= LAHORE_BOUNDS.north &&
         lng >= LAHORE_BOUNDS.west && lng <= LAHORE_BOUNDS.east;
};

// Component to handle map clicks
function LocationMarker({ onLocationSelect, selectedLocation }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (isWithinLahore(lat, lng)) {
        onLocationSelect(lat, lng);
      } else {
        alert('Sorry, we only deliver within Lahore. Please select a location within Lahore city limits.');
      }
    },
  });

  return selectedLocation ? (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
      <Popup>
        <div className="selected-location-popup">
          <h4>📍 Your Selected Location</h4>
          <p>Lat: {selectedLocation.lat.toFixed(4)}</p>
          <p>Lng: {selectedLocation.lng.toFixed(4)}</p>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

const LocationMap = ({ 
  latitude = 31.582045, 
  longitude = 74.329376, 
  zoom = 13,
  locationName = "Tomato Food Restaurant",
  popupText = "🏪 Our Restaurant Location - We deliver throughout Lahore!",
  interactive = false,
  onLocationSelect = null,
  selectedLocation = null
}) => {
  const position = [latitude, longitude];
  
  return (
    <div className="location-map-container">
      <h3 className="map-title">
        {interactive ? "📍 Click on the map to pin your location" : "📍 Our Delivery Location"}
      </h3>
      {interactive && (
        <div className="map-instructions">
          <p>🚩 We deliver only within Lahore city limits</p>
        </div>
      )}
      <MapContainer 
        center={position} 
        zoom={zoom} 
        className={`location-map ${interactive ? 'interactive-map' : ''}`}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Default restaurant marker */}
        <Marker position={position}>
          <Popup>
            <div className="map-popup">
              <h4>{locationName}</h4>
              <p>{popupText}</p>
            </div>
          </Popup>
        </Marker>
        
        {/* Interactive location marker */}
        {interactive && (
          <LocationMarker 
            onLocationSelect={onLocationSelect}
            selectedLocation={selectedLocation}
          />
        )}
      </MapContainer>
      
      {interactive && selectedLocation && (
        <div className="selected-location-info">
          <p>✅ Location selected! You can now proceed with your order.</p>
        </div>
      )}
    </div>
  );
};

export default LocationMap;