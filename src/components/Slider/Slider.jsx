import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from "styled-components";
import { useSwipeable } from "react-swipeable";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { app } from "../../firebase/firebase"; // Import app from firebase

import { getDatabase, ref as dbRef, update } from "firebase/database";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

// Animación de rotación para el spinner
const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Componente Styled para el Spinner
const Spinner = styled.div`
  border: 4px solid var(--primary-color);
  border-left-color: var(--white-text);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${rotate} 1s linear infinite;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  z-index: 2;
  box-sizing: border-box;
  pointer-events: none;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    border-width: 3px;
  }
`;

// --- COMPONENTES EXISTENTES (MODIFICADOS Y SIN MODIFICAR) ---

const slideInLeft = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideOutRight = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
`;

const Container = styled.div`
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center; // Centra el spinner
  position: relative;
  overflow: hidden;
  background-color:  rgba(251, 251, 251, 0);
  border-radius: 12px;
  border: 2px dashed ${({ $isDragging }) => ($isDragging ? 'var(--primary-color)' : 'transparent')}; /* Visual feedback */
`;

const Slide = styled.div`
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  position: absolute;
  top: 0;
  left: 0;
  transition: opacity 0.7s ease-in-out, transform 0.6s ease;
  opacity: ${props => props.$active ? 1 : 0};
  transform: ${props => {
    if (props.$active) return 'translateX(0)';
    if (props.direction === "next") return 'translateX(-100%)';
    return 'translateX(100%)';
  }};
  pointer-events: ${props => (props.$active || props.$isEditable) ? 'auto' : 'none'}; /* Only active slide is clickable, or all if editable */

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
  }
`;

const ArrowButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color:  var(--white-text);
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  ${(props) => (props.direction === "left" ? `left: 0.5rem;` : `right: 0.5rem;`)}

  &:hover {
    background-color:  var(--white-text);
  }

  @media (max-width: 768px) {
    width: 2rem;
    height: 2rem;
    font-size: 1.2rem;
  }
`;

const DotsContainer = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  z-index: 10;
`;

const Dot = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background-color: ${(props) => (props.$active ? 'var(--primary-color)' : 'var(--white-text)')};
  cursor: pointer;
  padding: 0;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--primary-color);
  }
`;

const ImageWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  transition: filter 0.4s ease-out, opacity 0.4s ease-out;
  opacity: ${props => props.$loading ? 0.6 : 1};
  filter: ${props => props.$loading ? 'blur(10px)' : 'none'};
`;

// Este componente manejará la lógica de carga para cada imagen individualmente.
const ImageWithLoader = ({ src, alt, onClick, isEditable }) => {
  const [loading, setLoading] = useState(true);

  // Reseteamos el estado de carga si la imagen (src) cambia.
  useEffect(() => {
    setLoading(true);
  }, [src]);

  return (
    <ImageWrapper>
      {loading && <Spinner style={{ zIndex: 2 }} />}
      <StyledImage
        src={src}
        alt={alt}
        $loading={loading}
        onLoad={() => setLoading(false)}
        style={{ cursor: isEditable ? 'pointer' : 'default' }}
        onClick={onClick}
      />
    </ImageWrapper>
  );
};

const DeleteButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  font-size: 0.8rem;
  cursor: pointer;
  z-index: 11;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: red;
  }
`;

const AddImageButton = styled.button`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 128, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 11;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: green;
  }
`;

const MoveButton = styled.button`
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background-color: rgba(0, 0, 0, 0.7); }
  &:disabled { opacity: 0.3; cursor: default; }
`;

const MoveButtonsContainer = styled.div`
  position: absolute;
  top: 5px;
  left: 5px;
  display: flex;
  gap: 5px;
  z-index: 11;
`;

// --- COMPONENTE PRINCIPAL DEL SLIDER ---

