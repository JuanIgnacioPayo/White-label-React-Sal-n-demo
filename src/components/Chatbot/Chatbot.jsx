import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, set } from "firebase/database";
import { app } from "../../firebase/firebase";
import './Chatbot.css';
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/firebase";
import { askGroqAI } from '../../services/groqService';
import { getAiSystemPrompt } from '../../services/aiKnowledge';
import { useChatbot } from '../../contexts/chatbotContext';
import { useAvailability } from '../../contexts/AvailabilityContext';
import LoadingSpinner from './LoadingSpinner';
import NewsAudioButton from './NewsAudioButton';
import { useSiteContext } from '../../contexts/SiteContext';
import { chatbotInfoCards } from '../../data/chatbotInfoCards';

const InfoCardButton = ({ topicId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardData = chatbotInfoCards[topicId];

  if (!cardData) return null;

  return (
    <div className="info-card-wrapper" style={{ marginTop: '10px', marginBottom: '10px' }}>
      <button 
        className="news-link-button info-card-trigger"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#948924',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '0.85rem',
          boxShadow: '0 4px 10px rgba(148, 137, 36, 0.15)',
          transition: 'all 0.2s ease',
          fontFamily: 'inherit'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
          {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
        </span>
        {cardData.title}
      </button>
      {isExpanded && (
        <div 
          className="info-card-content"
          style={{
            marginTop: '8px',
            padding: '12px 16px',
            backgroundColor: '#faf8f0',
            borderLeft: '4px solid #948924',
            borderRadius: '8px',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            color: '#3c3a30',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
            whiteSpace: 'pre-line',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
          dangerouslySetInnerHTML={{ 
            __html: cardData.content
              .replace(/\n/g, '<br />')
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          }}
        />
      )}
    </div>
  );
};

const Chatbot = () => {
  const { siteName } = useSiteContext();
  const navigate = useNavigate();
  const { toggleChat, messages, setMessages, lastContext, setLastContext, setHasUnreadMessages } = useChatbot();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatboxRef = useRef(null);
  const inputRef = useRef(null);
  const { getDateInfo, findNearestAvailableDates, isLoading: isContextLoading, calendarEvents, calendarEndDate, activePriceVersion, activeScheduleStructure } = useAvailability(); // AÑADIDO activePriceVersion
  const [companyName, setCompanyName] = useState("Cargando...");
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanClose(true);
    }, 400); // Ignore backdrop clicks for 400ms to prevent ghost clicks on mobile touch events
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      try {
        const db = getDatabase(app);
        const snapshot = await get(ref(db, 'datosId/25'));
        if (snapshot.exists()) {
          const whatsappText = snapshot.val().whatsapp_text || '';
          const numberMatch = whatsappText.match(/(\d{2}-\d{4}-\d{4})/);
          if (numberMatch) {
            let number = numberMatch[0].replace(/-/g, '');
            if (!number.startsWith('549')) number = '549' + number;
            setWhatsappNumber(number);
          }
        }
      } catch (err) {
        console.error("Error fetching whatsapp in chatbot:", err);
      }
    };
    fetchWhatsappNumber();
  }, []);

  const [progress, setProgress] = useState(0); // New state for progress bar
  const progressIntervalIdRef = useRef(null); // Ref to store interval ID

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      const dbURL = "datosId/" + 29;
      const dbRef = ref(db, dbURL);
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const targetObject = snapshot.val();
          setCompanyName(targetObject.contenido1 || "Salón");
        } else {
          setCompanyName("Salón"); // Fallback if data doesn't exist
        }
      } catch (error) {
        console.error("Error fetching company name:", error);
        setCompanyName("Salón"); // Fallback on error
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (chatboxRef.current) {
      // Use setTimeout to allow DOM updates and animations (fade-in) to start/finish before scrolling
      setTimeout(() => {
        chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const parseDates = (text) => {
    const foundDates = [];
    const now = new Date(); // Current date and time
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentDay = now.getDate();

    // Helper to add days
    const addDaysToDate = (date, days) => {
      const result = new Date(date);
      result.setDate(date.getDate() + days);
      return result;
    };

    // 1. Check for "hoy", "mañana"
    if (text.includes("hoy")) {
      const today = new Date(currentYear, currentMonth, currentDay);
      if (!foundDates.some(d => d.getTime() === today.getTime())) {
        foundDates.push(today);
      }
    }
    if (text.includes("mañana")) {
      const tomorrow = addDaysToDate(new Date(currentYear, currentMonth, currentDay), 1);
      if (!foundDates.some(d => d.getTime() === tomorrow.getTime())) {
        foundDates.push(tomorrow);
      }
    }

    // 2. Check for day names (e.g., "lunes", "martes", "viernes")
    const dayNames = {
      "domingo": 0, "lunes": 1, "martes": 2, "miércoles": 3, "miercoles": 3,
      "jueves": 4, "viernes": 5, "sábado": 6, "sabado": 6
    };
    for (const dayName in dayNames) {
      if (text.includes(dayName)) {
        const targetDay = dayNames[dayName];
        let date = new Date(currentYear, currentMonth, currentDay); // Start from today
        let daysUntilTargetDay = (targetDay + 7 - date.getDay()) % 7;
        if (daysUntilTargetDay === 0 && !text.includes("hoy")) { // If it's today's day, and "hoy" wasn't specified, consider next week
          // If today is the target day (e.g., today is Monday, user asked for "lunes"), we want today's date
          // Unless the specific text 'hoy' is not present, then assume next week for day names.
          // This logic handles "this [day]" vs "next [day]" implicitly.
          // Example: "tienes libre el lunes" on a Monday might mean next Monday or this Monday.
          // The current implementation takes the *next* Monday if it's not today.
          // To make it "this Monday" if it's actually Monday:
          // The existing date.setDate will set it to current day if daysUntilTargetDay is 0
          // This needs to be handled carefully. Let's simplify: always get the *next* occurrence,
          // unless it's today.
          const todayMidnight = new Date(currentYear, currentMonth, currentDay);
          if (date.getDay() === targetDay) { // If today is the target day of the week
            // If user asks for "viernes" on a Friday, it's today.
            // If user asks for "lunes" on a Friday, daysUntilTargetDay will be 3 (Monday).
            // This logic gets the *next upcoming* day, or today if today is that day.
            // If we want "this" vs "next", it gets more complex. For now, next upcoming or today.
          } else if (daysUntilTargetDay === 0) { // If it is today, but not yet pushed
            // It means today is the targetDay and was not covered by "hoy"
          }
        }

        date.setDate(date.getDate() + daysUntilTargetDay);

        // If the found date is in the past, advance it by 7 days (e.g., asking for "lunes" on a Tuesday)
        if (date.getTime() < new Date(currentYear, currentMonth, currentDay).getTime()) {
          date.setDate(date.getDate() + 7);
        }

        if (!foundDates.some(d => d.getTime() === date.getTime())) {
          foundDates.push(date);
        }
      }
    }


    // 3. Existing logic for "dia de mes" and "dd/mm" or "dd-mm"
    const monthMap = {
      "enero": 0, "febrero": 1, "marzo": 2, "abril": 3, "mayo": 4, "junio": 5, // 0-indexed months
      "julio": 6, "agosto": 7, "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11
    };

    const monthNameRegex = /(\d{1,2})\s+de\s+([a-zA-Z]+)/g;
    let match;
    while ((match = monthNameRegex.exec(text)) !== null) {
      const day = parseInt(match[1], 10);
      const monthName = match[2].toLowerCase();
      if (monthMap[monthName] !== undefined) { // Check for valid month name
        const newDate = new Date(currentYear, monthMap[monthName], day);
        // If date is in the past (before today), assume next year
        const todayMid = new Date(currentYear, currentMonth, currentDay);
        if (newDate < todayMid) {
          newDate.setFullYear(currentYear + 1);
        }
        if (!foundDates.some(d => d.getTime() === newDate.getTime())) {
          foundDates.push(newDate);
        }
      }
    }

    const numericRegex = /(\d{1,2})[-/](\d{1,2})/g;
    while ((match = numericRegex.exec(text)) !== null) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      if (month >= 1 && month <= 12) { // Validate month
        const newDate = new Date(currentYear, month - 1, day);
        // If date is in the past (before today), assume next year
        const todayMid = new Date(currentYear, currentMonth, currentDay);
        if (newDate < todayMid) {
          newDate.setFullYear(currentYear + 1);
        }
        if (!foundDates.some(d => d.getTime() === newDate.getTime())) {
          foundDates.push(newDate);
        }
      }
    }

    // 4. Existing logic for "el dia" or "del dia"
    if (foundDates.length === 0) { // Only if no other dates were found
      const elDiaRegex = /\b(el|del)\s+(\d{1,2})\b/g;
      while ((match = elDiaRegex.exec(text)) !== null) {
        const day = parseInt(match[2], 10);
        const newDate = new Date(currentYear, currentMonth, day); // Use currentMonth (0-indexed)
        
        // Si la fecha calculada para este mes ya pasó, asumimos que se refiere al mes que viene
        const todayMid = new Date(currentYear, currentMonth, currentDay);
        if (newDate < todayMid) {
          newDate.setMonth(newDate.getMonth() + 1);
        }

        if (!foundDates.some(d => d.getTime() === newDate.getTime())) {
          foundDates.push(newDate);
        }
      }
    }

    return foundDates;
  };

  const generatePriceLink = (date) => {
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const dayOfWeek = date.getDay();
    const day = date.getDate();
    const month = date.getMonth();

    const feriadoDates = calendarEvents
      .filter(ev => ev.title === "feriado")
      .map(ev => ev.start);

    const isFeriado = feriadoDates.some(feriado => {
      const feriadoDate = feriado.date || feriado.dateTime || feriado;
      return feriadoDate && feriadoDate.slice(0, 10) === dateStr;
    });

    let alquilerId = null;
    if (day === 24 && month === 11) {
      alquilerId = 13;
    } else if (day === 31 && month === 11) {
      alquilerId = 14;
    } else if (activeScheduleStructure === 'fixed') {
      // Estructura Fija: Viernes es día de semana
      if (isFeriado || dayOfWeek === 0 || dayOfWeek === 6) {
        alquilerId = 3;
      } else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        alquilerId = 1;
      }
    } else {
      // Estructura Dinámica (default): Viernes es fin de semana
      if (isFeriado || dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
        alquilerId = 3;
      } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        alquilerId = 1;
      }
    }

    if (!alquilerId) {
      return null;
    }

    const params = new URLSearchParams();
    params.set('fecha', dateStr);
    params.set(`item_${alquilerId}_id`, alquilerId);
    params.set(`item_${alquilerId}_cantidad`, 1);

    return `/precios?${params.toString()}&v=${activePriceVersion || 2}`;
  };

  const findNearestAvailableSpecificDay = (dayOfWeekArray, count = 3) => {
    const nearestDates = [];
    let daysChecked = 0;
    const oneDay = 24 * 60 * 60 * 1000;
    const now = new Date();
    let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    while (nearestDates.length < count && daysChecked < 365) {
      if (dayOfWeekArray.includes(currentDate.getDay())) {
        const info = getDateInfo(currentDate);
        if (info && info.status === 'Libre') {
          if (calendarEndDate) {
            const [ceYear, ceMonth, ceDay] = calendarEndDate.split('-').map(Number);
            const maxDate = new Date(ceYear, ceMonth - 1, ceDay, 23, 59, 59, 999);
            if (currentDate <= maxDate) {
              nearestDates.push(new Date(currentDate));
            }
          } else {
            nearestDates.push(new Date(currentDate));
          }
        }
      }
      currentDate.setTime(currentDate.getTime() + oneDay);
      daysChecked++;
    }
    return nearestDates;
  };

  const processDateQuery = (text) => {
    const lowerText = text.toLowerCase();
    const availabilityKeywords = ["disponible", "disponibilidad", "ocupado", "libre", "fecha", "fechas", "cuándo", "cuando", "agendar", "reservar"];
    const priceKeywords = ["precio", "sale", "costo", "cuesta"];
    const hourKeywords = ["horario", "horas", "hasta qué hora", "cuánto tiempo"];

    // Heuristic for nearest weekday queries without specific date numbers
    const hasDigits = /\d/.test(lowerText);
    const isNearestQuery = lowerText.includes("mas cerca") || lowerText.includes("mas cercano") || 
                           lowerText.includes("más cerca") || lowerText.includes("más cercano") ||
                           lowerText.includes("algun") || lowerText.includes("algunos") || 
                           lowerText.includes("algún") || lowerText.includes("algunas") ||
                           lowerText.includes("proximo") || lowerText.includes("próximo") ||
                           lowerText.includes("proximos") || lowerText.includes("próximos") ||
                           lowerText.includes("que tenes") || lowerText.includes("que tenés") ||
                           lowerText.includes("cuál es el") || lowerText.includes("cual es el") ||
                           lowerText.includes("cuándo hay") || lowerText.includes("cuando hay");

    let targetDays = null;
    let dayLabel = "";

    if (!hasDigits) {
      if (lowerText.includes("sabado") || lowerText.includes("sábado")) {
        targetDays = [6];
        dayLabel = "sábado";
      } else if (lowerText.includes("viernes")) {
        targetDays = [5];
        dayLabel = "viernes";
      } else if (lowerText.includes("domingo")) {
        targetDays = [0];
        dayLabel = "domingo";
      } else if (lowerText.includes("finde") || lowerText.includes("fin de semana") || lowerText.includes("fines de semana")) {
        targetDays = [5, 6, 0];
        dayLabel = "fin de semana (viernes, sábado o domingo)";
      }
    }

    if (targetDays && (isNearestQuery || availabilityKeywords.some(keyword => lowerText.includes(keyword)))) {
      if (isContextLoading) {
        return "Estoy terminando de cargar el calendario y los precios, por favor espera un segundo y vuelve a preguntar.";
      }

      const now = new Date();
      // Check if the immediate next occurrences are occupied
      let occupiedPreamble = "";
      const nextOccurrences = [];
      targetDays.forEach(dayOfWeek => {
        let tempDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        for (let i = 0; i < 7; i++) {
          if (tempDate.getDay() === dayOfWeek) {
            nextOccurrences.push(new Date(tempDate));
            break;
          }
          tempDate.setDate(tempDate.getDate() + 1);
        }
      });
      nextOccurrences.sort((a, b) => a.getTime() - b.getTime());

      const occupiedImmediateDays = [];
      nextOccurrences.forEach(date => {
        const info = getDateInfo(date);
        if (info && info.status !== 'Libre') {
          const formatted = `${date.getDate()}/${date.getMonth() + 1}`;
          const weekdayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
          const capitalizedWeekday = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);
          occupiedImmediateDays.push(`${capitalizedWeekday} ${formatted}`);
        }
      });

      if (occupiedImmediateDays.length > 0) {
        if (targetDays.length === 1) {
          occupiedPreamble = `El próximo **${occupiedImmediateDays[0]}** ya está ocupado. 🛑\n\n`;
        } else {
          occupiedPreamble = `Para este fin de semana, el/los días **${occupiedImmediateDays.join(', ')}** ya están ocupados. 🛑\n\n`;
        }
      }

      const nearestAvailable = findNearestAvailableSpecificDay(targetDays, 2);
      if (nearestAvailable.length > 0) {
        let response = occupiedPreamble;
        response += `Los próximos **${dayLabel}s** libres son:\n`;
        nearestAvailable.forEach(date => {
          const dateInfo = getDateInfo(date);
          const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
          const formattedPrice = dateInfo.price ? `$${Number(dateInfo.price).toLocaleString('es-AR')}` : 'a consultar';
          const weekdayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
          const capitalizedWeekday = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);
          
          response += `\n- **${capitalizedWeekday} ${formattedDate}**: base aprox. **${formattedPrice} ARS**.`;
          const link = generatePriceLink(date);
          if (link) {
            response += `\n::LINK::[Cotizar ${capitalizedWeekday} ${date.getDate()}/${date.getMonth() + 1}]::${link}::\n`;
          }
        });
        response += `\n¿Te sirve alguna de estas fechas?`;
        return response.trim();
      } else {
        return occupiedPreamble + `Lamentablemente no encontré ningún **${dayLabel}** libre en la agenda próxima. Por favor consultá con administración por WhatsApp.`;
      }
    }

    let foundDates = parseDates(lowerText);
    const hasAvailabilityKeyword = availabilityKeywords.some(keyword => lowerText.includes(keyword));
    const hasPriceKeyword = priceKeywords.some(keyword => lowerText.includes(keyword));
    const hasHourKeyword = hourKeywords.some(keyword => lowerText.includes(keyword));

    // Si no hay fechas en la pregunta actual, pero se está preguntando por precio/horario y hay fechas en el contexto, usarlas.
    if (foundDates.length === 0 && (hasPriceKeyword || hasHourKeyword) && lastContext.dates.length > 0) { // Updated condition
      foundDates = lastContext.dates;
    }

    if (foundDates.length > 0) {
      if (isContextLoading) {
        return "Estoy terminando de cargar el calendario y los precios, por favor espera un segundo y vuelve a preguntar.";
      }

      // Check for dates beyond the configured end date
      if (calendarEndDate) {
        // calendarEndDate is typically "YYYY-MM-DD". parse it to date object for comparison.
        // We compare using time values to be safe.
        // If calendarEndDate is inclusive (e.g. 2026-06-30), we should allow it.
        // foundDates are Date objects often with time 00:00:00 (from parseDates).

        // Ensure accurate parsing of calendarEndDate string to local midnight to match foundDates
        const [ceYear, ceMonth, ceDay] = calendarEndDate.split('-').map(Number);
        const maxDate = new Date(ceYear, ceMonth - 1, ceDay);
        // Set maxDate to end of that day to ensure coverage if foundDate has time components
        maxDate.setHours(23, 59, 59, 999);

        const someDateIsTooFar = foundDates.some(date => date > maxDate);

        if (someDateIsTooFar) {
          return "Todavía no tenemos los precios de esa fecha cargados ni la agenda abierta. Por favor comunicate por WhatsApp con Juan para más información.";
        }
      }

      // Handle hour query specifically
      if (hasHourKeyword) {
        const date = foundDates[0]; // Use the first found date
        const dateInfo = getDateInfo(date);
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        if (dateInfo.hours) {
          setLastContext({ dates: foundDates }); // Keep context
          return `Para el ${formattedDate}: ${dateInfo.hours}`;
        } else {
          return `No pude encontrar información de horario para el ${formattedDate}.`;
        }
      }

      // Store the dates for future context
      setLastContext({ dates: foundDates });

      let response = '';
      foundDates.forEach(date => {
        const dateInfo = getDateInfo(date);
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

        if (dateInfo && dateInfo.status === 'Ocupado') {
          let occupiedMessage = '';
          const nearestAvailable = findNearestAvailableDates(date);
          if (nearestAvailable.length > 0) {
            occupiedMessage += `\n- Lamentablemente, el ${formattedDate} está ocupado. Pero las fechas más cercanas disponibles son: `;
            nearestAvailable.forEach((availDate, index) => {
              const availDateInfo = getDateInfo(availDate);
              const formattedAvailDate = `${availDate.getDate()}/${availDate.getMonth() + 1}`;
              occupiedMessage += formattedAvailDate;
              if (index < nearestAvailable.length - 1) {
                occupiedMessage += ', ';
              }
            });
            occupiedMessage += `. ¿Te sirve alguna de estas?`;
          } else {
            occupiedMessage += `\n- El ${formattedDate} está **Ocupado**.`;
          }
          response += occupiedMessage;
        } else if (dateInfo && dateInfo.status === 'Libre') {
          const formattedPrice = dateInfo.price ? `$${Number(dateInfo.price).toLocaleString('es-AR')}` : 'a consultar';
          let freeMessage = `\n- El ${formattedDate} (${dateInfo.priceType || ''}) parece estar **Libre**.\nEl valor estimado del alquiler base es de **${formattedPrice} ARS**.`;
          freeMessage += `\n\nPodés ver la lista de precios y armar tu presupuesto ingresando acá:`;

          // Special response for Dec 24 and Dec 31
          const month = date.getMonth();
          const day = date.getDate();
          if ((month === 11 && day === 24) || (month === 11 && day === 31)) { // Month 11 is December
            freeMessage += ` Ese día trabajamos en un horario especial hasta las 3am como máximo.`;
          }
          const link = generatePriceLink(date);
          if (link) {
            freeMessage += `\n::LINK::[Ver lista de precios]::${link}::`;
          }
          response += freeMessage;
        } else {
          response += `\n- El ${formattedDate} no se pudo verificar.`;
        }
      });
      return response.trim();
    }

    if (hasAvailabilityKeyword || hasPriceKeyword || hasHourKeyword) { // Updated condition
      return "Puedo ayudarte con eso. Por favor, dime una fecha específica (ej: 'el 25' o '25 de diciembre').";
    }

    return null;
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async (manualText = null) => {
    let textToSend = typeof manualText === 'string' ? manualText : inputValue;
    if (textToSend.trim() === '' || isLoading) return;

    // Handle "noticias", "notis", "n" shortcut
    const lowerInput = textToSend.trim().toLowerCase();
    if (lowerInput === 'n' || lowerInput === 'notis') {
      textToSend = "dame las noticias";
    }

    const userMessage = { text: textToSend, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setProgress(0); // Reset progress for new request

    // Start progress bar animation
    const animationDuration = 20000; // 20 seconds
    const intervalTime = animationDuration / 100; // Update every ~200ms for 100 steps
    progressIntervalIdRef.current = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress < 99) { // Stop at 99% and wait for actual response
          return prevProgress + 1;
        }
        return prevProgress;
      });
    }, intervalTime);

    let queryResponse = null;
    try {
      queryResponse = processDateQuery(userMessage.text);
    } catch (e) {
      console.error("handleSendMessage: Error in processDateQuery:", e);
      setMessages(prev => [...prev, { text: "Lo siento, hubo un error procesando tu consulta de fecha.", sender: 'bot', error: true }]);
      setIsLoading(false);
      return;
    }

    if (queryResponse) {
      const botMessage = { text: queryResponse, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
      if (progressIntervalIdRef.current) {
        clearInterval(progressIntervalIdRef.current);
        progressIntervalIdRef.current = null;
      }
      return;
    }

    // Add a temporary message with thinking: true to display spinner
    setMessages(prev => [...prev, { text: "...", sender: 'bot', thinking: true }]);

    try {
      const systemPrompt = await getAiSystemPrompt(siteName);
      const aiResponse = await askGroqAI(userMessage.text, systemPrompt, messages);
      const finalBotResponse = aiResponse && aiResponse.trim() !== '' ? aiResponse : "Lo siento, no tengo una respuesta para eso en este momento. Podés intentar con otra pregunta o contactar a Juan por WhatsApp.";

      // Guardar consultas no respondidas
      const lowerResp = finalBotResponse.toLowerCase();
      if (lowerResp.includes("etapa de aprendizaje") || 
          lowerResp.includes("chateando con juan por whatsapp") || 
          lowerResp.includes("comunicate al whatsapp") ||
          finalBotResponse.includes("Lo siento, no tengo una respuesta")) {
          try {
              const db = getDatabase(app);
              const fallbackRef = ref(db, `chatbot_unanswered_queries/${Date.now()}`);
              await set(fallbackRef, {
                  query: userMessage.text,
                  timestamp: new Date().toISOString()
              });
          } catch (e) {
              console.error("Error saving unanswered query:", e);
          }
      }

      setMessages(prev => prev.map(msg =>
        msg.thinking ? { ...msg, text: finalBotResponse, thinking: false } : msg
      ));
      if (progressIntervalIdRef.current) {
        clearInterval(progressIntervalIdRef.current);
        progressIntervalIdRef.current = null;
      }

    } catch (error) {
      console.error("Error calling AI function:", error);

      const errorStr = (error?.message || error?.toString() || "").toLowerCase();
      const isQuotaOrSpendCapError = 
        errorStr.includes("spending cap") || 
        errorStr.includes("quota exceeded") || 
        errorStr.includes("429") || 
        errorStr.includes("too many requests");

      let errorMessage = "Lo siento, no pude procesar tu solicitud debido a un error del servidor. Por favor, intenta de nuevo más tarde.";
      let isErrorStatus = true;

      if (isQuotaOrSpendCapError) {
        errorMessage = "Estoy recibiendo muchos mensajes muy rápido. Por favor, esperá un minuto y volvé a escribirme, o comunicate con Juan por WhatsApp para una atención inmediata.";
        isErrorStatus = false; // friendly UI, not showing technical red error box
      }

      // Specific error handling for Firebase Functions might go here if needed
      setMessages(prev => prev.map(msg =>
        msg.thinking ? { ...msg, text: errorMessage, thinking: false, error: isErrorStatus } : msg
      ));
      if (progressIntervalIdRef.current) {
        clearInterval(progressIntervalIdRef.current);
        progressIntervalIdRef.current = null;
      }
    } finally {
      setIsLoading(false);
      if (progressIntervalIdRef.current) {
        clearInterval(progressIntervalIdRef.current);
        progressIntervalIdRef.current = null;
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  return (
    <div className="chatbot-backdrop" onClick={canClose ? toggleChat : undefined}>
      <div className="chatbot" onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-header">
          <h2>{companyName} AI</h2>
          <span className="material-symbols-outlined close-btn" onClick={toggleChat}>close</span>
        </div>
        <ul className="chatbox" ref={chatboxRef}>
          <li className="chat incoming">
            <p>¡Hola! 👋<br />¿Cómo puedo ayudarte? Puedo darte precios y disponibilidad de fechas.</p>
          </li>
          {messages.map((msg, index) => (
            <li key={`${msg.text}-${index}`} className={`chat ${msg.sender === 'user' ? 'outgoing' : 'incoming'}`}>
              {msg.sender === 'bot' && <span className="material-symbols-outlined"></span>}

              {msg.thinking ? (
                <LoadingSpinner progress={progress} />
              ) : (
                <div className={`message-content ${msg.error ? 'error' : ''}`}>
                  {(() => {
                    const hasWhatsapp = msg.text.toLowerCase().includes("whatsapp");
                    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola! Estuve hablando con el asistente virtual y me gustaría consultarte algo...")}`;
                    
                    const renderWhatsappButton = () => (
                      <div key="whatsapp-btn-wrapper" style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                        <a 
                          href={whatsappLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="whatsapp-redirect-btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            backgroundColor: '#25D366',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '25px',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                            transition: 'all 0.3s ease',
                            width: 'fit-content'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Chat por WhatsApp
                        </a>
                      </div>
                    );

                    const parts = [];
                    let currentText = msg.text;
                    const summaryRegex = /(\*\*(?:Resumen general de noticias|Resumen de Guillermo Moreno):\*\*)(\n[\s\S]*?)(\n\n---|(?=\n*$)|$)/;

                    let summaryBlock = null;
                    const summaryMatch = currentText.match(summaryRegex);

                    if (summaryMatch) {
                      const title = summaryMatch[1].replace(/\*\*/g, '');
                      let contentText = summaryMatch[2];

                      let audioUrl = null;
                      const audioMatch = contentText.match(/::AUDIO_URL::(.*?)::/);
                      if (audioMatch) {
                        audioUrl = audioMatch[1];
                        contentText = contentText.replace(audioMatch[0], ''); // Remove tag from display text
                      }

                      summaryBlock = (
                        <div key="news-summary-block">
                          <p>
                            <strong>{title}</strong>
                          </p>
                          {/* <p style={{ fontWeight: 'bold', lineHeight: '2.0' }} dangerouslySetInnerHTML={{ __html: summaryMatch[2].replace(/\n/g, '<br />') }}></p> */}
                          <NewsAudioButton
                            title={title}
                            text={(contentText || "").trim()}
                            audioUrl={audioUrl}
                          />
                          <br />
                          <hr />
                          <br />
                        </div>
                      );
                      // Remove the summary from the text so it's not rendered in the main loop
                      currentText = currentText.replace(summaryMatch[0], '');
                    }

                    const tagRegex = /(::LINK::\[[^\]]+\]::[^:]+::|::INFO::[a-zA-Z0-9_]+::)/g;
                    const tokens = currentText.split(tagRegex);

                    tokens.forEach((token, idx) => {
                      if (!token) return;

                      if (token.startsWith('::LINK::')) {
                        const match = token.match(/::LINK::\[([^\]]+)\]::([^:]+)::/);
                        if (match) {
                          const linkText = match[1];
                          const linkUrl = match[2];
                          parts.push(
                            <div key={`link-${idx}`} className="news-buttons-wrapper" style={{ marginTop: '8px', marginBottom: '8px' }}>
                              <button
                                onClick={() => {
                                  if (linkUrl.startsWith('/')) {
                                    setMessages(prev => [...prev, { text: "Ya abrí la lista de precios. Cualquier consulta que quieras hacerme sobre ella, aquí estoy.", sender: 'bot' }]);
                                    navigate(linkUrl);
                                    setHasUnreadMessages(true);
                                  } else {
                                    window.open(linkUrl, '_blank');
                                  }
                                }}
                                className="news-link-button"
                              >
                                {linkText}
                              </button>
                            </div>
                          );
                        }
                      } else if (token.startsWith('::INFO::')) {
                        const match = token.match(/::INFO::([a-zA-Z0-9_]+)::/);
                        if (match) {
                          const topicId = match[1];
                          parts.push(
                            <InfoCardButton key={`info-${idx}`} topicId={topicId} />
                          );
                        }
                      } else {
                        let cleanText = token;
                        // Remove "Enlace" or "Link" at the end of the segment if it's there
                        cleanText = cleanText.replace(/(?:Enlace|Link)\s*:?\s*$/i, '');
                        if (cleanText.trim().length > 0) {
                          parts.push(
                            <p key={`text-${idx}`} dangerouslySetInnerHTML={{ __html: cleanText.replace(/\n/g, '<br />').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }}></p>
                          );
                        }
                      }
                    });

                    // Add the summary block at the end
                    if (summaryBlock) {
                      parts.push(summaryBlock);
                    }

                    // If no special parts (summary or links) were found and msg.text actually has content
                    if (parts.length === 0 && currentText.trim().length > 0) {
                      parts.push(
                        <p key="default-text" dangerouslySetInnerHTML={{ __html: currentText.replace(/\n/g, '<br />').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }}></p>
                      );
                    }

                    return (
                      <>
                        {parts}
                        {hasWhatsapp && renderWhatsappButton()}
                      </>
                    );
                  })()}
                </div>
              )
              }
            </li>
          ))}
        </ul>
        <div className="chat-input">
          <textarea
            ref={inputRef}
            placeholder="Escribe un mensaje..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            required
            disabled={isLoading}
          ></textarea>
          <span id="send-btn" className={`material-symbols-outlined ${isLoading ? 'disabled' : ''}`} onClick={handleSendMessage}>
            send
          </span>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;