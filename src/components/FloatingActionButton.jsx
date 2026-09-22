import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import Modal from './Modal';
import ImageGalleryModal from './Admin/ImageGalleryModal';
import { useChatbot } from '../contexts/chatbotContext';
import { getDatabase, ref, get } from "firebase/database"; // Add this line
import { app } from "../firebase/firebase"; // Add this line
import { safeStorage } from '../utils/safeStorage';

const Tooltip = styled.span`
    padding: 8px 16px;
    opacity: 1;
    transition: opacity 0.3s ease;
    top: 50%;
    right: calc(100% + 15px);
    transform: translateY(-50%);
    color: var(--primary-text);
    height: auto;
    width: auto;
    max-width: 250px;
    text-align: center;
    align-items: center;
    font-family: 'product_sansregular', sans-serif;
    font-size: 13px;
    line-height: 1.4;


    background-color: var(--card-grey);
    border-radius: 8px;
    position: absolute;
    z-index: 100;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color, #eee);
    white-space: nowrap;
    pointer-events: none;
`;

const VisibilityToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--secondary-text, #555);

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

const SpeechSpinner = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent overlay */
  border-radius: 20px;
  z-index: 10;
  font-family: 'product_sansregular';
  color: white;
  font-size: 0.9rem;
  box-sizing: border-box;

  .spinner-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px; /* Adjust size as needed */
    color: white; /* Color of the play/pause icon */
    z-index: 12;
  }

  .spinner-text {
    position: absolute;
    top: 25%; /* Adjust vertically to be above the icon, moved up further */
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 11;
  }
`;

import { keyframes } from 'styled-components';

const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 82, 82, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
`;

const parseCssUnit = (val, fallback) => {
  if (val === undefined || val === null || val === '') return fallback;
  const str = String(val).trim();
  if (/^-?\d+(\.\d+)?$/.test(str)) return `${str}px`;
  return str;
};

const FloatingButton = styled.button`
  z-index: ${({ isCalendarRoute }) => (isCalendarRoute ? 50 : 100)}; /* Lower z-index if calendar route is active */
  background-color: ${({ id, $buttonColor }) => id === 'scrollToTopButton' ? 'var(--primary-color)' : ($buttonColor || 'var(--primary-color)')};
  position: ${({ $isConfigPage }) => ($isConfigPage ? 'static' : 'fixed')}; /* Override fixed positioning for display in config page */
  width:53px;
  height:53px;
  bottom: ${({ $bottom, $isConfigPage, id }) => {
    if ($isConfigPage) return 'auto';
    const fallback = id === 'scrollToTopButton' ? '10px' : '340px';
    const parsed = parseCssUnit($bottom, fallback);
    return parsed.endsWith('px') ? `min(${parsed}, calc(100vh - 75px))` : parsed;
  }};
  right: ${({ $right, $isConfigPage }) => ($isConfigPage ? 'auto' : parseCssUnit($right, '0px'))}; /* Override right for config page */
  border-radius:20px;
  text-align:center; /* Keep text-align for tooltip if it's text */
  z-index:100;
  transition: all 300ms ease;
  border: none;
  box-shadow: ${({ $isConfigPage }) => ($isConfigPage ? 'none' : '0px 1px 10px rgba(0, 0, 0, 0.3)')}; /* Override box-shadow for config page */
  background: ${({ id, $buttonColor }) => id === 'scrollToTopButton' ? 'var(--primary-color)' : ($buttonColor || 'linear-gradient(155deg, #708dff 8%, #a370ff 50%, #f782c4 85%)')}; /* Use $buttonColor prop */
  cursor: pointer;
  animation: ${({ $hasUnread }) => ($hasUnread ? pulseAnimation : 'none')} 1.5s infinite;

  &:hover {
    box-shadow: ${({ $isConfigPage }) => ($isConfigPage ? 'none' : '2px 4px 6px rgba(0, 0, 0, 0.4)')}; /* Override box-shadow for config page */
    border-radius:24px;
    animation: none;
  }

  img {
    position: absolute; /* Position absolutely within the button */
    top: ${({ $imageTop }) => $imageTop || '50%'};
    left: ${({ $imageRight }) => $imageRight ? 'auto' : '50%'};
    right: ${({ $imageRight }) => $imageRight || 'auto'};
    transform: ${({ $imageTop, $imageRight }) => ($imageTop || $imageRight) ? 'none' : 'translate(-50%, -50%)'};
    width: ${({ $imageSize }) => $imageSize || '53px'}; /* Use $imageSize prop */
    height: ${({ $imageSize }) => $imageSize || '53px'}; /* Use $imageSize prop */
    object-fit: contain; /* Prevent non-square image stretching */
    filter: drop-shadow(2px 2px 1px var(--primary-text));
    
    &:hover {
      filter: drop-shadow(2px 1px 1px var(--primary-text));
      transform: ${({ $imageTop, $imageRight }) => ($imageTop || $imageRight) ? 'scale(0.9)' : 'translate(-50%, -50%) scale(0.9)'}; /* Apply scale after translate */

      transition: all 300ms ease;
    }
  }
`;

