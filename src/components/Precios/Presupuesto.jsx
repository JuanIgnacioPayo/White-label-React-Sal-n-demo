
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from "../../contexts/authContext";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import { getDatabase, ref, get, push, set, remove, onValue, update } from "firebase/database";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from "../../firebase/firebase";
import { WhatsappShareButton } from "react-share";
import ScrollToTop from "../ScrollToTop";
import DatePicker from './DatePicker';
import Animacion from "./Animacion";
import PresupuestoPDF, { CONFIG_PRESUPUESTO } from './PresupuestoPDF';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import moment from 'moment';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import ErrorBoundary from './ErrorBoundary';
import Modal from '../Modal';

import axios from "axios";
import { addDays } from 'date-fns';
import Clave from "../Calendar/Clave";
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { format } from 'date-fns';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAvailability } from '../../contexts/AvailabilityContext';
import { generateSummaryText } from '../../utils/summaryGenerator';
import { generateSummaryTextLegacy } from '../../utils/summaryGeneratorLegacy';
import { parseSummaryText } from '../../utils/summaryParser';
import { safeStorage } from '../../utils/safeStorage';
import FormularioCliente from './Subcomponents/FormularioCliente';
import CarritoPresupuesto from './Subcomponents/CarritoPresupuesto';
import TemplateEditorModal from './Subcomponents/TemplateEditorModal';
import usePresupuestoData from './hooks/usePresupuestoData';
import usePresupuestoForm, { initialFormData } from './hooks/usePresupuestoForm';
import usePresupuestoCarrito from './hooks/usePresupuestoCarrito';

const GOOGLE_API_KEY = Clave();

const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) {
        digits = '549' + digits.slice(1);
    }
    if (!digits.startsWith('54')) {
        digits = '549' + digits;
    }
    return digits;
};
// Global Styles
const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'product_sansregular', sans-serif;
    background-color: #f4f7f6;
    color: #333;
  }
