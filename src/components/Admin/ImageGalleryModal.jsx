import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getStorage, ref as storageRef, listAll, getDownloadURL } from 'firebase/storage';
import { getDatabase, ref as dbRef, get } from 'firebase/database';
import { app } from '../../firebase/firebase';
import { uploadToFirebaseStorage } from '../../utils/storageUpload';
import Modal, { ModalButton, ModalButtonContainer } from '../Modal';

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  grid-auto-rows: max-content;
  align-content: start;
  gap: 15px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  background: rgba(0,0,0,0.02);
  border-radius: 8px;
`;

const ImageWrapper = styled.div`
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  &.selected {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.5);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UploadBox = styled.div`
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px dashed #ccc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f8f9fa;
  transition: all 0.2s ease;
  color: #6c757d;
  font-size: 14px;
  text-align: center;
  padding: 10px;

  &:hover {
    border-color: #007bff;
    color: #007bff;
    background: #e9ecef;
  }

  svg {
    width: 32px;
    height: 32px;
    margin-bottom: 8px;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`;

export default function ImageGalleryModal({ isOpen, onClose, onSelect }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen]);

  const loadImages = async () => {
    setLoading(true);
    setImages([]);
    try {
      const storage = getStorage(app);
      const uploadsRef = storageRef(storage, 'uploads');
      const res = await listAll(uploadsRef);
      
      setLoading(false); // Liberar la interfaz de inmediato
      
      // Cargar las URLs de a poco y actualizar el estado
      res.items.forEach((itemRef) => {
        getDownloadURL(itemRef).then(url => {
          setImages(prev => {
            if (!prev.includes(url)) {
              return [...prev, url];
            }
            return prev;
          });
        }).catch(err => console.warn("Error leyendo URL:", err));
      });
    } catch (error) {
      console.warn("No se pudo leer la carpeta uploads o está vacía:", error);
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const downloadURL = await uploadToFirebaseStorage(file);
      onSelect(downloadURL);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      contentStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <h2 style={{marginTop: 0, marginBottom: '20px', fontSize: '1.5rem', color: '#333'}}>Seleccionar Imagen</h2>
      
      <GalleryGrid>
          <UploadBox onClick={handleUploadClick}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Subir nueva imagen</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{display: 'none'}} 
              accept="image/*"
              onChange={handleFileChange}
            />
          </UploadBox>

          {images.map((url, idx) => (
            <ImageWrapper key={idx} onClick={() => onSelect(url)}>
              <img src={url} alt={`Gallery ${idx}`} loading="lazy" />
            </ImageWrapper>
          ))}
        </GalleryGrid>

      {uploading && (
        <LoadingOverlay>
          Subiendo imagen...
        </LoadingOverlay>
      )}

      <ModalButtonContainer>
        <ModalButton onClick={onClose} secondary>Cancelar</ModalButton>
      </ModalButtonContainer>
    </Modal>
  );
}