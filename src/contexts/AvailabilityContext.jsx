import React, { createContext, useState, useEffect, use } from 'react';
import { addDays, format } from 'date-fns';
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../firebase/firebase";
import Clave from "../components/Calendar/Clave";

const AvailabilityContext = createContext();

export const useAvailability = () => use(AvailabilityContext);

export const AvailabilityProvider = ({ children }) => {
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [budgetEvents, setBudgetEvents] = useState([]);
    const [availableSlotsEvents, setAvailableSlotsEvents] = useState([]);
    const [scheduledVisitsEvents, setScheduledVisitsEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [calendarEndDate, setCalendarEndDate] = useState(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const [activePriceVersion, setActivePriceVersion] = useState(2); // Default to 2
    const [activeScheduleStructure, setActiveScheduleStructure] = useState('dynamic'); // Default to dynamic
    const [isCalendarError, setIsCalendarError] = useState(false);

    const triggerRefetch = () => setRefetchTrigger(prev => prev + 1);

    const [priceCache, setPriceCache] = useState({});

    // Helper to parse price string to number
    const parsePrice = (priceStr) => {
        if (!priceStr) return 0;
        // Remove non-numeric chars except dots/commas if needed, but usually just digits
        // Assuming format like "123.456" or "123456"
        const cleanStr = String(priceStr).replace(/[^\d]/g, '');
        return Number(cleanStr) || 0;
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            setIsCalendarError(false);
            try {
                const db = getDatabase(app);

                // Fetch calendar IDs from Firebase
                const calendarIdsRef = ref(db, 'config/calendarIDs');
                const calendarIdsSnapshot = await get(calendarIdsRef);
                const calendarIds = calendarIdsSnapshot.exists() ? calendarIdsSnapshot.val() : {};

                const visitSlotsCalendarId = calendarIds.visitSlotsCalendarId || "";
                const scheduledVisitsCalendarId = calendarIds.scheduledVisitsCalendarId || "";
                const eventsCalendarId = calendarIds.eventsCalendarId || "demo@salonmagiceventos.com.ar";
                const holidaysCalendarId = calendarIds.holidaysCalendarId || "es.ar.official%23holiday@group.v.calendar.google.com";

                const configRef = ref(db, 'datosId/26');
                const snapshot = await get(configRef);
                let endDate = `${new Date().getFullYear()}-12-31`;
                if (snapshot.exists() && snapshot.val().fechaFinalCalendario) {
                    endDate = snapshot.val().fechaFinalCalendario;
                }

                setCalendarEndDate(endDate);

                // Fetch active price version
                const versionRef = ref(db, 'config/activePriceVersion');
                const versionSnapshot = await get(versionRef);
                let currentVersion = 2;
                if (versionSnapshot.exists()) {
                    currentVersion = versionSnapshot.val();
                    setActivePriceVersion(currentVersion);
                } else {
                    setActivePriceVersion(2);
                }

                // Fetch active schedule structure
                const structRef = ref(db, 'config/activeScheduleStructure');
                const structSnapshot = await get(structRef);
                if (structSnapshot.exists()) {
                    setActiveScheduleStructure(structSnapshot.val());
                } else {
                    setActiveScheduleStructure('dynamic');
                }

                // FETCH PRESUPUESTOS (BUDGETS) FOR REAL PARTY TIMES
                const presupuestosRef = ref(db, 'presupuestos');
                const presupuestosSnapshot = await get(presupuestosRef);
                let budgetEventsArray = [];
                if (presupuestosSnapshot.exists()) {
                    const data = presupuestosSnapshot.val();
                    // data is structured as year/month/day/id
                    for (const year in data) {
                        for (const month in data[year]) {
                            for (const day in data[year][month]) {
                                for (const id in data[year][month][day]) {
                                    const budget = data[year][month][day][id];
                                    // Consider only budgets that have formData and a date
                                    if (budget && budget.formData && budget.formData.horarioInicio && budget.formData.horarioFin) {
                                        const eventDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                        budgetEventsArray.push({
                                            title: "Fiesta",
                                            start: `${eventDate}T${budget.formData.horarioInicio}:00-03:00`,
                                            end: `${eventDate}T${budget.formData.horarioFin}:00-03:00`,
                                            isBudget: true
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                setBudgetEvents(budgetEventsArray);

                // --- DYNAMIC PRICE FETCHING ---
                // We need to fetch 'datosId' to get years and prices
                const datosIdRef = ref(db, 'datosId');
                const datosIdSnapshot = await get(datosIdRef);

                if (datosIdSnapshot.exists()) {
                    const datosId = datosIdSnapshot.val();
                    const config26 = datosId[26] || {};
                    const year1 = config26.y_ano1 ? parseInt(config26.y_ano1) : new Date().getFullYear();
                    const year2 = config26.z_ano2 ? parseInt(config26.z_ano2) : new Date().getFullYear() + 1;

                    const newPriceCache = {};

                    // Mapping for Month IDs to JS Month Index (0-11)
                    // IDs 1-12 correspond to Year 1 (Jan-Dec)
                    // IDs 13-24 correspond to Year 2 (Jan-Dec)

                    for (let i = 1; i <= 24; i++) {
                        // BUSINESS RULE: Only months 7-18 are active. Skip 1-6 and 19-24.
                        if (i < 7 || i > 18) continue;

                        const monthData = datosId[i];
                        if (monthData) {
                            let year = (i <= 12) ? year1 : year2;
                            let monthIndex = (i - 1) % 12; // 0 for Jan, 11 for Dec

                            // Construct key: "YYYY-MM"
                            // Pad month to 2 digits
                            const monthStr = (monthIndex + 1).toString().padStart(2, '0');
                            const key = `${year}-${monthStr}`;

                            // Extract prices
                            // b_precio_3hs_ -> Weekday price
                            // a_precio_4hs_ -> Weekend price
                            const weekdayPrice = parsePrice(monthData.b_precio_3hs_);
                            const weekendPrice = parsePrice(monthData.a_precio_4hs_);

                            newPriceCache[key] = {
                                weekday: weekdayPrice,
                                weekend: weekendPrice
                            };
                        }
                    }
                    setPriceCache(newPriceCache);
                }
                // ------------------------------

                const apiKey = Clave();

                const currentYear = new Date().getFullYear();
                const endYear = new Date(endDate).getFullYear();

                // Calendario de nuevos horarios de visita
                const availableSlotsResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${visitSlotsCalendarId}/events?key=${apiKey}&timeMin=${new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString()}&timeMax=${new Date(endDate).toISOString()}&singleEvents=true&orderBy=startTime`);
                const availableSlotsData = await availableSlotsResponse.json();
                const slotsEvents = availableSlotsData.items ? availableSlotsData.items.map(event => ({
                    id: event.id,
                    title: event.summary,
                    start: event.start.date ? `${event.start.date}T00:00:00` : event.start.dateTime,
                    end: event.end.date ? `${event.end.date}T00:00:00` : event.end.dateTime,
                })) : [];
                setAvailableSlotsEvents(slotsEvents);

                // Calendario de visitas agendadas (oficial)
                let scheduledEvents = [];
                if (scheduledVisitsCalendarId) {
                    try {
                        const scheduledResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${scheduledVisitsCalendarId}/events?key=${apiKey}&timeMin=${new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString()}&timeMax=${new Date(endDate).toISOString()}&singleEvents=true&orderBy=startTime`);
                        const scheduledData = await scheduledResponse.json();
                        if (scheduledData.items) {
                            scheduledEvents = scheduledData.items.map(event => ({
                                start: event.start.date ? `${event.start.date}T00:00:00` : event.start.dateTime,
                                end: event.end.date ? `${event.end.date}T00:00:00` : event.end.dateTime,
                            }));
                        }
                    } catch (e) {
                        console.error("Error fetching scheduled visits:", e);
                    }
                }
                setScheduledVisitsEvents(scheduledEvents);

                // Fetch calendar events for display
                const startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago

                const futureEndDate = new Date();
                futureEndDate.setFullYear(futureEndDate.getFullYear() + 2); // 2 years in future

                const elPatioResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${eventsCalendarId}/events?key=${apiKey}&timeMin=${startDate.toISOString()}&timeMax=${futureEndDate.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=2500`);
                if (!elPatioResponse.ok) {
                    throw new Error(`HTTP error ${elPatioResponse.status} fetching events`);
                }
                const elPatioData = await elPatioResponse.json();
                if (elPatioData.error) {
                    throw new Error(`API error fetching events: ${elPatioData.error.message}`);
                }
                let allEvents = elPatioData.items ? elPatioData.items.map(event => {
                    if (event.start.date) { // All-day event
                        // Usar strings directos 'YYYY-MM-DD' para evitar problemas de zona horaria
                        const startStr = event.start.date;
                        let endStr;

                        if (event.end.date) {
                            endStr = event.end.date;
                        } else {
                            // Si no hay end.date, calcular el día siguiente usando date-fns para seguridad
                            const s = new Date(startStr + 'T00:00:00');
                            const e = addDays(s, 1);
                            endStr = format(e, 'yyyy-MM-dd');
                        }

                        return {
                            title: "Ocupado",
                            start: startStr,
                            end: endStr,
                            className: "calEvents",
                            allDay: true,
                            description: event.description || '',
                            originalSummary: event.summary || '',
                            htmlLink: event.htmlLink
                        };
                    } else { // Timed event
                        return {
                            title: "Ocupado",
                            start: event.start.dateTime,
                            end: event.end.dateTime,
                            className: "calEvents",
                            description: event.description || '',
                            originalSummary: event.summary || '',
                            htmlLink: event.htmlLink
                        };
                    }
                }) : [];

                const feriadosRef = ref(db, 'feriados_modificados');
                const feriadosSnapshot = await get(feriadosRef);
                const modifiedHolidays = feriadosSnapshot.exists() ? feriadosSnapshot.val() : { added: {}, removed: {} };

                const officialHolidaysResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${holidaysCalendarId}/events?key=${apiKey}&timeMin=${new Date(currentYear, 0, 1).toISOString()}&timeMax=${new Date(endYear, 11, 31).toISOString()}&singleEvents=true&orderBy=startTime`);
                const officialHolidaysData = await officialHolidaysResponse.json();
                let officialGoogleHolidays = officialHolidaysData.items
                    ? officialHolidaysData.items.map(event => {
                        // Usar fechas como strings 'YYYY-MM-DD' para evitar problemas de zona horaria en FullCalendar
                        const startDateStr = event.start.date;
                        const startDate = new Date(startDateStr + 'T00:00:00'); // Local time construction
                        const endDate = addDays(startDate, 1);
                        const endDateStr = format(endDate, 'yyyy-MM-dd');

                        return {
                            start: startDateStr,
                            end: endDateStr,
                            title: "feriado",
                            className: "calEvents2",
                            allDay: true,
                            holidayName: event.summary
                        };
                    }) : [];

                const finalHolidays = officialGoogleHolidays
                    .filter(h => !modifiedHolidays.removed || !modifiedHolidays.removed[h.start.substring(0, 10).replace(/-/g, '')])
                    .concat(Object.values(modifiedHolidays.added || {}).map(h => {
                        const startDateStr = h.date;
                        const startDate = new Date(startDateStr + 'T00:00:00');
                        const endDate = addDays(startDate, 1);
                        const endDateStr = format(endDate, 'yyyy-MM-dd');

                        return {
                            start: startDateStr,
                            end: endDateStr,
                            title: "feriado",
                            className: "calEvents2",
                            allDay: true
                        };
                    }));
                allEvents = allEvents.concat(finalHolidays);

                const recurringHolidaysRef = ref(db, 'feriados_recurrentes');
                const recurringHolidaysSnapshot = await get(recurringHolidaysRef);
                const recurringHolidaysData = recurringHolidaysSnapshot.exists() ? recurringHolidaysSnapshot.val() : {};

                const generatedRecurringHolidays = [];

                for (let year = currentYear; year <= endYear; year++) {
                    for (const key in recurringHolidaysData) {
                        const holiday = recurringHolidaysData[key];
                        const [month, day] = holiday.monthDay.split('-');
                        const holidayDate = `${year}-${month}-${day}`;
                        const holidayDateTime = `${holidayDate}T00:00:00`;

                        if (new Date(holidayDateTime) >= new Date() && new Date(holidayDateTime) <= new Date(endDate)) {
                            // Para feriados recurrentes
                            const startDate = new Date(holidayDateTime);
                            const endDateObj = addDays(startDate, 1);

                            const startDateStr = format(startDate, 'yyyy-MM-dd');
                            const endDateStr = format(endDateObj, 'yyyy-MM-dd');

                            generatedRecurringHolidays.push({
                                start: startDateStr,
                                end: endDateStr,
                                title: "feriado",
                                className: "calEvents2",
                                allDay: true
                            });
                        }
                    }
                }
                // console.log("DEBUG: allEvents being set:", allEvents.filter(e => e.title === "feriado").slice(0, 5));
                allEvents = allEvents.concat(generatedRecurringHolidays);

                setCalendarEvents(allEvents);


            } catch (error) {
                console.error("Error al cargar datos en AvailabilityContext:", error);
                setIsCalendarError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [refetchTrigger]);

    const getDateInfo = (date) => {
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000);

        let isOccupied = false;
        let isHoliday = false;

        for (const event of calendarEvents) {
            // Manejar tanto fechas ISO como 'YYYY-MM-DD'
            let eventStart, eventEnd;
            if (event.start.includes('T')) {
                eventStart = new Date(event.start);
            } else {
                // Parsear 'YYYY-MM-DD' a local date 00:00
                const [y, m, d] = event.start.split('-').map(Number);
                eventStart = new Date(y, m - 1, d);
            }

            if (event.end.includes('T')) {
                eventEnd = new Date(event.end);
            } else {
                const [y, m, d] = event.end.split('-').map(Number);
                eventEnd = new Date(y, m - 1, d);
            }

            if (checkDate < eventEnd && dayEnd > eventStart) {
                if (event.title === "Ocupado") {
                    isOccupied = true;
                    break;
                } else if (event.title === "feriado") {
                    isHoliday = true;
                }
            }
        }


        const dayOfWeek = checkDate.getDay();
        let price = 0;
        let priceType = '';

        // --- DYNAMIC PRICE LOOKUP ---
        const year = checkDate.getFullYear();
        const month = (checkDate.getMonth() + 1).toString().padStart(2, '0');
        const key = `${year}-${month}`;
        const cached = priceCache[key] || { weekday: 0, weekend: 0 };


        const isWeekendOrHoliday = dayOfWeek === 6 || dayOfWeek === 0 || isHoliday || (dayOfWeek === 5 && activeScheduleStructure !== 'fixed');

        if (isWeekendOrHoliday) {
            // Weekend/Holiday
            price = cached.weekend; // Use Dynamic Price
            priceType = 'fin de semana o feriado';
        } else {
            // Weekday
            price = cached.weekday; // Use Dynamic Price
            priceType = 'día de semana';
        }

        if (isOccupied) {
            return { status: 'Ocupado', price, priceType };
        }


        return { status: 'Libre', price, priceType };
    };

    const findNearestAvailableDates = (targetDate, count = 3) => {
        const nearestDates = [];
        let daysChecked = 0;
        const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day

        // Start checking from the day after the targetDate
        let currentDate = new Date(targetDate.getTime() + oneDay);

        while (nearestDates.length < count && daysChecked < 365) { // Check up to a year
            const info = getDateInfo(currentDate);
            if (info.status === 'Libre') {
                nearestDates.push(new Date(currentDate));
            }
            currentDate.setTime(currentDate.getTime() + oneDay);
            daysChecked++;
        }
        return nearestDates;
    };

    const value = {
        calendarEvents,
        budgetEvents,
        availableSlotsEvents,
        scheduledVisitsEvents,
        isLoading,
        calendarEndDate,
        triggerRefetch,
        getDateInfo,
        findNearestAvailableDates,
        activePriceVersion,
        activeScheduleStructure,
        isCalendarError,
    };

    return (
        <AvailabilityContext value={value}>
            {children}
        </AvailabilityContext>
    );
};