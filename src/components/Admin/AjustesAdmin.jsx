import React, { useState } from 'react';
import styled from 'styled-components';
import Configuracion from "../FormsYToggles/ToggleConfiguracion";
import ThemeSettings from "../FormsYToggles/ThemeSettings";

const AjustesAdmin = () => {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <Container>
            <TabHeader>
                <TabButton
                    active={activeTab === 'general'}
                    onClick={() => setActiveTab('general')}
                >
                    General
                </TabButton>
                <TabButton
                    active={activeTab === 'colores'}
                    onClick={() => setActiveTab('colores')}
                >
                    Colores (Apariencia)
                </TabButton>
            </TabHeader>

            <div style={{ marginTop: '1rem' }}>
                {activeTab === 'general' && <Configuracion />}
                {activeTab === 'colores' && <ThemeSettings />}
            </div>
        </Container>
    );
};

export default AjustesAdmin;

// Styles
const Container = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const TabHeader = styled.div`
  display: flex;
  gap: 1rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
`;

const TabButton = styled.button`
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-bottom: 3px solid ${props => props.active ? 'var(--primaryColor, #b0aa6d)' : 'transparent'};
  color: ${props => props.active ? 'var(--primaryText, #333)' : '#888'};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--primaryText, #333);
  }
`;
