import React, { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase"; // Asegúrate de que la ruta sea correcta
import styled from "styled-components";
import { getDatabase, ref, set, get } from "firebase/database";
import { toast } from 'react-toastify';

export default function FormListaDePrecios(props) { // Nombre del componente

  // Estado único para manejar todos los contenidos (contenido1 a contenido80)
  const [contenidos, setContenidos] = useState({});


  // useEffect para cargar los datos
  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      // Asegúrate de que esta ruta sea correcta en tu Firebase (ej. 'datosId/ID_DEL_PRESUPUESTO')
      let dbURL = "datosId/" + props.toggle;
      const dbRef = ref(db, dbURL);

      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          // Carga el objeto completo directamente en el estado
          setContenidos(snapshot.val());
        } else {
          console.log("No data found for path:", dbURL);
          // Limpiar el estado si no hay datos o inicializar con objetos vacíos si prefieres
          setContenidos({});
        }
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        toast.error("Error al cargar datos: " + error.message);
      }
    };

    if (props.toggle) { // Asegura que props.toggle tenga un valor
      fetchData();
    }

  }, [props.toggle]); // Dependencia en props.toggle para recargar datos

  // Handler centralizado para actualizar el estado del objeto cuando cambia un input
  const handleInputChange = (e, index) => {
    const { value } = e.target;
    const contenidoKey = `contenido${index}`;

    // Actualiza el estado copiando el objeto actual y modificando la clave específica
    setContenidos(prevContenidos => ({
      ...prevContenidos,
      [contenidoKey]: value
    }));
  };

  // Función para guardar los datos
  const overwriteData = async () => {
    // Asegúrate de que esta ruta sea correcta (ej. 'datosId/ID_DEL_PRESUPUESTO')
    let dbURL = "datosId/" + props.toggle;
    const db = getDatabase(app);
    const newDocRef = ref(db, dbURL);

    // El objeto a guardar es directamente el estado 'contenidos'
    const dataToSave = contenidos;

    try {
      await set(newDocRef, dataToSave);
      toast.success("Información actualizada correctamente");
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Error al actualizar la información: " + error.message);
    }
  };




  return (
    <Section>
      <div className="datos">

        <ul>

          {/* Generar los campos de input dinámicamente */}
          {Array.from({ length: 81 }, (_, i) => i + 1).map(index => {
            const contenidoKey = `contenido${index}`;
            // Acceder al valor desde el estado 'contenidos'
            const inputValue = contenidos[contenidoKey] || ""; // Usar "" si el valor no existe (útil en la carga inicial)

            return (
              <li key={index}> {/* key es importante para listas en React */}
                <label>
                  {`Contenido ${index}`}: {/* Etiqueta simple */}
                  <textarea
                    rows="2" // Ajusta el número de filas si es necesario
                    className="campoDelInput" // Usando la clase de estilo
                    type='text'
                    name={`input${index}`} // Nombre del input
                    value={inputValue}
                    onChange={(e) => handleInputChange(e, index)} // Usar el handler centralizado
                  />
                </label>
              </li>
            );
          })}
        </ul>

        {/* Botón de guardar */}
      </div>
      <FloatingButtonContainer>
        <button className="boton" onClick={overwriteData}>Guardar cambios</button>
      </FloatingButtonContainer>
    </Section>
  );
}

// Estilos (copiados de tu ejemplo)
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

textarea{
font-family: 'product_sansregular';
font-size: 1rem;
vertical-align: middle;
width: 100%;
border-radius: 8px;
padding-left: 0.5rem;
}

.campoDelInput { /* Usando la clase de tu ejemplo FormOtrosDatos */
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



.datos{
.container{ /* Este selector parece no usarse directamente dentro de .datos en tu ejemplo */
.bloc-tabs{
.header{
li:hover{
cursor: pointer;
background-color: var(--app-primary-text-color, var(--primary-color));
transition: var(--default-transition);
}
}
}
}
}


@media screen and (min-width: 280px) and (max-width: 1080px) {
width:100%;
margin-top:1.5rem;
li{
padding-top:0;
padding-bottom:0.5rem;
}
.campoDelInput{ /* Usando la clase de tu ejemplo FormOtrosDatos */
padding:0.1rem;
width:90%;
margin-left: 0.8rem;
margin-top: 0.5rem;
border-radius: 8px;
text-align: center;
}
}
`;