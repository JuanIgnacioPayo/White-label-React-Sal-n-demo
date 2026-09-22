import React from 'react';
import styled from 'styled-components';
import HorariosVisita from '../components/HorariosVisita';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import SEO from '../components/SEO';
import { useSiteContext } from '../contexts/SiteContext';

const HorariosPage = () => {
    const navigate = useNavigate();
    const { siteName } = useSiteContext();
    return (
        <PageContainer>
            <SEO
                title={`Horarios de Visita - ${siteName}`}
                description={`Horarios de visita al salón de eventos ${siteName}. Agendá tu visita para conocer nuestras instalaciones.`}
                url="/horarios"
            />
            <div style={{ maxWidth: '600px', width: '90%', margin: '40px auto', display: 'flex', flexDirection: 'column' }}>
                <BackButton onClick={() => navigate('/')}>
                    <FaArrowLeft /> Volver al inicio
                </BackButton>
                <HorariosVisita />
            </div>
            <Footer />
        </PageContainer>
    );
};

export default HorariosPage;

const PageContainer = styled.div` 
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: var(--app-background-color, #f4f6f8);
    padding-top: 80px;
`;



const BackButton = styled.button` 
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: #666;
    font-size: 1rem;
    cursor: pointer;
    margin-bottom: 20px;
    padding: 0;
    font-weight: 500;
    transition: color 0.2s;
    &:hover {
        color: #1B3168;
    }
`;
