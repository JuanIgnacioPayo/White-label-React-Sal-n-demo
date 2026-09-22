import React, { useState, useEffect, useRef } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { app } from "../../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";
import { useLoading } from "../../contexts/LoadingContext";

const ReciboGlobalStyle = createGlobalStyle`
  body {
    margin: 0 !important;
    padding: 0 !important;
    background-color: #f3f4f6 !important;
  }
  @page {
    size: legal portrait;
    margin: 0;
  }
  .ql-size-small, span.ql-size-small, p.ql-size-small {
    font-size: 0.75em !important;
  }
  .ql-size-large, span.ql-size-large, p.ql-size-large {
    font-size: 1.35em !important;
  }
  .ql-size-huge, span.ql-size-huge, p.ql-size-huge {
    font-size: 1.8em !important;
  }
  .ql-align-center {
    text-align: center !important;
  }
  .ql-align-right {
    text-align: right !important;
  }
  .ql-align-justify {
    text-align: justify !important;
  }
`;

/**
 * Normaliza y limpia el HTML de Firebase para asegurar ajuste natural sin palabras pegadas por non-breaking spaces
 */
const cleanAndFormatHtml = (rawContent) => {
    if (!rawContent) return "";
    return rawContent
        .replace(/&nbsp;/gi, " ")
        .replace(/\u00a0/g, " ")
        .replace(/\u202f/g, " ")
        .replace(/&amp;nbsp;/gi, " ");
};

