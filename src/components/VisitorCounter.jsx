import React from 'react';
import styled from 'styled-components';

const CounterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${({ $isCentered }) => ($isCentered ? 'center' : 'flex-start')};
  padding: 4px 8px;
  border-radius: 8px;
  background-color: transparent;
  font-family: 'product_sans_regular', sans-serif;
  font-size: 12px;
  color: inherit;
  margin-top: 8px;
  margin-left: auto;
  margin-right: auto;
  min-width: 200px; /* Give it some width to make centering apparent */
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const StatRow = styled.div`
  display: flex;
  align-items: center;
  margin: 2px 0;
  margin-left: auto;
  margin-right: auto;
`;

const VisitorCounter = ({ stats }) => {
  const { totalVisits = 0, siteStartDate = '', trainingComplete = false } = stats || {};

  if (!trainingComplete) {
    return null;
  }

  return (
    <CounterWrapper $isCentered={!trainingComplete}>
      {siteStartDate && <StatRow>Sitio activo desde el {siteStartDate}</StatRow>}
      <StatRow>Visitas: {totalVisits.toLocaleString('es-AR')}</StatRow>
    </CounterWrapper>
  );
};

export default VisitorCounter;
