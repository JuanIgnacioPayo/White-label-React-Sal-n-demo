import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { app } from "../../firebase/firebase";
import { getDatabase, ref, get, update, set } from "firebase/database";
import { useAuth } from "../../contexts/authContext";
import { toast } from "react-toastify";
import RichEditableText from "../RichEditableText";
import IconPickerModal from "../Recibos/IconPickerModal";
import { uploadToFirebaseStorage } from "../../utils/storageUpload";
import {
    ReceiptIcon,
    PRESET_COLORS,
    getCardBgColor,
    getDefaultCards,
    normalizeCards,
    DEFAULT_CONTRACT_DATA
} from "../Recibos/receiptInfograficoUtils";

/**
 * Normaliza y limpia el HTML para evitar desbordes y espacios no divisibles
 */
const cleanAndFormatHtml = (rawContent) => {
    if (!rawContent) return "";
    let cleaned = rawContent
        .replace(/&nbsp;/g, " ")
        .replace(/\u00a0/g, " ");
    if (!cleaned.includes("<p>") && !cleaned.includes("<br") && cleaned.includes("\n")) {
        cleaned = cleaned
            .trim()
            .split(/\n\s*\n/)
            .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
            .join("");
    }
    return cleaned;
};

export default function FormPlantillaReciboInfografico(props) {
    const { currentUser } = useAuth();
    const toggleId = props.toggle || "32";

    const [fotoLogo, setFotoLogo] = useState("");
    const [companyName, setCompanyName] = useState("Salón Magic Eventos");
    const [loading, setLoading] = useState(true);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    // Referencias para selector de archivos de logo
    const logoInputRef1 = useRef(null);
    const logoInputRef2 = useRef(null);

    // Datos del encabezado y pie de página editables
    const [headerData, setHeaderData] = useState({
        companyName: "Salón Magic Eventos",
        subtitle1: "GUÍA DE CONVIVENCIA Y CONDICIONES DEL SERVICIO",
        subtitle2: "CONSTANCIA DE SEÑA Y COMPROMISO DE RESERVA",
        contactLine: "<strong>Dirección:</strong> Av. Corrientes 1234, CABA &nbsp;|&nbsp; <strong>WhatsApp/Cel:</strong> 11-0000-0000 (Atención al Cliente)",
        footerLine: "Salón Magic Eventos • Av. Corrientes 1234, CABA • WhatsApp/Cel: 11-0000-0000"
    });

    // Textos y etiquetas editables del contrato (Página 2)
    const [contractData, setContractData] = useState(DEFAULT_CONTRACT_DATA);

    // Lista dinámica de tarjetas de la infografía
    const [cards, setCards] = useState([]);

    // Modales y herramientas activas
    const [activeColorCardIdx, setActiveColorCardIdx] = useState(null);
    const [activeIconCardIdx, setActiveIconCardIdx] = useState(null);

    // Campos de contrato y legales (Página 2 y adicionales)
    const [inputValue1, setInputValue1] = useState("");
    const [inputValue2, setInputValue2] = useState("");
    const [inputValue3, setInputValue3] = useState("");
    const [inputValue4, setInputValue4] = useState("");
    const [inputValue5, setInputValue5] = useState("");
    const [inputValue6, setInputValue6] = useState("");
    const [inputValue7, setInputValue7] = useState("");
    const [inputValue21, setInputValue21] = useState("");
    const [inputValue22, setInputValue22] = useState("");
    const [inputValue23, setInputValue23] = useState("");
    const [inputValue24, setInputValue24] = useState("");

    // Cache de datos 32 para fallback
    const [cachedData32, setCachedData32] = useState({});

    // Cargar datos de la plantilla y configuración de tarjetas
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const db = getDatabase(app);

                // 1. Cargar datos clásicos de datosId/32
                const dbRef32 = ref(db, "datosId/" + toggleId);
                const snapshot32 = await get(dbRef32);
                let data32 = {};
                if (snapshot32.exists()) {
                    data32 = snapshot32.val();
                    setCachedData32(data32);
                    setInputValue1(data32.contenido1 || "");
                    setInputValue2(data32.contenido2 || "");
                    setInputValue3(data32.contenido3 || "");
                    setInputValue4(data32.contenido4 || "");
                    setInputValue5(data32.contenido5 || "");
                    setInputValue6(data32.contenido6 || "");
                    setInputValue7(data32.contenido7 || "");
                    setInputValue21(data32.contenido21 || "");
                    setInputValue22(data32.contenido22 || "");
                    setInputValue23(data32.contenido23 || "");
                    setInputValue24(data32.contenido24 || "");
                }

                // 2. Cargar logo institucional (datosId/28)
                const logoSnap = await get(ref(db, "datosId/28"));
                let defaultLogo = "";
                if (logoSnap.exists()) {
                    defaultLogo = logoSnap.val().foto30 || "";
                    setFotoLogo(defaultLogo);
                }

                // 3. Cargar nombre del salón (datosId/29)
                const companySnap = await get(ref(db, "datosId/29"));
                let defaultCompany = "Salón Magic Eventos";
                if (companySnap.exists()) {
                    defaultCompany = companySnap.val().contenido1 || "Salón Magic Eventos";
                    setCompanyName(defaultCompany);
                }

                // 4. Cargar datos estructurados de datosId/32_infografico
                const dbRefInfografico = ref(db, "datosId/" + toggleId + "_infografico");
                const snapshotInfografico = await get(dbRefInfografico);

                if (snapshotInfografico.exists()) {
                    const infoData = snapshotInfografico.val();
                    const normalized = normalizeCards(infoData.cards, data32);
                    setCards(normalized);

                    if (infoData.header) {
                        setHeaderData({
                            companyName: infoData.header.companyName || defaultCompany,
                            subtitle1: infoData.header.subtitle1 || "GUÍA DE CONVIVENCIA Y CONDICIONES DEL SERVICIO",
                            subtitle2: infoData.header.subtitle2 || "CONSTANCIA DE SEÑA Y COMPROMISO DE RESERVA",
                            contactLine: infoData.header.contactLine || "<strong>Dirección:</strong> Av. Corrientes 1234, CABA &nbsp;|&nbsp; <strong>WhatsApp/Cel:</strong> 11-0000-0000",
                            footerLine: infoData.header.footerLine || "Salón Magic Eventos • Av. Corrientes 1234, CABA • WhatsApp/Cel: 11-0000-0000"
                        });
                        if (infoData.header.logoUrl) {
                            setFotoLogo(infoData.header.logoUrl);
                        }
                    } else {
                        setHeaderData((prev) => ({
                            ...prev,
                            companyName: defaultCompany
                        }));
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
                    setHeaderData((prev) => ({
                        ...prev,
                        companyName: defaultCompany
                    }));
                }
            } catch (err) {
                console.error("Error cargando plantilla infográfica:", err);
                toast.error("Error al cargar la plantilla.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toggleId]);

    // Subir y actualizar el logo directamente desde la plantilla
    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!currentUser) {
            toast.error("Debes iniciar sesión para cambiar el logo.");
            return;
        }
        try {
            setIsUploadingLogo(true);
            toast.info("Subiendo nuevo logo institucional...");
            const downloadURL = await uploadToFirebaseStorage(file);

            const db = getDatabase(app);
            await update(ref(db, "datosId/28"), { foto30: downloadURL });
            await update(ref(db, `datosId/${toggleId}_infografico/header`), { logoUrl: downloadURL });

            setFotoLogo(downloadURL);
            toast.success("¡Logo institucional actualizado!");
        } catch (err) {
            console.error("Error al subir el logo:", err);
            toast.error("Hubo un error al subir el logo.");
        } finally {
            setIsUploadingLogo(false);
            if (e.target) e.target.value = "";
        }
    };

    // Guardar un campo del encabezado
    const handleSaveHeaderField = async (field, newValue) => {
        if (!currentUser) {
            toast.error("Debes iniciar sesión para editar.");
            return;
        }
        try {
            const cleaned = cleanAndFormatHtml(newValue);
            const updatedHeader = { ...headerData, [field]: cleaned };
            setHeaderData(updatedHeader);

            const db = getDatabase(app);
            const headerRef = ref(db, `datosId/${toggleId}_infografico/header`);
            await update(headerRef, { [field]: cleaned });

            if (field === "companyName") {
                const stripped = cleaned.replace(/<[^>]+>/g, "").trim();
                await update(ref(db, "datosId/29"), { contenido1: stripped });
                setCompanyName(stripped);
            }

            toast.success("Encabezado actualizado correctamente");
        } catch (err) {
            console.error(`Error guardando ${field}:`, err);
            toast.error("Error al actualizar el encabezado.");
        }
    };

    // Guardar un campo del contrato / recibo (Página 2)
    const handleSaveContractField = async (field, newValue) => {
        if (!currentUser) {
            toast.error("Debes iniciar sesión para editar.");
            return;
        }
        try {
            const cleaned = typeof newValue === "string" ? cleanAndFormatHtml(newValue) : newValue;
            const updatedContract = { ...contractData, [field]: cleaned };
            setContractData(updatedContract);

            const db = getDatabase(app);
            const contractRef = ref(db, `datosId/${toggleId}_infografico/contract`);
            await update(contractRef, { [field]: cleaned });

            toast.success("Contrato actualizado correctamente");
        } catch (err) {
            console.error(`Error guardando campo de contrato ${field}:`, err);
            toast.error("Error al guardar el campo del contrato.");
        }
    };

    // Guardar array de tarjetas completo en Firebase
    const saveCardsToFirebase = async (newCards) => {
        if (!currentUser) {
            toast.error("Debes iniciar sesión para editar.");
            return;
        }
        try {
            const db = getDatabase(app);
            const infograficoRef = ref(db, "datosId/" + toggleId + "_infografico");
            await update(infograficoRef, {
                cards: newCards,
                updatedAt: new Date().toISOString()
            });
            setCards(newCards);
        } catch (error) {
            console.error("Error al guardar tarjetas infográficas en Firebase:", error);
            toast.error("Error al guardar los cambios en la infografía.");
        }
    };

    // Modificar título de una tarjeta
    const handleSaveCardTitle = (cardIdx, newTitle) => {
        const cleaned = cleanAndFormatHtml(newTitle);
        const updated = [...cards];
        updated[cardIdx] = { ...updated[cardIdx], title: cleaned };
        saveCardsToFirebase(updated);
        toast.success("Título de tarjeta actualizado");
    };

    // Cambiar color temático de una tarjeta
    const handleChangeCardColor = (cardIdx, newColor) => {
        const updated = [...cards];
        updated[cardIdx] = { ...updated[cardIdx], color: newColor };
        saveCardsToFirebase(updated);
        toast.success(`Color actualizado a ${newColor}`);
    };

    // Cambiar ícono de una tarjeta
    const handleChangeCardIcon = (cardIdx, newIconId) => {
        const updated = [...cards];
        updated[cardIdx] = { ...updated[cardIdx], icon: newIconId };
        saveCardsToFirebase(updated);
        toast.success(`Ícono actualizado a ${newIconId}`);
    };

    // Guardar texto de un renglón específico
    const handleSaveRow = (cardIdx, rowIdx, newText) => {
        const cleaned = cleanAndFormatHtml(newText);
        const updated = [...cards];
        const newItems = [...(updated[cardIdx].items || [])];
        newItems[rowIdx] = cleaned;
        updated[cardIdx] = { ...updated[cardIdx], items: newItems };
        saveCardsToFirebase(updated);
        toast.success("Renglón actualizado");
    };

    // Agregar nuevo renglón a una tarjeta
    const handleAddRow = (cardIdx) => {
        const updated = [...cards];
        const newItems = [...(updated[cardIdx].items || [])];
        newItems.push("<p>Nuevo renglón editable...</p>");
        updated[cardIdx] = { ...updated[cardIdx], items: newItems };
        saveCardsToFirebase(updated);
        toast.success("➕ Renglón agregado a la tarjeta");
    };

    // Eliminar un renglón de una tarjeta
    const handleDeleteRow = (cardIdx, rowIdx) => {
        const updated = [...cards];
        const newItems = [...(updated[cardIdx].items || [])];
        newItems.splice(rowIdx, 1);
        updated[cardIdx] = { ...updated[cardIdx], items: newItems };
        saveCardsToFirebase(updated);
        toast.info("🗑️ Renglón eliminado");
    };

    // Mover renglón hacia arriba dentro de una tarjeta
    const handleMoveRowUp = (cardIdx, rowIdx) => {
        if (!currentUser || rowIdx <= 0) return;
        const updated = [...cards];
        const newItems = [...(updated[cardIdx].items || [])];
        const temp = newItems[rowIdx];
        newItems[rowIdx] = newItems[rowIdx - 1];
        newItems[rowIdx - 1] = temp;
        updated[cardIdx] = { ...updated[cardIdx], items: newItems };
        saveCardsToFirebase(updated);
        toast.success("Renglón movido hacia arriba");
    };

    // Mover renglón hacia abajo dentro de una tarjeta
    const handleMoveRowDown = (cardIdx, rowIdx) => {
        if (!currentUser) return;
        const currentItems = cards[cardIdx]?.items || [];
        if (rowIdx >= currentItems.length - 1) return;
        const updated = [...cards];
        const newItems = [...currentItems];
        const temp = newItems[rowIdx];
        newItems[rowIdx] = newItems[rowIdx + 1];
        newItems[rowIdx + 1] = temp;
        updated[cardIdx] = { ...updated[cardIdx], items: newItems };
        saveCardsToFirebase(updated);
        toast.success("Renglón movido hacia abajo");
    };

    // Agregar nueva tarjeta a la infografía
    const handleAddCard = () => {
        if (!currentUser) {
            toast.error("Debes iniciar sesión para editar.");
            return;
        }
        const newCardNumber = cards.length + 1;
        const newCard = {
            id: `card_${Date.now()}`,
            title: `${newCardNumber}. NUEVA TARJETA`,
            color: "#2563eb",
            icon: "Info",
            items: ["<p>Nuevo renglón editable...</p>"]
        };
        const updated = [...cards, newCard];
        saveCardsToFirebase(updated);
        toast.success("➕ Nueva tarjeta agregada a la infografía");
    };

    // Eliminar una tarjeta completa
    const handleDeleteCard = (cardIdx) => {
        if (!currentUser) {
            toast.error("Debes iniciar sesión para editar.");
            return;
        }
        const card = cards[cardIdx];
        const cardTitle = (card?.title || `Tarjeta ${cardIdx + 1}`).replace(/<[^>]+>/g, "").trim();
        const ok = window.confirm(`¿Estás seguro de que querés eliminar la tarjeta "${cardTitle}" de la infografía?`);
        if (!ok) return;
        const updated = [...cards];
        updated.splice(cardIdx, 1);
        saveCardsToFirebase(updated);
        toast.info("🗑️ Tarjeta eliminada");
    };

    // Mover tarjeta hacia arriba
    const handleMoveCardUp = (cardIdx) => {
        if (!currentUser || cardIdx <= 0) return;
        const updated = [...cards];
        const temp = updated[cardIdx];
        updated[cardIdx] = updated[cardIdx - 1];
        updated[cardIdx - 1] = temp;
        saveCardsToFirebase(updated);
        toast.success("Posición actualizada");
    };

    // Mover tarjeta hacia abajo
    const handleMoveCardDown = (cardIdx) => {
        if (!currentUser || cardIdx >= cards.length - 1) return;
        const updated = [...cards];
        const temp = updated[cardIdx];
        updated[cardIdx] = updated[cardIdx + 1];
        updated[cardIdx + 1] = temp;
        saveCardsToFirebase(updated);
        toast.success("Posición actualizada");
    };

    // Restablecer tarjetas a los valores predeterminados originales del salón
    const handleResetToDefault = () => {
        const ok = window.confirm(
            "¿Estás seguro de que querés restablecer las tarjetas a los valores originales predeterminados del salón? Se perderán las modificaciones personalizadas de colores, íconos y renglones."
        );
        if (!ok) return;
        const defaults = getDefaultCards(cachedData32);
        saveCardsToFirebase(defaults);
        toast.success("Tarjetas restablecidas a valores predeterminados.");
    };

    // Guardar campos de texto contractuales de la Página 2 (datosId/32)
    const handleSaveField = async (field, newValue, stateUpdater) => {
        if (!currentUser) {
            toast.error("Debes iniciar sesión para editar.");
            return;
        }
        try {
            const db = getDatabase(app);
            const dataRef = ref(db, "datosId/" + toggleId);
            const cleanValue = cleanAndFormatHtml(newValue);
            await update(dataRef, {
                [field]: cleanValue
            });
            stateUpdater(cleanValue);
            toast.success("Campo actualizado correctamente");
        } catch (error) {
            console.error(`Error al actualizar ${field}:`, error);
            toast.error("Error al actualizar el campo.");
        }
    };

    if (loading) {
        return (
            <LoadingBox>
                <div className="spinner"></div>
                <p>Cargando editor de recibo infográfico...</p>
            </LoadingBox>
        );
    }

    return (
        <EditorWrapper onClick={() => setActiveColorCardIdx(null)}>
            {/* Barra superior de ayuda */}
            <TopHelperBar onClick={(e) => e.stopPropagation()}>
                <div className="info-side">
                    <h3>Plantilla de Recibo Infográfico (Editor Visual 1:1)</h3>
                    <p>
                        Hacé <strong>doble clic</strong> sobre cualquier texto para editarlo. El botón <strong>➕ Renglón</strong> ahora se ubica en el mismo renglón que el título para ahorrar espacio vertical exacto.
                    </p>
                </div>
                <div className="action-side">
                    <button
                        type="button"
                        className="btn-add-card-top"
                        onClick={handleAddCard}
                        title="Agregar una nueva tarjeta a la infografía"
                    >
                        ➕ Agregar Tarjeta
                    </button>
                    <button
                        type="button"
                        className="btn-reset"
                        onClick={handleResetToDefault}
                        title="Restablecer las tarjetas a sus valores predeterminados"
                    >
                        ↺ Valores Predeterminados
                    </button>
                    <button
                        type="button"
                        className="btn-open-preview"
                        onClick={() => window.open("/templateReciboInfografia", "_blank", "noopener")}
                    >
                        ↗️ Ver Recibo Generado
                    </button>
                </div>
            </TopHelperBar>

            {/* Contenedor central de las 2 hojas A4 exactas */}
            <SheetsViewer>
                {/* ========================================================================= */}
                {/* ====== PÁGINA 1: GUÍA COMPLETA DE CONVIVENCIA Y CONDICIONES DEL SERVICIO ====== */}
                {/* ========================================================================= */}
                <SheetPage id="plantilla-infografico-page1">
                    {/* Encabezado Principal Página 1 (100% Editable) */}
                    <HeaderBlock>
                        <div
                            className="logo-box logo-box-interactive"
                            title="Hacé clic para cambiar la imagen del logo institucional"
                            onClick={() => logoInputRef1.current?.click()}
                        >
                            {isUploadingLogo ? (
                                <div className="logo-uploading">
                                    <span className="spinner-mini"></span>
                                    <small>Subiendo...</small>
                                </div>
                            ) : fotoLogo ? (
                                <>
                                    <img src={fotoLogo} className="logo-img" crossOrigin="anonymous" alt="Logo" />
                                    <div className="logo-hover-overlay no-print" data-html2canvas-ignore="true">
                                        <span>📷 Cambiar</span>
                                    </div>
                                </>
                            ) : (
                                <div className="logo-fallback">Salón Magic Eventos</div>
                            )}
                            <input
                                type="file"
                                ref={logoInputRef1}
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleLogoUpload}
                            />
                        </div>

                        <div className="title-box">
                            <h1 className="main-title">
                                <RichEditableText
                                    value={headerData.companyName}
                                    onSave={(val) => handleSaveHeaderField("companyName", val)}
                                    isEditable={!!currentUser}
                                    placeholder="Salón Magic Eventos"
                                />
                            </h1>
                            <h2 className="sub-title">
                                <RichEditableText
                                    value={headerData.subtitle1}
                                    onSave={(val) => handleSaveHeaderField("subtitle1", val)}
                                    isEditable={!!currentUser}
                                    placeholder="GUÍA DE CONVIVENCIA Y CONDICIONES DEL SERVICIO"
                                />
                            </h2>
                            <div className="contact-line">
                                <RichEditableText
                                    value={headerData.contactLine}
                                    onSave={(val) => handleSaveHeaderField("contactLine", val)}
                                    isEditable={!!currentUser}
                                    placeholder="Dirección: ... | WhatsApp/Cel: ..."
                                />
                            </div>
                        </div>
                    </HeaderBlock>

                    {/* Contenedor dinámico de tarjetas personalizables */}
                    <div className="cards-wrapper">
                        {cards.map((card, cardIdx) => {
                            const cardColor = card.color || "#2563eb";
                            const cardBg = getCardBgColor(cardColor);
                            const isColorOpen = activeColorCardIdx === cardIdx;

                            return (
                                <InfoCard
                                    key={card.id || cardIdx}
                                    $borderColor={cardColor}
                                    $bgColor={cardBg}
                                >
                                    {/* Columna de ícono (interactiva para cambiar de ícono) */}
                                    <div
                                        className="icon-col"
                                        style={{ backgroundColor: cardColor }}
                                        title="Hacé clic para cambiar el ícono"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveIconCardIdx(cardIdx);
                                        }}
                                    >
                                        <div className="icon-inner">
                                            <ReceiptIcon name={card.icon} size={28} strokeWidth={2.1} />
                                        </div>
                                        <span className="icon-badge-hint" title="Cambiar ícono">✎</span>
                                    </div>

                                    {/* Cuerpo de la tarjeta */}
                                    <div className="card-body">
                                        {/* Barra superior de la tarjeta: Título + Botón de Renglón + Color e Ícono en el mismo renglón */}
                                        <div className="card-top-bar">
                                            <h3 className="card-title" style={{ color: cardColor }}>
                                                <RichEditableText
                                                    value={card.title}
                                                    onSave={(val) => handleSaveCardTitle(cardIdx, val)}
                                                    isEditable={!!currentUser}
                                                    placeholder="Título de la tarjeta..."
                                                />
                                            </h3>

                                            {/* Herramientas de edición en el mismo renglón que el título (ahorrando espacio vertical) */}
                                            <div className="card-actions-bar no-print" data-html2canvas-ignore="true" onClick={(e) => e.stopPropagation()}>
                                                {/* Botón Agregar Renglón en la cabecera */}
                                                <button
                                                    type="button"
                                                    className="btn-card-tool add-row-tool-btn"
                                                    title="Agregar un nuevo renglón a esta tarjeta"
                                                    onClick={() => handleAddRow(cardIdx)}
                                                >
                                                    ➕ <span className="tool-text">Renglón</span>
                                                </button>

                                                {/* Selector de Color */}
                                                <div className="color-tool-container">
                                                    <button
                                                        type="button"
                                                        className="btn-card-tool color-btn"
                                                        style={{ borderLeftColor: cardColor }}
                                                        title="Elegir color de la tarjeta"
                                                        onClick={() => setActiveColorCardIdx(isColorOpen ? null : cardIdx)}
                                                    >
                                                        <span className="color-swatch-dot" style={{ backgroundColor: cardColor }}></span>
                                                        <span className="tool-text">Color</span>
                                                    </button>

                                                    {isColorOpen && (
                                                        <ColorPopover onClick={(e) => e.stopPropagation()}>
                                                            <div className="popover-title">
                                                                <span>Elegir Color</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn-close-pop"
                                                                    onClick={() => setActiveColorCardIdx(null)}
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>

                                                            <div className="palette-grid">
                                                                {PRESET_COLORS.map((item) => (
                                                                    <button
                                                                        key={item.hex}
                                                                        type="button"
                                                                        className={`swatch-circle ${cardColor.toLowerCase() === item.hex.toLowerCase() ? "active" : ""}`}
                                                                        style={{ backgroundColor: item.hex }}
                                                                        title={item.name}
                                                                        onClick={() => {
                                                                            handleChangeCardColor(cardIdx, item.hex);
                                                                            setActiveColorCardIdx(null);
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>

                                                            <div className="custom-color-field">
                                                                <label>Libre:</label>
                                                                <input
                                                                    type="color"
                                                                    value={cardColor}
                                                                    onChange={(e) => handleChangeCardColor(cardIdx, e.target.value)}
                                                                />
                                                                <span className="hex-display">{cardColor}</span>
                                                            </div>
                                                        </ColorPopover>
                                                    )}
                                                </div>

                                                {/* Selector de Ícono */}
                                                <button
                                                    type="button"
                                                    className="btn-card-tool icon-btn"
                                                    title="Cambiar ícono vectorial"
                                                    onClick={() => setActiveIconCardIdx(cardIdx)}
                                                >
                                                    <span className="icon-preview-mini">
                                                        <ReceiptIcon name={card.icon} size={13} strokeWidth={2.2} />
                                                    </span>
                                                    <span className="tool-text">Ícono</span>
                                                </button>

                                                {/* Mover Arriba */}
                                                {cardIdx > 0 && (
                                                    <button
                                                        type="button"
                                                        className="btn-card-tool move-card-btn"
                                                        title="Subir posición de esta tarjeta"
                                                        onClick={() => handleMoveCardUp(cardIdx)}
                                                    >
                                                        ▲
                                                    </button>
                                                )}

                                                {/* Mover Abajo */}
                                                {cardIdx < cards.length - 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn-card-tool move-card-btn"
                                                        title="Bajar posición de esta tarjeta"
                                                        onClick={() => handleMoveCardDown(cardIdx)}
                                                    >
                                                        ▼
                                                    </button>
                                                )}

                                                {/* Borrar Tarjeta */}
                                                <button
                                                    type="button"
                                                    className="btn-card-tool delete-card-btn"
                                                    title="Eliminar esta tarjeta de la infografía"
                                                    onClick={() => handleDeleteCard(cardIdx)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        {/* Lista de renglones dinámicos */}
                                        <ul className="bullet-list">
                                            {card.items && card.items.map((itemText, rowIdx) => (
                                                <li key={rowIdx} className="bullet-item-row">
                                                    <div className="bullet-item-text">
                                                        <RichEditableText
                                                            value={itemText}
                                                            onSave={(val) => handleSaveRow(cardIdx, rowIdx, val)}
                                                            isEditable={!!currentUser}
                                                            placeholder={`Renglón ${rowIdx + 1}...`}
                                                        />
                                                    </div>

                                                    {/* Herramientas de renglón: mover arriba, mover abajo, borrar */}
                                                    <div className="row-actions-bar no-print" data-html2canvas-ignore="true">
                                                        {rowIdx > 0 && (
                                                            <button
                                                                type="button"
                                                                className="btn-row-action move-row-btn"
                                                                title="Subir renglón"
                                                                onClick={() => handleMoveRowUp(cardIdx, rowIdx)}
                                                            >
                                                                ▲
                                                            </button>
                                                        )}
                                                        {rowIdx < card.items.length - 1 && (
                                                            <button
                                                                type="button"
                                                                className="btn-row-action move-row-btn"
                                                                title="Bajar renglón"
                                                                onClick={() => handleMoveRowDown(cardIdx, rowIdx)}
                                                            >
                                                                ▼
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="btn-row-action delete-row-btn"
                                                            title="Eliminar este renglón"
                                                            onClick={() => handleDeleteRow(cardIdx, rowIdx)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </InfoCard>
                            );
                        })}

                        {/* Botón para agregar nueva tarjeta */}
                        <button
                            type="button"
                            className="btn-add-card-dashed no-print"
                            data-html2canvas-ignore="true"
                            onClick={handleAddCard}
                            title="Agregar una nueva tarjeta a la infografía"
                        >
                            ➕ Agregar Tarjeta a la Infografía
                        </button>
                    </div>

                    {/* Pie de Página 1 */}
                    <PageFooter>
                        <div className="footer-left">
                            <RichEditableText
                                value={headerData.footerLine}
                                onSave={(val) => handleSaveHeaderField("footerLine", val)}
                                isEditable={!!currentUser}
                                placeholder="Pie de página..."
                            />
                        </div>
                        <span className="footer-right">Página 1 de 2</span>
                    </PageFooter>
                </SheetPage>

                {/* ========================================================================= */}
                {/* ====== PÁGINA 2: CONSTANCIA DE SEÑA, CONDICIONES LEGALES Y FIRMAS ====== */}
                {/* ========================================================================= */}
                <SheetPage id="plantilla-infografico-page2">
                    {/* Encabezado Principal Página 2 (100% Editable) */}
                    <HeaderBlock>
                        <div
                            className="logo-box logo-box-interactive"
                            title="Hacé clic para cambiar la imagen del logo institucional"
                            onClick={() => logoInputRef2.current?.click()}
                        >
                            {isUploadingLogo ? (
                                <div className="logo-uploading">
                                    <span className="spinner-mini"></span>
                                    <small>Subiendo...</small>
                                </div>
                            ) : fotoLogo ? (
                                <>
                                    <img src={fotoLogo} className="logo-img" crossOrigin="anonymous" alt="Logo" />
                                    <div className="logo-hover-overlay no-print" data-html2canvas-ignore="true">
                                        <span>📷 Cambiar</span>
                                    </div>
                                </>
                            ) : (
                                <div className="logo-fallback">Salón Magic Eventos</div>
                            )}
                            <input
                                type="file"
                                ref={logoInputRef2}
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleLogoUpload}
                            />
                        </div>

                        <div className="title-box">
                            <h1 className="main-title">
                                <RichEditableText
                                    value={headerData.companyName}
                                    onSave={(val) => handleSaveHeaderField("companyName", val)}
                                    isEditable={!!currentUser}
                                    placeholder="Salón Magic Eventos"
                                />
                            </h1>
                            <h2 className="sub-title">
                                <RichEditableText
                                    value={headerData.subtitle2}
                                    onSave={(val) => handleSaveHeaderField("subtitle2", val)}
                                    isEditable={!!currentUser}
                                    placeholder="CONSTANCIA DE SEÑA Y COMPROMISO DE RESERVA"
                                />
                            </h2>
                            <div className="contact-line">
                                <RichEditableText
                                    value={headerData.contactLine}
                                    onSave={(val) => handleSaveHeaderField("contactLine", val)}
                                    isEditable={!!currentUser}
                                    placeholder="Dirección: ... | WhatsApp/Cel: ..."
                                />
                            </div>
                        </div>
                    </HeaderBlock>

                    <div className="cards-wrapper" style={{ justifyContent: "flex-start", gap: "14px" }}>
                        {/* Bloque Principal del Contrato y Recibo */}
                        <ContractCard>
                            <div className="contract-header-badge">
                                <span className="badge-icon">📋</span>
                                <div style={{ flex: 1 }}>
                                    <RichEditableText
                                        value={contractData.badgeTitle || "DETALLE DE LA RESERVA Y CONDICIONES DE CONTRATACIÓN"}
                                        onSave={(val) => handleSaveContractField("badgeTitle", val)}
                                        isEditable={!!currentUser}
                                        placeholder="DETALLE DE LA RESERVA Y CONDICIONES DE CONTRATACIÓN"
                                    />
                                </div>
                            </div>

                            {/* Tabla de Datos del Evento y Pagos */}
                            <div className="receipt-data-row">
                                <div className="data-item">
                                    <span className="data-label">
                                        <RichEditableText
                                            value={contractData.labelLugarFecha || "Lugar y Fecha:"}
                                            onSave={(val) => handleSaveContractField("labelLugarFecha", val)}
                                            isEditable={!!currentUser}
                                            placeholder="Lugar y Fecha:"
                                        />
                                    </span>
                                    <span className="data-value" style={{ display: "inline-block" }}>
                                        <RichEditableText
                                            value={inputValue2}
                                            onSave={(val) => handleSaveField("contenido2", val, setInputValue2)}
                                            isEditable={!!currentUser}
                                            placeholder="Buenos Aires"
                                        />
                                    </span>
                                    <span className="data-insert">{", "}[Fecha Actual]</span>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">
                                        <RichEditableText
                                            value={contractData.labelCliente || "Cliente:"}
                                            onSave={(val) => handleSaveContractField("labelCliente", val)}
                                            isEditable={!!currentUser}
                                            placeholder="Cliente:"
                                        />
                                    </span>
                                    <strong className="data-insert">[Nombre Cliente]</strong>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">
                                        <RichEditableText
                                            value={contractData.labelFechaEvento || "Fecha del Evento:"}
                                            onSave={(val) => handleSaveContractField("labelFechaEvento", val)}
                                            isEditable={!!currentUser}
                                            placeholder="Fecha del Evento:"
                                        />
                                    </span>
                                    <strong className="data-insert">[DD-MM-YYYY]</strong>
                                </div>
                                <div className="data-item highlight-sena">
                                    <span className="data-label">
                                        <RichEditableText
                                            value={contractData.labelSena || "Seña Abonada:"}
                                            onSave={(val) => handleSaveContractField("labelSena", val)}
                                            isEditable={!!currentUser}
                                            placeholder="Seña Abonada:"
                                        />
                                    </span>
                                    <strong className="data-insert">$[Seña]</strong>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">
                                        <RichEditableText
                                            value={contractData.labelPagoTotal || "Pagó en total:"}
                                            onSave={(val) => handleSaveContractField("labelPagoTotal", val)}
                                            isEditable={!!currentUser}
                                            placeholder="Pagó en total:"
                                        />
                                    </span>
                                    <strong className="data-insert">$[Monto Total]-.</strong>
                                </div>
                            </div>

                            {/* Texto y Cláusulas Contractuales */}
                            <div className="contract-text">
                                <div className="clause-item">
                                    <RichEditableText
                                        value={inputValue6}
                                        onSave={(val) => handleSaveField("contenido6", val, setInputValue6)}
                                        isEditable={!!currentUser}
                                        placeholder="Contenido 6..."
                                    />
                                </div>

                                <div className="clause-item">
                                    <RichEditableText
                                        value={inputValue21}
                                        onSave={(val) => handleSaveField("contenido21", val, setInputValue21)}
                                        isEditable={!!currentUser}
                                        placeholder="Contenido 21..."
                                    />
                                </div>

                                <div className="clause-item clause-bold">
                                    <RichEditableText
                                        value={inputValue22}
                                        onSave={(val) => handleSaveField("contenido22", val, setInputValue22)}
                                        isEditable={!!currentUser}
                                        placeholder="Contenido 22..."
                                    />
                                </div>

                                {/* Alerta de Seña no Reembolsable */}
                                <div className="alert-refund-box">
                                    <span className="alert-icon">⚠️</span>
                                    <div style={{ flex: 1 }}>
                                        <RichEditableText
                                            value={inputValue5}
                                            onSave={(val) => handleSaveField("contenido5", val, setInputValue5)}
                                            isEditable={!!currentUser}
                                            placeholder="Contenido 5..."
                                        />
                                    </div>
                                </div>

                                <div className="prices-disclaimer">
                                    <RichEditableText
                                        value={contractData.disclaimer || 'Precios y servicios fijados según la lista de precios oficial vigente al momento de la contratación. Podés consultarla en <a href="/precios" target="_blank" rel="noopener noreferrer">nuestra web</a>.'}
                                        onSave={(val) => handleSaveContractField("disclaimer", val)}
                                        isEditable={!!currentUser}
                                        placeholder="Precios y servicios fijados..."
                                    />
                                </div>
                            </div>

                            {/* Firmas */}
                            <div
                                className="signatures-row"
                                style={{
                                    position: "relative",
                                    justifyContent: contractData.showClientSignature !== false ? "space-between" : "flex-end"
                                }}
                            >
                                {currentUser && (
                                    <div
                                        className="no-print"
                                        style={{
                                            position: "absolute",
                                            top: "-22px",
                                            left: "16px",
                                            zIndex: 20
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleSaveContractField("showClientSignature", contractData.showClientSignature === false ? true : false)}
                                            style={{
                                                background: contractData.showClientSignature === false ? "#fef2f2" : "#f1f5f9",
                                                border: `1px solid ${contractData.showClientSignature === false ? "#fca5a5" : "#cbd5e1"}`,
                                                color: contractData.showClientSignature === false ? "#991b1b" : "#475569",
                                                borderRadius: "12px",
                                                padding: "1px 8px",
                                                fontSize: "9.5px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}
                                            title="Activar o desactivar visualización de la firma del cliente"
                                        >
                                            {contractData.showClientSignature === false ? (
                                                <>👁️ Firma del cliente: <strong style={{ color: "#dc2626" }}>Oculta</strong> (Clic para activar)</>
                                            ) : (
                                                <>👁️ Firma del cliente: <strong style={{ color: "#16a34a" }}>Visible</strong> (Clic para desactivar)</>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {contractData.showClientSignature !== false && (
                                    <div className="signature-box">
                                        <div className="sign-line"></div>
                                        <div className="sign-title">
                                            <RichEditableText
                                                value={contractData.signClientTitle || "Firma y Aclaración del Cliente"}
                                                onSave={(val) => handleSaveContractField("signClientTitle", val)}
                                                isEditable={!!currentUser}
                                                placeholder="Firma y Aclaración del Cliente"
                                            />
                                        </div>
                                        <div className="sign-meta" style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: "4px" }}>
                                            <span className="sign-meta-label">
                                                <RichEditableText
                                                    value={contractData.signClientDni || "DNI:"}
                                                    onSave={(val) => handleSaveContractField("signClientDni", val)}
                                                    isEditable={!!currentUser}
                                                    placeholder="DNI:"
                                                />
                                            </span>
                                            <span>_________________ &nbsp;&nbsp;&nbsp;</span>
                                            <span className="sign-meta-label">
                                                <RichEditableText
                                                    value={contractData.signClientTel || "Tel: _________________"}
                                                    onSave={(val) => handleSaveContractField("signClientTel", val)}
                                                    isEditable={!!currentUser}
                                                    placeholder="Tel: _________________"
                                                />
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="signature-box">
                                    <div className="sign-line"></div>
                                    <div className="sign-title">
                                        <RichEditableText
                                            value={contractData.signSalonTitle || headerData.companyName?.replace(/<[^>]+>/g, '') || companyName || "Salón Magic Eventos"}
                                            onSave={(val) => handleSaveContractField("signSalonTitle", val)}
                                            isEditable={!!currentUser}
                                            placeholder="Salón Magic Eventos"
                                        />
                                    </div>
                                    <div className="sign-meta sign-cursive">
                                        <RichEditableText
                                            value={inputValue24}
                                            onSave={(val) => handleSaveField("contenido24", val, setInputValue24)}
                                            isEditable={!!currentUser}
                                            placeholder="Firma Responsable"
                                        />
                                    </div>
                                </div>
                            </div>
                        </ContractCard>
                    </div>

                    {/* Pie de Página 2 */}
                    <PageFooter>
                        <div className="footer-left">
                            <RichEditableText
                                value={headerData.footerLine}
                                onSave={(val) => handleSaveHeaderField("footerLine", val)}
                                isEditable={!!currentUser}
                                placeholder="Pie de página..."
                            />
                        </div>
                        <span className="footer-right">Página 2 de 2</span>
                    </PageFooter>
                </SheetPage>
            </SheetsViewer>

            {/* Campos adicionales de la base de datos */}
            <ExtraFieldsSection onClick={(e) => e.stopPropagation()}>
                <p className="extra-label">Campos adicionales de la base de datos (si aplican):</p>
                <div className="extra-grid">
                    <div>
                        <small>Nombre Salón (Contenido 1):</small>
                        <RichEditableText
                            value={inputValue1}
                            onSave={(val) => handleSaveField("contenido1", val, setInputValue1)}
                            isEditable={!!currentUser}
                            placeholder="Contenido 1"
                        />
                    </div>
                    <div>
                        <small>Concepto Seña (Contenido 3):</small>
                        <RichEditableText
                            value={inputValue3}
                            onSave={(val) => handleSaveField("contenido3", val, setInputValue3)}
                            isEditable={!!currentUser}
                            placeholder="Contenido 3"
                        />
                    </div>
                    <div>
                        <small>Prefijo Fecha (Contenido 4):</small>
                        <RichEditableText
                            value={inputValue4}
                            onSave={(val) => handleSaveField("contenido4", val, setInputValue4)}
                            isEditable={!!currentUser}
                            placeholder="Contenido 4"
                        />
                    </div>
                    <div>
                        <small>Enlace Web (Contenido 23):</small>
                        <RichEditableText
                            value={inputValue23}
                            onSave={(val) => handleSaveField("contenido23", val, setInputValue23)}
                            isEditable={!!currentUser}
                            placeholder="Contenido 23"
                        />
                    </div>
                </div>

                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                        type="checkbox"
                        id="toggleClientSigCheckbox"
                        checked={contractData.showClientSignature !== false}
                        onChange={(e) => handleSaveContractField("showClientSignature", e.target.checked)}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="toggleClientSigCheckbox" style={{ cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#334155" }}>
                        Mostrar bloque de "Firma y Aclaración del Cliente" (DNI / Tel) en el contrato
                    </label>
                </div>
            </ExtraFieldsSection>

            {/* Modal para selección de ícono */}
            {activeIconCardIdx !== null && (
                <IconPickerModal
                    isOpen={true}
                    onClose={() => setActiveIconCardIdx(null)}
                    currentIcon={cards[activeIconCardIdx]?.icon}
                    cardTitle={cards[activeIconCardIdx]?.title}
                    onSelectIcon={(iconId) => handleChangeCardIcon(activeIconCardIdx, iconId)}
                />
            )}
        </EditorWrapper>
    );
}

// --- ESTILOS IDÉNTICOS Y PRECISOS ---

const EditorWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  font-family: 'product_sansregular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const TopHelperBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 18px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
  flex-wrap: wrap;
  gap: 12px;

  .info-side {
    h3 {
      margin: 0 0 4px 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #1e293b;
    }
    p {
      margin: 0;
      font-size: 0.88rem;
      color: #64748b;
      line-height: 1.4;
    }
  }

  .action-side {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn-add-card-top {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #93c5fd;
    padding: 8px 14px;
    font-size: 0.84rem;
    font-weight: 700;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: #dbeafe;
      border-color: #2563eb;
    }
  }

  .btn-reset {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
    padding: 8px 14px;
    font-size: 0.84rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: #fee2e2;
      color: #b91c1c;
      border-color: #fca5a5;
    }
  }

  .btn-open-preview {
    background: #2563eb;
    color: white;
    border: none;
    padding: 8px 16px;
    font-size: 0.88rem;
    font-weight: 700;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
    &:hover {
      background: #1d4ed8;
    }
  }
`;

const SheetsViewer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
  overflow-x: auto;
  padding: 10px 0 30px 0;
  box-sizing: border-box;
  background-color: #f3f4f6;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
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

  .cards-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .btn-add-card-dashed {
    border: 1.5px dashed #93c5fd;
    background: #f8fafc;
    color: #2563eb;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease;
    align-self: center;

    &:hover {
      background: #eff6ff;
      border-color: #2563eb;
      color: #1d4ed8;
      transform: scale(1.02);
    }
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
    position: relative;
    overflow: hidden;

    &.logo-box-interactive {
      cursor: pointer;
      &:hover .logo-hover-overlay {
        opacity: 1;
      }
    }
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

  .logo-hover-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(15, 23, 42, 0.72);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    opacity: 0;
    transition: opacity 0.2s ease;
    border-radius: 5px;
  }

  .logo-uploading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: #2563eb;
    font-size: 10px;
    font-weight: 700;

    .spinner-mini {
      width: 14px;
      height: 14px;
      border: 2px solid #93c5fd;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
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
  overflow: visible;
  box-sizing: border-box;
  position: relative;
  transition: border-color 0.2s, background-color 0.2s;

  .icon-col {
    width: 66px;
    min-width: 66px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    padding: 8px;
    box-sizing: border-box;
    cursor: pointer;
    position: relative;
    user-select: none;
    transition: opacity 0.15s;

    &:hover {
      opacity: 0.92;
      .icon-badge-hint {
        opacity: 1;
        transform: scale(1);
      }
    }

    .icon-inner {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-badge-hint {
      position: absolute;
      bottom: 4px;
      right: 4px;
      background: rgba(0, 0, 0, 0.45);
      color: #ffffff;
      font-size: 11px;
      padding: 1px 4px;
      border-radius: 4px;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.15s ease;
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
  }

  .card-actions-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .btn-card-tool {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 10.3px;
    font-weight: 700;
    color: #475569;
    cursor: pointer;
    height: 21px;
    transition: all 0.15s;

    &:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #94a3b8;
    }

    &.add-row-tool-btn {
      color: #2563eb;
      border-color: #93c5fd;
      background: #eff6ff;

      &:hover {
        background: #dbeafe;
        border-color: #2563eb;
        color: #1d4ed8;
      }
    }

    &.delete-card-btn {
      color: #ef4444;
      padding: 1px 5px;
      &:hover {
        background: #fee2e2;
        border-color: #fca5a5;
        color: #b91c1c;
      }
    }

    &.move-card-btn {
      font-size: 8px;
      padding: 1px 5px;
      color: #64748b;
      &:hover {
        background: #e2e8f0;
        color: #1e293b;
      }
    }

    .color-swatch-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      display: inline-block;
      border: 1px solid rgba(0,0,0,0.15);
    }

    .icon-preview-mini {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #334155;
    }
  }

  .color-tool-container {
    position: relative;
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
      padding-right: 48px;
      box-sizing: border-box;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        .row-actions-bar {
          opacity: 1;
          visibility: visible;
        }
      }
    }

    .bullet-item-text {
      width: 100%;
    }

    .row-actions-bar {
      position: absolute;
      right: 0;
      top: 1px;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      opacity: 0;
      visibility: hidden;
      transition: all 0.15s ease;

      .btn-row-action {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 3px;
        padding: 1px 4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        transition: all 0.15s;

        &.move-row-btn {
          font-size: 8px;
          color: #64748b;
          &:hover {
            background: #e2e8f0;
            color: #0f172a;
          }
        }

        &.delete-row-btn {
          border: none;
          background: transparent;
          font-size: 11px;
          color: #ef4444;
          padding: 0 2px;
          &:hover {
            transform: scale(1.2);
            color: #b91c1c;
          }
        }
      }
    }
  }

  /* Estilos para el texto enriquecido de Quill dentro de los bullets */
  .editable-text-display {
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    font-size: 11.2px;
    line-height: 1.34;
    color: #1f2937;
    box-sizing: border-box;

    .ql-size-small, span.ql-size-small, p.ql-size-small {
      font-size: 0.75em !important;
    }
    .ql-size-large, span.ql-size-large, p.ql-size-large {
      font-size: 1.45em !important;
    }
    .ql-size-huge, span.ql-size-huge, p.ql-size-huge {
      font-size: 2.0em !important;
    }

    p {
      margin: 0 0 3px 0;
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
  }
`;

const ColorPopover = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 10px;
  width: 175px;
  z-index: 500;
  animation: popIn 0.12s ease-out;

  @keyframes popIn {
    from { transform: scale(0.92); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .popover-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #f1f5f9;

    .btn-close-pop {
      background: transparent;
      border: none;
      font-size: 12px;
      color: #94a3b8;
      cursor: pointer;
      line-height: 1;
      padding: 0 2px;
      &:hover { color: #0f172a; }
    }
  }

  .palette-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    margin-bottom: 10px;

    .swatch-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1.5px solid #ffffff;
      box-shadow: 0 0 0 1px #cbd5e1;
      cursor: pointer;
      padding: 0;
      transition: transform 0.1s;

      &:hover {
        transform: scale(1.2);
        box-shadow: 0 0 0 2px #0f172a;
      }

      &.active {
        box-shadow: 0 0 0 2px #0f172a;
        transform: scale(1.15);
      }
    }
  }

  .custom-color-field {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9.5px;
    color: #475569;
    padding-top: 6px;
    border-top: 1px solid #f1f5f9;

    label {
      font-weight: 600;
    }

    input[type="color"] {
      border: none;
      width: 22px;
      height: 22px;
      border-radius: 4px;
      cursor: pointer;
      padding: 0;
      background: none;
    }

    .hex-display {
      font-family: monospace;
      font-size: 9px;
      color: #64748b;
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
  }

  .footer-right {
    font-weight: 600;
    color: #4b5563;
    flex-shrink: 0;
  }
`;

const ExtraFieldsSection = styled.div`
  margin-top: 24px;
  padding: 16px;
  border-top: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 8px;

  .extra-label {
    margin: 0 0 10px 0;
    font-size: 0.9rem;
    font-weight: 700;
    color: #64748b;
  }

  .extra-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;

    small {
      display: block;
      color: #475569;
      font-weight: 600;
      margin-bottom: 4px;
    }
  }
`;

const LoadingBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #64748b;

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #cbd5e1;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
