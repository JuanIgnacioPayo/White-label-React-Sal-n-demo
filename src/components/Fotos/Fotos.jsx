import { useLoading } from '../../contexts/LoadingContext';
import styled from "styled-components";
import Slider from "../Slider/Slider";
import React, { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";
import SEO from '../SEO';
import { useSiteContext } from '../../contexts/SiteContext';


export default function Fotos() {
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
  let [inputValue13, setInputValue13] = useState("");
  let [inputValue14, setInputValue14] = useState("");
  let [inputValue15, setInputValue15] = useState("");
  let [inputValue16, setInputValue16] = useState("");
  let [inputValue17, setInputValue17] = useState("");
  let [inputValue18, setInputValue18] = useState("");
  let [inputValue19, setInputValue19] = useState("");
  let [inputValue20, setInputValue20] = useState("");
  let [inputValue21, setInputValue21] = useState("");
  let [inputValue22, setInputValue22] = useState("");
  let [inputValue23, setInputValue23] = useState("");
  let [inputValue24, setInputValue24] = useState("");
  let [inputValue25, setInputValue25] = useState("");
  let [inputValue26, setInputValue26] = useState("");
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
        setInputValue13(targetObject.foto13);
        setInputValue14(targetObject.foto14);
        setInputValue15(targetObject.foto15);
        setInputValue16(targetObject.foto16);
        setInputValue17(targetObject.foto17);
        setInputValue18(targetObject.foto18);
        setInputValue19(targetObject.foto19);
        setInputValue20(targetObject.foto20);
        setInputValue21(targetObject.foto21);
        setInputValue22(targetObject.foto22);
        setInputValue23(targetObject.foto23);
        setInputValue24(targetObject.foto24);
        setInputValue25(targetObject.foto25);
        setInputValue26(targetObject.foto26);


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

  const fotos = [inputValue2, inputValue3, inputValue4, inputValue5, inputValue6, inputValue7, inputValue8, inputValue9, inputValue10, inputValue11, inputValue12, inputValue13, inputValue14, inputValue15, inputValue16, inputValue17, inputValue18, inputValue19, inputValue20, inputValue21, inputValue22, inputValue23, inputValue24, inputValue25, inputValue26];
  const data = [

    {
      image: fotos

    },
  ];
  return (
    <Section id="servicios">
      <SEO
        title={`Fotos - ${siteName}`}
        description={`Galería de fotos de ${siteName}. Conocé nuestras instalaciones, salón, cocina y espacios para tu evento.`}
        url="/fotos"
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