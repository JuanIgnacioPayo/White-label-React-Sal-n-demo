import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getStorage, ref as storageRef, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '../../firebase/firebase';
import { FaTrash } from 'react-icons/fa';

const ManagerContainer = styled.div`
  padding: 20px;
  background: var(--app-background-color);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  color: var(--primary-text);
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const ImageCard = styled.div`
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #c82333;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
  color: #666;
`;

export default function GalleryManager() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const storage = getStorage(app);
      const uploadsRef = storageRef(storage, 'uploads');
      const res = await listAll(uploadsRef);
      
      const loadedImages = await Promise.all(
        res.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            url,
            ref: itemRef,
            fullPath: itemRef.fullPath
          };
        })
      );
      
      setImages(loadedImages);
    } catch (error) {
      console.error("Error cargando imágenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (image) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta imagen de forma permanente?")) {
      return;
    }

    try {
      const storage = getStorage(app);
      const imageRef = storageRef(storage, image.fullPath);
      await deleteObject(imageRef);
      
      setImages(prev => prev.filter(img => img.fullPath !== image.fullPath));
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
      alert("Hubo un error al eliminar la imagen.");
    }
  };

  if (loading) {
    return (
      <ManagerContainer>
        <h2>Gestor de Galería</h2>
        <LoadingText>Cargando imágenes...</LoadingText>
      </ManagerContainer>
    );
  }

  return (
    <ManagerContainer className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Gestor de Galería</h2>
        <span>{images.length} imágenes encontradas</span>
      </div>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Aquí puedes visualizar todas las imágenes subidas a la plataforma y eliminar las que ya no necesites.
      </p>

      {images.length === 0 ? (
        <LoadingText>No hay imágenes en la galería.</LoadingText>
      ) : (
        <GalleryGrid>
          {images.map((img) => (
            <ImageCard key={img.fullPath}>
              <img src={img.url} alt="Gallery item" loading="lazy" />
              <DeleteButton onClick={() => handleDelete(img)} title="Eliminar imagen">
                <FaTrash size={14} />
              </DeleteButton>
            </ImageCard>
          ))}
        </GalleryGrid>
      )}
    </ManagerContainer>
  );
}
