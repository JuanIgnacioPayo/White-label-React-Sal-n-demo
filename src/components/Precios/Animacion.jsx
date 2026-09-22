import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../../firebase/firebase";
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: var(--app-background-color, #ffffec);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  flex-direction: column;
  box-sizing: border-box;
  animation: ${fadeIn} 0.2s ease-in;

  .spinner {
    border: 8px solid var(--app-background-color, #ffffec);
    border-top: 12px solid var(--app-background-color, #ffffec);
    border-left: 12px solid var(--app-background-color, #ffffec);
    border-right: 12px solid var(--primary-color, #948924);
    border-bottom: 12px solid var(--primary-color, #948924);
    border-radius: 100%;
    width: 50px;
    height: 50px;
    animation: spin 1.5s linear infinite;
    box-sizing: border-box;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  p {
    margin-top: 20px;
    font-size: 1.2rem;
    color: var(--primary-text, #160529);
    font-family: 'playlistscript', cursive;
    margin-bottom: 0;
  }
`;

export default function Animacion() {
  const [companyName, setCompanyName] = useState("Salón Magic Eventos");

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      const dbURL = "datosId/29";
      const dbRef = ref(db, dbURL);
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const targetObject = snapshot.val();
          if (targetObject.contenido1) {
            setCompanyName(targetObject.contenido1);
          }
        }
      } catch (error) {
        console.error("Error fetching company name:", error);
      }
    };
    fetchData();
  }, []);

  const content = (
    <LoadingContainer>
      <div className="spinner"></div>
      <p>{companyName}</p>
    </LoadingContainer>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(content, document.body);
  }

  return content;
}