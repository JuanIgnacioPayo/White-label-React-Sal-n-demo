import React, { useEffect, useState } from 'react';
import { useLoading } from '../contexts/LoadingContext';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../firebase/firebase';
import { useSiteContext } from '../contexts/SiteContext';

const GlobalLoader = () => {
  const { siteName } = useSiteContext();
  const { progress, isFullyLoaded, tasks, completed } = useLoading();
  const [visible, setVisible] = useState(true);
  const [loadingText, setLoadingText] = useState("Cargando...");
  const [loaderConfig, setLoaderConfig] = useState(() => {
    const wConfig = window.__LOADER_CONFIG__ || {};
    return {
      title: wConfig.title || siteName,
      subtitle: wConfig.subtitle !== undefined ? wConfig.subtitle : "Salón de eventos",
      showLogo: wConfig.showLogo || false,
      logoUrl: wConfig.logoUrl || "",
      messages: wConfig.messages ? wConfig.messages.split('\n').filter(m => m.trim() !== '') : [
        "Cargando base de datos...",
        "Cargando imágenes...",
        "Sincronizando agenda...",
        "Cargando estilos...",
        "Cargando textos...",
        "Optimizando experiencia...",
        "Finalizando carga..."
      ]
    };
  });

  useEffect(() => {
    const db = getDatabase(app);
    const loaderRef = ref(db, 'config/loader');
    const unsubscribe = onValue(loaderRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLoaderConfig({
          title: data.title || siteName,
          subtitle: data.subtitle || "Salón de eventos",
          showLogo: data.showLogo || false,
          logoUrl: data.logoUrl || "",
          messages: data.messages ? data.messages.split('\n').filter(m => m.trim() !== '') : [
            "Cargando base de datos...",
            "Cargando imágenes...",
            "Sincronizando agenda...",
            "Cargando estilos...",
            "Cargando textos...",
            "Optimizando experiencia...",
            "Finalizando carga..."
          ]
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const messages = loaderConfig.messages.length > 0 ? loaderConfig.messages : ["Cargando..."];
    let messageIndex = 0;
    setLoadingText(messages[messageIndex]);
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingText(messages[messageIndex]);
    }, 900);

    return () => clearInterval(interval);
  }, [loaderConfig.messages]);

  // Destruir el loader HTML estático inicial para que React tome el control fluido
  useEffect(() => {
    const htmlLoader = document.getElementById('app-initial-loader');
    if (htmlLoader) {
      htmlLoader.style.opacity = '0';
      setTimeout(() => {
        if(htmlLoader.parentNode) htmlLoader.parentNode.removeChild(htmlLoader);
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (isFullyLoaded) {
      const timer = setTimeout(() => setVisible(false), 600); 
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [isFullyLoaded]);

  useEffect(() => {
    const handleForceClear = () => setVisible(false);
    window.addEventListener('force-clear-loader', handleForceClear);
    return () => window.removeEventListener('force-clear-loader', handleForceClear);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #ffffec 0%, #fdfbf5 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999999,
      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      opacity: isFullyLoaded ? 0 : 1,
      transform: isFullyLoaded ? 'scale(1.05)' : 'scale(1)',
      pointerEvents: isFullyLoaded ? 'none' : 'all',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
        
        {/* Títulos / Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
          {loaderConfig.showLogo && loaderConfig.logoUrl ? (
            <img src={loaderConfig.logoUrl} alt="Logo" style={{ maxHeight: '100px', animation: 'loaderFadeInUp 0.8s forwards cubic-bezier(0.16, 1, 0.3, 1)' }} />
          ) : (
            <>
              <h1 style={{
                fontFamily: "'playlistscript', cursive",
                fontSize: '2.5rem', fontWeight: 'normal', color: '#160529', margin: 0, letterSpacing: '2px', 
                animation: 'loaderFadeInUp 0.8s forwards cubic-bezier(0.16, 1, 0.3, 1)'
              }}>{loaderConfig.title}</h1>
            </>
          )}
        </div>
        
        {/* Barra de Progreso */}
        <div style={{
          width: '240px',
          height: '6px',
          background: 'rgba(148, 137, 36, 0.15)',
          borderRadius: '10px',
          marginTop: '20px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
        }}>
           <div style={{
             width: `${progress}%`,
             height: '100%',
             background: 'linear-gradient(90deg, #948924, #b5aa40)',
             borderRadius: '10px',
             transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
             position: 'relative',
             overflow: 'hidden'
           }}>
             {/* Reflejo de brillo animado en la barra */}
             <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                transform: 'translateX(-100%)',
                animation: 'loaderShimmer 1.5s infinite'
             }}></div>
           </div>
        </div>
        
        {/* Porcentaje Texto */}
        <div style={{
           fontSize: '0.85rem', color: '#948924', marginTop: '2px', fontWeight: 600, 
           fontFamily: 'system-ui, sans-serif', letterSpacing: '1px'
        }}>
           {progress}%
        </div>
        
        {/* Cargando Texto */}
        <div style={{
           fontSize: '0.65rem', color: '#a79997', marginTop: '2px', fontWeight: 500, 
           fontFamily: 'system-ui, sans-serif', letterSpacing: '1px', textTransform: 'uppercase',
           minHeight: '15px', transition: 'opacity 0.3s ease-in-out'
        }}>
           {loadingText}
        </div>

      </div>

      <style>{`
        @keyframes loaderShimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoader;
