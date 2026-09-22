import React, { forwardRef } from 'react';
import styled from 'styled-components';

const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.trim().split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    if (isNaN(hours)) return null;
    return { hours, minutes };
};


// ============================================================
// INLINE EDITABLE HELPERS
// ============================================================
const InlineEditable = ({ isAdmin, value, onSave, multiline = false, className, style, children }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [tempValue, setTempValue] = React.useState(value);

    React.useEffect(() => {
        setTempValue(value);
    }, [value]);

    if (!isAdmin) {
        return children || <span className={className} style={style}>{value}</span>;
    }

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsEditing(true);
    };

    const handleBlurOrSubmit = () => {
        setIsEditing(false);
        if (tempValue !== value) {
            onSave(tempValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !multiline) {
            handleBlurOrSubmit();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setTempValue(value);
        }
    };

    if (isEditing) {
        const inputStyle = {
            width: '100%',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            padding: '2px 4px',
            borderRadius: '4px',
            outline: 'none',
            display: 'inline-block',
            boxSizing: 'border-box',
            ...style
        };
        return multiline ? (
            <textarea
                style={inputStyle}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleBlurOrSubmit}
                onKeyDown={handleKeyDown}
                autoFocus
                rows={3}
            />
        ) : (
            <input
                type="text"
                style={inputStyle}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleBlurOrSubmit}
                onKeyDown={handleKeyDown}
                autoFocus
            />
        );
    }

    const editStyle = {
        cursor: 'pointer',
        borderBottom: '1px dashed #ffc107',
        backgroundColor: '#fffbeb',
        display: 'inline-block',
        borderRadius: '2px',
        padding: '0 2px',
        ...style
    };

    return (
        <span 
            className={className} 
            style={editStyle} 
            onDoubleClick={handleDoubleClick}
            title="Doble clic para editar texto de plantilla"
        >
            {value}
        </span>
    );
};

// ============================================================
// CONFIGURACIÓN ESTÁTICA DEL PRESUPUESTO
// ============================================================
export const CONFIG_PRESUPUESTO = {
    ubicacion: {
        direccion: 'Av. Corrientes 1234',
        ciudad: 'C.A.B.A., Argentina',
        referencia: 'Zona céntrica de fácil acceso',
    },
    comensales: {
        minimo: 20,
        maximo: 50,
        tipo: 'adultos',
    },
    tiposEvento: 'Cumpleaños, comuniones, bodas, bautismos, egresos, conferencias, reuniones empresariales y festejos.',
    contacto: {
        telefono: '11-0000-0000',
        email: 'contacto@salonmagiceventos.com.ar',
        web: 'www.salonmagiceventos.com.ar',
    },
    redes: {
        instagram: 'https://www.instagram.com/salonmagiceventos',
        instagramNombre: 'salonmagiceventos',
        facebook: 'https://www.facebook.com/salonmagiceventos/',
        facebookNombre: 'salonmagiceventos',
    },
    facturacion: 'Se realiza factura C',
    mediosDePago: 'Transferencia, efectivo, mercadopago',
    noIncluyeTitulo: 'Lo que no incluye:',
    noIncluye: [
        '*Servicio de DJ o animación',
        '*Vajilla de vidrio de ningún tipo, las vajillas del catering son descartables',
    ],
    noPermitidoTitulo: 'Lo que no está permitido:',
    noPermitido: [
        '*Fumar en el interior del salón',
        '*Ingresar con pirotecnia o papel picado metalizado',
    ],
    subtitulo: 'PARQUE PATRICIOS',
    amenitiesInteriorTitulo: 'Espacio climatizado con:',
    amenitiesInterior: [
        'Mesas con manteles de cuerina negra y sillas para 50 personas',
        'Dos baños, uno apto para discapacitados',
        'WIFI',
        'Computadora con Spotify y Youtube premium, micrófonos y parlantes',
        'Pantalla gigante de 75" con conexión inalámbrica',
    ],
    amenitiesExteriorTitulo: 'Patio descubierto con:',
    amenitiesExterior: [
        'Parrilla techada disponible para usar',
        'Living de puffs',
        'Mesa de ping pong y juego de arcade',
    ],
    textoFotos: 'Cliqueá el ícono para ver fotos:',
    seccionesPredeterminadas: {
        catering: {
            nombre: "Catering",
            costoPP: "30000",
            margen: "39",
            detalle: "2 camareras\nDesayuno por 1 hora:\nCafé y té con medialunas"
        },
        barra: {
            nombre: "Barra de tragos",
            costoPP: "15000",
            margen: "35",
            detalle: "Bartender profesional\nCanilla libre por 4 horas:\nFernet, Gancia, Campari, Cerveza y Gaseosas"
        },
        animacion: {
            nombre: "Show y Animación",
            costoPP: "8000",
            margen: "25",
            detalle: "Animador y DJ por 2 horas:\nJuegos interactivos, luces audiorrítmicas y máquina de humo"
        }
    }
};

// ============================================================
// STYLED COMPONENTS
// ============================================================

const PDFWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
`;

const PDFContainer = styled.div`
    width: 794px;
    height: 1123px;
    min-height: 1123px;
    max-height: 1123px;
    background: #ffffff;
    font-family: 'product_sansregular', 'Segoe UI', sans-serif;
    display: flex;
    position: relative;
    color: #333;
    overflow: hidden;
    * { box-sizing: border-box; }

    ${props => props.$isExporting && `
        button,
        .delete-btn,
        .add-btn,
        [title="Eliminar"] {
            display: none !important;
        }
        /* Override AdminLinkWrapper style */
        span, div, a {
            border: none !important;
            background-color: transparent !important;
            box-shadow: none !important;
        }
    `}
