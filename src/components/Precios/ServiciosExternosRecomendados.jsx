import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import EditableText from '../EditableText';
import { uploadToFirebaseStorage } from '../../utils/storageUpload';
import { app } from '../../firebase/firebase';
import { FaWhatsapp, FaInstagram, FaFacebook } from 'react-icons/fa';

const getIconForUrl = (url) => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('whatsapp') || lowerUrl.includes('wa.me')) return <FaWhatsapp style={{ marginRight: '5px', fontSize: '1.2em' }} />;
  if (lowerUrl.includes('instagram')) return <FaInstagram style={{ marginRight: '5px', fontSize: '1.2em' }} />;
  if (lowerUrl.includes('facebook') || lowerUrl.includes('fb.me') || lowerUrl.includes('fb.com')) return <FaFacebook style={{ marginRight: '5px', fontSize: '1.2em' }} />;
  return null;
};

const StyledExternalServiceButton = styled.button`
  margin-top: auto; /* Push to the bottom */
  /* margin: auto; -- removed */
  border: none;
  background-color: var(--app-primary-text-color, var(--primary-color));
  color: var(--white-text);
  padding: 0.5rem;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  /* font-size: 1rem; -- removed */
  bottom: 0;
  transition: 0.2s ease-in-out;
  cursor: pointer;
  width: 100%;
  border-radius: 5px;
  height: 2rem;
  text-shadow: 0.5px 0.5px 2px var(--primary-text);
  box-shadow: 0px 0.5px 2px rgba(0,0,0,0.6);
  font-family: 'product_sansregular';
  z-index: 2; /* Ensure button is above hover image */
  /* align-items: center; -- removed */

  h5 {
    font-size: 0.9rem; /* Desktop font size - 0.1rem */
  }

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    h5 {
      font-size: 0.8rem; /* Mobile font size (no change) */
    }
  }
`;

const StyledRemoveButton = styled(StyledExternalServiceButton)`
  background-color: #dc3545;
  width: auto;
  height: auto;
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  margin-top: 0.5rem;

  &:hover {
    background-color: #c82333;
  }
`;

const StyledChangeLinkButton = styled(StyledExternalServiceButton)`
  background-color: #007bff;
  width: auto;
  height: auto;
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  margin-top: 0.5rem;

  &:hover {
    background-color: #0056b3;
  }
`;

const ServiciosContainer = styled.div`

width: 100%;

  /* Estilos para el contenedor de servicios */
  .grid {
    .Opcionales2 {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      /* flex-wrap: wrap; -- removed */
      /* justify-content: space-around; -- removed */
      gap: 1rem;
      padding: 1rem;
      list-style: none;
      margin: 0;

      /* Desktop/Tablet li.servicio styles */
      li.servicio {
        position: relative; /* Needed for image hover positioning */
        display: flex;
        flex-direction: column;
        /* justify-content: space-between; -- removed */
        align-items: center;
        text-align: center;
        padding: 0.5rem;
        min-height: 175px; 
        /* overflow: hidden; -- removed */
        border-radius: 10px; /* Rounded borders */
        width: 100%; /* Set explicit width for each cell */

        > div {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        span {
          overflow-wrap: break-word;
        }

        .service-image-hover {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          pointer-events: none;
          border-radius: 10px;
          z-index: 1;
        }

        .service-content {
          z-index: 2;
          width: 100%;
          /* height: 100%; -- removed */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex-grow: 1; /* Added to make it take available space */
        }

        .service-description {
          transition: opacity 0.3s ease-in-out;
        }

        &.has-image:hover .service-image-hover {
          opacity: 1;
        }

        &.has-image:not(.admin-mode):hover .service-description {
          opacity: 0;
        }

        &.has-image:hover {
          ${StyledExternalServiceButton} {
            background-color: rgba(148, 137, 36, 0.5);
          }
          ${StyledRemoveButton} {
            background-color: rgba(220, 53, 69, 0.5);
          }
          ${StyledChangeLinkButton} {
            background-color: rgba(0, 123, 255, 0.5);
          }
        }
      }

      @media screen and (min-width: 280px) and (max-width: 1080px) {
        display: flex; /* Change to flex for mobile */
        flex-wrap: wrap; /* Allow items to wrap to the next line */
        justify-content: space-around; /* Distribute items with space around them */

        li.servicio {
          width: 45%; /* Set explicit width for each cell on mobile */
          min-height: 200px; /* Minimum height for uniformity on mobile */
          /* overflow: hidden; -- removed */
        }
      }
    }
  }

  .carrito {
  .carrito-titulo-container {
      font-size: 1em;
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
      padding:10px;
      margin-right:0; 
      margin-left:0;

    }
    }
  
`;

const TruncatedUrl = styled.div`
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledAddButton = styled(StyledExternalServiceButton)`
  background-color: #28a745;
  width: auto;
  height: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;

  &:hover {
    background-color: #218838;
  }
