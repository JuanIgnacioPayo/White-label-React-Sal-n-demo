import React from "react";
import {
    Clock,
    Calendar,
    Hourglass,
    Timer,
    Volume2,
    Speaker,
    Music,
    Mic,
    Bell,
    AlertTriangle,
    Ban,
    ShieldAlert,
    Flame,
    AlertCircle,
    Utensils,
    Coffee,
    Cake,
    Wine,
    Beer,
    ChefHat,
    Sparkles,
    Armchair,
    Sofa,
    LayoutGrid,
    Layers,
    DoorClosed,
    Home,
    Shield,
    Zap,
    Car,
    Heart,
    PartyPopper,
    Users,
    CheckCircle,
    Info
} from "lucide-react";

/**
 * Mapa completo de íconos soportados para las tarjetas infográficas
 */
export const ICON_MAP = {
    Clock,
    Calendar,
    Hourglass,
    Timer,
    Volume2,
    Speaker,
    Music,
    Mic,
    Bell,
    AlertTriangle,
    Ban,
    ShieldAlert,
    Flame,
    AlertCircle,
    Utensils,
    Coffee,
    Cake,
    Wine,
    Beer,
    ChefHat,
    Sparkles,
    Armchair,
    Sofa,
    LayoutGrid,
    Layers,
    DoorClosed,
    Home,
    Shield,
    Zap,
    Car,
    Heart,
    PartyPopper,
    Users,
    CheckCircle,
    Info
};

/**
 * Obtiene el componente de ícono de forma segura (insensible a mayúsculas/minúsculas)
 */
export const getIconComponent = (name) => {
    if (!name) return Clock;
    if (ICON_MAP[name]) return ICON_MAP[name];
    const foundKey = Object.keys(ICON_MAP).find(
        (k) => k.toLowerCase() === name.toLowerCase()
    );
    if (foundKey) return ICON_MAP[foundKey];
    return Clock;
};

/**
 * Componente renderizador del ícono vectorial
 */
export const ReceiptIcon = ({ name, size = 26, strokeWidth = 2, className = "" }) => {
    const Component = getIconComponent(name);
    return React.createElement(Component, { size, strokeWidth, className });
};

/**
 * Catálogo de íconos seleccionables con nombres amigables en español
 */
export const AVAILABLE_ICONS = [
    { id: "Clock", label: "Reloj / Horarios", category: "Tiempo" },
    { id: "Calendar", label: "Calendario / Fechas", category: "Tiempo" },
    { id: "Hourglass", label: "Reloj de arena", category: "Tiempo" },
    { id: "Timer", label: "Cronómetro", category: "Tiempo" },

    { id: "Volume2", label: "Sonido / Pista", category: "Sonido" },
    { id: "Speaker", label: "Parlante / Audio", category: "Sonido" },
    { id: "Music", label: "Música / Baile", category: "Sonido" },
    { id: "Mic", label: "Micrófono", category: "Sonido" },
    { id: "Bell", label: "Campana de aviso", category: "Sonido" },

    { id: "AlertTriangle", label: "Alerta / Cuidado", category: "Alerta" },
    { id: "Ban", label: "Prohibido / Restricción", category: "Alerta" },
    { id: "ShieldAlert", label: "Seguridad y Cuidado", category: "Alerta" },
    { id: "Flame", label: "Fuego / Bengalas", category: "Alerta" },
    { id: "AlertCircle", label: "Atención Importante", category: "Alerta" },

    { id: "Utensils", label: "Cubiertos / Vajilla", category: "Cocina" },
    { id: "Coffee", label: "Café / Desayuno", category: "Cocina" },
    { id: "Cake", label: "Torta de Cumpleaños", category: "Cocina" },
    { id: "Wine", label: "Copas / Brindis", category: "Cocina" },
    { id: "Beer", label: "Cerveza / Bebidas", category: "Cocina" },
    { id: "ChefHat", label: "Cocina / Gastronomía", category: "Cocina" },
    { id: "Sparkles", label: "Limpieza y Brillo", category: "Cocina" },

    { id: "Armchair", label: "Sillón / Mobiliario", category: "Espacio" },
    { id: "Sofa", label: "Living / Comodidad", category: "Espacio" },
    { id: "LayoutGrid", label: "Distribución de Mesas", category: "Espacio" },
    { id: "Layers", label: "Armado / Organización", category: "Espacio" },
    { id: "DoorClosed", label: "Puertas y Accesos", category: "Espacio" },

    { id: "Home", label: "Salón / Convivencia", category: "Comunidad" },
    { id: "Shield", label: "Seguridad y Protección", category: "Comunidad" },
    { id: "Zap", label: "Generador Eléctrico", category: "Comunidad" },
    { id: "Car", label: "Estacionamiento", category: "Comunidad" },
    { id: "Heart", label: "Cuidado y Respeto", category: "Comunidad" },
    { id: "PartyPopper", label: "Fiesta / Cotillón", category: "Comunidad" },
    { id: "Users", label: "Invitados y Familias", category: "Comunidad" },
    { id: "CheckCircle", label: "Servicio Incluido", category: "Comunidad" },
    { id: "Info", label: "Información General", category: "Comunidad" }
];

