import { processEmbedCode } from '../utils/embedConverter.js';
import React, { useState, useEffect, useRef } from 'react';
import styled from "styled-components";
import { app } from "../firebase/firebase.js";
import { getDatabase, ref, get } from "firebase/database";
import './InstagramPost.js'; // Import to register the custom element

const InstagramEmbed = ({ initialEmbedCode1, initialEmbedCode2, initialEmbedCode3, embedHeight1, embedHeight2, embedHeight3, embedHeightMobile, numPostsDesktop }) => {
  const [firebaseEmbedCode1, setFirebaseEmbedCode1] = useState("");
  const [firebaseEmbedCode2, setFirebaseEmbedCode2] = useState("");
  const [firebaseEmbedCode3, setFirebaseEmbedCode3] = useState("");
  const [firebaseEmbedHeight1, setFirebaseEmbedHeight1] = useState("550");
  const [firebaseEmbedHeight2, setFirebaseEmbedHeight2] = useState("550");
  const [firebaseEmbedHeight3, setFirebaseEmbedHeight3] = useState("550");
  const [firebaseEmbedHeightMobile, setFirebaseEmbedHeightMobile] = useState("550"); // New state for mobile height
  const [firebaseNumPostsDesktop, setFirebaseNumPostsDesktop] = useState("3"); // New state for number of posts on desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const currentEmbedCode1 = initialEmbedCode1 !== undefined ? initialEmbedCode1 : firebaseEmbedCode1;
  const currentEmbedCode2 = initialEmbedCode2 !== undefined ? initialEmbedCode2 : firebaseEmbedCode2;
  const currentEmbedCode3 = initialEmbedCode3 !== undefined ? initialEmbedCode3 : firebaseEmbedCode3;
  const currentEmbedHeight1 = embedHeight1 !== undefined ? embedHeight1 : firebaseEmbedHeight1;
  const currentEmbedHeight2 = embedHeight2 !== undefined ? embedHeight2 : firebaseEmbedHeight2;
  const currentEmbedHeight3 = embedHeight3 !== undefined ? embedHeight3 : firebaseEmbedHeight3;
  const currentEmbedHeightMobile = embedHeightMobile !== undefined ? embedHeightMobile : firebaseEmbedHeightMobile;
  const currentNumPostsDesktop = numPostsDesktop !== undefined ? numPostsDesktop : firebaseNumPostsDesktop;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const shouldFetchFromFirebase = initialEmbedCode1 === undefined && initialEmbedCode2 === undefined && initialEmbedCode3 === undefined;
    if (shouldFetchFromFirebase) {
      const db = getDatabase(app);
      const dbRef = ref(db, 'datosId/25');
      get(dbRef).then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setFirebaseEmbedCode1(data.link_embebido_1 || '');
          setFirebaseEmbedCode2(data.link_embebido_2 || '');
          setFirebaseEmbedCode3(data.link_embebido_3 || '');
          setFirebaseEmbedHeight1(data.embed_height_1 || '550');
          setFirebaseEmbedHeight2(data.embed_height_2 || '550');
          setFirebaseEmbedHeight3(data.embed_height_3 || '550');
          setFirebaseEmbedHeightMobile(data.embed_height_mobile || '550'); // Fetch mobile height
          setFirebaseNumPostsDesktop(data.num_posts_desktop || '3'); // Fetch num_posts_desktop
        }
      }).catch(error => {
        console.error("Error fetching Instagram data:", error);
      });
    }
  }, [initialEmbedCode1, initialEmbedCode2, initialEmbedCode3]);

  const EmbedWrapper = ({ embedHtml, embedHeight }) => {
    const ref = useRef(null);
    // Pass the height to the conversion function
    const convertedEmbedHtml = processEmbedCode(embedHtml, embedHeight);

    useEffect(() => {
      if (ref.current) {
        ref.current.setAttribute('embed-html', convertedEmbedHtml);
      }
    }, [convertedEmbedHtml]);

    if (!convertedEmbedHtml) return null;

    // The key is important for React to create a new instance when the code changes
    return (
      <div className='posteo'>
        <instagram-post ref={ref} key={convertedEmbedHtml}></instagram-post>
      </div>
    );
  };

  return (
    <Section id="embedIG" $numColumns={isMobile ? 1 : currentNumPostsDesktop}>
      <EmbedContainer>
        <EmbedColumn>
          <EmbedWrapper embedHtml={currentEmbedCode1} embedHeight={!isMobile ? currentEmbedHeight1 : currentEmbedHeightMobile} />
        </EmbedColumn>
        {!isMobile && currentNumPostsDesktop >= '2' && (
          <EmbedColumn>
            <EmbedWrapper embedHtml={currentEmbedCode2} embedHeight={currentEmbedHeight2} />
          </EmbedColumn>
        )}
        {!isMobile && currentNumPostsDesktop >= '3' && (
          <EmbedColumn>
            <EmbedWrapper embedHtml={currentEmbedCode3} embedHeight={currentEmbedHeight3} />
          </EmbedColumn>
        )}
      </EmbedContainer>
    </Section>
  );
};

export default InstagramEmbed;

const Section = styled.section`
  width: 100%;
  margin: 2rem auto 2.5rem auto; 
  text-align: center; 
  box-sizing: border-box;

   @media (max-width: 768px) {
    width: 65%;
    margin: 1rem auto;
    overflow-x: hidden;
   }
`;

const EmbedContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem; 

  @media screen and (min-width: 1024px) {
    flex-direction: row;
    align-items: flex-start;
    
  }

  @media screen and (max-width: 1023px) {
    flex-direction: column;
    align-items: center;
  }
`;

const EmbedColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  flex: 1;
  min-width: 300px;
  width: 100%;

  @media screen and (max-width: 1023px) {
    width: 100%;
    min-width: unset;
  }

  .posteo {
    width: 100%; 
    max-width: 100%;
    box-sizing: border-box;
    height: 100%;
    margin: auto;
    overflow-x: hidden;
  }
`;
