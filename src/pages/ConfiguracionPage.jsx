import { useLoading } from '../contexts/LoadingContext';
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { addDays } from 'date-fns';
import { getDatabase, ref, onValue, get, update, set } from "firebase/database";
import { uploadToFirebaseStorage } from '../utils/storageUpload';
import { app } from "../firebase/firebase";
import { Link, useNavigate } from 'react-router-dom';
import styled from "styled-components";

import Clave from "../components/Calendar/Clave";
import CompactComponentReorder from "../components/Admin/CompactComponentReorder"; // Import the new component
import Modal from "../components/Modal";
import ImageGalleryModal from "../components/Admin/ImageGalleryModal"; // Add Modal import
import { useSiteContext } from "../contexts/SiteContext";
import SEO from "../components/SEO";

// Importaciones de componentes (ahora con React.lazy)
const Header = React.lazy(() => import("../components/Header"));
const Navbar = React.lazy(() => import("../components/Navbar"));
const Home = React.lazy(() => import("../components/Home"));
const QuienesSomos = React.lazy(() => import("../components/QuienesSomos"));
const Aclaraciones = React.lazy(() => import("../components/Aclaraciones"));
const Calculadora = React.lazy(() => import("../components/Calculadora"));
const Calendar = React.lazy(() => import("../components/Calendar/Calendar"));
const Calificaciones = React.lazy(() => import("../components/Calificaciones"));
const CotizacionExitosa = React.lazy(() => import("../components/CotizacionExitosa"));
const SocialMediaRow = React.lazy(() => import("../components/SocialMediaRow.jsx"));
const ReviewsAndTestimonials = React.lazy(() => import("../components/ReviewsAndTestimonials"));
const Testimonial = React.lazy(() => import("../components/Testimonial"));
const Testimonial2 = React.lazy(() => import("../components/Testimonial2"));
const Grid2x2 = React.lazy(() => import("../components/Grid2x2"));
const Footer = React.lazy(() => import("../components/Footer"));
const NewContactSection = React.lazy(() => import("../components/NewContactSection"));
const ScrollToTop = React.lazy(() => import("../components/ScrollToTop"));
import FloatingActionButton from "../components/FloatingActionButton"; // Direct import
import { memo } from "react"; // Import memo
import EditableText from '../components/EditableText'; // Import EditableText
import GridModeSelector from '../components/Admin/GridModeSelector'; // Import GridModeSelector
import HorariosVisita from "../components/HorariosVisita"; // Add HorariosVisita import

// Import grid images
import grid1x1Image from '../assets/grid_1x1.png';
import grid1x2Image from '../assets/grid_1x2.png';
import grid1x3Image from '../assets/grid_1x3.png';
import grid2x2Image from '../assets/grid_2x2.png';
import grid2x3Image from '../assets/grid_2x3.png';
import grid3x2Image from '../assets/grid_3x2.png';
import grid3x3Image from '../assets/grid_3x3.png';

const MemoizedFloatingActionButton = memo(FloatingActionButton);
const Branding = React.lazy(() => import("../components/Branding"));
const VideoSection = React.lazy(() => import("../components/VideoSection")); // NEW IMPORT

const AdminSection = styled.div`
  background-color: var(--card-grey);
  padding: 2rem;
  margin-top: 4rem;
  margin-bottom: 2rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #ddd);



  label {
  
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: var(--secondary-text, #555);
  }

  input, textarea {
    width: 100%;
    padding: 0.8rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    border: 1px solid var(--border-color, #ccc);
    background-color: var(--input-bg, #ffffff);
    color: var(--primary-text, #333);
    font-size: 1rem;
    transition: border-color 0.2s;
    font-family: 'product_sansregular';

    &:focus {
      outline: none;
    }
  }
`;