/**
 * Paleta refinada de colores sugeridos para las tarjetas del salón
 */
export const PRESET_COLORS = [
    { name: "Azul Real", hex: "#2563eb" },
    { name: "Índigo Profundo", hex: "#4338ca" },
    { name: "Rojo Alerta", hex: "#dc2626" },
    { name: "Verde Esmeralda", hex: "#059669" },
    { name: "Turquesa Marino", hex: "#0891b2" },
    { name: "Teal Azulado", hex: "#0f766e" },
    { name: "Violeta Elixir", hex: "#7c3aed" },
    { name: "Rosa Fucsia", hex: "#db2777" },
    { name: "Ámbar Dorado", hex: "#d97706" },
    { name: "Gris Grafito", hex: "#334155" },
    { name: "Bordó Clásico", hex: "#991b1b" },
    { name: "Verde Bosque", hex: "#15803d" }
];

/**
 * Genera un fondo suave pastel y armónico a partir del color principal hex,
 * asegurando un contraste del 100% para los textos y lectura limpia.
 */
export const getCardBgColor = (hexColor) => {
    if (!hexColor) return "#f8fafc";
    let c = hexColor.replace("#", "").trim();
    if (c.length === 3) {
        c = c.split("").map((x) => x + x).join("");
    }
    if (c.length !== 6) return "#f8fafc";
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return "#f8fafc";
    // Mezcla con blanco (96% blanco, 4% tono)
    const blendR = Math.round(255 * 0.96 + r * 0.04);
    const blendG = Math.round(255 * 0.96 + g * 0.04);
    const blendB = Math.round(255 * 0.96 + b * 0.04);
    return `rgb(${blendR}, ${blendG}, ${blendB})`;
};

/**
 * Tarjetas predeterminadas iniciales que se cargan si no hay configuración previa en Firebase,
 * mapeadas directamente desde los contenidos actuales de datosId/32 del salón.
 */
export const getDefaultCards = (data32 = {}) => [
    {
        id: "card_1",
        title: "1. HORARIOS, PREPARACIÓN Y BEBIDAS FRÍAS",
        color: "#2563eb",
        icon: "Clock",
        items: [
            data32.contenido8 || "Los eventos son contratados por hora y el horario de inicio es puntual.",
            data32.contenido9 || "Bebidas frías: No se permite traer elementos el día anterior sin previa coordinación."
        ]
    },
    {
        id: "card_2",
        title: "2. SONIDO, PISTA ACUSTIZADA Y PATIO",
        color: "#4338ca",
        icon: "Volume2",
        items: [
            data32.contenido10 || "Música y sonido: Se puede poner música acorde al volumen reglamentario.",
            data32.contenido11 || "El patio cuenta con música funcional de fondo para amenizar."
        ]
    },
    {
        id: "card_3",
        title: "3. CUIDADO DE PISOS: ¡SIN PAPEL PICADO NI BENGALAS METALIZADAS!",
        color: "#dc2626",
        icon: "AlertTriangle",
        items: [
            data32.contenido14 || "Prohibido arrojar papel picado metalizado, serpentinas o bengalas que manchen los pisos."
        ]
    },
    {
        id: "card_4",
        title: "4. COCINA, VAJILLA Y LIMPIEZA FINAL INCLUIDA",
        color: "#059669",
        icon: "Utensils",
        items: [
            data32.contenido15 || "Cocina disponible para calentar comida y almacenar bebidas.",
            data32.contenido12 || "Vajilla completa para la cantidad acordada de comensales.",
            data32.contenido13 || "Limpieza final incluida en el servicio básico del salón."
        ]
    },
    {
        id: "card_5",
        title: "5. MOBILIARIO Y ARMADO DEL ESPACIO",
        color: "#0891b2",
        icon: "Armchair",
        items: [
            data32.contenido16 || "Distribución de mesas y sillas según la capacidad convenida.",
            data32.contenido19 || "Por favor no arrastrar ni mover el mobiliario pesado sin asistencia del personal."
        ]
    },
    {
        id: "card_6",
        title: "6. CONVIVENCIA BARRIAL, SEGURIDAD Y GENERADOR",
        color: "#0f766e",
        icon: "Home",
        items: [
            data32.contenido17 || "Respetar la convivencia barrial al entrar y retirarse del establecimiento.",
            data32.contenido20 || "El salón cuenta con grupo electrógeno ante cortes imprevistos de suministro.",
            data32.contenido7 || "Normas de permanencia y cuidado de las instalaciones.",
            data32.contenido18 || "Normas generales de seguridad y botiquín de primeros auxilios."
        ]
    },
    {
        id: "card_7",
        title: "7. EL SERVICIO NO INCLUYE",
        color: "#dc2626",
        icon: "Ban",
        items: [
            "Comida ni bebida (salvo promociones especiales contratadas).",
            "Vajilla de loza/vidrio, mantelería fina ni insumos descartables de catering.",
            "Personal de animación, DJ ni shows en vivo no contratados expresamente."
        ]
    }
];

