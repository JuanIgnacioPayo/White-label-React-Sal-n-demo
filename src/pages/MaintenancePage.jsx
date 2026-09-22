import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaTools } from 'react-icons/fa';
import { useLoading } from '../contexts/LoadingContext';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../firebase/firebase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--app-background-color, #ffffff);
  background-image: ${props => props.$bgImage ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${props.$bgImage})` : 'none'};
  background-size: cover;
  background-position: center;
  color: ${props => props.$bgImage ? '#ffffff' : 'var(--primary-text, #333333)'};
  text-align: center;
  padding: 2rem;
  font-family: 'product_sansregular', sans-serif;
`;

const IconWrapper = styled.div`
  font-size: 5rem;
  color: var(--app-text-color, #5a5a5a);
  margin-bottom: 2rem;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: bold;
`;

const Message = styled.p`
  font-size: 1.2rem;
  max-width: 600px;
  line-height: 1.6;
  color: ${props => props.$hasBg ? '#dddddd' : 'var(--app-text-color, #666666)'};
`;

const HiddenAdminAccess = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  opacity: 0.05;
  cursor: pointer;
  font-size: 1.5rem;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.2;
  }
`;

const MaintenancePage = () => {
  const navigate = useNavigate();
  const { completeTask } = useLoading();
  const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    const fetchImages = async () => {
      const db = getDatabase(app);
      const dbRef = ref(db, "datosId/28");
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.foto1) setBgImage(data.foto1);
        }
      } catch (error) {
        console.error("Error fetching images for maintenance page", error);
      } finally {
        completeTask('app_init');
      }
    };
    
    fetchImages();
  }, [completeTask]);

  return (
    <Container $bgImage={bgImage}>
      <Title>Sitio en Mantenimiento</Title>
      <Message $hasBg={!!bgImage}>
        Estamos realizando mejoras en el sistema para brindarte una mejor experiencia. 
        Volveremos a estar en línea a la brevedad. ¡Gracias por tu paciencia!
      </Message>

      <HiddenAdminAccess onClick={() => navigate('/login')} title="Acceso Administrativo">
        <FaLock />
      </HiddenAdminAccess>
    </Container>
  );
};

export default MaintenancePage;
