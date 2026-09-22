import { useLoading } from '../../contexts/LoadingContext';

import styled from "styled-components";
import Slider from "../Slider/Slider";
import React, { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";
import SEO from '../SEO';
import { useSiteContext } from '../../contexts/SiteContext';


export default function FotosSalon() {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);

  const { siteName } = useSiteContext();

  let [inputValue2, setInputValue2] = useState("");
  let [inputValue3, setInputValue3] = useState("");
  let [inputValue4, setInputValue4] = useState("");
  let [inputValue5, setInputValue5] = useState("");
  let [inputValue6, setInputValue6] = useState("");
  let [inputValue7, setInputValue7] = useState("");
  let [inputValue8, setInputValue8] = useState("");
  let [inputValue9, setInputValue9] = useState("");
  let [inputValue10, setInputValue10] = useState("");
  let [inputValue11, setInputValue11] = useState("");
  let [inputValue12, setInputValue12] = useState("");
  let [inputValue209, setInputValue209] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 28;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();

        setInputValue2(targetObject.foto2);
        setInputValue3(targetObject.foto3);
        setInputValue4(targetObject.foto4);
        setInputValue5(targetObject.foto5);
        setInputValue6(targetObject.foto6);
        setInputValue7(targetObject.foto7);
        setInputValue8(targetObject.foto8);
        setInputValue9(targetObject.foto9);
        setInputValue10(targetObject.foto10);
        setInputValue11(targetObject.foto11);
        setInputValue12(targetObject.foto12);

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


  const espacioImagenes = [inputValue2, inputValue3, inputValue4, inputValue5, inputValue6, inputValue7, inputValue8, inputValue9, inputValue10, inputValue11, inputValue12];

  const data = [

    {
      image: espacioImagenes

    },
  ];
  return (
    <Section id="servicios">
      <SEO
        title={`Fotos del Salón - ${siteName}`}
        description={`Galería de fotos del salón de ${siteName}. Conocé nuestras instalaciones y decoración para tu próximo evento.`}
        url="/fotosSalon"
      />
      <div className="tooltip">
        <a href="/" className="botonReturn">
          <img className="imagen_volver" src={inputValue209} />
          <span className="tooltiptext">Volver a la página principal</span>

        </a>
      </div>
      <div className="servicios">
        {data.map(({ image }) => {
          return (
            <div className="service" >

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