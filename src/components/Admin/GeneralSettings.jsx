import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import EditableText from '../EditableText';
import { getDatabase, ref, get, set } from "firebase/database";
import { app } from "../../firebase/firebase";

const AdminSection = styled.div`
  background-color: var(--card-grey);
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-radius: 8px;
  border: 1px solid #ddd;

  h3 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--primary-text);
    padding-bottom: 0.5rem;
    color: var(--primary-text);
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
  }

  input, textarea, select {
    width: 100%;
    padding: 0.8rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 1rem;
    transition: border-color 0.2s;
    font-family: 'product_sansregular';

    &:focus {
      outline: none;
    }
  }
`;

const GeneralSettings = ({ browserTitle, handleSaveField, currentUser }) => {



  return (
    <AdminSection>
      <label>Título del Navegador</label>
      <EditableText
        value={browserTitle}
        onSave={(newValue) => handleSaveField('browser_title', newValue)}
        isEditable={!!currentUser}
      />



    </AdminSection>
  );
};

export default GeneralSettings;
