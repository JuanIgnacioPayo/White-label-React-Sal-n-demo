import styled, { createGlobalStyle } from "styled-components";
import React, { useState, useEffect, useRef } from 'react';
import { app } from "../../firebase/firebase"
import { getDatabase, ref, update, get } from "firebase/database";
import { toast } from 'react-toastify';

const GlobalStyle = createGlobalStyle`
  .form-imagenes {
    max-width: 1000px;
    margin: auto;
    top: 0rem;
    padding: 1rem;
    padding-bottom: 120px; /* Added padding for floating buttons */
    background-color:var(--card-grey);
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: 'product_sansregular';
    margin-top: 0rem;
  }

  .form-imagenes h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .imagen-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .row label {
    flex: 1 1 150px;
    display: flex;
    flex-direction: column;
    font-weight: bold;
    color: #555;
    font-size: 0.9rem;
  }

  .row input,
  .row textarea {
    padding: 0.5rem;
    font-size: 0.95rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    width: 100%;
    font-family: 'product_sansregular';
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  button {
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
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .red {
    width: 80%;
  }

  .input-with-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .image-preview {
    max-width: 80%;
    display: block;
    margin: auto;
    margin-top: 10px;
  }

  button:hover {
    background-color: var(--primaryText, #111241);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }
`;

const FloatingButtonContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
`;

export default function FormImagenes(props) {
  let [inputValuePlano, setInputValuePlano] = useState("");

  const imageRefs = {
    planoRef: useRef(null),
  };

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + props.toggle;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setInputValuePlano(targetObject.foto32);
      } else {
        console.log("Attempting to show error toast for useEffect.");
        toast.error("Error al cargar datos de imágenes.");
      }
    }
    fetchData();
  }, [props.toggle])

  const overwriteData = async () => {
    let dbURL = "datosId/" + props.toggle;
    const db = getDatabase(app);
    const newDocRef = ref(db, dbURL);
    try {
      await update(newDocRef, {
        foto32: inputValuePlano
      });
      console.log("Attempting to show success toast for overwriteData.");
      toast.success("Información actualizada correctamente");
    } catch (error) {
      console.error("error en FormOtrosDatos ", error);
      console.log("Attempting to show error toast for overwriteData.");
      toast.error("Error al actualizar: " + error.message);
    }
  }

  return (
    <>
      <GlobalStyle />
      <div className="form-imagenes">
        <h2>Imagen del plano</h2>
        <div className="imagen-card">
          <ul>
            <li key="Plano">
              <label className="etiqueta">

                <div className="input-with-preview">
                  <textarea rows="1" className="red" type='text' value={inputValuePlano} onChange={(e) => setInputValuePlano(e.target.value)} />
                  {inputValuePlano && (
                    <img
                      ref={imageRefs.planoRef}
                      src={inputValuePlano}
                      className="image-preview"
                    />
                  )}
                </div>
              </label>
            </li>
          </ul>
        </div>
      </div>
      <FloatingButtonContainer>
        <button className="boton" onClick={overwriteData}>Guardar cambios</button>
      </FloatingButtonContainer>
    </>
  );
}
