import styled from "styled-components";
import { useState, useEffect, useRef } from "react";
import { app } from "../firebase/firebase";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, update } from "firebase/database";
import { uploadToFirebaseStorage } from '../utils/storageUpload';
import { WhatsappShareButton } from "react-share";
import { useChatbot } from '../contexts/chatbotContext'; // <-- Importar el hook del chatbot
import { useFestiveTheme } from '../contexts/FestiveThemeContext'; // Importar FestiveThemeContext
import { useLoading } from '../contexts/LoadingContext';
import Modal, { ModalButton, ModalButtonContainer } from './Modal';
import EditableField from "./EditableField";
import ImageGalleryModal from './Admin/ImageGalleryModal';
import { Link } from "react-router-dom";
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createTextNode } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'; // Import OnChangePlugin
import './EditableField.css'; // Import the CSS file
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";


const theme = {
  // Example content styles for Lexical, apply your own CSS
  // These are basic placeholders and would typically be defined in a CSS file
  paragraph: "editor-paragraph",
  text: {
    bold: "editor-text-bold",
    italic: "editor-text-italic",
    underline: "editor-text-underline",
    strikethrough: "editor-text-strikethrough",
    underlineStrikethrough: "editor-text-underlineStrikethrough",
    code: "editor-text-code",
  },
  list: {
    nested: {
      listitem: "editor-nested-listitem",
    },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
    listitem: "editor-listitem",
  },
  link: "editor-link",
  hashtag: "editor-hashtag",
  blockquote: "editor-blockquote",
  code: "editor-code",
  codeHighlight: {
    atrule: "editor-tokenAttr",
    attr: "editor-tokenAttr",
    boolean: "editor-tokenProperty",
    builtin: "editor-tokenSelector",
    cdata: "editor-tokenComment",
    char: "editor-tokenSelector",
  },
};

function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.focus();
  }, [editor]);

  return null;
}

const hexToRgba = (hex, opacityPercent) => {
  if (!hex) return `rgba(0,0,0,${opacityPercent / 100})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacityPercent / 100})`;
};

const getOverlayShadow = (ov, mode = 'text') => {
  const color = ov.shadowColor || '#000000';
  const offsetX = ov.shadowOffsetX !== undefined ? ov.shadowOffsetX : (ov.shadowOffset !== undefined ? ov.shadowOffset : 4);
  const offsetY = ov.shadowOffsetY !== undefined ? ov.shadowOffsetY : (ov.shadowOffset !== undefined ? ov.shadowOffset : 4);
  const blur = ov.shadowBlur !== undefined ? ov.shadowBlur : 6;
  const opacity = ov.shadowOpacity !== undefined ? ov.shadowOpacity : 35;
  const thickness = ov.shadowThickness !== undefined ? ov.shadowThickness : 1;

  const rgbaColor = hexToRgba(color, opacity);

  if (mode === 'filter') {
    const shadows = [];
    for (let i = 0; i < thickness; i++) {
      shadows.push(`drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${rgbaColor})`);
    }
    return shadows.join(' ');
  } else {
    const shadows = [];
    for (let i = 0; i < thickness; i++) {
      shadows.push(`${offsetX}px ${offsetY}px ${blur}px ${rgbaColor}`);
    }
    return shadows.join(', ');
  }
};