`;

const Sidebar = styled.aside`
    width: 160px;
    min-width: 160px;
    background-color: #cedbcd;
    padding: 20px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    font-size: 0.7rem;
    text-align: center;
    color: #333;
`;

const SidebarTop = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
`;

const SidebarBottom = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: auto;
`;

const SidebarBlock = styled.div`
    width: 100%;
    padding: 0 4px;
    h4 {
        font-size: 0.7rem;
        font-weight: bold;
        text-decoration: none;
        margin-bottom: 4px;
    }
    p {
        font-size: 0.65rem;
        line-height: 1.3;
        margin: 2px 0;
    }
`;

const SidebarDivider = styled.div`
    width: 35px;
    height: 3px;
    background-color: #ff7b72;
    border-radius: 1.5px;
    margin: 8px auto;
`;

const SocialIcons = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    margin: 4px 0;
    a {
        display: flex;
        align-items: center;
        gap: 6px;
        text-decoration: none;
        color: #333;
        font-size: 0.62rem;
        font-weight: bold;
        &:hover { text-decoration: underline; }
    }
    img.social-logo {
        width: 22px;
        height: 22px;
        border-radius: 4px;
        object-fit: contain;
    }
`;

const ContactInfo = styled.div`
    font-size: 0.6rem;
    line-height: 1.4;
    margin-top: auto;
    p { margin: 2px 0; word-break: break-word; }
    a { color: #333; text-decoration: underline; }
`;

const MainContent = styled.main`
    flex: 1;
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
`;

const LogoHeader = styled.div`
    text-align: center;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
    .logo-text {
        font-family: 'playlistscript', cursive;
        font-size: 2.2rem;
        color: #333;
        line-height: 1.1;
    }
    .subtitle {
        font-size: 0.65rem;
        letter-spacing: 4px;
        text-transform: uppercase;
        color: #666;
        margin-top: 2px;
    }
`;

const ServiceSection = styled.div`
    margin-bottom: 14px;
    page-break-inside: avoid;
    &::after { content: ''; display: table; clear: both; }
`;

const ServiceTitle = styled.h3`
    font-size: 0.85rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 6px;
    .nota-opcion {
        font-size: 0.7rem;
        font-style: italic;
        color: #666;
        font-weight: normal;
    }
`;

const ServiceDetails = styled.div`
    font-size: 0.72rem;
    line-height: 1.6;
    padding-left: 16px;
    color: #444;
    p { margin: 1px 0; }
    .detail-header {
        font-weight: bold;
        margin-top: 8px;
        color: #333;
    }
`;

const PriceTag = styled.div`
    float: right;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    padding: 4px 12px;
    font-size: 0.75rem;
    font-weight: bold;
    text-align: right;
    margin-left: 12px;
    margin-bottom: 4px;
    min-width: 160px;
    .per-person { display: block; font-size: 0.72rem; }
    .total-calc { display: block; font-size: 0.68rem; color: #555; }
`;

const TotalSection = styled.div`
    margin-top: 12px;
    padding: 8px 12px;
    background-color: #d4edda;
    text-align: center;
    font-weight: bold;
    font-size: 0.78rem;
    border-radius: 4px;
    p { margin: 3px 0; }
    .total-big { font-size: 0.85rem; }
`;

const NoIncluyeSection = styled.div`
    margin-top: 14px;
    padding: 10px 14px;
    border: 1.5px solid #333;
    border-radius: 4px;
    display: flex;
    gap: 20px;
    .column {
        flex: 1;
        h4 { font-size: 0.78rem; text-decoration: underline; margin-bottom: 6px; }
        p { font-size: 0.7rem; font-style: italic; margin: 2px 0; color: #444; }
    }
    .divider {
        width: 1px;
        background-color: rgba(0, 0, 0, 0.15);
        align-self: stretch;
    }
`;

const FooterInfo = styled.div`
    margin-top: 12px;
    font-size: 0.72rem;
    font-style: italic;
    p { margin: 3px 0; }
    .bold { font-weight: bold; }
`;

const MesValidez = styled.div`
    font-size: 0.68rem;
    font-weight: bold;
    line-height: 1.4;
    text-align: center;
    margin-bottom: 12px;
`;