const ConfiguracionPage = ({ isChatbotFeatureEnabled }) => {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);

  const { siteName } = useSiteContext();
  const navigate = useNavigate(); // Initialize useNavigate

  const [showReorder, setShowReorder] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [holidayDates, setHolidayDates] = useState([]);
  const [orangeHolidayDates, setOrangeHolidayDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [browserTitle, setBrowserTitle] = useState('');

  const [loaderTitle, setLoaderTitle] = useState(siteName);
  const [loaderSubtitle, setLoaderSubtitle] = useState('Salón de eventos');
  const [loaderShowLogo, setLoaderShowLogo] = useState(false);
  const [loaderLogoUrl, setLoaderLogoUrl] = useState('');
  const [loaderMessages, setLoaderMessages] = useState("Cargando base de datos...\nCargando imágenes...\nSincronizando agenda...\nCargando estilos...\nCargando textos...\nOptimizando experiencia...\nFinalizando carga...");
  const [whatsappReservaTemplate, setWhatsappReservaTemplate] = useState('');

  const [pageSummary, setPageSummary] = useState('');
  const [gridMode, setGridMode] = useState('2x2'); // Default to 2x2
  const [foto, setFoto] = useState('');
  const [loadingPageSummary, setLoadingPageSummary] = useState(true);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const db = getDatabase(app);
  const [componentOrder, setComponentOrder] = useState([]);
  const [inputValue209, setInputValue209] = useState(''); // State for the image URL

  const [whatsappShareMessage, setWhatsappShareMessage] = useState('');
  const [floatingButtons, setFloatingButtons] = useState([]); // State for floating buttons


  const [showCalendarConfig, setShowCalendarConfig] = useState(false);

  const [showEditingConfirmationModal, setShowEditingConfirmationModal] = useState(false);

  const handleOpenEditingConfirmation = () => {
    setShowEditingConfirmationModal(true);
  };

  const handleCloseEditingConfirmation = () => {
    setShowEditingConfirmationModal(false);
  };

  const handleConfirmEditing = () => {
    setShowEditingConfirmationModal(false);
    navigate('/configuracion'); // Navigate to the editing page
  };

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showJobsButton, setShowJobsButton] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'

  const showToastNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMessage('');
    }, 2000); // Hide after 2 seconds
  };

  // State for editable components
  const [editingField, setEditingField] = useState(null);

  const handleSetEditingField = (field) => {

    setEditingField(field);
  };

  // State for ReviewsAndTestimonials
  const [tituloCalificaciones, setTituloCalificaciones] = useState('');
  const [sectionDescriptionTestimonials, setSectionDescriptionTestimonials] = useState('');
  const [ratingsData, setRatingsData] = useState([
    { title: '', reviews: '', stars: '', image: '', link: '' },
    { title: '', reviews: '', stars: '', image: '', link: '' }
  ]);

  // State for QuienesSomos
  const [quienesSomosData, setQuienesSomosData] = useState({});

  // State for Grid2x2
  const [gridData, setGridData] = useState({});

  // State for Aclaraciones
  const [aclaracionesData, setAclaracionesData] = useState({});

  // State for Navbar
  const [navLinks, setNavLinks] = useState([]);
  const [logoUrl, setLogoUrl] = useState('');

  // State for Footer
  const [footerLogoUrl, setFooterLogoUrl] = useState('');
  const [footerTitle1, setFooterTitle1] = useState('');
  const [footerTitle2, setFooterTitle2] = useState('');
  const [footerTitle3, setFooterTitle3] = useState('');
  const [footerDescription, setFooterDescription] = useState('');
  const [footerLink1, setFooterLink1] = useState({ text: '', url: '' });
  const [footerLink2, setFooterLink2] = useState({ text: '', url: '' });
  const [footerMapLink, setFooterMapLink] = useState('');
  const [footerContactLink1, setFooterContactLink1] = useState({ text: '', url: '' });
  const [footerContactLink2, setFooterContactLink2] = useState({ text: '', url: '' });
  const [footerDisclaimer, setFooterDisclaimer] = useState({ text: '', url: '' });
  const [footerHorarioAtencion, setFooterHorarioAtencion] = useState('');
  const [footerHorarioAlquiler, setFooterHorarioAlquiler] = useState('');
  const [videoUrl, setVideoUrl] = useState(''); // NEW STATE
  const [horariosTitle, setHorariosTitle] = useState('Horarios de visita');
  const [horariosDescription, setHorariosDescription] = useState('A continuación se detallan nuestros próximos horarios de visita. Te esperamos para conocer el salón:');

  // Fetch browser title from Firebase
  useEffect(() => {
    const db = getDatabase(app);
    const browserTitleRef = ref(db, 'config/browserTitle');
    const unsubscribe = onValue(browserTitleRef, async (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && typeof val === 'string' && val.includes('Sal' + 'cedo')) {
          await update(ref(db, 'config'), {
            browserTitle: 'Salón de eventos | Salón Magic Eventos',
            browserTitleMigrated: true
          });
          setBrowserTitle('Salón de eventos | Salón Magic Eventos');
          return;
        }
        setBrowserTitle(val);
      } else {
        setBrowserTitle('Salón de eventos | Salón Magic Eventos');
      }
    });
    return () => unsubscribe();
  }, [db]);

  // Fetch loader config from Firebase
  useEffect(() => {
    const db = getDatabase(app);
    const loaderRef = ref(db, 'config/loader');
    const unsubscribe = onValue(loaderRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLoaderTitle(data.title || siteName);
        setLoaderSubtitle(data.subtitle || "Salón de eventos");
        setLoaderShowLogo(data.showLogo || false);
        setLoaderLogoUrl(data.logoUrl || "");
        if (data.messages) {
          setLoaderMessages(data.messages);
        }
      }
    });
    return () => unsubscribe();
  }, [db]);

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

  // Data fetching
  useEffect(() => {
    const db = getDatabase(app);
    const fetchData = async () => {
      // Ratings data
      const ratingsRef = ref(db, "datosId/25");
      const ratingsSnap = await get(ratingsRef);
      if (ratingsSnap.exists()) {
        const data = ratingsSnap.val();
        setRatingsData([
          { title: data.nombre_red_2 || 'Google', reviews: `${data.cantidad_calificaciones_google || '0'} opiniones`, stars: data.estrellas_google || '0.0', image: data.link_imagen_Maps || '', link: data.link_google || '#' },
          { title: data.nombre_red_1 || 'Facebook', reviews: `${data.cantidad_calificaciones_facebook || '0'} opiniones`, stars: data.estrellas_facebook || '0.0', image: data.link_imagen_facebook || '', link: data.link_facebook || '#' }
        ]);
        setFooterDescription(data.lema_marca || '');
        setFooterLink1({ text: String(data.link_instagram_text || 'Instagram'), url: String(data.link_instagram || '') });
        setFooterLink2({ text: String(data.link_facebook_text || 'Facebook'), url: String(data.link_facebook || '') });
        setFooterMapLink(data.link_iframe_mapa || '');
        setFooterContactLink1({ text: data.whatsapp_text || 'Nuestro WhatsApp', url: data.numero_whatsapp || '' });
        setFooterContactLink2({ text: data.mail_text || 'Nuestro Mail', url: data.direccion_mail || '' });
      }

      // Text data from datosId/29
      const textRef = ref(db, "datosId/29");
      const textSnap = await get(textRef);
      if (textSnap.exists()) {
        const data = textSnap.val();
        setTituloCalificaciones(data.contenido30 || 'Nuestras Calificaciones');
        setWhatsappReservaTemplate(data.whatsapp_reserva_template || 'Hola Juan!\n\nQuiero reservar el día *{FECHA}*\n\n*Servicios seleccionados:*\n{CARRITO}\n*Total: ${TOTAL}*\n\nSeña necesaria para reservar: ${SENA}\n\n{LINK}');
        setSectionDescriptionTestimonials(data.contenido32 || 'Opiniones reales que podés encontrar en nuestras redes.');
        setQuienesSomosData({
          contenido3: data.contenido3 || '',
          contenido4: data.contenido4 || '',
          contenido5: data.contenido5 || '',
          contenido6: data.contenido6 || '',
          contenido7: data.contenido7 || '',
          contenido8: data.contenido8 || '',
        });
        setGridData({
          contenido9: data.contenido9 || '',
          contenido10: data.contenido10 || '',
          contenido11: data.contenido11 || '',
          contenido12: data.contenido12 || '',
          contenido13: data.contenido13 || '',
          contenido14: data.contenido14 || '',
          contenido15: data.contenido15 || '',
          contenido16: data.contenido16 || '',
          contenido50: data.contenido50 || '',
          contenido51: data.contenido51 || '',
          contenido52: data.contenido52 || '',
          contenido53: data.contenido53 || '',
          contenido54: data.contenido54 || '',
          contenido55: data.contenido55 || '',
          contenido56: data.contenido56 || '',
          contenido57: data.contenido57 || '',
          contenido58: data.contenido58 || '',
          contenido59: data.contenido59 || '',
        });
        setAclaracionesData({
          contenido21: data.contenido21 || '',
          contenido22: data.contenido22 || '',
          contenido23: data.contenido23 || '',
          contenido24: data.contenido24 || '',
          contenido25: data.contenido25 || '',
          contenido26: data.contenido26 || '',
          contenido27: data.contenido27 || '',
          contenido28: data.contenido28 || '',
          contenido29: data.contenido29 || '',
        });
        setFooterTitle1(data.contenido33 || 'Links');
        setFooterTitle2(data.contenido34 || 'Contactos');
        setFooterTitle3(data.contenido35 || 'Horario');
        setFooterDisclaimer({ text: data.contenido39 || '', url: data.contenido39_url || '' });
        setVideoUrl(data.video_url || ''); // Fetch video url
        setHorariosTitle(data.horarios_title || 'Horarios de visita');
        setHorariosDescription(data.horarios_desc || 'A continuación se detallan nuestros próximos horarios de visita. Te esperamos para conocer el salón:');
      }

      // Navbar Links
      const linksRef = ref(db, 'navbar/links');
      const linksSnap = await get(linksRef);
      if (linksSnap.exists()) {
        const linksData = linksSnap.val();
        let linksArray = [];
        if (Array.isArray(linksData)) {
          linksArray = linksData;
        } else if (typeof linksData === 'object' && linksData !== null) {
          linksArray = Object.values(linksData);
        }
        // If linksData is a primitive (like a number), linksArray will remain empty.
        const filteredLinks = linksArray.filter(link => link.href !== '/configuracion');
        setNavLinks(filteredLinks);
      }

      // Navbar Logo
      const logoRef = ref(db, "datosId/28");
      const logoSnap = await get(logoRef);
      if (logoSnap.exists()) {
        const logoData = logoSnap.val();
        setLogoUrl(logoData.foto30);
        setFooterLogoUrl(logoData.foto31);
      }
    };
    fetchData();
  }, []);

  // Fetch horarios data
  useEffect(() => {
    const db = getDatabase(app);
    const horariosRef = ref(db, "datosId/27");
    get(horariosRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setFooterHorarioAtencion(data.horario_de_atencion || '');
        setFooterHorarioAlquiler(data.horario_de_alquiler || '');
      }
    });

    const maintenanceRef = ref(db, 'settings/maintenanceMode');
    onValue(maintenanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setMaintenanceMode(snapshot.val());
      } else {
        setMaintenanceMode(false);
      }
    });

    const jobsRef = ref(db, 'config/showJobsButton');
    onValue(jobsRef, (snapshot) => {
      if (snapshot.exists()) {
        setShowJobsButton(snapshot.val());
      } else {
        setShowJobsButton(true);
      }
    });
  }, [app]);

  const fieldMapping = {
    'main_title': { path: '/datosId/29/contenido30', stateUpdater: setTituloCalificaciones },
    'main_description': { path: '/datosId/29/contenido32', stateUpdater: setSectionDescriptionTestimonials },
    'google_title': { path: '/datosId/25/nombre_red_2', ratingIndex: 0, field: 'title' },
    'google_reviews': { path: '/datosId/25/cantidad_calificaciones_google', ratingIndex: 0, field: 'reviews', isNumeric: true },
    'google_stars': { path: '/datosId/25/estrellas_google', ratingIndex: 0, field: 'stars' },
    'google_image': { path: '/datosId/25/link_imagen_Maps', ratingIndex: 0, field: 'image' },
    'google_link': { path: '/datosId/25/link_google', ratingIndex: 0, field: 'link' },
    'facebook_title': { path: '/datosId/25/nombre_red_1', ratingIndex: 1, field: 'title' },
    'facebook_reviews': { path: '/datosId/25/cantidad_calificaciones_facebook', ratingIndex: 1, field: 'reviews', isNumeric: true },
    'facebook_stars': { path: '/datosId/25/estrellas_facebook', ratingIndex: 1, field: 'stars' },
    'facebook_image': { path: '/datosId/25/link_imagen_facebook', ratingIndex: 1, field: 'image' },
    'facebook_link': { path: '/datosId/25/link_facebook', ratingIndex: 1, field: 'link' },
    'quienes_somos_1': { path: '/datosId/29/contenido3', stateUpdater: (val) => setQuienesSomosData(p => ({ ...p, contenido3: val })) },
    'quienes_somos_2': { path: '/datosId/29/contenido4', stateUpdater: (val) => setQuienesSomosData(p => ({ ...p, contenido4: val })) },
    'quienes_somos_3': { path: '/datosId/29/contenido5', stateUpdater: (val) => setQuienesSomosData(p => ({ ...p, contenido5: val })) },
    'quienes_somos_4': { path: '/datosId/29/contenido6', stateUpdater: (val) => setQuienesSomosData(p => ({ ...p, contenido6: val })) },
    'quienes_somos_5': { path: '/datosId/29/contenido7', stateUpdater: (val) => setQuienesSomosData(p => ({ ...p, contenido7: val })) },
    'quienes_somos_6': { path: '/datosId/29/contenido8', stateUpdater: (val) => setQuienesSomosData(p => ({ ...p, contenido8: val })) },
    'grid_title_0': { path: '/datosId/29/contenido9', stateUpdater: (val) => setGridData(p => ({ ...p, contenido9: val })) },
    'grid_desc_0': { path: '/datosId/29/contenido10', stateUpdater: (val) => setGridData(p => ({ ...p, contenido10: val })) },
    'grid_title_1': { path: '/datosId/29/contenido11', stateUpdater: (val) => setGridData(p => ({ ...p, contenido11: val })) },
    'grid_desc_1': { path: '/datosId/29/contenido12', stateUpdater: (val) => setGridData(p => ({ ...p, contenido12: val })) },
    'grid_title_2': { path: '/datosId/29/contenido13', stateUpdater: (val) => setGridData(p => ({ ...p, contenido13: val })) },
    'grid_desc_2': { path: '/datosId/29/contenido14', stateUpdater: (val) => setGridData(p => ({ ...p, contenido14: val })) },
    'grid_title_3': { path: '/datosId/29/contenido15', stateUpdater: (val) => setGridData(p => ({ ...p, contenido15: val })) },
    'grid_desc_3': { path: '/datosId/29/contenido16', stateUpdater: (val) => setGridData(p => ({ ...p, contenido16: val })) },
    'grid_title_4': { path: '/datosId/29/contenido50', stateUpdater: (val) => setGridData(p => ({ ...p, contenido50: val })) },
    'grid_desc_4': { path: '/datosId/29/contenido51', stateUpdater: (val) => setGridData(p => ({ ...p, contenido51: val })) },
    'grid_title_5': { path: '/datosId/29/contenido52', stateUpdater: (val) => setGridData(p => ({ ...p, contenido52: val })) },
    'grid_desc_5': { path: '/datosId/29/contenido53', stateUpdater: (val) => setGridData(p => ({ ...p, contenido53: val })) },
    'grid_title_6': { path: '/datosId/29/contenido54', stateUpdater: (val) => setGridData(p => ({ ...p, contenido54: val })) },
    'grid_desc_6': { path: '/datosId/29/contenido55', stateUpdater: (val) => setGridData(p => ({ ...p, contenido55: val })) },
    'grid_title_7': { path: '/datosId/29/contenido56', stateUpdater: (val) => setGridData(p => ({ ...p, contenido56: val })) },
    'grid_desc_7': { path: '/datosId/29/contenido57', stateUpdater: (val) => setGridData(p => ({ ...p, contenido57: val })) },
    'grid_title_8': { path: '/datosId/29/contenido58', stateUpdater: (val) => setGridData(p => ({ ...p, contenido58: val })) },
    'grid_desc_8': { path: '/datosId/29/contenido59', stateUpdater: (val) => setGridData(p => ({ ...p, contenido59: val })) },
    'aclaraciones_title': { path: '/datosId/29/contenido21', stateUpdater: (val) => setAclaracionesData(p => ({ ...p, contenido21: val })) },
    'aclaraciones_1': { path: '/datosId/29/contenido22', stateUpdater: (val) => setAclaracionesData(p => ({ ...p, contenido22: val })) },
    'aclaraciones_2': { path: '/datosId/29/contenido23', stateUpdater: (val) => setAclaracionesData(p => ({ ...p, contenido23: val })) },
    'aclaraciones_3': { path: '/datosId/29/contenido24', stateUpdater: (val) => setAclaracionesData(p => ({ ...p, contenido24: val })) },
    'aclaraciones_4': { path: '/datosId/29/contenido25', stateUpdater: (val) => setAclaracionesData(p => ({ ...p, contenido25: val })) },
    'aclaraciones_5': { path: '/datosId/29/contenido26', stateUpdater: (val) => setAclaracionesData(p => ({ ...p, contenido26: val })) },
    'aclaraciones_6': { path: '/datosId/29/contenido27', stateUpdater: (val) => setAclaracionesData(p => ({ ...p, contenido27: val })) },
    'aclaraciones_7': { path: '/datosId/29/contenido28', stateUpdater: (val) => setAclaracionesData(p => ({ ...p, contenido28: val })) },
    'aclaraciones_8': { path: '/datosId/29/contenido29', stateUpdater: (val) => setAclaracionesData(p => ({ ...p, contenido29: val })) },
    'home_title': { path: '/datosId/29/contenido1' },
    'home_text': { path: '/datosId/29/contenido2' },
    'home_text_new': { path: '/datosId/29/contenido_nuevo' },
    'home_text_new_hover': { path: '/datosId/29/contenido_nuevo_hover' },
    'home_text_new_url': { path: '/datosId/29/contenido_nuevo_url' },
    'nav_logo': { path: '/datosId/28/foto30', stateUpdater: setLogoUrl },
    'footer_logo': { path: '/datosId/28/foto31', stateUpdater: setFooterLogoUrl },
    'footer_title_1': { path: '/datosId/29/contenido33', stateUpdater: setFooterTitle1 },
    'footer_title_2': { path: '/datosId/29/contenido34', stateUpdater: setFooterTitle2 },
    'footer_title_3': { path: '/datosId/29/contenido35', stateUpdater: setFooterTitle3 },
    'footer_description': { path: '/datosId/25/lema_marca', stateUpdater: setFooterDescription },
    'footer_link1_text': { path: '/datosId/25/link_instagram_text' },
    'footer_link1_url': { path: '/datosId/25/link_instagram' },
    'footer_link2_text': { path: '/datosId/25/link_facebook_text' },
    'footer_link2_url': { path: '/datosId/25/link_facebook' },
    'footer_map_link': { path: '/datosId/25/link_iframe_mapa', stateUpdater: setFooterMapLink },
    'footer_contact_link1_text': { path: '/datosId/25/whatsapp_text' },
    'footer_contact_link1_url': { path: '/datosId/25/numero_whatsapp' },
    'footer_contact_link2_text': { path: '/datosId/25/mail_text' },
    'footer_contact_link2_url': { path: '/datosId/25/direccion_mail' },
    'footer_disclaimer_text': { path: '/datosId/29/contenido39' },
    'footer_disclaimer_url': { path: '/datosId/29/contenido39_url' },
    'browser_title': { path: 'config/browserTitle', stateUpdater: setBrowserTitle },
    'loader_title': { path: 'config/loader/title', stateUpdater: setLoaderTitle },
    'loader_subtitle': { path: 'config/loader/subtitle', stateUpdater: setLoaderSubtitle },
    'loader_show_logo': { path: 'config/loader/showLogo', stateUpdater: setLoaderShowLogo },
    'loader_logo_url': { path: 'config/loader/logoUrl', stateUpdater: setLoaderLogoUrl },
    'loader_messages': { path: 'config/loader/messages', stateUpdater: setLoaderMessages },
    'whatsapp_reserva_template': { path: '/datosId/29/whatsapp_reserva_template', stateUpdater: setWhatsappReservaTemplate },
    'footer_horario_atencion': { path: '/datosId/27/horario_de_atencion', stateUpdater: setFooterHorarioAtencion },
    'footer_horario_alquiler': { path: '/datosId/27/horario_de_alquiler', stateUpdater: setFooterHorarioAlquiler },
    'whatsappShareMessage': {
      path: 'floatingButtons/whatsappShareButton/message',
      stateUpdater: setWhatsappShareMessage
    },
    'grid_layout_mode': { path: 'config/gridMode', stateUpdater: setGridMode },    // Dynamic mapping for nav links
    'video_url': { path: '/datosId/29/video_url', stateUpdater: setVideoUrl }, // Mapping
    'horarios_title': { path: '/datosId/29/horarios_title', stateUpdater: setHorariosTitle },
    'horarios_desc': { path: '/datosId/29/horarios_desc', stateUpdater: setHorariosDescription },
    ...(navLinks || []).reduce((acc, link, index) => {
      acc[`nav_link_${index}_text`] = { path: `/navbar/links/${index}/text`, linkIndex: index, field: 'text' };
      return acc;
    }, {}),
  };

  const handleSaveField = async (fieldKey, rawValue) => {
    const mapping = fieldMapping[fieldKey];
    if (!mapping) {
      console.error("Unknown fieldKey:", fieldKey);
      return;
    }

    const db = getDatabase(app);
    const updates = {};
    const strippedValue = typeof rawValue === 'string' ? rawValue.replace(/<[^>]+>/g, '') : rawValue;

    updates[mapping.path] = strippedValue;

    try {
      await update(ref(db), updates);

      if (mapping.stateUpdater) {
        mapping.stateUpdater(strippedValue);
      } else if (mapping.ratingIndex !== undefined) {
        const newRatingsData = [...ratingsData];
        let stateValue = strippedValue;
        if (mapping.isNumeric) {
          stateValue = `${strippedValue} opiniones`;
        }
        newRatingsData[mapping.ratingIndex][mapping.field] = stateValue;
        setRatingsData(newRatingsData);
      } else if (mapping.linkIndex !== undefined) {
        const newLinks = [...navLinks];
        newLinks[mapping.linkIndex][mapping.field] = strippedValue;
        setNavLinks(newLinks);
      }

      showToastNotification('¡Cambio guardado!');
      handleSetEditingField(null);
    } catch (error) {
      console.error("Error saving field:", error);
      showToastNotification("Error al guardar.", "error");
    }
  };

  const handleSaveLinkField = async (fieldKey, text, url) => {
    const textPath = fieldMapping[fieldKey + '_text'].path;
    const urlPath = fieldMapping[fieldKey + '_url'].path;

    const db = getDatabase(app);
    const updates = {};
    updates[textPath] = text;
    updates[urlPath] = url;

    try {
      await update(ref(db), updates);
      showToastNotification('¡Cambio guardado!');
      if (fieldKey === 'footer_link1') {
        setFooterLink1({ text, url });
      } else if (fieldKey === 'footer_link2') {
        setFooterLink2({ text, url });
      } else if (fieldKey === 'footer_contact_link1') {
        setFooterContactLink1({ text, url });
      } else if (fieldKey === 'footer_contact_link2') {
        setFooterContactLink2({ text, url });
      } else if (fieldKey === 'footer_disclaimer') {
        setFooterDisclaimer({ text, url });
      }
    } catch (error) {
      console.error("Error saving link field:", error);
      showToastNotification("Error al guardar.", "error");
    }
  };

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryTargetKey, setGalleryTargetKey] = useState(null);

  const handleOpenGallery = (cellImageKey) => {
    setGalleryTargetKey(cellImageKey);
    setIsGalleryModalOpen(true);
  };

  const handleGallerySelect = async (downloadURL) => {
    if (!galleryTargetKey) return;
    try {
      showToastNotification("Agregando imagen...");
      const db = getDatabase(app);
      const imageArrayRef = ref(db, `datosId/28/${galleryTargetKey}`);
      const snapshot = await get(imageArrayRef);
      const currentImages = snapshot.exists() ? snapshot.val() : [];
      const updatedImages = [...currentImages, downloadURL];
      await update(ref(db, 'datosId/28'), { [galleryTargetKey]: updatedImages });
      showToastNotification("Imagen agregada exitosamente.", 'success');
      setIsGalleryModalOpen(false);
      setGalleryTargetKey(null);
    } catch (error) {
       console.error(error);
    }
  };

  const handleFileSelect = async (file, cellImageKey, action, indexToDelete) => {
    console.log("handleFileSelect called:", { file, cellImageKey, action, indexToDelete });
    const db = getDatabase(app);
    const imageArrayRef = ref(db, `datosId/28/${cellImageKey}`);

    if (action === 'add') {
      console.log("Action: ADD");
      if (!file) {
        console.log("No file selected for ADD action.");
        return;
      }

      try {
        showToastNotification(`Subiendo imagen para ${cellImageKey}...`);
        console.log(`Uploading image for cellImageKey: ${cellImageKey}`);
        const downloadURL = await uploadToFirebaseStorage(file);
        console.log("Image uploaded, downloadURL:", downloadURL);

        // Get current array, add new URL, and update Firebase
        const snapshot = await get(imageArrayRef);
        const currentImages = snapshot.exists() ? snapshot.val() : [];
        const updatedImages = [...currentImages, downloadURL];
        console.log("Updating Firebase with new image array:", updatedImages);
        await update(ref(db), { [`datosId/28/${cellImageKey}`]: updatedImages });
        showToastNotification('¡Imagen agregada!');
      } catch (error) {
        console.error("Error al subir la imagen:", error);
        showToastNotification("Hubo un error al subir la imagen.", "error");
      }
    } else if (action === 'delete') {
      console.log("Action: DELETE");
      // Get current array, remove image at index, and update Firebase
      try {
        const snapshot = await get(imageArrayRef);
        const currentImages = snapshot.exists() ? snapshot.val() : [];
        const updatedImages = currentImages.filter((_, index) => index !== indexToDelete);
        console.log("Updating Firebase after image deletion:", updatedImages);
        await update(ref(db), { [`datosId/28/${cellImageKey}`]: updatedImages });
        showToastNotification('¡Imagen eliminada!');
      } catch (error) {
        console.error("Error al eliminar la imagen:", error);
        showToastNotification("Hubo un error al eliminar la imagen.", "error");
      }
    } else if (action === 'reorder') {
      console.log("Action: REORDER");
      const { from, to } = indexToDelete; // Using the 4th argument as the data payload
      try {
        const snapshot = await get(imageArrayRef);
        const currentImages = snapshot.exists() ? snapshot.val() : [];

        if (from < 0 || from >= currentImages.length || to < 0 || to >= currentImages.length) {
          console.error("Invalid reorder indices:", from, to);
          return;
        }

        const updatedImages = [...currentImages];
        const [movedImage] = updatedImages.splice(from, 1);
        updatedImages.splice(to, 0, movedImage);

        console.log("Updating Firebase after reorder:", updatedImages);
        await update(ref(db), { [`datosId/28/${cellImageKey}`]: updatedImages });
        showToastNotification('¡Imágenes reordenadas!');
      } catch (error) {
        console.error("Error al reordenar las imágenes:", error);
        showToastNotification("Hubo un error al reordenar las imágenes.", "error");
      }
    }
  };

  // Function to update a floating button in Firebase
  const updateButtonInFirebase = async (buttonId, updates) => {
    const buttonRef = ref(db, `floatingButtons/${buttonId}`);
    try {
      await update(buttonRef, updates);
      showToastNotification('¡Botón actualizado en Firebase!');
    } catch (error) {
      console.error("Error updating button in Firebase:", error);
      showToastNotification("Error al actualizar el botón.", "error");
    }
  };

  // Handler for updating a specific field of a floating button (link or tooltip)
  const handleUpdateFloatingButtonField = (buttonId, field, newValue) => {
    setFloatingButtons(prevButtons =>
      prevButtons.map(button => {
        if (button.id === buttonId) {
          const updatedButton = { ...button };
          // Handle nested properties (e.g., 'styles.bottom')
          if (field.includes('.')) {
            const [parentField, childField] = field.split('.');
            updatedButton[parentField] = {
              ...updatedButton[parentField],
              [childField]: newValue
            };
          } else {
            updatedButton[field] = newValue;
          }
          return updatedButton;
        }
        return button;
      })
    );

    // If the updated field is whatsappMessage for the whatsappShareButton, update the state
    if (buttonId === 'whatsappShareButton' && field === 'whatsappMessage') {
      setWhatsappShareMessage(newValue);
    }

    // Prepare updates for Firebase, handling nested paths
    const updates = {};
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      updates[`${parentField}/${childField}`] = newValue;
    } else {
      updates[field] = newValue;
    }
    updateButtonInFirebase(buttonId, updates);
  };

  // Handler for toggling the visibility of a floating button
  const handleToggleVisibility = useCallback((buttonId, isVisible) => {
    setFloatingButtons(prevButtons =>
      prevButtons.map(button =>
        button.id === buttonId ? { ...button, isVisible: isVisible } : button
      )
    );
    updateButtonInFirebase(buttonId, { isVisible: isVisible });
  }, [setFloatingButtons, updateButtonInFirebase]); // Dependencies for useCallback

  // Handler for changing the image of a floating button
  const handleImageChange = async (buttonId, file) => {
    if (!file) return;

    try {
      showToastNotification(`Subiendo imagen para el botón ${buttonId}...`);
      const downloadURL = await uploadToFirebaseStorage(file);

      setFloatingButtons(prevButtons =>
        prevButtons.map(button =>
          button.id === buttonId ? { ...button, icon: downloadURL } : button
        )
      );
      updateButtonInFirebase(buttonId, { icon: downloadURL });
      showToastNotification('¡Imagen del botón actualizada!');
    } catch (error) {
      console.error("Error al subir la imagen del botón:", error);
      showToastNotification("Hubo un error al subir la imagen del botón.", "error");
    }
  };

  const handleLoaderLogoSelect = async (file) => {
    if (!file) return;
    try {
      showToastNotification(`Subiendo logo del loader...`);
      const downloadURL = await uploadToFirebaseStorage(file);

      handleSaveField('loader_logo_url', downloadURL);
      showToastNotification('¡Logo del loader actualizado!');
    } catch (error) {
      console.error("Error al subir el logo del loader:", error);
      showToastNotification("Hubo un error al subir el logo.", "error");
    }
  };

  const handleSingleImageSelect = async (file, fieldKey) => {
    if (!file) return;
    try {
      showToastNotification(`Subiendo imagen para ${fieldKey}...`);
      const downloadURL = await uploadToFirebaseStorage(file);
      handleSaveField(fieldKey, downloadURL);
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      showToastNotification("Hubo un error al subir la imagen.", "error");
    }
  };

  const handleSaveWhatsappModalTexts = async (texts) => {
    const db = getDatabase(app);
    const updates = {};
    updates['/datosId/29/contenido36'] = texts.title;
    updates['/datosId/29/contenido40'] = texts.subtitle || '';
    updates['/datosId/29/contenido37'] = texts.juan;
    updates['/datosId/29/contenido38'] = texts.chatbot;
    try {
      await update(ref(db), updates);
      showToastNotification('¡Textos del modal guardados!');
    } catch (error) {
      console.error("Error saving whatsapp modal texts:", error);
      showToastNotification("Error al guardar.", "error");
    }
  };



  // Fetch floating buttons data from Firebase
  useEffect(() => {

    const buttonsRef = ref(db, 'floatingButtons');
    onValue(buttonsRef, (snapshot) => {
      try {
        const data = snapshot.val();

        if (data) {
          if (!data.scrollToTopButton) {
            data.scrollToTopButton = {
              id: 'scrollToTopButton',
              tooltip: 'Volver arriba',
              link: '#',
              isVisible: true,
              styles: {
                bottom: '10px',
                right: '0px'
              }
            };
          }
          const buttonsArray = Object.keys(data).map(key => ({
            id: key,
            isVisible: data[key].isVisible !== undefined ? data[key].isVisible : true, // Default to true
            ...data[key]
          }));

          setFloatingButtons(buttonsArray);
        } else {
          console.warn("No floating buttons found in Firebase at path 'floatingButtons'. Please add data to this path.");
          setFloatingButtons([]);
        }
      } catch (error) {
        console.error("Error fetching floating buttons:", error);
        setFloatingButtons([]);
      }
    });

    return () => {
      // Detach the listener when the component unmounts
      // Firebase's onValue returns a function to unsubscribe
      // If your Firebase version requires a specific unsubscribe method, adjust here.
      // For older versions, you might need to store the listener reference.
      // For v9 modular SDK, onValue returns the unsubscribe function directly.
      // Assuming db is available in this scope for unsubscribing, though often not strictly needed for page unmount.
      // If it's a global listener, manage carefully.
    };
  }, [db]); // Depend on db to ensure listener is set up correctly

  useEffect(() => {
    const fetchWhatsappMessage = async () => {
      const messageRef = ref(db, 'floatingButtons/whatsappShareButton/whatsappMessage');
      try {
        const snapshot = await get(messageRef);
        if (snapshot.exists()) {
          setWhatsappShareMessage(snapshot.val());
        } else {
          // Set a default message if not found
          setWhatsappShareMessage('Mira esta página: ' + window.location.origin);
        }
      } catch (error) {
        console.error("Error fetching WhatsApp share message:", error);
        setWhatsappShareMessage('Mira esta página: ' + window.location.origin); // Fallback to default
      }
    };
    fetchWhatsappMessage();
  }, [db]);

  // Fetch image URL from Firebase
  useEffect(() => {
    const fetchData = async () => {
      const dbRef = ref(db, "datosId/" + 25);
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const targetObject = snapshot.val();
          setInputValue209(targetObject.link_imagen_volver);
        } else {
          console.log("No se encontró link_imagen_volver en Firebase.");
        }
      } catch (error) {
        console.error("Error al obtener link_imagen_volver de Firebase:", error);
      }
    };
    fetchData();
  }, [db]);

  // Component Map for dynamic rendering
  const componentMap = {
    Header: <Header />,
    Navbar: <Navbar
      isEditable={true}
      links={navLinks}
      logoUrl={logoUrl}
      editingField={editingField}
      setEditingField={handleSetEditingField}
      onSave={handleSaveField}
      onFileSelect={handleSingleImageSelect}
      showReturnButton={true}
      showReorderButton={true}
      setShowReorder={setShowReorder}
    />,
    Home: (() => {
      return <Home
        isChatbotFeatureEnabled={true}
        isEditable={true}
        editingField={editingField}
        setEditingField={handleSetEditingField}
        onSave={handleSaveField}
      />;
    })(),
    QuienesSomos: (() => {
      return <QuienesSomos
        isEditable={true}
        data={quienesSomosData}
        editingField={editingField}
        setEditingField={handleSetEditingField}
        onSave={handleSaveField}
      />;
    })(),
    Aclaraciones: (() => {
      return <Aclaraciones
        isEditable={true}
        data={aclaracionesData}
        editingField={editingField}
        setEditingField={handleSetEditingField}
        onSave={handleSaveField}
      />;
    })(),
    Calculadora: <Calculadora />,
    Calendar: <Calendar />,
    Calificaciones: <Calificaciones />,
    CotizacionExitosa: <CotizacionExitosa />,
    SocialMediaRow: (
      <SocialMediaRow
        isEditable={true}
        videoUrl={videoUrl}
        editingField={editingField}
        setEditingField={handleSetEditingField}
        onSave={handleSaveField}
      />
    ),
    ReviewsAndTestimonials: (() => {
      return (
        <ReviewsAndTestimonials
          isEditable={true}
          ratingsData={ratingsData}
          tituloCalificaciones={tituloCalificaciones}
          sectionDescriptionTestimonials={sectionDescriptionTestimonials}
          editingField={editingField}
          setEditingField={handleSetEditingField}
          onSave={handleSaveField}
          onFileSelect={handleFileSelect}
        />
      );
    })(),
    Testimonial: <Testimonial />,
    Testimonial2: <Testimonial2 />,
    NewContactSection: <NewContactSection />,
    Grid2x2: (() => {
      const gridOptions = [
        { value: "2x2", label: "Grilla 2x2", image: grid2x2Image },
        { value: "1x2", label: "Grilla 1x2", image: grid1x2Image },
        { value: "1x1", label: "Grilla 1x1", image: grid1x1Image },
        { value: "1x3", label: "Grilla 1x3", image: grid1x3Image },
        { value: "2x3", label: "Grilla 2x3", image: grid2x3Image },
        { value: "3x2", label: "Grilla 3x2", image: grid3x2Image },
        { value: "3x3", label: "Grilla 3x3", image: grid3x3Image },
      ];

      return (
        <>
          <AdminSection style={{ width: '100%', textAlign: 'center' }}>
            <label>Configuración del Diseño de la Grilla </label>
            <GridModeSelector
              value={gridMode}
              options={gridOptions}
              onChange={(newValue) => handleSaveField('grid_layout_mode', newValue)}
            />
          </AdminSection>
          <Grid2x2
            isEditable={true}
            data={gridData}
            editingField={editingField}
            setEditingField={handleSetEditingField}
            onSave={handleSaveField}
            gridMode={gridMode}
            onFileSelect={handleFileSelect}
            onOpenGallery={handleOpenGallery}
          />
          <ImageGalleryModal
            isOpen={isGalleryModalOpen}
            onClose={() => { setIsGalleryModalOpen(false); setGalleryTargetKey(null); }}
            onSelect={handleGallerySelect}
          />
        </>
      );
    })(),
    Footer: <Footer
      isEditable={true}
      logoUrl={footerLogoUrl}
      onFileSelect={handleSingleImageSelect}
      title1={footerTitle1}
      title2={footerTitle2}
      title3={footerTitle3}
      description={footerDescription}
      link1={footerLink1}
      link2={footerLink2}
      mapLink={footerMapLink}
      contactLink1={footerContactLink1}
      contactLink2={footerContactLink2}
      editingField={editingField}
      setEditingField={handleSetEditingField}
      onSave={handleSaveField}
      onSaveLink={handleSaveLinkField}
      disclaimer={footerDisclaimer}
      horarioAtencion={footerHorarioAtencion}
      horarioAlquiler={footerHorarioAlquiler}
    />,
    ScrollToTop: <ScrollToTop />,
    HorariosVisita: <HorariosVisita 
      isEditable={true}
      editingField={editingField}
      setEditingField={handleSetEditingField}
      onSave={handleSaveField}
      titleText={horariosTitle}
      descriptionText={horariosDescription}
    />,
    Branding: <Branding onEditPageEntryAttempt={handleOpenEditingConfirmation} />,
  };





  // Fetch component order from Firebase
  useEffect(() => {
    const dbRef = ref(db, 'componentOrder');
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderArray = Array.isArray(data) ? data : Object.values(data);
        const formattedData = orderArray.map(item =>
          typeof item === 'string' ? { name: item, isVisible: true } : item
        );
        setComponentOrder(formattedData);
      } else {
        setComponentOrder([
          { name: 'ScrollToTop', isVisible: true },
          { name: 'Navbar', isVisible: true },
          // Removed FloatingAiButton from here
          { name: 'Home', isVisible: true },
          { name: 'Calendar', isVisible: true },
          { name: 'QuienesSomos', isVisible: true },
          { name: 'Grid2x2', isVisible: true },
          { name: 'ReviewsAndTestimonials', isVisible: true },
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
          const summary = data.texto || "No hay información configurada para la IA en este momento.";
          setPageSummary(summary.replace(/\s+/g, ' ').trim());
          const foto = data.imageUrl || "No hay información configurada para la IA en este momento.";
          setFoto(foto);
          const fetchedSpeed = typeof data.audioSpeed === 'number' ? data.audioSpeed : (parseFloat(data.audioSpeed) || 1.0);
          setAudioSpeed(fetchedSpeed);
        } else {
          setPageSummary("No hay información configurada para la IA en este momento.");
          setAudioSpeed(1.0);
        }
      } catch (error) {
        console.error("Error al cargar la configuración de la IA:", error);
        setPageSummary("Lo siento, hubo un error al cargar la información principal.");
        setAudioSpeed(1.0);
      } finally {
        setLoadingPageSummary(false);
      }
    };
    fetchIaConfig();
  }, [db]);



  return (
    <Section>
      <SEO title="Configuración | Panel Admin" noindex={true} />
      <Watermark>Página en edición</Watermark>
      <Watermark2>Página en edición</Watermark2>
      <ReorderPanel $show={showReorder}>
        <CompactComponentReorder />
      </ReorderPanel>

      <AdminSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffeeba', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#856404' }}>Modo Mantenimiento</h2>
            <p style={{ margin: '5px 0 0 0', color: '#856404', fontSize: '0.9rem' }}>
              Bloquea el acceso al sitio público mostrando una pantalla de mantenimiento. Solo los administradores podrán ver el sitio.
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
            <span style={{ marginRight: '10px', fontWeight: 'bold', color: maintenanceMode ? '#d32f2f' : '#388e3c' }}>
              {maintenanceMode ? 'ACTIVADO' : 'DESACTIVADO'}
            </span>
            <input 
              type="checkbox" 
              checked={maintenanceMode} 
              onChange={async (e) => {
                const newValue = e.target.checked;
                const db = getDatabase(app);
                try {
                  await set(ref(db, 'settings/maintenanceMode'), newValue);
                  showToastNotification(`Modo mantenimiento ${newValue ? 'activado' : 'desactivado'}`);
                } catch (error) {
                  console.error('Error:', error);
                  showToastNotification('Error al cambiar modo mantenimiento', 'error');
                }
              }}
              style={{ width: '20px', height: '20px', cursor: 'pointer', margin: 0 }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e2f0d9', padding: '15px', borderRadius: '8px', border: '1px solid #c3e6cb', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#155724' }}>Botón Trabaja con Nosotros</h2>
            <p style={{ margin: '5px 0 0 0', color: '#155724', fontSize: '0.9rem' }}>
              Muestra u oculta el botón "Trabajá con nosotros" en el pie de página.
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
            <span style={{ marginRight: '10px', fontWeight: 'bold', color: showJobsButton ? '#388e3c' : '#d32f2f' }}>
              {showJobsButton ? 'VISIBLE' : 'OCULTO'}
            </span>
            <input 
              type="checkbox" 
              checked={showJobsButton} 
              onChange={async (e) => {
                const newValue = e.target.checked;
                const db = getDatabase(app);
                try {
                  await set(ref(db, 'config/showJobsButton'), newValue);
                  showToastNotification(`Botón ${newValue ? 'visible' : 'oculto'}`);
                } catch (error) {
                  console.error('Error:', error);
                  showToastNotification('Error al cambiar visibilidad del botón', 'error');
                }
              }}
              style={{ width: '20px', height: '20px', cursor: 'pointer', margin: 0 }}
            />
          </label>
        </div>

      </AdminSection>

      <AdminSection>

        <label>Título de la Pestaña del Navegador</label>
        <EditableText
          value={browserTitle || 'Salón de eventos | Salón Magic Eventos'}
          onSave={(newValue) => handleSaveField('browser_title', newValue || 'Salón de eventos | Salón Magic Eventos')}
          isEditable={true} // Assuming it's always editable in config page
        />
        <small style={{ color: '#666', marginTop: '6px', display: 'block' }}>
          Título completo de la pestaña del navegador en la página principal (ej: <em>Salón de eventos | Salón Magic Eventos</em>).
        </small>
      </AdminSection>

      <AdminSection>
        <h2>Logos Principales de las Páginas</h2>
        
        <label>Logo del Navbar (Página Principal)</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => handleSingleImageSelect(e.target.files[0], 'nav_logo')}
          style={{ marginBottom: '1rem' }}
        />
        {logoUrl && <img src={logoUrl} alt="Navbar Logo" style={{ maxHeight: '100px', display: 'block', marginBottom: '2rem' }} />}

      </AdminSection>

      <AdminSection>
        <h2>Configuración del Cargador (Precarga)</h2>
        <label>Título principal (si no usa logo)</label>
        <EditableText
          value={loaderTitle}
          onSave={(newValue) => handleSaveField('loader_title', newValue)}
          isEditable={true}
        />
        <label>Subtítulo (si no usa logo)</label>
        <EditableText
          value={loaderSubtitle}
          onSave={(newValue) => handleSaveField('loader_subtitle', newValue)}
          isEditable={true}
        />
        <label>Mostrar Logo en lugar de Títulos</label>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <input 
            type="checkbox" 
            checked={loaderShowLogo} 
            onChange={(e) => handleSaveField('loader_show_logo', e.target.checked)}
            style={{ width: 'auto', marginRight: '10px', marginBottom: 0 }}
          />
          <span>Activar logo</span>
        </div>
        <label>Subir Logo de Precarga</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => handleLoaderLogoSelect(e.target.files[0])}
          style={{ marginBottom: '1rem' }}
        />
        {loaderLogoUrl && <img src={loaderLogoUrl} alt="Loader Logo" style={{ maxHeight: '100px', display: 'block', marginBottom: '1rem' }} />}

        <label>Frases de carga (una por línea)</label>
        <textarea
          value={loaderMessages}
          onChange={(e) => setLoaderMessages(e.target.value)}
          onBlur={(e) => handleSaveField('loader_messages', e.target.value)}
          rows={7}
          placeholder={"Cargando base de datos...\nCargando imágenes...\nSincronizando agenda..."}
        />
      </AdminSection>

      <div>
        {componentOrder.map((component) => {
          const Component = componentMap[component.name];
          return component.isVisible && Component ? (
            <div key={component.name}>
              <React.Suspense fallback={<div>Cargando {component.name}...</div>}>
                {Component}
              </React.Suspense>
            </div>
          ) : null;
        })}
      </div>
      {/* Render floating action buttons */}


      {
        floatingButtons.map((button) => {


          let buttonLink = button.link;

          // No longer calling setIsCalendarActive(true) directly here

          return (
            <ButtonWrapper key={button.id} $isVisible={button.isVisible}>
              <MemoizedFloatingActionButton
                id={button.id}
                link={buttonLink} // Use the potentially modified link
                tooltip={button.tooltip}
                icon={button.icon}
                onImageChange={handleImageChange} // For changing the button's icon
                onUpdateField={handleUpdateFloatingButtonField} // For updating tooltip text or link
                onSaveWhatsappModalTexts={handleSaveWhatsappModalTexts} // For saving whatsapp modal texts
                contentToRead={button.id === 'aiButton' ? pageSummary : undefined}
                audioSpeed={button.id === 'aiButton' ? audioSpeed : undefined}
                $buttonColor={button.buttonColor}
                $imageSize={button.imageSize}
                $imageTop={button.styles?.imageTop}
                $imageRight={button.styles?.imageRight}
                $bottom={button.styles?.bottom}
                $right={button.styles?.right}
                isEditableContext={true} // Pass true for editable context
                isChatbotButton={button.id === 'chatAiButton'}
                isCalendarRoute={location.pathname === '/calendario'}
                isVisible={button.isVisible} // Pass isVisible prop
                onToggleVisibility={handleToggleVisibility}
                $isConfigPage={true} // New prop to indicate it's in the config page
                whatsappMessage={button.id === 'whatsappShareButton' ? whatsappShareMessage : undefined} // Pass whatsappMessage
              />
            </ButtonWrapper>
          );
        })
      }

      {
        showToast && (
          <ToastWrapper $type={toastType}>
            <ToastMessage>{toastMessage}</ToastMessage>
          </ToastWrapper>
        )
      }
    </Section >
  );
}

