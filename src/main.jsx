import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import './index.css'

// Polyfill window.storage with localStorage for persistent state in browser
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      const val = localStorage.getItem(key);
      if (val === null) {
        throw new Error('Key not found');
      }
      return { value: val };
    },
    set: async (key, value) => {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      return { success: true };
    },
    remove: async (key) => {
      localStorage.removeItem(key);
      return { success: true };
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
