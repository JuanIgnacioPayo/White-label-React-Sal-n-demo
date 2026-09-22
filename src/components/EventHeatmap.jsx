import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useAvailability } from '../contexts/AvailabilityContext';
import { extractTimeRange } from '../utils/timeParser';
import { format, eachDayOfInterval, endOfMonth, startOfMonth, startOfYear, getDaysInMonth, addDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getDatabase, ref, get, set } from "firebase/database";
import { app } from "../firebase/firebase";
import { detectBudgetSena } from '../utils/senaDetector';

const Wrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  font-family: 'product_sansregular', sans-serif;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 2rem;
  position: relative;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 200px;
  flex-shrink: 0; 
  padding-right: 1rem;
  border-right: 1px solid #eee;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    border-right: none;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
    padding-right: 0;
  }

  button:not(.react-datepicker__navigation) {
    width: 100%;
    text-align: left;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    color: var(--primaryText, #333);
    transition: background 0.2s;

    &:hover {
        background: #f0f0f0;
    }

    &.active {
      background: var(--primary-color, #007bff);
      color: white;
    }
  }

  input[type="color"] {
    width: 100%;
    height: 35px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    padding: 2px;
  }
`;

const ChartContainer = styled.div`
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  min-width: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 120px repeat(${props => props.$columns || 24}, 1fr);
  row-gap: 4px;
  column-gap: 0;
  min-width: 800px;
  align-items: center;
`;

const Cell = styled.div`
  height: 20px;
  background-color: ${props => props.$active ? props.$color : '#f1f5f9'};
  opacity: ${props => props.$isPast ? (props.$active ? 0.3 : 0.6) : 1};
  border: 1px solid ${props => props.$active ? 'rgba(0, 0, 0, 0.15)' : '#e2e8f0'};
  border-left-width: ${props => props.$isFirst ? '1px' : '0'};
  border-top-left-radius: ${props => props.$isFirst ? '4px' : '0'};
  border-bottom-left-radius: ${props => props.$isFirst ? '4px' : '0'};
  border-top-right-radius: ${props => props.$isLast ? '4px' : '0'};
  border-bottom-right-radius: ${props => props.$isLast ? '4px' : '0'};
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  cursor: pointer;
  transition: all 0.12s ease;
  position: relative;
  box-sizing: border-box;
  
  &:hover {
    filter: brightness(0.88);
    opacity: ${props => props.$isPast ? 0.85 : 1};
    box-shadow: inset 0 0 0 1.5px #1e293b;
    z-index: 5;
  }
`;

const HeaderCell = styled.div`
  font-size: 0.75rem;
  text-align: center;
  font-weight: bold;
  color: #666;
  padding: 2px;
`;

const RowLabel = styled.div`
  font-size: 0.75rem;
  font-weight: ${props => props.$isToday ? '800' : 'bold'};
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${props => props.$isToday ? 'var(--primary-color, #948924)' : (props.$isPast ? '#94a3b8' : '#334155')};
  padding-right: 8px;
  user-select: none;
`;

const Legend = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  font-size: 0.8rem;
  align-items: center;
`;

const ColorSample = styled.div`
  width: 20px;
  height: 20px;
  background-color: ${props => props.color};
  border-radius: 4px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.9rem;
  min-width: 600px;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    background-color: #f9f9f9;
    font-weight: bold;
    color: #555;
  }
  
  tr:hover {
    background-color: #fafafa;
  }
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  width: 100px;
  
  div {
    height: 100%;
    background-color: ${props => props.color || '#ff5722'};
    width: ${props => props.width}%;
  }
`;

const TooltipContainer = styled.div`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  transform: ${props => props.$placement === 'bottom' 
    ? 'translate(-50%, 25px)' 
    : 'translate(-50%, -100%) translateY(-10px)'};
  background: #1e293b;
  color: #f8fafc;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  pointer-events: none;
  z-index: 99999;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  min-width: 230px;
  max-width: 350px;
  white-space: normal;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  animation: tooltipFade 0.15s ease-out;

  @keyframes tooltipFade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .tooltip-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .tooltip-date {
    font-weight: 700;
    font-size: 0.85rem;
    color: #fff;
    text-transform: capitalize;
  }

  .tooltip-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .badge-occupied {
    background: #ef4444;
    color: #fff;
  }

  .badge-free {
    background: #10b981;
    color: #fff;
  }

  .badge-warning {
    background: #f59e0b;
    color: #fff;
  }

  .badge-info {
    background: #3b82f6;
    color: #fff;
  }

  .tooltip-time {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #cbd5e1;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .tooltip-events-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  .tooltip-event-item {
    background: rgba(255, 255, 255, 0.07);
    border-left: 3px solid #fbbf24;
    border-radius: 4px;
    padding: 8px 10px;
  }

  .tooltip-summary {
    font-weight: 700;
    color: #fbbf24;
    font-size: 0.82rem;
    line-height: 1.3;
  }

  .tooltip-event-timerange {
    font-size: 0.75rem;
    margin-top: 2px;
  }

  .tooltip-description {
    margin-top: 6px;
    color: #e2e8f0;
    font-size: 0.75rem;
    line-height: 1.4;
    max-height: 140px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
    padding-top: 4px;
  }
`;

// Helper to parse start & end hours from budget formData (inicioEvento & finEvento)
const parseTimeFromBudget = (inicioStr, finStr) => {
    if (!inicioStr && !finStr) return null;

    const parseH = (val) => {
        if (!val) return null;
        const clean = String(val).trim();
        const match = clean.match(/^(\d{1,2})(?:[:.](\d{2}))?/);
        if (!match) return null;
        let h = parseInt(match[1], 10);
        const m = match[2] ? parseInt(match[2], 10) : 0;
        return { h, m };
    };

    const startObj = parseH(inicioStr);
    const endObj = parseH(finStr);

    if (!startObj && !endObj) return null;

    let startHour = startObj ? startObj.h : 0;
    let endHour = endObj ? endObj.h : startHour + 4;
    if (endObj && endObj.m > 0) {
        endHour += 1;
    }

    if (endHour < startHour) {
        if (endHour + 12 > startHour && endHour + 12 - startHour <= 9) {
            endHour += 12;
        } else {
            endHour += 24;
        }
    } else if (endHour === startHour) {
        endHour = startHour + 4;
    }

    return { start: startHour, end: endHour };
};

export default function EventHeatmap() {
    const { calendarEvents } = useAvailability();
    const [viewMode, setViewMode] = useState('monthly'); // monthly, annual, weekly, stats
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedWeekday, setSelectedWeekday] = useState(1); // 0=Sun, 1=Mon, ..., 6=Sat
    const [baseColor, setBaseColor] = useState('#ff5722'); // Default orange-ish
    const [hasAutoSelectedDate, setHasAutoSelectedDate] = useState(false);
    const [processedData, setProcessedData] = useState({});
    const [tooltipData, setTooltipData] = useState(null);
    const [budgetsData, setBudgetsData] = useState(null);
    
    // Filtros de fecha globales para Semanal y Por Día
    const [filterStartDate, setFilterStartDate] = useState(null);
    const [filterEndDate, setFilterEndDate] = useState(null);

    // Load budgets directly from Firebase Realtime Database
    useEffect(() => {
        const db = getDatabase(app);
        const presRef = ref(db, 'presupuestos');
        get(presRef).then(snapshot => {
            if (snapshot.exists()) {
                setBudgetsData(snapshot.val());
            } else {
                setBudgetsData({});
            }
        }).catch(err => {
            console.error("Error fetching presupuestos for heatmap:", err);
            setBudgetsData({});
        });
    }, []);

    // Initial date selection logic
    useEffect(() => {
        if (!hasAutoSelectedDate && calendarEvents && calendarEvents.length > 0) {
            const today = new Date();

            const sortedByDistance = [...calendarEvents].sort((a, b) => {
                const distA = Math.abs(new Date(a.start) - today);
                const distB = Math.abs(new Date(b.start) - today);
                return distA - distB;
            });

            const closestEvent = sortedByDistance[0];
            if (closestEvent) {
                setSelectedDate(new Date(closestEvent.start));
            }
            setHasAutoSelectedDate(true);
        }
    }, [calendarEvents, hasAutoSelectedDate]);

    // Load color from Firebase
    useEffect(() => {
        const db = getDatabase(app);
        const colorRef = ref(db, 'config/heatmapColor');
        get(colorRef).then(snapshot => {
            if (snapshot.exists()) {
                setBaseColor(snapshot.val());
            }
        }).catch(console.error);
    }, []);

    const saveColor = () => {
        const db = getDatabase(app);
        const colorRef = ref(db, 'config/heatmapColor');
        set(colorRef, baseColor)
            .then(() => alert('Color guardado'))
            .catch(err => console.error(err));
    };

    // Parse events into a map of "YYYY-MM-DD" -> { hours: Set, isUndefined: boolean, events: [], eventsByHour: {}, hasBudget: boolean }
    useEffect(() => {
        const heatmap = {};

        // 1. Process budgets created on the webpage (PRESUESTOS) - Primary source of truth for hours & info
        if (budgetsData && typeof budgetsData === 'object') {
            Object.entries(budgetsData).forEach(([year, yearData]) => {
                if (!yearData || typeof yearData !== 'object') return;
                Object.entries(yearData).forEach(([month, monthData]) => {
                    if (!monthData || typeof monthData !== 'object') return;
                    Object.entries(monthData).forEach(([day, dayData]) => {
                        if (!dayData || typeof dayData !== 'object') return;
                        Object.entries(dayData).forEach(([budgetId, budget]) => {
                            if (!budget) return;

                            const paddedMonth = month.toString().padStart(2, '0');
                            const paddedDay = day.toString().padStart(2, '0');
                            const dateKey = `${year}-${paddedMonth}-${paddedDay}`;

                            const formData = budget.formData || {};
                            const inicio = formData.inicioEvento || '';
                            const fin = formData.finEvento || '';
                            const timeRange = parseTimeFromBudget(inicio, fin);

                            const señaInfo = detectBudgetSena(budget);
                            const señaNum = señaInfo.senaAmount;
                            const totalNum = parseFloat(budget.totalFinal || 0);
                            const restanteNum = parseFloat(budget.restante || (totalNum > 0 ? Math.max(0, totalNum - señaNum) : 0));

                            const budgetDetails = {
                                isBudget: true,
                                budgetId: budgetId,
                                title: formData.descripcionEvento || 'Presupuesto Cargado',
                                summary: formData.descripcionEvento || (formData.nombreCliente ? `Evento de ${formData.nombreCliente}` : 'Presupuesto de la Página'),
                                clientName: formData.nombreCliente || '',
                                phone: formData.telefono || formData.whatsapp || '',
                                inicioEvento: inicio,
                                finEvento: fin,
                                timeRangeStr: (inicio && fin) ? `${inicio} a ${fin} hs` : (inicio ? `Desde ${inicio} hs` : 'Sin horario cargado'),
                                hasHours: !!timeRange,
                                seña: señaNum,
                                totalFinal: totalNum,
                                restante: restanteNum,
                                facturado: budget.facturado || false,
                                carrito: budget.carrito || [],
                                description: `Cliente: ${formData.nombreCliente || 'Sin nombre'}\nTel: ${formData.telefono || 'Sin tel'}\n${formData.descripcionEvento || ''}${señaNum > 0 ? `\nSeña: $${señaNum.toLocaleString('es-AR')}` : ''}${totalNum > 0 ? ` | Total: $${totalNum.toLocaleString('es-AR')}` : ''}`
                            };

                            if (!heatmap[dateKey]) {
                                heatmap[dateKey] = { hours: new Set(), isUndefined: false, events: [], eventsByHour: {}, hasBudget: true };
                            }
                            heatmap[dateKey].hasBudget = true;

                            if (timeRange) {
                                for (let h = timeRange.start; h < timeRange.end; h++) {
                                    let targetDateKey = dateKey;
                                    let targetHour = h;

                                    if (h >= 24) {
                                        targetHour = h - 24;
                                        const baseD = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
                                        targetDateKey = format(addDays(baseD, 1), 'yyyy-MM-dd');
                                    }

                                    if (!heatmap[targetDateKey]) {
                                        heatmap[targetDateKey] = { hours: new Set(), isUndefined: false, events: [], eventsByHour: {}, hasBudget: true };
                                    }
                                    heatmap[targetDateKey].hours.add(targetHour);

                                    if (!heatmap[targetDateKey].eventsByHour[targetHour]) {
                                        heatmap[targetDateKey].eventsByHour[targetHour] = [];
                                    }
                                    if (!heatmap[targetDateKey].eventsByHour[targetHour].some(e => e.budgetId === budgetId)) {
                                        heatmap[targetDateKey].eventsByHour[targetHour].push(budgetDetails);
                                    }
                                }
                            } else {
                                // Presupuesto sin horario cargado -> se grisea toda la fila
                                heatmap[dateKey].isUndefined = true;
                            }

                            if (!heatmap[dateKey].events.some(e => e.budgetId === budgetId)) {
                                heatmap[dateKey].events.push(budgetDetails);
                            }
                        });
                    });
                });
            });
        }

        // 2. Complement with Google Calendar events only for dates that do NOT already have a budget
        if (calendarEvents && calendarEvents.length > 0) {
            calendarEvents.forEach(event => {
                if (event.title === "Ocupado" || event.title?.toLowerCase().includes("ocupado")) {
                    const eventDate = new Date(event.start);
                    const dateKey = format(eventDate, 'yyyy-MM-dd');

                    // If this date already has a budget from the website, budget takes priority!
                    if (heatmap[dateKey]?.hasBudget) {
                        return;
                    }

                    const textToParse = (event.description || '') + ' ' + (event.originalSummary || '');
                    let timeRange = extractTimeRange(textToParse);

                    if (!timeRange && event.start && event.start.includes('T') && event.end && event.end.includes('T')) {
                        const sDate = new Date(event.start);
                        const eDate = new Date(event.end);
                        const sH = sDate.getHours();
                        let eH = eDate.getHours();
                        if (eDate.getMinutes() > 0) eH += 1;
                        if (eH > sH) {
                            timeRange = { start: sH, end: eH };
                        }
                    }

                    const eventDetails = {
                        isBudget: false,
                        title: event.title,
                        summary: event.originalSummary || event.title || 'Evento Ocupado (Calendar)',
                        description: event.description || '',
                        start: event.start,
                        end: event.end,
                        timeRangeStr: timeRange ? `${timeRange.start.toString().padStart(2, '0')}:00 a ${timeRange.end >= 24 ? (timeRange.end - 24).toString().padStart(2, '0') + ' (+1d)' : timeRange.end.toString().padStart(2, '0') + ':00'} hs` : 'Sin horario cargado',
                        hasHours: !!timeRange,
                        htmlLink: event.htmlLink
                    };

                    if (timeRange) {
                        for (let h = timeRange.start; h < timeRange.end; h++) {
                            let targetDate = eventDate;
                            let targetHour = h;

                            if (h >= 24) {
                                targetHour = h - 24;
                                targetDate = addDays(eventDate, 1);
                            }

                            const tKey = format(targetDate, 'yyyy-MM-dd');
                            if (!heatmap[tKey]) {
                                heatmap[tKey] = { hours: new Set(), isUndefined: false, events: [], eventsByHour: {} };
                            }
                            heatmap[tKey].hours.add(targetHour);

                            if (!heatmap[tKey].eventsByHour[targetHour]) {
                                heatmap[tKey].eventsByHour[targetHour] = [];
                            }
                            if (!heatmap[tKey].eventsByHour[targetHour].some(e => e.start === event.start && e.summary === eventDetails.summary)) {
                                heatmap[tKey].eventsByHour[targetHour].push(eventDetails);
                            }
                        }
                    } else {
                        if (!heatmap[dateKey]) {
                            heatmap[dateKey] = { hours: new Set(), isUndefined: false, events: [], eventsByHour: {} };
                        }
                        heatmap[dateKey].isUndefined = true;
                    }

                    if (!heatmap[dateKey]) {
                        heatmap[dateKey] = { hours: new Set(), isUndefined: false, events: [], eventsByHour: {} };
                    }
                    if (!heatmap[dateKey].events.some(e => e.start === event.start && e.summary === eventDetails.summary)) {
                        heatmap[dateKey].events.push(eventDetails);
                    }
                }
            });
        }

        setProcessedData(heatmap);
    }, [budgetsData, calendarEvents]);

    // Generate dataset for render based on viewMode
    const renderData = useMemo(() => {
        if (viewMode === 'monthly') {
            const start = startOfMonth(selectedDate);
            const end = endOfMonth(selectedDate);
            const days = eachDayOfInterval({ start, end });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentHour = new Date().getHours();

            const monthlyData = days.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                const entry = processedData[key] || { hours: new Set(), isUndefined: false, events: [], eventsByHour: {} };

                const dayDate = new Date(day);
                dayDate.setHours(0, 0, 0, 0);
                const isPastDay = dayDate.getTime() < today.getTime();
                const isToday = dayDate.getTime() === today.getTime();

                return {
                    label: format(day, 'dd MMM', { locale: es }) + (isToday ? ' (Hoy)' : ''),
                    fullDateLabel: format(day, "EEEE dd 'de' MMMM, yyyy", { locale: es }) + (isToday ? ' (Hoy)' : (isPastDay ? ' (Pasado)' : '')),
                    key,
                    date: day,
                    isPastDay,
                    isToday,
                    hours: Array.from({ length: 24 }, (_, i) => ({
                        active: entry.hours.has(i),
                        events: entry.eventsByHour?.[i] || [],
                        isPast: isPastDay || (isToday && i < currentHour)
                    })),
                    isUndefinedTime: entry.isUndefined,
                    allEvents: entry.events || []
                };
            });
            return monthlyData;
        } else if (viewMode === 'annual') {
            const start = startOfYear(selectedDate);
            const months = Array.from({ length: 12 }, (_, i) => i);

            return months.map(monthIdx => {
                const monthStart = new Date(selectedDate.getFullYear(), monthIdx, 1);
                const daysInMonth = getDaysInMonth(monthStart);
                const monthKeyPrefix = format(monthStart, 'yyyy-MM');

                const hourCounts = Array(24).fill(0);

                Object.keys(processedData).forEach(dateKey => {
                    if (dateKey.startsWith(monthKeyPrefix)) {
                        const entry = processedData[dateKey];
                        if (!entry.isUndefined) {
                            entry.hours.forEach(h => {
                                hourCounts[h]++;
                            });
                        }
                    }
                });

                const hours = hourCounts.map(count => count / daysInMonth);

                return {
                    label: format(monthStart, 'MMM', { locale: es }),
                    fullDateLabel: format(monthStart, 'MMMM yyyy', { locale: es }),
                    key: monthKeyPrefix,
                    hours: hours,
                    isIntensity: true
                };
            });
        } else if (viewMode === 'weekly') {
            const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const orderedDays = [1, 2, 3, 4, 5, 6, 0];

            return orderedDays.map(dayIndex => {
                const dayName = weekDays[dayIndex];
                const hourCounts = new Array(24).fill(0);

                Object.keys(processedData).forEach(dateKey => {
                    const [y, m, d] = dateKey.split('-').map(Number);
                    const date = new Date(y, m - 1, d);
                    
                    if (filterStartDate && date < filterStartDate) return;
                    if (filterEndDate && date > filterEndDate) return;

                    if (getDay(date) === dayIndex) {
                        const entry = processedData[dateKey];
                        if (!entry.isUndefined) {
                            entry.hours.forEach(h => {
                                if (h >= 0 && h < 24) hourCounts[h]++;
                            });
                        }
                    }
                });

                let maxCount = 0;
                let peakHour = -1;
                hourCounts.forEach((count, h) => {
                    if (count > maxCount) {
                        maxCount = count;
                        peakHour = h;
                    }
                });

                const intensity = hourCounts.map(count => maxCount > 0 ? count / maxCount : 0);

                let peakInfo = '';
                if (peakHour >= 0) {
                    const isWeekend = dayIndex === 0 || dayIndex >= 5;
                    const duration = isWeekend ? 4 : 3;
                    const endPeak = (peakHour + duration) % 24;
                    const endPeakStr = endPeak.toString().padStart(2, '0');
                    const startPeakStr = peakHour.toString().padStart(2, '0');
                    peakInfo = ` (Pico: ${startPeakStr} a ${endPeakStr === '00' ? '24' : endPeakStr}hs)`;
                }

                return {
                    label: `${dayName}${peakInfo}`,
                    fullDateLabel: `Días ${dayName}`,
                    key: `weekday-${dayIndex}`,
                    hours: intensity,
                    isIntensity: true
                };
            });
        } else if (viewMode === 'stats') {
            let keys = Object.keys(processedData).sort();
            
            if (filterStartDate || filterEndDate) {
                keys = keys.filter(dateKey => {
                    const [y, m, d] = dateKey.split('-').map(Number);
                    const date = new Date(y, m - 1, d);
                    if (filterStartDate && date < filterStartDate) return false;
                    if (filterEndDate && date > filterEndDate) return false;
                    return true;
                });
            }

            if (keys.length === 0) return [];

            const minDateStr = keys[0];
            const maxDateStr = keys[keys.length - 1];
            const minDate = filterStartDate || new Date(minDateStr);
            const maxDate = filterEndDate || new Date(maxDateStr);

            const totalDays = eachDayOfInterval({ start: minDate, end: maxDate });
            let totalWeekdayCount = 0;
            const hourCounts = Array(24).fill(0);

            totalDays.forEach(d => {
                if (getDay(d) === selectedWeekday) {
                    totalWeekdayCount++;
                }
            });

            keys.forEach(dateKey => {
                const [y, m, d] = dateKey.split('-').map(Number);
                const date = new Date(y, m - 1, d);
                if (getDay(date) === selectedWeekday) {
                    const entry = processedData[dateKey];
                    if (!entry.isUndefined) {
                        entry.hours.forEach(h => {
                            if (h >= 0 && h < 24) hourCounts[h]++;
                        });
                    }
                }
            });

            const isWeekend = selectedWeekday === 0 || selectedWeekday >= 5;
            const windowSize = isWeekend ? 4 : 3;

            const ranges = [];
            for (let startHour = 0; startHour < 24; startHour++) {
                let sumCounts = 0;
                for (let i = 0; i < windowSize; i++) {
                    const h = (startHour + i) % 24;
                    sumCounts += hourCounts[h];
                }
                const totalPossible = totalWeekdayCount * windowSize;
                const percentage = totalPossible > 0 ? (sumCounts / totalPossible) * 100 : 0;
                const endHour = (startHour + windowSize) % 24;
                const startStr = startHour.toString().padStart(2, '0');
                const endStr = endHour.toString().padStart(2, '0');

                ranges.push({
                    label: `${startStr}:00 - ${endStr}:00`,
                    percentage: percentage,
                    key: startHour
                });
            }
            return ranges.sort((a, b) => b.percentage - a.percentage);
        }
        return [];
    }, [viewMode, selectedDate, processedData, selectedWeekday, filterStartDate, filterEndDate]);

    const handleMouseEnterCell = (e, cellData) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const tooltipX = Math.max(170, Math.min(window.innerWidth - 170, rect.left + rect.width / 2));
        const tooltipY = rect.top;
        setTooltipData({
            x: tooltipX,
            y: tooltipY,
            placement: rect.top < 200 ? 'bottom' : 'top',
            ...cellData
        });
    };

    const handleMouseLeaveCell = () => {
        setTooltipData(null);
    };

    return (
        <Wrapper>
            <Controls>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#444' }}>Opciones</h3>

                {(viewMode === 'weekly' || viewMode === 'stats') && (
                    <div style={{ width: '100%', marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#666' }}>Filtro de Fecha (Desde - Hasta):</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <DatePicker
                                selectsRange={true}
                                startDate={filterStartDate}
                                endDate={filterEndDate}
                                onChange={(update) => {
                                    setFilterStartDate(update[0]);
                                    setFilterEndDate(update[1]);
                                }}
                                isClearable={true}
                                placeholderText="Seleccionar rango"
                                dateFormat="dd/MM/yyyy"
                                locale={es}
                                customInput={
                                    <button style={{ width: '100%', textAlign: 'left', fontWeight: 'normal' }}>
                                        {filterStartDate && filterEndDate 
                                            ? `${format(filterStartDate, 'dd/MM/yy')} - ${format(filterEndDate, 'dd/MM/yy')}` 
                                            : (filterStartDate ? `${format(filterStartDate, 'dd/MM/yy')} - ?` : 'Fechas (Todas)')}
                                    </button>
                                }
                            />
                        </div>
                    </div>
                )}

                {viewMode === 'stats' && (
                    <div style={{ width: '100%', marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#666' }}>Día de la semana:</label>
                        <select
                            value={selectedWeekday}
                            onChange={e => setSelectedWeekday(Number(e.target.value))}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                        >
                            {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, idx) => (
                                <option key={idx} value={idx}>{day}</option>
                            ))}
                        </select>
                    </div>
                )}

                {viewMode === 'monthly' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%', marginBottom: '1rem' }}>
                        <button style={{ width: 'auto', padding: '0.5rem' }} onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>&lt;</button>
                        <div style={{ flex: 1 }}>
                            <DatePicker
                                selected={selectedDate}
                                onChange={date => setSelectedDate(date)}
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                locale={es}
                                customInput={<button style={{ width: '100%', textAlign: 'center' }}>{selectedDate ? format(selectedDate, 'MMM yyyy', { locale: es }) : 'Select'}</button>}
                            />
                        </div>
                        <button style={{ width: 'auto', padding: '0.5rem' }} onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>&gt;</button>
                    </div>
                )}
                {viewMode === 'annual' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%', marginBottom: '1rem' }}>
                        <button style={{ width: 'auto', padding: '0.5rem' }} onClick={() => setSelectedDate(d => new Date(d.getFullYear() - 1, d.getMonth(), 1))}>&lt;</button>
                        <div style={{ flex: 1 }}>
                            <DatePicker
                                selected={selectedDate}
                                onChange={date => setSelectedDate(date)}
                                dateFormat="yyyy"
                                showYearPicker
                                locale={es}
                                customInput={<button style={{ width: '100%', textAlign: 'center' }}>{selectedDate ? format(selectedDate, 'yyyy') : 'Select'}</button>}
                            />
                        </div>
                        <button style={{ width: 'auto', padding: '0.5rem' }} onClick={() => setSelectedDate(d => new Date(d.getFullYear() + 1, d.getMonth(), 1))}>&gt;</button>
                    </div>
                )}

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%' }}>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Color base:</span>
                    <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} />
                </label>

                <div style={{ fontSize: '0.75rem', color: '#888', paddingTop: '1rem' }}>
                    {viewMode === 'monthly' && `Eventos visibles: ${renderData.reduce((acc, row) => acc + (processedData[row.key]?.hours?.size > 0 || processedData[row.key]?.isUndefined ? 1 : 0), 0)}`}
                    {viewMode === 'annual' && `Eventos anuales: ${Object.keys(processedData).filter(k => k.startsWith(format(selectedDate, 'yyyy'))).length}`}
                    {viewMode === 'weekly' && `Eventos totales: ${Object.keys(processedData).length}`}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <button onClick={() => setViewMode('monthly')} className={viewMode === 'monthly' ? 'active' : ''}>Mensual</button>
                    <button onClick={() => setViewMode('weekly')} className={viewMode === 'weekly' ? 'active' : ''}>Semanal (Promedio)</button>
                    <button onClick={() => setViewMode('stats')} className={viewMode === 'stats' ? 'active' : ''}>Por Día (%)</button>
                    <button onClick={() => setViewMode('annual')} className={viewMode === 'annual' ? 'active' : ''}>Anual (Promedio)</button>
                </div>
            </Controls>

            <ChartContainer>
                {viewMode === 'stats' ? (
                    <Table>
                        <thead>
                            <tr>
                                <th>Rango Horario ({['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][selectedWeekday]} - {selectedWeekday === 0 || selectedWeekday >= 5 ? '4hs' : '3hs'})</th>
                                <th>Ocupación Promedio (%)</th>
                                <th>Visual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderData.map((row) => (
                                <tr key={row.key}>
                                    <td>{row.label}</td>
                                    <td>{row.percentage.toFixed(1)}%</td>
                                    <td>
                                        <ProgressBar color={baseColor} width={row.percentage}>
                                            <div />
                                        </ProgressBar>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <Grid $columns={24}>
                        <Cell style={{ backgroundColor: 'transparent', border: 'none', cursor: 'default' }} /> {/* Top-left corner */}
                        {Array.from({ length: 24 }, (_, i) => (
                            <HeaderCell key={i}>{i}</HeaderCell>
                        ))}

                        {renderData.map((row) => (
                            <React.Fragment key={row.key}>
                                <RowLabel $isToday={row.isToday} $isPast={row.isPastDay}>{row.label}</RowLabel>
                                {row.isUndefinedTime ? (
                                    <Cell
                                        $isPast={row.isPastDay}
                                        style={{
                                            gridColumn: '2 / -1',
                                            backgroundColor: '#cbd5e1',
                                            color: row.isPastDay ? '#64748b' : '#1e293b',
                                            border: '1px solid #94a3b8',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            justifyContent: 'flex-start',
                                            paddingLeft: '1rem',
                                            width: 'auto',
                                            letterSpacing: '0.3px'
                                        }}
                                        onMouseEnter={(e) => handleMouseEnterCell(e, {
                                            dateStr: row.fullDateLabel,
                                            badge: row.isPastDay ? 'Sin Horario (Pasado)' : 'Sin Horario Cargado',
                                            badgeType: 'warning',
                                            timeStr: 'Horario no cargado en el presupuesto (A definir)',
                                            events: row.allEvents
                                        })}
                                        onMouseLeave={handleMouseLeaveCell}
                                    >
                                        ⚠️ Ocupado (sin horario cargado en presupuesto)
                                    </Cell>
                                ) : (
                                    row.hours.map((hourObj, h) => {
                                        const isActive = typeof hourObj === 'object' ? hourObj.active : !!hourObj;
                                        const events = typeof hourObj === 'object' ? hourObj.events : [];
                                        const isPast = typeof hourObj === 'object' ? hourObj.isPast : false;
                                        const isIntensity = !!row.isIntensity;
                                        const val = typeof hourObj === 'number' ? hourObj : (isActive ? 1 : 0);

                                        return (
                                            <Cell
                                                key={`${row.key}-${h}`}
                                                $active={isActive}
                                                $color={baseColor}
                                                $isFirst={h === 0}
                                                $isLast={h === 23}
                                                $isPast={isPast}
                                                style={isIntensity ? { opacity: val > 0 ? Math.max(0.15, val) : 0, backgroundColor: baseColor } : {}}
                                                onMouseEnter={(e) => {
                                                    if (isIntensity) {
                                                        handleMouseEnterCell(e, {
                                                            dateStr: row.fullDateLabel || row.label,
                                                            badge: 'Frecuencia',
                                                            badgeType: 'info',
                                                            timeStr: `${h.toString().padStart(2, '0')}:00 a ${(h + 1).toString().padStart(2, '0')}:00 hs`,
                                                            intensityStr: `${Math.round(val * 100)}% de ocupación en este horario`
                                                        });
                                                    } else if (isActive) {
                                                        handleMouseEnterCell(e, {
                                                            dateStr: row.fullDateLabel,
                                                            badge: isPast ? 'Ocupado (Pasado)' : 'Ocupado',
                                                            badgeType: isPast ? 'warning' : 'occupied',
                                                            timeStr: `Hora: ${h.toString().padStart(2, '0')}:00 - ${(h + 1).toString().padStart(2, '0')}:00 hs`,
                                                            events: events.length > 0 ? events : row.allEvents
                                                        });
                                                    } else {
                                                        handleMouseEnterCell(e, {
                                                            dateStr: row.fullDateLabel,
                                                            badge: isPast ? 'Libre (Pasado)' : 'Libre',
                                                            badgeType: 'free',
                                                            timeStr: `${h.toString().padStart(2, '0')}:00 a ${(h + 1).toString().padStart(2, '0')}:00 hs`,
                                                            events: []
                                                        });
                                                    }
                                                }}
                                                onMouseLeave={handleMouseLeaveCell}
                                            />
                                        );
                                    })
                                )}
                            </React.Fragment>
                        ))}
                    </Grid>
                )}

                <Legend>
                    {viewMode === 'annual' || viewMode === 'weekly' ? (
                        <>
                            <ColorSample color={baseColor} />
                            <span>Mayor opacidad = Más frecuente</span>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ColorSample color={baseColor} />
                                <span>Ocupado con Horario (Presupuesto)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ColorSample color="#cbd5e1" style={{ border: '1px solid #94a3b8' }} />
                                <span>Ocupado (Sin Horario Cargado)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ColorSample color={baseColor} style={{ opacity: 0.3, border: '1px dashed #64748b' }} />
                                <span>Eventos Pasados</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ColorSample color="#f1f5f9" style={{ border: '1px solid #cbd5e1' }} />
                                <span>Libre</span>
                            </div>
                        </>
                    )}
                </Legend>
            </ChartContainer>

            {/* Custom Interactive Tooltip */}
            {tooltipData && (
                <TooltipContainer $x={tooltipData.x} $y={tooltipData.y} $placement={tooltipData.placement}>
                    <div className="tooltip-header">
                        <span className="tooltip-date">{tooltipData.dateStr}</span>
                        <span className={`tooltip-badge badge-${tooltipData.badgeType || 'occupied'}`}>
                            {tooltipData.badge}
                        </span>
                    </div>

                    <div className="tooltip-time">
                        <span>🕒</span>
                        <span>{tooltipData.timeStr}</span>
                    </div>

                    {tooltipData.intensityStr && (
                        <div style={{ marginTop: '6px', color: '#93c5fd', fontSize: '0.75rem', fontWeight: 600 }}>
                            📊 {tooltipData.intensityStr}
                        </div>
                    )}

                    {tooltipData.events && tooltipData.events.length > 0 && (
                        <div className="tooltip-events-list">
                            {tooltipData.events.map((ev, idx) => (
                                <div key={idx} className="tooltip-event-item">
                                    <div className="tooltip-summary">
                                        {ev.isBudget ? '📋' : '📌'} {ev.summary}
                                    </div>
                                    {ev.clientName && (
                                        <div style={{ color: '#f8fafc', fontSize: '0.78rem', marginTop: '3px', fontWeight: '600' }}>
                                            👤 Cliente: {ev.clientName} {ev.phone && <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>({ev.phone})</span>}
                                        </div>
                                    )}
                                    <div className="tooltip-event-timerange" style={{ color: '#fbbf24', fontWeight: '600' }}>
                                        ⏰ Horario: {ev.timeRangeStr}
                                    </div>
                                    {ev.isBudget && (ev.seña > 0 || ev.totalFinal > 0) && (
                                        <div style={{ fontSize: '0.72rem', color: '#86efac', marginTop: '4px' }}>
                                            💰 Seña: ${ev.seña.toLocaleString('es-AR')} | Total: ${ev.totalFinal.toLocaleString('es-AR')}
                                            {ev.restante > 0 && <span style={{ color: '#fca5a5' }}> (Resta: ${ev.restante.toLocaleString('es-AR')})</span>}
                                        </div>
                                    )}
                                    {ev.carrito && ev.carrito.length > 0 && (
                                        <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '4px' }}>
                                            🎁 Servicios: {ev.carrito.map(c => c.name || c.nombre || c.title || c.label).filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                    {ev.description && !ev.isBudget && (
                                        <div className="tooltip-description">
                                            {ev.description}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </TooltipContainer>
            )}
        </Wrapper>
    );
}
