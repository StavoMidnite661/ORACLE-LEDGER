import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import { loggingService } from './services/loggingService.js';

// --- Persistent Console Hook ---
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args: any[]) => {
  loggingService.log('info', 'frontend', args[0], args.slice(1));
  originalLog.apply(console, args);
};

console.warn = (...args: any[]) => {
  loggingService.log('warn', 'frontend', args[0], args.slice(1));
  originalWarn.apply(console, args);
};

console.error = (...args: any[]) => {
  loggingService.log('error', 'frontend', args[0], args.slice(1));
  originalError.apply(console, args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
