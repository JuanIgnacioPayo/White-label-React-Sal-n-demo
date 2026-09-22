import styled from "styled-components";
import { BsFillStarFill} from "react-icons/bs";
import { useState, useEffect } from "react";
import { app } from "../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";


export default function Calificaciones() {

  let [inputValue1, setInputValue1] = useState("0"); // cantidad_calificaciones_facebook - valor por defecto 0
  let [inputValue2, setInputValue2] = useState("0"); // cantidad_calificaciones_google - valor por defecto 0
  let [inputValue3, setInputValue3] = useState("0.0"); // estrellas_facebook - valor por defecto 0.0
  let [inputValue4, setInputValue4] = useState("0.0"); // estrellas_google - valor por defecto 0.0
  let [inputValue5, setInputValue5] = useState("#"); // link_facebook - valor por defecto #
  let [inputValue6, setInputValue6] = useState("#"); // link_google - valor por defecto #
  let [inputValue7, setInputValue7] = useState("#"); // link_encuesta_anonima (no usado en este componente)
  let [inputValue8, setInputValue8] = useState(""); // link_imagen_facebook
  let [inputValue9, setInputValue9] = useState(""); // link_imagen_Maps
  let [inputValue10, setInputValue10] = useState(""); // link_imagen_encuesta_anonima (no usado en este componente)
  let [inputValue11, setInputValue11] = useState("Nuestras Calificaciones"); // contenido30 (título de la sección)
  let [inputValue12, setInputValue12] = useState("#"); // link_facebook_reviews (no usado en este componente)
  let [inputValue13, setInputValue13] = useState("Google"); // nombre_red_1 (Google)
  let [inputValue14, setInputValue14] = useState("Facebook"); // nombre_red_2 (Facebook)


useEffect(() => {
  const fetchData = async () => {
    const db = getDatabase(app);
    let dbURL = "datosId/" + 25;
    const dbRef = ref(db, dbURL);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const targetObject = snapshot.val();
      // Usamos el operador '||' para proporcionar un valor por defecto si el dato de Firebase es undefined o null
      setInputValue1(targetObject.cantidad_calificaciones_facebook || "0");
      setInputValue2(targetObject.cantidad_calificaciones_google || "0");
      setInputValue3(targetObject.estrellas_facebook || "0.0");
      setInputValue4(targetObject.estrellas_google || "0.0");
      setInputValue5(targetObject.link_facebook || "#");
      setInputValue6(targetObject.link_google || "#");
      setInputValue7(targetObject.link_encuesta_anonima || "#");
      setInputValue8(targetObject.link_imagen_facebook || ""); // Las imágenes vacías son preferibles a valores por defecto si no existen
      setInputValue9(targetObject.link_imagen_Maps || "");
      setInputValue10(targetObject.link_imagen_encuesta_anonima || "");
      setInputValue12(targetObject.link_facebook_reviews || "#");
      setInputValue13(targetObject.nombre_red_1 || "Google");
      setInputValue14(targetObject.nombre_red_2 || "Facebook");
  
    } else {
      console.log("Error: datosId/25 no encontrado en Firebase.");
      // Puedes establecer aquí valores por defecto para todos los inputs si la rama no existe
    }
  }
  fetchData();
}, []);

