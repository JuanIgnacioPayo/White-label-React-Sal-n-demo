import styled, { createGlobalStyle } from "styled-components";
import React, { useState, useEffect, useRef } from 'react';
import { app } from "../../firebase/firebase"
import { getDatabase, ref, get, update } from "firebase/database";
import { uploadToFirebaseStorage } from '../../utils/storageUpload';
import { compressImageForWeb } from '../../utils/imageUtils';
import { toast } from 'react-toastify';
import EditableText from '../EditableText';
import { useAuth } from '../../contexts/authContext';
import { FaTrash, FaPlus } from "react-icons/fa";
import { formatTitleWithDate, formatDescWithDate } from '../../utils/dateUtils';

const GlobalStyle = createGlobalStyle`
  .form-previsualizaciones {
    max-width: 1000px;
    margin: auto;
    top: 0rem;
    padding: 1rem;
    padding-bottom: 120px;
    background-color: var(--card-grey);
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: 'product_sansregular';
    margin-top: 0rem;
  }

  .form-previsualizaciones h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .previsualizaciones-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .field-group {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label {
    font-weight: bold;
    color: #555;
    font-size: 0.9rem;
  }

  .image-container {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-top: 10px;
  }

  .image-preview-box {
    cursor: pointer;
    border: 2px dashed #ccc;
    padding: 10px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #f9f9f9;
    min-width: 150px;
    min-height: 100px;
    transition: all 0.2s;
  }

  .image-preview-box:hover {
    border-color: var(--primary-color);
    background: #f0f0f0;
  }

  .image-preview-img {
    max-width: 200px;
    max-height: 150px;
    object-fit: contain;
    border-radius: 4px;
  }

  .delete-btn {
    cursor: pointer;
    color: #ff4d4d;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff0f0;
    border: 1px solid #ffcccc;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background: #ffe0e0;
    transform: scale(1.1);
  }

  .whatsapp-preview-container {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #e5ddd5;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .whatsapp-preview-container > h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1rem;
    color: #4a4a4a;
    align-self: flex-start;
  }

  .whatsapp-bubble {
    background: #dcf8c6; /* typical green bubble for sender */
    border-radius: 8px;
    padding: 4px;
    max-width: 320px;
    width: 100%;
    box-shadow: 0 1px 1px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    position: relative;
    margin: 0 auto; /* Centers the bubble */
    align-self: center;
  }

  .whatsapp-bubble::after {
    content: '';
    position: absolute;
    top: 0;
    right: -8px;
    width: 0;
    height: 0;
    border: 10px solid transparent;
    border-top-color: #dcf8c6;
    border-right: 0;
    border-bottom: 0;
    margin-top: 0;
    margin-right: -2px;
  }

  .whatsapp-link-card {
    background-color: #e5efeb; /* slightly darker green background for the card inside the bubble */
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin-bottom: 2px;
  }

  .whatsapp-image-container {
    width: 100%;
    height: 160px;
    background-color: #cfd8d4;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .whatsapp-upload-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px;
    box-sizing: border-box;
    text-align: center;
  }

  .whatsapp-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e0e0e0;
    border-top: 3px solid #00897b;
    border-radius: 50%;
    animation: wpSpin 0.8s linear infinite;
  }

  @keyframes wpSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .whatsapp-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .whatsapp-text-content {
    padding: 8px 12px;
    border-left: 3px solid #00897b;
  }

  .whatsapp-title {
    font-weight: bold;
    font-size: 14px;
    color: #111;
    margin-bottom: 2px;
    font-family: Arial, sans-serif;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .whatsapp-desc {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
    font-family: Arial, sans-serif;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .whatsapp-url {
    font-size: 11px;
    color: #999;
    text-transform: lowercase;
    font-family: Arial, sans-serif;
  }
`;

