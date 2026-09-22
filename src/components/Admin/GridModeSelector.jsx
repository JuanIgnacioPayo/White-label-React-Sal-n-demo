import React from 'react';
import styled from 'styled-components';

const ButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap; /* Allow buttons to wrap to the next line if space is limited */
  gap: 10px; /* Space between buttons */
  margin-bottom: 1rem;
  font-family: 'product_sansregular';
  justify-content: center; /* Center buttons horizontally */
  width: 100%; /* Ensure it takes full width */
`;

const GridButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid ${({ $isSelected }) => ($isSelected ? 'var(--primary-color)' : '#ccc')};
  background-color: ${({ $isSelected }) => ($isSelected ? '#e6f7ff' : 'white')};
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
  min-width: 80px; /* Adjust as needed */
  height: 100px; /* Adjust as needed, slightly taller than wide */
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: var(--primary-color);
    background-color: #f0f8ff;
  }
`;

const OptionImage = styled.img`
  width: 48px; /* Larger image size */
  height: 48px;
  margin-bottom: 5px;
`;

const GridModeSelector = ({ value, options, onChange }) => {
  return (
    <ButtonContainer>
      {options.map((option) => (
        <GridButton
          key={option.value}
          onClick={() => onChange(option.value)}
          $isSelected={option.value === value}
        >
          <OptionImage src={option.image} alt={option.label} />
          <span>{option.label}</span>
        </GridButton>
      ))}
    </ButtonContainer>
  );
};

export default GridModeSelector;