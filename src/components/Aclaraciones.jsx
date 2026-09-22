
import styled from "styled-components";
import React, { useState, useEffect } from 'react';
import { app } from "../firebase/firebase"
import { getDatabase, ref, get } from "firebase/database";

import EditableField from './EditableField';

export default function Aclaraciones({ isEditable, data, editingField, setEditingField, onSave }) {
  if (!data) {
    return null;
  }



  return (
    <Section id="aclaraciones">
      <div className="info">
        {data.contenido21 && (
          <h2>
            <EditableField
              isEditable={isEditable}
              fieldKey="aclaraciones_title"
              value={data.contenido21}
              editingField={editingField}
              setEditingField={setEditingField}
              onSave={onSave}
              as="span"
            />
          </h2>
        )}
        {data.contenido22 && (
          <EditableField
            isEditable={isEditable}
            fieldKey="aclaraciones_1"
            value={data.contenido22}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
        )}
        {data.contenido23 && (
          <EditableField
            isEditable={isEditable}
            fieldKey="aclaraciones_2"
            value={data.contenido23}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
        )}
        {data.contenido24 && (
          <EditableField
            isEditable={isEditable}
            fieldKey="aclaraciones_3"
            value={data.contenido24}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
        )}
        {data.contenido25 && (
          <EditableField
            isEditable={isEditable}
            fieldKey="aclaraciones_4"
            value={data.contenido25}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
        )}
        {data.contenido26 && (
          <EditableField
            isEditable={isEditable}
            fieldKey="aclaraciones_5"
            value={data.contenido26}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
        )}
        {data.contenido27 && (
          <EditableField
            isEditable={isEditable}
            fieldKey="aclaraciones_6"
            value={data.contenido27}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
        )}
        {data.contenido28 && (
          <EditableField
            isEditable={isEditable}
            fieldKey="aclaraciones_7"
            value={data.contenido28}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
        )}
        {data.contenido29 && (
          <EditableField
            isEditable={isEditable}
            fieldKey="aclaraciones_8"
            value={data.contenido29}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
        )}
      </div>

    </Section>
  );
}

const Section = styled.section`
  margin-top: 2rem;
  display: flex;
  gap: 5rem;
  flex-direction: column;
  h2 {
      span {
        color: var(--app-primary-text-color, var(--primary-color));      
        font-size: 1.5rem;
      }
    }
  .info {

    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    align-items: center;
    margin:auto;
    gap: 2rem;
  

    
    h3 {
      font-size: 1.15rem;
      text-align: center;
      span {
        color: var(--app-primary-text-color, var(--primary-color));      

      }
    }
    p {
    
      font-size: 1rem;
      text-align: center;
      color: var(--primary-text, #160529);
      justify-content: center;
    }
  }
  
  @media screen and (min-width: 280px) and (max-width: 1080px) {
  
    padding-top: 0rem;
    margin: auto;
    flex-direction: column;
    gap: 3rem;
    width: 70%;
    
    .info {
    
      p {
      
        text-align: center;
        color: var(--primary-text, #160529);
      }
    }
  }  
`
