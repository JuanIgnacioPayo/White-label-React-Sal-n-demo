import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SmartUploadModal from './SmartUploadModal';
import { useAuth } from '../../contexts/authContext';

const DropzoneWrapper = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(76, 175, 80, 0.85);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: ${props => (props.$isDragActive ? 1 : 0)};
  pointer-events: ${props => (props.$isDragActive ? 'all' : 'none')};
  transition: opacity 0.2s ease-in-out;
  backdrop-filter: blur(4px);

  h2 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  p {
    font-size: 1.2rem;
    opacity: 0.9;
  }
`;

const GlobalDropzone = ({ children }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userLoggedIn } = useAuth();

  useEffect(() => {
    if (!userLoggedIn) return;

    let dragCounter = 0;

    const handleDragEnter = (e) => {
      if (window.location.search.includes('panel=gestor_credenciales') || window.location.search.includes('panel=testimonios')) return;
      const hasFiles = e.dataTransfer.types && (e.dataTransfer.types.includes("Files") || e.dataTransfer.types.includes("application/pdf"));
      if (!hasFiles) return;
      
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      setIsDragActive(true);
    };

    const handleDragOver = (e) => {
      if (window.location.search.includes('panel=gestor_credenciales') || window.location.search.includes('panel=testimonios')) return;
      const hasFiles = e.dataTransfer.types && (e.dataTransfer.types.includes("Files") || e.dataTransfer.types.includes("application/pdf"));
      if (!hasFiles) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
      if (window.location.search.includes('panel=gestor_credenciales') || window.location.search.includes('panel=testimonios')) return;
      const hasFiles = e.dataTransfer.types && (e.dataTransfer.types.includes("Files") || e.dataTransfer.types.includes("application/pdf"));
      if (!hasFiles) return;

      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragActive(false);
      }
    };

    const handleDrop = (e) => {
      if (window.location.search.includes('panel=gestor_credenciales') || window.location.search.includes('panel=testimonios')) return;
      const hasFiles = e.dataTransfer.types && (e.dataTransfer.types.includes("Files") || e.dataTransfer.types.includes("application/pdf"));
      if (!hasFiles) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      dragCounter = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        setDroppedFiles(files);
        setIsModalOpen(true);
      }
    };

    const handlePaste = (e) => {
      const isConfigPanel = window.location.search.includes('panel=gestor_credenciales') || window.location.search.includes('panel=testimonios');
      if (isConfigPanel) return;
      // Ignorar si el usuario está escribiendo en un input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        const files = Array.from(e.clipboardData.files);
        
        // Renombrar las imágenes del portapapeles porque suelen llamarse solo "image.png"
        const processedFiles = files.map(file => {
            if (file.type.startsWith('image/')) {
                const extension = file.type.split('/')[1] || 'png';
                const d = new Date();
                const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
                return new File([file], `Captura_${stamp}.${extension}`, { type: file.type });
            }
            return file;
        });

        setDroppedFiles(processedFiles);
        setIsModalOpen(true);
      }
    };

    // Use capture phase (true) to intercept events before any child component can stopPropagation
    window.addEventListener('dragenter', handleDragEnter, true);
    window.addEventListener('dragover', handleDragOver, true);
    window.addEventListener('dragleave', handleDragLeave, true);
    window.addEventListener('drop', handleDrop, true);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter, true);
      window.removeEventListener('dragover', handleDragOver, true);
      window.removeEventListener('dragleave', handleDragLeave, true);
      window.removeEventListener('drop', handleDrop, true);
      window.removeEventListener('paste', handlePaste);
    };
  }, [userLoggedIn]);

  if (!userLoggedIn) {
    return <>{children}</>;
  }

  return (
    <DropzoneWrapper>
      <Overlay $isDragActive={isDragActive}>
        <h2>📥 Soltar archivo aquí</h2>
        <p>Lo analizaremos y organizaremos inteligentemente en tu Drive</p>
      </Overlay>
      
      {children}

      {isModalOpen && (
        <SmartUploadModal 
          files={droppedFiles} 
          onClose={() => {
            setIsModalOpen(false);
            setDroppedFiles([]);
          }} 
        />
      )}
    </DropzoneWrapper>
  );
};

export default GlobalDropzone;