// ============================================================
// HELPERS
// ============================================================
const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return '$' + num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const getMesAnio = (date) => {
    if (!date) return '';
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${meses[date.getMonth()]} de ${date.getFullYear()}`;
};

/**
 * Render detail text: lines ending with ":" become bold headers.
 */
const renderDetailLines = (text) => {
    if (!text) return null;
    return text.split('\n').filter(line => line.trim()).map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.endsWith(':')) {
            return <p key={i} className="detail-header">{trimmed}</p>;
        }
        return <p key={i}>{trimmed}</p>;
    });
};

// ============================================================

const AdminLinkWrapper = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    vertical-align: middle;

    ${props => props.$isAdmin && `
        border: 1px dashed #ffc107;
        background-color: #fffbeb;
        border-radius: 4px;
        padding: 2px 4px;
        cursor: pointer;
        transition: all 0.2s;
        &:hover {
            background-color: #fff3cd;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
    `}
`;

const LinkEditModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 11000;
`;

const LinkEditModalContent = styled.div`
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 24px;
    width: 420px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    font-family: inherit;
    color: #333;
`;

const ModalTitle = styled.h3`
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 1.15rem;
    font-weight: bold;
    color: #111;
    border-bottom: 2px solid #ffc107;
    padding-bottom: 8px;
`;

const FormGroup = styled.div`
    margin-bottom: 14px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    label {
        font-size: 0.75rem;
        font-weight: bold;
        color: #555;
    }
    input {
        font-family: inherit;
        font-size: 0.85rem;
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 6px;
        outline: none;
        background: #fdfdfd;
        &:focus {
            border-color: #ffc107;
            background: #fff;
        }
    }
`;

const ButtonRow = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
`;

const CancelBtn = styled.button`
    padding: 8px 14px;
    border: none;
    background: #e9ecef;
    color: #495057;
    border-radius: 6px;
    font-weight: bold;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
        background: #dee2e6;
    }
`;

const SaveBtn = styled.button`
    padding: 8px 14px;
    border: none;
    background: #e0a800;
    color: white;
    border-radius: 6px;
    font-weight: bold;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
        background: #c69500;
    }
`;


const DeleteListItemBtn = styled.button`
    background: none;
    border: none;
    color: #dc3545;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    opacity: 0.6;
    transition: all 0.2s;
    &:hover {
        opacity: 1;
        background-color: rgba(220, 53, 69, 0.1);
    }
`;

const AddListItemBtn = styled.button`
    background: none;
    border: 1px dashed #28a745;
    color: #28a745;
    font-size: 0.65rem;
    font-weight: bold;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
    margin-top: 4px;
    transition: all 0.2s;
    display: inline-block;
    &:hover {
        background-color: rgba(40, 167, 69, 0.1);
    }
`;

// COMPONENTE PRINCIPAL
// ============================================================
const PresupuestoPDF = forwardRef(({
    formData = {},
    carrito = [],
    selectedDate = null,
    siteName = '',
    config = CONFIG_PRESUPUESTO,
    /**
     * Array de secciones dinámicas (catering, barra, etc.)
     * Cada sección: { id, nombre, costoPP, margen, detalle }
     */
    seccionesPDF = [],
    isAdmin = false,
    isExporting = false,
    onUpdateConfig = () => {},
}, ref) => {

    const [activeLinkEdit, setActiveLinkEdit] = React.useState(null);

    const handleLinkClick = (e, type) => {
        if (!isAdmin) return;
        
        e.preventDefault();
        e.stopPropagation();

        if (type === 'instagram') {
            setActiveLinkEdit({
                title: 'Editar Enlace de Instagram',
                text: config.redes.instagramNombre || 'salonmagiceventos',
                textPath: 'redes.instagramNombre',
                url: config.redes.instagram || 'https://www.instagram.com/salonmagiceventos',
                urlPath: 'redes.instagram',
                hasUrl: true
            });
        } else if (type === 'facebook') {
            setActiveLinkEdit({
                title: 'Editar Enlace de Facebook',
                text: config.redes.facebookNombre || 'salonmagiceventos',
                textPath: 'redes.facebookNombre',
                url: config.redes.facebook || 'https://www.facebook.com/salonmagiceventos',
                urlPath: 'redes.facebook',
                hasUrl: true
            });
        } else if (type === 'whatsapp') {
            setActiveLinkEdit({
                title: 'Editar Enlace de WhatsApp',
                text: config.contacto.telefono,
                textPath: 'contacto.telefono',
                url: config.contacto.whatsappUrl || `https://wa.me/549${config.contacto.telefono.replace(/-/g, '')}`,
                urlPath: 'contacto.whatsappUrl',
                hasUrl: true
            });
        } else if (type === 'email') {
            setActiveLinkEdit({
                title: 'Editar Dirección de Correo',
                text: config.contacto.email,
                textPath: 'contacto.email',
                hasUrl: false
            });
        } else if (type === 'web') {
            setActiveLinkEdit({
                title: 'Editar Enlace de Sitio Web',
                text: config.contacto.web,
                textPath: 'contacto.web',
                url: config.contacto.webUrl || `https://${config.contacto.web}`,
                urlPath: 'contacto.webUrl',
                hasUrl: true
            });
        } else if (type === 'maps') {
            setActiveLinkEdit({
                title: 'Editar Ubicación y Google Maps',
                direccion: config.ubicacion.direccion,
                ciudad: config.ubicacion.ciudad,
                referencia: config.ubicacion.referencia,
                url: config.ubicacion.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.ubicacion.direccion + ', ' + config.ubicacion.ciudad)}`,
                customLayout: 'maps'
            });
        }
    };

    const displaySiteName = siteName && siteName.trim() ? siteName.trim() : 'Salón de eventos';
    const cantidadInvitados = parseInt(formData.cantidadInvitados) || 0;
    const notaAlquiler = formData.notaAlquiler || '';

    // --- Group cart items ---
    const alquilerItem = carrito.find(item => [1, 3, 13, 14].includes(item.id));
    const horasExtra = carrito.filter(item => [2, 4].includes(item.id));
    const totalHorasExtra = horasExtra.reduce((sum, h) => sum + h.cantidad, 0);

    // Other items in cart (like metegol, ping pong, parrillero, camarera, etc.)
    const otrosItemsCarrito = carrito.filter(item => ![1, 3, 13, 14, 2, 4].includes(item.id));

    // Dynamic rental name with total hours
    let nombreAlquilerFinal = alquilerItem ? (alquilerItem.nombre || 'Alquiler de las instalaciones del salón de eventos') : '';
    const match = nombreAlquilerFinal.match(/por\s+(\d+)\s*(hs|horas)/i);
    if (match) {
        const baseHours = parseInt(match[1]);
        const totalHours = baseHours + totalHorasExtra;
        nombreAlquilerFinal = nombreAlquilerFinal.replace(match[0], `para un evento de ${totalHours}hs`);
    } else {
        if (totalHorasExtra > 0) {
            nombreAlquilerFinal += ` para un evento de ${4 + totalHorasExtra}hs`;
        }
    }

    const alquilerTotal = (alquilerItem ? alquilerItem.precio * alquilerItem.cantidad : 0) +
        horasExtra.reduce((sum, h) => sum + h.precio * h.cantidad, 0) +
        otrosItemsCarrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

    // --- Calculate dynamic sections totals ---
    const seccionesConPrecios = seccionesPDF.map(sec => {
        const costoPP = parseFloat(sec.costoPP) || 0;
        const margen = parseFloat(sec.margen) || 0;
        const precioFinalPP = Math.round(costoPP * (1 + margen / 100));
        const totalSeccion = precioFinalPP * cantidadInvitados;
        return { ...sec, precioFinalPP, totalSeccion };
    });

    const totalSecciones = seccionesConPrecios.reduce((sum, s) => sum + s.totalSeccion, 0);

    // --- Grand totals ---
    const subtotal = alquilerTotal + totalSecciones;
    
    let montoDescuento = 0;
    let grandTotal = subtotal;

    const discountVal = parseFloat(formData.descuento || 0);
    const tipo = formData.tipoDescuento || 'porcentaje';

    if (tipo === 'porcentaje') {
        montoDescuento = (subtotal * discountVal) / 100;
        grandTotal = subtotal - montoDescuento;
    } else if (tipo === 'monto') {
        montoDescuento = discountVal;
        grandTotal = subtotal - montoDescuento;
    } else if (tipo === 'final') {
        grandTotal = discountVal > 0 ? discountVal : subtotal;
        montoDescuento = subtotal - grandTotal;
    }

    const totalPorPersona = cantidadInvitados > 0 ? Math.round(grandTotal / cantidadInvitados) : 0;

    const eventDate = selectedDate
        ? (typeof selectedDate === 'string' ? new Date(selectedDate) : selectedDate)
        : null;

    const isWeekendDay = eventDate && [0, 6, 5].includes(eventDate.getDay());
    let baseHorasPrevias = (alquilerItem && [3, 13, 14].includes(alquilerItem.id)) || isWeekendDay ? 2 : 1;
    let isCustomHorasPrevias = false;
    let customHorasPreviasText = '';
    if (formData.horasPrevias !== undefined && formData.horasPrevias !== null) {
        const rawPrevias = String(formData.horasPrevias).trim();
        if (rawPrevias !== '') {
            const cleaned = rawPrevias.replace(',', '.');
            if (!isNaN(Number(cleaned))) {
                baseHorasPrevias = parseFloat(cleaned);
            } else {
                isCustomHorasPrevias = true;
                customHorasPreviasText = rawPrevias;
            }
        }
    }
    const horasPreviasExtra = carrito.find(item => item.id === 11)?.cantidad || 0;
    const totalHorasPrevias = baseHorasPrevias + horasPreviasExtra;
    
    const camareraItem = carrito.find(item => item.id === 5);

    // Dynamic interior and exterior amenities based on cart selection
    const dynamicInterior = [];
    if (carrito.some(item => item.id === 9)) {
        const alreadyExists = (config.amenitiesInterior || []).some(item => item.toLowerCase().includes('arcade'));
        if (!alreadyExists) dynamicInterior.push('Arcade multijuego');
    }
    if (carrito.some(item => item.id === 10)) {
        const alreadyExists = (config.amenitiesInterior || []).some(item => item.toLowerCase().includes('proyector'));
        if (!alreadyExists) dynamicInterior.push('Proyector gigante');
    }

    const dynamicExterior = [];
    if (carrito.some(item => item.id === 6)) {
        const alreadyExists = (config.amenitiesExterior || []).some(item => item.toLowerCase().includes('metegol'));
        if (!alreadyExists) dynamicExterior.push('Metegol');
    }
    if (carrito.some(item => item.id === 8)) {
        const alreadyExists = (config.amenitiesExterior || []).some(item => item.toLowerCase().includes('ping pong') || item.toLowerCase().includes('pingpong'));
        if (!alreadyExists) dynamicExterior.push('Ping pong');
    }
    if (carrito.some(item => item.id === 7)) {
        const alreadyExists = (config.amenitiesExterior || []).some(item => item.toLowerCase().includes('inflable'));
        if (!alreadyExists) dynamicExterior.push('Inflable 3x3');
    }
    if (carrito.some(item => item.id === 12)) {
        const alreadyExists = (config.amenitiesExterior || []).some(item => item.toLowerCase().includes('parrillero'));
        if (!alreadyExists) dynamicExterior.push('Servicio de parrillero para asado');
    }

    // Section numbering starts at 1 (alquiler)
    let sectionNum = 0;

    const renderSidebar = () => (
        <Sidebar>
            <SidebarTop>
                <MesValidez>
                    Presupuesto válido<br />para el mes de<br />
                    <strong>{eventDate ? getMesAnio(eventDate) : 'el mes actual'}</strong>
                </MesValidez>

                <SidebarBlock>
                    <h4>Cantidad de<br />comensales:</h4>
                    <p style={{ marginTop: '4px' }}><strong>mínimo <InlineEditable isAdmin={isAdmin} value={String(config.comensales.minimo)} onSave={(val) => onUpdateConfig('comensales.minimo', parseInt(val) || 0)} /> <InlineEditable isAdmin={isAdmin} value={config.comensales.tipo || 'adultos'} onSave={(val) => onUpdateConfig('comensales.tipo', val)} /></strong></p>
                    <p><strong>máximo <InlineEditable isAdmin={isAdmin} value={String(config.comensales.maximo)} onSave={(val) => onUpdateConfig('comensales.maximo', parseInt(val) || 0)} /> <InlineEditable isAdmin={isAdmin} value={config.comensales.tipo || 'adultos'} onSave={(val) => onUpdateConfig('comensales.tipo', val)} /></strong></p>
                </SidebarBlock>
            </SidebarTop>

            <SidebarBottom>
                <SidebarDivider style={{ marginTop: 0 }} />

                <SidebarBlock>
                    <h4>Ubicación</h4>
                    <a 
                        href={config.ubicacion.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.ubicacion.direccion + ', ' + config.ubicacion.ciudad)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        onClick={(e) => { if (isAdmin) handleLinkClick(e, 'maps'); }}
                    >
                        <AdminLinkWrapper $isAdmin={isAdmin}>
                            <div style={{ marginTop: '4px' }}>
                                <p><strong>{config.ubicacion.direccion}</strong></p>
                                <p>{config.ubicacion.ciudad}</p>
                                <p>{config.ubicacion.referencia}</p>
                            </div>
                        </AdminLinkWrapper>
                    </a>
                </SidebarBlock>

                <a 
                    href={config.ubicacion.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.ubicacion.direccion + ', ' + config.ubicacion.ciudad)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginTop: '4px' }}
                    onClick={(e) => { if (isAdmin) handleLinkClick(e, 'maps'); }}
                >
                    <AdminLinkWrapper $isAdmin={isAdmin}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="#ea4335" style={{ display: 'block' }}>
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                    </AdminLinkWrapper>
                </a>

                <SidebarDivider />

                <SidebarBlock>
                    <h4>Salón de eventos</h4>
                    <p style={{ marginTop: '4px' }}><InlineEditable isAdmin={isAdmin} value={config.tiposEvento} onSave={(val) => onUpdateConfig('tiposEvento', val)} multiline /></p>
                </SidebarBlock>

                <SocialIcons style={{ flexDirection: 'row', justifyContent: 'center', gap: '14px', marginTop: '4px' }}>
                    <a 
                        href={config.redes.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => { if (isAdmin) handleLinkClick(e, 'instagram'); }}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <AdminLinkWrapper $isAdmin={isAdmin}>
                            <img className="social-logo" src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" style={{ width: '22px', height: '22px', display: 'block' }} />
                        </AdminLinkWrapper>
                    </a>
                    <a 
                        href={config.redes.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => { if (isAdmin) handleLinkClick(e, 'facebook'); }}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <AdminLinkWrapper $isAdmin={isAdmin}>
                            <img className="social-logo" src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="Facebook" style={{ width: '22px', height: '22px', display: 'block' }} />
                        </AdminLinkWrapper>
                    </a>
                </SocialIcons>

                <SidebarDivider />

                <ContactInfo style={{ marginTop: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <a 
                            href={config.contacto.whatsappUrl || `https://wa.me/549${config.contacto.telefono.replace(/-/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={(e) => { if (isAdmin) handleLinkClick(e, 'whatsapp'); }}
                        >
                            <AdminLinkWrapper $isAdmin={isAdmin}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/120px-WhatsApp.svg.png" alt="WhatsApp" style={{ width: '14px', height: '14px', display: 'block' }} />
                                <span>{config.contacto.telefono}</span>
                            </AdminLinkWrapper>
                        </a>
                    </p>
                    <p style={{ margin: '4px 0' }}>
                        <a 
                            href={`mailto:${config.contacto.email}`} 
                            style={{ textDecoration: 'none', color: 'inherit' }} 
                            onClick={(e) => { if (isAdmin) handleLinkClick(e, 'email'); }}
                        >
                            <AdminLinkWrapper $isAdmin={isAdmin}>
                                <span>{config.contacto.email}</span>
                            </AdminLinkWrapper>
                        </a>
                    </p>
                    <p style={{ margin: '6px 0 2px 0' }}>
                        <a 
                            href={config.contacto.webUrl || `https://${config.contacto.web}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none' }} 
                            onClick={(e) => { if (isAdmin) handleLinkClick(e, 'web'); }}
                        >
                            <AdminLinkWrapper $isAdmin={isAdmin}>
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#333" strokeWidth="1.5" style={{ display: 'block' }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    <path d="M2 12h20" />
                                </svg>
                            </AdminLinkWrapper>
                        </a>
                    </p>
                    <p style={{ margin: '2px 0' }}>
                        <a 
                            href={config.contacto.webUrl || `https://${config.contacto.web}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ textDecoration: 'underline', color: 'inherit' }} 
                            onClick={(e) => { if (isAdmin) handleLinkClick(e, 'web'); }}
                        >
                            <AdminLinkWrapper $isAdmin={isAdmin}>
                                <span>{config.contacto.web}</span>
                            </AdminLinkWrapper>
                        </a>
                    </p>
                </ContactInfo>
            </SidebarBottom>
        </Sidebar>
    );

    const renderHeader = () => (
        <LogoHeader>
            {isAdmin ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <a 
                        href={config.contacto.webUrl || `https://${config.contacto.web}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        onClick={(e) => handleLinkClick(e, 'web')}
                    >
                        <AdminLinkWrapper $isAdmin={true}>
                            <div className="logo-text">{displaySiteName}</div>
                        </AdminLinkWrapper>
                    </a>
                    <div className="subtitle" style={{ marginTop: '4px' }}>
                        <InlineEditable isAdmin={true} value={config.subtitulo || 'PARQUE PATRICIOS'} onSave={(val) => onUpdateConfig('subtitulo', val)} />
                    </div>
                </div>
            ) : (
                <a 
                    href={config.contacto.webUrl || `https://${config.contacto.web}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    <div className="logo-text">{displaySiteName}</div>
                    <div className="subtitle">{config.subtitulo || 'PARQUE PATRICIOS'}</div>
                </a>
            )}
        </LogoHeader>
    );

    const renderAlquiler = () => {
        if (!alquilerItem) return null;
        sectionNum++;
        return (
            <ServiceSection>
                <ServiceTitle>
                    {sectionNum}- {nombreAlquilerFinal || 'Alquiler de las instalaciones del salón de eventos'}
                    {notaAlquiler && (
                        <>
                            <br />
                            <span className="nota-opcion">({notaAlquiler})</span>
                        </>
                    )}
                </ServiceTitle>

                <PriceTag>{formatCurrency(alquilerTotal)}</PriceTag>

                <ServiceDetails>
                    <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        borderLeft: '3px solid #2b8a3e', 
                        padding: '6px 10px', 
                        margin: '2px 0 8px 0',
                        borderRadius: '0 4px 4px 0',
                        fontSize: '0.72rem',
                        color: '#2c3e50',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        lineHeight: '1.4'
                    }}>
                        {formData.inicioEvento && formData.finEvento ? (
                            <>
                                <p style={{ margin: 0 }}>
                                    <strong>🕒 Horario del evento:</strong> desde las {formData.inicioEvento} hs hasta las {formData.finEvento} hs
                                </p>
                                {(() => {
                                    if (isCustomHorasPrevias) {
                                        return (
                                            <p style={{ margin: 0, color: '#555' }}>
                                                <strong>⏱️ Ingreso para organizar / decorar:</strong> {customHorasPreviasText}
                                            </p>
                                        );
                                    }
                                    const eventTime = parseTime(formData.inicioEvento);
                                    if (eventTime) {
                                        let startHours = eventTime.hours - totalHorasPrevias;
                                        if (startHours < 0) startHours += 24;
                                        const startHoursStr = String(startHours).padStart(2, '0');
                                        const startMinutesStr = String(eventTime.minutes).padStart(2, '0');
                                        const endHoursStr = String(eventTime.hours).padStart(2, '0');
                                        const endMinutesStr = String(eventTime.minutes).padStart(2, '0');
                                        
                                        return (
                                            <p style={{ margin: 0, color: '#555' }}>
                                                <strong>⏱️ Horario de organización antes del evento:</strong> desde las {startHoursStr}:{startMinutesStr} hs hasta las {endHoursStr}:{endMinutesStr} hs ({totalHorasPrevias} hs de armado)
                                            </p>
                                        );
                                    }
                                    return null;
                                })()}
                            </>
                        ) : (
                            <p style={{ margin: 0, fontStyle: 'italic', color: '#7f8c8d' }}>
                                <strong>🕒 Horario del evento:</strong> a definir
                            </p>
                        )}
                    </div>

                    <p><InlineEditable isAdmin={isAdmin} value={config.amenitiesInteriorTitulo || 'Espacio climatizado con:'} onSave={(val) => onUpdateConfig('amenitiesInteriorTitulo', val)} /></p>
                    {(config.amenitiesInterior || []).map((item, i) => (
                        <p key={`int-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '1px 0' }}>
                            * <InlineEditable isAdmin={isAdmin} value={item} onSave={(val) => onUpdateConfig(`amenitiesInterior.${i}`, val)} />
                            {isAdmin && (
                                <DeleteListItemBtn title="Eliminar" onClick={() => {
                                    const arr = config.amenitiesInterior || [];
                                    const newArr = arr.filter((_, idx) => idx !== i);
                                    onUpdateConfig('amenitiesInterior', newArr);
                                }}>✕</DeleteListItemBtn>
                            )}
                        </p>
                    ))}
                    {dynamicInterior.map((item, i) => (
                        <p key={`dyn-int-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '1px 0', fontWeight: '500' }}>
                            * <span>{item}</span>
                        </p>
                    ))}
                    {isAdmin && (
                        <AddListItemBtn onClick={() => {
                            const arr = config.amenitiesInterior || [];
                            const newArr = [...arr, 'Nuevo servicio interior'];
                            onUpdateConfig('amenitiesInterior', newArr);
                        }}>+ Agregar servicio interior</AddListItemBtn>
                    )}

                    <p style={{ marginTop: '8px' }}><InlineEditable isAdmin={isAdmin} value={config.amenitiesExteriorTitulo || 'Patio descubierto con:'} onSave={(val) => onUpdateConfig('amenitiesExteriorTitulo', val)} /></p>
                    {(config.amenitiesExterior || []).map((item, i) => (
                        <p key={`ext-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '1px 0' }}>
                            * <InlineEditable isAdmin={isAdmin} value={item} onSave={(val) => onUpdateConfig(`amenitiesExterior.${i}`, val)} />
                            {isAdmin && (
                                <DeleteListItemBtn title="Eliminar" onClick={() => {
                                    const arr = config.amenitiesExterior || [];
                                    const newArr = arr.filter((_, idx) => idx !== i);
                                    onUpdateConfig('amenitiesExterior', newArr);
                                }}>✕</DeleteListItemBtn>
                            )}
                        </p>
                    ))}
                    {dynamicExterior.map((item, i) => (
                        <p key={`dyn-ext-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '1px 0', fontWeight: '500' }}>
                            * <span>{item}</span>
                        </p>
                    ))}
                    {isAdmin && (
                        <AddListItemBtn onClick={() => {
                            const arr = config.amenitiesExterior || [];
                            const newArr = [...arr, 'Nuevo servicio exterior'];
                            onUpdateConfig('amenitiesExterior', newArr);
                        }}>+ Agregar servicio exterior</AddListItemBtn>
                    )}

                    {(!(formData.inicioEvento && formData.finEvento) || camareraItem) && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                            {!(formData.inicioEvento && formData.finEvento) && (
                                <p style={{ color: '#2c3e50', fontSize: '0.73rem', margin: '1px 0' }}>
                                    <strong>⏱️ Tiempo de organización antes del evento:</strong> {totalHorasPrevias} hs 
                                </p>
                            )}
                            {camareraItem && (
                                <p style={{ color: '#2c3e50', fontSize: '0.73rem', margin: '1px 0' }}>
                                    <strong>💁‍♀️ Servicio de camarera:</strong> Incluido por {camareraItem.cantidad} hs.
                                </p>
                            )}
                        </div>
                    )}
                </ServiceDetails>
            </ServiceSection>
        );
    };

    const renderSeccion = (seccion) => {
        sectionNum++;
        const hasPricing = seccion.precioFinalPP > 0 && cantidadInvitados > 0;
        return (
            <ServiceSection key={seccion.id}>
                <ServiceTitle>
                    {sectionNum} - {seccion.nombre || 'Servicio'}
                </ServiceTitle>

                {hasPricing && (
                    <PriceTag>
                        <span className="per-person">
                            {formatCurrency(seccion.precioFinalPP)} por persona
                        </span>
                        <span className="total-calc">
                            {cantidadInvitados} personas = {formatCurrency(seccion.totalSeccion)}
                        </span>
                    </PriceTag>
                )}

                {seccion.detalle && (
                    <ServiceDetails>
                        {renderDetailLines(seccion.detalle)}
                    </ServiceDetails>
                )}
            </ServiceSection>
        );
    };

    const renderFooterTotals = () => (
        <>
            <TotalSection>
                {montoDescuento > 0 && (
                    <div style={{ fontSize: '0.73rem', borderBottom: '1px dashed rgba(0,0,0,0.15)', paddingBottom: '6px', marginBottom: '6px' }}>
                        <p style={{ margin: '2px 0' }}>Subtotal: {formatCurrency(subtotal)}.-</p>
                        <p style={{ margin: '2px 0' }}>
                            Descuento: {formatCurrency(montoDescuento)}.-
                            {formData.motivoDescuento && ` (${formData.motivoDescuento})`}
                        </p>
                    </div>
                )}
                {cantidadInvitados > 0 ? (
                    <>
                        <p>TOTAL FINAL POR PERSONA {formatCurrency(totalPorPersona)}.-</p>
                        <p className="total-big">
                            Para {cantidadInvitados} personas el valor final es de {formatCurrency(grandTotal)}.-
                        </p>
                    </>
                ) : (
                    <p className="total-big">TOTAL FINAL: {formatCurrency(grandTotal)}.-</p>
                )}
            </TotalSection>

            <NoIncluyeSection>
                <div className="column">
                    <h4><InlineEditable isAdmin={isAdmin} value={config.noIncluyeTitulo || 'Lo que no incluye:'} onSave={(val) => onUpdateConfig('noIncluyeTitulo', val)} /></h4>
                    {(config.noIncluye || []).map((item, index) => {
                        const cleanItem = item.startsWith('*') ? item.slice(1).trim() : item.trim();
                        return (
                            <p key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '3px 0', lineHeight: '1.4' }}>
                                <span style={{ color: '#d97706', fontWeight: 'bold', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginTop: '2px' }}>⚠️</span>
                                <span style={{ flex: 1 }}>
                                    <InlineEditable 
                                        isAdmin={isAdmin} 
                                        value={cleanItem} 
                                        onSave={(val) => onUpdateConfig(`noIncluye.${index}`, val.startsWith('*') ? val : '*' + val)} 
                                    />
                                </span>
                                {isAdmin && (
                                    <DeleteListItemBtn title="Eliminar" onClick={() => {
                                        const arr = config.noIncluye || [];
                                        const newArr = arr.filter((_, idx) => idx !== index);
                                        onUpdateConfig('noIncluye', newArr);
                                    }}>✕</DeleteListItemBtn>
                                )}
                            </p>
                        );
                    })}
                    {isAdmin && (
                        <AddListItemBtn onClick={() => {
                            const arr = config.noIncluye || [];
                            const newArr = [...arr, 'Nuevo concepto excluido'];
                            onUpdateConfig('noIncluye', newArr);
                        }}>+ Agregar concepto excluido</AddListItemBtn>
                    )}
                </div>

                <div className="divider" />

                <div className="column">
                    <h4><InlineEditable isAdmin={isAdmin} value={config.noPermitidoTitulo || 'Lo que no está permitido:'} onSave={(val) => onUpdateConfig('noPermitidoTitulo', val)} /></h4>
                    {(config.noPermitido || []).map((item, index) => {
                        const cleanItem = item.startsWith('*') ? item.slice(1).trim() : item.trim();
                        return (
                            <p key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '3px 0', lineHeight: '1.4' }}>
                                <span style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginTop: '2px' }}>🚫</span>
                                <span style={{ flex: 1 }}>
                                    <InlineEditable 
                                        isAdmin={isAdmin} 
                                        value={cleanItem} 
                                        onSave={(val) => onUpdateConfig(`noPermitido.${index}`, val.startsWith('*') ? val : '*' + val)} 
                                    />
                                </span>
                                {isAdmin && (
                                    <DeleteListItemBtn title="Eliminar" onClick={() => {
                                        const arr = config.noPermitido || [];
                                        const newArr = arr.filter((_, idx) => idx !== index);
                                        onUpdateConfig('noPermitido', newArr);
                                    }}>✕</DeleteListItemBtn>
                                )}
                            </p>
                        );
                    })}
                    {isAdmin && (
                        <AddListItemBtn onClick={() => {
                            const arr = config.noPermitido || [];
                            const newArr = [...arr, 'Nuevo prohibido'];
                            onUpdateConfig('noPermitido', newArr);
                        }}>+ Agregar prohibición</AddListItemBtn>
                    )}
                </div>
            </NoIncluyeSection>

            <FooterInfo>
                <p><InlineEditable isAdmin={isAdmin} value={config.facturacion} onSave={(val) => onUpdateConfig('facturacion', val)} /></p>
                <p className="bold">Medios de pago: <InlineEditable isAdmin={isAdmin} value={config.mediosDePago} onSave={(val) => onUpdateConfig('mediosDePago', val)} /></p>
            </FooterInfo>

            {formData.nombreCliente && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    borderLeft: '3px solid #d4edda',
                }}>
                    <p><strong>Presupuesto para:</strong> {formData.nombreCliente}</p>
                    {formData.telefono && <p><strong>Tel:</strong> {formData.telefono}</p>}
                    {formData.descripcionEvento && <p><strong>Evento:</strong> {formData.descripcionEvento}</p>}
                    {eventDate && (
                        <p><strong>Fecha del evento:</strong> {eventDate.toLocaleDateString('es-AR', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}</p>
                    )}
                </div>
            )}
        </>
    );

    const needsTwoPages = seccionesConPrecios.length > 2;

    return (
        <div ref={ref} id="presupuesto-pdf-container">
            <PDFWrapper>
                {needsTwoPages ? (
                    <>
                        {/* PAGINA 1 */}
                        <PDFContainer className="pdf-page" $isExporting={isExporting}>
                            {renderSidebar()}
                            <MainContent>
                                {renderHeader()}
                                {renderAlquiler()}
                                {seccionesConPrecios.slice(0, 2).map(renderSeccion)}
                            </MainContent>
                        </PDFContainer>

                        {/* PAGINA 2 */}
                        <PDFContainer className="pdf-page" $isExporting={isExporting}>
                            {renderSidebar()}
                            <MainContent>
                                {renderHeader()}
                                {seccionesConPrecios.slice(2).map(renderSeccion)}
                                {renderFooterTotals()}
                            </MainContent>
                        </PDFContainer>
                    </>
                ) : (
                    <PDFContainer className="pdf-page" $isExporting={isExporting}>
                        {renderSidebar()}
                        <MainContent>
                            {renderHeader()}
                            {renderAlquiler()}
                            {seccionesConPrecios.map(renderSeccion)}
                            {renderFooterTotals()}
                        </MainContent>
                    </PDFContainer>
                )}
            </PDFWrapper>
            {/* === Link Edit Modal === */}
            {activeLinkEdit && (
                <LinkEditModalOverlay onClick={() => setActiveLinkEdit(null)}>
                    <LinkEditModalContent onClick={e => e.stopPropagation()}>
                        <ModalTitle>{activeLinkEdit.title}</ModalTitle>
                        
                        {activeLinkEdit.customLayout === 'maps' ? (
                            <>
                                <FormGroup>
                                    <label>Dirección</label>
                                    <input 
                                        type="text" 
                                        value={activeLinkEdit.direccion} 
                                        onChange={e => setActiveLinkEdit(prev => ({ ...prev, direccion: e.target.value }))} 
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Ciudad / Provincia</label>
                                    <input 
                                        type="text" 
                                        value={activeLinkEdit.ciudad} 
                                        onChange={e => setActiveLinkEdit(prev => ({ ...prev, ciudad: e.target.value }))} 
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Referencia</label>
                                    <input 
                                        type="text" 
                                        value={activeLinkEdit.referencia} 
                                        onChange={e => setActiveLinkEdit(prev => ({ ...prev, referencia: e.target.value }))} 
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Enlace personalizado de Google Maps (URL)</label>
                                    <input 
                                        type="text" 
                                        value={activeLinkEdit.url} 
                                        onChange={e => setActiveLinkEdit(prev => ({ ...prev, url: e.target.value }))} 
                                        placeholder="https://goo.gl/maps/..."
                                    />
                                </FormGroup>
                            </>
                        ) : (
                            <>
                                <FormGroup>
                                    <label>{activeLinkEdit.title.includes('Correo') ? 'Dirección de Correo' : 'Texto Visible'}</label>
                                    <input 
                                        type="text" 
                                        value={activeLinkEdit.text} 
                                        onChange={e => setActiveLinkEdit(prev => ({ ...prev, text: e.target.value }))} 
                                    />
                                </FormGroup>

                                {activeLinkEdit.hasUrl && (
                                    <FormGroup>
                                        <label>Enlace de Redirección (URL)</label>
                                        <input 
                                            type="text" 
                                            value={activeLinkEdit.url} 
                                            onChange={e => setActiveLinkEdit(prev => ({ ...prev, url: e.target.value }))} 
                                        />
                                    </FormGroup>
                                )}
                            </>
                        )}

                        <ButtonRow>
                            <CancelBtn onClick={() => setActiveLinkEdit(null)}>Cancelar</CancelBtn>
                            <SaveBtn onClick={() => {
                                if (activeLinkEdit.customLayout === 'maps') {
                                    onUpdateConfig('ubicacion.direccion', activeLinkEdit.direccion);
                                    onUpdateConfig('ubicacion.ciudad', activeLinkEdit.ciudad);
                                    onUpdateConfig('ubicacion.referencia', activeLinkEdit.referencia);
                                    onUpdateConfig('ubicacion.mapsUrl', activeLinkEdit.url);
                                } else {
                                    onUpdateConfig(activeLinkEdit.textPath, activeLinkEdit.text);
                                    if (activeLinkEdit.hasUrl) {
                                        onUpdateConfig(activeLinkEdit.urlPath, activeLinkEdit.url);
                                    }
                                }
                                setActiveLinkEdit(null);
                            }}>Guardar Cambios</SaveBtn>
                        </ButtonRow>
                    </LinkEditModalContent>
                </LinkEditModalOverlay>
            )}
        </div>
    );
});

PresupuestoPDF.displayName = 'PresupuestoPDF';

export default PresupuestoPDF;
