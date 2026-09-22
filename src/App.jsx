import React, { useState, useEffect } from "react";

// Importaciones de páginas (ahora con React.lazy)
const Login = React.lazy(() => import("./pages/LoginPage"));
const LoginReciboPage = React.lazy(() => import("./pages/LoginReciboPage"));
const HomePage = React.lazy(() => import("./pages/HomePage"));
const EmpleosPage = React.lazy(() => import("./pages/EmpleosPage"));
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const ConfiguracionPage = React.lazy(() => import("./pages/ConfiguracionPage"));
const VerPresupuestoPage = React.lazy(() => import("./pages/VerPresupuestoPage")); // NUEVO IMPORT
const MaintenancePage = React.lazy(() => import("./pages/MaintenancePage"));

// Importaciones de Contextos
import { AuthProvider, useAuth } from "./contexts/authContext";
import { ThemeProvider, useTheme } from "./contexts/themeContext";
import { ChatbotProvider, useChatbot } from "./contexts/chatbotContext";
import { AvailabilityProvider } from "./contexts/AvailabilityContext";
import { HelmetProvider } from 'react-helmet-async';
import GlobalDropzone from './components/SmartUpload/GlobalDropzone';
import { LoadingProvider, useLoading } from "./contexts/LoadingContext";
import { SiteProvider } from "./contexts/SiteContext";
import GlobalLoader from "./components/GlobalLoader";

// Importaciones de Hooks y Librerías
import { useRoutes, Navigate, useLocation } from "react-router-dom";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { esES } from '@mui/x-date-pickers/locales';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from './firebase/firebase';

// Importaciones de Componentes (ahora con React.lazy si son rutas)
const Calendar = React.lazy(() => import("./components/Calendar/Calendar.jsx")); // Usamos Calendar.jsx
const Fotos = React.lazy(() => import("./components/Fotos/Fotos.jsx"));
const FotosSalon = React.lazy(() => import("./components/Fotos/FotosSalon.jsx"));
const FotosCocina = React.lazy(() => import("./components/Fotos/FotosCocina.jsx"));
const FotosOpcionales = React.lazy(() => import("./components/Fotos/FotosOpcionales.jsx"));
const Plano = React.lazy(() => import("./components/Fotos/Plano.jsx"));
const ProjectMigrationGuide = React.lazy(() => import("./components/ProjectMigrationGuide.jsx"));
const PreciosDinamico = React.lazy(() => import("./components/Precios/PreciosDinamico.jsx"));
const Presupuesto = React.lazy(() => import("./components/Precios/Presupuesto.jsx"));
const HorariosPage = React.lazy(() => import("./pages/HorariosPage.jsx"));

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const Recibo = React.lazy(() => import("./components/Recibos/Recibo.jsx"));
const ReciboInfografico = React.lazy(() => import("./components/Recibos/ReciboInfografico.jsx"));
const FormRecibo = React.lazy(() => import("./components/FormsYToggles/FormRecibo.jsx"));
const DashboardSueldos = React.lazy(() => import("./components/DashboardSueldos/DashboardSueldos.jsx")); // Nuevo Import
const DashboardEmpresa = React.lazy(() => import("./components/DashboardEmpresa/DashboardEmpresa.jsx"));
const DashboardMonotributoPage = React.lazy(() => import("./pages/DashboardMonotributoPage.jsx"));
const EmpleadoEditPage = React.lazy(() => import("./pages/EmpleadoEditPage.jsx")); // Employee Edit Page
import FeedbackButton from "./components/Feedback/FeedbackButton";
import GlobalHoverSound from "./components/GlobalHoverSound";


// Importaciones de otros componentes (mantener como importación normal si no son rutas)
import Calculadora from "./components/Calculadora.jsx";
import CotizacionExitosa from "./components/CotizacionExitosa.jsx";
import Chatbot from "./components/Chatbot/Chatbot.jsx"; // Chatbot se renderiza condicionalmente, no como ruta

