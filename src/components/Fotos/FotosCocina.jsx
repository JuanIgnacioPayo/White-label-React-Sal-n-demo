import { useLoading } from '../../contexts/LoadingContext';

import styled from "styled-components";
import Slider from "../Slider/Slider";
import React, { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";
import SEO from '../SEO';
import { useSiteContext } from '../../contexts/SiteContext';


export default function FotosCocina() {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);

  const { siteName } = useSiteContext();

  let [inputValue13, setInputValue13] = useState("");
  let [inputValue14, setInputValue14] = useState("");
  let [inputValue15, setInputValue15] = useState("");
  let [inputValue16, setInputValue16] = useState("");
  let [inputValue17, setInputValue17] = useState("");
  let [inputValue209, setInputValue209] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 28;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();


        setInputValue13(targetObject.foto13);
        setInputValue14(targetObject.foto14);
        setInputValue15(targetObject.foto15);
        setInputValue16(targetObject.foto16);
        setInputValue17(targetObject.foto17);

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


  const cocinaImagenes = [inputValue13, inputValue14, inputValue15, inputValue16, inputValue17];

  const data = [

    {
      image: cocinaImagenes

    },
  ];
  return (

    <Section id="servicios">
      <SEO
        title={`Fotos de la Cocina - ${siteName}`}
        description={`Galería de fotos de la cocina de ${siteName}. Nuestras instalaciones gastronómicas de primer nivel.`}
        url="/fotosCocina"
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
