import { useLoading } from '../../contexts/LoadingContext';

import styled from "styled-components";
import Slider from "../Slider/Slider";
import React, { useState, useEffect, useRef } from 'react';
import { app } from "../../firebase/firebase";
import { getDatabase, ref, get, update } from "firebase/database";
import { uploadToFirebaseStorage } from '../../utils/storageUpload';
import SEO from '../SEO';
import { useSiteContext } from '../../contexts/SiteContext';


export default function Plano() {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);

  const { siteName } = useSiteContext();

  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);



  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = inputValue31;
    link.download = 'plano.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const downloadURL = await uploadToFirebaseStorage(file);

      const db = getDatabase(app);
      const dbUpdateRef = ref(db, `datosId/31`);

      await update(dbUpdateRef, { foto32: downloadURL });

      setInputValue31(downloadURL); // Update local state
      alert("Imagen actualizada exitosamente!");

    } catch (error) {
      console.error("Error al subir la imagen:", error);
      alert("Error al subir la imagen.");
    } finally {
      setShowMenu(false);
    }
  };



  let [inputValue31, setInputValue31] = useState("");

  let [inputValue209, setInputValue209] = useState("");


  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 28;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();

        setInputValue31(targetObject.foto32);

      } else {
        alert("error UseEffect de form de otros datos");
      }
    }
    fetchData();
  }, [28])

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 25;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setInputValue209(targetObject.link_imagen_volver);



      } else {
        console.log("error en precios")
      }
    }
    fetchData();
  }, [25])




  const plano = [inputValue31];
  const data = [

    {
      image: plano

    },
  ];
  return (
    <Section id="servicios">
      <SEO
        title={`Plano del Salón - ${siteName}`}
        description={`Plano y distribución del salón de eventos ${siteName}. Visualizá la disposición del espacio para tu evento.`}
        url="/Plano"
      />

      <div className="tooltip">
        <a href="/" className="botonReturn">
          <img className="imagen_volver" src={inputValue209} />
          <span className="tooltiptext">Volver a la página principal</span>

        </a>
      </div>
      <div className="servicios">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*"
        />
        {data.map(({ image }) => {
          return (
            <div className="service" onClick={() => setShowMenu(!showMenu)}>
              {showMenu && (
                <div className="menu">
                  <button onClick={handleDownload}>Descargar imagen</button>
                  <button onClick={handleUpload}>Cargar una nueva imagen</button>
                </div>
              )}
              <Slider imagenes={image} />

            </div>
          );
        })}
      </div>
    </Section>
  );
}

const Section = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;

.botonReturn{
  
      position:fixed;
      top:115px;
      right:25px;
      text-align:center;
      z-index:100;
      transition: all 300ms ease;
      text-shadow: 2px 2px 5px var(--primary-text);
      
      .imagen_volver{
      
      width:53px;
      height:53px;
      border-radius:20px;
      color:white;
      font-size:1.6rem;
      line-height:53px;
      align-items:center;
      background-image: linear-gradient( #e02870 20%, #4C57A2 80%);
      text-shadow: 2px 2px 5px var(--primary-text);
      box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
      }

  }
  .botonReturn:hover{
    filter: brightness(130%);
    i{border-radius: 23px;}
  }

      
  .tooltip {
      position: relative;
      background-color: var(--app-text-color, #000);

        
      }
      .tooltip .tooltiptext {
      text-shadow: 0px 0px 0px var(--primary-text);
        padding:1rem;
        visibility: hidden;
        top: -5px;
        right: 105%;
        color: var(--app-text-color, #000);
        height:auto;
        width: 200px; 
        text-align: center;
        align-items: center;
        font-family: 'product_sansregular';
        font-size: 1rem;
        background-color: var(--secondary-text);
        border-radius: 6px;
                /* Position the tooltip */
        position: absolute;
        z-index: 1;
      }

      .tooltip:hover .tooltiptext {
        visibility: visible;
        opacity: 0.85; 
      }
  .menu {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 20;
    background-color: white;
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .menu button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f0f0f0;
    cursor: pointer;
  }
  .servicios {
      display: flex;
      flex-direction: column;
      width: 100%;

      .service {
        width: 100%;
        img {
          display: block;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          height: auto;
          max-height: 80vh; /* Leave some space */
          object-fit: contain; 
        }
        transition: var(--default-transition);
      }
    }

    @media screen and (min-width: 280px) and (max-width: 1080px) {
       /* Fix for mobile specific overrides if any needed, otherwise shared styles work */
       .servicios .service img {
          max-height: 80vh;
          object-fit: cover;
       }
    }

  
`;