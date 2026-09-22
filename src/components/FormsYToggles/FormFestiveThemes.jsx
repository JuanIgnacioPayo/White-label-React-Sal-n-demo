import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, onValue, set, push, remove } from 'firebase/database';
import { app } from '../../firebase/firebase';
import { uploadToFirebaseStorage } from '../../utils/storageUpload';
import axios from 'axios';
import Clave from '../Calendar/Clave';
import { useFestiveTheme } from '../../contexts/FestiveThemeContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../Precios/Toast';

import ThemeCompositionPreview from './ThemeCompositionPreview';
import { FestiveThemeGlobalStyle } from './FestiveTheme.styles';
import { defaultColors, customLabels, defaultTemplates, getHolidaySuggestions, getIconicSuggestions, defaultOverlaysTemplate } from '../../utils/festiveThemeConstants';
import { hexToRgba, getOverlayShadow, fetchImageBlob, removeColorBackground } from '../../utils/themeUtils';

export default function FormFestiveThemes() {
  const { previewTheme, setPreviewTheme } = useFestiveTheme();
  const navigate = useNavigate();
  
  // Estados para Toast (Autodescartable al estilo PreciosDinamico)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success', key: 0 });
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ show: true, message, type, key: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '', type: 'success', key: 0 });
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);
  
  // Vista compacta vs completa de Temas Configurados
  const [viewOnlyNames, setViewOnlyNames] = useState(false);

  const getThemeThumbnail = (theme) => {
    if (theme.homeBannerUrl && theme.homeBannerUrl.trim() !== '') return theme.homeBannerUrl;
    if (theme.heroImage && theme.heroImage.trim() !== '') return theme.heroImage;
    
    if (theme.overlays && Array.isArray(theme.overlays)) {
      const imgOverlay = theme.overlays.find(o => o.url && o.url.trim() !== '');
      if (imgOverlay) return imgOverlay.url;
    }
    
    if (theme.logoOverlay && theme.logoOverlay.trim() !== '') {
      if (!theme.logoOverlay.includes('General_Martin_Miguel_de_Guemes.jpg')) {
        return theme.logoOverlay;
      }
    }
    
    return '';
  };
  
  // Estados para Plantillas
  const [templates, setTemplates] = useState(defaultTemplates);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('navidad');
  const [templateFormData, setTemplateFormData] = useState(null);

  // Estados para Asistente de Prompts
  const [showPromptAssistant, setShowPromptAssistant] = useState(false);
  const [visibleHolidaysCount, setVisibleHolidaysCount] = useState(4);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Estados para Búsqueda Web de Distintivos e Imágenes
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);
  const [selectedSearchImage, setSelectedSearchImage] = useState(null);
  const [failedImages, setFailedImages] = useState({});
  const [modalImageFailed, setModalImageFailed] = useState(false);
  const [bgRemovalTolerance, setBgRemovalTolerance] = useState(18);
  const [modalPreviewUrl, setModalPreviewUrl] = useState('');
  const [originalModalImageObj, setOriginalModalImageObj] = useState(null);
  const [isProcessingModalPreview, setIsProcessingModalPreview] = useState(false);
  const [previewThemeModal, setPreviewThemeModal] = useState(null);

  // Efecto para inicializar la imagen original al seleccionar una imagen de búsqueda
  useEffect(() => {
    if (!selectedSearchImage) {
      setModalPreviewUrl('');
      setOriginalModalImageObj(null);
      return;
    }

    let active = true;
    const initPreview = async () => {
      setIsProcessingModalPreview(true);
      setModalImageFailed(false);
      try {
        let blob;
        if (selectedSearchImage.isLocalFile) {
          blob = selectedSearchImage.file;
        } else {
          blob = await fetchImageBlob(selectedSearchImage.url);
        }
        if (!active) return;
        const localUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = localUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        if (!active) return;
        setOriginalModalImageObj(img);
        
        // Primera remoción de fondo
        const threshold = Math.round(bgRemovalTolerance * 2.55);
        const processed = removeColorBackground(img, 255, 255, 255, threshold);
        setModalPreviewUrl(processed);
        URL.revokeObjectURL(localUrl);
      } catch (err) {
        console.error("Error al pre-cargar imagen para remoción de fondo:", err);
        setModalImageFailed(true);
      } finally {
        if (active) setIsProcessingModalPreview(false);
      }
    };

    initPreview();

    return () => {
      active = false;
    };
  }, [selectedSearchImage]);

  // Efecto para recalcular la remoción de fondo en tiempo real al mover la tolerancia
  useEffect(() => {
    if (!originalModalImageObj) return;
    
    setIsProcessingModalPreview(true);
    const timer = setTimeout(() => {
      const threshold = Math.round(bgRemovalTolerance * 2.55);
      const processed = removeColorBackground(originalModalImageObj, 255, 255, 255, threshold);
      setModalPreviewUrl(processed);
      setIsProcessingModalPreview(false);
    }, 150); // 150ms delay for smooth loading spinner feedback

    return () => clearTimeout(timer);
  }, [bgRemovalTolerance, originalModalImageObj]);

  // Control de Capa Seleccionada con Flechas del Teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Si el foco está en un campo de texto, área de texto o select, no mover la capa
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      // Teclas soportadas
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!arrowKeys.includes(e.key)) return;

      // Prevenir el scroll por defecto de la página cuando se usan las flechas
      e.preventDefault();

      // Ajustar velocidad/paso del movimiento:
      // Normal: 1% de la pantalla
      // Shift: 5% (movimiento rápido)
      // Alt/Ctrl: 0.2% (ajuste ultra fino)
      let step = 1;
      if (e.shiftKey) {
        step = 5;
      } else if (e.altKey || e.ctrlKey) {
        step = 0.2;
      }

      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      setFormData(prev => {
        // Si hay capas avanzadas y una seleccionada, mover esa
        if (prev.overlays && prev.overlays.length > 0) {
          if (!selectedOverlayId) return prev; // no hay seleccionada en capas múltiples
          const updated = prev.overlays.map(o => {
            if (o.id === selectedOverlayId) {
              const currentX = o.x !== undefined ? o.x : 50;
              const currentY = o.y !== undefined ? o.y : 50;
              const newX = Math.max(0, Math.min(100, parseFloat((currentX + dx).toFixed(2))));
              const newY = Math.max(0, Math.min(100, parseFloat((currentY + dy).toFixed(2))));
              return { ...o, x: newX, y: newY };
            }
            return o;
          });
          const first = updated[0] || {};
          return {
            ...prev,
            overlays: updated,
            logoXPercent: first.x !== undefined ? first.x : 50,
            logoYPercent: first.y !== undefined ? first.y : 50
          };
        } else if (prev.logoOverlay) {
          // Si es el modo legacy de un solo logo overlay y no hay capas complejas
          const currentX = prev.logoXPercent !== undefined ? prev.logoXPercent : 50;
          const currentY = prev.logoYPercent !== undefined ? prev.logoYPercent : 50;
          const newX = Math.max(0, Math.min(100, parseFloat((currentX + dx).toFixed(2))));
          const newY = Math.max(0, Math.min(100, parseFloat((currentY + dy).toFixed(2))));
          return {
            ...prev,
            logoXPercent: newX,
            logoYPercent: newY
          };
        }
        return prev;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOverlayId]);

  // Estados y Referencias para el Arrastre (Drag and Drop) Cartesian
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    updateCoordinates(e);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updateCoordinates(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateCoordinates = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, Math.round(x)));
    y = Math.max(0, Math.min(100, Math.round(y)));
    
    if (selectedOverlayId && formData.overlays) {
      setFormData(prev => {
        const updated = (prev.overlays || []).map(o => {
          if (o.id === selectedOverlayId) return { ...o, x, y };
          return o;
        });
        const first = updated[0] || {};
        return {
          ...prev,
          overlays: updated,
          logoXPercent: first.x !== undefined ? first.x : 50,
          logoYPercent: first.y !== undefined ? first.y : 50
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        logoXPercent: x,
        logoYPercent: y
      }));
    }
  };

  // Estados y Handlers para el Reordenamiento (Drag and Drop) de Capas/Adornos
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setFormData(prev => {
      if (!prev.overlays) return prev;
      const updated = [...prev.overlays];
      const draggedItem = updated[draggedIndex];
      updated.splice(draggedIndex, 1);
      updated.splice(index, 0, draggedItem);
      
      setDraggedIndex(index);

      const first = updated[0] || {};
      return {
        ...prev,
        overlays: updated,
        logoOverlay: first.url || '',
        logoXPercent: first.x !== undefined ? first.x : 50,
        logoYPercent: first.y !== undefined ? first.y : 50,
        logoSizePercent: first.size !== undefined ? first.size : 15
      };
    });
  };

  const moveLayer = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= formData.overlays.length) return;
    setFormData(prev => {
      if (!prev.overlays) return prev;
      const updated = [...prev.overlays];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      
      const first = updated[0] || {};
      return {
        ...prev,
        overlays: updated,
        logoOverlay: first.url || '',
        logoXPercent: first.x !== undefined ? first.x : 50,
        logoYPercent: first.y !== undefined ? first.y : 50,
        logoSizePercent: first.size !== undefined ? first.size : 15
      };
    });
  };

  const [homeBannerUrl, setHomeBannerUrl] = useState('');

  useEffect(() => {
    const db = getDatabase(app);
    const bannerRef = ref(db, 'datosId/28/foto1');
    const unsubscribe = onValue(bannerRef, (snapshot) => {
      if (snapshot.exists()) {
        setHomeBannerUrl(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, []);
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('¡Copiado al portapapeles! 📋', 'success');
  };


  const handleRemoveBackground = async (previewUrl, setPreviewUrl, field) => {
    if (!previewUrl) return;
    
    const isLogo = field === 'logoOverlay';
    if (isLogo) {
      setIsGeneratingLogo(true);
    } else {
      setIsGeneratingBanner(true);
    }
    
    try {
      // 1. Fetch image blob safely (handles CORS proxy)
      const blob = await fetchImageBlob(previewUrl);
      const localUrl = URL.createObjectURL(blob);
      
      // 2. Load into an Image object
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = localUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // 3. Process image with canvas to remove white background
      const threshold = Math.round(bgRemovalTolerance * 2.55);
      const processedDataUrl = removeColorBackground(img, 255, 255, 255, threshold);
      
      // 4. Update the preview URL with the transparent PNG
      setPreviewUrl(processedDataUrl);
      
      // Clean up local URL
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      console.error("Error al remover fondo:", err);
      showToast("No se pudo procesar la remoción de fondo: " + err.message, 'error');
    } finally {
      if (isLogo) {
        setIsGeneratingLogo(false);
      } else {
        setIsGeneratingBanner(false);
      }
    }
  };

  const handleSearchImages = async (forcedQuery = null) => {
    let query = (forcedQuery !== null && typeof forcedQuery === 'string') ? forcedQuery : formData.promptAssetDetails;
    if (!query && formData.name) {
      // Limpiar prefijos administrativos e históricos comunes para extraer el sustantivo clave de búsqueda gráfica
      let cleaned = formData.name.toLowerCase();
      const prefixesToRemove = [
        'conmemoración de la', 'conmemoración del', 'conmemoración de', 
        'conmemoracion de la', 'conmemoracion del', 'conmemoracion de',
        'paso a la inmortalidad de la', 'paso a la inmortalidad del', 'paso a la inmortalidad de',
        'día de la', 'dia de la', 'día del', 'dia del', 'día de', 'dia de',
        'día nacional de la', 'dia nacional de la', 'día nacional del', 'dia nacional del',
        'día nacional', 'dia nacional', 'gral. don', 'gral don', 'general don',
        'general', 'gral.', 'don'
      ];
      for (const prefix of prefixesToRemove) {
        if (cleaned.startsWith(prefix)) {
          cleaned = cleaned.substring(prefix.length).trim();
        }
      }
      // Capitalizar primera letra de cada palabra
      query = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      // Añadir palabras clave de diseño gráfico para que devuelva distintivos decorativos y vectores
      query = `${query} adorno clipart vector`;
    }

    if (!query) {
      showToast("Por favor detalla los elementos gráficos o el nombre del tema para buscar.", 'info');
      return;
    }
    
    setIsSearching(true);
    setSearchResults([]);
    setFailedImages({});

    const pixabayKey = import.meta.env.VITE_PIXABAY_API_KEY;
    const seed = Math.floor(Math.random() * 1000000);

    // 0. Crear sugerencias generadas en tiempo real por IA (Pollinations AI) para garantizar calidad y variedad infinita
    const pollinationsItems = [
      {
        url: `https://pollinations.ai/p/${encodeURIComponent(`${query} clipart sticker ornament, single graphic asset, high resolution, isolated on pure white background, 3d render style`)}?width=512&height=512&nologo=true&seed=${seed}`,
        thumbnail: `https://pollinations.ai/p/${encodeURIComponent(`${query} clipart sticker ornament, single graphic asset, high resolution, isolated on pure white background, 3d render style`)}?width=512&height=512&nologo=true&seed=${seed}`,
        source: 'Creador IA (Sticker 3D)',
        title: `Adorno IA: ${query} (Modelo 3D)`
      },
      {
        url: `https://pollinations.ai/p/${encodeURIComponent(`${query} cute minimal vector clipart illustration, isolated on pure white background, flat design, colorful`)}?width=512&height=512&nologo=true&seed=${seed+1}`,
        thumbnail: `https://pollinations.ai/p/${encodeURIComponent(`${query} cute minimal vector clipart illustration, isolated on pure white background, flat design, colorful`)}?width=512&height=512&nologo=true&seed=${seed+1}`,
        source: 'Creador IA (Vector Plano)',
        title: `Adorno IA: ${query} (Estilo Vector)`
      },
      {
        url: `https://pollinations.ai/p/${encodeURIComponent(`${query} isolated on pure white background, watercolor design style, high resolution`)}?width=512&height=512&nologo=true&seed=${seed+2}`,
        thumbnail: `https://pollinations.ai/p/${encodeURIComponent(`${query} isolated on pure white background, watercolor design style, high resolution`)}?width=512&height=512&nologo=true&seed=${seed+2}`,
        source: 'Creador IA (Acuarela)',
        title: `Adorno IA: ${query} (Acuarela)`
      }
    ];
    
    try {
      if (pixabayKey) {
        // 1. Buscar en Pixabay
        const pixabayUrl = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(query)}&image_type=illustration&per_page=36`;
        const response = await fetch(pixabayUrl);
        if (!response.ok) throw new Error("Pixabay falló.");
        const data = await response.json();
        
        if (data && data.hits && data.hits.length > 0) {
          const searchItems = data.hits.map(img => {
            return {
              url: img.largeImageURL || img.webformatURL,
              thumbnail: img.webformatURL || img.previewURL,
              source: 'Pixabay',
              title: img.tags ? img.tags.charAt(0).toUpperCase() + img.tags.slice(1) : 'Imagen de Pixabay'
            };
          });
          
          setSearchResults([...searchItems, ...pollinationsItems]);
        } else {
          setSearchResults(pollinationsItems);
          showToast("No se encontraron imágenes en Pixabay. Mostrando opciones creadas por IA.", 'info');
        }
      } else {
        // 2. Fallback usando Wikipedia si no hay clave de Pixabay
        const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=24&prop=pageimages&format=json&pithumbsize=1000&origin=*`;
        const response = await fetch(searchUrl);
        if (response.ok) {
          const data = await response.json();
          const pages = data.query?.pages;
          if (pages) {
            const searchItems = Object.values(pages)
              .filter(page => page.thumbnail?.source)
              .map(page => ({
                url: page.thumbnail.source,
                thumbnail: page.thumbnail.source,
                source: 'Wikipedia',
                title: page.title || 'Sin descripción'
              }));
            
            setSearchResults([...searchItems, ...pollinationsItems]);
            if (searchItems.length === 0) {
              showToast("No se encontraron imágenes web tradicionales, mostrando sugerencias del Creador IA.", 'info');
            }
          } else {
            setSearchResults(pollinationsItems);
            showToast("Mostrando imágenes creadas por IA.", 'info');
          }
        } else {
          setSearchResults(pollinationsItems);
        }
      }
    } catch (err) {
      console.warn("Fallo en la búsqueda de imágenes web:", err);
      setSearchResults(pollinationsItems);
      showToast("Buscador principal saturado. Mostrando sugerencias del Creador IA.", 'info');
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualAdornoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setSelectedSearchImage({
      url: objectUrl,
      thumbnail: objectUrl,
      title: file.name,
      isLocalFile: true,
      file: file
    });
    setShowPromptAssistant(true);
    e.target.value = '';
  };

  const handleSelectSearchImage = async (url, field, autoRemoveBg = false) => {
    const isLogo = field === 'logoOverlay';
    if (isLogo) {
      setIsGeneratingLogo(true);
      setIsRemovingBg(autoRemoveBg);
    } else {
      setIsGeneratingBanner(true);
    }
    
    try {
      // 1. Descargar el blob usando la función de descarga robusta con proxy de AllOrigins o usar archivo local directamente
      let blob;
      if (selectedSearchImage?.isLocalFile) {
        blob = selectedSearchImage.file;
      } else {
        blob = await fetchImageBlob(url);
      }
      
      // 2. Remover fondo blanco si se solicita para el adorno (Logo Overlay)
      if (autoRemoveBg) {
        const localUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = localUrl;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        const threshold = Math.round(bgRemovalTolerance * 2.55);
        const transparentDataUrl = removeColorBackground(img, 255, 255, 255, threshold);
        URL.revokeObjectURL(localUrl);
        
        const res = await fetch(transparentDataUrl);
        blob = await res.blob();
      }
      
      const file = new File([blob], `${field}_search_${Date.now()}.png`, { type: 'image/png' });
      const storageUrl = await uploadToFirebaseStorage(file);
      
      if (isLogo) {
        const newOverlay = {
          id: `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          url: storageUrl,
          x: 50,
          y: 50,
          size: 15
        };
        setFormData(prev => {
          const updated = [...(prev.overlays || []), newOverlay];
          const first = updated[0] || {};
          return {
            ...prev,
            overlays: updated,
            logoOverlay: first.url || '',
            logoXPercent: first.x !== undefined ? first.x : 50,
            logoYPercent: first.y !== undefined ? first.y : 50,
            logoSizePercent: first.size !== undefined ? first.size : 15
          };
        });
        setSelectedOverlayId(newOverlay.id);
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: storageUrl
        }));
      }
      
      showToast(`¡Imagen configurada como ${isLogo ? 'Adorno (Logo Overlay)' : 'Banner de Fondo'} con éxito! 🎉`, 'success');
      setShowPromptAssistant(false);
      setSelectedSearchImage(null);
      
      // Auto-scroll a la sección de previsualización e interactividad
      setTimeout(() => {
        const el = document.getElementById("banner-positioner-section");
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } catch (error) {
      console.error("Error al aplicar la imagen de búsqueda:", error);
      showToast("No se pudo procesar o subir la imagen. Por favor intenta con otra.", 'error');
    } finally {
      if (isLogo) {
        setIsGeneratingLogo(false);
        setIsRemovingBg(false);
      } else {
        setIsGeneratingBanner(false);
      }
    }
  };

  // Escuchar e Inicializar (Seed) Plantillas en la Base de Datos
  useEffect(() => {
    const db = getDatabase(app);
    const templatesRef = ref(db, 'appSettings/festiveTemplates');
    const unsubscribe = onValue(templatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTemplates(data);
      } else {
        // Sembrar con valores por defecto si no existen
        set(templatesRef, defaultTemplates);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sincronizar el formulario de edición de plantilla cuando cambia la selección o las plantillas
  useEffect(() => {
    if (templates && templates[selectedTemplateKey]) {
      setTemplateFormData({
        ...templates[selectedTemplateKey]
      });
    }
  }, [selectedTemplateKey, templates]);

  const handleTogglePreview = (theme) => {
    if (previewTheme && previewTheme.holidayId === theme.id) {
      setPreviewTheme(null);
    } else {
      if (theme.overlays || theme.logoOverlay || theme.heroImage || theme.themeOverrides) {
        setPreviewTheme({
          holidayId: theme.id,
          name: theme.name,
          isActive: theme.isActive !== false,
          matchType: theme.matchType,
          date: theme.date,
          keyword: theme.keyword,
          heroImage: theme.heroImage || '',
          logoOverlay: theme.logoOverlay || '',
          overlays: theme.overlays || [],
          logoXPercent: theme.logoXPercent !== undefined ? theme.logoXPercent : 50,
          logoYPercent: theme.logoYPercent !== undefined ? theme.logoYPercent : 50,
          logoSizePercent: theme.logoSizePercent !== undefined ? theme.logoSizePercent : 15,
          themeOverrides: theme.themeOverrides || { ...defaultColors }
        });
      } else {
        const suggestions = getHolidaySuggestions(theme.name, templates);
        setPreviewTheme({
          holidayId: theme.id,
          name: theme.name,
          themeOverrides: { ...defaultColors, ...suggestions.colors }
        });
      }
      
      // Redirect to home page so the user can see the preview applied immediately
      setTimeout(() => {
        navigate('/');
      }, 100);
    }
  };

  const [themes, setThemes] = useState([]);
  const [editingTheme, setEditingTheme] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    matchType: 'holiday_keyword',
    date: '',
    keyword: '',
    isActive: true,
    heroImage: '',
    logoOverlay: 'https://upload.wikimedia.org/wikipedia/commons/d/de/General_Martin_Miguel_de_Guemes.jpg',
    overlays: defaultOverlaysTemplate,
    themeOverrides: { ...defaultColors },
    logoXPercent: 92,
    logoYPercent: 20,
    logoSizePercent: 12,
    promptAssetDetails: '',
    logoPrompt: '',
    bannerPrompt: '',
    isLogoPromptCustom: false,
    isBannerPromptCustom: false
  });

  useEffect(() => {
    if (!formData?.isLogoPromptCustom && formData?.themeOverrides) {
      const primColor = (formData.themeOverrides.primaryColor || '#948924').replace('#', '');
      const spnColor = (formData.themeOverrides.spanColor || '#c61d1d').replace('#', '');
      const newPrompt = `Recurso gráfico cuadrado aislado de estilo vector plano de ${formData?.promptAssetDetails || 'adornos festivos'}, ilustración minimalista moderna, usando colores hex ${primColor} y hex ${spnColor}, aislado sobre un fondo blanco sólido limpio para una fácil remoción de fondo, alta resolución, arte minimalista en 2D, sin sombras, sin degradados, relación de aspecto 1:1, formato cuadrado`;
      if (formData.logoPrompt !== newPrompt) {
        setFormData(prev => ({ ...prev, logoPrompt: newPrompt }));
      }
    }
  }, [formData?.promptAssetDetails, formData?.themeOverrides?.primaryColor, formData?.themeOverrides?.spanColor, formData?.isLogoPromptCustom, formData?.logoPrompt]);

  useEffect(() => {
    if (!formData?.isBannerPromptCustom && formData?.themeOverrides) {
      const primColor = (formData.themeOverrides.primaryColor || '#948924').replace('#', '');
      const spnColor = (formData.themeOverrides.spanColor || '#c61d1d').replace('#', '');
      const newPrompt = `Recurso gráfico cuadrado aislado de estilo vector plano de ${formData?.promptAssetDetails || 'adornos festivos'}, ilustración minimalista moderna, usando colores hex ${primColor} y hex ${spnColor}, aislado sobre un fondo blanco sólido limpio para una fácil remoción de fondo, alta resolución, arte minimalista en 2D, sin sombras, sin degradados, relación de aspecto 1:1, formato cuadrado`;
      if (formData.bannerPrompt !== newPrompt) {
        setFormData(prev => ({ ...prev, bannerPrompt: newPrompt }));
      }
    }
  }, [formData?.promptAssetDetails, formData?.themeOverrides?.primaryColor, formData?.themeOverrides?.spanColor, formData?.isBannerPromptCustom, formData?.bannerPrompt]);

  const [showIdeas, setShowIdeas] = useState(false);
  const [googleHolidays, setGoogleHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  const fetchGoogleHolidays = async () => {
    if (googleHolidays.length > 0) return;
    setLoadingHolidays(true);
    try {
      const apiKey = Clave();
      const currentYear = new Date().getFullYear();
      const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/es.ar.official%23holiday@group.v.calendar.google.com/events', {
        params: {
          key: apiKey,
          timeMin: new Date(currentYear, 0, 1).toISOString(),
          timeMax: new Date(currentYear + 1, 11, 31).toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        }
      });
      const events = response.data.items.map(event => ({
        id: event.id,
        date: event.start.date,
        name: event.summary,
        year: new Date(event.start.date).getFullYear()
      }));
      // Filtrar repetidos o vacíos
      const uniqueEvents = [];
      const keysSeen = new Set();
      for (const ev of events) {
        const key = `${ev.date}-${ev.name}`;
        if (!keysSeen.has(key)) {
          keysSeen.add(key);
          uniqueEvents.push(ev);
        }
      }
      setGoogleHolidays(uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
      console.error('Error fetching Google holidays for ideas, using fallbacks:', error);
      const currentYear = new Date().getFullYear();
      const fallbackEvents = [
        { id: 'fb-1', date: `${currentYear}-01-01`, name: 'Año Nuevo', year: currentYear },
        { id: 'fb-2', date: `${currentYear}-02-16`, name: 'Carnaval', year: currentYear },
        { id: 'fb-3', date: `${currentYear}-03-24`, name: 'Día Nacional de la Memoria por la Verdad y la Justicia', year: currentYear },
        { id: 'fb-4', date: `${currentYear}-04-02`, name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', year: currentYear },
        { id: 'fb-5', date: `${currentYear}-04-03`, name: 'Viernes Santo', year: currentYear },
        { id: 'fb-6', date: `${currentYear}-05-01`, name: 'Día del Trabajador', year: currentYear },
        { id: 'fb-7', date: `${currentYear}-05-25`, name: 'Día de la Revolución de Mayo', year: currentYear },
        { id: 'fb-8', date: `${currentYear}-06-20`, name: 'Día de la Bandera', year: currentYear },
        { id: 'fb-9', date: `${currentYear}-07-09`, name: 'Día de la Independencia', year: currentYear },
        { id: 'fb-10', date: `${currentYear}-08-17`, name: 'Paso a la Inmortalidad del Gral. San Martín', year: currentYear },
        { id: 'fb-11', date: `${currentYear}-10-12`, name: 'Día de la Diversidad Cultural', year: currentYear },
        { id: 'fb-12', date: `${currentYear}-11-20`, name: 'Día de la Soberanía Nacional', year: currentYear },
        { id: 'fb-13', date: `${currentYear}-12-08`, name: 'Día de la Inmaculada Concepción', year: currentYear },
        { id: 'fb-14', date: `${currentYear}-12-25`, name: 'Navidad', year: currentYear },
        { id: 'fb-15', date: `${currentYear+1}-01-01`, name: 'Año Nuevo', year: currentYear+1 },
        { id: 'fb-16', date: `${currentYear+1}-02-16`, name: 'Carnaval', year: currentYear+1 },
        { id: 'fb-17', date: `${currentYear+1}-04-02`, name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', year: currentYear+1 },
        { id: 'fb-18', date: `${currentYear+1}-05-01`, name: 'Día del Trabajador', year: currentYear+1 },
        { id: 'fb-19', date: `${currentYear+1}-05-25`, name: 'Día de la Revolución de Mayo', year: currentYear+1 },
        { id: 'fb-20', date: `${currentYear+1}-07-09`, name: 'Día de la Independencia', year: currentYear+1 },
        { id: 'fb-21', date: `${currentYear+1}-12-25`, name: 'Navidad', year: currentYear+1 }
      ];
      setGoogleHolidays(fallbackEvents);
    } finally {
      setLoadingHolidays(false);
    }
  };

  const handleQuickApply = (holiday) => {
    const suggestions = getHolidaySuggestions(holiday.name, templates);
    
    setFormData({
      name: holiday.name,
      matchType: 'holiday_keyword',
      date: '',
      keyword: suggestions.keyword,
      isActive: true,
      heroImage: '',
      logoOverlay: '',
      themeOverrides: { ...defaultColors, ...suggestions.colors }
    });
    
    // Hacer scroll suave hacia el formulario
    const formCard = document.querySelector('.festive-theme-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getDynamicOverlays = (holiday) => {
    try {
      const parts = holiday.date.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      const monthName = months[month - 1] || 'feriado';
      const formattedDateText = `${day} de ${monthName}`;
      
      // Limpiar el nombre para la etiqueta de abajo
      let cleanLabel = holiday.name;
      const prefixesToRemove = [
        'conmemoración de la', 'conmemoración del', 'conmemoración de', 
        'conmemoracion de la', 'conmemoracion del', 'conmemoracion de',
        'paso a la inmortalidad de la', 'paso a la inmortalidad del', 'paso a la inmortalidad de',
        'día de la', 'dia de la', 'día del', 'dia del', 'día de', 'dia de',
        'día nacional de la', 'dia nacional de la', 'día nacional del', 'dia nacional del',
        'día nacional', 'dia nacional', 'gral. don', 'gral don', 'general don',
        'general', 'gral.', 'don'
      ];
      let lowerLabel = cleanLabel.toLowerCase();
      for (const prefix of prefixesToRemove) {
        if (lowerLabel.startsWith(prefix)) {
          cleanLabel = cleanLabel.substring(prefix.length).trim();
          lowerLabel = cleanLabel.toLowerCase();
        }
      }
      
      const bottomText = `Conmemoración\n${cleanLabel}`;

      // Determinar la imagen del distintivo según el tipo de feriado
      let defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Calendar_icon_v2.svg/640px-Calendar_icon_v2.svg.png';
      const lowerName = holiday.name.toLowerCase();
      
      if (lowerName.includes('güemes') || lowerName.includes('guemes')) {
        defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/d/de/General_Martin_Miguel_de_Guemes.jpg';
      } else if (lowerName.includes('navidad') || lowerName.includes('nochebuena')) {
        defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Red_Christmas_Bauble_Ornament.jpg/640px-Red_Christmas_Bauble_Ornament.jpg';
      } else if (lowerName.includes('año nuevo') || lowerName.includes('nochevieja') || lowerName.includes('fin de año') || lowerName.includes('ano nuevo')) {
        defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Fuegos_artificiales_valparaiso_2005.jpg/640px-Fuegos_artificiales_valparaiso_2005.jpg';
      } else if (
        lowerName.includes('independencia') || 
        lowerName.includes('25 de mayo') || 
        lowerName.includes('revolución de mayo') || 
        lowerName.includes('revolucion de mayo') || 
        lowerName.includes('soberanía') || 
        lowerName.includes('belgrano') || 
        lowerName.includes('san martín') || 
        lowerName.includes('san martin') || 
        lowerName.includes('malvinas') || 
        lowerName.includes('patria')
      ) {
        defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sol_de_Mayo-oficial.svg/640px-Sol_de_Mayo-oficial.svg.png';
      } else if (lowerName.includes('carnaval')) {
        defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Carnaval_de_R%C3%ADo_de_Janeiro_2014.jpg/640px-Carnaval_de_R%C3%ADo_de_Janeiro_2014.jpg';
      } else if (lowerName.includes('trabajador') || lowerName.includes('trabajo')) {
        defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Wrench_and_hammer_icon.svg/640px-Wrench_and_hammer_icon.svg.png';
      } else if (lowerName.includes('pascua') || lowerName.includes('semana santa') || lowerName.includes('santo') || lowerName.includes('inmaculada')) {
        defaultImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Pigeon_silhouette.svg/640px-Pigeon_silhouette.svg.png';
      }

      return [
        {
          id: 'template-text-top',
          type: 'text',
          text: formattedDateText,
          x: 92,
          y: 3,
          size: 13,
          color: '#ffffff',
          fontFamily: "'playlistscript', cursive"
        },
        {
          id: 'template-photo',
          type: 'image',
          url: defaultImageUrl,
          x: 92,
          y: 20,
          size: 12
        },
        {
          id: 'template-text-bottom',
          type: 'text',
          text: bottomText,
          x: 92,
          y: 38,
          size: 7,
          color: '#ffffff',
          fontFamily: "'product_sansregular', sans-serif"
        }
      ];
    } catch (err) {
      console.error("Error generating dynamic overlays:", err);
      return defaultOverlaysTemplate;
    }
  };

  const handleQuickCreate = async (holiday) => {
    const confirmMsg = `¿Estás seguro de que deseas agregar directamente el tema festivo "${holiday.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    const suggestions = getHolidaySuggestions(holiday.name, templates);
    const db = getDatabase(app);
    const listRef = ref(db, 'appSettings/festiveThemes');
    const newThemeRef = push(listRef);

    const dynamicOverlays = getDynamicOverlays(holiday);
    const themeData = {
      name: holiday.name,
      matchType: 'holiday_keyword',
      date: holiday.date.substring(5, 10),
      keyword: suggestions.keyword,
      isActive: true,
      heroImage: '',
      logoOverlay: dynamicOverlays.find(o => o.type === 'image')?.url || '',
      overlays: dynamicOverlays,
      themeOverrides: { ...defaultColors, ...suggestions.colors }
    };

    try {
      await set(newThemeRef, themeData);
      
      // Load to form and set edit mode immediately so they can adjust placements
      editTheme({
        id: newThemeRef.key,
        ...themeData
      });
      
      setShowIdeas(false);
      
      // Scroll to form
      const formCard = document.querySelector('.festive-theme-card');
      if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      showToast(`🎉 ¡El tema "${holiday.name}" ha sido agregado directamente!`, 'success');
    } catch (error) {
      console.error("Error creating theme directly:", error);
      showToast("Ocurrió un error al agregar el tema directamente.", 'error');
    }
  };

  const handleLoadExistingTheme = (holiday) => {
    const existingTheme = themes.find(theme => {
      if (theme.name && theme.name.toLowerCase().trim() === holiday.name.toLowerCase().trim()) return true;
      if (theme.matchType === 'holiday_keyword' && theme.keyword) {
        const keyword = theme.keyword.toLowerCase().trim();
        if (keyword && holiday.name.toLowerCase().includes(keyword)) return true;
      }
      if (theme.matchType === 'fixed_date' && theme.date) {
        const holidayMMDD = holiday.date.substring(5, 10);
        if (theme.date === holidayMMDD) return true;
      }
      return false;
    });

    if (existingTheme) {
      editTheme(existingTheme);
      setShowIdeas(false);
      // Scroll to form
      const formCard = document.querySelector('.festive-theme-card');
      if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const [selectedHolidays, setSelectedHolidays] = useState([]);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const isHolidayAlreadyCreated = (holiday) => {
    if (!holiday) return false;
    return themes.some(theme => {
      if (theme.name && theme.name.toLowerCase().trim() === holiday.name.toLowerCase().trim()) return true;
      if (theme.matchType === 'holiday_keyword' && theme.keyword) {
        const keyword = theme.keyword.toLowerCase().trim();
        if (keyword && holiday.name.toLowerCase().includes(keyword)) return true;
      }
      if (theme.matchType === 'fixed_date' && theme.date) {
        const holidayMMDD = holiday.date.substring(5, 10);
        if (theme.date === holidayMMDD) return true;
      }
      return false;
    });
  };

  const handleToggleSelect = (e, holidayId) => {
    // Si hicieron clic en el botón de aplicar rápido, no toggleamos selección
    if (e.target.closest('.quick-apply-btn')) return;
    
    // Si ya está creado, no permitimos seleccionarlo
    const holiday = googleHolidays.find(h => h.id === holidayId);
    if (holiday && isHolidayAlreadyCreated(holiday)) return;
    
    setSelectedHolidays(prev => {
      if (prev.includes(holidayId)) {
        return prev.filter(id => id !== holidayId);
      } else {
        return [...prev, holidayId];
      }
    });
  };

  const handleSelectAll = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const futureHolidays = googleHolidays.filter(h => h.date >= todayStr);
    const nonCreatedFutureHolidays = futureHolidays.filter(h => !isHolidayAlreadyCreated(h));
    
    if (selectedHolidays.length === nonCreatedFutureHolidays.length) {
      setSelectedHolidays([]);
    } else {
      setSelectedHolidays(nonCreatedFutureHolidays.map(h => h.id));
    }
  };

  const handleBulkCreate = async () => {
    if (selectedHolidays.length === 0) return;
    
    const confirmMsg = `¿Estás seguro de que deseas crear automáticamente ${selectedHolidays.length} temas festivos basados en los feriados seleccionados?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkSaving(true);
    const db = getDatabase(app);
    const listRef = ref(db, 'appSettings/festiveThemes');
    
    try {
      let createdCount = 0;
      for (const id of selectedHolidays) {
        const holiday = googleHolidays.find(h => h.id === id);
        if (holiday) {
          const suggestions = getHolidaySuggestions(holiday.name, templates);
          const dynamicOverlays = getDynamicOverlays(holiday);
          const newThemeRef = push(listRef);
          await set(newThemeRef, {
            name: holiday.name,
            matchType: 'holiday_keyword',
            date: holiday.date.substring(5, 10),
            keyword: suggestions.keyword,
            isActive: true,
            heroImage: '',
            logoOverlay: dynamicOverlays.find(o => o.type === 'image')?.url || '',
            overlays: dynamicOverlays,
            themeOverrides: { ...defaultColors, ...suggestions.colors }
          });
          createdCount++;
        }
      }
      showToast(`🎉 ¡Se crearon con éxito ${createdCount} temas festivos automáticos!`, 'success');
      setSelectedHolidays([]);
      setShowIdeas(false);
    } catch (error) {
      console.error("Error creating bulk themes:", error);
      showToast("Ocurrió un error al crear los temas en lote.", 'error');
    } finally {
      setIsBulkSaving(false);
    }
  };


  useEffect(() => {
    if (showIdeas) {
      fetchGoogleHolidays();
    }
  }, [showIdeas]);

  const heroImageRef = useRef(null);
  const logoOverlayRef = useRef(null);

  // Lógica para Modificar Plantillas
  const handleTemplateInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemplateKeywordsChange = (e) => {
    const value = e.target.value;
    const keywordsArray = value.split(',').map(s => s.trim()).filter(Boolean);
    setTemplateFormData(prev => ({
      ...prev,
      matchKeywords: keywordsArray
    }));
  };

  const handleTemplateColorChange = (key) => (e) => {
    const value = e.target.value;
    setTemplateFormData(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value
      }
    }));
  };

  const handleTemplateIdeaChange = (index, value) => {
    setTemplateFormData(prev => {
      const newIdeas = [...prev.ideas];
      newIdeas[index] = value;
      return {
        ...prev,
        ideas: newIdeas
      };
    });
  };

  const handleAddTemplateIdea = () => {
    setTemplateFormData(prev => ({
      ...prev,
      ideas: [...(prev.ideas || []), '✨ Nueva idea de diseño']
    }));
  };

  const handleRemoveTemplateIdea = (index) => {
    setTemplateFormData(prev => ({
      ...prev,
      ideas: (prev.ideas || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveTemplate = async () => {
    if (!templateFormData) return;
    try {
      const db = getDatabase(app);
      const templateRef = ref(db, `appSettings/festiveTemplates/${selectedTemplateKey}`);
      await set(templateRef, templateFormData);
      showToast('Plantilla guardada exitosamente 🎉', 'success');
    } catch (error) {
      console.error("Error saving template:", error);
      showToast("Error al guardar la plantilla.", 'error');
    }
  };

  useEffect(() => {
    const db = getDatabase(app);
    const themesRef = ref(db, 'appSettings/festiveThemes');
    const unsubscribe = onValue(themesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const themesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setThemes(themesArray);
      } else {
        setThemes([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleColorChange = (key) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      themeOverrides: {
        ...prev.themeOverrides,
        [key]: value
      }
    }));
  };

  const handleImageUpload = async (file, field) => {
    if (!file) return;
    try {
      const url = await uploadToFirebaseStorage(file);
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Error subiendo la imagen.", 'error');
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      showToast('Debes ingresar un nombre para el tema festivo.', 'info');
      return;
    }

    const db = getDatabase(app);
    let themeRef;
    if (editingTheme && editingTheme.id) {
      themeRef = ref(db, `appSettings/festiveThemes/${editingTheme.id}`);
    } else {
      const listRef = ref(db, 'appSettings/festiveThemes');
      themeRef = push(listRef);
    }

    const dataToSave = { ...formData };
    
    await set(themeRef, dataToSave);
    resetForm();
    showToast('Tema festivo guardado exitosamente.', 'success');
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este tema festivo?")) {
      const db = getDatabase(app);
      await remove(ref(db, `appSettings/festiveThemes/${id}`));
    }
  };

  const editTheme = (theme) => {
    setEditingTheme(theme);
    let initialOverlays = theme.overlays || [];
    if (initialOverlays.length === 0 && theme.logoOverlay) {
      initialOverlays = [{
        id: 'main',
        type: 'image',
        url: theme.logoOverlay,
        x: theme.logoXPercent !== undefined ? theme.logoXPercent : 50,
        y: theme.logoYPercent !== undefined ? theme.logoYPercent : 50,
        size: theme.logoSizePercent !== undefined ? theme.logoSizePercent : 15
      }];
    }
    setFormData({
      name: theme.name || '',
      matchType: theme.matchType || 'holiday_keyword',
      date: theme.date || '',
      keyword: theme.keyword || '',
      isActive: theme.isActive !== false,
      heroImage: theme.heroImage || '',
      logoOverlay: theme.logoOverlay || '',
      overlays: initialOverlays,
      themeOverrides: { ...defaultColors, ...theme.themeOverrides },
      logoXPercent: theme.logoXPercent !== undefined ? theme.logoXPercent : 50,
      logoYPercent: theme.logoYPercent !== undefined ? theme.logoYPercent : 50,
      logoSizePercent: theme.logoSizePercent !== undefined ? theme.logoSizePercent : 15,
      promptAssetDetails: theme.promptAssetDetails || '',
      logoPrompt: theme.logoPrompt || '',
      bannerPrompt: theme.bannerPrompt || '',
      isLogoPromptCustom: theme.isLogoPromptCustom || false,
      isBannerPromptCustom: theme.isBannerPromptCustom || false
    });
    setSelectedOverlayId(initialOverlays[0]?.id || null);
    window.scrollTo(0, 0);
  };

  const handleOverlayDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleOverlayDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleOverlayDragOver = (e) => {
    e.preventDefault();
  };

  const handleOverlayDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    setFormData(prev => {
      const updated = [...(prev.overlays || [])];
      const [movedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return {
        ...prev,
        overlays: updated
      };
    });
  };

  const resetForm = () => {
    setEditingTheme(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      matchType: 'holiday_keyword',
      date: '',
      keyword: '',
      isActive: true,
      heroImage: '',
      logoOverlay: 'https://upload.wikimedia.org/wikipedia/commons/d/de/General_Martin_Miguel_de_Guemes.jpg',
      overlays: defaultOverlaysTemplate,
      themeOverrides: { ...defaultColors },
      logoXPercent: 92,
      logoYPercent: 20,
      logoSizePercent: 12,
      promptAssetDetails: '',
      logoPrompt: '',
      bannerPrompt: '',
      isLogoPromptCustom: false,
      isBannerPromptCustom: false
    });
    setSelectedOverlayId('template-photo');
    if (heroImageRef.current) heroImageRef.current.value = '';
    if (logoOverlayRef.current) logoOverlayRef.current.value = '';
  };

  const isFormVisible = showCreateForm || editingTheme !== null;

  return (
    <>
      <FestiveThemeGlobalStyle />
      <div className="form-festive-themes">
        <h2>Temas Festivos (Eventos Especiales)</h2>

        {/* Banner de alerta de simulación en vivo */}
        {previewTheme && (
          <div className="preview-alert-banner">
            <div className="preview-alert-title">
              <span>👁️ Modo Previsualización Activo: Simulando tema "{previewTheme.name}" en toda la App</span>
            </div>
            <button 
              type="button" 
              className="btn-preview-stop" 
              onClick={() => setPreviewTheme(null)}
            >
              Detener Previsualización
            </button>
          </div>
        )}

        {/* Sección interactiva y dinámica de Sugerencias de Feriados y Temas */}
        {!isFormVisible && (
          <div className="ideas-toggle-container" style={{ gap: '15px', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button 
              type="button" 
              className="btn-ideas-toggle" 
              onClick={() => setShowIdeas(!showIdeas)}
            >
              {showIdeas ? '✨ Ocultar Ideas y Feriados' : '✨ Ver Ideas y Feriados de Google (2026 - 2027)'}
            </button>
          </div>
        )}

        {!isFormVisible && showIdeas && (
          <div className="festive-theme-card" style={{ padding: '1.5rem', background: '#fcfcfc', border: '1px solid rgba(148, 137, 36, 0.2)' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#160529' }}>
              💡 Feriados Oficiales y Propuestas de Diseño
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
              Explora los feriados oficiales de Argentina recuperados de Google Calendar. Haz clic en una tarjeta para seleccionarla y crear temas automáticos en lote, o haz clic en <strong>"Aplicar Idea de Tema"</strong> en cualquiera de ellas para configurar el formulario principal.
            </p>

            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const futureHolidays = googleHolidays.filter(h => h.date >= todayStr);
              
              if (loadingHolidays || futureHolidays.length === 0) return null;
              
              return (
                <div className="ideas-bulk-toolbar">
                  <div className="bulk-info-text">
                    <span>{selectedHolidays.length} seleccionados de {futureHolidays.filter(h => !isHolidayAlreadyCreated(h)).length} feriados por agregar</span>
                  </div>
                  <div className="bulk-buttons-group">
                    <button 
                      type="button" 
                      className="btn-bulk-secondary" 
                      onClick={handleSelectAll}
                    >
                      {selectedHolidays.length === futureHolidays.filter(h => !isHolidayAlreadyCreated(h)).length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                    </button>
                    <button 
                      type="button" 
                      className="btn-bulk-action" 
                      onClick={handleBulkCreate}
                      disabled={selectedHolidays.length === 0 || isBulkSaving}
                    >
                      {isBulkSaving ? (
                        <>
                          <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: 'white', marginRight: '5px' }}></div>
                          Creando Temas...
                        </>
                      ) : (
                        <>⚡ Crear Temas en Lote ({selectedHolidays.length})</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}

            {loadingHolidays ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p style={{ color: '#666', fontWeight: 'bold' }}>Consultando calendario de Google...</p>
              </div>
            ) : (
              <>
                <div className="holiday-ideas-grid">
                  {(() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const futureHolidays = googleHolidays.filter(h => h.date >= todayStr);
                    const visibleHolidays = futureHolidays.slice(0, visibleHolidaysCount);
                    
                    return visibleHolidays.map((holiday) => {
                      const suggestions = getHolidaySuggestions(holiday.name, templates);
                      const isNextYear = holiday.year > new Date().getFullYear();
                      const isCreated = isHolidayAlreadyCreated(holiday);
                      const isSelected = isCreated || selectedHolidays.includes(holiday.id);
                      
                      return (
                        <div 
                          className={`holiday-idea-card ${isCreated ? 'already-created' : ''} ${isSelected && !isCreated ? 'selected' : ''}`} 
                          key={holiday.id}
                          onClick={(e) => handleToggleSelect(e, holiday.id)}
                        >
                          {isCreated ? (
                            <span className="idea-badge" style={{ background: '#10b981', color: 'white', fontWeight: 'bold' }}>
                              ✔️ Ya Creado
                            </span>
                          ) : (
                            <span className={`idea-badge ${isNextYear ? 'next-year' : ''}`}>
                              {isNextYear ? 'Próximo Año' : 'Este Año'}
                            </span>
                          )}
                          <div className="idea-card-header">
                            <h4>{holiday.name}</h4>
                            <span className="idea-date">
                              {new Date(holiday.date + 'T00:00:00').toLocaleDateString('es-AR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <ul className="ideas-list">
                            {suggestions.ideas.map((idea, index) => (
                              <li key={index}>{idea}</li>
                            ))}
                          </ul>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 1.2rem 1.2rem 1.2rem', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {isCreated ? (
                                <button 
                                  type="button" 
                                  className="quick-apply-btn" 
                                  onClick={() => handleLoadExistingTheme(holiday)}
                                  style={{ flexGrow: 1, margin: 0, padding: '8px 10px', background: '#3b82f6', color: 'white', fontWeight: 'bold' }}
                                >
                                  ✏️ Editar Tema
                                </button>
                              ) : (
                                <button 
                                  type="button" 
                                  className="quick-apply-btn" 
                                  onClick={() => handleQuickCreate(holiday)}
                                  style={{ flexGrow: 1, margin: 0, padding: '8px 10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 'bold' }}
                                >
                                  ➕ Agregar Tema
                                </button>
                              )}
                              
                              <button 
                                type="button" 
                                className={`preview-btn ${previewTheme && previewTheme.holidayId === holiday.id ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Evitar seleccionar tarjeta
                                  handleTogglePreview(holiday);
                                }}
                                style={{ flexGrow: 1, margin: 0, padding: '8px 10px' }}
                              >
                                {previewTheme && previewTheme.holidayId === holiday.id ? '🛑 Detener' : '👁️ Probar'}
                              </button>
                            </div>
                            <div className="select-indicator" title="Seleccionar para creación en lote"></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const futureHolidays = googleHolidays.filter(h => h.date >= todayStr);
                  if (futureHolidays.length <= 4) return null;

                  return (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                      {futureHolidays.length > visibleHolidaysCount && (
                        <button
                          type="button"
                          className="btn-ideas-toggle"
                          style={{ 
                            background: 'linear-gradient(135deg, var(--primary-color, #948924) 0%, #4e3d30 100%)', 
                            fontSize: '0.95rem', 
                            padding: '10px 24px',
                            borderRadius: '50px',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => setVisibleHolidaysCount(prev => prev + 4)}
                        >
                          {`➕ Ver más feriados futuros (+${Math.min(4, futureHolidays.length - visibleHolidaysCount)})`}
                        </button>
                      )}
                      
                      {visibleHolidaysCount > 4 && (
                        <button
                          type="button"
                          className="btn-ideas-toggle"
                          style={{ 
                            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', 
                            fontSize: '0.95rem', 
                            padding: '10px 24px',
                            borderRadius: '50px',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => setVisibleHolidaysCount(4)}
                        >
                          {`⬆️ Mostrar menos`}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {(() => {
          if (!isFormVisible) {
            return (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
                <button
                  type="button"
                  className="btn-ideas-toggle"
                  style={{ 
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
                    boxShadow: '0 4px 15px rgba(5, 150, 105, 0.25)',
                    padding: '12px 32px',
                    fontSize: '1rem'
                  }}
                  onClick={() => setShowCreateForm(true)}
                >
                  ➕ Crear Nuevo Tema Festivo
                </button>
              </div>
            );
          }

          return (
            <div className="festive-theme-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>{editingTheme ? `Editando: ${editingTheme.name}` : 'Crear Nuevo Tema'}</h3>
                {editingTheme && (
                  <button 
                    type="button" 
                    className={`btn ${previewTheme && previewTheme.holidayId === editingTheme.id ? 'btn-danger' : 'btn-primary'}`}
                    style={{ 
                      margin: 0, 
                      padding: '8px 16px', 
                      fontSize: '0.85rem', 
                      background: previewTheme && previewTheme.holidayId === editingTheme.id ? '#ef4444' : '#6366f1',
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => handleTogglePreview({ id: editingTheme.id, ...formData })}
                  >
                    {previewTheme && previewTheme.holidayId === editingTheme.id ? '🛑 Detener Simulación' : '👁️ Probar Tema en Vivo'}
                  </button>
                )}
                {!editingTheme && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ margin: 0, padding: '6px 12px', fontSize: '0.85rem', background: '#6b7280' }}
                    onClick={() => setShowCreateForm(false)}
                  >
                    Ocultar Formulario ❌
                  </button>
                )}
              </div>
              
              <div className="form-group">
                <label>Nombre de la Festividad (ej. Navidad)</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>Activo</label>
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} style={{width: '20px', height: '20px'}}/>
              </div>

              <div className="form-group">
                <label>Tipo de Activación</label>
                <select name="matchType" value={formData.matchType} onChange={handleInputChange}>
                  <option value="holiday_keyword">Palabra Clave en Feriado de Google</option>
                  <option value="fixed_date">Fecha Fija (Anual)</option>
                </select>
              </div>

              {formData.matchType === 'fixed_date' && (
                <div className="form-group">
                  <label>Fecha (Formato: MM-DD, ej. 12-25 para 25 de Diciembre)</label>
                  <input type="text" name="date" value={formData.date} onChange={handleInputChange} placeholder="MM-DD" />
                </div>
              )}

              {formData.matchType === 'holiday_keyword' && (
                <div className="form-group">
                  <label>Palabra Clave (Se buscará en los nombres de los feriados de Google. Ej: Independencia)</label>
                  <input type="text" name="keyword" value={formData.keyword} onChange={handleInputChange} />
                </div>
              )}

              {(formData.logoOverlay || (formData.overlays && formData.overlays.length > 0) || formData.heroImage) && (
                <div id="banner-positioner-section" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                    📍 Alineador de Distintivos y Textos en Banner (Mapa Cartesiano)
                  </strong>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px', marginTop: 0 }}>
                    Selecciona un adorno o texto abajo, haz clic en el banner para posicionarlo, o arrastra el control de escala vertical. ¡Puedes superponer varios elementos!
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const newTextOverlay = {
                          id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                          type: 'text',
                          text: '¡Feliz Feriado! 🎉',
                          color: '#ffffff',
                          x: 50,
                          y: 50,
                          size: 24
                        };
                        setFormData(prev => {
                          const updated = [...(prev.overlays || []), newTextOverlay];
                          const first = updated[0] || {};
                          return {
                            ...prev,
                            overlays: updated,
                            logoOverlay: first.url || '',
                            logoXPercent: first.x !== undefined ? first.x : 50,
                            logoYPercent: first.y !== undefined ? first.y : 50,
                            logoSizePercent: first.size !== undefined ? first.size : 15
                          };
                        });
                        setSelectedOverlayId(newTextOverlay.id);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        boxShadow: '0 2px 5px rgba(59, 130, 246, 0.3)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📝 Agregar Capa de Texto
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowPromptAssistant(true);
                        setTimeout(() => {
                          const el = document.getElementById("search-assistant-anchor");
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        boxShadow: '0 2px 5px rgba(5, 150, 105, 0.3)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      🔍 Buscar Adorno
                    </button>

                    <button
                      type="button"
                      onClick={() => document.getElementById('manual-adorno-file-input-empty').click()}
                      style={{
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        boxShadow: '0 2px 5px rgba(217, 119, 6, 0.3)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📤 Subir Archivo
                    </button>
                    <input
                      id="manual-adorno-file-input-empty"
                      type="file"
                      accept="image/*"
                      onChange={handleManualAdornoUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                  
                  {/* El "Mapa" Cartesiano de Superposición con Arrastre Directo (Drag and Drop) */}
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                    <div 
                      ref={containerRef}
                      onMouseDown={handlePointerDown}
                      onMouseMove={handlePointerMove}
                      onMouseUp={handlePointerUp}
                      onMouseLeave={handlePointerUp}
                      onTouchStart={handlePointerDown}
                      onTouchMove={handlePointerMove}
                      onTouchEnd={handlePointerUp}
                      style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '500px',
                        flexGrow: 1,
                        aspectRatio: '16/9',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        border: '2px solid #cbd5e1',
                        userSelect: 'none',
                        touchAction: 'none',
                        containerType: 'inline-size'
                      }}
                    >
                      {/* Imagen del Banner del Home de Fondo */}
                      <img 
                        src={homeBannerUrl || 'https://via.placeholder.com/1920x1080?text=Banner+del+Home'} 
                        alt="Banner de Fondo" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                      />
                      
                      {/* Los Distintivos Festivos y Textos Superpuestos */}
                      {formData.overlays && Array.isArray(formData.overlays) && formData.overlays.length > 0 ? (
                        formData.overlays.map((ov, index) => {
                          const isActive = ov.id === selectedOverlayId;
                          const zIndexVal = (formData.overlays.length - index) * 10;
                          if (ov.type === 'text') {
                            return (
                              <span 
                                key={ov.id}
                                style={{
                                  position: 'absolute',
                                  left: `${ov.x !== undefined ? ov.x : 50}%`,
                                  top: `${ov.y !== undefined ? ov.y : 50}%`,
                                  width: 'max-content',
                                  fontSize: `calc(${ov.size !== undefined ? ov.size : 20} * 0.2cqw)`,
                                  color: ov.color || '#ffffff',
                                  fontWeight: 'bold',
                                  transform: `translate(-50%, -50%) rotate(${ov.rotation || 0}deg)`,
                                  pointerEvents: 'none',
                                  whiteSpace: 'pre-wrap',
                                  textAlign: 'center',
                                  fontFamily: ov.fontFamily || "'product_sansregular', sans-serif",
                                  textShadow: ov.hasShadow !== false ? getOverlayShadow(ov, 'text') : 'none',
                                  border: ov.borderWidth ? `${ov.borderWidth}px ${ov.borderStyle || 'solid'} ${ov.borderColor || '#ffffff'}` : 'none',
                                  outline: isActive ? '2px dashed #3b82f6' : 'none',
                                  outlineOffset: '2px',
                                  borderRadius: `${ov.borderRadius || 0}px`,
                                  padding: `${ov.padding || 0}px`,
                                  backgroundColor: ov.backgroundColor || 'transparent',
                                  opacity: ov.opacity !== undefined ? ov.opacity : 1,
                                  zIndex: zIndexVal,
                                  transition: isDragging ? 'none' : 'all 0.15s ease-out'
                                }}
                              >
                                {ov.text || 'Texto Festivo'}
                              </span>
                            );
                          }
                          return (
                            <img 
                              key={ov.id}
                              src={ov.url} 
                              alt="Logo Superpuesto" 
                              style={{
                                position: 'absolute',
                                left: `${ov.x !== undefined ? ov.x : 50}%`,
                                top: `${ov.y !== undefined ? ov.y : 50}%`,
                                width: `${ov.size !== undefined ? ov.size : 15}%`,
                                transform: `translate(-50%, -50%) rotate(${ov.rotation || 0}deg)`,
                                pointerEvents: 'none',
                                zIndex: zIndexVal,
                                opacity: ov.opacity !== undefined ? ov.opacity : 1,
                                borderRadius: `${ov.borderRadius || 0}px`,
                                padding: `${ov.padding || 0}px`,
                                backgroundColor: ov.backgroundColor || 'transparent',
                                border: ov.borderWidth ? `${ov.borderWidth}px ${ov.borderStyle || 'solid'} ${ov.borderColor || '#ffffff'}` : 'none',
                                outline: isActive ? '2px dashed #3b82f6' : 'none',
                                outlineOffset: '2px',
                                filter: `${
                                  ov.hasShadow !== false ? `${getOverlayShadow(ov, 'filter')} ` : ''
                                }brightness(${ov.brightness !== undefined ? ov.brightness : 100}%) hue-rotate(${ov.hueRotate || 0}deg)`,
                                transition: isDragging ? 'none' : 'all 0.15s ease-out'
                              }}
                            />
                          );
                        })
                      ) : (
                        formData.logoOverlay && (
                          <img 
                            src={formData.logoOverlay} 
                            alt="Logo Superpuesto" 
                            style={{
                              position: 'absolute',
                              left: `${formData.logoXPercent !== undefined ? formData.logoXPercent : 50}%`,
                              top: `${formData.logoYPercent !== undefined ? formData.logoYPercent : 50}%`,
                              width: `${formData.logoSizePercent !== undefined ? formData.logoSizePercent : 15}%`,
                              transform: 'translate(-50%, -50%)',
                              pointerEvents: 'none',
                              filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))',
                              transition: isDragging ? 'none' : 'all 0.15s ease-out'
                            }}
                          />
                        )
                      )}
                      
                      {/* Líneas auxiliares en Cruz para el seleccionado */}
                      {(() => {
                        const activeOv = formData.overlays && selectedOverlayId 
                          ? formData.overlays.find(o => o.id === selectedOverlayId)
                          : null;
                        const x = activeOv ? activeOv.x : formData.logoXPercent;
                        const y = activeOv ? activeOv.y : formData.logoYPercent;
                        return (
                          <>
                            <div style={{
                              position: 'absolute',
                              left: `${x !== undefined ? x : 50}%`,
                              top: 0,
                              width: '1px',
                              height: '100%',
                              borderLeft: '1px dashed rgba(239, 68, 68, 0.7)',
                              pointerEvents: 'none'
                            }} />
                            <div style={{
                              position: 'absolute',
                              top: `${y !== undefined ? y : 50}%`,
                              left: 0,
                              width: '100%',
                              height: '1px',
                              borderTop: '1px dashed rgba(239, 68, 68, 0.7)',
                              pointerEvents: 'none'
                            }} />
                          </>
                        );
                      })()}
                    </div>
 
                    {/* Barra de Tamaño Vertical a un costado */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '8px',
                      background: 'white',
                      padding: '12px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      height: '290px',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#475569', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        📏 Escala ({
                          formData.overlays && selectedOverlayId 
                            ? (formData.overlays.find(o => o.id === selectedOverlayId)?.size || 15)
                            : (formData.logoSizePercent !== undefined ? formData.logoSizePercent : 15)
                        }px/%)
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const maxVal = 80;
                          let currentVal = formData.overlays && selectedOverlayId 
                            ? (formData.overlays.find(o => o.id === selectedOverlayId)?.size || 15)
                            : (formData.logoSizePercent !== undefined ? formData.logoSizePercent : 15);
                          const newVal = Math.min(maxVal, currentVal + 1);
                          
                          if (selectedOverlayId && formData.overlays) {
                            setFormData(prev => {
                              const updated = (prev.overlays || []).map(o => {
                                if (o.id === selectedOverlayId) return { ...o, size: newVal };
                                return o;
                              });
                              const first = updated[0] || {};
                              return {
                                ...prev,
                                overlays: updated,
                                logoSizePercent: first.size !== undefined ? first.size : 15
                              };
                            });
                          } else {
                            setFormData(prev => ({ ...prev, logoSizePercent: newVal }));
                          }
                        }}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          color: '#475569',
                          transition: 'all 0.15s',
                          padding: 0,
                          lineHeight: 1
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                        title="Aumentar escala (+1)"
                      >
                        +
                      </button>

                      <input 
                        type="range" 
                        min="5" 
                        max="80" 
                        value={
                          formData.overlays && selectedOverlayId 
                            ? (formData.overlays.find(o => o.id === selectedOverlayId)?.size || 15)
                            : (formData.logoSizePercent !== undefined ? formData.logoSizePercent : 15)
                        } 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (selectedOverlayId && formData.overlays) {
                            setFormData(prev => {
                              const updated = (prev.overlays || []).map(o => {
                                if (o.id === selectedOverlayId) return { ...o, size: val };
                                return o;
                              });
                              const first = updated[0] || {};
                              return {
                                ...prev,
                                overlays: updated,
                                logoSizePercent: first.size !== undefined ? first.size : 15
                              };
                            });
                          } else {
                            setFormData(prev => ({ ...prev, logoSizePercent: val }));
                          }
                        }}
                        style={{ 
                          WebkitAppearance: 'slider-vertical',
                          width: '8px',
                          height: '110px', 
                          cursor: 'ns-resize',
                          margin: '4px 0'
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const minVal = 5;
                          let currentVal = formData.overlays && selectedOverlayId 
                            ? (formData.overlays.find(o => o.id === selectedOverlayId)?.size || 15)
                            : (formData.logoSizePercent !== undefined ? formData.logoSizePercent : 15);
                          const newVal = Math.max(minVal, currentVal - 1);
                          
                          if (selectedOverlayId && formData.overlays) {
                            setFormData(prev => {
                              const updated = (prev.overlays || []).map(o => {
                                if (o.id === selectedOverlayId) return { ...o, size: newVal };
                                return o;
                              });
                              const first = updated[0] || {};
                              return {
                                ...prev,
                                overlays: updated,
                                logoSizePercent: first.size !== undefined ? first.size : 15
                              };
                            });
                          } else {
                            setFormData(prev => ({ ...prev, logoSizePercent: newVal }));
                          }
                        }}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          color: '#475569',
                          transition: 'all 0.15s',
                          padding: 0,
                          lineHeight: 1
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                        title="Disminuir escala (-1)"
                      >
                        -
                      </button>
                    </div>
                  </div>

                  {/* Gestor de Capas/Adornos Superpuestos */}
                  {formData.overlays && formData.overlays.length > 0 && (
                    <div style={{ marginTop: '15px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#334155', margin: 0 }}>
                          🖼️ Adornos y Capas Activas ({formData.overlays.length})
                        </strong>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPromptAssistant(true);
                              setTimeout(() => {
                                const el = document.getElementById("search-assistant-anchor");
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '0.72rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.15)',
                              transition: 'transform 0.15s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            🔍 Buscar Adorno
                          </button>
                          <button
                            type="button"
                            onClick={() => document.getElementById('manual-adorno-file-input-active').click()}
                            style={{
                              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '0.72rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.15)',
                              transition: 'transform 0.15s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            📤 Subir Archivo
                          </button>
                          <input
                            id="manual-adorno-file-input-active"
                            type="file"
                            accept="image/*"
                            onChange={handleManualAdornoUpload}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newTextOverlay = {
                                id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                type: 'text',
                                text: '¡Feliz Feriado! 🎉',
                                color: '#ffffff',
                                x: 50,
                                y: 50,
                                size: 24
                              };
                              setFormData(prev => {
                                const updated = [...(prev.overlays || []), newTextOverlay];
                                const first = updated[0] || {};
                                return {
                                  ...prev,
                                  overlays: updated,
                                  logoOverlay: first.url || '',
                                  logoXPercent: first.x !== undefined ? first.x : 50,
                                  logoYPercent: first.y !== undefined ? first.y : 50,
                                  logoSizePercent: first.size !== undefined ? first.size : 15
                                };
                              });
                              setSelectedOverlayId(newTextOverlay.id);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '0.72rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.15)',
                              transition: 'transform 0.15s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            📝 Agregar Texto
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        {formData.overlays.map((ov, index) => {
                          const isActive = ov.id === selectedOverlayId;
                          const isText = ov.type === 'text';
                          const isFirst = index === 0;
                          const isLast = index === formData.overlays.length - 1;
                          
                          return (
                            <div 
                              key={ov.id}
                              draggable="true"
                              onDragStart={(e) => handleOverlayDragStart(e, index)}
                              onDragEnd={handleOverlayDragEnd}
                              onDragOver={handleOverlayDragOver}
                              onDrop={(e) => handleOverlayDrop(e, index)}
                              onClick={() => setSelectedOverlayId(isActive ? null : ov.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: `2px solid ${isActive ? '#3b82f6' : '#e2e8f0'}`,
                                background: isActive ? '#eff6ff' : '#f8fafc',
                                cursor: 'grab',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                userSelect: 'none',
                                transition: 'all 0.15s ease-in-out',
                                boxShadow: draggedIndex === index ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
                                transform: draggedIndex === index ? 'scale(0.98)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '1rem', cursor: 'grab' }} title="Arrastrar para reordenar">☰</span>
                                {isText ? (
                                  <span style={{ fontSize: '1.1rem' }}>📝</span>
                                ) : (
                                  <img 
                                    src={ov.url} 
                                    alt={`Adorno ${index + 1}`} 
                                    style={{ width: '24px', height: '24px', objectFit: 'contain', background: '#e2e8f0', borderRadius: '4px' }}
                                  />
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                                  <span style={{ color: isActive ? '#3b82f6' : '#475569' }}>
                                    {isText ? `Texto: "${ov.text.substring(0, 20)}${ov.text.length > 20 ? '...' : ''}"` : `Adorno ${index + 1}`}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: isFirst ? '#3b82f6' : (isLast ? '#64748b' : '#94a3b8'), fontWeight: 'normal' }}>
                                    {isFirst ? '🌟 Capa Superior (Al frente)' : (isLast ? '⚓ Capa Inferior (Al fondo)' : '📁 Capa Intermedia')}
                                  </span>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  <button
                                    type="button"
                                    disabled={isFirst}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormData(prev => {
                                        const updated = [...(prev.overlays || [])];
                                        const temp = updated[index];
                                        updated[index] = updated[index - 1];
                                        updated[index - 1] = temp;
                                        return { ...prev, overlays: updated };
                                      });
                                    }}
                                    style={{
                                      background: isFirst ? '#f1f5f9' : '#e2e8f0',
                                      color: isFirst ? '#cbd5e1' : '#475569',
                                      border: 'none',
                                      borderRadius: '4px',
                                      width: '20px',
                                      height: '20px',
                                      cursor: isFirst ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0
                                    }}
                                    title="Subir capa (traer al frente)"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isLast}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormData(prev => {
                                        const updated = [...(prev.overlays || [])];
                                        const temp = updated[index];
                                        updated[index] = updated[index + 1];
                                        updated[index + 1] = temp;
                                        return { ...prev, overlays: updated };
                                      });
                                    }}
                                    style={{
                                      background: isLast ? '#f1f5f9' : '#e2e8f0',
                                      color: isLast ? '#cbd5e1' : '#475569',
                                      border: 'none',
                                      borderRadius: '4px',
                                      width: '20px',
                                      height: '20px',
                                      cursor: isLast ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0
                                    }}
                                    title="Bajar capa (enviar al fondo)"
                                  >
                                    ▼
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const confirmDel = window.confirm("¿Deseas remover esta capa?");
                                    if (!confirmDel) return;
                                    setFormData(prev => {
                                      const updated = (prev.overlays || []).filter(o => o.id !== ov.id);
                                      const first = updated[0] || {};
                                      return {
                                        ...prev,
                                        overlays: updated,
                                        logoOverlay: first.url || '',
                                        logoXPercent: first.x !== undefined ? first.x : 50,
                                        logoYPercent: first.y !== undefined ? first.y : 50,
                                        logoSizePercent: first.size !== undefined ? first.size : 15
                                      };
                                    });
                                    if (selectedOverlayId === ov.id) {
                                      const remaining = formData.overlays.filter(o => o.id !== ov.id);
                                      setSelectedOverlayId(remaining[0]?.id || null);
                                    }
                                  }}
                                  style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Remover capa"
                                >
                                  ✕ Remover
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Editor Avanzado de Capas/Estilos Superpuestos */}
                      {(() => {
                        const activeOv = formData.overlays.find(o => o.id === selectedOverlayId);
                        if (!activeOv) return null;

                        const updateOverlayProp = (prop, value) => {
                          setFormData(prev => ({
                            ...prev,
                            overlays: (prev.overlays || []).map(o => o.id === selectedOverlayId ? { ...o, [prop]: value } : o)
                          }));
                        };

                        const isText = activeOv.type === 'text';

                        return (
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginTop: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{isText ? '📝' : '🖼️'} Editar Capa:</span>
                                <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>
                                  {isText ? 'Texto' : 'Imagen/Adorno'}
                                </span>
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>ID: {activeOv.id.substring(0, 8)}...</span>
                            </div>

                            {/* CATEGORÍA 1: CONTENIDO Y ESPECÍFICOS */}
                            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                              <strong style={{ fontSize: '0.78rem', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                                {isText ? '✍️ Contenido y Tipografía' : '🔮 Configuración de Imagen'}
                              </strong>
                              
                              {isText ? (
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                  <div style={{ flex: '1 1 200px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Contenido del Texto</label>
                                    <textarea 
                                      value={activeOv.text || ''} 
                                      onChange={(e) => updateOverlayProp('text', e.target.value)}
                                      placeholder="Escribe tu texto festivo aquí..."
                                      rows={2}
                                      style={{ padding: '8px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', minHeight: '44px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                    />
                                  </div>
                                  <div style={{ width: '160px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Fuente</label>
                                    <select 
                                      value={activeOv.fontFamily || "'product_sansregular', sans-serif"} 
                                      onChange={(e) => updateOverlayProp('fontFamily', e.target.value)}
                                      style={{ padding: '8px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
                                    >
                                      <option value="'playlistscript', cursive">🎨 Playlist Script</option>
                                      <option value="'product_sansregular', sans-serif">✨ Product Sans</option>
                                      <option value="'Outfit', sans-serif">Outfit</option>
                                      <option value="'Inter', sans-serif">Inter</option>
                                      <option value="monospace">Monospace</option>
                                    </select>
                                  </div>
                                  <div style={{ width: '110px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Color de Letra</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <input 
                                        type="color" 
                                        value={activeOv.color || '#ffffff'} 
                                        onChange={(e) => updateOverlayProp('color', e.target.value)}
                                        style={{ width: '30px', height: '30px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                                      />
                                      <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace' }}>{activeOv.color || '#ffffff'}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div>
                                    <label style={{ fontSize: '0.7rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Dirección URL de la Imagen (PNG Translúcido recomendado)</label>
                                    <input 
                                      type="text"
                                      value={activeOv.url || ''}
                                      onChange={(e) => updateOverlayProp('url', e.target.value)}
                                      placeholder="https://ejemplo.com/adorno.png"
                                      style={{ padding: '8px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 140px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <label style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 'bold' }}>☀️ Brillo / Iluminación</label>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>{activeOv.brightness !== undefined ? activeOv.brightness : 100}%</span>
                                      </div>
                                      <input 
                                        type="range" 
                                        min="50" 
                                        max="150" 
                                        value={activeOv.brightness !== undefined ? activeOv.brightness : 100}
                                        onChange={(e) => updateOverlayProp('brightness', parseInt(e.target.value))}
                                        style={{ width: '100%', height: '5px', borderRadius: '5px', cursor: 'pointer' }}
                                      />
                                    </div>
                                    <div style={{ flex: '1 1 140px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <label style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 'bold' }}>🌈 Rotación de Color (Tono)</label>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>{activeOv.hueRotate || 0}°</span>
                                      </div>
                                      <input 
                                        type="range" 
                                        min="0" 
                                        max="360" 
                                        value={activeOv.hueRotate || 0}
                                        onChange={(e) => updateOverlayProp('hueRotate', parseInt(e.target.value))}
                                        style={{ width: '100%', height: '5px', borderRadius: '5px', cursor: 'pointer' }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* CATEGORÍA 2: DIMENSIONES Y GIRO */}
                            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                              <strong style={{ fontSize: '0.78rem', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                                📐 Dimensiones, Relleno y Giro
                              </strong>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#475569' }}>🏁 Opacidad (Transparencia)</label>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>{Math.round((activeOv.opacity !== undefined ? activeOv.opacity : 1) * 100)}%</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05"
                                    value={activeOv.opacity !== undefined ? activeOv.opacity : 1}
                                    onChange={(e) => updateOverlayProp('opacity', parseFloat(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                  />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#475569' }}>🔄 Giro (Rotación)</label>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>{activeOv.rotation || 0}°</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="-180" 
                                    max="180" 
                                    value={activeOv.rotation || 0}
                                    onChange={(e) => updateOverlayProp('rotation', parseInt(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                  />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#475569' }}>⭕ Bordes Redondeados</label>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>{activeOv.borderRadius || 0}px</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="50" 
                                    value={activeOv.borderRadius || 0}
                                    onChange={(e) => updateOverlayProp('borderRadius', parseInt(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                  />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#475569' }}>📦 Espaciado Interno</label>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>{activeOv.padding || 0}px</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="40" 
                                    value={activeOv.padding || 0}
                                    onChange={(e) => updateOverlayProp('padding', parseInt(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                  />
                                </div>
                              </div>
                            </div>
                            {/* CATEGORÍA 3: BORDES Y FONDO */}
                            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                              <strong style={{ fontSize: '0.78rem', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                                🎨 Estilos de Borde y Fondo de la Capa
                              </strong>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#475569' }}>📏 Grosor del Borde</label>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>{activeOv.borderWidth || 0}px</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="15" 
                                    value={activeOv.borderWidth || 0}
                                    onChange={(e) => updateOverlayProp('borderWidth', parseInt(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.7rem', color: '#475569', display: 'block', marginBottom: '4px' }}>🌈 Estilo de Borde</label>
                                  <select 
                                    value={activeOv.borderStyle || 'solid'} 
                                    onChange={(e) => updateOverlayProp('borderStyle', e.target.value)}
                                    style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }}
                                  >
                                    <option value="solid">Línea Continua</option>
                                    <option value="dashed">Discontinua</option>
                                    <option value="dotted">Puntos</option>
                                    <option value="double">Doble Línea</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.7rem', color: '#475569', display: 'block', marginBottom: '4px' }}>🎨 Color Borde</label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <input 
                                      type="color" 
                                      value={activeOv.borderColor || '#ffffff'} 
                                      onChange={(e) => updateOverlayProp('borderColor', e.target.value)}
                                      style={{ width: '30px', height: '30px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                                    />
                                    <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace' }}>{activeOv.borderColor || '#ffffff'}</span>
                                  </div>
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.7rem', color: '#475569', display: 'block', marginBottom: '4px' }}>🧼 Color de Fondo</label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <input 
                                      type="color" 
                                      value={activeOv.backgroundColor && activeOv.backgroundColor !== 'transparent' ? activeOv.backgroundColor : '#ffffff'} 
                                      onChange={(e) => updateOverlayProp('backgroundColor', e.target.value)}
                                      style={{ width: '30px', height: '30px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                                    />
                                    <button 
                                      type="button" 
                                      onClick={() => updateOverlayProp('backgroundColor', 'transparent')}
                                      style={{ fontSize: '0.65rem', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white', cursor: 'pointer' }}
                                    >
                                      Transparente
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* CATEGORÍA 4: SOMBREADO AVANZADO */}
                            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <strong style={{ fontSize: '0.78rem', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                                🌓 Sombreado Personalizado (Efecto de Relieve)
                              </strong>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={activeOv.hasShadow !== false} 
                                    onChange={(e) => updateOverlayProp('hasShadow', e.target.checked)}
                                    style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                                  />
                                  <span>Habilitar Sombreado en esta Capa</span>
                                </label>
                              </div>

                              {activeOv.hasShadow !== false && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '8px' }}>
                                  {/* Color de Sombra */}
                                  <div>
                                    <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Color de Sombra</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <input 
                                        type="color" 
                                        value={activeOv.shadowColor || '#000000'} 
                                        onChange={(e) => updateOverlayProp('shadowColor', e.target.value)}
                                        style={{ width: '30px', height: '30px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
                                      />
                                      <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace' }}>{activeOv.shadowColor || '#000000'}</span>
                                    </div>
                                  </div>

                                  {/* Desplazamiento X */}
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Desplazamiento X</label>
                                      <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 'bold' }}>{activeOv.shadowOffsetX !== undefined ? activeOv.shadowOffsetX : (activeOv.shadowX !== undefined ? activeOv.shadowX : 2)}px</span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="-30"
                                      max="30"
                                      value={activeOv.shadowOffsetX !== undefined ? activeOv.shadowOffsetX : (activeOv.shadowX !== undefined ? activeOv.shadowX : 2)}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        updateOverlayProp('shadowOffsetX', val);
                                        updateOverlayProp('shadowX', val);
                                      }}
                                      style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                                    />
                                  </div>

                                  {/* Desplazamiento Y */}
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Desplazamiento Y</label>
                                      <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 'bold' }}>{activeOv.shadowOffsetY !== undefined ? activeOv.shadowOffsetY : (activeOv.shadowY !== undefined ? activeOv.shadowY : 2)}px</span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="-30"
                                      max="30"
                                      value={activeOv.shadowOffsetY !== undefined ? activeOv.shadowOffsetY : (activeOv.shadowY !== undefined ? activeOv.shadowY : 2)}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        updateOverlayProp('shadowOffsetY', val);
                                        updateOverlayProp('shadowY', val);
                                      }}
                                      style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                                    />
                                  </div>

                                  {/* Difuminado */}
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Tamaño (Difuminado)</label>
                                      <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 'bold' }}>{activeOv.shadowBlur !== undefined ? activeOv.shadowBlur : 4}px</span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="0"
                                      max="50"
                                      value={activeOv.shadowBlur !== undefined ? activeOv.shadowBlur : 4}
                                      onChange={(e) => updateOverlayProp('shadowBlur', Number(e.target.value))}
                                      style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                                    />
                                  </div>

                                  {/* Opacidad */}
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Densidad (Opacidad)</label>
                                      <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 'bold' }}>{activeOv.shadowOpacity !== undefined ? activeOv.shadowOpacity : 35}%</span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={activeOv.shadowOpacity !== undefined ? activeOv.shadowOpacity : 35}
                                      onChange={(e) => updateOverlayProp('shadowOpacity', Number(e.target.value))}
                                      style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                                    />
                                  </div>

                                  {/* Espesura */}
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Espesura (Grosor)</label>
                                      <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 'bold' }}>{activeOv.shadowThickness !== undefined ? activeOv.shadowThickness : 1} {activeOv.shadowThickness === 1 ? 'capa' : 'capas'}</span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="1"
                                      max="8"
                                      value={activeOv.shadowThickness !== undefined ? activeOv.shadowThickness : 1}
                                      onChange={(e) => updateOverlayProp('shadowThickness', Number(e.target.value))}
                                      style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}


              <h4>Colores Personalizados</h4>
              {Object.keys(defaultColors).map(key => (
                <div className="form-group" key={key}>
                  <label>{customLabels[key] || key}</label>
                  <div className="color-picker-group">
                    <input
                      type="color"
                      value={formData.themeOverrides[key]}
                      onChange={handleColorChange(key)}
                    />
                    <span>{formData.themeOverrides[key]}</span>
                  </div>
                </div>
              ))}

              <div id="search-assistant-anchor" style={{ marginTop: '2rem', borderTop: '2px dashed rgba(78, 61, 48, 0.15)', paddingTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ background: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '8px', margin: '0 0 1rem 0' }}
                  onClick={() => setShowPromptAssistant(!showPromptAssistant)}
                >
                  🔍 {showPromptAssistant ? 'Ocultar Buscador de Distintivos / Adornos' : 'Buscar Distintivos y Adornos Festivos en la Web'}
                </button>

                {showPromptAssistant && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.5rem', marginTop: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🔍 Buscador de Distintivos y Adornos Festivos (Google / Web)</span>
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#1e3a1e', marginBottom: '1.5rem' }}>
                      Escribe la descripción de lo que deseas buscar y presiona <strong>Enter</strong> o el botón de buscar para explorar sugerencias. 
                      Haz clic en los botones de abajo para aplicar la imagen de forma directa y automática.
                    </p>

                    {/* Cuadro de Sugerencias de Búsqueda de acuerdo a la festividad */}
                    {(() => {
                      if (!formData.name) return null;
                      const searchTags = getIconicSuggestions(formData.name);
                      
                      return (
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#1e293b', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <span style={{ fontWeight: 'bold', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginBottom: '6px' }}>
                            💡 Sugerencias Icónicas para "{formData.name}":
                          </span>
                          <p style={{ margin: '0 0 12px 0', lineHeight: '1.4', fontSize: '0.8rem', color: '#475569' }}>
                            Te sugerimos hacer clic en cualquiera de estos elementos representativos del evento para pre-cargar la búsqueda óptima al instante:
                          </p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {searchTags.map((item, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, promptAssetDetails: item.term }));
                                  handleSearchImages(item.term);
                                }}
                                style={{
                                  background: 'white',
                                  border: '1px solid #bae6fd',
                                  borderRadius: '20px',
                                  padding: '8px 14px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  color: '#0369a1',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#0284c7';
                                  e.currentTarget.style.color = '#ffffff';
                                  e.currentTarget.style.borderColor = '#0284c7';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = 'white';
                                  e.currentTarget.style.color = '#0369a1';
                                  e.currentTarget.style.borderColor = '#bae6fd';
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div style={{ flexGrow: 1, minWidth: '280px' }}>
                        <label style={{ color: '#166534', fontSize: '0.9rem', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>¿Qué distintivo o adorno deseas buscar?</label>
                        <input
                          type="text"
                          value={formData.promptAssetDetails || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, promptAssetDetails: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSearchImages();
                            }
                          }}
                          placeholder="ej: escarapela argentina, gorro de papa noel, calabaza halloween"
                          style={{ background: 'white', border: '1px solid #86efac', padding: '10px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          margin: 0,
                          padding: '10px 24px',
                          background: '#059669',
                          color: 'white',
                          fontWeight: 'bold',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          height: '42px',
                          border: 'none'
                        }}
                        onClick={handleSearchImages}
                        disabled={isSearching}
                      >
                        {isSearching ? '🔎 Buscando...' : '🔍 Buscar'}
                      </button>
                    </div>

                    {/* Loading status */}
                    {isSearching && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '2rem' }}>
                        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #059669', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '0.9rem', color: '#166534' }}>Buscando las mejores imágenes representativas en la web...</span>
                      </div>
                    )}

                    {/* Loader indicators during download */}
                    {(isGeneratingLogo || isGeneratingBanner) && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="spinner" style={{ width: '20px', height: '20px', border: '2.5px solid #f3f3f3', borderTop: '2.5px solid #b45309', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 'bold' }}>
                          {isGeneratingLogo ? (
                            isRemovingBg 
                              ? 'Descargando y eliminando fondo del adorno... Espera un momento ⏳' 
                              : 'Descargando adorno... Espera un momento ⏳'
                          ) : 'Procesando y aplicando banner de fondo... Espera un momento ⏳'}
                        </span>
                      </div>
                    )}

                    {/* Search Results Grid */}
                    {searchResults.length > 0 && (
                      <div style={{ background: 'white', padding: '1.2rem', borderRadius: '12px', border: '1px solid #dcfce7', marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.85rem', color: '#15803d', marginBottom: '12px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                          <span>💡 Haz clic sobre cualquier imagen para elegir cómo deseas configurarla como adorno (con o sin fondo).</span>
                        </p>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: '12px',
                          maxHeight: '650px',
                          overflowY: 'auto',
                          padding: '10px',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0'
                        }}>
                          {searchResults.map((img, idx) => (
                            <div key={idx} style={{
                              background: 'white',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                              cursor: 'pointer'
                            }}
                            className="search-item-card"
                            onClick={() => {
                              setModalImageFailed(false);
                              setSelectedSearchImage(img);
                            }}
                            >
                              <div style={{ height: '120px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', overflow: 'hidden' }}>
                                {failedImages[idx] ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                                    <span style={{ fontSize: '1.8rem' }}>🖼️</span>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold' }}>Error de carga</span>
                                  </div>
                                ) : (
                                  <img
                                    src={img.thumbnail}
                                    alt={`search-result-${idx}`}
                                    onError={() => setFailedImages(prev => ({ ...prev, [idx]: true }))}
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
                                    loading="lazy"
                                  />
                                )}
                              </div>
                              {img.title && (
                                <div style={{ 
                                  padding: '8px 8px 10px 8px', 
                                  fontSize: '0.75rem', 
                                  color: '#334155', 
                                  fontWeight: 'bold', 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  lineHeight: '1.3',
                                  minHeight: '34px',
                                  textAlign: 'center',
                                  background: 'white'
                                }} title={img.title}>
                                  {img.title}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.length === 0 && !isSearching && (
                      <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginTop: '1rem' }}>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Escribe qué adorno deseas buscar arriba y presiona Enter o haz clic en "Buscar" para comenzar.</span>
                      </div>
                    )}

                    {/* Instrucciones para Agente / Diseñador */}
                    <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '1rem', marginTop: '1.5rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#b45309', display: 'block', marginBottom: '4px' }}>🤖 Nota sobre el Diseño:</strong>
                      <p style={{ fontSize: '0.8rem', color: '#78350f', margin: 0, lineHeight: '1.4' }}>
                        Puedes buscar cualquier adorno navideño, patrio o de temporada. Una vez que lo configures como adorno, usa la cuadrícula del banner interactivo de arriba para arrastrarlo y posicionarlo de forma óptima.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleSave} style={{ margin: 0 }}>
                  {editingTheme ? 'Guardar Cambios' : 'Crear Tema'}
                </button>
                {editingTheme && (
                  <>
                    <button 
                      type="button" 
                      className={`btn ${previewTheme && previewTheme.holidayId === editingTheme.id ? 'btn-danger' : 'btn-primary'}`} 
                      onClick={() => handleTogglePreview({ id: editingTheme.id, ...formData })}
                      style={{ 
                        margin: 0,
                        background: previewTheme && previewTheme.holidayId === editingTheme.id ? '#ef4444' : '#6366f1',
                        color: 'white'
                      }}
                    >
                      {previewTheme && previewTheme.holidayId === editingTheme.id ? '🛑 Detener Simulación' : '👁️ Probar Tema en Vivo'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={async () => {
                        if (window.confirm("¿Seguro que deseas eliminar este tema festivo?")) {
                          const db = getDatabase(app);
                          await remove(ref(db, `appSettings/festiveThemes/${editingTheme.id}`));
                          resetForm();
                        }
                      }}
                      style={{ 
                        margin: 0,
                        background: '#ef4444',
                        color: 'white'
                      }}
                    >
                      🗑️ Eliminar Tema
                    </button>
                  </>
                )}
                {editingTheme && (
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={async () => {
                      await handleDelete(editingTheme.id);
                      resetForm();
                    }}
                    style={{ 
                      margin: 0,
                      background: '#ef4444',
                      color: 'white'
                    }}
                  >
                    🗑️ Eliminar Tema
                  </button>
                )}
                <button className="btn btn-secondary" onClick={resetForm} style={{ margin: 0 }}>Cancelar</button>
              </div>
            </div>
          );
        })()}


        {!isFormVisible && (
          <div className="festive-theme-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0 }}>Temas Configurados</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#4e3d30', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={viewOnlyNames} 
                  onChange={(e) => setViewOnlyNames(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
                />
                👁️ Ver solo nombres
              </label>
            </div>

            {themes.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '1.5rem', background: '#fdfbf5', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                No hay temas festivos configurados. ¡Agrega uno nuevo arriba o usa las ideas sugeridas!
              </p>
            ) : (
              viewOnlyNames ? (
                // Vista compacta: solo nombres
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {themes.map(t => (
                    <div className="configured-theme-compact-row" key={t.id} onClick={() => editTheme(t)}>
                      <div className="configured-theme-compact-left">
                        <div className={`configured-theme-compact-status-dot ${t.isActive ? 'active' : 'inactive'}`} title={t.isActive ? 'Activo' : 'Inactivo'}></div>
                        <strong>{t.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: '#888', background: '#f1f1f1', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>
                          {t.matchType === 'fixed_date' ? `📅 ${t.date}` : `🔑 "${t.keyword}"`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Vista enriquecida: tarjetas con Nombre, Fecha e Imagen (sin botones, clic edita)
                <div className="configured-themes-grid">
                  {themes.map(t => {
                    const thumbnail = getThemeThumbnail(t);
                    return (
                      <div className="configured-theme-item-card" key={t.id} onClick={() => editTheme(t)}>
                        <span className={`configured-theme-badge ${t.isActive ? 'active' : 'inactive'}`}>
                          {t.isActive ? '🟢 Activo' : '⚪ Inactivo'}
                        </span>
                        
                        <div className="configured-theme-img-preview">
                          <ThemeCompositionPreview theme={t} />
                        </div>
                        
                        <div className="configured-theme-details">
                          <h4>{t.name}</h4>
                          <span className="configured-theme-date">
                            {t.matchType === 'fixed_date' ? `📅 Fecha: ${t.date}` : `🔑 Feriado: "${t.keyword}"`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}


        {/* Modal de Previsualización de Banner de Tema */}
        {previewThemeModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '900px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              animation: 'scaleIn 0.3s ease-out'
            }}>
              <style>{`
                @keyframes scaleIn {
                  0% { transform: scale(0.95); opacity: 0; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}</style>
              
              {/* Botón de cerrar modal */}
              <button 
                type="button"
                onClick={() => setPreviewThemeModal(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.color = '#334155';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                ✕
              </button>

              <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: previewThemeModal.isActive ? '#059669' : '#64748b', background: previewThemeModal.isActive ? '#e6f4ea' : '#f1f5f9', padding: '4px 10px', borderRadius: '12px', display: 'inline-block', marginBottom: '8px' }}>
                  {previewThemeModal.isActive ? '🟢 TEMA ACTIVO EN EL HOME' : '⚪ TEMA CONFIGURADO'}
                </span>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem', fontWeight: 'bold' }}>
                  Previsualización: {previewThemeModal.name}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  {previewThemeModal.matchType === 'fixed_date' ? `📅 Programado para la fecha: ${previewThemeModal.date}` : `🔑 Activado por palabra clave de feriado: "${previewThemeModal.keyword}"`}
                </p>
              </div>

              {/* El lienzo del Banner en vista previa */}
              <div style={{ padding: '24px', background: '#f8fafc', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: '100%',
                  aspectRatio: '1920/1080',
                  position: 'relative',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  background: '#1e293b',
                  containerType: 'inline-size'
                }}>
                  {/* Banner de Fondo */}
                  <img
                    src={previewThemeModal.homeBannerUrl || 'https://via.placeholder.com/1920x1080?text=Banner+del+Home'}
                    alt="Banner de Fondo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                  />

                  {/* Overlays del tema */}
                  {previewThemeModal.overlays && Array.isArray(previewThemeModal.overlays) && previewThemeModal.overlays.length > 0 ? (
                    previewThemeModal.overlays.map((ov, index) => {
                      const zIndexVal = 5 + (previewThemeModal.overlays.length - index) * 10;
                      if (ov.type === 'text') {
                        return (
                          <span
                            key={ov.id || index}
                            style={{
                              position: 'absolute',
                              left: `${ov.x !== undefined ? ov.x : 50}%`,
                              top: `${ov.y !== undefined ? ov.y : 50}%`,
                              width: 'max-content',
                              fontSize: `calc(${ov.size !== undefined ? ov.size : 20} * 0.2cqw)`,
                              color: ov.color || '#ffffff',
                              fontWeight: 'bold',
                              transform: 'translate(-50%, -50%)',
                              pointerEvents: 'none',
                              whiteSpace: 'pre-wrap',
                              textAlign: 'center',
                              zIndex: zIndexVal,
                              fontFamily: ov.fontFamily || "'product_sansregular', sans-serif",
                              textShadow: `${getOverlayShadow(ov, 'text')}, -1px -1px 0 ${hexToRgba(ov.shadowColor || '#000000', ov.shadowOpacity !== undefined ? ov.shadowOpacity : 35)}, 1px -1px 0 ${hexToRgba(ov.shadowColor || '#000000', ov.shadowOpacity !== undefined ? ov.shadowOpacity : 35)}, -1px 1px 0 ${hexToRgba(ov.shadowColor || '#000000', ov.shadowOpacity !== undefined ? ov.shadowOpacity : 35)}, 1px 1px 0 ${hexToRgba(ov.shadowColor || '#000000', ov.shadowOpacity !== undefined ? ov.shadowOpacity : 35)}`
                            }}
                          >
                            {ov.text}
                          </span>
                        );
                      }
                      return (
                        <img
                          key={ov.id || index}
                          src={ov.url}
                          alt="Adorno"
                          style={{
                            position: 'absolute',
                            left: `${ov.x !== undefined ? ov.x : 50}%`,
                            top: `${ov.y !== undefined ? ov.y : 50}%`,
                            width: `${ov.size !== undefined ? ov.size : 15}%`,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            zIndex: zIndexVal,
                            filter: getOverlayShadow(ov, 'filter')
                          }}
                        />
                      );
                    })
                  ) : (
                    previewThemeModal.logoOverlay && (
                      <img
                        src={previewThemeModal.logoOverlay}
                        alt="Logo Overlay"
                        style={{
                          position: 'absolute',
                          left: `${previewThemeModal.logoXPercent !== undefined ? previewThemeModal.logoXPercent : 50}%`,
                          top: `${previewThemeModal.logoYPercent !== undefined ? previewThemeModal.logoYPercent : 50}%`,
                          width: `${previewThemeModal.logoSizePercent !== undefined ? previewThemeModal.logoSizePercent : 15}%`,
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                          zIndex: 5,
                          filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.35))'
                        }}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Botonera inferior */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewThemeModal(null)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const themeToEdit = previewThemeModal;
                    setPreviewThemeModal(null);
                    editTheme(themeToEdit);
                  }}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  ✏️ Editar este Tema
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Opciones para Imagen de Búsqueda */}
        {selectedSearchImage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 11000,
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setSelectedSearchImage(null)}
          >
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* Overlay de Carga durante el procesamiento */}
              {(isGeneratingLogo || isGeneratingBanner) && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 12000,
                  padding: '2rem',
                  textAlign: 'center',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div className="spinner" style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #059669',
                    borderRadius: '50%',
                    marginBottom: '1.5rem'
                  }}></div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    {isRemovingBg ? 'Procesando y quitando fondo...' : 'Descargando y guardando adorno...'}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                    {isRemovingBg 
                      ? 'Estamos descargando el adorno y aislando los contornos para dejarlo transparente. ¡Casi listo! ⏳'
                      : 'Estamos descargando el adorno y guardándolo en la nube. Espera un momento. ⏳'}
                  </p>
                </div>
              )}

              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={() => setSelectedSearchImage(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.color = '#334155';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                ×
              </button>

              <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.25rem', textAlign: 'center', fontWeight: 'bold' }}>
                ¿Cómo deseas utilizar esta imagen?
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem 0', textAlign: 'center', lineHeight: '1.4' }}>
                {selectedSearchImage.title || 'Elige una de las siguientes opciones para configurar la imagen.'}
              </p>

              {/* Vista previa de imagen */}
              <div style={{
                width: '100%',
                height: '160px',
                background: '#f1f5f9',
                backgroundImage: 'radial-gradient(#cbd5e1 20%, transparent 20%), radial-gradient(#cbd5e1 20%, transparent 20%)',
                backgroundSize: '10px 10px',
                backgroundPosition: '0 0, 5px 5px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                marginBottom: '1.5rem',
                border: '2px dashed #cbd5e1',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                {modalImageFailed ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#94a3b8', zIndex: 1 }}>
                    <span style={{ fontSize: '2.5rem' }}>🖼️</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>Imagen no disponible</span>
                  </div>
                ) : (
                  <>
                    <img
                      src={modalPreviewUrl || selectedSearchImage.thumbnail || selectedSearchImage.url}
                      alt="Vista previa con remoción"
                      onError={() => setModalImageFailed(true)}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        transition: 'filter 0.2s ease',
                        filter: isProcessingModalPreview ? 'blur(3px) grayscale(30%)' : 'none'
                      }}
                    />
                    
                    {/* Spinner de procesamiento */}
                    {isProcessingModalPreview && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.45)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backdropFilter: 'blur(1px)',
                        borderRadius: '12px',
                        zIndex: 10
                      }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          border: '3px solid #e2e8f0',
                          borderTop: '3px solid #059669',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#047857', letterSpacing: '0.5px' }}>
                          PROCESANDO FONDO...
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Ajuste de Tolerancia de Fondo */}
              <div style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🎛️ Nivel de Remoción de Fondo: <span style={{ color: '#059669', background: '#e6f4ea', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>{bgRemovalTolerance}%</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={bgRemovalTolerance}
                  onChange={(e) => setBgRemovalTolerance(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#059669',
                    cursor: 'pointer',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#cbd5e1',
                    outline: 'none',
                    margin: '6px 0'
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: '1.3' }}>
                  Aumenta si quedan restos blancos en los bordes; disminuye si se borran partes internas del adorno.
                </span>
              </div>

              {/* Opciones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '1.2rem' }}>
                <button
                  type="button"
                  onClick={() => handleSelectSearchImage(selectedSearchImage.url, 'logoOverlay', true)}
                  disabled={isGeneratingLogo || isGeneratingBanner}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.9rem',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  📍 Usar como Adorno (Sin Fondo)
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSearchImage(selectedSearchImage.url, 'logoOverlay', false)}
                  disabled={isGeneratingLogo || isGeneratingBanner}
                  style={{
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.9rem',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  💾 Usar como Adorno (Mantener Fondo)
                </button>

              </div>

              <button
                type="button"
                onClick={() => setSelectedSearchImage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  padding: '6px',
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#64748b'}
                onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Custom Toast Notification (Toast autodescartable al estilo PreciosDinamico) */}
        <CustomToastWrapper>
          {toast.show && (
            <Toast
              key={toast.key}
              message={toast.message}
              type={toast.type}
            />
          )}
        </CustomToastWrapper>
      </div>
    </>
  );
}

const CustomToastWrapper = styled.div`
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

