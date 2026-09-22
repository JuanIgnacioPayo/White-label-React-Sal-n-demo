import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import {BrowserRouter} from "react-router-dom";

// Unregister any old service workers (e.g. from other apps on localhost:5173 like Botonazo)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Unregistered old service worker.');
    }
  });
}

// Manejo oficial de Vite para chunks desactualizados tras nuevo deploy
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  console.warn("Vite preload error detectado (nuevo deploy). Recargando versión actual...");
  const last = sessionStorage.getItem('last_vite_preload_retry');
  const now = Date.now();
  if (!last || (now - parseInt(last, 10)) > 4000) {
    sessionStorage.setItem('last_vite_preload_retry', String(now));
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(now));
    window.location.replace(url.toString());
  }
});

// Manejo global para promesas no capturadas de carga de módulos
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || (typeof event.reason === 'string' ? event.reason : "");
  const isChunkError = 
    /chunk|dynamically imported module|import\s+failed|unable to preload|element type is invalid/i.test(errorMessage) ||
    errorMessage.includes("dynamically imported module") ||
    errorMessage.includes("Element type is invalid") ||
    (event.reason?.name === "TypeError" && (errorMessage.includes("dynamically imported module") || errorMessage.includes("fetch")));
    
  if (isChunkError) {
    console.warn("Chunk/deploy error detectado en unhandledrejection. Recargando...");
    const last = sessionStorage.getItem('last_global_chunk_reload');
    const now = Date.now();
    if (!last || (now - parseInt(last, 10)) > 4000) {
      sessionStorage.setItem('last_global_chunk_reload', String(now));
      const url = new URL(window.location.href);
      url.searchParams.set('v', String(now));
      window.location.replace(url.toString());
    }
  }
});

window.addEventListener('error', (event) => {
  const errorMessage = event.message || "";
  const isChunkError = 
    /chunk|dynamically imported module|import\s+failed|unable to preload|element type is invalid/i.test(errorMessage) ||
    errorMessage.includes("dynamically imported module") ||
    errorMessage.includes("Element type is invalid") ||
    (event.error?.name === "TypeError" && (errorMessage.includes("dynamically imported module") || errorMessage.includes("fetch")));
    
  if (isChunkError) {
    console.warn("Chunk/deploy error detectado en error listener. Recargando...");
    const last = sessionStorage.getItem('last_global_chunk_reload');
    const now = Date.now();
    if (!last || (now - parseInt(last, 10)) > 4000) {
      sessionStorage.setItem('last_global_chunk_reload', String(now));
      const url = new URL(window.location.href);
      url.searchParams.set('v', String(now));
      window.location.replace(url.toString());
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>
)
