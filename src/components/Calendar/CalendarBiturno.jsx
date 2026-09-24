import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import googleCalendarPlugin from "@fullcalendar/google-calendar";
import styled, { keyframes } from "styled-components";
import esLocale from '@fullcalendar/core/locales/es';
import Clave from "./Clave";
import { formatDate } from '@fullcalendar/core';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../../firebase/firebase"; // Asegúrate de que la ruta a tu config de firebase sea correcta
import { safeStorage } from "../../utils/safeStorage";

// --- DEFINICIONES DE ESTILO (MOVIDAS AL PRINCIPIO) ---

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
width: 90%;
margin: auto;
padding-top: 2rem;
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
  .fc-next-button {


    width: 16rem; /* Ancho del botón */
    border-radius: 10px; /* Bordes redondeados */
    text-align: center;
    align-items: center;
    margin: auto;
    padding: 0.5rem; /* Espaciado interno */
  }
.fc-prev-button[disabled],
  .fc-next-button[disabled] {
    background-color: var(--primary-color); /* Color de fondo más apagado para deshabilitado */
    border-color: var(--app-background-color); /* Color de borde más apagado */
    color: var(--app-background-color) !important; /* Color de ícono más apagado */
    opacity: 0.65 !important; /* Opacidad reducida para indicar que está deshabilitado */
    cursor: not-allowed !important;
    /* Importante: Asegúrate de que estas propiedades no alteren el tamaño.
        Heredarán width, padding, box-sizing de la regla general. */
  }
  .fc-prev-button:hover,
  .fc-next-button:hover {
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
.fc-next-button[disabled]:focus {
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
  width: 1rem;
  pointer-events: none;
  color:var(--primary-color);
  

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
  .fc-next-button {

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


// --- COMPONENTE PRINCIPAL ---

const LegendContainer = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid var(--secondary-text, #ccc);
  border-radius: 8px;
  background-color: var(--card-grey, #f9f9f9);
  width: 90%;
  margin: auto;

  h3 {
    margin-top: 0;
    color: var(--primary-text, #000);
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary-text, #000);
  }
`;

const ColorBox = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--secondary-text);
  background-color: ${props => props.color};
`;

const SplitColorBox = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--secondary-text);
  background: linear-gradient(to bottom, ${props => props.topColor} 50%, ${props => props.bottomColor} 50%);
`;

export default function CalendarBiturno() {
    const navigate = useNavigate();
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [calendarEndDate, setCalendarEndDate] = useState(null);
    const [dailyStatus, setDailyStatus] = useState({});
    const [shiftTimes, setShiftTimes] = useState(null);

    useEffect(() => {
        const fetchConfigAndEvents = async () => {
            setIsLoading(true);
            try {
                const db = getDatabase(app);

                // Fetch shift times config
                const shiftTimesRef = ref(db, 'datosId/27'); // Assuming 27 is the ID for horarios
                const shiftSnapshot = await get(shiftTimesRef);
                const fetchedShiftTimes = shiftSnapshot.exists() ? shiftSnapshot.val() : { inicioTurnoDia: 6, finTurnoDia: 9, inicioTurnoNoche: 10, finTurnoNoche: 23 };
                setShiftTimes(fetchedShiftTimes);

                // Fetch calendar display end date
                const configRef = ref(db, 'datosId/26');
                const snapshot = await get(configRef);
                let endDate = `${new Date().getFullYear()}-12-31`;
                if (snapshot.exists() && snapshot.val().fechaFinalCalendario) {
                    endDate = snapshot.val().fechaFinalCalendario;
                }
                setCalendarEndDate(endDate);

                const apiKey = Clave();
                const calendarIdSnap = await get(ref(db, 'config/calendarIDs/eventsCalendarId'));
                const activeCalendarId = (calendarIdSnap.exists() && calendarIdSnap.val()) ? calendarIdSnap.val() : "demo@salonmagiceventos.com.ar";
                const elPatioResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${activeCalendarId}/events?key=${apiKey}&timeMin=${new Date().toISOString()}&timeMax=${new Date(endDate).toISOString()}&singleEvents=true&orderBy=startTime`);
                const elPatioData = await elPatioResponse.json();

                const processedStatuses = {};
                if (elPatioData.items) {
                    elPatioData.items.forEach(event => {
                        const startDate = new Date(event.start.dateTime || event.start.date);
                        const endDate = new Date(event.end.dateTime || event.end.date);
                        const dayStr = startDate.toISOString().slice(0, 10);

                        if (!processedStatuses[dayStr]) {
                            processedStatuses[dayStr] = { day_shift_taken: false, night_shift_taken: false };
                        }

                        const eventStartHour = startDate.getHours();
                        const eventEndHour = endDate.getHours() === 0 ? 24 : endDate.getHours(); // Handle midnight case

                        // Check for day shift overlap
                        if (eventStartHour < fetchedShiftTimes.finTurnoDia && eventEndHour > fetchedShiftTimes.inicioTurnoDia) {
                            processedStatuses[dayStr].day_shift_taken = true;
                        }

                        // Check for night shift overlap
                        if (eventStartHour < fetchedShiftTimes.finTurnoNoche && eventEndHour > fetchedShiftTimes.inicioTurnoNoche) {
                            processedStatuses[dayStr].night_shift_taken = true;
                        }
                    });
                }
                setDailyStatus(processedStatuses);

                // --- Holiday and other event fetching (remains the same) ---
                let allEvents = [];

                // Hardcoded events
                allEvents.push({
                    title: "Este día tiene precio de feriado ya que como excepción el evento puede terminar a las 3 am",
                    start: `${new Date().getFullYear()}-12-24`,
                    className: "calEvents2",
                });
                allEvents.push({
                    title: "Este día tiene precio de feriado ya que como excepción el evento puede terminar a las 3 am",
                    start: `${new Date().getFullYear()}-12-31`,
                    className: "calEvents2",
                });

                // Feriados modificados de Firebase
                const feriadosRef = ref(db, 'feriados_modificados');
                const feriadosSnapshot = await get(feriadosRef);
                const modifiedHolidays = feriadosSnapshot.exists() ? feriadosSnapshot.val() : { added: {}, removed: {} };

                // Official Google holidays
                const officialHolidaysCalendarId = "es.ar.official%23holiday@group.v.calendar.google.com";
                const officialHolidaysResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${officialHolidaysCalendarId}/events?key=${apiKey}&timeMin=${new Date(new Date().getFullYear(), 0, 1).toISOString()}&timeMax=${new Date(new Date().getFullYear(), 11, 31).toISOString()}&singleEvents=true&orderBy=startTime`);
                const officialHolidaysData = await officialHolidaysResponse.json();
                let officialGoogleHolidays = officialHolidaysData.items.map(event => ({
                    start: event.start.date,
                    title: "feriado",
                    className: "calEvents2"
                }));

                const finalHolidays = officialGoogleHolidays
                    .filter(h => !modifiedHolidays.removed || !modifiedHolidays.removed[h.start.replace(/-/g, '')])
                    .concat(Object.values(modifiedHolidays.added || {}).map(h => ({
                        start: h.date,
                        title: "feriado",
                        className: "calEvents2"
                    })));

                allEvents = allEvents.concat(finalHolidays);

                // Feriados recurrentes de Firebase
                const recurringHolidaysRef = ref(db, 'feriados_recurrentes');
                const recurringHolidaysSnapshot = await get(recurringHolidaysRef);
                const recurringHolidaysData = recurringHolidaysSnapshot.exists() ? recurringHolidaysSnapshot.val() : {};

                const generatedRecurringHolidays = [];
                const currentYear = new Date().getFullYear();
                const endYear = new Date(endDate).getFullYear();

                for (let year = currentYear; year <= endYear; year++) {
                    for (const key in recurringHolidaysData) {
                        const holiday = recurringHolidaysData[key];
                        const [month, day] = holiday.monthDay.split('-');
                        const holidayDate = `${year}-${month}-${day}`;

                        if (new Date(holidayDate) >= new Date() && new Date(holidayDate) <= new Date(endDate)) {
                            generatedRecurringHolidays.push({
                                start: holidayDate,
                                title: "feriado",
                                className: "calEvents2"
                            });
                        }
                    }
                }

                allEvents = allEvents.concat(generatedRecurringHolidays);

                setCalendarEvents(allEvents);

            } catch (error) {
                console.error("Error al cargar configuración o eventos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfigAndEvents();
    }, []);

    const handleEventClick = (arg) => {
        arg.jsEvent.preventDefault();
    };

    const handleDateClick = (arg) => {
        arg.jsEvent.preventDefault();

        if (isLoading || !shiftTimes) return;
        if (arg.dayEl.classList.contains('fc-day-other')) return;

        const clickedDateStr = arg.dateStr;
        const status = dailyStatus[clickedDateStr] || { day_shift_taken: false, night_shift_taken: false };

        if (status.day_shift_taken && status.night_shift_taken) {
            console.log(`Día ${clickedDateStr} no tiene turnos disponibles.`);
            return;
        }

        let shiftToBook = null;
        if (!status.day_shift_taken && !status.night_shift_taken) {
            // Here you could open a modal to ask which shift to book
            // For now, let's assume we can't proceed without a choice.
            alert("Ambos turnos están disponibles. Por favor, implemente una selección de turno.");
            console.log("Ambos turnos disponibles. Se necesita selección.");
            return;
        } else if (!status.day_shift_taken) {
            shiftToBook = 'dia';
        } else {
            shiftToBook = 'noche';
        }

        console.log(`Iniciando reserva para el turno de ${shiftToBook} en la fecha: ${clickedDateStr}`);

        const clickedDate = new Date(clickedDateStr);
        const dayOfWeek = clickedDate.getDay();
        const day = clickedDate.getDate();
        const month = clickedDate.getMonth();

        let alquilerId = null;

        const feriadoDates = calendarEvents
            .filter(ev => ev.title === "feriado")
            .map(ev => ev.start);

        const isFeriado = feriadoDates.some(feriadoStart => {
            let feriadoDateStr;
            if (typeof feriadoStart === 'string') {
                feriadoDateStr = feriadoStart.slice(0, 10);
            } else if (feriadoStart && feriadoStart.date) {
                feriadoDateStr = feriadoStart.date;
            } else if (feriadoStart && feriadoStart.dateTime) {
                feriadoDateStr = feriadoStart.dateTime.slice(0, 10);
            }
            return feriadoDateStr === clickedDateStr;
        });

        if (day === 24 && month === 11) {
            alquilerId = 13;
        } else if (day === 31 && month === 11) {
            alquilerId = 14;
        } else if (isFeriado || dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
            alquilerId = 3;
        } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
            alquilerId = 1;
        }

        if (!alquilerId) return;

        const [yStr, mStr] = clickedDateStr.split('-');
        let y = parseInt(yStr, 10);
        let m = parseInt(mStr, 10);
        let mesParaURL = (y * 12 + m) % 24;
        if (mesParaURL === 0) mesParaURL = 24;

        const baseURL = `${window.location.origin}/precios${mesParaURL}`;
        const params = new URLSearchParams();
        params.set('fecha', clickedDateStr);
        params.set('turno', shiftToBook); // Add the selected shift to the URL
        params.set(`item_${alquilerId}_id`, alquilerId);
        params.set(`item_${alquilerId}_cantidad`, 1);

        const finalLink = `${baseURL}?${params.toString()}`;

        // Obtener el estado actual del login para que se comporte como en el resto de la app
        const userLogueado = safeStorage.getItem('userLogeado') === 'true';

        if (userLogueado) {
            navigator.clipboard.writeText(finalLink)
                .then(() => {
                    console.log("✅ Link copiado:", finalLink);
                })
                .catch(err => {
                    console.error("❌ Error al copiar el link:", err);
                });
        }

        safeStorage.setItem('selectedDate', clickedDateStr);
        navigate(`/precios${mesParaURL}`);
    };

    if (!calendarEndDate || !shiftTimes) {
        return (
            <Section id="calendario">
                <LoadingOverlay>
                    <Spinner />
                    <LoadingText>Cargando configuración del calendario...</LoadingText>
                </LoadingOverlay>
            </Section>
        );
    }

    const setting = {
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
        googleCalendarApiKey: Clave(),
        showNonCurrentDates: true,
        fixedWeekCount: false,
        dayCellDidMount: (info) => {
            const dateStr = info.date.toISOString().slice(0, 10);
            const status = dailyStatus[dateStr] || { day_shift_taken: false, night_shift_taken: false };
            let cursor = 'pointer';
            let background = '#fdfbf5'; // Default available color

            if (status.day_shift_taken && status.night_shift_taken) {
                background = '#D3D3D3'; // Gray - No availability
                cursor = 'not-allowed';
            } else if (status.night_shift_taken) {
                // Night shift taken, day available -> Top half available, bottom half gray
                background = 'linear-gradient(to bottom, #fdfbf5 50%, #D3D3D3 50%)';
            } else if (status.day_shift_taken) {
                // Day shift taken, night available -> Top half gray, bottom half available
                background = 'linear-gradient(to bottom, #D3D3D3 50%, #fdfbf5 50%)';
            }

            info.el.style.background = background;
            info.el.style.cursor = cursor;
        },
        eventDidMount: (info) => {
            if (info.event.title === "feriado") {
                info.el.style.display = 'none';
            }
        },
        plugins: [
            dayGridPlugin,
            listPlugin,
            interactionPlugin,
        ],
        events: calendarEvents,
        headerToolbar: {
            left: "",
            center: "title,prev,next",
            right: ""
        },
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
        }
    };

    return (
        <>

            <Section id="calendario">
                {isLoading && (
                    <LoadingOverlay>
                        <Spinner />
                        <LoadingText>Cargando fechas...</LoadingText>
                    </LoadingOverlay>
                )}
                <FullCalendar {...setting} />
            </Section>

            <LegendContainer>
                <h3>Referencias</h3>
                <ul>
                    <li><ColorBox color="#D3D3D3" /> No disponible</li>
                    <li><SplitColorBox topColor="#fdfbf5" bottomColor="#D3D3D3" /> Disponible de día</li>
                    <li><SplitColorBox topColor="#D3D3D3" bottomColor="#fdfbf5" /> Disponible de noche</li>
                    <li><ColorBox color="#fdfbf5" /> Ambos turnos disponibles</li>
                </ul>
            </LegendContainer>
        </>
    );
}
