import { useLoading } from '../contexts/LoadingContext';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import DashboardMonotributo from '../components/DashboardEmpresa/DashboardMonotributo';

export default function DashboardMonotributoPage() {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);

    const navigate = useNavigate();

    return (
        <PageContainer>
            <Header>
                <BackButton onClick={() => navigate('/admin')}>← Volver a Admin</BackButton>
                <Title>Gestión Arca / Monotributo</Title>
            </Header>
            <DashboardMonotributo />
        </PageContainer>
    );
}

const PageContainer = styled.div`
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    font-family: 'Product Sans', sans-serif;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
`;

const Title = styled.h2`
    margin: 0;
    color: var(--primary-color);
`;

const BackButton = styled.button`
    background: none;
    border: none;
    color: #666;
    font-size: 1rem;
    cursor: pointer;
    padding: 0.5rem;
    &:hover { color: var(--primary-color); }
`;
