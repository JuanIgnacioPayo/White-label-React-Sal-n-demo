import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ progress }) => (
  <div className="spinner-container">
    <div className="spinner"></div>
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
    </div>
    <span className="progress-text">{Math.round(progress)}%</span>
  </div>
);

export default LoadingSpinner;
