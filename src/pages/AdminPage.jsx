// src/pages/AdminPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { ReactSortable } from "react-sortablejs";
import styled, { keyframes } from "styled-components";
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { doSignOut } from '../firebase/auth';
import { database } from '../firebase/firebase';
import { ref, onValue, get, set } from 'firebase/database';
import { useSiteContext } from '../contexts/SiteContext';
import { useLoading } from '../contexts/LoadingContext';
import SEO from '../components/SEO';

// Importación de todos los subcomponentes del panel
import Modal from '../components/Modal';
import FormularioRecibo from "../components/FormsYToggles/FormularioRecibo";
import GestorCredenciales from "../components/FormsYToggles/GestorCredenciales";
import TooglesPrecios from "../components/FormsYToggles/TogglesPrecios";
import ServiciosAdmin from "../components/Admin/ServiciosAdmin";
import ScheduleStructureAdmin from "../components/Admin/ScheduleStructureAdmin";
import FeedbackAdmin from "../components/Admin/FeedbackAdmin";
import { FaStar, FaRegStar, FaSearch, FaCheckCircle, FaTimesCircle, FaGripHorizontal, FaWhatsapp } from "react-icons/fa";

// Subcomponentes migrados directamente desde Ajustes (ToggleConfiguracion)
import ThemeSettings from "../components/FormsYToggles/ThemeSettings";
import GestionFeriados from "../components/FormsYToggles/GestionFeriados";
import FormFestiveThemes from "../components/FormsYToggles/FormFestiveThemes";
import GestionCalendarios from "../components/FormsYToggles/GestionCalendarios";
import EventHeatmap from "../components/EventHeatmap";
import FormPlantillaRecibo from "../components/FormsYToggles/FormPlantillaRecibo";
import FormPlantillaReciboInfografico from "../components/FormsYToggles/FormPlantillaReciboInfografico";
import InstagramAdminSettings from "../components/FormsYToggles/InstagramAdminSettings";
import FormTestimonios from "../components/FormsYToggles/FormTestimonios";
import FormPublicacionesEmbebidas from "../components/FormsYToggles/FormPublicacionesEmbebidas";
import AdminKnowledgeBaseEditor from "../components/FormsYToggles/AdminKnowledgeBaseEditor";
import FormIA from "../components/FormsYToggles/FormIA";
import FormImagenes from "../components/FormsYToggles/FormImagenes";
import FormPrevisualizaciones from "../components/FormsYToggles/FormPrevisualizaciones";
import FormEmbudoReserva from "../components/FormsYToggles/FormEmbudoReserva";
import LoginReciboPage from './LoginReciboPage';
import FormEstadisticas from "../components/FormsYToggles/FormEstadisticas";
import HoverSoundSettings from "../components/Admin/HoverSoundSettings";
import FacturasAdmin from "../components/Admin/FacturasAdmin";
import ChatbotDashboard from "../components/Admin/ChatbotDashboard";
import GalleryManager from "../components/Admin/GalleryManager";

// --- ILUSTRACIONES VECTORIALES SVG AUTOCONTENIDAS ---

const SVGPrecios = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-precios" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff9a9e" />
        <stop offset="100%" stopColor="#fecfef" />
      </linearGradient>
    </defs>
    <rect x="15" y="15" width="70" height="70" rx="12" fill="url(#grad-precios)" opacity="0.15" />
    <rect x="15" y="15" width="70" height="70" rx="12" fill="none" stroke="url(#grad-precios)" strokeWidth="3" />
    <line x1="15" y1="38" x2="85" y2="38" stroke="url(#grad-precios)" strokeWidth="3" />
    <circle cx="30" cy="27" r="4" fill="url(#grad-precios)" />
    <circle cx="70" cy="27" r="4" fill="url(#grad-precios)" />
    <rect x="25" y="48" width="12" height="12" rx="3" fill="url(#grad-precios)" />
    <rect x="44" y="48" width="12" height="12" rx="3" fill="url(#grad-precios)" opacity="0.6" />
    <rect x="63" y="48" width="12" height="12" rx="3" fill="url(#grad-precios)" opacity="0.6" />
    <rect x="25" y="67" width="12" height="12" rx="3" fill="url(#grad-precios)" opacity="0.6" />
    <text x="52" y="77" fontFamily="system-ui" fontSize="18" fontWeight="bold" fill="url(#grad-precios)" textAnchor="middle">$</text>
  </svg>
);

const SVGRecibos = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-recibos" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a1c4fd" />
        <stop offset="100%" stopColor="#c2e9fb" />
      </linearGradient>
    </defs>
    <path d="M25 15h50v60a5 5 0 01-5 5H30a5 5 0 01-5-5V15z" fill="url(#grad-recibos)" opacity="0.15" />
    <path d="M25 15h50v60a5 5 0 01-5 5H30a5 5 0 01-5-5V15z" fill="none" stroke="url(#grad-recibos)" strokeWidth="3" />
    <line x1="35" y1="30" x2="65" y2="30" stroke="url(#grad-recibos)" strokeWidth="3" strokeLinecap="round" />
    <line x1="35" y1="42" x2="55" y2="42" stroke="url(#grad-recibos)" strokeWidth="3" strokeLinecap="round" />
    <line x1="35" y1="54" x2="60" y2="54" stroke="url(#grad-recibos)" strokeWidth="3" strokeLinecap="round" />
    <circle cx="65" cy="65" r="10" fill="none" stroke="url(#grad-recibos)" strokeWidth="2.5" />
    <path d="M61 65l3 3 5-5" fill="none" stroke="url(#grad-recibos)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SVGPlantilla = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-plantilla" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f6d365" />
        <stop offset="100%" stopColor="#fda085" />
      </linearGradient>
    </defs>
    <rect x="20" y="20" width="60" height="60" rx="8" fill="url(#grad-plantilla)" opacity="0.15" />
    <rect x="20" y="20" width="60" height="60" rx="8" fill="none" stroke="url(#grad-plantilla)" strokeWidth="3" />
    <rect x="30" y="30" width="40" height="12" rx="4" fill="none" stroke="url(#grad-plantilla)" strokeWidth="2.5" />
    <line x1="30" y1="52" x2="70" y2="52" stroke="url(#grad-plantilla)" strokeWidth="2.5" />
    <line x1="30" y1="62" x2="60" y2="62" stroke="url(#grad-plantilla)" strokeWidth="2.5" />
    <path d="M62 42l15-15 4 4-15 15z" fill="url(#grad-plantilla)" />
  </svg>
);