function Slider({ imagenes, isEditable, onFileSelect, cellImageKey, onOpenGallery }) {
  const imagenesValidas = (imagenes || []).filter((img) => typeof img === "string" && img.trim() !== "");
  const cantidad = imagenesValidas.length;

  const [imagenActual, setImagenActual] = useState(0);
  const [animDirection, setAnimDirection] = useState("next");
  const fileInputRef = useRef(null); // New ref for the hidden file input
  const [isDragging, setIsDragging] = useState(false); // New state for drag-and-drop

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const handlePopState = () => {
      if (lightboxOpen) {
        setLightboxOpen(false);
      }
    };
    if (lightboxOpen) {
      window.history.pushState({ lightbox: true }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [lightboxOpen]);

  const openLightbox = (index) => {
    if (isEditable) return;
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    if (window.history.state && window.history.state.lightbox) {
      window.history.back();
    }
  };

  const siguienteImagen = () => {
    setAnimDirection("next");
    setImagenActual((prev) => (prev + 1) % cantidad);
  };

  const anteriorImagen = () => {
    setAnimDirection("prev");
    setImagenActual((prev) => (prev - 1 + cantidad) % cantidad);
  };

  const handleAddImageClick = () => {
    if (isEditable) {
      if (onOpenGallery && cellImageKey) {
        onOpenGallery(cellImageKey);
      } else {
        fileInputRef.current.click();
      }
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0]; // Use event.target.files[0] for direct file input change

    if (!file || !onFileSelect || !cellImageKey) {
      console.log("Slider - handleFileChange: Missing file, onFileSelect, or cellImageKey.");
      return;
    }

    // Call the onFileSelect prop from the parent component to add the image
    onFileSelect(file, cellImageKey, 'add');
    event.target.value = null; // Clear the file input
  };

  const handleDeleteImage = (indexToDelete) => {
    if (isEditable && onFileSelect && cellImageKey) {
      // Call the onFileSelect prop from the parent component to delete the image
      onFileSelect(null, cellImageKey, 'delete', indexToDelete);
      if (imagenActual >= cantidad - 1 && imagenActual > 0) {
        setImagenActual(cantidad - 2); // Adjust current image if the last one was deleted
      }
    }
  };

  const handleReorder = (from, to) => {
    if (isEditable && onFileSelect && cellImageKey) {
      onFileSelect(null, cellImageKey, 'reorder', { from, to });
      // Adjust current image index if the active image is moved
      if (imagenActual === from) {
        setImagenActual(to);
      } else if (imagenActual === to) {
        setImagenActual(from);
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (event) => {
    event.preventDefault(); // Necessary to allow dropping
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    if (isEditable) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (isEditable) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (isEditable && onFileSelect && cellImageKey) {
      const files = Array.from(event.dataTransfer.files);
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          onFileSelect(file, cellImageKey, 'add');
        }
      });
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: siguienteImagen,
    onSwipedRight: anteriorImagen,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  if (cantidad === 0) {
    return (
      <Container
        {...swipeHandlers}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        $isDragging={isDragging}
      >
        {isEditable ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
              borderRadius: '12px',
              cursor: 'pointer',
              border: '2px dashed #ccc',
              color: '#888',
              fontSize: '1.2rem',
              textAlign: 'center',
            }}
            onClick={handleAddImageClick}
          >
            Click para subir imagen o arrastra aquí
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept="image/*"
              multiple // Allow multiple file selection
            />
          </div>
        ) : (
          <p style={{ margin: "auto" }}>No hay imágenes para mostrar.</p>
        )}
      </Container>
    );
  }

  return (
    <Container
      {...swipeHandlers}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      $isDragging={isDragging}
    >
      {isEditable && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*"
          multiple // Allow multiple file selection
        />
      )}
      {/* Las flechas ahora solo se muestran si hay más de una imagen */}
      {cantidad > 1 && (
        <>
          <ArrowButton direction="left" onClick={anteriorImagen}>
            <BsChevronLeft />
          </ArrowButton>
          <ArrowButton direction="right" onClick={siguienteImagen}>
            <BsChevronRight />
          </ArrowButton>
        </>
      )}

      {imagenesValidas.map((imagen, index) => {
        const isActive = imagenActual === index;
        // Preload next and previous images
        const isNeighbor = Math.abs(imagenActual - index) <= 1 || Math.abs(imagenActual - index) >= cantidad - 1;

        return (
          <Slide
            key={index}
            $active={isActive}
            direction={animDirection}
            $isEditable={isEditable}
          >
            {isNeighbor && (
              <ImageWithLoader
                src={imagen}
                alt={`slide-${index}`}
                isEditable={isEditable}
                onClick={() => openLightbox(index)}
              />
            )}
            {isEditable && (
              <>
                <DeleteButton onClick={() => handleDeleteImage(index)}>
                  X
                </DeleteButton>
                {cantidad > 1 && (
                  <MoveButtonsContainer>
                    <MoveButton onClick={() => handleReorder(index, index - 1)} disabled={index === 0} title="Mover a la izquierda">
                      &lt;
                    </MoveButton>
                    <MoveButton onClick={() => handleReorder(index, index + 1)} disabled={index === cantidad - 1} title="Mover a la derecha">
                      &gt;
                    </MoveButton>
                  </MoveButtonsContainer>
                )}
              </>
            )}
          </Slide>
        );
      })}

      {isEditable && (
        <AddImageButton onClick={handleAddImageClick}>+</AddImageButton>
      )}

      {cantidad > 1 && (
        <DotsContainer>
          {imagenesValidas.map((_, index) => (
            <Dot
              key={index}
              $active={imagenActual === index}
              onClick={() => setImagenActual(index)}
            />
          ))}
        </DotsContainer>
      )}

      {lightboxOpen && !isEditable && (
        <Lightbox
          open={lightboxOpen}
          close={closeLightbox}
          index={lightboxIndex}
          slides={imagenesValidas.map(src => ({ src }))}
          plugins={[Zoom]}
          carousel={{ finite: false }}
          render={{
            buttonPrev: imagenesValidas.length <= 1 ? () => null : undefined,
            buttonNext: imagenesValidas.length <= 1 ? () => null : undefined,
          }}
          animation={{ zoom: 300 }}
          controller={{ closeOnBackdropClick: true }}
        />
      )}
    </Container>
  );
}

export default Slider;