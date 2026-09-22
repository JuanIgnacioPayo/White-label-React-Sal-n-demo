import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaSpinner, FaFilePdf, FaFileArchive, FaCheck, FaCheckCircle, FaMoneyBillWave, FaFileInvoiceDollar, FaCalendarAlt, FaBarcode, FaGoogle, FaCopy, FaExternalLinkAlt, FaCreditCard } from 'react-icons/fa';
import { database, functions } from '../../firebase/firebase';
import { ref, push, serverTimestamp, get } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { useGoogleLogin } from '@react-oauth/google';
import { safeStorage } from '../../utils/safeStorage';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de PDF.js
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}


const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 1.3rem;
    color: #333;
  }

  button {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #666;
    cursor: pointer;
    &:hover { color: #000; }
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const FileCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
  gap: 15px;

  .icon {
    font-size: 2rem;
    color: #d32f2f;
  }
  
  .details {
    flex: 1;
    h4 {
      margin: 0 0 5px 0;
      font-size: 1.1rem;
    }
    p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }
  }
`;

const ActionBox = styled.div`
  margin-top: 10px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #2196F3;

  .action-title {
    font-weight: bold;
    color: #2196F3;
    margin-bottom: 8px;
  }

  .data-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 15px;
    font-size: 0.9rem;
  }
    
  input.date-input {
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
  }
`;

const PrimaryButton = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  &:hover { background: #45a049; }
  &:disabled { background: #ccc; cursor: not-allowed; }
`;

const ActionButton = styled.button`
  background: #2196F3;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
  &:hover { background: #1976D2; }
`;

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

const compressImage = async (file, maxWidth = 600, maxHeight = 600) => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                }, 'image/jpeg', 0.8);
            };
            img.onerror = () => resolve(file); // Fallback
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(file); // Fallback
        reader.readAsDataURL(file);
    });
};

// Helper de Google Drive
const getOrCreateFolder = async (folderName, parentId, token) => {
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' ${parentId ? `and '${parentId}' in parents` : ''} and trashed=false`;
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json();
  if (!searchRes.ok) throw new Error(searchData.error?.message || "Error al buscar carpeta en Drive");
  if (searchData.files && searchData.files.length > 0) return searchData.files[0].id;
  
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : undefined })
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(createData.error?.message || "Error al crear carpeta en Drive");
  return createData.id;
};

const uploadFileToDrive = async (file, folderId, token) => {
  const metadata = { name: file.name, parents: [folderId] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);
  
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Error al subir archivo a Drive");
  return data;
};

// Preprocesar canvas para binarización de alto contraste (mejora lectura de códigos de barra)
const preprocessCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const value = avg < 128 ? 0 : 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
};

// Extraer números largos de código de barra del texto de una factura (19 a 60 dígitos típicos en Argentina)
const extractBarcodeFromText = (text) => {
  if (!text) return null;
  const fragmentedNumberRegex = /(?:\d[\s\.]*){19,}/g;
  const matches = text.match(fragmentedNumberRegex);
  if (!matches || matches.length === 0) return null;
  const cleanNumbers = matches
    .map(m => m.replace(/[^\d]/g, ''))
    .filter(num => num.length >= 19 && num.length <= 60);
  if (cleanNumbers.length === 0) return null;
  cleanNumbers.sort((a, b) => b.length - a.length);
  return cleanNumbers[0];
};

// Utilidad robusta para copiar al portapapeles con fallback
const copyTextToClipboard = async (text) => {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn("navigator.clipboard.writeText fallo, usando fallback:", e);
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-99999px';
    el.style.top = '-99999px';
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch (e) {
    console.error("Fallback execCommand copy fallo:", e);
    return false;
  }
};

