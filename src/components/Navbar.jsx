import styled from "styled-components";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdClose } from "react-icons/md";
import React, { useState, useEffect, useRef } from 'react';
import { app } from "../firebase/firebase";
import { getDatabase, ref, get, set, remove, update } from "firebase/database";
import { Link, useNavigate, useLocation } from "react-router-dom";
import EditableField from "./EditableField";
import { useAvailability } from "../contexts/AvailabilityContext";
import { useFestiveTheme } from '../contexts/FestiveThemeContext';
import { getAvailableVisitSlots } from "../utils/visitScheduler";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from "../contexts/authContext";
import { FaBell, FaCog, FaCircle, FaRegCircle, FaLayerGroup, FaCalculator, FaStar, FaSearch } from "react-icons/fa";
import { detectBudgetSena } from "../utils/senaDetector";

const getEmojiForPanel = (id) => {
  const emojiMap = {
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
    calculadora: '🧮'
  };
  return emojiMap[id] || '⭐';
};

export default function Navbar({ 
  isEditable, 
  links: propLinks,
  logoUrl: propLogoUrl,
  editingField, 
  setEditingField, 
  onSave, 
  onFileSelect, 
  showReturnButton,
  showReorderButton,
  setShowReorder
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { availableSlotsEvents, calendarEvents, isLoading } = useAvailability();
  const { userLoggedIn, currentUser } = useAuth();
  const { activeFestiveTheme } = useFestiveTheme();

  const isAdmin = Boolean(currentUser && userLoggedIn);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isBellBlocked, setIsBellBlocked] = useState(false);
  const [readNotificationKeys, setReadNotificationKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const notificationsRef = useRef(null);
  const [adminFavorites, setAdminFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_favorites')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleFavChange = () => {
      try {
        setAdminFavorites(JSON.parse(localStorage.getItem('admin_favorites')) || []);
      } catch {}
    };
    window.addEventListener('admin_favorites_changed', handleFavChange);
    return () => window.removeEventListener('admin_favorites_changed', handleFavChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('read_notifications', JSON.stringify(readNotificationKeys));
  }, [readNotificationKeys]);

  const toggleNotificationReadStatus = (date, type, e) => {
    e.stopPropagation(); // Evitar navegación
    const key = `${date}_${type}`;
    setReadNotificationKeys(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const formatDateEs = (dateStr) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const closeNotifications = () => {
    if (window.history.state?.notificationsOpen) {
      window.history.back();
    } else {
      setShowNotifications(false);
    }
  };

  useEffect(() => {
    const handleClickOutsideNotifications = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        closeNotifications();
      }
    };
    document.addEventListener("click", handleClickOutsideNotifications);
    return () => {
      document.removeEventListener("click", handleClickOutsideNotifications);
    };
  }, [showNotifications]);

  useEffect(() => {
    if (showNotifications) {
      // Push history state to intercept the back button on mobile
      if (!window.history.state?.notificationsOpen) {
        window.history.pushState({ notificationsOpen: true }, '');
      }

      const handlePopState = () => {
        setShowNotifications(false);
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [showNotifications]);

  useEffect(() => {
    if (!isAdmin || !calendarEvents || calendarEvents.length === 0) return;

    const normalizeWhatsAppNumber = (phoneStr) => {
      if (!phoneStr) return '';
      let cleaned = phoneStr.replace(/\D/g, '');
      if (cleaned.startsWith('54')) return cleaned;
      if (cleaned.startsWith('15')) cleaned = cleaned.substring(2);
      if (cleaned.length === 10) return `549${cleaned}`;
      if (cleaned.length === 11 && cleaned.startsWith('9')) return `54${cleaned}`;
      return cleaned.length > 8 ? `549${cleaned}` : cleaned;
    };

    const extractContactInfo = (event, budget) => {
      // 1. If we have a local budget in Firebase, use it as first priority
      if (budget && budget.nombreCliente) {
        return {
          name: budget.nombreCliente,
          phone: budget.telefono || ''
        };
      }

      // 2. Extract from Google Calendar description or title
      const desc = event?.description || '';
      const summary = event?.originalSummary || event?.title || '';
      const textToSearch = `${summary}\n${desc}`;

      if (textToSearch.trim()) {
        // Remove dates to avoid matching a date string as a phone number
        const textWithoutDates = textToSearch.replace(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/g, '');
        // Match numbers that look like phone numbers (6 to 15 digits, optionally with spaces, dashes, parentheses)
        const phoneMatch = textWithoutDates.match(/(\+?\(?\d\)?[\d\s()-]{6,15}\d)/);
        if (phoneMatch) {
          const phone = phoneMatch[0].trim();
          const index = textToSearch.indexOf(phone);
          let name = '';
          if (index > 0) {
            const namePart = textToSearch.substring(0, index).trim();
            name = namePart.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
          }
          // Ensure the name is valid and doesn't contain default occupied keywords
          if (name && name.length < 40 && !name.toLowerCase().includes('ocupado') && !name.toLowerCase().includes('feriado')) {
            return { name, phone };
          }
          
          // Fallback: try parsing name from summary segment before the phone
          if (summary && summary !== 'Ocupado' && summary !== 'feriado') {
            const phoneIdxInSummary = summary.indexOf(phone);
            if (phoneIdxInSummary > 0) {
              const summaryName = summary.substring(0, phoneIdxInSummary).trim();
              const cleanSummaryName = summaryName.replace(/[+.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
              if (cleanSummaryName) {
                return { name: cleanSummaryName, phone };
              }
            }
            const parts = summary.split(/[\s-]/);
            if (parts.length > 0 && parts[0].length > 2) {
              return { name: parts[0], phone };
            }
          }
          return { name: '', phone };
        }
      }

      // 3. Fallback: Parse client's name from event.originalSummary (if not standard occupied/holiday keywords)
      if (summary && summary !== 'Ocupado' && summary !== 'feriado') {
        const parts = summary.split(/[\s-]/);
        if (parts.length > 0 && parts[0].length > 2) {
          return { name: parts[0], phone: '' };
        }
      }

      return { name: '', phone: '' };
    };

    const fetchBudgetsAndCalculateNotifications = async () => {
      const db = getDatabase(app);
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
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
                if (days[day]) {
                  const paddedMonth = month.toString().padStart(2, '0');
                  const paddedDay = day.toString().padStart(2, '0');
                  const dateKey = `${year}-${paddedMonth}-${paddedDay}`;
                  const dayBudgets = Object.values(days[day]);
                  const budgetKeys = Object.keys(days[day]);
                  let selectedIndex = dayBudgets.findIndex(b => detectBudgetSena(b).hasSena);
                  if (selectedIndex === -1) selectedIndex = 0;
                  const selectedBudget = dayBudgets[selectedIndex];
                  const selectedBudgetId = budgetKeys[selectedIndex];
                  const senaInfo = detectBudgetSena(selectedBudget);

                  budgetsData[dateKey] = {
                    id: selectedBudgetId,
                    descripcion: selectedBudget?.formData?.descripcionEvento || 'Sin descripción',
                    seña: senaInfo.senaAmount,
                    hasSena: senaInfo.hasSena,
                    senaSource: senaInfo.senaSource,
                    nombreCliente: selectedBudget?.formData?.nombreCliente || '',
                    telefono: selectedBudget?.formData?.telefono || ''
                  };
                }
              });
            });
          }
        } catch (err) {
          console.error(`Error fetching budgets for ${year}`, err);
        }
      };

      await Promise.all([fetchYear(currentYear), fetchYear(nextYear)]);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const calculatedNotifications = [];

      const allDatesSet = new Set([
        ...Object.keys(budgetsData),
        ...calendarEvents
          .filter(e => e.title === "Ocupado")
          .map(e => {
            const startStr = e.startStr || (e.start ? (typeof e.start === 'string' ? e.start : (e.start.date || e.start.dateTime)) : null);
            return startStr ? startStr.substring(0, 10) : null;
          })
          .filter(Boolean)
      ]);

      allDatesSet.forEach(dateStr => {
        const dateObj = new Date(dateStr + 'T00:00:00');
        if (dateObj <= now) return;

        const eventsOnDate = calendarEvents.filter(event => {
          const eventStartStr = event.startStr || (event.start ? (typeof event.start === 'string' ? event.start : (event.start.date || event.start.dateTime)) : null);
          return eventStartStr && eventStartStr.slice(0, 10) === dateStr && event.title === "Ocupado";
        });
        const isOccupiedInGCal = eventsOnDate.length > 0;

        const budget = budgetsData[dateStr];
        const matchesLocalBudget = budget !== undefined;
        const localBudgetSena = budget ? budget.seña : 0;

        if (isOccupiedInGCal) {
          const hasSena = eventsOnDate.some(event => {
            const title = (event.originalSummary || event.title || '').toLowerCase();
            const desc = (event.description || '').toLowerCase();
            return title.includes('seña') || title.includes('sena') || desc.includes('seña') || desc.includes('sena');
          });

          if (!hasSena && eventsOnDate.length > 0) {
            const mainEvent = eventsOnDate[0];
            const { name, phone } = extractContactInfo(mainEvent, budget);
            let whatsappUrl = null;
            if (phone) {
              const normalizedPhone = normalizeWhatsAppNumber(phone);
              whatsappUrl = `https://wa.me/${normalizedPhone}`;
            }

            calculatedNotifications.push({
              type: 'orange',
              date: dateStr,
              message: `El evento del ${formatDateEs(dateStr)} está agendado pero no tiene la palabra "seña" en título/descripción.`,
              title: '⚠️ Falta registrar seña en Google',
              clientName: name,
              whatsappUrl: whatsappUrl,
              budgetId: budget ? budget.id : null
            });
          }
        } else if (matchesLocalBudget && !isOccupiedInGCal) {
          const hasConfirmedSena = (localBudgetSena > 0) || Boolean(budget?.hasSena);
          if (hasConfirmedSena) {
            const senaDisplay = localBudgetSena > 0 ? ` ($${localBudgetSena.toLocaleString('es-AR')})` : '';
            calculatedNotifications.push({
              type: 'red',
              date: dateStr,
              message: `Hay un presupuesto SEÑADO${senaDisplay} para el ${formatDateEs(dateStr)} pero la fecha está libre en Google Calendar.`,
              title: '🚨 Presupuesto señado sin agendar',
              budgetId: budget.id
            });
          }
        }
      });

      // Cargar notificaciones de movimientos de eventos pendientes de ajustar en Google Calendar
      try {
        const movesRef = ref(db, 'notificaciones_mover_evento');
        const movesSnap = await get(movesRef);
        if (movesSnap.exists()) {
          const movesData = movesSnap.val();
          Object.entries(movesData).forEach(([bId, moveInfo]) => {
            if (moveInfo && moveInfo.fechaAnterior) {
              calculatedNotifications.push({
                type: 'move',
                budgetId: bId,
                date: moveInfo.fechaAnterior,
                targetDate: moveInfo.fechaNueva,
                title: '🗓️ Mover evento en Google Calendar',
                message: `El presupuesto de ${moveInfo.nombreCliente || 'el cliente'} (${moveInfo.descripcionEvento || 'Evento'}) se movió del ${formatDateEs(moveInfo.fechaAnterior)} al ${formatDateEs(moveInfo.fechaNueva)}. Recordá mover el evento manualmente en Google Calendar para terminar el proceso.`,
                clientName: moveInfo.nombreCliente,
                fechaAnterior: moveInfo.fechaAnterior,
                fechaNueva: moveInfo.fechaNueva
              });
            }
          });
        }
      } catch (err) {
        console.error("Error al cargar notificaciones de mover evento:", err);
      }

      
      // Fetch feedbacks
      try {
        const feedbackRef = ref(db, 'feedback');
        const feedbackSnap = await get(feedbackRef);
        if (feedbackSnap.exists()) {
          const feedbackData = feedbackSnap.val();
          Object.entries(feedbackData).forEach(([key, f]) => {
            if (f) {
              const fDate = f.timestamp ? new Date(f.timestamp) : new Date();
              calculatedNotifications.push({
                type: 'feedback',
                feedbackType: f.type, // bug or suggestion
                date: fDate.toISOString().split('T')[0],
                timestamp: f.timestamp || 0,
                title: f.type === 'bug' ? '🐛 Bug reportado' : '💡 Sugerencia',
                message: f.description || '',
                id: key,
                page: f.page || ''
              });
            }
          });
        }
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
      }

        calculatedNotifications.sort((a, b) => {
        const typeOrder = { move: 0, red: 1, orange: 2 };
        const orderA = typeOrder[a.type] !== undefined ? typeOrder[a.type] : 3;
        const orderB = typeOrder[b.type] !== undefined ? typeOrder[b.type] : 3;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.date.localeCompare(b.date);
      });
      setNotifications(calculatedNotifications);
    };

    fetchBudgetsAndCalculateNotifications();
  }, [isAdmin, calendarEvents]);

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [internalLinks, setInternalLinks] = useState([]);
  const [internalLogoUrl, setInternalLogoUrl] = useState("");

  const fileInputRef = useRef(null); // Moved up
  const navbarRef = useRef(null); // Moved up

  useEffect(() => {
    const html = document.querySelector("html");
    const handleClickOutside = (e) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target)) {
        setIsNavOpen(false);
      }
    };
    html.addEventListener("click", handleClickOutside);

    return () => {
      html.removeEventListener("click", handleClickOutside);
    };
  }, [isNavOpen]); // Added isNavOpen to dependency array

  useEffect(() => {
    // If NOT in editable mode, fetch its own data
    if (!isEditable) {
      const fetchData = async () => {
        const db = getDatabase(app);
        // Fetch Logo
        const logoRef = ref(db, "datosId/28");
        const logoSnap = await get(logoRef);
        if (logoSnap.exists()) {
          setInternalLogoUrl(logoSnap.val().foto30);
        }
        // Fetch Links
        const linksRef = ref(db, 'navbar/links');
        const linksSnap = await get(linksRef);
        if (linksSnap.exists()) {
          setInternalLinks(linksSnap.val());
        }
      };
      fetchData();
    }
  }, [isEditable]);

  const links = isEditable ? propLinks : internalLinks;
  const logoUrl = isEditable ? propLogoUrl : internalLogoUrl;

  const handleLogoClick = () => {
    if (isEditable) {
      fileInputRef.current.click();
    }
  };

  const handleLogoFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0], 'nav_logo');
    }
  };

  const handleGenerateAndCopySlotsAndNavigate = async (e) => {
    e.preventDefault();
    if (userLoggedIn) {
      navigate('/admin');
    } else {
      navigate('/login');
    }
  };

  const handleBellClick = async () => {
      if (isLoading) {
        setIsBellBlocked(true);
        setTimeout(() => {
          setIsBellBlocked(false);
        }, 1200);
        return;
      }

      if (showNotifications) {
        closeNotifications();
      } else {
        setShowNotifications(true);
      }
    };

  const unreadCount = notifications.filter(notif => {
    const notifKey = notif.type === 'feedback' ? 'feedback_' + notif.id : notif.date + '_' + notif.type;
    return !readNotificationKeys.includes(notifKey);
  }).length;

  return (
    <Container $state={isNavOpen ? 1 : 0}>
      {isAdmin ? (
        <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
          {adminFavorites.some(fav => fav.id === "notificaciones") && (
            <NotificationWrapper ref={notificationsRef}>
            <NotificationBell onClick={handleBellClick} $isBlocked={isBellBlocked}>
              <FaBell />
              {unreadCount > 0 && (
                <NotificationBadge>{unreadCount}</NotificationBadge>
              )}
            </NotificationBell>
            {showNotifications && (
              <NotificationDropdown>
                <NotificationHeader>
                  <span>Notificaciones de Agenda</span>
                  {unreadCount > 0 ? (
                    <span style={{ fontSize: '0.75rem', color: '#777', fontWeight: 'normal' }}>
                      {unreadCount} no leídas
                    </span>
                  ) : (
                    notifications.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#28a745', fontWeight: 'bold' }}>
                        ¡Todo leído!
                      </span>
                    )
                  )}
                </NotificationHeader>
                <NotificationList>
                  {(() => {
                    const hasRed = notifications.some(n => n.type === 'red');
                    const hasOrange = notifications.some(n => n.type === 'orange');
                    const hasMove = notifications.some(n => n.type === 'move');
                    const hasFeedback = notifications.some(n => n.type === 'feedback');

                    if (!hasRed && !hasOrange && !hasMove && !hasFeedback) {
                      return (
                        <EmptyNotification>
                          <span style={{ fontSize: '1.5rem' }}>🎉</span>
                          <span style={{ marginTop: '8px', fontWeight: 'bold', color: '#28a745' }}>¡Excelente! Todo al día.</span>
                          <span style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px', lineHeight: '1.4' }}>
                            No hay presupuestos señados pendientes de agendar ni eventos en calendar sin registrar seña.
                          </span>
                        </EmptyNotification>
                      );
                    }

                    const renderNotification = (notif, index) => {
                      const isRead = readNotificationKeys.includes(notif.type === "feedback" ? "feedback_" + notif.id : `${notif.date}_${notif.type}`);
                      return (
                        <NotificationItem 
                          key={notif.type === "feedback" ? "feedback_" + notif.id : `${notif.type}-${index}`} 
                          $isRead={isRead}
                          onClick={() => {
                            // Marcar como leida automaticamente al hacer click / navegar
                            const notifKey = notif.type === 'feedback' ? 'feedback_' + notif.id : notif.date + '_' + notif.type;
                            if (!readNotificationKeys.includes(notifKey)) {
                              setReadNotificationKeys(prev => [...prev, notifKey]);
                            }

                            if (notif.type === 'feedback') {
                                navigator.clipboard.writeText(notif.message).then(() => {
                                  toast.success('Texto copiado al portapapeles');
                                }).catch(err => {
                                  console.error('Error copiando al portapapeles:', err);
                                });
                                setShowNotifications(false);
                                if (notif.page) {
                                    navigate(notif.page);
                                }
                                return;
                            }

                            if (window.history.state?.notificationsOpen) {
                              setShowNotifications(false);
                              navigate('/?openDate=' + notif.date, { replace: true });
                            } else {
                              setShowNotifications(false);
                              navigate('/?openDate=' + notif.date);
                            }
                          }}
                        >
                          <NotificationIcon $type={notif.type} />
                          <NotificationContent>
                            <NotificationTitle>{notif.title}</NotificationTitle>
                            <NotificationMessage>{notif.message}</NotificationMessage>
                            
                            {notif.type === 'move' && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    closeNotifications();
                                    navigate(`/?openDate=${notif.fechaAnterior}`);
                                  }}
                                  style={{
                                    background: 'var(--primary-color, #948924)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Ir a la fecha del evento que debes mover en el calendario"
                                >
                                  📅 Ir al evento a mover ({formatDateEs(notif.fechaAnterior)})
                                </button>
                                <a
                                  href={`https://calendar.google.com/calendar/u/0/r/day/${notif.fechaAnterior.replace(/-/g, '/')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    background: '#4285f4',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  🔗 Abrir Google Calendar
                                </a>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const db = getDatabase(app);
                                      await remove(ref(db, `notificaciones_mover_evento/${notif.budgetId}`));
                                      setNotifications(prev => prev.filter(n => !(n.type === 'move' && n.budgetId === notif.budgetId)));
                                      toast.success("Notificación completada y archivada.");
                                    } catch (err) {
                                      console.error("Error al archivar notificación:", err);
                                    }
                                  }}
                                  style={{
                                    background: '#28a745',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                  title="Marcar como movido y quitar aviso"
                                >
                                  ✓ Ya lo moví
                                </button>
                              </div>
                            )}

                            {notif.type === 'orange' && (
                              notif.whatsappUrl ? (
                                <WhatsAppLink 
                                  href={notif.whatsappUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  onClick={(e) => {
                                    e.stopPropagation(); // Evitar cerrar o redirigir
                                  }}
                                >
                                  💬 Envíale un mensaje a {notif.clientName || 'el cliente'} para confirmar la reserva
                                </WhatsAppLink>
                              ) : (
                                <span style={{ 
                                  fontSize: '0.68rem', 
                                  color: '#777', 
                                  marginTop: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  background: 'rgba(0,0,0,0.03)',
                                  borderRadius: '6px',
                                  width: 'fit-content',
                                  lineHeight: '1.2'
                                }}>
                                  ℹ️ {notif.clientName || 'Cliente'}, sin teléfono
                                </span>
                              )
                            )}
                          </NotificationContent>
                          <NotificationToggleBtn 
                            onClick={(e) => {
                              e.stopPropagation();
                              const notifKey = notif.type === 'feedback' ? 'feedback_' + notif.id : notif.date + '_' + notif.type;
                              if (readNotificationKeys.includes(notifKey)) {
                                setReadNotificationKeys(prev => prev.filter(k => k !== notifKey));
                              } else {
                                setReadNotificationKeys(prev => [...prev, notifKey]);
                              }
                            }}
                            title={isRead ? "Marcar como no leída" : "Marcar como leída"}
                            $isRead={isRead}
                          >
                            {isRead ? <FaRegCircle /> : <FaCircle />}
                          </NotificationToggleBtn>
                        </NotificationItem>
                      );
                    };

                                        const syncEvents = notifications.filter(n => n.type === 'red' || n.type === 'move');
                    const downpaymentEvents = notifications.filter(n => n.type === 'orange');
                    const feedbackEvents = notifications.filter(n => n.type === 'feedback');

                    return (
                      <ColumnsContainer>
                        <NotificationColumn>
                          <div style={{ padding: '8px 16px', background: '#f8f9fa', fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid #eee', color: '#555' }}>
                            EVENTOS A SINCRONIZAR
                          </div>
                          {syncEvents.length > 0 ? (
                            syncEvents.map(renderNotification)
                          ) : (
                            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#888' }}>
                              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>🟢</span>
                              <strong style={{ display: 'block', color: '#1e7e34', marginBottom: '4px' }}>¡Todo sincronizado!</strong>
                              <span style={{ fontSize: '0.8rem' }}>No hay presupuestos señados pendientes de agendar en Google.</span>
                            </div>
                          )}
                        </NotificationColumn>

                        <NotificationColumn>
                          <div style={{ padding: '8px 16px', background: '#f8f9fa', fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid #eee', color: '#555' }}>
                            FALTA SEÑA EN GOOGLE
                          </div>
                          {downpaymentEvents.length > 0 ? (
                            downpaymentEvents.map(renderNotification)
                          ) : (
                            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#888' }}>
                              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>🗓️</span>
                              <strong style={{ display: 'block', color: '#555', marginBottom: '4px' }}>¡Todo al día!</strong>
                              <span style={{ fontSize: '0.8rem' }}>No hay eventos agendados que falten registrar seña.</span>
                            </div>
                          )}
                        </NotificationColumn>

                        <NotificationColumn>
                          <div style={{ padding: '8px 16px', background: '#f8f9fa', fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid #eee', color: '#555' }}>
                            FEEDBACKS Y SUGERENCIAS
                          </div>
                          {feedbackEvents.length > 0 ? (
                            feedbackEvents.map(renderNotification)
                          ) : (
                            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#888' }}>
                              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>💬</span>
                              <strong style={{ display: 'block', color: '#555', marginBottom: '4px' }}>¡Todo leído!</strong>
                              <span style={{ fontSize: '0.8rem' }}>No hay feedbacks pendientes.</span>
                            </div>
                          )}
                        </NotificationColumn>
                      </ColumnsContainer>
                    );
})()}
                </NotificationList>
              </NotificationDropdown>
            )}
          </NotificationWrapper>
          )}
          {adminFavorites.some(fav => fav.id === 'calculadora') && (
            <ReceiptButton onClick={() => navigate('/LoginReciboPage')} title="Administrar Recibos / Sueldos">
              <FaCalculator />
            </ReceiptButton>
          )}
          {adminFavorites.filter(fav => fav.id !== 'notificaciones' && fav.id !== 'calculadora').map(fav => {
            const specialLinks = {
              dashboard_empresa: '/dashboard-empresa',
              dashboard_sueldos: '/dashboard-sueldos',
              dashboard_monotributo: '/dashboard-monotributo'
            };
            return (
            <FavoriteNavButton 
              key={fav.id} 
              onClick={() => {
                if (specialLinks[fav.id]) {
                  navigate(specialLinks[fav.id]);
                } else {
                  navigate(`/admin?panel=${fav.id}`);
                }
              }} 
              title={fav.title}
            >
              <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getEmojiForPanel(fav.id)}
              </span>
            </FavoriteNavButton>
            );
          })}
          <SettingsGear onClick={handleGenerateAndCopySlotsAndNavigate} title="Configuración / Panel de Control">
            <FaCog />
          </SettingsGear>
          {showReorderButton && (
            <button 
              onClick={() => setShowReorder(prev => !prev)} 
              className="reorder-button"
              style={{
                backgroundColor: 'var(--card-grey, #e0e0e0)',
                color: 'var(--primary-text, #333)',
                padding: '0.4rem 0.8rem',
                border: '1px solid var(--border-color, transparent)',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FaLayerGroup /> Reorganizar
            </button>
          )}
          {showReturnButton && (
            <Link to="/" className="return-button" style={{ textDecoration: 'none', color: 'var(--primary-text)', fontWeight: 'bold' }}>
              Volver
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="brand">
            {isEditable ? (
              <div className="access" onClick={handleLogoClick} style={{ cursor: 'pointer', position: 'relative' }}>
                {(logoUrl || isEditable) && <img src={logoUrl || 'https://via.placeholder.com/150?text=Subir+Logo'}  />}
                {activeFestiveTheme?.logoOverlay && (
                  <img src={activeFestiveTheme.logoOverlay} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                )}
              </div>
            ) : (
              <Link className="access" to='/login' onClick={handleGenerateAndCopySlotsAndNavigate} style={{ position: 'relative', display: 'inline-block' }}>
                {logoUrl && <img src={logoUrl}  />}
                {activeFestiveTheme?.logoOverlay && (
                  <img src={activeFestiveTheme.logoOverlay} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                )}
              </Link>
            )}
            {isEditable && (
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleLogoFileChange}
                accept="image/*"
              />
            )}
            {showReturnButton && (
              <Link to="/" className="return-button">
                &#8592; Volver al Home
              </Link>
            )}
            {showReorderButton && (
              <button onClick={() => setShowReorder(prev => !prev)} className="reorder-button">
                Reordenar
              </button>
            )}
          </div>
          <div className="toggle">
            {isNavOpen ? (
              <MdClose onClick={() => setIsNavOpen(false)} />
            ) : (
              <GiHamburgerMenu
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNavOpen(true);
                }}
              />
            )}
          </div>
          <div className={`links ${isNavOpen ? "show" : ""}`}>
            <ul>
              {(links || []).map((link, index) => (
                <li key={index}>
                    <EditableField 
                        as="a" 
                        href={link.href} 
                        fieldKey={`nav_link_${index}_text`}
                        value={link.text}
                        isEditable={isEditable}
                        editingField={editingField}
                        setEditingField={setEditingField}
                        onSave={onSave}
                        onClick={(e) => {
                            if (isEditable) {
                                e.stopPropagation(); // Prevent Navbar from closing
                            }
                        }}
                    />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Container>
  );
}

const Container = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  left: 0;
  right: 0;
  background-color: var(--app-background-color, #ffffff);
  top: 0;
  padding: 0.5rem 2rem; /* padding: top/bottom left/right. Ajusta 2rem si quieres más o menos espacio lateral */
  box-sizing: border-box; /* Crucial para que el padding no añada ancho extra */
  z-index: 100;

  .quill-editor-container {
    background-color: white;
    color: black;
    .save-button, .cancel-button {
      background-color: var(--primary-color);
      color: white;
      border: none;
      padding: 5px 10px;
      margin-top: 5px;
      margin-right: 5px;
      border-radius: 5px;
      cursor: pointer;
    }
    .cancel-button {
      background-color: #6c757d;
    }
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .access {
      cursor: default;
      img {
        width: 3rem;
        height: 3rem;
        max-width: 40px;
        max-height: 40px;
      }
    }

    .return-button {
      text-decoration: none;
      background-color: var(--card-grey, #e0e0e0);
      color: var(--primary-text, #333);
      border: 1px solid var(--border-color, transparent);
      padding: 0.3rem 0.7rem; /* Smaller */
      border-radius: 8px;
      font-weight: bold;
      font-size: 0.8rem; /* Smaller */
      font-family: 'product_sansregular'; /* Apply product_sansregular font */
      transition: all 0.2s ease-in-out;
      white-space: nowrap;
      &:hover {
        background-color: var(--hover-bg, #d1d1d1);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px var(--shadow-color, rgba(0,0,0,0.1));
      }
    }

    .reorder-button {
      background-color: var(--card-grey, #e0e0e0); /* Match return-button */
      color: var(--primary-text, #333); /* Match return-button */
      border: 1px solid var(--border-color, transparent);
      padding: 0.3rem 0.7rem; /* Smaller */
      border-radius: 8px;
      font-weight: bold;
      font-size: 0.8rem; /* Smaller */
      font-family: 'product_sansregular'; /* Apply product_sansregular font */
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      white-space: nowrap;
      &:hover {
        background-color: var(--hover-bg, #d1d1d1); /* Match return-button */
        transform: translateY(-1px);
        box-shadow: 0 2px 4px var(--shadow-color, rgba(0,0,0,0.1));
      }
    }
  }
  .toggle {
    display: none;
  }
  .links {
   margin: auto;
    
    ul {
      margin-left: 0;
      margin-right: 0;
      display: flex;
      gap: 3rem;
      list-style-type: none;
      li {
        a {
          text-decoration: none;
          font-size: 1rem; 
          color: var(--primary-text);
          cursor: pointer;
          transition: 0.2s ease-in-out;
          
        };
          a:hover {
            font-size: 0.98rem;
            color: var(--app-primary-text-color, var(--primary-color));
          }
      }
    }
  }

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    position: fixed;
    width: 100%;
    z-index: 1000;
    background-color: transparent;
    padding: 0.5rem 1rem; 
    
    .account-info {
      display: none;
    }
    .brand {

      top: 0rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .toggle {
      right: 1.4rem;
      position: absolute;
      display: block;
      z-index: 1000;
    }
    .show {
      opacity: 1 !important;
      visibility: visible !important;
      border-radius: 8px;
    }

    .links {
      position: absolute;
      overflow-x: hidden;
      top: 0.3rem;
      right: 0.3rem;
      width: ${({ $state }) => ($state ? "50%" : "0%")};
      height: 100vh;
      background-color: var(--app-primary-text-color, var(--primary-color));
      opacity: 0;
      visibility: hidden;
      transition: 0.4s ease-in-out;
      ul {
        flex-direction: column;
        text-align: center;
        margin: 0;
        height: 100%;
        width: 100%;
        justify-content: center;
        li {
          a {
            color: var(--white-text);
          }
        }
      }
    }
  }
`;

const NotificationWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 1.5rem;
  font-family: 'product_sansregular', sans-serif;
  z-index: 1010;

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    margin-right: 3.5rem;
    margin-left: 0;
  }
`;

const NotificationBell = styled.div`
  font-size: 1.3rem;
  color: ${({ $isBlocked }) => ($isBlocked ? "#ff4d4d" : "var(--primary-text)")};
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.03);
  border: 2px solid ${({ $isBlocked }) => ($isBlocked ? "#ff4d4d" : "transparent")};
  transition: all 0.2s ease-in-out;

  &:hover {
    background: var(--hover-bg, rgba(0, 0, 0, 0.07));
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: bold;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  animation: pulse-bell 2s infinite;

  @keyframes pulse-bell {
    0% {
      box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(220, 53, 69, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
    }
  }
`;

const NotificationDropdown = styled.div`
  position: absolute;
  top: 48px;
  left: 0;
  width: 650px;
  background: var(--card-grey, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(15px);
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
  border-radius: 12px;
  box-shadow: 0 10px 30px var(--shadow-color, rgba(0, 0, 0, 0.15));
  z-index: 1020;
  overflow: hidden;
  max-height: 480px;
  display: flex;
  flex-direction: column;

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    left: -20px;
    width: 280px;
  }
`;

const NotificationHeader = styled.div`
  padding: 12px 16px;
  font-weight: bold;
  font-size: 0.9rem;
  color: var(--primary-text);
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
  background: rgba(0, 0, 0, 0.01);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ColumnsContainer = styled.div`
  display: flex;
  flex-direction: column;
  @media screen and (min-width: 1081px) {
    flex-direction: row;
  }
`;

const NotificationColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  @media screen and (min-width: 1081px) {
    &:first-child {
      border-right: 1px solid var(--border-color, rgba(0,0,0,0.06));
    }
  }
  @media screen and (max-width: 1080px) {
    &:first-child {
      border-bottom: 2px dashed var(--border-color, rgba(0,0,0,0.1));
    }
  }
`;

const NotificationList = styled.div`
  overflow-y: auto;
  flex: 1;
  max-height: 420px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color, rgba(0,0,0,0.1));
    border-radius: 3px;
  }
`;

const NotificationItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.04));
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  opacity: ${({ $isRead }) => ($isRead ? 0.6 : 1)};
  background-color: ${({ $isRead }) => ($isRead ? "var(--hover-bg, rgba(0, 0, 0, 0.01))" : "transparent")};

  &:hover {
    background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
    opacity: 1;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationIcon = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$type === 'red' ? '#8e44ad' : (props.$type === 'move' ? '#2563eb' : '#fd7e14')};
  margin-top: 6px;
  flex-shrink: 0;
`;

const NotificationContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const NotificationToggleBtn = styled.button`
  background: none;
  border: none;
  font-size: 0.95rem;
  color: ${({ $isRead }) => ($isRead ? "#a79997" : "var(--primary-color, #948924)")};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  margin-left: 8px;
  border-radius: 50%;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
  align-self: center;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: ${({ $isRead }) => ($isRead ? "var(--primary-color, #948924)" : "#dc3545")};
    transform: scale(1.15);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const NotificationTitle = styled.span`
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--primary-text);
`;

const NotificationMessage = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: #555;
  line-height: 1.35;
`;

const EmptyNotification = styled.div`
  padding: 24px;
  text-align: center;
  font-size: 0.8rem;
  color: #777;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const WhatsAppLink = styled.a`
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #25d366;
  font-weight: bold;
  text-decoration: none;
  background-color: rgba(37, 211, 102, 0.08);
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s ease;
  width: fit-content;

  &:hover {
    background-color: rgba(37, 211, 102, 0.15);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(37, 211, 102, 0.15);
  }
`;

const SettingsGear = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--primary-color, #8e44ad);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover {
    transform: scale(1.15) rotate(45deg);
    color: #7d3c98;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ReceiptButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--primary-color, #8e44ad);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover {
    transform: scale(1.15) rotate(-10deg);
    color: #7d3c98;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;
const FavoriteNavButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #ffca28;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 1.2rem;
  padding: 0;

  &:hover {
    transform: scale(1.15);
    filter: brightness(1.1);
  }
`;
