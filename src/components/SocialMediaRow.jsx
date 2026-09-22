import React, { useState, useEffect, useRef } from 'react';
import styled from "styled-components";
import { app } from "../firebase/firebase.js";
import { getDatabase, ref, get } from "firebase/database";
import { processEmbedCode } from '../utils/embedConverter.js';
import './InstagramPost.js'; // Import to register the custom element
import EditableField from './EditableField.jsx';

const SocialMediaRow = ({ 
    isEditable, 
    videoUrl, 
    editingField, 
    setEditingField, 
    onSave,
    previewEmbedCode1,
    previewEmbedCode2,
    previewSizes,
    previewShowMobile1,
    previewShowMobile2,
    singleItem // 1, 2, or 3
}) => {
  const [firebaseEmbedCode1, setFirebaseEmbedCode1] = useState("");
  const [firebaseEmbedCode2, setFirebaseEmbedCode2] = useState("");
  const [firebaseSizes, setFirebaseSizes] = useState({
    w_pc_1: '100%', h_pc_1: '550px', w_mob_1: '100%', h_mob_1: '550px',
    w_pc_2: '100%', h_pc_2: '550px', w_mob_2: '100%', h_mob_2: '550px',
    w_pc_v: '100%', h_pc_v: '550px', w_mob_v: '100%', h_mob_v: '550px'
  });
  const [firebaseShowMobile1, setFirebaseShowMobile1] = useState(null);
  const [firebaseShowMobile2, setFirebaseShowMobile2] = useState(null);
  const [instagramLogo, setInstagramLogo] = useState("");
  const [facebookLogo, setFacebookLogo] = useState("");

  const currentEmbedCode1 = previewEmbedCode1 !== undefined ? previewEmbedCode1 : firebaseEmbedCode1;
  const currentEmbedCode2 = previewEmbedCode2 !== undefined ? previewEmbedCode2 : firebaseEmbedCode2;
  const currentSizes = previewSizes || firebaseSizes;

  const showMobile1 = previewShowMobile1 !== undefined ? previewShowMobile1 : 
    (firebaseShowMobile1 !== null ? firebaseShowMobile1 : !currentEmbedCode1.includes('facebook.com'));
  
  const showMobile2 = previewShowMobile2 !== undefined ? previewShowMobile2 : 
    (firebaseShowMobile2 !== null ? firebaseShowMobile2 : !currentEmbedCode2.includes('facebook.com'));

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1023);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1023);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Fetch Instagram posts from Firebase
    const db = getDatabase(app);
    const dbRef = ref(db, 'datosId/25');
    get(dbRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setFirebaseEmbedCode1(data.link_embebido_1 || '');
        setFirebaseEmbedCode2(data.link_embebido_2 || '');
        setFirebaseSizes({
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
        if (data.show_mobile_1 !== undefined) setFirebaseShowMobile1(data.show_mobile_1);
        if (data.show_mobile_2 !== undefined) setFirebaseShowMobile2(data.show_mobile_2);
        if (data.link_cuadrado_de_instagram) setInstagramLogo(data.link_cuadrado_de_instagram);
      }
    }).catch(error => {
      console.error("Error fetching Instagram data:", error);
    });

    // Fetch Facebook floating button icon for the social media cards
    const fbButtonRef = ref(db, 'floatingButtons/facebookButton/icon');
    get(fbButtonRef).then(snapshot => {
      if (snapshot.exists()) {
        setFacebookLogo(snapshot.val());
      } else {
        setFacebookLogo("https://res.cloudinary.com/dp6znoxry/image/upload/v1779479917/fgt1pfu9tu7yrjkhledm.png");
      }
    }).catch(error => console.error("Error fetching fb icon", error));
  }, []);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const getFrameClass = (htmlString) => {
    if (!htmlString) return 'frame-default';
    const lowerHtml = htmlString.toLowerCase();
    if (lowerHtml.includes('facebook.com/plugins') || lowerHtml.includes('class="fb-post"') || lowerHtml.includes('facebook.com')) {
        return 'frame-facebook';
    }
    if (lowerHtml.includes('instagram.com/embed') || lowerHtml.includes('instagram-media') || lowerHtml.includes('instagram.com')) {
        return 'frame-instagram';
    }
    return 'frame-default';
  };

  const finalUrl = getEmbedUrl(videoUrl);

  const EmbedWrapper = ({ embedHtml, embedHeight, embedWidth }) => {
    const ref = useRef(null);
    const convertedEmbedHtml = processEmbedCode(embedHtml, embedHeight, embedWidth);
    const frameClass = getFrameClass(embedHtml);

    // Extract original URL from embed code for the banner link
    const extractUrl = (html) => {
      if (!html) return '#';
      const igMatch = html.match(/data-instgrm-permalink=["']([^"']+)["']/);
      if (igMatch) return igMatch[1].split('?')[0];
      const fbMatch = html.match(/href=([^&"']+)/);
      if (fbMatch) return decodeURIComponent(fbMatch[1]);
      const hrefMatch = html.match(/href=["']([^"']+)["']/);
      if (hrefMatch) return hrefMatch[1];
      return '#';
    };
    const postUrl = extractUrl(embedHtml);

    useEffect(() => {
      if (ref.current) {
        ref.current.setAttribute('embed-html', convertedEmbedHtml);
      }
    }, [convertedEmbedHtml]);

    if (!convertedEmbedHtml) return null;

    return (
      <div className={`posteo ${frameClass}`}>
        <instagram-post ref={ref} key={convertedEmbedHtml}></instagram-post>
        <a href={postUrl} target="_blank" rel="noreferrer" className="card-banner" style={{ pointerEvents: 'auto' }}>
          {frameClass === 'frame-instagram' && instagramLogo && <img src={instagramLogo} alt="Instagram" />}
          {frameClass === 'frame-facebook' && facebookLogo && <img src={facebookLogo} alt="Facebook" />}
        </a>
      </div>
    );
  };

  const isPreview = previewSizes !== undefined;

  return (
    <Section id="socialMediaRow" $isPreview={isPreview}>
      <GridContainer $singleItem={singleItem}>
        {(!singleItem || singleItem === 1) && (!isMobile || showMobile1) && (
          <Column $singleItem={singleItem}>
            <EmbedWrapper 
              embedHtml={currentEmbedCode1} 
              embedHeight={!isMobile ? currentSizes.h_pc_1 : currentSizes.h_mob_1} 
              embedWidth={!isMobile ? currentSizes.w_pc_1 : currentSizes.w_mob_1} 
            />
          </Column>
        )}
        {(!singleItem || singleItem === 2) && (!isMobile || showMobile2) && (
          <Column $singleItem={singleItem}>
            <EmbedWrapper 
              embedHtml={currentEmbedCode2} 
              embedHeight={!isMobile ? currentSizes.h_pc_2 : currentSizes.h_mob_2} 
              embedWidth={!isMobile ? currentSizes.w_pc_2 : currentSizes.w_mob_2} 
            />
          </Column>
        )}
        {(!singleItem || singleItem === 3) && (
        <Column $singleItem={singleItem}>
          <div className="video-container frame-youtube"
               onClick={() => { if (isEditable && setEditingField) setEditingField('video_url'); }}
               style={{ 
                   cursor: isEditable ? 'pointer' : 'default',
                   height: !isMobile ? currentSizes.h_pc_v : currentSizes.h_mob_v,
                   width: !isMobile ? currentSizes.w_pc_v : currentSizes.w_mob_v,
                   margin: '0 auto'
               }}>
            {isEditable && editingField === 'video_url' ? (
                <div className="edit-container">
                    <label>URL del video (YouTube):</label>
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
                            <p>{videoUrl ? "URL inválida" : "Sin video"}</p>
                        </div>
                    )}
                </>
            )}
            <a href={videoUrl || '#'} target="_blank" rel="noreferrer" className="card-banner" style={{ pointerEvents: 'auto', textDecoration: 'none' }}>
              <span>▶</span>
            </a>
          </div>
        </Column>
        )}
      </GridContainer>
    </Section>
  );
};