/**
 * Normaliza las tarjetas recibidas desde Firebase (sea array o diccionario de objetos)
 * asegurando consistencia total de tipos y valores por defecto.
 */
export const normalizeCards = (rawCards, data32 = {}) => {
    if (!rawCards) return getDefaultCards(data32);
    const cardList = Array.isArray(rawCards)
        ? rawCards
        : typeof rawCards === "object"
        ? Object.values(rawCards)
        : [];

    if (cardList.length === 0) return getDefaultCards(data32);

    const normalized = cardList.map((card, idx) => {
        let rawItems = card?.items;
        let itemsList = [];
        if (Array.isArray(rawItems)) {
            itemsList = rawItems.filter((it) => it !== null && it !== undefined);
        } else if (rawItems && typeof rawItems === "object") {
            itemsList = Object.values(rawItems).filter((it) => it !== null && it !== undefined);
        }
        return {
            id: card?.id || `card_${idx + 1}`,
            title: card?.title || `Tarjeta ${idx + 1}`,
            color: card?.color || "#2563eb",
            icon: card?.icon || "Clock",
            items: itemsList
        };
    });

    // Si la lista de tarjetas existente en Firebase no posee aún la tarjeta de "NO INCLUYE",
    // la anexamos automáticamente para que aparezca en el recibo infográfico y en la plantilla.
    const hasNoIncluye = normalized.some(
        (c) =>
            c?.id === "card_7" ||
            c?.id === "card_no_incluye" ||
            (c?.title && c.title.toUpperCase().includes("NO INCLUYE"))
    );
    if (!hasNoIncluye && normalized.length <= 6) {
        normalized.push({
            id: "card_7",
            title: "7. EL SERVICIO NO INCLUYE",
            color: "#dc2626",
            icon: "Ban",
            items: [
                "Comida ni bebida (salvo promociones especiales contratadas).",
                "Vajilla de loza/vidrio, mantelería fina ni insumos descartables de catering.",
                "Personal de animación, DJ ni shows en vivo no contratados expresamente."
            ]
        });
    }

    return normalized;
};

/**
 * Textos y etiquetas por defecto del contrato y reserva (Página 2)
 */
export const DEFAULT_CONTRACT_DATA = {
    badgeTitle: "DETALLE DE LA RESERVA Y CONDICIONES DE CONTRATACIÓN",
    labelLugarFecha: "Lugar y Fecha:",
    labelCliente: "Cliente:",
    labelFechaEvento: "Fecha del Evento:",
    labelSena: "Seña Abonada:",
    labelPagoTotal: "Pagó en total:",
    disclaimer: 'Precios y servicios fijados según la lista de precios oficial vigente al momento de la contratación. Podés consultarla en <a href="/precios" target="_blank" rel="noopener noreferrer">nuestra lista de precios online</a>.',
    showClientSignature: true,
    signClientTitle: "Firma y Aclaración del Cliente",
    signClientDni: "DNI:",
    signClientTel: "Tel: _________________",
    signSalonTitle: ""
};