const SmartUploadModal = ({ files, onClose }) => {
  const [analyzing, setAnalyzing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedLinks, setUploadedLinks] = useState([]);
  const [accessToken, setAccessToken] = useState(() => safeStorage.getItem('googleAccessToken') || null);
  const [authExpired, setAuthExpired] = useState(false);
  const [paymentEntities, setPaymentEntities] = useState([]);
  const [copiedBarcode, setCopiedBarcode] = useState(null);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      safeStorage.setItem('googleAccessToken', tokenResponse.access_token);
    },
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly'
  });

  // Cargar entidades de pago configuradas en Firebase
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const snap = await get(ref(database, 'config/paymentEntities'));
        if (snap.exists()) {
          const val = snap.val();
          const list = Object.keys(val).map(k => ({ id: k, ...val[k] }));
          setPaymentEntities(list);
        }
      } catch (err) {
        console.error("Error al cargar entidades de pago en SmartUpload:", err);
      }
    };
    fetchEntities();
  }, []);

  const findMatchingEntity = (textSources, currentEntities = paymentEntities) => {
    if (!currentEntities || currentEntities.length === 0) return null;
    
    // Normalizar texto eliminando acentos, caracteres especiales y pasando a mayúsculas
    const normalize = (str) => String(str || '')
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const combinedText = Array.isArray(textSources) 
      ? textSources.map(normalize).join(' ') 
      : normalize(textSources);

    if (!combinedText || combinedText.trim().length === 0) return null;

    // Sinónimos conocidos para sindicatos, organismos y servicios argentinos
    const KNOWN_SYNONYMS = {
      'FAECYS': [
        'FAECYS',
        'FEDERACION ARGENTINA DE EMPLEADOS DE COMERCIO',
        'APORTE DEL 0.5',
        'APORTE 0.5',
        'APORTE SINDICAL 0.5',
        'APORTE SINDICAL 0,5',
        'APORTES SINDICALES',
        'DECLARACION JURADA DE APORTES SINDICALES'
      ],
      'SEC': [
        'SEC',
        'SINDICATO EMPLEADOS DE COMERCIO',
        'SINDICATO DE EMPLEADOS DE COMERCIO',
        'SEC CAPITAL'
      ],
      'INACAP': [
        'INACAP',
        'INSTITUTO ARGENTINO DE CAPACITACION'
      ],
      'EDESUR': ['EDESUR'],
      'EDENOR': ['EDENOR'],
      'METROGAS': ['METROGAS', 'MET ROGAS'],
      'AYSA': ['AYSA', 'AGUA Y SANEAMIENTOS'],
      'TELECOM': ['TELECOM', 'PERSONAL', 'CABLEVISION', 'FIBERTEL'],
      'CLARO': ['CLARO'],
      'MOVISTAR': ['MOVISTAR', 'TELEFONICA'],
      'NATURGY': ['NATURGY'],
      'AFIP': ['AFIP', 'ARCA', 'VEP', 'MONOTRIBUTO', 'F931'],
      'ARBA': ['ARBA', 'RENTAS BUENOS AIRES'],
      'AGIP': ['AGIP', 'RENTAS CIUDAD']
    };

    for (const entity of currentEntities) {
      const eNameNorm = normalize(entity.name).trim();
      
      // 1. Coincidencia directa por nombre de entidad
      if (eNameNorm && (combinedText.includes(eNameNorm) || (eNameNorm.length >= 4 && eNameNorm.includes(combinedText)))) {
        return entity;
      }

      // 2. Coincidencia por keywords configuradas en Firebase
      if (entity.keywords && Array.isArray(entity.keywords)) {
        for (const kw of entity.keywords) {
          const kwNorm = normalize(kw).trim();
          if (kwNorm && combinedText.includes(kwNorm)) {
            return entity;
          }
        }
      }

      // 3. Coincidencia por diccionario de sinónimos
      for (const [key, synonyms] of Object.entries(KNOWN_SYNONYMS)) {
        if (eNameNorm.includes(key) || key.includes(eNameNorm)) {
          for (const syn of synonyms) {
            const synNorm = normalize(syn);
            if (combinedText.includes(synNorm)) {
              return entity;
            }
          }
        }
      }
    }

    return null;
  };

  const handleCopyBarcode = (code) => {
    if (!code) return;
    copyTextToClipboard(code);
    setCopiedBarcode(code);
    setTimeout(() => {
      setCopiedBarcode(prev => (prev === code ? null : prev));
    }, 3000);
  };

  const handleOpenMercadoPago = (code, endpoint) => {
    if (code) {
      handleCopyBarcode(code);
    }
    const url = endpoint || 'https://www.mercadopago.com.ar/sp/recurrent/entities-search?type=oneshot';
    window.open(url, '_blank');
  };

  useEffect(() => {
    const scanBarcodeFromFile = async (file) => {
      let extractedText = '';
      let foundBarcode = null;
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.ITF,
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_39
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const codeReader = new BrowserMultiFormatReader(hints);

      try {
        // Caso 1: Archivo PDF
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const numPages = Math.min(pdf.numPages, 2);

          for (let p = 1; p <= numPages; p++) {
            const page = await pdf.getPage(p);

            // 1.a Extraer texto digital del PDF (números del código de barras y membrete)
            try {
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              extractedText += pageText + ' ';
              if (!foundBarcode) {
                const codeFromText = extractBarcodeFromText(pageText);
                if (codeFromText) {
                  foundBarcode = codeFromText;
                }
              }
            } catch (e) {
              console.warn("Error leyendo texto de PDF:", e);
            }

            // 1.b Renderizar canvas y decodificar código de barras visual si no se encontró en texto
            if (!foundBarcode) {
              try {
                const viewport = page.getViewport({ scale: 2.5 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;

                try {
                  const result = await codeReader.decodeFromImageUrl(canvas.toDataURL('image/png'));
                  if (result && result.getText()) foundBarcode = result.getText();
                } catch (e) {}

                if (!foundBarcode) {
                  try {
                    preprocessCanvas(canvas);
                    const result = await codeReader.decodeFromImageUrl(canvas.toDataURL('image/png'));
                    if (result && result.getText()) foundBarcode = result.getText();
                  } catch (e) {}
                }
              } catch (e) {
                console.warn("Error renderizando canvas de PDF:", e);
              }
            }
          }
          return { barcode: foundBarcode, extractedText };
        }

        // Caso 2: Archivo de Imagen
        if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|heic|gif)$/i)) {
          const img = new Image();
          const imgUrl = URL.createObjectURL(file);
          img.src = imgUrl;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(imgUrl);

          try {
            const result = await codeReader.decodeFromImageUrl(canvas.toDataURL('image/png'));
            if (result && result.getText()) foundBarcode = result.getText();
          } catch (e) {}

          if (!foundBarcode) {
            try {
              preprocessCanvas(canvas);
              const result = await codeReader.decodeFromImageUrl(canvas.toDataURL('image/png'));
              if (result && result.getText()) foundBarcode = result.getText();
            } catch (e) {}
          }

          return { barcode: foundBarcode, extractedText: '' };
        }
      } catch (err) {
        console.warn("Error escaneando código de barras en archivo:", err);
      }
      return { barcode: foundBarcode, extractedText };
    };

    const analyzeFiles = async () => {
      setAnalyzing(true);
      const newResults = [];
      const analizarDocumentoInteligente = httpsCallable(functions, 'analizarDocumentoInteligente');

      // Asegurar que tengamos las entidades de pago más recientes
      let latestEntities = paymentEntities;
      if (!latestEntities || latestEntities.length === 0) {
        try {
          const snap = await get(ref(database, 'config/paymentEntities'));
          if (snap.exists()) {
            const val = snap.val();
            latestEntities = Object.keys(val).map(k => ({ id: k, ...val[k] }));
            setPaymentEntities(latestEntities);
          }
        } catch (e) {}
      }

      for (let file of files) {
        if (file.name.endsWith('.zip')) {
          newResults.push({ file, tipo: 'ZIP', message: 'Los archivos ZIP se extraerán automáticamente y se agruparán por tipo.' });
          continue;
        }
        try {
          if (file.size > 10 * 1024 * 1024) {
             throw new Error("El archivo es demasiado grande (máximo 10MB).");
          }
          let fileToAnalyze = file;
          const isImageFile = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|heic|gif)$/i);
          if (isImageFile) {
            fileToAnalyze = await compressImage(file);
          }
          
          const base64 = await toBase64(fileToAnalyze);
          const mimeType = fileToAnalyze.type || (file.name.toLowerCase().endsWith('.pdf') ? "application/pdf" : "image/jpeg");
          const { barcode: detectedBarcode, extractedText } = await scanBarcodeFromFile(file);
          
          const res = await analizarDocumentoInteligente({ fileBase64: base64, mimeType });
          if (res.data.success) {
            const rawItems = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
            rawItems.forEach(item => {
              const aiBarcode = item.datos?.codigo_barras || item.datos?.barcode || item.codigo_barras || item.barcode || null;
              const finalBarcode = detectedBarcode || aiBarcode || null;

              // Copiar automáticamente al portapapeles si se detectó código de barra
              if (finalBarcode) {
                copyTextToClipboard(finalBarcode);
                setCopiedBarcode(finalBarcode);
              }

              // Buscar entidad considerando TODOS los textos disponibles (membrete del PDF, empresa detectada, concepto y nombre del archivo)
              const searchPool = [
                item.datos?.empresa,
                item.datos?.concepto,
                item.datos?.nombre,
                file.name,
                extractedText
              ];
              const matchedEntity = findMatchingEntity(searchPool, latestEntities);

              if (matchedEntity) {
                if (!item.datos) item.datos = {};
                const entityNameUpper = String(matchedEntity.name || '').toUpperCase();
                item.datos.empresa = entityNameUpper;
                if (item.datos.concepto && !item.datos.concepto.toUpperCase().includes(entityNameUpper)) {
                  item.datos.concepto = `${entityNameUpper} - ${item.datos.concepto}`;
                }
              }

              const entityDisplayName = matchedEntity?.name 
                ? matchedEntity.name.toUpperCase() 
                : (item.datos?.empresa || item.datos?.concepto || '');

              const paymentEndpoint = matchedEntity?.endpoint || (finalBarcode ? 'https://www.mercadopago.com.ar/sp/recurrent/entities-search?type=oneshot' : null);

              newResults.push({
                ...item,
                file,
                barcode: finalBarcode,
                entityName: entityDisplayName,
                paymentEndpoint: paymentEndpoint
              });
            });
          } else {
            // Si falló la clasificación de IA, aún chequeamos el texto extraído y el código de barra
            if (detectedBarcode) {
              copyTextToClipboard(detectedBarcode);
              setCopiedBarcode(detectedBarcode);
            }
            const matchedEntity = findMatchingEntity([file.name, extractedText], latestEntities);
            const paymentEndpoint = matchedEntity?.endpoint || (detectedBarcode ? 'https://www.mercadopago.com.ar/sp/recurrent/entities-search?type=oneshot' : null);

            newResults.push({ 
              file, 
              barcode: detectedBarcode, 
              entityName: matchedEntity?.name ? matchedEntity.name.toUpperCase() : '',
              paymentEndpoint: paymentEndpoint,
              tipo: 'OTRO', 
              message: `Falló la clasificación: ${res.data.error || 'Respuesta inesperada'}` 
            });
          }
        } catch (err) {
          console.error(err);
          newResults.push({ file, tipo: 'OTRO', message: `Error del servidor: ${err.message}` });
        }
      }

      setResults(newResults);
      setAnalyzing(false);
    };

    analyzeFiles();
  }, [files]);

  if (!files || files.length === 0) return null;

  const handleConfirm = async () => {
    if (!accessToken) {
      login();
      return;
    }

    try {
      setSaving(true);
      const token = safeStorage.getItem('googleAccessToken') || accessToken;

      let autodebitos = {};
      try {
          const autoSnap = await get(ref(database, 'config/autodebitos'));
          if (autoSnap.exists()) {
              autodebitos = autoSnap.val();
          }
      } catch (e) {
          console.error("Error al cargar autodebitos", e);
      }

      // 1. Encontrar o crear la carpeta madre
      const rootFolderId = await getOrCreateFolder('Administración El Patio', null, token);
      const newLinks = [];
      const uploadedFilesCache = {}; // Cache para no subir el mismo archivo varias veces

      // 2. Por cada archivo, clasificar y subir
      for (const res of results) {
        if (res.file.name.endsWith('.zip')) {
          // TODO: Lógica de descompresión futura
          continue;
        }

        const dateObj = res.datos?.fecha ? new Date(res.datos.fecha) : new Date();
        const year = dateObj.getFullYear().toString();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');

        let tipoNormalizado = res.tipo ? String(res.tipo).toUpperCase().trim() : 'OTRO';
        if (tipoNormalizado === 'CONSUMO_TARJETA') tipoNormalizado = 'CONSUMO_TARJETA';
        else if (tipoNormalizado.includes('TARJETA') || tipoNormalizado.includes('CREDITO')) tipoNormalizado = 'TARJETA_CREDITO';
        else if (tipoNormalizado.includes('IMPUESTO') || tipoNormalizado === 'MONOTRIBUTO') tipoNormalizado = 'IMPUESTO';
        else if (tipoNormalizado.includes('SUELDO') || tipoNormalizado.includes('RECIBO')) tipoNormalizado = 'RECIBO_SUELDO';
        else if (tipoNormalizado.includes('TRANSFERENCIA') || tipoNormalizado.includes('COMPROBANTE')) tipoNormalizado = 'COMPROBANTE_TRANSFERENCIA';
        else if (tipoNormalizado.includes('SERVICIO') || tipoNormalizado.includes('FACTURA')) tipoNormalizado = 'FACTURA_SERVICIO';
        else if (tipoNormalizado.includes('CARGA') || tipoNormalizado.includes('SOCIAL')) tipoNormalizado = 'CARGA_SOCIAL';
        
        const esTipoConocido = ['COMPROBANTE_TRANSFERENCIA', 'FACTURA_SERVICIO', 'RECIBO_SUELDO', 'CARGA_SOCIAL', 'IMPUESTO', 'TARJETA_CREDITO', 'CONSUMO_TARJETA', 'OTRO', 'ZIP'].includes(tipoNormalizado);
        if (!esTipoConocido) tipoNormalizado = 'OTRO';

        let categoryFolder = 'Varios';
        if (tipoNormalizado === 'COMPROBANTE_TRANSFERENCIA') categoryFolder = 'Recibos Emitidos';
        else if (tipoNormalizado === 'FACTURA_SERVICIO') categoryFolder = 'Servicios';
        else if (tipoNormalizado === 'RECIBO_SUELDO') categoryFolder = 'Sueldos';
        else if (tipoNormalizado === 'CARGA_SOCIAL') categoryFolder = 'Cargas Sociales';
        else if (tipoNormalizado === 'IMPUESTO') categoryFolder = 'Impuestos';

        // Estructura: Administración El Patio -> Año -> Mes -> [Nombre Empleado (opcional)]
        const yearId = await getOrCreateFolder(year, rootFolderId, token);
        const monthId = await getOrCreateFolder(month, yearId, token);
        
        let targetFolderId = monthId;
        let drivePathName = `${year} / ${month}`;
        
        const nombreEmpleado = res.datos?.nombre;
        if (nombreEmpleado) {
            targetFolderId = await getOrCreateFolder(nombreEmpleado, monthId, token);
            drivePathName += ` / ${nombreEmpleado}`;
        }

        // Subir a Drive (usando cache para evitar duplicados si hay múltiples gastos en un mismo archivo)
        let uploadedFile = uploadedFilesCache[res.file.name];
        if (!uploadedFile) {
            uploadedFile = await uploadFileToDrive(res.file, targetFolderId, token);
            uploadedFilesCache[res.file.name] = uploadedFile;
        }
        
        // Guardamos el path descriptivo en res para usarlo en los mensajes de la UI
        res.drivePathName = drivePathName;
        
        // Evitar múltiples links idénticos en la pantalla de éxito
        const linkExists = newLinks.find(l => l.name === res.file.name && l.barcode === res.barcode);
        if (!linkExists) {
            newLinks.push({
                name: res.file.name,
                barcode: res.barcode || null,
                paymentEndpoint: res.paymentEndpoint || null,
                entityName: res.entityName || null,
                url: `https://drive.google.com/file/d/${uploadedFile.id}/view`,
                folderUrl: `https://drive.google.com/drive/folders/${targetFolderId}`
            });
        }

        // Registrar en Firebase para finanzas si es un gasto
        if (tipoNormalizado === 'FACTURA_SERVICIO' || tipoNormalizado === 'CARGA_SOCIAL' || tipoNormalizado === 'IMPUESTO' || tipoNormalizado === 'RECIBO_SUELDO' || tipoNormalizado === 'TARJETA_CREDITO' || tipoNormalizado === 'CONSUMO_TARJETA') {
          const gastoRef = ref(database, `gastos_mensuales/${year}-${month}`);
          
          let conceptoFinal = res.datos?.concepto || res.datos?.empresa || res.datos?.nombre || 'Sin concepto';
          if (res.entityName && !conceptoFinal.toUpperCase().includes(res.entityName.toUpperCase())) {
            conceptoFinal = `${res.entityName} - ${conceptoFinal}`;
          }

          let estadoPago = 'PENDIENTE';
          if (tipoNormalizado === 'RECIBO_SUELDO') estadoPago = 'PAGADO';
          if (tipoNormalizado === 'CONSUMO_TARJETA') estadoPago = 'PAGADO_EN_TARJETA';

          await push(gastoRef, {
            tipo: tipoNormalizado,
            monto: Number(res.datos?.monto || 0),
            concepto: conceptoFinal,
            fecha: serverTimestamp(),
            driveFileName: res.file.name || null,
            driveFileId: uploadedFile?.id || null,
            driveFolderId: targetFolderId || null,
            vencimiento: res.datos?.vencimiento || res.datos?.fecha || null,
            estado_pago: estadoPago,
            barcode: res.barcode || null,
            paymentEndpoint: res.paymentEndpoint || null,
            entityName: res.entityName || null,
            grupo_id: uploadedFile?.id || null
          });
        }
      }

      setUploadedLinks(newLinks);
      setUploadSuccess(true);
      } catch (err) {
        console.error("Upload error: ", err);
        const errorMsg = err.message?.toLowerCase() || "";
        if (errorMsg.includes('invalid credentials') || errorMsg.includes('unauthorized') || errorMsg.includes('auth') || errorMsg.includes('401')) {
            safeStorage.removeItem('googleAccessToken');
            setAccessToken(null);
            setAuthExpired(true);
        } else {
            alert("Error al guardar en Drive: " + err.message);
        }
      } finally {
        setSaving(false);
      }
    };

    const handleReconnect = () => {
        setAuthExpired(false);
        login();
    };

    return (
      <ModalOverlay onClick={uploadSuccess ? onClose : undefined}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <ModalHeader>
            <h3>Análisis Inteligente de Archivos</h3>
            <button onClick={onClose}><FaTimes /></button>
          </ModalHeader>
          <ModalBody>
            {authExpired ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <FaGoogle style={{ fontSize: '3rem', color: '#db4437', marginBottom: '20px' }} />
                    <h3 style={{ marginBottom: '15px' }}>Tu sesión de Google Drive ha expirado</h3>
                    <p style={{ marginBottom: '25px', color: '#555' }}>
                        Necesitamos que vuelvas a conectar tu cuenta para poder subir los comprobantes a la nube. Los datos detectados están a salvo.
                    </p>
                    <PrimaryButton onClick={handleReconnect} style={{ margin: '0 auto' }}>
                        <FaGoogle /> Reconectar a Google Drive
                    </PrimaryButton>
                </div>
            ) : analyzing ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
              <FaSpinner className="fa-spin" style={{ fontSize: '2.5rem', marginBottom: '15px', color: '#2196F3' }} />
              <p>Analizando contenido con Inteligencia Artificial...</p>
            </div>
          ) : uploadSuccess ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <FaCheckCircle style={{ color: '#4caf50', fontSize: '4rem', marginBottom: '15px' }} />
              <h2 style={{ marginBottom: '20px', color: '#333' }}>¡Archivos guardados con éxito!</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>Tus archivos fueron organizados en Google Drive y registrados en la contabilidad.</p>
              
              <div style={{ textAlign: 'left', background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '25px' }}>
                <h4 style={{ marginBottom: '10px', color: '#444' }}>Archivos subidos:</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {uploadedLinks.map((link, i) => (
                    <li key={i} style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '5px', paddingBottom: '10px', borderBottom: i < uploadedLinks.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                      <strong>{link.name}</strong>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                           Ver Archivo
                        </a>
                        <span style={{color: '#ccc'}}>|</span>
                        <a href={link.folderUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ff9800', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                           Abrir Carpeta
                        </a>
                      </div>
                      {link.barcode && (
                        <div style={{ marginTop: '8px', padding: '8px', background: '#e8f5e9', borderRadius: '6px', border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#1b5e20', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FaBarcode /> Código: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #c8e6c9' }}>{link.barcode}</code>
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleCopyBarcode(link.barcode)}
                              style={{
                                background: copiedBarcode === link.barcode ? '#2e7d32' : '#fff',
                                color: copiedBarcode === link.barcode ? '#fff' : '#2e7d32',
                                border: '1px solid #2e7d32',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              {copiedBarcode === link.barcode ? '¡Copiado!' : 'Copiar'}
                            </button>
                            {link.paymentEndpoint && (
                              <button
                                type="button"
                                onClick={() => handleOpenMercadoPago(link.barcode, link.paymentEndpoint)}
                                style={{
                                  background: '#009ee3',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '3px 10px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: 'bold'
                                }}
                              >
                                Pagar en MP
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <ActionButton onClick={onClose} style={{ background: '#f5f5f5', color: '#333' }}>
                  Cerrar
                </ActionButton>
                <ActionButton 
                  onClick={() => {
                    const itemWithCode = uploadedLinks.find(l => l.barcode) || uploadedLinks[0];
                    if (itemWithCode?.barcode) {
                      handleCopyBarcode(itemWithCode.barcode);
                    }
                    const mpUrl = itemWithCode?.paymentEndpoint || 'https://www.mercadopago.com.ar/sp/recurrent/entities-search?type=oneshot';
                    window.open(mpUrl, '_blank');
                  }}
                  style={{ background: '#009ee3', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FaBarcode /> Pagar por Mercado Pago
                </ActionButton>
              </div>
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <a 
                  href="/dashboard-empresa" 
                  style={{ fontSize: '0.85rem', color: '#888', textDecoration: 'underline' }}
                >
                  Ver en Finanzas
                </a>
              </div>
            </div>
          ) : (
              <div>
                {results.map((res, i) => {
                  let tipoNormalizado = res.tipo ? String(res.tipo).toUpperCase().trim() : 'OTRO';
                  if (tipoNormalizado === 'CONSUMO_TARJETA') tipoNormalizado = 'CONSUMO_TARJETA';
                  else if (tipoNormalizado.includes('TARJETA') || tipoNormalizado.includes('CREDITO')) tipoNormalizado = 'TARJETA_CREDITO';
                  else if (tipoNormalizado.includes('IMPUESTO') || tipoNormalizado === 'MONOTRIBUTO') tipoNormalizado = 'IMPUESTO';
                  else if (tipoNormalizado.includes('SUELDO') || tipoNormalizado === 'RECIBO') tipoNormalizado = 'RECIBO_SUELDO';
                  else if (tipoNormalizado.includes('TRANSFERENCIA') || tipoNormalizado === 'COMPROBANTE') tipoNormalizado = 'COMPROBANTE_TRANSFERENCIA';
                  else if (tipoNormalizado.includes('SERVICIO') || tipoNormalizado === 'FACTURA') tipoNormalizado = 'FACTURA_SERVICIO';
                  else if (tipoNormalizado.includes('CARGA') || tipoNormalizado.includes('SOCIAL')) tipoNormalizado = 'CARGA_SOCIAL';
                  
                  const esTipoConocido = ['COMPROBANTE_TRANSFERENCIA', 'FACTURA_SERVICIO', 'RECIBO_SUELDO', 'CARGA_SOCIAL', 'IMPUESTO', 'TARJETA_CREDITO', 'CONSUMO_TARJETA', 'OTRO', 'ZIP'].includes(tipoNormalizado);
                  if (!esTipoConocido) tipoNormalizado = 'OTRO';

                  return (
                  <FileCard key={i}>
                    <div className="icon">
                      {tipoNormalizado === 'COMPROBANTE_TRANSFERENCIA' ? <FaMoneyBillWave style={{color: '#4caf50'}}/> : 
                       tipoNormalizado === 'FACTURA_SERVICIO' ? <FaFileInvoiceDollar style={{color: '#ff9800'}}/> :
                       tipoNormalizado === 'TARJETA_CREDITO' ? <FaCreditCard style={{color: '#e91e63'}}/> :
                       tipoNormalizado === 'CONSUMO_TARJETA' ? <FaCreditCard style={{color: '#9c27b0'}}/> :
                       res.file.name.endsWith('.zip') ? <FaFileArchive style={{color: '#795548'}} /> : <FaFilePdf />}
                    </div>
                  <div className="details">
                    <h4>{res.file.name}</h4>
                    <p>{(res.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    
                    {tipoNormalizado === 'COMPROBANTE_TRANSFERENCIA' && (
                      <ActionBox style={{borderLeftColor: '#4caf50'}}>
                        <div className="action-title" style={{color: '#4caf50'}}>Comprobante de Transferencia</div>
                        <div className="data-grid">
                          <div><strong>Monto:</strong> ${res.datos?.monto || '---'}</div>
                          <div><strong>CUIT:</strong> {res.datos?.cuit || 'No encontrado'}</div>
                          <div><strong>Fecha:</strong> {res.datos?.fecha || '---'}</div>
                        </div>
                        <div style={{marginTop: '10px'}}>
                          <label style={{fontSize: '0.85rem', fontWeight: 'bold'}}>¿Para qué fecha es el recibo a generar?</label>
                          <input type="date" className="date-input" defaultValue={res.datos?.fecha || new Date().toISOString().split('T')[0]} />
                        </div>
                        <p style={{fontSize: '0.85rem', color: '#666', marginTop: '10px'}}>
                          ✓ Guardará en Drive: Administración El Patio / {res.drivePathName || `${new Date().getFullYear()} / ${(new Date().getMonth()+1).toString().padStart(2,'0')}`}<br/>
                          ✓ Se generará el recibo oficial automáticamente
                        </p>
                      </ActionBox>
                    )}

                    {tipoNormalizado === 'FACTURA_SERVICIO' && (
                      <ActionBox style={{borderLeftColor: '#ff9800'}}>
                        <div className="action-title" style={{color: '#ff9800'}}>Factura de Servicio</div>
                        <div className="data-grid">
                          <div><strong>Empresa:</strong> {res.datos?.empresa || '---'}</div>
                          <div><strong>Monto:</strong> ${res.datos?.monto || '---'}</div>
                          <div><strong>Vencimiento:</strong> {res.datos?.vencimiento || '---'}</div>
                        </div>

                        {res.barcode && (
                          <div style={{
                            marginTop: '10px',
                            marginBottom: '10px',
                            padding: '10px',
                            backgroundColor: '#e8f5e9',
                            border: '1px solid #a5d6a7',
                            borderRadius: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FaBarcode /> Código de barras (¡copiado al portapapeles!)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyBarcode(res.barcode)}
                                style={{
                                  background: copiedBarcode === res.barcode ? '#2e7d32' : '#fff',
                                  color: copiedBarcode === res.barcode ? '#fff' : '#2e7d32',
                                  border: '1px solid #2e7d32',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 600
                                }}
                              >
                                {copiedBarcode === res.barcode ? <><FaCheck /> ¡Copiado!</> : <><FaCopy /> Copiar código</>}
                              </button>
                            </div>
                            <div style={{
                              fontFamily: 'monospace',
                              background: '#fff',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: '1px solid #c8e6c9',
                              fontSize: '0.8rem',
                              wordBreak: 'break-all',
                              color: '#1b5e20'
                            }}>
                              {res.barcode}
                            </div>
                            {res.paymentEndpoint && (
                              <button
                                type="button"
                                onClick={() => handleOpenMercadoPago(res.barcode, res.paymentEndpoint)}
                                style={{
                                  marginTop: '4px',
                                  background: '#009ee3',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '7px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <FaExternalLinkAlt /> Pagar en Mercado Pago {res.entityName ? `(${res.entityName})` : ''}
                              </button>
                            )}
                          </div>
                        )}

                        <p style={{fontSize: '0.85rem', color: '#666', marginTop: '10px'}}>
                          ✓ Guardará en Drive: Administración El Patio / {res.drivePathName || `${new Date().getFullYear()} / ${(new Date().getMonth()+1).toString().padStart(2,'0')}`}<br/>
                          ✓ Se registrará como Gasto en Firebase
                        </p>
                      </ActionBox>
                    )}

                    {(tipoNormalizado === 'RECIBO_SUELDO' || tipoNormalizado === 'CARGA_SOCIAL' || tipoNormalizado === 'IMPUESTO') && (
                      <ActionBox style={{borderLeftColor: tipoNormalizado === 'RECIBO_SUELDO' ? '#9c27b0' : tipoNormalizado === 'CARGA_SOCIAL' ? '#1976d2' : '#009688'}}>
                        <div className="action-title" style={{color: tipoNormalizado === 'RECIBO_SUELDO' ? '#9c27b0' : tipoNormalizado === 'CARGA_SOCIAL' ? '#1976d2' : '#009688'}}>
                          {tipoNormalizado === 'RECIBO_SUELDO' 
                            ? 'Recibo de Sueldo' 
                            : tipoNormalizado === 'CARGA_SOCIAL' 
                              ? (res.entityName ? `Carga Social (${res.entityName})` : 'Carga Social') 
                              : (res.entityName ? `Impuesto (${res.entityName})` : 'Impuesto')}
                        </div>
                        <div className="data-grid">
                          {tipoNormalizado === 'RECIBO_SUELDO' ? (
                            <div><strong>Empleado:</strong> {res.datos?.nombre || '---'}</div>
                          ) : (
                            <>
                              {res.entityName && <div><strong>Entidad:</strong> {res.entityName}</div>}
                              <div><strong>Concepto:</strong> {res.datos?.concepto || res.datos?.empresa || '---'}</div>
                            </>
                          )}
                          <div><strong>Monto:</strong> ${res.datos?.monto || '---'}</div>
                          <div><strong>Período:</strong> {res.datos?.periodo || '---'}</div>
                        </div>

                        {res.barcode && (
                          <div style={{
                            marginTop: '10px',
                            marginBottom: '10px',
                            padding: '10px',
                            backgroundColor: '#e8f5e9',
                            border: '1px solid #a5d6a7',
                            borderRadius: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FaBarcode /> Código de barras (¡copiado al portapapeles!)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyBarcode(res.barcode)}
                                style={{
                                  background: copiedBarcode === res.barcode ? '#2e7d32' : '#fff',
                                  color: copiedBarcode === res.barcode ? '#fff' : '#2e7d32',
                                  border: '1px solid #2e7d32',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 600
                                }}
                              >
                                {copiedBarcode === res.barcode ? <><FaCheck /> ¡Copiado!</> : <><FaCopy /> Copiar código</>}
                              </button>
                            </div>
                            <div style={{
                              fontFamily: 'monospace',
                              background: '#fff',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: '1px solid #c8e6c9',
                              fontSize: '0.8rem',
                              wordBreak: 'break-all',
                              color: '#1b5e20'
                            }}>
                              {res.barcode}
                            </div>
                            {res.paymentEndpoint && (
                              <button
                                type="button"
                                onClick={() => handleOpenMercadoPago(res.barcode, res.paymentEndpoint)}
                                style={{
                                  marginTop: '4px',
                                  background: '#009ee3',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '7px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <FaExternalLinkAlt /> Pagar en Mercado Pago {res.entityName ? `(${res.entityName})` : ''}
                              </button>
                            )}
                          </div>
                        )}

                        <p style={{fontSize: '0.85rem', color: '#666', marginTop: '10px'}}>
                          ✓ Guardará en Drive: Administración El Patio / {res.drivePathName || `${new Date().getFullYear()} / ${(new Date().getMonth()+1).toString().padStart(2,'0')}`}<br/>
                          ✓ Se registrará como Gasto en Firebase
                        </p>
                      </ActionBox>
                    )}

                    {tipoNormalizado === 'TARJETA_CREDITO' && (
                      <ActionBox style={{borderLeftColor: '#e91e63'}}>
                        <div className="action-title" style={{color: '#e91e63'}}>Tarjeta de Crédito</div>
                        <div className="data-grid">
                          <div><strong>Tarjeta:</strong> {res.datos?.empresa || '---'}</div>
                          <div><strong>Monto Total:</strong> ${res.datos?.monto || '---'}</div>
                          <div><strong>Vencimiento:</strong> {res.datos?.vencimiento || '---'}</div>
                        </div>

                        <p style={{fontSize: '0.85rem', color: '#666', marginTop: '10px'}}>
                          ✓ Guardará en Drive: Administración El Patio / {res.drivePathName || `${new Date().getFullYear()} / ${(new Date().getMonth()+1).toString().padStart(2,'0')}`}<br/>
                          ✓ Se registrará como Gasto PENDIENTE en Firebase
                        </p>
                      </ActionBox>
                    )}

                    {tipoNormalizado === 'CONSUMO_TARJETA' && (
                      <ActionBox style={{borderLeftColor: '#9c27b0'}}>
                        <div className="action-title" style={{color: '#9c27b0'}}>Consumo de Tarjeta (Detalle)</div>
                        <div className="data-grid">
                          <div><strong>Servicio:</strong> {res.datos?.empresa || '---'}</div>
                          <div><strong>Monto:</strong> ${res.datos?.monto || '---'}</div>
                          <div><strong>Fecha:</strong> {res.datos?.fecha || '---'}</div>
                          <div><strong>Detalle:</strong> {res.datos?.concepto || '---'}</div>
                        </div>

                        <p style={{fontSize: '0.85rem', color: '#666', marginTop: '10px'}}>
                          ✓ Guardará en Drive: Administración El Patio / {res.drivePathName || `${new Date().getFullYear()} / ${(new Date().getMonth()+1).toString().padStart(2,'0')}`}<br/>
                          ✓ Se registrará como Gasto en Firebase (Estado: Ya pagado en tarjeta)
                        </p>
                      </ActionBox>
                    )}

                    {tipoNormalizado === 'OTRO' && (
                      <ActionBox style={{borderLeftColor: '#757575'}}>
                        <div className="action-title" style={{color: '#757575'}}>Documento no clasificado o Error</div>
                        <p style={{fontSize: '0.85rem', color: '#333'}}>{res.message || 'La IA no pudo clasificar este documento de forma estándar.'}{res.tipo && res.tipo !== 'OTRO' && ` (Tipo devuelto: ${res.tipo})`}</p>
                        <p style={{fontSize: '0.85rem', color: '#d32f2f', marginTop: '10px'}}>
                          ⚠ Este archivo no se guardará automáticamente en Drive.
                        </p>
                      </ActionBox>
                    )}

                  </div>
                </FileCard>
                )})}
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button onClick={onClose} disabled={saving} style={{ background: 'transparent', border: '1px solid #ccc', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <PrimaryButton onClick={handleConfirm} disabled={saving}>
                  {saving ? (
                    <><FaSpinner className="fa-spin" /> Guardando...</>
                  ) : !accessToken ? (
                    <><FaGoogle /> Iniciar sesión en Drive para confirmar</>
                  ) : (
                    <><FaCheck /> Confirmar Acciones</>
                  )}
                </PrimaryButton>
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SmartUploadModal;
