import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import EditableField from "./EditableField";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../firebase/firebase";

export default function QuienesSomos({ isEditable, data, editingField, setEditingField, onSave }) {
  const [localData, setLocalData] = useState(data || {});

  useEffect(() => {
    // If data is provided via props, use it.
    if (data) {
      setLocalData(data);
    } else {
      // If no data from props, fetch it from Firebase.
      const db = getDatabase(app);
      const dataRef = ref(db, 'datosId/29');
      get(dataRef).then((snapshot) => {
        if (snapshot.exists()) {
          setLocalData(snapshot.val());
        }
      }).catch((error) => {
        console.error("Error fetching QuienesSomos data:", error);
      });
    }
  }, [data]); // Effect runs when the `data` prop changes.

  const commonEditableProps = { isEditable, editingField, setEditingField, onSave };

  return (
    <Section id="quienessomos">
      <div className="content">
        <div className="title">
          <EditableField as="h2" fieldKey="quienes_somos_1" value={localData?.contenido3} {...commonEditableProps} />
          <EditableField as="p" fieldKey="quienes_somos_2" value={localData?.contenido4} {...commonEditableProps} />
          <EditableField as="p" fieldKey="quienes_somos_3" value={localData?.contenido5} {...commonEditableProps} />
          <EditableField as="p" fieldKey="quienes_somos_4" value={localData?.contenido6} {...commonEditableProps} />
          <EditableField as="p" fieldKey="quienes_somos_5" value={localData?.contenido7} {...commonEditableProps} />
          <EditableField as="p" fieldKey="quienes_somos_6" value={localData?.contenido8} {...commonEditableProps} />
        </div>
      </div>
    </Section>
  );
}

const Section = styled.section`
  .quill-editor-container {
    background-color: white;
    color: black;
    margin-bottom: 1rem;

    .save-button, .cancel-button {
      background-color: var(--primary-color);
      color: white;
      border: none;
      padding: 5px 10px;
      margin-top: 5px;
      margin-right: 5px;
      border-radius: 5px;
      cursor: pointer;
    }
    .cancel-button {
      background-color: #6c757d;
    }
  }
  
  padding-bottom: 4rem;
  padding-top: 2rem;
  display: flex;
  align-items: center;
  width: 100%;
  text-align: center;
  gap: 5rem;
  margin-top: 2rem;
  margin: auto;

  .content {
    margin:auto;
    color: var(--app-text-color, #000);
    
    .title {
      color: var(--primary-text);
      display: block;
      h2 {
        font-size: 1.5rem;
        text-align: center;
        align-items: center;
        color: var(--app-primary-text-color, var(--primary-color));
        padding-bottom: 2rem;
      }
      p {
      
        margin-top: 1rem;
        font-size: 1rem;
        text-align: center;
        align-items: center;
      }
    }   
  }
  @media screen and (min-width: 280px) and (max-width: 1080px) {
    flex-direction: column;
    width: 65%;
    padding-top: 2rem;
    padding-bottom: 2rem;
    .content {
      .title {
        h2{
          margin-left: 0rem;
          font-size: 1.5rem;
          padding-bottom: 1rem;
        }
        p {
          margin-top: 1rem;
          margin-left: 0rem;
          font-size: 1rem;
          text-align: center;
          align-items: center;
          
        }       
      }
    }
  }
`;
