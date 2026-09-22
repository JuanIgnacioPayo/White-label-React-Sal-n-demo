
import React from 'react';
import styled from 'styled-components';
import EditableField from './EditableField';

const VideoSection = ({
    isEditable,
    videoUrl,
    editingField,
    setEditingField,
    onSave
}) => {
    const getEmbedUrl = (url) => {
        if (!url) return '';

        // Expresión regular para extraer VIDEO_ID de varios formatos de YouTube
        // Soporta:
        // - youtube.com/watch?v=VIDEO_ID
        // - youtube.com/embed/VIDEO_ID
        // - youtu.be/VIDEO_ID
        // - youtube.com/v/VIDEO_ID
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);

        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }

        // Si no se encuentra un ID válido, se retorna null o la url original (aunque probablemente falle)
        // Retornamos null para manejar el error de visualización
        return null;
    };

    const finalUrl = getEmbedUrl(videoUrl);

    return (
        <Container>
            <div className="content">
                <div
                    className="video-container"
                    onClick={() => { if (isEditable) setEditingField('video_url'); }}
                    style={{ cursor: isEditable ? 'pointer' : 'default', position: 'relative' }}
                >
                    {isEditable && editingField === 'video_url' ? (
                        <div className="edit-container">
                            <label>Ingrese URL del video (YouTube):</label>
                            <EditableField
                                fieldKey="video_url"
                                value={videoUrl}
                                isEditable={isEditable}
                                editingField={editingField}
                                setEditingField={setEditingField}
                                onSave={onSave}
                            />
                        </div>
                    ) : (
                        <>
                            {isEditable && <div className="overlay"></div>}
                            {finalUrl ? (
                                <iframe
                                    src={finalUrl}
                                    title="Video Player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="placeholder">
                                    <p>{videoUrl ? "URL de video inválida" : "No hay video configurado"}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Container>
    );
};

export default VideoSection;

const Container = styled.section`
  width: 100%;
  padding: 4rem 0;
  background-color: var(--background-color); // Adjust based on theme
  
  .content {
    width: 100%;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .video-container {
    width: 100%;
    max-width: 400px; // Limit max width for vertical video aesthetic
    aspect-ratio: 9 / 16; // Vertical video ratio
    background-color: #000;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);

    iframe {
      width: 100%;
      height: 100%;
    }

    .placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 1.2rem;
    }

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10;
        background-color: rgba(0,0,0,0.1);
        transition: background-color 0.3s;
        
        &:hover {
            background-color: rgba(0,0,0,0.3);
        }
        
        &::after {
            content: 'Click para editar';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            padding: 10px 20px;
            background: rgba(0,0,0,0.6);
            border-radius: 5px;
            opacity: 0;
            transition: opacity 0.3s;
        }

        &:hover::after {
            opacity: 1;
        }
    }

    .edit-container {
        width: 100%;
        height: 100%;
        background-color: #f0f0f0;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 1rem;

        label {
            font-weight: bold;
            color: #333;
        }
    }
  }

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    width: 100%; // Follow Footer's style
    padding: 2rem 0;
    
    .content {
        width: 100%;
    }
    
    .video-container {
        width: 75%;
    }
  }
`;
