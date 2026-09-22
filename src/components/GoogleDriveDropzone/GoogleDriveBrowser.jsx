import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { FaFolder, FaFile, FaArrowLeft, FaFolderPlus, FaCloudUploadAlt, FaSpinner, FaTrash, FaExternalLinkAlt, FaDownload } from 'react-icons/fa';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { database } from '../../firebase/firebase';
import { ref, onValue, set } from 'firebase/database';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Payment Entities are now loaded from Firebase (see PaymentEntitiesManager component)

// Styled Components
const BrowserContainer = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const Header = styled.div`
  padding: 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
`;

const ActionButton = styled.button`
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  transition: all 0.2s;
  color: #444;

  &:hover {
    background: #f0f0f0;
    border-color: #ccc;
  }
`;

const FileList = styled.div`
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
  position: relative;
  
  /* Drag & Drop Overlay Style */
  background-color: ${props => props.$isDragActive ? 'rgba(76, 175, 80, 0.05)' : 'white'};
  
  &::after {
    content: 'Suelta archivos aquí para subir';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    color: #4caf50;
    opacity: ${props => props.$isDragActive ? 1 : 0};
    pointer-events: none;
    transition: opacity 0.2s;
    font-weight: bold;
  }
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background-color: #f9f9f9;
  }

  svg {
    margin-right: 12px;
    font-size: 1.2rem;
    color: ${props => props.$type === 'folder' ? '#FFC107' : '#2196F3'};
  }
`;

const EmptyState = styled.div`
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
`;

const ProgressBar = styled.div`
  height: 4px;
  background: #e0e0e0;
  width: 100%;

  div {
    height: 100%;
    background: #4caf50;
    width: ${props => props.$progress}%;
    transition: width 0.3s;
  }
`;

const ScanningModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  z-index: 1000;
  min-width: 300px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  text-align: center;
  border: 1px solid #eee;

  h3 { color: #333; margin-top: 0; font-size: 1.1rem; margin-bottom: 10px; }
  p { color: #666; margin: 5px 0; font-size: 0.85rem; }
  
  .code {
    background: #f1f8e9;
    border: 1px dashed #4caf50;
    color: #2e7d32;
    padding: 10px;
    font-size: 1.2rem;
    font-weight: bold;
    margin: 15px 0;
    cursor: pointer;
    word-break: break-all;
  }

  .amount-display {
      font-size: 1.5rem;
      font-weight: 800;
      color: #212121;
      margin: 10px 0;
  }

  .company-badge {
    background: #e3f2fd;
    color: #1565c0;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 10px;
    display: inline-block;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }

  button {
    padding: 10px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: 0.2s;
  }

  .mp-btn {
    background: #009ee3;
    color: white;
  }
  
  .mp-secondary-btn {
      background: white;
      border: 1px solid #009ee3;
      color: #009ee3;
  }

  .close-btn {
    background: #f5f5f5;
    color: #666;
  }
`;

const GoogleDriveBrowser = ({ rootFolderId, accessToken, employeeName, employeeId, onAuthError }) => {
    const [currentFolderId, setCurrentFolderId] = useState(rootFolderId);
    const [folderHistory, setFolderHistory] = useState([{ id: rootFolderId, name: 'Raíz' }]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [hasAuthError, setHasAuthError] = useState(false);

    // Payment Entities (loaded from Firebase)
    const [paymentEntities, setPaymentEntities] = useState([]);

    // Scanning State
    const [detectedCode, setDetectedCode] = useState(null);
    const [detectedEntity, setDetectedEntity] = useState(null); // Whole object (id, name, endpoint)
    const [detectedAmount, setDetectedAmount] = useState(null);
    const [detectedImagePreview, setDetectedImagePreview] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // New states for invoice management
    const [invoiceDueDate, setInvoiceDueDate] = useState('');
    const [uploadedDriveFileId, setUploadedDriveFileId] = useState(null);
    const [savingInvoice, setSavingInvoice] = useState(false);
    const [manualEntityName, setManualEntityName] = useState('');
    const [isPayStubMode, setIsPayStubMode] = useState(false);
    const [payStubPeriod, setPayStubPeriod] = useState('');

    // Load Payment Entities from Firebase
    useEffect(() => {
        const entitiesRef = ref(database, 'config/paymentEntities');
        const unsubscribe = onValue(entitiesRef, (snapshot) => {
            const data = snapshot.val() || {};
            const entitiesList = Object.values(data);
            setPaymentEntities(entitiesList);
        });

        return () => unsubscribe();
    }, []);

    // Helper: Generalized OCR Region Scanner
    const scanCanvasRegion = async (canvas, yStartPct, heightPct) => {
        try {
            const h = canvas.height;
            const w = canvas.width;
            const regionH = h * heightPct;
            const regionY = h * yStartPct;

            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = w;
            croppedCanvas.height = regionH;

            const ctx = croppedCanvas.getContext('2d');
            ctx.drawImage(
                canvas,
                0, regionY, w, regionH, // Source 
                0, 0, w, regionH        // Dest
            );

            const { data: { text } } = await Tesseract.recognize(
                croppedCanvas,
                'spa',
                { logger: m => console.log(m) }
            );
            return text.toUpperCase();
        } catch (e) {
            console.error("OCR Region Error:", e);
            return "";
        }
    };

    // Helper: Preprocess image for better barcode detection
    const preprocessImage = (canvas) => {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            // High contrast binarization
            const value = avg < 128 ? 0 : 255;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
        ctx.putImageData(imageData, 0, 0);
    };

    // Helper: Extract code from OCR text (Longest Match + Whitespace)
    const extractCodeFromOCR = (text) => {
        if (!text) return null;
        // 19+ digits allowing for spaces/dots
        const fragmentedNumberRegex = /(?:\d[\s\.]*){19,}/g;
        const matches = text.match(fragmentedNumberRegex);
        if (!matches || matches.length === 0) return null;
        // Normalize and sort
        const cleanNumbers = matches.map(m => m.replace(/[^\d]/g, ''));
        const sorted = cleanNumbers.sort((a, b) => b.length - a.length);
        return sorted[0];
    };

    // Helper: Extract Amount from OCR text
    const extractAmountFromOCR = (text) => {
        if (!text) return null;
        // Regex to find "Total: $ 12.345,67" or similar
        // Look for keywords: Total, Importe, Pagar, Saldo, Neto
        const amountRegex = /(?:TOTAL|IMPORTE|PAGAR|SALDO|NETO)[\sA-Z:\.\-%]*?\$?\s?([\d\.,]{4,})/ig;

        let matches = [];
        let match;
        while ((match = amountRegex.exec(text)) !== null) {
            const context = match[0].toUpperCase();
            // Filter out false positives from union invoices
            if (!context.includes("REMUNERACION") && 
                !context.includes("IMPONIBLE") && 
                !context.includes("SUCURSALES") && 
                !context.includes("EMPLEADOS")) {
                matches.push(match[1].trim());
            }
        }

        if (matches.length > 0) {
            return matches[0];
        }
        return null;
    };

    const extractDueDateFromOCR = (text) => {
        if (!text) return null;
        // Looking for DD/MM/YYYY or DD/MM/YY or DD-MM-YYYY
        const dateRegex = /(?:VTO|VENCIMIENTO|HASTA|PAGO|VENCE)[\s:\.\-]*?(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4})/ig;
        
        let match = dateRegex.exec(text);
        if (match && match[1]) {
            let rawDate = match[1].replace(/[\.\-]/g, '/');
            let parts = rawDate.split('/');
            if (parts.length === 3) {
                let d = parts[0];
                let m = parts[1];
                let y = parts[2];
                if (y.length === 2) y = "20" + y;
                return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
            }
        }
        return null;
    };

    const detectPayStub = (text) => {
        if (!text) return false;
        const upperText = text.toUpperCase().replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
        
        const strongKeywords = ["RECIBO DE SUELDO", "LIQUIDACION DE HABERES", "RECIBO DE HABERES", "SUELDO NETO"];
        for (let k of strongKeywords) {
            if (upperText.includes(k)) return true;
        }

        // Exclude union invoices and sworn statements which may contain 'REMUNERACION'
        // We do this after strong keywords, so real pay stubs with union deductions aren't excluded
        if (upperText.includes("DECLARACIÓN JURADA DE APORTES") || upperText.includes("SINDICATO EMPLEADOS DE COMERCIO")) {
            return false;
        }

        const weakKeywords = ["REMUNERACION", "PERIODO ABONADO"];
        let weakMatches = 0;
        weakKeywords.forEach(k => {
            if (upperText.includes(k)) weakMatches++;
        });
        
        return weakMatches >= 2; 
    };

    const extractPayStubPeriod = (text) => {
        if (!text) return null;
        const normalizedText = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
        // Matches "PERIODO ABONADO JULIO 2026" or "PERÍODO: Julio 2026"
        const periodRegex = /(?:PERIODO ABONADO|PER[IÍ]ODO:?)\s+([A-Za-z]+\s+\d{4})/i;
        let match = periodRegex.exec(normalizedText);
        if (match && match[1]) {
            return match[1].trim(); 
        }
        return null;
    };

    // Helper to scan image for barcodes, companies AND AMOUNT
    const scanFileForBarcode = async (file) => {
        try {
            const hints = new Map();
            const formats = [BarcodeFormat.ITF, BarcodeFormat.CODE_128, BarcodeFormat.EAN_13, BarcodeFormat.QR_CODE];
            hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
            hints.set(DecodeHintType.TRY_HARDER, true);

            const codeReader = new BrowserMultiFormatReader(hints);
            let result = null;
            let entity = null; // Found payment entity
            let amount = null; // Found amount
            let fullOcrText = "";

            const processCanvas = async (canvas) => {
                // 1. Scan Header (Top 30%) -> Entity Detection
                const headerText = await scanCanvasRegion(canvas, 0, 0.3);
                console.log("OCR Header:", headerText);
                fullOcrText += headerText + " ";

                // Find Entity (from Firebase)
                const found = paymentEntities.find(e =>
                    e.keywords && e.keywords.some(k => headerText.includes(k))
                );
                if (found) entity = found;

                // 2. Scan Barcode
                const dataUrl = canvas.toDataURL('image/png');
                try {
                    result = await codeReader.decodeFromImageUrl(dataUrl);
                } catch (e) { /* Ignore */ }

                if (!result) {
                    // Retry with preprocessing
                    try {
                        const preCanvas = document.createElement('canvas');
                        preCanvas.width = canvas.width;
                        preCanvas.height = canvas.height;
                        preCanvas.getContext('2d').drawImage(canvas, 0, 0);
                        preprocessImage(preCanvas);
                        result = await codeReader.decodeFromImageUrl(preCanvas.toDataURL('image/png'));
                    } catch (e) { }
                }

                // 3. Scan Footer (Bottom 40%) -> Code Fallback & Amount
                const footerText = await scanCanvasRegion(canvas, 0.6, 0.4);
                console.log("OCR Footer:", footerText);
                fullOcrText += footerText;

                // Try to extract amount from Footer (most likely) or Header (less likely)
                const amtFooter = extractAmountFromOCR(footerText);
                const amtHeader = extractAmountFromOCR(headerText);
                amount = amtFooter || amtHeader;
                
                // Extract due date
                const dateFooter = extractDueDateFromOCR(footerText);
                const dateHeader = extractDueDateFromOCR(headerText);
                if (dateFooter || dateHeader) {
                    setInvoiceDueDate(dateFooter || dateHeader);
                }
                
                // Detect Pay Stub Mode
                const isStub = detectPayStub(headerText) || detectPayStub(footerText);
                if (isStub) {
                    setIsPayStubMode(true);
                    const period = extractPayStubPeriod(headerText) || extractPayStubPeriod(footerText);
                    if (period) setPayStubPeriod(period);
                } else {
                    setIsPayStubMode(false);
                }
            };

            if (file.type.startsWith('image/')) {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await new Promise(resolve => img.onload = resolve);
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                await processCanvas(canvas);

            } else if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 3.0 });
                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const context = canvas.getContext('2d');
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                await processCanvas(canvas);
            }

            // Final Combined Logic
            let finalCode = result?.text;
            if (!finalCode && fullOcrText) {
                finalCode = extractCodeFromOCR(fullOcrText);
            }

            if (!entity && paymentEntities.length > 0) {
                const combined = (fullOcrText + " " + file.name).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const found = paymentEntities.find(e => {
                    const nameUpper = String(e.name || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (nameUpper && combined.includes(nameUpper)) return true;
                    if (e.keywords && Array.isArray(e.keywords)) {
                        return e.keywords.some(k => {
                            const kUpper = String(k || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            return kUpper && combined.includes(kUpper);
                        });
                    }
                    return false;
                });
                if (found) entity = found;
                if (!entity) {
                    if (combined.includes("FAECYS") || combined.includes("APORTE SINDICAL") || combined.includes("FEDERACION ARGENTINA DE EMPLEADOS DE COMERCIO")) {
                        entity = paymentEntities.find(e => String(e.name || "").toUpperCase().includes("FAECYS"));
                    }
                }
            }

            if (finalCode || entity) {
                console.log("Scan Result -> Code:", finalCode, "Entity:", entity?.name, "Amount:", amount);
                setDetectedCode(finalCode);
                setDetectedEntity(entity);
                setDetectedAmount(amount);
                setDetectedImagePreview({
                    url: URL.createObjectURL(file),
                    isPdf: file.type === 'application/pdf'
                });

                if (finalCode) {
                    try {
                        if (navigator?.clipboard?.writeText) {
                            navigator.clipboard.writeText(finalCode).catch(() => {});
                        }
                    } catch (e) {
                        console.warn("Clipboard copy failed:", e);
                    }
                }

                if (finalCode || entity) {
                    setShowModal(true);
                    toast.info(finalCode ? `¡Factura detectada! Código ${finalCode} copiado al portapapeles` : (entity ? `¡Factura de ${entity.name} detectada!` : "¡Factura detectada!"));

                    // We removed the automatic expense saving.
                    // Now the user must confirm it in the modal.
                }
            }
        } catch (err) {
            console.warn(`Scan error: ${file.name}`, err);
        }
    };

    // Fetch files when folder changes
    useEffect(() => {
        if (accessToken && currentFolderId) {
            fetchFiles(currentFolderId);
        }
    }, [currentFolderId, accessToken]);

    // Reset to root if rootFolderId changes (employee switch)
    useEffect(() => {
        setCurrentFolderId(rootFolderId);
        setFolderHistory([{ id: rootFolderId, name: 'Raíz' }]);
    }, [rootFolderId]);

    const fetchFiles = async (folderId) => {
        if (!folderId) return;
        setLoading(true);
        try {
            // Query: Not trashed, inside specific parent
            const query = `'${folderId}' in parents and trashed = false`;
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType, webContentLink)&orderBy=folder,name`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            if (response.status === 403 || response.status === 401 || !response.ok) {
                const errorBody = await response.text();
                console.error("Google Drive API Error:", response.status, response.statusText, errorBody);
                
                if (response.status === 403 || response.status === 401) {
                    toast.warn(`Error de permisos Drive (${response.status}): Revisa la consola para más detalles.`);
                    setFiles([]);
                    setHasAuthError(true);
                    if (onAuthError) onAuthError(); // trigger auto-logout if configured
                    return;
                }
                throw new Error(`Error fetching files: ${response.status} - ${errorBody}`);
            }

            if (!response.ok) throw new Error("Error fetching files");

            const data = await response.json();
            setHasAuthError(false);
            setFiles(data.files || []);
        } catch (error) {
            console.error("Drive Fetch Error:", error);
            // Don't show toast on every error to avoid spamming if it's just a network blip
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (folderId, folderName) => {
        setFolderHistory([...folderHistory, { id: folderId, name: folderName }]);
        setCurrentFolderId(folderId);
    };

    const handleGoBack = () => {
        if (folderHistory.length <= 1) return;
        const newHistory = [...folderHistory];
        newHistory.pop(); // Remove current
        const prevFolder = newHistory[newHistory.length - 1];
        setFolderHistory(newHistory);
        setCurrentFolderId(prevFolder.id);
    };

    const handleCreateFolder = async () => {
        const folderName = prompt("Nombre de la nueva carpeta:");
        if (!folderName) return;

        try {
            const metadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [currentFolderId]
            };

            const response = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });

            if (response.ok) {
                toast.success("Carpeta creada");
                fetchFiles(currentFolderId); // Refresh
            } else {
                throw new Error("Error creating folder");
            }
        } catch (error) {
            toast.error("No se pudo crear la carpeta");
        }
    };



    const handleOpenInDrive = () => {
        window.open(`https://drive.google.com/drive/folders/${currentFolderId}`, '_blank');
    };

    const handleDownload = async (e, file) => {
        e.stopPropagation();
        try {
            if (file.webContentLink) {
                window.open(file.webContentLink, '_blank');
            } else {
                // Fallback: fetch blob
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (!response.ok) throw new Error("Download failed");
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (error) {
            toast.error("Error al descargar archivo");
        }
    };

    const handleDelete = async (e, fileId, fileName) => {
        e.stopPropagation(); // Prevent navigation if it's a folder
        if (!window.confirm(`¿Estás seguro de que deseas eliminar "${fileName}"?`)) return;

        try {
            // We use update to set trashed=true instead of DELETE (permanent) for safety
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ trashed: true })
            });

            if (response.ok) {
                toast.success("Elemento movido a la papelera");
                fetchFiles(currentFolderId);
            } else {
                throw new Error("Error deleting file");
            }
        } catch (error) {
            console.error(error);
            toast.error("No se pudo eliminar el elemento");
        }
    };

    // Drag & Drop Handlers
    const handleDragOver = (e) => { e.preventDefault(); setIsDragActive(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragActive(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);
        const uploadedFiles = Array.from(e.dataTransfer.files);
        if (uploadedFiles.length > 0) {
            uploadedFiles.forEach(file => uploadFile(file));
        }
    };

    const uploadFile = async (file, targetId = currentFolderId) => {
        // Attempt to scan for barcode (fire and forget to not delay upload)
        scanFileForBarcode(file);

        setUploading(true);
        setUploadProgress(0);

        const metadata = {
            name: file.name,
            parents: [targetId]
        };

        // Simple multipart upload (for small files) or resumable (better but complex).
        // Using simple multipart for MVP simplicity as per previous code.
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            setUploading(false);
            if (xhr.status === 200) {
                toast.success(`Archivo "${file.name}" subido exitosamente`);
                try {
                    const responseJson = JSON.parse(xhr.responseText);
                    if (responseJson.id) {
                        setUploadedDriveFileId(responseJson.id);
                    }
                } catch (e) {
                    console.error("Failed to parse drive upload response", e);
                }
                // Only refresh if uploaded to current folder
                if (targetId === currentFolderId) {
                    fetchFiles(currentFolderId);
                }
            } else {
                toast.error("Error al subir archivo");
            }
        };

        xhr.onerror = () => {
            setUploading(false);
            toast.error("Error de red al subir");
        };

        xhr.send(form);
    };

    const handleSaveInvoice = async () => {
        if (isPayStubMode) {
            if (!detectedAmount || isNaN(parseFloat(detectedAmount.replace('.','').replace(',','.')))) {
                toast.error("Debe ingresar el sueldo neto válido");
                return;
            }
            if (!uploadedDriveFileId) {
                toast.warn("Esperando a que termine de subir el archivo a Drive...");
                return;
            }
            setSavingInvoice(true);
            try {
                const stubId = `stub_${Date.now()}`;
                const stubRef = ref(database, `employeeSalaries/${employeeId}/${stubId}`);
                await set(stubRef, {
                    id: stubId,
                    period: payStubPeriod,
                    netSalary: parseFloat(detectedAmount.replace('.','').replace(',','.')),
                    driveFileId: uploadedDriveFileId,
                    driveFileLink: `https://drive.google.com/file/d/${uploadedDriveFileId}/view`,
                    createdAt: Date.now()
                });
                toast.success("Recibo de sueldo guardado correctamente");
                setShowModal(false);
                setDetectedAmount(null);
                setUploadedDriveFileId(null);
                setPayStubPeriod('');
                setDetectedImagePreview(null);
            } catch (error) {
                console.error("Error saving pay stub:", error);
                toast.error("Error al guardar el recibo");
            } finally {
                setSavingInvoice(false);
            }
            return;
        }

        const finalEntityName = detectedEntity?.name || manualEntityName.trim();
        if (!finalEntityName) {
            toast.error("Debe ingresar el nombre de la empresa");
            return;
        }
        if (!detectedAmount || isNaN(parseFloat(detectedAmount.replace('.','').replace(',','.')))) {
            toast.error("Debe ingresar un monto válido");
            return;
        }
        if (!invoiceDueDate) {
            toast.error("Debe ingresar una fecha de vencimiento");
            return;
        }
        if (!uploadedDriveFileId) {
            toast.warn("Esperando a que termine de subir el archivo a Drive...");
            return;
        }

        setSavingInvoice(true);
        try {
            const invoiceId = `inv_${Date.now()}`;
            const invoiceRef = ref(database, `employeeInvoices/${employeeId}/${invoiceId}`);
            
            const invoiceData = {
                id: invoiceId,
                entityId: detectedEntity?.id || '',
                entityName: finalEntityName,
                amount: parseFloat(detectedAmount.replace('.','').replace(',','.')),
                barcode: detectedCode || '',
                dueDate: invoiceDueDate,
                status: 'pending',
                driveFileId: uploadedDriveFileId,
                driveFileLink: `https://drive.google.com/file/d/${uploadedDriveFileId}/view`,
                paymentEndpoint: detectedEntity?.endpoint || '',
                createdAt: Date.now()
            };

            await set(invoiceRef, invoiceData);
            toast.success("Factura guardada correctamente en Facturas Pendientes");
            
            // Close modal and reset
            setShowModal(false);
            setDetectedAmount(null);
            setDetectedCode(null);
            setDetectedEntity(null);
            setDetectedImagePreview(null);
            setInvoiceDueDate('');
            setUploadedDriveFileId(null);
            setManualEntityName('');
            setIsPayStubMode(false);
        } catch (error) {
            console.error("Error saving invoice:", error);
            toast.error("Error al guardar la factura");
        } finally {
            setSavingInvoice(false);
        }
    };

    const formatBreadcrumbs = () => {
        if (folderHistory.length <= 1) return folderHistory[0].name;
        // Show "... > Last Folder"
        return `... / ${folderHistory[folderHistory.length - 1].name}`;
    };

    if (!accessToken) return <div style={{ padding: 20, textAlign: 'center' }}>Inicie sesión en Google para ver archivos.</div>;
    if (!rootFolderId) return <div style={{ padding: 20, textAlign: 'center' }}>Carpeta no configurada para este empleado.</div>;

    return (
        <div style={{ marginTop: 20 }}>
            {showModal && (
                <ScanningModal>
                    <h3>{isPayStubMode ? '📄 Recibo de Sueldo Detectado' : '🧾 Confirmar Factura'}</h3>

                    {detectedImagePreview && (
                        <div style={{ marginBottom: 15, maxHeight: '180px', display: 'flex', justifyContent: 'center', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #ddd', padding: 5, overflow: 'hidden' }}>
                            {detectedImagePreview.isPdf ? (
                                <iframe src={detectedImagePreview.url} style={{ width: '100%', height: '180px', border: 'none' }} title="PDF Preview" />
                            ) : (
                                <img src={detectedImagePreview.url} alt="Vista previa" style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }} />
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', marginBottom: '20px' }}>
                        {isPayStubMode ? (
                            <>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Período (Ej: Julio 2026)</label>
                                    <input 
                                        type="text" 
                                        value={payStubPeriod || ''} 
                                        onChange={(e) => setPayStubPeriod(e.target.value)}
                                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }}
                                        placeholder="Ej: Julio 2026"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Sueldo Neto (ARS)</label>
                                    <input 
                                        type="text" 
                                        value={detectedAmount || ''} 
                                        onChange={(e) => setDetectedAmount(e.target.value)}
                                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }}
                                        placeholder="Ej: 578000.00"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Empresa / Servicio</label>
                                    <input 
                                        type="text" 
                                        value={detectedEntity?.name || manualEntityName} 
                                        onChange={(e) => {
                                            if (detectedEntity) setDetectedEntity(null);
                                            setManualEntityName(e.target.value);
                                        }}
                                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }}
                                        placeholder="Ej: Edesur"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Monto a Pagar (ARS)</label>
                                    <input 
                                        type="text" 
                                        value={detectedAmount || ''} 
                                        onChange={(e) => setDetectedAmount(e.target.value)}
                                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }}
                                        placeholder="Ej: 15000"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Fecha de Vencimiento</label>
                                    <input 
                                        type="date" 
                                        value={invoiceDueDate} 
                                        onChange={(e) => setInvoiceDueDate(e.target.value)}
                                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {!isPayStubMode && detectedCode && (
                        <div className="code" onClick={() => {
                            navigator.clipboard.writeText(detectedCode);
                            toast.success("Código copiado al portapapeles");
                        }} title="Click para copiar">
                            {detectedCode}
                        </div>
                    )}

                    <div className="actions" style={{ flexDirection: 'column', gap: '10px' }}>
                        {!isPayStubMode && (
                            <button 
                                className="mp-btn" 
                                style={{ background: '#2196F3', width: '100%' }}
                                onClick={() => {
                                    if (detectedCode) navigator.clipboard.writeText(detectedCode);
                                    const endpoint = detectedEntity?.endpoint || 'https://www.mercadopago.com.ar/sp/recurrent/entities-search?type=oneshot';
                                    window.open(endpoint, '_blank');
                                    toast.info("Código copiado. Redirigiendo a Mercado Pago...");
                                }}
                            >
                                Pagar ahora en Mercado Pago
                            </button>
                        )}

                        <button 
                            className="mp-btn" 
                            style={{ background: '#4caf50', width: '100%' }}
                            onClick={handleSaveInvoice}
                            disabled={savingInvoice || uploading}
                        >
                            {savingInvoice ? 'Guardando...' : uploading ? 'Subiendo Archivo...' : isPayStubMode ? 'Registrar Recibo de Sueldo' : 'Registrar Factura Pendiente'}
                        </button>

                        <button className="close-btn" onClick={() => {
                            setShowModal(false);
                            setDetectedAmount(null);
                            setDetectedCode(null);
                            setDetectedEntity(null);
                            setDetectedImagePreview(null);
                            setInvoiceDueDate('');
                            setUploadedDriveFileId(null);
                            setManualEntityName('');
                            setIsPayStubMode(false);
                            setPayStubPeriod('');
                        }}>
                            Cancelar
                        </button>
                    </div>
                </ScanningModal>
            )}

            {uploading && <ProgressBar $progress={uploadProgress}><div></div></ProgressBar>}

            <BrowserContainer>
                <Header>
                    <Breadcrumbs>
                        {folderHistory.length > 1 && (
                            <button onClick={handleGoBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5 }}>
                                <FaArrowLeft />
                            </button>
                        )}
                        <FaFolder color="#FFC107" />
                        <span>{formatBreadcrumbs()}</span>
                    </Breadcrumbs>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <ActionButton onClick={handleOpenInDrive} title="Abrir en Google Drive">
                            <FaExternalLinkAlt />
                        </ActionButton>
                        {hasAuthError && (
                            <ActionButton onClick={() => onAuthError && onAuthError()} title="Recargar Permisos (Error detectado)" style={{ color: '#d32f2f', borderColor: '#d32f2f' }}>
                                ⚡
                            </ActionButton>
                        )}
                        <ActionButton onClick={handleCreateFolder}>
                            <FaFolderPlus /> Nueva Carpeta
                        </ActionButton>
                    </div>
                </Header>

                <FileList
                    $isDragActive={isDragActive}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><FaSpinner className="spin" /></div>
                    ) : files.length === 0 ? (
                        <EmptyState>Carpeta vacía. Arrastra archivos aquí.</EmptyState>
                    ) : (
                        files.map(file => (
                            <ListItem
                                key={file.id}
                                $type={file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file'}
                                onClick={() => {
                                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                                        handleNavigate(file.id, file.name);
                                    }
                                }}
                                onDragOver={(e) => {
                                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.currentTarget.style.backgroundColor = '#e3f2fd';
                                    }
                                }}
                                onDragLeave={(e) => {
                                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.currentTarget.style.backgroundColor = '';
                                    }
                                }}
                                onDrop={(e) => {
                                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.currentTarget.style.backgroundColor = '';
                                        const uploadedFiles = Array.from(e.dataTransfer.files);
                                        if (uploadedFiles.length > 0) {
                                            uploadedFiles.forEach(f => uploadFile(f, file.id));
                                            toast.info(`Subiendo a carpeta: ${file.name}`);
                                        }
                                    }
                                }}
                            >
                                {file.mimeType === 'application/vnd.google-apps.folder' ? <FaFolder /> : <FaFile />}
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.name}
                                </span>
                                {file.mimeType !== 'application/vnd.google-apps.folder' && (
                                    <button
                                        onClick={(e) => handleDownload(e, file)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#2196F3',
                                            cursor: 'pointer',
                                            padding: '5px',
                                            marginLeft: '10px',
                                            opacity: 0.6
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                                        title="Descargar"
                                    >
                                        <FaDownload />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => handleDelete(e, file.id, file.name)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#d32f2f',
                                        cursor: 'pointer',
                                        padding: '5px',
                                        marginLeft: '10px',
                                        opacity: 0.6
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                                    title="Eliminar"
                                >
                                    <FaTrash />
                                </button>
                            </ListItem>
                        ))
                    )}
                </FileList>
            </BrowserContainer>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#aaa', marginTop: 5 }}>
                ID: {currentFolderId ? currentFolderId.slice(-6) : '...'}
            </div>
        </div>
    );
};

export default GoogleDriveBrowser;