const SVGPlantillaInfografico = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-plantilla-info" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <rect x="16" y="16" width="68" height="68" rx="10" fill="url(#grad-plantilla-info)" opacity="0.15" />
    <rect x="16" y="16" width="68" height="68" rx="10" fill="none" stroke="url(#grad-plantilla-info)" strokeWidth="2.5" />
    <rect x="23" y="24" width="24" height="15" rx="3" fill="url(#grad-plantilla-info)" opacity="0.4" />
    <rect x="53" y="24" width="24" height="15" rx="3" fill="url(#grad-plantilla-info)" opacity="0.25" />
    <rect x="23" y="43" width="24" height="15" rx="3" fill="url(#grad-plantilla-info)" opacity="0.25" />
    <rect x="53" y="43" width="24" height="15" rx="3" fill="url(#grad-plantilla-info)" opacity="0.4" />
    <line x1="23" y1="67" x2="58" y2="67" stroke="url(#grad-plantilla-info)" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="23" y1="73" x2="46" y2="73" stroke="url(#grad-plantilla-info)" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M67 61l13-13 4 4-13 13z" fill="url(#grad-plantilla-info)" />
    <path d="M65 63l-2 6 6-2z" fill="url(#grad-plantilla-info)" />
  </svg>
);

const SVGServicios = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-servicios" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4facfe" />
        <stop offset="100%" stopColor="#00f2fe" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" fill="url(#grad-servicios)" opacity="0.15" />
    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#grad-servicios)" strokeWidth="3" />
    <path d="M50 25 L55 38 L68 38 L58 47 L62 60 L50 52 L38 60 L42 47 L32 38 L45 38 Z" fill="url(#grad-servicios)" />
    <circle cx="20" cy="50" r="4" fill="url(#grad-servicios)" />
    <circle cx="80" cy="50" r="4" fill="url(#grad-servicios)" />
  </svg>
);

const SVGColores = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-colores" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b1f4cf" />
        <stop offset="100%" stopColor="#9890e3" />
      </linearGradient>
    </defs>
    <path d="M50 15a35 35 0 1025 59.7 6 6 0 014.2-2c3.3.4 5.8-2 5.8-5.3A17.4 17.4 0 0067.6 50a6 6 0 01-6-6A23.4 23.4 0 0050 15z" fill="url(#grad-colores)" opacity="0.15" />
    <path d="M50 15a35 35 0 1025 59.7 6 6 0 014.2-2c3.3.4 5.8-2 5.8-5.3A17.4 17.4 0 0067.6 50a6 6 0 01-6-6A23.4 23.4 0 0050 15z" fill="none" stroke="url(#grad-colores)" strokeWidth="3" />
    <circle cx="38" cy="35" r="6" fill="#ff758c" />
    <circle cx="62" cy="35" r="6" fill="#fecfef" />
    <circle cx="35" cy="58" r="6" fill="#5ee7df" />
    <circle cx="55" cy="68" r="6" fill="#ff9a9e" />
  </svg>
);

const SVGCalendarios = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-calendarios" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d4fc79" />
        <stop offset="100%" stopColor="#96e6a1" />
      </linearGradient>
    </defs>
    <rect x="20" y="25" width="60" height="55" rx="10" fill="url(#grad-calendarios)" opacity="0.15" />
    <rect x="20" y="25" width="60" height="55" rx="10" fill="none" stroke="url(#grad-calendarios)" strokeWidth="3" />
    <line x1="20" y1="42" x2="80" y2="42" stroke="url(#grad-calendarios)" strokeWidth="3" />
    <rect x="33" y="15" width="6" height="15" rx="3" fill="url(#grad-calendarios)" />
    <rect x="61" y="15" width="6" height="15" rx="3" fill="url(#grad-calendarios)" />
    <circle cx="35" cy="53" r="3" fill="url(#grad-calendarios)" />
    <circle cx="50" cy="53" r="3" fill="url(#grad-calendarios)" />
    <circle cx="65" cy="53" r="3" fill="url(#grad-calendarios)" />
    <circle cx="35" cy="66" r="3" fill="url(#grad-calendarios)" />
    <circle cx="50" cy="66" r="3" fill="url(#grad-calendarios)" />
    <path d="M60 66h12v-12" fill="none" stroke="url(#grad-calendarios)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SVGFeriados = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-feriados" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffb199" />
        <stop offset="100%" stopColor="#ff0844" />
      </linearGradient>
    </defs>
    <rect x="20" y="25" width="60" height="55" rx="10" fill="url(#grad-feriados)" opacity="0.15" />
    <rect x="20" y="25" width="60" height="55" rx="10" fill="none" stroke="url(#grad-feriados)" strokeWidth="3" />
    <line x1="20" y1="42" x2="80" y2="42" stroke="url(#grad-feriados)" strokeWidth="3" />
    <rect x="33" y="15" width="6" height="15" rx="3" fill="url(#grad-feriados)" />
    <rect x="61" y="15" width="6" height="15" rx="3" fill="url(#grad-feriados)" />
    <line x1="40" y1="55" x2="60" y2="70" stroke="url(#grad-feriados)" strokeWidth="3" />
    <line x1="60" y1="55" x2="40" y2="70" stroke="url(#grad-feriados)" strokeWidth="3" />
  </svg>
);

const SVGTemaFestivo = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-temafestivo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff9a9e" />
        <stop offset="100%" stopColor="#fecfef" />
      </linearGradient>
    </defs>
    <rect x="20" y="20" width="60" height="60" rx="8" fill="url(#grad-temafestivo)" opacity="0.15" />
    <circle cx="50" cy="50" r="20" fill="none" stroke="url(#grad-temafestivo)" strokeWidth="3" />
    <path d="M50 30 L55 45 L70 50 L55 55 L50 70 L45 55 L30 50 L45 45 Z" fill="url(#grad-temafestivo)" />
  </svg>
);

const SVGHeatmap = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-heatmap" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f6d365" />
        <stop offset="100%" stopColor="#ff0844" />
      </linearGradient>
    </defs>
    <rect x="20" y="20" width="60" height="60" rx="8" fill="none" stroke="url(#grad-heatmap)" strokeWidth="3" />
    <rect x="28" y="28" width="10" height="10" rx="2" fill="url(#grad-heatmap)" opacity="0.2" />
    <rect x="44" y="28" width="10" height="10" rx="2" fill="url(#grad-heatmap)" opacity="0.8" />
    <rect x="60" y="28" width="10" height="10" rx="2" fill="url(#grad-heatmap)" opacity="0.4" />
    <rect x="28" y="44" width="10" height="10" rx="2" fill="url(#grad-heatmap)" opacity="1" />
    <rect x="44" y="44" width="10" height="10" rx="2" fill="url(#grad-heatmap)" opacity="0.5" />
    <rect x="60" y="44" width="10" height="10" rx="2" fill="url(#grad-heatmap)" opacity="0.9" />
    <rect x="28" y="60" width="10" height="10" rx="2" fill="url(#grad-heatmap)" opacity="0.3" />
    <rect x="44" y="60" width="10" height="10" rx="2" fill="url(#grad-heatmap)" opacity="0.7" />
    <rect x="60" y="60" width="10" height="10" rx="2" fill="url(#grad-heatmap)" opacity="0.1" />
  </svg>
);

const SVGEstructura = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-estructura" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#85a3ff" />
        <stop offset="100%" stopColor="#c5a3ff" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" fill="url(#grad-estructura)" opacity="0.15" />
    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#grad-estructura)" strokeWidth="3" />
    <polyline points="50,22 50,50 68,50" fill="none" stroke="url(#grad-estructura)" strokeWidth="3" strokeLinecap="round" />
    <rect x="58" y="15" width="22" height="10" rx="3" fill="url(#grad-estructura)" />
    <text x="69" y="23" fontFamily="system-ui" fontSize="8" fontWeight="bold" fill="#fff" textAnchor="middle">3h</text>
  </svg>
);

const SVGPlano = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-plano" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#30cfd0" />
        <stop offset="100%" stopColor="#330867" />
      </linearGradient>
    </defs>
    <rect x="15" y="20" width="70" height="60" rx="8" fill="url(#grad-plano)" opacity="0.15" />
    <rect x="15" y="20" width="70" height="60" rx="8" fill="none" stroke="url(#grad-plano)" strokeWidth="3" />
    <circle cx="35" cy="40" r="8" fill="url(#grad-plano)" />
    <path d="M20 72l20-25 15 15 20-30 10 15v25z" fill="url(#grad-plano)" opacity="0.5" />
    <path d="M20 72l20-25 15 15 20-30 10 15" fill="none" stroke="url(#grad-plano)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SVGPrev = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-prev" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5576c" />
        <stop offset="100%" stopColor="#f093fb" />
      </linearGradient>
    </defs>
    <rect x="15" y="20" width="70" height="60" rx="6" fill="url(#grad-prev)" opacity="0.15" />
    <rect x="15" y="20" width="70" height="60" rx="6" fill="none" stroke="url(#grad-prev)" strokeWidth="3" />
    <rect x="25" y="30" width="30" height="15" rx="3" fill="none" stroke="url(#grad-prev)" strokeWidth="2" />
    <circle cx="68" cy="38" r="4" fill="url(#grad-prev)" />
    <line x1="25" y1="58" x2="75" y2="58" stroke="url(#grad-prev)" strokeWidth="2" />
    <circle cx="45" cy="45" r="15" fill="none" stroke="url(#grad-prev)" strokeWidth="3" />
    <line x1="55" y1="55" x2="68" y2="68" stroke="url(#grad-prev)" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

