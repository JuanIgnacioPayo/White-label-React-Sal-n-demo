import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, get, update } from 'firebase/database';
import { app } from '../../firebase/firebase';
import EditableText from '../EditableText';
import SocialMediaRow from '../SocialMediaRow';



const InstagramAdminSettings = () => {
  const [embedCode1, setEmbedCode1] = useState('');
  const [embedCode2, setEmbedCode2] = useState('');
  
  const [sizes, setSizes] = useState({
    w_pc_1: '', h_pc_1: '', w_mob_1: '', h_mob_1: '',
    w_pc_2: '', h_pc_2: '', w_mob_2: '', h_mob_2: '',
    w_pc_v: '', h_pc_v: '', w_mob_v: '', h_mob_v: ''
  });

  const [showMobile1, setShowMobile1] = useState(null);
  const [showMobile2, setShowMobile2] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1023);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1023);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch current embed codes from Firebase
  useEffect(() => {
    const fetchEmbedCodes = async () => {
      setIsLoading(true);
      setError(null);
      const db = getDatabase(app);
      const dbRef = ref(db, 'datosId/25'); // Reference to the parent node
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setEmbedCode1(data.link_embebido_1 || '');
          setEmbedCode2(data.link_embebido_2 || '');
          
          setSizes({
            w_pc_1: data.w_pc_1 || '100%',
            h_pc_1: data.h_pc_1 || data.embed_height_1 || '550px',
            w_mob_1: data.w_mob_1 || '100%',
            h_mob_1: data.h_mob_1 || data.embed_height_mobile || '550px',
            
            w_pc_2: data.w_pc_2 || '100%',
            h_pc_2: data.h_pc_2 || data.embed_height_1 || '550px',
            w_mob_2: data.w_mob_2 || '100%',
            h_mob_2: data.h_mob_2 || data.embed_height_mobile || '550px',

            w_pc_v: data.w_pc_v || '100%',
            h_pc_v: data.h_pc_v || '550px',
            w_mob_v: data.w_mob_v || '100%',
            h_mob_v: data.h_mob_v || '550px',
          });

          setShowMobile1(data.show_mobile_1 !== undefined ? data.show_mobile_1 : null);
          setShowMobile2(data.show_mobile_2 !== undefined ? data.show_mobile_2 : null);
        } else {
          setEmbedCode1('');
          setEmbedCode2('');
          setShowMobile1(null);
          setShowMobile2(null);
        }

        const dbRefVideo = ref(db, 'datosId/29/video_url');
        const snapshotVideo = await get(dbRefVideo);
        if (snapshotVideo.exists()) {
            setVideoUrl(snapshotVideo.val());
        }
      } catch (err) {
        console.error('Error fetching Instagram embed codes:', err);
        setError('Error al cargar los códigos de Instagram.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmbedCodes();
  }, []);

  // Save updated embed code to Firebase
  const handleSaveEmbedCode = async (index, rawNewValue) => {
    const db = getDatabase(app);
    const dbRef = ref(db, 'datosId/25');
    const fieldName = `link_embebido_${index}`;
    try {
      await update(dbRef, { [fieldName]: rawNewValue });
      switch (index) {
        case 1: setEmbedCode1(rawNewValue); break;
        case 2: setEmbedCode2(rawNewValue); break;
        default: break;
      }
      console.log(`Código de Instagram ${index} actualizado con éxito.`);
    } catch (err) {
      console.error(`Error al guardar el código de Instagram ${index}:`, err);
      setError(`Error al guardar el código de Instagram ${index}.`);
    }
  };

  const handleSizeChange = (key, value) => {
    setSizes(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSize = async (key, value) => {
    const db = getDatabase(app);
    const dbRef = ref(db, 'datosId/25');
    try {
      await update(dbRef, { [key]: value });
      console.log(`Tamaño ${key} actualizado a ${value}.`);
    } catch (err) {
      console.error(`Error al guardar tamaño ${key}:`, err);
      setError(`Error al guardar tamaño ${key}.`);
    }
  };

  const handleSaveVideoUrl = async (newUrl) => {
    const db = getDatabase(app);
    const dbRef = ref(db, 'datosId/29');
    try {
      await update(dbRef, { video_url: newUrl });
      setVideoUrl(newUrl);
      console.log(`URL de YouTube actualizada.`);
    } catch (err) {
      console.error(`Error al guardar la URL de YouTube:`, err);
      setError(`Error al guardar la URL de YouTube.`);
    }
  };


  const handleSaveShowMobile = async (index, value) => {
    const db = getDatabase(app);
    const dbRef = ref(db, 'datosId/25');
    const fieldName = `show_mobile_${index}`;
    try {
      await update(dbRef, { [fieldName]: value });
      if (index === 1) setShowMobile1(value);
      if (index === 2) setShowMobile2(value);
      console.log(`Visibilidad móvil de la publicación ${index} actualizada a ${value}.`);
    } catch (err) {
      console.error(`Error al guardar la visibilidad móvil de la publicación ${index}:`, err);
      setError(`Error al guardar la visibilidad móvil de la publicación ${index}.`);
    }
  };

  const isShowMobile1 = showMobile1 !== null ? showMobile1 : !embedCode1.includes('facebook.com');
  const isShowMobile2 = showMobile2 !== null ? showMobile2 : !embedCode2.includes('facebook.com');

  if (isLoading) {
    return <SettingsContainer>Cargando configuración de Instagram...</SettingsContainer>;
  }

  if (error) {
    return <SettingsContainer style={{ color: 'red' }}>{error}</SettingsContainer>;
  }

  const instagramBlock = (
    <SizeEditorBlock 
      title="Tamaños (Instagram)"
      footer={
        <label style={{ color: 'var(--primary-text)', cursor: 'pointer', fontSize: '0.85rem' }}>
          <input 
            type="checkbox" 
            checked={isShowMobile1}
            onChange={(e) => handleSaveShowMobile(1, e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Mostrar en teléfonos celulares
        </label>
      }
    >
      <SizeInput label="Ancho PC" value={sizes.w_pc_1} onChange={(v) => handleSizeChange('w_pc_1', v)} onBlur={(v) => handleSaveSize('w_pc_1', v)} />
      <SizeInput label="Ancho Móvil" value={sizes.w_mob_1} onChange={(v) => handleSizeChange('w_mob_1', v)} onBlur={(v) => handleSaveSize('w_mob_1', v)} />
    </SizeEditorBlock>
  );

  const facebookBlock = (
    <SizeEditorBlock 
      title="Tamaños (Facebook)"
      footer={
        <label style={{ color: 'var(--primary-text)', cursor: 'pointer', fontSize: '0.85rem' }}>
          <input 
            type="checkbox" 
            checked={isShowMobile2}
            onChange={(e) => handleSaveShowMobile(2, e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Mostrar en teléfonos celulares
        </label>
      }
    >
      <SizeInput label="Ancho PC" value={sizes.w_pc_2} onChange={(v) => handleSizeChange('w_pc_2', v)} onBlur={(v) => handleSaveSize('w_pc_2', v)} />
      <SizeInput label="Ancho Móvil" value={sizes.w_mob_2} onChange={(v) => handleSizeChange('w_mob_2', v)} onBlur={(v) => handleSaveSize('w_mob_2', v)} />
    </SizeEditorBlock>
  );

  const youtubeBlock = (
    <SizeEditorBlock title="Tamaños (YouTube)">
      <SizeInput label="Ancho PC" value={sizes.w_pc_v} onChange={(v) => handleSizeChange('w_pc_v', v)} onBlur={(v) => handleSaveSize('w_pc_v', v)} />
      <SizeInput label="Alto PC" value={sizes.h_pc_v} onChange={(v) => handleSizeChange('h_pc_v', v)} onBlur={(v) => handleSaveSize('h_pc_v', v)} />
      <SizeInput label="Ancho Móvil" value={sizes.w_mob_v} onChange={(v) => handleSizeChange('w_mob_v', v)} onBlur={(v) => handleSaveSize('w_mob_v', v)} />
      <SizeInput label="Alto Móvil" value={sizes.h_mob_v} onChange={(v) => handleSizeChange('h_mob_v', v)} onBlur={(v) => handleSaveSize('h_mob_v', v)} />
    </SizeEditorBlock>
  );

  return (
    <SettingsContainer>
      <h2>Configuración de Redes y Video</h2>
      <p>Introduce los códigos de incrustación de Instagram, Facebook y el link de YouTube.</p>

      {isMobile ? (
        <>
          {/* --- MOBILE LAYOUT --- */}
          <h3 style={{ marginTop: '40px' }}>Publicación de Instagram</h3>
          <EditableText
            value={embedCode1}
            onSave={(newValue) => handleSaveEmbedCode(1, newValue)}
            isEditable={true}
            isTextArea={true}
            placeholder="Pega aquí el código de incrustación de Instagram..."
            className="code-preview-mobile"
          />
          <SizesSection>{instagramBlock}</SizesSection>
          <PreviewContainer>
            <h4>Previsualización</h4>
            <SocialMediaRow isEditable={false} previewEmbedCode1={embedCode1} previewSizes={sizes} previewShowMobile1={isShowMobile1} singleItem={1} />
          </PreviewContainer>

          <hr style={{ margin: '40px 0', borderColor: '#eee' }} />

          <h3 style={{ marginTop: '30px' }}>Publicación de Facebook</h3>
          <EditableText
            value={embedCode2}
            onSave={(newValue) => handleSaveEmbedCode(2, newValue)}
            isEditable={true}
            isTextArea={true}
            placeholder="Pega aquí el código de incrustación de Facebook..."
            className="code-preview-mobile"
          />
          <SizesSection>{facebookBlock}</SizesSection>
          <PreviewContainer>
            <h4>Previsualización</h4>
            <SocialMediaRow isEditable={false} previewEmbedCode2={embedCode2} previewSizes={sizes} previewShowMobile2={isShowMobile2} singleItem={2} />
          </PreviewContainer>

          <hr style={{ margin: '40px 0', borderColor: '#eee' }} />

          <h3 style={{ marginTop: '30px' }}>Video de Youtube</h3>
          <EditableText
            value={videoUrl}
            onSave={(newValue) => handleSaveVideoUrl(newValue)}
            isEditable={true}
            isTextArea={false}
            placeholder="Ej: https://youtube.com/shorts/..."
            className="code-preview-mobile"
          />
          <SizesSection>{youtubeBlock}</SizesSection>
          <PreviewContainer>
            <h4>Previsualización</h4>
            <SocialMediaRow isEditable={false} videoUrl={videoUrl} previewSizes={sizes} singleItem={3} />
          </PreviewContainer>
        </>
      ) : (
        <>
          {/* --- PC LAYOUT --- */}
          <h3 style={{ marginTop: '40px' }}>Publicación de Instagram</h3>
          <EditableText
            value={embedCode1}
            onSave={(newValue) => handleSaveEmbedCode(1, newValue)}
            isEditable={true}
            isTextArea={true}
            placeholder="Pega aquí el código de incrustación de Instagram..."
          />

          <h3 style={{ marginTop: '30px' }}>Publicación de Facebook</h3>
          <EditableText
            value={embedCode2}
            onSave={(newValue) => handleSaveEmbedCode(2, newValue)}
            isEditable={true}
            isTextArea={true}
            placeholder="Pega aquí el código de incrustación de Facebook..."
          />

          <h3 style={{ marginTop: '30px' }}>Video de Youtube</h3>
          <EditableText
            value={videoUrl}
            onSave={(newValue) => handleSaveVideoUrl(newValue)}
            isEditable={true}
            isTextArea={false}
            placeholder="Ej: https://youtube.com/shorts/..."
          />

          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
            Los códigos y altos se guardarán automáticamente al salir del campo de edición.
          </p>

          <PreviewContainer>
            <h2>Previsualización y Tamaños</h2>
            <p>Ajusta los tamaños (ej: 550px o 100%) y mira el resultado de la fila completa aquí:</p>

            <SizesSection>
              {instagramBlock}
              {facebookBlock}
              {youtubeBlock}
            </SizesSection>

            <SocialMediaRow
              isEditable={false}
              videoUrl={videoUrl}
              previewEmbedCode1={embedCode1}
              previewEmbedCode2={embedCode2}
              previewSizes={sizes}
              previewShowMobile1={isShowMobile1}
              previewShowMobile2={isShowMobile2}
            />
          </PreviewContainer>
        </>
      )}

      {isMobile && (
         <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
           Los códigos y altos se guardarán automáticamente al salir del campo de edición.
         </p>
      )}
    </SettingsContainer>
  );
};

export default InstagramAdminSettings;

const SettingsContainer = styled.div`
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  margin: auto;
  margin-top: 0rem;
  padding: 20px;
  background-color: var(--card-grey);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: hidden;

  h2, h3 {
    color: var(--primary-text);
    margin-bottom: 15px;
    text-align: center;
  }

  p {
    color: var(--primary-text);
    margin-bottom: 10px;
    text-align: center;
  }

  .editable-text-container {
    width: 100%;
    textarea {
      width: 100%;
      box-sizing: border-box;
      min-height: 150px;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9rem;
    }
  }

  /* Fixed overflow for raw code blocks when not editing */
  .code-preview-mobile {
    display: block;
    word-break: break-all;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    max-height: 150px;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid #ddd;
    box-sizing: border-box;
    width: 100%;
    padding: 10px;
  }
`;

const PreviewContainer = styled.div`
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  /* Compensate for SettingsContainer 20px padding */
  width: calc(100% + 40px);
  margin-left: -20px;
  margin-right: -20px;
  box-sizing: border-box;
  overflow-x: hidden;

  h2, p {
    color: var(--primary-text);
    text-align: center;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
`;

const HeightEditorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
`;

const SizeInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;

  label {
    color: var(--primary-text);
    margin-bottom: 5px;
    font-size: 0.85rem;
    text-align: center;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    padding: 6px;
    text-align: center;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 0.9rem;
  }
`;

const SizeInput = ({ label, value, onChange, onBlur }) => (
  <SizeInputWrapper>
    <label>{label}</label>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      onBlur={(e) => onBlur(e.target.value)} 
      placeholder="Ej: 550px o 100%"
    />
  </SizeInputWrapper>
);

const SizesSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 20px;
  margin-bottom: 30px;
  margin-top: 20px;
  width: 100%;
  box-sizing: border-box;
`;

const SizeEditorBlockContainer = styled.div`
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  width: 100%;
  box-sizing: border-box;

  h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--primary-color, #333);
    text-align: center;
    font-size: 1.1rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 5px;
  }
`;

const SizeEditorBlock = ({ title, children, footer }) => (
  <SizeEditorBlockContainer>
    <h4>{title}</h4>
    <HeightEditorGrid>
      {children}
    </HeightEditorGrid>
    {footer && <div style={{ marginTop: '15px', textAlign: 'center' }}>{footer}</div>}
  </SizeEditorBlockContainer>
);