`;

export default function ServiciosExternosRecomendados({
  externalServices,
  onAddService,
  onRemoveService,
  onSaveService,
  openWhatsappLink,
  bannerTitle,
  onSaveBannerTitle,
  currentUser
}) {
  const [editingUrlId, setEditingUrlId] = useState(null);
  const [editingSocialUrlId, setEditingSocialUrlId] = useState(null);
  const [editingImageUrlId, setEditingImageUrlId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleImageUpload = async (serviceId) => {
    if (!imageFile) {
      alert("Por favor, seleccione una imagen para subir.");
      return;
    }

    setUploading(true);
    try {
      const downloadURL = await uploadToFirebaseStorage(imageFile);
      await onSaveService(serviceId, 'imageUrl', downloadURL);
      alert("Imagen subida y guardada exitosamente.");
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      alert('Error al subir la imagen. No se guardaron los cambios.');
    } finally {
      setUploading(false);
      setEditingImageUrlId(null);
      setImageFile(null); // Clear imageFile after upload
    }
  };


  return (

    <>
      <p className="space"></p>
      <ServiciosContainer>
        <h2 className="banner2 ">
          <EditableText
            value={bannerTitle}
            onSave={onSaveBannerTitle}
            isEditable={!!currentUser}
          />
        </h2>
        <div className="grid">
          <ul className="Opcionales2">
            {externalServices.map((service) => (
              <li className={`servicio ${service.imageUrl ? 'has-image' : ''} ${currentUser ? 'admin-mode' : ''}`} key={service.id}>
                {service.imageUrl && <img src={`${service.imageUrl}&t=${new Date().getTime()}`} alt={service.text} className="service-image-hover" />}
                <div className="service-content">
                  <div className="service-description">
                    <EditableText
                      value={service.text}
                      onSave={(newValue) => onSaveService(service.id, 'text', newValue)}
                      isEditable={!!currentUser}
                      isTextArea={true}
                    />
                  </div>
                  <div> {/* New wrapper div for content above the main button */}
                    {currentUser && (
                      <div> {/* Existing wrapper div for URL and Remove Button */}
                        {editingUrlId === service.id ? (
                          <EditableText
                            value={service.url}
                            onSave={(newValue) => {
                              if (newValue !== service.url) {
                                onSaveService(service.id, 'url', newValue);
                              }
                              setEditingUrlId(null);
                            }}
                            isEditable={true}
                            placeholder="URL del botón"
                            startInEditMode={true}
                          />
                        ) : editingImageUrlId === service.id ? (
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              ref={fileInputRef}
                              style={{ display: 'none' }} // Hide the native input
                            />
                            <StyledChangeLinkButton onClick={() => fileInputRef.current.click()}>
                              Seleccionar Archivo
                            </StyledChangeLinkButton>
                            {imageFile && <span>{imageFile.name}</span>} {/* Display file name if selected */}
                            <StyledChangeLinkButton onClick={() => handleImageUpload(service.id)} disabled={uploading}>
                              {uploading ? 'Subiendo...' : 'Subir Imagen'}
                            </StyledChangeLinkButton>
                            <StyledChangeLinkButton onClick={() => {
                              setEditingImageUrlId(null);
                              setImageFile(null); // Clear imageFile on cancel
                            }}>
                              Cancelar
                            </StyledChangeLinkButton>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <StyledChangeLinkButton onClick={() => setEditingUrlId(service.id)}>
                              URL de redirección
                            </StyledChangeLinkButton>
                            <StyledChangeLinkButton onClick={() => setEditingSocialUrlId(service.id)}>
                              URL de Red Social
                            </StyledChangeLinkButton>
                            <StyledChangeLinkButton onClick={() => setEditingImageUrlId(service.id)}>
                              {service.imageUrl ? 'Ok' : 'Cambiar Imagen'}
                            </StyledChangeLinkButton>
                            <StyledRemoveButton onClick={() => onRemoveService(service.id)}>
                              Eliminar
                            </StyledRemoveButton>
                          </div>
                        )}
                        {editingSocialUrlId === service.id && (
                          <EditableText
                            value={service.socialUrl}
                            onSave={(newValue) => {
                              if (newValue !== service.socialUrl) {
                                onSaveService(service.id, 'socialUrl', newValue);
                              }
                              setEditingSocialUrlId(null);
                            }} isEditable={true}
                            placeholder="URL de la red social"
                            startInEditMode={true}
                          />
                        )}
                      </div>
                    )}
                  </div> {/* Closing tag for New wrapper div */}

                </div>
                {/* Main button block */}
                {currentUser ? (
                  <StyledExternalServiceButton
                    onClick={currentUser ? undefined : () => openWhatsappLink(service.url)}
                  >
                    <h5 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getIconForUrl(service.url)}
                      <EditableText
                        value={service.buttonText}
                        onSave={(newValue) => onSaveService(service.id, 'buttonText', newValue)}
                        isEditable={true}
                        as="span"
                      />
                    </h5>
                  </StyledExternalServiceButton>) : (
                  <StyledExternalServiceButton onClick={() => openWhatsappLink(service.url)}>
                    <h5 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getIconForUrl(service.url)}
                      {service.buttonText}
                    </h5>
                  </StyledExternalServiceButton>
                )}
                {/* Social button block */}
                {service.socialUrl && (
                  currentUser ? (
                    <StyledExternalServiceButton
                      onClick={currentUser ? undefined : () => openWhatsappLink(service.socialUrl)}
                    >
                      <h5 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getIconForUrl(service.socialUrl)}
                        <EditableText
                          value={service.socialButtonText || 'Red Social'}
                          onSave={(newValue) => onSaveService(service.id, 'socialButtonText', newValue)}
                          isEditable={true}
                          as="span"
                        />
                      </h5>
                    </StyledExternalServiceButton>
                  ) : (
                    <StyledExternalServiceButton onClick={() => openWhatsappLink(service.socialUrl)}>
                      <h5 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getIconForUrl(service.socialUrl)}
                        {service.socialButtonText}
                      </h5>
                    </StyledExternalServiceButton>
                  )
                )}
              </li>
            ))}
          </ul>
        </div>
      </ServiciosContainer>
      {currentUser && (
        <StyledAddButton onClick={onAddService}>
          Agregar Servicio Recomendado
        </StyledAddButton>
      )}
    </>
  );
}