import { useLoading } from '../../contexts/LoadingContext';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSwipeable } from 'react-swipeable';
import { useAuth } from "../../contexts/authContext";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import styled, { keyframes } from "styled-components";
import esLocale from '@fullcalendar/core/locales/es';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAvailability } from "../../contexts/AvailabilityContext";
import { getAvailableVisitSlots } from "../../utils/visitScheduler"; // AÑADIDO
import { toast } from 'react-toastify';
import { getDatabase, ref, get, update, set } from "firebase/database";
import { app } from "../../firebase/firebase";
import { safeStorage } from "../../utils/safeStorage";
import { detectBudgetSena } from "../../utils/senaDetector";
import { calculateDecoracionTime, getBudgetServicesList } from "../../utils/summaryGenerator";

// --- DEFINICIONES DE ESTILO (SE MANTIENEN IGUAL) ---

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 10px;
  pointer-events: none;
`;

const Spinner = styled.div`
  border: 8px solid var(--app-background-color);
  border-top: 8px solid var(--primary-color);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${spin} 1.5s linear infinite;
`;

const LoadingText = styled.p`
  margin-top: 20px;
  font-size: 1.2rem;
  color: var(--primary-text);
  font-family: 'product_sansregular';
`;

const Section = styled.section`
position: relative; /* Importante: Para que LoadingOverlay se posicione correctamente dentro de esta sección */
width: 100%;
margin: auto;
padding-top: 2rem;
min-height: 200px;
overflow: hidden;
border-radius: 10px;