const Section = styled.section`
  padding: 0; /* Set padding to 0 */
  margin: 0; /* Set margin to 0 */

  .botonReturn {
    position: static;
    z-index: 1001;
    background-color: white;
    color: black;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }
  }

  .botonReturnLink {
    text-decoration: none;
    color: black;
    font-weight: bold;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
`;

const ToggleButton = styled.button`
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 10px;
  display: block;
`;

const SaveButton = styled.button`
    display: block;
    margin: 1rem auto;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: bold;
    color: white;
    background-color: var(--primary-color);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: #c42121;
    }
`;

const ReorderPanel = styled.div`
  position: fixed;
  top: 0;
  right: ${({ $show }) => ($show ? '0' : '-350px')}; /* Adjust width as needed */
  width: 350px; /* Width of the panel */
  height: 100vh;
  background-color: var(--card-grey, white);
  box-shadow: -2px 0 5px var(--shadow-color, rgba(0,0,0,0.2));
  z-index: 1000;
  transition: right 0.3s ease-in-out;
  padding: 20px;
  overflow-y: auto; /* Enable scrolling if content overflows */
`;

const ButtonWrapper = styled.div`
  position: relative;
  margin-bottom: 20px;
  /* Removed padding and border */
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: ${({ $isVisible }) => ($isVisible ? 'var(--input-bg, white)' : 'var(--card-grey, #f0f0f0)')};
  border: 1px solid var(--border-color, transparent);
  /* Removed opacity property */
  transition: all 0.3s ease;
`;

const Watermark = styled.div`
  position: fixed;
  top: 65%;
  left: 50%;
  transform: translate(-49%, -51%) ;
  z-index: 10000;
  font-size: 5rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
  white-space: nowrap;
  user-select: none;
  @media screen and (min-width: 280px) and (max-width: 1080px) {
    font-size: 3rem;
  }
`;

const Watermark2 = styled.div`
  position: fixed;
  top: 65%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9998;
  font-size: 5rem;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.25);
  pointer-events: none;
  white-space: nowrap;
  user-select: none;
  @media screen and (min-width: 280px) and (max-width: 1080px) {
    font-size: 3rem;
  }
`;

const ToastWrapper = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${(props) => (props.$type === 'success' ? '#4CAF50' : '#f44336')};
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  z-index: 10000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: opacity 0.3s ease-in-out;
`;

const ToastMessage = styled.span`
  font-size: 1rem;
  font-weight: bold;
`;






export default ConfiguracionPage;
