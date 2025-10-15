import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import reportWebVitals from './reportWebVitals';

// Catch unhandled promise rejections (common when browser extensions send messages
// with no receiver). This prevents those errors from appearing as uncaught in the
// console and helps avoid unexpected blank-page behavior caused by unhandled
// rejections during rendering.
window.addEventListener('unhandledrejection', (event) => {
  // Log the reason for debugging; do not throw so the app can continue.
  // `event.preventDefault()` stops the default logging of an uncaught rejection.
  // If you'd rather see the full stack in console, remove the preventDefault call.
  // Example extension-related errors often show a stack like content-all.js
  console.warn('Unhandled promise rejection:', event.reason);
  try {
    event.preventDefault();
  } catch (e) {
    // preventDefault may not be available in some browsers - ignore.
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
