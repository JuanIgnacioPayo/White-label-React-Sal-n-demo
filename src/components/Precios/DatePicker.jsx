import styled from "styled-components";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { registerLocale } from 'react-datepicker';
import Clave from "../Calendar/Clave";

import CustomDateInputButton from './CustomDateInputButton';
import { keyframes } from "styled-components";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../../firebase/firebase";
import { toast } from 'react-toastify';

const GOOGLE_API_KEY = Clave();
const CALENDAR_ID = 'demo@salonmagiceventos.com.ar';
registerLocale('es', es);

const DatePickerComponent = ({ 
  handleDateChange, 
  minDate, 
  maxDate, 
  orangeHolidays, 
  inlineSiONo, 
  selected, 
  currentMonth, 
  currentYear, 
  year1, 
  year2, 
  bgColor, 
  onBookedDatesLoaded, 
  customInput,
  allowOccupiedSelection = false
}) => {

  const [bookedDates, setBookedDates] = useState([]);


  // Calcula la fecha que el DatePicker debería "abrirse" a.
  let dateToOpenTo = new Date();
  const yearAsInt = parseInt(currentYear, 10);
  const monthAsInt = parseInt(currentMonth, 10);
  if (!isNaN(yearAsInt) && !isNaN(monthAsInt)) {
    dateToOpenTo = new Date(yearAsInt, monthAsInt - 1, 1);
  }
  // Prevent crash by clamping to minDate
  if (minDate && dateToOpenTo < new Date(minDate)) {
    dateToOpenTo = new Date(minDate);
  }

  // 1. Obtener los eventos de Google Calendar
  const fetchBookedDates = async () => {
    try {
      const db = getDatabase(app);
      const calendarIdSnap = await get(ref(db, 'config/calendarIDs/eventsCalendarId'));
      const activeCalendarId = (calendarIdSnap.exists() && calendarIdSnap.val()) ? calendarIdSnap.val() : CALENDAR_ID;

      const response = await axios.get(
        `https://www.googleapis.com/calendar/v3/calendars/${activeCalendarId}/events?singleEvents=true&maxResults=2500&key=${GOOGLE_API_KEY}`
      );
      const events = response.data.items || [];

      const dates = events.map(event => {
        const start = event.start;

        try {
          // Si es evento de día completo, start.date ya es YYYY-MM-DD. Usarlo directo.
          if (start.date) {
            return start.date;
          }

          let dateObject;
          if (start.dateTime) {
            dateObject = new Date(start.dateTime);
          } else {
            console.warn("Event has no start date or dateTime:", event);
            return null;
          }

          if (isNaN(dateObject.getTime())) {
            console.error("Failed to parse date from event start:", start, event);
            return null;
          }

          const formattedDate = format(dateObject, 'yyyy-MM-dd');
          return formattedDate;

        } catch (error) {
          console.error("Error processing event date:", event, error);
          return null;
        }
      }).filter(date => date !== null);

      setBookedDates(dates);

      if (onBookedDatesLoaded) {
        onBookedDatesLoaded(dates);
      }

    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      // Unblock the loader even if it fails
      if (onBookedDatesLoaded) {
        onBookedDatesLoaded([]);
      }
    }
  };

  useEffect(() => {
    fetchBookedDates();
  }, []);

  // --- LÓGICA PARA EL BOTÓN NEXT EN DATEPICKER (MES LIMITE) ---
  const handleDisabledNextClick = async (viewDate) => {
    // El mes destino será un mes más adelante del mes que se está visualizando en el calendario
    const nextMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);

    const monthDigit = nextMonthDate.getMonth() + 1; // 1 a 12
    let targetId = monthDigit;

    // Si el año de la fecha destino coincide con el Año 2, sumamos 12 al ID
    const y1 = parseInt(year1);
    const y2 = parseInt(year2);

    if (nextMonthDate.getFullYear() === y2 && y1 !== y2) {
      targetId += 12;
    }

    try {
      const db = getDatabase(app);
      const dbRef = ref(db, `datosId/${targetId}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const textoAlternativo = data.p_texto_alternativo_;
        if (textoAlternativo && textoAlternativo.trim() !== '') {
          toast.info(` ${textoAlternativo}`, {
            autoClose: 5000,
          });
        } else {
          toast.info(`Los precios para ${nextMonthDate.toLocaleString('es-ES', { month: 'long' })} todavía no están disponibles.`, {
            autoClose: 4000,
            hideProgressBar: true
          });
        }
      } else {
        toast.info(`Los precios para ${nextMonthDate.toLocaleString('es-ES', { month: 'long' })} todavía no están disponibles.`, {
          autoClose: 4000,
          hideProgressBar: true
        });
      }
    } catch (error) {
      console.error("Error obteniendo texto alternativo:", error);
    }
  };

  const isDateDisabled = (date) => {
    if (allowOccupiedSelection) return false;
    const formattedDate = format(date, 'yyyy-MM-dd');
    const bookedDatesSet = new Set(bookedDates);
    return bookedDatesSet.has(formattedDate);
  };

  const handleDateSelect = useCallback((date) => {
    handleDateChange(date);
  }, [handleDateChange]);

  // --- INTERCEPTOR PARA CLIC EN FECHAS OCUPADAS ---
  useEffect(() => {
    if (allowOccupiedSelection) return;
    const handleOccupiedClick = (e) => {
      const dayEl = e.target.closest('.day-occupied');
      if (dayEl) {
        toast.info("Esta fecha ya está ocupada para eventos.");
      }
    };

    document.addEventListener('click', handleOccupiedClick, true);
    return () => document.removeEventListener('click', handleOccupiedClick, true);
  }, [allowOccupiedSelection]);

  /* Existing logic */
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const getDayClassName = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const isBooked = bookedDates.includes(formattedDate);

    return isBooked ? 'day-occupied' : null;
  };

  const holidayDatesNotBooked = useMemo(() => {
    const bookedSet = new Set(bookedDates);
    return orangeHolidays
      .filter(dateString => !bookedSet.has(dateString))
      .map(dateString => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
  }, [orangeHolidays, bookedDates]);

  return (
    <Section id="DatePicker" $bgColor={bgColor}> {/* Use $bgColor prop here */}
      <div>
        <DatePicker
          showIcon
          id="fechaEvento"
          selected={selected} // selected debe seguir siendo la fecha REALMENTE seleccionada por el usuario, o null
          onChange={handleDateSelect}
          highlightDates={holidayDatesNotBooked}
          filterDate={allowOccupiedSelection ? undefined : ((date) => !isDateDisabled(date))}
          dayClassName={getDayClassName}
          locale={es}
          dateFormat="EEEE - dd/MM/yy"
          inline={inlineSiONo}
          minDate={minDate}
          maxDate={maxDate}
          // --- MODIFICACIÓN CLAVE: Usamos openToDate en lugar de selected || initialMonthDate ---
          openToDate={dateToOpenTo}
          // La prop 'key' sigue siendo importante para forzar la actualización de la vista del calendario
          key={`${currentYear}-${currentMonth}`}
          // --- FIN DE LA MODIFICACIÓN ---
          customInput={
            customInput || (
              <CustomDateInputButton
                className={`date-picker ${!selected ? 'highlight-empty' : ''}`}
                placeholder="Ingresá una fecha acá para ver los precios"
                id="fechaEvento"
              />
            )
          }
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="custom-header">
              <button
                type="button"
                className="nav-button"
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
              >
                {"<"}
              </button>
              <div className="current-month">
                {months[date.getMonth()]} {date.getFullYear()}
              </div>
              <button
                type="button"
                className={`nav-button ${nextMonthButtonDisabled ? 'nav-button--disabled' : ''}`}
                onClick={nextMonthButtonDisabled ? () => handleDisabledNextClick(date) : increaseMonth}
              >
                {">"}
              </button>
            </div>
          )}
        />
      </div>
    </Section>
  );
};

export default DatePickerComponent;

const heartbeat = keyframes`
  0% { transform: scale(1); }
  14% { transform: scale(1.02); }
  28% { transform: scale(1); }
  42% { transform: scale(1.02); }
  70% { transform: scale(1); }
`;

const Section = styled.section`
  .custom-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: transparent;
  }

  .current-month {
    font-family: 'product_sansregular';
    font-size: 1rem;
    font-weight: bold;
    color: var(--primary-text);
    text-transform: capitalize;
  }

  .nav-button {
    background: var(--primary-text);
    color: white;
    border: none;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-weight: bold;
    transition: 0.2s;
  }

  .nav-button:hover:not(:disabled) {
    background-color: var(--primary-color);
  }

  .nav-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .nav-button--disabled {
    opacity: 0.5;
    cursor: help; /* Indica que hay info al cliquear */
  }

  /* Ocultar botones originales de react-datepicker */
  .react-datepicker__navigation {
    display: none;
  }

  .date-picker {
    width: 13.85rem;
    height: 2rem;
    border-radius: 5px;
    font-size: 0.72rem;
    font-family: 'product_sansregular';
    text-align: center;
    font-weight: bold;
    border: 1px solid var(--app-primary-text-color, var(--primary-color));
    background-color: ${props => props.$bgColor || 'rgb(162, 255, 172)'}; /* Use $bgColor prop or fallback */
    z-index: 10000;
    cursor: pointer;
    color: var(--primary-text);
    text-shadow: 1px 1px 1px var(--white-text);
    padding: 0;
    transition: 0.2s ease-in-out;
    box-shadow: 0px 0.5px 2px rgba(0,0,0,0.6);
  }
      .date-picker:hover {  
    box-shadow: 0px 0.25px 1px rgba(0,0,0,0.3);
    border-radius: 10px;
  }

  .highlight-empty {
    animation: ${heartbeat} 1.7s ease-in-out infinite;
  }

  .react-datepicker__input-container {
    display: flex;
    align-items: center;
  }

  .react-datepicker__input-container > svg.react-datepicker__calendar-icon {
    position: absolute;
    left: 0rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0.7rem;
    height: 0.7rem;
  }

  /* Asegurar que los días ocupados sean cliqueables para mostrar el Toast */
  .react-datepicker__day--disabled.day-occupied {
    pointer-events: auto !important;
    cursor: help !important;
  }

  /* Estilo visual para días ocupados (incluso cuando son cliqueables) */
  .react-datepicker__day.day-occupied {
    background-color: #ffb3b3 !important;
    color: #900 !important;
    border-radius: 0.3rem !important;
  }
  .react-datepicker__day.day-occupied:hover {
    background-color: #ff9999 !important;
  }

  /* Evitar que el calendario herede text-shadows de contenedores padres (ej: Navbar) */
  .react-datepicker {
    text-shadow: none !important;
  }
`;
