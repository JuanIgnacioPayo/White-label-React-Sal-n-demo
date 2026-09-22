import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get, set } from 'firebase/database';
import { app } from '../../firebase/firebase';
import styled, { createGlobalStyle } from 'styled-components';
import { toast } from 'react-toastify';

const FloatingButtonContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 10px;
`;

const FacebookIframe = styled.iframe`
  border: 1px solid var(--secondary-text);
 
  justify-content:center;
  border-radius: 12px;
  margin: 0 0;
  align-items:center;
  background-color: var(--white-text);
  width: 100%;
  
  }
`;

const FacebookIframeWrapper = styled.div`
  position: relative;
  width: 25rem;
  margin: 0 auto;

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    width: 100%;
  }
`;

// ... (Los estilos globales se mantienen igual)
const GlobalStyle = createGlobalStyle`
  .form-publicaciones {
  
    max-width: 1000px;
    margin-top: 0rem;
    margin-left:auto;
    margin-right:auto;
    padding: 1rem;
    padding-bottom: 120px; /* Added padding for floating buttons */
    background-color: var(--card-grey);
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: 'product_sansregular';

    @media screen and (min-width: 280px) and (max-width: 1080px) {
    width: 100%;
  
    .preview{
    display: none;
  }
  }
  }

  .form-publicaciones h2 {
    text-align: center;
    margin-bottom: 2rem;
    
    color: #333;
  }

  .publicacion-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .publicacion-card label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
  }

  
  
  /* MODIFICADO: Estilos para el textarea */
  .publicacion-card textarea {
    width: 100%;
    min-height: 100px; /* Altura mínima para el textarea */
    padding: 0.5rem;
    font-size: 0.95rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-family: 'monospace'; /* Usar una fuente monoespaciada es mejor para código */
    resize: vertical; /* Permitir redimensionar verticalmente */
  }

  button {
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
  }

  button:hover {
    background-color: var(--primaryText, #111241);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }

  
`;


export default function FormPublicacionesEmbebidas({ toggle }) {
  const [publicaciones, setPublicaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // AGREGADO: Estado local para manejar el contenido de los textareas
  const [textInputs, setTextInputs] = useState([]);

  useEffect(() => {
    const fetchPublicaciones = async () => {
      try {
        const db = getDatabase(app);
        const dbRef = ref(db, `datosId/${toggle}/publicaciones_embebidas`);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const data = snapshot.val() || [];
          // Nos aseguramos que sea un array y filtramos posibles nulos si Firebase los creó
          const validData = Array.isArray(data) ? data.filter(p => p) : Object.values(data);
          setPublicaciones(validData);
          // Inicializamos los textareas con una representación del código guardado
          setTextInputs(validData.map(pub => `<iframe src="${pub.src}" height="${pub.height}" ...></iframe>`));
        } else {
          setPublicaciones([]);
          setTextInputs([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicaciones();
  }, [toggle]);

  // MODIFICADO: Nueva función para manejar el cambio en el textarea
  const handleIframeChange = (index, fullCode) => {
    // 1. Actualiza el contenido visible del textarea inmediatamente
    const updatedTextInputs = [...textInputs];
    updatedTextInputs[index] = fullCode;
    setTextInputs(updatedTextInputs);

    // 2. Extrae 'src' y 'height' del código pegado usando expresiones regulares
    const srcMatch = fullCode.match(/src="([^"]*)"/);
    const heightMatch = fullCode.match(/height="([^"]*)"/);

    const src = srcMatch ? srcMatch[1] : '';
    const height = heightMatch ? heightMatch[1] : '188'; // Valor por defecto si no encuentra altura

    // 3. Actualiza el estado principal que se guardará en Firebase
    const updatedPublicaciones = [...publicaciones];
    updatedPublicaciones[index] = { ...updatedPublicaciones[index], src, height };
    setPublicaciones(updatedPublicaciones);
  };

  // MODIFICADO: addPublicacion ahora también maneja el estado del textarea
  const addPublicacion = () => {
    if (publicaciones.length >= 30) {
      toast.warn('Se ha alcanzado el número máximo de publicaciones.');
      return;
    }
    setPublicaciones([{ src: '', height: '' }, ...publicaciones]);
    setTextInputs(['', ...textInputs]); // Agrega un textarea vacío
    toast.success('Nueva publicación agregada a la lista.');
  };

  // MODIFICADO: deletePublicacion ahora también maneja el estado del textarea
  const deletePublicacion = (index) => {
    setPublicaciones(publicaciones.filter((_, i) => i !== index));
    setTextInputs(textInputs.filter((_, i) => i !== index));
    toast.success('Publicación eliminada de la lista.');
  };

  const guardarPublicaciones = async () => {
    const db = getDatabase(app);
    const dbRef = ref(db, `datosId/${toggle}/publicaciones_embebidas`);
    // Filtramos cualquier publicación que haya quedado con 'src' vacío
    const publicacionesValidas = publicaciones.filter(p => p.src && p.src.trim() !== '');

    try {
      await set(dbRef, publicacionesValidas);
      toast.success('Publicaciones actualizadas con éxito.');
    } catch (error) {
      console.error('Error al guardar las publicaciones:', error);
      toast.error('Error al guardar las publicaciones.');
    }
  };

  return (
    <>
      <GlobalStyle />
      <div className="form-publicaciones">
        <h2>Publicaciones embebidas de Facebook</h2>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <p>⏳ Cargando publicaciones...</p>
          </div>
        ) : (
          <>
            {publicaciones.map((pub, index) => (
              <div className="publicacion-card" key={index}>
            {/* MODIFICADO: Reemplazamos los dos inputs por un solo textarea */}
            <label>Pega el código <code>&lt;iframe&gt;</code> de Facebook aquí:</label>
            <textarea
              value={textInputs[index] || ''}
              onChange={(e) => handleIframeChange(index, e.target.value)}
              placeholder="<iframe src=... width=... height=... ></iframe>"
            />
            {/* Mostramos los valores extraídos como solo lectura para confirmación visual */}
            {pub.src && (
              <div style={{ fontSize: '0.8rem', background: '#f0f0f0', padding: '8px', borderRadius: '4px', marginTop: '-8px', marginBottom: '8px' }}>
                <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><strong>URL (src) extraída:</strong> {pub.src.substring(0, 100)}...</p>
                <p style={{ margin: 0 }}><strong>Altura (height) extraída:</strong> {pub.height}px</p>
              </div>
            )}
            <button onClick={() => deletePublicacion(index)}>Eliminar</button>
            {pub.src && (
              <div className="preview" >
                <label >Previsualización:</label>
                <FacebookIframeWrapper>
                  <FacebookIframe
                    src={pub.src}
                    height={pub.height}
                    scrolling="no"
                    frameBorder="0"
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; unload"
                  />
                </FacebookIframeWrapper>
              </div>
            )}
          </div>
        ))}
        </>
        )}
      </div>
      <FloatingButtonContainer>
        <button onClick={addPublicacion}>Agregar Publicación</button>
        <button onClick={guardarPublicaciones}>Guardar Todas</button>
      </FloatingButtonContainer>
    </>
  );
}