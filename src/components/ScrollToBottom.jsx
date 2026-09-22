import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaChevronDown } from "react-icons/fa";

function ScrollToBottom() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show if we are NOT near the bottom
      const scrolledToBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      setVisible(!scrolledToBottom);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToBottom = (e) => {
    e.preventDefault();
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <Div>
      <a href="#" onClick={scrollToBottom} className={`${visible ? "block" : "none"}`}>
        <FaChevronDown />
      </a>
    </Div>
  );
}

const Div = styled.div`
  max-width: 100vw;
  .none {
    opacity: 0;
    visibility: hidden;
  }
  a {
    position: fixed;
    bottom: 25px; /* Below the ScrollToTop button */
    right: 25px; /* Aligned with ScrollToTop */
    background-color: var(--app-primary-text-color, var(--primary-color));
    padding: 0; /* Removing padding to use width/height centering */
    width: 3.3rem;
    height: 3.3rem;
    border-radius: 50%; /* Perfect circle */
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.2s ease-in-out;
    z-index: 99;
    box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
    color: white;
    
    svg {
      color: var(--white-text, white);
      font-size: 1.3rem;
    }

    @media screen and (min-width: 280px) and (max-width: 1080px) {
      position: fixed;
      right: 10px;
      bottom: 210px;
    }
  }

  a:hover {
    filter: brightness(110%);
    border-radius: 23px;
    transform: scale(0.95);  
  }
`;

export default ScrollToBottom;