useEffect(() => {
  const fetchData = async () => {
    const db = getDatabase(app);
    let dbURL = "datosId/" + 29;
    const dbRef = ref(db, dbURL);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const targetObject = snapshot.val();
      setInputValue11(targetObject.contenido30 || "Nuestras Calificaciones"); // Valor por defecto
      
    } else {
      console.log("Error: datosId/29 no encontrado en Firebase.");
      setInputValue11("Nuestras Calificaciones"); // Asegura que el título siempre tenga un valor
    }
  }
  fetchData();
}, []);

  const data = [
       {
      // Segunda tarjeta (Facebook)
      image: inputValue8, // Imagen de Facebook
      title: inputValue14, // Nombre de la red 2 (Facebook)
      stars: inputValue3, // Estrellas de Facebook
      reviews: inputValue1 + " opiniones", // Cantidad de calificaciones de Facebook
      link: inputValue5 // Link de Facebook
    },
    {
      // Primera tarjeta (Google)
      image: inputValue9, // Imagen de Google Maps
      title: inputValue13, // Nombre de la red 1 (Google)
      stars: inputValue4, // Estrellas de Google
      reviews: inputValue2 + " opiniones", // Cantidad de calificaciones de Google
      link: inputValue6 // Link de Google
    }
 
  ];

  return (
    <Section id="calificaciones">
      <h2>{inputValue11}</h2>
      <div className="socials">
        {/* Aquí nos aseguramos de que haya datos antes de mapear */}
        {data.length > 0 && data.map(({ image, title, stars, reviews, link }, index) => {
          // Si la imagen o el título están vacíos, podrías decidir no renderizar esta tarjeta
          // O renderizar una tarjeta "placeholder"
          if (!image && !title) return null; // No renderizar si no hay imagen ni título

          return (
            <div className="social" key={title}>

              <div className="image">
                <a href={link} target="_blank" rel="noreferrer">
                  {/* Si la imagen no se carga, puedes poner una imagen de respaldo o un placeholder */}
                  {image ? (
                    <img src={image || null} alt={title} onError={(e) => { e.target.onerror = null; e.target.src="/path/to/default-icon.png"}} />
                  ) : (
                    <img src="/path/to/default-icon.png"  /> // Asegúrate de tener una imagen de icono por defecto
                  )}
                </a>
              </div>

              <div className="info">
                <a href={link} target="_blank" rel="noreferrer">
                  <div className="details">
                    <h4>{title || "Red Social"}</h4> {/* Valor por defecto para el título */}
                    <span className="review">{reviews || "0 opiniones"}</span> {/* Valor por defecto para reviews */}
                    {/* Renderizado de las estrellas, solo si 'stars' tiene un valor válido que no sea "0.0" o una cadena vacía */}
                    {stars && stars !== "0.0" && (
                      <div className="stars-details">
                          <span className="stars-value">{stars}</span>
                          <div className="reviews-stars">
                              <BsFillStarFill />
                          </div>
                      </div>
                    )}
                  </div>      
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

const Section = styled.section`
  margin-top: 5rem;

  position: relative;
  
  a {
    text-decoration: none;
    color: var(--app-text-color, #000);
    transition: var(--default-transition);
  }
  
  h2 {
    text-align: center;
    align-items: center;
    justify-content: center;
    transform: translateY(-80px);
    font-size: 1.5rem;
    padding-top: 3rem;
    color: var(--app-primary-text-color, var(--primary-color));
    width: 70%;
    margin:auto;
  }
  h4{
    text-align: center;
    align-items: center;
    justify-content: center;
    margin: auto;
    color: var(--primary-text);
    }
  h4:hover{
    color: var(--app-primary-text-color, var(--primary-color));
    transition: var(--default-transition);
  }  
  span{
    color: var(--primary-text);
  }
  span:hover{
    color: var(--app-primary-text-color, var(--primary-color));
    transition: var(--default-transition);
  }  
  .socials {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    text-align: center;
    padding: 0 2rem;

    .social {
      flex-grow: 1;
      max-width: 300px; 
      
      .image {
        img {
          height: 80px;
          width: 80px;
          object-fit: contain;
          display: block;
          margin: 0 auto;
          transition: filter 0.3s ease;
          
        }
        img:hover {
          filter: brightness(110%);
        }
      }
       
      .info{
        border-radius:8px;
        position: static;
        align-items: center;
        text-align: center;
        justify-content:center;
        background-color: var(--white-text);
        display: flex; 
        gap: 0rem;
        padding: 1rem;
        box-shadow: 0 6px 6px 0 var(--secondary-text),0 2px 6px 4px var(--secondary-text); 
        margin: 1.25rem auto 0 auto;
        
        .details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          justify-content: center;
          text-align: center;
          align-items: center;
          margin: auto;
          
          h4, .review, .stars-value { 
            font-size: 1.1rem;
            margin:auto;
            justify-content: center;
            right:0;
            left:0;
            align-items:center;
            text-align:center;
          }
          
          .stars-details { 
            display: flex;
            gap: 0.5rem;
            margin:auto;
            justify-content: center;
            align-items:center;
            text-align:center;
            
            .stars-value { 
              color: var(--primary-text);
              font-size: 1.1rem; 
              line-height: 1; 
            }
            
            .reviews-stars { 
              display: flex;
              align-items: center;
              justify-content: center;
              svg {
                font-size: 1.2rem; 
                color: var(--app-primary-text-color, var(--primary-color));
              }
            }
          }
        }
      }
        
      .info:hover{
        background-color:var(--white-text);
        transition: var(--default-transition);
        box-shadow: 0 3px 3px 0 var(--secondary-text),0 3px 3px 3px var(--secondary-text); 
      }
    }
  }
  
  /* Media query para pantallas pequeñas (móviles) */
  @media screen and (min-width: 280px) and (max-width: 1080px) {
    margin: 0 0rem;
    margin-bottom: 4rem;
    margin-top: 2rem;
    
    h1 {
    width: 70%;
    
    }
    h2 {
      transform: translateY(0px);
      font-size: 1.5rem;
      padding-top: 0rem;
      padding-bottom: 2rem;
      width: 70%;
    }
    .socials {
      padding: 0rem;
      width: 100%;
      flex-direction: column; 
      justify-content:center;
      align-items: center;
      margin: auto;
      gap: 3rem;
      .social {
        padding: 0rem;
        position: relative;
        width: 65%;
        max-width: 280px;
      
        .image {
          margin-bottom: 0.75rem;
          img {
            position: relative;
            width: 70px;
            height: 70px;
            object-fit: contain;
            align-items: center;
            justify-content: center;
            margin: auto;
          }          
        }
        .info {
            width: 100%;
            box-sizing: border-box;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            position: static;
            bottom: auto;
            padding: 1rem;

          .details {
            justify-content: center;
            text-align: center;
            align-items: center;
            margin: auto;
            font-size: 0.7rem;
            
            .stars-details {
              display: flex;
              gap: 0.5rem;
              justify-content: center;
              align-items:center;
              text-align:center;
              
              .stars-value {
                font-size: 0.7rem;
              }
              .reviews-stars {
                svg {
                  font-size: 0.8rem; 
                  color: var(--app-primary-text-color, var(--primary-color));
                }
              }
            }
          }
        }
      }
    }
  }
`;