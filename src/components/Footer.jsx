// src/components/Footer.jsx

import styled, { keyframes } from "styled-components";

const invertColors = keyframes`
  0%, 100% {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
  50% {
    background-color: white;
    color: var(--primary-color);
    border-color: var(--primary-color);
  }
`;
import { Link, useNavigate } from "react-router-dom"; // Aunque importado, no lo usaremos directamente para nueva pestaña.
import React, { useState, useEffect, useRef } from "react";
import { app } from "../firebase/firebase";
import { getDatabase, ref, get, onValue } from "firebase/database";
import EditableField from "./EditableField";
import EditableLink from "./EditableLink";
import { useFestiveTheme } from '../contexts/FestiveThemeContext';

export default function Footer({ 
  isEditable, 
  logoUrl: propLogoUrl,
  onFileSelect,
  title1,
  title2,
  title3,
  description,
  link1,
  link2,
  mapLink,
  contactLink1,
  contactLink2,
  editingField,
  setEditingField,
  onSave,
  onSaveLink,
  disclaimer: propDisclaimer,
  horarioAtencion: propHorarioAtencion,
  horarioAlquiler: propHorarioAlquiler
}) {

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
  let [whatsappDisplayText, setWhatsappDisplayText] = useState('');
  let [mailDisplayText, setMailDisplayText] = useState('');
  let [disclaimerText, setDisclaimerText] = useState('');
  let [disclaimerUrl, setDisclaimerUrl] = useState('');
  const { activeFestiveTheme } = useFestiveTheme();
  const [showJobsButton, setShowJobsButton] = useState(true);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const db = getDatabase(app);
    const jobsRef = ref(db, 'config/showJobsButton');
    const unsub = onValue(jobsRef, (snapshot) => {
      if (snapshot.exists()) {
        setShowJobsButton(snapshot.val());
      } else {
        setShowJobsButton(true);
      }
    });
    return () => unsub();
  }, []);

  const handleLogoClick = () => {
    if (isEditable) {
      fileInputRef.current.click();
    }
  };

  const handleLogoFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0], 'footer_logo');
    }
  };

  const logoUrl = isEditable ? propLogoUrl : inputValue10;

  const t1 = isEditable ? title1 : inputValue11;
  const t2 = isEditable ? title2 : inputValue12;
  const t3 = isEditable ? title3 : inputValue13;
  const desc = isEditable ? description : inputValue9;

  const l1 = isEditable ? link1 : { text: "Instagram", url: inputValue3 };
  const l2 = isEditable ? link2 : { text: "Facebook", url: inputValue4 };

  const mapUrl = isEditable ? mapLink : inputValue7;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 27;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setInputValue1(targetObject.horario_de_atencion);
        setInputValue2(targetObject.horario_de_alquiler);
      } else {
        console.log("error en footer")
      }
    }
    fetchData();
  }, [27])

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 25;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setInputValue3(targetObject.link_instagram);
        setInputValue4(targetObject.link_facebook);
        setInputValue5(targetObject.link_whatsapp); // link_whatsapp
        setInputValue6(targetObject.direccion_mail);
        setInputValue7(targetObject.link_iframe_mapa);
        setInputValue8(targetObject.numero_whatsapp); // numero_whatsapp
        setInputValue9(targetObject.lema_marca);

        setWhatsappDisplayText(targetObject.whatsapp_text || 'Nuestro WhatsApp');
        setMailDisplayText(targetObject.mail_text || 'Nuestro Mail');

      } else {
        console.log("error en footer")
      }
    }
    fetchData();
  }, [25])

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 28;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();

        setInputValue10(targetObject.foto31);

      } else {
        alert("error UseEffect de form de otros datos");
      }
    }
    fetchData();
  }, [28])

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 29;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();

        setInputValue11(targetObject.contenido33);
        setInputValue12(targetObject.contenido34);
        setInputValue13(targetObject.contenido35);

        setDisclaimerText(targetObject.contenido39 || '');
        setDisclaimerUrl(targetObject.contenido39_url || '');

      } else {
        alert("error UseEffect de form de otros datos");
      }
    }
    fetchData();
  }, [29])

  // ***** CAMBIO CLAVE AQUÍ: handleWhatsappClick para Footer *****
  const handleWhatsappClick = () => {
    const defaultFooterMessage = "";
    const encodedMessage = encodeURIComponent(defaultFooterMessage);

    // Construye la URL completa para la página de agradecimiento con el mensaje como query param
    const thankYouPageUrl = `/cotizacion-exitosa?message=${encodedMessage}`;

    // Abre la página de agradecimiento en una nueva pestaña
    window.open(thankYouPageUrl, '_blank', 'noopener noreferrer'); 
  };
  // ***************************************************************

  const redes = [
    <EditableLink
      fieldKey="footer_link1"
      text={l1.text}
      url={l1.url}
      onSave={(text, url) => onSaveLink('footer_link1', text, url)}
      isEditable={isEditable}
      editingField={editingField}
      setEditingField={setEditingField}
    />,
    <EditableLink
      fieldKey="footer_link2"
      text={l2.text}
      url={l2.url}
      onSave={(text, url) => onSaveLink('footer_link2', text, url)}
      isEditable={isEditable}
      editingField={editingField}
      setEditingField={setEditingField}
    />,
  ];

  const whatsapp = [
    <EditableLink
      fieldKey="footer_contact_link1"
      text={isEditable ? contactLink1.text : whatsappDisplayText}
      url={isEditable ? contactLink1.url : inputValue8}
      onSave={(text, url) => onSaveLink('footer_contact_link1', text, url)}
      isEditable={isEditable}
      editingField={editingField}
      setEditingField={setEditingField}
    />
  ];

  const mail = [
    <EditableLink
      fieldKey="footer_contact_link2"
      text={isEditable ? contactLink2.text : mailDisplayText}
      url={isEditable ? contactLink2.url : `mailto:${inputValue6}`}
      onSave={(text, url) => onSaveLink('footer_contact_link2', text, url)}
      isEditable={isEditable}
      editingField={editingField}
      setEditingField={setEditingField}
    />
  ];


  return (
    <Container>
      {isEditable && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleLogoFileChange}
          accept="image/*"
        />
      )}
      <div className="upper-footer">

         {/* Logo y descripción */}

        <div className="col">
          <div className="brand">
            <div className="logo" onClick={handleLogoClick} style={{ cursor: isEditable ? 'pointer' : 'default', position: 'relative' }}>
              {logoUrl && <img src={logoUrl}  />}
              {activeFestiveTheme?.logoOverlay && (
                <img src={activeFestiveTheme.logoOverlay} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
              )}
            </div>
            <EditableField
              as="p"
              className="description"
              fieldKey="footer_description"
              value={desc}
              isEditable={isEditable}
              editingField={editingField}
              setEditingField={setEditingField}
              onSave={onSave}
            />
            {showJobsButton && (
              <button 
                className="jobs-btn"
                onClick={() => navigate('/trabaja-con-nosotros')}
              >
                Trabajá con nosotros
              </button>
            )}
          </div>
        </div>

      {/* Links de redes y mapa */}

        <div className="col">
          <EditableField
            as="h2"
            fieldKey="footer_title_1"
            value={t1}
            isEditable={isEditable}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
          <ul>
            {redes.map((mapa) => (
              <li key={mapa.props.fieldKey}>{mapa}</li>
            ))}
          </ul>
          <div className="mapa" onClick={() => { if (isEditable) setEditingField('footer_map_link'); }} style={{ cursor: isEditable ? 'pointer' : 'default', position: 'relative' }}>
            {isEditable && editingField === 'footer_map_link' ? (
              <div style={{ width: '250px', height: '200px' }}>
                <EditableField
                  fieldKey="footer_map_link"
                  value={mapUrl}
                  isEditable={isEditable}
                  editingField={editingField}
                  setEditingField={setEditingField}
                  onSave={onSave}
                />
              </div>
            ) : (
              <>
                {isEditable && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, backgroundColor: 'rgba(0,0,0,0)' }}></div>}
                {mapUrl && <iframe src={mapUrl} width="100%" height="100%" title="Mapa de ubicación"></iframe>}
              </>
            )}
          </div>
        </div>

        {/* / Contacto */}

        <div className="col">
          <EditableField
            as="h2"
            fieldKey="footer_title_2"
            value={t2}
            isEditable={isEditable}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
          <ul>
            {whatsapp.map((wasap) => (
              <li key={wasap.props.fieldKey}>{wasap}</li>
            ))}

            {mail.map((mailItem) => (
              <li key={mailItem.props.fieldKey}>{mailItem}</li>
            ))}

                        <li>
              <EditableLink
                fieldKey="footer_disclaimer"
                text={isEditable ? (propDisclaimer?.text !== undefined ? propDisclaimer.text : propDisclaimer) : disclaimerText}
                url={isEditable ? (propDisclaimer?.url || "") : disclaimerUrl}
                onSave={(text, url) => onSaveLink('footer_disclaimer', text, url)}
                isEditable={isEditable}
                editingField={editingField}
                setEditingField={setEditingField}
              />
            </li>
          </ul>
        </div>

        {/*  Horarios */}
        
        <div className="col">
          <EditableField
            as="h2"
            fieldKey="footer_title_3"
            value={t3}
            isEditable={isEditable}
            editingField={editingField}
            setEditingField={setEditingField}
            onSave={onSave}
          />
          <ul>
            <li>
              <EditableField
                as="p"
                fieldKey="footer_horario_atencion"
                value={isEditable ? propHorarioAtencion : inputValue1}
                isEditable={isEditable}
                editingField={editingField}
                setEditingField={setEditingField}
                onSave={onSave}
              />
            </li>
            <li>
              <EditableField
                as="p"
                fieldKey="footer_horario_alquiler"
                value={isEditable ? propHorarioAlquiler : inputValue2}
                isEditable={isEditable}
                editingField={editingField}
                setEditingField={setEditingField}
                onSave={onSave}
              />
            </li>
          </ul>
        </div>
      </div>

      
    </Container>
  );
}