export default function Recibo() {
    const { completeTask } = useLoading();

    useEffect(() => {
        completeTask('app_init');
    }, [completeTask]);

    const [dia, setDia] = useState("");
    const [mes, setMes] = useState("");
    const [anio, setAnio] = useState("");
    const [nombre, setNombre] = useState("");
    const [importe, setImporte] = useState("");
    const [importeTotal, setImporteTotal] = useState("");
    const [nombreMes, setnombreMes] = useState("");
    const [fotoLogo, setfotoLogo] = useState("");
    const [nombreArchivo, setnombreArchivo] = useState("");
    const [companyName, setCompanyName] = useState("Cargando...");

    const [inputValue1, setInputValue1] = useState("");
    const [inputValue2, setInputValue2] = useState("");
    const [inputValue3, setInputValue3] = useState("");
    const [inputValue4, setInputValue4] = useState("");
    const [inputValue5, setInputValue5] = useState("");
    const [inputValue6, setInputValue6] = useState("");
    const [inputValue7, setInputValue7] = useState("");
    const [inputValue8, setInputValue8] = useState("");
    const [inputValue9, setInputValue9] = useState("");
    const [inputValue10, setInputValue10] = useState("");
    const [inputValue11, setInputValue11] = useState("");
    const [inputValue12, setInputValue12] = useState("");
    const [inputValue13, setInputValue13] = useState("");
    const [inputValue14, setInputValue14] = useState("");
    const [inputValue15, setInputValue15] = useState("");
    const [inputValue16, setInputValue16] = useState("");
    const [inputValue17, setInputValue17] = useState("");
    const [inputValue18, setInputValue18] = useState("");
    const [inputValue19, setInputValue19] = useState("");
    const [inputValue20, setInputValue20] = useState("");
    const [inputValue21, setInputValue21] = useState("");
    const [inputValue22, setInputValue22] = useState("");
    const [inputValue23, setInputValue23] = useState("");
    const [inputValue24, setInputValue24] = useState("");

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [hasDownloaded, setHasDownloaded] = useState(false);
    const [loading31, setLoading31] = useState(true);
    const [loading32, setLoading32] = useState(true);
    const [loading29, setLoading29] = useState(true);
    const autoDownloadTriggeredRef = useRef(false);

    const d = new Date();
    const pdfRef = useRef(null);
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth <= 820 ? "mobile" : "oficio";
        }
        return "oficio";
    });

    useEffect(() => {
        const fetchData = async () => {
            const db = getDatabase(app);
            const dbURL = "datosId/" + 31;
            const dbRef = ref(db, dbURL);
            try {
                const snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    const targetObject = snapshot.val();
                    setDia(targetObject.dia_evento || "");
                    setMes(targetObject.mes_evento || "");
                    setAnio(targetObject.anio_evento || "");
                    setNombre(targetObject.nombre_cliente || "");
                    setImporteTotal(targetObject.seña_total || "");
                    setImporte(targetObject.seña || "");
                    setnombreArchivo(targetObject.nombre_del_archivo || "");
                } else {
                    console.log("error al cargar datos del evento en el recibo");
                }
            } catch (err) {
                console.error("Error cargando datosId/31:", err);
            } finally {
                setLoading31(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!mes) return;
        const fetchData = async () => {
            const db = getDatabase(app);
            const dbURL = "datosId/" + mes;
            const dbRef = ref(db, dbURL);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const targetObject = snapshot.val();
                setnombreMes(targetObject.n_mes_ || "");
            } else {
                console.log("error al cargar mes en el recibo");
            }
        };
        fetchData();
    }, [mes]);

    useEffect(() => {
        const fetchData = async () => {
            const db = getDatabase(app);
            const dbURL = "datosId/" + 28;
            const dbRef = ref(db, dbURL);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const targetObject = snapshot.val();
                setfotoLogo(targetObject.foto30 || "");
            } else {
                console.warn("No se encontró foto de logo en datosId/28");
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const db = getDatabase(app);
            const dbURL = "datosId/" + 32;
            const dbRef = ref(db, dbURL);
            try {
                const snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    const targetObject = snapshot.val();
                    setInputValue1(targetObject.contenido1 || "");
                    setInputValue2(targetObject.contenido2 || "");
                    setInputValue3(targetObject.contenido3 || "");
                    setInputValue4(targetObject.contenido4 || "");
                    setInputValue5(targetObject.contenido5 || "");
                    setInputValue6(targetObject.contenido6 || "");
                    setInputValue7(targetObject.contenido7 || "");
                    setInputValue8(targetObject.contenido8 || "");
                    setInputValue9(targetObject.contenido9 || "");
                    setInputValue10(targetObject.contenido10 || "");
                    setInputValue11(targetObject.contenido11 || "");
                    setInputValue12(targetObject.contenido12 || "");
                    setInputValue13(targetObject.contenido13 || "");
                    setInputValue14(targetObject.contenido14 || "");
                    setInputValue15(targetObject.contenido15 || "");
                    setInputValue16(targetObject.contenido16 || "");
                    setInputValue17(targetObject.contenido17 || "");
                    setInputValue18(targetObject.contenido18 || "");
                    setInputValue19(targetObject.contenido19 || "");
                    setInputValue20(targetObject.contenido20 || "");
                    setInputValue21(targetObject.contenido21 || "");
                    setInputValue22(targetObject.contenido22 || "");
                    setInputValue23(targetObject.contenido23 || "");
                    setInputValue24(targetObject.contenido24 || "");
                } else {
                    console.warn("No se encontraron datos en datosId/32");
                }
            } catch (err) {
                console.error("Error cargando datosId/32:", err);
            } finally {
                setLoading32(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const db = getDatabase(app);
            const dbURL = "datosId/" + 29;
            const dbRef = ref(db, dbURL);
            try {
                const snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    const targetObject = snapshot.val();
                    setCompanyName(targetObject.contenido1 || "Salón Magic Eventos");
                } else {
                    setCompanyName("Salón Magic Eventos");
                }
            } catch (error) {
                console.error("Error fetching company name:", error);
                setCompanyName("");
            } finally {
                setLoading29(false);
            }
        };
        fetchData();
    }, []);

    const downloadPDF = async (customNombreArchivo) => {
        if (isGeneratingPdf) return;
        const targetFilename = customNombreArchivo || nombreArchivo || 'Recibo';
        const fechaEvento = `${dia}-${mes}-${anio}`;
        const finalFilename = `LEER este contrato - ${fechaEvento} - ${companyName || 'Recibo'}.pdf`;
        const element = pdfRef.current;
        if (!element) return;

        setIsGeneratingPdf(true);
        try {
            const loader = document.getElementById('app-initial-loader');
            if (loader) loader.style.display = 'none';

            // Esperar a que las fuentes personalizadas estén listas
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            // Esperar carga de imágenes dentro del elemento
            const imgs = Array.from(element.querySelectorAll('img'));
            await Promise.all(imgs.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(res => {
                    img.onload = res;
                    img.onerror = res;
                });
            }));

            // Captura optimizada a 2x (~192 DPI): máxima nitidez para textos, renglones y firmas
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                windowWidth: 794,
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0,
            });

            if (loader) loader.style.display = '';

            // Formato Oficio (Legal: 215.9 x 355.6 mm) con compresión optimizada para compartir por WhatsApp
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'legal',
                compress: true
            });

            const pdfWidth = pdf.internal.pageSize.getWidth(); // Legal: 215.9mm
            const pdfHeight = pdf.internal.pageSize.getHeight(); // Legal: 355.6mm

            // Compresión JPEG calibrada (0.90): texto nítido sin artefactos de compresión
            const imgData = canvas.toDataURL('image/jpeg', 0.90);
            const totalHeightMm = (canvas.height * pdfWidth) / canvas.width;

            // Auto-fit inteligente: Si entra o si se pasa por hasta un 8%, ajustamos proporcionalmente
            // la escala para que TODO entre 100% en 1 sola página sin cortar renglones por la mitad
            if (totalHeightMm <= pdfHeight * 1.08) {
                const finalRenderHeight = Math.min(totalHeightMm, pdfHeight);
                const renderWidth = totalHeightMm > pdfHeight 
                    ? (pdfWidth * (pdfHeight / totalHeightMm)) 
                    : pdfWidth;
                const xOffset = (pdfWidth - renderWidth) / 2;
                pdf.addImage(imgData, 'JPEG', xOffset, 0, renderWidth, finalRenderHeight, undefined, 'FAST');
            } else {
                let heightLeft = totalHeightMm;
                let position = 0;
                let page = 0;

                while (heightLeft > 0) {
                    if (page > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalHeightMm, undefined, 'FAST');
                    heightLeft -= pdfHeight;
                    position -= pdfHeight;
                    page++;
                }
            }

            pdf.save(finalFilename);
            setHasDownloaded(true);
        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Hubo un error al generar el PDF. Por favor intentá nuevamente.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const date = d.toLocaleDateString();

    // Cálculo del saldo restante al ingreso
    const numTotal = parseFloat(importeTotal.toString().replace(/[^0-9.-]+/g, "")) || 0;
    const numSena = parseFloat(importe.toString().replace(/[^0-9.-]+/g, "")) || 0;
    const saldoRestante = numTotal > numSena ? numTotal - numSena : 0;

    // Auto-descarga automática y confiable apenas se completan las cargas de datos
    useEffect(() => {
        if (!loading31 && !loading32 && !loading29 && !autoDownloadTriggeredRef.current) {
            autoDownloadTriggeredRef.current = true;
            const timer = setTimeout(() => {
                downloadPDF(nombreArchivo);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [loading31, loading32, loading29, nombreArchivo]);


    return (
        <>
            <ReciboGlobalStyle />
            <PageContainer>
                {/* Barra de control superior para móvil y desktop */}
                <TopBar className="no-print">
                    <div className="left-controls">
                        <Link to="/admin?panel=recibos" className="back-btn">
                            ← Volver al Panel
                        </Link>

                        {/* Conmutador de modelo */}
                        <div className="model-toggle">
                            <span className="toggle-label">Modelo:</span>
                            <span className="toggle-btn active" title="Modelo clásico actual en 1 página Oficio">
                                📄 Clásico
                            </span>
                            <Link to="/templateReciboInfografia" className="toggle-btn" title="Ver modelo en 2 páginas estilo infografía">
                                📊 Infografía
                            </Link>
                        </div>

                        {/* Conmutador de vista móvil vs hoja oficio */}
                        <div className="view-toggle">
                            <span className="toggle-label">Vista:</span>
                            <button
                                type="button"
                                className={`toggle-btn ${viewMode === 'mobile' ? 'active' : ''}`}
                                onClick={() => setViewMode('mobile')}
                                title="Ver en formato vertical adaptado para celular"
                            >
                                📱 Móvil
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${viewMode === 'oficio' ? 'active' : ''}`}
                                onClick={() => setViewMode('oficio')}
                                title="Ver en hoja Oficio completa"
                            >
                                📄 Hoja
                            </button>
                        </div>
                    </div>

                    <div className="status-indicator">
                        {isGeneratingPdf ? (
                            <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="spinner-mini"></span> Descargando recibo automáticamente...
                            </span>
                        ) : hasDownloaded ? (
                            <span style={{ color: '#059669' }}>
                                ✓ Recibo descargado automáticamente
                            </span>
                        ) : (
                            <span style={{ color: '#059669' }}>
                                ✓ Formato Oficio (1 página)
                            </span>
                        )}
                    </div>
                    <button
                        className="download-btn"
                        onClick={() => downloadPDF(nombreArchivo)}
                        disabled={isGeneratingPdf}
                    >
                        📄 {isGeneratingPdf ? 'Descargando...' : hasDownloaded ? 'Descargar de nuevo' : 'Descargar Recibo PDF'}
                    </button>
                </TopBar>

                {/* Contenedor principal del documento */}
                <ViewerContainer $isMobile={viewMode === 'mobile'}>
                    {/* Vista Móvil Nativa (100% responsive, tipografía cómoda y sin scroll horizontal) */}
                    {viewMode === 'mobile' && (
                        <MobileReceiptWrapper className="no-print">
                            <div className="mobile-receipt-card">
                                {/* Encabezado con Logo y Nombre */}
                                <div className="mobile-header">
                                    <div className="brand-box">
                                        {fotoLogo ? (
                                            <img src={fotoLogo} className="brand-logo" crossOrigin="anonymous" alt="Logo" />
                                        ) : (
                                            <div className="brand-logo-fallback">SME</div>
                                        )}
                                        <div>
                                            <h2 className="brand-name">{companyName || "Salón Magic Eventos"}</h2>
                                            <span className="brand-badge">✓ Comprobante Oficial de Reserva</span>
                                        </div>
                                    </div>
                                    <div className="receipt-tag">Recibo</div>
                                </div>

                                {/* Tarjeta Destacada de Datos de la Seña */}
                                <div className="mobile-sena-card">
                                    <div className="sena-top-meta">
                                        <span className="meta-place" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue2 || "Buenos Aires") }} />
                                        <span className="meta-date">📅 {date}</span>
                                    </div>

                                    <div className="client-line">
                                        <span className="client-label">Recibí de:</span>
                                        <span className="client-name">{nombre || "Sin nombre registrado"}</span>
                                    </div>

                                    {/* Cuadrícula de Montos y Fecha */}
                                    <div className="amounts-grid">
                                        <div className="amount-box highlight-green">
                                            <span className="box-title">Seña Abonada</span>
                                            <span className="box-value">${importe || "0"}</span>
                                        </div>

                                        <div className="amount-box highlight-blue">
                                            <span className="box-title">Fecha del Evento</span>
                                            <span className="box-value">{dia || "__"}-{mes || "__"}-{anio || "____"}</span>
                                        </div>

                                        <div className="amount-box">
                                            <span className="box-title">Total Pactado</span>
                                            <span className="box-value">${importeTotal || "0"}-.</span>
                                        </div>

                                        {saldoRestante > 0 && (
                                            <div className="amount-box highlight-saldo">
                                                <span className="box-title">Saldo al Ingreso</span>
                                                <span className="box-value">${saldoRestante.toLocaleString('es-AR')}-.</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Concepto de la seña */}
                                    {inputValue3 && (
                                        <div className="concept-text" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue3) }} />
                                    )}

                                    {/* Firma y Emisor */}
                                    <div className="signer-row">
                                        <div className="issuer-data" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue5) }} />
                                        <div className="signature-box">
                                            <div className="sign-cursive" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue24) }} />
                                            <span className="sign-line"></span>
                                            <span className="sign-label">Firma Autorizada</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Alerta de Seña no Reembolsable / Disclaimer */}
                                {inputValue6 && (
                                    <div className="mobile-alert-box">
                                        <span className="alert-icon">⚠️</span>
                                        <div className="alert-content" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue6) }} />
                                    </div>
                                )}

                                {/* Condiciones del Servicio y Convivencia */}
                                <div className="mobile-conditions-section">
                                    <h3 className="section-title">
                                        📋 Condiciones del Servicio y Convivencia
                                    </h3>
                                    <ol className="conditions-list">
                                        {inputValue7 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue7) }} />}
                                        {inputValue8 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue8) }} />}
                                        {inputValue9 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue9) }} />}
                                        {inputValue10 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue10) }} />}
                                        {inputValue11 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue11) }} />}
                                        {inputValue12 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue12) }} />}
                                        {inputValue13 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue13) }} />}
                                        {inputValue14 && <li className="bold-clause" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue14) }} />}
                                        {inputValue15 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue15) }} />}
                                        {inputValue16 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue16) }} />}
                                        {inputValue17 && <li className="bold-clause" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue17) }} />}
                                        {inputValue18 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue18) }} />}
                                        {inputValue19 && <li className="bold-clause" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue19) }} />}
                                        {inputValue20 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue20) }} />}
                                        {inputValue21 && <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue21) }} />}
                                    </ol>

                                    {inputValue22 && (
                                        <div className="closing-clause" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue22) }} />
                                    )}
                                </div>

                                {/* Pie de página con enlace web */}
                                <div className="mobile-footer">
                                    <a href="/">
                                        Este recibo se basa en la lista de precios del mes de {nombreMes || '...'} de {anio || '...'}. Puede verla en nuestra página web.
                                    </a>
                                </div>

                                {/* Botón grande para descargar PDF oficial */}
                                <div className="mobile-download-action">
                                    <button
                                        type="button"
                                        className="btn-download-mobile"
                                        onClick={() => downloadPDF(nombreArchivo)}
                                        disabled={isGeneratingPdf}
                                    >
                                        📄 {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Recibo Oficial en PDF (Hoja Oficio)'}
                                    </button>
                                    <p className="mobile-download-hint">
                                        Se descargará la versión oficial en 1 página Oficio de alta resolución lista para imprimir o reenviar por WhatsApp.
                                    </p>
                                </div>
                            </div>
                        </MobileReceiptWrapper>
                    )}

                    {/* Contenedor del documento imprimible en hoja Oficio */}
                    <div
                        className="print-capture-wrapper"
                        style={
                            viewMode === 'mobile'
                                ? {
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '794px',
                                      minWidth: '794px',
                                      zIndex: -1000,
                                      pointerEvents: 'none',
                                      visibility: 'visible',
                                      opacity: 1,
                                  }
                                : {
                                      display: 'flex',
                                      justifyContent: 'center',
                                      width: '100%',
                                  }
                        }
                    >
                        <DocumentCard id="recibo-document" ref={pdfRef}>
                            {/* Navbar superior */}
                            <div className="navbar" onClick={() => downloadPDF(nombreArchivo)} title="Hacé clic para descargar PDF">
                                <div className="logo-section">
                                    <Link to="/" onClick={(e) => e.stopPropagation()}>
                                        {fotoLogo ? (
                                            <img src={fotoLogo} className="logo" crossOrigin="anonymous" alt="Logo" />
                                        ) : (
                                            <div className="logo-placeholder">LOGO</div>
                                        )}
                                    </Link>
                                    <span className="name">{companyName}</span>
                                </div>
                                <div className="title">Recibo</div>
                            </div>

                            {/* Cuerpo del Recibo */}
                            <div className="receipt-container">
                                {/* Caja de Seña (Encabezado con borde) */}
                                <div className="header">
                                    <div className="inline-quill" style={{ marginBottom: '4px' }}>
                                        <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue2) }} />
                                        {", "} <span className="inline">{date}.</span>
                                    </div>

                                    <div style={{ marginBottom: '4px' }}>
                                        <span className="bold">Recibí de {nombre} la cantidad de ${importe}</span>
                                    </div>

                                    <div style={{ marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue3) }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4px', gap: '8px' }}>
                                        <div className="bold inline-quill" style={{ flex: 1, minWidth: 0 }}>
                                            <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue4) }} /> {dia}-{mes}-{anio}.
                                        </div>
                                        <div className="bold" style={{ marginRight: '1.5rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                            Pagó en total: ${importeTotal}-.
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }} dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue5) }} />
                                        <div
                                            className="firma"
                                            style={{ marginRight: '1.5rem', flexShrink: 0 }}
                                            dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue24) }}
                                        />
                                    </div>
                                </div>

                                {/* Disclaimer */}
                                <div className="disclaimer" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue6) }} />

                                {/* Lista de 15 Condiciones */}
                                <div className="content">
                                    <ol>
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue7) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue8) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue9) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue10) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue11) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue12) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue13) }} />
                                        <li className="bold" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue14) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue15) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue16) }} />
                                        <li className="bold" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue17) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue18) }} />
                                        <li className="bold" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue19) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue20) }} />
                                        <li dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue21) }} />
                                    </ol>
                                    {inputValue22 && (
                                        <h3 dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue22) }} />
                                    )}
                                </div>

                                {/* Pie de Página */}
                                <div className="footer">
                                    <a href="/">
                                        Este recibo se basa en la lista de precios del mes de {nombreMes || '...'} de {anio || '...'}. Puede verla en nuestra página web.
                                    </a>
                                </div>
                            </div>
                        </DocumentCard>
                    </div>
                </ViewerContainer>
            </PageContainer>
        </>
    );
}

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  position: relative;
  background-color: #f3f4f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 40px;
`;

const TopBar = styled.header`
  width: 100%;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;

  .left-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-btn {
    text-decoration: none;
    color: #374151;
    font-size: 0.95rem;
    font-weight: 600;
    padding: 8px 14px;
    border-radius: 6px;
    background-color: #f3f4f6;
    transition: background-color 0.2s;
    &:hover {
      background-color: #e5e7eb;
    }
  }

  .model-toggle,
  .view-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    background-color: #f3f4f6;
    padding: 3px 6px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  .toggle-label {
    font-size: 0.78rem;
    color: #4b5563;
    font-weight: 600;
    margin-right: 2px;
  }

  .toggle-btn {
    text-decoration: none;
    padding: 4px 8px;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 4px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #4b5563;
    transition: all 0.15s ease;

    &.active {
      background-color: #ffffff;
      color: #111827;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    &:hover:not(.active) {
      color: #111827;
    }
  }

  .status-indicator {
    font-size: 0.95rem;
    font-weight: 500;
  }

  .download-btn {
    background-color: var(--app-primary-text-color, var(--primary-color, #a8a48b));
    color: #ffffff;
    border: none;
    padding: 8px 18px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity 0.2s;
    &:hover:not(:disabled) {
      opacity: 0.9;
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .spinner-mini {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #d97706;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 820px) {
    padding: 10px 14px;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;

    .left-controls {
      width: 100%;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .status-indicator {
      display: none;
    }

    .download-btn {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    padding: 8px 10px;

    .back-btn, .download-btn, .toggle-btn {
      font-size: 0.78rem;
      padding: 5px 8px;
    }
  }

  @media print {
    display: none !important;
  }
`;

const ViewerContainer = styled.main`
  width: 100%;
  overflow-x: ${props => props.$isMobile ? 'hidden' : 'auto'};
  -webkit-overflow-scrolling: touch;
  display: flex;
  justify-content: center;
  padding: ${props => props.$isMobile ? '12px 10px 30px' : '24px 12px'};
  box-sizing: border-box;

  @media (max-width: 820px) {
    justify-content: ${props => props.$isMobile ? 'center' : 'flex-start'};
  }

  @media print {
    padding: 0 !important;
    overflow: visible !important;
    display: block !important;
  }
`;

const DocumentCard = styled.div`
  width: 794px;
  min-width: 794px;
  max-width: 794px;
  min-height: 1308px; /* Proporción exacta hoja Oficio / Legal (215.9 x 355.6 mm a 96 DPI: 794 x 1308 px) */
  margin: 0 auto;
  background-color: #ffffff;
  color: #111111;
  font-family: 'product_sansregular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  line-height: 1.45;

  .navbar {
    position: relative;
    width: 100%;
    height: 40px;
    padding: 0 20px;
    background-color: var(--app-primary-text-color, var(--primary-color, #a8a48b));
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    color: #ffffff !important;
    cursor: pointer;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo {
    width: 22px;
    height: 22px;
    object-fit: contain;
    display: block;
  }

  .logo-placeholder {
    width: 22px;
    height: 22px;
    border: 1px dashed #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    color: #ffffff;
  }

  .name {
    font-family: 'playlistscript', cursive;
    font-size: 1.35rem;
    color: #ffffff !important;
    letter-spacing: 0.5px;
  }

  .title {
    font-size: 1.05rem;
    font-weight: 500;
    color: #ffffff !important;
  }

  .receipt-container {
    padding: 14px 22px 18px 22px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  p, span, li, div, h3 {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .header {
    border: 1px solid #111111;
    padding: 11px 18px;
    margin-bottom: 12px;
    font-size: 10.5pt;
    line-height: 1.48;
    background: #ffffff;
    box-sizing: border-box;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .disclaimer {
    margin: 8px 0 10px 14px;
    font-weight: bold;
    font-size: 10pt;
    line-height: 1.42;
    color: #111111;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .content {
    margin: 0;
    padding: 0 14px;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  ol {
    padding-left: 1.35rem;
    margin: 0;
  }

  li {
    font-size: 9.85pt;
    line-height: 1.45;
    margin-bottom: 13px;
    color: #222222;
    overflow-wrap: break-word;
    word-break: break-word;

    p {
      margin: 0;
      line-height: 1.45;
      display: inline;
      overflow-wrap: break-word;
      word-break: break-word;
    }
  }

  h3 {
    font-size: 10pt;
    font-weight: bold;
    margin-top: 12px;
    margin-bottom: 8px;
    padding: 0;
    line-height: 1.45;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .footer {
    margin: 12px 0 8px 14px;
    font-size: 9pt;
    font-weight: bold;
    a {
      color: #333333;
      text-decoration: none;
    }
  }

  .bold {
    font-weight: bold;
  }

  .firma {
    font-family: 'playlistscript', cursive;
    font-weight: bold;
    font-size: 1.25rem;
    color: #111111;
  }

  .inline {
    display: inline-block;
  }

  .inline-quill p {
    display: inline;
    margin: 0;
  }

  p {
    margin-bottom: 0.2em;
    margin-top: 0;
  }

  p:last-child {
    margin-bottom: 0;
  }

  @media print {
    box-shadow: none !important;
    border: none !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
`;

const MobileReceiptWrapper = styled.div`
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  padding: 0 4px;
  box-sizing: border-box;

  .mobile-receipt-card {
    width: 100%;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
    overflow: hidden;
    font-family: 'product_sansregular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1f2937;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  p, span, li, div, h2, h3 {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .mobile-header {
    background-color: var(--app-primary-text-color, var(--primary-color, #a8a48b));
    color: #ffffff;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
  }

  .brand-box {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-logo {
    width: 34px;
    height: 34px;
    object-fit: contain;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.9);
    padding: 2px;
  }

  .brand-logo-fallback {
    width: 34px;
    height: 34px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 11px;
    color: #ffffff;
  }

  .brand-name {
    margin: 0;
    font-family: 'playlistscript', cursive;
    font-size: 1.55rem;
    color: #ffffff;
    line-height: 1.1;
  }

  .brand-badge {
    font-size: 0.72rem;
    opacity: 0.92;
    display: block;
    margin-top: 3px;
    font-weight: 500;
    letter-spacing: 0.3px;
  }

  .receipt-tag {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: rgba(255, 255, 255, 0.22);
    padding: 5px 12px;
    border-radius: 9999px;
    color: #ffffff;
    white-space: nowrap;
  }

  .mobile-sena-card {
    padding: 20px 20px 16px 20px;
    background: #ffffff;
    border-bottom: 1px solid #f3f4f6;
  }

  .sena-top-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.86rem;
    color: #6b7280;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 6px;

    .meta-place p {
      display: inline;
      margin: 0;
    }
  }

  .meta-date {
    font-weight: 600;
    color: #374151;
    background: #f3f4f6;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .client-line {
    font-size: 1.2rem;
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    line-height: 1.3;
  }

  .client-label {
    color: #6b7280;
    font-weight: 500;
    font-size: 0.95rem;
  }

  .client-name {
    font-weight: 700;
    color: #111827;
  }

  .amounts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  @media (max-width: 420px) {
    .amounts-grid {
      grid-template-columns: 1fr;
    }
  }

  .amount-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    .box-title {
      font-size: 0.74rem;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .box-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: #111827;
      line-height: 1.2;
    }
  }

  .highlight-green {
    background: #ecfdf5;
    border-color: #a7f3d0;
    .box-title { color: #047857; }
    .box-value { color: #065f46; font-size: 1.45rem; }
  }

  .highlight-blue {
    background: #eff6ff;
    border-color: #bfdbfe;
    .box-title { color: #1d4ed8; }
    .box-value { color: #1e40af; }
  }

  .highlight-saldo {
    background: #fffbeb;
    border-color: #fde68a;
    .box-title { color: #b45309; }
    .box-value { color: #92400e; }
  }

  .concept-text {
    font-size: 0.94rem;
    line-height: 1.5;
    color: #374151;
    background: #f9fafb;
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 16px;
    border-left: 4px solid var(--app-primary-text-color, var(--primary-color, #a8a48b));

    p {
      margin: 0;
    }
  }

  .signer-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 14px;
    border-top: 1px dashed #e5e7eb;
    gap: 16px;
    flex-wrap: wrap;
  }

  .issuer-data {
    font-size: 0.88rem;
    color: #4b5563;
    line-height: 1.45;
    flex: 1;
    min-width: 160px;

    p {
      margin: 0;
    }
  }

  .signature-box {
    text-align: center;
    min-width: 140px;
  }

  .sign-cursive {
    font-family: 'playlistscript', cursive;
    font-size: 1.6rem;
    color: #111827;
    min-height: 38px;
    line-height: 1.1;

    p {
      margin: 0;
      display: inline;
    }
  }

  .sign-line {
    display: block;
    width: 100%;
    height: 1px;
    background: #9ca3af;
    margin: 4px 0 3px;
  }

  .sign-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
    font-weight: 600;
  }

  .mobile-alert-box {
    margin: 16px 20px;
    padding: 12px 16px;
    border-radius: 12px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    display: flex;
    gap: 12px;
    align-items: flex-start;

    .alert-icon {
      font-size: 1.3rem;
      line-height: 1.2;
    }

    .alert-content {
      font-size: 0.9rem;
      font-weight: 600;
      color: #92400e;
      line-height: 1.45;

      p {
        margin: 0;
      }
    }
  }

  .mobile-conditions-section {
    padding: 20px;
    background: #ffffff;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .conditions-list {
    padding-left: 22px;
    margin: 0;

    li {
      font-size: 0.92rem;
      line-height: 1.58;
      color: #374151;
      margin-bottom: 14px;
      padding-left: 4px;

      p {
        margin: 0;
        display: inline;
      }
    }

    li.bold-clause {
      font-weight: 600;
      color: #111827;
    }
  }

  .closing-clause {
    margin-top: 16px;
    padding: 12px 16px;
    background: #f9fafb;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #4b5563;
    font-style: italic;
    line-height: 1.45;

    p {
      margin: 0;
    }
  }

  .mobile-footer {
    padding: 14px 20px;
    background: #f9fafb;
    border-top: 1px solid #f3f4f6;
    text-align: center;

    a {
      font-size: 0.85rem;
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      line-height: 1.4;
      display: inline-block;

      &:hover {
        color: #111827;
        text-decoration: underline;
      }
    }
  }

  .mobile-download-action {
    padding: 20px;
    background: #f3f4f6;
    text-align: center;
    border-top: 1px solid #e5e7eb;

    .btn-download-mobile {
      width: 100%;
      background-color: var(--app-primary-text-color, var(--primary-color, #a8a48b));
      color: #ffffff;
      border: none;
      padding: 15px 20px;
      font-size: 1.02rem;
      font-weight: 700;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
        opacity: 0.95;
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .mobile-download-hint {
      margin: 10px 0 0;
      font-size: 0.8rem;
      color: #6b7280;
      line-height: 1.4;
    }
  }

  @media print {
    display: none !important;
  }
`;
