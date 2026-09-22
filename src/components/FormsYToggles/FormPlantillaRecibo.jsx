import styled, { createGlobalStyle } from "styled-components";
import React, { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase"
import { getDatabase, ref, set, get, update } from "firebase/database";
import { toast } from 'react-toastify';
import EditableText from '../RichEditableText'; // Renombrado internamente para mantener variables
import { useAuth } from '../../contexts/authContext';

const GlobalStyle = createGlobalStyle`
  .form-plantilla-recibo {
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

  .form-plantilla-recibo h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .plantilla-recibo-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  /* Estilos para la previsualización */
  .preview-section {
    display: flex;
    flex-direction: column;
    line-height: 1.5;
    background-color: white;
    color: black;
    margin-top: 1rem;
    font-size: 12pt;
    border: 1px solid #ddd;
  }
  .preview-section .navbar {
    position: relative;
    width: 100%;
    padding-top:0.5rem;
    padding-bottom:0.5rem;
    background-color: var(--app-primary-text-color, var(--primary-color));
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    color: white;
  }
  .preview-section .navbar .name {
    position: absolute;
    left: 3.5rem;
    top: 10px;
    font-family: 'playlistscript';
    font-size: 1.2rem;
    color: white;
  }    
  .preview-section .navbar .title {
    position: absolute;
    right: 1.5rem;
    top: 10px;
  }
  .preview-section .navbar .logo {
    position: relative;
    width: 1.5rem;
    height: 1.5rem;
    left: 1rem;
    top: 3px;
  }
  .preview-section .header {
    padding: 1rem;
    border: 1px solid black;
    margin: 1rem;
  }
  .preview-section .bold {
    font-weight: bold;
  }
  .preview-section .firma {
    font-family: 'playlistscript';
    font-weight: bold;
  }
  .preview-section .disclaimer {
    margin-left: 2rem;
    font-weight: bold;
    font-size: 11pt;
    margin: 10px 0;
  }
  .preview-section .content {
    margin: 1rem;
    padding: 1rem;
  }
  .preview-section ol {
    padding-left: 1.5rem;
  }
  .preview-section li {
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .preview-section h3 {
    padding: 0.5rem;
    font-size: 13pt;
    margin-bottom: 10px;
  }
  .preview-section .footer {
    margin-left: 2rem;
    font-weight: bold;
    padding-bottom: 2rem;
  }
  /* Fix Quill block defaults in inline context ONLY for specific fields */
  .inline-quill .editable-text-display p {
    display: inline;
    margin: 0;
  }
  
  /* Mantener saltos de línea para el resto de los textos enriquecidos */
  .preview-section .editable-text-display p {
    margin-bottom: 0.3em;
  }
  .preview-section .editable-text-display p:last-child {
    margin-bottom: 0;
  }
`;

export default function FormPlantillaRecibo(props) {

  const { currentUser } = useAuth();

  let [inputValue1, setInputValue1] = useState("");
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




  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + props.toggle;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setInputValue1(targetObject.contenido1);
        setInputValue2(targetObject.contenido2);
        setInputValue3(targetObject.contenido3);
        setInputValue4(targetObject.contenido4);
        setInputValue5(targetObject.contenido5);
        setInputValue6(targetObject.contenido6);
        setInputValue7(targetObject.contenido7);
        setInputValue8(targetObject.contenido8);
        setInputValue9(targetObject.contenido9);
        setInputValue10(targetObject.contenido10);
        setInputValue11(targetObject.contenido11);
        setInputValue12(targetObject.contenido12);
        setInputValue13(targetObject.contenido13);
        setInputValue14(targetObject.contenido14);
        setInputValue15(targetObject.contenido15);
        setInputValue16(targetObject.contenido16);
        setInputValue17(targetObject.contenido17);
        setInputValue18(targetObject.contenido18);
        setInputValue19(targetObject.contenido19);
        setInputValue20(targetObject.contenido20);
        setInputValue21(targetObject.contenido21);
        setInputValue22(targetObject.contenido22);
        setInputValue23(targetObject.contenido23);
        setInputValue24(targetObject.contenido24);



      } else {
        toast.error("Error al cargar datos de la plantilla de recibo.");
      }
    }
    fetchData();
  }, [props.toggle])

  const handleSaveField = async (field, newValue, stateUpdater) => {
    if (currentUser) {
      try {
        const db = getDatabase(app);
        const dbURL = "datosId/" + props.toggle;
        const dataRef = ref(db, dbURL);
        await update(dataRef, {
          [field]: newValue
        });
        stateUpdater(newValue);
        toast.success("Campo actualizado correctamente");
      } catch (error) {
        console.error(`Error al actualizar ${field}:`, error);
        toast.error("Error al actualizar el campo.");
      }
    }
  };

  return (
    <>
      <GlobalStyle />
      <div className="form-plantilla-recibo">
        <h2>Editar Plantilla de Recibo</h2>
        <div className="plantilla-recibo-card">
        <div className="preview-section">
          <div className="navbar">
            <div className="logo" style={{ border: '1px dashed white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>LOGO</div>
            <div className="name">[Nombre Salón]</div>
            <div className="title">Recibo</div>
          </div>

          <div className="container">
            <div className="header">
              <div className="inline-quill">
                <EditableText value={inputValue2} onSave={(val) => handleSaveField('contenido2', val, setInputValue2)} isEditable={!!currentUser} />
                {", "} <span className="inline">[Fecha Actual].</span>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <span className="bold">Recibí de [Cliente] la cantidad de $[Monto]</span>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <EditableText value={inputValue3} onSave={(val) => handleSaveField('contenido3', val, setInputValue3)} isEditable={!!currentUser} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                <div className="bold inline-quill">
                  <EditableText value={inputValue4} onSave={(val) => handleSaveField('contenido4', val, setInputValue4)} isEditable={!!currentUser} />
                  {" "}[Fecha Evento].
                </div>
                <div className="bold" style={{ marginRight: '2rem' }}>
                  Pagó en total: $[Monto Total]-.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <EditableText value={inputValue5} onSave={(val) => handleSaveField('contenido5', val, setInputValue5)} isEditable={!!currentUser} />
                </div>
                <div className="firma">
                  <EditableText value={inputValue24} onSave={(val) => handleSaveField('contenido24', val, setInputValue24)} isEditable={!!currentUser} />
                </div>
              </div>
            </div>

            <div className="disclaimer">
              <EditableText value={inputValue6} onSave={(val) => handleSaveField('contenido6', val, setInputValue6)} isEditable={!!currentUser} />
            </div>

            <div className="content">
              <ol>
                <li><EditableText value={inputValue7} onSave={(val) => handleSaveField('contenido7', val, setInputValue7)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue8} onSave={(val) => handleSaveField('contenido8', val, setInputValue8)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue9} onSave={(val) => handleSaveField('contenido9', val, setInputValue9)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue10} onSave={(val) => handleSaveField('contenido10', val, setInputValue10)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue11} onSave={(val) => handleSaveField('contenido11', val, setInputValue11)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue12} onSave={(val) => handleSaveField('contenido12', val, setInputValue12)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue13} onSave={(val) => handleSaveField('contenido13', val, setInputValue13)} isEditable={!!currentUser} /></li>
                <li className="bold"><EditableText value={inputValue14} onSave={(val) => handleSaveField('contenido14', val, setInputValue14)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue15} onSave={(val) => handleSaveField('contenido15', val, setInputValue15)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue16} onSave={(val) => handleSaveField('contenido16', val, setInputValue16)} isEditable={!!currentUser} /></li>
                <li className="bold"><EditableText value={inputValue17} onSave={(val) => handleSaveField('contenido17', val, setInputValue17)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue18} onSave={(val) => handleSaveField('contenido18', val, setInputValue18)} isEditable={!!currentUser} /></li>
                <li className="bold"><EditableText value={inputValue19} onSave={(val) => handleSaveField('contenido19', val, setInputValue19)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue20} onSave={(val) => handleSaveField('contenido20', val, setInputValue20)} isEditable={!!currentUser} /></li>
                <li><EditableText value={inputValue21} onSave={(val) => handleSaveField('contenido21', val, setInputValue21)} isEditable={!!currentUser} /></li>
                
                <h3><EditableText value={inputValue22} onSave={(val) => handleSaveField('contenido22', val, setInputValue22)} isEditable={!!currentUser} /></h3>
              </ol>
            </div>
            
            <div className="footer">
               <a href="#">Este recibo se basa en la lista de precios del mes de [Mes] de [Año]. Puede verla en nuestra página web.</a>
            </div>
            
            {/* Los valores 1 y 23 parecen no estar mapeados en la vista pública de la misma forma, los ponemos aquí abajo como extras */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
              <p style={{ color: '#666', fontSize: '10pt', marginBottom: '5px' }}>Campos adicionales (si aplican):</p>
              <div><EditableText value={inputValue1} onSave={(val) => handleSaveField('contenido1', val, setInputValue1)} isEditable={!!currentUser} placeholder="Contenido 1" /></div>
              <div><EditableText value={inputValue23} onSave={(val) => handleSaveField('contenido23', val, setInputValue23)} isEditable={!!currentUser} placeholder="Contenido 23" /></div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