export default function Home({
  isChatbotFeatureEnabled,
  isEditable,
  editingField,
  setEditingField,
  onSave
}) {
  const { toggleChat } = useChatbot(); // <-- Usar el contexto
  const { registerTask, completeTask } = useLoading();
  const { activeFestiveTheme } = useFestiveTheme();

  useEffect(() => {
    registerTask('main_image');
  }, [registerTask]);

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
  let [inputValueNewText, setInputValueNewText] = useState("");
  let [inputValueNewTextHover, setInputValueNewTextHover] = useState("");
  let [inputValueNewTextUrl, setInputValueNewTextUrl] = useState("/precios");
  let [inputValueChatbotImage, setInputValueChatbotImage] = useState(""); // New state for chatbot image
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [modalSubtitle, setModalSubtitle] = useState("");
  const [modalButtonJuan, setModalButtonJuan] = useState("");
  const [modalButtonIA, setModalButtonIA] = useState("");
  const fileInputChatbotRef = useRef(null); // New ref for chatbot image input
  const fileInputWhatsappRef = useRef(null);
  const fileInputShareRef = useRef(null);
  const fileInputFacebookRef = useRef(null);
  const fileInputInstagramRef = useRef(null);
  const fileInputGoogleMapsRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false); // New state to track focus
  const editorWrapperRef = useRef(null);

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState(null);

  const handleGallerySelect = async (downloadURL) => {
    try {
      const db = getDatabase(app);
      if (galleryTarget === 'main_image') {
        const dbURL = 'datosId/' + 28;
        const dbRef = ref(db, dbURL);
        await update(dbRef, { foto1: downloadURL });
        setInputValue5(downloadURL);
      } else if (galleryTarget === 'instagram_icon') {
        const dbURL = 'datosId/' + 25;
        const dbRef = ref(db, dbURL);
        await update(dbRef, { link_cuadrado_de_instagram: downloadURL });
        setInputValue9(downloadURL);
      }
      setIsGalleryModalOpen(false);
      setGalleryTarget(null);
    } catch (error) {
      console.error('Error al actualizar la imagen:', error);
      alert('Error al actualizar la imagen.');
    }
  };


  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://melishare-redirect-payo.web.app';
  const mensajeParaCompartir = shareUrl || `Mirá este salón de eventos: ${currentOrigin}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensajeParaCompartir)}`;

  const commonEditableProps = { isEditable, editingField, setEditingField, onSave };

  const handleImageUpload = async (event, firebaseField, setInputValueFunction) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const downloadURL = await uploadToFirebaseStorage(file);

      const db = getDatabase(app);
      const dbURL = "datosId/" + 25;
      const dbRef = ref(db, dbURL);
      await update(dbRef, { [firebaseField]: downloadURL });

      setInputValueFunction(downloadURL);
      alert("Imagen actualizada exitosamente!");
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      alert("Error al subir la imagen.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 25;
      const dbRef = ref(db, dbURL);
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const targetObject = snapshot.val();
          setInputValue1(targetObject.link_whatsapp);
          setInputValue2(targetObject.link_google);
          setInputValue3(targetObject.link_instagram);
          setInputValue4(targetObject.link_google_maps);
          setInputValue8(targetObject.link_f_de_facebook);
          setInputValue9(targetObject.link_cuadrado_de_instagram);
          setInputValue10(targetObject.link_imagen_compartir);
          setInputValue11(targetObject.link_imagen_whatsapp);
          setInputValue12(targetObject.link_imagen_google_maps);
          setInputValueChatbotImage(targetObject.link_imagen_chatbot || ""); // Fetch chatbot image URL
          setWhatsappMessage(`Hola! Tengo algunas consultas sobre el salón.`);
        }
      } catch (error) {
        console.error("Error al buscar datos de datosId/25:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 28;
      const dbRef = ref(db, dbURL);
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const targetObject = snapshot.val();
          setInputValue5(targetObject.foto1);
          if (!targetObject.foto1) {
            completeTask('main_image');
          }
        } else {
          completeTask('main_image');
        }
      } catch (error) {
        console.error("Error al buscar datos de datosId/28:", error);
        completeTask('main_image');
      }
    }
    fetchData();
  }, [completeTask]);

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 29;
      const dbRef = ref(db, dbURL);
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const targetObject = snapshot.val();
          setInputValue6(targetObject.contenido1);
          setInputValue7(targetObject.contenido2);
          setInputValueNewText(targetObject.contenido_nuevo || "Texto por defecto");
          setInputValueNewTextHover(targetObject.contenido_nuevo_hover || "Texto flotante por defecto");
          setInputValueNewTextUrl(targetObject.contenido_nuevo_url || "/precios");
          setModalTitle(targetObject.contenido36);
          setModalSubtitle(targetObject.contenido40 || '');
          setModalButtonJuan(targetObject.contenido37);
          setModalButtonIA(targetObject.contenido38);
        }
      } catch (error) {
        console.error("Error al buscar datos de datosId/29:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const fetchShareUrl = async () => {
      const db = getDatabase(app);
      const urlRef = ref(db, 'appSettings/shareUrl');
      try {
        const snapshot = await get(urlRef);
        if (snapshot.exists()) {
          setShareUrl(snapshot.val());
        } else {
          setShareUrl("Error al compartir página");
        }
      } catch (error) {
        console.error("Error fetching shareUrl from Firebase:", error);
        setShareUrl("Error al compartir página 2");
      }
    };
    fetchShareUrl();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);



  const handleChatWithJuan = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const thankYouPageUrl = `/cotizacion-exitosa?message=${encodedMessage}`;
    window.open(thankYouPageUrl, '_blank', 'noopener noreferrer');
    setIsModalOpen(false);
  };

  const handleChatWithIA = () => {
    toggleChat();
    setIsModalOpen(false);
  };

  const handleImageClick = () => {
    if (isEditable) {
      setGalleryTarget('main_image');
      setIsGalleryModalOpen(true);
    }
  };

  const [lightboxOpen, setLightboxOpen] = useState(false);
  useEffect(() => {
    const handlePopState = () => {
      if (lightboxOpen) {
        setLightboxOpen(false);
      }
    };
    if (lightboxOpen) {
      window.history.pushState({ lightbox: true }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [lightboxOpen]);

  const closeLightbox = () => {
    setLightboxOpen(false);
    if (window.history.state && window.history.state.lightbox) {
      window.history.back();
    }
  };

  const handleImageClickWrapper = () => {
    if (isEditable) {
      handleImageClick();
    } else {
      setLightboxOpen(true);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const auth = getAuth(app);
    console.log("Current user:", auth.currentUser);

    try {
      const downloadURL = await uploadToFirebaseStorage(file);
      console.log("New image URL:", downloadURL);

      const db = getDatabase(app);
      const dbURL = "datosId/" + 28;
      const dbRef = ref(db, dbURL);
      await update(dbRef, { foto1: downloadURL });

      setInputValue5(downloadURL);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const displayImage = activeFestiveTheme?.heroImage ? activeFestiveTheme.heroImage : inputValue5;

  return (
    <>
      <ImageGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => { setIsGalleryModalOpen(false); setGalleryTarget(null); }}
        onSelect={handleGallerySelect}
      />
      <Section>
        <div className="background home-background-hero">
          {displayImage && <img
            src={displayImage}
            className="banner-image"
            alt="Salón de eventos - Vista principal"
            width="100%"
            height="auto"
            fetchPriority="high"
            loading="eager"
            onClick={handleImageClickWrapper}
            onLoad={() => completeTask('main_image')}
            onError={() => completeTask('main_image')}
            style={{ cursor: 'pointer', width: '100%', height: '100%', objectFit: 'cover' }}
          />}

          {lightboxOpen && !isEditable && (
            <Lightbox
              open={lightboxOpen}
              close={closeLightbox}
              slides={[{ src: displayImage }]}
              plugins={[Zoom]}
              carousel={{ finite: false }}
              render={{
                buttonPrev: () => null,
                buttonNext: () => null,
              }}
              animation={{ zoom: 300 }}
              controller={{ closeOnBackdropClick: true }}
            />
          )}

          {/* Adorno/Distintivo Festivo con Coordenadas Cartesianas (Múltiples Capas o Monocapa) */}
          {activeFestiveTheme && (
            activeFestiveTheme.overlays && Array.isArray(activeFestiveTheme.overlays) && activeFestiveTheme.overlays.length > 0 ? (
              activeFestiveTheme.overlays.map((ov, index) => {
                const zIndexVal = 5 + (activeFestiveTheme.overlays.length - index) * 10;
                if (ov.type === 'text') {
                  return (
                    <span
                      key={ov.id || index}
                      style={{
                        position: 'absolute',
                        left: `${ov.x !== undefined ? ov.x : 50}%`,
                        top: `${ov.y !== undefined ? ov.y : 50}%`,
                        width: 'max-content',
                        fontSize: `calc(${ov.size !== undefined ? ov.size : 20} * 0.2cqw)`,
                        color: ov.color || '#ffffff',
                        fontWeight: 'bold',
                        transform: `translate(-50%, -50%) rotate(${ov.rotation || 0}deg)`,
                        pointerEvents: 'none',
                        whiteSpace: 'pre-wrap',
                        textAlign: 'center',
                        zIndex: zIndexVal,
                        opacity: ov.opacity !== undefined ? ov.opacity : 1,
                        borderRadius: `${ov.borderRadius || 0}px`,
                        padding: `${ov.padding || 0}px`,
                        backgroundColor: ov.backgroundColor || 'transparent',
                        border: ov.borderWidth ? `${ov.borderWidth}px ${ov.borderStyle || 'solid'} ${ov.borderColor || '#ffffff'}` : 'none',
                        fontFamily: ov.fontFamily || "'product_sansregular', sans-serif",
                        textShadow: ov.hasShadow !== false ? getOverlayShadow(ov, 'text') : 'none'
                      }}
                    >
                      {ov.text}
                    </span >
                  );
                }
                return (
                  <img
                    key={ov.id || index}
                    src={ov.url}
                    alt={`Distintivo Festivo ${index + 1}`}
                    style={{
                      position: 'absolute',
                      left: `${ov.x !== undefined ? ov.x : 50}%`,
                      top: `${ov.y !== undefined ? ov.y : 50}%`,
                      width: `${ov.size !== undefined ? ov.size : 15}%`,
                      transform: `translate(-50%, -50%) rotate(${ov.rotation || 0}deg)`,
                      pointerEvents: 'none',
                      zIndex: zIndexVal,
                      opacity: ov.opacity !== undefined ? ov.opacity : 1,
                      borderRadius: `${ov.borderRadius || 0}px`,
                      padding: `${ov.padding || 0}px`,
                      backgroundColor: ov.backgroundColor || 'transparent',
                      border: ov.borderWidth ? `${ov.borderWidth}px ${ov.borderStyle || 'solid'} ${ov.borderColor || '#ffffff'}` : 'none',
                      filter: `${ov.hasShadow !== false ? `${getOverlayShadow(ov, 'filter')} ` : ''
                        }brightness(${ov.brightness !== undefined ? ov.brightness : 100}%) hue-rotate(${ov.hueRotate || 0}deg)`
                    }}
                  />
                );
              })
            ) : (
              activeFestiveTheme.logoOverlay && (
                <img
                  src={activeFestiveTheme.logoOverlay}
                  alt="Distintivo Festivo"
                  style={{
                    position: 'absolute',
                    left: `${activeFestiveTheme.logoXPercent !== undefined ? activeFestiveTheme.logoXPercent : 50}%`,
                    top: `${activeFestiveTheme.logoYPercent !== undefined ? activeFestiveTheme.logoYPercent : 50}%`,
                    width: `${activeFestiveTheme.logoSizePercent !== undefined ? activeFestiveTheme.logoSizePercent : 15}%`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 5,
                    filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.35))'
                  }}
                />
              )
            )
          )}


        </div>

        <div className="content" style={{ position: 'relative' }}>
          <div className="name" id="precios" style={{ position: 'absolute', bottom: '100%', marginBottom: '65px', zIndex: 10, width: '100%', left: 0 }}>
            <EditableField className="home-title-h1" as="h1" fieldKey="home_title" style={{ color: '#fefdfa', fontFamily: 'playlistscript', textShadow: '2px 2px 5px var(--primary-text)' }}
              value={inputValue6}
              {...commonEditableProps}
            />









            <div className="tooltip">
              {isEditable ? (
                <a className="boton-instagram">
                  <div className="contenedorBotonInstagram2">
                    {inputValue9 && <img
                      className="imagen_instagram"
                      src={inputValue9}
                      alt="Seguinos en Instagram"
                      width="38"
                      height="38"
                      onClick={(e) => { e.preventDefault(); if (isEditable) { setGalleryTarget('instagram_icon'); setIsGalleryModalOpen(true); } }}
                      style={{ cursor: 'pointer' }}
                    />}
                    <span className="tooltiptext">Visitá nuestro Instagram</span>
                  </div>
                </a>
              ) : (
                <a href={inputValue3} target="_blank" className="boton-instagram" rel="noreferrer">
                  <div className="contenedorBotonInstagram2">
                    {inputValue9 && <img className="imagen_instagram" src={inputValue9} alt="Seguinos en Instagram" width="38" height="38" />}
                    <span className="tooltiptext">Visitá nuestro Instagram</span>
                  </div>
                </a>
              )}

            </div>


          </div>

          <div className="planner" id="Chequeador">
            <div className="planner-texts">
              <EditableField
                as="span"
                fieldKey="home_text"
                value={inputValue7}
                {...commonEditableProps}
              />
              <span style={{ marginLeft: '0.3rem' }}>
                {isEditable && editingField === 'home_text_new' ? (
                  <div
                    className={`editor-wrapper ${isFocused ? 'focused' : ''}`}
                    ref={editorWrapperRef}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  >
                    <LexicalComposer initialConfig={{
                      namespace: 'HomeEditor',
                      theme,
                      onError(error) {
                        console.error(error);
                      },
                      nodes: [],
                      editorState: () => {
                        $getRoot().append($createTextNode(inputValueNewText));
                      },
                    }}>
                      <RichTextPlugin
                        contentEditable={<ContentEditable className="editor-content-editable" />}
                        placeholder={<div className="editor-placeholder">Ingresa un texto...</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                      />
                      <HistoryPlugin />
                      <MyCustomAutoFocusPlugin />
                      <OnChangePlugin onChange={(editorState) => {
                        editorState.read(() => {
                          const root = $getRoot();
                          setInputValueNewText(root.getTextContent());
                        });
                      }} />
                    </LexicalComposer>
                    <input type="text" value={inputValueNewTextHover} onChange={(e) => setInputValueNewTextHover(e.target.value)} placeholder="Texto al pasar el mouse" className="editor-url-input" />
                    <input type="text" value={inputValueNewTextUrl} onChange={(e) => setInputValueNewTextUrl(e.target.value)} placeholder="URL" className="editor-url-input" />
                    <button className="save-button" onClick={() => { onSave('home_text_new', inputValueNewText); onSave('home_text_new_hover', inputValueNewTextHover); onSave('home_text_new_url', inputValueNewTextUrl); }}>Guardar</button>
                    <button className="cancel-button" onClick={() => setEditingField(null)}>Cancelar</button>
                  </div>
                ) : (
                  <Link to={inputValueNewTextUrl} title={inputValueNewTextHover} style={{ color: 'inherit' }}>
                    <EditableField
                      as="span"
                      fieldKey="home_text_new"
                      value={inputValueNewText}
                      {...commonEditableProps}
                    />
                  </Link>
                )}
              </span>
            </div>
            <div></div>
          </div>
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          {modalTitle && <h2>{modalTitle}</h2>}
          {modalSubtitle && <p style={{ fontSize: '0.85rem', opacity: 0.75, marginTop: '-10px', marginBottom: '15px', lineHeight: '1.4' }}>{modalSubtitle}</p>}
          <ModalButtonContainer>
            <ModalButton onClick={handleChatWithJuan}>{modalButtonJuan}</ModalButton>
            <ModalButton onClick={handleChatWithIA}>{modalButtonIA}</ModalButton>
          </ModalButtonContainer>
        </Modal>
      </Section>
    </>
  );
}

const Section = styled.section`
  margin-top: 1rem;
  margin-bottom: 0rem;
  position: relative;

  @media screen and (max-width: 1080px) {
    margin-top: 3.7rem; /* Mobile needs more because body margin is 0 */
  }

  .background {
    position: relative;
    width: 100%; /* Cambiado a 100% para probar un mayor ancho */
    margin-left: auto;
    margin-right: auto;
    border-radius: 8px;
    overflow: hidden;
    height: 75vh; /* Achicada para que el calendario asome abajo */
    container-type: inline-size;

    .banner-image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      background-color: var(--card-grey);
    }
  }
  .content {
    .planner {
      border-radius: 30px; /* Burbuja redondeada */
      position: relative;
      width: fit-content;
      max-width: 90%;
      margin: auto;
      margin-top: -2.2rem; /* Sube para sobreponerse más a la foto */
      background-color: var(--card-grey);
      padding: 0.8rem 2.5rem;
      box-shadow: 0px 4px 15px var(--shadow-color, rgba(100, 100, 111, 0.4));
      text-align: center;
      color: var(--primary-text);
      font-size: 1.15rem;
      z-index: 10;
    }
    .name {
      position: absolute;
      bottom: 4.5rem; /* Ajustado para estar justo arriba de la burbuja */
      width: 100%;
      left: 0;
      text-align: center;
      margin-left: 0;
      margin-bottom: 0;
      font-family: 'playlistscript';
      font-size: 4rem; /* Un poco más grande para destacar centrado */
      color: #fefdfa !important; /* Cream instead of white */
      /* text-shadow: 2px 2px 5px var(--primary-text); */ /* Removed for consistency */

      .tooltip {
        position: relative;
        background-color: var(--card-grey);
      }
      .tooltip .tooltiptext {
        text-shadow: 0px 0px 0px var(--primary-text);
        padding:1rem;
        visibility: hidden;
        top: -5px;
        right: 105%;
        color: var(--primary-text);
        width: 200px;
        text-align: center;
        font-family: 'product_sansregular';
        font-size: 1rem;
        background-color: var(--card-grey);
        border-radius: 6px;
        position: absolute;
        z-index: 1;
      }

      .tooltip:hover .tooltiptext {
        visibility: visible;
        opacity: 0.85;
      }

      .boton-chatbot {
        position:fixed;
        width:53px;
        height:53px;
        line-height: 60px; /* Adjusted line-height for new height */
        bottom: 460px; /* <-- Nueva Posición */
        right:25px;
        background: var(--primary-color);
        color:#FFF;
        border-radius:20px;
        text-align:center;
        font-size:35px;
        box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
        z-index:100;
        transition: all 300ms ease;
        cursor: pointer;
          @media screen and (min-width: 280px) and (max-width: 1080px) {
            right: 5px;
   }
      }
      .boton-chatbot:hover {
        border-radius: 23px;
      }
      .imagen-chatbot {
        width: 49px; /* Reduced by 4px */
        height: 49px; /* Reduced by 4px */
        object-fit: contain; /* Ensures the whole image is visible */
        position:relative;
        bottom:0;
        right:0;
        text-align:center;
        z-index:100;
        transition: all 200ms ease;
        filter: drop-shadow(0.5px 0.5px 20px var(--primary-text));
        transform: scale(1); /* Reset scale to 1 */
        margin: auto; /* Center the image */
      }
      .boton-chatbot:hover .imagen-chatbot {
        transform: scale(0.9); /* Slightly smaller on hover */
        filter: drop-shadow(1px 1px 15px var(--primary-text));

      }

      .botonWasap{
        animation: shaking 2s infinite;
        position:fixed;
        width:53px;
        height:53px;
        line-height: 60px;
        bottom:400px;
        right:25px;
        background:#15a166;
        color:#FFF;
        border-radius:20px;
        text-align:center;
        font-size:35px;
        box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
        z-index:100;
        transition: all 300ms ease;
        cursor: pointer;
      }
      .botonWasap:hover{
        transition: all 200ms ease;
        border-radius: 23px;
      }
      .imagenWhatsapp{
        width:36px;
        height:36px;
        position:relative;
        top:5px;
        right:1px;
        text-align:center;
        z-index:100;
        transition: all 200ms ease;
        filter: drop-shadow(2px 2px 2px var(--primary-text));
      }
      .imagenWhatsapp:hover{
        transform: scale(0.9);
        filter: drop-shadow(1px 1px 1px var(--primary-text));
      }

      .botonShare{
        position:fixed;
        bottom:280px;
        right:25px;
        text-align:center;
        z-index:100;
        transition: all 300ms ease;
        display: none;
        .botonshare2{
          width:53px;
          height:53px;
          border-radius:20px;
          background:#15a166;
          box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
          z-index:100;
          transition: all 300ms ease;
            .imagen_compartir{
              position:fixed;
              width:30px;
              height:30px;
              bottom:292px;
              right:38px;
              filter: drop-shadow(2px 2px 2px var(--primary-text));
            }
            .imagen_compartir:hover{
              transform: scale(0.9);
              filter: drop-shadow(1px 1px 1px var(--primary-text));
              transition: all 300ms ease;
            }
        }
        .botonshare2:hover{
          border-radius:23px;
        }
      }

      .boton-instagram{
      display: none;
          position:fixed;
          width:53px;
          height:53px;
          bottom:220px;
          right:25px;
          background-image: linear-gradient(155deg, #4C57A2 8%, #87439A 50%, #e02870 85%) ;
          z-index:90;
          border-radius:20px;
          box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
          transition: all 300ms ease;
      }
       .boton-instagram:hover{
        border-radius: 23px;
        transition: all 300ms ease;
      }
      .imagen_instagram{
        width:38px;
        height:38px;
        position:absolute;
        top:7px;
        right:8px;
        filter: drop-shadow(2px 2px 2px var(--primary-text));
      }
      .imagen_instagram:hover{
        transform: scale(0.9);
        transition: all 300ms ease;
      }

      .boton-facebook{
        text-shadow: 0px 0px 0px var(--primary-text);
        position:fixed;
        width:53px;
        height:53px;
        line-height: 70px;
        bottom:160px;
        right:25px;
        background:#3b5998;
        color:#FFF;
        border-radius:20px;
        text-align:center;
        font-size:41px;
        box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
        z-index:100;
        transition: all 300ms ease;
      }
      .boton-facebook:hover{
        border-radius: 23px;
      }
      .imagen_facebook{
        filter: drop-shadow(2px 2px 2px var(--primary-text));
        margin-top:10px;
        width:25px;
        height:42px;
        z-index:100;
      }
      .imagen_facebook:hover{
        filter: drop-shadow(1px 1px 1px var(--primary-text));
        transform: scale(0.9);
        transition: all 300ms ease;
      }

      .boton-mapa{
        position:fixed;
        width:53px;
        height:53px;
        bottom:100px;
        right:25px;
        background:  linear-gradient(135deg, rgba(46,148,2,1) 0%, rgba(30,110,37,1) 49%, rgba(255,100,0,1) 50%, rgba(255,247,150,1) 50%, rgba(255,180,0,1) 59%, rgba(70,50,242,1) 59%, rgba(74,0,150,1) 88%, rgba(76,100,237,1) 100%);
        border-radius:20px;
        box-shadow: 0px 1px 10px rgba(0,0,0,0.3);
        z-index:100;
        transition: all 300ms ease;
        .imagenGoogleMaps{
          width:30px;
          height:40px;
          position:absolute;
          top:5px;
          right:11px;
          filter: drop-shadow(2px 2px 2px var(--primary-text));
        }
        .imagenGoogleMaps:hover{
          filter: drop-shadow(1px 1px 1px var(--primary-text));
          transform: scale(0.9);
          transition: all 200ms ease;
        }
      }
      .boton-mapa:hover{
        border-radius: 23px;
        .imagenGoogleMaps{
          color:var(--secondary-text);
        }
      }
    } /* Cierra .content */
  @media screen and (min-width: 280px) and (max-width: 1080px) {
    .background {
      margin: 0;
      width: 100%;
      height: auto; /* Anula los 96vh de la PC para que no desborde */
      aspect-ratio: 16/9; /* Restaura el formato banner apaisado que querías */
      border-radius: 0px;
      .banner-image {
        border-radius: 0px;
        width: 100% !important;
        height: 100%;
        object-fit: cover;
      }
    }
    .content {
                .name {
          position: absolute !important;
          top: 15vw !important;
          bottom: auto !important;
          margin-top: 0 !important;
          height: auto !important;
          display: block !important;
          z-index: 100 !important;
          pointer-events: none !important;

          left: 0;
          margin-left: 0;
          width: 100%;
          text-align: center;
          font-size: 1.1rem;
          font-weight: normal;
          color: #fefdfa !important;
          text-shadow: 2px 2px 5px var(--primary-text);
          
          h1, .home-title-h1, .tooltip {
            pointer-events: auto !important;
          }
          
          h1 {
            font-size: 1.8rem;
            font-family: 'playlistscript' !important;
          }
        }
      .botonShare{
          right:5px;
          bottom: 280px;
          .botonshare2{
            width:53px;
            height:53px;
            border-radius:20px;
            .imagen_compartir{
              position:fixed;
              width:30px;
              height:30px;
              bottom:292px;
              right:18px;
            }
            .imagen_compartir:hover{
              position:fixed;
              width:30px;
              height:30px;
              bottom:292px;
              right:18px;
            }
          }
        }
        .botonWasap{
          width:53px;
          height:53px;
          line-height: 58px;
          right: 5px;
        }
        .boton-facebook{
          font-size: 40px;
          width:53px;
          height:53px;
          line-height: 68px;
          right: 5px;
          .fa fa-facebook icono{
            line-height: 80px;
          }
        }
        .boton-instagram{
          bottom:220px;
          width:53px;
          height:53px;
          line-height: 53px;
          right: 5px;
        }
        .boton-mapa{
          width:53px;
          height:53px;
          line-height: 53px;
          right: 5px;
        }
      }
      .planner {
        align-items: center;
        text-align: center;
        position: relative;
        padding: 1rem;
        margin: auto;
        width: 65%;
        font-size: 1.3rem;
      }
    }
  }
`;

/* Force HMR update */