const Container = styled.footer`

.upper-footer {

    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    justify-content: center;
    border-bottom: 2px solid var(--app-primary-text-color, var(--primary-color));
    border-top: 2px solid var(--app-primary-text-color, var(--primary-color));
    padding-top: 4rem;
    padding-bottom: 0rem;
    gap: 1rem;
    width: 100%;
    margin:auto;

    .col {
      
      display: flex;
      flex-direction: column;
      gap: 1rem;
      
      .brand{
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;

        .logo{
          display: flex;
          width: 50px;
          height: 50px;
          justify-content: center;
        }
        .description{
          color: var(--primary-text);
          font-size:1rem;
        }
        .jobs-btn {
          margin-top: 20px;
          padding: 12px 24px;
          font-size: 1.1rem;
          border: 2px solid var(--primary-color);
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          font-family: 'product_sansregular', sans-serif;
          animation: ${invertColors} 4s infinite;
        }
      }
      .mapa {
        width: 100%;
        max-width: 250px;
        height: 160px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

        iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
      }

      h2 {
        color: var(--primary-text);
        font-size: 1.5rem;


      }
      
      ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        color: var(--primary-text);
        
        
        a {
          font-size: 1rem;
          text-decoration: underline;
          color: var(--primary-text);
          cursor: pointer;
          transition: var(--default-transition);
          &:hover {
            color: var(--app-primary-text-color, var(--primary-color));
          }
  }
        li {
          cursor: auto;
        }
        
      }
         
    }
  }
  
  .minijuego{
    padding-top:1rem;
    padding-bottom: 1rem ;
    width: 100%;
    h3{
    padding-bottom:1rem;}
  }
  
  
  @media screen and (min-width: 280px) and (max-width: 1080px) {
    width: 65%;
    margin: 2rem auto;
    box-sizing: border-box;

    .minijuego {
      display: none;
    }
    
    .upper-footer {
      grid-template-columns: 1fr;
      padding-bottom: 2rem;
      padding-top: 1rem;
      text-align: center;
      gap: 2rem;
      width: 100%;

      a {
        text-decoration: none;
        color: var(--app-primary-text-color, var(--primary-color));
      }

      .col {
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        color: var(--secondary-text);
        align-items: center;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        
        .brand {
          width: 100%;

          .logo {
            margin: auto;
            display: flex;
            width: 50px;
            height: 50px;
          }

          .description {
            font-size: 0.95rem;
            line-height: 1.4;
            word-break: break-word;
            overflow-wrap: break-word;
            padding: 0 5px;
          }

          .jobs-btn {
            max-width: 100%;
            padding: 10px 18px;
            font-size: 1rem;
          }
        }

        h2 {
          font-size: 1.35rem;
          margin-bottom: 0.25rem;
          color: var(--primary-text);
        }

        ul {
          padding: 0;
          margin: 0;
          width: 100%;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          align-items: center;

          li {
            width: 100%;
            max-width: 100%;
            text-align: center;
          }

          a {
            font-size: 0.95rem;
            line-height: 1.4;
            display: inline-block;
            max-width: 100%;
            word-break: normal;
            overflow-wrap: break-word;
            padding: 0 4px;
          }

          p {
            font-size: 0.95rem;
            line-height: 1.4;
            word-break: normal;
            overflow-wrap: break-word;
            padding: 0 4px;
            color: var(--primary-text);
          }
        }

        .mapa {
          width: 100%;
          max-width: 260px;
          height: 170px;
          margin: 0 auto;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);

          iframe {
            width: 100%;
            height: 100%;
            border: 0;
            display: block;
          }
        }
      }
    }
  }
`;