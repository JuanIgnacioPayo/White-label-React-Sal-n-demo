import React from 'react';
import './Toast.css';

export default function Toast({ message, type = 'info' }) {
  // This component no longer manages its own visibility.
  // It is rendered or not rendered by its parent.
  return (
    <div className={`toast toast-${type}`}>
      <p>{message}</p>
      
    </div>
  );
}