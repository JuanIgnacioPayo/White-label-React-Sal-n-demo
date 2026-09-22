import React, { useState, useEffect, useRef } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { app } from "../../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";
import { useLoading } from "../../contexts/LoadingContext";
import {
    ReceiptIcon,
    getCardBgColor,
    getDefaultCards,
    normalizeCards,
    DEFAULT_CONTRACT_DATA
} from "./receiptInfograficoUtils";

const InfograficoGlobalStyle = createGlobalStyle`
  body {
    margin: 0 !important;
    padding: 0 !important;
    background-color: #f3f4f6 !important;
  }
  @page {
    size: A4 portrait;
    margin: 0;
  }
  .ql-size-small, span.ql-size-small, p.ql-size-small {
    font-size: 0.75em !important;
  }
  .ql-size-large, span.ql-size-large, p.ql-size-large {
    font-size: 1.45em !important;
  }
  .ql-size-huge, span.ql-size-huge, p.ql-size-huge {
    font-size: 2.0em !important;
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
 * Normaliza y limpia el HTML de Firebase para ajuste natural y sin desbordes
 */
const cleanAndFormatHtml = (rawContent) => {
    if (!rawContent) return "";
    let cleaned = rawContent
        
        .replace(/&nbsp;/gi, " ")
        .replace(/\u00a0/g, " ")
        .replace(/\u202f/g, " ")
        .replace(/&amp;nbsp;/gi, " ");
    if (!cleaned.includes("<p>") && !cleaned.includes("<br") && cleaned.includes("\n")) {
        cleaned = cleaned
            .trim()
            .split(/\n\s*\n/)
            .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
            .join("");
    }
    return cleaned;
};

export default function ReciboInfografico() {
    const { completeTask } = useLoading();

    useEffect(() => {
        completeTask("app_init");
    }, [completeTask]);

    const [dia, setDia] = useState("");
    const [mes, setMes] = useState("");
    const [anio, setAnio] = useState("");
    const [nombre, setNombre] = useState("");
    const [cuit, setCuit] = useState("");
    const [importe, setImporte] = useState("");
    const [importeTotal, setImporteTotal] = useState("");
    const [nombreMes, setnombreMes] = useState("");
    const [fotoLogo, setfotoLogo] = useState("");
    const [nombreArchivo, setnombreArchivo] = useState("");
    const [companyName, setCompanyName] = useState("Salón Magic Eventos");

    // Datos del encabezado y pie de página
    const [headerData, setHeaderData] = useState({
        companyName: "Salón Magic Eventos",
        subtitle1: "GUÍA DE CONVIVENCIA Y CONDICIONES DEL SERVICIO",
        subtitle2: "CONSTANCIA DE SEÑA Y COMPROMISO DE RESERVA",
        contactLine: "<strong>Dirección:</strong> Av. Corrientes 1234, CABA &nbsp;|&nbsp; <strong>WhatsApp/Cel:</strong> 11-0000-0000 (Atención al Cliente)",
        footerLine: "Salón Magic Eventos • Av. Corrientes 1234, CABA • WhatsApp/Cel: 11-0000-0000"
    });

    // Textos y etiquetas dinámicas del contrato (Página 2)
    const [contractData, setContractData] = useState(DEFAULT_CONTRACT_DATA);

    // Tarjetas dinámicas de la infografía
    const [cards, setCards] = useState([]);

    // Cláusulas contractuales y datos legales
    const [inputValue2, setInputValue2] = useState("");
    const [inputValue5, setInputValue5] = useState("");
    const [inputValue6, setInputValue6] = useState("");
    const [inputValue21, setInputValue21] = useState("");
    const [inputValue22, setInputValue22] = useState("");
    const [inputValue24, setInputValue24] = useState("");

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [hasDownloaded, setHasDownloaded] = useState(false);
    const [loading31, setLoading31] = useState(true);
    const [loading32, setLoading32] = useState(true);
    const [loading29, setLoading29] = useState(true);
    const autoDownloadTriggeredRef = useRef(false);

    const d = new Date();
    const page1Ref = useRef(null);
    const page2Ref = useRef(null);
    const mobilePage1Ref = useRef(null);
    const mobilePage2Ref = useRef(null);
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth <= 820 ? "mobile" : "hojas";
        }
        return "hojas";
    });

    // Cargar datos del evento (datosId/31)
    useEffect(() => {
        const fetchData = async () => {
            const db = getDatabase(app);
            const dbRef = ref(db, "datosId/31");
            try {
                const snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    const targetObject = snapshot.val();
                    setDia(targetObject.dia_evento || "");
                    setMes(targetObject.mes_evento || "");
                    setAnio(targetObject.anio_evento || "");
                    setNombre(targetObject.nombre_cliente || "");
                    setCuit(targetObject.cuit || "");
                    setImporteTotal(targetObject.seña_total || "");
                    setImporte(targetObject.seña || "");
                    setnombreArchivo(targetObject.nombre_del_archivo || "");
                }
            } catch (err) {
                console.error("Error cargando datosId/31:", err);
            } finally {
                setLoading31(false);
            }
        };
        fetchData();
    }, []);

    // Cargar nombre del mes si está definido
    useEffect(() => {
        if (!mes) return;
        const fetchData = async () => {
            const db = getDatabase(app);
            const dbRef = ref(db, "datosId/" + mes);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const targetObject = snapshot.val();
                setnombreMes(targetObject.n_mes_ || "");
            }
        };
        fetchData();
    }, [mes]);

    // Cargar foto de logo (datosId/28)
    useEffect(() => {
        const fetchData = async () => {
            const db = getDatabase(app);
            const dbRef = ref(db, "datosId/28");
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const targetObject = snapshot.val();
                setfotoLogo(targetObject.foto30 || "");
            }
        };
        fetchData();
    }, []);

    // Cargar datos institucionales (datosId/29)
    useEffect(() => {
        const fetchData = async () => {
            const db = getDatabase(app);
            const dbRef = ref(db, "datosId/29");
            try {
                const snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    const targetObject = snapshot.val();
                    setCompanyName((targetObject.contenido1 || "Salón Magic Eventos"));
                }
            } catch (error) {
                console.error("Error fetching company name:", error);
            } finally {
                setLoading29(false);
            }
        };
        fetchData();
    }, []);

    // Cargar datos de la plantilla y configuración infográfica (datosId/32 y datosId/32_infografico)
    useEffect(() => {
        const fetchData = async () => {
            const db = getDatabase(app);
            try {
                // 1. Cargar datos clásicos de datosId/32
                const dbRef32 = ref(db, "datosId/32");
                const snapshot32 = await get(dbRef32);
                let data32 = {};
                if (snapshot32.exists()) {
                    data32 = snapshot32.val();
                    setInputValue2(data32.contenido2 || "");
                    setInputValue5(data32.contenido5 || "");
                    setInputValue6(data32.contenido6 || "");
                    setInputValue21(data32.contenido21 || "");
                    setInputValue22(data32.contenido22 || "");
                    setInputValue24(data32.contenido24 || "");
                }

                // 2. Cargar configuración estructurada de datosId/32_infografico
                const dbRefInfografico = ref(db, "datosId/32_infografico");
                const snapshotInfografico = await get(dbRefInfografico);

                if (snapshotInfografico.exists()) {
                    const infoData = snapshotInfografico.val();
                    const normalized = normalizeCards(infoData.cards, data32);
                    setCards(normalized);

                    if (infoData.header) {
                        setHeaderData({
                            companyName: (infoData.header.companyName || "Salón Magic Eventos"),
                            subtitle1: infoData.header.subtitle1 || "GUÍA DE CONVIVENCIA Y CONDICIONES DEL SERVICIO",
                            subtitle2: infoData.header.subtitle2 || "CONSTANCIA DE SEÑA Y COMPROMISO DE RESERVA",
                            contactLine: (infoData.header.contactLine || "<strong>Dirección:</strong> Av. Corrientes 1234, CABA &nbsp;|&nbsp; <strong>WhatsApp/Cel:</strong> 11-0000-0000 (Atención al Cliente)"),
                            footerLine: (infoData.header.footerLine || "Salón Magic Eventos • Av. Corrientes 1234, CABA • WhatsApp/Cel: 11-0000-0000")
                        });
                        if (infoData.header.logoUrl) {
                            setfotoLogo(infoData.header.logoUrl);
                        }
                    }

                    if (infoData.contract) {
                        const rawContract = infoData.contract;
                        const labelPagoTotal = rawContract.labelPagoTotal || (rawContract.labelTotal && rawContract.labelTotal !== "Total Pactado:" ? rawContract.labelTotal : "Pagó en total:");
                        setContractData({
                            ...DEFAULT_CONTRACT_DATA,
                            ...rawContract,
                            labelPagoTotal
                        });
                    }
                } else {
                    const defaults = getDefaultCards(data32);
                    setCards(defaults);
                }
            } catch (err) {
                console.error("Error cargando plantilla infográfica:", err);
            } finally {
                setLoading32(false);
            }
        };
        fetchData();
    }, []);

    const downloadPDF = async (customNombreArchivo) => {
        if (isGeneratingPdf) return;
        const isMobileMode = viewMode === "mobile" && !!mobilePage1Ref.current && !!mobilePage2Ref.current;
        const page1Element = isMobileMode ? mobilePage1Ref.current : page1Ref.current;
        const page2Element = isMobileMode ? mobilePage2Ref.current : page2Ref.current;
        if (!page1Element || !page2Element) return;

        const fechaEvento = (dia && mes && anio) ? `${dia}-${mes}-${anio}` : `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
        const rawSalonName = (headerData.companyName || companyName || "Recibo").replace(/<[^>]+>/g, "").trim();
        const suffix = isMobileMode ? " (Móvil)" : " (Infografía)";
        const finalFilename = customNombreArchivo || `LEER este contrato${suffix} - ${fechaEvento} - ${rawSalonName}.pdf`;

        setIsGeneratingPdf(true);
        const prevScrollY = typeof window !== "undefined" ? window.scrollY : 0;
        try {
            if (typeof window !== "undefined") {
                window.scrollTo(0, 0);
            }

            const loader = document.getElementById("app-initial-loader");
            if (loader) loader.style.display = "none";

            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            const imgs = Array.from(page1Element.querySelectorAll("img")).concat(
                Array.from(page2Element.querySelectorAll("img"))
            );
            await Promise.all(
                imgs.map((img) => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((res) => {
                        img.onload = res;
                        img.onerror = res;
                    });
                })
            );

            // Quitar temporalmente sombras y bordes redondeados en modo móvil para captura limpia al ras
            const prevStyles1 = {
                boxShadow: page1Element.style.boxShadow,
                borderRadius: page1Element.style.borderRadius,
                border: page1Element.style.border,
                margin: page1Element.style.margin,
            };
            const prevStyles2 = {
                boxShadow: page2Element.style.boxShadow,
                borderRadius: page2Element.style.borderRadius,
                border: page2Element.style.border,
                margin: page2Element.style.margin,
            };

            if (isMobileMode) {
                page1Element.style.boxShadow = "none";
                page1Element.style.borderRadius = "0";
                page1Element.style.border = "none";
                page1Element.style.margin = "0";

                page2Element.style.boxShadow = "none";
                page2Element.style.borderRadius = "0";
                page2Element.style.border = "none";
                page2Element.style.margin = "0";
            }

            // Opciones de captura optimizadas
            const canvasOptions1 = isMobileMode
                ? {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    scrollX: 0,
                    scrollY: 0,
                }
                : {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    width: 794,
                    windowWidth: 794,
                    scrollX: 0,
                    scrollY: 0,
                    x: 0,
                    y: 0,
                };

            const canvasOptions2 = isMobileMode
                ? {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    scrollX: 0,
                    scrollY: 0,
                }
                : {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    width: 794,
                    windowWidth: 794,
                    scrollX: 0,
                    scrollY: 0,
                    x: 0,
                    y: 0,
                };

            // Captura Página 1 (Optimizada a 2x y JPEG 0.90 para máxima nitidez de lectura)
            const canvas1 = await html2canvas(page1Element, canvasOptions1);

            // Captura Página 2
            const canvas2 = await html2canvas(page2Element, canvasOptions2);

            if (loader) loader.style.display = "";

            if (isMobileMode) {
                // Modo Móvil: Cada página del PDF adopta exactamente el ancho y alto proporcional del contenido móvil.
                // De este modo, en el celular el PDF ocupa el 100% del ancho de pantalla sin márgenes blancos a los lados.
                const pdfWidth = 210; // Ancho base de referencia (mm)
                const pdfHeight1 = (canvas1.height * pdfWidth) / canvas1.width;

                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: [pdfWidth, pdfHeight1],
                    compress: true,
                });

                const imgData1 = canvas1.toDataURL("image/jpeg", 0.90);
                pdf.addImage(imgData1, "JPEG", 0, 0, pdfWidth, pdfHeight1, undefined, "FAST");

                // Agregar Página 2 con su altura proporcional exacta
                const pdfHeight2 = (canvas2.height * pdfWidth) / canvas2.width;
                pdf.addPage([pdfWidth, pdfHeight2], "portrait");

                const imgData2 = canvas2.toDataURL("image/jpeg", 0.90);
                pdf.addImage(imgData2, "JPEG", 0, 0, pdfWidth, pdfHeight2, undefined, "FAST");

                pdf.save(finalFilename);
                setHasDownloaded(true);
            } else {
                // Modo Escritorio: 2 hojas A4 estándar (210 x 297 mm)
                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4",
                    compress: true,
                });

                const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
                const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

                const imgData1 = canvas1.toDataURL("image/jpeg", 0.90);
                pdf.addImage(imgData1, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

                pdf.addPage();
                const imgData2 = canvas2.toDataURL("image/jpeg", 0.90);
                pdf.addImage(imgData2, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

                pdf.save(finalFilename);
                setHasDownloaded(true);
            }
        } catch (error) {
            console.error("Error generando PDF infográfico:", error);
            alert("Hubo un error al generar el PDF. Por favor intentá nuevamente.");
        } finally {
            if (isMobileMode) {
                Object.assign(page1Element.style, prevStyles1);
                Object.assign(page2Element.style, prevStyles2);
            }
            if (typeof window !== "undefined") {
                window.scrollTo(0, prevScrollY);
            }
            setIsGeneratingPdf(false);
        }
    };

    const date = d.toLocaleDateString();

    // Cálculo del saldo restante
    const numTotal = parseFloat(importeTotal.toString().replace(/[^0-9.-]+/g, "")) || 0;
    const numSena = parseFloat(importe.toString().replace(/[^0-9.-]+/g, "")) || 0;
    const saldoRestante = numTotal > numSena ? numTotal - numSena : 0;

    // Auto-descarga automática tras concluir la carga de datos
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
            <InfograficoGlobalStyle />
            <PageContainer>
                {/* Barra de control superior */}
                <TopBar className="no-print">
                    <div className="left-controls">
                        <Link to="/admin?panel=recibos" className="back-btn">
                            ← Volver al Panel
                        </Link>

                        {/* Conmutador de modelo */}
                        <div className="model-toggle">
                            <span className="toggle-label">Modelo:</span>
                            <Link to="/templateRecibo" className="toggle-btn" title="Ver modelo clásico en 1 página Oficio">
                                📄 Clásico
                            </Link>
                            <span className="toggle-btn active" title="Modelo actual en 2 páginas estilo infografía">
                                📊 Infografía
                            </span>
                        </div>

                        {/* Conmutador de vista móvil vs hojas A4 */}
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
                                className={`toggle-btn ${viewMode === 'hojas' ? 'active' : ''}`}
                                onClick={() => setViewMode('hojas')}
                                title="Ver en 2 hojas A4 completas"
                            >
                                📄 Hojas
                            </button>
                        </div>
                    </div>

                    <div className="status-indicator">
                        {isGeneratingPdf ? (
                            <span style={{ color: "#d97706", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span className="spinner-mini"></span> Descargando recibo automáticamente...
                            </span>
                        ) : hasDownloaded ? (
                            <span style={{ color: "#059669" }}>
                                ✓ Recibo infográfico descargado automáticamente
                            </span>
                        ) : (
                            <span style={{ color: "#059669" }}>
                                ✓ Formato Infografía (2 páginas A4)
                            </span>
                        )}
                    </div>

                    <button
                        className="download-btn"
                        onClick={() => downloadPDF(nombreArchivo)}
                        disabled={isGeneratingPdf}
                    >
                        📄 {isGeneratingPdf ? "Descargando..." : hasDownloaded ? "Descargar de nuevo" : "Descargar Recibo PDF"}
                    </button>
                </TopBar>

                <ViewerContainer $isMobile={viewMode === 'mobile'}>
                    {/* Vista Móvil Nativa (100% responsive, tarjetas verticales legibles) */}
                    {viewMode === 'mobile' && (
                        <MobileInfograficoWrapper className="no-print">
                            {/* PÁGINA 1: GUÍA DE CONVIVENCIA Y NORMAS */}
                            <div className="mobile-infografico-card mobile-page-1" ref={mobilePage1Ref}>
                                {/* Header móvil con Logo y Títulos */}
                                <div className="mobile-header">
                                    <div className="brand-box">
                                        {fotoLogo ? (
                                            <img src={fotoLogo} className="brand-logo" crossOrigin="anonymous" alt="Logo" />
                                        ) : (
                                            <div className="brand-logo-fallback">EPS</div>
                                        )}
                                        <div>
                                            <h2 className="brand-name">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(headerData.companyName || companyName || "Salón Magic Eventos") }} />
                                            </h2>
                                            <span className="brand-subtitle">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(headerData.subtitle1 || "GUÍA DE CONVIVENCIA Y CONDICIONES DEL SERVICIO") }} />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de Contacto / Dirección */}
                                <div className="mobile-contact-bar">
                                    <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(headerData.contactLine || "<strong>Dirección:</strong> Av. Corrientes 1234, CABA | <strong>WhatsApp/Cel:</strong> 11-0000-0000") }} />
                                </div>

                                <div className="mobile-cards-feed">
                                    {cards.map((card, idx) => {
                                        const cardColor = card.color || "#2563eb";
                                        const cardBg = getCardBgColor(cardColor);

                                        return (
                                            <div
                                                key={card.id || idx}
                                                className="mobile-info-card"
                                                style={{
                                                    borderLeftColor: cardColor,
                                                    backgroundColor: cardBg
                                                }}
                                            >
                                                <div className="mobile-card-header">
                                                    <div className="mobile-card-icon" style={{ backgroundColor: cardColor }}>
                                                        <ReceiptIcon name={card.icon} size={20} strokeWidth={2.2} />
                                                    </div>
                                                    <h4 className="mobile-card-title" style={{ color: cardColor }}>
                                                        <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(card.title) }} />
                                                    </h4>
                                                </div>

                                                <ul className="mobile-card-list">
                                                    {card.items && card.items.map((item, itemIdx) => (
                                                        <li key={itemIdx} className="mobile-card-item">
                                                            <span className="bullet-dot" style={{ backgroundColor: cardColor }}></span>
                                                            <div className="item-text">
                                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(item) }} />
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer Página 1 */}
                                <div className="mobile-footer">
                                    <div className="footer-content">
                                        <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(headerData.footerLine || "Salón Magic Eventos • Av. Corrientes 1234, CABA • WhatsApp/Cel: 11-0000-0000") }} />
                                    </div>
                                    <div className="footer-page-num">Página 1 de 2</div>
                                </div>
                            </div>

                            {/* PÁGINA 2: DETALLE DE LA RESERVA Y CONTRATO */}
                            <div className="mobile-infografico-card mobile-page-2" ref={mobilePage2Ref}>
                                {/* Header móvil Página 2 */}
                                <div className="mobile-header">
                                    <div className="brand-box">
                                        {fotoLogo ? (
                                             <img src={fotoLogo} className="brand-logo" crossOrigin="anonymous" alt="Logo" />
                                        ) : (
                                            <div className="brand-logo-fallback">EPS</div>
                                        )}
                                        <div>
                                            <h2 className="brand-name">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(headerData.companyName || companyName || "Salón Magic Eventos") }} />
                                            </h2>
                                            <span className="brand-subtitle">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(headerData.subtitle2 || "CONSTANCIA DE SEÑA Y COMPROMISO DE RESERVA") }} />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de Contacto / Dirección */}
                                <div className="mobile-contact-bar">
                                    <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(headerData.contactLine || "<strong>Dirección:</strong> Av. Corrientes 1234, CABA | <strong>WhatsApp/Cel:</strong> 11-0000-0000") }} />
                                </div>

                                <div className="mobile-reservation-card">
                                    <div className="reservation-top-meta">
                                        <div className="meta-item">
                                            <span className="meta-label">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.labelLugarFecha || "Lugar y Fecha:") }} />
                                            </span>
                                            <span className="meta-value">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue2 || "Buenos Aires") }} />, {date}
                                            </span>
                                        </div>
                                        <div className="meta-item client-highlight">
                                            <span className="meta-label">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.labelCliente || "Cliente:") }} />
                                            </span>
                                            <span className="meta-value client-name">{nombre || "Sin nombre registrado"}</span>
                                        </div>
                                    </div>

                                    {/* Cuadrícula de montos */}
                                    <div className="amounts-grid">
                                        <div className="amount-box highlight-green">
                                            <span className="box-title">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.labelSena || "Seña Abonada") }} />
                                            </span>
                                            <span className="box-value">${importe || "0"}</span>
                                        </div>

                                        <div className="amount-box highlight-blue">
                                            <span className="box-title">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.labelFechaEvento || "Fecha del Evento") }} />
                                            </span>
                                            <span className="box-value">{dia || "__"}-{mes || "__"}-{anio || "____"}</span>
                                        </div>

                                        <div className="amount-box">
                                            <span className="box-title">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.labelPagoTotal || "Total Pactado") }} />
                                            </span>
                                            <span className="box-value">${importeTotal || "0"}-.</span>
                                        </div>

                                        {saldoRestante > 0 && (
                                            <div className="amount-box highlight-saldo">
                                                <span className="box-title">Saldo al Ingreso</span>
                                                <span className="box-value">${saldoRestante.toLocaleString('es-AR')}-.</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Cláusulas contractuales */}
                                    <div className="mobile-clauses-box">
                                        {inputValue6 && (
                                            <div className="clause-paragraph" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue6) }} />
                                        )}
                                        {inputValue21 && (
                                            <div className="clause-paragraph" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue21) }} />
                                        )}
                                        {inputValue22 && (
                                            <div className="clause-paragraph clause-bold" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue22) }} />
                                        )}

                                        {/* Alerta de Seña no Reembolsable */}
                                        {inputValue5 && (
                                            <div className="mobile-alert-refund">
                                                <span className="alert-icon">⚠️</span>
                                                <div className="alert-text" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue5) }} />
                                            </div>
                                        )}

                                        {/* Disclaimer de Precios */}
                                        <div className="prices-disclaimer" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.disclaimer || 'Precios y servicios fijados según la lista de precios oficial vigente al momento de la contratación. Podés consultarla en <a href="/precios" target="_blank" rel="noopener noreferrer">nuestra lista de precios online</a>.') }} />
                                    </div>

                                    {/* Firmas */}
                                    <div className="mobile-signatures-row">
                                        {contractData.showClientSignature !== false && (
                                            <div className="mobile-signature-box">
                                                <span className="sign-line"></span>
                                                <span className="sign-title">
                                                    <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.signClientTitle || "Firma y Aclaración del Cliente") }} />
                                                </span>
                                                <div className="sign-meta-client">
                                                    <span>{contractData.signClientDni || "DNI:"} {cuit || "________"}</span>
                                                    <span>{contractData.signClientTel || "Tel: ________"}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mobile-signature-box">
                                            <div className="sign-cursive" dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue24 || "Administración") }} />
                                            <span className="sign-line"></span>
                                            <span className="sign-title">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.signSalonTitle || (headerData.companyName || companyName || "Salón Magic Eventos").replace(/<[^>]+>/g, '').trim()) }} />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Página 2 */}
                                <div className="mobile-footer">
                                    <div className="footer-content">
                                        <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(headerData.footerLine || "Salón Magic Eventos • Av. Corrientes 1234, CABA • WhatsApp/Cel: 11-0000-0000") }} />
                                    </div>
                                    <div className="footer-page-num">Página 2 de 2</div>
                                </div>
                            </div>

                            {/* Botón grande para descargar PDF oficial (fuera de las páginas capturadas) */}
                            <div className="mobile-download-action">
                                <button
                                    type="button"
                                    className="btn-download-mobile"
                                    onClick={() => downloadPDF(nombreArchivo)}
                                    disabled={isGeneratingPdf}
                                >
                                    📄 {isGeneratingPdf ? 'Generando PDF...' : hasDownloaded ? 'Descargar Recibo de nuevo' : 'Descargar Recibo en PDF (2 páginas)'}
                                </button>
                                <p className="mobile-download-hint">
                                    Se descargará el formato infográfico móvil de 2 páginas de alta definición listo para guardar o reenviar por WhatsApp.
                                </p>
                            </div>
                        </MobileInfograficoWrapper>
                    )}

                    {/* Contenedor del documento imprimible en 2 hojas A4 */}
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
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '32px',
                                      width: '100%',
                                  }
                        }
                    >
                        {/* ========================================================================= */}
                        {/* ====== PÁGINA 1: GUÍA COMPLETA DE CONVIVENCIA Y CONDICIONES DEL SERVICIO ====== */}
                        {/* ========================================================================= */}
                        <SheetPage id="recibo-infografico-page1" ref={page1Ref}>
                        {/* Encabezado Principal Página 1 (Simulación exacta de espacios) */}
                        <HeaderBlock>
                            <div className="logo-box">
                                {fotoLogo ? (
                                    <img src={fotoLogo} className="logo-img" crossOrigin="anonymous" alt="Logo" />
                                ) : (
                                    <div className="logo-fallback">Salón Magic Eventos</div>
                                )}
                            </div>
                            <div className="title-box">
                                <h1 className="main-title">
                                    <div className="editable-text-display simulated-editable">
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: cleanAndFormatHtml(headerData.companyName || companyName || "Salón Magic Eventos")
                                            }}
                                        />
                                    </div>
                                </h1>
                                <h2 className="sub-title">
                                    <div className="editable-text-display simulated-editable">
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: cleanAndFormatHtml(headerData.subtitle1 || "GUÍA DE CONVIVENCIA Y CONDICIONES DEL SERVICIO")
                                            }}
                                        />
                                    </div>
                                </h2>
                                <div className="contact-line">
                                    <div className="editable-text-display simulated-editable">
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: cleanAndFormatHtml(headerData.contactLine || "<strong>Dirección:</strong> Av. Corrientes 1234, CABA &nbsp;|&nbsp; <strong>WhatsApp/Cel:</strong> 11-0000-0000 (Atención al Cliente)")
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </HeaderBlock>

                        {/* Tarjetas dinámicas con simulación idéntica de renglones y márgenes */}
                        <div className="cards-wrapper">
                            {cards.map((card, idx) => {
                                const cardColor = card.color || "#2563eb";
                                const cardBg = getCardBgColor(cardColor);

                                return (
                                    <InfoCard
                                        key={card.id || idx}
                                        $borderColor={cardColor}
                                        $bgColor={cardBg}
                                    >
                                        <div className="icon-col" style={{ backgroundColor: cardColor }}>
                                            <div className="icon-inner">
                                                <ReceiptIcon name={card.icon} size={28} strokeWidth={2.1} />
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            {/* Cabecera idéntica en altura a la del editor */}
                                            <div className="card-top-bar">
                                                <h3 className="card-title" style={{ color: cardColor }}>
                                                    <div className="editable-text-display simulated-editable">
                                                        <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(card.title) }} />
                                                    </div>
                                                </h3>
                                            </div>

                                            {/* Renglones con el mismo padding exacto que el editor */}
                                            <ul className="bullet-list">
                                                {card.items && card.items.map((item, itemIdx) => (
                                                    <li key={itemIdx} className="bullet-item-row">
                                                        <div className="bullet-item-text">
                                                            <div className="editable-text-display simulated-editable">
                                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(item) }} />
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </InfoCard>
                                );
                            })}
                        </div>

                        {/* Pie de Página 1 */}
                        <PageFooter>
                            <div className="footer-left">
                                <div className="editable-text-display simulated-editable">
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: cleanAndFormatHtml(headerData.footerLine || "Salón Magic Eventos • Av. Corrientes 1234, CABA • WhatsApp/Cel: 11-0000-0000")
                                        }}
                                    />
                                </div>
                            </div>
                            <span className="footer-right">Página 1 de 2</span>
                        </PageFooter>
                    </SheetPage>

                    {/* ========================================================================= */}
                    {/* ====== PÁGINA 2: CONSTANCIA DE SEÑA, CONDICIONES LEGALES Y FIRMAS ====== */}
                    {/* ========================================================================= */}
                    <SheetPage id="recibo-infografico-page2" ref={page2Ref}>
                        {/* Encabezado Principal Página 2 */}
                        <HeaderBlock>
                            <div className="logo-box">
                                {fotoLogo ? (
                                    <img src={fotoLogo} className="logo-img" crossOrigin="anonymous" alt="Logo" />
                                ) : (
                                    <div className="logo-fallback">Salón Magic Eventos</div>
                                )}
                            </div>
                            <div className="title-box">
                                <h1 className="main-title">
                                    <div className="editable-text-display simulated-editable">
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: cleanAndFormatHtml(headerData.companyName || companyName || "Salón Magic Eventos")
                                            }}
                                        />
                                    </div>
                                </h1>
                                <h2 className="sub-title">
                                    <div className="editable-text-display simulated-editable">
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: cleanAndFormatHtml(headerData.subtitle2 || "CONSTANCIA DE SEÑA Y COMPROMISO DE RESERVA")
                                            }}
                                        />
                                    </div>
                                </h2>
                                <div className="contact-line">
                                    <div className="editable-text-display simulated-editable">
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: cleanAndFormatHtml(headerData.contactLine || "<strong>Dirección:</strong> Av. Corrientes 1234, CABA &nbsp;|&nbsp; <strong>WhatsApp/Cel:</strong> 11-0000-0000 (Atención al Cliente)")
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </HeaderBlock>

                        <div className="cards-wrapper" style={{ justifyContent: "flex-start", gap: "14px" }}>
                            {/* Bloque Principal del Contrato y Recibo */}
                            <ContractCard>
                                <div className="contract-header-badge">
                                    <span className="badge-icon">📋</span>
                                    <div className="editable-text-display simulated-editable" style={{ flex: 1 }}>
                                        <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.badgeTitle || "DETALLE DE LA RESERVA Y CONDICIONES DE CONTRATACIÓN") }} />
                                    </div>
                                </div>

                                {/* Tabla de Datos del Evento y Pagos */}
                                <div className="receipt-data-row">
                                    <div className="data-item">
                                        <span className="data-label">
                                            <div className="editable-text-display simulated-editable">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.labelLugarFecha || "Lugar y Fecha:") }} />
                                            </div>
                                        </span>
                                        <span className="data-value" style={{ display: "inline-block" }}>
                                            <div className="editable-text-display simulated-editable" style={{ display: "inline" }}>
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue2 || "Buenos Aires") }} />
                                            </div>
                                        </span>
                                        <span className="data-insert">{", "}{date}</span>
                                    </div>
                                    <div className="data-item">
                                        <span className="data-label">
                                            <div className="editable-text-display simulated-editable">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.labelCliente || "Cliente:") }} />
                                            </div>
                                        </span>
                                        <strong className="data-insert">{nombre || "___________________"}</strong>
                                    </div>
                                    <div className="data-item">
                                        <span className="data-label">
                                            <div className="editable-text-display simulated-editable">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.labelFechaEvento || "Fecha del Evento:") }} />
                                            </div>
                                        </span>
                                        <strong className="data-insert">{dia || "__"}-{mes || "__"}-{anio || "____"}</strong>
                                    </div>
                                    <div className="data-item highlight-sena">
                                        <span className="data-label">
                                            <div className="editable-text-display simulated-editable">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.labelSena || "Seña Abonada:") }} />
                                            </div>
                                        </span>
                                        <strong className="data-insert">${importe || "0"}</strong>
                                    </div>
                                    <div className="data-item">
                                        <span className="data-label">
                                            <div className="editable-text-display simulated-editable">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.labelPagoTotal || "Pagó en total:") }} />
                                            </div>
                                        </span>
                                        <strong className="data-insert">${importeTotal || "0"}-.</strong>
                                    </div>
                                </div>

                                {/* Texto y Cláusulas Contractuales */}
                                <div className="contract-text">
                                    <div className="clause-item">
                                        <div className="editable-text-display simulated-editable">
                                            <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue6) }} />
                                        </div>
                                    </div>

                                    <div className="clause-item">
                                        <div className="editable-text-display simulated-editable">
                                            <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue21) }} />
                                        </div>
                                    </div>

                                    <div className="clause-item clause-bold">
                                        <div className="editable-text-display simulated-editable">
                                            <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue22) }} />
                                        </div>
                                    </div>

                                    {/* Alerta de Seña no Reembolsable */}
                                    <div className="alert-refund-box">
                                        <span className="alert-icon">⚠️</span>
                                        <div style={{ flex: 1 }}>
                                            <div className="editable-text-display simulated-editable">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue5) }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="prices-disclaimer">
                                        <div className="editable-text-display simulated-editable">
                                            <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.disclaimer || 'Precios y servicios fijados según la lista de precios oficial vigente al momento de la contratación. Podés consultarla en <a href="/precios" target="_blank" rel="noopener noreferrer">nuestra lista de precios online</a>.') }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Firmas */}
                                <div
                                    className="signatures-row"
                                    style={{
                                        justifyContent: contractData.showClientSignature !== false ? "space-between" : "flex-end"
                                    }}
                                >
                                    {contractData.showClientSignature !== false && (
                                        <div className="signature-box">
                                            <div className="sign-line"></div>
                                            <div className="sign-title">
                                                <div className="editable-text-display simulated-editable">
                                                    <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.signClientTitle || "Firma y Aclaración del Cliente") }} />
                                                </div>
                                            </div>
                                            <div className="sign-meta" style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: "4px" }}>
                                                <span className="sign-meta-label">
                                                    <div className="editable-text-display simulated-editable">
                                                        <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.signClientDni || "DNI:") }} />
                                                    </div>
                                                </span>
                                                <span>{cuit || "_________________"} &nbsp;&nbsp;&nbsp;</span>
                                                <span className="sign-meta-label">
                                                    <div className="editable-text-display simulated-editable">
                                                        <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.signClientTel || "Tel: _________________") }} />
                                                    </div>
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="signature-box">
                                        <div className="sign-line"></div>
                                        <div className="sign-title">
                                            <div className="editable-text-display simulated-editable">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(contractData.signSalonTitle || (headerData.companyName || companyName || "Salón Magic Eventos").replace(/<[^>]+>/g, '').trim()) }} />
                                            </div>
                                        </div>
                                        <div className="sign-meta sign-cursive">
                                            <div className="editable-text-display simulated-editable">
                                                <span dangerouslySetInnerHTML={{ __html: cleanAndFormatHtml(inputValue24 || "Administración") }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ContractCard>
                        </div>

                        {/* Pie de Página 2 */}
                        <PageFooter>
                            <div className="footer-left">
                                <div className="editable-text-display simulated-editable">
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: cleanAndFormatHtml(headerData.footerLine || "Salón Magic Eventos • Av. Corrientes 1234, CABA • WhatsApp/Cel: 11-0000-0000")
                                        }}
                                    />
                                </div>
                            </div>
                            <span className="footer-right">Página 2 de 2</span>
                        </PageFooter>
                    </SheetPage>
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
    font-size: 0.92rem;
    font-weight: 600;
    padding: 7px 12px;
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
      color: #1d4ed8;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    &:hover:not(.active) {
      color: #111827;
    }
  }

  .status-indicator {
    font-size: 0.92rem;
    font-weight: 500;
  }

  .download-btn {
    background-color: #1d4ed8;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.$isMobile ? '0' : '32px'};
  width: 100%;
  overflow-x: ${props => props.$isMobile ? 'hidden' : 'auto'};
  padding: ${props => props.$isMobile ? '12px 10px 30px' : '30px 0'};
  box-sizing: border-box;

  @media print {
    padding: 0 !important;
    overflow: visible !important;
    display: block !important;
  }
`;

const SheetPage = styled.div`
  width: 794px;
  min-width: 794px;
  max-width: 794px;
  min-height: 1123px; /* A4 exacto a 96 DPI: 210 x 297 mm */
  margin: 0 auto;
  background-color: #ffffff;
  color: #111111;
  font-family: 'product_sansregular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 22px 28px 18px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  position: relative;
  line-height: 1.35;
  overflow-wrap: break-word;
  word-break: break-word;

  p, span, li, div, h1, h2, h3, h4 {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .cards-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    margin-top: 8px;
    margin-bottom: 8px;
  }
`;

const HeaderBlock = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #2563eb;

  .logo-box {
    width: 95px;
    height: 56px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px;
    background: #ffffff;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .logo-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .logo-fallback {
    font-family: 'playlistscript', cursive;
    font-size: 1.15rem;
    color: #1e3a8a;
    text-align: center;
  }

  .title-box {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .main-title,
  .main-title .editable-text-display,
  .main-title .editable-text-display p,
  .main-title .editable-text-display span {
    font-family: 'playlistscript', cursive !important;
    font-size: 31px;
    font-weight: normal;
    color: #1e3a8a;
    margin: 0;
    line-height: 1.05;
    letter-spacing: normal;
  }

  .main-title .editable-text-display p {
    display: inline;
    margin: 0;
  }

  .sub-title,
  .sub-title .editable-text-display,
  .sub-title .editable-text-display p,
  .sub-title .editable-text-display span {
    font-size: 12.6px;
    font-weight: 700;
    color: #2563eb;
    margin: 2px 0 2px 0;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    line-height: 1.25;
  }

  .sub-title .editable-text-display p {
    display: inline;
    margin: 0;
  }

  .contact-line,
  .contact-line .editable-text-display,
  .contact-line .editable-text-display p,
  .contact-line .editable-text-display span {
    font-size: 12.1px;
    color: #4b5563;
    margin: 0;
    line-height: 1.3;
  }

  .contact-line .editable-text-display p {
    display: inline;
    margin: 0;
  }
`;

const InfoCard = styled.div`
  display: flex;
  border: 1.5px solid ${props => props.$borderColor || '#2563eb'};
  border-radius: 7px;
  background-color: ${props => props.$bgColor || '#ffffff'};
  overflow: hidden;
  box-sizing: border-box;

  .icon-col {
    width: 66px;
    min-width: 66px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    padding: 8px;
    box-sizing: border-box;

    .icon-inner {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .card-body {
    flex: 1;
    min-width: 0;
    padding: 6px 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
  }

  .card-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3px;
    gap: 8px;
    min-height: 22px;
  }

  .card-title {
    font-size: 12.1px;
    font-weight: 800;
    margin: 0;
    letter-spacing: 0.2px;
    line-height: 1.22;
    flex: 1;
    min-width: 0;

    p {
      margin: 0;
      display: inline;
    }
  }

  .bullet-list {
    margin: 0;
    padding-left: 15px;
    list-style-type: disc;

    .bullet-item-row {
      font-size: 11.2px;
      color: #1f2937;
      line-height: 1.34;
      margin-bottom: 3px;
      word-break: break-word;
      overflow-wrap: break-word;
      position: relative;
      padding-right: 18px;
      box-sizing: border-box;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .bullet-item-text {
      width: 100%;
    }
  }

  /* Estilos para el texto enriquecido de Quill idénticos al editor */
  .editable-text-display {
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    font-size: 11.2px;
    line-height: 1.34;
    color: #1f2937;
    box-sizing: border-box;

    &.simulated-editable {
      padding: 1px 0;
    }

    p {
      margin: 0 0 2px 0;
      display: block;
      line-height: 1.34;
      word-break: break-word;
      overflow-wrap: break-word;

      &:last-child {
        margin-bottom: 0;
      }
    }

    strong, b {
      font-weight: 700;
    }

    .ql-size-small, span.ql-size-small, p.ql-size-small {
      font-size: 0.75em !important;
    }
    .ql-size-large, span.ql-size-large, p.ql-size-large {
      font-size: 1.45em !important;
    }
    .ql-size-huge, span.ql-size-huge, p.ql-size-huge {
      font-size: 2.0em !important;
    }
  }
`;

const ContractCard = styled.div`
  border: 1.5px solid #374151;
  border-radius: 8px;
  padding: 12px 16px;
  background-color: #ffffff;
  box-sizing: border-box;

  .contract-header-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13.2px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 10px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    border-bottom: 1.5px solid #e5e7eb;
    padding-bottom: 6px;

    .badge-icon {
      font-size: 16.5px;
    }

    .editable-text-display {
      font-size: inherit;
      font-weight: inherit;
      color: inherit;
      letter-spacing: inherit;
      text-transform: inherit;
      min-height: auto !important;
      padding: 0 2px !important;
    }
    .editable-text-display p {
      margin: 0;
      display: inline;
    }
  }

  .receipt-data-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 6px 12px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 12px;
    font-size: 12.1px;

    .data-item {
      color: #374151;
      line-height: 1.35;
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 2px;

      .data-label {
        font-weight: 600;
        color: #111827;
        display: inline-flex;
        align-items: baseline;

        .editable-text-display {
          display: inline-block;
          min-height: auto !important;
          padding: 0 2px !important;
          line-height: inherit;
          font-weight: 600;
        }
        .editable-text-display p {
          display: inline;
          margin: 0;
        }
      }

      .data-value {
        display: inline-flex;
        align-items: baseline;
        .editable-text-display {
          display: inline-block;
          min-height: auto !important;
          padding: 0 2px !important;
          line-height: inherit;
        }
        .editable-text-display p {
          display: inline;
          margin: 0;
        }
      }

      .data-insert {
        display: inline-block;
      }

      &.highlight-sena {
        color: #047857;
        strong {
          background-color: #d1fae5;
          padding: 1px 6px;
          border-radius: 4px;
          color: #065f46;
        }
      }
      &.highlight-saldo {
        color: #1e40af;
        strong {
          background-color: #dbeafe;
          padding: 1px 6px;
          border-radius: 4px;
          color: #1e3a8a;
        }
      }
    }
  }

  .contract-text {
    font-size: 11.2px;
    color: #374151;
    line-height: 1.38;
    word-break: break-word;
    overflow-wrap: break-word;

    .clause-item {
      margin-bottom: 6px;
      word-break: break-word;
      overflow-wrap: break-word;
      white-space: normal;

      .editable-text-display p {
        margin: 0 0 3px 0;
        display: block;
        line-height: 1.38;
        word-break: break-word;
        overflow-wrap: break-word;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .clause-bold {
      font-weight: 600;
      color: #1f2937;
    }

    .alert-refund-box {
      margin: 8px 0;
      padding: 6px 10px;
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      border-radius: 0 4px 4px 0;
      color: #991b1b;
      font-weight: 700;
      font-size: 11.6px;
      display: flex;
      align-items: center;
      gap: 8px;

      .alert-icon {
        font-size: 17px;
      }
      p {
        margin: 0;
      }
    }

    .prices-disclaimer {
      font-style: italic;
      color: #6b7280;
      margin: 6px 0 0 0;
      font-size: 10.7px;

      .editable-text-display {
        display: inline-block;
        min-height: auto !important;
        padding: 0 2px !important;
      }
      .editable-text-display p {
        margin: 0;
        display: inline;
      }

      a {
        color: #2563eb;
        text-decoration: none;
      }
    }
  }

  .signatures-row {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
    padding: 0 16px;

    .signature-box {
      width: 42%;
      text-align: center;
      font-size: 10.5px;
    }

    .sign-line {
      border-top: 1px solid #374151;
      margin-bottom: 5px;
      width: 100%;
    }

    .sign-title {
      font-weight: 700;
      color: #111827;
      margin-bottom: 2px;

      .editable-text-display {
        display: inline-block;
        min-height: auto !important;
        padding: 0 2px !important;
        font-weight: 700;
      }
      .editable-text-display p {
        display: inline;
        margin: 0;
      }
    }

    .sign-meta {
      color: #4b5563;
      font-size: 11px;

      .sign-meta-label .editable-text-display {
        display: inline-block;
        min-height: auto !important;
        padding: 0 2px !important;
      }
      .sign-meta-label .editable-text-display p {
        display: inline;
        margin: 0;
      }
    }

    .sign-cursive {
      font-family: 'playlistscript', cursive;
      font-size: 1.52rem;
      color: #111827;
      font-weight: bold;
    }
  }
`;

const PageFooter = styled.footer`
  border-top: 1px solid #e5e7eb;
  padding-top: 6px;
  display: flex;
  justify-content: space-between;
  font-size: 11.1px;
  color: #6b7280;

  .footer-left {
    font-weight: 500;
    flex: 1;
    margin-right: 12px;
  }

  .footer-right {
    font-weight: 600;
    color: #4b5563;
    flex-shrink: 0;
  }
`;

const MobileInfograficoWrapper = styled.div`
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  padding: 0 4px;
  box-sizing: border-box;

  .mobile-infografico-card {
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
    margin-bottom: 24px;
  }

  p, span, li, div, h2, h3, h4 {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .mobile-header {
    background-color: #1e3a8a;
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
    width: 38px;
    height: 38px;
    object-fit: contain;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.95);
    padding: 3px;
  }

  .brand-logo-fallback {
    width: 38px;
    height: 38px;
    border-radius: 8px;
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
    font-size: 1.6rem;
    color: #ffffff;
    line-height: 1.1;

    p {
      margin: 0;
      display: inline;
    }
  }

  .brand-subtitle {
    font-size: 0.74rem;
    opacity: 0.92;
    display: block;
    margin-top: 3px;
    font-weight: 600;
    letter-spacing: 0.4px;
    text-transform: uppercase;

    p {
      margin: 0;
      display: inline;
    }
  }

  .receipt-tag {
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: rgba(255, 255, 255, 0.22);
    padding: 5px 12px;
    border-radius: 9999px;
    color: #ffffff;
    white-space: nowrap;
  }

  .mobile-contact-bar {
    background: #f0f9ff;
    padding: 10px 16px;
    font-size: 0.82rem;
    color: #0369a1;
    border-bottom: 1px solid #e0f2fe;
    line-height: 1.45;
    text-align: center;

    p {
      margin: 0;
      display: inline;
    }
  }

  .mobile-section-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 20px 8px 20px;

    .section-icon {
      font-size: 1.25rem;
    }

    h3 {
      font-size: 1.1rem;
      font-weight: 800;
      color: #111827;
      margin: 0;
    }
  }

  /* Feed de tarjetas de la Página 1 */
  .mobile-cards-feed {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mobile-info-card {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    border-left-width: 6px;
    padding: 14px 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    box-sizing: border-box;
  }

  .mobile-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .mobile-card-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    flex-shrink: 0;
  }

  .mobile-card-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1.2;

    p {
      margin: 0;
      display: inline;
    }
  }

  .mobile-card-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mobile-card-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.92rem;
    line-height: 1.5;
    color: #374151;

    .bullet-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-top: 7px;
      flex-shrink: 0;
    }

    .item-text {
      flex: 1;
      p {
        margin: 0;
      }
    }
  }

  /* Sección de Reserva y Pagos (Página 2) */
  .mobile-reservation-card {
    padding: 16px 20px;
    background: #ffffff;
    border-top: 1px solid #f3f4f6;
  }

  .reservation-top-meta {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .meta-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.88rem;
    color: #4b5563;
    flex-wrap: wrap;
    gap: 4px;

    p {
      margin: 0;
      display: inline;
    }
  }

  .meta-label {
    font-weight: 600;
    color: #6b7280;
  }

  .meta-value {
    font-weight: 700;
    color: #111827;
  }

  .client-highlight {
    padding-top: 6px;
    border-top: 1px dashed #e5e7eb;

    .client-name {
      font-size: 1.1rem;
      color: #1d4ed8;
    }
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

      p {
        margin: 0;
        display: inline;
      }
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

  .mobile-clauses-box {
    margin-bottom: 16px;
  }

  .clause-paragraph {
    font-size: 0.9rem;
    line-height: 1.55;
    color: #374151;
    margin-bottom: 10px;

    p {
      margin: 0;
    }
  }

  .clause-bold {
    font-weight: 700;
    color: #111827;
    background: #f9fafb;
    padding: 8px 12px;
    border-radius: 8px;
    border-left: 3px solid #1d4ed8;
  }

  .mobile-alert-refund {
    margin: 14px 0;
    padding: 12px 14px;
    border-radius: 10px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    display: flex;
    gap: 10px;
    align-items: flex-start;

    .alert-icon {
      font-size: 1.25rem;
      line-height: 1.2;
    }

    .alert-text {
      font-size: 0.88rem;
      font-weight: 600;
      color: #92400e;
      line-height: 1.45;

      p {
        margin: 0;
      }
    }
  }

  .prices-disclaimer {
    font-size: 0.82rem;
    color: #6b7280;
    line-height: 1.45;
    margin-top: 10px;
    font-style: italic;

    a {
      color: #2563eb;
      text-decoration: underline;
    }

    p {
      margin: 0;
      display: inline;
    }
  }

  .mobile-signatures-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 16px;
    border-top: 1px dashed #e5e7eb;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .mobile-signature-box {
    text-align: center;
    flex: 1;
    min-width: 140px;
  }

  .sign-cursive {
    font-family: 'playlistscript', cursive;
    font-size: 1.65rem;
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

  .sign-title {
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
    font-weight: 700;

    p {
      margin: 0;
      display: inline;
    }
  }

  .sign-meta-client {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 3px;
  }

  .mobile-footer {
    padding: 14px 20px;
    background: #f9fafb;
    border-top: 1px solid #f3f4f6;
    text-align: center;
    font-size: 0.82rem;
    color: #6b7280;
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .footer-content {
      font-size: 0.8rem;
    }

    .footer-page-num {
      font-size: 0.74rem;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    p {
      margin: 0;
      display: inline;
    }
  }

  .mobile-download-action {
    padding: 20px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
    text-align: center;
    margin-bottom: 24px;

    .btn-download-mobile {
      width: 100%;
      background-color: #1d4ed8;
      color: #ffffff;
      border: none;
      padding: 15px 20px;
      font-size: 1.02rem;
      font-weight: 700;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(29, 78, 216, 0.25);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(29, 78, 216, 0.35);
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
