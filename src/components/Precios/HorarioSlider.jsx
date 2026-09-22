import React, { useState, useCallback, useRef, useEffect } from 'react';
import './HorarioSlider.css';

// Constants - MIN_HOUR is now a prop
const MAX_HOUR = 27; // 3 AM next day (24 + 3)

// Helper to format time from decimal to HH:mm format
const formatTime = (decimalHour) => {
  const hour = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hour) * 60);
  return `${String(hour % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const HorarioSlider = ({ initialDuration = 3, initialStartTime = 12, minSelectableDuration = 3, minHour = 8, maxTime = 21, onTimeChange }) => {
  const TOTAL_HOURS = MAX_HOUR - minHour;
  const HOUR_HEIGHT_PX = 40; // Height of one hour in pixels
  const CONTAINER_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT_PX;

  // Helper to convert a Y position (in pixels) to a decimal time
  const pixelsToTime = (y) => {
    const time = minHour + (y / CONTAINER_HEIGHT) * TOTAL_HOURS;
    // Snap to 30-minute intervals
    return Math.round(time * 2) / 2;
  };

  // Helper to convert a decimal time to a Y position (in pixels)
  const timeToPixels = (time) => {
    return ((time - minHour) / TOTAL_HOURS) * CONTAINER_HEIGHT;
  };

  // Update startTime and endTime if initialDuration or initialStartTime props change
  useEffect(() => {
    setStartTime(initialStartTime);
    setEndTime(initialStartTime + initialDuration);
  }, [initialDuration, initialStartTime]);
  const containerRef = useRef(null);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialStartTime + initialDuration);
  const [interaction, setInteraction] = useState({ type: null, offset: 0 }); // type: 'drag', 'resize-top', 'resize-bottom'

  // Update startTime and endTime if initialDuration or initialStartTime props change
  useEffect(() => {
    setStartTime(initialStartTime);
    setEndTime(initialStartTime + initialDuration);
  }, [initialDuration, initialStartTime]);

  const handleMouseDown = useCallback((e, type) => {
    e.preventDefault();
    const containerTop = containerRef.current.getBoundingClientRect().top;
    const startY = e.clientY - containerTop;
    
    let offset = 0;
    if (type === 'drag') {
        const startTimeY = timeToPixels(startTime);
        offset = startY - startTimeY;
    }

    setInteraction({ type, offset });
  }, [startTime]);

  const handleMouseMove = useCallback((e) => {
    if (!interaction.type || !containerRef.current) return;

    const containerTop = containerRef.current.getBoundingClientRect().top;
    let currentY = e.clientY - containerTop;

    // Constrain currentY within the container bounds
    currentY = Math.max(0, Math.min(currentY, CONTAINER_HEIGHT));

    let newStartTime = startTime;
    let newEndTime = endTime;
    const duration = endTime - startTime;

    if (interaction.type === 'drag') {
      const adjustedY = currentY - interaction.offset;
      newStartTime = pixelsToTime(adjustedY);
      newEndTime = newStartTime + duration;
    } else if (interaction.type === 'resize-top') {
      newStartTime = pixelsToTime(currentY);
      // Prevent flipping
      if (newStartTime >= endTime - minSelectableDuration) {
        newStartTime = endTime - minSelectableDuration;
      }
    } else if (interaction.type === 'resize-bottom') {
      newEndTime = pixelsToTime(currentY);
      // Prevent flipping
      if (newEndTime <= startTime + minSelectableDuration) {
        newEndTime = startTime + minSelectableDuration;
      }
    }

    // Enforce maxTime constraint
    if (newEndTime > maxTime) {
      newEndTime = maxTime;
      if (interaction.type === 'drag') {
        newStartTime = newEndTime - duration;
      }
    }
    
    // Enforce minTime (minHour) constraint
    if (newStartTime < minHour) {
        newStartTime = minHour;
        if (interaction.type === 'drag') {
            newEndTime = newStartTime + duration;
        }
    }

    setStartTime(newStartTime);
    setEndTime(newEndTime);

    if (onTimeChange) {
      onTimeChange({ start: newStartTime, end: newEndTime });
    }

  }, [interaction, startTime, endTime, minSelectableDuration, maxTime, onTimeChange]);

  const handleMouseUp = useCallback(() => {
    setInteraction({ type: null, offset: 0 });
  }, []);

  useEffect(() => {
    if (interaction.type) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction.type, handleMouseMove, handleMouseUp]);


  // Generate time labels for the axis
  const timeLabels = [];
  for (let i = minHour; i < MAX_HOUR; i++) {
    timeLabels.push(
      <div key={i} className="time-label" style={{ height: `${HOUR_HEIGHT_PX}px` }}>
        {i % 24}:00
      </div>
    );
  }

  const selectionTop = timeToPixels(startTime);
  const selectionHeight = timeToPixels(endTime) - selectionTop;
  const currentDuration = endTime - startTime;

  return (
    <div className="time-slider-container">
      <div className="time-axis" style={{ height: `${CONTAINER_HEIGHT}px` }}>
        {timeLabels}
      </div>
      <div className="time-slot-wrapper" ref={containerRef} style={{ height: `${CONTAINER_HEIGHT}px` }}>
        <div
          className="selected-time-range"
          style={{ top: `${selectionTop}px`, height: `${selectionHeight}px` }}
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
          <div
            className="resize-handle top"
            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize-top'); }}
          />
          <div className="time-info">
            {formatTime(startTime)} - {formatTime(endTime)}
            <br />
            ({currentDuration.toFixed(1)} hs)
          </div>
          <div
            className="resize-handle bottom"
            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize-bottom'); }}
          />
        </div>
      </div>
    </div>
  );
};

export default HorarioSlider;