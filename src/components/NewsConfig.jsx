import React, { useState, useEffect, useRef } from 'react';

import styled, { keyframes, css } from 'styled-components';
import { getDatabase, ref, update, onValue, push, set, remove, get } from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/firebase";

import NewsAudioButton from './Chatbot/NewsAudioButton';
import ScrollToTop from './ScrollToTop';
import ScrollToBottom from './ScrollToBottom';

const Section = styled.section`
  padding: 2rem 1rem;
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
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
  /* Content is now handled by Collapsible Sections which will look like cards */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 200px; /* Add margin for floating buttons */
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

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: white;
  width: 50%;
  font-family: 'product_sansregular', sans-serif;
`;

const Button = styled.button`
  padding: 12px 25px;
  background-color: ${props => props.disabled ? '#ccc' : 'var(--primaryColor, #b0aa6d)'};
  color: var(--whiteText, #ffffff);
  border: none;
  border-radius: 4px;
  font-size: 1rem;
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

const StatusMessage = styled.div`
  text-align: center;
  color: ${props => props.$error ? '#f44336' : '#333'};
  font-weight: bold;
  min-height: 1.5rem;
  background-color: #f0f7ff;
`;

const SummarySection = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f0f7ff;
  border-radius: 8px;
  border: 1px solid #cfe2ff;
`;

const SectionTitle = styled.h3`
  margin-top: 0;
  color: var(--primaryText, #333);
  border-bottom: 2px solid var(--primaryColor, #b0aa6d);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
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
  background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);
  background-size: 1rem 1rem;
  animation: progress-bar-stripes 1s linear infinite;

  @keyframes progress-bar-stripes {
    0% { background-position: 1rem 0; }
    100% { background-position: 0 0; }
  }
`;

const ProgressContainer = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 10px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
`;



const ProgressSquare = styled.div`
  width: 12px;
  height: 12px;
  background-color: ${props => props.$status === 'ok' ? '#4CAF50' : props.$status === 'error' ? '#f44336' : props.$status === 'empty' ? '#ff9800' : '#e0e0e0'};
  border-radius: 2px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0,0,0,0.1);
  
  &:hover {
    transform: scale(1.5);
    z-index: 10;
  }
`;

const ResponsiveFormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 2fr 1fr auto;
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
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

const FloatingButtonsRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;



const NewsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const NewsCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  overflow: hidden;
`;

const ArticleDate = styled.small`
  color: #888;
  display: block;
  margin-bottom: 0.5rem;
`;

const ArticleSource = styled.span`
  background-color: #e9ecef;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  color: #495057;
  font-weight: bold;
`;

const ArticleTitle = styled.h4`
  margin: 0.5rem 0;
  color: #333;
  font-size: 1.0rem;
  line-height: 1.4;
`;

const ArticleSummary = styled.p`
  font-size: 0.85rem;
  color: #333;
  line-height: 1.5;
  background-color: var(--card-grey, #f8f9fa) !important;
  padding: 1rem;
  border-radius: 8px;
  overflow: hidden;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
`;

const ArticleLink = styled.a`
  display: inline-block;
  margin-top: 1rem;
  color: var(--primary-color, #007bff);
  text-decoration: none;
  font-weight: bold;

  &:hover {
    text-decoration: underline;
  }
`;

