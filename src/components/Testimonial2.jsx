import styled from "styled-components";
import { useState, useEffect } from "react";
import { app } from "../firebase/firebase"; // Asegúrate que la ruta sea correcta
import { getDatabase, ref, get } from "firebase/database";

export default function Testimonial() {
  let [inputValue1, setInputValue1] = useState("");
  let [inputValue2, setInputValue2] = useState("");
  let [inputValue3, setInputValue3] = useState(""); // Ahora contendrá la URL de la imagen del testimonio 1
  let [inputValue4, setInputValue4] = useState("");
  let [inputValue5, setInputValue5] = useState("");
  let [inputValue6, setInputValue6] = useState("");
  let [inputValue7, setInputValue7] = useState(""); // Ahora contendrá la URL de la imagen del testimonio 2
  let [inputValue8, setInputValue8] = useState("");
  let [inputValue9, setInputValue9] = useState("");
  let [inputValue10, setInputValue10] = useState("");
  let [inputValue11, setInputValue11] = useState(""); // Ahora contendrá la URL de la imagen del testimonio 3
  let [inputValue12, setInputValue12] = useState("");
  let [inputValue13, setInputValue13] = useState("");
  let [inputValue14, setInputValue14] = useState("");
  let [inputValue15, setInputValue15] = useState("");
  let [inputValue16, setInputValue16] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 25;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setInputValue1(targetObject.link_google);
        setInputValue2(targetObject.link_facebook);
        // Asegúrate que targetObject.testimonio_1 ahora es la URL de la imagen en Firebase
        setInputValue3(targetObject.codigo_embebido_1);
        setInputValue4(targetObject.nombre_testimonio_1);
        setInputValue5(targetObject.red_testimonio_1);
        setInputValue6(targetObject.link_red_testimonio_1);
        // Asegúrate que targetObject.testimonio_2 ahora es la URL de la imagen en Firebase
        setInputValue7(targetObject.codigo_embebido_2);
        setInputValue8(targetObject.nombre_testimonio_2);
        setInputValue9(targetObject.red_testimonio_2);
        setInputValue10(targetObject.link_red_testimonio_2);
        // Asegúrate que targetObject.testimonio_3 ahora es la URL de la imagen en Firebase
        setInputValue11(targetObject.testimonio_3);
        setInputValue12(targetObject.nombre_testimonio_3);
        setInputValue13(targetObject.red_testimonio_3);
        setInputValue14(targetObject.link_red_testimonio_3);
      } else {
        console.log("error en datosId/25"); // Mensaje de error más específico
      }
    };
    fetchData();
  }, []); // Removí el '25' de las dependencias, usualmente el array de dependencias es para variables que si cambian, re-ejecutan el efecto. Si es un ID fijo, puede ir vacío para que se ejecute solo al montar.

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 29;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setInputValue15(targetObject.contenido31);
        setInputValue16(targetObject.contenido32);
      } else {
        console.log("error en datosId/29"); // Mensaje de error más específico
      }
    };
    fetchData();
  }, []); // Removí el '29' de las dependencias por la misma razón.

  return (
    <Section id="testimonios">
      <div className="title">
        <h1>{inputValue15}</h1>
      </div>
      <p>{inputValue16}</p>

      <div className="testimonials">

        {/* Testimonio 1 */}
        {inputValue3 && ( // Solo renderiza si inputValue3 (URL de la imagen) existe
          <a href={inputValue6} target="_blank" rel="noreferrer">
            <div className="testimonial">
              <div className="info-container"> {/* Contenedor para la imagen y la info */}
                {inputValue3 && <img 
                  src={inputValue3}
                  
                  className="testimonial-image" 
                />}
                <div className="title"> {/* Mantenemos la info del testimonio */}

                </div>
              </div>
              {/* Si aún quieres mostrar un texto descriptivo corto debajo o junto a la imagen, 
                  puedes añadir otro campo en Firebase para ello y mostrarlo aquí.
                  Si la imagen reemplaza completamente el texto, puedes omitir la siguiente <p>
              */}
              {/* <p className="description">
                { Aquí iría un texto corto si lo necesitas }
              </p> */}
            </div>
          </a>
        )}

        {/* Testimonio 2 */}
        {inputValue7 && ( // Solo renderiza si inputValue7 (URL de la imagen) existe
          <a href={inputValue10} target="_blank" rel="noreferrer">
            <div className="testimonial">
              <div className="info-container">
                {inputValue7}
                <div className="title">

                </div>
              </div>
              {/* <p className="description"> ... </p> */}
            </div>
          </a>
        )}

        
      </div>
    </Section>
  );
}