`;

// Styled Components
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const Section = styled.section`
  * {
    box-sizing: border-box;
  }
  box-sizing: border-box;
  width: 100%;
  padding: 1.5rem;
  animation: ${fadeIn} 0.5s ease-in;
  margin: 0 auto;
  max-width: 1400px;
  font-family: 'product_sansregular';
  border-radius: 8px;
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem; /* Added margin to separate from top cards */

  > * {
    min-width: 0;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ContentWrapper = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

// CarritoWrapper movido a CarritoPresupuesto

const Header = styled.header`
  display: block;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: ${props => props.$bgColor || '#f4f7f6'};
  padding: 10px 15px; /* Added horizontal padding */
  box-shadow: ${props => props.$bgColor ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};
  
  .header-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .brand {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
    font-family: 'playlistscript';
  }

  .name {
    font-size: 1.2rem;
    margin-right: 1rem;
  }

  .logo {
    height: 40px;
  }
`;

// DatePickerContainer movido a CarritoPresupuesto

const AdminSection = styled.div`
  background-color: var(--card-grey);
  padding: 1rem;
  margin-bottom: 2rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  width: 100%;
  
  .legacy-btn {
      background-color: #6610f2;
      margin-bottom: 15px;
      &:hover { background-color: #520dc2; }
  }

  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 2px solid var(--primary-text);
    padding-bottom: 0.3rem;
    color: var(--primary-text);
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
  }

  input, textarea {
    width: 100%;
    padding: 0.6rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    font-family: 'product_sansregular';

    &:focus {
      outline: none;
      var(--primary-color);
    }
  }
`;

const ServiciosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  border-radius: 8px;
  @media (max-width: 1080px) {
    grid-template-columns: repeat(4, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;



const ServicioCard = styled.div`
  position: relative; /* Added for badge positioning */
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #eee;
  transition: box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  /* Removed opacity and pointer-events based on disabled prop */

  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }

  p {
    margin: 0 0 0.2rem 0;
  }

  .nombre {
    font-weight: bold;
    font-size: 0.8rem;
    color: #333;
  }

  .precio {
    font-weight: bold;
    font-size: 0.85rem;
    color: var(--primary-text);
  }

  button {
    font-size: 0.75rem;
    padding: 0.4rem 0.5rem;
  }
`;

const Button = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: background-color 0.3s ease;
  width: 100%;
  margin-top: auto;
  margin-bottom: 10px;

  &:hover {
    background-color: var(--primary-color); // Or a slightly darker shade
  }


  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const QuantityBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #28a745; /* Green color */
  color: white;
  border-radius: 50%;
  padding: 0.2rem 0.4rem;
  font-size: 0.7rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

// CarritoList, CarritoItem y CarritoTotal movidos a CarritoPresupuesto

const SyncStatusBanner = styled.div`
  padding: 0.7rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  font-size: 1rem;
  background-color: ${props => props.$bgColor || '#f0f0f0'};
  color: ${props => props.color || '#333'};
`;



// Styled components de TemplateEditorModal extraídos a TemplateEditorModal.jsx




// initialFormData is imported from usePresupuestoForm



// initialPrices and initialTexts are imported from usePresupuestoData

const WarningMessage = styled.div`
  background-color: #ffdddd;
  color: #d8000c;
  padding: 7px;
  margin-bottom: 15px;
  border: 1px solid #d8000c;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const InfoMessage = styled.div`
  background-color: #e0f2f7;
  color: #007bff;
  padding: 7px;
  margin-bottom: 15px;
  border: 1px solid #007bff;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;
  position: sticky;
  z-index: 1000;
`;

const ComparisonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    ${props => props.$isSynced && `
      > *:nth-child(2) {
        display: none;
      }
    `}
  }
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  
  .refuerzo-section {
    order: 1;
  }
  .carrito-section {
    order: 2;
  }

  @media (max-width: 768px) {
    .refuerzo-section {
      order: 2;
      margin-top: 15px;
      margin-bottom: 0;
    }
    .carrito-section {
      order: 1;
    }
  }
`;

const MobileOnly = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
    .refuerzo-section {
      margin-top: 15px;
    }
  }
`;

const DesktopOnly = styled.div`
  display: block;
  @media (max-width: 768px) {
    display: none;
  }
`;

const CardBase = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  }

  .card-header {
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: bold;
    font-size: 1.1rem;
    border-bottom: 1px solid #eee;

    img {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }
  }

  .card-body {
    padding: 1rem;
    flex-grow: 1;
    font-size: 0.95rem;
    line-height: 1.5;

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #f0f0f0;
        &:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
    }
  }
`;

const GoogleCalendarCard = styled(CardBase)`
  border-top: 4px solid #4285F4;

  .card-header {
    color: #3c4043;
    background-color: #fff;
  }
  
  .empty-state {
      color: #70757a;
      font-style: italic;
  }

  .mismatch-warning {
      margin-top: 10px;
      padding: 8px;
      background-color: #fce8e6;
      color: #c5221f;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: bold;
      text-align: center;
  }
`;

const AppSummaryCard = styled(CardBase)`
  border-top: 4px solid var(--primary-color);
  
  .card-header {
    color: var(--primary-text);
    background-color: #fafafa;
  }

  @media (max-width: 768px) {
    &.hide-on-mobile {
      display: none !important;
    }
  }
`;

import { useLoading } from "../../contexts/LoadingContext";

export default function Presupuesto() {
    const { completeTask } = useLoading();
    useEffect(() => { completeTask('app_init'); }, [completeTask]);

    const { id: budgetIdFromUrl } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const { triggerRefetch, calendarEvents } = useAvailability(); // Destructure calendarEvents
    registerLocale('es', es);
    const { currentUser, loading: authLoading } = useAuth();
    const isAdmin = !!currentUser;
    
    // Function to check if a date is occupied in Google Calendar
    const isDateOccupiedInGoogleCalendar = useCallback((date) => {
        if (!date || !calendarEvents) return false;
        const formattedDate = format(date, 'yyyy-MM-dd');
        return calendarEvents.some(event => {
            const eventStartStr = event.startStr || (event.start ? (typeof event.start === 'string' ? event.start : (event.start.date || event.start.dateTime)) : null);
            return event.title === "Ocupado" && eventStartStr && eventStartStr.slice(0, 10) === formattedDate;
        });
    }, [calendarEvents]);

    const {
        formData, setFormData, newDepositAmount, setNewDepositAmount, lastDeposit, setLastDeposit,
        refs: { nombreClienteRef, telefonoRef, descripcionEventoRef, precioAlquilerPersonalizadoRef, descuentoRef, motivoDescuentoRef, señaRef, inicioEventoRef, finEventoRef, agregadoManualRef, precioAgregadoManualRef, generarResumenBtnRef },
        handleFormChange, handleNewDeposit
    } = usePresupuestoForm();

    const [selectedDate, setSelectedDate] = useState(null);
    const [textoPlano, setTextoPlano] = useState('');

    const {
        prices,
        texts,
        nombresServicios,
        isPageLoading,
        dataLoaded,
        holidayDates,
        orangeHolidayDates,
        currentMonth,
        whatsappNumber,
        siteName,
        logoUrl,
        activePriceVersion, setActivePriceVersion,
        activeScheduleStructure,
        serviciosOpcionales,
        versionPrices,
        inputValue101,
        inputValue102
    } = usePresupuestoData(selectedDate, searchParams, setSearchParams);
    const [presupuestoIdToLoad, setPresupuestoIdToLoad] = useState(''); // Nuevo estado para el ID a cargar
    const [currentBudgetId, setCurrentBudgetId] = useState(null); // NUEVO: Para guardar el ID del presupuesto cargado
    
    // AFIP Billing States
    const [facturaInfo, setFacturaInfo] = useState({ facturado: false, facturasAFIP: [], facturadoManualmente: false });
    const [isAfipModalOpen, setIsAfipModalOpen] = useState(false);
    const [isManualBillingModalOpen, setIsManualBillingModalOpen] = useState(false);
    const [isBilling, setIsBilling] = useState(false);
    const [afipForm, setAfipForm] = useState({ docTipo: '99', docNro: '', emisor: 'maria', razonSocial: '' });

    // Move Event States
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [targetMoveDate, setTargetMoveDate] = useState(null);
    const [isMoving, setIsMoving] = useState(false);

    useEffect(() => {
        if (formData) {
            const searchParams = new URLSearchParams(window.location.search);
            const emisorParam = searchParams.get('emisor');
            
            setAfipForm(prev => ({
                ...prev,
                docTipo: formData.cuit ? '80' : '99',
                docNro: formData.cuit ? formData.cuit.replace(/[^0-9]/g, '') : '',
                razonSocial: formData.razonSocial || '',
                emisor: emisorParam ? emisorParam : (formData.cuit ? 'juan' : 'maria')
            }));
        }
    }, [formData]);

    // Auto-load ref (used after cargarPresupuestoPorId is defined)
    const autoLoadedRef = React.useRef(false);


    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const facturarParam = searchParams.get('facturar');
        if (facturarParam === 'true') {
            setIsAfipModalOpen(true);
        }
        
        const imprimirParam = searchParams.get('imprimirFactura');
        if (imprimirParam !== null && facturaInfo && facturaInfo.facturasAFIP && facturaInfo.facturasAFIP.length > 0) {
            const index = parseInt(imprimirParam, 10);
            if (!isNaN(index) && facturaInfo.facturasAFIP[index]) {
                handlePrintTicket(facturaInfo.facturasAFIP[index]);
                
                // Remove the param to avoid printing again if the component re-renders
                setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.delete('imprimirFactura');
                    return newParams;
                }, { replace: true });
            }
        }
    }, [location.search, facturaInfo]);

    const [showLoadInput, setShowLoadInput] = useState(false); // Nuevo estado para controlar la visibilidad del input de carga
    // activePriceVersion moved to usePresupuestoData
    const [shouldSave, setShouldSave] = useState(false);
    // lastDeposit is now managed by usePresupuestoForm
    const [generateReceiptOnSave, setGenerateReceiptOnSave] = useState(false);
    const [lastSavedSena, setLastSavedSena] = useState(0);
    const [urlToImport, setUrlToImport] = useState('');
    const [showImportUI, setShowImportUI] = useState(false);
    // activeScheduleStructure moved to usePresupuestoData
    const [seccionesPDF, setSeccionesPDF] = useState([]);
    const [showPDFPreview, setShowPDFPreview] = useState(false);
    const [showPDFFields, setShowPDFFields] = useState(false);
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);
    const [pdfTemplateConfig, setPdfTemplateConfig] = useState(CONFIG_PRESUPUESTO);
    const [tempTemplateConfig, setTempTemplateConfig] = useState(null);
    const [editorActiveTab, setEditorActiveTab] = useState('general');
    const [isExporting, setIsExporting] = useState(false);
    const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);

    // Fetch PDF Template from Firebase
    useEffect(() => {
        const fetchPdfTemplate = async () => {
            const db = getDatabase(app);
            const templateRef = ref(db, 'config/pdfTemplate');
            try {
                const snapshot = await get(templateRef);
                if (snapshot.exists()) {
                    setPdfTemplateConfig(snapshot.val());
                } else {
                    console.log("No custom PDF template found, using default CONFIG_PRESUPUESTO");
                }
            } catch (error) {
                console.error("Error fetching PDF template:", error);
            }
        };
        fetchPdfTemplate();
    }, []);

    // Load template configs into temp editing state when modal opens
    useEffect(() => {
        if (showTemplateEditor && pdfTemplateConfig) {
            setTempTemplateConfig(JSON.parse(JSON.stringify(pdfTemplateConfig)));
            setEditorActiveTab('general');
        }
    }, [showTemplateEditor, pdfTemplateConfig]);

    // Template editing helper functions
    const handleInlineUpdateConfig = async (keyPath, value) => {
        setPdfTemplateConfig(prev => {
            if (!prev) return prev;
            
            const updated = JSON.parse(JSON.stringify(prev));
            const parts = keyPath.split('.');
            let current = updated;
            for (let i = 0; i < parts.length - 1; i++) {
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;

            // Persist directly to Firebase Realtime Database
            const db = getDatabase(app);
            const templateRef = ref(db, 'config/pdfTemplate');
            set(templateRef, updated).then(() => {
                toast.success("¡Plantilla del PDF actualizada!");
            }).catch(err => {
                console.error("Error saving inline PDF template edit:", err);
                toast.error("Error al guardar el cambio en la plantilla.");
            });

            return updated;
        });
    };

    const handleUpdateTempConfig = (section, key, value) => {
        setTempTemplateConfig(prev => {
            if (!prev) return prev;
            if (section) {
                if (section.includes('.')) {
                    const [s1, s2] = section.split('.');
                    return {
                        ...prev,
                        [s1]: {
                            ...prev[s1],
                            [s2]: {
                                ...(prev[s1]?.[s2] || {}),
                                [key]: value
                            }
                        }
                    };
                }
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [key]: value
                    }
                };
            } else {
                return {
                    ...prev,
                    [key]: value
                };
            }
        });
    };

    const handleUpdateArrayItem = (arrayKey, index, value) => {
        setTempTemplateConfig(prev => {
            if (!prev) return prev;
            const updatedArray = [...(prev[arrayKey] || [])];
            updatedArray[index] = value;
            return {
                ...prev,
                [arrayKey]: updatedArray
            };
        });
    };

    const handleAddArrayItem = (arrayKey) => {
        setTempTemplateConfig(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [arrayKey]: [...(prev[arrayKey] || []), '']
            };
        });
    };

    const handleRemoveArrayItem = (arrayKey, index) => {
        setTempTemplateConfig(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [arrayKey]: (prev[arrayKey] || []).filter((_, i) => i !== index)
            };
        });
    };

    const handleSaveTemplateConfig = async () => {
        if (!tempTemplateConfig) return;
        
        // Clean up empty strings in array lists
        const cleanConfig = {
            ...tempTemplateConfig,
            amenitiesInterior: (tempTemplateConfig.amenitiesInterior || []).filter(item => item && item.trim() !== ''),
            amenitiesExterior: (tempTemplateConfig.amenitiesExterior || []).filter(item => item && item.trim() !== ''),
            noIncluye: (tempTemplateConfig.noIncluye || []).filter(item => item && item.trim() !== ''),
        };

        const db = getDatabase(app);
        const templateRef = ref(db, 'config/pdfTemplate');
        
        try {
            await set(templateRef, cleanConfig);
            setPdfTemplateConfig(cleanConfig);
            toast.success("¡Plantilla del PDF guardada con éxito!");
            setShowTemplateEditor(false);
        } catch (error) {
            console.error("Error saving PDF template:", error);
            toast.error("Error al guardar la plantilla. Intentá de nuevo.");
        }
    };

    const handleRestoreDefaultTemplateConfig = () => {
        if (window.confirm("¿Estás seguro de que querés restaurar los valores por defecto de la plantilla del PDF? Los cambios actuales no guardados se perderán.")) {
            setTempTemplateConfig(JSON.parse(JSON.stringify(CONFIG_PRESUPUESTO)));
            toast.info("Valores por defecto cargados en el editor. Hacé clic en 'Guardar Cambios' para aplicarlos.");
        }
    };

    const [syncStatus, setSyncStatus] = useState({
        loading: false,
        isSynced: false,
        eventCount: 0,
        error: null,
        frontendSummaryText: '',
        calendarEvents: [], // Changed from calendarEventSummaries
    });

    // states moved to usePresupuestoData


    // Fetch Active Configs moved to usePresupuestoData

    const serviciosUnicos = [7, 8, 9, 10, 12, 15]; // Added new service ID

    const { carrito, setCarrito, agregarAlCarrito, eliminarDelCarrito, modificarHorasCamarera, agregarCamarera } = usePresupuestoCarrito(prices, serviciosOpcionales, serviciosUnicos);

    const customizedCarrito = (carrito || []).map(item => {
        if ([1, 3, 13, 14].includes(item.id) && parseFloat(formData.precioAlquilerPersonalizado || 0) > 0) {
            return { ...item, precio: parseFloat(formData.precioAlquilerPersonalizado) };
        }
        return item;
    });

    const subtotal = customizedCarrito.reduce((total, item) => total + item.precio * item.cantidad, 0) + parseFloat(formData.precioAgregadoManual || 0);

    let montoDescuento = 0;
    let totalFinal = subtotal;

    const discountVal = parseFloat(formData.descuento || 0);
    const tipo = formData.tipoDescuento || 'porcentaje';

    if (tipo === 'porcentaje') {
        montoDescuento = (subtotal * discountVal) / 100;
        totalFinal = subtotal - montoDescuento;
    } else if (tipo === 'monto') {
        montoDescuento = discountVal;
        totalFinal = subtotal - montoDescuento;
    } else if (tipo === 'final') {
        totalFinal = discountVal > 0 ? discountVal : subtotal;
        montoDescuento = subtotal - totalFinal;
    }

    const restante = totalFinal - parseFloat(formData.seña || 0);

    // Router hooks moved to top

    // Refs migrated to usePresupuestoForm
    const prevSenaRef = useRef();
    const pdfContainerRef = useRef(null);

    // --- LEGACY PRICING MIGRATION LOGIC ---

    // --------------------------------------




    const handleKeyDown = (e, nextRef) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextRef.current && nextRef.current.focus();
        }
    };

    // ... (inside return statement, within AdminSection)

    // Removed checkAdmin useEffect as isAdmin is derived directly at the top





    const copyToClipboard = (text, successMessage) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    toast.success(successMessage);
                })
                .catch(err => {
                    console.error("Error al copiar (navigator):", err);
                    toast.error("Error al copiar el texto.");
                });
        } else {
            // Fallback for insecure contexts or older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "absolute";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                toast.success(successMessage);
            } catch (err) {
                console.error("Error al copiar (fallback):", err);
                toast.error("Error al copiar el texto.");
            } finally {
                document.body.removeChild(textArea);
            }
        }
    };

    const guardarPresupuesto = async (prevSenaValueFromCaller = null) => {
        if (!selectedDate) {
            toast.error("Por favor, selecciona una fecha para el presupuesto antes de guardarlo.");
            return null;
        }

        const db = getDatabase(app);
        const year = selectedDate.getFullYear();
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const day = selectedDate.getDate().toString().padStart(2, '0');
        const path = `${year}/${month}/${day}`;

        const presupuestoData = {
            selectedDate: selectedDate.toISOString(),
            formData: formData,
            carrito: customizedCarrito,
            subtotal: subtotal,
            totalFinal: totalFinal,
            montoDescuento: montoDescuento,
            restante: restante,
            priceVersion: searchParams.get('v') || activePriceVersion || 2, // Save current price version
            seccionesPDF: seccionesPDF,
        };

        try {
            if (currentBudgetId) {
                const idLookupRef = ref(db, `presupuestos_por_id/${currentBudgetId}`);
                const idLookupSnapshot = await get(idLookupRef);
                if (idLookupSnapshot.exists()) {
                    const originalPath = idLookupSnapshot.val().path;
                    
                    if (originalPath && originalPath !== path) {
                        // Mover el presupuesto a una nueva fecha
                        const oldPresupuestoRef = ref(db, `presupuestos/${originalPath}/${currentBudgetId}`);
                        const oldSnapshot = await get(oldPresupuestoRef);
                        const existingData = oldSnapshot.exists() ? oldSnapshot.val() : {};

                        const newPresupuestoRef = ref(db, `presupuestos/${path}/${currentBudgetId}`);
                        await set(newPresupuestoRef, {
                            ...existingData,
                            ...presupuestoData,
                            fechaCreacion: existingData.fechaCreacion || new Date().toISOString(),
                            fechaModificacion: new Date().toISOString(),
                        });

                        // Eliminar de la fecha anterior para liberarla
                        await remove(oldPresupuestoRef);

                        // Actualizar el índice de búsqueda por ID con la nueva ruta
                        await set(idLookupRef, { path: path });

                        // Actualizar parámetro de fecha en la URL si está presente
                        setSearchParams(prev => {
                            const newParams = new URLSearchParams(prev);
                            newParams.set('fecha', format(selectedDate, 'yyyy-MM-dd'));
                            return newParams;
                        }, { replace: true });

                        // Registrar notificación en el buzón para recordar mover el evento en Google Calendar
                        const originalDateFormatted = originalPath.split('/').map((p, i) => i > 0 ? p.padStart(2, '0') : p).join('-');
                        const newDateFormatted = format(selectedDate, 'yyyy-MM-dd');
                        const notifMoveRef = ref(db, `notificaciones_mover_evento/${currentBudgetId}`);
                        await set(notifMoveRef, {
                            budgetId: currentBudgetId,
                            fechaAnterior: originalDateFormatted,
                            fechaNueva: newDateFormatted,
                            nombreCliente: formData.nombreCliente || 'Cliente',
                            descripcionEvento: formData.descripcionEvento || 'Evento',
                            seña: parseFloat(formData.seña || 0),
                            timestamp: Date.now()
                        });

                        toast.success("Presupuesto movido a la nueva fecha exitosamente. La fecha anterior quedó libre.");
                        setLastSavedSena(parseFloat(formData.seña || 0));
                        triggerRefetch();
                        return currentBudgetId;
                    } else {
                        // Actualización en la misma fecha
                        const presupuestoRef = ref(db, `presupuestos/${originalPath}/${currentBudgetId}`);
                        const existingData = (await get(presupuestoRef)).val() || {};

                        await set(presupuestoRef, {
                            ...existingData,
                            ...presupuestoData,
                            fechaCreacion: existingData.fechaCreacion || new Date().toISOString(),
                            fechaModificacion: new Date().toISOString(),
                        });
                        toast.info("Base de datos actualizada.");
                        setLastSavedSena(parseFloat(formData.seña || 0));
                        triggerRefetch();
                        return currentBudgetId;
                    }
                }
            }

            // Create new budget if no currentBudgetId or lookup failed
            const presupuestosRef = ref(db, `presupuestos/${path}`);
            const newPresupuestoRef = push(presupuestosRef);
            await set(newPresupuestoRef, {
                ...presupuestoData,
                fechaCreacion: new Date().toISOString(),
            });

            const newId = newPresupuestoRef.key;
            setCurrentBudgetId(newId);

            const idLookupRef = ref(db, `presupuestos_por_id/${newId}`);
            await set(idLookupRef, { path: path });

            toast.info("Base de datos actualizada.");
            setLastSavedSena(parseFloat(formData.seña || 0));
            triggerRefetch();

            return newId;

        } catch (error) {
            console.error("Error al guardar el presupuesto:", error);
            toast.error("Error al guardar el presupuesto.");
            return null;
        }
    };

    const handleConfirmMove = async (targetDate) => {
        if (!targetDate) {
            toast.error("Por favor, selecciona la nueva fecha de destino.");
            return;
        }
        if (!selectedDate) {
            toast.error("No hay una fecha actual definida.");
            return;
        }

        const oldYear = selectedDate.getFullYear();
        const oldMonth = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const oldDay = selectedDate.getDate().toString().padStart(2, '0');
        const oldPath = `${oldYear}/${oldMonth}/${oldDay}`;
        const oldDateStr = `${oldYear}-${oldMonth}-${oldDay}`;

        const newYear = targetDate.getFullYear();
        const newMonth = (targetDate.getMonth() + 1).toString().padStart(2, '0');
        const newDay = targetDate.getDate().toString().padStart(2, '0');
        const newPath = `${newYear}/${newMonth}/${newDay}`;
        const newDateStr = `${newYear}-${newMonth}-${newDay}`;

        if (oldPath === newPath) {
            toast.warning("La nueva fecha seleccionada es idéntica a la fecha actual.");
            return;
        }

        setIsMoving(true);
        const db = getDatabase(app);

        try {
            let budgetId = currentBudgetId;
            let existingData = {};

            if (budgetId) {
                const idLookupRef = ref(db, `presupuestos_por_id/${budgetId}`);
                const idLookupSnap = await get(idLookupRef);
                const originalStoredPath = idLookupSnap.exists() ? idLookupSnap.val().path : oldPath;

                const oldPresupuestoRef = ref(db, `presupuestos/${originalStoredPath}/${budgetId}`);
                const oldSnapshot = await get(oldPresupuestoRef);
                if (oldSnapshot.exists()) {
                    existingData = oldSnapshot.val();
                }

                // 1. Guardar en la nueva ruta de fecha
                const newPresupuestoRef = ref(db, `presupuestos/${newPath}/${budgetId}`);
                await set(newPresupuestoRef, {
                    ...existingData,
                    formData: formData,
                    carrito: customizedCarrito,
                    subtotal: subtotal,
                    totalFinal: totalFinal,
                    montoDescuento: montoDescuento,
                    restante: restante,
                    selectedDate: targetDate.toISOString(),
                    priceVersion: searchParams.get('v') || activePriceVersion || 2,
                    seccionesPDF: seccionesPDF,
                    fechaCreacion: existingData.fechaCreacion || new Date().toISOString(),
                    fechaModificacion: new Date().toISOString(),
                });

                // 2. Eliminar de la ruta anterior para liberar la fecha
                await remove(oldPresupuestoRef);

                // 3. Actualizar índice de búsqueda por ID
                await set(idLookupRef, { path: newPath });
            } else {
                // Crear presupuesto nuevo directamente en la nueva ruta
                const newPresupuestoRef = push(ref(db, `presupuestos/${newPath}`));
                budgetId = newPresupuestoRef.key;
                await set(newPresupuestoRef, {
                    formData: formData,
                    carrito: customizedCarrito,
                    subtotal: subtotal,
                    totalFinal: totalFinal,
                    montoDescuento: montoDescuento,
                    restante: restante,
                    selectedDate: targetDate.toISOString(),
                    priceVersion: searchParams.get('v') || activePriceVersion || 2,
                    seccionesPDF: seccionesPDF,
                    fechaCreacion: new Date().toISOString(),
                });
                await set(ref(db, `presupuestos_por_id/${budgetId}`), { path: newPath });
                setCurrentBudgetId(budgetId);
            }

            // 4. Crear recordatorio en el buzón de notificaciones de la página
            const notifMoveRef = ref(db, `notificaciones_mover_evento/${budgetId}`);
            await set(notifMoveRef, {
                budgetId: budgetId,
                fechaAnterior: oldDateStr,
                fechaNueva: newDateStr,
                nombreCliente: formData.nombreCliente || 'Cliente',
                descripcionEvento: formData.descripcionEvento || 'Evento',
                seña: parseFloat(formData.seña || 0),
                timestamp: Date.now(),
            });

            // 5. Actualizar fecha seleccionada y parámetros de URL
            setSelectedDate(targetDate);
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.set('fecha', newDateStr);
                return newParams;
            }, { replace: true });

            setShowMoveModal(false);
            toast.success(`¡Presupuesto movido exitosamente al ${format(targetDate, 'dd/MM/yyyy')}! La fecha anterior quedó libre.`);
            triggerRefetch();

        } catch (error) {
            console.error("Error al mover el presupuesto:", error);
            toast.error("Error al mover el presupuesto: " + error.message);
        } finally {
            setIsMoving(false);
        }
    };
    const cargarPresupuestoPorId = useCallback(async (id) => {
        const budgetId = id || presupuestoIdToLoad;
        if (!budgetId) {
            toast.error("Por favor, ingresa un ID de presupuesto.");
            return;
        }

        const db = getDatabase(app);
        const idLookupRef = ref(db, `presupuestos_por_id/${budgetId}`);

        try {
            const idLookupSnapshot = await get(idLookupRef);
            if (!idLookupSnapshot.exists()) {
                toast.error("ID de presupuesto no encontrado o no válido.");
                return;
            }

            const { path } = idLookupSnapshot.val();
            const presupuestoRef = ref(db, `presupuestos/${path}/${budgetId}`);

            const snapshot = await get(presupuestoRef);
            if (snapshot.exists()) {
                const loadedPresupuesto = snapshot.val();

                toast.success("Presupuesto cargado exitosamente.");

                setFormData({ ...initialFormData, ...loadedPresupuesto.formData });
                setSeccionesPDF(loadedPresupuesto.seccionesPDF || []);
                setCarrito(loadedPresupuesto.carrito || []);
                setLastSavedSena(parseFloat(loadedPresupuesto.formData?.seña || 0));
                if (loadedPresupuesto.selectedDate) {
                    setSelectedDate(new Date(loadedPresupuesto.selectedDate));
                }

                // Restore Price Version if available
                if (loadedPresupuesto.priceVersion) {
                    setSearchParams(prev => {
                        const newParams = new URLSearchParams(prev);
                        newParams.set('v', loadedPresupuesto.priceVersion);
                        return newParams;
                    });
                }

                // Restore AFIP billing status
                setFacturaInfo({
                    facturado: loadedPresupuesto.facturado || false,
                    facturasAFIP: loadedPresupuesto.facturaAFIP || [],
                    facturadoManualmente: loadedPresupuesto.facturadoManualmente || false
                });

                setCurrentBudgetId(budgetId); // Guardar el ID del presupuesto cargado
                setPresupuestoIdToLoad('');
                setShowLoadInput(false);
            } else {
                toast.error("Presupuesto no encontrado en la ruta especificada.");
            }
        } catch (error) {
            console.error("Error al cargar el presupuesto:", error);
            toast.error("Error al cargar el presupuesto.");
        }
    }, [presupuestoIdToLoad]);

    // Data fetching moved to usePresupuestoData

    useEffect(() => {
        const saveAndAct = async () => {
            if (shouldSave) {
                await guardarPresupuesto();
                setShouldSave(false);

                if (generateReceiptOnSave) {
                    await handleGenerarRecibo(false); // Pass false to prevent double saving
                    setGenerateReceiptOnSave(false);
                }
            }
        };
        saveAndAct();
    }, [shouldSave, generateReceiptOnSave]);

    // Form and Cart functions have been migrated to usePresupuestoForm and usePresupuestoCarrito

    const buildPricesLink = () => {
        const params = new URLSearchParams();
        params.set('fecha', format(selectedDate, 'yyyy-MM-dd'));

        if (carrito && carrito.length > 0) {
            carrito.forEach(item => {
                if (item.id === 5) {
                    params.set(`item_${item.uuid}_id`, item.id);
                    params.set(`item_${item.uuid}_cantidad`, item.cantidad);
                } else {
                    params.set(`item_${item.id}_id`, item.id);
                    params.set(`item_${item.id}_cantidad`, item.cantidad);
                }
            });
            if (formData.descuento > 0) {
                params.set('descuento', formData.descuento);
                if (formData.tipoDescuento) {
                    params.set('tipoDescuento', formData.tipoDescuento);
                }
            }
        } else {
            const clickedDate = selectedDate;
            const dayOfWeek = clickedDate.getDay();
            const day = clickedDate.getDate();
            const month = clickedDate.getMonth();
            let alquilerId = null;
            const isHoliday = isFeriado(clickedDate);

            if (day === 24 && month === 11) alquilerId = 13;
            else if (day === 31 && month === 11) alquilerId = 14;
            else if (isHoliday || dayOfWeek === 0 || dayOfWeek === 6 || (dayOfWeek === 5 && activeScheduleStructure !== 'fixed')) alquilerId = 3;
            else alquilerId = 1;

            if (alquilerId) {
                params.set(`item_${alquilerId}_id`, alquilerId);
                params.set(`item_${alquilerId}_cantidad`, 1);
            }
        }

        params.set('v', activePriceVersion || '2');
        return `${window.location.origin}/precios?${params.toString()}`;
    };

    const generarYCopiarLinkDePrecios = () => {
        if (!selectedDate) {
            toast.error("Por favor, selecciona una fecha primero.");
            return;
        }
        copyToClipboard(buildPricesLink(), "Link de precios copiado al portapapeles.");
    };

    const verListaDePrecios = () => {
        if (!selectedDate) {
            toast.error("Por favor, selecciona una fecha primero.");
            return;
        }
        window.open(buildPricesLink(), '_blank', 'noopener noreferrer');
    };

    const isFeriado = useCallback((date) => {
        if (!date) return false;
        const formattedDate = moment(date).format('YYYY-MM-DD');
        return holidayDates.includes(formattedDate);
    }, [holidayDates]);

    const initialLoad = useRef(true);

    const removePriceFromTitle = (title) => {
        // Regex to match price patterns like $123, $123.45, $ 123, etc.
        // It looks for a dollar sign, optional space, and then numbers (with optional decimal part).
        return title.replace(/\$\s*\d+(\.\d{1,2})?/g, '').trim();
    };

    const handleDateChange = useCallback((dateOrEvent, isInitialLoad = false) => {
        let date = dateOrEvent;
        if (dateOrEvent && dateOrEvent.target && dateOrEvent.target.value) {
            date = dateOrEvent.target.value;
        }
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        if (!date || isNaN(date.getTime())) return;

        const formattedDateStr = format(date, 'yyyy-MM-dd');

        // Si estamos en /presupuesto/editar/:id o la URL tiene ?id=, navegamos a /presupuesto con la fecha seleccionada
        if (location.pathname.startsWith('/presupuesto/editar') || searchParams.has('id')) {
            const newParams = new URLSearchParams();
            newParams.set('fecha', formattedDateStr);
            const currentV = searchParams.get('v');
            if (currentV) newParams.set('v', currentV);
            navigate(`/presupuesto?${newParams.toString()}`, { replace: true });
        } else {
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.set('fecha', formattedDateStr);
                return newParams;
            }, { replace: true });
        }

        setSelectedDate(date);
        safeStorage.setItem('presupuestoSelectedDate', formattedDateStr);

        setCarrito(prevCarrito => {
            let newCarrito = prevCarrito.filter(item => ![1, 3, 13, 14].includes(item.id));

            const dayOfWeek = date.getDay();
            const isHoliday = isFeriado(date);

            let serviceToAdd = null;

            if (date.getMonth() === 11 && date.getDate() === 24) { // Christmas Eve
                serviceToAdd = { id: 13, nombre: removePriceFromTitle("Alquiler de instalaciones para Navidad"), precio: prices.alquiler4hs, cantidad: 1 };
            } else if (date.getMonth() === 11 && date.getDate() === 31) { // New Year's Eve
                serviceToAdd = { id: 14, nombre: removePriceFromTitle("Alquiler de instalaciones para Año Nuevo"), precio: prices.alquiler4hs, cantidad: 1 };
            } else if (((dayOfWeek >= 1 && dayOfWeek <= 4) || (dayOfWeek === 5 && activeScheduleStructure === 'fixed')) && !isHoliday) { // Weekday
                serviceToAdd = { id: 1, nombre: removePriceFromTitle(nombresServicios[1] || "Alquiler 3hs (Semana)"), precio: prices.alquiler3hs, cantidad: 1 };
            } else { // Weekend or Holiday
                serviceToAdd = { id: 3, nombre: removePriceFromTitle(nombresServicios[3] || "Alquiler 4hs (Finde/Feriado)"), precio: prices.alquiler4hs, cantidad: 1 };
            }

            if (serviceToAdd) {
                newCarrito.push(serviceToAdd);
            }
            return newCarrito;
        });

        if (isInitialLoad) {
            toast.success(`Fecha seleccionada: ${format(date, 'PPP', { locale: es })}`);
        }
    }, [isFeriado, prices, nombresServicios, activeScheduleStructure, location.pathname, searchParams, navigate, setSearchParams]);

    const parseAndLoadCartFromURL = useCallback((params) => {
        // Process Date
        const fechaParam = params.get('fecha');
        if (fechaParam) {
            const date = new Date(fechaParam);
            const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
            handleDateChange(adjustedDate, true);
        }

        // Process Discount
        const descuentoParam = params.get('descuento');
        const tipoDescuentoParam = params.get('tipoDescuento');
        if (descuentoParam) {
            setFormData(prev => ({
                ...prev,
                descuento: descuentoParam,
                tipoDescuento: tipoDescuentoParam || 'porcentaje'
            }));
        }

        // Process Cart Items
        const itemsToAdd = [];
        const allServices = [
            ...serviciosOpcionales,
            { id: 1, nombre: removePriceFromTitle(nombresServicios[1] || "Alquiler 3hs (Semana)"), precio: prices.alquiler3hs },
            { id: 2, nombre: removePriceFromTitle(nombresServicios[2] || "Hora Extra Promo"), precio: prices.horaExtraPromo },
            { id: 3, nombre: removePriceFromTitle(nombresServicios[3] || "Alquiler 4hs (Finde/Feriado)"), precio: prices.alquiler4hs },
            { id: 4, nombre: removePriceFromTitle(nombresServicios[4] || "Hora Extra Finde"), precio: prices.horaExtraFinde },
            { id: 13, nombre: removePriceFromTitle(nombresServicios[13] || "Alquiler Víspera Navidad"), precio: prices.alquiler4hs },
            { id: 14, nombre: removePriceFromTitle(nombresServicios[14] || "Alquiler Víspera Año Nuevo"), precio: prices.alquiler4hs },
        ];

        params.forEach((value, key) => {
            if (key.startsWith('item_') && key.endsWith('_id')) {
                const keyParts = key.split('_');
                const itemIdentifier = keyParts[1]; // This can be an ID or a UUID
                const itemId = parseInt(value);
                const cantidadKey = `item_${itemIdentifier}_cantidad`;
                const cantidad = parseInt(params.get(cantidadKey) || '0');

                if (itemId && cantidad > 0) {
                    const servicioBase = allServices.find(s => s && s.id === itemId);
                    if (servicioBase) {
                        const itemToAdd = {
                            ...servicioBase,
                            cantidad: cantidad,
                        };
                        // If it is a waitress, we add the uuid
                        if (itemIdentifier.startsWith('camarera-')) {
                            itemToAdd.uuid = itemIdentifier;
                            itemToAdd.nombre = 'Contratación de camarera'; // Use a consistent name
                        }
                        itemsToAdd.push(itemToAdd);
                    } else {
                        console.warn(`URL Load: No definition found for service with ID ${itemId}`);
                    }
                }
            }
        });

        if (itemsToAdd.length > 0) {
            setCarrito(prevCarrito => {
                // Remove base rentals from URL items to preserve the correct base rental determined by handleDateChange
                const itemsToAddWithoutBaseRental = itemsToAdd.filter(item => ![1, 3, 13, 14].includes(item.id));
                
                let newCarrito = [...prevCarrito, ...itemsToAddWithoutBaseRental];
                
                // Ensure there is only one of each unique service (that is not a waitress)
                const finalCart = [];
                const uniqueIds = new Set();
                newCarrito.forEach(item => {
                    if (item.uuid) { // Always add items with uuid (our waitresses)
                        finalCart.push(item);
                    } else if (!uniqueIds.has(item.id)) { // For other items, only add if ID is not already present
                        finalCart.push(item);
                        uniqueIds.add(item.id);
                    }
                });

                return finalCart;
            });
            toast.success("Carrito importado desde la URL.");
        }
    }, [handleDateChange, serviciosOpcionales, nombresServicios, prices]);

    const handleImportFromUrl = () => {
        if (!urlToImport) {
            toast.error("Por favor, pega una URL en el campo.");
            return;
        }
        try {
            const url = new URL(urlToImport);
            const params = url.searchParams;
            parseAndLoadCartFromURL(params);
            setShowImportUI(false);
            setUrlToImport('');
        } catch (error) {
            console.error("URL de importación inválida:", error);
            toast.error("La URL que pegaste no es válida.");
        }
    };

    useEffect(() => {
        const processUrlOnLoad = () => {
            if (!initialLoad.current || !dataLoaded.holidays || searchParams.toString().length === 0 || serviciosOpcionales.length === 0) {
                return;
            }
            parseAndLoadCartFromURL(searchParams);
            initialLoad.current = false; // Mark as processed
        };
        processUrlOnLoad();
    }, [searchParams, prices, dataLoaded.holidays, parseAndLoadCartFromURL, serviciosOpcionales.length]);

    const initialIdProcessedRef = useRef(false);
    useEffect(() => {
        if (initialIdProcessedRef.current) return;
        const idToLoad = budgetIdFromUrl || searchParams.get('id');
        if (idToLoad) {
            initialIdProcessedRef.current = true;
            cargarPresupuestoPorId(idToLoad);
        }
    }, [budgetIdFromUrl, searchParams, cargarPresupuestoPorId]);

    useEffect(() => {
        if (!selectedDate && !budgetIdFromUrl && !searchParams.get('id')) {
            safeStorage.removeItem('presupuestoSelectedDate');
        }
    }, [selectedDate, budgetIdFromUrl, searchParams]);

    useEffect(() => {
        const checkForExistingBudget = async () => {
            if (selectedDate && isAdmin) {
                const year = selectedDate.getFullYear();
                const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                const day = selectedDate.getDate().toString().padStart(2, '0');
                const db = getDatabase(app);
                const presupuestosRef = ref(db, `presupuestos/${year}/${month}/${day}`);

                try {
                    const snapshot = await get(presupuestosRef);
                    if (snapshot.exists()) {
                        const presupuestos = snapshot.val();
                        // Si hay presupuestos en esta fecha, cargamos el primero
                        const firstPresupuestoId = Object.keys(presupuestos)[0];
                        const firstPresupuesto = presupuestos[firstPresupuestoId];

                        // Cargar los datos del presupuesto encontrado
                        setFormData({ ...initialFormData, ...(firstPresupuesto.formData || {}) });
                        setSeccionesPDF(firstPresupuesto.seccionesPDF || []);
                        setCarrito(firstPresupuesto.carrito || []);
                        setCurrentBudgetId(firstPresupuestoId);

                        // Restaurar versión de precios si existe
                        if (firstPresupuesto.priceVersion) {
                            setSearchParams(prev => {
                                const newParams = new URLSearchParams(prev);
                                newParams.set('v', firstPresupuesto.priceVersion);
                                return newParams;
                            }, { replace: true });
                        }

                        // Restaurar estado de facturación AFIP
                        setFacturaInfo({
                            facturado: firstPresupuesto.facturado || false,
                            facturasAFIP: firstPresupuesto.facturaAFIP || [],
                            facturadoManualmente: firstPresupuesto.facturadoManualmente || false
                        });

                        toast.info("Se cargó el presupuesto correspondiente a esta fecha.");
                    } else {
                        // NO existe presupuesto cargado en esta fecha -> Reiniciar formulario
                        setFormData(initialFormData);
                        setSeccionesPDF([]);
                        setCurrentBudgetId(null);
                        setFacturaInfo({
                            facturado: false,
                            facturasAFIP: [],
                            facturadoManualmente: false
                        });

                        // Verificar si estamos en modo Legacy (V1) para forzar V2 en fecha libre
                        if (searchParams.has('fecha') && !searchParams.get('v')) {
                            setSearchParams(prev => {
                                const newParams = new URLSearchParams(prev);
                                newParams.set('v', activePriceVersion || 2);
                                return newParams;
                            }, { replace: true });
                        }
                    }
                } catch (error) {
                    console.error("Error al verificar presupuesto existente:", error);
                    toast.error("Error al buscar presupuestos para esta fecha.");
                }
            }
        };

        checkForExistingBudget();
    }, [selectedDate, isAdmin]);




    const handleResetOrDelete = async () => {
        const actionText = currentBudgetId ? 'eliminar' : 'resetear';
        if (window.confirm(`¿Estás seguro de que deseas ${actionText} el presupuesto?`)) {
            if (currentBudgetId) {
                // Lógica de eliminación
                const db = getDatabase(app);
                const idLookupRef = ref(db, `presupuestos_por_id/${currentBudgetId}`);
                try {
                    const idLookupSnapshot = await get(idLookupRef);
                    if (idLookupSnapshot.exists()) {
                        const pathValue = idLookupSnapshot.val();
                        if (pathValue && typeof pathValue === 'object' && pathValue.path) {
                            const path = pathValue.path;
                            const presupuestoRef = ref(db, `presupuestos/${path}/${currentBudgetId}`);
                            await remove(presupuestoRef); // Eliminar el presupuesto
                            await remove(idLookupRef); // Eliminar la referencia

                            toast.success("Presupuesto eliminado exitosamente.");
                            toast.info("Base de datos actualizada.");
                            triggerRefetch();

                            // Resetear estado
                            setFormData(initialFormData);
                            setCarrito([]);
                            setSelectedDate(null);
                            setCurrentBudgetId(null);
                            setSeccionesPDF([]);
                        } else {
                            toast.error("La referencia del presupuesto es inválida.");
                        }
                    } else {
                        toast.error("No se encontró la referencia del presupuesto para eliminar.");
                    }
                } catch (error) {
                    console.error("Error al eliminar el presupuesto:", error);
                    toast.error("Error al eliminar el presupuesto.");
                }
            } else {
                // Lógica de reseteo
                setFormData(initialFormData);
                setCarrito(prevCarrito => prevCarrito.filter(item => [1, 3, 13, 14].includes(item.id)));
                // No reseteamos la fecha seleccionada para que el alquiler base no se pierda
                setCurrentBudgetId(null);
                setSeccionesPDF([]);
                toast.success("Formulario reseteado.");
            }
        }
    };

    const handleGenerarRecibo = async (shouldSaveBudget = true, skipCopy = false) => {
        if (shouldSaveBudget) {
            await guardarPresupuesto();
        }

        if (!selectedDate) {
            toast.error("Por favor, selecciona una fecha para generar el recibo.");
            return;
        }

        // Generate and copy summary text using centralized utility
        const presupuestoData = {
            formData,
            carrito: customizedCarrito,
            subtotal,
            montoDescuento,
            totalFinal,
            restante,
        };
        const finalText = generateSummaryText(presupuestoData);
        if (!skipCopy) {
            copyToClipboard(finalText, "Resumen de texto copiado al portapapeles.");
        }

        // Proceed with receipt generation
        const db = getDatabase(app);
        const receiptDataRef = ref(db, 'datosId/31');

        const importeParaRecibo = lastDeposit > 0 ? lastDeposit : formData.seña;

        const receiptData = {
            dia_evento: selectedDate.getDate(),
            mes_evento: selectedDate.getMonth() + 1,
            anio_evento: selectedDate.getFullYear(),
            nombre_cliente: formData.nombreCliente,
            seña: importeParaRecibo,
            seña_total: formData.seña,
            cuit: formData.cuit || '',
            nombre_del_archivo: `${selectedDate.getDate()}-${selectedDate.getMonth() + 1}-${selectedDate.getFullYear()}`,
            fecha_creacion: new Date().toISOString(),
        };

        try {
            await set(receiptDataRef, receiptData);
            toast.info("Base de datos actualizada.");
            setLastDeposit(0);
            setLastSavedSena(parseFloat(formData.seña || 0));
            toast.success("Preparando recibo...");
            const preferredModel = localStorage.getItem('receiptModel') || 'clasico';
            window.open(preferredModel === 'infografico' ? '/templateReciboInfografia' : '/templateRecibo', '_blank', 'noopener');
        } catch (error) {
            console.error("Error al preparar los datos del recibo:", error);
            toast.error("Error al generar el recibo.");
        }
    };
    const generarYCopiarLinkCompartible = async () => {
        const currentSenaBeforeSave = formData.seña; // Capture current seña before save
        const currentSena = parseFloat(formData.seña || 0);
        if (currentSena > 0 && currentSena !== lastSavedSena) {
            setGenerateReceiptOnSave(true);
        }
        const presupuestoId = await guardarPresupuesto(currentSenaBeforeSave);
        if (presupuestoId) {
            const linkCompartible = `${window.location.origin} /presupuesto/${presupuestoId} `;
            copyToClipboard(linkCompartible, "Enlace del presupuesto copiado al portapapeles.");

            // Check if seña has changed and generate receipt
            if (currentSena > 0 && currentSena !== lastSavedSena) {
                await handleGenerarRecibo(false, true); // Pass false to prevent double saving, true to skip copy
            }
        }
    };

    const generarTextoPlano = async () => {
        const currentSenaBeforeSave = formData.seña;
        const currentSena = parseFloat(formData.seña || 0);
        if (currentSena > 0 && currentSena !== lastSavedSena) {
            setGenerateReceiptOnSave(true);
        }
        await guardarPresupuesto(currentSenaBeforeSave);

        // Check if seña has changed and generate receipt
        if (currentSena > 0 && currentSena !== lastSavedSena) {
            await handleGenerarRecibo(false, true);
        }

        const presupuestoData = {
            formData,
            carrito: customizedCarrito,
            subtotal,
            montoDescuento,
            totalFinal,
            restante,
        };

        const finalText = generateSummaryText(presupuestoData);

        setTextoPlano(finalText);
        copyToClipboard(finalText, "Resumen de texto copiado al portapapeles");

        return finalText;
    };

    // --- PDF Section Management ---
    const handleAddSeccion = () => {
        setSeccionesPDF(prev => [...prev, { id: Date.now(), nombre: '', costoPP: '', margen: '', detalle: '' }]);
    };
    const handleAddPresetSeccion = (presetKey) => {
        const preset = (pdfTemplateConfig?.seccionesPredeterminadas || CONFIG_PRESUPUESTO.seccionesPredeterminadas)[presetKey];
        if (!preset) return;
        let nombre = preset.nombre;
        if (presetKey === 'catering') {
            nombre = `${preset.nombre} en base a ${formData.cantidadInvitados || 24} personas`;
        }
        setSeccionesPDF(prev => [...prev, {
            id: Date.now() + Math.random(),
            nombre: nombre,
            costoPP: preset.costoPP,
            margen: preset.margen,
            detalle: preset.detalle
        }]);
    };
    const handleRemoveSeccion = (id) => setSeccionesPDF(prev => prev.filter(s => s.id !== id));
    const handleUpdateSeccion = (id, field, value) => {
        setSeccionesPDF(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };
    const canGeneratePDF = () => {
        if (!selectedDate || !carrito.some(item => [1, 3, 13, 14].includes(item.id))) return false;
        if (!formData.cantidadInvitados || parseInt(formData.cantidadInvitados) <= 0) return false;
        // Each section must have a nombre (space allowed as trick)
        return seccionesPDF.every(sec => sec.nombre);
    };
    const handleExportImage = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!pdfContainerRef.current) return;
        try {
            const pages = pdfContainerRef.current.querySelectorAll('.pdf-page');
            if (pages.length === 0) return;

            const formattedDateStr = selectedDate ? `${String(selectedDate.getDate()).padStart(2, '0')}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${selectedDate.getFullYear()}` : '';
            const dateSuffix = formattedDateStr ? ` ${formattedDateStr}` : '';

            const canvas = await html2canvas(pages[0], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const filename = `Presupuesto - ${siteName}${dateSuffix}.png`;
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();

            if (pages.length > 1) {
                const canvas2 = await html2canvas(pages[1], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const link2 = document.createElement('a');
                link2.download = `Presupuesto - ${siteName}${dateSuffix} - Pagina 2.png`;
                link2.href = canvas2.toDataURL('image/png');
                link2.click();
            }

            toast.success('Imagen descargada exitosamente.');
        } catch (err) { 
            console.error('Error exportar imagen:', err); 
            toast.error('Error al generar la imagen.'); 
        } finally {
            setIsExporting(false);
        }
    };
    const handleExportPDF = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!pdfContainerRef.current) return;
        try {
            const pages = pdfContainerRef.current.querySelectorAll('.pdf-page');
            if (pages.length === 0) return;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                const pageElem = pages[i];
                const canvas = await html2canvas(pageElem, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

                // Dynamically overlay clickable links on this page
                const containerRect = pageElem.getBoundingClientRect();
                const links = pageElem.querySelectorAll('a');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (!href || href.startsWith('#')) return;

                    let targetUrl = href;
                    if (href.startsWith('/')) {
                        targetUrl = window.location.origin + href;
                    }

                    const linkRect = link.getBoundingClientRect();
                    if (linkRect.width > 0 && linkRect.height > 0) {
                        const relX = linkRect.left - containerRect.left;
                        const relY = linkRect.top - containerRect.top;
                        const pdfX = (relX / containerRect.width) * pdfWidth;
                        const pdfY = (relY / containerRect.height) * pdfHeight;
                        const pdfW = (linkRect.width / containerRect.width) * pdfWidth;
                        const pdfH = (linkRect.height / containerRect.height) * pdfHeight;

                        pdf.setPage(i + 1);
                        pdf.link(pdfX, pdfY, pdfW, pdfH, { url: targetUrl });
                    }
                });
            }

            const formattedDateStr = selectedDate ? `${String(selectedDate.getDate()).padStart(2, '0')}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${selectedDate.getFullYear()}` : '';
            const dateSuffix = formattedDateStr ? ` ${formattedDateStr}` : '';
            const filename = `Presupuesto - ${siteName}${dateSuffix}.pdf`;
            pdf.save(filename);
            toast.success('PDF descargado exitosamente con enlaces activos.');
        } catch (err) { 
            console.error('Error exportar PDF:', err); 
            toast.error('Error al generar el PDF.'); 
        } finally {
            setIsExporting(false);
        }
    };
    const handleOpenPDFPreview = async () => {
        if (!canGeneratePDF()) {
            toast.error('Completá los datos mínimos: fecha, alquiler en carrito, y cantidad de invitados.');
            return;
        }
        await guardarPresupuesto();
        setShowPDFPreview(true);
    };

    const handleCheckCalendar = useCallback(async () => {
        const shouldCheck = selectedDate && (formData.nombreCliente || (isAdmin && isDateOccupiedInGoogleCalendar(selectedDate)));
        if (shouldCheck) {
            setSyncStatus(prev => ({ ...prev, loading: true, error: null }));
            try {
                const presupuestoData = {
                    formData,
                    carrito: customizedCarrito,
                    subtotal,
                    montoDescuento,
                    totalFinal,
                    restante,
                };
                // If no budget data, summaryText will be just the generated empty/default string, which is fine for just fetching events
                const summaryText = (formData.nombreCliente || (customizedCarrito && customizedCarrito.length > 0)) ? generateSummaryText(presupuestoData) : "";

                const db = getDatabase(app);
                const calendarIdSnap = await get(ref(db, 'config/calendarIDs/eventsCalendarId'));
                const eventsCalendarId = calendarIdSnap.val();

                if (!eventsCalendarId) {
                    throw new Error("Calendar ID not found in database");
                }

                // Reset hours to start of day and end of day in local time to avoid timezone offset shifts
                const timeMin = new Date(selectedDate);
                timeMin.setHours(0, 0, 0, 0);
                const timeMax = new Date(selectedDate);
                timeMax.setHours(23, 59, 59, 999);
                
                const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${eventsCalendarId}/events?key=${GOOGLE_API_KEY}&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`);

                if (!response.ok) {
                    const errorBody = await response.json();
                    throw new Error(errorBody.error?.message || `Request failed with status ${response.status}`);
                }

                const responseData = await response.json();
                const events = responseData.items;

                let isSynced = false;
                const foundCalendarEvents = [];
                const cleanStr = (s) => {
                    if (!s) return '';
                    return s.normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "") // remove accents
                            .replace(/[^\w\s]/gi, '')      // remove punctuation and emojis
                            .replace(/\s+/g, ' ')
                            .trim()
                            .toLowerCase();
                };
                const targetClean = cleanStr(summaryText);
                
                const summaryTextLegacy = (formData.nombreCliente || (customizedCarrito && customizedCarrito.length > 0)) ? generateSummaryTextLegacy(presupuestoData) : "";
                const targetCleanLegacy = cleanStr(summaryTextLegacy);

                const formattedSelected = format(selectedDate, 'yyyy-MM-dd');
                if (events) {
                    events.forEach(event => {
                        const eventStartStr = event.start.dateTime || event.start.date;
                        if (eventStartStr && eventStartStr.slice(0, 10) === formattedSelected) {
                            foundCalendarEvents.push({ summary: event.summary, start: event.start, end: event.end, htmlLink: event.htmlLink });
                            if (cleanStr(event.summary) === targetClean || cleanStr(event.summary) === targetCleanLegacy) isSynced = true;
                        }
                    });
                }

                const result = {
                    isSynced,
                    eventCount: foundCalendarEvents.length,
                    calendarEvents: foundCalendarEvents
                };

                setSyncStatus({
                    loading: false,
                    isSynced: result.isSynced,
                    eventCount: result.eventCount,
                    error: null,
                    frontendSummaryText: summaryText,
                    calendarEvents: result.calendarEvents,
                });

            } catch (err) {
                console.error("Error checking calendar sync:", err);
                setSyncStatus({
                    loading: false,
                    isSynced: false,
                    eventCount: 0,
                    error: "Error al verificar la sincronización.",
                    frontendSummaryText: '',
                    calendarEvents: [],
                });
            }
        } else {
            setSyncStatus({ loading: false, isSynced: false, eventCount: 0, error: null, frontendSummaryText: '', calendarEvents: [] });
        }
    }, [selectedDate, formData, carrito, subtotal, montoDescuento, totalFinal, restante, isDateOccupiedInGoogleCalendar]);

    useEffect(() => {
        if (authLoading || !currentUser) {
            setSyncStatus({ loading: false, isSynced: false, eventCount: 0, error: null, frontendSummaryText: '', calendarEvents: [] });
            return;
        }

        const debounceCheck = setTimeout(() => {
            handleCheckCalendar();
        }, 1500);

        return () => clearTimeout(debounceCheck);

    }, [authLoading, currentUser, handleCheckCalendar]);

    const handleImportFromCalendar = (eventSummary) => {
        // Allow empty summary to reset/clear budget

        if (window.confirm("¿Seguro que deseas importar este presupuesto? Se reemplazarán todos los datos actuales del formulario y el carrito.")) {
            const parsed = parseSummaryText(eventSummary || '', serviciosOpcionales);

            // Update Form Data
            setFormData(prev => ({
                ...prev,
                ...parsed.formData
            }));

            // Update Carrito
            setCarrito(parsed.carrito);

            // Trigger auto-save
            setShouldSave(true);
            toast.success("Presupuesto importado. Guardando...");
        }
    };
    const renderSyncStatus = () => {
        // If we have sync data (events loop) OR we are loading OR we have a client name OR the date is occupied
        // We basically want to show this section if there's something relevant to show about the calendar
        const shouldRender = selectedDate && (formData.nombreCliente || syncStatus.calendarEvents.length > 0 || syncStatus.loading);

        if (!shouldRender) return null;

        if (!shouldRender) return null;

        return (
            <>
                {syncStatus.loading && (
                    <SyncStatusBanner>
                        Verificando sincronización con Calendar...
                    </SyncStatusBanner>
                )}
                {syncStatus.error && (
                    <SyncStatusBanner $bgColor="#ffdddd" color="#d8000c">
                        {syncStatus.error}
                    </SyncStatusBanner>
                )}
                {syncStatus.eventCount >= 2 && (
                    <SyncStatusBanner $bgColor="#fff3cd" color="#856404">
                        ¡Cuidado! Hay {syncStatus.eventCount} eventos agendados este día.
                    </SyncStatusBanner>
                )}

                {/* Debugging Banner with New Styling */}
                {(syncStatus.frontendSummaryText || syncStatus.calendarEvents.length > 0) && (
                    <ComparisonContainer $isSynced={syncStatus.isSynced}>
                        <GoogleCalendarCard
                            onClick={(e) => {
                                // Prevent triggering if clicking the import button
                                if (e.target.tagName === 'BUTTON') return;
                                generarTextoPlano();
                            }}
                            title="Click para guardar, generar recibo y copiar resumen"
                        >
                            <div className="card-header">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" />
                                <span>Google Calendar</span>
                            </div>
                            <div className="card-body">
                                <ul>
                                    {syncStatus.calendarEvents.length > 0 ? (
                                        syncStatus.calendarEvents.map((event, index) => (
                                            <li key={index} style={{ marginBottom: '10px' }}>
                                                <strong>{event.summary}</strong>
                                                <br />
                                                <span style={{ fontSize: '0.85em', color: '#666' }}>
                                                    {event.start?.dateTime ? format(new Date(event.start.dateTime), "HH:mm") : 'Todo el día'} -
                                                    {event.end?.dateTime ? format(new Date(event.end.dateTime), "HH:mm") : ''}
                                                </span>
                                                {/* Import Button - Only for Admins and if not just "Ocupado" */}
                                                {isAdmin && event.summary !== "Ocupado" && (
                                                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                                        <button
                                                            style={{
                                                                flex: 1,
                                                                padding: '4px 8px',
                                                                fontSize: '0.8rem',
                                                                backgroundColor: '#007bff',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Prevent card click
                                                                handleImportFromCalendar(event.summary);
                                                            }}
                                                        >
                                                            Importar desde Calendar
                                                        </button>
                                                        {event.htmlLink && (
                                                            <button
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '4px 8px',
                                                                    fontSize: '0.8rem',
                                                                    backgroundColor: '#28a745',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const link = event.htmlLink;
                                                                    window.open(link, '_blank');
                                                                }}
                                                            >
                                                                Abrir Calendar
                                                            </button>
                                                        )}
                                                        {(() => {
                                                            const phoneMatch = event.summary?.match(/(\d{2,4}[-\s]?\d{4}[-\s]?\d{4})/) || event.summary?.match(/(\+?549?\d{10,})/) || event.summary?.match(/(\d{10,13})/);
                                                            const gcalPhone = phoneMatch ? phoneMatch[0] : null;
                                                            const budgetPhone = formData.telefono && formatPhoneForWhatsApp(formData.telefono);
                                                            const resolvedPhone = budgetPhone || (gcalPhone && formatPhoneForWhatsApp(gcalPhone));
                                                            if (!resolvedPhone) return null;
                                                            return (
                                                                <button
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '4px 8px',
                                                                        fontSize: '0.8rem',
                                                                        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(`https://wa.me/${resolvedPhone}`, '_blank');
                                                                    }}
                                                                >
                                                                    💬 WhatsApp
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                            <span>No hay eventos agendados</span>
                                            {selectedDate && (
                                                <button
                                                    style={{
                                                        padding: '4px 12px',
                                                        fontSize: '0.8rem',
                                                        backgroundColor: '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        marginTop: '5px'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const dateStr = format(selectedDate, 'yyyyMMdd');
                                                        const text = encodeURIComponent(syncStatus.frontendSummaryText || 'Reserva Salón');
                                                        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dateStr}T120000Z/${dateStr}T210000Z`;
                                                        window.open(url, '_blank');
                                                    }}
                                                >
                                                    Abrir Calendar
                                                </button>
                                            )}
                                        </li>
                                    )}
                                </ul>
                                {!syncStatus.isSynced && syncStatus.calendarEvents.length > 0 && (
                                    (() => {
                                        const cleanLocal = (syncStatus.frontendSummaryText || '').toLowerCase().trim();
                                        const cleanRemote = (syncStatus.calendarEvents[0]?.summary || '').toLowerCase().trim();
                                        const isMismatch = !cleanLocal.includes(cleanRemote) && !cleanRemote.includes(cleanLocal);

                                        return isMismatch ? (
                                            <div className="mismatch-warning">⚠️ No coincide exactamente</div>
                                        ) : null;
                                    })()
                                )}
                            </div>
                        </GoogleCalendarCard>

                        <AppSummaryCard
                            className={syncStatus.isSynced ? 'hide-on-mobile' : ''}
                            onClick={generarTextoPlano}
                            title="Click para guardar, generar recibo y copiar resumen"
                        >
                            <div className="card-header">
                                {logoUrl ? <img src={logoUrl} alt="App Logo" /> : <span>📝</span>}
                                <span>Resumen Presupuesto</span>
                            </div>
                            <div className="card-body">
                                <p>{syncStatus.frontendSummaryText}</p>
                            </div>
                        </AppSummaryCard>
                    </ComparisonContainer>
                )}
                
                <MobileOnly>
                    {renderRefuerzoUI()}
                </MobileOnly>
            </>
        );
    };

    const handleAnalyzeReceipt = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAnalyzingReceipt(true);
        toast.info("Analizando comprobante con IA...", { autoClose: false, toastId: "analyzeReceipt" });

        try {
            const base64String = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });

            const functions = getFunctions(app);
            const analizarComprobante = httpsCallable(functions, 'analizarComprobante');
            
            const result = await analizarComprobante({ 
                imageBase64: base64String, 
                mimeType: file.type 
            });

            if (result.data.success && result.data.data) {
                const { monto, cuit } = result.data.data;
                let message = "Comprobante analizado con éxito.";
                if (monto) {
                    setNewDepositAmount(String(monto));
                    message += ` Monto: $${monto}.`;
                }
                if (cuit) {
                    setFormData(prev => ({ ...prev, cuit: String(cuit) }));
                    message += ` CUIT: ${cuit}.`;
                }
                
                toast.update("analyzeReceipt", { render: message, type: "success", autoClose: 4000 });
                
                if (monto) {
                    handleNewDeposit(setGenerateReceiptOnSave, setShouldSave, monto);
                }
            } else {
                toast.update("analyzeReceipt", { render: "No se pudo extraer la información del comprobante.", type: "warning", autoClose: 3000 });
            }
        } catch (error) {
            console.error("Error analizando comprobante:", error);
            toast.update("analyzeReceipt", { render: "Error al analizar comprobante.", type: "error", autoClose: 3000 });
        } finally {
            setIsAnalyzingReceipt(false);
            e.target.value = null;
        }
    };

    const renderRefuerzoUI = () => {
        if (!isAdmin) return null;
        return (
            <div className="refuerzo-section" style={{ 
                backgroundColor: 'var(--card-grey)', 
                padding: '10px', 
                marginBottom: '15px', 
                borderRadius: '8px', 
                border: '1px solid #ddd',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                boxSizing: 'border-box'
            }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>Refuerzo:</span>
                <input
                    type="text"
                    placeholder="$ Monto"
                    value={newDepositAmount}
                    onChange={(e) => setNewDepositAmount(e.target.value)}
                    style={{ width: '65%', maxWidth: '140px', margin: 0, padding: '6px', fontSize: '0.9rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
                <label style={{ cursor: isAnalyzingReceipt ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', backgroundColor: '#e0e0e0', borderRadius: '4px', border: '1px solid #ccc', margin: '0' }} title="Leer comprobante">
                    {isAnalyzingReceipt ? '⏳' : '📷'}
                    <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        style={{ display: 'none' }} 
                        onChange={handleAnalyzeReceipt}
                        disabled={isAnalyzingReceipt}
                    />
                </label>
                <Button onClick={() => handleNewDeposit(setGenerateReceiptOnSave, setShouldSave)} style={{ width: '32px', height: '32px', margin: '0 0 0 auto', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }} title="Aceptar refuerzo">
                    ✓
                </Button>
            </div>
        );
    };
    const hasUnsavedChanges = useCallback(() => {
        // Check if formData has changed from initialFormData
        const formDataChanged = Object.keys(initialFormData).some(key => {
            // Special handling for 'seña' and 'precioAgregadoManual' which are numbers but stored as strings
            if (key === 'seña' || key === 'precioAgregadoManual') {
                return parseFloat(formData[key] || 0) !== parseFloat(initialFormData[key] || 0);
            }
            return formData[key] !== initialFormData[key];
        });

        // Check if carrito has items beyond the base rental (if a date is selected)
        let carritoHasExtraItems = false;
        if (selectedDate) {
            // Filter out the base rental item (id 1, 3, 13, 14)
            const nonBaseRentalItems = carrito.filter(item => ![1, 3, 13, 14].includes(item.id));
            carritoHasExtraItems = nonBaseRentalItems.length > 0;
        } else {
            // If no date is selected, any item in carrito means it's not empty
            carritoHasExtraItems = carrito.length > 0;
        }

        return formDataChanged || carritoHasExtraItems;
    }, [formData, carrito, selectedDate]);

    const isSpecialHoliday = selectedDate &&
        ((selectedDate.getMonth() === 11 && (selectedDate.getDate() === 24 || selectedDate.getDate() === 25)) || // Dec 24, 25
            (selectedDate.getMonth() === 0 && selectedDate.getDate() === 1) || // Jan 1
            (selectedDate.getMonth() === 11 && selectedDate.getDate() === 31)); // Dec 31

    // Prevent "Flash of Old Prices" when loading a specific date from URL
    // Wait until currentMonth is calculated (Year 1 vs Year 2 logic)
    if (searchParams.has('fecha') && !currentMonth) {
        return <Animacion />;
    }

    if (isPageLoading) {
        return <Animacion />;
    }

    function handlePrintTicket(fac) {
        const printWindow = window.open('', '_blank');
        
        let fechaEmision = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (fac.fechaEmision) {
            const emStr = String(fac.fechaEmision);
            if (emStr.length === 8) {
                fechaEmision = `${emStr.slice(6,8)}/${emStr.slice(4,6)}/${emStr.slice(0,4)}`;
            }
        }

        let vtoCaeStr = '';
        if (fac.vencimiento) {
            const vtoStr = String(fac.vencimiento);
            if (vtoStr.length === 8) {
                vtoCaeStr = `${vtoStr.slice(6,8)}/${vtoStr.slice(4,6)}/${vtoStr.slice(0,4)}`;
            } else if (vtoStr.includes('-')) {
                const parts = vtoStr.split('-');
                if (parts[0].length === 4) vtoCaeStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
                else vtoCaeStr = vtoStr;
            } else {
                vtoCaeStr = vtoStr;
            }
        }

        // Fecha de vencimiento de pago = fecha del evento
        let fechaVtoPago = fechaEmision; // fallback
        if (fac.fechaVtoPago) {
            const vtStr = String(fac.fechaVtoPago);
            if (vtStr.length === 8) {
                fechaVtoPago = `${vtStr.slice(6,8)}/${vtStr.slice(4,6)}/${vtStr.slice(0,4)}`;
            } else {
                fechaVtoPago = vtStr;
            }
        } else if (selectedDate) {
            fechaVtoPago = format(new Date(selectedDate), 'dd/MM/yyyy');
        }
        const totalAmount = typeof totalFinal !== 'undefined' ? totalFinal : 0;
        const billedAmount = parseFloat(fac.monto || totalAmount || 0);
        const montoStr = billedAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 });
        const ptoVentaStr = String(fac.puntoVenta || 3).padStart(5, '0');
        const compNroStr = String(fac.comprobante || 0).padStart(8, '0');
        const fechaEventoFormateada = selectedDate ? format(new Date(selectedDate), 'dd/MM/yyyy') : 'A Confirmar';
        const isJuan = fac.puntoVenta === 5 || fac.puntoVenta === '5';
        const emisorNombre = isJuan ? 'PAYO JUAN IGNACIO' : 'BISOGNO MARIA LUISA ELENA';
        const emisorCuit = isJuan ? '20325938081' : '23056951954';
        const emisorIngresosBrutos = emisorCuit; // Same as CUIT in this context
        
        // Receptor - Razón Social desde ARCA (prioridad) o fallback al nombre del cliente
        const receptorCuit = formData.cuit ? formData.cuit.replace(/[^0-9]/g, '') : '00000000000';
        const receptorCondicionIVA = formData.condicionIva || fac.condicionIvaArca || (receptorCuit !== '00000000000' ? 'Responsable Inscripto' : 'Consumidor Final');
        const receptorDomicilio = formData.domicilio || fac.domicilioArca || 'N/A';
        const clienteNombre = formData.razonSocial || fac.razonSocialArca || formData.nombreCliente || (receptorCuit !== '00000000000' ? 'Cliente' : 'Consumidor Final');

        const isFullPayment = Math.abs(billedAmount - totalAmount) < 0.1;
        let tableRowsHTML = '';
        if (isFullPayment && typeof montoDescuento !== 'undefined' && montoDescuento > 0) {
            const porcBonif = formData.tipoDescuento === 'porcentaje' ? parseFloat(formData.descuento || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00';
            const impBonifStr = montoDescuento.toLocaleString('es-AR', { minimumFractionDigits: 2 });
            const subtotalSinDescStr = (typeof subtotal !== 'undefined' ? subtotal : billedAmount + montoDescuento).toLocaleString('es-AR', { minimumFractionDigits: 2 });
            
            tableRowsHTML = `
                <tr>
                    <td>1</td>
                    <td>Alquiler de salón de eventos Salón Magic Eventos<br/>Evento: ${fechaEventoFormateada}</td>
                    <td>1,00</td>
                    <td>unidades</td>
                    <td>${subtotalSinDescStr}</td>
                    <td>${porcBonif}</td>
                    <td>${impBonifStr}</td>
                    <td style="text-align: right;">${montoStr}</td>
                </tr>`;
        } else {
            const descLinea = isFullPayment ? '' : '<br/>(Pago parcial)';
            tableRowsHTML = `
                <tr>
                    <td>1</td>
                    <td>Alquiler de salón de eventos Salón Magic Eventos<br/>Evento: ${fechaEventoFormateada}${descLinea}</td>
                    <td>1,00</td>
                    <td>unidades</td>
                    <td>${montoStr}</td>
                    <td>0,00</td>
                    <td>0,00</td>
                    <td style="text-align: right;">${montoStr}</td>
                </tr>`;
        }

        // QR Code generation
        const qrData = {
            ver: 1,
            fecha: new Date().toISOString().split('T')[0],
            cuit: parseInt(emisorCuit, 10),
            ptoVta: parseInt(fac.puntoVenta || 3, 10),
            tipoCmp: 11, // Factura C
            nroCmp: parseInt(fac.comprobante || 0, 10),
            importe: parseFloat(fac.monto || totalAmount || 0),
            moneda: "PES",
            ctz: 1,
            tipoDocRec: receptorCuit !== '00000000000' ? 80 : 99,
            nroDocRec: parseInt(receptorCuit, 10) || 0,
            tipoCodAut: "E",
            codAut: parseInt(fac.cae || 0, 10)
        };
        const qrBase64 = btoa(JSON.stringify(qrData));
        const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${qrBase64}`;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrUrl)}`;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Factura - Salón Magic Eventos</title>
                    <style>
                        * { box-sizing: border-box; }
                        body { font-family: 'Arial', sans-serif; padding: 20px; font-size: 12px; color: #000; margin: 0; }
                        .factura-container { max-width: 800px; margin: 0 auto; border: 1px solid #000; padding: 0; }
                        
                        .header-top { display: flex; border-bottom: 1px solid #000; position: relative; }
                        .col-izq, .col-der { width: 50%; padding: 15px; }
                        .col-der { padding-left: 50px; }
                        .col-izq { border-right: 1px solid #000; }
                        .tipo-factura {
                            position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
                            border: 1px solid #000; background: #fff; width: 60px; height: 60px;
                            display: flex; flex-direction: column; align-items: center; justify-content: center;
                            font-weight: bold; font-size: 32px; border-top: none;
                        }
                        .tipo-factura span { font-size: 10px; font-weight: normal; margin-top: 2px; }
                        
                        h2 { margin: 0 0 10px 0; font-size: 18px; text-transform: uppercase; }
                        h1 { margin: 0 0 10px 0; font-size: 26px; font-weight: 900; text-align: center; }
                        p { margin: 3px 0; font-size: 11px; }
                        
                        .periodo-box { display: flex; justify-content: space-between; padding: 5px 15px; border-bottom: 1px solid #000; font-weight: bold; background-color: #f9f9f9; }
                        
                        .cliente-box { padding: 10px 15px; border-bottom: 1px solid #000; display: flex; flex-wrap: wrap; }
                        .cliente-col { width: 50%; }
                        
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th { border-bottom: 1px solid #000; border-top: 1px solid #000; padding: 5px; text-align: left; background-color: #f0f0f0; font-size: 10px; }
                        td { padding: 5px; font-size: 11px; }
                        
                        .totales-container { display: flex; border-top: 1px solid #000; margin-top: 150px; }
                        .totales-izq { width: 50%; padding: 15px; }
                        .totales-der { width: 50%; padding: 15px; border-left: 1px solid #000; display: flex; flex-direction: column; justify-content: flex-end; }
                        .totales-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; font-size: 13px; }
                        .totales-row.gran-total { font-size: 16px; margin-top: 10px; }
                        
                        .footer { display: flex; justify-content: space-between; align-items: flex-end; padding: 15px; margin-top: 20px; }
                        .arca-logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 2px; }
                        .cae-box { text-align: right; font-weight: bold; }
                        
                        @media print { .no-print { display: none; } }
                        .print-btn { display: block; width: 100%; text-align: center; margin-bottom: 20px; font-size: 16px; color: #1976d2; cursor: pointer; text-decoration: underline; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="no-print print-btn" onclick="window.print()">[Imprimir Comprobante]</div>
                    <div class="factura-container">
                        <div style="text-align: center; font-weight: bold; font-size: 16px; border-bottom: 1px solid #000; padding: 8px;">ORIGINAL</div>
                        
                        <div class="header-top">
                            <div class="tipo-factura">
                                C
                                <span>COD. 011</span>
                            </div>
                            
                            <div class="col-izq">
                                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                    <h3 style="margin: 0; font-size: 16px;">Salón Magic Eventos</h3>
                                </div>
                                <h2 style="font-size: 16px; margin-bottom: 10px;">${emisorNombre}</h2>
                                <p><strong>Razón Social:</strong> ${emisorNombre}</p>
                                <p><strong>Domicilio Comercial:</strong> Av. Corrientes 1234 - Ciudad de Buenos Aires</p>
                                <br/>
                                <p><strong>Condición frente al IVA:</strong> Responsable Monotributo</p>
                            </div>
                            
                            <div class="col-der">
                                <h1>FACTURA</h1>
                                <p><strong>Punto de Venta:</strong> ${ptoVentaStr} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Comp. Nro:</strong> ${compNroStr}</p>
                                <p><strong>Fecha de Emisión:</strong> ${fechaEmision}</p>
                                <br/>
                                <p><strong>CUIT:</strong> ${emisorCuit}</p>
                                <p><strong>Ingresos Brutos:</strong> ${emisorIngresosBrutos}</p>
                                <p><strong>Fecha de Inicio de Actividades:</strong> 01/12/2014</p>
                            </div>
                        </div>
                        
                        <div class="periodo-box">
                            <div>Período Facturado Desde: &nbsp;&nbsp;${fechaEmision}</div>
                            <div>Hasta: &nbsp;&nbsp;${fechaEmision}</div>
                            <div>Fecha de Vto. para el pago: &nbsp;&nbsp;${fechaVtoPago}</div>
                        </div>
                        
                        <div class="cliente-box">
                            <div class="cliente-col">
                                <p><strong>CUIT:</strong> ${receptorCuit}</p>
                                <p><strong>Condición frente al IVA:</strong> ${receptorCondicionIVA}</p>
                                <p><strong>Condición de venta:</strong> Efectivo / Transferencia Bancaria</p>
                            </div>
                            <div class="cliente-col">
                                <p><strong>Apellido y Nombre / Razón Social:</strong> ${clienteNombre}</p>
                                <p><strong>Domicilio:</strong> ${receptorDomicilio}</p>
                            </div>
                        </div>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Producto / Servicio</th>
                                    <th>Cantidad</th>
                                    <th>U. Medida</th>
                                    <th>Precio Unit.</th>
                                    <th>% Bonif</th>
                                    <th>Imp. Bonif.</th>
                                    <th style="text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHTML}
                            </tbody>
                        </table>
                        
                        <div class="totales-container">
                            <div class="totales-izq"></div>
                            <div class="totales-der">
                                <div class="totales-row">
                                    <span>Subtotal: $</span>
                                    <span>${montoStr}</span>
                                </div>
                                <div class="totales-row">
                                    <span>Importe Otros Tributos: $</span>
                                    <span>0,00</span>
                                </div>
                                <div class="totales-row gran-total">
                                    <span>Importe Total: $</span>
                                    <span>${montoStr}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <div style="display: flex; gap: 15px;">
                                <img id="qr-img" src="${qrImageUrl}" alt="AFIP QR Code" style="width: 100px; height: 100px;" />
                                <div>
                                    <div class="arca-logo">ARCA</div>
                                    <div style="font-size: 8px;">AGENCIA DE RECAUDACIÓN<br/>Y CONTROL ADUANERO</div>
                                    <br/>
                                    <div style="font-weight: bold; font-style: italic;">Comprobante Autorizado</div>
                                    <div style="font-size: 9px; margin-top: 5px;">Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación</div>
                                </div>
                            </div>
                            <div class="cae-box">
                                <p style="font-size: 14px;">CAE N°: ${fac.cae}</p>
                                <p style="font-size: 12px; margin-top: 5px;">Fecha de Vto. de CAE: ${vtoCaeStr}</p>
                            </div>
                        </div>
                    </div>
                    <script>
                        var qr = document.getElementById('qr-img');
                        var printed = false;
                        function doPrint() {
                            if (!printed) {
                                printed = true;
                                window.print();
                            }
                        }
                        qr.onload = doPrint;
                        qr.onerror = doPrint;
                        if(qr.complete) {
                            doPrint();
                        }
                        // Fallback just in case
                        setTimeout(doPrint, 1500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleFacturarEmpresa = async () => {
        if (!currentBudgetId) return;

        setIsBilling(true);
        try {
            const functions = getFunctions(app);
            const generarFacturaAFIP = httpsCallable(functions, 'generarFacturaAFIP');
            
            const db = getDatabase(app);
            const idLookupRef = ref(db, `presupuestos_por_id/${currentBudgetId}`);
            const idLookupSnapshot = await get(idLookupRef);
            if (!idLookupSnapshot.exists()) throw new Error("Path not found");
            
            const totalToBill = typeof totalFinal !== 'undefined' ? totalFinal : 0;
            
            const result = await generarFacturaAFIP({
                presupuestoId: currentBudgetId,
                path: idLookupSnapshot.val().path,
                importeTotal: totalToBill,
                docTipo: 80, // 80 = CUIT
                docNro: formData.cuit,
                fechaEvento: selectedDate ? selectedDate.toISOString() : null,
                emisor: 'juan'
            });

            toast.success("Factura de Empresa generada exitosamente en AFIP!");
            
            if (result.data && result.data.facturas) {
                setFacturaInfo(prev => ({ ...prev, facturado: true, facturasAFIP: result.data.facturas }));
            } else {
                setFacturaInfo(prev => ({ ...prev, facturado: true }));
            }
            
            // Re-render
            const searchParams = new URLSearchParams(location.search);
            searchParams.set('v', searchParams.get('v') || '2');
            searchParams.delete('facturar');
            navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
            
        } catch (error) {
            console.error("Error al facturar en AFIP:", error);
            alert("Error: " + error.message);
        } finally {
            setIsBilling(false);
        }
    };

    const handleAnularFactura = async (facturaIndex) => {
        if (!currentBudgetId) return;
        try {
            const functions = getFunctions(app);
            const anularFacturaAFIP = httpsCallable(functions, 'anularFacturaAFIP');
            
            const db = getDatabase(app);
            const idLookupRef = ref(db, `presupuestos_por_id/${currentBudgetId}`);
            const idLookupSnapshot = await get(idLookupRef);
            if (!idLookupSnapshot.exists()) throw new Error("Path not found");
            
            const toastId = toast.loading('Anulando factura y emitiendo Nota de Crédito...');
            
            const result = await anularFacturaAFIP({
                presupuestoId: currentBudgetId,
                path: idLookupSnapshot.val().path,
                facturaIndex: facturaIndex
            });
            
            toast.update(toastId, { render: '¡Factura anulada con éxito!', type: "success", isLoading: false, autoClose: 3000 });
            
            if (result.data && result.data.success) {
                setFacturaInfo(prev => {
                    const newFacturas = [...prev.facturasAFIP];
                    newFacturas[facturaIndex].anulada = true;
                    newFacturas[facturaIndex].notaCredito = result.data.notaCredito;
                    return { ...prev, facturasAFIP: newFacturas };
                });
            }
        } catch (error) {
            console.error("Error anulando factura:", error);
            toast.error("Error al anular la factura: " + error.message);
        }
    };

    const handleFacturarAFIP = async () => {
        if (!currentBudgetId) return;
        setIsBilling(true);
        try {
            const functions = getFunctions(app);
            const generarFacturaAFIP = httpsCallable(functions, 'generarFacturaAFIP');
            
            const db = getDatabase(app);
            const idLookupRef = ref(db, `presupuestos_por_id/${currentBudgetId}`);
            const idLookupSnapshot = await get(idLookupRef);
            if (!idLookupSnapshot.exists()) throw new Error("Path not found");
            
            // Re-calcular total si es necesario, asumimos que totalFinal esta disponible o calcularlo
            const totalToBill = typeof totalFinal !== 'undefined' ? totalFinal : 0;
            
            const result = await generarFacturaAFIP({
                presupuestoId: currentBudgetId,
                path: idLookupSnapshot.val().path,
                importeTotal: totalToBill,
                docTipo: afipForm.docTipo,
                docNro: afipForm.docNro || 0,
                fechaEvento: selectedDate ? selectedDate.toISOString() : null,
                emisor: afipForm.emisor || 'maria',
                razonSocial: afipForm.razonSocial || ''
            });

            alert("Factura generada exitosamente!");
            setIsAfipModalOpen(false);
            
            if (result.data && result.data.facturas) {
                setFacturaInfo({ facturado: true, facturasAFIP: result.data.facturas });
                result.data.facturas.forEach(fac => handlePrintTicket(fac));
            }
            
            // Quitar param facturar
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.delete('facturar');
                return newParams;
            });
            
        } catch (error) {
            console.error("Error al facturar:", error);
            alert("Error al facturar en AFIP: " + error.message);
        } finally {
            setIsBilling(false);
        }
    };
    return (
        <>
            <GlobalStyle />
            <Section>
                <Header 
                    $bgColor={
                        syncStatus.isSynced 
                            ? '#d4edda' 
                            : (!syncStatus.isSynced && !syncStatus.loading && !syncStatus.error && syncStatus.frontendSummaryText) 
                                ? '#f8d7da' 
                                : undefined
                    }
                >
                    <div className="header-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '5px' }}>
                            <a href="/" className="brand" style={{ flexShrink: 0 }}>
                                {logoUrl && <img src={logoUrl} className="logo" alt="Logo" style={{ height: '30px', marginRight: '5px' }} />}
                                <span className="name" style={{ fontSize: '1.1rem', marginRight: '5px' }}>{siteName}</span>
                            </a>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                                {isAdmin && (
                                    <select
                                        id="priceVersionHeader"
                                        value={(() => {
                                            const vParam = searchParams.get('v');
                                            if (vParam) return vParam;
                                            if (searchParams.has('fecha')) return '1';
                                            return activePriceVersion || '';
                                        })()}
                                        onChange={(e) => {
                                            const newVersion = e.target.value;
                                            setSearchParams(prev => {
                                                const newParams = new URLSearchParams(prev);
                                                newParams.set('v', newVersion);
                                                return newParams;
                                            });
                                            toast.info(`Cambiando a lista de precios v${newVersion}...`);
                                        }}
                                        style={{
                                            padding: '0.2rem',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            fontSize: '0.8rem',
                                            fontFamily: 'product_sansregular',
                                            cursor: 'pointer',
                                            backgroundColor: '#fff'
                                        }}
                                        title="Seleccionar versión de precios"
                                    >
                                        {Array.from({ length: Math.max(activePriceVersion || 2, 2) }, (_, i) => i + 1).map(v => (
                                            <option key={v} value={v}>
                                                v{v}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {selectedDate && (
                                    <DatePicker
                                        selected={selectedDate}
                                        handleDateChange={(date) => {
                                            if (date) {
                                                handleDateChange(date);
                                            }
                                        }}
                                        orangeHolidays={orangeHolidayDates}
                                        currentMonth={currentMonth}
                                        currentYear={inputValue101 || new Date().getFullYear()}
                                        allowOccupiedSelection={true}
                                    />
                                )}
                                {isAdmin && selectedDate && (
                                    <button
                                        onClick={async () => {
                                            await guardarPresupuesto();
                                            await handleCheckCalendar();
                                            toast.success('Presupuesto y calendario actualizados.');
                                        }}
                                        title="Actualizar presupuesto y calendario"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            fontSize: '1.2rem',
                                            cursor: 'pointer',
                                            padding: '2px 4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            outline: 'none',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        🔄
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                <button
                                    onClick={() => setShowLoadInput(!showLoadInput)}
                                    title="Cargar Presupuesto"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '1.4rem',
                                        cursor: 'pointer',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        outline: 'none'
                                    }}
                                >
                                    📂
                                </button>
                                <button
                                    onClick={() => guardarPresupuesto()}
                                    title="Guardar Presupuesto"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '1.4rem',
                                        cursor: 'pointer',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        outline: 'none'
                                    }}
                                >
                                    💾
                                </button>
                                <button
                                    onClick={() => handleGenerarRecibo()}
                                    title="imprimir recibo"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '1.4rem',
                                        cursor: 'pointer',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        outline: 'none'
                                    }}
                                >
                                    🖨️
                                </button>
                                <button
                                    onClick={() => handleResetOrDelete()}
                                    title={currentBudgetId ? "Eliminar Presupuesto" : "Limpiar Formulario"}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '1.4rem',
                                        cursor: 'pointer',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        outline: 'none'
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                </Header>

                <ScrollToTop isHome={true} />

                {renderSyncStatus()}

                {selectedDate && !isDateOccupiedInGoogleCalendar(selectedDate) && currentBudgetId && (
                    <WarningMessage>
                        Cuidado, este presupuesto no está agendado en el calendario de Google. ¿La reserva está firme?
                    </WarningMessage>
                )}

                {selectedDate && isDateOccupiedInGoogleCalendar(selectedDate) && !currentBudgetId && (
                    <InfoMessage>
                        Esta fecha está ocupada en el calendario de Google, pero no hay información del evento cargada en el presupuesto. ¿Deseas cargar la información del evento?
                    </InfoMessage>
                )}

                <MainLayout>
                    <ContentWrapper>
                        <FormularioCliente
                            isAdmin={isAdmin}
                            selectedDate={selectedDate}
                            showLoadInput={showLoadInput}
                            presupuestoIdToLoad={presupuestoIdToLoad}
                            setPresupuestoIdToLoad={setPresupuestoIdToLoad}
                            cargarPresupuestoPorId={cargarPresupuestoPorId}
                            formData={formData}
                            handleFormChange={handleFormChange}
                            handleKeyDown={handleKeyDown}
                            refs={{
                                nombreClienteRef,
                                telefonoRef,
                                descripcionEventoRef,
                                descuentoRef,
                                motivoDescuentoRef,
                                señaRef,
                                inicioEventoRef,
                                finEventoRef,
                                agregadoManualRef,
                                precioAgregadoManualRef,
                                generarResumenBtnRef
                            }}
                            formatDate={(date) => format(date, "eeee d 'de' MMMM 'de' yyyy", { locale: es }).charAt(0).toUpperCase() + format(date, "eeee d 'de' MMMM 'de' yyyy", { locale: es }).slice(1)}
                        />

                        {/* --- PDF Data Section --- */}
                        {isAdmin && (
                            <AdminSection>
                                <h3 style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setShowPDFFields(p => !p)}>
                                    📄 Datos para Presupuesto PDF {showPDFFields ? '▲' : '▼'}
                                </h3>
                                {showPDFFields && (
                                    <>
                                        <label htmlFor="cantidadInvitados">Cantidad de Invitados</label>
                                        <input id="cantidadInvitados" name="cantidadInvitados" type="text"
                                            placeholder="Ej: 24" value={formData.cantidadInvitados || ''}
                                            onChange={handleFormChange} />

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label htmlFor="notaAlquiler">Nota sobre el alquiler (opcional)</label>
                                            {!formData.notaAlquiler && (
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, notaAlquiler: activeScheduleStructure === 'fixed' ? "Opción únicamente disponible para días de lunes a viernes" : "Opción únicamente disponible para días de lunes a jueves" }))}
                                                    style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}>
                                                    ✨ Rellenar con texto de ejemplo
                                                </button>
                                            )}
                                        </div>
                                        <input id="notaAlquiler" name="notaAlquiler" type="text"
                                            placeholder={activeScheduleStructure === 'fixed' ? "Ej: Opción únicamente disponible para días de lunes a viernes" : "Ej: Opción únicamente disponible para días de lunes a jueves"}
                                            value={formData.notaAlquiler || ''} onChange={handleFormChange} />

                                        <div style={{ borderTop: '2px solid #ddd', marginTop: '1rem', paddingTop: '1rem' }}>
                                            <h4 style={{ marginBottom: '0.5rem' }}>Secciones del presupuesto</h4>
                                            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                                                Agregá secciones como Catering, Barra de tragos, etc.
                                            </p>

                                            {seccionesPDF.map((seccion, index) => (
                                                <div key={seccion.id} style={{
                                                    border: '1px solid #ddd', borderRadius: '8px',
                                                    padding: '1rem', marginBottom: '1rem', backgroundColor: '#fafafa'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <strong>Sección {index + 2}</strong>
                                                        <button onClick={() => handleRemoveSeccion(seccion.id)}
                                                            style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <label>Nombre de la sección</label>
                                                        {!seccion.nombre && (
                                                            <button type="button" onClick={() => handleUpdateSeccion(seccion.id, 'nombre', `Catering en base a ${formData.cantidadInvitados || 24} personas`)}
                                                                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}>
                                                                ✨ Rellenar con texto de ejemplo
                                                            </button>
                                                        )}
                                                    </div>
                                                    <input type="text" placeholder={`Ej: Catering en base a ${formData.cantidadInvitados || 24} personas`}
                                                        value={seccion.nombre}
                                                        onChange={(e) => handleUpdateSeccion(seccion.id, 'nombre', e.target.value)} />
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                        <div>
                                                            <label>Costo por persona ($)</label>
                                                            <input type="text" placeholder="30000" value={seccion.costoPP}
                                                                onChange={(e) => handleUpdateSeccion(seccion.id, 'costoPP', e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <label>Margen de ganancia (%)</label>
                                                            <input type="text" placeholder="39" value={seccion.margen}
                                                                onChange={(e) => handleUpdateSeccion(seccion.id, 'margen', e.target.value)} />
                                                        </div>
                                                    </div>
                                                    {(parseFloat(seccion.costoPP) > 0) && (
                                                        <p style={{ fontWeight: 'bold', color: 'var(--primary-text)', margin: '0.5rem 0' }}>
                                                            → Precio final pp: ${Math.round(parseFloat(seccion.costoPP || 0) * (1 + parseFloat(seccion.margen || 0) / 100)).toLocaleString('es-AR')}
                                                            {formData.cantidadInvitados > 0 && (
                                                                <span style={{ fontWeight: 'normal', color: '#666' }}>
                                                                    {' '}| Total: ${(Math.round(parseFloat(seccion.costoPP || 0) * (1 + parseFloat(seccion.margen || 0) / 100)) * parseInt(formData.cantidadInvitados || 0)).toLocaleString('es-AR')}
                                                                </span>
                                                            )}
                                                        </p>
                                                    )}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <label>Detalle (líneas con ":" al final = negrita)</label>
                                                        {!seccion.detalle && (
                                                            <button type="button" onClick={() => handleUpdateSeccion(seccion.id, 'detalle', "2 camareras\nDesayuno por 1 hora:\nCafé y té con medialunas")}
                                                                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}>
                                                                ✨ Rellenar con texto de ejemplo
                                                            </button>
                                                        )}
                                                    </div>
                                                    <textarea rows={5} placeholder={"2 camareras\nDesayuno por 1 hora:\nCafé y té con medialunas"}
                                                        value={seccion.detalle}
                                                        onChange={(e) => handleUpdateSeccion(seccion.id, 'detalle', e.target.value)}
                                                        style={{ fontFamily: 'product_sansregular' }} />
                                                </div>
                                            ))}

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                                <Button type="button" onClick={() => handleAddPresetSeccion('catering')} style={{ backgroundColor: '#2b8a3e', margin: 0, fontSize: '0.85rem' }}>
                                                    🍽️ + Agregar Catering
                                                </Button>
                                                <Button type="button" onClick={() => handleAddPresetSeccion('barra')} style={{ backgroundColor: '#862e9c', margin: 0, fontSize: '0.85rem' }}>
                                                    🍹 + Agregar Barra de Tragos
                                                </Button>
                                                <Button type="button" onClick={() => handleAddPresetSeccion('animacion')} style={{ backgroundColor: '#1c7ed6', margin: 0, fontSize: '0.85rem' }}>
                                                    🎵 + Agregar Animación
                                                </Button>
                                                <Button type="button" onClick={handleAddSeccion} style={{ backgroundColor: '#6c757d', margin: 0, fontSize: '0.85rem' }}>
                                                    📄 + Agregar Sección en Blanco
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </AdminSection>
                        )}

                        <h2>Servicios Opcionales</h2>
                        <ServiciosGrid>
                            {serviciosOpcionales.map(servicio => {
                                const isUniqueService = serviciosUnicos.includes(servicio.id);
                                const itemInCart = carrito.find(item => item.id === servicio.id);
                                const isInCart = !!itemInCart;
                                let shouldDisableButton = !selectedDate || (isUniqueService && isInCart);

                                if (isSpecialHoliday && (servicio.id === 5 || servicio.id === 12)) {
                                    shouldDisableButton = true;
                                }

                                if (servicio.id === 5) {
                                    const camarerasEnCarrito = carrito.filter(item => item.id === 5);
                                    const hayCamareraEnCarrito = camarerasEnCarrito.length > 0;
                                    const textoBoton = hayCamareraEnCarrito ? 'Agregar otra camarera' : 'Agregar Camarera';

                                    return (
                                        <ServicioCard key={servicio.id}>
                                            {hayCamareraEnCarrito && <QuantityBadge>{camarerasEnCarrito.length}</QuantityBadge>}
                                            <p className="nombre">{nombresServicios[5] || 'Camarera'}</p>
                                            <p className="precio">${parseInt(servicio.precio * 3) || 0} (3hs min.)</p>
                                            <Button onClick={() => agregarCamarera(servicio)} disabled={shouldDisableButton}>
                                                {textoBoton}
                                            </Button>
                                        </ServicioCard>
                                    );
                                }
                                return (
                                    <ServicioCard key={servicio.id}>
                                        {isInCart && <QuantityBadge>{itemInCart.cantidad}</QuantityBadge>}
                                        <p className="nombre">{servicio.nombre}</p>
                                        <p className="precio">${parseInt(servicio.precio) || 0}</p>
                                        <Button onClick={() => agregarAlCarrito(servicio)} disabled={shouldDisableButton}>
                                            Agregar
                                        </Button>
                                    </ServicioCard>
                                );
                            })}
                            {selectedDate && (
                                <ServicioCard>
                                    {carrito.find(item => [2, 4].includes(item.id)) && <QuantityBadge>{carrito.find(item => [2, 4].includes(item.id)).cantidad}</QuantityBadge>}
                                    <p className="nombre">Hora Extra</p>
                                    <p className="precio">${isFeriado(selectedDate) || selectedDate.getDay() === 0 || selectedDate.getDay() === 6 || (selectedDate.getDay() === 5 && activeScheduleStructure !== 'fixed')
                                        ? parseInt(prices.horaExtraFinde) || 0
                                        : parseInt(prices.horaExtraPromo) || 0
                                    }</p>
                                    <Button onClick={() => {
                                        const isWeekend = isFeriado(selectedDate) || selectedDate.getDay() === 0 || selectedDate.getDay() === 6 || (selectedDate.getDay() === 5 && activeScheduleStructure !== 'fixed');
                                        const horaExtraService = {
                                            id: isWeekend ? 4 : 2,
                                            nombre: isWeekend ? removePriceFromTitle(String(nombresServicios[4]) || 'Hora Extra Finde') : removePriceFromTitle(String(nombresServicios[2]) || 'Hora Extra Promo'),
                                            precio: isWeekend ? prices.horaExtraFinde : prices.horaExtraPromo,
                                        };
                                        agregarAlCarrito(horaExtraService);
                                    }} disabled={!selectedDate}>
                                        Agregar
                                    </Button>
                                </ServicioCard>
                            )}
                        </ServiciosGrid>

                    </ContentWrapper>

                    <RightColumn>
                        <DesktopOnly>
                            {renderRefuerzoUI()}
                        </DesktopOnly>
                        <div className="carrito-section">
                            <CarritoPresupuesto
                                carrito={customizedCarrito}
                                currentBudgetId={currentBudgetId}
                                selectedDate={selectedDate}
                                handleDateChange={handleDateChange}
                                orangeHolidayDates={orangeHolidayDates}
                                currentMonth={currentMonth}
                                inputValue101={inputValue101}
                                removePriceFromTitle={removePriceFromTitle}
                                eliminarDelCarrito={eliminarDelCarrito}
                                agregarAlCarrito={agregarAlCarrito}
                                serviciosUnicos={serviciosUnicos}
                                modificarHorasCamarera={modificarHorasCamarera}
                                formData={formData}
                                subtotal={subtotal}
                                montoDescuento={montoDescuento}
                                totalFinal={totalFinal}
                                restante={restante}
                                isAdmin={isAdmin}
                                showImportUI={showImportUI}
                                setShowImportUI={setShowImportUI}
                                urlToImport={urlToImport}
                                setUrlToImport={setUrlToImport}
                                handleImportFromUrl={handleImportFromUrl}
                                generarResumenBtnRef={generarResumenBtnRef}
                                generarTextoPlano={generarTextoPlano}
                                generarYCopiarLinkCompartible={generarYCopiarLinkCompartible}
                                showLoadInput={showLoadInput}
                                setShowLoadInput={setShowLoadInput}
                                hasUnsavedChanges={hasUnsavedChanges}
                                handleResetOrDelete={handleResetOrDelete}
                                handleGuardar={guardarPresupuesto}
                                handleGenerarRecibo={handleGenerarRecibo}
                                verListaDePrecios={verListaDePrecios}
                                canGeneratePDF={canGeneratePDF}
                                handleOpenPDFPreview={handleOpenPDFPreview}
                                setShowTemplateEditor={setShowTemplateEditor}
                                onHacerFactura={() => setIsAfipModalOpen(true)}
                                onAnularFactura={handleAnularFactura}
                                facturaInfo={facturaInfo}
                                handlePrintTicket={handlePrintTicket}
                                onOpenMoveModal={() => {
                                    setTargetMoveDate(null);
                                    setShowMoveModal(true);
                                }}
                            />
                        </div>
                    </RightColumn>
                </MainLayout >
            </Section >

            {/* === PDF Preview Modal === */}
            {showPDFPreview && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    overflowY: 'auto', padding: '20px',
                }}>
                    <div style={{
                        display: 'flex', gap: '10px', marginBottom: '15px',
                        position: 'sticky', top: 0, zIndex: 10000,
                        backgroundColor: 'rgba(0,0,0,0.85)', padding: '10px 20px',
                        borderRadius: '8px',
                    }}>
                        <Button onClick={handleExportImage} style={{ width: 'auto', margin: 0 }}>
                            📷 Descargar Imagen
                        </Button>
                        <Button onClick={handleExportPDF} style={{ width: 'auto', margin: 0 }}>
                            📄 Descargar PDF
                        </Button>
                        <Button onClick={() => setShowPDFPreview(false)}
                            style={{ width: 'auto', margin: 0, backgroundColor: '#6c757d' }}>
                            ✕ Cerrar
                        </Button>
                    </div>
                    <PresupuestoPDF
                        ref={pdfContainerRef}
                        formData={formData}
                        carrito={customizedCarrito}
                        selectedDate={selectedDate}
                        siteName={siteName}
                        seccionesPDF={seccionesPDF}
                        config={pdfTemplateConfig}
                        isAdmin={isAdmin && !isExporting}
                        isExporting={isExporting}
                        onUpdateConfig={handleInlineUpdateConfig}
                    />
                </div>
            )}

            {/* === Template Editor Modal === */}
            {showTemplateEditor && tempTemplateConfig && (
                <TemplateEditorModal
                    setShowTemplateEditor={setShowTemplateEditor}
                    tempTemplateConfig={tempTemplateConfig}
                    editorActiveTab={editorActiveTab}
                    setEditorActiveTab={setEditorActiveTab}
                    handleUpdateTempConfig={handleUpdateTempConfig}
                    handleUpdateArrayItem={handleUpdateArrayItem}
                    handleRemoveArrayItem={handleRemoveArrayItem}
                    handleAddArrayItem={handleAddArrayItem}
                    handleRestoreDefaultTemplateConfig={handleRestoreDefaultTemplateConfig}
                    handleSaveTemplateConfig={handleSaveTemplateConfig}
                />
            )}



            {/* === AFIP Modal === */}
            {isAfipModalOpen && (
                <Modal isOpen={true} onClose={() => !isBilling && setIsAfipModalOpen(false)} title="Facturar en AFIP">
                    <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', fontSize: '0.85rem', color: '#e65100' }}>
                        Atención: Una vez emitida, la factura <strong>no se puede anular</strong> desde esta app.
                    </div>

                    <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#666' }}>Fecha del Evento:</span>
                                <strong>{selectedDate ? selectedDate.toLocaleDateString('es-AR') : 'Sin fecha'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#666' }}>Cliente:</span>
                                <strong>{formData.nombreCliente || 'Sin nombre'}</strong>
                            </div>
                            {formData.razonSocial && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#666' }}>Razón Social (ARCA):</span>
                                    <strong style={{ color: '#2e7d32' }}>{formData.razonSocial}</strong>
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#666' }}>Facturador (Emisor):</span>
                                <select
                                    value={afipForm.emisor}
                                    onChange={(e) => setAfipForm({ ...afipForm, emisor: e.target.value })}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
                                >
                                    <option value="maria">María Luisa (Consumidor Final)</option>
                                    <option value="juan">Juan Ignacio (Empresa)</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#666' }}>Tipo Documento:</span>
                                <select
                                    value={afipForm.docTipo}
                                    onChange={(e) => setAfipForm({ ...afipForm, docTipo: e.target.value })}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }}
                                >
                                    <option value="99">Consumidor Final (Sin identificar)</option>
                                    <option value="96">DNI</option>
                                    <option value="80">CUIT</option>
                                </select>
                            </div>

                            {afipForm.docTipo !== '99' && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#666' }}>Nro. Documento:</span>
                                        <input
                                            type="number"
                                            value={afipForm.docNro}
                                            onChange={(e) => setAfipForm({ ...afipForm, docNro: e.target.value })}
                                            style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '120px', textAlign: 'right' }}
                                            placeholder="Ej: 20111111112"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                        <span style={{ color: '#666' }}>Razón Social (Opcional):</span>
                                        <input
                                            type="text"
                                            value={afipForm.razonSocial}
                                            onChange={(e) => setAfipForm({ ...afipForm, razonSocial: e.target.value })}
                                            style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '150px', textAlign: 'right' }}
                                            placeholder="Dejar vacío para ARCA"
                                        />
                                    </div>
                                </>
                            )}

                            <div style={{ marginTop: '4px', borderTop: '2px solid #e65100', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>Total a Facturar:</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e65100' }}>
                                    ${typeof totalFinal !== 'undefined' ? Number(totalFinal).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0.00'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => {
                                setIsAfipModalOpen(false);
                                setSearchParams(prev => {
                                    const newParams = new URLSearchParams(prev);
                                    newParams.delete('facturar');
                                    return newParams;
                                });
                            }}
                            style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            disabled={isBilling}
                        >
                            Cancelar y editar
                        </button>
                        <button
                            onClick={handleFacturarAFIP}
                            style={{ padding: '8px 16px', background: isBilling ? '#999' : '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: isBilling ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                            disabled={isBilling}
                        >
                            {isBilling ? 'Generando...' : 'Confirmar y Emitir Factura'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* === Modal para Mover Evento de Fecha === */}
            {showMoveModal && (
                <Modal
                    isOpen={true}
                    onClose={() => !isMoving && setShowMoveModal(false)}
                    title="🗓️ Mover Evento / Presupuesto de Fecha"
                >
                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Tarjeta de información del evento actual */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
                            <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '6px', fontSize: '0.95rem' }}>
                                📋 Evento a Mover
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.45' }}>
                                <div><strong>Cliente:</strong> {formData.nombreCliente || 'Sin nombre cargado'}</div>
                                <div><strong>Fecha actual:</strong> {selectedDate ? format(selectedDate, "eeee d 'de' MMMM 'de' yyyy", { locale: es }) : 'Sin fecha'}</div>
                                <div><strong>Horario / Evento:</strong> {formData.descripcionEvento || 'Sin descripción'} ({formData.inicioEvento || '?'}:00 a {formData.finEvento || '?'}:00 hs)</div>
                                <div><strong>Seña abonada:</strong> ${formData.seña || 0} (Restante: ${restante.toFixed(0)})</div>
                            </div>
                        </div>

                        {/* Explicación del procedimiento */}
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 14px' }}>
                            <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '6px', fontSize: '0.9rem' }}>
                                ℹ️ ¿Cómo funciona el procedimiento?
                            </div>
                            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#1e3a8a', lineHeight: '1.45' }}>
                                <li>Seleccioná la <strong>nueva fecha</strong> de destino en el calendario inferior.</li>
                                <li>Toda la información (cliente, montos, seña, adicionales y notas) se trasladará automáticamente a la nueva fecha.</li>
                                <li><strong>La fecha anterior quedará 100% liberada</strong> en la base de datos del sitio.</li>
                                <li>Se creará un aviso en tu <strong>Buzón de Notificaciones 🔔</strong> con accesos directos para que puedas mover el evento en Google Calendar y finalizar el proceso.</li>
                            </ol>
                        </div>

                        {/* Selector de nueva fecha */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                            <label htmlFor="targetMoveDateInput" style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1f2937' }}>
                                📅 Seleccionar Nueva Fecha de Destino:
                            </label>
                            <input
                                id="targetMoveDateInput"
                                type="date"
                                value={targetMoveDate ? format(targetMoveDate, 'yyyy-MM-dd') : ''}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const parts = e.target.value.split('-');
                                        const newD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                        setTargetMoveDate(newD);
                                    } else {
                                        setTargetMoveDate(null);
                                    }
                                }}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '2px solid #0284c7',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    backgroundColor: '#fff'
                                }}
                            />
                            {targetMoveDate && (
                                <div style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 'bold', marginTop: '2px' }}>
                                    👉 Nueva fecha: {format(targetMoveDate, "eeee d 'de' MMMM 'de' yyyy", { locale: es })}
                                </div>
                            )}
                        </div>

                        {/* Botones de acción */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setShowMoveModal(false)}
                                disabled={isMoving}
                                style={{
                                    padding: '9px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    color: '#475569',
                                    fontSize: '0.88rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={!targetMoveDate || isMoving}
                                onClick={() => handleConfirmMove(targetMoveDate)}
                                style={{
                                    padding: '9px 18px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: (!targetMoveDate || isMoving) ? '#94a3b8' : '#0284c7',
                                    color: '#fff',
                                    fontSize: '0.88rem',
                                    fontWeight: 'bold',
                                    cursor: (!targetMoveDate || isMoving) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {isMoving ? 'Moviendo...' : '✓ Confirmar y Mover Evento'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}


