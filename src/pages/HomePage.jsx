import React, { useState, useEffect } from "react";
import axios from "axios";
import { addDays } from 'date-fns';
import { getDatabase, ref, onValue, get } from "firebase/database";
import { app } from "../firebase/firebase";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import Modal from '../components/Modal';
import Clave from "../components/Calendar/Clave";
import ScrollIndicator from '../components/ScrollIndicator';
import SEO from '../components/SEO';
import { useLoading } from '../contexts/LoadingContext';
import { useSiteContext } from '../contexts/SiteContext';

// Importaciones de componentes sincrÃ³nicas para evitar el salto de layout (CLS) en contenido "above-the-fold"
import Header from "../components/Header.jsx";
import Navbar from "../components/Navbar.jsx";
import Home from "../components/Home.jsx";
import FloatingActionButton from "../components/FloatingActionButton.jsx";
import HorariosVisita from "../components/HorariosVisita.jsx";

// Importaciones de componentes con React.lazy para contenido bajo la pantalla inicial
const Calendar = React.lazy(() => import("../components/Calendar/Calendar.jsx"));
const QuienesSomos = React.lazy(() => import("../components/QuienesSomos.jsx"));
const Aclaraciones = React.lazy(() => import("../components/Aclaraciones.jsx"));
const Calculadora = React.lazy(() => import("../components/Calculadora.jsx"));
const Calificaciones = React.lazy(() => import("../components/Calificaciones.jsx"));
const CotizacionExitosa = React.lazy(() => import("../components/CotizacionExitosa.jsx"));
const SocialMediaRow = React.lazy(() => import("../components/SocialMediaRow.jsx"));
const ReviewsAndTestimonials = React.lazy(() => import("../components/ReviewsAndTestimonials.jsx"));
const Testimonial = React.lazy(() => import("../components/Testimonial.jsx"));
const Testimonial2 = React.lazy(() => import("../components/Testimonial2.jsx"));
const Grid2x2 = React.lazy(() => import("../components/Grid2x2.jsx"));
const Footer = React.lazy(() => import("../components/Footer.jsx"));
const ScrollToTop = React.lazy(() => import("../components/ScrollToTop.jsx"));
const Branding = React.lazy(() => import("../components/Branding.jsx"));
const NewContactSection = React.lazy(() => import("../components/NewContactSection.jsx"));

