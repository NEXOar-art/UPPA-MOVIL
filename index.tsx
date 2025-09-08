
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';

// In a real build, environment variables would be set by a build tool (e.g., Vite, Webpack).
// For this environment, ensure the following process.env variables are set:
// 
// 1. process.env.API_KEY
//    - This is the API key for the Google Gemini AI service.
// 
// 2. process.env.GOOGLE_MAPS_API_KEY
//    - This is the API key for Google Maps services (Maps, Geocoding, Routes).
// 
// The user/environment is responsible for setting these variables.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>
);
