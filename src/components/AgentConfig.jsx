import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, update, onValue, set } from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/firebase";
import NewsAudioButton from './Chatbot/NewsAudioButton';

const Section = styled.section`
  padding: 0;
  width: 100%;
`;

const Container = styled.div`
  max-width: 1000px;
  position: relative;
  background-color: var(--card-grey, #f4f4f4);
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  padding: 1rem;
  font-family: 'product_sansregular', sans-serif;
  padding-bottom: 2rem;

  @media (min-width: 600px) {
    padding: 2rem;
  }
`;

const Title = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 200px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: bold;
  color: #555;
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  width: 100%;
  font-family: 'product_sansregular', sans-serif;
`;

const Button = styled.button`
  padding: 12px 25px;
  background-color: ${props => props.disabled ? '#ccc' : 'var(--primaryColor, #b0aa6d)'};
  color: var(--whiteText, #ffffff);
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);

  &:hover {
    background-color: ${props => props.disabled ? '#ccc' : 'var(--primaryText, #111241)'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 6px 12px rgba(0,0,0,0.3)'};
  }
`;

const ResponsiveFlexRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (min-width: 600px) {
    flex-direction: row;
  }
`;

const CollapsibleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: rgba(176, 170, 109, 0.1); /* faded primary color */
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0;
  border: 1px solid var(--primaryColor, #b0aa6d);
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(176, 170, 109, 0.2);
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--primaryText, #333);
    border: none;
    padding: 0;
  }
`;

const SectionTitle = styled.h3`
  margin-top: 0;
  color: var(--primaryText, #333);
  border-bottom: 2px solid var(--primaryColor, #b0aa6d);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
`;

const CollapsibleContent = styled.div`
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const CollapsibleSection = ({ title, isOpen, onToggle, children }) => {
    return (
        <div style={{ marginBottom: '0.5rem' }}>
            <CollapsibleHeader onClick={onToggle}>
                <SectionTitle as="h3" style={{ borderBottom: 'none', marginBottom: 0 }}>{title}</SectionTitle>
                <span style={{ fontSize: '1.2rem', color: 'var(--primaryText, #333)' }}>{isOpen ? '▲' : '▼'}</span>
            </CollapsibleHeader>
            {isOpen && (
                <CollapsibleContent>
                    {children}
                </CollapsibleContent>
            )}
        </div>
    );
};

const StatusMessage = styled.div`
  text-align: center;
  color: ${props => props.$error ? '#f44336' : '#333'};
  font-weight: bold;
  min-height: 1.5rem;
  background-color: #f0f7ff;
`;

const Spinner = styled.div`
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top: 3px solid #fff;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const GlobalProgressContainer = styled.div`
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  margin: 15px 0;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
`;

const GlobalProgressBar = styled.div`
  height: 100%;
  background-color: #4CAF50;
  width: ${props => props.$progress}%;
  transition: width 0.5s ease-in-out;
  background-image: ${props => props.$isIdle ? 'none' : 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)'};
  background-size: 1rem 1rem;
  animation: ${props => props.$isIdle ? 'none' : 'progress-bar-stripes 1s linear infinite'};

  @keyframes progress-bar-stripes {
    0% { background-position: 1rem 0; }
    100% { background-position: 0 0; }
  }
`;

const FloatingActionContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 800px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: 1px solid rgba(0,0,0,0.05);
  backdrop-filter: blur(5px);

  @media (max-width: 768px) {
    bottom: 10px;
    width: 95%;
    padding: 10px;
  }
`;



const AgentDebug = ({ globalProgress, agentName }) => {
    // Determine if process is truly active for animation purposes
    const inactiveStages = ['idle', 'completed', 'success', 'error', 'finished'];
    const isIdle = !globalProgress.stage || inactiveStages.includes(globalProgress.stage.toLowerCase());

    const isRunning = !isIdle;
    const hasError = globalProgress.message && globalProgress.message.toLowerCase().includes('error');

    // Create a "virtual" stat item for the global process
    const globalStat = {
        name: `Proceso ${agentName}`,
        url: "Sistema Interno",
        lastRunArticles: isRunning ? "En curso..." : (hasError ? 0 : 1),
        periodArticles: 1,
        totalArticles: 1,
        lastError: hasError ? globalProgress.message : null
    };

    const successStats = !hasError ? [globalStat] : [];
    const errorStats = hasError ? [globalStat] : [];

    const renderSuccessTable = (dataItems) => (
        <div style={{ marginTop: '10px', background: 'white', padding: '0', border: '1px solid #ccc', maxHeight: '300px', overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                    <tr style={{ background: '#eee', textAlign: 'left' }}>
                        <th style={{ padding: '5px' }}>Fuente / Proceso</th>
                        <th style={{ padding: '5px' }}>Estado Actual</th>
                        <th style={{ padding: '5px' }}>Info</th>
                        <th style={{ padding: '5px' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {dataItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '5px', fontWeight: 'bold' }}>{item.name}</td>
                            <td style={{ padding: '5px' }}>{item.lastRunArticles}</td>
                            <td style={{ padding: '5px' }}>{globalProgress.stage}</td>
                            <td style={{ padding: '5px', color: 'green', fontWeight: 'bold' }}>OK</td>
                        </tr>
                    ))}
                    {dataItems.length === 0 && (
                        <tr><td colSpan="4" style={{ padding: '10px', textAlign: 'center' }}>Sin actividad reciente exitosa.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderErrorTable = (dataItems) => (
        <div style={{ marginTop: '10px', background: 'white', padding: '0', border: '1px solid #ccc', maxHeight: '300px', overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                    <tr style={{ background: '#eee', textAlign: 'left' }}>
                        <th style={{ padding: '5px', width: '30%' }}>Fuente / Proceso</th>
                        <th style={{ padding: '5px', width: '70%' }}>Detalles del Error</th>
                    </tr>
                </thead>
                <tbody>
                    {dataItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee', background: '#fff0f0' }}>
                            <td style={{ padding: '5px', fontWeight: 'bold' }}>{item.name}</td>
                            <td style={{ padding: '5px', color: '#d32f2f', wordBreak: 'break-all' }}>{item.lastError || "Error desconocido"}</td>
                        </tr>
                    ))}
                    {dataItems.length === 0 && (
                        <tr><td colSpan="2" style={{ padding: '10px', textAlign: 'center' }}>No hay errores reportados.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ padding: '10px', background: '#e0f2f1', border: '1px solid #009688', fontSize: '12px', borderRadius: '4px' }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#00796b' }}>
                Monitor de Ejecución ({agentName})
            </div>

            <div style={{ marginBottom: '15px' }}>
                <strong>Progreso Global:</strong> {isIdle ? 'Inactivo' : globalProgress.stage} ({Math.round(globalProgress.progress || 0)}%)
                <GlobalProgressContainer style={{ height: '10px', margin: '5px 0' }}>
                    <GlobalProgressBar
                        $progress={globalProgress.progress || 0}
                        $isIdle={isIdle}
                    />
                </GlobalProgressContainer>
                <div style={{
                    padding: '8px',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere'
                }}>
                    {globalProgress.message || "Esperando instrucciones..."}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <div>
                    <strong>Procesos Exitosos</strong>
                    {renderSuccessTable(successStats)}
                </div>
                <div>
                    <strong>Errores Recientes</strong>
                    {renderErrorTable(errorStats)}
                </div>
            </div>
        </div>
    );
};


const AgentConfig = ({ agentId, agentName, collapseSignal }) => {
    const [config, setConfig] = useState({
        updateInterval: 24,
        description: '',
        personality: '',
        summaryLength: 200
    });
    const [agentSources, setAgentSources] = useState([]);
    const [newAgentSource, setNewAgentSource] = useState({ name: '', value: '', type: 'channel' });
    const [suggestedChannels, setSuggestedChannels] = useState([]);
    const [isSearchingChannels, setIsSearchingChannels] = useState(false);

    // New States
    const [agentSummary, setAgentSummary] = useState(null);
    const [globalProgress, setGlobalProgress] = useState({ stage: 'idle', progress: 0, message: '' });
    const [pdfUrlInput, setPdfUrlInput] = useState('');
    const [isUploadingPdf, setIsUploadingPdf] = useState(false);

    // Collapsible State
    const [collapsedSections, setCollapsedSections] = useState({
        agentSources: false, // false = HIDDEN (Based on ! usage in template) - WAIT, checking verification again.
        // Line 881: isOpen={!collapsedSections.agentSources}
        // IF agentSources is FALSE, then !false -> TRUE (OPEN). 
        // SO FALSE = OPEN. TRUE = COLLAPSED.

        summary: true, // Line 799: isOpen={collapsedSections.summary} -> TRUE = OPEN.

        status: false // Line 1033: isOpen={collapsedSections.status} -> FALSE = CLOSED.
    });

    useEffect(() => {
        if (collapseSignal > 0) {
            setCollapsedSections({
                agentSources: true, // TRUE = COLLAPSED (because of logic !true = false)
                summary: false,     // FALSE = COLLAPSED
                status: false       // FALSE = COLLAPSED
            });
        }
    }, [collapseSignal]);

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', error: false });

    const [allAgents, setAllAgents] = useState([]);
    const [selectedAgentId, setSelectedAgentId] = useState('');

    const db = getDatabase(app);
    const functions = getFunctions(app);
    const userInteracted = useRef(false);

    useEffect(() => {
        // Load Agent Settings
        const agentConfigRef = ref(db, `config/agents/${agentId}/settings`);
        const unsubscribeAgentConfig = onValue(agentConfigRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setConfig(prev => {
                    const newConfig = {
                        ...prev,
                        updateInterval: data.updateInterval ?? 24,
                        description: data.description || '',
                        personality: data.personality || '',
                        summaryLength: data.summaryLength || 200
                    };
                    // Simple equality check to prevent re-renders
                    if (JSON.stringify(prev) === JSON.stringify(newConfig)) return prev;
                    return newConfig;
                });

                if (data.sources) {
                    setAgentSources(prev => {
                        if (JSON.stringify(prev) === JSON.stringify(data.sources)) return prev;
                        return data.sources;
                    });
                }
            } else {
                setAgentSources([]);
            }
        });

        // Load Today's Agent Summary
        const today = new Date().toISOString().split('T')[0];
        const summaryRef = ref(db, `agent_summaries/${agentId}/${today}`);
        const unsubscribeSummary = onValue(summaryRef, (snapshot) => {
            if (snapshot.exists()) {
                const val = snapshot.val();
                setAgentSummary(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(val)) return prev;
                    return val;
                });
            } else {
                setAgentSummary(null);
            }
        });

        // Subscribe to Global Progress specific for this Agent
        const progressRef = ref(db, `agentStatus/${agentId}/global`);
        const unsubscribeGlobalProgress = onValue(progressRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setGlobalProgress(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
                    return data;
                });
                // Also update local status if active
                if (data.stage && data.stage !== 'idle') {
                    setStatus(prev => {
                        const newMsg = data.message || `Procesando ${agentName}...`;
                        if (prev.message === newMsg && prev.error === false) return prev;
                        return { message: newMsg, error: false };
                    });
                }
            }
        });

        // Load All Agents for Internal Sources
        const agentsRef = ref(db, 'config/agents');
        const unsubscribeAgents = onValue(agentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const agentsList = Object.entries(data).map(([id, val]) => ({
                    id,
                    name: val.name
                })).filter(a => a.id !== agentId); // Exclude self

                setAllAgents(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(agentsList)) return prev;
                    return agentsList;
                });
            }
        });

        return () => {
            unsubscribeAgentConfig();
            unsubscribeSummary();
            unsubscribeGlobalProgress();
            unsubscribeAgents();
        };
    }, [db, agentId, agentName]);

    const saveAgentSettings = async (updates) => {
        try {
            await update(ref(db, `config/agents/${agentId}/settings`), updates);
            setStatus({ message: 'Configuración guardada.', error: false });
            setTimeout(() => setStatus(prev => prev.message ? { message: '', error: false } : prev), 2000);
        } catch (e) {
            console.error("Agent Persistence Error:", e);
            setStatus({ message: 'Error al guardar configuración.', error: true });
        }
    };

    const toggleSection = (section) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleForceRefreshAgent = async () => {
        if (!window.confirm(`¿Seguro que quieres actualizar el resumen de ${agentName}?`)) return;

        setLoading(true);
        setStatus({ message: `Actualizando resumen de ${agentName}...`, error: false });

        try {
            const abortRef = ref(db, `status/actionFlags/abort_${agentId}`);
            await set(abortRef, false);

            const forceRefreshFn = httpsCallable(functions, 'forceRefreshAgent');
            await forceRefreshFn({ agentId: agentId });
            setStatus({ message: `¡Resumen de ${agentName} actualizado!`, error: false });
        } catch (error) {
            console.error("Error updating agent summary:", error);
            const detailedMessage = error.message || error.toString();
            setStatus({ message: `Error al actualizar: ${detailedMessage}`, error: true });
        } finally {
            setLoading(false);
        }
    };

    const handleStopAgent = async () => {
        if (!window.confirm("¿Detener el proceso actual?")) return;
        try {
            const abortRef = ref(db, `status/actionFlags/abort_${agentId}`);
            await set(abortRef, true);
            setStatus({ message: 'Se envió la señal de detención.', error: false });
        } catch (e) {
            console.error("Error setting abort flag:", e);
            setStatus({ message: 'Error al intentar detener.', error: true });
        }
    };

    const handleDeleteAgent = async () => {
        if (!window.confirm(`⚠️ PELIGRO: ¿Estás seguro de que quieres ELIMINAR a ${agentName}?\n\nEsta acción es irreversible y borrará toda la configuración, historial y resúmenes de este agente.`)) return;

        // Double confirmation for safety
        if (!window.confirm(`Confirmación Final: ¿Realmente deseas eliminar a ${agentName}?`)) return;

        setLoading(true);
        setStatus({ message: `Eliminando agente ${agentName}...`, error: false });
        setGlobalProgress({ stage: 'deleting', progress: 50, message: 'Eliminando datos...' });

        try {
            const deleteAgentFn = httpsCallable(functions, 'deleteAgent');
            await deleteAgentFn({ agentId: agentId });

            setStatus({ message: `¡Agente ${agentName} eliminado correctamente!`, error: false });
            // The parent component (AgentsManager) should detect the deletion via its listener and update the UI

        } catch (error) {
            console.error("Error deleting agent:", error);
            const detailedMessage = error.message || error.toString();
            setStatus({ message: `Error al eliminar: ${detailedMessage}`, error: true });
            setGlobalProgress({ stage: 'error', progress: 0, message: 'Fallo eliminación' });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSource = (index) => {
        const updatedSources = agentSources.filter((_, i) => i !== index);
        setAgentSources(updatedSources);
        saveAgentSettings({ sources: updatedSources });
    };

    const handleAddSuggestedChannel = (channel) => {
        const sourceValue = channel.channelId || channel.name;
        const newSource = {
            name: channel.name,
            value: sourceValue,
            type: 'channel',
            thumbnail: channel.thumbnail || ''
        };

        if (agentSources.some(s => s.value === newSource.value)) return;

        const updatedSources = [...agentSources, newSource];
        setAgentSources(updatedSources);
        setSuggestedChannels(suggestedChannels.filter(c => c.channelId !== channel.channelId));
        saveAgentSettings({ sources: updatedSources });
    };

    const handleAiChannelSearch = async () => {
        if (!newAgentSource.name.trim()) return;

        setIsSearchingChannels(true);
        setSuggestedChannels([]);
        setStatus({ message: "Buscando canales con IA...", error: false });

        try {
            const prompt = `encontrar canales de youtube para ${newAgentSource.name}`;
            const { askGeminiAI } = await import('../../services/geminiService');
            const result = await askGeminiAI(prompt, "Eres un buscador de canales de youtube. Responde estrictamente con un JSON sin formato de bloques de codigo. Ejemplo: [{ 'name': 'Canal', 'channelId': 'UC123' }]");

            let aiResponseChannels = [];
            try {
                let cleanResponse = result;
                const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
                if (jsonMatch) cleanResponse = jsonMatch[0];
                aiResponseChannels = JSON.parse(cleanResponse);
            } catch (e) {
                console.error("Error parsing JSON from AI:", e);
                setStatus({ message: "La IA no devolvió un formato válido.", error: true });
            }

            if (Array.isArray(aiResponseChannels)) {
                setSuggestedChannels(aiResponseChannels);
                setStatus({ message: `Se encontraron ${aiResponseChannels.length} canales sugeridos.`, error: false });
            }
        } catch (error) {
            console.error("AI Channel Search Error:", error);
            setStatus({ message: "Error al buscar canales.", error: true });
        } finally {
            setIsSearchingChannels(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        userInteracted.current = true;
        setConfig(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        if (!userInteracted.current) return;
        const timeoutId = setTimeout(() => {
            saveAgentSettings({
                updateInterval: parseInt(config.updateInterval),
                description: config.description,
                personality: config.personality,
                summaryLength: parseInt(config.summaryLength)
            });
            userInteracted.current = false;
        }, 1500);
        return () => clearTimeout(timeoutId);
    }, [config.updateInterval, config.description, config.personality, config.summaryLength]);

    const handleAddGlobalNews = () => {
        const newSource = {
            name: 'Resumen Global de Noticias',
            value: 'news_global',
            type: 'internal_news',
            thumbnail: ''
        };
        if (agentSources.some(s => s.value === newSource.value)) return;

        const updatedSources = [...agentSources, newSource];
        setAgentSources(updatedSources);
        saveAgentSettings({ sources: updatedSources });
    };

    const handleAddAgentSource = () => {
        if (!selectedAgentId) return;
        const agentToAdd = allAgents.find(a => a.id === selectedAgentId);
        if (!agentToAdd) return;

        const newSource = {
            name: `Agente: ${agentToAdd.name}`,
            value: `agent_${agentToAdd.id}`,
            type: 'internal_agent',
            thumbnail: ''
        };

        if (agentSources.some(s => s.value === newSource.value)) return;

        const updatedSources = [...agentSources, newSource];
        setAgentSources(updatedSources);
        saveAgentSettings({ sources: updatedSources });
        setSelectedAgentId('');
    };

    const handleUploadPdf = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Solo se permiten archivos PDF.');
            return;
        }

        // 10MB limit check
        if (file.size > 10 * 1024 * 1024) {
            alert("El archivo es demasiado grande (>10MB).");
            return;
        }

        setIsUploadingPdf(true);
        setStatus({ message: "Subiendo y procesando PDF...", error: false });

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            try {
                const uploadPdfFn = httpsCallable(functions, 'uploadAgentPdf');
                await uploadPdfFn({
                    agentId: agentId,
                    fileData: base64Data,
                    fileName: file.name
                });

                setStatus({ message: "PDF procesado correctamente.", error: false });
            } catch (error) {
                console.error("Error uploading PDF:", error);
                const msg = error.details?.message || error.message || "Error desconocido";
                setStatus({ message: `Error al subir PDF: ${msg}`, error: true });
            } finally {
                setIsUploadingPdf(false);
                e.target.value = null; // Reset input
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAddPdfLink = () => {
        if (!pdfUrlInput.trim()) return;

        try {
            new URL(pdfUrlInput);
        } catch (_) {
            setStatus({ message: "URL inválida.", error: true });
            return;
        }

        const newSource = {
            name: 'PDF Cloud: ' + pdfUrlInput.split('/').pop(),
            value: pdfUrlInput,
            type: 'pdf_link',
            thumbnail: ''
        };

        if (agentSources.some(s => s.value === newSource.value)) {
            setStatus({ message: "Este link ya está agregado.", error: true });
            return;
        }

        const updatedSources = [...agentSources, newSource];
        setAgentSources(updatedSources);
        saveAgentSettings({ sources: updatedSources });
        setPdfUrlInput('');
        setStatus({ message: "Link de PDF agregado.", error: false });
    };

    return (
        <Section>
            <Container>
                <Title>Configuración: {agentName}</Title>

                <Content>
                    <FormGroup>
                        <Label>Intervalo de Actualización (Horas):</Label>
                        <Input
                            type="number"
                            name="updateInterval"
                            value={config.updateInterval}
                            onChange={handleChange}
                            min="0"
                            max="72"
                        />
                        {parseInt(config.updateInterval) === 0 && (
                            <span style={{ color: '#d32f2f', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                ⚠️ Agente Desactivado (No generará costos)
                            </span>
                        )}
                    </FormGroup>

                    <FormGroup>
                        <Label>Personalidad del Agente:</Label>
                        <textarea
                            name="personality"
                            value={config.personality}
                            onChange={handleChange}
                            placeholder="Ej: Eres un analista financiero serio y conciso..."
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                fontSize: '0.95rem',
                                fontFamily: 'product_sansregular, sans-serif',
                                minHeight: '100px',
                                width: '100%',
                                resize: 'vertical'
                            }}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Largo del Resumen (Palabras aprox):</Label>
                        <Input
                            type="number"
                            name="summaryLength"
                            value={config.summaryLength}
                            onChange={handleChange}
                            min="50"
                            max="1000"
                            step="10"
                        />
                    </FormGroup>

                    {/* Resumen Actual Section */}
                    <CollapsibleSection
                        title="Resumen Actual"
                        isOpen={collapsedSections.summary}
                        onToggle={() => toggleSection('summary')}
                    >
                        {agentSummary ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Generado el: {new Date(agentSummary.generatedAt).toLocaleString()}</span>
                                    <span>{agentSummary.text.split(/\s+/).length} palabras</span>
                                </div>

                                {agentSummary.audioUrl && (
                                    <div style={{ fontSize: '0.9rem', color: '#4caf50', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span>✅</span> <strong>Audio disponible</strong> (Ver controles abajo)
                                    </div>
                                )}

                                <div style={{
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.6',
                                    color: '#333',
                                    background: '#fff3e0',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ffe0b2'
                                }}>
                                    {agentSummary.text}
                                </div>


                                {agentSummary.usedVideos && agentSummary.usedVideos.length > 0 && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <details style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #eee', cursor: 'pointer' }}>
                                            <summary style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#555', outline: 'none' }}>
                                                📹 Ver videos analizados ({agentSummary.usedVideos.length})
                                            </summary>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                                {agentSummary.usedVideos.map((video, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                                                        {/* Thumbnail */}
                                                        <div style={{ flex: '0 0 80px', height: '60px', background: '#ccc', borderRadius: '4px', overflow: 'hidden' }}>
                                                            {video.thumbnail ? (
                                                                <img src={video.thumbnail} alt="miniatura" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>▶</div>
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                                                            <a
                                                                href={video.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1565c0', textDecoration: 'none', lineHeight: '1.2', marginBottom: '2px', display: 'block' }}
                                                            >
                                                                {video.title}
                                                            </a>
                                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                                                {video.channelTitle || 'Canal desconocido'}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>
                                                                {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : 'Fecha desconocida'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p style={{ fontStyle: 'italic', color: '#888' }}>
                                No hay resumen generado para el día de hoy.
                            </p>
                        )}
                    </CollapsibleSection>

                    {/* Agent Sources Config */}
                    <CollapsibleSection
                        title={`Fuentes de ${agentName} (${agentSources.length})`}
                        isOpen={!collapsedSections.agentSources}
                        onToggle={() => toggleSection('agentSources')}
                    >
                        {/* Internal Sources Section */}
                        <div style={{ marginBottom: '1.5rem', padding: '10px', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #90caf9' }}>
                            <Label style={{ color: '#1565c0' }}>Fuentes Internas:</Label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <Button
                                    onClick={handleAddGlobalNews}
                                    disabled={agentSources.some(s => s.value === 'news_global')}
                                    style={{ fontSize: '0.9rem', padding: '8px', background: '#1976d2' }}
                                >
                                    📰 Agregar Resumen Global de Noticias
                                </Button>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <select
                                        value={selectedAgentId}
                                        onChange={(e) => setSelectedAgentId(e.target.value)}
                                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    >
                                        <option value="">-- Seleccionar otro Agente --</option>
                                        {allAgents.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                    <Button
                                        onClick={handleAddAgentSource}
                                        disabled={!selectedAgentId}
                                        style={{ fontSize: '0.9rem', padding: '8px 15px', background: '#0288d1' }}
                                    >
                                        Agregar
                                    </Button>
                                </div>
                            </div>
                        </div>



                        {/* Knowledge Base Section */}
                        <div style={{ marginBottom: '1.5rem', padding: '10px', background: '#e8eaf6', borderRadius: '8px', border: '1px solid #c5cae9' }}>
                            <Label style={{ color: '#3f51b5' }}>Base de Conocimiento (PDFs):</Label>

                            {/* PDF Upload */}
                            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <label style={{
                                    padding: '8px 15px',
                                    backgroundColor: '#3949ab',
                                    color: 'white',
                                    borderRadius: '4px',
                                    cursor: isUploadingPdf ? 'wait' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    {isUploadingPdf ? <Spinner style={{ width: '12px', height: '12px', borderWidth: '2px' }} /> : '📂'}
                                    {isUploadingPdf ? ' Procesando...' : ' Subir PDF desde PC'}
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        style={{ display: 'none' }}
                                        onChange={handleUploadPdf}
                                        disabled={isUploadingPdf}
                                    />
                                </label>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>El texto se extraerá y guardará en la configuración. (Max 10MB)</span>
                            </div>

                            {/* PDF Link */}
                            <ResponsiveFlexRow style={{ marginBottom: '0' }}>
                                <Input
                                    type="text"
                                    placeholder="O pega aquí un link directo a un PDF online..."
                                    value={pdfUrlInput}
                                    onChange={(e) => setPdfUrlInput(e.target.value)}
                                    disabled={isUploadingPdf}
                                />
                                <Button
                                    onClick={handleAddPdfLink}
                                    style={{ background: '#5c6bc0', padding: '8px 15px', fontSize: '0.9rem' }}
                                    disabled={isUploadingPdf}
                                >
                                    Agregar Link
                                </Button>
                            </ResponsiveFlexRow>
                        </div>

                        <Label>Buscar/Agregar Canal de YouTube:</Label>
                        <ResponsiveFlexRow>
                            <Input
                                type="text"
                                placeholder="Nombre del tema, político o canal..."
                                value={newAgentSource.name}
                                onChange={(e) => setNewAgentSource({ ...newAgentSource, name: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiChannelSearch()}
                            />
                            <Button onClick={handleAiChannelSearch} disabled={isSearchingChannels}>
                                {isSearchingChannels ? 'Buscando...' : '🔍 Buscar Canales con IA'}
                            </Button>
                        </ResponsiveFlexRow>

                        {suggestedChannels.length > 0 && (
                            <div style={{ marginBottom: '1rem', padding: '10px', background: '#e8f5e9', borderRadius: '8px' }}>
                                <Label>Canales Sugeridos:</Label>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {suggestedChannels.map((channel, idx) => (
                                        <li key={idx} style={{ padding: '8px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                            {channel.thumbnail && (
                                                <img src={channel.thumbnail} alt={channel.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            )}
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channel.name}</strong>
                                                <small style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{channel.description}</small>
                                                <small style={{ color: 'blue', display: 'block', wordBreak: 'break-all' }}>ID: {channel.channelId}</small>
                                            </div>
                                            <Button onClick={() => handleAddSuggestedChannel(channel)} style={{ fontSize: '0.8rem', padding: '5px 10px', flexShrink: 0 }}>
                                                Agregar
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div style={{ marginTop: '1rem' }}>
                            {agentSources.map((source, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #eee', gap: '10px' }}>
                                    {source.thumbnail ? (
                                        <img src={source.thumbnail} alt={source.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '20px' }}>
                                            {source.type === 'internal_news' ? '📰' : source.type === 'internal_agent' ? '🤖' : source.type === 'pdf_text' ? '📄' : source.type === 'pdf_link' ? '🔗' : '📺'}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                        <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{source.name || "Sin nombre"}</strong>
                                        <span style={{ color: '#888', fontSize: '0.85em', wordBreak: 'break-all' }}>{source.value}</span>
                                    </div>
                                    <Button onClick={() => handleRemoveSource(index)} style={{ backgroundColor: '#ffcccc', color: '#d32f2f', padding: '5px 10px', fontSize: '0.9rem', flexShrink: 0 }}>
                                        Eliminar
                                    </Button>
                                </div>
                            ))}
                            {agentSources.length === 0 && <p style={{ color: '#888' }}>No hay fuentes configuradas. Se usará la búsqueda general.</p>}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Estado del Sistema (Debug)"
                        isOpen={collapsedSections.status}
                        onToggle={() => toggleSection('status')}
                    >
                        <AgentDebug globalProgress={globalProgress} agentName={agentName} />
                    </CollapsibleSection>

                </Content>

                <FloatingActionContainer>
                    {/* Status Message Area */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {(loading || globalProgress.stage !== 'idle' || status.message) && (
                            <div style={{ width: '100%', marginBottom: '10px' }}>
                                {/* Status Bar for Loading */}
                                {(loading || globalProgress.stage !== 'idle') && (
                                    <div style={{ width: '100%', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#555', marginBottom: '4px' }}>
                                            <span><strong>{globalProgress.stage === 'idle' ? 'Completado' : globalProgress.stage.toUpperCase()}</strong></span>
                                            <span>{Math.round(globalProgress.progress || 0)}%</span>
                                        </div>
                                        <GlobalProgressContainer style={{ height: '8px', margin: '0' }}>
                                            <GlobalProgressBar $progress={globalProgress.progress || 0} $isIdle={globalProgress.stage === 'idle'} />
                                        </GlobalProgressContainer>
                                    </div>
                                )}

                                {/* Text Message */}
                                {(status.message || globalProgress.message) && (
                                    <div style={{
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        color: status.error ? '#d32f2f' : '#333',
                                        fontWeight: '500',
                                        whiteSpace: 'pre-wrap',
                                        padding: '5px',
                                        background: status.error ? '#ffebee' : 'transparent',
                                        borderRadius: '4px'
                                    }}>
                                        {status.message || globalProgress.message}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Buttons Row with Grid Layout for Equal sizing */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                        gap: '10px',
                        width: '100%'
                    }}>
                        <Button
                            onClick={handleForceRefreshAgent}
                            disabled={loading}
                            style={{
                                width: '100%',
                                height: '25px',
                                fontSize: '0.85rem',
                                padding: '0 5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'none'
                            }}
                        >
                            {loading && <Spinner style={{ width: '12px', height: '12px', borderWidth: '2px', marginRight: '5px' }} />}
                            {loading ? 'Actualizando' : 'Actualizar'}
                        </Button>

                        <Button
                            onClick={handleStopAgent}
                            disabled={loading && globalProgress.stage === 'idle'}
                            style={{
                                backgroundColor: '#f44336',
                                width: '100%',
                                height: '25px',
                                fontSize: '0.85rem',
                                padding: '0 5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'none'
                            }}
                            title="Detener proceso actual"
                        >
                            🛑 Stop
                        </Button>

                        <Button
                            onClick={handleDeleteAgent}
                            disabled={loading || globalProgress.stage === 'deleting'}
                            style={{
                                width: '100%',
                                height: '25px',
                                fontSize: '0.85rem',
                                padding: '0 5px',
                                backgroundColor: '#d32f2f', // Strong Red
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'none'
                            }}
                            title="Eliminar este agente permanentemente"
                        >
                            🗑️ Eliminar
                        </Button>
                    </div>

                    {
                        agentSummary && agentSummary.audioUrl && (
                            <div style={{ width: '100%', marginTop: '10px' }}>
                                <NewsAudioButton
                                    text={agentSummary.text}
                                    title={`Escuchar Resumen ${agentName}`}
                                    audioUrl={agentSummary.audioUrl}
                                    variant="plain"
                                    showText={false}
                                    buttonStyle={{
                                        width: '100%',
                                        height: '40px',
                                        fontSize: '0.85rem',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#673ab7', // Unified Purple color
                                        color: 'white',
                                        fontWeight: 'bold',
                                        padding: '0 10px',
                                        boxShadow: 'none'
                                    }}
                                />
                            </div>
                        )
                    }
                </FloatingActionContainer >
            </Container >
        </Section >
    );
};

export default AgentConfig;