const Section = styled.section`
width: 75%;
  margin: auto;
  .title { // Estilo para el título principal de la sección
    display: flex;
    justify-content: center;
    padding-bottom: 0.5rem;
    
    h1 {
      text-align: center;
      font-size: 1.5rem;
      width: 70%;
      color: var(--app-primary-text-color, var(--primary-color));
    }
  }
   p { // Estilo para el párrafo descriptivo de la sección
    color: var(--primary-text);
    text-align: center;
    margin-bottom: 1rem;
    margin-right: auto;
    margin-left: auto;
    font-size: 1rem;
    width: 90%;
  }
  .testimonials {
    display: grid;
    grid-template-columns: repeat(2, 2fr);
    gap: 2rem; /* Reducido un poco el gap para compensar si las imágenes son grandes */
    justify-content: center;
    margin: auto;
    width: 50%;
    
    a {
      text-decoration: none;
      color: var(--primary-text); 
      width: 100%; /* Asegura que el enlace ocupe todo el ancho del testimonio */
    }
    .testimonial {
      background-color: var(--card-grey);
      border-radius: 8px;
      box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
      padding: 1rem; /* Ajustado el padding */
      height: 100%;
       max-width: 75%;
        margin-left:auto;
        margin-right:auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem; /* Reducido el gap interno */
      border-top: 0.5rem solid var(--app-primary-text-color, var(--primary-color));
      
      .info-container { /* Nuevo contenedor para imagen e info */
        display: flex;
        flex-direction: column;
        align-items: center; /* Centra la imagen y el texto debajo */
        gap: 0.5rem;
        max-width: 25%;
        margin-left:auto;
        margin-right:auto;
      }

      .testimonial-image {
        width: 100%; /* La imagen ocupa todo el ancho del contenedor */

        object-fit: cover; /* Asegura que la imagen cubra el espacio sin deformarse */
        border-radius: 4px; /* Bordes redondeados para la imagen */
        margin-bottom: 0.5rem; /* Espacio debajo de la imagen antes del nombre/red */
      }

      .title { // Estilo para el contenedor del nombre y red del testimonio
        display: flex; /* Cambiado a flex para alinear .info */
        flex-direction: column; /* Apila h3 y span verticalmente */
        gap: 0.25rem; /* Espacio menor entre h3 y span */
        justify-content: center;
        align-items: center; /* Centra el texto */
        text-align: center; /* Centra el texto por si acaso */

        h3 {
          font-size: 1rem; /* Tamaño original */
          margin: 0; /* Remueve margen por defecto del h3 */
        }
        .info {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 50%; /* Asegura que ocupe todo el ancho disponible */
          span {
            font-size: 0.9rem; /* Un poco más pequeño */
            color: var(--app-primary-text-color, var(--primary-color));
          }
        }
      }
      /* Si ya no usas la clase .description para texto, puedes eliminarla o ajustarla.
        Si la imagen reemplaza al texto, la clase .description como estaba antes no es necesaria aquí.
      */
      /* .description {
        font-size: 1.0rem;
        line-height: 1.3rem;
      } */
        
    } :hover {
      background-color: var(--white-text);
      transition: var(--default-transition);
    }   
    padding-top: 1.5rem;
    padding-bottom: 2rem;
  }

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    // El title de la sección ya está definido arriba, estos gap y padding son ambiguos aquí.
    // gap: 0rem; 
    // padding: 0rem; 
    > p { // Para el párrafo descriptivo de la sección
      padding: 0rem;
      width: 80%;
    }
    .testimonials {
      gap: 2rem;
      grid-template-columns: repeat(2, 1fr);
      margin: auto;
      width: 85%; // Un poco más de ancho en móvil
      // object-fit: content; // object-fit es para imágenes o videos, no para contenedores grid
      .testimonial {
        gap: 0.5rem; // Gap interno del testimonio
        padding: 0.75rem; // Padding un poco menor en móvil

        .testimonial-image {
          max-width: 80%; // Quizás un poco más alta en móvil si es una sola columna
        }

        .title { // Estilo para el nombre/red en móvil
          gap: 0.25rem;
          h3 {
            font-size: 0.95rem;
          }
          .info span {
            font-size: 0.85rem;
          }
        }
        /* .description { // Si tuvieras descripción textual
          font-size: 0.9rem;
          line-height: 1.2rem;
          margin: auto;
          width: 100%;
        } */
      }
      padding-bottom: 1rem; // Reducido el padding inferior general de los testimonios
    }
  }
`;