// Función auxiliar para convertir camelCase a kebab-case
const camelToKebabCase = (string) => {
  return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}


// Función para detectar si un error corresponde a un chunk desactualizado o error de importación dinámica tras un nuevo deploy
const isChunkOrDeployError = (error) => {
  if (!error) return false;
  const msg = (error?.message || error?.toString() || '').toLowerCase();
  const name = (error?.name || '').toLowerCase();
  return (
    name === 'chunkloaderror' ||
    msg.includes('chunk') ||
    msg.includes('dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('unable to preload') ||
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('failed to load module script') ||
    msg.includes('loading css chunk') ||
    msg.includes("unexpected token '<'") ||
    msg.includes('element type is invalid') ||
    (msg.includes('is not a function') && msg.includes('default'))
  );
};

class ChunkErrorBoundary extends React.Component {
  state = { hasError: false, error: null, isReporting: false, reportStatus: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ChunkErrorBoundary caught an error:", error, errorInfo);
    window.dispatchEvent(new Event('force-clear-loader'));
    
    if (isChunkOrDeployError(error)) {
      console.warn("Chunk/deployment mismatch detectado en ChunkErrorBoundary. Iniciando recarga limpia...");
      try {
        const last = sessionStorage.getItem('last_chunk_error_reload');
        const now = Date.now();
        if (!last || (now - parseInt(last, 10)) > 3000) {
          sessionStorage.setItem('last_chunk_error_reload', String(now));
          const url = new URL(window.location.href);
          url.searchParams.set('v', String(now));
          window.location.replace(url.toString());
          return;
        }
      } catch (e) {
        window.location.reload();
        return;
      }
    }
  }

  handleReport = async (method) => {
    const { error } = this.state;
    const errorDetails = error ? `Error: ${error.toString()}\n\nStack:\n${error.stack}` : 'Unknown Error';
    const message = `Hola! Estaba navegando en el sitio web y me apareció este error técnico:\n\n${errorDetails}`;
    
    // Attempt to copy to clipboard first
    navigator.clipboard.writeText(message).catch(err => console.error('No se pudo copiar', err));

    if (method === 'email') {
      this.setState({ isReporting: true, reportStatus: null });
      try {
        const { default: emailjs } = await import('@emailjs/browser');
        emailjs.init("YphsoytPUOtCkOlwe");
        const serviceId = 'service_pl4osgm';
        const templateId = 'template_gnbjjpa';
        const templateParams = {
          name: "Reporte de Error Automático del Sistema",
          email: "soporte@salonmagiceventos.com.ar",
          message: message
        };
        await emailjs.send(serviceId, templateId, templateParams);
        this.setState({ isReporting: false, reportStatus: 'success' });
      } catch (err) {
        console.error('EmailJS error:', err);
        this.setState({ isReporting: false, reportStatus: 'error' });
      }
    } else if (method === 'whatsapp') {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    }
  }

  render() {
    if (this.state.hasError) {
      const isDeployMismatch = isChunkOrDeployError(this.state.error);

      if (isDeployMismatch) {
        return (
          <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            backgroundColor: "#ffffec",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            textAlign: "center",
            color: "#2c3e50"
          }}>
            <div style={{
              backgroundColor: "#fff",
              padding: "40px 30px",
              borderRadius: "16px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
              maxWidth: "460px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <div style={{
                width: "50px",
                height: "50px",
                border: "4px solid rgba(148, 137, 36, 0.2)",
                borderTopColor: "#948924",
                borderRadius: "50%",
                animation: "spinChunk 1s linear infinite",
                marginBottom: "20px"
              }} />
              <style>{`
                @keyframes spinChunk {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "10px", color: "#333" }}>
                Actualizando versión...
              </h2>
              <p style={{ fontSize: "0.95rem", color: "#666", lineHeight: 1.5, marginBottom: "24px" }}>
                Hay una versión más reciente disponible. Estamos sincronizando los contenidos...
              </p>
              <button
                onClick={() => {
                  try {
                    sessionStorage.clear();
                    localStorage.removeItem('last-chunk-reload');
                  } catch {
                    /* ignore storage clear error */
                  }
                  const url = new URL(window.location.href);
                  url.searchParams.set('v', String(Date.now()));
                  window.location.replace(url.toString());
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#948924",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.08)"
                }}
              >
                🔄 Actualizar ahora
              </button>
            </div>
          </div>
        );
      }

      return (
        <div style={{ 
          padding: "40px 20px", 
          textAlign: "center", 
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
          backgroundColor: "#f8f9fa",
          color: "#333",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "10px", color: "#fa5f5f" }}>¡Uy! Algo salió mal.</h2>
          <p style={{ fontSize: "1rem", color: "#666", marginBottom: "30px", maxWidth: "600px" }}>
            Ocurrió un error inesperado. Estamos trabajando para solucionarlo. 
            Nos ayudaría muchísimo si nos envías el reporte de este error para resolverlo más rápido.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', alignItems: 'center' }}>
            <button 
              onClick={() => this.handleReport('email')}
              disabled={this.state.isReporting}
              style={{ 
                padding: "16px 32px", fontSize: "1.2rem", backgroundColor: "#dc3545", 
                color: "#fff", border: "none", borderRadius: "8px", cursor: this.state.isReporting ? "wait" : "pointer",
                fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", opacity: this.state.isReporting ? 0.7 : 1
              }}
            >
              {this.state.isReporting ? '⏳ Enviando...' : '✉️ Notificar el error'}
            </button>
            {this.state.reportStatus === 'success' && <p style={{color: '#28a745', margin: 0, fontWeight: 'bold'}}>¡Error notificado automáticamente!</p>}
            {this.state.reportStatus === 'error' && <p style={{color: '#dc3545', margin: 0, fontWeight: 'bold'}}>Hubo un problema al notificar. Por favor intentá de nuevo o contactanos.</p>}
          </div>

          {this.state.error && (
            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #dee2e6", width: "100%", maxWidth: "800px", textAlign: "left", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <strong style={{ color: "#fa5f5f" }}>Detalle técnico (se copiará automáticamente al reportar):</strong>
              <div style={{ marginTop: "10px", fontSize: "0.9rem", color: "#555", wordBreak: "break-all" }}>
                {this.state.error.toString()}
              </div>
              {this.state.error.stack && (
                <pre style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f1f3f5", borderRadius: "4px", fontSize: "0.8rem", overflowX: "auto", color: "#666" }}>
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const RedirectWithParams = ({ to }) => {
  const location = useLocation();
  return <Navigate to={to + location.search} replace />;
};

const ProtectedRoute = ({ children }) => {
  const { userLoggedIn } = useAuth();
  if (!userLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Componente que aplica los estilos globales y renderiza las rutas
const ThemedAppContent = () => {
  const { theme } = useTheme();
  const { isChatOpen } = useChatbot();
  const { userLoggedIn } = useAuth();
  const { completeTask } = useLoading();
  const [componentSettings, setComponentSettings] = useState([]);
  const [browserTitle, setBrowserTitle] = useState(' ...'); // Default title
  const [maintenanceMode, setMaintenanceMode] = useState(null);

  // Limpiar marcas de recarga de recuperación al cargar exitosamente la app
  useEffect(() => {
    try {
      sessionStorage.removeItem('last_chunk_recovery');
      sessionStorage.removeItem('last_script_recovery');
      sessionStorage.removeItem('last_vite_preload_retry');
      sessionStorage.removeItem('last_global_chunk_reload');
      sessionStorage.removeItem('last_chunk_error_reload');
      localStorage.removeItem('last-chunk-reload');
    } catch {
      /* ignore storage clear error */
    }
  }, []);

  useEffect(() => {
    const db = getDatabase(app);
    const browserTitleRef = ref(db, 'config/browserTitle');
    const unsubscribe = onValue(browserTitleRef, (snapshot) => {
      if (snapshot.exists()) {
        setBrowserTitle(snapshot.val());
      } else {
        setBrowserTitle('Salón'); // Fallback title
      }
    }, (error) => {
      console.error("Error reading browserTitle:", error);
      setBrowserTitle('Salón');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const db = getDatabase(app);
    const componentOrderRef = ref(db, 'componentOrder');

    const unsubscribe = onValue(componentOrderRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setComponentSettings(data);
      }
    }, (error) => {
      console.error("Error reading componentOrder:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Failsafe timeout to prevent eternal loader if Firebase hangs
    const timeoutId = setTimeout(() => {
      setMaintenanceMode(prev => prev === null ? false : prev);
    }, 2500);

    const db = getDatabase(app);
    const maintenanceRef = ref(db, 'settings/maintenanceMode');
    const unsubscribe = onValue(maintenanceRef, (snapshot) => {
      clearTimeout(timeoutId);
      if (snapshot.exists()) {
        setMaintenanceMode(snapshot.val());
      } else {
        setMaintenanceMode(false);
      }
    }, (error) => {
      clearTimeout(timeoutId);
      console.error("Error reading maintenanceMode:", error);
      setMaintenanceMode(false); // Default to false to avoid blank page
    });
    return () => unsubscribe();
  }, []);

  const isChatbotFeatureEnabled = !!componentSettings.find(c => c.name === 'Chatbot' && c.isVisible);

  // Mover routesArray aquí para que pueda acceder a isChatbotFeatureEnabled
  const isMaintenanceActive = maintenanceMode && !userLoggedIn;

  useEffect(() => {
    if (isMaintenanceActive) {
      completeTask('app_init');
    }
  }, [isMaintenanceActive, completeTask]);

  const routesArray = isMaintenanceActive
    ? [
        { path: "/login", element: <Login /> },
        { path: "*", element: <MaintenancePage /> }
      ]
    : [
        { path: "/", element: <HomePage /> },
        { path: "/login", element: <Login /> },
        { path: "/loginReciboPage", element: <LoginReciboPage /> },
        { path: "/admin", element: <ProtectedRoute><AdminPage /></ProtectedRoute> },
        { path: "/configuracion", element: <ProtectedRoute><ConfiguracionPage /></ProtectedRoute> },
        { path: "/calendario", element: <ProtectedRoute><Calendar /></ProtectedRoute> },
        { path: "/fotos", element: <Fotos /> },
        { path: "/fotosSalon", element: <FotosSalon /> },
        { path: "/fotosCocina", element: <FotosCocina /> },
        { path: "/FotosOpcionales", element: <FotosOpcionales /> },
        { path: "/Plano", element: <Plano /> },
        { path: "/recibo", element: <ProtectedRoute><FormRecibo /></ProtectedRoute> },
        { path: "/empleado/editar", element: <ProtectedRoute><EmpleadoEditPage /></ProtectedRoute> },
        { path: "/templateRecibo", element: <ProtectedRoute><Recibo /></ProtectedRoute> },
        { path: "/templateReciboInfografia", element: <ProtectedRoute><ReciboInfografico /></ProtectedRoute> },
        { path: "/calculadora", element: <Calculadora /> },
        { path: "/migracion", element: <ProtectedRoute><ProjectMigrationGuide /></ProtectedRoute> },
        { path: "/cotizacion-exitosa", element: <CotizacionExitosa /> },
        { path: "/presupuesto", element: <Presupuesto /> },
        { path: "/presupuesto/:id", element: <VerPresupuestoPage /> },
        { path: "/presupuesto/editar/:id", element: <ProtectedRoute><Presupuesto /></ProtectedRoute> },
        { path: "/trabaja-con-nosotros", element: <EmpleosPage /> },
        { path: "/empleos", element: <EmpleosPage /> },
        { path: "/precios/:mes", element: <PreciosDinamico /> },
        { path: "/preciosfinde", element: <PreciosDinamico /> },
        { path: "/preciospromo", element: <PreciosDinamico /> },
        { path: "/precios1", element: <RedirectWithParams to="/precios/1" /> },
        { path: "/precios2", element: <RedirectWithParams to="/precios/2" /> },
        { path: "/precios3", element: <RedirectWithParams to="/precios/3" /> },
        { path: "/precios4", element: <RedirectWithParams to="/precios/4" /> },
        { path: "/precios5", element: <RedirectWithParams to="/precios/5" /> },
        { path: "/precios6", element: <RedirectWithParams to="/precios/6" /> },
        { path: "/precios7", element: <RedirectWithParams to="/precios/7" /> },
        { path: "/precios8", element: <RedirectWithParams to="/precios/8" /> },
        { path: "/precios9", element: <RedirectWithParams to="/precios/9" /> },
        { path: "/precios10", element: <RedirectWithParams to="/precios/10" /> },
        { path: "/precios11", element: <RedirectWithParams to="/precios/11" /> },
        { path: "/precios12", element: <RedirectWithParams to="/precios/12" /> },
        { path: "/dashboard-sueldos", element: <ProtectedRoute><DashboardSueldos /></ProtectedRoute> },
        { path: "/dashboard-empresa", element: <ProtectedRoute><DashboardEmpresa /></ProtectedRoute> },
        { path: "/dashboard-monotributo", element: <ProtectedRoute><DashboardMonotributoPage /></ProtectedRoute> },
        { path: "/precios", element: <PreciosDinamico /> },
        { path: "/horarios", element: <HorariosPage /> },
        { path: "*", element: <Navigate to="/" replace /> }
      ];

  const routesElement = useRoutes(routesArray);

  useEffect(() => {
    Object.keys(theme).forEach(key => {
      const cssVarName = `--${camelToKebabCase(key)}`;
      document.body.style.setProperty(cssVarName, theme[key]);
    });
  }, [theme]);

  useEffect(() => {
    // Only set the Firebase browserTitle on the homepage to avoid
    // overriding page-specific titles set by the <SEO> component
    if (window.location.pathname === '/') {
      const title = (browserTitle && browserTitle.trim() !== '' && browserTitle !== ' ...' && browserTitle !== 'Salón')
        ? browserTitle
        : 'Salón de eventos | Salón Magic Eventos';
      document.title = title;
    }
  }, [browserTitle]);

  return (
    <div
      className="w-full h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--app-background-color)',
        color: 'var(--primary-text)'
      }}
    >
      <GlobalLoader />
      <GlobalHoverSound />
      {maintenanceMode !== null && (
        <div className="zoomed-container">
          <React.Suspense fallback={<div style={{ opacity: 0 }}>Cargando página...</div>}>
            {routesElement}
          </React.Suspense>
        </div>
      )}
      {isChatOpen && <Chatbot />}
      <ToastContainer
        style={{ zIndex: 10001 }}
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <FeedbackButton />
    </div>
  );
}

import { SiteStatsProvider } from "./contexts/SiteStatsContext";

// ... (rest of the imports)

// ... (ThemedAppContent component)

import { FestiveThemeProvider } from "./contexts/FestiveThemeContext";

function App() {
  return (
    <HelmetProvider>
      <GoogleOAuthProvider clientId="706626175949-d2qcnv9itkdfs68vuejjm5rnc5evmgec.apps.googleusercontent.com">
        <AuthProvider>
            <ChatbotProvider>
              <AvailabilityProvider>
                <FestiveThemeProvider>
                  <ThemeProvider>
                    <LocalizationProvider dateAdapter={AdapterDayjs} locale={esES}>
                      <SiteProvider>
                        <SiteStatsProvider>
                          <LoadingProvider>
                            <ChunkErrorBoundary>
                              <GlobalDropzone>
                                <ThemedAppContent />
                              </GlobalDropzone>
                            </ChunkErrorBoundary>
                          </LoadingProvider>
                        </SiteStatsProvider>
                      </SiteProvider>
                    </LocalizationProvider>
                  </ThemeProvider>
                </FestiveThemeProvider>
              </AvailabilityProvider>
            </ChatbotProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  );
}

export default App;
