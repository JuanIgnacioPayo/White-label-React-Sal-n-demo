import { fallbackSystemPrompt } from '../data/system_prompt_fallback.js';

// Variable para guardar en caché el prompt en memoria y no hacer fetch en cada mensaje
let cachedPrompt = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 1000 * 60 * 5; // 5 minutos

export const getAiSystemPrompt = async (siteName) => {
    const now = Date.now();
    if (cachedPrompt && (now - lastFetchTime < CACHE_DURATION_MS)) {
        return cachedPrompt;
    }

    try {
        const { getStorage, ref: storageRef, getDownloadURL } = await import('firebase/storage');
        const { getDatabase, ref: dbRef, get } = await import('firebase/database');
        const { getApp } = await import('firebase/app');
        const app = getApp();
        const storage = getStorage(app);
        const db = getDatabase(app);
        
        // Use the code-defined strict system prompt template
        let systemPromptText = fallbackSystemPrompt;
        let knowledgeBaseJson = {};

        // Fetch Knowledge Base JSON
        try {
            const botDataRef = storageRef(storage, 'knowledge_base/bot_data_extended.json');
            const botDataUrl = await getDownloadURL(botDataRef);
            const responseBotData = await fetch(botDataUrl, { cache: 'no-store' });
            if (responseBotData.ok) {
                knowledgeBaseJson = await responseBotData.json();
            }
        } catch (err) {
            console.warn("Could not fetch knowledge base from storage:", err);
        }

        // Fetch Optional Services and Rental Prices from Realtime DB (Current month)
        let activeStructure = 'dynamic';
        try {
            const currentMonth = new Date().getMonth() + 1; // 1-12
            const [servicesSnapshot, rentalPricesSnapshot, structSnapshot] = await Promise.all([
                get(dbRef(db, 'optionalServices')),
                get(dbRef(db, `datosId/${currentMonth}`)),
                get(dbRef(db, 'config/activeScheduleStructure'))
            ]);

            activeStructure = structSnapshot.exists() ? structSnapshot.val() : 'dynamic';

            let rentalData = {};
            if (rentalPricesSnapshot.exists()) {
                rentalData = rentalPricesSnapshot.val();
                
                // Get weekend base price (servicio_3_ or a_precio_4hs_)
                const weekendPrice = rentalData['servicio_3_'] || rentalData['a_precio_4hs_'];
                
                // Get weekday base price (servicio_1_ or b_precio_3hs_)
                const weekdayPrice = rentalData['servicio_1_'] || rentalData['b_precio_3hs_'];
                
                // Get sena price
                const senaPrice = rentalData['l_seña_'];

                if (weekendPrice || weekdayPrice) {
                    // Update the knowledge base with real-time base prices
                    const weekdayKey = activeStructure === 'fixed' ? 'monday_to_friday' : 'monday_to_thursday';
                    const weekendKey = activeStructure === 'fixed' ? 'saturday_sunday_holidays' : 'friday_to_sunday_holidays';
                    knowledgeBaseJson.rental_prices = {
                        [weekdayKey]: weekdayPrice ? `${weekdayPrice} ARS` : (knowledgeBaseJson.rental_prices?.[weekdayKey] || "Consultar simulador"),
                        [weekendKey]: weekendPrice ? `${weekendPrice} ARS` : (knowledgeBaseJson.rental_prices?.[weekendKey] || "Consultar simulador")
                    };
                }
                
                if (senaPrice) {
                    knowledgeBaseJson.deposito_seña_pesos = `${senaPrice} ARS (este es el valor exacto y actual de la seña, usar SIEMPRE este)`;
                }
            }

            if (servicesSnapshot.exists()) {
                const servicesData = servicesSnapshot.val();
                const servicesArray = Array.isArray(servicesData) ? servicesData.filter(s => s) : Object.values(servicesData);
                
                const formattedServices = servicesArray.map(service => {
                    // Extract price from rentalData using priceKey or fallback to servicio_ID_
                    const priceKey = service.priceKey || `servicio_${service.id}_`;
                    const price = rentalData[priceKey];
                    return {
                        name: service.nombre,
                        description: service.descripcion || "",
                        price: price !== undefined && price !== "" ? `${price} ARS` : "Precio no especificado"
                    };
                });
                // Override the static services with the real-time ones
                knowledgeBaseJson.services = formattedServices;
            }
        } catch (err) {
            console.warn("Could not fetch real-time data from DB:", err);
        }

        // Fetch active schedule structure to tell the AI the correct closing hours
        try {
            if (activeStructure === 'fixed') {
                knowledgeBaseJson.horarios_cierre = {
                    "estructura_activa": "FIJA",
                    "regla": "Todos los eventos finalizan como máximo a las 21:00 hs, sin importar el día de la semana.",
                    "excepcion": "Navidad (24/12) y Año Nuevo (31/12) cierran a las 02:00 hs."
                };
            } else {
                knowledgeBaseJson.horarios_cierre = {
                    "estructura_activa": "DINÁMICA",
                    "lunes_a_jueves": "Cierre a las 21:00 hs",
                    "viernes_sabados": "Cierre a las 00:00 hs (medianoche)",
                    "domingos": "Cierre a las 21:00 hs",
                    "visperas_feriado": "Cierre a las 00:00 hs (medianoche)",
                    "navidad_anio_nuevo": "Cierre a las 03:00 hs (24/12 y 31/12)"
                };
            }
        } catch (err) {
            console.warn("Could not fetch schedule structure:", err);
        }



        // Reemplazar ${siteName} dinámicamente si el usuario dejó la variable en el prompt guardado
        systemPromptText = systemPromptText.replace(/\$\{siteName\}/g, siteName);

        // Minify the knowledgeBaseJson on-the-fly to prevent token exhaustion (429 errors)
        const minifiedKb = {
            business: {
                name: knowledgeBaseJson.business_info?.name || knowledgeBaseJson.business?.name || "Salón Magic Eventos",
                address: knowledgeBaseJson.business_info?.location?.address || knowledgeBaseJson.business?.address || "Av. Corrientes 1234 CABA",
                contact: knowledgeBaseJson.business_info?.contact?.whatsapp || knowledgeBaseJson.business?.contact || "1100000000 (solo WhatsApp)"
            },
            rental_prices: knowledgeBaseJson.rental_prices || {},
            deposito_seña_pesos: knowledgeBaseJson.deposito_seña_pesos || "Consultar con administración",
            horarios_cierre: knowledgeBaseJson.horarios_cierre || {},
            servicios_adicionales_disponibles: (knowledgeBaseJson.services || []).map(s => ({
                name: s.name || s.nombre,
                price: s.price || s.prices_by_month || "Consultar"
            })),
            temas_ayuda_fichas_disponibles: {
                "alquiler_detalles_completos": "Para responder qué incluye o qué no incluye el alquiler, indica que incluye salón, mesas, sillas, cocina, luces y sonido, y muestra la ficha detallada usando el tag ::INFO::alquiler::",
                "equipamiento_cocina": "Para responder sobre horno pizzero, heladeras, freezers, microondas o cafetera, indica que está equipada y muestra la ficha detallada usando el tag ::INFO::cocina::",
                "baños": "Para responder sobre insumos o estado de los baños, indica que vienen equipados y muestra la ficha detallada usando el tag ::INFO::baños::",
                "reglas_y_politicas_salon": "Para responder sobre reservas, señas, cancelaciones, duración de eventos, música, ruidos en la calle o visitas, indica que hay reglas vigentes y muestra la ficha detallada usando el tag ::INFO::reglas::",
                "contactos_proveedores_recomendados": "Para recomendar vajilla, mantelería, plaza blanda o caterings de pizza/parrilla, indica que tenemos contactos de confianza y muestra la ficha detallada usando el tag ::INFO::contactos::",
                "preguntas_frecuentes_generales": "Para capacidad (50 sentados / 65 cóctel), estacionamiento (no hay), catering propio (sí), limpieza (incluida), grupo electrógeno (sí), papel picado (prohibido), muestra la ficha detallada usando el tag ::INFO::faq::"
            }
        };

        // Si hay base de conocimiento, la agregamos al final del prompt
        if (Object.keys(minifiedKb).length > 0) {
            systemPromptText += `\n\nINFORMACIÓN ADICIONAL (Base de Conocimiento JSON):\n${JSON.stringify(minifiedKb, null, 2)}`;
        }

        cachedPrompt = systemPromptText.trim();
        lastFetchTime = now;
        return cachedPrompt;

    } catch (error) {
        console.error("Error fetching AI knowledge base from Firebase Storage:", error);
        return fallbackSystemPrompt;
    }
};