const SVGFinanzas = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-finanzas" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#43e97b" />
        <stop offset="100%" stopColor="#38f9d7" />
      </linearGradient>
    </defs>
    <rect x="20" y="30" width="60" height="40" rx="4" fill="url(#grad-finanzas)" opacity="0.15" />
    <rect x="20" y="30" width="60" height="40" rx="4" fill="none" stroke="url(#grad-finanzas)" strokeWidth="3" />
    <circle cx="50" cy="50" r="8" fill="none" stroke="url(#grad-finanzas)" strokeWidth="2" />
    <path d="M50 42v16M46 45h8M46 55h8" stroke="url(#grad-finanzas)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SVGSueldos = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-sueldos" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f6d365" />
        <stop offset="100%" stopColor="#fda085" />
      </linearGradient>
    </defs>
    <rect x="25" y="25" width="50" height="60" rx="4" fill="url(#grad-sueldos)" opacity="0.15" />
    <rect x="25" y="25" width="50" height="60" rx="4" fill="none" stroke="url(#grad-sueldos)" strokeWidth="3" />
    <line x1="35" y1="40" x2="65" y2="40" stroke="url(#grad-sueldos)" strokeWidth="2" />
    <line x1="35" y1="55" x2="55" y2="55" stroke="url(#grad-sueldos)" strokeWidth="2" />
    <line x1="35" y1="70" x2="60" y2="70" stroke="url(#grad-sueldos)" strokeWidth="2" />
  </svg>
);

const SVGEmbudo = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-embudo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a8ceff" />
        <stop offset="100%" stopColor="#5073b8" />
      </linearGradient>
    </defs>
    <path d="M20 20 L80 20 L60 45 L60 75 L40 75 L40 45 Z" fill="url(#grad-embudo)" opacity="0.15" />
    <path d="M20 20 L80 20 L60 45 L60 75 L40 75 L40 45 Z" fill="none" stroke="url(#grad-embudo)" strokeWidth="3" strokeLinejoin="round" />
    <line x1="30" y1="32" x2="70" y2="32" stroke="url(#grad-embudo)" strokeWidth="2.5" />
    <line x1="38" y1="45" x2="62" y2="45" stroke="url(#grad-embudo)" strokeWidth="2.5" />
  </svg>
);

const SVGGoogle = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-google" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f12711" />
        <stop offset="100%" stopColor="#f5af19" />
      </linearGradient>
    </defs>
    <path d="M15 25h70v40H35L15 75V25z" fill="url(#grad-google)" opacity="0.15" />
    <path d="M15 25h70v40H35L15 75V25z" fill="none" stroke="url(#grad-google)" strokeWidth="3" strokeLinejoin="round" />
    <path d="M50 33 L53 41 L62 41 L55 46 L57 54 L50 49 L43 54 L45 46 L38 41 L47 41 Z" fill="url(#grad-google)" />
    <circle cx="28" cy="43" r="4" fill="url(#grad-google)" opacity="0.6" />
    <circle cx="72" cy="43" r="4" fill="url(#grad-google)" opacity="0.6" />
  </svg>
);

const SVGFb = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-fb" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00c6ff" />
        <stop offset="100%" stopColor="#0072ff" />
      </linearGradient>
    </defs>
    <path d="M85 25H15v40h50L85 75V25z" fill="url(#grad-fb)" opacity="0.15" />
    <path d="M85 25H15v40h50L85 75V25z" fill="none" stroke="url(#grad-fb)" strokeWidth="3" strokeLinejoin="round" />
    <text x="35" y="53" fontFamily="system-ui" fontSize="30" fontWeight="bold" fill="url(#grad-fb)" textAnchor="middle">f</text>
    <path d="M55 43l8-8 3 3-8 8" fill="none" stroke="url(#grad-fb)" strokeWidth="2.5" />
  </svg>
);

const SVGInstagram = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-redes" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f093fb" />
        <stop offset="100%" stopColor="#f5576c" />
      </linearGradient>
    </defs>
    <rect x="20" y="20" width="60" height="60" rx="15" fill="url(#grad-redes)" opacity="0.15" />
    <rect x="20" y="20" width="60" height="60" rx="15" fill="none" stroke="url(#grad-redes)" strokeWidth="3" />
    <circle cx="50" cy="50" r="16" fill="none" stroke="url(#grad-redes)" strokeWidth="3" />
    <circle cx="68" cy="32" r="4.5" fill="url(#grad-redes)" />
  </svg>
);

const SVGBrain = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-brain" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4facfe" />
        <stop offset="100%" stopColor="#00f2fe" />
      </linearGradient>
    </defs>
    <path d="M35 50a15 15 0 0115-15 12 12 0 0118 4 15 15 0 0112 21 12 12 0 01-18 10A15 15 0 0135 50z" fill="url(#grad-brain)" opacity="0.15" />
    <path d="M35 50a15 15 0 0115-15 12 12 0 0118 4 15 15 0 0112 21 12 12 0 01-18 10A15 15 0 0135 50z" fill="none" stroke="url(#grad-brain)" strokeWidth="2.5" />
    <line x1="50" y1="35" x2="50" y2="70" stroke="url(#grad-brain)" strokeWidth="2" strokeDasharray="3 3" />
    <circle cx="50" cy="35" r="3" fill="url(#grad-brain)" />
    <circle cx="50" cy="70" r="3" fill="url(#grad-brain)" />
    <circle cx="35" cy="50" r="3" fill="url(#grad-brain)" />
    <circle cx="65" cy="50" r="3" fill="url(#grad-brain)" />
  </svg>
);

const SVGSummary = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-summary" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff758c" />
        <stop offset="100%" stopColor="#ff7eb3" />
      </linearGradient>
    </defs>
    <rect x="25" y="15" width="50" height="70" rx="6" fill="url(#grad-summary)" opacity="0.15" />
    <rect x="25" y="15" width="50" height="70" rx="6" fill="none" stroke="url(#grad-summary)" strokeWidth="3" />
    <line x1="35" y1="30" x2="65" y2="30" stroke="url(#grad-summary)" strokeWidth="2.5" />
    <line x1="35" y1="40" x2="65" y2="40" stroke="url(#grad-summary)" strokeWidth="2.5" />
    <line x1="35" y1="50" x2="55" y2="50" stroke="url(#grad-summary)" strokeWidth="2.5" />
    <path d="M68 62h10v10" fill="none" stroke="url(#grad-summary)" strokeWidth="2" />
    <path d="M60 70 L65 75 L75 60" fill="none" stroke="url(#grad-summary)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const SVGStats = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-stats" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#184e68" />
        <stop offset="100%" stopColor="#57ca85" />
      </linearGradient>
    </defs>
    <rect x="15" y="15" width="70" height="70" rx="10" fill="url(#grad-stats)" opacity="0.15" />
    <rect x="15" y="15" width="70" height="70" rx="10" fill="none" stroke="url(#grad-stats)" strokeWidth="3" />
    <polyline points="25,65 40,45 55,50 75,25" fill="none" stroke="url(#grad-stats)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="75" cy="25" r="4.5" fill="url(#grad-stats)" />
    <line x1="20" y1="75" x2="80" y2="75" stroke="url(#grad-stats)" strokeWidth="3" />
  </svg>
);

const SVGFeedback = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-feedback" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fad0c4" />
        <stop offset="100%" stopColor="#ffd1ff" />
      </linearGradient>
    </defs>
    <rect x="15" y="25" width="70" height="50" rx="8" fill="url(#grad-feedback)" opacity="0.15" />
    <rect x="15" y="25" width="70" height="50" rx="8" fill="none" stroke="url(#grad-feedback)" strokeWidth="3" />
    <path d="M15 25l35 25 35-25" fill="none" stroke="url(#grad-feedback)" strokeWidth="3" />
    <circle cx="50" cy="62" r="5" fill="url(#grad-feedback)" />
  </svg>
);

