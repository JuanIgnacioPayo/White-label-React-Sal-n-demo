import React, { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase"
import styled from "styled-components";
import { getDatabase, ref, set, get } from "firebase/database";
import { toast } from 'react-toastify';

export default function FormHorarios(props) {

  let [horarioAtencion, setHorarioAtencion] = useState("");
  let [horarioAlquiler, setHorarioAlquiler] = useState("");
  let [inicioTurnoDia, setInicioTurnoDia] = useState(6);
  let [finTurnoDia, setFinTurnoDia] = useState(9);
  let [inicioTurnoNoche, setInicioTurnoNoche] = useState(10);
  let [finTurnoNoche, setFinTurnoNoche] = useState(23);

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + props.toggle;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setHorarioAtencion(targetObject.horario_de_atencion || "");
        setHorarioAlquiler(targetObject.horario_de_alquiler || "");
        setInicioTurnoDia(targetObject.inicioTurnoDia || 6);
        setFinTurnoDia(targetObject.finTurnoDia || 9);
        setInicioTurnoNoche(targetObject.inicioTurnoNoche || 10);
        setFinTurnoNoche(targetObject.finTurnoNoche || 23);
      } else {
        console.log("No data found for this toggle, using default values.");
      }
    }
    fetchData();
  }, [props.toggle])

  const overwriteData = async () => {
    let dbURL = "datosId/" + props.toggle;
    const db = getDatabase(app);
    const newDocRef = ref(db, dbURL);
    try {
      await set(newDocRef, {
        horario_de_atencion: horarioAtencion,
        horario_de_alquiler: horarioAlquiler,
        inicioTurnoDia: Number(inicioTurnoDia),
        finTurnoDia: Number(finTurnoDia),
        inicioTurnoNoche: Number(inicioTurnoNoche),
        finTurnoNoche: Number(finTurnoNoche),
      });
      toast.success("Información actualizada correctamente");
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.error("Error al actualizar: " + error.message);
    }
  }

  return (
    <Section>
      <div className="datos">
        <ul>
          <li>
            <label>
              Horario de atención
              <input className="campoDelInput" type='text' value={horarioAtencion}
                onChange={(e) => setHorarioAtencion(e.target.value)} />
            </label>
          </li>
          <li>
            <label>
              Horario de alquiler
              <input className="campoDelInput" type='text' value={horarioAlquiler}
                onChange={(e) => setHorarioAlquiler(e.target.value)} />
            </label>
          </li>
          <hr />
          {/* <h4>Turno Día</h4>
          <li>
            <label>
              Inicio Turno Día (hora 0-23)
              <input className="campoDelInput" type='number' value={inicioTurnoDia}
                onChange={(e) => setInicioTurnoDia(e.target.value)} />
            </label>
          </li>
          <li>
            <label>
              Fin Turno Día (hora 0-23)
              <input className="campoDelInput" type='number' value={finTurnoDia}
                onChange={(e) => setFinTurnoDia(e.target.value)} />
            </label>
          </li>
          <h4>Turno Noche</h4>
          <li>
            <label>
              Inicio Turno Noche (hora 0-23)
              <input className="campoDelInput" type='number' value={inicioTurnoNoche}
                onChange={(e) => setInicioTurnoNoche(e.target.value)} />
            </label>
          </li>
          <li>
            <label>
              Fin Turno Noche (hora 0-23)
              <input className="campoDelInput" type='number' value={finTurnoNoche}
                onChange={(e) => setFinTurnoNoche(e.target.value)} />
            </label>
          </li> */}
        </ul>
      </div>
      <FloatingButtonContainer>
        <button className="boton" onClick={overwriteData}>Guardar Cambios</button>
      </FloatingButtonContainer>
    </Section>
  );
}

const FloatingButtonContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
`;

const Section = styled.section`
width: 100%;

padding-bottom: 120px; /* Added padding for floating button */

li {
padding-top:0.5rem; 
font-weight: bold;
}

ul {
   
    list-style: none;
    display: flex;
    flex-direction: column;
    color: var(--app-text-color, #000);
    
  }

input{
  font-family: 'product_sansregular'; 
  font-size: 1rem;
  vertical-align: middle;
  width: 100%;
  border-radius: 8px;
  padding-left: 0.5rem;
}
   
.campoDelInput {   
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
`