export default SocialMediaRow;

const Section = styled.section`
  width: 100%;
  margin: 2rem auto 2.5rem auto; 
  text-align: center; 
  box-sizing: border-box;

  @media (max-width: 1080px) {
    width: ${props => props.$isPreview ? '65vw' : '65%'};
    margin: 1rem auto;
    overflow-x: hidden;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$singleItem ? 'minmax(300px, 540px)' : 'repeat(3, 1fr)'};
  justify-content: ${props => props.$singleItem ? 'center' : 'stretch'};
  gap: 2rem;
  align-items: stretch; /* Stretch columns to have equal height */

  @media screen and (max-width: 1080px) {
    grid-template-columns: 1fr;
    align-items: center;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: ${props => props.$singleItem ? 'auto' : '100%'}; /* Fill Grid cell height or wrap content */

  @media screen and (max-width: 1080px) {
    height: auto;
  }

  .posteo {
    width: 100%; 
    max-width: 100%;
    box-sizing: border-box;
    margin: auto;
    overflow-x: hidden;
    height: ${props => props.$singleItem ? 'auto' : '100%'}; /* Stretch posteo card to fill Column height or wrap */
    display: flex;
    flex-direction: column;

    @media screen and (max-width: 1080px) {
      height: auto;
    }

    instagram-post {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: ${props => props.$singleItem ? 'auto' : '100%'};
      
      @media screen and (max-width: 1080px) {
        height: auto;
      }
    }
  }

  .card-banner {
    position: absolute;
    bottom: 0; left: 0; width: 100%; height: 30px;
    display: flex; justify-content: flex-end; align-items: center;
    padding-right: 15px;
    pointer-events: none;
    z-index: 5;
    box-sizing: border-box;

    img {
      height: 20px;
      width: auto;
      max-width: 100px;
      object-fit: contain;
      flex-shrink: 0;
    }

    span {
      color: white;
      font-weight: bold;
      font-family: sans-serif;
      font-size: 1.1rem;
    }
  }

  .frame-youtube {
    border: 4px solid rgba(220, 0, 0, 0.3);
    box-shadow: 0px 4px 12px rgba(220, 0, 0, 0.1);
    border-radius: 14px;
    padding-bottom: 30px;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-sizing: border-box;
  }
  .frame-youtube .card-banner {
    background: rgba(220, 0, 0, 0.6);
  }
  .frame-youtube:hover {
    transform: translateY(-5px);
    box-shadow: 0px 8px 20px rgba(220, 0, 0, 0.25);
  }

  .frame-instagram {
    border: 4px solid transparent;
    border-radius: 14px;
    padding-bottom: 30px;
    position: relative;
    background: linear-gradient(white, white) padding-box,
                linear-gradient(45deg, rgba(240, 148, 51, 0.4) 0%, rgba(230, 104, 60, 0.4) 25%, rgba(220, 39, 67, 0.4) 50%, rgba(204, 35, 102, 0.4) 75%, rgba(188, 24, 136, 0.4) 100%) border-box;
    box-shadow: 0px 4px 12px rgba(220, 39, 67, 0.1);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-sizing: border-box;
  }
  .frame-instagram .card-banner {
    background: linear-gradient(45deg, rgba(220, 39, 67, 0.6) 0%, rgba(188, 24, 136, 0.6) 100%);
  }
  .frame-instagram:hover {
    transform: translateY(-5px);
    box-shadow: 0px 8px 20px rgba(220, 39, 67, 0.25);
  }

  .frame-facebook {
    border: 4px solid rgba(24, 119, 242, 0.3);
    border-radius: 14px;
    padding-bottom: 30px;
    position: relative;
    box-shadow: 0px 4px 12px rgba(24, 119, 242, 0.1);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-sizing: border-box;
  }
  .frame-facebook .card-banner {
    background: rgba(24, 119, 242, 0.6);
  }
  .frame-facebook:hover {
    transform: translateY(-5px);
    box-shadow: 0px 8px 20px rgba(24, 119, 242, 0.25);
  }

  .frame-default {
    border: 4px solid #ddd;
    border-radius: 14px;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-sizing: border-box;
  }
  .frame-default:hover {
    transform: translateY(-5px);
    box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.2);
  }

  .video-container {
    width: 100%;
    background-color: #000;
    background-clip: content-box;
    border-radius: 14px; /* Matches frame border radius */
    overflow: hidden;
    position: relative;

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
            content: 'Editar';
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
`;
