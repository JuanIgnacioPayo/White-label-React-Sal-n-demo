import React, { useState, useEffect } from 'react';
import styled from "styled-components";

import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDatabase, ref as dbRef, get as dbGet, update as dbUpdate } from "firebase/database";
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaCode } from 'react-icons/fa';

// --- Styled Components ---
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: var(--cardGrey, #fffbf5);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 0rem;
  width: 100%;
  max-width: 1200px; /* Increased from 900px */
  margin-left: auto;
  margin-right: auto;
  gap:1.5rem;
  padding-bottom: 40px;
`;

const SectionCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #eee;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 2px solid var(--primaryColor, #b0aa6d);
  padding-bottom: 10px;
  
  h3 {
    margin: 0;
    color: var(--primaryText, #111241);
    font-size: 1.4rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
`;

const FormGroupRow = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  > * {
    flex: 1;
  }
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
  color: var(--primaryText, #111241);
  font-size: 1rem;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid var(--secondaryText, #c6c3c3);
  border-radius: 4px;
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: var(--primaryColor, #b0aa6d);
    box-shadow: 0 0 0 2px rgba(176, 170, 109, 0.3);
  }
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid var(--secondaryText, #c6c3c3);
  border-radius: 4px;
  font-size: 0.95rem; /* Reduced font size */
  min-height: ${props => props.minHeight || '100px'};
  resize: vertical;
  width: 100%;
  box-sizing: border-box;
  font-family: ${props => props.code ? 'monospace' : 'inherit'};
  &:focus {
    outline: none;
    border-color: var(--primaryColor, #b0aa6d);
    box-shadow: 0 0 0 2px rgba(176, 170, 109, 0.3);
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: ${props => props.variant === 'secondary' ? '#f0f0f0' : props.variant === 'danger' ? '#ff4d4f' : 'var(--primaryColor, #b0aa6d)'};
  color: ${props => props.variant === 'secondary' ? '#333' : '#fff'};
  border: ${props => props.variant === 'secondary' ? '1px solid #ccc' : 'none'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.variant === 'secondary' ? '#e0e0e0' : props.variant === 'danger' ? '#d9363e' : 'var(--primaryText, #111241)'};
    color: ${props => props.variant === 'secondary' ? '#333' : '#fff'};
    transform: translateY(-1px);
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const ArrayItemCard = styled.div`
  background: #f9f9f9;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  position: relative;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  &:hover {
    color: #d9363e;
  }
`;

const SaveSection = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
`;

// --- Default Data Structure in case of missing keys ---
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

const AdminKnowledgeBaseEditor = () => {
  const [botData, setBotData] = useState(defaultBotData);
  const [rawJson, setRawJson] = useState('');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [modalTitle, setModalTitle] = useState('');
  const [modalSubtitle, setModalSubtitle] = useState('');
  const [juanButtonText, setJuanButtonText] = useState('');
  const [chatbotButtonText, setChatbotButtonText] = useState('');

  // Handle nested object updates safely
  const updateNested = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const lastObj = keys.reduce((acc, key) => acc[key] = acc[key] || {}, obj);
    lastObj[lastKey] = value;
    return { ...obj };
  };

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

  useEffect(() => {
    const fetchWhatsappModalData = async () => {
      try {
        const db = getDatabase(getApp());
        const modalDataRef = dbRef(db, 'datosId/29');
        const snapshot = await dbGet(modalDataRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setModalTitle(data.contenido36 || '');
          setModalSubtitle(data.contenido40 || '');
          setJuanButtonText(data.contenido37 || '');
          setChatbotButtonText(data.contenido38 || '');
        }
      } catch (error) {
        console.error("Error fetching WhatsApp modal data:", error);
      }
    };
    fetchWhatsappModalData();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const { getStorage, ref: storageRef, getDownloadURL } = await import('firebase/storage');
        const storage = getStorage(getApp());
        
        let fetchedData = {};
        try {
          const botDataRef = storageRef(storage, 'knowledge_base/bot_data_extended.json');
          const botDataUrl = await getDownloadURL(botDataRef);
          const responseBotData = await fetch(botDataUrl, { cache: 'no-store' });
          if (!responseBotData.ok) throw new Error('Network error');
          fetchedData = await responseBotData.json();
        } catch (error) {
          console.warn(`Fallback JSON loaded.`, error);
          const botDataFallback = await import('../../data/bot_data_extended_fallback.json');
          fetchedData = botDataFallback.default || botDataFallback;
        }

        // Merge with default to ensure all nested keys exist
        setBotData({ ...defaultBotData, ...fetchedData });
        setRawJson(JSON.stringify(fetchedData, null, 2));
      } catch (err) {
        console.error("Error fetching content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleSaveBotData = async () => {
    setLoading(true);
    try {
      let dataToSave;
      if (isAdvancedMode) {
         // Validate raw JSON
         dataToSave = JSON.parse(rawJson);
         // Update form state with new JSON just in case they switch back
         setBotData({ ...defaultBotData, ...dataToSave });
      } else {
         dataToSave = botData;
         setRawJson(JSON.stringify(botData, null, 2));
      }

      const { getStorage, ref: storageRef, uploadString } = await import('firebase/storage');
      const storage = getStorage(getApp());
      const botDataRef = storageRef(storage, 'knowledge_base/bot_data_extended.json');
      await uploadString(botDataRef, JSON.stringify(dataToSave, null, 2), 'raw', { 
        contentType: 'application/json',
        cacheControl: 'no-cache, max-age=0'
      });
      toast.success('¡Base de conocimiento guardada exitosamente!');
    } catch (err) {
      console.error("Error saving knowledge base:", err);
      if (err instanceof SyntaxError) {
        toast.error('Error: El JSON crudo no es válido. Revisa la sintaxis.');
      } else {
        toast.error('Error al guardar la base de conocimiento.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWhatsappModalData = async () => {
    setLoading(true);
    try {
      const db = getDatabase(getApp());
      await dbUpdate(dbRef(db, 'datosId/29'), {
        contenido36: modalTitle,
        contenido40: modalSubtitle,
        contenido37: juanButtonText,
        contenido38: chatbotButtonText,
      });
      toast.success('¡Textos del modal guardados exitosamente!');
    } catch (err) {
      toast.error('Error al guardar los textos del modal.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !botData.business_info?.name) {
    return <FormContainer><p>Cargando configuración de la IA...</p></FormContainer>;
  }

  return (
    <FormContainer>
      <h2>Configuración de Inteligencia Artificial</h2>
      <p>Personaliza el comportamiento, textos y base de datos que utiliza tu asistente virtual.</p>

      {/* KNOWLEDGE BASE FORM SECTION */}
      <SectionCard>
        <SectionHeader>
          <h3>Base de Conocimiento de la Empresa</h3>
          <Button variant="secondary" onClick={() => setIsAdvancedMode(!isAdvancedMode)}>
             <FaCode /> {isAdvancedMode ? 'Volver al Formulario' : 'Modo JSON Avanzado'}
          </Button>
        </SectionHeader>
        
        {isAdvancedMode ? (
          <>
            <p style={{fontSize: '0.9rem', color: '#666'}}>
              Edita el código JSON directamente. Cuidado con comillas, corchetes y comas.
            </p>
            <FormGroup>
              <TextArea
                code="true"
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                minHeight="500px"
              />
            </FormGroup>
          </>
        ) : (
          <>
            <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '20px'}}>
              Rellena estos campos con la información de tu salón. El bot la utilizará para responder automáticamente a los clientes.
            </p>
            
            {/* BUSINESS INFO */}
            <h4>1. Información General</h4>
            <FormGroupRow>
              <FormGroup>
                <Label>Nombre del Salón</Label>
                <Input value={botData.business_info?.name || ''} onChange={(e) => handleInputChange('business_info.name', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>Eslogan</Label>
                <Input value={botData.business_info?.slogan || ''} onChange={(e) => handleInputChange('business_info.slogan', e.target.value)} />
              </FormGroup>
            </FormGroupRow>
            <FormGroup>
              <Label>Descripción Corta (Business Info)</Label>
              <TextArea minHeight="80px" value={botData.business_info?.description || ''} onChange={(e) => handleInputChange('business_info.description', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>Descripción General y Larga</Label>
              <TextArea minHeight="120px" value={botData.general_description || ''} onChange={(e) => handleInputChange('general_description', e.target.value)} />
            </FormGroup>

            {/* CONTACT & LOCATION */}
            <h4>2. Contacto y Ubicación</h4>
            <FormGroupRow>
              <FormGroup>
                <Label>Dirección</Label>
                <Input value={botData.business_info?.location?.address || ''} onChange={(e) => handleInputChange('business_info.location.address', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>WhatsApp</Label>
                <Input value={botData.business_info?.contact?.whatsapp || ''} onChange={(e) => handleInputChange('business_info.contact.whatsapp', e.target.value)} />
              </FormGroup>
            </FormGroupRow>
            <FormGroupRow>
              <FormGroup>
                <Label>Teléfono (Explicación para el bot)</Label>
                <Input value={botData.business_info?.contact?.phone || ''} onChange={(e) => handleInputChange('business_info.contact.phone', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>Email</Label>
                <Input value={botData.business_info?.contact?.email || ''} onChange={(e) => handleInputChange('business_info.contact.email', e.target.value)} />
              </FormGroup>
            </FormGroupRow>

            {/* AMENITIES */}
            <h4>3. Comodidades del Salón (Amenities)</h4>
            <FormGroupRow>
              <FormGroup>
                <Label>Capacidad</Label>
                <Input value={botData.salon_amenities?.capacity || ''} onChange={(e) => handleInputChange('salon_amenities.capacity', e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>Baños</Label>
                <Input value={botData.salon_amenities?.bathrooms || ''} onChange={(e) => handleInputChange('salon_amenities.bathrooms', e.target.value)} />
              </FormGroup>
            </FormGroupRow>
            <FormGroup>
              <Label>Cocina Equipada</Label>
              <TextArea minHeight="60px" value={botData.salon_amenities?.equipped_kitchen || ''} onChange={(e) => handleInputChange('salon_amenities.equipped_kitchen', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>Sonido y Luces</Label>
              <TextArea minHeight="60px" value={botData.salon_amenities?.lighting_sound || ''} onChange={(e) => handleInputChange('salon_amenities.lighting_sound', e.target.value)} />
            </FormGroup>

            {/* SERVICES ARRAY */}
            <h4>4. Catálogo de Servicios Adicionales</h4>
            {(botData.services || []).map((service, index) => (
              <ArrayItemCard key={index}>
                <DeleteButton onClick={() => removeArrayItem('services', index)}><FaTrash /></DeleteButton>
                <FormGroupRow>
                  <FormGroup>
                    <Label>Nombre del Servicio</Label>
                    <Input value={service.name || ''} onChange={(e) => handleArrayChange('services', index, 'name', e.target.value)} />
                  </FormGroup>
                  <FormGroup>
                    <Label>Precio (con moneda)</Label>
                    <Input value={service.price || ''} onChange={(e) => handleArrayChange('services', index, 'price', e.target.value)} />
                  </FormGroup>
                </FormGroupRow>
                <FormGroup style={{marginBottom: 0}}>
                  <Label>Descripción</Label>
                  <TextArea minHeight="60px" value={service.description || ''} onChange={(e) => handleArrayChange('services', index, 'description', e.target.value)} />
                </FormGroup>
              </ArrayItemCard>
            ))}
            <Button variant="secondary" onClick={() => addArrayItem('services', { name: '', description: '', price: '' })}>
              <FaPlus /> Agregar Servicio
            </Button>

            {/* FAQ ARRAY */}
            <h4 style={{marginTop: '30px'}}>5. Preguntas Frecuentes (FAQ)</h4>
            {(botData.faq || []).map((faqItem, index) => (
              <ArrayItemCard key={index}>
                <DeleteButton onClick={() => removeArrayItem('faq', index)}><FaTrash /></DeleteButton>
                <FormGroup>
                  <Label>Pregunta</Label>
                  <Input value={faqItem.question || ''} onChange={(e) => handleArrayChange('faq', index, 'question', e.target.value)} />
                </FormGroup>
                <FormGroup style={{marginBottom: 0}}>
                  <Label>Respuesta</Label>
                  <TextArea minHeight="60px" value={faqItem.answer || ''} onChange={(e) => handleArrayChange('faq', index, 'answer', e.target.value)} />
                </FormGroup>
              </ArrayItemCard>
            ))}
            <Button variant="secondary" onClick={() => addArrayItem('faq', { question: '', answer: '' })}>
              <FaPlus /> Agregar Pregunta Frecuente
            </Button>

            {/* RULES */}
            <h4 style={{marginTop: '30px'}}>6. Reglas y Políticas</h4>
            <FormGroup>
              <Label>Reserva y Seña</Label>
              <TextArea minHeight="60px" value={botData.rules_and_policies?.booking || ''} onChange={(e) => handleInputChange('rules_and_policies.booking', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>Políticas de Ruido</Label>
              <TextArea minHeight="60px" value={botData.rules_and_policies?.noise_policy || ''} onChange={(e) => handleInputChange('rules_and_policies.noise_policy', e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>Métodos de Pago (Pricing Notes)</Label>
              <TextArea minHeight="60px" value={botData.pricing_notes?.payment_methods || ''} onChange={(e) => handleInputChange('pricing_notes.payment_methods', e.target.value)} />
            </FormGroup>
          </>
        )}
        
        <SaveSection>
          <Button onClick={handleSaveBotData} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Base de Conocimiento'}
          </Button>
        </SaveSection>
      </SectionCard>


      {/* WHATSAPP MODAL SECTION */}
      <SectionCard>
        <SectionHeader>
          <h3>Textos del Modal de WhatsApp</h3>
        </SectionHeader>
        <FormGroup>
          <Label>Título del modal</Label>
          <Input value={modalTitle} onChange={(e) => setModalTitle(e.target.value)} />
        </FormGroup>
        <FormGroup>
          <Label>Subtítulo del modal</Label>
          <Input value={modalSubtitle} onChange={(e) => setModalSubtitle(e.target.value)} placeholder="Texto más pequeño debajo del título" />
        </FormGroup>
        <FormGroupRow>
          <FormGroup>
            <Label>Botón "Hablar con Juan"</Label>
            <Input value={juanButtonText} onChange={(e) => setJuanButtonText(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>Botón "Chatbot IA"</Label>
            <Input value={chatbotButtonText} onChange={(e) => setChatbotButtonText(e.target.value)} />
          </FormGroup>
        </FormGroupRow>
        <SaveSection>
          <Button onClick={handleSaveWhatsappModalData} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Textos Modal'}
          </Button>
        </SaveSection>
      </SectionCard>

    </FormContainer>
  );
};

export default AdminKnowledgeBaseEditor;