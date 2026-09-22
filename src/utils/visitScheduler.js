import { format, parseISO, addMinutes, isBefore, isAfter, subMinutes, isEqual } from 'date-fns';
import { es } from 'date-fns/locale';

const checkOverlap = (slotStart, slotEnd, events, isMainEvent = false) => {
    for (const event of events) {
        if (!event.start || !event.end) continue;
        let eventStart = parseISO(event.start);
        let eventEnd = parseISO(event.end);
        
        // Lógica extraída de la calculadora de sueldos para eventos principales
        if (isMainEvent) {
            const durationHours = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60);
            let prepMins = durationHours >= 4 ? 120 : 90; // 2h si es largo, 1.5h si es corto
            
            eventStart = subMinutes(eventStart, prepMins);
            eventEnd = addMinutes(eventEnd, 60); // 1 hora de cierre
        }

        // Overlap condition: slot starts strictly before event ends AND slot ends strictly after event starts
        if (isBefore(slotStart, eventEnd) && isAfter(slotEnd, eventStart)) {
            return true;
        }
    }
    return false;
};

export const getAvailableVisitSlots = (availableSlotsEvents, scheduledVisitsEvents = [], calendarEvents = []) => {
    if (!availableSlotsEvents || availableSlotsEvents.length === 0) {
        return [];
    }

    const validSlots = [];

    for (const slot of availableSlotsEvents) {
        let currentStart = parseISO(slot.start);
        let currentEnd = slot.end ? parseISO(slot.end) : addMinutes(currentStart, 30);
        const duration = currentEnd.getTime() - currentStart.getTime();
        
        let attempts = 0;
        const maxAttempts = 12; // Mover hacia atrás hasta 6 horas máximo
        let hasOverlap = true;

        while (hasOverlap && attempts < maxAttempts) {
            const overlapsScheduled = checkOverlap(currentStart, currentEnd, scheduledVisitsEvents, false);
            const overlapsMainEvent = checkOverlap(currentStart, currentEnd, calendarEvents, true);

            if (!overlapsScheduled && !overlapsMainEvent) {
                hasOverlap = false; // Libre!
            } else {
                // Hay solapamiento, movemos 30 min hacia atrás
                currentStart = addMinutes(currentStart, -30);
                currentEnd = new Date(currentStart.getTime() + duration);
                attempts++;
            }
        }

        // Si se encontró un horario libre pero es antes de las 9 AM, lo descartamos
        if (!hasOverlap && currentStart.getHours() >= 9) {
            validSlots.push({ date: currentStart, originalEventId: slot.id });
        }
    }
    
    if (validSlots.length === 0) {
        return [];
    }

    // Ordenar los slots por fecha ascendente
    validSlots.sort((a, b) => a.date - b.date);

    const formattedSlots = validSlots.map(slotObj => {
        const date = slotObj.date;
        return {
            start: date.toISOString(),
            end: addMinutes(date, 30).toISOString(),
            formatted: format(date, 'EEEE d/M H:mm \'hs\'', { locale: es }),
            originalEventId: slotObj.originalEventId
        };
    });

    return formattedSlots;
};