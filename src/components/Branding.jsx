import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../firebase/firebase";
import { useAuth } from "../contexts/authContext";
import VisitorCounter from "./VisitorCounter";
import { useSiteStats } from "../contexts/SiteStatsContext";
import Modal from './Modal';
import ContactForm from './ContactForm';

const LikeButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0 4px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  
  &:hover {
    transform: scale(1.2);
  }
  
  &.liked {
    color: #e91e63; /* Pink color when liked */
  }
`;

const LikeCount = styled.span`
  display: inline-block;
  background-color: white;
  color: black;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 4px;
  vertical-align: middle;
`;

const ClickableText = styled.span`
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;
  &:hover {
    color: #8b5cf6;
  }
`;

export default function Branding({ onEditPageEntryAttempt }) {
  const [inputValue14, setInputValue14] = useState("");
  const { userLoggedIn } = useAuth();
  const { stats, isLiked, handleLike, initializeStats } = useSiteStats();
  const [initialized, setInitialized] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    // Initialize stats only once
    if (!initialized) {
      initializeStats();
      setInitialized(true);
    }
  }, [initialized, initializeStats]);

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      const dbRef = ref(db, "datosId/29");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        setInputValue14(snapshot.val().contenido1);
      } else {
        console.error("Error fetching branding data");
      }
    };
    fetchData();
  }, []);

  return (
    <Container>
      <center><p>&nbsp;</p></center>
      <div className="lower-footer">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <span className="textoFinal">
            <div> Si te gustó esta página dejá tu me gusta, {stats && (
              <>
                <LikeButton onClick={handleLike} className={isLiked ? 'liked' : ''} aria-label="Me gusta esta página">
                  ❤️
                </LikeButton>
                <LikeCount>{stats.likes.toLocaleString('es-AR')}</LikeCount>
              </>
            )}</div>
            <div>si querés una para vos <ClickableText onClick={() => setIsContactModalOpen(true)}>escribime cliqueando acá</ClickableText>.
              <div> Diseñado por Juan Payo para</div> </div>{userLoggedIn && onEditPageEntryAttempt ? (
              <span onClick={onEditPageEntryAttempt} className="access"><h3>{inputValue14}</h3></span>
            ) : (
              <Link to={userLoggedIn ? "/configuracion" : "/login"} className="access"><h3>{inputValue14}</h3></Link>
            )}
            
          </span>
          {stats && <VisitorCounter stats={stats} />}
        </div>
      </div>
      <Modal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)}>
        <ContactForm />
      </Modal>
    </Container>
  );
}

const Container = styled.div`
  .lower-footer {
    width: 80%;
    padding-top: 2rem;
    padding-bottom: 2rem;
    text-align: center;
    margin: auto;
    .textoFinal {
      .access {
        text-decoration: none;
        color: var(--app-primary-text-color, var(--primary-color));
        cursor: auto;
        font-family: 'playlistscript';
        font-size: 1.2rem;
      }
    }
    a {
      text-decoration: underline;
      color: var(--app-primary-text-color, var(--primary-color));
    }
  }

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    .lower-footer {
      color: var(--primary-text);
      padding-top: 1rem;
      text-align: center;
      padding-bottom: 2rem;
      width: 60%; /* Set max-width to 70% for mobile */
    }
  }
`;
