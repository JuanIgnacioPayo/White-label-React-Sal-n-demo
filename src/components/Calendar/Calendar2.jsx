import Calendar from "./Calendar.jsx";
import styled from "styled-components";
import { useState, useEffect } from "react";
import { app } from "../../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";

export default function Calendar2() {
  let [inputValue1, setInputValue1] = useState("");
  let [inputValue209, setInputValue209] = useState("");
  
  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 29;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setInputValue1(targetObject.contenido2);



      } else {
        console.log("error en precios")
      }
    }
    fetchData();
  }, [29])

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
    return (
      <Section id="calendario">
        <div className="tooltip">
        <a href="/" className="botonReturn">
          <img className="imagen_volver" src={inputValue209}  />
          <span className="tooltiptext">Volver a la página principal</span>

        </a>
      </div>
      <div >
        <h1>Calendario</h1>
        <h2 >{inputValue1}</h2>
        <Calendar />
      </div>
      </Section>
    );
  };
  
const Section = styled.section`

width: 100%;
margin: auto;

h1{
text-align: center;
align-items: center;
margin:auto;
position: relative;
left: 0;
right: 0;
font-size:2rem;
}

h2{
width: 80%;
padding-top:1rem;
text-align: center;
align-items: center;
margin:auto;
position: relative;
left: 0;
right: 0;
font-size:1rem;
}

.fc-toolbar h2 {
    font-family: 'product_sansregular';
    font-size: 1.6rem;
    color: var(--primary-text);
    justify-content: center;
    text-align: center;
    width: 100%;
  }
 .botonReturn{
    
        position:fixed;
        top:100px;
        right:25px;
        text-align:center;
        transition: all 300ms ease;
        text-shadow: 2px 2px 5px var(--primary-text);
        
        .imagen_volver{
        
        width:53px;
        height:53px;
        border-radius:20px;
        color:var(--white-text);
        font-size:1.6rem;
        line-height:53px;
        align-items:center;
        background-color: var(--primary-color);
        text-shadow: 2px 2px 5px var(--primary-text);
        box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
        }
        .imagen_volver:hover{
          border-radius:23px;
          
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
 

  @media screen and (min-width: 280px) and (max-width: 1080px) {
  padding-top: 5rem;

    margin:auto;
    height: auto;

     .botonReturn{
  
      position:fixed;
      top:3rem;
      right:5px;
      text-align:center;
      z-index:100;
      transition: all 300ms ease;
      text-shadow: 2px 2px 5px var(--primary-text);
      
      i{
      
      width:53px;
      height:53px;
      border-radius:20px;
      color:white;
      font-size:1.6rem;
      line-height:53px;
      align-items:center;
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
    
  }
  `