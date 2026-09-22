
import React, { useEffect } from 'react';
import styled from 'styled-components';

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${props => props.$backdropColor || 'rgba(0, 0, 0, 0.5)'};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  
`;

const ModalContent = styled.div`
  background-color: var(--app-background-color);
  padding: 2rem;
  border-radius: 24px;
  text-align: center;
  color: var(--primary-text);
  max-height: 80vh; /* Limit height to 80% of the viewport height */
  overflow-y: auto; /* Add vertical scroll when content overflows */
  width: 50%; /* Optional: Adjust width for better layout */
  max-width: 600px; /* Optional: Set a max-width for larger screens */

  @media (max-width: 768px) {
    width: 90%; /* Increase width on smaller screens */
  }
`;

export const ModalButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  margin: 0.5rem;
  font-size: 1rem;
  width: 40%;
  font-family: 'product_sansregular';

  &:hover {
    filter: brightness(110%);
  }

  @media (max-width: 768px) {
    width: 80%;
    
  }
`;

export const ModalButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  font-family: 'product_sansregular';
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    
  }
`;

const Modal = ({ isOpen, onClose, children, backdropColor, contentStyle }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    // Only close if the click is directly on the backdrop
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalBackdrop $backdropColor={backdropColor} onClick={handleBackdropClick}>
      <ModalContent style={contentStyle}>
        {children}
      </ModalContent>
    </ModalBackdrop>
  );
};

export default Modal;


