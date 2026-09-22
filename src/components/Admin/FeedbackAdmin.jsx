import React, { useState, useEffect } from 'react';
import { database } from '../../firebase/firebase';
import { ref, onValue, update, remove, get, set } from 'firebase/database';
import styled from 'styled-components';
import { Bug, MessageSquare, Trash2, CheckCircle, Clock, ExternalLink, Settings, Bell, Mail, Phone, Save } from 'lucide-react';


const AdminContainer = styled.div`
  max-width: 1000px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: 'product_sansregular', sans-serif;
`;

const InfoBox = styled.div`
  background: #f0f7ff;
  border: 1px solid #cce3fd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: #0056b3;
  font-size: 0.9rem;
  line-height: 1.4;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const ConfigSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #eee;
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 15px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ConfigGroup = styled.div`
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
`;

const SaveButton = styled.button`
  margin-top: 20px;
  background: #2196f3;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  transition: background 0.2s;

  &:hover {
    background: #1976d2;
  }
`;

const FeedbackCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border-left: 5px solid ${props => props.type === 'bug' ? '#ff5722' : '#2196f3'};
  opacity: ${props => props.status === 'read' ? 0.7 : 1};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 15px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const Badge = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  background: ${props => props.type === 'bug' ? '#fff0eb' : '#e3f2fd'};
  color: ${props => props.type === 'bug' ? '#ff5722' : '#2196f3'};
`;

const Timestamp = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #888;
  font-size: 0.8rem;
`;

const Description = styled.p`
  margin: 0.5rem 0;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
