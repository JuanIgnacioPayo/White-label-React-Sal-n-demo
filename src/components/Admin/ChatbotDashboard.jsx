import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getApp } from 'firebase/app';
import { getDatabase, ref as dbRef, get as dbGet, set as dbSet } from 'firebase/database';
import { toast } from 'react-toastify';
import { 
  Brain, 
  Database, 
  MessageCircle, 
  DollarSign, 
  ShieldAlert,
  Bot,
  X,
  Save,
  Plus,
  Trash2
} from 'lucide-react';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
  h2 {
    margin: 0;
    color: var(--primary-color, #1e293b);
    font-size: 1.5rem;
  }
  p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 0.95rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 10px;
  h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #334155;
  }
  .icon-wrapper {
    background: ${props => props.color || '#e2e8f0'};
    color: white;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.9rem;
    color: #475569;
    line-height: 1.4;

    &::before {
      content: '•';
      color: ${props => props.bulletColor || '#94a3b8'};
      font-weight: bold;
    }
  }
`;

const Badge = styled.button`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 99px;
  background: ${props => props.bg || '#f1f5f9'};
  color: ${props => props.color || '#475569'};
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 5px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    filter: brightness(0.95);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  button.close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #64748b;
    padding: 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    &:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.6;

  h4 {
    margin: 0 0 10px 0;
    color: #0f172a;
    font-size: 1.05rem;
  }
  
  .hint {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 20px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  label {
    font-weight: 600;
    color: #334155;
    font-size: 0.9rem;
    display: block;
    margin-bottom: 4px;
  }
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const ArrayItem = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 15px;
  padding-right: 40px;
  border-radius: 8px;
  margin-bottom: 15px;
  position: relative;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #ef4444;
  position: absolute;
  top: 15px;
  right: 10px;
  cursor: pointer;
  padding: 5px;
  &:hover { color: #b91c1c; }
`;

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  justify-content: center;
  margin-top: 10px;
  &:hover { background: #2563eb; }
  &:disabled { background: #94a3b8; cursor: not-allowed; }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: #475569;
  border: 1px dashed #cbd5e1;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 15px;
  &:hover { background: #e2e8f0; color: #0f172a; }
`;

// Helper for nested state updates
const updateNested = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((acc, key) => acc[key] = acc[key] || {}, obj);
  lastObj[lastKey] = value;
  return { ...obj };
};

const defaultBotData = {
  business_info: { name: "", description: "", location: { address: "", maps_link: "" }, contact: { phone: "", email: "", whatsapp: "", facebook: "", instagram: "" }, hours: { monday_thursday: "", friday_saturday_holidays: "", attention_hours: "" }, slogan: "" },
  general_description: "",
  salon_amenities: { capacity: "", covered_area: "", bathrooms: "", outdoor_patio: "", lighting_sound: "", equipped_kitchen: "", wifi: "" },
  services: [],
  pricing_notes: { deposit: "", payment_methods: "", price_updates: "" },
  faq: [],
  rules_and_policies: { booking: "", cancellation: "", event_duration_notes: "", external_services_policy: "", noise_policy: "", visit_policy: "", phone_call_policy: "", client_responsibility: "" },
  recommended_contacts: []
};

const ChatbotDashboard = () => {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [botData, setBotData] = useState(defaultBotData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [unansweredQueries, setUnansweredQueries] = useState([]);
  const [activeScheduleStructure, setActiveScheduleStructure] = useState('dynamic');

  const syncCatalogFromDatabase = async () => {
    setSyncing(true);
    try {
      const db = getDatabase(getApp());
      const servicesSnapshot = await dbGet(dbRef(db, 'optionalServices'));
      let dbServices = [];
      if (servicesSnapshot.exists()) {
        const data = servicesSnapshot.val();
        dbServices = Array.isArray(data) ? data.filter(s => s) : Object.values(data);
      }

      // Fetch active months config
      const configSnap = await dbGet(dbRef(db, 'datosId/26'));
      let activeMonthsList = [];
      if (configSnap.exists() && configSnap.val().activeMonthsList) {
         activeMonthsList = configSnap.val().activeMonthsList;
      }

      const now = new Date();
      const currentVal = now.getFullYear() * 12 + now.getMonth() + 1;
      const monthNames = { 1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre" };

      // Fetch only valid active months from current month onwards
      const monthsData = {};
      for (const yearMonthStr of activeMonthsList) {
         const [yStr, mStr] = yearMonthStr.split('-');
         const y = parseInt(yStr, 10);
         const m = parseInt(mStr, 10);
         const val = y * 12 + m;

         // Solo de la actualidad en adelante
         if (val >= currentVal) {
            let bucket = val % 24;
            if (bucket === 0) bucket = 24;

            const monthSnap = await dbGet(dbRef(db, `datosId/${bucket}`));
            if (monthSnap.exists()) {
               const mData = monthSnap.val();
               const finalMonthName = `${monthNames[m]} ${y}`;
               monthsData[finalMonthName] = mData;
            }
         }
      }

      // Fetch active schedule structure
      const scheduleStructureSnap = await dbGet(dbRef(db, 'config/activeScheduleStructure'));
      const activeScheduleStructure = scheduleStructureSnap.exists() ? scheduleStructureSnap.val() : 'dynamic';
      const isFixed = activeScheduleStructure === 'fixed';
      const weekdayLabel = isFixed ? 'Lunes a Viernes' : 'Lunes a Jueves';
      const weekendLabel = isFixed ? 'Sábados, Domingos y Feriados' : 'Fin de semana/Feriados';

      // Rebuild the catalog
      const newCatalog = [];

      // Base services manually mapped based on keys
      const baseAlquilerFinde = {
        name: `Alquiler de Salón (${weekendLabel})`,
        description: `Precio base por alquiler de 4 horas en ${weekendLabel.toLowerCase()}.`,
        prices_by_month: {}
      };
      const baseAlquilerSemana = {
        name: `Alquiler de Salón (${weekdayLabel})`,
        description: `Precio promocional por alquiler de 3 horas de ${weekdayLabel.toLowerCase()}.`,
        prices_by_month: {}
      };
      
      const horaExtraFinde = {
        name: "Hora Extra (Fin de semana)",
        description: `Precio por hora adicional en eventos de ${weekendLabel.toLowerCase()}.`,
        prices_by_month: {}
      };

      const horaExtraSemana = {
        name: "Hora Extra (Días de semana)",
        description: `Precio por hora adicional en eventos de ${weekdayLabel.toLowerCase()}.`,
        prices_by_month: {}
      };

      Object.entries(monthsData).forEach(([monthName, mData]) => {
        if (mData['a_precio_4hs_']) baseAlquilerFinde.prices_by_month[monthName] = mData['a_precio_4hs_'];
        if (mData['b_precio_3hs_']) baseAlquilerSemana.prices_by_month[monthName] = mData['b_precio_3hs_'];
        if (mData['c_hora_extra_finde_']) horaExtraFinde.prices_by_month[monthName] = mData['c_hora_extra_finde_'];
        if (mData['d_hora_extra_semana_']) horaExtraSemana.prices_by_month[monthName] = mData['d_hora_extra_semana_'];
      });

      newCatalog.push(baseAlquilerFinde, baseAlquilerSemana, horaExtraFinde, horaExtraSemana);

      // Map optional services
      dbServices.forEach(dbSrv => {
        const catSrv = {
          name: dbSrv.nombre || `Servicio ${dbSrv.id}`,
          description: dbSrv.descripcion || '',
          prices_by_month: {}
        };
        // Use priceKey or fallback to legacy mapping
        const priceKey = dbSrv.priceKey || `servicio_${dbSrv.id}_`;
        let usedLegacy = false;
        const legacyMapping = {
           1: 'b_precio_3hs_',
           3: 'a_precio_4hs_',
           2: 'd_hora_extra_semana_',
           4: 'c_hora_extra_finde_',
           5: 'e_camarera_',
           6: 'f_metegol_',
           8: 'g_pingPong_',
           7: 'h_inflable_',
           10: 'i_proyector_',
           9: 'j_arcade_',
           11: 'k_hora_organizacion_',
           12: 'r_parrillero_'
        };
        const legacyKey = legacyMapping[dbSrv.id];
        
        Object.entries(monthsData).forEach(([monthName, mData]) => {
           if (mData[priceKey]) {
              catSrv.prices_by_month[monthName] = mData[priceKey];
           } else if (legacyKey && mData[legacyKey]) {
              catSrv.prices_by_month[monthName] = mData[legacyKey];
           }
        });
        
        // Only add if it has at least one price
        if (Object.keys(catSrv.prices_by_month).length > 0) {
           newCatalog.push(catSrv);
        }
      });

      setBotData(prev => ({ ...prev, services: newCatalog }));
      toast.success("¡Catálogo sincronizado exitosamente con la base de datos! (No olvides guardar)");

    } catch (error) {
      console.error("Error sincronizando:", error);
      toast.error("Error al sincronizar catálogo.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { getStorage, ref: storageRef, getDownloadURL } = await import('firebase/storage');
        const db = getDatabase(getApp());
        
        // Fetch unanswered queries
        const queriesRef = dbRef(db, 'chatbot_unanswered_queries');
        const queriesSnap = await dbGet(queriesRef);
        if (queriesSnap.exists()) {
            const queries = [];
            queriesSnap.forEach(child => {
                queries.push({ id: child.key, ...child.val() });
            });
            // Sort by timestamp descending
            queries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setUnansweredQueries(queries);
        }

        const storage = getStorage(getApp());
        let fetchedData = {};
        try {
          const botDataRef = storageRef(storage, 'knowledge_base/bot_data_extended.json');
          const botDataUrl = await getDownloadURL(botDataRef);
          const responseBotData = await fetch(botDataUrl, { cache: 'no-store' });
          if (responseBotData.ok) {
            fetchedData = await responseBotData.json();
            // Migrar 'price' a 'prices_by_month' si hace falta
            if (fetchedData.services) {
              fetchedData.services = fetchedData.services.map(s => {
                if (s.price && !s.prices_by_month) {
                  s.prices_by_month = {
                    "Agosto 2026": s.price,
                    "Septiembre 2026": s.price,
                    "Octubre 2026": s.price
                  };
                  delete s.price;
                }
                return s;
              });
            }
          }
        } catch (error) {
          const botDataFallback = await import('../../data/bot_data_extended_fallback.json');
          fetchedData = botDataFallback.default || botDataFallback;
        }
        setBotData({ ...defaultBotData, ...fetchedData });
      } catch (err) {
        console.error("Error fetching content for dashboard:", err);
      } finally {
        setLoading(false);
      }

      // Fetch active schedule structure for display
      try {
        const db = getDatabase(getApp());
        const structSnap = await dbGet(dbRef(db, 'config/activeScheduleStructure'));
        if (structSnap.exists()) {
          setActiveScheduleStructure(structSnap.val());
        }
      } catch (err) {
        console.error("Error fetching activeScheduleStructure:", err);
      }
    };
    fetchContent();
  }, []);

  const handleInputChange = (path, value) => {
    setBotData(prev => updateNested({...prev}, path, value));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    setBotData(prev => {
      const newArray = [...(prev[arrayName] || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addArrayItem = (arrayName, emptyItem) => {
    setBotData(prev => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), emptyItem]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setBotData(prev => {
      const newArray = [...(prev[arrayName] || [])];
      newArray.splice(index, 1);
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleMonthPriceChange = (serviceIndex, month, value) => {
    setBotData(prev => {
      const newServices = [...(prev.services || [])];
      const service = { ...newServices[serviceIndex] };
      service.prices_by_month = { ...service.prices_by_month, [month]: value };
      newServices[serviceIndex] = service;
      return { ...prev, services: newServices };
    });
  };

  const removeMonth = (serviceIndex, month) => {
    setBotData(prev => {
      const newServices = [...(prev.services || [])];
      const service = { ...newServices[serviceIndex] };
      const newPrices = { ...service.prices_by_month };
      delete newPrices[month];
      service.prices_by_month = newPrices;
      newServices[serviceIndex] = service;
      return { ...prev, services: newServices };
    });
  };

  const addMonth = (serviceIndex) => {
    const monthName = prompt("Ingresa el mes y año (ej: Noviembre 2026):");
    if (monthName) {
      setBotData(prev => {
        const newServices = [...(prev.services || [])];
        const service = { ...newServices[serviceIndex] };
        service.prices_by_month = { ...service.prices_by_month, [monthName]: "" };
        newServices[serviceIndex] = service;
        return { ...prev, services: newServices };
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { getStorage, ref: storageRef, uploadString } = await import('firebase/storage');
      const storage = getStorage(getApp());
      const botDataRef = storageRef(storage, 'knowledge_base/bot_data_extended.json');
      await uploadString(botDataRef, JSON.stringify(botData, null, 2), 'raw', { 
        contentType: 'application/json',
        cacheControl: 'no-cache, max-age=0'
      });
      toast.success('¡Datos actualizados exitosamente en la Inteligencia Artificial!');
      setSelectedBadge(null); // Close modal on save
    } catch (err) {
      console.error("Error saving to Firebase:", err);
      toast.error('Error al guardar. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // UI rendering components for different modals
  const renderLocalDataForm = () => (
    <>
      <p className="hint">Estos datos sirven para que el bot responda quiénes somos, cómo contactarnos y qué capacidades tenemos.</p>
      
      <h4>Identidad y Ubicación</h4>
      <FormGroup>
        <label>Nombre del Salón</label>
        <Input value={botData.business_info?.name || ''} onChange={(e) => handleInputChange('business_info.name', e.target.value)} />
      </FormGroup>
      <FormGroup>
        <label>Eslogan</label>
        <Input value={botData.business_info?.slogan || ''} onChange={(e) => handleInputChange('business_info.slogan', e.target.value)} />
      </FormGroup>
      <FormGroup>
        <label>Dirección</label>
        <Input value={botData.business_info?.location?.address || ''} onChange={(e) => handleInputChange('business_info.location.address', e.target.value)} />
      </FormGroup>
      
      <h4>Contacto</h4>
      <FormGroup>
        <label>WhatsApp</label>
        <Input value={botData.business_info?.contact?.whatsapp || ''} onChange={(e) => handleInputChange('business_info.contact.whatsapp', e.target.value)} />
      </FormGroup>
      
      <h4>Comodidades</h4>
      <FormGroup>
        <label>Capacidad</label>
        <Input value={botData.salon_amenities?.capacity || ''} onChange={(e) => handleInputChange('salon_amenities.capacity', e.target.value)} />
      </FormGroup>
      <FormGroup>
        <label>Cocina Equipada</label>
        <TextArea value={botData.salon_amenities?.equipped_kitchen || ''} onChange={(e) => handleInputChange('salon_amenities.equipped_kitchen', e.target.value)} />
      </FormGroup>
    </>
  );

  const renderCatalogoForm = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div>
          <h4 style={{ margin: 0, color: '#0f172a' }}>Sincronización Automática</h4>
          <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            El catálogo ahora se conecta directamente con tu pestaña de Precios y Servicios. Ya no tenés que cargarlo a mano.
          </p>
        </div>
        <PrimaryButton onClick={syncCatalogFromDatabase} disabled={syncing} style={{ width: 'auto', margin: 0, background: '#10b981' }}>
          {syncing ? 'Sincronizando...' : 'Sincronizar Datos'}
        </PrimaryButton>
      </div>

      <p className="hint">Así es como el bot está viendo tus servicios actualmente (solo lectura):</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {(botData.services || []).map((service, index) => (
          <div key={index} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '10px 15px', borderBottom: '1px solid #e2e8f0' }}>
              <h5 style={{ margin: 0, color: '#3b82f6', fontSize: '1rem' }}>{service.name}</h5>
              {service.description && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.2' }}>{service.description}</p>}
            </div>
            <div style={{ padding: '10px 15px' }}>
              { (() => {
                 const entries = Object.entries(service.prices_by_month || {});
                 if (entries.length === 0) return <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Sin precios cargados.</p>;

                 const sortedEntries = entries.sort((a, b) => {
                    const monthOrder = { "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6, "julio": 7, "agosto": 8, "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12 };
                    const parse = (str) => {
                       const yMatch = str.match(/\d{4}/);
                       const y = yMatch ? parseInt(yMatch[0], 10) : 0;
                       let m = 0;
                       const s = str.toLowerCase();
                       for (const [name, num] of Object.entries(monthOrder)) {
                          if (s.includes(name)) { m = num; break; }
                       }
                       return { y, m };
                    };
                    const pA = parse(a[0]);
                    const pB = parse(b[0]);
                    if (pA.y !== pB.y) return pA.y - pB.y;
                    return pA.m - pB.m;
                 });

                 const yearColors = {
                    0: { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" },  // Default Slate
                    1: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },  // Green
                    2: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e3a8a" },  // Blue
                    3: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },  // Yellow
                    4: { bg: "#fdf4ff", border: "#f5d0fe", text: "#86198f" }   // Fuchsia
                 };

                 const uniqueYears = Array.from(new Set(sortedEntries.map(([m]) => {
                    const match = m.match(/\d{4}/);
                    return match ? match[0] : '0';
                 }))).sort();

                 return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px' }}>
                       {sortedEntries.map(([month, price]) => {
                          const yMatch = month.match(/\d{4}/);
                          const yearStr = yMatch ? yMatch[0] : '0';
                          const yearIndex = uniqueYears.indexOf(yearStr);
                          const colors = yearColors[yearIndex % 5] || yearColors[0];
                          
                          let monthName = month;
                          if (yMatch) {
                             const rawName = month.replace(yMatch[0], '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '').trim();
                             if(rawName.length > 0) {
                                monthName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase() + " '" + yearStr.slice(2);
                             }
                          }

                          return (
                             <div key={month} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '4px 6px', background: colors.bg, borderRadius: '4px', border: `1px solid ${colors.border}` }}>
                                <span style={{ fontWeight: 600, color: colors.text }}>{monthName}</span>
                                <span style={{ color: '#0f172a', fontWeight: 700 }}>${price}</span>
                             </div>
                          );
                       })}
                    </div>
                 );
              })() }
            </div>
          </div>
        ))}
      </div>
      {(botData.services || []).length === 0 && (
         <p style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
            El catálogo está vacío. Presioná el botón verde de "Sincronizar Datos" para absorberlos de tu sistema principal.
         </p>
      )}
    </>
  );

  const renderFaqForm = () => (
    <>
      <p className="hint">Entrena al bot cargando las preguntas que más te hacen los clientes.</p>
      {(botData.faq || []).map((faqItem, index) => (
        <ArrayItem key={index}>
          <IconButton onClick={() => removeArrayItem('faq', index)}><Trash2 size={18} /></IconButton>
          <FormGroup>
            <label>Pregunta del cliente</label>
            <Input value={faqItem.question || ''} onChange={(e) => handleArrayChange('faq', index, 'question', e.target.value)} />
          </FormGroup>
          <FormGroup>
            <label>Tu Respuesta</label>
            <TextArea value={faqItem.answer || ''} onChange={(e) => handleArrayChange('faq', index, 'answer', e.target.value)} />
          </FormGroup>
        </ArrayItem>
      ))}
      <SecondaryButton onClick={() => addArrayItem('faq', { question: '', answer: '' })}>
        <Plus size={16} /> Agregar nueva pregunta
      </SecondaryButton>
    </>
  );

  const renderPoliticasForm = () => (
    <>
      <p className="hint">Asegúrate de que el bot comunique correctamente tus límites y reglas operativas.</p>
      <FormGroup>
        <label>Reglas de Reserva y Señas</label>
        <TextArea value={botData.rules_and_policies?.booking || ''} onChange={(e) => handleInputChange('rules_and_policies.booking', e.target.value)} />
      </FormGroup>
      <FormGroup>
        <label>Políticas de Ruido y Vecinos</label>
        <TextArea value={botData.rules_and_policies?.noise_policy || ''} onChange={(e) => handleInputChange('rules_and_policies.noise_policy', e.target.value)} />
      </FormGroup>
      <FormGroup>
        <label>Notas de Precios y Pagos</label>
        <TextArea value={botData.pricing_notes?.payment_methods || ''} onChange={(e) => handleInputChange('pricing_notes.payment_methods', e.target.value)} />
      </FormGroup>
    </>
  );

  const renderContactosForm = () => (
    <>
      <p className="hint">Proveedores que recomiendas (Ej: catering, castillos inflables). El bot dará estos contactos a quien los pida.</p>
      {(botData.recommended_contacts || []).map((contact, index) => (
        <ArrayItem key={index}>
          <IconButton onClick={() => removeArrayItem('recommended_contacts', index)}><Trash2 size={18} /></IconButton>
          <FormGroup>
            <label>Servicio que ofrece</label>
            <Input value={contact.service || ''} placeholder="Ej: Catering de Pizza" onChange={(e) => handleArrayChange('recommended_contacts', index, 'service', e.target.value)} />
          </FormGroup>
          <div style={{display:'flex', gap:'10px'}}>
            <FormGroup style={{flex:1}}>
              <label>Nombre del Contacto</label>
              <Input value={contact.contact_name || ''} onChange={(e) => handleArrayChange('recommended_contacts', index, 'contact_name', e.target.value)} />
            </FormGroup>
            <FormGroup style={{flex:1}}>
              <label>WhatsApp</label>
              <Input value={contact.whatsapp || ''} onChange={(e) => handleArrayChange('recommended_contacts', index, 'whatsapp', e.target.value)} />
            </FormGroup>
          </div>
        </ArrayItem>
      ))}
      <SecondaryButton onClick={() => addArrayItem('recommended_contacts', { service: '', contact_name: '', whatsapp: '' })}>
        <Plus size={16} /> Agregar nuevo contacto
      </SecondaryButton>
    </>
  );

  const modalConfigs = {
    datos_local: { title: "Datos del Local", icon: <Database size={24} color="#166534" />, color: "#166534", form: renderLocalDataForm },
    catalogo: { title: "Catálogo de Servicios", icon: <DollarSign size={24} color="#1d4ed8" />, color: "#1d4ed8", form: renderCatalogoForm },
    faq: { title: "Preguntas Frecuentes", icon: <MessageCircle size={24} color="#86198f" />, color: "#86198f", form: renderFaqForm },
    politicas: { title: "Políticas y Reglas", icon: <ShieldAlert size={24} color="#b91c1c" />, color: "#b91c1c", form: renderPoliticasForm },
    contactos: { title: "Contactos Recomendados", icon: <Bot size={24} color="#b45309" />, color: "#b45309", form: renderContactosForm },
  };

  if (loading) {
    return <DashboardContainer><p>Cargando Dashboard de IA...</p></DashboardContainer>;
  }

  return (
    <DashboardContainer>
      <Header>
        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', padding: '12px', borderRadius: '12px', color: 'white' }}>
          <Bot size={32} />
        </div>
        <div>
          <h2>Panel de Control del Chatbot</h2>
          <p>Edita las reglas, conocimiento y catálogos de tu Inteligencia Artificial.</p>
        </div>
      </Header>

      <Grid>
        <Card>
          <CardHeader color="#3b82f6">
            <div className="icon-wrapper"><Brain size={20} /></div>
            <h3>Lógica y Comportamiento</h3>
          </CardHeader>
          <List bulletColor="#3b82f6">
            <li><strong>Estricto:</strong> Nunca usa conocimiento externo, ni asume información.</li>
            <li><strong>Tono:</strong> Amable, educado, con acento argentino leve.</li>
            <li><strong>Derivación:</strong> Si no sabe la respuesta, deriva a WhatsApp.</li>
          </List>
        </Card>

        <Card>
          <CardHeader color="#10b981">
            <div className="icon-wrapper"><Database size={20} /></div>
            <h3>Orígenes de Información</h3>
          </CardHeader>
          <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 10px' }}>
            Selecciona un área para editar la base de datos que usa el bot:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Badge onClick={() => setSelectedBadge('datos_local')} bg="#dcfce7" color="#166534">Editar Datos del Local</Badge>
            <Badge onClick={() => setSelectedBadge('catalogo')} bg="#dbeafe" color="#1d4ed8">Ver Catálogo Mensual</Badge>
            <Badge onClick={() => setSelectedBadge('faq')} bg="#fae8ff" color="#86198f">Editar Preguntas (FAQ)</Badge>
            <Badge onClick={() => setSelectedBadge('politicas')} bg="#fee2e2" color="#b91c1c">Editar Políticas</Badge>
            <Badge onClick={() => setSelectedBadge('contactos')} bg="#fef3c7" color="#b45309">Editar Contactos</Badge>
          </div>
        </Card>
        <Card>
          <CardHeader color="#8b5cf6">
            <div className="icon-wrapper"><DollarSign size={20} /></div>
            <h3>Cálculo de Precios y Horarios</h3>
          </CardHeader>
          <List bulletColor="#8b5cf6">
            <li>
              <strong>Estructura de horarios:</strong>{' '}
              {activeScheduleStructure === 'fixed' 
                ? 'Fija (Lunes a viernes / Sábados, domingos y feriados)' 
                : 'Dinámica (Lunes a jueves / Viernes, sábados, domingos y feriados)'}
            </li>
            <li><strong>Días de semana:</strong> El bloque base es de 3 horas.</li>
            <li><strong>Fin de semana/Feriados:</strong> El bloque base es de 4 horas.</li>
            <li><strong>Horas Extra:</strong> Suma automáticamente el valor de hora extra al total si el cliente lo pide.</li>
          </List>
        </Card>

        <Card>
          <CardHeader color="#ef4444">
            <div className="icon-wrapper"><ShieldAlert size={20} /></div>
            <h3>Limitaciones (Qué NO hace)</h3>
          </CardHeader>
          <List bulletColor="#ef4444">
            <li><strong>Inventar precios:</strong> Si un servicio no tiene precio en su configuración, pide consultar al humano.</li>
            <li><strong>Tomar reservas finales:</strong> Siempre deriva al humano para coordinar la visita y pago de la seña.</li>
            <li><strong>Hacer descuentos:</strong> Los precios son fijos según el catálogo.</li>
          </List>
        </Card>

        <Card>
          <CardHeader color="#f59e0b">
            <div className="icon-wrapper"><MessageCircle size={20} /></div>
            <h3>Flujo de Interacción</h3>
          </CardHeader>
          <List bulletColor="#f59e0b">
            <li><strong>Paso 1 (Contacto):</strong> Saluda cordialmente y pregunta la fecha del evento para aplicar la tarifa del mes correcto.</li>
            <li><strong>Paso 2 (Descubrimiento):</strong> Consulta el tipo de evento, horario (día/noche) e invitados.</li>
            <li><strong>Paso 3 (Ofrecimiento):</strong> Menciona el servicio de alquiler base. Usa fichas de información mediante tags (`::INFO::alquiler::`, `::INFO::cocina::`, etc.) para dar respuestas detalladas sin gastar tokens de la IA.</li>
            <li><strong>Paso 4 (Presupuestación):</strong> Entrega un presupuesto desglosado y exacto basado en el catálogo. Al final, comparte el link exacto en formato de botón: `::LINK::[Ver Lista de Precios Completa]::/precios::`.</li>
            <li><strong>Paso 5 (Cierre y Derivación):</strong> Deriva a la administración (humano) para coordinar visitas físicas o concretar el pago de la seña.</li>
          </List>
        </Card>

        <Card>
          <CardHeader color="#8b5cf6">
            <div className="icon-wrapper"><Brain size={20} /></div>
            <h3>Optimización de Memoria y Costos</h3>
          </CardHeader>
          <List bulletColor="#8b5cf6">
            <li><strong>Fichas de Información (Info Cards):</strong> Despliega acordeones locales (`::INFO::id::`) con detalles exhaustivos de cocina, baños, reglas y proveedores sin gastar tokens de la IA.</li>
            <li><strong>Memoria de Conversación:</strong> Retiene los últimos 6 mensajes del cliente y bot (tipo de evento, invitados, fecha) para continuar el hilo del chat de forma natural.</li>
            <li><strong>Compresión al Vuelo:</strong> Filtra y comprime la base de datos de Firebase a menos de 1KB antes de enviarla a la IA, garantizando un funcionamiento estable y previniendo caídas por límites de cuota (error 429).</li>
          </List>
        </Card>

        <Card 
          as="a" 
          href="https://groq.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
        >
          <CardHeader color="#14b8a6">
            <div className="icon-wrapper"><Bot size={20} /></div>
            <h3>Especificaciones Técnicas de la IA</h3>
          </CardHeader>
          <List bulletColor="#14b8a6">
            <li><strong>Proveedor y Motor:</strong> GroqCloud (Procesamiento ultrarrápido).</li>
            <li><strong>Costo / Plan Actual:</strong> Gratuito ($0/mes) - Tier Estándar.</li>
            <li><strong>Arquitectura:</strong> Generación Aumentada por Recuperación (RAG) en tiempo real.</li>
            <li><strong>Base de Datos:</strong> Firebase Realtime Database & Storage.</li>
          </List>
        </Card>
        <Card>
          <CardHeader color="#eab308">
            <div className="icon-wrapper"><MessageCircle size={20} /></div>
            <h3>Consultas no respondidas</h3>
          </CardHeader>
          <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 10px' }}>
            Mensajes que el bot no supo responder y derivó a WhatsApp:
          </p>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {unansweredQueries.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No hay consultas pendientes.</p>
            ) : (
              <List bulletColor="#eab308">
                {unansweredQueries.map(q => (
                  <li key={q.id} style={{ display: 'flex', flexDirection: 'column', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '8px', position: 'relative' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>"{q.query}"</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(q.timestamp).toLocaleString('es-AR')}
                    </span>
                    <button 
                      onClick={async () => {
                        try {
                          const db = getDatabase(getApp());
                          await dbSet(dbRef(db, `chatbot_unanswered_queries/${q.id}`), null);
                          setUnansweredQueries(prev => prev.filter(item => item.id !== q.id));
                        } catch(e) { console.error(e) }
                      }}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </List>
            )}
          </div>
        </Card>

      </Grid>      {selectedBadge && modalConfigs[selectedBadge] && (
        <ModalOverlay onClick={() => setSelectedBadge(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h3>
                {modalConfigs[selectedBadge].icon}
                {modalConfigs[selectedBadge].title}
              </h3>
              <button className="close-btn" onClick={() => setSelectedBadge(null)}>
                <X size={24} />
              </button>
            </ModalHeader>
            <ModalBody>
              {modalConfigs[selectedBadge].form()}
              
              <PrimaryButton onClick={handleSave} disabled={saving}>
                <Save size={18} />
                {saving ? 'Guardando en la nube...' : 'Guardar Cambios en la IA'}
              </PrimaryButton>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </DashboardContainer>
  );
};

export default ChatbotDashboard;