const HomePage = () => {
  const [showAnimation, setShowAnimation] = useState(true);
  const [holidayDates, setHolidayDates] = useState([]);
  const [orangeHolidayDates, setOrangeHolidayDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [pageSummary, setPageSummary] = useState('');
  const [foto, setFoto] = useState('');
  const [loadingPageSummary, setLoadingPageSummary] = useState(true);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const db = getDatabase(app);
  const [componentOrder, setComponentOrder] = useState([]);
  const [floatingButtons, setFloatingButtons] = useState([]); // New state for floating buttons
  const [aclaracionesData, setAclaracionesData] = useState(null);
  const [gridMode, setGridMode] = useState('2x2'); // Add gridMode state
  const [videoUrl, setVideoUrl] = useState(''); // NEW STATE
  const { registerTask, completeTask } = useLoading();
  const { siteName, browserTitle } = useSiteContext();

  useEffect(() => {
    registerTask('homepage_data');
    registerTask('app_init'); // Just in case, to ensure app_init is covered if not already
    completeTask('app_init'); // We finish the root app init task here
  }, [registerTask, completeTask]);

  useEffect(() => {
    if (!loadingPageSummary && componentOrder.length > 0) {
      completeTask('homepage_data');
    }
  }, [loadingPageSummary, componentOrder, completeTask]);

  // Fetch gridMode from Firebase
  useEffect(() => {
    const gridModeRef = ref(db, 'config/gridMode');
    const unsubscribe = onValue(gridModeRef, (snapshot) => {
      if (snapshot.exists()) {
        setGridMode(snapshot.val());
      } else {
        setGridMode('2x2'); // Default fallback
      }
    });
    return () => unsubscribe();
  }, [db]);

  // Fetch video URL
  useEffect(() => {
    const fetchData = async () => {
      const dbRef = ref(db, "datosId/29/video_url");
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          setVideoUrl(snapshot.val());
        }
      } catch (error) {
        console.error("Error fetching video URL:", error);
      }
    };
    fetchData();
  }, [db]);

  const [isChatbotActive, setIsChatbotActive] = useState(false);
  const [isReviewsActive, setIsReviewsActive] = useState(false);
  const [isCalendarActive, setIsCalendarActive] = useState(false);


  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleBrandingClick = () => {
    if (currentUser) {
      setIsEditModalOpen(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        navigate('/configuracion');
      }, 1000);
    } else {
      navigate('/login');
    }
  };

  const toggleReviews = () => {
    setIsReviewsActive(!isReviewsActive);
    if (isChatbotActive) setIsChatbotActive(false);
  };

  const toggleCalendar = () => {
    setIsCalendarActive(!isCalendarActive);
    if (isChatbotActive) setIsChatbotActive(false);
    if (isReviewsActive) setIsReviewsActive(false);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const buttonsRef = ref(db, 'floatingButtons');
    onValue(buttonsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const buttonsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setFloatingButtons(buttonsArray);
      } else {
        setFloatingButtons([]);
      }
    });
  }, [db]);

  useEffect(() => {
    const fetchAclaracionesData = async () => {
      const db = getDatabase(app);
      const dbRef = ref(db, "datosId/29");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setAclaracionesData(targetObject);
      } else {
        console.error("Aclaraciones data not found");
      }
    };
    fetchAclaracionesData();
  }, [db]);

  // Component Map for dynamic rendering
  const componentMap = {
    Header: <Header />,
    Navbar: <Navbar />,
    Home: <Home />,
    QuienesSomos: <QuienesSomos />,
    Aclaraciones: <Aclaraciones data={aclaracionesData} />,
    Calculadora: <Calculadora />,
    Calendar: <Calendar />,
    Calificaciones: <Calificaciones />,
    CotizacionExitosa: <CotizacionExitosa />,
    SocialMediaRow: <SocialMediaRow videoUrl={videoUrl} isEditable={false} />,
    ReviewsAndTestimonials: <ReviewsAndTestimonials />,
    Testimonial: <Testimonial />,
    Testimonial2: <Testimonial2 />,
    Grid2x2: <Grid2x2 isEditable={false} gridMode={gridMode} />,
    NewContactSection: <NewContactSection />,
    Footer: <Footer isAdmin={false} />,
    Branding: <Branding onEditPageEntryAttempt={handleBrandingClick} />,
    ScrollToTop: null,
    HorariosVisita: <HorariosVisita />,
    // FloatingActionButton is now rendered outside the map
  };

  // Fetch component order from Firebase
  useEffect(() => {
    const dbRef = ref(db, 'componentOrder');
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = data.map(item =>
          typeof item === 'string' ? { name: item, isVisible: true } : item
        );
        setComponentOrder(formattedData);
      } else {
        setComponentOrder([
          { name: 'ScrollToTop', isVisible: true },
          { name: 'Navbar', isVisible: true },
          // Removed FloatingActionButton from here
          { name: 'Home', isVisible: true },
          { name: 'Calendar', isVisible: true },
          { name: 'QuienesSomos', isVisible: true },
          { name: 'Grid2x2', isVisible: true },
          { name: 'SocialMediaRow', isVisible: true }, 
          { name: 'ReviewsAndTestimonials', isVisible: true },
          { name: 'NewContactSection', isVisible: true },
          { name: 'Footer', isVisible: true },
        ]);
      }
    });
  }, [db]);

  // useEffect para cargar el texto y la velocidad de la IA
  useEffect(() => {
    const fetchIaConfig = async () => {
      try {
        const iaTextsRef = ref(db, 'iaTexts');
        const snapshot = await get(iaTextsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const summary = data.texto || "No hay informaciÃ³n configurada para la IA en este momento.";
          setPageSummary(summary.replace(/\s+/g, ' ').trim());
          const foto = data.imageUrl || "No hay informaciÃ³n configurada para la IA en este momento.";
          setFoto(foto);
          const fetchedSpeed = typeof data.audioSpeed === 'number' ? data.audioSpeed : (parseFloat(data.audioSpeed) || 1.0);
          setAudioSpeed(fetchedSpeed);
        } else {
          setPageSummary("No hay informaciÃ³n configurada para la IA en este momento.");
          setAudioSpeed(1.0);
        }
      } catch (error) {
        console.error("Error al cargar la configuraciÃ³n de la IA:", error);
        setPageSummary("Lo siento, hubo un error al cargar la informaciÃ³n principal.");
        setAudioSpeed(1.0);
      } finally {
        setLoadingPageSummary(false);
      }
    };
    fetchIaConfig();
  }, [db]);

  return (
    <>
      <div>
        <SEO
        title={browserTitle && browserTitle.trim() ? browserTitle : `Salón de eventos | ${siteName}`}
        description={(pageSummary && !pageSummary.includes('No hay información') && !pageSummary.includes('hubo un error')) ? (pageSummary.length > 160 ? pageSummary.substring(0, 160) + '...' : pageSummary) : `${siteName}: salón de eventos ideal para tu fiesta, cumpleaños, boda o evento corporativo. Instalaciones de primer nivel y ambiente único. ¡Reservá tu fecha!`}
        url="/"
        imageUrl={foto}
        schema={{
          "@context": "https://schema.org",
          "@type": "EventVenue",
          "name": siteName,
          "description": pageSummary || `Bienvenido a ${siteName}, tu salón de eventos ideal.`,
          "url": typeof window !== 'undefined' ? window.location.origin : "https://melishare-redirect-payo.web.app",
          "image": foto || (typeof window !== 'undefined' ? `${window.location.origin}/src/assets/logo.png` : ""),
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "AR"
          }
        }}
      />
      {componentOrder.map((component) => {
        const ComponentElement = componentMap[component.name]; // Get the React element

        // Only render if the component is visible AND a valid React element exists in the map
        if (component.isVisible && React.isValidElement(ComponentElement)) {
          return (
            <React.Suspense key={component.name} fallback={<div></div>}>
              {ComponentElement}
            </React.Suspense>
          );
        }
        return null;
      })}

      {/* Render floating action buttons */}
      {floatingButtons.map((button) => {
        if (!button.isVisible) return null; // Do not render if not visible

        let buttonLink = button.link;
        // Special handling for WhatsApp Share button
        if (button.id === 'whatsappShareButton') {
          const shareText = encodeURIComponent(`¡Conocé este salón de eventos: ${siteName}!`);
          const shareUrl = encodeURIComponent(window.location.href);
          buttonLink = `https://wa.me/?text=${shareText}%20${shareUrl}`;
        }

        return (
          <React.Suspense key={button.id} fallback={<div></div>}>
            <FloatingActionButton
              id={button.id}
              link={buttonLink} // Use the potentially modified link
              tooltip={button.tooltip}
              icon={button.icon}
              contentToRead={button.id === 'aiButton' ? pageSummary : undefined}
              audioSpeed={button.id === 'aiButton' ? audioSpeed : undefined}
              $buttonColor={button.buttonColor}
              $imageSize={button.imageSize}
              $imageTop={button.styles?.imageTop}
              $imageRight={button.styles?.imageRight}
              $bottom={button.styles?.bottom}
              $right={button.styles?.right}
              isEditableContext={false} // Explicitly set to false for HomePage
              isChatbotButton={button.id === 'chatAiButton'}
              isCalendarActive={isCalendarActive}
            />
          </React.Suspense>
        );
      })}
       {/* Add the ScrollIndicator component here */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <p>Usted está ingresando al modo de edición.</p>
      </Modal>
      </div>
    </>
    );
  };

export default HomePage;
