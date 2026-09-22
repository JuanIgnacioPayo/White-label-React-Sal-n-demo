
import styled from "styled-components";
import React, { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase";
import { getDatabase, ref, set, get } from "firebase/database";

const Section = styled.section`
  width: 100%;
  padding-bottom: 120px;

  li {
    padding-top: 0.5rem;
    font-weight: bold;
  }

  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    color: var(--app-text-color, #000);
  }

  textarea {
    font-family: 'product_sansregular';
    font-size: 1rem;
    vertical-align: middle;
    width: 100%;
    border-radius: 8px;
    padding-left: 0.5rem;
  }

  .red {
    margin-top: 0.1rem;
  }

  .boton {
    padding: 12px 25px;
    background-color: var(--primaryColor, #b0aa6d);
    color: var(--whiteText, #ffffff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: bold;
    transition: background-color 0.3s ease, transform 0.2s ease;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);

    &:hover {
      background-color: var(--primaryText, #111241);
      transform: translateY(-2px);
    }
  }
`;

const FloatingButtonContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
`;

export default function FormAclaraciones() {
  const [inputValue1, setInputValue1] = useState("");
  const [inputValue2, setInputValue2] = useState("");
  const [inputValue3, setInputValue3] = useState("");
  const [inputValue4, setInputValue4] = useState("");
  const [inputValue5, setInputValue5] = useState("");
  const [inputValue6, setInputValue6] = useState("");
  const [inputValue7, setInputValue7] = useState("");
  const [inputValue8, setInputValue8] = useState("");
  const [inputValue9, setInputValue9] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      const dbRef = ref(db, "datosId/29");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setInputValue1(targetObject.contenido21);
        setInputValue2(targetObject.contenido22);
        setInputValue3(targetObject.contenido23);
        setInputValue4(targetObject.contenido24);
        setInputValue5(targetObject.contenido25);
        setInputValue6(targetObject.contenido26);
        setInputValue7(targetObject.contenido27);
        setInputValue8(targetObject.contenido28);
        setInputValue9(targetObject.contenido29);
      } else {
        alert("Error al cargar los datos de Aclaraciones.");
      }
    };
    fetchData();
  }, []);

  const overwriteData = async () => {
    const db = getDatabase(app);
    const dbRef = ref(db, "datosId/29");
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
        const updates = {
            ...snapshot.val(),
            contenido21: inputValue1,
            contenido22: inputValue2,
            contenido23: inputValue3,
            contenido24: inputValue4,
            contenido25: inputValue5,
            contenido26: inputValue6,
            contenido27: inputValue7,
            contenido28: inputValue8,
            contenido29: inputValue9,
        };
        set(dbRef, updates)
            .then(() => {
                alert("Información actualizada correctamente");
            })
            .catch((error) => {
                alert("Error al actualizar la información: " + error.message);
            });
    }
  };

  return (
    <Section>
      <div className="datos">
        <ul>
          <li>
            <label>Título</label>
            <textarea rows="1" className="red" type='text' value={inputValue1} onChange={(e) => setInputValue1(e.target.value)} />
          </li>
          <li>
            <label>Aclaración 1</label>
            <textarea rows="2" className="red" type='text' value={inputValue2} onChange={(e) => setInputValue2(e.target.value)} />
          </li>
          <li>
            <label>Aclaración 2</label>
            <textarea rows="2" className="red" type='text' value={inputValue3} onChange={(e) => setInputValue3(e.target.value)} />
          </li>
          <li>
            <label>Aclaración 3</label>
            <textarea rows="2" className="red" type='text' value={inputValue4} onChange={(e) => setInputValue4(e.target.value)} />
          </li>
          <li>
            <label>Aclaración 4</label>
            <textarea rows="2" className="red" type='text' value={inputValue5} onChange={(e) => setInputValue5(e.target.value)} />
          </li>
          <li>
            <label>Aclaración 5</label>
            <textarea rows="2" className="red" type='text' value={inputValue6} onChange={(e) => setInputValue6(e.target.value)} />
          </li>
          <li>
            <label>Aclaración 6</label>
            <textarea rows="2" className="red" type='text' value={inputValue7} onChange={(e) => setInputValue7(e.target.value)} />
          </li>
          <li>
            <label>Aclaración 7</label>
            <textarea rows="2" className="red" type='text' value={inputValue8} onChange={(e) => setInputValue8(e.target.value)} />
          </li>
          <li>
            <label>Aclaración 8</label>
            <textarea rows="2" className="red" type='text' value={inputValue9} onChange={(e) => setInputValue9(e.target.value)} />
          </li>
        </ul>
      </div>
      <FloatingButtonContainer>
        <button className="boton" onClick={overwriteData}>Guardar cambios</button>
      </FloatingButtonContainer>
    </Section>
  );
}