const DEFAULT_FEEDS = [
  { name: 'La Nación', url: 'https://www.lanacion.com.ar/arc/outbound/rss', category: 'general' },
  { name: 'Página/12 Economía', url: 'https://www.pagina12.com.ar/arc/outboundfeeds/rss/secciones/economia/notas', category: 'nacional', enabled: true },
  { name: 'Clarín Política', url: 'https://www.clarin.com/rss/politica/', category: 'nacional', enabled: true },
  { name: 'Clarín Economía', url: 'https://www.clarin.com/rss/economia/', category: 'economia', enabled: true },
  { name: 'Ámbito Financiero', url: 'https://www.ambito.com.ar/rss/economia.xml', category: 'economia', enabled: true },
  { name: 'El Economista', url: 'https://eleconomista.com.ar/rss/economia', category: 'economia', enabled: true },
  { name: 'Perfil', url: 'https://www.perfil.com/feed', category: 'nacional', enabled: true },
  { name: 'CNN Español', url: 'https://cnnespanol.cnn.com/feed/', category: 'internacional', enabled: true },
  { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/rss.xml', category: 'internacional', enabled: true },
  { name: 'France 24', url: 'https://www.france24.com/es/america-latina/rss', category: 'internacional' },
];

const DEFAULT_KEYWORDS = [
  "economía", "finanzas", "política", "dólar", "inflación", "bcra", "banco central",
  "afip", "mercado", "inversión", "exportación", "importación", "deuda", "pbi",
  "presupuesto", "impuestos", "subsidios", "comercio", "acciones", "bonos",
  "fmi", "gabinete", "congreso", "senadores", "diputados", "ley", "decreto",
  "elecciones", "partido político", "gobierno", "estado", "presidente", "ministro",
  "justicia", "reforma", "paro", "sindicato", "tarifas", "reservas", "riesgo país",
  "cotización", "bolsa", "milei", "caputo", "bullrich", "kicillof", "macri", "cristina",
  "villarruel", "congreso", "senado", "cámara", "diputados"
];

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


const DEFAULT_EXCLUDE_KEYWORDS = [
  "automovilismo", "fórmula 1", "rally", "motores", "vehículos", "deportes de motor", "carreras",
  "espectaculos", "espectáculo", "música", "cine", "teatro", "deportes", "fútbol", "básquet", "tenis", "rugby", "vóley", "hockey",
  "redes sociales", "tendencias", "comida", "recetas", "gastronomía", "publicidad", "anuncios",
  "salidas", "escapadas", "vacaciones", "turismo", "viajes", "horóscopo", "moda", "belleza"
];

const NewsDataDebug = ({ newsData, globalSummary, stats, collapsedSections, onToggle }) => {
  if (!stats.individual) return <div>Cargando estadísticas...</div>;

  const totalLastRun = Object.values(stats.individual).reduce((acc, curr) => acc + (curr.lastRunArticles || 0), 0) || 1;
  const totalPeriod = Object.values(stats.individual).reduce((acc, curr) => acc + (curr.periodArticles || 0), 0) || 1;
  const totalHistorical = Object.values(stats.individual).reduce((acc, curr) => acc + (curr.totalArticles || 0), 0) || 1;

  const allStats = Object.values(stats.individual);

  const successStats = allStats.filter(f => !f.lastError).sort((a, b) => (b.lastRunArticles || 0) - (a.lastRunArticles || 0));
  const errorStats = allStats.filter(f => !!f.lastError).sort((a, b) => (b.periodArticles || 0) - (a.periodArticles || 0));

  const renderSuccessTable = (dataItems) => (
    <div style={{ marginTop: '10px', background: 'white', padding: '0', border: '1px solid #ccc', maxHeight: '300px', overflowY: 'auto', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#eee', textAlign: 'left' }}>
            <th style={{ padding: '5px' }}>Fuente</th>
            <th style={{ padding: '5px' }}>% Última Act.</th>
            <th style={{ padding: '5px' }}>% Reset</th>
            <th style={{ padding: '5px' }}>% Histórico</th>
            <th style={{ padding: '5px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {dataItems.map((feedStat, idx) => {
            const pctLast = (((feedStat.lastRunArticles || 0) / totalLastRun) * 100).toFixed(1);
            const pctPeriod = (((feedStat.periodArticles || 0) / totalPeriod) * 100).toFixed(1);
            const pctHist = (((feedStat.totalArticles || 0) / totalHistorical) * 100).toFixed(1);

            return (
              <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '5px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }} title={feedStat.url}>
                  {feedStat.name}
                </td>
                <td style={{ padding: '5px' }}>{pctLast}% <span style={{ color: '#888', fontSize: '0.8em' }}>({feedStat.lastRunArticles || 0})</span></td>
                <td style={{ padding: '5px' }}>{pctPeriod}% <span style={{ color: '#888', fontSize: '0.8em' }}>({feedStat.periodArticles || 0})</span></td>
                <td style={{ padding: '5px' }}>{pctHist}% <span style={{ color: '#888', fontSize: '0.8em' }}>({feedStat.totalArticles || 0})</span></td>
                <td style={{ padding: '5px', color: 'green', fontWeight: 'bold' }}>OK</td>
              </tr>
            );
          })}
          {dataItems.length === 0 && (
            <tr><td colSpan="5" style={{ padding: '10px', textAlign: 'center' }}>No hay fuentes exitosas.</td></tr>
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
            <th style={{ padding: '5px', width: '30%' }}>Fuente</th>
            <th style={{ padding: '5px', width: '70%' }}>Detalles del Error</th>
          </tr>
        </thead>
        <tbody>
          {dataItems.map((feedStat, idx) => {
            return (
              <tr key={idx} style={{ borderBottom: '1px solid #eee', background: '#fff0f0' }}>
                <td style={{ padding: '5px', fontWeight: 'bold' }} title={feedStat.url}>{feedStat.name}</td>
                <td style={{ padding: '5px', color: '#d32f2f', wordBreak: 'break-all' }}>{feedStat.lastError || "Error desconocido"}</td>
              </tr>
            );
          })}
          {dataItems.length === 0 && (
            <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center' }}>No hay errores reportados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: '10px', background: '#ffebee', border: '1px solid #f44336', fontSize: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
        <strong>Estado del Sistema:</strong>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => {
              const db = getDatabase(app);
              const updates = {};
              Object.keys(stats.individual).forEach(key => {
                updates[`newsStats/individual/${key}/periodArticles`] = 0;
              });
              update(ref(db), updates).then(() => alert("Estadísticas del período reiniciadas."));
            }}
            style={{ background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold' }}
          >
            🔄 Resetear Período
          </button>
          <button
            onClick={() => {
              let text = "Fuente\tEstado\tError\n";
              allStats.forEach(f => {
                text += `${f.name}\t${f.lastError ? "ERROR" : "OK"}\t${f.lastError || ""}\n`;
              });
              navigator.clipboard.writeText(text).then(() => alert("Copiado!"));
            }}
            style={{ background: '#3a3a3aff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '11px' }}
          >
            📋 Copiar Todo
          </button>
        </div>
      </div>

      <div>
        NewsData loaded: {newsData ? 'YES' : 'NO'} | GlobalSummary: {globalSummary ? 'YES' : 'NO'} | Audio: {globalSummary?.audioUrl ? 'YES' : 'NO'}
      </div>

      <CollapsibleSection
        title={`Fuentes funcionando (${successStats.length})`}
        isOpen={collapsedSections.debugSuccess}
        onToggle={() => onToggle('debugSuccess')}
      >
        {renderSuccessTable(successStats)}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Fuentes con Errores (${errorStats.length})`}
        isOpen={collapsedSections.debugErrors}
        onToggle={() => onToggle('debugErrors')}
      >
        {renderErrorTable(errorStats)}
      </CollapsibleSection>
    </div>
  );
};

const NewsConfig = ({ id, collapseSignal }) => {

  const [config, setConfig] = useState({
    articleCount: 20,
    summaryLength: 'medium',
    ttsSpeed: 1.1,
    ttsLocale: 'es-AR',
    updateIntervalNews: 1, // hours
    updateIntervalMoreno: 24 // hours
  });
  const [feeds, setFeeds] = useState([]);
  const [blacklistedFeeds, setBlacklistedFeeds] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [excludeKeywords, setExcludeKeywords] = useState([]);
  const [aiPromptCondition, setAiPromptCondition] = useState('');
  const [newFeed, setNewFeed] = useState({ name: '', url: '', category: 'general' });
  const [newKeyword, setNewKeyword] = useState('');
  const [newExcludeKeyword, setNewExcludeKeyword] = useState('');



  // Collapsible State
  const [collapsedSections, setCollapsedSections] = useState({
    settings: false,
    sources: false,
    blacklisted: false,
    keywords: false,
    excludeKeywords: false,
    morenoSources: false,
    aiConditions: false,
    newsList: false,
    summary: false,
    debug: false,
    debugSuccess: false,
    debugErrors: false
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    if (collapseSignal > 0) {
      setCollapsedSections(prev => {
        const newState = {};
        Object.keys(prev).forEach(key => {
          newState[key] = false;
        });
        return newState;
      });
    }
  }, [collapseSignal]);

  // AI Search State
  const [showAiSearch, setShowAiSearch] = useState(false);
  const [searchTopic, setSearchTopic] = useState('');
  const [suggestedFeeds, setSuggestedFeeds] = useState([]);
  const [isSearchingAi, setIsSearchingAi] = useState(false);

  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(false); // Restored missing state
  const [status, setStatus] = useState({ message: '', error: false });
  const [feedStatuses, setFeedStatuses] = useState({});

  const clearGlobalStatus = async () => {
    try {
      await update(ref(db, 'newsStatus/global'), { stage: 'idle', message: '', progress: 0 });
      setStatus({ message: '', error: false });
    } catch (e) {
      console.error("Error clearing status:", e);
    }
  };
  const [stats, setStats] = useState({});
  const [refreshStartTime, setRefreshStartTime] = useState(0);
  const [globalProgress, setGlobalProgress] = useState({ stage: 'idle', progress: 0, message: '' });

  const db = getDatabase(app);
  const functions = getFunctions(app);
  const userInteracted = useRef(false);

  // Auto-Save Effect
  useEffect(() => {
    if (!userInteracted.current) return;

    const timeoutId = setTimeout(() => {
      saveUpdates({
        articleCount: parseInt(config.articleCount),
        summaryLength: config.summaryLength,
        ttsSpeed: parseFloat(config.ttsSpeed),
        ttsVoice: config.ttsVoice,
        updateIntervalNews: parseInt(config.updateIntervalNews),

        aiPromptCondition: aiPromptCondition
      });
      userInteracted.current = false;
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [config, aiPromptCondition]);

  useEffect(() => {
    // Load settings
    const configRef = ref(db, 'config/newsSettings');
    const unsubscribeConfig = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setConfig({
          articleCount: data.articleCount ?? 20,
          summaryLength: data.summaryLength || 'medium',
          ttsSpeed: data.ttsSpeed || 1.1,
          ttsVoice: data.ttsVoice || 'es-US-Neural2-A',
          updateIntervalNews: data.updateIntervalNews ?? 1,

        });
        // If no custom personality is saved, we provide the default one the user expects (Contradictions/Contrast)
        const defaultPersonality = "Analiza las noticias buscando contradicciones entre diferentes fuentes. Si encuentras discrepancias significativas en hechos o cifras, señálalo explícitamente en el resumen. Conecta los temas económicos y políticos.";
        setAiPromptCondition(data.aiPromptCondition || defaultPersonality);
        // Use defaults if empty/undefined in DB
        setFeeds(data.feeds || DEFAULT_FEEDS);
        setBlacklistedFeeds(data.blacklistedFeeds || []);
        setKeywords(data.keywords || DEFAULT_KEYWORDS);
        setExcludeKeywords(data.excludeKeywords || DEFAULT_EXCLUDE_KEYWORDS);
      } else {
        // First run / empty DB
        setFeeds(DEFAULT_FEEDS);
        setKeywords(DEFAULT_KEYWORDS);
        setExcludeKeywords(DEFAULT_EXCLUDE_KEYWORDS);
      }
    });

    // Load FULL news data
    const newsRef = ref(db, 'news');
    const unsubscribeNews = onValue(newsRef, (snapshot) => {
      const data = snapshot.val();
      // console.log("DEBUG: Snapshot received", data);
      if (data) {
        setNewsData(data);
      } else {
        // console.warn("DEBUG: No data found at /news");
      }
    }, (error) => {
      // console.error("DEBUG: Firebase Read Error", error);
    });

    // Load News Status
    const statusRef = ref(db, 'newsStatus');
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFeedStatuses(data);
      }
    });

    // Load News Stats
    const statsRef = ref(db, 'newsStats');
    const unsubscribeStats = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStats(data);
      }
    });

    // Subscribe to Global Progress
    const progressRef = ref(db, 'newsStatus/global');
    const unsubscribeGlobalProgress = onValue(progressRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setGlobalProgress(data);
        // Automatically update local status message if strictly loading or in progress
        if (data.stage !== 'idle') {
          setStatus({ message: data.message || 'Procesando...', error: false });
        }

      }
    });



    return () => {
      unsubscribeConfig();

      unsubscribeNews();
      unsubscribeStatus();
      unsubscribeStats();
      unsubscribeGlobalProgress();
    };
  }, [db]);

  /* IMMEDIATE PERSISTENCE HELPERS */
  const saveUpdates = async (updates) => {
    try {
      await update(ref(db, 'config/newsSettings'), updates);
      setStatus({ message: 'Cambios guardados.', error: false });
      setTimeout(() => setStatus(prev => prev.message === 'Cambios guardados.' ? { message: '', error: false } : prev), 2000);
    } catch (e) {
      // console.error("Persistence Error:", e);
      setStatus({ message: 'Error al guardar cambios.', error: true });
    }
  };



  const handleAddFeed = () => {
    if (!newFeed.name || !newFeed.url) return;
    const updatedFeeds = [...feeds, newFeed];
    setFeeds(updatedFeeds); // Optimistic I update
    setNewFeed({ name: '', url: '', category: 'general' });
    saveUpdates({ feeds: updatedFeeds });
  };

  const handleRemoveFeed = (index) => {
    const updatedFeeds = feeds.filter((_, i) => i !== index);
    setFeeds(updatedFeeds);
    saveUpdates({ feeds: updatedFeeds });
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || keywords.includes(newKeyword.trim().toLowerCase())) return;
    const updatedKeywords = [...keywords, newKeyword.trim().toLowerCase()];
    setKeywords(updatedKeywords);
    setNewKeyword('');
    saveUpdates({ keywords: updatedKeywords });
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    const updatedKeywords = keywords.filter(k => k !== keywordToRemove);
    setKeywords(updatedKeywords);
    saveUpdates({ keywords: updatedKeywords });
  };

  const handleAddExcludeKeyword = () => {
    if (!newExcludeKeyword.trim() || excludeKeywords.includes(newExcludeKeyword.trim().toLowerCase())) return;
    const updatedExclude = [...excludeKeywords, newExcludeKeyword.trim().toLowerCase()];
    setExcludeKeywords(updatedExclude);
    setNewExcludeKeyword('');
    saveUpdates({ excludeKeywords: updatedExclude });
  };

  const handleRemoveExcludeKeyword = (keywordToRemove) => {
    const updatedExclude = excludeKeywords.filter(k => k !== keywordToRemove);
    setExcludeKeywords(updatedExclude);
    saveUpdates({ excludeKeywords: updatedExclude });
  };



  // Simulated Progress State
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  const handleForceRefresh = async () => {
    if (!window.confirm("¿Estás seguro? Esto forzará una actualización inmediata de las noticias usando IA, lo cual puede tomar unos minutos.")) {
      return;
    }

    setLoading(true);
    setRefreshStartTime(Date.now());
    setStatus({ message: 'Iniciando actualización de noticias...', error: false });

    // Reset Abort Flag and Global Status
    try {
      await set(ref(db, 'status/actionFlags/abortNews'), false);
      // await update(ref(db, 'newsStatus/global'), { message: 'Iniciando...', progress: 0, stage: 'starting' });
    } catch (e) {
      console.error("Error resetting flags:", e);
    }

    // Initialize simulation
    setSimulatedProgress(0);
    setGlobalProgress({ stage: 'starting', progress: 0, message: 'Iniciando proceso...' });

    // Start Simulation Timer (Target ~95% in 80-100s)
    const progressInterval = setInterval(() => {
      setSimulatedProgress(prev => {
        if (prev >= 95) return 95; // Cap at 95% until real finish
        // Increment: fast at first (0-20), steady after.
        // Target 80-100s total duration.
        // Interval 500ms.
        const step = prev < 20 ? 2 : 0.35;
        return Math.min(prev + step, 95);
      });
    }, 500);

    try {
      const forceRefreshFn = httpsCallable(functions, 'forceRefreshNews', { timeout: 600000 }); // 10 minutes timeout
      const result = await forceRefreshFn();
      console.log("FORCE REFRESH RESULT:", result);

      if (result.data?.data?.audioError) {
        console.error("AUDIO GENERATION ERROR:", result.data.data.audioError);
        alert(`Error generando audio: ${result.data.data.audioError}`);
      }

      // Force 100% state on success to ensure visual completion
      clearInterval(progressInterval);
      setSimulatedProgress(100);
      setGlobalProgress({ stage: 'idle', progress: 100, message: '¡Completado!' });
      setStatus({ message: 'Noticias actualizadas correctamente.', error: false });

      // Optional: Clear progress bar after a delay
      setTimeout(() => {
        setSimulatedProgress(0);
        // We generally leave globalProgress at "idle"
      }, 5000);

    } catch (error) {
      console.error("Error refreshing news:", error);
      clearInterval(progressInterval);
      setStatus({ message: 'Error al actualizar las noticias. Revisa la consola.', error: true });
      // Reset progress on error
      setGlobalProgress({ stage: 'error', progress: 0, message: 'Error en la actualización' });
      setSimulatedProgress(0);
    } finally {
      setLoading(false);
      // Ensure interval is cleared in case of weird edge cases, though expected paths clear it.
      clearInterval(progressInterval);
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

  // AI Search Handler
  const handleAiSearch = async () => {
    if (!searchTopic.trim()) return;

    setIsSearchingAi(true);
    setSuggestedFeeds([]);

    try {
      // 1. Prepare exclusion list (names of current feeds + blacklisted feeds)
      const currentNames = feeds.map(f => f.name);
      const invalidNames = blacklistedFeeds.map(f => f.name);
      const existingNames = [...currentNames, ...invalidNames].join(", ");

      const prompt = `encontrar feeds rss para ${searchTopic}.
      IMPORTANTE:
      1. Ignorar estos medios: ${existingNames}
      2. RESPONDE ÚNICAMENTE CON UN ARRAY JSON con este formato: [{"name": "Nombre", "url": "URL", "category": "Categoria"}].
      3. NO generes texto explicativo. NO saludes. TU ÚNICA TAREA ES BUSCAR URLs.`;

      const { askGeminiAI } = await import('../services/geminiService');
      const result = await askGeminiAI(prompt, "Eres un asistente de búsqueda. Debes devolver estrictamente el JSON sin explicaciones ni formatos de Markdown.");

      let aiResponseFeeds = [];
      try {
        let cleanResponse = result;
        // Sanitize: match the first '[' and the last ']' to extract the JSON array
        const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        } else {
          // If no array structure found, throw or handle error
          console.warn("No JSON array found in AI response");
        }

        aiResponseFeeds = JSON.parse(cleanResponse);
      } catch (e) {
        console.error("Error parsing JSON from AI:", e);
        console.log("Raw Response received:", result.data.response); // Debug
        setStatus({ message: "La IA no devolvió un formato válido. Intenta de nuevo.", error: true });
      }

      if (Array.isArray(aiResponseFeeds)) {
        // 2. Client-side filtering (Double check by URL and Name similarity)
        const existingUrls = new Set([...feeds, ...blacklistedFeeds].map(f => f.url.toLowerCase().trim()));

        const filteredFeeds = aiResponseFeeds.filter(newFeed => {
          const newUrl = newFeed.url.toLowerCase().trim();
          return !existingUrls.has(newUrl);
        });

        if (filteredFeeds.length === 0 && aiResponseFeeds.length > 0) {
          setStatus({ message: "La IA encontró feeds, pero ya están en tus listas (Activas o Cuarentena).", error: false });
        } else if (filteredFeeds.length === 0) {
          setStatus({ message: "No se encontraron feeds nuevos para ese tema.", error: true });
        }

        setSuggestedFeeds(filteredFeeds);
      }

    } catch (error) {
      console.error("AI Search Error:", error);
      setStatus({ message: "Error al buscar con IA.", error: true });
    } finally {
      setIsSearchingAi(false);
    }
  };

  const handleStopNews = async () => {
    if (!window.confirm("¿Detener la actualización de noticias? Esto cancelará el proceso actual.")) return;
    try {
      const abortRef = ref(db, 'status/actionFlags/abortNews');
      await set(abortRef, true);
      setStatus({ message: 'Se envió la señal de detención. El proceso se detendrá en breve.', error: false });
    } catch (e) {
      console.error("Error setting abort flag:", e);
      setStatus({ message: 'Error al intentar detener.', error: true });
    }
  };


  const handleMoveToBlacklist = (index) => {
    const feedToMove = feeds[index];
    const updatedFeeds = feeds.filter((_, i) => i !== index);
    const updatedBlacklist = [...blacklistedFeeds, feedToMove];

    setFeeds(updatedFeeds);
    setBlacklistedFeeds(updatedBlacklist);
    saveUpdates({ feeds: updatedFeeds, blacklistedFeeds: updatedBlacklist });
  };

  const handleRestoreFromBlacklist = (index) => {
    const feedToRestore = blacklistedFeeds[index];
    const updatedBlacklist = blacklistedFeeds.filter((_, i) => i !== index);
    const updatedFeeds = [...feeds, feedToRestore];

    setBlacklistedFeeds(updatedBlacklist);
    setFeeds(updatedFeeds);
    saveUpdates({ feeds: updatedFeeds, blacklistedFeeds: updatedBlacklist });
  };

  const handleRemoveFromBlacklist = (index) => {
    const updatedBlacklist = blacklistedFeeds.filter((_, i) => i !== index);
    setBlacklistedFeeds(updatedBlacklist);
    saveUpdates({ blacklistedFeeds: updatedBlacklist });
  };

  const handleAddSuggestedFeed = (feed) => {
    const updatedFeeds = [...feeds, feed];
    setFeeds(updatedFeeds);
    setSuggestedFeeds(suggestedFeeds.filter(f => f.url !== feed.url));
    saveUpdates({ feeds: updatedFeeds });
  };

  // Moreno Sources Handlers




  // Helper to process news data for display
  const getProcessedNews = () => {
    if (!newsData) return { globalSummary: null, articles: [] };

    const { globalSummary, ...articlesObj } = newsData;
    const articles = Object.values(articlesObj)
      .filter(item => item && item.id && item.isoDate)
      .sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));

    return { globalSummary, articles };
  };

  const { globalSummary, articles } = getProcessedNews();

  return (
    <Section id={id}>
      <Container>

        <Title>Gestión de Noticias</Title>
        <Content>

          <CollapsibleSection
            title="Configuración General"
            isOpen={collapsedSections.settings}
            onToggle={() => toggleSection('settings')}
          >
            <SettingsGrid>
              <FormGroup>
                <Label>Cantidad de Artículos</Label>
                <Input
                  type="number"
                  name="articleCount"
                  value={config.articleCount}
                  onChange={handleChange}
                  min="5"
                  max="50"
                />
              </FormGroup>

              <FormGroup>
                <Label>Longitud del Resumen</Label>
                <Select
                  name="summaryLength"
                  value={config.summaryLength || 'medium'}
                  onChange={handleChange}
                >
                  <option value="short">Breve</option>
                  <option value="medium">Normal</option>
                  <option value="long">Extenso</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Acento de Voz (IA Premium)</Label>
                <Select
                  name="ttsVoice"
                  value={config.ttsVoice || 'es-US-Neural2-A'}
                  onChange={handleChange}
                >
                  <option value="es-US-Neural2-A">Latino Premium (Mujer - Recomendado)</option>
                  <option value="es-US-Neural2-B">Latino Premium (Hombre)</option>
                  <option value="es-AR-Standard-A">Argentina (Mujer - Estándar)</option>
                  <option value="es-AR-Standard-B">Argentina (Hombre - Estándar)</option>
                  <option value="es-ES-Neural2-A">España Premium (Mujer)</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Velocidad de Lectura ({config.ttsSpeed}x)</Label>
                <Input
                  type="range"
                  name="ttsSpeed"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.ttsSpeed}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup>
                <Label>Actualización Noticias (Horas)</Label>
                <Select
                  name="updateIntervalNews"
                  value={config.updateIntervalNews}
                  onChange={handleChange}
                >
                  <option value="0">Desactivado</option>
                  <option value="1">Cada 1 hora</option>
                  <option value="2">Cada 2 horas</option>
                  <option value="4">Cada 4 horas</option>
                  <option value="6">Cada 6 horas</option>
                  <option value="12">Cada 12 horas</option>
                  <option value="24">Cada 24 horas</option>
                </Select>
              </FormGroup>


            </SettingsGrid>
          </CollapsibleSection>

          {/* AI Personality Editor */}
          <CollapsibleSection
            title="Personalidad de la IA"
            isOpen={collapsedSections.aiConditions}
            onToggle={() => toggleSection('aiConditions')}
          >
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Define cómo debe comportarse la IA al generar el resumen. Puedes pedirle un tono específico, que se enfoque en ciertos datos, o cualquier otra instrucción de estilo.
            </p>
            <FormGroup>
              <Label>Instrucciones de Personalidad (Prompt)</Label>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  fontFamily: 'product_sansregular, sans-serif',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
                placeholder="Ej: 'Usa un tono sarcástico y humorístico', 'Sé muy formal y técnico', 'Habla como si fueras un comentarista de fútbol'..."
                value={aiPromptCondition}
                onChange={(e) => {
                  userInteracted.current = true;
                  setAiPromptCondition(e.target.value);
                }}
              />
            </FormGroup>
          </CollapsibleSection>

          {/* Sources Editor */}
          <CollapsibleSection
            title={`Gestión de Fuentes RSS (${feeds.length})`}
            isOpen={collapsedSections.sources}
            onToggle={() => toggleSection('sources')}
          >
            <div style={{ background: '#f3e5f5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e1bee7' }}>
              <p style={{ marginTop: 0, fontSize: '0.9rem', color: '#6a1b9a' }}>
                <strong>Asistente de Fuentes:</strong> Escribe un tema (ej: "Tecnología en Argentina", "Fútbol Europeo") y la IA sugerirá feeds.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <Input
                  placeholder="Tema a buscar..."
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                  style={{ width: '100%' }}
                />
                <Button onClick={handleAiSearch} disabled={isSearchingAi} style={{ width: '100%' }}>
                  {isSearchingAi ? 'Buscando...' : 'Buscar fuentes con IA'}
                </Button>
              </div>

              {suggestedFeeds.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {suggestedFeeds.map((feed, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{feed.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666', wordBreak: 'break-all' }}>{feed.url}</div>
                      </div>
                      <Button onClick={() => handleAddSuggestedFeed(feed)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>Agregar</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {feeds.map((feed, index) => {
                const feedId = btoa(feed.url);
                const fStatus = feedStatuses && feedStatuses[feedId];
                const isOk = fStatus && fStatus.status === 'ok';
                const isError = fStatus && (fStatus.status === 'error' || fStatus.status === 'empty');

                // Stats Logic
                // feedId is already defined above
                const individualStats = stats.individual && stats.individual[feedId];
                const totalGlobal = stats.global?.lastRunTotal || 1; // div by zero protection
                const totalFeed = individualStats?.lastRunArticles || 0;
                const percentage = ((totalFeed / totalGlobal) * 100).toFixed(1);
                const hasStats = individualStats !== undefined;

                let bgColor = '#f8f9fa';
                let borderColor = '#eee';

                if (isOk) {
                  bgColor = '#e8f5e9'; // Greenish
                  borderColor = '#c8e6c9';
                } else if (isError) {
                  bgColor = '#ffebee'; // Reddish
                  borderColor = '#ffcdd2';
                }

                return (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: bgColor, borderRadius: '4px', alignItems: 'center', border: `1px solid ${borderColor}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontWeight: 'bold' }}>
                        {feed.name} <small style={{ fontWeight: 'normal', color: '#666' }}>({feed.category})</small>
                        {/* Status Icons */}
                        {isOk && <span style={{ marginLeft: '0.5rem', color: 'green', fontSize: '0.8rem' }}>✔ En uso</span>}
                        {isError && <span style={{ marginLeft: '0.5rem', color: 'red', fontSize: '0.8rem' }}>⚠ {fStatus.status === 'empty' ? 'Sin contenido' : 'Error'}</span>}

                        {/* Stats Percentage */}
                        {hasStats && (
                          <span style={{ marginLeft: '1rem', color: '#1565c0', fontSize: '0.85rem', background: 'rgba(21, 101, 192, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            📊 {percentage}% aporte
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#999', wordBreak: 'break-all' }}>{feed.url}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleMoveToBlacklist(index)} title="Mover a Cuarentena/Lista Negra" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>⛔</button>
                      <button onClick={() => handleRemoveFeed(index)} title="Eliminar permanentemente" style={{ color: '#dc3545', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', padding: '0 0.5rem' }}>&times;</button>
                    </div>
                  </div>
                );
              })}
              {feeds.length === 0 && <small style={{ color: '#888', fontStyle: 'italic' }}>No hay fuentes activas.</small>}
            </div>
          </CollapsibleSection>

          {/* Blacklisted Sources Editor */}
          <CollapsibleSection
            title={`Fuentes en Cuarentena (${blacklistedFeeds.length})`}
            isOpen={collapsedSections.blacklisted}
            onToggle={() => toggleSection('blacklisted')}
          >
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Las fuentes en esta lista son verificadas periódicamente pero <strong>NO</strong> se usan para generar noticias. Si "reviven", puedes restaurarlas.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {blacklistedFeeds.map((feed, index) => {
                const feedId = btoa(feed.url);
                const fStatus = feedStatuses && feedStatuses[feedId];
                const isOk = fStatus && fStatus.status === 'ok';
                const isError = fStatus && (fStatus.status === 'error' || fStatus.status === 'empty');

                let bgColor = '#fff0f0'; // Default reddish for blacklist
                let borderColor = '#ffcdd2';

                if (isOk) {
                  bgColor = '#e8f5e9'; // Green check even if blacklisted!
                  borderColor = '#c8e6c9';
                }

                return (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: bgColor, borderRadius: '4px', alignItems: 'center', border: `1px solid ${borderColor}`, opacity: 0.8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontWeight: 'bold', textDecoration: 'line-through', color: '#777' }}>
                        {feed.name}
                        {isOk && <span style={{ marginLeft: '0.5rem', color: 'green', fontSize: '0.8rem', textDecoration: 'none' }}>✔ ¡VOLVIÓ A FUNCIONAR!</span>}
                        {isError && <span style={{ marginLeft: '0.5rem', color: 'red', fontSize: '0.8rem', textDecoration: 'none' }}>⚠ {fStatus.lastError || 'Error'}</span>}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#999', wordBreak: 'break-all' }}>{feed.url}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleRestoreFromBlacklist(index)} title="Restaurar a Activas" style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px 10px', fontSize: '0.9rem' }}>Restaurar</button>
                      <button onClick={() => handleRemoveFromBlacklist(index)} title="Eliminar Definitivamente" style={{ color: '#dc3545', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', padding: '0 0.5rem' }}>&times;</button>
                    </div>
                  </div>
                );
              })}
              {blacklistedFeeds.length === 0 && <small style={{ color: '#888', fontStyle: 'italic' }}>No hay fuentes en cuarentena.</small>}
            </div>
          </CollapsibleSection>

          {/* Keywords Editor */}
          <CollapsibleSection
            title="Palabras Clave de Interés"
            isOpen={collapsedSections.keywords}
            onToggle={() => toggleSection('keywords')}
          >
            <ResponsiveFlexRow>
              <Input
                placeholder="Nueva palabra clave (ej: inflación)"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                style={{ flex: 1 }}
              />
              <Button onClick={handleAddKeyword} style={{ padding: '0.5rem 1rem' }}>Agregar</Button>
            </ResponsiveFlexRow>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {keywords.map((k, i) => (
                <span key={i} style={{ background: '#e8f5e9', padding: '0.0rem 0.2rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #c8e6c9', fontSize: '0.8rem', color: '#2e7d32' }}>
                  {k}
                  <button onClick={() => handleRemoveKeyword(k)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2e7d32', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                </span>
              ))}
              {keywords.length === 0 && <small style={{ color: '#888', fontStyle: 'italic' }}>No hay palabras clave personalizadas. Se usarán las internas predeterminadas.</small>}
            </div>
          </CollapsibleSection>

          {/* Excluded Keywords Editor */}
          <CollapsibleSection
            title="Palabras Clave EXCLUIDAS"
            isOpen={collapsedSections.excludeKeywords}
            onToggle={() => toggleSection('excludeKeywords')}
          >
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 0 }}>
              Las noticias que contengan cualquiera de estas palabras serán ignoradas automáticamente.
            </p>
            <ResponsiveFlexRow>
              <Input
                placeholder="Palabra a excluir (ej: horóscopo)"
                value={newExcludeKeyword}
                onChange={(e) => setNewExcludeKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExcludeKeyword()}
                style={{ flex: 1 }}
              />
              <Button onClick={handleAddExcludeKeyword} style={{ padding: '0.5rem 1rem', backgroundColor: '#e53935' }}>Excluir</Button>
            </ResponsiveFlexRow>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {excludeKeywords.map((k, i) => (
                <span key={i} style={{ background: '#fce4ec', padding: '0.0rem 0.2rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #f8bbd0', fontSize: '0.8rem', color: '#880e4f' }}>
                  {k}
                  <button onClick={() => handleRemoveExcludeKeyword(k)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#880e4f', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                </span>
              ))}
              {excludeKeywords.length === 0 && <small style={{ color: '#888', fontStyle: 'italic' }}>No hay palabras excluidas personalizadas. Se usarán las internas predeterminadas.</small>}
            </div>
          </CollapsibleSection>


          {/* Action Buttons */}
          {/* Floating Action Buttons */}
          {/* Floating Action Container with Status */}
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
                        <span>{Math.round(simulatedProgress)}%</span>
                      </div>
                      <GlobalProgressContainer style={{ height: '8px', margin: '0' }}>
                        <GlobalProgressBar $progress={simulatedProgress} />
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
                      whiteSpace: 'pre-wrap', // Allow newlines in error messages
                      padding: '5px',
                      background: status.error ? '#ffebee' : 'transparent',
                      borderRadius: '4px'
                    }}>
                      {globalProgress.message}
                      {status.message && (
                        <StatusMessage $error={status.error}>
                          {status.message}
                          <button
                            onClick={clearGlobalStatus}
                            style={{ marginLeft: '10px', padding: '2px 6px', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }}
                            title="Limpiar mensaje"
                          >
                            ✕
                          </button>
                        </StatusMessage>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Individual Feed Squares (Compact) */}
              {loading && (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {feeds.map((feed, i) => {
                    const feedId = btoa(feed.url);
                    const fStatus = feedStatuses && feedStatuses[feedId];
                    const isFinished = fStatus && fStatus.lastCheck > refreshStartTime;
                    let squareStatus = 'pending';
                    if (isFinished) squareStatus = fStatus.status;
                    return (
                      <ProgressSquare
                        key={i}
                        $status={squareStatus}
                        title={`${feed.name}`}
                        style={{ width: '8px', height: '8px' }}
                      />
                    );
                  })}
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
                onClick={handleForceRefresh}
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
                onClick={handleStopNews}
                disabled={loading && globalProgress.stage === 'idle'} // Disable if not running? Or always enabled to be safe? Best to keep enabled if loading?
                // Actually, if loading is true, we want to be able to stop.
                // If loading is false, maybe disable?
                // For simplicity, let's leave it enabled or match Moreno logic.
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



            </div>

            {globalSummary && (
              <div style={{ width: '100%', marginTop: '10px' }}>
                <NewsAudioButton
                  text={globalSummary.text}
                  title="Escuchar Resumen"
                  variant="plain"
                  speed={config.ttsSpeed}
                  locale={config.ttsVoice || 'es-US-Neural2-A'}
                  showText={false}
                  audioUrl={globalSummary.audioUrl}
                  buttonStyle={{
                    width: '100%',
                    height: '25px',
                    fontSize: '0.85rem',
                    borderRadius: '4px',
                    backgroundColor: '#673ab7',
                    color: 'white',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 10px',
                    boxShadow: 'none'
                  }}
                />
              </div>
            )}
          </FloatingActionContainer>



          {/* Summary Preview */}


          {/* News List */}
          {/* News List */}
          {articles.length > 0 && (
            <CollapsibleSection
              title={`Detalle de Noticias (${articles.length})`}
              isOpen={collapsedSections.newsList}
              onToggle={() => toggleSection('newsList')}
            >
              <NewsGrid>
                {articles.map((article) => (
                  <NewsCard
                    key={article.id}
                    onClick={() => window.open(article.link, '_blank')}
                    title="Haz clic para ver la noticia original"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <ArticleSource>{article.source}</ArticleSource>
                      <ArticleDate>{new Date(article.isoDate).toLocaleDateString()}</ArticleDate>
                    </div>
                    <ArticleTitle>{article.title}</ArticleTitle>
                    <ArticleSummary>{article.summary}</ArticleSummary>
                    <ArticleLink
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Leer original &rarr;
                    </ArticleLink>
                  </NewsCard>
                ))}
              </NewsGrid>
            </CollapsibleSection>
          )}

          {/* Summary Preview - Info Only */}
          {globalSummary && (
            <CollapsibleSection
              title={
                <span>
                  Resumen Global del Día
                  <small style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1rem', fontWeight: 'normal' }}>
                    ({new Date(globalSummary.timestamp).toLocaleString()})
                  </small>
                </span>
              }
              isOpen={collapsedSections.summary}
              onToggle={() => toggleSection('summary')}
            >
              <SummarySection style={{ marginTop: 0 }}>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#333' }}>
                  {globalSummary.text}
                </div>
              </SummarySection>
            </CollapsibleSection>
          )}
          {/* DEBUG BLOCK */}
          <CollapsibleSection
            title="Información de Depuración (Debug)"
            isOpen={collapsedSections.debug}
            onToggle={() => toggleSection('debug')}
          >
            <NewsDataDebug
              newsData={newsData}
              globalSummary={globalSummary}
              stats={stats}
              collapsedSections={collapsedSections}
              onToggle={toggleSection}
            />

          </CollapsibleSection>
        </Content>
        <ScrollToTop />
        <ScrollToBottom />
      </Container>
    </Section >
  );
};

export default NewsConfig;