::-webkit-scrollbar{
color: var(--app-text-color, #000);
display: none;
border-radius: 10px;
}



  .fc-day-other {
  background-color:rgba(192, 192, 192, 0.20)!important;
  opacity: 1 !important;
  cursor: not-allowed !important;
 
}
  .fc-day-today {
  background-color:var(--card-grey)!important;
  opacity: 1 !important;
  cursor: pointer;
 
}

  /* Asegurarse de que el número del día sea visible pero no destaque */
  .fc-day-other .fc-daygrid-day-top {
    color:  rgba(255, 255, 255, 0); /* Fondo blanco semitransparente */
  }


  .fc-center {
  justify-content: center;
  border-radius: 10px;
  margin: auto;
  }

  .calendar-title {
    font-family: 'product_sansregular';
    font-size: 2rem;
    color: var(--primary-text);
    text-align: center;
    margin: 10px 0 15px 0;
    text-transform: capitalize;
  }
  @media screen and (min-width: 280px) and (max-width: 1080px) {
    .calendar-title {
      font-size: 1.6rem;
    }
  }

  .fc-toolbar h2 {
    font-family: 'product_sansregular';
    font-size: 2rem;
    color: var(--primary-text);
    justify-content: center;
    text-align: center;

  }
    /* --- ESTILO PARA REDONDEAR LA PARTE SUPERIOR DEL CALENDARIO --- */
  .fc-view-harness {
    color: var(--primary-text); /* Color de borde */
    border-top-left-radius: 10px;   /* Ajusta este valor para que coincida con el border-radius de Section */
    border-top-right-radius: 10px; /* Ajusta este valor para que coincida con el border-radius de Section */
    overflow: hidden; /* Es buena idea añadir esto también aquí para asegurar el recorte de los hijos */
  }

  /* Fix for FullCalendar width bug with CSS zoom */
  .fc-scrollgrid,
  .fc-scrollgrid-sync-table,
  .fc-view > table,
  .fc-col-header,
  .fc-daygrid-body,
  .fc-daygrid-body > table {
    width: 100% !important;
  }
  
  .fc-scrollgrid-sync-table col,
  .fc-col-header col,
  .fc-view colgroup col {
    width: 14.28% !important; /* Fuerza a que cada una de las 7 columnas ocupe lo mismo */
  }

  .fc-col-header-cell-cushion {
  color: var(--primary-color); 
  }
  /* --- FIN DE ESTILO PARA REDONDEAR --- */

  /* --- ESTILOS PARA LOS BOTONES DE NAVEGACIÓN --- */
  .fc-prev-button,
  .fc-next-button,
  .fc-customNext-button {


    width: 16rem; /* Ancho del botón */
    border-radius: 10px; /* Bordes redondeados */
    text-align: center;
    align-items: center;
    margin: auto;
    padding: 0.5rem; /* Espaciado interno */
  }
.fc-prev-button[disabled],
  .fc-next-button[disabled],
  .fc-customNext-button[disabled],
  .fc-disabled-next {
    background-color: var(--primary-color); /* Color de fondo más apagado para deshabilitado */
    border-color: var(--app-background-color); /* Color de borde más apagado */
    color: var(--app-background-color) !important; /* Color de ícono más apagado */
    opacity: 0.65 !important; /* Opacidad reducida para indicar que está deshabilitado */
    cursor: not-allowed !important;
    /* Importante: Asegúrate de que estas propiedades no alteren el tamaño.
        Heredarán width, padding, box-sizing de la regla general. */
  }
  .fc-prev-button:hover,
  .fc-next-button:hover,
  .fc-customNext-button:hover {
    background-color: var(--primary-color); /* Un poco más claro al pasar el mouse */
    border-color: var(--primary-color);
  }

  /* Para el botón "Hoy"*/
  .fc-today-button {
    background-color:var(--primary-color);
    color: white !important;
    border: 1px solid var(--primary-color);
    border-radius: 10px; /* Bordes redondeados */
    text-transform: capitalize !important; /* Para que "today" aparezca como "Hoy" o similar si el locale lo permite */
  }

  .fc-today-button:hover {
    background-color:var(--primary-text);
    border-color:var(--primary-color);
  }

  /* Estilos para botones deshabilitados en estados interactivos (para asegurar que no cambien) */
.fc-prev-button[disabled]:hover,
.fc-prev-button[disabled]:active,
.fc-prev-button[disabled]:focus,
.fc-next-button[disabled]:hover,
.fc-next-button[disabled]:active,
.fc-next-button[disabled]:focus,
.fc-customNext-button[disabled]:hover,
.fc-customNext-button[disabled]:active,
.fc-customNext-button[disabled]:focus,
.fc-disabled-next:hover,
.fc-disabled-next:active,
.fc-disabled-next:focus {
  /* Heredan los estilos de disabled, pero nos aseguramos de que no haya efectos de hover/active/focus */
  background-color: var(--disabled-bg, #757575) !important;
  border-color: var(--disabled-border, #606060) !important;
  color: var(--disabled-icon-color, #adadad) !important;
  box-shadow: none !important;
  transform: none !important;
  cursor: not-allowed !important;
}
  /* --- FIN DE ESTILOS PARA BOTONES --- */

  .calEvents2 {
  border: none;
  height: 0px;
  transform: translateY(1rem);
  width: 100%; /* Cambiado de 1rem a 100% para ocupar el ancho */
  pointer-events: none;
  color:var(--primary-color);
  display: flex; /* Usar flexbox para control de alineación */
  justify-content: flex-end; /* Alinear a la derecha */
  padding-right: 5px; /* Un poco de margen a la derecha */

  .eventTitle {
    color:var(--primary-color);
    font-size: 0.6rem;
    font-weight: bold;
    cursor: auto;
    z-index: 0;
    margin-left: 0;
    border: none;
    pointer-events: none;
  }
}
  
.calEvents {

display: none;

  cursor:not-allowed; 

  &:hover {

    cursor:not-allowed; 

  }
}

@media screen and (min-width: 280px) and (max-width: 1080px) {
padding-top: 1rem;
width: 65%;
margin:auto;
height: auto;
text-overflow: ellipsis;
}
.fc-toolbar h2 {
  font-family: 'product_sansregular';
  font-size: 1.6rem;
  color: var(--primary-text);
  justify-content: center;
  text-align: center;

  }
.fc-col-header-cell {
  font-size: 0.7rem; /
}
  .fc-prev-button,
  .fc-next-button,
  .fc-customNext-button {

    background-color: var(--primary-text);/* Color de fondo oscuro como en la imagen */
    color: white !important; /* Color del ícono (flecha) */
    border: 2px solid var(--app-background-color); /* Borde del mismo color */
    box-shadow: none !important; /* Opcional: quitar sombras por defecto */
    text-shadow: none !important; /* Opcional: quitar sombras de texto por defecto */
    opacity: 1 !important; /* Asegurar que no esté translúcido por defecto */
    width: 7rem; /* Ancho del botón */
    height: 2.2rem; /* Altura del botón */
    font-size: 0.6rem; /* Tamaño de fuente */
    border-radius: 10px; /* Bordes redondeados */
    text-align: center;
    align-items: center;
    margin: auto;
    padding: 0.5rem; /* Espaciado interno */
  }
`;

const renderEventContent = (eventInfo) => {
    

    if (eventInfo.event.title === "feriado") {
        return (
            <div>
                <div className="eventTitle">feriado</div>
            </div>
        );
    } else if (eventInfo.event.title === "Ocupado") {
        return (
            <div>
                <div className="eventTitle">Ocupado</div>
            </div>
        );
    }
    return null;
};

// Helper: format phone number for WhatsApp wa.me link
const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    // If it starts with 0, remove leading 0 and prepend 549
    if (digits.startsWith('0')) {
        digits = '549' + digits.slice(1);
    }
    // If it doesn't start with country code, prepend 549 (Argentina)
    if (!digits.startsWith('54')) {
        digits = '549' + digits;
    }
    // Ensure it has 54 + 9 for mobile
    if (digits.startsWith('54') && !digits.startsWith('549')) {
        digits = '549' + digits.slice(2);
    }
    return digits.length >= 10 ? digits : null;
};


// --- COMPONENTE PRINCIPAL ---

export default function Calendar() {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { userLoggedIn, currentUser } = useAuth(); // ADDED currentUser
    const { calendarEvents, availableSlotsEvents, isLoading, calendarEndDate, getDateInfo, isCalendarError, activeScheduleStructure } = useAvailability();
    const [whatsappNumber, setWhatsappNumber] = useState('');

    useEffect(() => {
        const fetchWhatsapp = async () => {
            const db = getDatabase(app);
            try {
                const snapshot = await get(ref(db, 'datosId/25'));
                if (snapshot.exists() && snapshot.val().whatsapp_text) {
                    const whatsappText = snapshot.val().whatsapp_text;
                    const numberMatch = whatsappText.match(/(\d{2}-\d{4}-\d{4})/);
                    if (numberMatch) {
                        let number = numberMatch[0].replace(/-/g, '');
                        if (!number.startsWith('549')) {
                            number = '549' + number;
                        }
                        setWhatsappNumber(number);
                    }
                }
            } catch (err) {
                console.error("Error fetching whatsapp in Calendar:", err);
            }
        };
        fetchWhatsapp();
    }, []);

    const calendarRef = useRef(null);


    // --- ADMIN & LOCAL BUDGETS LOGIC ---
    const [isAdmin, setIsAdmin] = useState(false);
    const [localBudgetsData, setLocalBudgetsData] = useState({}); // Changed from Set to Object
    const [sueldosHistorialData, setSueldosHistorialData] = useState([]);
    const [gastosMensualesData, setGastosMensualesData] = useState({});
    const [clickedCardInfo, setClickedCardInfo] = useState(null); // { dateStr, x, y, budget, gcalEvents, presupuestoId }

    const closeActionCard = useCallback(() => {
        setClickedCardInfo(null);
        if (window.history.state && window.history.state.calendarActionCard) {
            window.history.back();
        }
    }, []);

    // Interceptar el botón "Atrás" de Android / gestos de navegación para cerrar el modal
    useEffect(() => {
        const handlePopState = () => {
            setClickedCardInfo(null);
        };
        if (clickedCardInfo) {
            if (!window.history.state || !window.history.state.calendarActionCard) {
                window.history.pushState({ calendarActionCard: true }, '');
            }
            window.addEventListener('popstate', handlePopState);
        }
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [Boolean(clickedCardInfo)]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (e.target.closest('.action-card-popup')) return;
            if (e.target.closest('.fc-event') || e.target.closest('.fc-daygrid-day') || e.target.closest('.fc-daygrid-day-top')) return;
            closeActionCard();
        };
        if (clickedCardInfo) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [clickedCardInfo, closeActionCard]);

    // --- OCCUPANCY PERCENTAGE STATE ---
    const [financialStats, setFinancialStats] = useState({ total: 0, cobrado: 0, faltaCobrar: 0, cobradoPorcentaje: 0, faltaCobrarPorcentaje: 0, sueldosPagados: 0, cargasSociales: 0, impuestos: 0, servicios: 0 });
    const [occupancyStats, setOccupancyStats] = useState({ weekday: 0, weekend: 0, total: 0 });
    const [eventTypeStats, setEventTypeStats] = useState([]); // New state for event types
    const [annualEventStats, setAnnualEventStats] = useState([]); // New state for annual event types
    const [showAnnualStats, setShowAnnualStats] = useState(false);
    const [calendarTitle, setCalendarTitle] = useState(""); // Toggle for annual vs monthly
    const [showStatsPanel, setShowStatsPanel] = useState(false); // Toggle for showing/hiding the whole stats panel
    const [currentMonthInfo, setCurrentMonthInfo] = useState({ month: '', year: '' });
    const [isFutureMonth, setIsFutureMonth] = useState(false);

    useEffect(() => {
        setIsAdmin(Boolean(currentUser && (
            currentUser.email === 'payo.juan.ignacio@gmail.com' ||
            currentUser.email?.includes('admin') ||
            currentUser.email?.includes('demo') ||
            userLoggedIn
        )));
    }, [currentUser, userLoggedIn]);

    useEffect(() => {
        if (!isAdmin) return;

        const fetchLocalBudgets = async () => {
            const db = getDatabase(app);
            // Optimization: Fetching 'presupuestos' might be heavy if there are years of data.
            // However, RTDB REST API shallow=true doesn't work well with deep nested structures for just leaf checking without known paths.
            // Given the structure presupuestos/YYYY/MM/DD/budgetID, we might need to fetch by year.
            // For now, let's fetch the current and next year to cover the visible calendar range mostly.

            const currentYear = new Date().getFullYear();
            const nextYear = currentYear + 1;

            // Occupancy Logic State
            // We define it here to be available for the component, but initialized/updated via datesSet

            const budgetsData = {};

            const fetchYear = async (year) => {
                const yearRef = ref(db, `presupuestos/${year}`);
                try {
                    const snapshot = await get(yearRef);
                    if (snapshot.exists()) {
                        const months = snapshot.val();
                        Object.keys(months).forEach(month => {
                            const days = months[month];
                            Object.keys(days).forEach(day => {
                                // If there are budgets for this day
                                if (days[day]) {
                                    const paddedMonth = month.toString().padStart(2, '0');
                                    const paddedDay = day.toString().padStart(2, '0');
                                    const dateKey = `${year}-${paddedMonth}-${paddedDay}`;
                                    const dayBudgets = Object.values(days[day]);
                                    const budgetKeys = Object.keys(days[day]);
                                    // Seleccionar el presupuesto con seña si hay varios, o el primero
                                    let selectedIndex = dayBudgets.findIndex(b => detectBudgetSena(b).hasSena);
                                    if (selectedIndex === -1) selectedIndex = 0;
                                    const selectedBudget = dayBudgets[selectedIndex];
                                    const selectedBudgetId = budgetKeys[selectedIndex];
                                    const senaInfo = detectBudgetSena(selectedBudget);

                                    budgetsData[dateKey] = {
                                        id: selectedBudgetId,
                                        descripcion: selectedBudget?.formData?.descripcionEvento || '',
                                        seña: senaInfo.senaAmount,
                                        hasSena: senaInfo.hasSena,
                                        senaSource: senaInfo.senaSource,
                                        totalFinal: parseFloat(selectedBudget?.totalFinal || 0),
                                        restante: parseFloat(selectedBudget?.restante || 0),
                                        nombreCliente: selectedBudget?.formData?.nombreCliente || '',
                                        telefono: selectedBudget?.formData?.telefono || '',
                                        inicioEvento: selectedBudget?.formData?.inicioEvento || '',
                                        finEvento: selectedBudget?.formData?.finEvento || '',
                                        horasPrevias: selectedBudget?.formData?.horasPrevias || '',
                                        carrito: selectedBudget?.carrito || [],
                                        formData: selectedBudget?.formData || {},
                                        facturado: selectedBudget?.facturado || false
                                    };
                                }
                            });
                        });
                    }
                } catch (err) {
                    console.error(`Error fetching budgets for ${year}`, err);
                }
            };

            const fetchSueldos = async () => {
                const sueldosRef = ref(db, 'sueldos_historial');
                try {
                    const snapshot = await get(sueldosRef);
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        // Convert object of objects to array
                        const sueldosArray = Object.keys(data).map(key => ({
                            id: key,
                            ...data[key]
                        }));
                        setSueldosHistorialData(sueldosArray);
                    }
                } catch (err) {
                    console.error("Error fetching sueldos", err);
                }
            };

            const fetchGastos = async () => {
                const gastosRef = ref(db, 'gastos_mensuales');
                try {
                    const snapshot = await get(gastosRef);
                    if (snapshot.exists()) {
                        setGastosMensualesData(snapshot.val());
                    }
                } catch (err) {
                    console.error("Error fetching gastos", err);
                }
            };

            await Promise.all([fetchYear(currentYear), fetchYear(nextYear), fetchSueldos(), fetchGastos()]);
            setLocalBudgetsData(budgetsData);
        };

        fetchLocalBudgets();
    }, [isAdmin]);

    // Calculate annual stats whenever localBudgetsData or currentMonthInfo changes
    useEffect(() => {
        if (!isAdmin || Object.keys(localBudgetsData).length === 0) return;

        const currentYearStr = currentMonthInfo.year ? currentMonthInfo.year.toString() : new Date().getFullYear().toString();
        const typeCounts = {};
        let totalEventsInYear = 0;

        Object.entries(localBudgetsData).forEach(([dateStr, budgetObj]) => {
            if (dateStr.startsWith(currentYearStr)) {
                const desc = budgetObj?.descripcion?.trim() || 'Sin descripción';
                typeCounts[desc] = (typeCounts[desc] || 0) + 1;
                totalEventsInYear++;
            }
        });

        const sortedTypes = Object.entries(typeCounts)
            .map(([type, count]) => ({
                type,
                percentage: Math.round((count / totalEventsInYear) * 100)
            }))
            .sort((a, b) => b.percentage - a.percentage);

        setAnnualEventStats(sortedTypes);
    }, [isAdmin, localBudgetsData, currentMonthInfo.year]);

    // Handle openDate parameter from Navbar notifications
    useEffect(() => {
        const openDate = searchParams.get('openDate');
        if (openDate && isAdmin && calendarEvents.length > 0 && Object.keys(localBudgetsData).length > 0) {
            // Find Google Calendar events for this date
            const eventsOnDate = calendarEvents.filter(event => {
                const eventStartStr = event.startStr || (event.start ? (typeof event.start === 'string' ? event.start : (event.start.date || event.start.dateTime)) : null);
                return eventStartStr && eventStartStr.slice(0, 10) === openDate && event.title === "Ocupado";
            }).map(evt => {
                const desc = evt.description || '';
                const title = evt.originalSummary || evt.title || '';
                const combined = `${title} ${desc}`;
                const phoneMatch = combined.match(/(\d{2,4}[-\s]?\d{4}[-\s]?\d{4})/)
                    || combined.match(/(\+?549?\d{10,})/)
                    || combined.match(/(\d{10,13})/);
                return { ...evt, extractedPhone: phoneMatch ? phoneMatch[0] : null };
            });

            const budget = localBudgetsData[openDate] || null;

            const fetchPresupuestoId = async () => {
                let presupuestoId = null;
                let budgetToUse = budget;
                const clickedDate = new Date(openDate + 'T00:00:00');
                const year = clickedDate.getFullYear();
                const month = (clickedDate.getMonth() + 1).toString().padStart(2, '0');
                const day = clickedDate.getDate().toString().padStart(2, '0');

                const db = getDatabase(app);
                const presupuestosRef = ref(db, `presupuestos/${year}/${month}/${day}`);
                try {
                    const snapshot = await get(presupuestosRef);
                    if (snapshot.exists()) {
                        const val = snapshot.val();
                        const budgetKeys = Object.keys(val);
                        const dayBudgets = Object.values(val);
                        let selectedIndex = dayBudgets.findIndex(b => detectBudgetSena(b).hasSena);
                        if (selectedIndex === -1) selectedIndex = 0;
                        presupuestoId = budgetKeys[selectedIndex];
                        const selectedBudget = dayBudgets[selectedIndex];
                        const senaInfo = detectBudgetSena(selectedBudget);
                        budgetToUse = {
                            id: presupuestoId,
                            descripcion: selectedBudget?.formData?.descripcionEvento || '',
                            seña: senaInfo.senaAmount,
                            hasSena: senaInfo.hasSena,
                            senaSource: senaInfo.senaSource,
                            totalFinal: parseFloat(selectedBudget?.totalFinal || 0),
                            restante: parseFloat(selectedBudget?.restante || 0),
                            nombreCliente: selectedBudget?.formData?.nombreCliente || '',
                            telefono: selectedBudget?.formData?.telefono || '',
                            inicioEvento: selectedBudget?.formData?.inicioEvento || '',
                            finEvento: selectedBudget?.formData?.finEvento || '',
                            horasPrevias: selectedBudget?.formData?.horasPrevias || '',
                            carrito: selectedBudget?.carrito || [],
                            formData: selectedBudget?.formData || {},
                            facturado: selectedBudget?.facturado || false
                        };
                    }
                } catch (error) {
                    console.error("Error al verificar presupuestos existentes para openDate:", error);
                }

                // Simulate a click by setting the clickedCardInfo
                setClickedCardInfo({
                    dateStr: openDate,
                    x: window.innerWidth / 2, // Centered horizontally
                    y: window.innerHeight / 2 - 150, // Centered vertically (adjusted for modal height)
                    budget: budgetToUse,
                    gcalEvents: eventsOnDate,
                    presupuestoId,
                    fallbackUrl: `/presupuesto?fecha=${openDate}`
                });

                // Remove openDate from URL so it doesn't trigger again on refresh
                setSearchParams((prev) => {
                    const params = new URLSearchParams(prev);
                    params.delete('openDate');
                    return params;
                }, { replace: true });
            };

            fetchPresupuestoId();
        }
    }, [searchParams, isAdmin, calendarEvents, localBudgetsData, setSearchParams]);

    const handlers = useSwipeable({
        onSwipedLeft: () => {
            if (calendarRef.current) {
                calendarRef.current.getApi().next();
            }
        },
        onSwipedRight: () => {
            if (calendarRef.current) {
                calendarRef.current.getApi().prev();
            }
        },
        trackMouse: true
    });

    const [activePriceVersion, setActivePriceVersion] = useState(null);
    useEffect(() => {
        const fetchActiveVersion = async () => {
            const db = getDatabase(app);
            const configRef = ref(db, 'config/activePriceVersion');
            try {
                const snapshot = await get(configRef);
                if (snapshot.exists()) {
                    setActivePriceVersion(snapshot.val());
                } else {
                    setActivePriceVersion(2); // Default
                }
            } catch (error) {
                console.error("Error fetching active price version:", error);
                setActivePriceVersion(2);
            }
        };
        fetchActiveVersion();
    }, []);

    const generarYCopiarLinkDePrecios = React.useCallback((clickedDateStr) => {
        const clickedDate = new Date(clickedDateStr + 'T00:00:00');
        const dayOfWeek = clickedDate.getDay();
        const day = clickedDate.getDate();
        const month = clickedDate.getMonth();

        const feriadoDates = calendarEvents
            .filter(ev => ev.title === "feriado")
            .map(ev => ev.start);

        const isFeriado = feriadoDates.some(feriado => {
            const feriadoDate = feriado.date || feriado.dateTime || feriado;
            return feriadoDate && feriadoDate.slice(0, 10) === clickedDateStr;
        });

        let alquilerId = null;
        if (day === 24 && month === 11) {
            alquilerId = 13;
        } else if (day === 31 && month === 11) {
            alquilerId = 14;
        } else if (isFeriado || dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
            alquilerId = 3;
        } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
            alquilerId = 1;
        }

        if (!alquilerId) {
            toast.error("No se pudo determinar el tipo de alquiler para la fecha.");
            return;
        }

        const params = new URLSearchParams();
        params.set('fecha', clickedDateStr);
        params.set('v', activePriceVersion || '2');
        params.set(`item_${alquilerId}_id`, alquilerId);
        params.set(`item_${alquilerId}_cantidad`, 1);

        const finalLink = `${window.location.origin}/precios?${params.toString()}`;

        if (isAdmin) {
            navigator.clipboard.writeText(finalLink)
                .then(() => {
                    toast.success("Link de lista de precios copiado al portapapeles");
                })
                .catch(err => {
                    console.error("❌ Error al copiar el link:", err);
                    toast.error("❌ Error al copiar el link.");
                });
        }
    }, [calendarEvents, activePriceVersion, isAdmin]);

    const handleImportCartClick = () => {
        const link = window.prompt("Pegá acá el link del carrito (ejemplo: https://.../precios10?fecha=...&c=...):");
        if (!link) return;

        try {
            // Handle both full URLs and relative paths dynamically
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://melishare-redirect-payo.web.app';
            const urlString = link.startsWith('http') ? link : `${baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
            const url = new URL(urlString);
            const queryParams = new URLSearchParams(url.search);
            const fechaStr = queryParams.get('fecha');

            if (!fechaStr) {
                alert("El link ingresado no contiene una fecha válida.");
                return;
            }

            // Check if the date is occupied
            const isOccupiedByEvent = calendarEvents.some(event => {
                const eventStartStr = event.startStr || (event.start ? (typeof event.start === 'string' ? event.start : (event.start.date || event.start.dateTime)) : null);
                return event.title === "Ocupado" && eventStartStr && eventStartStr.slice(0, 10) === fechaStr;
            });

            if (isOccupiedByEvent) {
                alert(`No se puede importar: La fecha ${fechaStr} ya se encuentra OCUPADA en el calendario.`);
                return;
            }

            // Navigate to the budget builder with all params from the link
            navigate(`/presupuesto?${queryParams.toString()}`);
            toast.success("Carrito importado correctamente.");

        } catch (e) {
            console.error("Error al parsear el link del carrito:", e);
            alert("El formato del link no es válido.");
        }
    };

    const handleEventClick = React.useCallback((arg) => {
        arg.jsEvent.preventDefault();
        if (arg.event.title === "Ocupado") {
            const date = arg.event.startStr;
            const formattedDate = format(new Date(date), 'EEEE d/M', { locale: es });
            // Logic for "Ocupado" events
        } else {
            // Logic for other event types (e.g., holidays)
        }
    }, []);

    const handleDateClick = React.useCallback(async (arg) => {
        arg.jsEvent.preventDefault();

        if (isLoading) return;

        if (arg.dayEl.classList.contains('fc-day-other')) return;

        const clickedDateStr = arg.dateStr;

        // Ocupado check for ALL users first
        const isOccupiedByEvent = calendarEvents.some(event => {
            const eventStartStr = event.startStr || (event.start ? (typeof event.start === 'string' ? event.start : (event.start.date || event.start.dateTime)) : null);
            return event.title === "Ocupado" && eventStartStr && eventStartStr.slice(0, 10) === clickedDateStr;
        });

        // Check if today
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isToday = clickedDateStr === todayStr;

        const hasLocalBudget = localBudgetsData[clickedDateStr] !== undefined;
        const isOccupiedForAdmin = isOccupiedByEvent || hasLocalBudget;
        const isOccupiedForPublic = isOccupiedByEvent;

        if (userLoggedIn) {
            if (isOccupiedForAdmin) {
                // If occupied and admin, show action card instead of navigating
                const clickedDate = new Date(clickedDateStr + 'T00:00:00');
                const year = clickedDate.getFullYear();
                const month = (clickedDate.getMonth() + 1).toString().padStart(2, '0');
                const day = clickedDate.getDate().toString().padStart(2, '0');

                // Get budget data from localBudgetsData
                const budget = localBudgetsData[clickedDateStr] || null;

                // Get GCal events for this date with phone extraction
                const eventsOnDate = calendarEvents.filter(event => {
                    const eventStartStr = event.startStr || (event.start ? (typeof event.start === 'string' ? event.start : (event.start.date || event.start.dateTime)) : null);
                    return eventStartStr && eventStartStr.slice(0, 10) === clickedDateStr && event.title === "Ocupado";
                }).map(evt => {
                    const desc = evt.description || '';
                    const title = evt.originalSummary || evt.title || '';
                    const combined = `${title} ${desc}`;
                    const phoneMatch = combined.match(/(\d{2,4}[-\s]?\d{4}[-\s]?\d{4})/)
                        || combined.match(/(\+?549?\d{10,})/)
                        || combined.match(/(\d{10,13})/);
                    return { ...evt, extractedPhone: phoneMatch ? phoneMatch[0] : null };
                });

                // Try to fetch presupuesto ID and full budget details
                let presupuestoId = null;
                let budgetToUse = budget;
                const db = getDatabase(app);
                const presupuestosRef = ref(db, `presupuestos/${year}/${month}/${day}`);
                try {
                    const snapshot = await get(presupuestosRef);
                    if (snapshot.exists()) {
                        const val = snapshot.val();
                        const budgetKeys = Object.keys(val);
                        const dayBudgets = Object.values(val);
                        let selectedIndex = dayBudgets.findIndex(b => detectBudgetSena(b).hasSena);
                        if (selectedIndex === -1) selectedIndex = 0;
                        presupuestoId = budgetKeys[selectedIndex];
                        const selectedBudget = dayBudgets[selectedIndex];
                        const senaInfo = detectBudgetSena(selectedBudget);
                        budgetToUse = {
                            id: presupuestoId,
                            descripcion: selectedBudget?.formData?.descripcionEvento || '',
                            seña: senaInfo.senaAmount,
                            hasSena: senaInfo.hasSena,
                            senaSource: senaInfo.senaSource,
                            totalFinal: parseFloat(selectedBudget?.totalFinal || 0),
                            restante: parseFloat(selectedBudget?.restante || 0),
                            nombreCliente: selectedBudget?.formData?.nombreCliente || '',
                            telefono: selectedBudget?.formData?.telefono || '',
                            inicioEvento: selectedBudget?.formData?.inicioEvento || '',
                            finEvento: selectedBudget?.formData?.finEvento || '',
                            horasPrevias: selectedBudget?.formData?.horasPrevias || '',
                            carrito: selectedBudget?.carrito || [],
                            formData: selectedBudget?.formData || {},
                            facturado: selectedBudget?.facturado || false
                        };
                    }
                } catch (error) {
                    console.error("Error al verificar presupuestos existentes:", error);
                }

                // Position the card near the clicked cell
                const rect = arg.dayEl.getBoundingClientRect();
                setClickedCardInfo({
                    dateStr: clickedDateStr,
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 4,
                    budget: budgetToUse,
                    gcalEvents: eventsOnDate,
                    presupuestoId,
                    fallbackUrl: `/presupuesto?fecha=${clickedDateStr}`
                });
            } else {
                // If free and admin, copy link and navigate to create
                generarYCopiarLinkDePrecios(clickedDateStr);
                navigate(`/presupuesto?fecha=${clickedDateStr}`);
            }
        } else {
            // Non-logged-in user
            if (isOccupiedForPublic) {
                toast.info("La fecha seleccionada ya está ocupada.");
                return;
            }
            // If free and not admin, copy link and navigate to prices
            generarYCopiarLinkDePrecios(clickedDateStr);
            safeStorage.setItem('selectedDate', clickedDateStr);

            // Fix: Include version parameter to ensure correct price loading
            const vParam = activePriceVersion ? `?v=${activePriceVersion}` : '?v=2';
            navigate(`/precios${vParam}`);
        }
    }, [isLoading, calendarEvents, userLoggedIn, localBudgetsData, activePriceVersion, isAdmin, navigate, setClickedCardInfo, generarYCopiarLinkDePrecios]);

    const handleDatesSet = React.useCallback((dateInfo) => {
        setCalendarTitle(dateInfo.view.title);
        closeActionCard();
        if (!isAdmin) return;

        const calendarApi = dateInfo.view.calendar;
        const currentDate = calendarApi.getDate(); // Center date of the view

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        // month is 0-indexed (0 = Jan)

        const currentNow = new Date();
        const isFuture = year > currentNow.getFullYear() || (year === currentNow.getFullYear() && month > currentNow.getMonth());
        setIsFutureMonth(isFuture);

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let totalStats = {
            totalDays: 0,
            occupied: 0,
            weekdayDays: 0,
            weekdayOccupied: 0,
            weekendDays: 0,
            weekendOccupied: 0
        };

        for (let day = 1; day <= daysInMonth; day++) {
            const checkDate = new Date(year, month, day);
            const info = getDateInfo(checkDate);

            const isOccupied = info.status === 'Ocupado';

            totalStats.totalDays++;
            if (isOccupied) totalStats.occupied++;

            if (info.priceType === 'día de semana') {
                totalStats.weekdayDays++;
                if (isOccupied) totalStats.weekdayOccupied++;
            } else {
                // 'fin de semana o feriado'
                totalStats.weekendDays++;
                if (isOccupied) totalStats.weekendOccupied++;
            }
        }

        const stats = {
            total: totalStats.totalDays > 0 ? Math.round((totalStats.occupied / totalStats.totalDays) * 100) : 0,
            weekday: totalStats.weekdayDays > 0 ? Math.round((totalStats.weekdayOccupied / totalStats.weekdayDays) * 100) : 0,
            weekend: totalStats.weekendDays > 0 ? Math.round((totalStats.weekendOccupied / totalStats.weekendDays) * 100) : 0
        };

        setOccupancyStats(prev => (
            prev.total === stats.total &&
            prev.weekday === stats.weekday &&
            prev.weekend === stats.weekend
        ) ? prev : stats);

        // Calculate event type distribution
        const typeCounts = {};
        let totalEventsInMonth = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const checkDate = new Date(year, month, day);
            const info = getDateInfo(checkDate);

            // ONLY process statistics for OCCUPIED dates
            if (info.status === 'Ocupado') {
                const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const desc = localBudgetsData[dateStr]?.descripcion?.trim() || 'Sin descripción';
                typeCounts[desc] = (typeCounts[desc] || 0) + 1;
                totalEventsInMonth++;
            }
        }

        const sortedTypes = Object.entries(typeCounts)
            .map(([type, count]) => ({
                type,
                percentage: Math.round((count / totalEventsInMonth) * 100)
            }))
            .sort((a, b) => b.percentage - a.percentage);

        setEventTypeStats(prev => {
            if (prev.length !== sortedTypes.length) return sortedTypes;
            const isSame = prev.every((t, i) =>
                t.type === sortedTypes[i].type &&
                t.percentage === sortedTypes[i].percentage
            );
            return isSame ? prev : sortedTypes;
        });

        // Calculate financial statistics for the month
        let sumTotal = 0;
        let sumCobrado = 0;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        for (let day = 1; day <= daysInMonth; day++) {
            const checkDate = new Date(year, month, day);
            const info = getDateInfo(checkDate);

            if (info.status === 'Ocupado') {
                const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const budgetObj = localBudgetsData[dateStr];
                if (budgetObj && budgetObj.seña > 0) {
                    const totalFinal = budgetObj.totalFinal || 0;
                    sumTotal += totalFinal;
                    
                    if (checkDate < today) {
                        // If the party has passed, assume it's fully paid
                        sumCobrado += totalFinal;
                    } else {
                        sumCobrado += (budgetObj.seña || 0);
                    }
                }
            }
        }

        const sumFaltaCobrar = sumTotal - sumCobrado;
        const cobradoPorcentaje = sumTotal > 0 ? Math.round((sumCobrado / sumTotal) * 100) : 0;
        const faltaCobrarPorcentaje = sumTotal > 0 ? Math.round((sumFaltaCobrar / sumTotal) * 100) : 0;

        // Calculate sum of sueldos for the current month
        let sumSueldos = 0;
        if (sueldosHistorialData && sueldosHistorialData.length > 0) {
            sueldosHistorialData.forEach(sueldo => {
                const sueldoDate = new Date(sueldo.fecha_carga);
                if (sueldoDate.getFullYear() === year && sueldoDate.getMonth() === month) {
                    sumSueldos += parseFloat(sueldo.total || 0);
                }
            });
        }

        // Calculate sum of impuestos/gastos for the current month
        let sumCargasSociales = 0;
        let sumImpuestos = 0;
        let sumServicios = 0;
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        if (gastosMensualesData && gastosMensualesData[monthKey]) {
            Object.values(gastosMensualesData[monthKey]).forEach(gasto => {
                if (gasto.tipo === 'CARGA_SOCIAL') {
                    sumCargasSociales += parseFloat(gasto.monto || 0);
                } else if (gasto.tipo === 'IMPUESTO') {
                    sumImpuestos += parseFloat(gasto.monto || 0);
                } else if (gasto.tipo === 'FACTURA_SERVICIO') {
                    sumServicios += parseFloat(gasto.monto || 0);
                }
                // (Si hay recibos manuales en gastos_mensuales, se ignoran acá porque ya los suma sueldosHistorialData)
            });
        }

        setFinancialStats(prev => {
            if (prev.total === sumTotal && prev.cobrado === sumCobrado && prev.sueldosPagados === sumSueldos && prev.cargasSociales === sumCargasSociales && prev.impuestos === sumImpuestos && prev.servicios === sumServicios) return prev;
            return {
                total: sumTotal,
                cobrado: sumCobrado,
                faltaCobrar: sumFaltaCobrar,
                cobradoPorcentaje,
                faltaCobrarPorcentaje,
                sueldosPagados: sumSueldos,
                cargasSociales: sumCargasSociales,
                impuestos: sumImpuestos,
                servicios: sumServicios
            };
        });

        // Format month name
        const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
        const newMonthInfo = { month: monthName.charAt(0).toUpperCase() + monthName.slice(1), year };

        setCurrentMonthInfo(prev => (prev.month === newMonthInfo.month && prev.year === newMonthInfo.year) ? prev : newMonthInfo);

        // ACTUALIZACIÓN DE ESTADO VISUAL DE BOTÓN NEXT CUSTOMIZADO
        if (calendarRef.current && calendarEndDate) {
            const endLimitDate = new Date(calendarEndDate);
            const nextMonthAttempt = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

            // Usamos setTimeout para asegurar que FullCalendar haya terminado de renderizar la toolbar
            setTimeout(() => {
                const nextBtn = document.querySelector('.fc-customNext-button');
                if (nextBtn) {
                    if (nextMonthAttempt > endLimitDate) {
                        nextBtn.classList.add('fc-disabled-next');
                        nextBtn.style.backgroundColor = 'var(--primary-color)';
                        nextBtn.style.opacity = '0.65';
                        nextBtn.style.cursor = 'not-allowed';
                        nextBtn.style.borderColor = 'var(--app-background-color)';
                        nextBtn.style.color = 'var(--app-background-color)';
                    } else {
                        nextBtn.classList.remove('fc-disabled-next');
                        nextBtn.style.backgroundColor = '';
                        nextBtn.style.opacity = '1';
                        nextBtn.style.cursor = 'pointer';
                        nextBtn.style.borderColor = '';
                        nextBtn.style.color = '';
                    }
                }
            }, 100);
        }

    }, [isAdmin, getDateInfo, localBudgetsData, sueldosHistorialData, gastosMensualesData, calendarEndDate, setClickedCardInfo]);

    const handleCustomPrev = React.useCallback(() => {
        if (!calendarRef.current) return;
        calendarRef.current.getApi().prev();
    }, []);

    const handleCustomNext = React.useCallback(async () => {
        if (!calendarRef.current) return;
        const calendarApi = calendarRef.current.getApi();
        const currentDate = calendarApi.getDate();

        const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        const endLimit = calendarEndDate ? new Date(calendarEndDate) : null;

        if (endLimit && nextMonthDate > endLimit) {
            const monthDigit = nextMonthDate.getMonth() + 1; // 1 a 12
            let targetId = monthDigit;
            if (targetId >= 1 && targetId <= 6) {
                targetId += 12; // Ene-Jun -> 13-18
            }

            try {
                const db = getDatabase(app);
                const dbRef = ref(db, `datosId/${targetId}`);
                const snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const textoAlternativo = data.p_texto_alternativo_;

                    if (textoAlternativo && textoAlternativo.trim() !== '') {
                        toast.info(` ${textoAlternativo}`, { autoClose: 6000 });
                    } else {
                        toast.info(`Los precios para ${nextMonthDate.toLocaleString('es-ES', { month: 'long' })} todavía no están disponibles.`, { autoClose: 4000, hideProgressBar: true });
                    }
                } else {
                    toast.info(`Los precios para ${nextMonthDate.toLocaleString('es-ES', { month: 'long' })} todavía no están disponibles.`, { autoClose: 4000, hideProgressBar: true });
                }
            } catch (error) {
                console.error("Error obteniendo texto alternativo:", error);
            }
        } else {
            calendarApi.next();
        }
    }, [calendarEndDate]);

    const setting = React.useMemo(() => ({
        contentHeight: 'auto',
        eventClick: handleEventClick,
        dateClick: handleDateClick,
        locale: esLocale,
        initialView: "dayGridMonth",
        selectable: true,
        dayCellContent: (info) => {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>{info.dayNumberText}</span>
                    {info.isToday && <span style={{ color: 'green', fontSize: '0.65rem', fontWeight: 'bold' }}>hoy</span>}
                </div>
            );
        },
        showNonCurrentDates: true,
        fixedWeekCount: false,
        dayCellDidMount: (info) => {
            const date = info.date;
            const dateStr = date.toISOString().slice(0, 10);

            // Check for Google Calendar "Ocupado" events
            const eventsOnDate = calendarEvents.filter(event => {
                const eventStartStr = event.startStr || (event.start ? (typeof event.start === 'string' ? event.start : (event.start.date || event.start.dateTime)) : null);
                return eventStartStr && eventStartStr.slice(0, 10) === dateStr && event.title === "Ocupado";
            });

            const now = new Date();
            const isToday = date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();

            const isOccupiedInGCal = eventsOnDate.length > 0;

            // Check for Local Budget (Firebase)
            // We look if there is any budget path for this date
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            const matchesLocalBudget = localBudgetsData[dateKey] !== undefined;

            // Cursor de lápiz para administrador en días ocupados / editables
            const PENCIL_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' fill='%23fef08a' stroke='%231e293b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='m15 5 4 4' stroke='%231e293b' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 2 20, pointer`;

            if (isOccupiedInGCal) {
                info.el.style.setProperty('background-color', 'rgba(226, 220, 211, 0.6)', 'important'); // More opaque gray
                info.el.style.cursor = isAdmin ? PENCIL_CURSOR : 'not-allowed';
                const dayNumberElement = info.el.querySelector('.fc-daygrid-day-number');
                if (dayNumberElement) {
                    dayNumberElement.style.color = 'rgba(201, 196, 189, 0.6)'; // Lighter gray color for day number
                }
            } else if (date >= new Date()) {
                info.el.style.backgroundColor = '#fdfbf5';
                info.el.style.cursor = 'pointer';
            } else if (isAdmin) {
                info.el.style.cursor = PENCIL_CURSOR;
            }

            // --- ADMIN SYNC VISUALIZATION ---
            if (isAdmin && date > now) {
                if (isOccupiedInGCal && !isToday) {
                    // Check if event does not have "seña" or "sena" in title or description
                    const hasSena = eventsOnDate.some(event => {
                        const title = (event.originalSummary || '').toLowerCase();
                        const desc = (event.description || '').toLowerCase();
                        return title.includes('seña') || title.includes('sena') || desc.includes('seña') || desc.includes('sena');
                    });

                    if (!hasSena && eventsOnDate.length > 0) {
                        // SIN SEÑA: Event in GCal has no "seña" in title or description -> ORANGE BORDER
                        info.el.style.boxShadow = 'inset 0 0 0 2px #fd7e14';
                    } else if (matchesLocalBudget) {
                        // SYNCED: Local budget exists AND GCal is occupied -> GREEN BORDER
                        info.el.style.boxShadow = 'inset 0 0 0 2px #28a745';
                    } else {
                        // ORPHAN: No local budget BUT GCal is occupied -> AMBER/YELLOW BORDER
                        info.el.style.boxShadow = 'inset 0 0 0 2px #ffc107';
                    }
                } else if (matchesLocalBudget && !isOccupiedInGCal) {
                    const budgetItem = localBudgetsData[dateKey];
                    const hasConfirmedSena = (budgetItem?.seña > 0) || Boolean(budgetItem?.hasSena);
                    if (hasConfirmedSena) {
                        // NOT SYNCED: Confirmed budget (with deposit) exists BUT GCal is free -> PURPLE BORDER
                        info.el.style.boxShadow = 'inset 0 0 0 2px #8e44ad';
                    } else {
                        // PENDING BUDGET: Budget exists without deposit, and GCal is free -> LIGHT BLUE BORDER
                        info.el.style.boxShadow = 'inset 0 0 0 2px #17a2b8';
                    }
                }
            }


        },
        plugins: [
            dayGridPlugin,
            listPlugin,
            interactionPlugin,
        ],
        events: calendarEvents, // Pass the combined events directly
        customButtons: {
            customNext: {
                icon: 'chevron-right',
                click: handleCustomNext
            }
        },
        headerToolbar: false,
        eventTimeFormat: {
            locale: esLocale,
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short"
        },
        eventContent: renderEventContent,
        validRange: {
            start: new Date(),
            end: calendarEndDate
        },
        datesSet: handleDatesSet
    }), [handleEventClick, handleDateClick, calendarEvents, calendarEndDate, handleDatesSet, localBudgetsData, isAdmin, handleCustomNext]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const activeElement = document.activeElement;
            if (activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.isContentEditable
            )) {
                return;
            }

            if (event.key === 'ArrowRight') {
                handleCustomNext();
            } else if (event.key === 'ArrowLeft') {
                if (calendarRef.current) {
                    const calendarApi = calendarRef.current.getApi();
                    calendarApi.prev();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleCustomNext]);

    if (!calendarEndDate) {
        return (
            <Section id="calendario">
                <LoadingOverlay>
                    <Spinner />
                    <LoadingText>Cargando configuración del calendario...</LoadingText>
                </LoadingOverlay>
            </Section>
        );
    }

    return (
        <>
            <Section id="calendario" {...handlers}>
                {isCalendarError && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 100,
                        borderRadius: '10px',
                        padding: '2rem',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                    }}>
                        <span style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📅⚠️</span>
                        <h3 style={{ color: 'var(--primary-text)', fontFamily: 'product_sansregular', margin: '0 0 10px 0', fontSize: '1.4rem' }}>
                            Servicio de Calendario en Mantenimiento
                        </h3>
                        <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.5', maxWidth: '400px', marginBottom: '1.5rem', fontFamily: 'product_sansregular' }}>
                            No podemos consultar la disponibilidad de fechas en tiempo real en este momento debido a un mantenimiento técnico de la conexión con Google Calendar.
                        </p>
                        <a 
                            href={`https://wa.me/${whatsappNumber || '5491130123512'}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                                backgroundColor: '#25D366',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '25px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.95rem',
                                fontFamily: 'product_sansregular',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            💬 Consultar Disponibilidad por WhatsApp
                        </a>
                    </div>
                )}
                {isLoading && (
                    <LoadingOverlay>
                        <Spinner />
                        <LoadingText>Cargando fechas...</LoadingText>
                    </LoadingOverlay>
                )}
                {!isLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 className="calendar-title">
                            {calendarTitle.replace(' de ', ' ')}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {isAdmin ? (
                                <MainStatsToggleButton onClick={() => setShowStatsPanel(!showStatsPanel)} $active={showStatsPanel} style={{ margin: 0 }}>
                                    {showStatsPanel ? 'Ocultar estadísticas' : 'Ver estadísticas'}
                                </MainStatsToggleButton>
                            ) : (
                                <LegendItem style={{ margin: 0 }}>
                                    <OccupiedDayBox />
                                    <span>Día ocupado</span>
                                </LegendItem>
                            )}

                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button className="fc-prev-button fc-button fc-button-primary" onClick={handleCustomPrev} style={{ width: '6rem', padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <span className="fc-icon fc-icon-chevron-left"></span>
                                </button>
                                <button className="fc-next-button fc-button fc-button-primary" onClick={handleCustomNext} style={{ width: '6rem', padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <span className="fc-icon fc-icon-chevron-right"></span>
                                </button>
                            </div>

                            {isAdmin ? (
                                <MainStatsToggleButton onClick={handleImportCartClick} $active={false} style={{ margin: 0 }}>
                                    Importar Carrito
                                </MainStatsToggleButton>
                            ) : (
                                <LegendItem style={{ margin: 0 }}>
                                    <AvailableDayBox />
                                    <span>Día disponible</span>
                                </LegendItem>
                            )}
                        </div>
                    </div>
                )}
                {isAdmin && showStatsPanel && (
                    <OccupancyDisplay style={{ margin: '0 0 20px 0' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
                            <span style={{ fontWeight: 'bold' }}>Ocupación:</span>
                            <span>{activeScheduleStructure === 'fixed' ? 'Lun-Vie' : 'Lun-Jue'}: {occupancyStats.weekday}%</span>
                            <span>{activeScheduleStructure === 'fixed' ? 'Sáb-Dom y Fer' : 'Vie-Dom y Fer'}: {occupancyStats.weekend}%</span>
                            <span>Total: {occupancyStats.total}%</span>
                        </div>

                        {!showAnnualStats && (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
                                    <span>Cobrado: ${financialStats.cobrado.toLocaleString('es-AR')} ({financialStats.cobradoPorcentaje}%)</span>
                                    <span>Por cobrar: ${financialStats.faltaCobrar.toLocaleString('es-AR')} ({financialStats.faltaCobrarPorcentaje}%)</span>
                                    <span>Total: ${financialStats.total.toLocaleString('es-AR')}</span>
                                </div>
                                
                                {!isFutureMonth && (
                                    <>
                                        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginBottom: '10px', fontSize: '0.9rem', color: '#555' }}>
                                            <span>Sueldos: ${financialStats.sueldosPagados.toLocaleString('es-AR')}</span>
                                            <span>Impuestos: ${(financialStats.impuestos || 0).toLocaleString('es-AR')}</span>
                                            <span>Cargas Sociales: ${(financialStats.cargasSociales || 0).toLocaleString('es-AR')}</span>
                                            <span>Servicios: ${(financialStats.servicios || 0).toLocaleString('es-AR')}</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>
                                                Ganancia Neta: ${(financialStats.total - financialStats.sueldosPagados - (financialStats.impuestos || 0) - (financialStats.cargasSociales || 0) - (financialStats.servicios || 0)).toLocaleString('es-AR')}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                            <AnnualToggleButton
                                onClick={() => setShowAnnualStats(!showAnnualStats)}
                                $active={showAnnualStats}
                            >
                                {showAnnualStats ? 'Ver vista mensual' : 'Ver resumen anual'}
                            </AnnualToggleButton>
                        </div>

                        {!showAnnualStats ? (
                            <>
                                {eventTypeStats.length > 0 && (
                                    <>
                                        <OccupancyTitle>Distribución Mensual</OccupancyTitle>
                                        <DistributionBarContainer>
                                            {eventTypeStats.map((stat, index) => {
                                                const DISTRIBUTION_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC926', '#1982C4', '#6A4C93', '#F4A261', '#2A9D8F'];
                                                return (
                                                    <DistributionBarSegment 
                                                        key={index} 
                                                        $width={stat.percentage} 
                                                        $color={DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]}
                                                        data-tooltip={`${stat.type}: ${stat.percentage}%`}
                                                    />
                                                );
                                            })}
                                        </DistributionBarContainer>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                {annualEventStats.length > 0 ? (
                                    <>
                                        <OccupancyTitle>Distribución Anual</OccupancyTitle>
                                        <DistributionBarContainer>
                                            {annualEventStats.map((stat, index) => {
                                                const DISTRIBUTION_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC926', '#1982C4', '#6A4C93', '#F4A261', '#2A9D8F'];
                                                return (
                                                    <DistributionBarSegment 
                                                        key={index} 
                                                        $width={stat.percentage} 
                                                        $color={DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]}
                                                        data-tooltip={`${stat.type}: ${stat.percentage}%`}
                                                    />
                                                );
                                            })}
                                        </DistributionBarContainer>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', margin: '15px 0', color: '#666' }}>
                                        No hay datos anuales suficientes para mostrar distribución.
                                    </div>
                                )}
                            </>
                        )}
                    </OccupancyDisplay>
                )}
                {!isLoading && <FullCalendar {...setting} ref={calendarRef} />}
            </Section>

            {/* Action card on click for occupied dates (admin) */}
            {clickedCardInfo && createPortal(
                <>
                    <ActionCard className="action-card-popup" onClick={(e) => e.stopPropagation()} $x={clickedCardInfo.x} $y={clickedCardInfo.y}>
                        {/* Close button */}
                        <CardCloseButton onClick={closeActionCard}>✕</CardCloseButton>

                        {/* Date header */}
                        <CardDate>
                            📅 {(() => {
                                try {
                                    const [y, m, d] = clickedCardInfo.dateStr.split('-');
                                    return `${d}/${m}/${y}`;
                                } catch { return clickedCardInfo.dateStr; }
                            })()}
                        </CardDate>

                        {/* Action Buttons */}
                        <CardActions>
                            {/* WhatsApp button */}
                            {(() => {
                                const budgetPhone = clickedCardInfo.budget?.telefono && formatPhoneForWhatsApp(clickedCardInfo.budget.telefono);
                                const gcalPhone = clickedCardInfo.gcalEvents.find(e => e.extractedPhone)?.extractedPhone;
                                const resolvedPhone = budgetPhone || (gcalPhone && formatPhoneForWhatsApp(gcalPhone));
                                if (!resolvedPhone) return null;
                                return (
                                    <CardActionButton
                                        as="a"
                                        href={`https://wa.me/${resolvedPhone}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        $variant="whatsapp"
                                    >
                                        💬 WhatsApp
                                    </CardActionButton>
                                );
                            })()}
                            {/* Calendar button */}
                            {(() => {
                                const gcalEvent = clickedCardInfo.gcalEvents.find(e => e.htmlLink);
                                if (!gcalEvent || !gcalEvent.htmlLink) return null;
                                return (
                                    <CardActionButton
                                        as="a"
                                        href={gcalEvent.htmlLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        $variant="calendar"
                                    >
                                        📅 Calendar
                                    </CardActionButton>
                                );
                            })()}
                            {/* Edit budget button */}
                            <CardActionButton
                                onClick={() => {
                                    const targetUrl = clickedCardInfo.presupuestoId
                                        ? `/presupuesto/editar/${clickedCardInfo.presupuestoId}`
                                        : clickedCardInfo.fallbackUrl;
                                    setClickedCardInfo(null);
                                    navigate(targetUrl, { replace: true });
                                }}
                                $variant="edit"
                            >
                                ✏️ Editar presupuesto
                            </CardActionButton>
                            {/* Hacer/Ver factura button */}
                            {clickedCardInfo.presupuestoId && (
                                <CardActionButton
                                    onClick={() => {
                                        const isFacturado = clickedCardInfo.budget?.facturado || clickedCardInfo.budget?.facturadoManualmente;
                                        const targetUrl = `/presupuesto/editar/${clickedCardInfo.presupuestoId}${isFacturado ? '' : '?facturar=true'}`;
                                        setClickedCardInfo(null);
                                        navigate(targetUrl, { replace: true });
                                    }}
                                    $variant="factura"
                                >
                                    {clickedCardInfo.budget?.facturado || clickedCardInfo.budget?.facturadoManualmente ? '🧾 Ver facturas' : '🧾 Hacer factura'}
                                </CardActionButton>
                            )}
                        </CardActions>

                        {/* Event Summary - smart dedup */}
                        {(() => {
                            const budget = clickedCardInfo.budget;
                            const gcalEvents = clickedCardInfo.gcalEvents;

                            // Determine if GCal info differs from budget
                            const hasBudget = budget && (budget.nombreCliente || budget.descripcion);
                            const hasGcal = gcalEvents.length > 0;

                            let showGcalSeparately = false;
                            if (hasGcal && hasBudget) {
                                // Check if GCal says something different from budget by matching name and phone
                                const budgetName = (budget.nombreCliente || '').toLowerCase().trim();
                                const budgetPhoneClean = budget.telefono ? budget.telefono.replace(/\D/g, '') : '';

                                showGcalSeparately = gcalEvents.some(evt => {
                                    const gcalTitle = (evt.originalSummary || evt.title || '').toLowerCase();
                                    const gcalDesc = (evt.description || '').toLowerCase();

                                    // 1. Check if the GCal event contains the budget's client name
                                    const nameMatch = budgetName && (gcalTitle.includes(budgetName) || gcalDesc.includes(budgetName));

                                    // 2. Check if the GCal event contains the budget's telephone number (matching last 8 digits for robustness)
                                    let phoneMatch = false;
                                    if (budgetPhoneClean && budgetPhoneClean.length >= 8) {
                                        const last8Digits = budgetPhoneClean.slice(-8);
                                        phoneMatch = gcalTitle.replace(/\D/g, '').includes(last8Digits) || gcalDesc.replace(/\D/g, '').includes(last8Digits);
                                    }

                                    // If either name or phone matches, it is the same event (synced).
                                    // We only show GCal separately if it does NOT match the name AND does NOT match the phone.
                                    const isSameEvent = nameMatch || phoneMatch;
                                    return !isSameEvent;
                                });
                            }

                            return (
                                <CardSummary>
                                    {/* Budget info (preferred) */}
                                    {hasBudget && (() => {
                                        const decoracionTime = calculateDecoracionTime(budget);
                                        const servicios = getBudgetServicesList(budget);

                                        return (
                                        <CardSection>
                                            <CardSectionLabel>
                                                {showGcalSeparately ? 'Presupuesto Web' : 'Resumen del evento'}
                                            </CardSectionLabel>
                                            <CardInfoRow>
                                                <strong>Cliente:</strong> {budget.nombreCliente || 'Sin nombre'}
                                            </CardInfoRow>
                                            {budget.telefono && (
                                                <CardInfoRow>
                                                    <strong>Teléfono:</strong> {budget.telefono}
                                                </CardInfoRow>
                                            )}
                                            {budget.descripcion && (
                                                <CardInfoRow>
                                                    <strong>Evento:</strong> {budget.descripcion}
                                                </CardInfoRow>
                                            )}
                                            <CardInfoRow>
                                                <strong>Horario:</strong> {(budget.inicioEvento && budget.finEvento) ? `${budget.inicioEvento} a ${budget.finEvento} hs` : (budget.inicioEvento ? `desde ${budget.inicioEvento} hs` : 'a definir')}
                                            </CardInfoRow>
                                            {decoracionTime && (
                                                <CardInfoRow style={{ color: '#0369a1' }}>
                                                    <strong>Ingreso a decorar:</strong> {decoracionTime.isCustomText ? decoracionTime.text : `${decoracionTime.text || decoracionTime} hs`}
                                                </CardInfoRow>
                                            )}

                                            {/* Detalle completo de servicios / carrito */}
                                            {servicios.length > 0 && (
                                                <div style={{
                                                    margin: '8px 0',
                                                    padding: '8px 10px',
                                                    background: 'rgba(0, 0, 0, 0.03)',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(0, 0, 0, 0.05)'
                                                }}>
                                                    <div style={{
                                                        fontSize: '0.68rem',
                                                        fontWeight: 'bold',
                                                        color: '#666',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.3px',
                                                        marginBottom: '5px'
                                                    }}>
                                                        Servicios contratados:
                                                    </div>
                                                    {servicios.map((srv, idx) => (
                                                        <div key={idx} style={{
                                                            fontSize: '0.76rem',
                                                            color: '#333',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '2px 0'
                                                        }}>
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '6px' }}>
                                                                🔹 {srv.nombre}{srv.cantidad > 1 && srv.id !== 3 && srv.id !== 13 && srv.id !== 1 && srv.id !== 14 ? ` (x${srv.cantidad})` : ''}
                                                            </span>
                                                            {srv.precio > 0 ? (
                                                                <span style={{ fontWeight: '600', color: '#555', whiteSpace: 'nowrap' }}>
                                                                    ${srv.precio.toLocaleString('es-AR')}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <CardInfoRow>
                                                <strong>Total Final:</strong> ${(budget.totalFinal || 0).toLocaleString('es-AR')}
                                            </CardInfoRow>
                                            {budget.seña > 0 ? (
                                                <CardInfoRow>
                                                    <strong>Seña Abonada:</strong> ${budget.seña.toLocaleString('es-AR')}{budget.senaSource === 'text' ? ' (en descripción)' : ''}
                                                </CardInfoRow>
                                            ) : budget.hasSena ? (
                                                <CardInfoRow style={{ color: '#8e44ad', fontWeight: 'bold' }}>
                                                    Seña registrada en descripción / cliente
                                                </CardInfoRow>
                                            ) : (
                                                <CardInfoRow style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                                    Sin seña
                                                </CardInfoRow>
                                            )}
                                            {budget.totalFinal > 0 && budget.seña > 0 && (
                                                <CardInfoRow>
                                                    <strong>Restante por Cobrar:</strong> ${Math.max(0, (budget.totalFinal || 0) - (budget.seña || 0)).toLocaleString('es-AR')}
                                                </CardInfoRow>
                                            )}
                                            {clickedCardInfo.presupuestoId && (
                                                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input 
                                                        type="number" 
                                                        id="refuerzo-sena-input"
                                                        placeholder="Refuerzo de seña ($)" 
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                document.getElementById('btn-reforzar-sena')?.click();
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '6px 8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #ccc',
                                                            fontSize: '0.85rem',
                                                            flex: 1,
                                                            minWidth: 0,
                                                            boxSizing: 'border-box'
                                                        }}
                                                    />
                                                    <button
                                                        id="btn-reforzar-sena"
                                                        onClick={async () => {
                                                            const input = document.getElementById('refuerzo-sena-input');
                                                            const amount = parseFloat(input?.value);
                                                            if (isNaN(amount) || amount <= 0) {
                                                                toast.error("Ingresá un monto válido");
                                                                return;
                                                            }
                                                            try {
                                                                const currentSena = parseFloat(budget.seña || 0);
                                                                const newSena = currentSena + amount;
                                                                const totalFinal = parseFloat(budget.totalFinal || 0);
                                                                const newRestante = totalFinal - newSena;
                                                                
                                                                // Build correct Firebase path
                                                                const [year, month, day] = clickedCardInfo.dateStr.split('-');
                                                                const db = getDatabase(app);
                                                                const presupuestoPath = `presupuestos/${year}/${month}/${day}/${clickedCardInfo.presupuestoId}`;
                                                                
                                                                // Fetch full budget to generate summary
                                                                const snapshot = await get(ref(db, presupuestoPath));
                                                                if (snapshot.exists()) {
                                                                    const fullBudget = snapshot.val();
                                                                    
                                                                    // Update fullBudget object for summary generation
                                                                    if (fullBudget.formData) {
                                                                        fullBudget.formData.seña = newSena.toString();
                                                                    }
                                                                    fullBudget.restante = newRestante;
                                                                    
                                                                    // Generate and copy summary text
                                                                    const { generateSummaryText } = await import('../../utils/summaryGenerator');
                                                                    const summaryText = generateSummaryText(fullBudget);
                                                                    
                                                                    if (navigator.clipboard && window.isSecureContext) {
                                                                        navigator.clipboard.writeText(summaryText).catch(console.error);
                                                                    }
                                                                }
                                                                
                                                                // Update presupuesto with correct field paths
                                                                await update(ref(db, presupuestoPath), {
                                                                    'formData/seña': newSena.toFixed(0),
                                                                    restante: newRestante,
                                                                    fechaModificacion: new Date().toISOString()
                                                                });
                                                                
                                                                // Generate receipt
                                                                const receiptData = {
                                                                    dia_evento: parseInt(day, 10),
                                                                    mes_evento: parseInt(month, 10),
                                                                    anio_evento: parseInt(year, 10),
                                                                    nombre_cliente: budget.nombreCliente || '',
                                                                    seña: amount,
                                                                    seña_total: newSena,
                                                                    cuit: '',
                                                                    nombre_del_archivo: `${parseInt(day, 10)}-${parseInt(month, 10)}-${year}`,
                                                                    fecha_creacion: new Date().toISOString()
                                                                };
                                                                await set(ref(db, 'datosId/31'), receiptData);
                                                                
                                                                toast.success(`Seña reforzada: $${amount.toLocaleString('es-AR')}. Total: $${newSena.toLocaleString('es-AR')}`);
                                                                
                                                                // Open receipt in new tab respecting preference
                                                                const preferredModel = localStorage.getItem('receiptModel') || 'clasico';
                                                                window.open(preferredModel === 'infografico' ? '/templateReciboInfografia' : '/templateRecibo', '_blank', 'noopener');
                                                                
                                                                closeActionCard();
                                                            } catch (err) {
                                                                console.error(err);
                                                                toast.error("Error al reforzar la seña");
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            border: 'none',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        Ok
                                                    </button>
                                                </div>
                                            )}
                                        </CardSection>
                                    ); })()}

                                    {/* GCal info - only if different from budget OR no budget exists */}
                                    {(showGcalSeparately || (!hasBudget && hasGcal)) && (
                                        <CardSection $border={hasBudget}>
                                            <CardSectionLabel>Google Calendar</CardSectionLabel>
                                            {gcalEvents.map((evt, idx) => {
                                                const title = evt.originalSummary || evt.title || 'Ocupado';
                                                const desc = evt.description || '';
                                                const hasSena = `${title} ${desc}`.toLowerCase().includes('seña') || `${title} ${desc}`.toLowerCase().includes('sena');
                                                return (
                                                    <div key={idx} style={{ marginTop: idx > 0 ? '6px' : '0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                                            <CardInfoRow style={{ flex: 1 }}>
                                                                <strong>{title}</strong>
                                                            </CardInfoRow>
                                                            <Badge $bg={hasSena ? 'rgba(40,167,69,0.12)' : 'rgba(253,126,20,0.12)'} $fg={hasSena ? '#28a745' : '#fd7e14'}>
                                                                {hasSena ? 'Señado' : 'Falta seña'}
                                                            </Badge>
                                                        </div>
                                                        {desc && <CardInfoRow $muted>{desc}</CardInfoRow>}
                                                    </div>
                                                );
                                            })}
                                        </CardSection>
                                    )}

                                    {/* No info at all */}
                                    {!hasBudget && !hasGcal && (
                                        <CardInfoRow $muted>Sin información disponible</CardInfoRow>
                                    )}
                                </CardSummary>
                            );
                        })()}
                    </ActionCard>
                </>,
                document.body
            )}
        </>
    );
}

const AdminLegendContainer = styled.div`
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    padding: 1.2rem;
    margin: 20px auto;
    width: 100%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-sizing: border-box;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
    }
`;

const AdminLegendTitle = styled.h4`
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--primary-text);
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    padding-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const AdminLegendGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;

    @media (min-width: 576px) {
        grid-template-columns: 1fr 1fr;
    }
`;

const AdminLegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.85rem;
    color: #4a4a4a;
    line-height: 1.3;
`;

const ColorIndicator = styled.div`
    min-width: 16px;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 2px solid ${props => props.$color};
    background-color: ${props => props.$bgColor || 'transparent'};
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const LegendContainer = styled.div`
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
    padding: 10px;
    
    border-radius: 8px;
`;

const LegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: var(--primary-text);
`;

const OccupiedDayBox = styled.div`
    width: 20px;
    height: 20px;
    background-color: rgba(192, 192, 192, 0.60);
    border-radius: 4px;
`;

const AvailableDayBox = styled.div`
    width: 20px;
    height: 20px;
    background-color: #fdfbf5;
    border-radius: 4px;
    border: 1px solid #e0e0e0; /* Add a subtle border for contrast */
`;

const OccupancyDisplay = styled.div`
    margin-top: 15px;
    font-family: 'product_sansregular';
    color: var(--primary-text);
    background-color: rgba(255, 255, 255, 0.5);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--primary-color);
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    box-sizing: border-box;
    
    @media (min-width: 768px) {
        width: 100%;
    }
`;

const OccupancyTitle = styled.div`
    font-size: 1.1rem;
    font-weight: bold;
    text-align: center;
    margin-bottom: 12px;
    border-bottom: 1px solid rgba(0,0,0,0.1);
    padding-bottom: 8px;
    color: var(--primary-color);
`;

const StatsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    ${props => props.$rowOnDesktop && `
        @media (min-width: 768px) {
            flex-direction: row;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
    `}
`;

const StatItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
    font-size: 0.95rem;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
    
    &:last-child {
        border-bottom: none;
    }
    
    .label {
        font-weight: normal;
        text-align: left;
        word-break: break-word;
        flex: 1;
    }
    
    .value {
        font-weight: bold;
        white-space: nowrap;
        color: var(--primary-color);
    }
`;

const OccupancyStatsContainer = StatsContainer;

const DistributionBarContainer = styled.div`
    display: flex;
    width: 100%;
    height: 24px;
    border-radius: 12px;
    overflow: visible;
    margin-top: 10px;
    background-color: #e0e0e0;
`;

const DistributionBarSegment = styled.div`
    height: 100%;
    background-color: ${props => props.$color || 'var(--primary-color)'};
    width: ${props => props.$width}%;
    position: relative;
    cursor: pointer;
    transition: filter 0.2s;

    &:first-child {
        border-top-left-radius: 12px;
        border-bottom-left-radius: 12px;
    }

    &:last-child {
        border-top-right-radius: 12px;
        border-bottom-right-radius: 12px;
    }

    &:hover {
        filter: brightness(0.9);
    }

    &:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 5px;
        background-color: rgba(0, 0, 0, 0.85);
        color: #fff;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        white-space: nowrap;
        pointer-events: none;
        z-index: 100;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    &:hover::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 5px;
        border-style: solid;
        border-color: rgba(0, 0, 0, 0.85) transparent transparent transparent;
        pointer-events: none;
        z-index: 100;
    }
`;

const AnnualToggleButton = styled.button`
    background-color: ${props => props.$active ? 'var(--primary-text)' : 'transparent'};
    color: ${props => props.$active ? 'white' : 'var(--primary-text)'};
    border: 1px solid var(--primary-text);
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 0.8rem;
    cursor: pointer;
    font-family: 'product_sansregular';
    transition: all 0.2s ease;
    
    &:hover {
        background-color: var(--primary-text);
        color: white;
    }
`;

const MainStatsToggleButton = styled.button`
    background-color: ${props => props.$active ? 'var(--primary-color)' : 'white'};
    color: ${props => props.$active ? 'white' : 'var(--primary-color)'};
    border: 2px solid var(--primary-color);
    padding: 10px 25px;
    border-radius: 25px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    font-family: 'product_sansregular';
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        background-color: var(--primary-color);
        color: white;
    }
    
    &:active {
        transform: translateY(0);
    }
`;

// --- Action Card Styled Components ---

const ActionCardOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99998;
  background: rgba(0, 0, 0, 0.15);
  animation: overlayFadeIn 0.15s ease-out;
  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ActionCard = styled.div`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  z-index: 99999;
  width: 320px;
  max-width: 92vw;
  max-height: 90vh;
  overflow-y: auto;
  font-family: 'product_sansregular', sans-serif;
  color: #333;
  animation: cardSlideIn 0.2s ease-out;

  /* Custom scrollbar for neat appearance */
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 4px;
  }

  @keyframes cardSlideIn {
    from { opacity: 0; transform: translate(-50%, -45%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }
`;

const CardCloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1rem;
  color: #999;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s ease;
  &:hover {
    background: rgba(0,0,0,0.05);
    color: #333;
  }
`;

const CardDate = styled.div`
  font-weight: bold;
  font-size: 0.9rem;
  color: #222;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
`;

const CardActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 9px 10px;
  border: none;
  border-radius: 10px;
  font-size: 0.76rem;
  font-weight: bold;
  font-family: 'product_sansregular', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;

  ${props => props.$variant === 'whatsapp' ? `
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(37, 211, 102, 0.3);
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(37, 211, 102, 0.4);
      background: linear-gradient(135deg, #2be675 0%, #1aae6f 100%);
    }
  ` : props.$variant === 'calendar' ? `
    background: linear-gradient(135deg, #4285F4 0%, #3367D6 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(66, 133, 244, 0.4);
      background: linear-gradient(135deg, #5b99f7 0%, #4285F4 100%);
    }
  ` : props.$variant === 'factura' ? `
    background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(255, 152, 0, 0.4);
      background: linear-gradient(135deg, #FFB74D 0%, #FF9800 100%);
    }
  ` : `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
    }
  `}

  &:active {
    transform: translateY(0);
  }
`;

const CardSummary = styled.div`
  border-top: 1px solid rgba(0,0,0,0.06);
  padding-top: 10px;
`;

const CardSection = styled.div`
  ${props => props.$border ? `
    border-top: 1px solid rgba(0,0,0,0.06);
    padding-top: 8px;
    margin-top: 8px;
  ` : ''}
`;

const CardSectionLabel = styled.div`
  font-size: 0.65rem;
  font-weight: bold;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 6px;
`;

const CardInfoRow = styled.div`
  font-size: 0.78rem;
  line-height: 1.4;
  color: ${props => props.$muted ? '#888' : '#333'};
  font-style: ${props => props.$muted ? 'italic' : 'normal'};
  margin-bottom: 2px;
  word-break: break-word;
`;

const Badge = styled.span`
  font-size: 0.62rem;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 4px;
  background-color: ${props => props.$bg};
  color: ${props => props.$fg || '#fff'};
  white-space: nowrap;
  flex-shrink: 0;
`;
