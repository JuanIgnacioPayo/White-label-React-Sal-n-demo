import React, { useEffect, useState, useRef } from 'react';
import './ScrollIndicator.css';

const ScrollIndicator = () => {
  const [opacity, setOpacity] = useState(1);
  const scrollInterval = useRef(null);

  const handleScrollDown = () => {
    const scrollAmount = window.innerWidth <= 768 ? 100 : 35; // Incrementado drásticamente para móvil
    window.scrollBy(0, scrollAmount); // Scroll down
  };

  const handleMouseDown = () => {
    // First, do a single scroll and then start the interval
    handleScrollDown();
    scrollInterval.current = setInterval(() => {
      handleScrollDown();
    }, 1); // Scroll every 10ms
  };

  const handleMouseUp = () => {
    clearInterval(scrollInterval.current);
  };

  const handleMouseLeave = () => {
    clearInterval(scrollInterval.current);
  };

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      // Solo encolamos la actualización si no hay una pendiente
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const viewportHeight = window.innerHeight;
          const totalHeight = document.documentElement.scrollHeight;

          if (totalHeight <= viewportHeight) {
            setOpacity(scrollY > 0 ? 0 : 1);
            ticking = false;
            return;
          }

          const scrollProgress = scrollY / (totalHeight - viewportHeight);

          const fadeStart = 0.0;
          const fadeEnd = 1.0;

          let newOpacity = 1;

          if (scrollProgress > fadeStart) {
            if (scrollProgress < fadeEnd) {
              newOpacity = 1 - ((scrollProgress - fadeStart) / (fadeEnd - fadeStart));
            } else {
              newOpacity = 0;
            }
          }

          setOpacity(Math.max(0, Math.min(1, newOpacity)));
          ticking = false; // Permitimos la siguiente actualización
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearInterval(scrollInterval.current); // Clean up on unmount
    };
  }, []);

  return (
    <div
      className="scroll-indicator"
      style={{ opacity: opacity, cursor: 'pointer' }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseLeave}
    >
      <div className="scroll-arrow"></div>
      <div className="scroll-arrow"></div>
      <div className="scroll-arrow"></div>
    </div>
  );
};

export default ScrollIndicator;