`;

const PageInfo = styled.div`
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #666;
  background: #f9f9f9;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  background: none;
  border: 1px solid #ddd;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    border-color: #ccc;
  }

  &.mark-read {
    color: #4caf50;
    border-color: #4caf50;
    &:hover { background: #e8f5e9; }
  }

  &.delete {
    color: #f44336;
    border-color: #f44336;
    &:hover { background: #ffebee; }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #888;
`;

const FeedbackAdmin = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfig, setShowConfig] = useState(false);
    
    const [waConfig, setWaConfig] = useState({ enabled: false, phone: '', apikey: '' });
    const [emailConfig, setEmailConfig] = useState({ enabled: false, to: '', user: '', pass: '' });

    useEffect(() => {
        // Cargar feedbacks
        const feedbackRef = ref(database, 'feedback');
        const unsubscribe = onValue(feedbackRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([id, value]) => ({
                    id,
                    ...value
                })).sort((a, b) => b.timestamp - a.timestamp);
                setFeedbacks(list);
            } else {
                setFeedbacks([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error cargando feedback:", error);
            setLoading(false);
        });

        // Cargar configuración de alertas
        get(ref(database, 'settings/feedbackAlerts')).then((snapshot) => {
            if (snapshot.exists()) {
                const config = snapshot.val();
                if (config.wa) setWaConfig(config.wa);
                if (config.email) setEmailConfig(config.email);
            }
        });

        // Timeout de seguridad
        const timer = setTimeout(() => {
            setLoading(false);
        }, 3000);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const saveSettings = async () => {
        try {
            await set(ref(database, 'settings/feedbackAlerts'), {
                wa: waConfig,
                email: emailConfig
            });
            alert('Configuración guardada correctamente');
            setShowConfig(false);
        } catch (error) {
            console.error("Error al guardar:", error);
            alert('Error al guardar la configuración');
        }
    };

    const markAsRead = (id) => {
        const feedbackRef = ref(database, `feedback/${id}`);
        update(feedbackRef, { status: 'read' });
    };

    const deleteFeedback = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este reporte?')) {
            const feedbackRef = ref(database, `feedback/${id}`);
            remove(feedbackRef);
        }
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        const date = new Date(ts);
        return date.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h2 style={{ margin: 0 }}>Buzón de Feedback y Reportes</h2>
                <ActionButton onClick={() => setShowConfig(!showConfig)}>
                    <Settings size={16} /> {showConfig ? 'Cerrar Ajustes' : 'Configurar Alertas'}
                </ActionButton>
            </div>

            <InfoBox>
                <MessageSquare size={20} />
                <div>
                    <strong>¿Para qué sirve esta sección?</strong><br />
                    Aquí centralizamos todos los comentarios, reportes de errores y sugerencias que los usuarios envían desde el sitio web. 
                    Te permite conocer su experiencia de uso y detectar problemas técnicos rápidamente. Además, puedes configurar 
                    <strong> alertas automáticas</strong> para recibir estos avisos por WhatsApp o Email al instante.
                </div>
            </InfoBox>

            {showConfig && (
                <ConfigSection>
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={20} /> Configuración de Notificaciones Activas
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>
                        Configura cómo deseas recibir las alertas en tiempo real cuando un usuario envíe feedback.
                    </p>
                    
                    <ConfigGrid>
                        <ConfigGroup>
                            <CheckboxLabel>
                                <input 
                                    type="checkbox" 
                                    checked={waConfig.enabled} 
                                    onChange={e => setWaConfig({...waConfig, enabled: e.target.checked})} 
                                />
                                <Phone size={16} color="#25D366" /> WhatsApp (CallMeBot)
                            </CheckboxLabel>
                            <label style={{ fontSize: '0.8rem' }}>Número (ej: 54911...):</label>
                            <Input 
                                placeholder="54911XXXXXXXX" 
                                value={waConfig.phone || ''} 
                                onChange={e => setWaConfig({...waConfig, phone: e.target.value})} 
                            />
                            <label style={{ fontSize: '0.8rem' }}>API Key:</label>
                            <Input 
                                type="password" 
                                placeholder="Tu API Key de CallMeBot" 
                                value={waConfig.apikey || ''} 
                                onChange={e => setWaConfig({...waConfig, apikey: e.target.value})} 
                            />
                            <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: '#2196f3' }}>
                                ¿Cómo obtener mi API Key?
                            </a>
                        </ConfigGroup>

                        <ConfigGroup>
                            <CheckboxLabel>
                                <input 
                                    type="checkbox" 
                                    checked={emailConfig.enabled} 
                                    onChange={e => setEmailConfig({...emailConfig, enabled: e.target.checked})} 
                                />
                                <Mail size={16} color="#ff5722" /> Email (Nodemailer)
                            </CheckboxLabel>
                            <label style={{ fontSize: '0.8rem' }}>Enviar a:</label>
                            <Input 
                                placeholder="tuemail@gmail.com" 
                                value={emailConfig.to || ''} 
                                onChange={e => setEmailConfig({...emailConfig, to: e.target.value})} 
                            />
                            <label style={{ fontSize: '0.8rem' }}>Gmail Usuario (Emisor):</label>
                            <Input 
                                placeholder="sender@gmail.com" 
                                value={emailConfig.user || ''} 
                                onChange={e => setEmailConfig({...emailConfig, user: e.target.value})} 
                            />
                            <label style={{ fontSize: '0.8rem' }}>Contraseña de Aplicación:</label>
                            <Input 
                                type="password" 
                                placeholder="App Password de Google" 
                                value={emailConfig.pass || ''} 
                                onChange={e => setEmailConfig({...emailConfig, pass: e.target.value})} 
                            />
                            <p style={{ fontSize: '0.65rem', color: '#888', margin: 0 }}>
                                * Requiere una "Contraseña de Aplicación" generada en tu cuenta de Google.
                            </p>
                        </ConfigGroup>
                    </ConfigGrid>

                    <SaveButton onClick={saveSettings}>
                        <Save size={18} /> Guardar Configuración
                    </SaveButton>
                </ConfigSection>
            )}

            {loading ? (
                <EmptyState>Buscando reportes en la base de datos...</EmptyState>
            ) : feedbacks.length === 0 ? (
                <EmptyState>No hay reportes ni sugerencias por el momento.</EmptyState>
            ) : (
                feedbacks.map((f) => (
                    <FeedbackCard key={f.id} type={f.type} status={f.status}>
                        <CardHeader>
                            <Badge type={f.type}>
                                {f.type === 'bug' ? <Bug size={14} /> : <MessageSquare size={14} />}
                                {f.type === 'bug' ? 'Desperfecto' : 'Sugerencia'}
                            </Badge>
                            <Timestamp>
                                <Clock size={14} />
                                {formatDate(f.timestamp)}
                            </Timestamp>
                        </CardHeader>
                        <Description>{f.description}</Description>
                        {f.page && (
                            <PageInfo>
                                <ExternalLink size={14} />
                                Origen: <strong>{f.page}</strong>
                            </PageInfo>
                        )}
                        <Actions>
                            {f.status !== 'read' && (
                                <ActionButton className="mark-read" onClick={() => markAsRead(f.id)}>
                                    <CheckCircle size={14} /> Marcar como leído
                                </ActionButton>
                            )}
                            <ActionButton className="delete" onClick={() => deleteFeedback(f.id)}>
                                <Trash2 size={14} /> Eliminar
                            </ActionButton>
                        </Actions>
                    </FeedbackCard>
                ))
            )}
        </AdminContainer>
    );
};

export default FeedbackAdmin;
