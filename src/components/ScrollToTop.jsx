import { useState, useEffect } from "react";
import styled from "styled-components";
import { FaChevronUp } from "react-icons/fa";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../firebase/firebase";

function ScrollToTop({ isHome, customBottom }) {
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [buttonConfig, setButtonConfig] = useState(null);

  useEffect(() => {
    try {
      const db = getDatabase(app);
      const buttonRef = ref(db, 'floatingButtons/scrollToTopButton');
      const unsubscribe = onValue(buttonRef, (snapshot) => {
        if (snapshot.exists()) {
          setButtonConfig(snapshot.val());
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Error loading ScrollToTop config from Firebase:", e);
    }
  }, []);

  // Auto-hide tooltip after 2 seconds (especially for mobile)
  useEffect(() => {
    let timer;
    if (isHovered) {
      timer = setTimeout(() => {
        setIsHovered(false);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isHovered]);


  useEffect(() => {
    let ticking = false;

    const toggleVisibility = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const shouldBeVisible = window.pageYOffset > 100;
          setVisible(prevVisible => {
            if (prevVisible !== shouldBeVisible) return shouldBeVisible;
            return prevVisible; // Avoid unnecessary re-renders
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  if (buttonConfig && buttonConfig.isVisible === false) {
    return null;
  }

  const parseCssUnit = (val, fallback) => {
    if (val === undefined || val === null || val === '') return fallback;
    const str = String(val).trim();
    if (/^-?\d+(\.\d+)?$/.test(str)) return `${str}px`;
    return str;
  };

  const bottomPos = parseCssUnit(buttonConfig?.styles?.bottom, customBottom ? customBottom : "10px");
  const rightPos = parseCssUnit(buttonConfig?.styles?.right, "0px");
  const bgColor = buttonConfig?.buttonColor || null;
  const tooltipText = buttonConfig?.tooltip || "Volver arriba";
  const iconUrl = buttonConfig?.icon || null;

  return (
    <Div $bottom={bottomPos} $right={rightPos} $bgColor={bgColor}>
      <a 
        href="#" 
        className={`${visible ? "block" : "none"}`}
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {iconUrl ? (
          <img src={iconUrl} alt={tooltipText} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textShadow: '0px 1px 4px rgba(0,0,0,0.9)' }}>arrow_upward</span>
        )}
        {isHovered && visible && (
          <Tooltip>{tooltipText}</Tooltip>
        )}
      </a>
    </Div>
  );
}


const Tooltip = styled.span`
  position: absolute;
  right: calc(100% + 15px);
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--card-grey, #f5f5f5);
  color: var(--primary-text, #333);
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'product_sansregular', sans-serif;
  font-size: 13px;
  line-height: 1.4;


  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 101;
  border: 1px solid var(--border-color, #eee);
  animation: tooltipFadeIn 0.3s ease;

  @keyframes tooltipFadeIn {
    from { opacity: 0; transform: translateY(-50%) translateX(10px); }
    to { opacity: 1; transform: translateY(-50%) translateX(0); }
  }
`;


const Div = styled.div`

  max-width: 100vw;
  .none {
    opacity: 0;
    visibility: hidden;
  }
  a {
    position: fixed;
    bottom: ${props => props.$bottom};
    right: ${props => props.$right};
    background-color: var(--primary-color);
    padding: 0;
    width: 3.3rem;
    height: 3.3rem;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.2s ease-in-out;
    z-index: 100;
    box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
    svg {
      color: var(--white-text, #ffffff);
      font-size: 1.3rem;
      filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.6));
    }
    @media screen and (min-width: 280px) and (max-width: 1080px) {
      position: fixed;
      right: ${props => props.$right};
      bottom: ${props => props.$bottom};
    }
  }
  :hover{
    filter: brightness(110%);
    border-radius: 23px;
    transform: scale(0.95);  
  }
`;

export default ScrollToTop;