export default function FormPrevisualizaciones() {
  const { currentUser } = useAuth();
  const [selectedPage, setSelectedPage] = useState(() => {
    try {
      return sessionStorage.getItem('previsualizaciones_selected_page') || '';
    } catch {
      return '';
    }
  });
  const [headerConfig, setHeaderConfig] = useState({
    shareTitle: 'Lista de precios',
    shareDescription: 'Vení a conocer nuestro salón de eventos en Parque Patricios. Precios actualizados y reservas online.',
    shareImageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const shareImageInputRef = useRef(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const db = getDatabase(app);
        const configPath = selectedPage ? `config/preciosDinamicoHeader_${selectedPage}` : 'config/preciosDinamicoHeader';
        const configRef = ref(db, configPath);
        const snapshot = await get(configRef);
        if (snapshot.exists()) {
          const val = snapshot.val();
          setHeaderConfig({
            shareTitle: val.shareTitle || (selectedPage === 'precios_fecha' ? 'Precios para el día {fecha}' : ''),
            shareDescription: val.shareDescription || (selectedPage === 'precios_fecha' ? 'Consultá los precios y servicios disponibles para el día {fecha} en Salón Magic Eventos.' : ''),
            shareImageUrl: val.shareImageUrl || ''
          });
        } else {
          // Si no hay configuración específica para esa página, reseteamos a vacío para que llenen.
          setHeaderConfig({
            shareTitle: selectedPage === 'precios_fecha' ? 'Precios para el día {fecha}' : '',
            shareDescription: selectedPage === 'precios_fecha' ? 'Consultá los precios y servicios disponibles para el día {fecha} en Salón Magic Eventos.' : '',
            shareImageUrl: ''
          });
        }
      } catch (err) {
        console.error("Error fetching preview config:", err);
        toast.error("Error al cargar la configuración de previsualización.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [selectedPage]);

  const handleSaveField = async (field, newValue) => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión como administrador.");
      return;
    }
    try {
      const db = getDatabase(app);
      const configPath = selectedPage ? `config/preciosDinamicoHeader_${selectedPage}` : 'config/preciosDinamicoHeader';
      const configRef = ref(db, configPath);
      await update(configRef, { [field]: newValue });
      setHeaderConfig(prev => ({ ...prev, [field]: newValue }));
      toast.success("Campo actualizado correctamente");
    } catch (err) {
      console.error(`Error saving ${field}:`, err);
      toast.error("Error al guardar el campo.");
    }
  };

  const handleShareImageChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!currentUser) {
      toast.error("Debes iniciar sesión para subir imágenes.");
      return;
    }

    setIsUploading(true);
    setUploadProgressText("Optimizando foto para redes...");
    try {
      toast.info("Optimizando y subiendo imagen...");
      // Compresión cliente: crucial en móviles para convertir fotos de 10-15MB en ~150-250KB JPEG
      const compressedFile = await compressImageForWeb(file, 1200, 1200, 0.85);

      setUploadProgressText("Subiendo a la nube...");
      const downloadURL = await uploadToFirebaseStorage(compressedFile);

      setUploadProgressText("Guardando configuración...");
      await handleSaveField('shareImageUrl', downloadURL);
      setHeaderConfig(prev => ({ ...prev, shareImageUrl: downloadURL }));
      toast.success("Imagen para redes actualizada con éxito");
    } catch (error) {
      console.error("Error uploading share image:", error);
      toast.error("Error al subir la imagen: " + (error.message || "Error desconocido"));
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleShareImageClick = () => {
    if (isUploading) return;
    if (!currentUser) {
      toast.warning("Debes iniciar sesión para modificar la imagen.");
      return;
    }
    if (shareImageInputRef.current) {
      shareImageInputRef.current.click();
    }
  };

  const handleShareImageDelete = async () => {
    if (isUploading) return;
    try {
      await handleSaveField('shareImageUrl', '');
      setHeaderConfig(prev => ({ ...prev, shareImageUrl: '' }));
      toast.success("Imagen de previsualización eliminada");
    } catch (error) {
      console.error("Error deleting share image:", error);
      toast.error("Error al eliminar la imagen");
    }
  };

  const handlePageSelect = (pageKey) => {
    setSelectedPage(pageKey);
    try {
      sessionStorage.setItem('previsualizaciones_selected_page', pageKey);
    } catch (e) {
      console.warn("Error guardando en sessionStorage:", e);
    }
  };

  const defaultTitle = selectedPage === 'precios_fecha' 
    ? 'Precios para el día {fecha}' 
    : 'Lista de precios';
  const defaultDesc = selectedPage === 'precios_fecha' 
    ? 'Consultá los precios y servicios disponibles para el día {fecha} en Salón Magic Eventos.' 
    : 'Vení a conocer nuestro salón de eventos. Precios actualizados y reservas online.';

  if (loading) return <div>Cargando...</div>;

  return (
    <>
      <GlobalStyle />
      <div className="form-previsualizaciones">
        <h2>Configuración de Previsualizaciones (WhatsApp / Redes)</h2>
        <div className="previsualizaciones-card">

          <div className="field-group" style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
            <span className="field-label">Seleccionar página a configurar:</span>
            <select 
              value={selectedPage} 
              onChange={(e) => handlePageSelect(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem', marginTop: '5px' }}
            >
              <option value="">General / Por Defecto</option>
              <option value="home">Home (/)</option>
              <option value="horarios">Horarios (/horarios)</option>
              <option value="precios">Precios Base (/precios)</option>
              <option value="precios_fecha">Precios con Fecha Específica (/precios?fecha=...)</option>
              <option value="precios_1">Enero (/precios/1)</option>
              <option value="precios_2">Febrero (/precios/2)</option>
              <option value="precios_3">Marzo (/precios/3)</option>
              <option value="precios_4">Abril (/precios/4)</option>
              <option value="precios_5">Mayo (/precios/5)</option>
              <option value="precios_6">Junio (/precios/6)</option>
              <option value="precios_7">Julio (/precios/7)</option>
              <option value="precios_8">Agosto (/precios/8)</option>
              <option value="precios_9">Septiembre (/precios/9)</option>
              <option value="precios_10">Octubre (/precios/10)</option>
              <option value="precios_11">Noviembre (/precios/11)</option>
              <option value="precios_12">Diciembre (/precios/12)</option>
              <option value="preciosfinde">Precios Finde (/preciosfinde)</option>
              <option value="preciospromo">Precios Promo (/preciospromo)</option>
              <option value="plano">Plano (/Plano)</option>
              <option value="fotos">Fotos (/fotos)</option>
              <option value="fotosSalon">Fotos Salón (/fotosSalon)</option>
              <option value="fotosCocina">Fotos Cocina (/fotosCocina)</option>
              <option value="FotosOpcionales">Fotos Opcionales (/FotosOpcionales)</option>
              <option value="calculadora">Calculadora (/calculadora)</option>
            </select>
          </div>

          {selectedPage === 'precios_fecha' && (
            <div style={{
              backgroundColor: '#e7f3ff',
              border: '1px solid #b6d4fe',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '1.5rem',
              color: '#084298',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📅</span> Previsualización para enlaces con fecha específica:
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Podés usar la etiqueta <code>{'{fecha}'}</code> en el título y la descripción. Al compartir enlaces como <code>/precios?fecha=2026-09-25...</code>, se reemplazará automáticamente por el nombre del día de la semana y la fecha completa (ej: <em>viernes 25 de septiembre de 2026</em>).
              </p>
            </div>
          )}

          <p style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>
            Doble clic sobre el título o la descripción para editarlos. Haz clic sobre la zona de la imagen para cambiarla.
          </p>

          <input
            type="file"
            ref={shareImageInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleShareImageChange}
          />
          
          <div className="whatsapp-preview-container" style={{ marginTop: '0' }}>
            <div className="whatsapp-bubble">
              <div className="whatsapp-link-card">
                
                <div 
                  className="whatsapp-image-container" 
                  onClick={handleShareImageClick}
                  style={{ cursor: isUploading ? 'wait' : 'pointer', position: 'relative' }}
                  title={isUploading ? "Subiendo..." : "Haz clic para modificar la imagen"}
                >
                  {isUploading ? (
                    <div className="whatsapp-upload-loading">
                      <div className="whatsapp-spinner"></div>
                      <span style={{ fontSize: '12px', color: '#333', marginTop: '8px', fontWeight: 'bold' }}>
                        {uploadProgressText || 'Cargando imagen...'}
                      </span>
                    </div>
                  ) : headerConfig.shareImageUrl ? (
                    <>
                      <img src={headerConfig.shareImageUrl} alt="OG Preview" className="whatsapp-image" />
                      <div 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleShareImageDelete();
                        }}
                        style={{ 
                          position: 'absolute', top: '10px', right: '10px', background: 'white', 
                          border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', 
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', 
                          justifyContent: 'center', zIndex: 10, pointerEvents: 'auto'
                        }}
                        title="Eliminar imagen"
                      >
                        <FaTrash color="#ff4d4d" size="12px" />
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#888' }}>
                      <FaPlus size="24px" style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '12px' }}>Añadir imagen</span>
                    </div>
                  )}
                </div>

                <div className="whatsapp-text-content">
                  <div className="whatsapp-title">
                    <EditableText
                      value={headerConfig.shareTitle || defaultTitle}
                      onSave={(newValue) => handleSaveField('shareTitle', newValue || defaultTitle)}
                      isEditable={!!currentUser}
                    />
                  </div>
                  <div className="whatsapp-desc">
                    <EditableText
                      value={headerConfig.shareDescription || defaultDesc}
                      onSave={(newValue) => handleSaveField('shareDescription', newValue || defaultDesc)}
                      isEditable={!!currentUser}
                      isTextArea={true}
                    />
                  </div>
                  <div className="whatsapp-url">
                    {selectedPage === 'precios_fecha' ? 'salonmagic.com.ar/precios?fecha=2026-09-25...' : 'salonmagic.com.ar'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#999', alignSelf: 'flex-end', padding: '2px 4px 0 0' }}>12:00</div>
            </div>

            {selectedPage === 'precios_fecha' && (
              <div style={{
                marginTop: '1.25rem',
                background: '#ffffff',
                border: '1px dashed #00897b',
                borderRadius: '8px',
                padding: '12px 16px',
                maxWidth: '380px',
                width: '100%',
                boxSizing: 'border-box',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00897b', marginBottom: '6px' }}>
                  ✨ Vista previa final en WhatsApp (ejemplo con fecha 25/09/2026):
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.92rem', color: '#111', marginBottom: '4px' }}>
                  {formatTitleWithDate(headerConfig.shareTitle || defaultTitle, '2026-09-25')}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#555', lineHeight: '1.4' }}>
                  {formatDescWithDate(headerConfig.shareDescription || defaultDesc, '2026-09-25')}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