const SVGSound = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-sound" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#84fab0" />
        <stop offset="100%" stopColor="#8fd3f4" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" fill="url(#grad-sound)" opacity="0.15" />
    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#grad-sound)" strokeWidth="3" />
    <path d="M35 40v20h10l12 12V28L45 40H35z" fill="url(#grad-sound)" />
    <path d="M64 38a10 10 0 010 24M71 31a20 20 0 010 38" fill="none" stroke="url(#grad-sound)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// --- COMPONENTE PRINCIPAL ---

const SVGGalleryManager = () => (
  <svg viewBox="0 0 100 100" className="card-illustration">
    <defs>
      <linearGradient id="grad-gallery" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a1c4fd" />
        <stop offset="100%" stopColor="#c2e9fb" />
      </linearGradient>
    </defs>
    <rect x="15" y="20" width="70" height="60" rx="10" fill="url(#grad-gallery)" opacity="0.15" />
    <rect x="15" y="20" width="70" height="60" rx="10" fill="none" stroke="url(#grad-gallery)" strokeWidth="3" />
    <circle cx="35" cy="40" r="8" fill="url(#grad-gallery)" />
    <path d="M15 70L40 45L55 60L70 40L85 60" fill="none" stroke="url(#grad-gallery)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SVGBell = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 16V10C18 6.68629 15.3137 4 12 4C8.68629 4 6 6.68629 6 10V16H4V18H20V16H18Z" fill="#ffca28" fillOpacity="0.2" stroke="#ffca28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 20H14C14 21.1046 13.1046 22 12 22C10.8954 22 10 21.1046 10 20Z" fill="#ffca28" stroke="#ffca28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const getEmojiForPanel = (id) => {
  const emojiMap = {
    gestor_galeria: '🖼️',
    precios: '💰',
    recibos: '🧾',
    plantilla_recibo: '📄',
    servicios: '📋',
    colores: '🎨',
    feriados: '🏖️',
    temas_festivos: '🎉',
    calendarios: '📅',
    estructura: '🕒',
    plano: '🗺️',
    previsualizaciones: '👁️',
    embudo_reserva: '🧲',
    sonido_hover: '🔊',
    testimonios_google: '🌟',
    testimonios_facebook: '👍',
    redes_video: '📱',
    ia_conocimiento: '🧠',
    ia_resumen: '🤖',
    dashboard_empresa: '🏢',
    dashboard_sueldos: '💵',
    dashboard_monotributo: '🏛️',
    listado_facturas: '🧾',
    ia_apikey: '🔑',
    estadisticas: '📊',
    feedback: '💬',
    heatmap: '🗺️',
    notificaciones: '🔔',
  };
  return emojiMap[id] || '⚙️';
};



const defaultSections = [
    { id: 'diseño', title: 'Interfaz', dotClass: 'dot-blue' },
    { id: 'comercial', title: 'Gestión Comercial y Precios', dotClass: 'dot-green' },
    { id: 'finanzas', title: 'Finanzas y Reportes', dotClass: 'dot-yellow' },
    { id: 'marketing', title: 'Marketing e Integraciones', dotClass: 'dot-purple' },
    { id: 'operativa', title: 'Calendarios', dotClass: 'dot-gray' },
    { id: 'ia', title: 'Inteligencia Artificial', dotClass: 'dot-teal' },
    { id: 'contenido', title: 'Contenido y Multimedia', dotClass: 'dot-cyan' },
    { id: 'whatsapp', title: 'WhatsApp', dotClass: 'dot-green' },
    { id: 'metricas', title: 'Análisis y Mensajes', dotClass: 'dot-orange' }
  ];

function AdminPage({ initialTab = 0, onTabChange }) {
  const { siteName } = useSiteContext();
  const { completeTask } = useLoading();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();


  // Mapeamos los índices numéricos originales a las nuevas secciones descriptivas
  const mapInitialTab = (tab) => {
    if (tab === 1) return "recibos";
    if (tab === 7) return "precios";
    if (tab === 11) return "servicios";
    if (tab === 16) return "estructura";
    if (tab === 20) return "feedback";
    return "dashboard"; // Por defecto, abrimos el Dashboard Hub
  };


  const urlSection = searchParams.get('panel');
  const currentSection = urlSection || mapInitialTab(initialTab);
  const [unreadCount, setUnreadCount] = useState(0);
const cards = useMemo(() => [
    {
      id: "precios",
      title: "Precios Mensuales",
      desc: "Establece valores mes a mes para eventos, días de la semana y promociones especiales.",
      category: "comercial",
      illustration: <SVGPrecios />,
      component: <TooglesPrecios />
    },
    {
      id: "recibos",
      title: "Generador de Recibos",
      desc: "Confecciona recibos y descargalos en pdf.",
      category: "comercial",
      illustration: <SVGRecibos />,
      component: <FormularioRecibo />
    },
    {
      id: "plantilla_recibo",
      title: "Plantilla de Recibos",
      desc: "Personaliza los encabezados, textos legales e informaciones fijas de los recibos.",
      category: "comercial",
      illustration: <SVGPlantilla />,
      component: <FormPlantillaRecibo toggle="32" />
    },
    {
      id: "plantilla_recibo_infografico",
      title: "Plantilla Recibo Infográfico",
      desc: "Personaliza interactivamente los textos, cláusulas y normativas del recibo infográfico.",
      category: "comercial",
      illustration: <SVGPlantillaInfografico />,
      component: <FormPlantillaReciboInfografico toggle="32" />
    },
    {
      id: "servicios",
      title: "Servicios del Salón",
      desc: "Administra el catálogo de servicios ofrecidos, sus costos, detalles y visibilidad.",
      category: "comercial",
      illustration: <SVGServicios />,
      component: <ServiciosAdmin />
    },
    {
      id: "colores",
      title: "Apariencia y Colores",
      desc: "Personaliza los estilos del sitio, colores primarios, fondo y variables visuales.",
      category: "diseño",
      illustration: <SVGColores />,
      component: <ThemeSettings />
    },
    {
      id: "feriados",
      title: "Días Feriados",
      desc: "Administra las fechas que se cobrarán como feriado en las cotizaciones.",
      category: "operativa",
      illustration: <SVGFeriados />,
      component: <GestionFeriados />
    },
    {
      id: "temas_festivos",
      title: "Temas Festivos Automáticos",
      desc: "Configura colores, banners y logos que se aplicarán automáticamente en fechas patrias o festividades.",
      category: "diseño",
      illustration: <SVGTemaFestivo />,
      component: <FormFestiveThemes />
    },
    {
      id: "calendarios",
      title: "IDs de Calendarios",
      desc: "Vincula las IDs de Google Calendar de eventos, feriados y visitas.",
      category: "operativa",
      illustration: <SVGCalendarios />,
      component: <GestionCalendarios />
    },
    {
      id: "estructura",
      title: "Estructura y Horarios",
      desc: "Define turnos de alquiler, horas base, señas y bloquea días feriados del calendario.",
      category: "operativa",
      illustration: <SVGEstructura />,
      component: <ScheduleStructureAdmin />
    },
    {
      id: "plano",
      title: "Imágenes y Plano",
      desc: <>Cambia la imagen del plano que podés compartir desde <a href="/plano" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline', fontWeight: 'bold' }}>{window.location.host}/plano</a></>,
      category: "contenido",
      illustration: <SVGPlano />,
      component: <FormImagenes toggle="28" />
    },
    {
      id: "gestor_galeria",
      title: "Gestor de Galería",
      desc: "Administra, visualiza en cuadrícula completa y elimina fácilmente las imágenes subidas al servidor.",
      category: "contenido",
      illustration: <SVGGalleryManager />,
      component: <GalleryManager />
    },
    {
      id: "previsualizaciones",
      title: "Pre -\nVisualizaciones",
      desc: "Configura la manera en que se muestran los precios y listados en la web cliente.",
      category: "whatsapp",
      illustration: <SVGPrev />,
      component: <FormPrevisualizaciones />
    },
    {
      id: "embudo_reserva",
      title: "Embudo de Reserva",
      desc: "Gestiona los datos que se enviaran al cliente cuando cliquea en el botón deconfirmar una reserva. Favorece la rapidez de la reserva brindando la información necesaria para concretarla.",
      category: "whatsapp",
      illustration: <SVGEmbudo />,
      component: <FormEmbudoReserva />
    },
    {
      id: "sonido_hover",
      title: "Efecto de Sonido (Hover)",
      desc: "Configura el sonido interactivo sutil y adictivo al pasar el mouse por las tarjetas de la página.",
      category: "diseño",
      illustration: <SVGSound />,
      component: <HoverSoundSettings />
    },
    {
      id: "testimonios_google",
      title: "Testimonios Google",
      desc: "Selecciona y edita las reseñas de Google Maps que destacan en la página.",
      category: "marketing",
      illustration: <SVGGoogle />,
      component: <FormTestimonios toggle="1" />
    },
    {
      id: "testimonios_facebook",
      title: "Testimonios Facebook",
      desc: "Enlaza opiniones o publicaciones de Facebook en el carrusel de testimonios.",
      category: "marketing",
      illustration: <SVGFb />,
      component: <FormPublicacionesEmbebidas toggle={1} />
    },
    {
      id: "redes_video",
      title: "Redes y Video",
      desc: "Configura el feed de Instagram, enlaces a redes sociales y video institucional.",
      category: "marketing",
      illustration: <SVGInstagram />,
      component: <InstagramAdminSettings />
    },
    {
      id: "ia_conocimiento",
      title: "Base de Conocimiento IA",
      desc: "Entrena al asistente inteligente del salón con respuestas frecuentes y normas.",
      category: "ia",
      illustration: <SVGBrain />,
      component: <AdminKnowledgeBaseEditor />
    },
    {
      id: "ia_resumen",
      title: "Resúmenes por IA",
      desc: "Ajusta el texto que leera en voz alta un locutor IA. Redacta un buen resumen que no sea demasiado largo y ajusta la velocidad.",
      category: "ia",
      illustration: <SVGBrain />,
      component: <FormIA />
    },
    {
      id: "dashboard_empresa",
      title: "Finanzas de Empresa",
      desc: "Gestiona los gastos de la empresa y controla los impuestos mensuales.",
      category: "finanzas",
      isLink: true,
      to: "/dashboard-empresa",
      illustration: <SVGPrecios />
    },
    {
      id: "dashboard_sueldos",
      title: "Sueldos y Adelantos",
      desc: "Gestiona los sueldos del personal, asistencias, adelantos y bonos de los empleados.",
      category: "finanzas",
      isLink: true,
      to: "/dashboard-sueldos",
      illustration: <SVGRecibos />
    },
    {
      id: "dashboard_monotributo",
      title: "Gestión Arca / Monotributo",
      desc: "Configura límites anuales, frenos de emergencia y facturación automática en ARCA.",
      category: "finanzas",
      isLink: true,
      to: "/dashboard-monotributo",
      illustration: <SVGRecibos />
    },
    {
      id: "listado_facturas",
      title: "Gestor de Facturas",
      desc: "Busca y visualiza todas las facturas emitidas por AFIP ordenadas cronológicamente.",
      category: "finanzas",
      illustration: <SVGRecibos />,
      component: <FacturasAdmin />
    },
    {
      id: "gestor_credenciales",
      title: "Gestor de Credenciales",
      desc: "Sube tu archivo de secretos unificado para configurar las claves de AFIP, Google y Groq en la base de datos.",
      category: "ia",
      illustration: <SVGBrain />,
      component: <GestorCredenciales />
    },
    {
      id: "ia_dashboard_config",
      title: "Dashboard Chatbot",
      desc: "Visión general de la configuración, lógica y comportamiento del Chatbot.",
      category: "ia",
      illustration: <SVGBrain />,
      component: <ChatbotDashboard />
    },
    {
      id: "estadisticas",
      title: "Estadísticas del Sitio",
      desc: "Monitorea la cantidad de visitas, cotizaciones generadas y logs de interacción.",
      category: "metricas",
      illustration: <SVGStats />,
      component: <FormEstadisticas />
    },
    {
      id: "feedback",
      title: "Mensajes y Feedback",
      desc: "Revisa el buzón de sugerencias, dudas y valoraciones enviadas por visitantes.",
      category: "metricas",
      illustration: <SVGFeedback />,
      component: <FeedbackAdmin />,
      badge: unreadCount
    },
    {
      id: "heatmap",
      title: "Mapa de Calor de Horarios",
      desc: "Analiza la densidad y ocupación de eventos según horas y días.",
      category: "metricas",
      illustration: <SVGHeatmap />,
      component: <EventHeatmap />
    },
    {
      id: "notificaciones",
      title: "Bandeja de Notificaciones",
      desc: "Visualiza la campana de notificaciones y avisos desde la barra superior.",
      category: "metricas",
      illustration: <SVGBell />,
      component: <div style={{textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '12px'}}>
        <SVGBell />
        <h3 style={{marginTop: '1rem'}}>Notificaciones</h3>
        <p style={{color: '#666', marginTop: '0.5rem'}}>
          Las notificaciones se visualizan mejor desde la campana en la barra superior.<br/>
          <strong>Consejo:</strong> Marca esta tarjeta como favorita para fijar el ícono en la barra.
        </p>
      </div>
    },
    {
      id: "calculadora",
      title: "Calculadora de Sueldos",
      desc: "Acceso rápido a la calculadora de sueldos de empleados.",
      category: "comercial",
      illustration: <SVGRecibos />,
      component: <FormularioRecibo isEmployeeFlow={true} />
    }
  ], [unreadCount]);

  const [lastDeploy, setLastDeploy] = useState(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sectionsOrder, setSectionsOrder] = useState(defaultSections);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  useEffect(() => {
    if (layoutLoaded) {
      completeTask('app_init');
    }
  }, [completeTask, layoutLoaded]);


  const [cardsByCategory, setCardsByCategory] = useState({});

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_favorites');
      if (saved) return JSON.parse(saved);
      // Pre-cargar las tarjetas más utilizadas por defecto para el administrador
      const defaultFavs = [
        { id: "dashboard_monotributo", title: "Gestión Arca / Monotributo", category: "finanzas" },
        { id: "notificaciones", title: "Bandeja de Notificaciones", category: "metricas" },
        { id: "calculadora", title: "Calculadora de Sueldos", category: "comercial" }
      ];
      localStorage.setItem('admin_favorites', JSON.stringify(defaultFavs));
      return defaultFavs;
    } catch {
      return [];
    }
  });






  const toggleFavorite = (e, card) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.some(f => f.id === card.id)) {
      newFavs = favorites.filter(f => f.id !== card.id);
    } else {
      newFavs = [...favorites, { id: card.id, title: card.title, category: card.category }];
    }
    setFavorites(newFavs);
    localStorage.setItem('admin_favorites', JSON.stringify(newFavs));
    window.dispatchEvent(new Event('admin_favorites_changed'));
  };

  // Escuchador de feedback pendiente en tiempo real
  useEffect(() => {
    const feedbackRef = ref(database, 'feedback');
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const count = Object.values(data).filter(f => f.status !== 'read').length;
        setUnreadCount(count);
      } else {
        setUnreadCount(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // Escuchador de estado del deploy
  useEffect(() => {
    const deployRef = ref(database, 'config/lastDeploy');
    const unsubscribe = onValue(deployRef, (snapshot) => {
      setLastDeploy(snapshot.val());
    });
    return () => unsubscribe();
  }, []);

  const selectSection = (sectionName) => {
    const card = cards.find(c => c.id === sectionName);
    if (card && card.isLink) {
      window.location.href = card.to;
      return;
    }

    if (sectionName === "dashboard") {
      setSearchParams({});
    } else {
      setSearchParams({ panel: sectionName });
    }

    if (onTabChange) {
      // Mapeamos de vuelta al índice numérico correspondiente para conservar compatibilidad con triggers externos
      const reverseMap = {
        recibos: 1,
        precios: 7,
        estructura: 16,
        servicios: 11,
        feedback: 20
      };
      onTabChange(reverseMap[sectionName] || 8);
    }
  };

  const handleSignOut = () => {
    doSignOut().then(() => {
      navigate('/');
    });
  };

  // Comprobar si es el flujo directo del empleado para recibos
  const isEmployeeFlow = initialTab === 1;

  // Lista estructurada de tarjetas del Dashboard Hub
  


  const layoutLoadedRef = React.useRef(false);
  useEffect(() => {
    if (layoutLoadedRef.current) return;
    layoutLoadedRef.current = true;
    
    // Failsafe para evitar carga eterna en produccion si Firebase no responde
    const timeoutId = setTimeout(() => {
      setLayoutLoaded(true);
    }, 2500);

    const initial = {
      'comercial': ['calculadora', 'precios', 'servicios', 'recibos', 'plantilla_recibo'],
      'diseño': ['notificaciones', 'colores', 'temas_festivos', 'sonido_hover'],
      'contenido': ['gestor_galeria', 'plano'],
      'operativa': ['estructura', 'calendarios', 'feriados'],
      'finanzas': ['dashboard_empresa', 'dashboard_monotributo', 'listado_facturas', 'dashboard_sueldos'],
      'marketing': ['testimonios_google', 'testimonios_facebook', 'redes_video'],
      'ia': ['ia_dashboard_config', 'ia_conocimiento', 'ia_resumen', 'gestor_credenciales'],
      'metricas': ['estadisticas', 'feedback', 'heatmap'],
      'whatsapp': ['previsualizaciones', 'embudo_reserva']
    };

    cards.forEach(c => {
       let found = false;
       Object.values(initial).forEach(arr => { if (arr.includes(c.id)) found = true; });
       if (!found) {
         if (initial[c.category]) initial[c.category].push(c.id);
         else initial[c.category] = [c.id];
       }
    });

    const layoutRef = ref(database, 'config/adminLayout');
    onValue(layoutRef, (snapshot) => {
      clearTimeout(timeoutId);
      const data = snapshot.val();
      if (data) {
        if (data.sectionsOrder) {
          let merged = data.sectionsOrder.map(id => defaultSections.find(s => s.id === id)).filter(Boolean);
          merged = merged.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));
          defaultSections.forEach(s => {
            if (!merged.find(m => m.id === s.id)) merged.push(s);
          });
          setSectionsOrder(merged);
        }
        
        if (data.cardsByCategory) {
          const parsed = data.cardsByCategory;
          const merged = { ...parsed };
          Object.keys(initial).forEach(cat => {
            if (!Array.isArray(merged[cat])) merged[cat] = [];
          });
          
          const validCardIds = new Set(cards.map(c => c.id));
          Object.keys(merged).forEach(cat => {
            merged[cat] = [...new Set(merged[cat])].filter(id => validCardIds.has(id));
          });
          
          const allParsedCards = new Set();
          Object.values(merged).forEach(arr => arr.forEach(id => allParsedCards.add(id)));
          
          cards.forEach(c => {
            if (!allParsedCards.has(c.id)) {
              if (merged[c.category]) merged[c.category].push(c.id);
            }
          });
          setCardsByCategory(merged);
        } else {
          setCardsByCategory(initial);
        }
      } else {
        setCardsByCategory(initial);
      }
      setLayoutLoaded(true);
    }, (err) => {
      clearTimeout(timeoutId);
      console.error(err);
      setCardsByCategory(initial);
      setLayoutLoaded(true);
    }, { onlyOnce: true });
  }, [cards]); // Needs cards to compute validCardIds




  const displayCardsBySection = useMemo(() => {
    const result = {};
    sectionsOrder.forEach(section => {
      const sectionCardIds = cardsByCategory[section.id] || [];
      const visibleCards = sectionCardIds.map(id => cards.find(c => c.id === id)).filter(Boolean);
      
      let displayCards = visibleCards;
      if (searchTerm) {
        const term = normalizeString(searchTerm);
        displayCards = visibleCards.filter(card => 
          normalizeString(card.title).includes(term) || (card.desc && normalizeString(card.desc).includes(term))
        );
      }
      result[section.id] = displayCards;
    });
    return result;
  }, [sectionsOrder, cardsByCategory, searchTerm, cards]);

  // Renderizar la sección abierta
  const activeCard = cards.find(c => c.id === currentSection);

  if (isEmployeeFlow || currentSection === "recibos") {
    // Si es flujo exclusivo del empleado, o se seleccionó recibos en modo empleado
    if (isEmployeeFlow) {
      return (
        <EmployeeContainer>
          <EmployeeHeader>
            <div className="title-area">
              <SVGRecibos />
              <h2>Calculadora de Sueldos</h2>
            </div>
          </EmployeeHeader>
          <div className="employee-content">
            <FormularioRecibo isEmployeeFlow={true} />
          </div>
        </EmployeeContainer>
      );
    }
  }

  const normalizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const filteredCards = cards.filter(card => {
    if (!searchTerm) return true;
    const term = normalizeString(searchTerm);
    
    // Check if title matches
    const titleMatch = normalizeString(card.title).includes(term);
    
    // Check if desc matches (only if desc is a string)
    const descMatch = normalizeString(card.desc).includes(term);
    
    return titleMatch || descMatch;
  });

  return (
    <>
      <SEO title="Panel de Administración" noindex={true} />
      <SectionWrapper>
        {currentSection === "dashboard" ? (
          // PANTALLA PRINCIPAL: DASHBOARD HUB
          <div className="dashboard-hub fade-in">
          
            {/* HEADER DE BIENVENIDA */}
            <WelcomeHeader>
              <div className="welcome-text" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Panel de Control
                  {lastDeploy && (
                    <div 
                      title={lastDeploy.status === 'success' ? `Web actualizada con éxito - ${new Date(lastDeploy.timestamp).toLocaleString('es-AR')}\n\n${lastDeploy.errorMessage || ''}` : `El deploy falló - ${new Date(lastDeploy.timestamp).toLocaleString('es-AR')}\n\n${lastDeploy.errorMessage || ''}`}
                      onClick={() => setIsDeployModalOpen(true)}
                      style={{ 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: lastDeploy.status === 'success' ? '#10b981' : '#ef4444',
                        fontSize: '1rem',
                        marginTop: '2px'
                      }}
                    >
                      {lastDeploy.status === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
                    </div>
                  )}
                </h1>
                {lastDeploy && isDeployModalOpen && (
                  <Modal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)}>
                    <h2 style={{ color: lastDeploy.status === 'success' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      {lastDeploy.status === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
                      {lastDeploy.status === 'success' ? 'Web actualizada con éxito' : 'El deploy falló'}
                    </h2>
                    <p style={{ marginBottom: '1rem' }}><strong>Fecha:</strong> {new Date(lastDeploy.timestamp).toLocaleString('es-AR')}</p>
                    {lastDeploy.errorMessage && (
                      <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        {lastDeploy.errorMessage}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      {lastDeploy.errorMessage?.match(/https:\/\/github\.com[^\s]+/) && (
                        <button onClick={() => window.open(lastDeploy.errorMessage.match(/https:\/\/github\.com[^\s]+/)[0], '_blank')} style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                          Ver detalles en GitHub
                        </button>
                      )}
                      <button onClick={() => setIsDeployModalOpen(false)} style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Cerrar
                      </button>
                    </div>
                  </Modal>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <p style={{ margin: 0 }}>{siteName} &bull; Centro Administrativo</p>
                </div>
              </div>
            
            <div className="header-favorites" style={{ display: 'flex', gap: '8px', flexGrow: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              {cards.filter(c => favorites.some(f => f.id === c.id)).map(card => (
                <button
                  key={`top-fav-${card.id}`}
                  onClick={() => selectSection(card.id)}
                  title={card.title}
                  style={{
                    background: 'var(--card-grey, rgba(0,0,0,0.03))',
                    border: '1px solid var(--border-color, rgba(0,0,0,0.05))',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>{getEmojiForPanel(card.id)}</span>
                </button>
              ))}
            </div>

            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <SecondaryButton 
                  onClick={() => setShowSearch(!showSearch)} 
                  title={showSearch ? 'Cerrar Buscador' : 'Buscar Herramientas'}
                  style={{ padding: '8px', minWidth: 'auto', borderRadius: '50%' }}
                >
                  <FaSearch size={16} />
                </SecondaryButton>
                {showSearch && (
                  <input 
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '20px',
                      border: '1px solid #ccc',
                      outline: 'none',
                      fontSize: '0.9rem',
                      width: '180px'
                    }}
                    autoFocus
                  />
                )}
              </div>
              <LogoutButton onClick={handleSignOut}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Cerrar Sesión</span>
              </LogoutButton>
              <SecondaryButton onClick={() => navigate('/')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Volver al Home</span>
              </SecondaryButton>
            </div>
          </WelcomeHeader>

          {/* ESTADÍSTICAS RÁPIDAS EN BANNER */}
          {unreadCount > 0 && (
            <AlertBanner onClick={() => selectSection("feedback")}>
              <span className="bell-ping"></span>
              <p>Tienes <strong>{unreadCount}</strong> nuevo{unreadCount > 1 ? 's' : ''} mensaje{unreadCount > 1 ? 's' : ''} de feedback sin leer. ¡Haz clic para revisarlos!</p>
            </AlertBanner>
          )}



          {/* GRID DE TARJETAS CATEGORIZADAS */}
                                        <ReactSortable 
            tag={DashboardSections}
            list={sectionsOrder}
            setList={(newList) => {
              setSectionsOrder(newList);
              set(ref(database, 'config/adminLayout/sectionsOrder'), newList.map(s => s.id));
            }}
            animation={200}
            handle=".section-block-title"
            ghostClass="sortable-ghost"
            dragClass="sortable-drag"
            fallbackOnBody={true}
            swapThreshold={0.65}
            delay={400}
              delayOnTouchOnly={true}
          >
            {sectionsOrder.map((section) => {
              const sectionCardIds = cardsByCategory[section.id] || [];
              const displayCards = displayCardsBySection[section.id] || [];

              if (searchTerm && displayCards.length === 0) return null;
              if (displayCards.length === 0 && sectionCardIds.length > 0) return null; // hidden by search

              return (
                <div key={section.id}>
                  <SectionBlock style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <h3 
                      className="section-block-title"
                      style={{ cursor: 'grab' }}
                      title="Arrastra para reordenar"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaGripHorizontal style={{ color: '#ccc', cursor: 'grab' }} />
                        <span className={`dot ${section.dotClass}`}></span> {section.title}
                      </div>
                    </h3>
                    
                    <ReactSortable
                      tag={CardsGrid}
                      list={displayCards}
                      setList={(newList) => {
                        if (searchTerm) return; // Disable reordering while searching
                        setCardsByCategory(prev => {
                          const next = { ...prev, [section.id]: newList.map(c => c.id) };
                          set(ref(database, 'config/adminLayout/cardsByCategory'), next);
                          return next;
                        });
                      }}
                      group="cards"
                      animation={200}
                      ghostClass="sortable-ghost"
                      fallbackOnBody={true}
                      swapThreshold={0.65}
                      delay={400}
              delayOnTouchOnly={true}
                    >
                      {displayCards.map((card) => {
                        const isFav = favorites.some(f => f.id === card.id);
                        return (
                          <div key={card.id}>
                            <CardKey 
                              onClick={() => card.isLink ? navigate(card.to) : selectSection(card.id)} 
                              title={card.desc}
                              style={{ height: '100%' }}
                            >
                              <FavoriteButton onClick={(e) => toggleFavorite(e, card)} $isFav={isFav} title="Fijar en Navbar">
                                {isFav ? <FaStar color="#ffca28" /> : <FaRegStar />}
                              </FavoriteButton>
                              <div className="card-illustration-container">
                                {card.illustration}
                              </div>
                              <div className="card-text-container">
                                <h4>{card.title}</h4>
                              </div>
                            </CardKey>
                          </div>
                        );
                      })}
                    </ReactSortable>
                  </SectionBlock>
                </div>
              );
            })}
          </ReactSortable>

          {/* FOOTER DEL HUB */}
          <HubFooter>
            <p>&copy; {new Date().getFullYear()} {siteName} &bull; Desarrollado con excelencia técnica</p>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/configuracion" style={{ fontFamily: 'playlistscript, cursive', fontSize: '1.5rem', color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>
                {siteName}
              </Link>
            </div>
          </HubFooter>

        </div>
      ) : (
        // PANTALLA SECUNDARIA: SECCIÓN ACTIVA DETALLADA
        <SectionContainer className="fade-in">
          
          {/* CABECERA DE LA SECCIÓN */}
          <SectionHeader>
            <div className="title-wrapper">
              <div className="title-icon">
                {activeCard ? activeCard.illustration : null}
              </div>
              <div className="title-text">
                <h2>{activeCard ? activeCard.title : "Administración"}</h2>
              </div>
            </div>

            <BackButton onClick={() => selectSection("dashboard")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Volver al Panel</span>
            </BackButton>
          </SectionHeader>

          {/* DESCRIPCIÓN DE LA SECCIÓN */}
          {activeCard && activeCard.desc && (
            <SectionDescription className="fade-in">
              {activeCard.desc}
            </SectionDescription>
          )}

          {/* CONTENIDO DEL COMPONENTE */}
          <SectionContent>
            {activeCard ? activeCard.component : <div className="error-msg">No se pudo cargar la sección.</div>}
          </SectionContent>
        </SectionContainer>
      )}
      </SectionWrapper>
    </>
  );
}

export default AdminPage;

// --- ESTILOS CON STYLED-COMPONENTS ---

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const ping = keyframes`
  0% { transform: scale(0.9); opacity: 1; }
  80% { transform: scale(1.4); opacity: 0; }
  100% { transform: scale(1.4); opacity: 0; }
`;

const SectionWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: var(--app-background-color, #ffffec);
  color: var(--primary-text, #160529);
  padding: 2rem 1.5rem;
  box-sizing: border-box;

  .fade-in {
    animation: ${fadeIn} 0.4s ease-out forwards;
  }

  .dashboard-hub {
    max-width: 1400px;
    margin: 0 auto;
  }
`;

const WelcomeHeader = styled.div`
  position: sticky;
  top: 0;
  margin-top: -2rem; /* Offsets parent padding-top */
  margin-left: -1.5rem; /* Offsets parent padding-left */
  margin-right: -1.5rem; /* Offsets parent padding-right */
  padding: 0.75rem 1.5rem;
  background-color: var(--app-background-color, #ffffec);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  box-sizing: border-box;

  .welcome-text {
    h1 {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--primary-text);
      margin: 0;
      letter-spacing: -0.5px;
      font-family: 'product_sansregular', sans-serif;
    }
    p {
      display: none; /* Hide subtitle to make header super compact and space-efficient */
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    flex-wrap: nowrap;
    justify-content: space-between;
    gap: 4px;

    .welcome-text {
      width: auto;
      gap: 4px !important;
      h1 {
        font-size: 0.85rem;
        white-space: nowrap;
      }
    }

    .header-favorites {
      gap: 4px !important;
      button {
        width: 32px !important;
        height: 32px !important;
      }
    }

    .header-actions {
      gap: 4px;
    }
  }
`;

const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--input-bg, white);
  color: var(--primary-text);
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px var(--shadow-color, rgba(0,0,0,0.02));

  &:hover {
    background: var(--hover-bg, #f8f9fa);
    border-color: var(--border-color, rgba(0,0,0,0.15));
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 8px;
    span {
      display: none;
    }
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(211, 47, 47, 0.15);

  &:hover {
    background: #b71c1c;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(211, 47, 47, 0.25);
  }

  @media (max-width: 768px) {
    padding: 6px;
    span {
      display: none;
    }
  }
`;

const DeployErrorBanner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  background: #fdf2f2;
  color: #9b1c1c;
  border: 1px solid #fde8e8;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(155, 28, 28, 0.05);
  font-family: inherit;

  .banner-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;
    font-size: 1.05rem;
  }

  .banner-desc {
    font-size: 0.9rem;
    color: #b83232;
  }

  .banner-meta {
    font-size: 0.8rem;
    color: #e05c5c;
    margin-top: 4px;
    border-top: 1px dashed rgba(155, 28, 28, 0.15);
    padding-top: 6px;
    code {
      background: rgba(155, 28, 28, 0.08);
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 0.85em;
    }
  }
`;

const AlertBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(133, 100, 4, 0.05);

  &:hover {
    transform: scale(1.005);
    box-shadow: 0 6px 16px rgba(133, 100, 4, 0.08);
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    background: none;
    height: auto;
  }

  .bell-ping {
    width: 10px;
    height: 10px;
    background: #f44336;
    border-radius: 50%;
    position: relative;
    display: inline-block;
    flex-shrink: 0;

    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background: #f44336;
      border-radius: 50%;
      left: 0;
      top: 0;
      animation: ${ping} 1.5s infinite ease-in-out;
    }
  }
`;

const DashboardSections = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  margin: -0.75rem;

  & > div {
    width: 33.333%;
    padding: 0.75rem;

    @media (max-width: 1200px) {
      width: 50%;
    }

    @media (max-width: 768px) {
      width: 100%;
    }
  }
`;

const SectionBlock = styled.div`
  background: var(--card-grey, rgba(0, 0, 0, 0.02));
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));

  .section-block-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    margin-bottom: 1.2rem;
    color: var(--primary-text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'product_sansregular', sans-serif;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .dot-green { background-color: #2ec4b6; box-shadow: 0 0 8px #2ec4b6; }
  .dot-blue { background-color: #00b4d8; box-shadow: 0 0 8px #00b4d8; }
  .dot-purple { background-color: #7209b7; box-shadow: 0 0 8px #7209b7; }
  .dot-teal { background-color: #1565c0; box-shadow: 0 0 8px #1565c0; }
  .dot-orange { background-color: #ff9f1c; box-shadow: 0 0 8px #ff9f1c; }
  .dot-cyan { background-color: #06d6a0; box-shadow: 0 0 8px #06d6a0; }
  .dot-gray { background-color: #6c757d; box-shadow: 0 0 8px #6c757d; }
  .dot-yellow { background-color: #ffd166; box-shadow: 0 0 8px #ffd166; }

  @media (max-width: 768px) {
    padding: 0.75rem;
    .section-block-title {
      font-size: 0.75rem;
      margin-bottom: 0.8rem;
    }
  }
`;

const CardsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  margin: -5px;

  & > div {
    width: 33.333%;
    padding: 5px;

    @media (max-width: 768px) {
      width: 50%;
    }
  }
`;


const FavoriteButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: ${props => props.$isFav ? '#ffca28' : '#ccc'};
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;

  &:hover {
    transform: scale(1.15);
    color: ${props => props.$isFav ? '#ffca28' : '#aaa'};
  }
`;

const CardKey = styled.div`
  background: var(--card-grey, white);
  border-radius: 12px;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  box-shadow: 0 2px 4px -1px var(--shadow-color, rgba(0, 0, 0, 0.05)), 0 1px 2px -1px var(--shadow-color, rgba(0, 0, 0, 0.03));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px -5px var(--shadow-color, rgba(0, 0, 0, 0.08)), 0 4px 6px -5px var(--shadow-color, rgba(0, 0, 0, 0.04));
    border-color: var(--border-color, rgba(0, 0, 0, 0.08));
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--app-primary-color, #1e1e1e);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover::before {
    opacity: 1;
  }

  .card-illustration-container {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    margin: 0;
    position: relative;

    svg {
      width: 100%;
      height: 100%;
      transition: transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .badge-glow {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #f44336;
      color: white;
      font-size: 9px;
      font-weight: bold;
      border-radius: 10px;
      padding: 2px 5px;
      box-shadow: 0 0 8px rgba(244, 67, 54, 0.5);
    }
  }

  .card-text-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    h4 {
      margin: 0;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--primary-text);
      font-family: 'product_sansregular', sans-serif;
      line-height: 1.2;
      white-space: pre-line;
      word-break: break-word;

      @media (max-width: 768px) {
        font-size: 0.65rem;
      }
    }
    p {
      display: none;
    }
  }
`;

const HubFooter = styled.div`
  margin-top: 4rem;
  padding: 1.5rem;
  text-align: center;
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));

  p {
    margin: 0;
    font-size: 0.82rem;
    color: var(--secondary-text);
    background: none;
    height: auto;
  }
`;

const SectionContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  position: sticky;
  top: 0;
  margin-top: -2rem; /* Offsets parent padding-top */
  margin-left: -1.5rem; /* Offsets parent padding-left */
  margin-right: -1.5rem; /* Offsets parent padding-right */
  padding: 0.75rem 1.5rem;
  background-color: var(--app-background-color, #ffffec);
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
  box-shadow: 0 4px 12px var(--shadow-color, rgba(0, 0, 0, 0.03));
  z-index: 1000;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-sizing: border-box;
  margin-bottom: 2rem;

  .title-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;

    .title-icon {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      svg {
        width: 100%;
        height: 100%;
      }
    }

    .title-text {
      h2 {
        font-size: 1.2rem;
        font-weight: 800;
        margin: 0;
        color: var(--primary-text);
        font-family: 'product_sansregular', sans-serif;
      }
    }
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card-grey, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
  color: var(--primary-text);
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.2s ease;
  align-self: center;

  &:hover {
    background: var(--hover-bg, rgba(0, 0, 0, 0.08));
    transform: translateX(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    stroke-width: 3px;
  }
`;

const SectionDescription = styled.p`
  margin: 0 0 2rem 0;
  font-size: 0.92rem;
  color: var(--secondary-text);
  line-height: 1.55;
  background: rgba(255, 255, 255, 0.35);
  padding: 12px 16px;
  border-left: 3px solid var(--primary-color, #948924);
  border-radius: 0 8px 8px 0;
`;

const SectionContent = styled.div`
  background: var(--card-grey, white);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px var(--shadow-color, rgba(0, 0, 0, 0.02));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.03));

  .error-msg {
    color: #d32f2f;
    font-weight: bold;
    text-align: center;
    padding: 2rem;
  }

  @media (max-width: 768px) {
    padding: 1.2rem;
  }
`;

// --- ESTILOS ESPECIALES PARA EMPLEADO ---

const EmployeeContainer = styled.div`
  min-height: 100vh;
  background-color: var(--app-background-color, #ffffec);
  padding: 1.5rem;
  box-sizing: border-box;

  .employee-content {
    max-width: 1000px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const EmployeeHeader = styled.div`
  max-width: 1000px;
  margin: 0 auto 0.5rem auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--card-grey, white);
  border-radius: 12px;
  border: 1px solid var(--border-color, rgba(0,0,0,0.04));
  box-shadow: 0 2px 8px var(--shadow-color, rgba(0,0,0,0.01));

  .title-area {
    display: flex;
    align-items: center;
    gap: 12px;

    svg {
      width: 32px;
      height: 32px;
    }

    h2 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--primary-text);
      font-family: 'product_sansregular', sans-serif;
    }
  }

  @media (max-width: 768px) {
    margin-bottom: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
  }
`;

const LogoutSmallButton = styled.button`
  padding: 8px 16px;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #b71c1c;
  }
`;