// Componente FloatingActionButton
const FloatingActionButton = ({
  id,
  link,
  tooltip,
  icon,
  onImageChange, // For changing the button's icon
  onUpdateField, // For updating tooltip text or link
  contentToRead, // Optional: for AI speech functionality
  audioSpeed = 1.0, // Optional: for AI speech functionality
  $buttonColor, // New: for custom button background color/gradient
  $imageSize, // New: for custom image size
  $imageTop,
  $imageRight,
  $bottom, // New: for button bottom position
  $right, // New: for button right position
  isEditableContext = false, // New: to control editing behavior
  isChatbotButton = false,
  isCalendarActive = false, // New: to control z-index when calendar is active
  isVisible, // New: to control button visibility
  onToggleVisibility, // New: handler to toggle visibility
  onSaveWhatsappModalTexts, // New: handler for saving whatsapp modal texts
  whatsappMessage // New: for editable WhatsApp share message
}) => {
  const [isEditingTooltip, setIsEditingTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // New state for hover
  const [internalIsChatbotEnabled, setInternalIsChatbotEnabled] = useState(false); // New internal state
  const [isVoiceWarningModalOpen, setIsVoiceWarningModalOpen] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [shareCountdown, setShareCountdown] = useState(3);

  // Auto-hide tooltip after 2 seconds (especially for mobile)
  useEffect(() => {
    let timer;
    if (isHovered) {
      timer = setTimeout(() => {
        setIsHovered(false);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isHovered]);


  // --- AI Speech Synthesis Logic (Conditional) ---
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isWhatsappModalOpen = searchParams.get('contact') === 'open';

  const setIsWhatsappModalOpen = (open) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (open) next.set('contact', 'open');
      else next.delete('contact');
      return next;
    }, { replace: !open });
  };

  const utteranceRef = useRef(null); // Use ref for stable utterance object
  const [internalWhatsappMessage, setInternalWhatsappMessage] = useState("");
  const [modalTitle, setModalTitle] = useState('');
  const [modalSubtitle, setModalSubtitle] = useState('');
  const [juanButtonText, setJuanButtonText] = useState('');
  const [chatbotButtonText, setChatbotButtonText] = useState('');
  const [editedModalTitle, setEditedModalTitle] = useState('');
  const [editedModalSubtitle, setEditedModalSubtitle] = useState('');
  const [editedJuanButtonText, setEditedJuanButtonText] = useState('');
  const [editedChatbotButtonText, setEditedChatbotButtonText] = useState('');

  const [speechStatus, setSpeechStatus] = useState('idle'); // 'idle', 'playing', 'paused'
  const [speechProgress, setSpeechProgress] = useState(0);
  const [progressIntervalId, setProgressIntervalId] = useState(null);

  const startProgressSimulation = useCallback((initialProgress = 0) => {
    if (progressIntervalId) {
      clearInterval(progressIntervalId);
      setProgressIntervalId(null);
    }

    if (!contentToRead) return;

    const estimatedDurationSeconds = (contentToRead.length * 70) / (1000 * audioSpeed);
    if (estimatedDurationSeconds === 0) return;

    const startTime = Date.now() - (initialProgress / 100) * (estimatedDurationSeconds * 1000);

    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      let newProgress = (elapsedSeconds / estimatedDurationSeconds) * 100;

      if (newProgress >= 100) {
        newProgress = 100;
        clearInterval(interval);
        setProgressIntervalId(null);
      }
      setSpeechProgress(Math.min(newProgress, 100));
    }, 200); // Update every 200ms for smoother progress

    setProgressIntervalId(interval);
  }, [contentToRead, progressIntervalId]);

  useEffect(() => {
    const fetchWhatsappModalData = async () => {
      const db = getDatabase(app);
      const modalDataRef = ref(db, 'datosId/29');
      const snapshot = await get(modalDataRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setModalTitle(data.contenido36 || 'Contactate con nosotros');
        setModalSubtitle(data.contenido40 || '');
        setJuanButtonText(data.contenido37 || 'Hablar con un representante de lunes a viernes de 18 a 22hs.');
        setChatbotButtonText(data.contenido38 || 'Chatear con una IA las 24 hs todos los días.');
        setEditedModalTitle(data.contenido36 || 'Contactate con nosotros');
        setEditedModalSubtitle(data.contenido40 || '');
        setEditedJuanButtonText(data.contenido37 || 'Hablar con un representante de lunes a viernes de 18 a 22hs.');
        setEditedChatbotButtonText(data.contenido38 || 'Chatear con una IA las 24 hs todos los días.');
      }
    };
    fetchWhatsappModalData();
  }, []);

  useEffect(() => {
    const synth = window.speechSynthesis;

    // Handle case where contentToRead becomes empty or invalid
    if (!contentToRead) {
      if (synth && (synth.speaking || synth.pending || synth.paused)) {
        synth.cancel();
      }
      utteranceRef.current = null;
      setSpeechStatus('idle');
      setSpeechProgress(0);
      if (progressIntervalId) clearInterval(progressIntervalId);
      setProgressIntervalId(null);
      return;
    }

    // Only create a new SpeechSynthesisUtterance if content has truly changed
    // or if it's the first time and utteranceRef.current is null
    if (!utteranceRef.current || utteranceRef.current.text !== contentToRead) {
      // If content has changed, cancel any ongoing speech for the old utterance
      if (utteranceRef.current && synth && (synth.speaking || synth.pending || synth.paused)) {
        synth.cancel();
      }
      if (typeof window.SpeechSynthesisUtterance !== 'undefined') {
        utteranceRef.current = new window.SpeechSynthesisUtterance(contentToRead);
      } else {
        return; // Exit early if speech synthesis is not supported
      }
      // Reset state only if a new utterance is created due to content change
      // This ensures that when content is truly updated, speech starts fresh.
      setSpeechStatus('idle');
      setSpeechProgress(0);
      if (progressIntervalId) clearInterval(progressIntervalId);
      setProgressIntervalId(null);
    }
    // Update rate if it changed (voice can be updated on existing utterance)
    if (utteranceRef.current.rate !== audioSpeed) {
      utteranceRef.current.rate = audioSpeed;
    }

    const setVoice = () => {
      try {
        const voices = synth.getVoices();
        if (!voices) return;
        let desiredVoice = voices.find(voice => voice && voice.lang && voice.lang === 'es-US' && voice.name && voice.name.includes('Standard'));
        if (!desiredVoice) {
          desiredVoice = voices.find(voice => voice && voice.lang && voice.lang === 'es-US');
        }
        if (!desiredVoice) {
          desiredVoice = voices.find(voice => voice && voice.lang && voice.lang.startsWith('es'));
        }
        if (desiredVoice) {
          utteranceRef.current.voice = desiredVoice;
        } else {
          console.warn("No se encontró ninguna voz en español disponible. Se usará la voz por defecto del navegador.");
        }
        if (utteranceRef.current) {
          utteranceRef.current.lang = 'es-US';
        }
      } catch (error) {
        console.warn("Error en setVoice (probablemente por una extension del navegador):", error);
      }
    };

    if (synth) {
      try {
        if (synth.getVoices().length) {
          setVoice();
        } else {
          synth.onvoiceschanged = setVoice;
        }
      } catch (error) {
        console.warn("Error accediendo a synth.getVoices (probablemente por una extension del navegador):", error);
      }
    }

    // Assign event handlers to the *current* utterance
    utteranceRef.current.onend = () => {

      setSpeechStatus('idle');
      setSpeechProgress(0);
      if (progressIntervalId) clearInterval(progressIntervalId);
      setProgressIntervalId(null);
    };

    utteranceRef.current.onpause = () => {

      // The speechStatus is already set to 'paused' by handleTogglePlay
      if (progressIntervalId) clearInterval(progressIntervalId);
      setProgressIntervalId(null);
    };

    utteranceRef.current.onresume = () => {

      // The speechStatus is already set to 'playing' by handleTogglePlay
      startProgressSimulation(speechProgress);
    };

    return () => {

      // When the component unmounts or contentToRead/audioSpeed changes,
      // ensure speech is cancelled to prevent lingering processes.
      if (utteranceRef.current && synth && (synth.speaking || synth.paused)) {
        synth.cancel();
      }
      // No need to set utteranceRef.current = null here, as it's managed by the if condition above
      // in the next render cycle, or completely cleared on unmount.
      setSpeechStatus('idle');
      setSpeechProgress(0);
      if (progressIntervalId) clearInterval(progressIntervalId);
      setProgressIntervalId(null);
      if (synth) synth.onvoiceschanged = null; // Clear this specific listener
    };
    // Dependencies: contentToRead and audioSpeed trigger re-creation/update of utterance.
    // speechProgress, progressIntervalId, startProgressSimulation are for callbacks within the utterance handlers.
  }, [contentToRead, audioSpeed]);

  useEffect(() => {
    // If NOT in editable mode, fetch its own data
    if (!isEditableContext) {
      const fetchData = async () => {
        const db = getDatabase(app);
        // Fetch WhatsApp Message
        const messageRef = ref(db, 'floatingButtons/whatsappShareButton/whatsappMessage');
        const messageSnap = await get(messageRef);
        if (messageSnap.exists()) {
          setInternalWhatsappMessage(messageSnap.val());
        } else {
          setInternalWhatsappMessage('Mira esta página: ' + window.location.origin); // Default fallback
        }

        // Fetch Chatbot button visibility
        const chatbotVisibilityRef = ref(db, 'floatingButtons/chatAiButton/isVisible');
        const chatbotVisibilitySnap = await get(chatbotVisibilityRef);
        if (chatbotVisibilitySnap.exists()) {
          setInternalIsChatbotEnabled(chatbotVisibilitySnap.val());
        } else {
          setInternalIsChatbotEnabled(false); // Default to false if not found
        }
      };
      fetchData();
    }
  }, [isEditableContext]);

  const handleTogglePlay = useCallback(() => {

    const synth = window.speechSynthesis;

    if (!synth) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    if (!contentToRead || !utteranceRef.current) {
      console.warn("handleTogglePlay - No contentToRead or utterance available to play. Text might be empty or still loading.");
      return;
    }

    if (speechStatus === 'playing') {

      synth.pause();
      setSpeechStatus('paused');
      if (progressIntervalId) clearInterval(progressIntervalId);
      setProgressIntervalId(null);

    } else if (speechStatus === 'paused') {

      synth.resume();
      setSpeechStatus('playing');
      startProgressSimulation(speechProgress);

    } else { // speechStatus === 'idle' (or any other unexpected state, treat as idle)

      if (synth.speaking || synth.pending || synth.paused) {

        synth.cancel(); // Ensure any previous speech is cancelled
      }
      synth.speak(utteranceRef.current);
      setSpeechStatus('playing');
      setSpeechProgress(0); // Reset progress for new speech
      startProgressSimulation(0);

    }
  }, [speechStatus, contentToRead, progressIntervalId, speechProgress, startProgressSimulation]);
  // --- End AI Speech Synthesis Logic ---
  const [scrollVisible, setScrollVisible] = useState(id !== 'scrollToTopButton' || isEditableContext);

  useEffect(() => {
    if (id !== 'scrollToTopButton' || isEditableContext) {
      setScrollVisible(true);
      return;
    }
    const handleScroll = () => {
      setScrollVisible(window.pageYOffset > 100);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id, isEditableContext]);

  const { toggleChat, hasUnreadMessages, setHasUnreadMessages } = useChatbot();
  const handleAcceptVoiceWarning = () => {
    safeStorage.setItem('hasAcceptedVoiceSummaryWarning', 'true');
    setIsVoiceWarningModalOpen(false);
    handleTogglePlay();
  };

  const handleButtonClick = useCallback(() => {

    if (isEditableContext) {
      setIsEditingTooltip(true);
    } else if (id === 'whatsappButton') {
      const now = new Date();
      // Get time in Argentina (Buenos Aires)
      const hourFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', hour: 'numeric', hour12: false });
      const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long' });
      
      const argHourString = hourFormatter.format(now); // e.g. "17" or "24"
      // Handle the edge cases where hour might contain non-numeric characters (e.g. "24 o'clock" in some environments, though en-US should just be numbers)
      const argHourMatch = argHourString.match(/\d+/);
      const argHour = argHourMatch ? parseInt(argHourMatch[0], 10) : 0;
      // In hour12: false, midnight might be "24", map it to 0
      const normalizedHour = argHour === 24 ? 0 : argHour;

      const argWeekday = weekdayFormatter.format(now); // e.g. "Thursday"
      
      const isWeekday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(argWeekday);
      const isBusinessHours = isWeekday && normalizedHour >= 10 && normalizedHour < 18;

      if (internalIsChatbotEnabled && !isBusinessHours) {
        setIsWhatsappModalOpen(true);
      } else {
        window.open(link, '_blank');
      }
    } else if (isChatbotButton) {
      toggleChat();
    } else {
      if (contentToRead) {
        if (speechStatus === 'idle') {
          setIsVoiceWarningModalOpen(true);
        } else {
          handleTogglePlay();
        }
      } else if (id === 'whatsappShareButton') {
        const messageToShare = isEditableContext ? whatsappMessage : internalWhatsappMessage;
        if (messageToShare) {
          setIsSharingWhatsApp(true);
          setShareCountdown(3);
          
          let count = 3;
          const interval = setInterval(() => {
             count -= 1;
             setShareCountdown(count);
             
             if (count <= 0) {
                clearInterval(interval);
                setIsSharingWhatsApp(false);
                const encodedMessage = encodeURIComponent(messageToShare);
                
                // Intentamos abrir en una nueva pestaña
                const newWindow = window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
                // Si el navegador bloqueó el popup por no ser una acción directa del usuario, usamos href
                if (!newWindow) {
                   window.location.href = `https://wa.me/?text=${encodedMessage}`;
                }
             }
          }, 1000);
        }
      } else if (id === 'scrollToTopButton') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (link) {
        window.open(link, '_blank');
      }
    }
  }, [isEditableContext, contentToRead, link, handleTogglePlay, isChatbotButton, toggleChat, id, whatsappMessage, internalWhatsappMessage, setIsWhatsappModalOpen, internalIsChatbotEnabled, speechStatus]);

  const [editedTooltip, setEditedTooltip] = useState(tooltip);
  const [editedLink, setEditedLink] = useState(link);
  const [editedButtonColor, setEditedButtonColor] = useState($buttonColor);
  const [editedImageSize, setEditedImageSize] = useState($imageSize || '53px'); // New state for image size
  const [editedBottom, setEditedBottom] = useState($bottom || ''); // New state for bottom position
  const [editedRight, setEditedRight] = useState($right || ''); // New state for right position
  const [editedImageTop, setEditedImageTop] = useState($imageTop || '');
  const [editedImageRight, setEditedImageRight] = useState($imageRight || '');
  const [editedWhatsappMessage, setEditedWhatsappMessage] = useState(whatsappMessage); // New state for WhatsApp message
  const [editedIconUrl, setEditedIconUrl] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    setEditedTooltip(tooltip);
    setEditedLink(link);
    setEditedButtonColor($buttonColor);
    setEditedImageSize($imageSize || '53px');
    setEditedBottom($bottom || '');
    setEditedRight($right || '');
    setEditedImageTop($imageTop || '');
    setEditedImageRight($imageRight || '');
    setEditedWhatsappMessage(whatsappMessage); // Initialize new state
    setEditedIconUrl(null);
    setSelectedFile(null);
    setImagePreview(null);
  }, [tooltip, link, $buttonColor, $imageSize, $bottom, $right, $imageTop, $imageRight, whatsappMessage, isEditingTooltip]);

  useEffect(() => {
    // Clean up the object URL to avoid memory leaks
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setEditedIconUrl(null); // Clear gallery selection if manual file is chosen
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleSaveAll = async () => {
    // Update tooltip, link, buttonColor, and imageSize
    if (editedTooltip !== tooltip) {
      onUpdateField(id, 'tooltip', editedTooltip);
    }
    if (editedLink !== link) {
      onUpdateField(id, 'link', editedLink);
    }
    if (editedButtonColor !== $buttonColor) {
      onUpdateField(id, 'buttonColor', editedButtonColor);
    }
    if (editedImageSize !== $imageSize) { // Save image size
      onUpdateField(id, 'imageSize', editedImageSize);
    }
    if (editedBottom !== $bottom) { // Save bottom position
      onUpdateField(id, 'styles.bottom', editedBottom); // Use dot notation for nested property
    }
    if (editedRight !== $right) { // Save right position
      onUpdateField(id, 'styles.right', editedRight); // Use dot notation for nested property
    }
    if (editedImageTop !== $imageTop) {
      onUpdateField(id, 'styles.imageTop', editedImageTop);
    }
    if (editedImageRight !== $imageRight) {
      onUpdateField(id, 'styles.imageRight', editedImageRight);
    }
    if (id === 'whatsappShareButton' && editedWhatsappMessage !== whatsappMessage) {
      onUpdateField(id, 'whatsappMessage', editedWhatsappMessage);
    }
    if (id === 'whatsappButton') {
      onSaveWhatsappModalTexts({
        title: editedModalTitle,
        subtitle: editedModalSubtitle,
        juan: editedJuanButtonText,
        chatbot: editedChatbotButtonText,
      });
    }

    // Update image if a new one was selected from gallery
    if (editedIconUrl && editedIconUrl !== icon) {
      onUpdateField(id, 'icon', editedIconUrl);
    } else if (selectedFile) {
      // If a file was manually selected instead of gallery
      await onImageChange(id, selectedFile);
    }

    setIsEditingTooltip(false);
    setEditedIconUrl(null); // Clear selected icon after saving
    setSelectedFile(null);
  };

  if (id === 'scrollToTopButton' && !scrollVisible && !isEditableContext) {
    return null;
  }

  return (
    <>
      <FloatingButton
        onClick={handleButtonClick}
        $buttonColor={isEditingTooltip ? editedButtonColor : $buttonColor}
        $imageSize={isEditingTooltip ? editedImageSize : $imageSize}
        $imageTop={isEditingTooltip ? editedImageTop : $imageTop}
        $imageRight={isEditingTooltip ? editedImageRight : $imageRight}
        $bottom={isEditingTooltip ? editedBottom : $bottom}
        $right={isEditingTooltip ? editedRight : $right}
        $hasUnread={isChatbotButton && hasUnreadMessages}
        onMouseEnter={() => setIsHovered(true)} // Set hovered state
        onMouseLeave={() => setIsHovered(false)} // Clear hovered state
      >
        {speechStatus !== 'idle' && contentToRead ? (
          <SpeechSpinner>
            <span className="spinner-text">{Math.round(speechProgress)}%</span>
            <span className="spinner-icon">
              {speechStatus === 'paused' ? '▶' : '⏸'} {/* Play or Pause icon */}
            </span>
          </SpeechSpinner>
        ) : icon ? (
          <img src={icon} alt={isEditingTooltip ? editedTooltip : tooltip} width="53" height="53" />
        ) : id === 'scrollToTopButton' ? (
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textShadow: '0px 1px 4px rgba(0,0,0,0.9)' }}>arrow_upward</span>
        ) : (
          <img src={icon || null} alt={isEditingTooltip ? editedTooltip : tooltip} width="53" height="53" />
        )}
        {isHovered && speechStatus === 'idle' && ( // Show tooltip only when not speaking
          <Tooltip>
            {isEditingTooltip ? editedTooltip : tooltip}
          </Tooltip>
        )}
      </FloatingButton>

      {isEditableContext && isEditingTooltip && (() => { // Wrap in a self-executing function
        const _onToggleVisibility = onToggleVisibility; // Local variable for the prop
        return (
          <Modal isOpen={isEditingTooltip} onClose={() => setIsEditingTooltip(false)} title="Editar Botón Flotante">

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Imagen del Botón:</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="boton" 
                  onClick={() => setIsGalleryOpen(true)}
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                >
                  Elegir desde la Galería
                </button>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>o</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  style={{ flex: 1 }}
                />
              </div>
              {icon && !selectedFile && !editedIconUrl && <img src={icon || null} alt="Current Icon" style={{ width: '50px', height: '50px', marginTop: '10px', borderRadius: '5px' }} />}
              {editedIconUrl && <img src={editedIconUrl} alt="Selected from Gallery" style={{ width: '50px', height: '50px', marginTop: '10px', borderRadius: '5px' }} />}
              {selectedFile && <p style={{ marginTop: '5px', fontSize: '0.9em' }}>Archivo seleccionado: {selectedFile.name}</p>}
            </div>

            <ImageGalleryModal
              isOpen={isGalleryOpen}
              onClose={() => setIsGalleryOpen(false)}
              onSelect={(url) => {
                setEditedIconUrl(url);
                setSelectedFile(null); // Clear file selection if gallery is chosen
                setIsGalleryOpen(false);
              }}
            />

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Texto del Tooltip:</label>
              <input
                type="text"
                value={editedTooltip}
                onChange={(e) => setEditedTooltip(e.target.value)}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>URL del Botón:</label>
              <input
                type="url"
                value={editedLink}
                onChange={(e) => setEditedLink(e.target.value)}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
              />
            </div>

            {id === 'whatsappShareButton' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Mensaje de WhatsApp:</label>
                <input
                  type="text"
                  value={editedWhatsappMessage}
                  onChange={(e) => setEditedWhatsappMessage(e.target.value)}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
                />
              </div>
            )}

            {id === 'whatsappButton' && (
              <>
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-color, #eee)' }}>
                  <h4 style={{ marginTop: '0', marginBottom: '15px' }}>Textos del Modal de WhatsApp</h4>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Título del Modal:</label>
                    <input
                      type="text"
                      value={editedModalTitle}
                      onChange={(e) => setEditedModalTitle(e.target.value)}
                      style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Subtítulo del Modal:</label>
                    <input
                      type="text"
                      value={editedModalSubtitle}
                      onChange={(e) => setEditedModalSubtitle(e.target.value)}
                      style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Texto Botón IA:</label>
                    <input
                      type="text"
                      value={editedChatbotButtonText}
                      onChange={(e) => setEditedChatbotButtonText(e.target.value)}
                      style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Texto Botón Humano:</label>
                    <input
                      type="text"
                      value={editedJuanButtonText}
                      onChange={(e) => setEditedJuanButtonText(e.target.value)}
                      style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Tamaño de la Imagen (px):</label>
              <input
                type="text"
                value={editedImageSize}
                onChange={(e) => setEditedImageSize(e.target.value)}
                placeholder="Ej: 53px, 100px"
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Posición Inferior (bottom):</label>
              <input
                type="text"
                value={editedBottom}
                onChange={(e) => setEditedBottom(e.target.value)}
                placeholder="Ej: 20px, 10%"
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Posición Derecha (right):</label>
              <input
                type="text"
                value={editedRight}
                onChange={(e) => setEditedRight(e.target.value)}
                placeholder="Ej: 20px, 10%"
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Posición Superior (top) de la Imagen:</label>
              <input
                type="text"
                value={editedImageTop}
                onChange={(e) => setEditedImageTop(e.target.value)}
                placeholder="Ej: 7px, 15%"
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Posición Derecha (right) de la Imagen:</label>
              <input
                type="text"
                value={editedImageRight}
                onChange={(e) => setEditedImageRight(e.target.value)}
                placeholder="Ej: 8px, 20%"
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
              />
            </div>



            <div style={{ marginBottom: '15px' }}>
              <VisibilityToggle>
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => _onToggleVisibility(id, e.target.checked)}
                />
                <span>{isVisible ? 'Visible en Home' : 'Oculto en Home'}</span>
              </VisibilityToggle>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Color / Gradiente del Botón:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <input
                  type="color"
                  value={editedButtonColor?.startsWith('#') && editedButtonColor.length === 7 ? editedButtonColor : '#4CAF50'}
                  onChange={(e) => setEditedButtonColor(e.target.value)}
                  style={{ width: '40px', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0, backgroundColor: 'transparent' }}
                  title="Seleccionar color"
                />
                <input
                  type="text"
                  value={editedButtonColor}
                  onChange={(e) => setEditedButtonColor(e.target.value)}
                  placeholder="Ej: #FF5722, red, linear-gradient(...)"
                  style={{ flex: 1, padding: '8px', boxSizing: 'border-box', border: '1px solid var(--border-color, #ccc)', borderRadius: '4px', backgroundColor: 'var(--input-bg, #ffffff)', color: 'var(--primary-text, #333)' }}
                />
              </div>

              {/* Preselecciones / Atajos */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {[
                  { label: 'Predeterminado', value: '' },
                  { label: 'Verde WA', value: '#25D366' },
                  { label: 'Azul FB', value: '#1877F2' },
                  { label: 'Naranja', value: '#FF5722' },
                  { label: 'Negro', value: '#111111' },
                  { label: 'Gradiente IG', value: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' },
                  { label: 'Gradiente Azul', value: 'linear-gradient(155deg, #708dff 8%, #a370ff 50%, #f782c4 85%)' }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setEditedButtonColor(preset.value)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      cursor: 'pointer',
                      background: preset.value || '#eee',
                      color: preset.value && (preset.value.includes('gradient') || preset.value.includes('#111') || preset.value.includes('#187') || preset.value.includes('#FF5') || preset.value.includes('#25D')) ? '#fff' : '#333'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Muestra de Vista Previa */}
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary-text, #666)' }}>Vista previa:</span>
                <div style={{ width: '60px', height: '24px', borderRadius: '6px', background: editedButtonColor || 'linear-gradient(155deg, #708dff 8%, #a370ff 50%, #f782c4 85%)', border: '1px solid var(--border-color, #ccc)' }}></div>
              </div>
            </div>

            <button onClick={handleSaveAll} style={{ marginTop: '10px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', marginRight: '10px' }}>
              Guardar
            </button>
            <button onClick={() => setIsEditingTooltip(false)} style={{ marginTop: '10px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}>
              Cancelar
            </button>
          </Modal>
        )
      })()}

      <Modal isOpen={isWhatsappModalOpen} onClose={() => setIsWhatsappModalOpen(false)} backdropColor="transparent">
        {modalTitle && <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: 'var(--primary-text)', fontFamily: 'product_sansbold, sans-serif' }}>
          {modalTitle}
        </h2>}
        {modalSubtitle && <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--primary-text)', fontFamily: 'product_sansregular, sans-serif', opacity: 0.75, lineHeight: '1.4' }}>
          {modalSubtitle}
        </p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            style={{ padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', transition: 'filter 0.2s ease', fontFamily: 'product_sansregular, sans-serif' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const next = new URLSearchParams(searchParams);
              next.set('chat', 'open');
              next.delete('contact');
              navigate(`?${next.toString()}`, { replace: true });
              setHasUnreadMessages(false);
            }}>
            {chatbotButtonText}
          </button>
          <button
            style={{ padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary-text)', color: 'white', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', transition: 'filter 0.2s ease', fontFamily: 'product_sansregular, sans-serif' }}
            onClick={() => { window.open(link, '_blank'); setIsWhatsappModalOpen(false); }}>
            {juanButtonText}
          </button>
        </div>
      </Modal>

      {/* Modal de Advertencia de Lectura en Voz Alta */}
      <Modal
        isOpen={isVoiceWarningModalOpen}
        onClose={() => setIsVoiceWarningModalOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: 'product_sansregular, sans-serif', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: 'var(--primary-text)', fontFamily: 'product_sansbold, sans-serif' }}>
            Reproducción de Audio
          </h2>
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5', color: 'var(--primary-text)' }}>
            Estás por escuchar un resumen de audio en voz alta
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
            <button
              onClick={() => setIsVoiceWarningModalOpen(false)}
              style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--border-color, #ccc)', backgroundColor: 'var(--card-grey, transparent)', color: 'var(--primary-text, #555)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', transition: 'all 0.2s ease' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAcceptVoiceWarning}
              style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', transition: 'all 0.2s ease' }}
            >
              Escuchar Resumen
            </button>
          </div>
        </div>
      </Modal>
      
      {/* WhatsApp Share Delay Modal */}
      <Modal isOpen={isSharingWhatsApp} onClose={() => {}}>
        <div style={{ textAlign: 'center', padding: '10px', fontFamily: 'product_sansregular' }}>
            <p style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '15px' }}>
              Estás por compartir esta página por WhatsApp.
            </p>
            <div style={{ 
               fontSize: '3rem', 
               fontWeight: 'bold', 
               color: '#10b981', 
               margin: '20px 0',
               animation: 'pulse 1s infinite' 
            }}>
              {shareCountdown}
            </div>
            <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
              Serás redirigido en unos instantes...
            </p>
        </div>
      </Modal>
    </>

  );
};

export default FloatingActionButton;